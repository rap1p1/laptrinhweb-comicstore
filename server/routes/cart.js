import { Router } from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// Get cart items
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.id, ci.quantity, ci.comic_id,
        c.title, c.issue, c.price, c.old_price, c.image_url, c.color, c.accent, c.mark, c.badge, c.stock,
        COALESCE(json_agg(DISTINCT cc.character_name) FILTER (WHERE cc.character_name IS NOT NULL), '[]') as characters
      FROM cart_items ci
      JOIN comics c ON ci.comic_id = c.id
      LEFT JOIN comic_characters cc ON c.id = cc.comic_id
      WHERE ci.user_id = $1
      GROUP BY ci.id, c.id
      ORDER BY ci.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Add to cart
router.post("/", authMiddleware, async (req, res) => {
  if (req.user.role !== "BUYER") {
    return res.status(403).json({ error: "Chỉ tài khoản người mua (BUYER) mới có thể sử dụng giỏ hàng và đặt hàng" });
  }

  try {
    const { comic_id, quantity = 1 } = req.body;

    // Check stock
    const comic = await pool.query("SELECT stock, status FROM comics WHERE id = $1", [comic_id]);
    if (comic.rows.length === 0 || comic.rows[0].status !== "APPROVED") {
      return res.status(404).json({ error: "Truyện không tồn tại" });
    }
    if (comic.rows[0].stock < quantity) {
      return res.status(400).json({ error: "Không đủ hàng trong kho" });
    }

    // Upsert cart item
    const result = await pool.query(
      `INSERT INTO cart_items (user_id, comic_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, comic_id) DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING *`,
      [req.user.id, comic_id, quantity]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Update cart item quantity
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) {
      return res.status(400).json({ error: "Số lượng phải >= 1" });
    }

    // Check stock
    const cartItem = await pool.query(
      "SELECT ci.comic_id, c.stock FROM cart_items ci JOIN comics c ON ci.comic_id = c.id WHERE ci.id = $1 AND ci.user_id = $2",
      [req.params.id, req.user.id]
    );
    if (cartItem.rows.length === 0) return res.status(404).json({ error: "Không tìm thấy" });
    if (cartItem.rows[0].stock < quantity) {
      return res.status(400).json({ error: "Không đủ hàng trong kho" });
    }

    const result = await pool.query(
      "UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [quantity, req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Remove from cart
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM cart_items WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    res.json({ message: "Đã xóa khỏi giỏ hàng" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Clear cart
router.delete("/", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM cart_items WHERE user_id = $1", [req.user.id]);
    res.json({ message: "Đã xóa giỏ hàng" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Get cart count
router.get("/count", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COALESCE(SUM(quantity), 0) as count FROM cart_items WHERE user_id = $1",
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
