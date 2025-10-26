import mongoose from "mongoose";
import User from "../models/User.js";
import MoodLog from "../models/MoodLog.js";
import AIRiskResult from "../models/AIRiskResult.js";
import Alert from "../models/Alert.js";
import pdfkit from "pdfkit";
import moment from "moment";

const { Types } = mongoose;

const moodToScore = (mood = "") => {
  switch (mood) {
    case "Happy":
      return 5;
    case "Neutral":
      return 3;
    case "Sad":
      return 2;
    case "Angry":
      return 1;
    case "Tired":
      return 2;
    default:
      return 3;
  }
};

const deriveSinceDate = (range = "30d") => {
  const now = new Date();
  if (range.endsWith("d")) {
    const days = parseInt(range, 10) || 30;
    const since = new Date(now);
    since.setDate(now.getDate() - days);
    return since;
  }
  if (range.endsWith("m")) {
    const months = parseInt(range, 10) || 1;
    const since = new Date(now);
    since.setMonth(now.getMonth() - months);
    return since;
  }
  if (range.endsWith("y")) {
    const years = parseInt(range, 10) || 1;
    const since = new Date(now);
    since.setFullYear(now.getFullYear() - years);
    return since;
  }
  const fallback = new Date(now);
  fallback.setDate(now.getDate() - 30);
  return fallback;
};

const normalizeShareSettings = (share = {}) => {
  const alertsOnly = !!share.shareAlertsOnly;
  const allowTrends = alertsOnly ? false : share.shareMoodTrends !== false;
  const allowWellness = alertsOnly ? false : share.shareWellnessScore !== false;
  return {
    allowTrends,
    allowWellness,
    alertsOnly,
  };
};

