import express from "express";
import { sendSOS } from "../controllers/sosController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/sos/send
router.post("/send", protect, sendSOS);

export default router;
