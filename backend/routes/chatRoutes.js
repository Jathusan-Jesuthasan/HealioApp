import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  listConversations,
  startConversation,
  getMessages,
  sendMessage,
  markRead,
} from "../controllers/chatController.js";
import ChatMessage from "../models/ChatMessage.js";

const router = express.Router();

router.use(protect);

// Conversations
router.get("/conversations", listConversations);
router.post("/conversations", startConversation);

// Messages
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/:id/messages", sendMessage);
router.post("/conversations/:id/read", markRead);


// ➕ Add message (only logged-in user)
router.post("/add", async (req, res) => {
  try {
  const { role, text } = req.body;
  const msg = new ChatMessage({ userId: String(req.user._id), role, text });
    await msg.save();
    res.json({ success: true, message: "Message saved", data: msg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📦 Get all messages for logged-in user
router.get("/me", async (req, res) => {
  try {
  const messages = await ChatMessage.find({ userId: String(req.user._id) }).sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🗑️ Clear chat for logged-in user
router.delete("/me", async (req, res) => {
  try {
  await ChatMessage.deleteMany({ userId: String(req.user._id) });
    res.json({ success: true, message: "Chat cleared" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
