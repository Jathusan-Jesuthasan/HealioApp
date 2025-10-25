import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getMe,
  updateMe,
  requestRoleChange,
  verifyRoleChange,
  privacyAudit,
  exportSharedData,
} from "../controllers/roleController.js";

const router = express.Router();

router.use(protect);

router.get("/me", getMe);
router.put("/me", updateMe);

router.post("/role/request", requestRoleChange);
router.post("/role/verify", verifyRoleChange);

router.get("/privacy-audit", privacyAudit);
router.get("/export", exportSharedData);

export default router;
