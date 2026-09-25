import { Router } from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = Router();

// Get all users (ADMIN only)
router.get("/", authMiddleware, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, role, avatar, is_verified, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Update user role (ADMIN only)
router.patch("/:id/role", authMiddleware, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { role } = req.body;
    if (!["SYSTEM_ADMIN", "MANAGER", "PUBLISHER", "BUYER"].includes(role)) {
      return res.status(400).json({ error: "Vai trò không hợp lệ" });
    }

    // Don't let admin demote themselves
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: "Không thể thay đổi vai trò của chính mình" });
    }

    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role, avatar",
      [role, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Delete user (ADMIN only)
router.delete("/:id", authMiddleware, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: "Không thể xóa chính mình" });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ message: "Đã xóa người dùng" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Create user (ADMIN only)
router.post("/", authMiddleware, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: "Thiếu thông tin" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email đã tồn tại" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, name, password_hash, role, is_verified) VALUES ($1, $2, $3, $4, TRUE) RETURNING id, email, name, role, created_at",
      [email, name, hash, role || "BUYER"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Get dashboard stats (ADMIN / MANAGER)
router.get("/stats", authMiddleware, requireRole("MANAGER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const users = await pool.query("SELECT COUNT(*) FROM users");
    const comics = await pool.query("SELECT COUNT(*) FROM comics WHERE status = 'APPROVED'");
    const pending = await pool.query("SELECT COUNT(*) FROM comics WHERE status = 'PENDING'");
    const orders = await pool.query("SELECT COUNT(*) FROM orders");

    // Total revenue from active/completed orders
    const revenue = await pool.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status NOT IN ('CANCELLED', 'RETURNED', 'REJECTED')"
    );
    const deliveredRevenue = await pool.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status IN ('DELIVERED', 'PAID')"
    );
    const shippingRevenue = await pool.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status = 'SHIPPING'"
    );

    // Orders by status
    const statusCounts = await pool.query(
      "SELECT status, COUNT(*) as count, COALESCE(SUM(total), 0) as amount FROM orders GROUP BY status"
    );

    // Top selling comics
    const topComics = await pool.query(`
      SELECT c.id, c.title, c.image_url, COALESCE(SUM(oi.quantity), 0) as sold, COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
      FROM comics c
      JOIN order_items oi ON c.id = oi.comic_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status NOT IN ('CANCELLED', 'RETURNED', 'REJECTED')
      GROUP BY c.id, c.title, c.image_url
      ORDER BY sold DESC
      LIMIT 5
    `);

    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalComics: parseInt(comics.rows[0].count),
      pendingComics: parseInt(pending.rows[0].count),
      totalOrders: parseInt(orders.rows[0].count),
      totalRevenue: parseInt(revenue.rows[0].total),
      deliveredRevenue: parseInt(deliveredRevenue.rows[0].total),
      shippingRevenue: parseInt(shippingRevenue.rows[0].total),
      statusStats: statusCounts.rows,
      topSelling: topComics.rows,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
