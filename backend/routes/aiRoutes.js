// backend/routes/aiRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import MoodLog from "../models/MoodLog.js";
import AiAnalysis from "../models/AiAnalysis.js";
import AIRiskResult from "../models/AIRiskResult.js";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* ✅ Utility: Initialize OpenAI + Gemini                                     */
/* -------------------------------------------------------------------------- */
const getOpenAIClient = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY in .env");
  return new OpenAI({ apiKey: key });
};

const getGeminiClient = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY in .env");
  return new GoogleGenerativeAI(key);
};

/* -------------------------------------------------------------------------- */
/* 🧩 Prompt Template                                                         */
/* -------------------------------------------------------------------------- */
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
  "mindBalanceScore": number (0–100),
  "progressMilestone": number (0–1),
  "weeklyMoods": [1–5],
  "risks": [
    {
      "category": "Stress | Depression | Anxiety | Burnout | Stable",
      "score": number (0–100),
      "message": "Short reason — based on repeated low moods, tiredness, anger, or negative factors"
    }
  ],
  "suggestion": "Friendly motivational message (1–2 sentences). Youthful, empathetic tone."
}
`;

/* -------------------------------------------------------------------------- */
/* ✅ Route: Get AI Analysis History                                          */
/* -------------------------------------------------------------------------- */
router.get("/risk-history", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await AIRiskResult.find({ user: userId }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    console.error("❌ Error fetching AI analysis history:", err);
    res.status(500).json({ message: "Failed to fetch AI analysis history" });
  }
});

/* -------------------------------------------------------------------------- */
/* ✅ Route: Perform AI Risk Analysis (Hybrid Fail-over)                      */
/* -------------------------------------------------------------------------- */
router.post("/risk-analysis", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // 🔹 1️⃣ Fetch user mood logs (last 30 days)
    const moodLogs = await MoodLog.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 });

    if (moodLogs.length === 0) {
      return res.json({ message: "No recent mood logs to analyze." });
    }

    // 🔹 2️⃣ Build input prompt
    const logsText = moodLogs
      .map(
        (l) =>
          `Mood: ${l.mood}, Factors: ${l.factors.join(", ")}, Journal: ${l.journal || "N/A"}`
      )
      .join("\n");
    const fullPrompt = `${PROMPT_TEMPLATE}\nLogs:\n${logsText}`;

    let aiOutput;
    let aiSource = "OpenAI";

    // 🔹 3️⃣ Try OpenAI first
    try {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: fullPrompt }],
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0].message.content?.trim() || "{}";
      aiOutput = JSON.parse(text);
      console.log("✅ OpenAI response successful");
    } catch (err) {
      // ⚠️ If OpenAI fails → switch to Gemini
      console.warn("⚠️ OpenAI failed:", err.message || err);
      aiSource = "Gemini";
      try {
        const gemini = getGeminiClient();
        const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(fullPrompt);

        // 🩹 Fix: sanitize Gemini output to remove ```json fences
        const text = result.response.text();
        const cleanText = text
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        aiOutput = JSON.parse(cleanText);
        console.log("✅ Gemini fallback response successful");
      } catch (gErr) {
        console.error("❌ Gemini also failed:", gErr.message || gErr);
        throw new Error("Both AI models failed to generate a response");
      }
    }

    // 🔹 4️⃣ Validate and normalize output
    if (!aiOutput.mindBalanceScore) aiOutput.mindBalanceScore = 60;
    if (!aiOutput.risks || !Array.isArray(aiOutput.risks)) {
      aiOutput.risks = [
        { category: "Stable", score: 10, message: "Default stable output." },
      ];
    }
    if (!aiOutput.suggestion) {
      aiOutput.suggestion = "Keep focusing on small wins and self-care 🌿";
    }

    // 🔹 5️⃣ Save detailed and summary records
    const saved = await AiAnalysis.create({ user: userId, ...aiOutput });
    await AIRiskResult.create({
      user: userId,
      wellnessIndex: aiOutput.mindBalanceScore,
      riskLevel: aiOutput.risks[0].category.toUpperCase(),
      summary: aiOutput.risks[0].message,
      suggestions: [aiOutput.suggestion],
    });

    // 🔹 6️⃣ Respond to frontend
    res.json({ ...saved.toObject(), source: aiSource });
  } catch (err) {
    console.error("❌ AI risk analysis failed:", err.message || err);
    res.status(500).json({ message: "AI risk analysis failed" });
  }
});

export default router;
