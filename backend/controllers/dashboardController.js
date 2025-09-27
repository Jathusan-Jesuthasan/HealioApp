import MoodLog from "../models/MoodLog.js";

/**
 * Convert mood label to numeric scale (1–5).
 * Higher = more positive.
 */
const moodToScore = (mood) => {
  switch (mood) {
    case "Happy": return 5;
    case "Neutral": return 3;
    case "Sad": return 2;
    case "Angry": return 1;
    case "Tired": return 2;
    default: return 3;
  }
};

/**
 * @desc    Get dashboard summary for user
 * @route   GET /api/dashboard?range=7d
 * @access  Private
 */
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user;
    const range = req.query.range || "7d";

    // ---- Date range ----
    let since = new Date();
    if (range.endsWith("d")) {
      const days = parseInt(range.replace("d", ""), 10) || 7;
      since.setDate(since.getDate() - days);
    } else if (range.endsWith("m")) {
      const months = parseInt(range.replace("m", ""), 10) || 1;
      since.setMonth(since.getMonth() - months);
    }

    // ---- Fetch logs ----
    const logs = await MoodLog.find({
      user: userId,
      createdAt: { $gte: since },
    }).sort({ createdAt: 1 });

    if (!logs.length) {
      return res.json({
        mindBalanceScore: 0,
        progressMilestone: 0,
        weeklyMoods: Array(7).fill(0),
        aiRiskDetected: false,
      });
    }

    // ---- Compute overall average ----
    const scores = logs.map((l) => moodToScore(l.mood));
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // ---- Weekly moods with daily averages ----
    const dailyScores = {}; // { dayIndex: [scores...] }
    logs.forEach((log) => {
      const day = new Date(log.createdAt).getDay(); // 0=Sun
      const idx = day === 0 ? 6 : day - 1; // shift → Mon=0..Sun=6
      if (!dailyScores[idx]) dailyScores[idx] = [];
      dailyScores[idx].push(moodToScore(log.mood));
    });

    const weeklyMoods = Array(7).fill(0);
    Object.keys(dailyScores).forEach((idx) => {
      const list = dailyScores[idx];
      weeklyMoods[idx] =
        list.reduce((a, b) => a + b, 0) / list.length; // average for that day
    });

    // ---- AI Risk detection (3 consecutive <3) ----
    let risk = false;
    let streak = 0;
    weeklyMoods.forEach((s) => {
      if (s > 0 && s < 3) {
        streak++;
        if (streak >= 3) risk = true;
      } else {
        streak = 0;
      }
    });

    // ---- Progress milestone ----
    const positives = logs.filter((l) => l.mood === "Happy").length;
    const progressMilestone = scores.length
      ? +(positives / scores.length).toFixed(2)
      : 0;

    // ---- Response ----
    res.json({
      mindBalanceScore: Math.round(avgScore * 20), // 0–100
      progressMilestone,
      weeklyMoods: weeklyMoods.map((s) => Math.round(s)), // round daily avg
      aiRiskDetected: risk,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error while loading dashboard" });
  }
};
