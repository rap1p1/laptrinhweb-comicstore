import { Router } from "express";
import pool from "../db.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = Router();

// Get approved tags (public) or all tags (manager/admin)
router.get("/", async (req, res) => {
  try {
    const { all } = req.query;
    let query = "SELECT t.*, u.name as creator_name FROM character_tags t LEFT JOIN users u ON t.created_by = u.id";
    if (all !== "true") {
      query += " WHERE t.status = 'APPROVED'";
    }
    query += " ORDER BY t.name ASC";
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Create tag (Publisher creates PENDING; Manager/Admin creates APPROVED)
router.post("/", authMiddleware, requireRole("PUBLISHER", "MANAGER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { name, wiki_url } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Tên nhân vật không được để trống" });
    }

    const trimmedName = name.trim();
    const finalWiki = wiki_url?.trim() || `https://en.wikipedia.org/wiki/${encodeURIComponent(trimmedName.replace(/ /g, "_"))}`;
    const status = (req.user.role === "MANAGER" || req.user.role === "SYSTEM_ADMIN") ? "APPROVED" : "PENDING";

    const result = await pool.query(
      `INSERT INTO character_tags (name, wiki_url, status, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO UPDATE SET wiki_url = EXCLUDED.wiki_url
       RETURNING *`,
      [trimmedName, finalWiki, status, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create tag error:", err);
    res.status(500).json({ error: "Lỗi tạo tag nhân vật" });
  }
});

// Review tag (approve/reject) - MANAGER / ADMIN
router.patch("/:id/review", authMiddleware, requireRole("MANAGER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Trạng thái không hợp lệ" });
    }

    const result = await pool.query(
      "UPDATE character_tags SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Không tìm thấy tag" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Delete tag - MANAGER / ADMIN
router.delete("/:id", authMiddleware, requireRole("MANAGER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    await pool.query("DELETE FROM character_tags WHERE id = $1", [req.params.id]);
    res.json({ message: "Đã xóa tag nhân vật" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
