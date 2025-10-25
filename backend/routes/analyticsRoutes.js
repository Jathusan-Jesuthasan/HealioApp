// backend/routes/analyticsRoutes.js
import express from "express";
const router = express.Router();

// Later you can connect to your MoodLog model
router.get("/dashboard", async (req, res) => {
  try {
    // TODO: replace with MongoDB query once data exists
    const hasData = false; // fake DB check

    if (!hasData) {
      // Fallback dummy values
      return res.json({
        mindBalanceScore: 72,
        progressMilestone: 0.2,
        weeklyMoods: [3, 4, 2, 5, 4, 3, 4],
        aiRiskDetected: false,
      });
    }

    // Example: real aggregation will go here
    // const logs = await MoodLog.find({ user: req.user.id, ... });
    // process logs -> calculate analytics

  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

export default router;
