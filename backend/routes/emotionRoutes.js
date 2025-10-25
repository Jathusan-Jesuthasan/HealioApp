// routes/emotionRoutes.js
import express from "express";
import { analyzeEmotion } from "../controllers/emotionController.js";

const router = express.Router();

/**
 * POST /api/analyze-emotion
 * Expects: { text }
 * Returns: { success, emotion, confidence, mappedMood, message }
 */
router.post("/analyze-emotion", async (req, res) => {
  try {
    const result = await analyzeEmotion(req, res);
    // If controller already sent the response, stop here
    if (res.headersSent) return;

    return res.status(200).json({
      success: true,
      message: "✅ Emotion data received successfully by server!",
      ...result, // emotion, confidence, mappedMood, etc.
    });
  } catch (error) {
    console.error("❌ Emotion route error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to process emotion analysis.",
      error: error.message,
    });
  }
});

export default router;