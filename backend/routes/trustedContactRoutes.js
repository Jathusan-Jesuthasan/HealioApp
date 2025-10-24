import express from "express";
import {
  addTrustedContact,
  getTrustedContacts,
  acceptInvite,
  sendEmergencyAlert,
  deleteTrustedContact,
} from "../controllers/trustedContactController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/", protect, addTrustedContact);
router.get("/", protect, getTrustedContacts);
router.delete("/:id", protect, deleteTrustedContact);
router.post("/accept", protect, acceptInvite);
router.post("/emergency", protect, sendEmergencyAlert);

export default router;
