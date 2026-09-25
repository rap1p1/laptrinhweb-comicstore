import { Router } from "express";
import pool from "../db.js";
import { authMiddleware, requireRole, optionalAuth } from "../middleware/auth.js";

const router = Router();

// Get all approved comics (public)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { search, character, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT c.*, 
        COALESCE(json_agg(DISTINCT cc.character_name) FILTER (WHERE cc.character_name IS NOT NULL), '[]') as characters,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'name', cc.character_name,
              'wiki_url', COALESCE(cc.wiki_url, 'https://en.wikipedia.org/wiki/' || replace(cc.character_name, ' ', '_'))
            )
          ) FILTER (WHERE cc.character_name IS NOT NULL),
          '[]'
        ) as character_details
      FROM comics c
      LEFT JOIN comic_characters cc ON c.id = cc.comic_id
      WHERE c.status = 'APPROVED'
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (character && character !== "Tất cả") {
      query += ` AND EXISTS (SELECT 1 FROM comic_characters cc2 WHERE cc2.comic_id = c.id AND cc2.character_name = $${paramIndex})`;
      params.push(character);
      paramIndex++;
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(DISTINCT c.id) FROM comics c LEFT JOIN comic_characters cc ON c.id = cc.comic_id WHERE c.status = 'APPROVED'";
    const countParams = [];
    let cParamIndex = 1;
    if (search) {
      countQuery += ` AND (c.title ILIKE $${cParamIndex} OR c.description ILIKE $${cParamIndex})`;
      countParams.push(`%${search}%`);
      cParamIndex++;
    }
    if (character && character !== "Tất cả") {
      countQuery += ` AND EXISTS (SELECT 1 FROM comic_characters cc2 WHERE cc2.comic_id = c.id AND cc2.character_name = $${cParamIndex})`;
      countParams.push(character);
    }
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      comics: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (err) {
    console.error("Get comics error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Get single comic (public)
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, 
        COALESCE(json_agg(DISTINCT cc.character_name) FILTER (WHERE cc.character_name IS NOT NULL), '[]') as characters,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'name', cc.character_name,
              'wiki_url', COALESCE(cc.wiki_url, 'https://en.wikipedia.org/wiki/' || replace(cc.character_name, ' ', '_'))
            )
          ) FILTER (WHERE cc.character_name IS NOT NULL),
          '[]'
        ) as character_details,
        u.name as creator_name
      FROM comics c
      LEFT JOIN comic_characters cc ON c.id = cc.comic_id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1
      GROUP BY c.id, u.name`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy truyện" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Create comic (PUBLISHER)
router.post("/", authMiddleware, requireRole("PUBLISHER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { title, issue, price, old_price, description, preview, image_url, color, accent, mark, badge, stock, characters } = req.body;
    
    if (!title || !price) {
      return res.status(400).json({ error: "Tên truyện và giá là bắt buộc" });
    }

    const result = await pool.query(
      `INSERT INTO comics (title, issue, price, old_price, description, preview, image_url, color, accent, mark, badge, stock, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING', $13) RETURNING *`,
      [title, issue, price, old_price || null, description, preview, image_url, color || "#111111", accent || "#e51c2a", mark, badge, stock || 0, req.user.id]
    );

    const comic = result.rows[0];

    // Insert characters
    if (characters && characters.length > 0) {
      for (const char of characters) {
        const charName = typeof char === 'object' ? char.name : char;
        const wikiUrl = typeof char === 'object' ? char.wiki_url : null;
        await pool.query(
          "INSERT INTO comic_characters (comic_id, character_name, wiki_url) VALUES ($1, $2, $3)",
          [comic.id, charName, wikiUrl]
        );
      }
    }

    res.status(201).json(comic);
  } catch (err) {
    console.error("Create comic error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Update comic (PUBLISHER - owner only, or ADMIN)
router.put("/:id", authMiddleware, requireRole("PUBLISHER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const comic = await pool.query("SELECT * FROM comics WHERE id = $1", [id]);
    if (comic.rows.length === 0) return res.status(404).json({ error: "Không tìm thấy truyện" });

    if (req.user.role === "PUBLISHER" && comic.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: "Không có quyền" });
    }

    const { title, issue, price, old_price, description, preview, image_url, color, accent, mark, badge, stock, characters } = req.body;

    const result = await pool.query(
      `UPDATE comics SET title=$1, issue=$2, price=$3, old_price=$4, description=$5, preview=$6, image_url=$7, 
       color=$8, accent=$9, mark=$10, badge=$11, stock=$12, status='PENDING', updated_at=NOW() WHERE id=$13 RETURNING *`,
      [title, issue, price, old_price || null, description, preview, image_url, color, accent, mark, badge, stock, id]
    );

    // Update characters
    await pool.query("DELETE FROM comic_characters WHERE comic_id = $1", [id]);
    if (characters && characters.length > 0) {
      for (const char of characters) {
        const charName = typeof char === 'object' ? char.name : char;
        const wikiUrl = typeof char === 'object' ? char.wiki_url : null;
        await pool.query(
          "INSERT INTO comic_characters (comic_id, character_name, wiki_url) VALUES ($1, $2, $3)",
          [id, charName, wikiUrl]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update comic error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Get pending comics (MANAGER)
router.get("/manage/pending", authMiddleware, requireRole("MANAGER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as creator_name,
        COALESCE(json_agg(DISTINCT cc.character_name) FILTER (WHERE cc.character_name IS NOT NULL), '[]') as characters
      FROM comics c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN comic_characters cc ON c.id = cc.comic_id
      WHERE c.status = 'PENDING'
      GROUP BY c.id, u.name
      ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Approve/Reject comic (MANAGER)
router.patch("/:id/review", authMiddleware, requireRole("MANAGER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { status, reject_reason } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Trạng thái không hợp lệ" });
    }

    const result = await pool.query(
      `UPDATE comics SET status = $1, reject_reason = $2, approved_by = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [status, reject_reason || null, req.user.id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy truyện" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Get my comics (PUBLISHER)
router.get("/manage/my-comics", authMiddleware, requireRole("PUBLISHER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        COALESCE(json_agg(DISTINCT cc.character_name) FILTER (WHERE cc.character_name IS NOT NULL), '[]') as characters
      FROM comics c
      LEFT JOIN comic_characters cc ON c.id = cc.comic_id
      WHERE c.created_by = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Update stock (PUBLISHER owner or MANAGER or ADMIN)
router.patch("/:id/stock", authMiddleware, requireRole("PUBLISHER", "MANAGER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { stock } = req.body;
    const comic = await pool.query("SELECT created_by FROM comics WHERE id = $1", [req.params.id]);
    if (comic.rows.length === 0) return res.status(404).json({ error: "Không tìm thấy truyện" });

    if (req.user.role === "PUBLISHER" && comic.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: "Không có quyền" });
    }

    const result = await pool.query(
      "UPDATE comics SET stock = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [stock, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Get all comics (ADMIN)
router.get("/manage/all", authMiddleware, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as creator_name,
        COALESCE(json_agg(DISTINCT cc.character_name) FILTER (WHERE cc.character_name IS NOT NULL), '[]') as characters
      FROM comics c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN comic_characters cc ON c.id = cc.comic_id
      GROUP BY c.id, u.name
      ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Delete comic (ADMIN or PUBLISHER owner)
router.delete("/:id", authMiddleware, requireRole("PUBLISHER", "SYSTEM_ADMIN"), async (req, res) => {
  try {
    const comic = await pool.query("SELECT created_by FROM comics WHERE id = $1", [req.params.id]);
    if (comic.rows.length === 0) return res.status(404).json({ error: "Không tìm thấy" });

    if (req.user.role === "PUBLISHER" && comic.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: "Không có quyền" });
    }

    await pool.query("DELETE FROM comics WHERE id = $1", [req.params.id]);
    res.json({ message: "Đã xóa truyện" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
