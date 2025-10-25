// backend/routes/meditationRoutes.js
import express from "express";
import { addMeditation, getMeditationsByUser } from "../controllers/meditationController.js";

const router = express.Router();

router.post("/add", addMeditation);
router.get("/:userId", getMeditationsByUser);

export default router;
