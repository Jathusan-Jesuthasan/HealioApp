import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

export async function generateSmartMessage(userText, emotion) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are Healio, a friendly AI wellness companion.
Generate one short, supportive, and creative message that fits the user's emotion and context.
Use emojis that match the mood, and never repeat the same wording twice.
User emotion: ${emotion}
User said: "${userText}"
`;

    const result = await model.generateContent(prompt);
    const message = result.response.text().trim();

    return message;
  } catch (error) {
    console.error("Gemini generation error:", error);
    return "💡 Stay positive — every day is a new chance!";
  }
}
