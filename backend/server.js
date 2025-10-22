// backend/server.js

// ----------------- Load Environment Variables First -----------------
import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // ✅ Must be the first line to ensure env vars load before anything else

// ----------------- Core Imports -----------------
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

// ----------------- Routes -----------------
import authRoutes from "./routes/authRoutes.js";
import moodLogRoutes from "./routes/moodLogRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import trustedContactRoutes from "./routes/trustedContactRoutes.js";

// ----------------- Initialize Express App -----------------
const app = express();

// ----------------- Validate Critical Environment Variables -----------------
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "OPENAI_API_KEY"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.warn(
    `⚠️  Missing required environment variables: ${missing.join(", ")}`
  );
  console.warn("Please check your .env file before starting the server.");
} else {
  console.log("✅ Environment variables loaded successfully");
}

// ----------------- Connect MongoDB -----------------
try {
  await connectDB();
  console.log("✅ MongoDB Connected Successfully");
} catch (err) {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
}

// ----------------- Middleware -----------------
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*", // 🔒 You can restrict this later to your frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// ----------------- Health Check Routes -----------------
app.get("/", (req, res) => res.send("✅ Healio API is running"));
app.get("/health", (req, res) =>
  res.json({
    ok: true,
    mongoConnected: true,
    openaiKeyLoaded: !!process.env.OPENAI_API_KEY,
    time: new Date().toISOString(),
  })
);

// ----------------- Mount API Routes -----------------
app.use("/api/auth", authRoutes);
app.use("/api/moodlogs", moodLogRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/trusted-contacts", trustedContactRoutes);

// ----------------- Global Error Handler -----------------
app.use((err, req, res, next) => {
  console.error("🔥 Global Server Error:", err.stack || err);
  res
    .status(500)
    .json({ message: "Internal Server Error", error: err.message || err });
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Healio API Server running on: http://localhost:${PORT}`)
);
