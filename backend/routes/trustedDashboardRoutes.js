import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getTrustedDashboard,
  getAlerts,
  generateTrustedReport,
} from "../controllers/trustedDashboardController.js";

const router = express.Router();

router.use(protect);
router.get("/dashboard", getTrustedDashboard);
router.get("/alerts", getAlerts);
router.get("/report", generateTrustedReport);

export default router;
