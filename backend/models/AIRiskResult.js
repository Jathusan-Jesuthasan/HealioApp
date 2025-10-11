import mongoose from "mongoose";

const AIRiskResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    wellnessIndex: Number, // numeric version of mindBalanceScore
    riskLevel: String,     // e.g., "LOW", "MODERATE", "SERIOUS"
    summary: String,       // one-line analysis message
    suggestions: [String], // multiple short actionable tips
    date: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  }
);

const AIRiskResult =
  mongoose.models.AIRiskResult ||
  mongoose.model("AIRiskResult", AIRiskResultSchema);

export default AIRiskResult;
