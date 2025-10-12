// backend/routes/journalRoutes.js
import express from "express";
import { addJournal, getJournalsByUser } from "../controllers/journalController.js";

const router = express.Router();

// POST → add new journal
router.post("/add", addJournal);

// GET → get all journals for a user
router.get("/:userId", getJournalsByUser);

export default router;
