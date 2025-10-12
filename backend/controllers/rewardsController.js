import Activity from "../models/Activity.js";

export const getRewards = async (req, res) => {
  try {
    const { userId } = req.params;
    const activities = await Activity.find({ userId });

    if (!activities.length) {
      return res.json({ totalMinutes: 0, xp: 0, badge: "None" });
    }

    const totalMinutes = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const xp = totalMinutes;
    let badge = "Bronze";
    if (xp > 200) badge = "Silver";
    if (xp > 500) badge = "Gold";

    res.json({ totalMinutes, xp, badge });
  } catch (err) {
    console.error("Rewards API error:", err);
    res.status(500).json({ message: "Failed to load rewards" });
  }
};
