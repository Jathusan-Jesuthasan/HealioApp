import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true }, // e.g., "emergency", "sos"
  message: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Alert = mongoose.model("Alert", AlertSchema);

export default Alert;