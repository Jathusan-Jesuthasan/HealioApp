// backend/controllers/riskController.js
import AIRiskResult from "../models/AIRiskResult.js";
import User from "../models/User.js";
import { sendAutomaticRiskAlert } from "./trustedContactController.js";

/**
 * @desc   Fetch latest AI risk analyses (history) for the logged-in user
 * @route  GET /api/ai/risk-history
 * @access Private
 */
export const getRiskHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await AIRiskResult.find({ user: userId })
      .sort({ date: -1 })
      .limit(30)
      .select("wellnessIndex riskLevel summary suggestions date source");

    const formattedHistory = history.map((item) => {
      // 🧩 Safely parse date
      const parsedDate = item.date
        ? new Date(item.date).toISOString()
        : new Date().toISOString();

      return {
        _id: item._id,
        wellnessIndex:
          Number(item.wellnessIndex) && !isNaN(item.wellnessIndex)
            ? Number(item.wellnessIndex)
            : 0,
        riskLevel: item.riskLevel?.toUpperCase() || "LOW",
        summary:
          item.summary && item.summary.trim() !== ""
            ? item.summary
            : "No AI summary generated for this entry.",
        suggestions: Array.isArray(item.suggestions)
          ? item.suggestions
          : [],
        date: parsedDate,
        source: item.source || "Hybrid AI Engine",
      };
    });

    res.status(200).json(formattedHistory);
  } catch (err) {
    console.error("❌ Error fetching AI history:", err);
    res.status(500).json({ message: "Failed to fetch AI insights history." });
  }
};

/**
 * @desc   Save new AI risk analysis (after hybrid AI engine response)
 * @route  POST /api/ai/risk-analysis
 * @access Private
 */
export const saveRiskAnalysis = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      wellnessIndex = 0,
      riskLevel = "LOW",
      summary = "No summary generated.",
      suggestions = [],
      source = "Hybrid AI Engine (Gemini + OpenAI)",
    } = req.body;

    const newResult = new AIRiskResult({
      user: userId,
      wellnessIndex,
      riskLevel,
      summary,
      suggestions,
      source,
    });

    await newResult.save();

    // 🚨 Check user's alert settings before sending automatic alerts
    const user = await User.findById(userId).select('alertSettings');
    const { autoAlert, criticalOnly } = user?.alertSettings || { autoAlert: true, criticalOnly: false };

    // Define risk levels
    const criticalRiskLevels = ["SERIOUS"];
    const highRiskLevels = ["SERIOUS", "STRESS", "ANGER", "ANXIETY"];
    
    // Determine if alert should be sent based on user settings
    const shouldSendAlert = autoAlert && (
      criticalOnly 
        ? criticalRiskLevels.includes(riskLevel.toUpperCase())
        : highRiskLevels.includes(riskLevel.toUpperCase())
    );

    if (shouldSendAlert) {
      console.log(`⚠️ High risk detected (${riskLevel}) - Sending automatic alerts (criticalOnly: ${criticalOnly})...`);
      // Send alert in background (don't wait for it)
      sendAutomaticRiskAlert(userId, newResult._id).catch(err => {
        console.error("Failed to send automatic alert:", err);
      });
    } else if (highRiskLevels.includes(riskLevel.toUpperCase())) {
      console.log(`⚠️ High risk detected (${riskLevel}) - Alerts disabled by user settings (autoAlert: ${autoAlert}, criticalOnly: ${criticalOnly})`);
    }

    res.status(201).json({ message: "AI risk result saved successfully", data: newResult });
  } catch (err) {
    console.error("❌ Error saving AI risk result:", err);
    res.status(500).json({ message: "Failed to save AI risk result" });
  }
};
