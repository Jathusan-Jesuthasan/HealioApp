import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getTrustedDashboard,
  getAlerts,
  generateTrustedReport,
  getYouthAnalytics,
} from "../controllers/trustedDashboardController.js";

const router = express.Router();

router.use(protect);
router.get("/dashboard", getTrustedDashboard);
router.get("/analytics/:youthId", getYouthAnalytics);
router.get("/alerts", getAlerts);
router.get("/report", generateTrustedReport);

export default router;
