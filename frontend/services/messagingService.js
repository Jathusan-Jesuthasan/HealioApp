import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { firestore as db } from '../config/firebaseConfig';

export const createMessage = async (conversationId, message) => {
  try {
    const col = collection(db, 'conversations', conversationId, 'messages');
    const docRef = await addDoc(col, { ...message, createdAt: serverTimestamp() });
    return docRef.id;
  } catch (err) {
    console.warn('[messagingService] createMessage error', serializeError(err));
    throw err;
  }
};

export const listenMessages = (conversationId, callback) => {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'desc')
  );
  // attach an error handler so we get clearer logs when the WebChannel transport fails
  return onSnapshot(
    q,
    (snapshot) => {
      const out = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(out);
    },
    (err) => {
      console.error('[messagingService] listenMessages error', serializeError(err));
      // caller can implement reconnect logic if desired
    }
  );
};

export const createConversationIfMissing = async (conversationId, meta = {}) => {
  try {
    const ref = doc(db, 'conversations', conversationId);
    await setDoc(ref, { ...meta, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('[messagingService] createConversationIfMissing error', serializeError(err));
    throw err;
  }
};

export default { createMessage, listenMessages, createConversationIfMissing };

function serializeError(err) {
  if (!err) return err;
  try {
    const out = {};
    Object.getOwnPropertyNames(err).forEach((k) => {
      try { out[k] = err[k]; } catch (e) { out[k] = String(err[k]); }
    });
    return out;
  } catch (e) {
    return { message: err.message || String(err), stack: err.stack };
  }
}
