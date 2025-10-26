import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

/** Ensure requester is participant */
const ensureParticipant = async (conversationId, userId) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo) throw new Error("Conversation not found");
  const isMember = convo.participants.some((p) => p.toString() === userId.toString());
  if (!isMember) throw new Error("Not authorized for this conversation");
  return convo;
};

export const listConversations = async (req, res) => {
  const userId = req.user._id;
  const convos = await Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1 })
    .populate("participants", "firstName lastName name email role profileImage givenName familyName");
  res.json(convos);
};

// Youth can start conversation; Trusted cannot
export const startConversation = async (req, res) => {
  const userId = req.user._id;

  const { participantId } = req.body;
  if (!participantId) {
    return res.status(400).json({ message: "participantId required" });
  }

  if (participantId.toString() === userId.toString()) {
    return res.status(400).json({ message: "Cannot start a conversation with yourself" });
  }

  const [me, other] = await Promise.all([
    User.findById(userId),
    User.findById(participantId),
  ]);

  if (!me) {
    return res.status(404).json({ message: "Requesting user not found" });
  }

  if (!other) {
    return res.status(404).json({ message: "Target user not found" });
  }

  let convo = await Conversation.findOne({
    participants: { $all: [userId, participantId], $size: 2 },
  });

  if (!convo) {
    convo = await Conversation.create({
      participants: [userId, participantId],
      createdBy: userId,
    });
  }

  await convo.populate("participants", "firstName lastName name email role profileImage");

  res.status(201).json(convo);
};

export const getMessages = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  await ensureParticipant(id, userId);

  const messages = await Message.find({ conversation: id })
    .sort({ createdAt: 1 })
    .populate("sender", "name email role profileImage");
  res.json(messages);
};

// Trusted can only send if conversation exists & they are a participant
export const sendMessage = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { body, encryptedBody, type, mediaUrl } = req.body;

  const convo = await ensureParticipant(id, userId);

  const msg = await Message.create({
    conversation: id,
    sender: userId,
    body,
    encryptedBody,
    type: type || "text",
    mediaUrl,
  });

  convo.lastMessageAt = new Date();
  await convo.save();

  // Socket broadcast (we stashed io on req.app in server)
  const io = req.app.get("io");
  io.to(id).emit("message:new", {
    _id: msg._id,
    conversation: id,
    sender: userId,
    body,
    encryptedBody,
    type: msg.type,
    mediaUrl,
    sentAt: msg.sentAt,
  });

  res.status(201).json(msg);
};

export const markRead = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  await ensureParticipant(id, userId);
  await Message.updateMany(
    { conversation: id, readBy: { $ne: userId } },
    { $push: { readBy: userId } }
  );

  const io = req.app.get("io");
  io.to(id).emit("message:read", { conversation: id, userId });

  res.json({ ok: true });
};
