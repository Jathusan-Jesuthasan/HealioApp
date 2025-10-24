// backend/routes/aiRoutes.js
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

router.post("/generate-message", async (req, res) => {
  try {
    const { text, emotion } = req.body;
    if (!text || !emotion)
      return res.status(400).json({ message: "Missing text or emotion field" });

    // ✅ Use the correct model name
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest", // 👈 ensures proper API endpoint
    });

    const tonePrompts = [
      "Make it warm and friendly.",
      "Make it gentle and reassuring.",
      "Make it sound motivational.",
      "Make it calm and comforting.",
    ];
    const randomTone = tonePrompts[Math.floor(Math.random() * tonePrompts.length)];

    const prompt = `
You are Healio — a compassionate AI for youth mental wellness.
User wrote: "${text}"
Detected emotion: "${emotion}"

${randomTone}
Write ONE short, original, emotionally aligned message under 20 words.
Avoid generic lines like "Stay positive".

Examples:
- Happy → "🌈 Keep shining — your joy spreads warmth everywhere!"
- Sad → "💙 It's okay to slow down — your feelings are valid."
- Angry → "🔥 Take a deep breath — peace always returns."
- Tired → "😴 Rest easy — you’ve done enough for today."
- Neutral → "🌤️ Balance is strength — cherish this calm moment."

Now write one new supportive message:
`;

    const result = await model.generateContent(prompt);
    const message =
      result?.response?.text()?.trim() ||
      "💚 Keep going — you’re doing great!";

    console.log("🧩 Gemini generated:", message);
    res.status(200).json({ message });
  } catch (error) {
    console.error("🧠 Gemini API Error:", error.message);
    const emotion = req.body?.emotion || "Neutral";
    const fallbackMessages = {
      Happy: "🌈 Keep shining — your positivity brightens others!",
      Sad: "💙 It’s okay to slow down — you’re growing through it.",
      Angry: "🔥 Pause and breathe — calm brings power.",
      Tired: "😴 Rest deeply — tomorrow’s a new start.",
      Neutral: "🌤️ You’re steady, and that’s strength too.",
    };
    res.status(200).json({
      message:
        fallbackMessages[emotion] ||
        "💡 Stay positive — every day is a new chance!",
    });
  }
});

export default router;
