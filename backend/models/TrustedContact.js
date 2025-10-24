import mongoose from "mongoose";

const trustedContactSchema = new mongoose.Schema({
  youthId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  trustedId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  relationship: { type: String },
  status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
  privacyLevel: {
    type: String,
    enum: ["Alerts Only", "Mood Trends", "Full Access"],
    default: "Alerts Only",
  },
  inviteCode: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const TrustedContact = mongoose.model("TrustedContact", trustedContactSchema);
export default TrustedContact;
