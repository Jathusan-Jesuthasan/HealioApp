// backend/routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  googleAuth,
  clearUsers,
  updateAlertSettings,
  getAlertSettings
} from "../controllers/authController.js";
import protect from '../middleware/authMiddleware.js';


const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.delete("/clear-users", clearUsers);

// Alert settings
router.get("/alert-settings", protect, getAlertSettings);
router.put("/alert-settings", protect, updateAlertSettings);

export default router;
