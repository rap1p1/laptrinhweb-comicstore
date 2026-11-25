import app from "./app.js";
import { initDB } from "./schema.js";
const PORT = process.env.PORT || 3001;

try {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("Failed to start server:", err);
  process.exit(1);
}
