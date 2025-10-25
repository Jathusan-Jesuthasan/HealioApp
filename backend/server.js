// backend/server.js
import express from "express";
import dotenv from "dotenv";
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
import aiRoutes from "./routes/aiRoutes.js";
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

// 🩺 Health & Root Routes
app.get("/", (req, res) => res.send("✅ Healio API is running"));
app.get("/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
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
