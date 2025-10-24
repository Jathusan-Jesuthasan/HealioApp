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
import communityRoutes from "./routes/communityRoutes.js";
import questionnaireRoutes from "./routes/questionnaireRoutes.js";



dotenv.config();
const app = express();

// 🧩 Connect to MongoDB Atlas
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

// 🩺 Health & Root Routes
app.get("/", (req, res) => res.send("✅ Healio API is running"));
app.get("/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// 🧭 API Routes
app.use("/api/auth", authRoutes);   // → register, login, forgot-password, reset-password
app.use("/api/users", userRoutes);  // → get/update/delete user profile (CRUD)

app.use("/api/TrustedContact", trustedRoutes); // → manage trusted contacts & emergency alerts

app.use("/api/sos", sosRoutes); // → send SOS alerts to trusted contacts

app.use("/api/users", userRoleRoutes);

app.use("/api/trusted", trustedDashboardRoutes); // → trusted contact dashboard & alerts

app.use("/api/community", communityRoutes); // → community posts & interactions
app.use("/api/questionnaire", questionnaireRoutes); // → questionnaire & risk assessment

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
