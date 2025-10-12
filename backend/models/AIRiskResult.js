// backend/models/AIRiskResult.js
import mongoose from "mongoose";

const AIRiskResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wellnessIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: [
        "LOW",
        "MODERATE",
        "SERIOUS",
        "STRESS",
        "ANGER",
        "ANXIETY",
        "TIREDNESS",
        "MIXED",
      ],
      default: "LOW",
    },
    summary: {
      type: String,
      default: "No summary generated yet.",
      trim: true,
    },
    suggestions: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      default: "Hybrid AI Engine (Gemini + OpenAI)",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const AIRiskResult =
  mongoose.models.AIRiskResult ||
  mongoose.model("AIRiskResult", AIRiskResultSchema);

export default AIRiskResult;
