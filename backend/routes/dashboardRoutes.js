// /routes/dashboardRoutes.js
import express from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/dashboard
 * @desc    Get user dashboard data (mind balance, progress, weekly moods, AI risk)
 * @access  Private
 */
router.get("/", protect, async (req, res) => {
  try {
    // ✅ Always call the controller (no fake data)
    return getDashboard(req, res);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

export default router;
