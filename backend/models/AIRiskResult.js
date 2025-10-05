import mongoose from "mongoose";

const AIRiskResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  wellnessIndex: Number,
  riskLevel: String,
  summary: String,
  suggestions: [String],
  date: { type: Date, default: Date.now },
});

export default mongoose.model("AIRiskResult", AIRiskResultSchema);
