import Activity from "../models/Activity.js";

export const getRewards = async (req, res) => {
  try {
    const { userId } = req.params;
    const activities = await Activity.find({ userId });

    if (!activities.length) {
      return res.json({
        totalMinutes: 0,
        totalSessions: 0,
        streakDays: 0,
        xp: 0,
        badge: "None",
      });
    }

    // 🕐 Total minutes
    const totalMinutes = activities.reduce((sum, a) => sum + (a.duration || 0), 0);

    // ⚙️ XP logic (same as minutes for now)
    const xp = totalMinutes;

    // 🧮 Total sessions
    const totalSessions = activities.length;

    // 🔥 Calculate streak days (based on consecutive activity days)
    const sortedDates = [...new Set(activities.map(a => new Date(a.date).toDateString()))].sort(
      (a, b) => new Date(a) - new Date(b)
    );

    let streakDays = 1;
    let maxStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const current = new Date(sortedDates[i]);
      const diff = (current - prev) / (1000 * 60 * 60 * 24); // difference in days

      if (diff === 1) {
        streakDays++;
        if (streakDays > maxStreak) maxStreak = streakDays;
      } else {
        streakDays = 1;
      }
    }

    // 🥇 Badge logic
    let badge = "Bronze";
    if (xp > 200) badge = "Silver";
    if (xp > 500) badge = "Gold";
    if (xp > 1000) badge = "Platinum";

    res.json({
      totalMinutes,
      totalSessions,
      streakDays: maxStreak,
      xp,
      badge,
    });
  } catch (err) {
    console.error("Rewards API error:", err);
    res.status(500).json({ message: "Failed to load rewards" });
  }
};
