// backend/models/Journal.js
import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    text: { type: String, required: true },
    mood: { type: String, default: "Neutral" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Journal", journalSchema);
