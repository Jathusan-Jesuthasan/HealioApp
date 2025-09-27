// backend/models/MoodLog.js
import mongoose from "mongoose";

const moodLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",           // references User model
      required: true,
    },
    mood: {
      type: String,
      enum: ["Happy", "Neutral", "Sad", "Angry", "Tired"], // allowed moods
      required: true,
    },
    factors: {
      type: [String],        // array of strings
      default: [],
    },
    journal: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,        // auto add createdAt & updatedAt
    versionKey: false,       // removes "__v" from docs
  }
);

// ✅ Prevent model overwrite on hot-reload in dev
const MoodLog = mongoose.models.MoodLog || mongoose.model("MoodLog", moodLogSchema);

export default MoodLog;
