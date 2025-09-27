// backend/routes/moodLogRoutes.js
import express from "express";
import { createMoodLog, getMoodLogs } from "../controllers/moodLogController.js";
import protect from "../middleware/authMiddleware.js"; // ✅ default import of middleware

const router = express.Router();

/**
 * @route   POST /api/moodlogs
 * @desc    Save a new mood log
 * @access  Private
 */
router.post("/", protect, createMoodLog);

/**
 * @route   GET /api/moodlogs
 * @desc    Get all mood logs for the logged-in user
 * @access  Private
 */
router.get("/", protect, getMoodLogs);

export default router;
