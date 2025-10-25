import mongoose from "mongoose";

const aiAnalysisSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true, // adds createdAt + updatedAt
    versionKey: false,
  }
);

// prevent model overwrite in hot reload
const AiAnalysis =
  mongoose.models.AiAnalysis || mongoose.model("AiAnalysis", aiAnalysisSchema);

export default AiAnalysis;
