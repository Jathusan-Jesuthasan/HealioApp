import express from "express";
import ChatMessage from "../models/ChatMessage.js";
import protect from "../middleware/authMiddleware.js"; // your middleware

const router = express.Router();

// ➕ Add message (only logged-in user)
router.post("/add", protect, async (req, res) => {
  try {
    const { role, text } = req.body;
    const msg = new ChatMessage({ userId: req.user, role, text });
    await msg.save();
    res.json({ success: true, message: "Message saved", data: msg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📦 Get all messages for logged-in user
router.get("/me", protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user }).sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🗑️ Clear chat for logged-in user
router.delete("/me", protect, async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.user });
    res.json({ success: true, message: "Chat cleared" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
