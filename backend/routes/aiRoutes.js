import express from "express";
import protect from "../middleware/authMiddleware.js";
import MoodLog from "../models/MoodLog.js";
import AiAnalysis from "../models/AiAnalysis.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROMPT_TEMPLATE = `
You are a mental well-being assistant.
Analyze the user's mood logs from the past 15 days and detect early risks of declining mental health.
Output JSON only with:
{
  "mindBalanceScore": number (0–100),
  "progressMilestone": number (0–1),
  "weeklyMoods": [1–5 scale, 7 values],
  "risks": [
    {
      "category": "Stress | Depression | Anxiety | Stable",
      "score": number (0–100),
      "message": "short explanation"
    }
  ],
  "suggestion": "1–2 motivational sentences (youth friendly)"
}
`;

router.post("/risk-analysis", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Fetch last 15 days of logs
    const moodLogs = await MoodLog.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 });

    if (moodLogs.length === 0) {
      return res.json({ message: "No recent mood logs to analyze." });
    }

    // 2️⃣ Build prompt
    const logsText = moodLogs
      .map(
        (l) => `Mood: ${l.mood}, Factors: ${l.factors.join(", ")}, Journal: ${l.journal}`
      )
      .join("\n");

    const prompt = `${PROMPT_TEMPLATE}\nLogs:\n${logsText}`;

    // 3️⃣ Send to Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 4️⃣ Parse JSON safely
    let aiOutput;
    try {
      aiOutput = JSON.parse(text);
    } catch {
      console.warn("⚠️ AI output not JSON, fallback applied.");
      aiOutput = {
        mindBalanceScore: 50,
        progressMilestone: 0.2,
        weeklyMoods: [3, 3, 3, 3, 3, 3, 3],
        risks: [{ category: "Stable", score: 20, message: text.slice(0, 100) }],
        suggestion: "Keep maintaining your emotional balance! 💪",
      };
    }

    // 5️⃣ Save analysis in DB
    const saved = await AiAnalysis.create({ user: userId, ...aiOutput });

    // 6️⃣ Return the saved record to frontend
    res.json(saved);
  } catch (err) {
    console.error("❌ AI analysis failed:", err);
    res.status(500).json({ message: "AI risk analysis failed" });
  }
});

export default router;
