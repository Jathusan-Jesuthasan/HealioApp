import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getPosts,
  createPost,
  addReply,
  likePost,
  reportPost,
} from "../controllers/communityController.js";

const router = express.Router();

router.use(protect);

router.get("/", getPosts);
router.post("/", createPost);
router.post("/:id/replies", addReply);
router.patch("/:id/like", likePost);
router.patch("/:id/report", reportPost);

export default router;
