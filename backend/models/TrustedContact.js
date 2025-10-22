// backend/models/TrustedContact.js
import mongoose from "mongoose";

const TrustedContactSchema = new mongoose.Schema(
  {
    // Reference to the user who owns this contact
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Contact's name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Relation to the user (e.g., parent, friend)
    relation: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional phone number
    phone: {
      type: String,
      trim: true,
    },

    // Email address (required)
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Notification methods: email, sms, or both
    notifyVia: {
      type: [String],
      enum: ["email", "sms"],
      default: ["email"],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Prevent model overwrite issues in watch mode (e.g., with nodemon)
const TrustedContact =
  mongoose.models.TrustedContact ||
  mongoose.model("TrustedContact", TrustedContactSchema);

export default TrustedContact;
