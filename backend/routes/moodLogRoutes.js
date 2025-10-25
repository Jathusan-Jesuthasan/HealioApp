// backend/routes/moodLogRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import { addMoodLog, getMoodLogs } from "../controllers/moodLogController.js";

const router = express.Router();

router.post("/add", protect, addMoodLog);
router.get("/", protect, getMoodLogs);

export default router;
