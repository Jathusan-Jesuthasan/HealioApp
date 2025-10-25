// backend/src/models/User.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* ===========================
   Subdocument: Share Settings
   =========================== */
const shareSettingsSchema = new mongoose.Schema(
  {
    shareMoodTrends: { type: Boolean, default: true },
    shareWellnessScore: { type: Boolean, default: true },
    shareAlertsOnly: { type: Boolean, default: false },
  },
  { _id: false }
);

/* ===========================
   Main User Schema
   =========================== */
const userSchema = new mongoose.Schema(
  {
    // Core identity
    name: { type: String, required: true, default: "New User" },
    email: { type: String, unique: true, required: true },
    password: { type: String }, // optional for Google users

    googleId: { type: String },
    avatarUrl: { type: String }, // profile picture (Google or uploaded)
    bio: { type: String },

    // Verification
    phone: { type: String },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },

    // Demographics
    dob: { type: Date },
    age: { type: Number, min: 13, max: 25 },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say", ""],
      default: "",
    },

    // Primary role (main active role)
    role: { type: String, enum: ["Youth", "Trusted"], default: "Youth" },

    // Optional multiple roles (e.g., someone can be Youth + Trusted)
    roles: [{ type: String, enum: ["Youth", "Trusted"] }],

    // Role linkage (Trusted person monitors multiple youth)
    linkedYouthIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // What youth shares with trusted persons
    shareSettings: { type: shareSettingsSchema, default: () => ({}) },

    // Client-side preferences: theme, notifications, language
    preferences: {
      darkMode: { type: Boolean, default: false },
      notifications: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
      },
      language: { type: String, default: "en" },
    },

    // OTP flow for sensitive changes (e.g., switching role)
    pendingRoleChange: {
      requestedRole: { type: String, enum: ["Youth", "Trusted"] },
      otp: String,
      otpExpiresAt: Date,
    },

    // Questionnaire completion status
    questionnaireCompleted: { type: Boolean, default: false },
    questionnaireId: { type: mongoose.Schema.Types.ObjectId, ref: "Questionnaire" },
    
    // Notification settings
    notificationCount: { type: Number, default: 0 },
    unreadMessages: { type: Number, default: 0 },
  // List of trusted contact references (for quick access within user doc)
  trustedContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "TrustedContact" }],

  // Alert settings for trusted contact notifications
    alertSettings: {
      autoAlert: { type: Boolean, default: true }, // Send automatic alerts when AI detects risk
      criticalOnly: { type: Boolean, default: false }, // Only send alerts for critical/high risk
      dailySummary: { type: Boolean, default: false }, // Send daily summary emails
    },
    
    // Audit
    lastLoginAt: { type: Date },

  },
  { timestamps: true }
);

/* ===========================
   Hooks & Methods
   =========================== */

// Hash password before saving (only if changed)
userSchema.pre("save", async function (next) {
  // Compute age from dob when present (keeps age in sync with dob)
  try {
    if (this.dob) {
      const today = new Date();
      const dobDate = new Date(this.dob);
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      // Only set age when it seems reasonable (non-negative)
      if (age >= 0) this.age = age;
    }
  } catch (err) {
    // ignore DOB parsing errors and continue with save
  }

  // Hash password only if it was modified
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/* ===========================
   Virtuals / Helper
   =========================== */

// A computed virtual to show short name for UI
userSchema.virtual("firstName").get(function () {
  return this.name?.split(" ")[0] || "";
});

// Alias virtual so older frontend code referencing profileImage still works
userSchema.virtual("profileImage").get(function () {
  return this.avatarUrl || null;
});

// Hide sensitive fields and include virtuals when converting to JSON / Object
userSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;
    // keep id as id
    ret.id = ret._id;
    return ret;
  },
});

userSchema.set("toObject", { virtuals: true });

/* ===========================
   Export Model
   =========================== */
const User = mongoose.model("User", userSchema);
export default User;
