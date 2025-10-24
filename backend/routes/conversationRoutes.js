import express from 'express';
import protect from '../middleware/authMiddleware.js';
import conversationCtrl from '../controllers/conversationController.js';

const router = express.Router();

// Create a conversation (server-generated id)
router.post('/', protect, conversationCtrl.createConversation);

// List conversations for current user
router.get('/', protect, conversationCtrl.listConversations);

// Get single conversation metadata
router.get('/:id', protect, conversationCtrl.getConversation);

export default router;
