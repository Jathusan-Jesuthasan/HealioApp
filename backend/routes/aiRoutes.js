import express from "express";
import protect from "../middleware/authMiddleware.js";
import MoodLog from "../models/MoodLog.js";
import AiAnalysis from "../models/AiAnalysis.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get AI analysis history for the authenticated user
router.get("/risk-history", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await AiAnalysis.find({ user: userId })
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    console.error("❌ Error fetching AI analysis history:", err);
    res.status(500).json({ message: "Failed to fetch AI analysis history" });
  }
});

const PROMPT_TEMPLATE = `
You are an AI mental wellness assistant for a youth-focused app called Healio.

Analyze the following user mood logs and detect early emotional changes or risk patterns.  
Focus on *trends*, not just individual moods — even mild shifts matter.

Each log includes:
- mood: one of ["Happy", "Neutral", "Sad", "Angry", "Tired"]
- factors: a list of relevant tags (e.g., "Work", "Health", "Friends")
- journal: short free-text describing their day
- createdAt: timestamp

---
🔍 Your task:
1. Identify emotional trends in the last few days (e.g., improvement, decline, stress buildup).
2. Detect early risks (like stress, burnout, anxiety, sadness) — even if mixed moods appear.
3. Quantify the overall balance of positive vs. negative moods.

---
📊 Respond strictly in valid JSON with this exact structure (no markdown, no explanations):

{
  "mindBalanceScore": number (0–100),       // overall mental wellness; higher = healthier
  "progressMilestone": number (0–1),        // how much emotional improvement is visible compared to previous days
  "weeklyMoods": [1–5],                     // numeric mood scale for recent logs (1=low, 5=high)
  "risks": [
    {
      "category": "Stress | Depression | Anxiety | Burnout | Stable",
      "score": number (0–100),
      "message": "Short reason — based on repeated low moods, tiredness, anger, or negative factors"
    }
  ],
  "suggestion": "Friendly motivational message (1–2 sentences). Youthful, empathetic tone."
}

---
💡 Guidelines:
- “Happy” = 5, “Neutral” = 3, “Sad” = 2, “Angry/Tired” = 1–2.
- Repeated low moods or stress-related factors (“Work”, “Health”) → higher risk.
- If user improves (e.g., from Sad → Happy), show positive progressMilestone.
- If user fluctuates between moods, identify it as potential emotional imbalance.
- Avoid medical or diagnostic terms — sound like a caring, supportive friend.
- Always produce JSON, never extra text.

Example Input Logs:
Mood: Sad, Factors: Health, Journal: Felt unwell and anxious  
Mood: Angry, Factors: Work, Journal: Frustrated with deadlines  
Mood: Tired, Factors: Sleep, Journal: Slept late again  
Mood: Happy, Factors: Friends, Journal: Had a good evening with friends  

Example Output:
{
  "mindBalanceScore": 55,
  "progressMilestone": 0.45,
  "weeklyMoods": [2, 2, 2, 4],
  "risks": [
    {
      "category": "Stress",
      "score": 68,
      "message": "Recent frustration and tiredness suggest stress buildup, though mood is improving."
    }
  ],
  "suggestion": "Looks like you’re slowly regaining balance — keep resting well and enjoy small moments 🌿"
}
`;


router.post("/risk-analysis", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Fetch last 4 days of logs
    const moodLogs = await MoodLog.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log("[Gemini raw response]", text);

    // 4️⃣ Parse JSON safely
    let aiOutput;
    try {
      aiOutput = JSON.parse(text);
    } catch {
      console.warn("⚠️ AI output not JSON, fallback applied.");
      aiOutput = {
        mindBalanceScore: 60,
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
