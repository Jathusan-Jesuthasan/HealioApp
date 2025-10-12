// backend/models/Goal.js
import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    sessionsPerWeek: { type: Number, default: 0 },
    minutesPerDay: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Goal = mongoose.models.Goal || mongoose.model("Goal", goalSchema);
export default Goal;
