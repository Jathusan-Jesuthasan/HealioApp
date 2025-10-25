import User from "../models/User.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js"; // implement with nodemailer or your provider

// GET /api/users/me (just a passthrough if you already have one)
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

// PUT /api/users/me (update general profile & share settings)
export const updateMe = async (req, res) => {
  const allowed = [
    "name",
    "phone",
    "dob",
    "gender",
    "bio",
    "profileImage",
    "shareSettings",
  ];
  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
  res.json(user);
};

// POST /api/users/role/request (start role change + send OTP)
export const requestRoleChange = async (req, res) => {
  const { requestedRole, delivery = "email" } = req.body;
  if (!["Youth", "Trusted"].includes(requestedRole)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findById(req.user._id);
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString(); // 6-digit
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  user.pendingRoleChange = { requestedRole, otp, otpExpiresAt: expires };
  await user.save();

  // Send via email (or SMS if using Twilio)
  if (delivery === "email" && user.email) {
    await sendEmail({
      to: user.email,
      subject: "Healio Role Change Verification Code",
      html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });
  }

  res.json({ message: "OTP sent. Please verify within 10 minutes." });
};

// POST /api/users/role/verify (verify OTP then switch role)
export const verifyRoleChange = async (req, res) => {
  const { otp } = req.body;
  const user = await User.findById(req.user._id);
  const pending = user?.pendingRoleChange;
  if (!pending) return res.status(400).json({ message: "No pending request" });
  if (!otp || otp !== pending.otp) {
    return res.status(400).json({ message: "Invalid code" });
  }
  if (new Date() > new Date(pending.otpExpiresAt)) {
    user.pendingRoleChange = undefined;
    await user.save();
    return res.status(400).json({ message: "Code expired, request again." });
  }

  // Apply new role
  user.role = pending.requestedRole;
  if (!user.roles?.includes(user.role)) {
    user.roles = Array.from(new Set([...(user.roles || []), user.role]));
  }
  user.pendingRoleChange = undefined;
  await user.save();

  res.json({ message: "Role updated", role: user.role, roles: user.roles });
};

// GET /api/users/privacy-audit (see what is shared and with whom)
// This is a simple example; extend by joining with your TrustedContact model
export const privacyAudit = async (req, res) => {
  const user = await User.findById(req.user._id).select("shareSettings roles role email phone");
  // You may also fetch trusted contacts here and include their names/emails
  res.json({
    you: { email: user.email, phone: user.phone, role: user.role, roles: user.roles },
    shareSettings: user.shareSettings,
    withTrustedPersons: "Mood Trends, Wellness Score (if toggled). Private journals never shared.",
  });
};

// GET /api/users/export (export shared data as JSON)
// For demo, just returns profile + share settings. Extend to include trends.
export const exportSharedData = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  const exported = {
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      roles: user.roles,
    },
    shareSettings: user.shareSettings,
    // TODO: add mood summaries, alerts, etc. from your collections
  };
  res.setHeader("Content-Disposition", "attachment; filename=healio-export.json");
  res.json(exported);
};
