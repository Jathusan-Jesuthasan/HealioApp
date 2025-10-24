//backend/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // Alert settings for trusted contact notifications
    alertSettings: {
      autoAlert: { type: Boolean, default: true }, // Send automatic alerts when AI detects risk
      criticalOnly: { type: Boolean, default: false }, // Only send alerts for critical/high risk
      dailySummary: { type: Boolean, default: false }, // Send daily summary emails
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
