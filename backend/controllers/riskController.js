// backend/controllers/riskController.js
import MoodLog from "../models/MoodLog.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getRiskAnalysis = async (req, res) => {
  try {
    const logs = await MoodLog.find({ user: req.user }).sort({ createdAt: -1 }).limit(20);

    const prompt = `
      You are a mental health risk detector. Based on these mood logs, detect possible risks:
      ${logs.map(l => `Mood: ${l.mood}, Factors: ${l.factors.join(",")}, Journal: ${l.journal}`).join("\n")}
      Respond with:
      - A short summary (2–3 sentences)
      - A list of key factors influencing risk
      - Mark if the user is "At Risk" or "Stable"
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ summary: text, factors: logs.map(l => l.factors).flat() });
  } catch (err) {
    console.error("AI Risk Detection error:", err);
    res.status(500).json({ message: "Failed AI risk analysis" });
  }
};
