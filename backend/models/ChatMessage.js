import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    role: {
      type: String, // "user" | "bot"
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // adds createdAt, updatedAt
);

export default mongoose.model("ChatMessage", chatMessageSchema);
