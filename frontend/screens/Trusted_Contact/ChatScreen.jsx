import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image, Modal, FlatList, ActivityIndicator, Alert } from "react-native";
import { GiftedChat, Bubble, InputToolbar, Send, Composer } from "react-native-gifted-chat";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import CryptoJS from "crypto-js";
import api from "../../config/api";
import { AuthContext } from "../../context/AuthContext";
import useEncryptedMessages from "../../hooks/useEncryptedMessages";

const PRIMARY = "#F5F7FA";
const SECONDARY = "#4A90E2";
const ACCENT = "#10B981";

// simple shared secret demo (in production, use a per-conversation secret negotiated out-of-band)
const SHARED_SECRET = "demo-shared-key-change-me";

// encrypt/decrypt helpers
const enc = (text) => CryptoJS.AES.encrypt(text, SHARED_SECRET).toString();
const dec = (cipher) => {
  try { return CryptoJS.AES.decrypt(cipher, SHARED_SECRET).toString(CryptoJS.enc.Utf8); }
  catch { return ""; }
};

export default function ChatScreen({ route, navigation }) {
  // route.params may be undefined when this screen is rendered from a tab
  // (for example the Chat tab opens the Chat screen without params).
  // Safely read params and render a friendly fallback if none present.
  const conversationId = route?.params?.conversationId;
  const other = route?.params?.other || null;
  const { userToken, user } = useContext(AuthContext);

  const { messages, sendMessage } = useEncryptedMessages(conversationId);

  const myUser = {
    _id: user?._id,
    name: user?.name || "Me",
    avatar: user?.profileImage || undefined,
  };

  // Header with quick SOS
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: other?.name || "Chat",
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate("Profile", { screen: "SOS" })} style={{ marginRight: 12 }}>
          <AntDesign name="warning" size={22} color="#EF4444" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, other]);

  // Using Firestore-based messaging via useEncryptedMessages hook
  const onSend = useCallback(async (newMessages = []) => {
    const m = newMessages[0];
    // optimistic UI is handled by Firestore subscription
    await sendMessage(m.text, myUser);
  }, [sendMessage]);

  // If no conversationId was provided (e.g. the tab opened this screen),
  // show a placeholder that helps the user open the chat list.
  if (!conversationId) {
    return <NoConversationPlaceholder navigation={navigation} user={user} userToken={userToken} />;
  }

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={(msgs) => onSend(msgs)}
        user={myUser}
        placeholder="Type a message..."
        alwaysShowSend
        showUserAvatar
        showAvatarForEveryMessage
        renderBubble={(props) => (
          <Bubble
            {...props}
            wrapperStyle={{
              right: { backgroundColor: ACCENT, borderRadius: 18, padding: 8 },
              left: { backgroundColor: "#fff", borderRadius: 18, padding: 8, borderWidth: 1, borderColor: '#E6E6E6' },
            }}
            textStyle={{ right: { color: "#fff", fontSize: 16 }, left: { color: "#0f172a", fontSize: 16 } }}
            timeTextStyle={{ right: { color: 'rgba(255,255,255,0.85)', fontSize: 10 }, left: { color: '#9CA3AF', fontSize: 10 } }}
          />
        )}
        renderSend={(props) => (
          <Send {...props} containerStyle={{ marginRight: 8, marginBottom: 6 }}>
            <View style={styles.sendButton}>
              <MaterialIcons name="send" size={20} color="#fff" />
            </View>
          </Send>
        )}
        renderInputToolbar={(props) => (
          <InputToolbar
            {...props}
            containerStyle={styles.inputToolbar}
            primaryStyle={{ alignItems: 'center' }}
          />
        )}
        renderComposer={(props) => (
          <Composer {...props} textInputStyle={styles.composer} placeholder="Message..." />
        )}
        renderAvatar={(props) => (
          <Image source={{ uri: props.currentMessage?.user?.avatar }} style={styles.avatarSmall} />
        )}
        renderTime={(props) => (
          <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{dayjs(props.currentMessage.createdAt).format('h:mm A')}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY },
  sendButton: {
    backgroundColor: SECONDARY,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  inputToolbar: {
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  composer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#0f172a',
  },
  avatarSmall: { width: 36, height: 36, borderRadius: 18 },
});

