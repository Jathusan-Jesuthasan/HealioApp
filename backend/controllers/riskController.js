// backend/controllers/riskController.js
import AIRiskResult from "../models/AIRiskResult.js";

/**
 * @desc   Fetch latest AI risk analyses (history) for the logged-in user
 * @route  GET /api/ai/risk-history
 * @access Private
 */
export const getRiskHistory = async (req, res) => {
  try {
    const userId = req.user.id;

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
    const userId = req.user.id;
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
    res.status(201).json({ message: "AI risk result saved successfully", data: newResult });
  } catch (err) {
    console.error("❌ Error saving AI risk result:", err);
    res.status(500).json({ message: "Failed to save AI risk result" });
  }
};
