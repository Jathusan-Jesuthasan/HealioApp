// backend/controllers/journalController.js
import Journal from "../models/Journal.js";
import Activity from "../models/Activity.js";
import { analyzeEmotion } from "../utils/sentimentAnalyzer.js";

export const addJournal = async (req, res) => {
  try {
    const { userId, text, date } = req.body;
    if (!userId || !text) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🧠 Step 1: Analyze mood automatically
    const mood = await analyzeEmotion(text);

    // 📝 Step 2: Save journal
    const journal = await Journal.create({ userId, text, mood, date });

    // 💾 Step 3: Add to activity logs
    await Activity.create({
      userId,
      type: "Journal",
      name: "Journal Entry",
      duration: 0.1,
      date: date || new Date(),
      extra: { mood },
    });

    res.status(201).json({
      message: "Journal saved successfully",
      journal,
      detectedMood: mood,
    });
  } catch (err) {
    console.error("Journal Add Error:", err);
    res.status(500).json({ message: "Failed to save journal" });
  }
};
