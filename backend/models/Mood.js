import mongoose from "mongoose";

const moodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  emoji: { type: String, required: true },
  note: { type: String },
  sentiment: { type: String, default: "Neutral" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Mood", moodSchema);
