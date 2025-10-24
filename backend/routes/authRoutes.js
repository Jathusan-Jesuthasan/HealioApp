import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateAlertSettings,
  getAlertSettings
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Password reset flow
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Profile (requires Bearer token)
router.get("/profile", protect, getProfile);

// Alert settings
router.get("/alert-settings", protect, getAlertSettings);
router.put("/alert-settings", protect, updateAlertSettings);

export default router;
