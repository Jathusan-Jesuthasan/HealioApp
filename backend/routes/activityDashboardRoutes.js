import express from "express";
import { getActivityDashboard } from "../controllers/activityDashboardController.js";
const router = express.Router();

router.get("/:userId", getActivityDashboard);
export default router;
