import express from "express";
import ChatMessage from "../models/ChatMessage.js";

const router = express.Router();

// ➕ Save a new chat message
router.post("/add", async (req, res) => {
  try {
    const { userId, role, text } = req.body;
    const msg = new ChatMessage({ userId, role, text });
    await msg.save();
    res.json({ success: true, message: "Message saved", data: msg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📦 Get all messages for a user
router.get("/:userId", async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.params.userId })
      .sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🗑️ Clear chat for a user
router.delete("/:userId", async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.params.userId });
    res.json({ success: true, message: "Chat cleared" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
