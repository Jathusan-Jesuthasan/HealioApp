import Activity from "../models/Activity.js";

export const getActivityDashboard = async (req, res) => {
  try {
    const { userId } = req.params;

    const activities = await Activity.find({ userId }).sort({ date: -1 });

    const totalMinutes = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const totalSessions = activities.length;
    const lastActivity = activities[0] ? activities[0].name : "None";
    const streak = calculateStreak(activities);

    res.json({
      totalMinutes,
      totalSessions,
      lastActivity,
      streak,
      recent: activities.slice(0, 10),
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};

function calculateStreak(activities) {
  if (!activities.length) return 0;
  let streak = 1;
  let prev = new Date(activities[0].date);
  for (let i = 1; i < activities.length; i++) {
    const current = new Date(activities[i].date);
    const diff = (prev - current) / (1000 * 60 * 60 * 24);
    if (diff <= 1.5) streak++;
    else break;
    prev = current;
  }
  return streak;
}
