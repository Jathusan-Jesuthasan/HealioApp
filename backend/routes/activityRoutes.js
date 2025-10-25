import express from "express";
import {
  addActivity,
  getActivities,
  getActivityDashboard,
} from "../controllers/activityController.js";

const router = express.Router();

router.post("/add", addActivity);
router.get("/", getActivities);
router.get("/activity-dashboard/:userId", getActivityDashboard);

export default router;
