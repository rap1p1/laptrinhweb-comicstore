import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDB } from "../server/schema.js";
import authRoutes from "../server/routes/auth.js";
import comicRoutes from "../server/routes/comics.js";
import cartRoutes from "../server/routes/cart.js";
import orderRoutes from "../server/routes/orders.js";
import paymentRoutes from "../server/routes/payment.js";
import userRoutes from "../server/routes/users.js";
import tagRoutes from "../server/routes/tags.js";

dotenv.config();

const app = express();

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

app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

let dbInitPromise = null;
app.use(async (req, res, next) => {
  if (!dbInitPromise) {
    dbInitPromise = initDB().catch((err) => {
      console.error("DB init warning:", err.message);
      dbInitPromise = null;
    });
  }
  await dbInitPromise;
  next();
});

export default app;
