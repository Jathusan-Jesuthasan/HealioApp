import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    authorRole: { type: String, enum: ["Youth", "Trusted"], required: true },
    message: { type: String, required: true },
    anonymous: { type: Boolean, default: true },
    likes: { type: Number, default: 0 },
    reported: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const communityPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    authorRole: { type: String, enum: ["Youth", "Trusted"], required: true },
    anonymous: { type: Boolean, default: true },
    likes: { type: Number, default: 0 },
    flagged: { type: Boolean, default: false },
    approved: { type: Boolean, default: true },
    replies: [replySchema],
    tags: [String],
  },
  { timestamps: true }
);

const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);
export default CommunityPost;
