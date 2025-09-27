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
    // --- Use your real controller logic when ready ---
    // const data = await getDashboard(req, res);

    // TEMP fallback (like analyticsRoutes had)
    const hasData = false; // fake DB check

    if (!hasData) {
      return res.json({
        mindBalanceScore: 72,
        progressMilestone: 0.2,
        weeklyMoods: [3, 4, 2, 5, 4, 3, 4],
        aiRiskDetected: false,
      });
    }

    // If you want, you can call your controller here:
    return getDashboard(req, res);

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

export default router;
