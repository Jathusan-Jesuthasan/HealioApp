// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

// Connect DB (Atlas)
await connectDB();

// Parse JSON/form bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS: allow all during development (works for emulator + physical device)
app.use(
  cors({
    origin: "*", // lock down in production
  })
);

// Health & root checks
app.get("/", (req, res) => res.send("Healio API is running"));
app.get("/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// Routes
app.use("/api/auth", authRoutes);

// Global error fallback
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;
// 0.0.0.0 lets Android emulator & phones on the same Wi-Fi reach your PC
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
