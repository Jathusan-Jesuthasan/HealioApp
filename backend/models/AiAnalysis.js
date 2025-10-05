import mongoose from "mongoose";

const aiAnalysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mindBalanceScore: Number,
  progressMilestone: Number,
  weeklyMoods: [Number],
  risks: [
    {
      category: String,
      score: Number,
      message: String,
    },
  ],
  suggestion: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("AiAnalysis", aiAnalysisSchema);
