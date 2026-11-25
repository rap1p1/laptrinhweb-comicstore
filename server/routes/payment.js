import { Router } from "express";
import crypto from "crypto";
import pool from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendOrderConfirmation } from "../utils/email.js";
import { restoreOrderStock } from "../utils/stock.js";

const router = Router();

const VNP_TMN_CODE = process.env.VNP_TMN_CODE || "QO40JJ9S";
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET || "AYVEJYTULOZISSGDVDRBUQCCYZBABFYT";
const VNP_URL = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const CLIENT_URL = process.env.CLIENT_URL || "https://laptrinhweb-comicstore-ltw9.vercel.app";
const VNP_RETURN_URL = process.env.VNP_RETURN_URL || `${CLIENT_URL}/api/payment/return`;

// Tạo cùng một chuỗi ký khi gửi yêu cầu và khi kiểm tra kết quả từ VNPay.
function createSignedQuery(params) {
  const encodedParams = {};
  for (const [key, value] of Object.entries(params)) {
    encodedParams[encodeURIComponent(key)] = encodeURIComponent(value).replace(/%20/g, "+");
  }

  const query = Object.keys(encodedParams).sort()
    .map((key) => `${key}=${encodedParams[key]}`)
    .join("&");
  const signature = crypto.createHmac("sha512", VNP_HASH_SECRET).update(query).digest("hex");
  return { query, signature };
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

    let ipAddr = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
    if (typeof ipAddr === "string" && ipAddr.includes(",")) {
      ipAddr = ipAddr.split(",")[0].trim();
    }
    if (ipAddr === "::1" || !ipAddr) {
      ipAddr = "127.0.0.1";
    }

    const vnpParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNP_TMN_CODE,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang #${order.id}`,
      vnp_OrderType: "other",
      vnp_Amount: order.total * 100,
      vnp_ReturnUrl: VNP_RETURN_URL,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const { query, signature } = createSignedQuery(vnpParams);
    const paymentUrl = `${VNP_URL}?${query}&vnp_SecureHash=${signature}`;

    // Save payment ref
    await pool.query("UPDATE orders SET payment_ref = $1 WHERE id = $2", [orderId, order.id]);

    res.json({ paymentUrl });
  } catch (err) {
    console.error("VNPay create error:", err);
    res.status(500).json({ error: "Lỗi tạo thanh toán VNPay: " + (err.message || "") });
  }
});

// VNPay return callback
router.get("/return", async (req, res) => {
  const failureUrl = `${CLIENT_URL}/payment/failed`;
  try {
    const { vnp_SecureHash, vnp_SecureHashType, ...paymentParams } = req.query;
    const { signature } = createSignedQuery(paymentParams);
    if (vnp_SecureHash !== signature) return res.redirect(failureUrl);

    const result = await pool.query(
      "SELECT * FROM orders WHERE payment_ref = $1",
      [paymentParams.vnp_TxnRef]
    );
    const order = result.rows[0];
    if (!order) return res.redirect(failureUrl);

    if (paymentParams.vnp_ResponseCode !== "00") {
      await pool.query("UPDATE orders SET status = 'CANCELLED' WHERE id = $1", [order.id]);
      await restoreOrderStock(order.id);
      return res.redirect(`${failureUrl}?orderId=${order.id}`);
    }

    await pool.query("UPDATE orders SET status = 'CONFIRMED' WHERE id = $1", [order.id]);

    try {
      const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [order.user_id]);
      const itemsResult = await pool.query(
        "SELECT oi.*, c.title FROM order_items oi JOIN comics c ON oi.comic_id = c.id WHERE oi.order_id = $1",
        [order.id]
      );
      await sendOrderConfirmation(
        userResult.rows[0].email,
        order,
        itemsResult.rows.map((item) => ({ title: item.title, quantity: item.quantity, price: item.price * item.quantity }))
      );
    } catch (err) {
      console.error("Order email failed:", err.message);
    }

    res.redirect(`${CLIENT_URL}/payment/success?orderId=${order.id}`);
  } catch (err) {
    console.error("VNPay return error:", err);
    res.redirect(failureUrl);
  }
});

export default router;
