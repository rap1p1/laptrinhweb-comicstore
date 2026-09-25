import { Router } from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = Router();

// Get all users (ADMIN only)
router.get("/", authMiddleware, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, role, avatar, phone, address, is_verified, google_id, (password_hash IS NOT NULL) as has_password, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Update user full info (ADMIN only)
router.put("/:id", authMiddleware, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { name, email, phone, address, role, password, is_verified } = req.body;
    const userId = parseInt(req.params.id);

    if (!name || !email) {
      return res.status(400).json({ error: "Họ tên và email không được để trống" });
    }

    if (role && !["SYSTEM_ADMIN", "MANAGER", "PUBLISHER", "BUYER"].includes(role)) {
      return res.status(400).json({ error: "Vai trò không hợp lệ" });
    }

    // Don't let admin demote themselves
    if (userId === req.user.id && role && role !== "SYSTEM_ADMIN") {
      return res.status(400).json({ error: "Không thể thay đổi vai trò của chính mình" });
    }

    // Check email uniqueness
    const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [email.trim(), userId]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email này đã được sử dụng bởi tài khoản khác" });
    }

    let passwordHash = null;
    if (password && password.trim().length >= 6) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    let query = "";
    let params = [];

    if (passwordHash) {
      query = `
        UPDATE users 
        SET name = $1, email = $2, phone = $3, address = $4, role = $5, is_verified = $6, password_hash = $7
        WHERE id = $8
        RETURNING id, email, name, role, phone, address, avatar, is_verified, (password_hash IS NOT NULL) as has_password, created_at
      `;
      params = [name.trim(), email.trim(), phone || null, address || null, role, is_verified !== undefined ? is_verified : true, passwordHash, userId];
    } else {
      query = `
        UPDATE users 
        SET name = $1, email = $2, phone = $3, address = $4, role = $5, is_verified = $6
        WHERE id = $7
        RETURNING id, email, name, role, phone, address, avatar, is_verified, (password_hash IS NOT NULL) as has_password, created_at
      `;
      params = [name.trim(), email.trim(), phone || null, address || null, role, is_verified !== undefined ? is_verified : true, userId];
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Lỗi cập nhật người dùng: " + (err.message || "") });
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

// Delete user safely (ADMIN only)
router.delete("/:id", authMiddleware, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  const client = await pool.connect();
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.user.id) {
      return res.status(400).json({ error: "Không thể tự xóa tài khoản của chính mình" });
    }

    await client.query("BEGIN");

    // Clean up dependent records safely
    await client.query("DELETE FROM cart_items WHERE user_id = $1", [targetId]);
    await client.query("DELETE FROM otp_codes WHERE user_id = $1", [targetId]);

    // Reassign comics or tags created by this user
    await client.query("UPDATE comics SET created_by = $1 WHERE created_by = $2", [req.user.id, targetId]);
    await client.query("UPDATE comics SET approved_by = NULL WHERE approved_by = $1", [targetId]);
    await client.query("UPDATE character_tags SET created_by = $1 WHERE created_by = $2", [req.user.id, targetId]);

    // Clean up orders
    await client.query(
      "DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)",
      [targetId]
    );
    await client.query("DELETE FROM orders WHERE user_id = $1", [targetId]);

    const result = await client.query("DELETE FROM users WHERE id = $1 RETURNING id, email, name", [targetId]);
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    await client.query("COMMIT");
    res.json({ message: `Đã xóa người dùng "${result.rows[0].name}" thành công` });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Lỗi server: " + (err.message || "") });
  } finally {
    client.release();
  }
});

// Create user (ADMIN only)
router.post("/", authMiddleware, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { email, name, password, role, phone, address } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: "Thiếu thông tin" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email đã tồn tại" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, name, password_hash, role, phone, address, is_verified) VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id, email, name, role, phone, address, created_at",
      [email.trim(), name.trim(), hash, role || "BUYER", phone || null, address || null]
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
      SELECT c.id, c.title, c.image_url, 
             COALESCE(SUM(oi.quantity), 0)::int as total_sold, 
             COALESCE(SUM(oi.quantity), 0)::int as sold, 
             COALESCE(SUM(oi.price * oi.quantity), 0)::bigint as total_revenue,
             COALESCE(SUM(oi.price * oi.quantity), 0)::bigint as revenue
      FROM comics c
      JOIN order_items oi ON c.id = oi.comic_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status NOT IN ('CANCELLED', 'RETURNED', 'REJECTED')
      GROUP BY c.id, c.title, c.image_url
      ORDER BY total_sold DESC
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
