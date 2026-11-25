import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDB } from "./schema.js";
import authRoutes from "./routes/auth.js";
import comicRoutes from "./routes/comics.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";
import userRoutes from "./routes/users.js";
import tagRoutes from "./routes/tags.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/comics", comicRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tags", tagRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Init DB and start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
