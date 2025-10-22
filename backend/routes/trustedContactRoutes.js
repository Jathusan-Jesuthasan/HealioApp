// backend/routes/trustedContactRoutes.js
import express from "express";
import {
  getTrustedContacts,
  addTrustedContact,
  updateTrustedContact,
  deleteTrustedContact,
  sendRiskAlert,
} from "../controllers/trustedContactController.js";

// ✅ Import default export (no curly braces)
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/trusted-contacts - Get all trusted contacts
router.get("/", getTrustedContacts);

// POST /api/trusted-contacts - Add a new trusted contact
router.post("/", addTrustedContact);

// PUT /api/trusted-contacts/:id - Update a trusted contact
router.put("/:id", updateTrustedContact);

// DELETE /api/trusted-contacts/:id - Delete a trusted contact
router.delete("/:id", deleteTrustedContact);

// POST /api/trusted-contacts/send-alert - Send risk alert to all trusted contacts
router.post("/send-alert", sendRiskAlert);

export default router;
