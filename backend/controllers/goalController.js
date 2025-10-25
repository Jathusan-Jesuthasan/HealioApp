import Goal from "../models/Goal.js";

// ✅ Add new goal
export const addGoal = async (req, res) => {
  try {
    const { userId, sessionsPerWeek, minutesPerDay } = req.body;

    const goal = await Goal.findOneAndUpdate(
      { userId },
      { sessionsPerWeek, minutesPerDay },
      { upsert: true, new: true }
    );

    res.status(200).json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get goal by user ID
export const getGoalByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const goal = await Goal.findOne({ userId });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.status(200).json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
