// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import moodLogRoutes from "./routes/moodLogRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

// ----------------- Load env first -----------------
dotenv.config();

// ----------------- Init App -----------------
const app = express();

// ----------------- Connect DB -----------------
try {
  await connectDB();
  console.log("✅ MongoDB Connected");
} catch (err) {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
}

// ----------------- Middleware -----------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow all origins during dev (restrict in production)
app.use(
  cors({
    origin: "*",
  })
);

// ----------------- Health & Root -----------------
app.get("/", (req, res) => res.send("✅ Healio API is running"));
app.get("/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// ----------------- API Routes -----------------
app.use("/api/auth", authRoutes);
app.use("/api/moodlogs", moodLogRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);

// ----------------- Global Error Handler -----------------
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled Error:", err);
  res.status(500).json({ message: "Server error" });
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);



// // backend/server.js
// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import connectDB from "./config/db.js";

// // Routes
// import authRoutes from "./routes/authRoutes.js";
// import moodLogRoutes from "./routes/moodLogRoutes.js";
// import dashboardRoutes from "./routes/dashboardRoutes.js";
// import analyticsRoutes from "./routes/analyticsRoutes.js";
// import aiRoutes from "./routes/aiRoutes.js";



// // ----------------- Load env first -----------------
// dotenv.config();

// // ----------------- Init App -----------------
// const app = express();

// // ----------------- Connect DB -----------------
// try {
//   await connectDB();
//   console.log("✅ MongoDB Connected");
// } catch (err) {
//   console.error("❌ MongoDB connection failed:", err);
//   process.exit(1);
// }

// // ----------------- Middleware -----------------
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Allow all origins during dev (restrict in production)
// app.use(
//   cors({
//     origin: "*",
//   })
// );

// // ----------------- Health & Root -----------------
// app.get("/", (req, res) => res.send("✅ Healio API is running"));
// app.get("/health", (req, res) =>
//   res.json({ ok: true, time: new Date().toISOString() })
// );

// // ----------------- API Routes -----------------
// app.use("/api/auth", authRoutes);
// app.use("/api/moodlogs", moodLogRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/analytics", analyticsRoutes);
// app.use("/api/ai", aiRoutes);
// // ----------------- Global Error Handler -----------------
// app.use((err, req, res, next) => {
//   console.error("🔥 Unhandled Error:", err);
//   res.status(500).json({ message: "Server error" });
// });

// // ----------------- Start Server -----------------
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, "0.0.0.0", () =>
//   console.log(`🚀 Server running on http://localhost:${PORT}`)
// );
