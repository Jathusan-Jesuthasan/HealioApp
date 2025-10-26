import { useEffect, useState, useCallback } from 'react';
import CryptoJS from 'crypto-js';
import messagingService from '../services/messagingService';

const SHARED_SECRET = 'demo-shared-key-change-me';
const enc = (text) => CryptoJS.AES.encrypt(text, SHARED_SECRET).toString();
const dec = (cipher) => {
  try { return CryptoJS.AES.decrypt(cipher, SHARED_SECRET).toString(CryptoJS.enc.Utf8); }
  catch { return ''; }
};

export const useEncryptedMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!conversationId) return;
    messagingService.createConversationIfMissing(conversationId).catch((err) => {
      console.warn('[useEncryptedMessages] createConversationIfMissing failed', err && err.message ? err.message : err);
    });
    const unsub = messagingService.listenMessages(conversationId, (docs) => {
      // Firestore returns newest first; GiftedChat expects chronological desc when appending
      const mapped = docs.map((d) => ({
        _id: d.id,
        text: d.encryptedBody ? dec(d.encryptedBody) : (d.body || ''),
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt || new Date()),
        user: {
          _id: d.user?._id || d.sender || d.senderId || 'unknown',
          name: d.user?.name || d.senderName || 'Unknown',
          avatar: d.user?.avatar || d.senderAvatar || undefined,
          role: d.user?.role || d.senderRole || 'User',
        },
        sent: true,
      }));
      setMessages(mapped);
    });
    return () => unsub && unsub();
  }, [conversationId]);

  const sendMessage = useCallback(async (text, sender) => {
    if (!conversationId || !text) return;
    const senderId = sender?._id || sender?.id;
    if (!senderId) {
      console.warn('[useEncryptedMessages] missing sender id, aborting send');
      return;
    }
    const senderName = sender?.name || 'Unknown';
    const senderAvatar = sender?.avatar || sender?.profileImage;
    const senderRole = sender?.role || 'User';
    const payload = {
      encryptedBody: enc(text),
      sender: String(senderId),
      senderId: String(senderId),
      senderName,
      senderAvatar,
      senderRole,
      user: {
        _id: String(senderId),
        name: senderName,
        avatar: senderAvatar,
        role: senderRole,
      },
    };
    await messagingService.createMessage(conversationId, payload);
  }, [conversationId]);

  return { messages, sendMessage };
};

export default useEncryptedMessages;
