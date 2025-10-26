


// backend/routes/trustedContactRoutes.js
import express from "express";
import {
  listRegisteredUsers,
  createTrustedRequest,
  getOutgoingTrustedRequests,
  getIncomingTrustedRequests,
  respondToTrustedRequest,
  getTrustedContacts,
  addTrustedContact,
  updateTrustedContact,
  deleteTrustedContact,
  sendRiskAlert,
  sendTestAlert,
  acceptInvite,
  sendEmergencyAlert
} from "../controllers/trustedContactController.js";
import { triggerDailySummaryNow } from "../utils/dailySummary.js";
import protect from "../middleware/authMiddleware.js";


// ✅ Import default export (no curly braces)

const router = express.Router();

// All routes require authentication
router.use(protect);

// Directory of registered users (for youth to discover trusted persons)
router.get("/users", listRegisteredUsers);

// Trusted-person request workflow
router.get("/requests/outgoing", getOutgoingTrustedRequests);
router.get("/requests/incoming", getIncomingTrustedRequests);
router.post("/requests", createTrustedRequest);
router.patch("/requests/:id", respondToTrustedRequest);

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

// POST /api/trusted-contacts/send-test-alert - Send a mock test alert to all trusted contacts
router.post("/send-test-alert", sendTestAlert);

// POST /api/trusted-contacts/test-daily-summary - Test daily summary (manual trigger)
router.post("/test-daily-summary", async (req, res) => {
  try {
    await triggerDailySummaryNow();
    res.json({ success: true, message: 'Daily summary sent successfully!' });
  } catch (error) {
    console.error('Error sending daily summary:', error);
    res.status(500).json({ success: false, message: 'Failed to send daily summary' });
  }
});

router.post("/accept", protect, acceptInvite);
router.post("/emergency", protect, sendEmergencyAlert);

export default router;
