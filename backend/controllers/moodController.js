// // backend/controllers/moodController.js
// import Mood from "../models/Mood.js";

// // ➕ Add mood
// export const addMood = async (req, res) => {
//   try {
//     const { emoji, note } = req.body;

//     if (!emoji) {
//       return res.status(400).json({ message: "Emoji is required" });
//     }

//     const mood = await Mood.create({
//       userId: req.user._id,
//       emoji,
//       note: note || "",
//     });

//     res.status(201).json(mood);
//   } catch (err) {
//     console.error("Add mood error:", err);
//     res.status(500).json({ message: "Failed to add mood", error: err.message });
//   }
// };

// // 📥 Get moods
// export const getMoods = async (req, res) => {
//   try {
//     const moods = await Mood.find({ userId: req.user._id }).sort({ createdAt: -1 });
//     res.json(moods);
//   } catch (err) {
//     console.error("Get moods error:", err);
//     res.status(500).json({ message: "Failed to fetch moods", error: err.message });
//   }
// };

// // ❌ Delete mood
// export const deleteMood = async (req, res) => {
//   try {
//     const deleted = await Mood.findOneAndDelete({
//       _id: req.params.id,
//       userId: req.user._id,
//     });

//     if (!deleted) {
//       return res.status(404).json({ message: "Mood not found" });
//     }

//     res.json({ message: "Mood deleted" });
//   } catch (err) {
//     console.error("Delete mood error:", err);
//     res.status(500).json({ message: "Failed to delete mood", error: err.message });
//   }
// };
// backend/controllers/moodController.js
import Mood from "../models/Mood.js";

// ➕ Add mood
export const addMood = async (req, res) => {
  try {
    const { emoji, note } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const mood = await Mood.create({
      userId: req.user._id,
      emoji,
      note: note || "",
    });

    res.status(201).json(mood);
  } catch (err) {
    console.error("Add mood error:", err);
    res.status(500).json({ message: "Failed to add mood", error: err.message });
  }
};

// 📥 Get moods
export const getMoods = async (req, res) => {
  try {
    const moods = await Mood.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(moods);
  } catch (err) {
    console.error("Get moods error:", err);
    res.status(500).json({ message: "Failed to fetch moods", error: err.message });
  }
};

// 📝 Update mood
export const updateMood = async (req, res) => {
  try {
    const { emoji, note } = req.body;

    const mood = await Mood.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { emoji, note },
      { new: true }
    );

    if (!mood) {
      return res.status(404).json({ message: "Mood not found" });
    }

    res.json(mood);
  } catch (err) {
    console.error("Update mood error:", err);
    res.status(500).json({ message: "Failed to update mood", error: err.message });
  }
};

// ❌ Delete mood
export const deleteMood = async (req, res) => {
  try {
    const deleted = await Mood.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Mood not found" });
    }

    res.json({ message: "Mood deleted" });
  } catch (err) {
    console.error("Delete mood error:", err);
    res.status(500).json({ message: "Failed to delete mood", error: err.message });
  }
};
