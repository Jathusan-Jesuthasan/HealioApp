import Activity from "../models/Activity.js";

/* ✅ Add new activity */
export const addActivity = async (req, res) => {
  try {
    const { userId, type, name, duration, date, time } = req.body;
    console.log("📥 Received activity:", req.body);

    if (!userId || !name || !duration) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const activityType = type || "Exercise";
    const newActivity = new Activity({
      userId,
      type: activityType,
      name,
      duration,
      date,
      time,
    });

    const savedActivity = await newActivity.save();
    console.log("✅ Activity saved:", savedActivity);

    res.status(201).json({
      message: "✅ Activity saved successfully",
      data: savedActivity,
    });
  } catch (err) {
    console.error("❌ Activity save error:", err);
    res.status(500).json({ message: "Server error while saving activity" });
  }
};

/* ✅ Get all activities */
export const getActivities = async (req, res) => {
  try {
    console.log("📋 Fetching all activities...");
    const activities = await Activity.find();
    res.status(200).json(activities);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ message: "Server error while fetching activities" });
  }
};

/* ✅ Dashboard summary for user */
export const getActivityDashboard = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const activities = await Activity.find({ userId }).sort({ date: -1 });

    if (!activities.length) {
      return res.json({
        totalMinutes: 0,
        totalSessions: 0,
        streak: 0,
        lastActivity: "-",
        byType: {},
      });
    }

    // Totals
    const totalMinutes = activities.reduce((s, a) => s + (a.duration || 0), 0);
    const totalSessions = activities.length;
    const lastActivity = new Date(activities[0].date).toLocaleDateString();

    // Streak calc
    const uniqueDates = [...new Set(activities.map(a => a.date.toISOString().split("T")[0]))];
    uniqueDates.sort((a, b) => new Date(b) - new Date(a));
    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diff = (prev - curr) / (1000 * 60 * 60 * 24);
      if (diff <= 1.5) streak++;
      else break;
    }

    // Breakdown
    const byType = {};
    for (const act of activities) {
      const key = act.type || "Unknown";
      if (!byType[key]) byType[key] = { minutes: 0, sessions: 0 };
      byType[key].minutes += act.duration || 0;
      byType[key].sessions += 1;
    }

    for (const key in byType) {
      byType[key].progress = ((byType[key].minutes / totalMinutes) * 100).toFixed(1);
    }

    res.json({
      totalMinutes: totalMinutes.toFixed(1),
      totalSessions,
      streak,
      lastActivity,
      byType,
    });
  } catch (err) {
    console.error("❌ Dashboard fetch error:", err);
    res.status(500).json({ message: "Server error while fetching dashboard" });
  }
};