/* ---------------- NoConversationPlaceholder component ---------------- */
function NoConversationPlaceholder({ navigation, user, userToken }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [convosLoading, setConvosLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setConvosLoading(true);
    try {
      const { data } = await api.get('/api/conversations', { headers: { Authorization: `Bearer ${userToken}` } });
      setConversations(data || []);
    } catch (e) {
      console.warn('Could not load conversations', e.message || e);
    } finally {
      setConvosLoading(false);
    }
  };

  const openNewConv = async () => {
    setModalVisible(true);
    setLoading(true);
    try {
      const { data } = await api.get('/api/users/me', { headers: { Authorization: `Bearer ${userToken}` } });
      // api returns trustedContacts populated; for trusted users use linkedYouthIds/resolved data if available
      const list = (data.trustedContacts || []).map((c) => ({ ...c, type: 'trusted' }));
      // if the user is Trusted, the backend should return linked youth; attempt to read data.linkedYouth if present
      if ((data.linkedYouth || []).length) {
        const youth = (data.linkedYouth || []).map((y) => ({ ...y, type: 'youth' }));
        setContacts([...list, ...youth]);
      } else {
        setContacts(list);
      }
    } catch (e) {
      console.warn('Could not load contacts for new conversation', e.message || e);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (contact) => {
    // Prefer using a real user id for participants (trustedId or user id). If missing, inform user.
    const participantId = contact.trustedId || contact._id || contact.id;
    if (!participantId) {
      Alert.alert('Cannot start chat', 'This contact is not yet linked to a Healio user. They must accept the invite to chat.');
      return;
    }

    try {
      // Create conversation on the server
      const body = { participants: [String(user?._id), String(participantId)] };
      const { data: conv } = await api.post('/api/conversations', body, { headers: { Authorization: `Bearer ${userToken}` } });

      // Ensure Firestore conversation exists for messages
      try {
        await import('../../services/messagingService').then((m) => m.createConversationIfMissing(conv._id, { participants: body.participants }));
      } catch (e) {
        console.warn('Could not ensure firestore conversation', e.message || e);
      }

      setModalVisible(false);
      // refresh conversation list and navigate to chat (via Profile stack)
      fetchConversations();
      navigation.navigate('Profile', { screen: 'ChatRoom', params: { conversationId: conv._id, other: contact } });
    } catch (e) {
      console.warn('Could not create conversation (server)', e.response?.data || e.message || e);
      Alert.alert('Error', e.response?.data?.message || 'Could not create conversation');
    }
  };

  const openConversation = (conv) => {
    // choose the 'other' participant
    const other = (conv.participants || []).find((p) => String(p._id) !== String(user?._id)) || (conv.participants && conv.participants[0]);
    navigation.navigate('Profile', { screen: 'ChatRoom', params: { conversationId: conv._id, other } });
  };

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Conversations</Text>
      {convosLoading ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : conversations.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ color: '#64748B', marginBottom: 12 }}>No conversations yet</Text>
          <TouchableOpacity onPress={openNewConv} style={{ backgroundColor: '#4A90E2', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>New Conversation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openConversation(item)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={{
                  uri:
                    (item.participants && item.participants.find((p) => String(p._id) !== String(user?._id))?.profileImage) ||
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BAQACAgEAj2rFZQAAAABJRU5ErkJggg=='
                }}
                style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>
                  {(() => {
                    const other = (item.participants || []).find((p) => String(p._id) !== String(user?._id)) || (item.participants && item.participants[0]);
                    const fullName = (other?.firstName || other?.givenName) && (other?.lastName || other?.familyName)
                      ? `${other?.firstName || other?.givenName} ${other?.lastName || other?.familyName}`
                      : null;
                    return (
                      fullName || other?.name || other?.displayName || other?.email || other?.phone || 'Conversation'
                    );
                  })()}
                </Text>
                <Text style={{ color: '#64748B' }}>{item.lastMessage || 'Start a new conversation'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>{item.lastMessageAt ? dayjs(item.lastMessageAt).format('MMM D') : ''}</Text>
                {item.unread ? <View style={{ backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 6 }}><Text style={{ color: '#fff', fontWeight: '700' }}>{item.unread}</Text></View> : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* New Conversation Modal (same as before) */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>Start chat</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#4A90E2', fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#4A90E2" />
          ) : contacts.length === 0 ? (
            <Text style={{ color: '#64748B' }}>No contacts available. Add trusted contacts first.</Text>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(i) => i._id || i.id || i.email || i.phone}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => startConversation(item)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEF2FF', flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={{ uri: item.avatar || item.profileImage || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BAQACAgEAj2rFZQAAAABJRU5ErkJggg==' }}
                    style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700' }}>{item.name || item.fullName || item.displayName || item.email}</Text>
                    {item.phone ? <Text style={{ color: '#64748B' }}>{item.phone}</Text> : null}
                  </View>
                  <Text style={{ color: '#4A90E2', fontWeight: '700' }}>Chat</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
