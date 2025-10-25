// controllers/emotionController.js (updated)
import { classifyText } from "../services/hfClient.js";

const HAPPY = new Set([
  "joy", "amusement", "excitement", "gratitude", "love",
  "optimism", "pride", "relief", "approval", "admiration", "caring", "desire"
]);
const ANGRY = new Set(["anger", "annoyance", "disgust", "disapproval"]);
const SAD = new Set(["sadness", "grief", "disappointment", "remorse", "embarrassment"]);
const NEUTR = new Set(["neutral", "realization", "surprise", "curiosity", "confusion", "approval"]);
const FEAR = new Set(["fear", "nervousness"]);

function lexTired(text = "") {
  return /\b(tired|exhaust(ed|ion)?|sleepy|fatigue(d)?|drained|burn(\s)?out|weary)\b/i.test(text);
}

function mapToAppMood(topLabel, userText) {
  if (lexTired(userText)) return "Tired";
  if (HAPPY.has(topLabel)) return "Happy";
  if (ANGRY.has(topLabel)) return "Angry";
  if (SAD.has(topLabel)) return "Sad";
  if (FEAR.has(topLabel)) return "Neutral"; // you can expand later
  return "Neutral";
}

export async function analyzeEmotion(req, res) {
  try {
    const text = (req.body?.text || "").slice(0, 2000);
    const modelId = process.env.HF_MODEL || "SamLowe/roberta-base-go_emotions";
    const hfToken = process.env.HF_TOKEN;

    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const scores = await classifyText({ text, modelId, hfToken });
    const flatScores = Array.isArray(scores[0]) ? scores[0] : scores;

    if (!flatScores.length) {
      console.warn("⚠️ No scores received from HF.");
      return res.status(503).json({ message: "Model not ready. Try again." });
    }

    const top = flatScores.reduce((a, b) => (b.score > a.score ? b : a));
    const appMood = mapToAppMood(top.label?.toLowerCase(), text);

    console.log(`✅ Top emotion: ${top.label} (${(top.score * 100).toFixed(1)}%) → ${appMood}`);

    return res.json({
      emotion: top.label,
      confidence: top.score,
      mappedMood: appMood,
      all: flatScores,
    });
  } catch (err) {
    console.error("analyzeEmotion error:", err.message);
    return res.status(500).json({
      message: "Emotion analysis failed",
      error: err.message,
    });
  }
}
 