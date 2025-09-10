import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  getProfile,
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.get("/profile", protect, getProfile);

export default router;
