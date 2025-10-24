import CommunityPost from "../models/CommunityPost.js";

// GET all posts (role-based, search optional)
export const getPosts = async (req, res) => {
  try {
    const { roleFilter, search } = req.query;
    const filter = { approved: true };
    if (roleFilter) filter.authorRole = roleFilter;
    if (search) filter.title = { $regex: search, $options: "i" };

    const posts = await CommunityPost.find(filter).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts", error: err.message });
  }
};

// POST new thread
export const createPost = async (req, res) => {
  try {
    const { title, message, anonymous, tags } = req.body;
    const post = await CommunityPost.create({
      title,
      message,
      anonymous,
      authorRole: req.user.role,
      tags,
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ message: "Error creating post", error: err.message });
  }
};

// POST reply
export const addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, anonymous } = req.body;

    const post = await CommunityPost.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.replies.push({
      authorRole: req.user.role,
      message,
      anonymous,
    });

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Error replying", error: err.message });
  }
};

// PATCH like
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await CommunityPost.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.likes += 1;
    await post.save();
    res.json({ likes: post.likes });
  } catch (err) {
    res.status(500).json({ message: "Error liking post" });
  }
};

// PATCH flag (report post)
export const reportPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await CommunityPost.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.flagged = true;
    await post.save();
    res.json({ message: "Post flagged for moderation" });
  } catch (err) {
    res.status(500).json({ message: "Error reporting post" });
  }
};
