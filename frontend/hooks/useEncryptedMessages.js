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
        user: d.user || { _id: d.sender || 'unknown', name: d.senderName || 'Unknown' },
        sent: true,
      }));
      setMessages(mapped);
    });
    return () => unsub && unsub();
  }, [conversationId]);

  const sendMessage = useCallback(async (text, sender) => {
    if (!conversationId || !text) return;
    const payload = {
      encryptedBody: enc(text),
      sender: sender?._id || sender?.id || 'anon',
      senderName: sender?.name || 'Unknown',
      user: { _id: sender?._id || sender?.id || 'anon', name: sender?.name || 'Unknown' },
    };
    await messagingService.createMessage(conversationId, payload);
  }, [conversationId]);

  return { messages, sendMessage };
};

export default useEncryptedMessages;
