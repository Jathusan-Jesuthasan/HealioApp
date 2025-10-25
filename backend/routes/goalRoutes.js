// backend/routes/goalRoutes.js
import express from "express";
import Goal from "../models/Goal.js";

const router = express.Router();

// ✅ Add new goal
router.post("/add", async (req, res) => {
  try {
    const { userId, sessionsPerWeek, minutesPerDay } = req.body;

    const goal = await Goal.create({
      userId,
      sessionsPerWeek,
      minutesPerDay,
    });

    res.status(201).json({ success: true, goal });
  } catch (err) {
    console.error("Goal save error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get goals for user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const goal = await Goal.findOne({ userId });
    res.json(goal || {});
  } catch (err) {
    console.error("Fetch goal error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
