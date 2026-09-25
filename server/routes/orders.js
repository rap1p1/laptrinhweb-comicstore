import { Router } from "express";
import crypto from "crypto";
import pool from "../db.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { sendOrderConfirmation } from "../utils/email.js";

const router = Router();

// Create order from cart
router.post("/", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { payment_method = "COD", shipping_name, shipping_phone, shipping_address } = req.body;

    if (!shipping_name || !shipping_phone || !shipping_address) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin giao hàng" });
    }

    // Get cart items
    const cartResult = await client.query(
      `SELECT ci.comic_id, ci.quantity, c.price, c.stock, c.title 
       FROM cart_items ci JOIN comics c ON ci.comic_id = c.id 
       WHERE ci.user_id = $1`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Giỏ hàng trống" });
    }

    // Check stock
    for (const item of cartResult.rows) {
      if (item.stock < item.quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `"${item.title}" không đủ hàng (còn ${item.stock})` });
      }
    }

    const total = cartResult.rows.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total, payment_method, shipping_name, shipping_phone, shipping_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, total, payment_method, shipping_name, shipping_phone, shipping_address, payment_method === "VNPAY" ? "PENDING" : "CONFIRMED"]
    );

    const order = orderResult.rows[0];

    // Create order items and reduce stock
    for (const item of cartResult.rows) {
      await client.query(
        "INSERT INTO order_items (order_id, comic_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [order.id, item.comic_id, item.quantity, item.price]
      );
      await client.query(
        "UPDATE comics SET stock = stock - $1 WHERE id = $2",
        [item.quantity, item.comic_id]
      );
    }

    // Clear cart
    await client.query("DELETE FROM cart_items WHERE user_id = $1", [req.user.id]);

    await client.query("COMMIT");

    // Send confirmation email for COD orders
    if (payment_method === "COD") {
      try {
        const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [req.user.id]);
        await sendOrderConfirmation(
          userResult.rows[0].email,
          order,
          cartResult.rows.map((item) => ({ title: item.title, quantity: item.quantity, price: item.price * item.quantity }))
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

// Update order status (MANAGER / ADMIN)
router.patch("/:id/status", authMiddleware, requireRole("MANAGER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Không tìm thấy đơn" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
