// backend/routes/activityRoutes.js
import express from "express";
import { addActivity, getActivities } from "../controllers/activityController.js";

const router = express.Router();

router.post("/add", addActivity);
router.get("/", getActivities);

export default router;
