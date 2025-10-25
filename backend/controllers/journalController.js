// backend/controllers/journalController.js
import Journal from "../models/Journal.js";
import Activity from "../models/Activity.js";
import { analyzeEmotion } from "../utils/sentimentAnalyzer.js";

/**
 * 🧠 Add a new journal entry
 * - Auto-analyzes emotion using sentiment analyzer
 * - Stores the entry in MongoDB
 * - Logs it to the activity tracker for reward/streak progress
 */
export const addJournal = async (req, res) => {
  try {
    const { userId, text, date } = req.body;

    // 🧩 Validate input
    if (!userId || !text) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🧠 Step 1: Analyze mood automatically
    const mood = await analyzeEmotion(text);

    // 📝 Step 2: Save journal entry
    const journal = await Journal.create({
      userId,
      text,
      mood,
      date: date || new Date(),
    });

    // 💾 Step 3: Log activity for progress tracking
    await Activity.create({
      userId,
      type: "Journal",
      name: "Journal Entry",
      duration: 0.1,
      date: date || new Date(),
      extra: { mood },
    });

    // ✅ Response
    res.status(201).json({
      message: "Journal saved successfully",
      journal,
      detectedMood: mood,
    });
  } catch (err) {
    console.error("❌ Journal Add Error:", err);
    res.status(500).json({ message: "Failed to save journal" });
  }
};

/**
 * 📘 Get all journals for a specific user
 * - Returns latest entries first
 */
export const getJournalsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const journals = await Journal.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Journals fetched successfully",
      count: journals.length,
      journals,
    });
  } catch (err) {
    console.error("❌ getJournalsByUser Error:", err);
    res.status(500).json({ message: "Failed to fetch journals" });
  }
};
