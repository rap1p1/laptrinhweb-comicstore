import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import comicRoutes from "./routes/comics.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";
import userRoutes from "./routes/users.js";
import tagRoutes from "./routes/tags.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/comics", comicRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tags", tagRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
