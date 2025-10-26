import React, { useEffect, useState, useContext, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { MotiView, MotiText } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../config/api";
import { AuthContext } from "../../context/AuthContext";

export default function TrustedContactsScreen({ navigation, route }) {
  const { userToken, user, userRole } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileRole, setProfileRole] = useState(null);
  const [chatLoadingId, setChatLoadingId] = useState(null);

  const canonicalRole = useCallback((value) => {
    return value && value.toString().toLowerCase() === "trusted" ? "Trusted" : "Youth";
  }, []);

  const activeRole = useMemo(() => {
    if (profileRole) return profileRole;
    if (user?.role) return canonicalRole(user.role);
    if (userRole) return canonicalRole(userRole);
    return "Youth";
  }, [canonicalRole, profileRole, user?.role, userRole]);

  const currentUserId = useMemo(() => {
    if (user?._id) return String(user._id);
    if (user?.id) return String(user.id);
    return null;
  }, [user]);

  const resolveParticipantId = useCallback(
    (contact) => {
      const currentId = currentUserId;
      const unwrap = (candidate) => {
        if (!candidate) return null;
        if (typeof candidate === "object") {
          return candidate._id || candidate.id || null;
        }
        return candidate;
      };

      const candidates = [
        contact.participantId,
        contact.linkedUserId,
        contact.linkedYouthId,
        contact.trustedUserId,
        contact.trustedId,
        contact.youthId,
        contact.userId,
        contact._id,
        contact.id,
      ];

      for (const candidate of candidates) {
        const value = unwrap(candidate);
        if (!value) continue;
        const normalized = String(value);
        if (normalized.length === 0) continue;
        if (currentId && normalized === currentId) continue;
        return normalized;
      }

      return null;
    },
    [currentUserId]
  );

  const fetchContacts = useCallback(
    async ({ silent = false } = {}) => {
      if (!userToken) {
        setContacts([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      const headers = { Authorization: `Bearer ${userToken}` };

      try {
        const { data: profile } = await api.get("/api/users/me", { headers });
        const role = canonicalRole(profile.role || user?.role || userRole);
        setProfileRole(role);

        if (role === "Trusted") {
          const { data: incoming } = await api.get("/api/trusted/requests/incoming", { headers });
          const requests = incoming?.data || [];
          const accepted = requests
            .filter((req) => req.status === "Accepted" && req.youthId)
            .map((req) => ({
              ...req.youthId,
              participantId: req.youthId?._id || req.youthId?.id || null,
              linkedYouthId: req.youthId?._id || req.youthId?.id || null,
              requestId: req._id,
              requestStatus: req.status,
              type: "youth",
              linkedAt: req.updatedAt || req.createdAt,
            }));
          setContacts(accepted);
        } else {
          const { data: outgoing } = await api.get("/api/trusted/requests/outgoing", { headers });
          const requests = outgoing?.data || [];
          const accepted = requests
            .filter((req) => req.status === "Accepted" && req.trustedId)
            .map((req) => ({
              ...req.trustedId,
              participantId: req.trustedId?._id || req.trustedId?.id || null,
              linkedUserId: req.trustedId?._id || req.trustedId?.id || null,
              requestId: req._id,
              requestStatus: req.status,
              type: "trusted",
              linkedAt: req.updatedAt || req.createdAt,
            }));
          setContacts(accepted);
        }
      } catch (error) {
        const message = error?.response?.data?.message || "Could not load contacts.";
        console.warn("Linked contacts fetch error", message);
        if (!silent) {
          Alert.alert("Error", message);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
        setRefreshing(false);
      }
    },
    [canonicalRole, user?.role, userRole, userToken]
  );

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => fetchContacts({ silent: true }));
    return unsubscribe;
  }, [fetchContacts, navigation]);

  useEffect(() => {
    if (route?.params?.refreshedAt) {
      fetchContacts();
    }
  }, [fetchContacts, route?.params?.refreshedAt]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContacts({ silent: true });
  }, [fetchContacts]);

  const handleOpenChat = useCallback(
    async (contact) => {
      if (!userToken) {
        Alert.alert("Sign in required", "Please log in again to start a chat.");
        return;
      }

      const participantId = resolveParticipantId(contact);
      if (!participantId) {
        Alert.alert(
          "Not available",
          "This connection has not linked their Healio account yet."
        );
        return;
      }

      if (chatLoadingId && chatLoadingId === participantId) {
        return;
      }

  const myId = currentUserId;
      setChatLoadingId(participantId);

      try {
        const { data: conversation } = await api.post(
          "/api/chat/conversations",
          { participantId },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );

        const participants = conversation?.participants || [];
        const partner = participants.find((p) => String(p?._id) !== String(myId)) || null;
        const base = typeof contact === "object" && contact !== null ? contact : { id: participantId };

        const normalized = {
          ...base,
          ...(partner || {}),
          _id: partner?._id || base._id || participantId,
          id: partner?._id || base._id || participantId,
          participantId,
          role:
            partner?.role ||
            base.role ||
            (activeRole === "Trusted" ? "Youth" : "Trusted"),
        };

        if (myId) {
          try {
            await import("../../services/messagingService").then((m) =>
              m.createConversationIfMissing(conversation._id, {
                participants: [String(myId), String(participantId)],
              })
            );
          } catch (messagingError) {
            console.warn("Messaging sync warning", messagingError.message || messagingError);
          }
        }

        navigation.navigate("ChatRoom", {
          conversationId: conversation._id,
          other: normalized,
        });
      } catch (error) {
        console.warn("Linked contact chat error", error.response?.data || error.message || error);
        Alert.alert(
          "Unable to open chat",
          error?.response?.data?.message || "Please try again in a moment."
        );
      } finally {
        setChatLoadingId(null);
      }
    },
    [activeRole, chatLoadingId, currentUserId, navigation, resolveParticipantId, userToken]
  );

  const renderItem = ({ item, index }) => {
    const displayName = item.name || item.fullName || item.displayName || item.email || "Connection";
  const identifier = resolveParticipantId(item);
  const isChatLoading = Boolean(identifier && chatLoadingId === identifier);
    const badgeLabel = item.type === "youth" ? "Youth" : "Trusted Person";
    const badgeStyle = item.type === "youth" ? styles.badgeYouth : styles.badgeTrusted;
    const initial = (displayName || "?").charAt(0).toUpperCase();

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 80 }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.cardInfo}>
            <MotiText style={styles.name}>{displayName}</MotiText>
            {item.email ? <Text style={styles.email}>{item.email}</Text> : null}
            {item.requestStatus ? (
              <Text style={styles.metaText}>Status: {item.requestStatus}</Text>
            ) : null}
            {item.linkedAt ? (
              <Text style={styles.metaText}>
                Linked on {new Date(item.linkedAt).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
          <View style={[styles.badge, badgeStyle]}>
            <Feather name={item.type === "youth" ? "user" : "shield"} size={14} color="#fff" />
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.chatButton, (!identifier || isChatLoading) && styles.chatButtonDisabled]}
            onPress={() => handleOpenChat(item)}
            disabled={!identifier || isChatLoading}
          >
            {isChatLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="message-circle" size={16} color="#fff" />
                <Text style={styles.chatButtonText}>Message</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </MotiView>
    );
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );

  return (
    <LinearGradient colors={["#F5F7FA", "#E0ECFF"]} style={styles.container}>
      {contacts.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <Text style={styles.empty}>
            {activeRole === "Trusted"
              ? "No youth linked yet. Accept a request to see them here."
              : "No trusted persons linked yet. Send a request to get connected."}
          </Text>
          {activeRole === "Youth" ? (
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => navigation.navigate("AddTrustedContact")}
            >
              <Text style={styles.emptyCtaText}>Add a trusted contact</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={contacts}
          refreshing={refreshing}
          onRefresh={onRefresh}
          keyExtractor={(item, index) =>
            item.participantId || item._id || item.id || item.email || `contact-${index}`
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Floating Add Button */}
      {activeRole === "Youth" ? (
        <TouchableOpacity
          style={[styles.fab, { opacity: contacts.length >= 3 ? 0.6 : 1 }]}
          onPress={() => {
            if (contacts.length >= 3) {
              Alert.alert("Limit reached", "You can only link up to 3 trusted persons.");
              return;
            }
            navigation.navigate("AddTrustedContact");
          }}
          disabled={contacts.length >= 3}
        >
          <Feather name="plus" size={30} color="#fff" />
        </TouchableOpacity>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  email: { fontSize: 14, color: "#475569", marginTop: 4 },
  metaText: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  empty: { textAlign: "center", color: "#777", marginTop: 60, fontSize: 16 },
  emptyCta: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#10B981",
    borderRadius: 10,
  },
  emptyCtaText: { color: "#fff", fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#1E40AF",
  },
  badgeText: {
    marginLeft: 6,
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  badgeTrusted: {
    backgroundColor: "#6366F1",
  },
  badgeYouth: {
    backgroundColor: "#0EA5E9",
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#10B981",
  },
  chatButtonDisabled: {
    opacity: 0.5,
  },
  chatButtonText: { color: "#fff", fontWeight: "700", marginLeft: 4 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#10B981",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
