import pool from "../db.js";

// Cộng lại số truyện đã trừ khi tạo đơn.
export async function restoreOrderStock(orderId) {
  const { rows: items } = await pool.query(
    "SELECT comic_id, quantity FROM order_items WHERE order_id = $1",
    [orderId]
  );

  for (const item of items) {
    await pool.query("UPDATE comics SET stock = stock + $1 WHERE id = $2", [item.quantity, item.comic_id]);
  }
}
