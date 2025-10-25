import express from "express";
import { getRewards } from "../controllers/rewardsController.js";

const router = express.Router();

router.get("/:userId", getRewards);

export default router;
