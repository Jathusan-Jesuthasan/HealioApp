// backend/controllers/userController.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";

// GET /api/users/me
export const getMe = async (req, res) => {
  try {
    // Populate trustedContacts for convenient client consumption
    const user = await User.findById(req.user._id).select('-password').populate('trustedContacts');
    return res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

// PUT /api/users/me
export const updateMe = async (req, res) => {
  try {
    const allowed = [
      "name",
      "phone",
      "dob",
      "gender",
      "bio",
      "role",
      "profileImage",
      "email", // optional if you allow email update
      "preferences",
    ];

    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    // Prevent password updates here (use dedicated route if needed)
    if ("password" in updates) delete updates.password;

    // Email: basic validation and duplicate check
    if (updates.email) {
      const email = updates.email.toString().trim().toLowerCase();
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updates.email = email;
    }

    // Normalize role values to match schema enums (capitalize)
    if (updates.role) {
      const r = updates.role.toString().toLowerCase();
      updates.role = r === "trusted" ? "Trusted" : "Youth";
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      select: "-password",
    });

    return res.json(updated);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
};

// DELETE /api/users/me
export const deleteMe = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Error deleting user" });
  }
};

// POST /api/users/me/avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // file saved by multer; construct a public URL
    const host = req.get('host');
    const protocol = req.protocol;
    const publicUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    const updated = await User.findByIdAndUpdate(req.user._id, { avatarUrl: publicUrl }, { new: true, select: '-password' });
    return res.json({ avatarUrl: publicUrl, user: updated });
  } catch (err) {
    console.error('Upload avatar error:', err);
    return res.status(500).json({ message: 'Error uploading avatar' });
  }
};


export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.json({ message: "If that email exists, a reset link has been sent." });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await sendEmail({
    to: email,
    subject: "Healio Password Reset",
    html: `<h3>Reset Password</h3><a href="${resetURL}">${resetURL}</a>`,
  });
  res.json({ message: "Reset link sent if email exists." });
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

// GET /api/users/:id (admin/trusted or self)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    // allow the user to fetch their own profile
    if (String(req.user._id) === String(id)) {
      const user = await User.findById(id).select('-password').populate('trustedContacts');
      return res.json(user);
    }

    // otherwise only Trusted or Admin roles may fetch other users
    const allowed = ['Trusted', 'Admin'];
    const hasRole = allowed.includes(req.user.role) || (Array.isArray(req.user.roles) && req.user.roles.some(r => allowed.includes(r)));
    if (!hasRole) return res.status(403).json({ message: 'Access denied' });

    const user = await User.findById(id).select('-password').populate('trustedContacts');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('getUserById error:', err.message || err);
    res.status(500).json({ message: 'Error fetching user' });
  }
};
