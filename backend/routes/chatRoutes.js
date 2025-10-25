import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  listConversations,
  startConversation,
  getMessages,
  sendMessage,
  markRead,
} from "../controllers/chatController.js";

const router = express.Router();

router.use(protect);

// Conversations
router.get("/conversations", listConversations);
router.post("/conversations", startConversation);

// Messages
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/:id/messages", sendMessage);
router.post("/conversations/:id/read", markRead);

export default router;
