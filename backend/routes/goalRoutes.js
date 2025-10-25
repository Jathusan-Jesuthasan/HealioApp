// backend/routes/goalRoutes.js
import express from "express";
import { addGoal, getGoalByUser } from "../controllers/goalController.js";

const router = express.Router();

// ✅ Upsert goal for user
router.post("/add", addGoal);

// ✅ Fetch goal for user
router.get("/:userId", getGoalByUser);

export default router;
