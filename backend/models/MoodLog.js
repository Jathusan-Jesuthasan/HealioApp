// backend/models/MoodLog.js
import mongoose from "mongoose";

const moodLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mood: { type: String, required: true },
    factors: { type: [String], default: [] },
    journal: { type: String, default: "" },
    sentiment: { type: String, default: "Neutral" },
    confidence: { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("MoodLog", moodLogSchema);
