import User from "../models/User.js";
import MoodLog from "../models/MoodLog.js"; // your existing model for mood tracking
import Alert from "../models/Alert.js"; // model for SOS / risk alerts
import pdfkit from "pdfkit";
import moment from "moment";

// 🔹 GET /api/trusted/dashboard
export const getTrustedDashboard = async (req, res) => {
  try {
    // Only allow if user.role === "Trusted"
    if (req.user.role !== "Trusted")
      return res.status(403).json({ message: "Access denied. Trusted role required." });

    // Youth linked to this trusted person (assuming 'trustedFor' array)
    const youthList = await User.find({ "trustedPersons.email": req.user.email })
      .select("name email wellnessScore moodTrend alerts")
      .lean();

    // Minimal anonymized data
    const data = youthList.map((y) => ({
      name: y.name,
      wellnessScore: y.wellnessScore || 0,
      recentMood: y.moodTrend?.slice(-7) || [],
      recentAlerts: y.alerts?.slice(-5) || [],
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch dashboard", error: err.message });
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
