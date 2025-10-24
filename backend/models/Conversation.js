import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    meta: { type: Object, default: {} },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCounts: { type: Map, of: Number, default: {} },
    // Optional shared secret hint (do not store raw secrets in production)
    sharedKeyHint: { type: String },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });

const Conversation = mongoose.model('Conversation', ConversationSchema);
export default Conversation;
