// backend/controllers/moodLogController.js
import mongoose from "mongoose";
import MoodLog from "../models/MoodLog.js";

/**
 * @desc    Create a new mood log
 * @route   POST /api/moodlogs
 * @access  Private
 */
export const createMoodLog = async (req, res) => {
  try {
    const { mood, factors = [], journal = "" } = req.body;

    if (!mood) {
      return res.status(400).json({ message: "Mood is required" });
    }

    // ✅ Correct user id reference
    const userId = req.user?._id || req.user;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Invalid user ID" });
    }

    const newLog = await MoodLog.create({
      user: userId,
      mood,
      factors: Array.isArray(factors) ? factors : [],
      journal,
    });

    return res.status(201).json(newLog);
  } catch (err) {
    console.error("❌ Error creating mood log:", err.message);
    return res.status(500).json({ message: "Failed to create mood log", error: err.message });
  }
};

/**
 * @desc    Get all mood logs for logged-in user
 * @route   GET /api/moodlogs
 * @access  Private
 */
export const getMoodLogs = async (req, res) => {
  try {
    // ✅ Correct user id reference
    const userId = req.user?._id || req.user;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Invalid user ID" });
    }

    const logs = await MoodLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(logs);
  } catch (err) {
    console.error("❌ Error fetching mood logs:", err.message);
    return res.status(500).json({ message: "Failed to fetch mood logs", error: err.message });
  }
};
