import React, { useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Image, 
  Modal, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView
} from "react-native";
import { GiftedChat, Bubble, InputToolbar, Send, Composer, Day } from "react-native-gifted-chat";
import { MaterialIcons, MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import api from "../../config/api";
import { AuthContext } from "../../context/AuthContext";
import useEncryptedMessages from "../../hooks/useEncryptedMessages";

dayjs.extend(relativeTime);

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Updated color scheme for professional look
const COLORS = {
  primary: "#FFFFFF",
  secondary: "#10B981",
  accent: "#10B981",
  background: "#F8FAFC",
  textPrimary: "#4A90E2",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  border: "#E2E8F0",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  gradientStart: "#667EEA",
  gradientEnd: "#10B981",
};

export default function ChatScreen({ route, navigation }) {
  const conversationId = route?.params?.conversationId;
  const other = route?.params?.other || null;
  const { userToken, user } = useContext(AuthContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { messages, sendMessage } = useEncryptedMessages(conversationId);

  const myUser = useMemo(() => {
    const first = user?.firstName || user?.givenName;
    const last = user?.lastName || user?.familyName;
    const derivedName = [first, last].filter(Boolean).join(" ");
    return {
      _id: user?._id ? String(user._id) : undefined,
      name: derivedName || user?.name || user?.displayName || user?.email || "Me",
      avatar: user?.profileImage || user?.avatar || undefined,
      role: user?.role || "User",
    };
  }, [user]);

  const partnerMeta = useMemo(() => {
    if (!other) return null;
    const first = other.firstName || other.givenName;
    const last = other.lastName || other.familyName;
    const name = [first, last].filter(Boolean).join(" ") || other.name || other.displayName || other.email || other.phone || "Conversation";
    const role = other.role || (other.type === "trusted" ? "Trusted" : other.type === "youth" ? "Youth" : "User");
    const profileImage = other.profileImage || other.avatar || null;
    const secondary = other.email || other.phone || null;
    return { name, role, profileImage, secondary };
  }, [other]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const onSend = useCallback(async (newMessages = []) => {
    const m = newMessages[0];
    if (!m || !myUser._id) {
      Alert.alert("Unable to send", "We could not identify your account. Please sign in again.");
      return;
    }
    await sendMessage(m.text, myUser);
  }, [sendMessage, myUser]);

  const chatbotNavigate = useCallback(() => {
    const findNavigatorWithRoute = (nav) => {
      if (!nav) return null;
      const state = nav.getState?.();
      if (state?.routeNames?.includes?.("Activity")) return nav;
      const parent = nav.getParent?.();
      if (!parent || parent === nav) return null;
      return findNavigatorWithRoute(parent);
    };

    const tabNavigator = findNavigatorWithRoute(navigation);
    if (tabNavigator?.navigate) {
      tabNavigator.navigate("Activity", { screen: "Chatbot" });
      return;
    }
    navigation.navigate?.("Activity", { screen: "Chatbot" });
  }, [navigation]);

  if (!conversationId) {
    return (
      <NoConversationPlaceholder
        navigation={navigation}
        user={user}
        userToken={userToken}
        onChatbotPress={chatbotNavigate}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
      
      {/* Custom Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        {partnerMeta && (
          <View style={styles.headerContent}>
            <Image
              source={
                partnerMeta.profileImage
                  ? { uri: partnerMeta.profileImage }
                  : require("../../assets/icon.png")
              }
              style={styles.headerAvatar}
            />
            <View style={styles.headerText}>
              <Text style={styles.headerName}>{partnerMeta.name}</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.headerRole}>{partnerMeta.role}</Text>
              </View>
            </View>
          </View>
        )}
        
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Area */}
      <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
        <GiftedChat
          messages={messages}
          onSend={(msgs) => onSend(msgs)}
          user={myUser}
          placeholder="Type a message..."
          alwaysShowSend
          showUserAvatar
          showAvatarForEveryMessage
          renderAvatar={(props) => (
            props.currentMessage?.user?.avatar ? (
              <Image source={{ uri: props.currentMessage.user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Text style={styles.defaultAvatarText}>
                  {props.currentMessage?.user?.name?.charAt(0) || "U"}
                </Text>
              </View>
            )
          )}
          renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{
                right: {
                  backgroundColor: COLORS.secondary,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginVertical: 2,
                },
                left: {
                  backgroundColor: COLORS.primary,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginVertical: 2,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 1,
                },
              }}
              textStyle={{
                right: { 
                  color: "#FFFFFF", 
                  fontSize: 16,
                  lineHeight: 22,
                },
                left: { 
                  color: COLORS.textPrimary, 
                  fontSize: 16,
                  lineHeight: 22,
                },
              }}
              timeTextStyle={{
                right: { 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: 11,
                  marginTop: 4,
                },
                left: { 
                  color: COLORS.textTertiary, 
                  fontSize: 11,
                  marginTop: 4,
                },
              }}
              renderTime={(props) => (
                <Text style={props.currentMessage.user._id === myUser._id ? 
                  styles.timeTextRight : styles.timeTextLeft
                }>
                  {dayjs(props.currentMessage.createdAt).format('h:mm A')}
                </Text>
              )}
            />
          )}
          renderSend={(props) => (
            <Send {...props} containerStyle={styles.sendContainer}>
              <View style={styles.sendButton}>
                <MaterialIcons name="send" size={20} color="#FFFFFF" />
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
            <Composer
              {...props}
              textInputStyle={styles.composer}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textTertiary}
            />
          )}
          renderDay={(props) => (
            <Day
              {...props}
              textStyle={styles.dayText}
              wrapperStyle={styles.dayWrapper}
            />
          )}
          minInputToolbarHeight={68}
          bottomOffset={16}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

/* ---------------- Enhanced NoConversationPlaceholder ---------------- */
function NoConversationPlaceholder({ navigation, user, userToken, onChatbotPress }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [convosLoading, setConvosLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    fetchConversations();
  }, []);

  const handleChatbotPress = useCallback(() => {
    if (typeof onChatbotPress === 'function') {
      onChatbotPress();
      return;
    }
    navigation.navigate?.('Activity', { screen: 'Chatbot' });
  }, [onChatbotPress, navigation]);

  const fetchConversations = async () => {
    setConvosLoading(true);
    try {
      const { data } = await api.get('/api/chat/conversations', { 
        headers: { Authorization: `Bearer ${userToken}` } 
      });
      setConversations(data || []);
    } catch (e) {
      console.warn('Could not load conversations', e.message || e);
    } finally {
      setConvosLoading(false);
    }
  };

  const openNewConv = useCallback(() => {
    navigation.navigate('Profile', {
      screen: 'AddTrustedContact',
      params: { fromChat: true },
    });
  }, [navigation]);

  const startConversation = async (contact) => {
    const participantId = contact.trustedId || contact._id || contact.id;
    if (!participantId) {
      Alert.alert('Cannot start chat', 'This contact is not yet linked to a Healio user.');
      return;
    }

    try {
      const normalizedParticipant = String(participantId);
      const participants = [String(user?._id), normalizedParticipant];
      const { data: conv } = await api.post(
        '/api/chat/conversations',
        { participantId: normalizedParticipant },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      try {
        await import('../../services/messagingService').then((m) =>
          m.createConversationIfMissing(conv._id, { participants })
        );
      } catch (e) {
        console.warn('Firestore conversation creation warning', e.message || e);
      }

      setModalVisible(false);
      fetchConversations();
      const normalizedContact = {
        ...contact,
        _id: contact._id || contact.id || contact.trustedId || normalizedParticipant,
        role: contact.role || (contact.type === 'trusted' ? 'Trusted' : 'Youth'),
      };
      navigation.navigate('Profile', {
        screen: 'ChatRoom',
        params: { conversationId: conv._id, other: normalizedContact },
      });
    } catch (e) {
      console.warn('Conversation creation error', e.response?.data || e.message || e);
      Alert.alert('Error', e.response?.data?.message || 'Could not create conversation');
    }
  };

  const openConversation = (conv) => {
    const other = (conv.participants || []).find((p) => String(p._id) !== String(user?._id)) || 
                 (conv.participants && conv.participants[0]);
    navigation.navigate('Profile', {
      screen: 'ChatRoom',
      params: { conversationId: conv._id, other },
    });
  };

  const renderContactItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => startConversation(item)}
    >
      <Image
        source={{ 
          uri: item.avatar || item.profileImage || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BAQACAgEAj2rFZQAAAABJRU5ErkJggg==' 
        }}
        style={styles.contactAvatar}
      />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>
          {item.name || item.fullName || item.displayName || item.email}
        </Text>
        {item.phone && (
          <Text style={styles.contactPhone}>{item.phone}</Text>
        )}
        <Text style={styles.contactType}>
          {item.type === 'trusted' ? 'Trusted Contact' : 'Youth User'}
        </Text>
      </View>
      <View style={styles.chatButton}>
        <Feather name="message-circle" size={20} color={COLORS.secondary} />
      </View>
    </TouchableOpacity>
  );

  const renderConversationItem = ({ item, index }) => {
    const other = (item.participants || []).find((p) => String(p._id) !== String(user?._id)) || 
                 (item.participants && item.participants[0]);
    const fullName = (other?.firstName || other?.givenName) && (other?.lastName || other?.familyName)
      ? `${other?.firstName || other?.givenName} ${other?.lastName || other?.familyName}`
      : null;
    const displayName = fullName || other?.name || other?.displayName || other?.email || other?.phone || 'Conversation';

    return (
      <Animated.View
        style={[
          styles.conversationItem,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.conversationTouchable}
          onPress={() => openConversation(item)}
        >
          <Image
            source={{
              uri: other?.profileImage || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BAQACAgEAj2rFZQAAAABJRU5ErkJggg=='
            }}
            style={styles.conversationAvatar}
          />
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text style={styles.conversationName}>{displayName}</Text>
              <Text style={styles.conversationTime}>
                {item.lastMessageAt ? dayjs(item.lastMessageAt).format('MMM D') : ''}
              </Text>
            </View>
            <Text style={styles.conversationPreview} numberOfLines={1}>
              {item.lastMessage || 'Start a new conversation'}
            </Text>
          </View>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.placeholderContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Enhanced Header */}
      <Animated.View 
        style={[
          styles.placeholderHeader,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View>
          <Text style={styles.placeholderTitle}>Messages</Text>
          <Text style={styles.placeholderSubtitle}>
            {conversations.length} active conversation{conversations.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={openNewConv}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Conversations List */}
      <Animated.View 
        style={[
          styles.conversationsList,
          { opacity: fadeAnim }
        ]}
      >
        {convosLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <MaterialCommunityIcons 
                name="message-text-outline" 
                size={80} 
                color={COLORS.border} 
              />
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a new conversation to stay connected with your trusted contacts
            </Text>
            <TouchableOpacity 
              style={styles.startChatButton}
              onPress={openNewConv}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
              <Text style={styles.startChatText}>Start New Chat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item._id}
            renderItem={renderConversationItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.conversationsContainer}
          />
        )}
      </Animated.View>

      {/* New Conversation Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Conversation</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={COLORS.secondary} />
              <Text style={styles.modalLoadingText}>Loading contacts...</Text>
            </View>
          ) : contacts.length === 0 ? (
            <View style={styles.noContacts}>
              <MaterialCommunityIcons 
                name="account-multiple-outline" 
                size={64} 
                color={COLORS.border} 
              />
              <Text style={styles.noContactsTitle}>No contacts available</Text>
              <Text style={styles.noContactsText}>
                Add trusted contacts or connect with youth users to start chatting
              </Text>
            </View>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(item) => item._id || item.id || item.email || item.phone}
              renderItem={renderContactItem}
              style={styles.contactsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Enhanced AI Assistant FAB */}
      <Animated.View 
        style={[
          styles.placeholderFab,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.fabButton}
          activeOpacity={0.8}
          onPress={handleChatbotPress}
        >
          <View style={styles.fabGradient}>
            <MaterialCommunityIcons name="robot-happy" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.fabPulse} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  headerText: {
    marginLeft: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  headerRole: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  headerButton: {
    padding: 8,
  },

  // Chat styles
  chatContainer: {
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  defaultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultAvatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  timeTextRight: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  timeTextLeft: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  composer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  dayText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  dayWrapper: {
    backgroundColor: 'transparent',
  },
  // FAB styles
  placeholderFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 1000,
  },
  fabButton: {
    position: 'relative',
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPulse: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    opacity: 0.6,
    animation: 'pulse 2s infinite',
  },

  // Placeholder styles
  placeholderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  newChatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Conversations list styles
  conversationsList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  conversationsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  conversationItem: {
    marginBottom: 8,
  },
  conversationTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  conversationAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  conversationTime: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  conversationPreview: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 6,
  },

  // Empty state styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startChatText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.primary,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  noContacts: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  noContactsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  noContactsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  contactType: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  chatButton: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
});
