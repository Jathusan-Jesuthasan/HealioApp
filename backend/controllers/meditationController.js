// backend/controllers/meditationController.js
import Meditation from "../models/Meditation.js";
import Activity from "../models/Activity.js";

// 🧘 Add a new meditation session
export const addMeditation = async (req, res) => {
  try {
    const { userId, duration, moodBefore, moodAfter, date } = req.body;

    if (!userId || !duration) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Save meditation
    const meditation = await Meditation.create({
      userId,
      duration,
      moodBefore,
      moodAfter,
      date: date || new Date(),
    });

    // Log as an activity for dashboard & rewards
    await Activity.create({
      userId,
      type: "Meditation",
      name: "Meditation Session",
      duration,
      date: date || new Date(),
    });

    res.status(201).json({
      message: "Meditation saved successfully",
      meditation,
    });
  } catch (err) {
    console.error("Meditation Save Error:", err);
    res.status(500).json({ message: "Failed to save meditation" });
  }
};

// 📅 Get all meditation sessions by user
export const getMeditationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await Meditation.find({ userId }).sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    console.error("Fetch Meditation Error:", err);
    res.status(500).json({ message: "Failed to fetch meditation sessions" });
  }
};
