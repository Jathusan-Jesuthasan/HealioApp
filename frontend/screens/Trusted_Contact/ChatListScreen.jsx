import React, { useContext, useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Image,
  Animated,
  SafeAreaView,
  StatusBar,
  Dimensions
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import api from "../../config/api";
import { AuthContext } from "../../context/AuthContext";

dayjs.extend(relativeTime);

const { width: screenWidth } = Dimensions.get("window");

// Your app theme colors
const COLORS = {
  primary: "#F5F7FA",
  secondary: "#4A90E2",
  accent: "#10B981",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  white: "#FFFFFF",
  border: "#E2E8F0",
  surface: "#FFFFFF",
};

export default function ChatListScreen({ navigation }) {
  const { userToken, user } = useContext(AuthContext);
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const load = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const { data } = await api.get("/api/chat/conversations", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setConvos(data || []);
    } catch (e) {
      console.log("Chat load error:", e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      load();
      // Start animations
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
    });
    return unsub;
  }, [navigation]);

  const onRefresh = () => {
    load(true);
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'trusted': return COLORS.secondary;
      case 'youth': return COLORS.accent;
      case 'admin': return '#8B5CF6';
      default: return COLORS.textTertiary;
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'trusted': return 'shield-checkmark';
      case 'youth': return 'person';
      case 'admin': return 'star';
      default: return 'chatbubble';
    }
  };

  const ChatCard = ({ item, index }) => {
    const cardScale = useRef(new Animated.Value(1)).current;
    const cardOpacity = useRef(new Animated.Value(1)).current;

    const others = (item.participants || []).filter((p) => String(p._id) !== String(user?._id));
    const baseOther = others[0] || {};
    const normalizedOther = {
      ...baseOther,
      _id: baseOther?._id ? String(baseOther._id) : undefined,
      profileImage: baseOther?.profileImage || baseOther?.avatar || null,
      role:
        baseOther?.role ||
        (baseOther?.type === 'trusted' ? 'Trusted' : baseOther?.type === 'youth' ? 'Youth' : 'User'),
    };

    const fullName = (normalizedOther?.firstName || normalizedOther?.givenName) && (normalizedOther?.lastName || normalizedOther?.familyName)
      ? `${normalizedOther?.firstName || normalizedOther?.givenName} ${normalizedOther?.lastName || normalizedOther?.familyName}`
      : null;
    
    const displayName = fullName || normalizedOther?.name || normalizedOther?.displayName || normalizedOther?.email || normalizedOther?.phone || 'Support Contact';
    const lastMessageTime = item.lastMessageAt ? dayjs(item.lastMessageAt).fromNow() : "No messages";
    const hasUnread = item.unreadCount > 0;
    const isOnline = Math.random() > 0.5; // Mock online status - replace with real data

    const handlePressIn = () => {
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 0.98,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handlePressOut = () => {
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    };

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: cardScale }
          ],
        }}
      >
        <TouchableOpacity
          style={styles.card}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() =>
            navigation.navigate("Profile", {
              screen: "ChatRoom",
              params: { conversationId: item._id, other: normalizedOther },
            })
          }
          activeOpacity={0.9}
        >
          {/* Avatar with online status */}
          <View style={styles.avatarContainer}>
            <Image
              source={
                normalizedOther.profileImage
                  ? { uri: normalizedOther.profileImage }
                  : require("../../assets/icon.png")
              }
              style={styles.avatar}
            />
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.nameContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(normalizedOther.role) + '15' }]}>
                  <Ionicons 
                    name={getRoleIcon(normalizedOther.role)} 
                    size={12} 
                    color={getRoleColor(normalizedOther.role)} 
                  />
                  <Text style={[styles.roleText, { color: getRoleColor(normalizedOther.role) }]}>
                    {normalizedOther.role}
                  </Text>
                </View>
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.time}>{lastMessageTime}</Text>
                {hasUnread && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.messagePreview}>
              <Text 
                style={[
                  styles.previewText,
                  hasUnread && styles.previewTextUnread
                ]}
                numberOfLines={2}
              >
                {item.lastMessage || "Start a conversation..."}
              </Text>
              {hasUnread && <View style={styles.unreadDot} />}
            </View>
          </View>

          {/* Navigation Arrow */}
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = () => (
    <Animated.View 
      style={[
        styles.emptyState,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <MaterialCommunityIcons 
        name="message-text-outline" 
        size={80} 
        color={COLORS.border} 
      />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyText}>
        Start a conversation with your trusted contacts or support team
      </Text>
      <TouchableOpacity 
        style={styles.startChatButton}
        onPress={() => navigation.navigate("Contacts")}
      >
        <Ionicons name="person-add" size={20} color={COLORS.white} />
        <Text style={styles.startChatText}>Find Contacts</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
      
      <LinearGradient
        colors={["#F0F7FF", "#F8FAFC"]}
        style={styles.background}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Messages</Text>
              <Text style={styles.subtitle}>
                {convos.length} active conversation{convos.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.newChatButton}
              onPress={() => navigation.navigate("Contacts")}
            >
              <Ionicons name="add" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : convos.length === 0 ? (
          <EmptyState />
        ) : (
          <Animated.FlatList
            data={convos}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => <ChatCard item={item} index={index} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            style={{ opacity: fadeAnim }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  background: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
    marginBottom: 6,
  },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  previewTextUnread: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginTop: 5,
  },
  arrowContainer: {
    marginLeft: 12,
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startChatText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});