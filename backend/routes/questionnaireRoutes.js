import express from "express";
import {
  createQuestionnaire,
  getQuestionnaire,
  getQuestionnaireByUserId,
  updateQuestionnaire,
  getRiskAssessment
} from "../controllers/questionnaireController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create or update questionnaire
router.post("/", createQuestionnaire);

// Get current user's questionnaire
router.get("/", getQuestionnaire);

// Get questionnaire by user ID (for trusted persons)
router.get("/user/:userId", getQuestionnaireByUserId);

// Update questionnaire
router.put("/", updateQuestionnaire);

// Get risk assessment
router.get("/risk-assessment", getRiskAssessment);

export default router;
