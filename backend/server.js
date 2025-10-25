// backend/server.js

// ----------------- Load Environment Variables First -----------------
import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // ✅ Must be the first line to ensure env vars load before anything else

// ----------------- Core Imports -----------------
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import trustedRoutes from "./routes/trustedContactRoutes.js";
import sosRoutes from "./routes/sosRoutes.js";
import userRoleRoutes from "./routes/userRoleRoutes.js";
import trustedDashboardRoutes from "./routes/trustedDashboardRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import questionnaireRoutes from "./routes/questionnaireRoutes.js";
import emotionRoutes from "./routes/emotionRoutes.js";
import moodLogRoutes from "./routes/moodLogRoutes.js";
import path from 'path';
import fs from 'fs';

// 🧩 Connect to MongoDB Atlas
import journalRoutes from "./routes/journalRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import meditationRoutes from "./routes/meditationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import activityDashboardRoutes from "./routes/activityDashboardRoutes.js";
import rewardsRoutes from "./routes/rewardsRoutes.js";

// 🩺 Health & Root Routes
import { scheduleDailySummary } from "./utils/dailySummary.js";

// ----------------- Routes -----------------
import dashboardRoutes from "./routes/dashboardRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import trustedContactRoutes from "./routes/trustedContactRoutes.js";
dotenv.config();
const app = express();

app.get("/", (req, res) => {
  res.send("✅ Healio backend is running");
});

// Connect DB (Atlas)
await connectDB();

// 🔍 Parse incoming JSON and form data
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// 🌐 Enable CORS — allows frontend (Expo/React Native) to call backend
app.use(
  cors({
    origin: "*", // Allow all origins during development
  })
);

// AI routes (Gemini)
app.use("/api/ai", aiRoutes);

// Ensure uploads directory exists and serve it
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));


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

// ----------------- Serve Static Files (for logo in emails) -----------------
app.use('/public', express.static('public'));

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

app.use("/api/moodlogs", moodLogRoutes);
app.use("/api", emotionRoutes);
// Routes
app.use("/api/auth", authRoutes);
app.use(express.json());
app.use("/api/chat", chatRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/meditations", meditationRoutes);
app.use("/api/activity-dashboard", activityDashboardRoutes);
app.use("/api/activities", activityRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/rewards", rewardsRoutes);

// Hugging Face emotion analyzer
app.use("/api", emotionRoutes); // -> /api/analyze-emotion

// 🧭 API Routes
app.use("/api/auth", authRoutes);   // → register, login, forgot-password, reset-password
app.use("/api/users", userRoutes);  // → get/update/delete user profile (CRUD)

app.use("/api/TrustedContact", trustedRoutes); // → manage trusted contacts & emergency alerts
// Legacy/lowercase path used by frontend calls — keep as alias for compatibility
app.use("/api/trusted", trustedRoutes);

app.use("/api/sos", sosRoutes); // → send SOS alerts to trusted contacts

app.use("/api/users", userRoleRoutes);

app.use("/api/trusted", trustedDashboardRoutes); // → trusted contact dashboard & alerts

app.use("/api/community", communityRoutes); // → community posts & interactions
app.use("/api/questionnaire", questionnaireRoutes); // → questionnaire & risk assessment

// Conversations (metadata) — create/list conversation resources
app.use('/api/conversations', conversationRoutes);

// ⚠️ Global Error Fallback (always last)
app.use((err, req, res, next) => {
  console.error("🚨 Unhandled Error:", err);
  res.status(500).json({ message: "Server error", error: err.message });
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Healio API Server running on: http://localhost:${PORT}`);
  
  // Start daily summary scheduler
  scheduleDailySummary();
  console.log('⏰ Daily summary scheduler is active');
});
