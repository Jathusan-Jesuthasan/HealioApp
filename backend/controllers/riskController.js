// GET /api/ai/risk-history
import AIRiskResult from "../models/AIRiskResult.js"; // new model

export const getRiskHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await AIRiskResult.find({ user: userId })
      .sort({ date: -1 })
      .limit(30);
    res.json(history);
  } catch (err) {
    console.error("Error fetching AI history:", err);
    res.status(500).json({ message: "Failed to fetch AI history" });
  }
};
