// backend/models/Meditation.js
import mongoose from "mongoose";

const meditationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    duration: { type: Number, required: true }, // in minutes
    moodBefore: { type: String, default: "Neutral" },
    moodAfter: { type: String, default: "Relaxed" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Meditation", meditationSchema);
