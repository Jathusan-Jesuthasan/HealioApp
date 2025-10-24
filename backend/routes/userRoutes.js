// backend/routes/userRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getMe, getUserById, updateMe, deleteMe, uploadAvatar, forgotPassword } from "../controllers/userController.js";
import { resetPassword } from "../controllers/authController.js";
import multer from 'multer';
import path from 'path';

// simple local storage via multer
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(process.cwd(), 'uploads'));
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const fname = `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
		cb(null, fname);
	}
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

const router = express.Router();

router.get("/me", protect, getMe);
router.get("/:id", protect, getUserById);
router.put("/me", protect, updateMe);
router.delete("/me", protect, deleteMe);
router.post('/me/avatar', protect, upload.single('avatar'), uploadAvatar);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


export default router;
