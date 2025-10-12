// backend/utils/sentimentAnalyzer.js
import fetch from "node-fetch";

// 🎯 Using Hugging Face Emotion Model
const HF_MODEL = "j-hartmann/emotion-english-distilroberta-base"; // Example
const HF_TOKEN = process.env.HF_TOKEN; // store your key in .env

export async function analyzeEmotion(text) {
  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });

    const data = await res.json();
    if (Array.isArray(data) && data[0]?.length > 0) {
      const best = data[0].reduce((a, b) => (a.score > b.score ? a : b));
      return best.label;
    }
    return "Neutral";
  } catch (err) {
    console.error("⚠️ Emotion Analysis Failed:", err);
    return "Neutral";
  }
}
