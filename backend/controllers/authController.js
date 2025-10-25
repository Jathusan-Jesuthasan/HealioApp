// backend/controllers/authController.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

const generateToken = (id, expiresIn = "30d") =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });

// POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role = "Youth" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password, role });
    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
    return res.status(401).json({ message: "Invalid email or password" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = await User.findOne({ email });

    // always respond generic
    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    const token = generateToken(user._id, "15m");
    const resetURL = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password/${token}`;

    await sendEmail({
      to: email,
      subject: "Healio Password Reset",
      html: `
        <h2>Reset your Healio password</h2>
        <p>Click below to reset your password (valid for 15 minutes):</p>
        <a href="${resetURL}">${resetURL}</a>
      `,
    });

    return res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and newPassword are required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword; // pre-save hook will hash
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

// POST /api/auth/google
export const googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, avatarUrl, role = "Youth" } = req.body;

    if (!googleId || !email || !name) {
      return res.status(400).json({ message: "Google ID, email, and name are required" });
    }

    // Check if user exists by Google ID or email
    let user = await User.findOne({ 
      $or: [{ googleId }, { email }] 
    });

    if (user) {
      // Update existing user with Google info
      user.googleId = googleId;
      user.avatarUrl = avatarUrl;
      user.name = name;
      user.emailVerified = true;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        googleId,
        email,
        name,
        avatarUrl,
        role,
        emailVerified: true,
        lastLoginAt: new Date()
      });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/auth/clear-users (Development only)
export const clearUsers = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ message: "Not allowed in production" });
    }
    
    await User.deleteMany({});
    res.json({ message: "All users cleared successfully" });
  } catch (err) {
    console.error("Clear users error:", err);
    res.status(500).json({ message: "Server error" });
  }
};