import { Router } from "express";
import pool from "../db.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { sendOrderConfirmation } from "../utils/email.js";
import { restoreOrderStock } from "../utils/stock.js";

const router = Router();
const closedStatuses = ["CANCELLED", "RETURNED", "REJECTED"];

// Tạo đơn từ giỏ hàng.
router.post("/", authMiddleware, async (req, res) => {
  if (req.user.role !== "BUYER") {
    return res.status(403).json({ error: "Chỉ tài khoản người mua (BUYER) mới có quyền đặt hàng" });
  }

  const { payment_method = "COD", shipping_name, shipping_phone, shipping_address } = req.body ?? {};

  if (!shipping_name || !shipping_phone || !shipping_address) {
    return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin giao hàng" });
  }

  const client = await pool.connect();
  try {
    // Ghi đơn, trừ kho và xóa giỏ trong cùng một giao dịch.
    await client.query("BEGIN");

    const { rows: cartItems } = await client.query(
      `SELECT ci.comic_id, ci.quantity, c.price, c.stock, c.title 
       FROM cart_items ci JOIN comics c ON ci.comic_id = c.id 
       WHERE ci.user_id = $1`,
      [req.user.id]
    );

    if (cartItems.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Giỏ hàng trống" });
    }

    let total = 0;
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `"${item.title}" không đủ hàng (còn ${item.stock})` });
      }
      total += item.price * item.quantity;
    }

    const status = payment_method === "VNPAY" ? "PENDING" : "CONFIRMED";
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total, payment_method, shipping_name, shipping_phone, shipping_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, total, payment_method, shipping_name, shipping_phone, shipping_address, status]
    );
    const order = orderResult.rows[0];

    // Lưu từng truyện trong đơn theo giá tại thời điểm mua.
    for (const item of cartItems) {
      await client.query(
        "INSERT INTO order_items (order_id, comic_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [order.id, item.comic_id, item.quantity, item.price]
      );
      await client.query(
        "UPDATE comics SET stock = stock - $1 WHERE id = $2",
        [item.quantity, item.comic_id]
      );
    }

    await client.query("DELETE FROM cart_items WHERE user_id = $1", [req.user.id]);

    await client.query("COMMIT");

    // Gửi email sau khi đơn COD đã được lưu.
    if (payment_method === "COD") {
      try {
        const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [req.user.id]);
        await sendOrderConfirmation(
          userResult.rows[0].email,
          order,
          cartItems.map((item) => ({ title: item.title, quantity: item.quantity, price: item.price * item.quantity }))
        );
      } catch (e) {
        console.error("Order email failed:", e.message);
      }
    }

    res.status(201).json(order);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create order error:", err);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    client.release();
  }
});

// Get my orders
router.get("/my-orders", authMiddleware, async (req, res) => {
  if (req.user.role !== "BUYER") {
    return res.status(403).json({ error: "Chỉ tài khoản người mua mới có lịch sử đơn hàng cá nhân" });
  }

  try {
    const result = await pool.query(
      `SELECT o.*, 
        json_agg(json_build_object('comic_id', oi.comic_id, 'quantity', oi.quantity, 'price', oi.price, 'title', c.title, 'image_url', c.image_url, 'color', c.color, 'accent', c.accent, 'mark', c.mark)) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN comics c ON oi.comic_id = c.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Get all orders (MANAGER / ADMIN)
router.get("/all", authMiddleware, requireRole("MANAGER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email,
        json_agg(json_build_object('comic_id', oi.comic_id, 'quantity', oi.quantity, 'price', oi.price, 'title', c.title)) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN comics c ON oi.comic_id = c.id
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Customer action on order (BUYER)
router.patch("/:id/customer-action", authMiddleware, async (req, res) => {
  try {
    const { action, return_reason } = req.body;
    const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: "Không tìm thấy đơn hàng" });

    const order = orderResult.rows[0];
    let newStatus = null;

    if (action === "CANCEL") {
      if (!["PENDING", "CONFIRMED"].includes(order.status)) {
        return res.status(400).json({ error: "Chỉ có thể hủy đơn khi chưa giao hàng" });
      }
      newStatus = "CANCELLED";
    } else if (action === "CONFIRM_RECEIVED" || action === "REJECT_DELIVERY") {
      if (order.status !== "SHIPPING") {
        return res.status(400).json({ error: "Đơn hàng phải ở trạng thái đang giao" });
      }
      newStatus = action === "CONFIRM_RECEIVED" ? "DELIVERED" : "REJECTED";
    } else if (action === "REQUEST_RETURN") {
      if (order.status !== "DELIVERED") {
        return res.status(400).json({ error: "Chỉ có thể yêu cầu hoàn sau khi đã nhận hàng" });
      }
      newStatus = "RETURN_REQUESTED";
    } else {
      return res.status(400).json({ error: "Hành động không hợp lệ" });
    }

    const updated = await pool.query(
      "UPDATE orders SET status = $1, return_reason = COALESCE($2, return_reason) WHERE id = $3 RETURNING *",
      [newStatus, return_reason || null, req.params.id]
    );

    // If cancelled or rejected, restore stock
    if (closedStatuses.includes(newStatus)) {
      await restoreOrderStock(req.params.id);
    }

    res.json(updated.rows[0]);
  } catch (err) {
    console.error("Customer action error:", err);
    res.status(500).json({ error: "Lỗi xử lý đơn hàng" });
  }
});

// Update order status (MANAGER / ADMIN)
router.patch("/:id/status", authMiddleware, requireRole("MANAGER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { status } = req.body;
    const oldOrder = await pool.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);
    if (oldOrder.rows.length === 0) return res.status(404).json({ error: "Không tìm thấy đơn" });

    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );

    // If cancelled or returned, restore stock
    if (closedStatuses.includes(status) && !closedStatuses.includes(oldOrder.rows[0].status)) {
      await restoreOrderStock(req.params.id);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
