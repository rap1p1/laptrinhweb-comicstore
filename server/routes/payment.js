import { Router } from "express";
import crypto from "crypto";
import pool from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendOrderConfirmation } from "../utils/email.js";

const router = Router();

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }
  return sorted;
}

// Create VNPay payment URL
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { order_id } = req.body;

    const orderResult = await pool.query(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status = 'PENDING'",
      [order_id, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    const order = orderResult.rows[0];
    const date = new Date();
    const createDate = date.toISOString().replace(/[-T:Z.]/g, "").slice(0, 14);

    const orderId = `${createDate}${order.id.toString().padStart(6, "0")}`;

    const vnpParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: process.env.VNP_TMN_CODE,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang #${order.id}`,
      vnp_OrderType: "other",
      vnp_Amount: order.total * 100,
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_IpAddr: req.ip || "127.0.0.1",
      vnp_CreateDate: createDate,
    };

    const sortedParams = sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    sortedParams["vnp_SecureHash"] = signed;
    const paymentUrl = `${process.env.VNP_URL}?${new URLSearchParams(sortedParams).toString()}`;

    // Save payment ref
    await pool.query("UPDATE orders SET payment_ref = $1 WHERE id = $2", [orderId, order.id]);

    res.json({ paymentUrl });
  } catch (err) {
    console.error("VNPay create error:", err);
    res.status(500).json({ error: "Lỗi tạo thanh toán" });
  }
});

// VNPay return callback
router.get("/return", async (req, res) => {
  try {
    const vnpParams = { ...req.query };
    const secureHash = vnpParams["vnp_SecureHash"];
    delete vnpParams["vnp_SecureHash"];
    delete vnpParams["vnp_SecureHashType"];

    const sortedParams = sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
    const checkSum = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    const txnRef = vnpParams["vnp_TxnRef"];
    const responseCode = vnpParams["vnp_ResponseCode"];

    if (secureHash === checkSum) {
      // Find order by payment_ref
      const orderResult = await pool.query(
        "SELECT * FROM orders WHERE payment_ref = $1",
        [txnRef]
      );

      if (orderResult.rows.length > 0) {
        const order = orderResult.rows[0];
        if (responseCode === "00") {
          await pool.query("UPDATE orders SET status = 'PAID' WHERE id = $1", [order.id]);

          // Send confirmation email
          try {
            const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [order.user_id]);
            const itemsResult = await pool.query(
              "SELECT oi.*, c.title FROM order_items oi JOIN comics c ON oi.comic_id = c.id WHERE oi.order_id = $1",
              [order.id]
            );
            await sendOrderConfirmation(
              userResult.rows[0].email,
              order,
              itemsResult.rows.map((i) => ({ title: i.title, quantity: i.quantity, price: i.price * i.quantity }))
            );
          } catch (e) {
            console.error("Order email failed:", e.message);
          }

          res.redirect(`${process.env.CLIENT_URL}/payment/success?orderId=${order.id}`);
        } else {
          await pool.query("UPDATE orders SET status = 'CANCELLED' WHERE id = $1", [order.id]);
          // Restore stock
          const items = await pool.query("SELECT comic_id, quantity FROM order_items WHERE order_id = $1", [order.id]);
          for (const item of items.rows) {
            await pool.query("UPDATE comics SET stock = stock + $1 WHERE id = $2", [item.quantity, item.comic_id]);
          }
          res.redirect(`${process.env.CLIENT_URL}/payment/failed?orderId=${order.id}`);
        }
      } else {
        res.redirect(`${process.env.CLIENT_URL}/payment/failed`);
      }
    } else {
      res.redirect(`${process.env.CLIENT_URL}/payment/failed`);
    }
  } catch (err) {
    console.error("VNPay return error:", err);
    res.redirect(`${process.env.CLIENT_URL}/payment/failed`);
  }
});

export default router;