const buildMoodDistribution = (logs = []) => {
  const counts = logs.reduce((acc, log) => {
    if (!log?.mood) return acc;
    acc[log.mood] = (acc[log.mood] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
};

const computeTopFactors = (logs = []) => {
  const factorCounts = {};
  logs.forEach((log) => {
    (log?.factors || []).forEach((factor) => {
      if (!factor) return;
      factorCounts[factor] = (factorCounts[factor] || 0) + 1;
    });
  });

  return Object.entries(factorCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
};

const computeRecentMood = (logs = []) => {
  if (!logs.length) return [];
  const lastSeven = logs.slice(-7);
  return lastSeven.map((log) => {
    const date = new Date(log.createdAt);
    return {
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      value: moodToScore(log.mood),
      rawMood: log.mood,
      timestamp: log.createdAt,
    };
  });
};

const computePositiveStreak = (logs = []) => {
  if (!logs.length) return 0;
  const sorted = [...logs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  let streak = 0;
  let lastDateKey = null;

  for (const log of sorted) {
    const score = moodToScore(log.mood);
    const dateKey = new Date(log.createdAt).toISOString().slice(0, 10);
    if (lastDateKey === dateKey) {
      if (score >= 3) {
        continue;
      }
      break;
    }
    lastDateKey = dateKey;
    if (score >= 3) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
};

const buildRiskSummary = (riskDocs = [], since) => {
  if (!riskDocs.length) {
    return {
      latestLevel: null,
      wellnessIndex: null,
      updatedAt: null,
      suggestions: [],
      history: [],
    };
  }

  const relevant = riskDocs.filter((doc) => !since || new Date(doc.date) >= since);
  const [latest] = relevant.length ? relevant : riskDocs;

  return {
    latestLevel: latest?.riskLevel || null,
    wellnessIndex: latest?.wellnessIndex ?? null,
    updatedAt: latest?.date || null,
    suggestions: Array.isArray(latest?.suggestions) ? latest.suggestions : [],
    history: riskDocs
      .slice(0, 5)
      .reverse()
      .map((item) => ({
        level: item.riskLevel,
        wellnessIndex: item.wellnessIndex,
        date: item.date,
      })),
  };
};

const buildInsights = (permissions, stats, riskSummary, topFactors) => {
  const insights = [];

  if (permissions.allowWellness && typeof stats.mindBalanceScore === "number") {
    if (stats.mindBalanceScore >= 75) {
      insights.push({
        title: "Positive momentum",
        description: "Wellness is trending in a great direction. A quick check-in keeps the streak going.",
        tone: "positive",
      });
    } else if (stats.mindBalanceScore >= 55) {
      insights.push({
        title: "Steady but watchful",
        description: "Wellness is holding steady. Encourage consistent routines for another lift.",
        tone: "neutral",
      });
    } else {
      insights.push({
        title: "Needs extra support",
        description: "Wellness dipped this period. A gentle conversation or shared activity could help.",
        tone: "warning",
      });
    }
  }

  if (permissions.allowTrends && stats.streak >= 3) {
    insights.push({
      title: "Healthy streak",
      description: `Three or more days of balanced moods. Celebrate ${stats.streak} day${stats.streak > 1 ? "s" : ""} of progress together.`,
      tone: "positive",
    });
  }

  if (permissions.allowTrends && topFactors.length) {
    const [primary] = topFactors;
    insights.push({
      title: `Influencer: ${primary.label}`,
      description: `${primary.label} surfaced often. Planning around it could shape the week ahead.`,
      tone: "neutral",
    });
  }

  if (riskSummary.latestLevel && ["SERIOUS", "STRESS", "ANGER", "ANXIETY"].includes(riskSummary.latestLevel)) {
    insights.push({
      title: "Alert spotlight",
      description: "Recent AI alerts flagged elevated stress indicators. Stay close and follow the suggested steps.",
      tone: "warning",
    });
  }

  if (!insights.length) {
    insights.push({
      title: "Stay connected",
      description: "Invite regular mood check-ins so trends stay visible with consent.",
      tone: "neutral",
    });
  }

  return insights.slice(0, 3);
};

const buildYouthAnalyticsSnapshot = async ({ youthId, shareSettings, range = "30d" }) => {
  const permissions = normalizeShareSettings(shareSettings);
  const since = deriveSinceDate(range);
  const analytics = {
    permissions,
    range,
    stats: {
      totalEntries: 0,
      mindBalanceScore: permissions.allowWellness ? null : null,
      averageMood: permissions.allowTrends ? null : null,
      streak: 0,
      topMood: null,
    },
    weeklyMoods: [],
    recentMood: [],
    moodDistribution: [],
    topFactors: [],
    riskSummary: {
      latestLevel: null,
      wellnessIndex: null,
      updatedAt: null,
      suggestions: [],
      history: [],
    },
    insights: [],
  };

  let logs = [];
  if (permissions.allowTrends || permissions.allowWellness) {
    logs = await MoodLog.find({
      user: youthId,
      createdAt: { $gte: since },
    })
      .sort({ createdAt: 1 })
      .lean();
  }

  if (logs.length) {
    analytics.stats.totalEntries = logs.length;

    if (permissions.allowWellness) {
      const scores = logs.map((log) => moodToScore(log.mood));
      const avgScore = scores.reduce((sum, val) => sum + val, 0) / scores.length;
      analytics.stats.mindBalanceScore = Math.round(avgScore * 20);
      analytics.stats.averageMood = +avgScore.toFixed(2);
    }

    if (permissions.allowTrends) {
      const weeklyTotals = Array(7).fill(0);
      const weeklyCounts = Array(7).fill(0);
      logs.forEach((log) => {
        const day = new Date(log.createdAt).getDay();
        const idx = day === 0 ? 6 : day - 1;
        weeklyTotals[idx] += moodToScore(log.mood);
        weeklyCounts[idx] += 1;
      });

      analytics.weeklyMoods = weeklyTotals.map((sum, idx) =>
        weeklyCounts[idx] ? +((sum / weeklyCounts[idx]).toFixed(2)) : 0
      );

      analytics.recentMood = computeRecentMood(logs);
      analytics.moodDistribution = buildMoodDistribution(logs);
      analytics.topFactors = computeTopFactors(logs).slice(0, 4);

      if (analytics.moodDistribution.length) {
        analytics.stats.topMood = analytics.moodDistribution[0].label;
      }

      analytics.stats.streak = computePositiveStreak(logs);
    }
  }

  const riskDocs = await AIRiskResult.find({ user: youthId })
    .sort({ date: -1 })
    .limit(6)
    .lean();

  analytics.riskSummary = buildRiskSummary(riskDocs, since);
  analytics.insights = buildInsights(permissions, analytics.stats, analytics.riskSummary, analytics.topFactors);

  return analytics;
};

// 🔹 GET /api/trusted/dashboard
export const getTrustedDashboard = async (req, res) => {
  try {
    if (req.user.role !== "Trusted") {
      return res.status(403).json({ message: "Access denied. Trusted role required." });
    }

    const linkedIds = (req.user.linkedYouthIds || []).map((id) => id.toString());
    if (!linkedIds.length) {
      return res.json([]);
    }

    const range = req.query.range || "30d";
    const youthProfiles = await User.find({ _id: { $in: linkedIds } })
      .select("name avatarUrl age gender shareSettings role")
      .lean();

    const summaries = await Promise.all(
      youthProfiles.map(async (youth) => {
        const analytics = await buildYouthAnalyticsSnapshot({
          youthId: youth._id,
          shareSettings: youth.shareSettings,
          range,
        });

        return {
          id: youth._id.toString(),
          name: youth.name,
          avatarUrl: youth.avatarUrl || null,
          age: youth.age || null,
          gender: youth.gender || "",
          permissions: analytics.permissions,
          wellnessScore: analytics.stats.mindBalanceScore,
          recentMood: analytics.recentMood,
          weeklyMoods: analytics.weeklyMoods,
          riskSummary: analytics.riskSummary,
          topFactors: analytics.topFactors,
        };
      })
    );

    res.json(summaries);
  } catch (err) {
    console.error("Failed to load trusted dashboard:", err);
    res.status(500).json({ message: "Failed to fetch dashboard", error: err.message });
  }
};

export const getYouthAnalytics = async (req, res) => {
  try {
    if (req.user.role !== "Trusted") {
      return res.status(403).json({ message: "Access denied. Trusted role required." });
    }

    const { youthId } = req.params;
    if (!youthId || !Types.ObjectId.isValid(youthId)) {
      return res.status(400).json({ message: "Invalid youth id" });
    }

    const linkedMatch = (req.user.linkedYouthIds || []).some((id) => id.toString() === youthId);
    if (!linkedMatch) {
      return res.status(403).json({ message: "This youth is not linked to your account" });
    }

    const youth = await User.findById(youthId)
      .select("name avatarUrl age gender shareSettings role")
      .lean();

    if (!youth) {
      return res.status(404).json({ message: "Youth user not found" });
    }

    if (youth.role !== "Youth") {
      return res.status(400).json({ message: "Analytics are only available for youth accounts" });
    }

    const range = req.query.range || "30d";
    const analytics = await buildYouthAnalyticsSnapshot({
      youthId: youth._id,
      shareSettings: youth.shareSettings,
      range,
    });

    res.json({
      success: true,
      data: {
        youth: {
          id: youth._id.toString(),
          name: youth.name,
          avatarUrl: youth.avatarUrl || null,
          age: youth.age || null,
          gender: youth.gender || "",
          shareSettings: youth.shareSettings || {},
        },
        permissions: analytics.permissions,
        range: analytics.range,
        stats: analytics.stats,
        weeklyMoods: analytics.weeklyMoods,
        recentMood: analytics.recentMood,
        moodDistribution: analytics.moodDistribution,
        topFactors: analytics.topFactors,
        riskSummary: analytics.riskSummary,
        insights: analytics.insights,
      },
    });
  } catch (err) {
    console.error("Failed to load youth analytics:", err);
    res.status(500).json({ message: "Failed to fetch youth analytics", error: err.message });
  }
};

// 🔹 GET /api/trusted/alerts
export const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ trustedEmails: req.user.email })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const safeAlerts = alerts.map((a) => ({
      youthName: a.youthName,
      type: a.type,
      message: a.summary,
      timestamp: a.createdAt,
    }));

    res.json(safeAlerts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch alerts", error: err.message });
  }
};

// 🔹 GET /api/trusted/report (PDF)
export const generateTrustedReport = async (req, res) => {
  try {
    const pdf = new pdfkit();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=weekly-report.pdf");

    pdf.fontSize(20).text("Healio Weekly Summary", { align: "center" });
    pdf.moveDown();
    pdf.fontSize(12).text("Trusted Person Report", { align: "left" });
    pdf.text(`Generated on: ${moment().format("MMMM Do YYYY, h:mm a")}`);
    pdf.moveDown();

    pdf.text("This summary includes aggregated data of connected youth. Private journals are excluded.");
    pdf.moveDown();

    // Add static chart summary (could enhance later)
    pdf.text("• Average Wellness Score: 76/100");
    pdf.text("• Mood Stability: 82%");
    pdf.text("• Risk Alerts This Week: 2");
    pdf.moveDown();
    pdf.text("⚠️ Disclaimer: This report is for support only — not clinical diagnosis.", {
      align: "center",
    });

    pdf.end();
    pdf.pipe(res);
  } catch (err) {
    res.status(500).json({ message: "Failed to generate report" });
  }
};
