// backend/routes/moodLogRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import { addMoodLog,createMoodLog, getMoodLogs } from "../controllers/moodLogController.js";


const router = express.Router();

router.post("/add", protect, addMoodLog);

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
