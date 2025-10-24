import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// Create a conversation (server-created ID) — expects participants array of user ids
export const createConversation = async (req, res) => {
  try {
    let { participants = [], meta = {} } = req.body;
    if (!participants || !Array.isArray(participants)) {
      return res.status(400).json({ message: 'participants array required' });
    }

    // sanitize participants: ensure strings, remove falsy or 'undefined' values
    participants = participants.map((p) => (p && typeof p === 'object' && p._id ? String(p._id) : String(p))).filter((p) => p && p !== 'undefined' && p !== 'null');

    // Ensure requester is one of participants
    const requesterId = String(req.user._id);
    if (!participants.includes(requesterId)) {
      participants.push(requesterId);
    }

    // require at least 2 unique participants to create a conversation
    participants = Array.from(new Set(participants));
    if (participants.length < 2) {
      return res.status(400).json({ message: 'At least two valid participant ids are required' });
    }

    // Ensure all participant ids correspond to real user accounts
    const foundUsers = await User.find({ _id: { $in: participants } }).select('_id');
    const foundIds = foundUsers.map((u) => String(u._id));
    const missing = participants.filter((p) => !foundIds.includes(String(p)));
    if (missing.length) {
      return res.status(400).json({ message: 'Some participants are not registered users', missing });
    }

    // Avoid duplicate conversation with exactly same participant set
    const existing = await Conversation.findOne({
      participants: { $all: participants },
      $expr: { $eq: [{ $size: '$participants' }, participants.length] },
    });
    if (existing) return res.json(existing);

    const conv = await Conversation.create({ participants, createdBy: req.user._id, meta });
    const populated = await Conversation.findById(conv._id).populate('participants', 'name email profileImage photoURL');
    res.json(populated);
  } catch (err) {
    console.error('createConversation error', err);
    res.status(500).json({ message: err.message });
  }
};

// List recent conversations for the authenticated user
export const listConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const convs = await Conversation.find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .populate('participants', 'name email profileImage photoURL');

    // Map to include unread count for this user
    const out = convs.map((c) => ({
      _id: c._id,
      participants: c.participants,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unread: (c.unreadCounts && c.unreadCounts.get(String(userId))) || 0,
      meta: c.meta || {},
    }));
    res.json(out);
  } catch (err) {
    console.error('listConversations error', err);
    res.status(500).json({ message: err.message });
  }
};

// Get a single conversation by id
export const getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const conv = await Conversation.findById(id).populate('participants', 'name email profileImage photoURL');
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    // ensure user is participant
    if (!conv.participants.map((p) => String(p._id)).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(conv);
  } catch (err) {
    console.error('getConversation error', err);
    res.status(500).json({ message: err.message });
  }
};

export default { createConversation, listConversations, getConversation };
