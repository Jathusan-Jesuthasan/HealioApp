// import express from "express";
// import { addMood, getMoods, deleteMood } from "../controllers/moodController.js";
// import protect from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.post("/add", protect, addMood);
// router.get("/", protect, getMoods);
// router.delete("/:id", protect, deleteMood);

// export default router;




import express from "express";
import { addMood, getMoods, updateMood, deleteMood } from "../controllers/moodController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", authMiddleware, addMood);
router.get("/", authMiddleware, getMoods);
router.put("/:id", authMiddleware, updateMood);  // ✅ Edit API
router.delete("/:id", authMiddleware, deleteMood);

export default router;

