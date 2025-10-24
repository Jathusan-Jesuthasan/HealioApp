import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Either plaintext body or encryptedBody (client can encrypt with shared key)
    body: { type: String },
    encryptedBody: { type: String },
    type: { type: String, enum: ["text", "image", "audio", "mood-summary"], default: "text" },
    mediaUrl: { type: String }, // S3/Cloudinary later
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
