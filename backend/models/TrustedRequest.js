// backend/models/TrustedRequest.js
import mongoose from "mongoose";

const TrustedRequestSchema = new mongoose.Schema(
  {
    youthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    trustedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Declined", "Cancelled"],
      default: "Pending",
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    respondedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

TrustedRequestSchema.index({ youthId: 1, trustedId: 1 }, { unique: true });

const TrustedRequest =
  mongoose.models.TrustedRequest ||
  mongoose.model("TrustedRequest", TrustedRequestSchema);

export default TrustedRequest;
