// backend/controllers/moodLogController.js
import MoodLog from "../models/MoodLog.js";
import { classifyText } from "../services/hfClient.js";

/**
 * POST /api/moodlogs/add
 * Body: { mood, factors, journal }
 * Automatically detects sentiment & confidence using Hugging Face
 */
export const addMoodLog = async (req, res) => {
  try {
    const { mood, factors = [], journal = "" } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: missing user" });
    }
    if (!journal.trim()) {
      return res.status(400).json({ message: "Journal text required" });
    }

    /* 🧩 Run sentiment analysis */
    const modelId = process.env.HF_MODEL || "SamLowe/roberta-base-go_emotions";
    const hfToken = process.env.HF_TOKEN;
    let sentiment = "Neutral";
    let confidence = null;

    try {
      const scores = await classifyText({ text: journal, modelId, hfToken });
      if (scores?.length) {
        const top = scores.reduce((a, b) => (b.score > a.score ? b : a));
        sentiment = top.label;
        confidence = top.score;
        console.log(`✅ HF Top: ${sentiment} (${(confidence * 100).toFixed(1)}%)`);
      } else {
        console.warn("⚠️ No scores returned from HF");
      }
    } catch (err) {
      console.error("❌ HF analyze error:", err.message);
    }

    /* 💾 Save to MongoDB */
    const newLog = await MoodLog.create({
      user: userId,
      mood,
      factors,
      journal,
      sentiment,
      confidence,
    });

    res.status(201).json({
      message: "Mood log saved successfully",
      data: newLog,
    });
  } catch (err) {
    console.error("❌ addMoodLog error:", err.message);
    res.status(500).json({ message: "Failed to save mood log", error: err.message });
  }
};

/* GET /api/moodlogs */
export const getMoodLogs = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const logs = await MoodLog.find({ user: userId }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error("❌ getMoodLogs error:", err.message);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};
