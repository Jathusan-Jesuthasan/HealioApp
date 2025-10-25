// backend/models/Activity.js
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    type: { type: String, required: true, enum: ["Exercise", "Meditation", "Journal"] },
    name: { type: String, required: true },
    duration: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    moodBefore: { type: String },
    moodAfter: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);
