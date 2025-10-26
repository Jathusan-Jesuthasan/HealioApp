import React, { useState, useContext, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import api from "../../config/api";
import * as Clipboard from 'expo-clipboard';
import { AuthContext } from "../../context/AuthContext";

export default function AddTrustedContact({ navigation, route }) {
  const { userToken, userRole, user } = useContext(AuthContext);
  const contact = route.params?.contact;

  const isYouth = userRole?.toString().toLowerCase() === "youth";
  const Touchable = Platform.OS === "web" ? Pressable : TouchableOpacity;

  const [directory, setDirectory] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState("");
  const [search, setSearch] = useState("");
  const [requestingId, setRequestingId] = useState(null);
  const [messagingId, setMessagingId] = useState(null);

  const [form, setForm] = useState({
    name: contact?.name || "",
    phone: contact?.phone || "",
    email: contact?.email || "",
    relationship: contact?.relationship || "",
    privacyLevel: contact?.privacyLevel || "Alerts Only",
  });
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef(null);

  const loadDirectory = async () => {
    if (!isYouth || !userToken) return;
    setDirectoryError("");
    setDirectoryLoading(true);
    try {
      const [usersRes, requestsRes] = await Promise.all([
        api.get("/api/trusted/users", {
        headers: { Authorization: `Bearer ${userToken}` },
        params: { role: "All", limit: 100 },
        }),
        api.get("/api/trusted/requests/outgoing", {
          headers: { Authorization: `Bearer ${userToken}` },
        }),
      ]);

      const requestMap = (requestsRes.data?.data || []).reduce((acc, item) => {
        const trustedId = item?.trustedId?._id || item?.trustedId;
        if (trustedId) acc[trustedId] = item.status;
        return acc;
      }, {});

      const users = (usersRes.data?.data || []).map((user) => ({
        ...user,
        requestStatus: requestMap[user._id] || user.requestStatus || null,
      }));

      setDirectory(users);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Unable to load registered users";
      setDirectoryError(msg);
    } finally {
      setDirectoryLoading(false);
    }
  };

  useEffect(() => {
    if (isYouth && userToken) {
      loadDirectory();
    }
  }, [isYouth, userToken]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return directory;
    return directory.filter((user) => {
      const corpus = [user.name, user.email, user.role].filter(Boolean).join(" ").toLowerCase();
      return corpus.includes(query);
    });
  }, [directory, search]);

  const handleSendRequest = async (targetUser) => {
    if (!isYouth || !userToken) return;

    const targetId = targetUser?._id || targetUser?.id;
    if (!targetId) {
      Alert.alert("Unavailable", "We couldn't find this user's account. Please try another contact.");
      return;
    }

    const normalizedRole = targetUser?.role?.toString().toLowerCase();
    if (normalizedRole !== "trusted") {
      Alert.alert("Trusted only", "You can only send trusted contact requests to users registered as Trusted persons.");
      return;
    }

  const normalizedTarget = String(targetId);
  setRequestingId(normalizedTarget);
    try {
      await api.post(
        "/api/trusted/requests",
        { targetUserId: targetId },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      Alert.alert("Request sent", `${targetUser.name} will be notified of your request.`);
      setDirectory((prev) =>
        prev.map((entry) => {
          const entryId = String(entry._id || entry.id || "");
          if (entryId === normalizedTarget) {
            return { ...entry, requestStatus: "Pending" };
          }
          return entry;
        })
      );
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Failed to send request";
      Alert.alert("Unable to send request", msg);
    } finally {
      setRequestingId(null);
    }
  };

  const handleMessageUser = useCallback(
    async (targetUser) => {
      if (!userToken) {
        Alert.alert("Sign in required", "Please log in again to start a chat.");
        return;
      }

      const targetId = targetUser?._id || targetUser?.id || targetUser?.userId;
      if (!targetId) {
        Alert.alert("Unavailable", "We couldn't start a chat with this contact yet.");
        return;
      }

      if (user?._id && String(user._id) === String(targetId)) {
        Alert.alert("Hold on", "You cannot start a conversation with yourself.");
        return;
      }

      const normalizedId = String(targetId);
      setMessagingId(normalizedId);

      try {
        const { data: conversation } = await api.post(
          "/api/chat/conversations",
          { participantId: normalizedId },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );

        if (conversation?._id) {
          const participants = [String(user?._id || ""), normalizedId].filter(Boolean);
          try {
            await import("../../services/messagingService").then((m) =>
              m.createConversationIfMissing(conversation._id, { participants })
            );
          } catch (serviceError) {
            console.warn("Messaging sync warning", serviceError.message || serviceError);
          }

          const otherDetails = {
            ...targetUser,
            _id: normalizedId,
            role: targetUser?.role || "User",
          };

          navigation.navigate("ChatRoom", {
            conversationId: conversation._id,
            other: otherDetails,
          });
        }
      } catch (error) {
        console.warn("Conversation start error", error.response?.data || error.message || error);
        Alert.alert(
          "Unable to start chat",
          error?.response?.data?.message || "Please try again in a moment."
        );
      } finally {
        setMessagingId(null);
      }
    },
    [navigation, user?._id, userToken]
  );

  const handleSave = async () => {
    if (!isYouth) {
      Alert.alert("Unavailable", "Only youth accounts can invite trusted persons from this screen.");
      return;
    }
    // Basic validation
    if (!form.name?.trim()) {
      Alert.alert("Missing Info", "Please enter the contact's full name.");
      nameRef.current?.focus?.();
      return;
    }
    if (!form.phone?.trim()) {
      Alert.alert("Missing Info", "Please enter a phone number.");
      return;
    }

    const emailValue = form.email?.trim();
    if (!emailValue) {
      Alert.alert("Missing Info", "Please enter an email address.");
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailValue)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setIsSaving(true);
    Keyboard.dismiss();
    try {
      const payload = {
        name: form.name.trim(),
        relation: form.relationship?.trim() || "Trusted Person",
        phone: form.phone.trim(),
        email: emailValue,
        notifyVia: ["email"],
      };

      if (form.privacyLevel) {
        payload.privacyLevel = form.privacyLevel;
      }

      let res;
      if (contact) {
        res = await api.put(`/api/trusted/${contact._id}`, payload, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
      } else {
        res = await api.post("/api/trusted", payload, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
      }

      // Success - notify and return to list with refresh signal
      Alert.alert("Saved", "Trusted contact saved successfully.");
      navigation.navigate("TrustedContacts", { refreshedAt: Date.now() });
      return res?.data;
    } catch (err) {
      // Try to show server-provided message when available
      const resp = err?.response?.data;
      const msg = resp?.message || err?.message || "Failed to save contact";
      if (resp?.inviteLink) {
        Alert.alert(
          "Contact not registered",
          `${msg}\nYou can copy an invite link to send to them.`,
          [
            { text: 'Copy Invite Link', onPress: async () => { await Clipboard.setStringAsync(resp.inviteLink); Alert.alert('Copied', 'Invite link copied to clipboard'); } },
            { text: 'OK' },
          ]
        );
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LinearGradient colors={["#F5F7FA", "#E0ECFF"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 80 }}>
        {isYouth && (
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.directoryCard}
          >
            <Text style={styles.sectionTitle}>Find existing Healio users</Text>
            <Text style={styles.sectionSubtitle}>
              Browse registered trusted persons and send a request to connect.
            </Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {directoryLoading ? (
              <ActivityIndicator style={styles.directoryLoader} />
            ) : directoryError ? (
              <Text style={styles.directoryError}>{directoryError}</Text>
            ) : filteredUsers.length === 0 ? (
              <Text style={styles.emptyState}>No matching users found.</Text>
            ) : (
              filteredUsers.map((entry) => {
                const entryId = String(entry._id || entry.id || entry.userId || "");
                const status = entry.requestStatus;
                const isPending = status === "Pending";
                const isAccepted = status === "Accepted";
                const isRequestLoading = requestingId === entryId;
                const normalizedRole = entry?.role?.toString().toLowerCase();
                const canSendRequest = normalizedRole === "trusted";
                const requestDisabled = !isYouth || !canSendRequest || isPending || isAccepted || isRequestLoading;
                const requestLabel = !isYouth
                  ? "Youth only"
                  : !canSendRequest
                  ? "Trusted only"
                  : isAccepted
                  ? "Connected"
                  : isPending
                  ? "Pending"
                  : "Send Request";
                const requestTextStyles = [styles.requestButtonText];
                if (!isYouth || !canSendRequest) requestTextStyles.push(styles.requestButtonTextDisabled);
                if (isAccepted) requestTextStyles.push(styles.requestButtonTextAccepted);
                if (isPending) requestTextStyles.push(styles.requestButtonTextPending);

                const canMessage = Boolean(entryId) && (!user?._id || String(user._id) !== entryId);
                const isMessaging = messagingId === entryId;

                return (
                  <View key={entryId || entry.email || entry.name} style={styles.directoryRow}>
                    <View style={styles.directoryDetails}>
                      <Text style={styles.userName}>{entry.name}</Text>
                      <Text style={styles.userEmail}>{entry.email}</Text>
                      <Text style={styles.userRole}>{entry.role}</Text>
                    </View>
                    <View style={styles.directoryActions}>
                      <Touchable
                        onPress={() => handleMessageUser(entry)}
                        disabled={!canMessage || isMessaging}
                        style={[
                          styles.messageButton,
                          (!canMessage || isMessaging) && styles.messageButtonDisabled,
                        ]}
                      >
                        {isMessaging ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.messageButtonText}>Message</Text>
                        )}
                      </Touchable>
                      {isYouth && (
                        <Touchable
                          onPress={() => handleSendRequest(entry)}
                          disabled={requestDisabled}
                          style={[
                            styles.requestButton,
                            requestDisabled && styles.requestButtonDisabled,
                            isAccepted && styles.requestButtonAccepted,
                          ]}
                        >
                          {isRequestLoading ? (
                            <ActivityIndicator color={isAccepted ? "#0F172A" : "#fff"} />
                          ) : (
                            <Text style={requestTextStyles}>{requestLabel}</Text>
                          )}
                        </Touchable>
                      )}
                    </View>
                  </View>
                );
              })
            )}
            <Touchable onPress={loadDirectory} style={styles.refreshLink} disabled={directoryLoading}>
              <Text style={styles.refreshLinkText}>
                {directoryLoading ? "Refreshing..." : "Refresh list"}
              </Text>
            </Touchable>
          </MotiView>
        )}
        <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }} style={styles.form}>
          <Text style={styles.title}>
            {contact ? "Edit Trusted Contact" : "Add Trusted Contact"}
          </Text>
          <TextInput
            ref={nameRef}
            style={styles.input}
            placeholder="Full Name"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            autoCapitalize="words"
            returnKeyType="next"
            editable={!isSaving}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email (optional)"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Relationship (Parent, Mentor, etc.)"
            value={form.relationship}
            onChangeText={(v) => setForm({ ...form, relationship: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Privacy Level (Alerts Only / Mood Trends)"
            value={form.privacyLevel}
            onChangeText={(v) => setForm({ ...form, privacyLevel: v })}
          />

          <Touchable onPress={handleSave} disabled={isSaving}>
            <LinearGradient
              colors={isSaving ? ["#94D7BF", "#9FE6C6"] : ["#10B981", "#34D399"]}
              style={[styles.saveBtn, isSaving && { opacity: 0.9 }]}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save Contact</Text>
              )}
            </LinearGradient>
          </Touchable>

          <Touchable
            onPress={() => navigation.goBack()}
            disabled={isSaving}
            style={{ marginTop: 10 }}
          >
            <Text style={{ color: "#4A90E2", textAlign: "center" }}>Cancel</Text>
          </Touchable>
        </MotiView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  directoryCard: {
    width: "90%",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 16,
    padding: 20,
    marginTop: 30,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: "#475569",
    marginBottom: 16,
    lineHeight: 20,
  },
  searchInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  directoryLoader: {
    marginVertical: 16,
  },
  directoryError: {
    color: "#DC2626",
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 12,
  },
  emptyState: {
    textAlign: "center",
    color: "#6B7280",
    marginVertical: 12,
  },
  directoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  directoryDetails: {
    flex: 1,
    paddingRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  userEmail: {
    color: "#475569",
    fontSize: 14,
    marginTop: 2,
  },
  userRole: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  requestButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#10B981",
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  requestButtonDisabled: {
    backgroundColor: "#D1FAE5",
  },
  requestButtonAccepted: {
    backgroundColor: "#DCF2FF",
  },
  requestButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  requestButtonTextAccepted: {
    color: "#0F172A",
  },
  requestButtonTextPending: {
    color: "#047857",
  },
  refreshLink: {
    marginTop: 14,
    alignSelf: "flex-end",
  },
  refreshLinkText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  form: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginTop: 40,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#4A90E2", marginBottom: 20, textAlign: "center" },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  saveBtn: { padding: 14, borderRadius: 12, alignItems: "center", marginTop: 10 },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
