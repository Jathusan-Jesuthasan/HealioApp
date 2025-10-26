import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Modal,
  TextInput,
  Switch,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from '@react-navigation/native';
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { AuthContext } from "../../context/AuthContext";
import LogoutModal from "./LogoutModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../config/api";
import DateTimePicker from "@react-native-community/datetimepicker";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Updated color theme
const COLORS = {
  // Primary (60%) - Soft light gray-blue
  primary: "#F5F7FA",
  primaryLight: "#FFFFFF",
  primaryDark: "#E4E7EB",
  
  // Secondary (30%) - Calm blue
  secondary: "#4A90E2",
  secondaryLight: "#63A0E8",
  secondaryDark: "#3A7BC8",
  
  // Accent (10%) - Emerald green
  accent: "#10B981",
  accentLight: "#34D399",
  accentDark: "#0D9C6D",
  
  // Background and surface colors
  bg: "#F5F7FA",
  card: "#FFFFFF",
  text: "#1E293B",
  textLight: "#64748B",
  textLighter: "#94A3B8",
  border: "#E2E8F0",
  
  // Semantic colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, signOut, setUserRole, refreshUser, userToken } = useContext(AuthContext);
  const isFocused = useIsFocused();

  const [profile, setProfile] = useState({
    name: user?.name || "Demo User",
    email: user?.email || "demo@healio.app",
    role: user?.role || "youth",
    avatar:
      user?.photoURL ||
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&h=300&fit=facearea&auto=format",
    gender: user?.gender || "Not specified",
  });
  const [trustedList, setTrustedList] = useState([]);
  const [monitoredList, setMonitoredList] = useState([]);
  const [trustedCount, setTrustedCount] = useState(0);
  const [monitoredCount, setMonitoredCount] = useState(0);
  const [trustedPersonStatus, setTrustedPersonStatus] = useState('inactive');
  const [chatLoadingId, setChatLoadingId] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);

  const [isLogoutModal, setLogoutModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastRole, setLastRole] = useState(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const undoTimerRef = useRef(null);

  const isYouth = (profile.role || '').toString().toLowerCase() === 'youth';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // sync local profile fields when user updates
    setProfile((p) => ({
      ...p,
      name: user?.name || p.name,
      email: user?.email || p.email,
      role: user?.role || p.role,
      avatar: user?.avatarUrl || user?.photoURL || user?.profileImage || p.avatar,
      gender: user?.gender || p.gender,
    }));

    // Enhanced animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // When the screen gains focus, refresh the profile shown
  useEffect(() => {
    if (isFocused && userToken) fetchProfile();
  }, [isFocused, userToken]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [-50, 0],
    extrapolate: 'clamp',
  });

  // fetch latest profile from backend and populate UI state
  const fetchProfile = async () => {
    if (!userToken) return;
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const { data } = await api.get("/api/users/me", { headers });
      const mapped = {
        name: data.name || profile.name,
        email: data.email || profile.email,
        role: data.role || profile.role,
        avatar: data.avatarUrl || data.profileImage || profile.avatar,
        gender: data.gender || profile.gender,
      };
      setProfile(mapped);
      // populate trusted/monitored lists (limit to 3 displayed)
      const trusted = data.trustedContacts || [];
      const monitored = data.linkedYouthIds || data.linkedYouth || [];
      setTrustedCount(trusted.length || 0);
      setMonitoredCount(monitored.length || 0);
      setTrustedList((trusted || []).slice(0, 3));
      setMonitoredList((monitored || []).slice(0, 3));
      const derivedStatus = data?.trustedPersonStatus
        || (Array.isArray(trusted) && trusted.length > 0 ? 'active' : 'inactive');
      setTrustedPersonStatus(derivedStatus);

      try {
        const questionnaireResponse = await api.get("/api/questionnaire", { headers });
        setQuestionnaire(questionnaireResponse?.data?.data || null);
      } catch (questionnaireErr) {
        const status = questionnaireErr?.response?.status;
        if (status === 404 || status === 403) {
          setQuestionnaire(null);
        } else {
          console.warn("Could not fetch questionnaire:", questionnaireErr.message || questionnaireErr);
          setQuestionnaire(null);
        }
      }
    } catch (e) {
      console.warn("Could not fetch profile:", e.message || e);
      setQuestionnaire(null);
    }
  };
  const questionnaireEntries = useMemo(() => {
    if (!questionnaire) return [];

    const entries = [];
    const addEntry = (id, label, formatter, options = {}) => {
      const raw = questionnaire[id];
      const includeFalse = options.includeFalse === true;

      if (typeof raw === "boolean") {
        if (!includeFalse && raw === false) return;
      } else if (raw === null || raw === undefined || raw === "") {
        return;
      } else if (Array.isArray(raw) && raw.length === 0) {
        return;
      }

      const formatted = typeof formatter === "function" ? formatter(raw) : raw;
      if (formatted === null || formatted === undefined || formatted === "") return;

      entries.push({ id, label, value: formatted });
    };

    addEntry("age", "Age", (value) => `${value} years old`);
    addEntry("gender", "Gender");
    addEntry("stressLevel", "Stress Level");
    addEntry("sleepQuality", "Sleep Quality");
    addEntry("socialSupport", "Social Support");
    addEntry("academicPressure", "Academic Pressure");
    addEntry(
      "preferredSupportType",
      "Preferred Support",
      (value) => (Array.isArray(value) ? value.join(", ") : value)
    );
    addEntry(
      "hasEmergencyContact",
      "Emergency Contact",
      (value) => (value ? "Yes" : "No"),
      { includeFalse: true }
    );

    if (questionnaire.hasEmergencyContact) {
      addEntry("emergencyContactName", "Contact Name");
      addEntry("emergencyContactPhone", "Contact Phone");
    }

    addEntry(
      "allowMoodTracking",
      "Mood Tracking",
      (value) => (value ? "Enabled" : "Disabled"),
      { includeFalse: true }
    );

    addEntry("additionalNotes", "Additional Notes", (value) => {
      if (typeof value !== "string") return String(value);
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    });

    return entries;
  }, [questionnaire]);

  const questionnaireUpdatedLabel = useMemo(() => {
    if (!questionnaire?.updatedAt) return null;
    try {
      const date = new Date(questionnaire.updatedAt);
      return `Updated ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (err) {
      return null;
    }
  }, [questionnaire]);


  const getTrustedPersonStatusText = () => {
    const statusMap = {
      active: { text: 'Active - Notifications Enabled', color: COLORS.accent, icon: '🔔' },
      inactive: { text: 'Inactive - Setup Required', color: COLORS.textLight, icon: '⚙️' },
      notified: { text: 'Recently Notified', color: COLORS.warning, icon: '📤' },
    };
    return statusMap[trustedPersonStatus] || statusMap.inactive;
  };

  // Quick role toggle with undo support
  const handleQuickRoleToggle = async () => {
    const current = user?.role || profile.role || "youth";
    const newRole = (current === "trusted" || current === "Trusted") ? "Youth" : "Trusted";
    const normalized = newRole === 'Trusted' ? 'Trusted' : 'Youth';
    const previous = (current && current.toString().toLowerCase() === 'trusted') ? 'Trusted' : 'Youth';
    try {
      // optimistic update
      await AsyncStorage.setItem("userRole", normalized);
      setUserRole(normalized);
      setProfile((p) => ({ ...p, role: newRole }));
      setLastRole(previous);
      setUndoVisible(true);
      // save to backend
      await api.put(
        "/api/users/me",
        { role: normalized },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      await refreshUser();
      // start undo timer (8s)
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setUndoVisible(false);
        setLastRole(null);
      }, 8000);
    } catch (e) {
      console.error("Quick role toggle failed:", e.message || e);
      Alert.alert("Error", "Could not switch role right now");
      // revert local changes
      await AsyncStorage.setItem("userRole", previous);
      setUserRole(previous);
      setProfile((p) => ({ ...p, role: previous }));
    }
  };

  const handleUndoRole = async () => {
    if (!lastRole) return;
    try {
      const canonical = lastRole && lastRole.toString().toLowerCase() === 'trusted' ? 'Trusted' : 'Youth';
      await AsyncStorage.setItem("userRole", canonical);
      setUserRole(canonical);
      setProfile((p) => ({ ...p, role: canonical }));
      await api.put("/api/users/me", { role: canonical }, { headers: { Authorization: `Bearer ${userToken}` } });
      await refreshUser();
    } catch (e) {
      console.warn("Undo role failed:", e.message || e);
    } finally {
      setUndoVisible(false);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setLastRole(null);
    }
  };

  const resolveContactId = useCallback((contact) => {
    if (!contact) return null;

    if (typeof contact === 'string') {
      const normalized = contact.trim();
      return normalized.length ? normalized : null;
    }

    const currentId = user?._id ? String(user._id) : null;
    const normalize = (value) => {
      if (!value) return null;
      const candidate = String(value);
      return currentId && candidate === currentId ? null : candidate;
    };

    const priorityCandidates = [
      contact.linkedUserId,
      contact.linkedYouthId,
      contact.userId,
      contact.trustedUserId,
      contact.trustedId,
      contact.youthId,
      contact.participantId,
      contact.targetUserId,
      contact.memberId,
      contact.accountId,
    ];

    for (const field of priorityCandidates) {
      const resolved = normalize(field);
      if (resolved) return resolved;
    }

    if (contact.user) {
      const linkedUser =
        typeof contact.user === 'object'
          ? contact.user._id || contact.user.id
          : contact.user;
      const resolved = normalize(linkedUser);
      if (resolved) return resolved;
    }

    if (!contact.user && (contact._id || contact.id)) {
      const resolved = normalize(contact._id || contact.id);
      if (resolved) return resolved;
    }

    return null;
  }, [user?._id]);

  const handleOpenChat = useCallback(async (contact) => {
    if (!userToken) {
      Alert.alert('Unavailable', 'Please sign in again to start a chat.');
      return;
    }

    const contactId = resolveContactId(contact);
    if (!contactId) {
      Alert.alert('Invite pending', 'This contact has not linked a Healio account yet. Ask them to join to start chatting.');
      return;
    }

    if (chatLoadingId) {
      return;
    }

    const myId = user?._id || user?.id;

    try {
      setChatLoadingId(contactId);
      const { data: conversation } = await api.post(
        '/api/chat/conversations',
        { participantId: contactId },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      const participants = conversation?.participants || [];
      const partner = participants.find((p) => String(p?._id) !== String(myId)) || null;

      const baseContact =
        typeof contact === 'object' && contact !== null ? contact : { id: contactId };

      const normalizedContact = {
        ...baseContact,
        ...(partner || {}),
        _id: partner?._id || baseContact._id || contactId,
        role:
          partner?.role ||
          baseContact.role ||
          (profile.role === 'Trusted' ? 'Youth' : 'Trusted'),
      };

      if (myId) {
        try {
          await import('../../services/messagingService').then((m) =>
            m.createConversationIfMissing(conversation._id, {
              participants: [String(myId), String(contactId)],
            })
          );
        } catch (err) {
          console.warn('Could not ensure messaging room', err.message || err);
        }
      }

      navigation.navigate('ChatRoom', {
        conversationId: conversation._id,
        other: normalizedContact,
      });
    } catch (err) {
      console.warn('Open chat via profile failed:', err.response?.data || err.message || err);
      Alert.alert('Unable to open chat', err.response?.data?.message || 'Please try again in a moment.');
    } finally {
      setChatLoadingId(null);
    }
  }, [chatLoadingId, navigation, profile.role, resolveContactId, user?._id, userToken]);

  const ProfileCard = ({ icon, title, subtitle, onPress, color = COLORS.secondary, badge }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <MotiView
        from={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "timing", duration: 400 }}
      >
        <View style={styles.profileCard}>
          <View style={[styles.profileCardIcon, { backgroundColor: `${color}15` }]}>
            {icon}
          </View>
          <View style={styles.profileCardContent}>
            <Text style={styles.profileCardTitle}>{title}</Text>
            {subtitle && <Text style={styles.profileCardSubtitle}>{subtitle}</Text>}
          </View>
          {badge && (
            <View style={[styles.profileBadge, { backgroundColor: badge.color }]}>
              <Text style={styles.profileBadgeText}>{badge.text}</Text>
            </View>
          )}
          <Feather name="chevron-right" size={20} color={COLORS.textLighter} />
        </View>
      </MotiView>
    </TouchableOpacity>
  );

  const handleLogout = () => {
    setLogoutModal(false);
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (!userToken) return Alert.alert("Not authenticated", "Please log in to delete your account.");
    Alert.alert("Delete Account", "This will permanently remove your account. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete("/api/users/me", { headers: { Authorization: `Bearer ${userToken}` } });
            Alert.alert("Deleted", "Your account has been deleted.");
            await signOut();
          } catch (e) {
            console.error("Delete account failed:", e.message || e);
            Alert.alert("Error", "Could not delete account");
          }
        },
      },
    ]);
  };

  const trustedStatusDetails = getTrustedPersonStatusText();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
      
      {/* Sticky Header */}
      <Animated.View 
        style={[
          styles.stickyHeader,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          }
        ]}
      >
        <View style={styles.stickyHeaderBackground}>
          <Text style={styles.stickyHeaderTitle}>Profile</Text>
          <View style={styles.stickyHeaderUser}>
            <Image source={{ uri: profile.avatar }} style={styles.stickyHeaderAvatar} />
            <Text style={styles.stickyHeaderName}>{profile.name}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Main Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              alignItems: "center",
            }}
          >
            <View style={styles.avatarContainer}>
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              <View style={styles.onlineIndicator} />
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{profile.name}</Text>
            <Text style={styles.userEmail}>{profile.email}</Text>
            
            {/* Role Badge with Toggle */}
            <TouchableOpacity 
              style={[
                styles.roleContainer,
                { 
                  backgroundColor: profile.role === "Trusted" ? "rgba(16, 185, 129, 0.1)" : "rgba(74, 144, 226, 0.1)",
                  borderColor: profile.role === "Trusted" ? COLORS.accent : COLORS.secondary
                }
              ]}
              onPress={handleQuickRoleToggle}
            >
              <Ionicons 
                name={profile.role === "Trusted" ? "heart" : "person"} 
                size={16} 
                color={profile.role === "Trusted" ? COLORS.accent : COLORS.secondary} 
              />
              <Text style={[
                styles.roleText,
                { color: profile.role === "Trusted" ? COLORS.accent : COLORS.secondary }
              ]}>
                {profile.role === "Trusted" ? "Trusted Person" : "Youth"}
              </Text>
              <Feather name="repeat" size={14} color={COLORS.textLight} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>85%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>28</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
        </View>

        {/* Connections preview (trusted contacts or monitored youth) */}
        <View style={[styles.section, { marginHorizontal: 20 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>
              {profile.role === 'Trusted' ? 'Monitored Youth' : 'Trusted Contacts'}
              {" "}
              <Text style={{ fontSize: 14, color: COLORS.textLight }}>({profile.role === 'Trusted' ? monitoredCount : trustedCount})</Text>
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('TrustedContacts')}
            >
              <Text style={{ color: COLORS.secondary, fontWeight: '700' }}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            {(profile.role === 'Trusted' ? monitoredList : trustedList).map((p) => {
              const contactId = resolveContactId(p);
              const isChatLoading = contactId && chatLoadingId === contactId;
              return (
              <TouchableOpacity key={p._id || p.id || p.email || contactId} style={{ flex: 1, marginRight: 8 }} activeOpacity={0.8}>
                <View style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}>
                  <Image
                    source={{
                      uri:
                        p.avatar || p.profileImage || p.photoURL || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BAQACAgEAj2rFZQAAAABJRU5ErkJggg=='
                    }}
                    style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 8 }}
                  />
                  <Text style={{ fontWeight: '700', color: COLORS.text }} numberOfLines={1}>{p.name || p.fullName || p.displayName || p.email}</Text>
                  {p.phone ? <Text style={{ color: COLORS.textLight, fontSize: 12 }}>{p.phone}</Text> : null}
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <TouchableOpacity
                      style={{ marginRight: 8, opacity: contactId ? 1 : 0.4 }}
                      onPress={() => handleOpenChat(p)}
                      disabled={!contactId || isChatLoading}
                    >
                      {isChatLoading ? (
                        <ActivityIndicator size="small" color={COLORS.secondary} />
                      ) : (
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.secondary} />
                      )}
                    </TouchableOpacity>
                    {p.phone ? (
                      <TouchableOpacity onPress={() => {
                        // dial
                        const tel = `tel:${p.phone}`;
                        Linking.openURL(tel).catch(() => Alert.alert('Error','Could not open dialer'));
                      }}>
                        <Ionicons name="call-outline" size={20} color={COLORS.accent} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
            })}
            {/* show placeholder boxes if less than 3 to keep layout */}
            {Array.from({ length: Math.max(0, 3 - (profile.role === 'Trusted' ? monitoredList.length : trustedList.length)) }).map((_, i) => (
              <View key={`empty-${i}`} style={{ flex: 1, marginRight: 8, backgroundColor: COLORS.primaryDark, borderRadius: 12, padding: 12, opacity: 0.03 }} />
            ))}
          </View>
        </View>

        {/* Trusted Support Network */}
        {isYouth && (
          <View style={styles.trustedCard}>
            <View style={styles.trustedCardHeader}>
              <Text style={styles.trustedCardTitle}>👨‍👩‍👧 Trusted Support Network</Text>
              <Ionicons name="people" size={20} color={COLORS.secondary} />
            </View>

            <View style={styles.trustedStatus}>
              <Text
                style={[styles.trustedStatusText, { color: trustedStatusDetails.color }]}
              >
                {trustedStatusDetails.icon} {trustedStatusDetails.text}
              </Text>

              <Text style={styles.trustedDescription}>
                {trustedPersonStatus === 'active'
                  ? 'Your trusted person will receive automated alerts if concerning patterns are detected.'
                  : 'Link a trusted contact so they can be notified when you might need support.'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.trustedButton}
              onPress={() => navigation.navigate('TrustedPerson')}
            >
              <Text style={styles.trustedButtonText}>
                {trustedPersonStatus === 'active' ? 'Manage Settings' : 'Setup Trusted Contact'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Actions Grid */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("PersonalInfo")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
              <Ionicons name="person-outline" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.actionTitle}>Personal Info</Text>
            <Text style={styles.actionSubtitle}>Update your details</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("YouthQuestionnaire")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
              <Ionicons name="clipboard-outline" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.actionTitle}>Wellness</Text>
            <Text style={styles.actionSubtitle}>Assessment</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("Settings")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
              <Ionicons name="settings-outline" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.actionTitle}>Settings</Text>
            <Text style={styles.actionSubtitle}>Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("HelpCenter")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
              <Ionicons name="help-circle-outline" size={24} color={COLORS.error} />
            </View>
            <Text style={styles.actionTitle}>Support</Text>
            <Text style={styles.actionSubtitle}>Get help</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Sections */}
        <View style={styles.sectionsContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wellness Snapshot</Text>
            {questionnaireEntries.length > 0 ? (
              <View style={styles.wellnessCard}>
                {questionnaireEntries.map((entry, index) => (
                  <View key={entry.id} style={styles.wellnessRow}>
                    <Text style={styles.wellnessLabel}>{entry.label}</Text>
                    <Text style={styles.wellnessValue}>{entry.value}</Text>
                    {index < questionnaireEntries.length - 1 && <View style={styles.wellnessDivider} />}
                  </View>
                ))}
                {questionnaireUpdatedLabel ? (
                  <Text style={styles.wellnessUpdated}>{questionnaireUpdatedLabel}</Text>
                ) : null}
              </View>
            ) : (
              <View style={[styles.wellnessCard, styles.wellnessEmptyCard]}>
                <Text style={styles.wellnessEmptyText}>
                  Complete the wellness assessment to unlock personalized insights here.
                </Text>
                <TouchableOpacity
                  style={styles.wellnessAction}
                  onPress={() => navigation.navigate("YouthQuestionnaire", { showRolePrompt: true })}
                >
                  <Text style={styles.wellnessActionText}>Start Assessment</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Account Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <ProfileCard
              icon={<Ionicons name="notifications-outline" size={22} color={COLORS.secondary} />}
              title="Notifications"
              subtitle="Manage your alerts"
              onPress={() => navigation.navigate("Notifications")}
              color={COLORS.secondary}
            />
            <ProfileCard
              icon={<Ionicons name="color-palette-outline" size={22} color={COLORS.warning} />}
              title="Appearance"
              subtitle="Theme & display"
              onPress={() => navigation.navigate("Theme")}
              color={COLORS.warning}
            />
            <ProfileCard
              icon={<Ionicons name="language-outline" size={22} color={COLORS.accent} />}
              title="Language"
              subtitle="App language"
              onPress={() => navigation.navigate("Language")}
              color={COLORS.accent}
            />
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <ProfileCard
              icon={<Ionicons name="help-buoy-outline" size={22} color={COLORS.secondary} />}
              title="Help Center"
              subtitle="Get assistance"
              onPress={() => navigation.navigate("HelpCenter")}
              color={COLORS.secondary}
            />
            <ProfileCard
              icon={<Ionicons name="shield-checkmark-outline" size={22} color={COLORS.accent} />}
              title="Privacy & Security"
              subtitle="Data protection"
              onPress={() => navigation.navigate("Privacy")}
              color={COLORS.accent}
            />
            <ProfileCard
              icon={<Ionicons name="document-text-outline" size={22} color={COLORS.textLight} />}
              title="Terms of Service"
              subtitle="Legal information"
              onPress={() => navigation.navigate("Terms")}
              color={COLORS.textLight}
            />
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity 
              style={[styles.dangerCard, { borderColor: COLORS.error }]}
              onPress={() => setLogoutModal(true)}
            >
              <View style={[styles.profileCardIcon, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
              </View>
              <View style={styles.profileCardContent}>
                <Text style={[styles.profileCardTitle, { color: COLORS.error }]}>Log Out</Text>
                <Text style={[styles.profileCardSubtitle, { color: COLORS.error }]}>Sign out of your account</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.dangerCard, { borderColor: "#991B1B" }]}
              onPress={handleDeleteAccount}
            >
              <View style={[styles.profileCardIcon, { backgroundColor: "rgba(153, 27, 27, 0.1)" }]}>
                <Ionicons name="trash-outline" size={22} color="#991B1B" />
              </View>
              <View style={styles.profileCardContent}>
                <Text style={[styles.profileCardTitle, { color: "#991B1B" }]}>Delete Account</Text>
                <Text style={[styles.profileCardSubtitle, { color: "#991B1B" }]}>Permanently remove account</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Healio v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Healio. All rights reserved.</Text>
        </View>
      </Animated.ScrollView>

      {/* UNDO BANNER */}
      {undoVisible && (
        <MotiView
          from={{ translateY: 100, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          style={styles.undoBanner}
        >
          <View style={styles.undoContent}>
            <Ionicons name="swap-horizontal" size={20} color="#065F46" />
            <View style={styles.undoTextContainer}>
              <Text style={styles.undoTitle}>Role Changed</Text>
              <Text style={styles.undoSubtitle}>You are now <Text style={styles.undoHighlight}>{profile.role}</Text></Text>
            </View>
            <TouchableOpacity onPress={handleUndoRole} style={styles.undoButton}>
              <Text style={styles.undoButtonText}>UNDO</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      )}

      <LogoutModal visible={isLogoutModal} onClose={() => setLogoutModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 100,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stickyHeaderBackground: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  stickyHeaderTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  stickyHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stickyHeaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  stickyHeaderName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  profileHeader: {
    backgroundColor: COLORS.card,
    paddingTop: 10,
    paddingBottom: 30,
    height: 250,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  trustedCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  trustedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trustedCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  trustedStatus: {
    marginBottom: 20,
  },
  trustedStatusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  trustedDescription: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  trustedButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  trustedButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  sectionsContainer: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginLeft: 4,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileCardContent: {
    flex: 1,
  },
  profileCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  profileCardSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  wellnessCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  wellnessRow: {
    marginBottom: 12,
  },
  wellnessLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  wellnessValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  wellnessDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 12,
  },
  wellnessUpdated: {
    marginTop: 12,
    fontSize: 12,
    color: COLORS.textLighter,
    textAlign: 'right',
  },
  wellnessEmptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  wellnessEmptyText: {
    color: COLORS.textLight,
    fontSize: 14,
    textAlign: 'center',
  },
  wellnessAction: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
  },
  wellnessActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  dangerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  undoBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
    backgroundColor: '#D1FAE5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  undoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  undoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  undoTitle: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 14,
  },
  undoSubtitle: {
    color: '#065F46',
    fontSize: 12,
    marginTop: 2,
  },
  undoHighlight: {
    fontWeight: '800',
  },
  undoButton: { 
    paddingHorizontal: 16, 
    paddingVertical: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
  },
  undoButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '800',
    fontSize: 12,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  versionText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  copyrightText: {
    color: COLORS.textLighter,
    fontSize: 12,
  },
});