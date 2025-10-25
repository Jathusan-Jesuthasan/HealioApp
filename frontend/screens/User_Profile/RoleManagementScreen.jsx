import React, { useEffect, useState, useContext, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import api from "../../config/api";
import { AuthContext } from "../../context/AuthContext";

const THEME = {
  bg: "#F5F7FA",
  primary: "#4A90E2",
  accent: "#10B981",
  text: "#0f172a",
  card: "#ffffff",
  border: "#e5e7eb",
  danger: "#ef4444",
};

export default function RoleManagementScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [me, setMe] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");

  // role + roles
  const [role, setRole] = useState("Youth");
  const [roles, setRoles] = useState([]);

  // share settings (youth -> trusted)
  const [shareMoodTrends, setShareMoodTrends] = useState(true);
  const [shareWellnessScore, setShareWellnessScore] = useState(true);
  const [shareAlertsOnly, setShareAlertsOnly] = useState(false);

  // OTP
  const [otp, setOtp] = useState("");
  const [pendingRequestedRole, setPendingRequestedRole] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/users/me", {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        setMe(data);
        setName(data?.name || "");
        setBio(data?.bio || "");
        setProfileImage(data?.profileImage || "");
        setRole(data?.role || "Youth");
        setRoles(Array.isArray(data?.roles) ? data.roles : [data?.role].filter(Boolean));
        setShareMoodTrends(!!data?.shareSettings?.shareMoodTrends);
        setShareWellnessScore(!!data?.shareSettings?.shareWellnessScore);
        setShareAlertsOnly(!!data?.shareSettings?.shareAlertsOnly);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not load your profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userToken]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const payload = {
        name,
        bio,
        profileImage, // send URL or upload to cloud then store URL
        shareSettings: {
          shareMoodTrends,
          shareWellnessScore,
          shareAlertsOnly,
        },
      };
      const { data } = await api.put("/api/users/me", payload, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setMe(data);
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const requestRole = async (requestedRole) => {
    if (requestedRole === role) {
      return Alert.alert("Info", `You already are in the ${role} role.`);
    }
    try {
      setRequesting(true);
      setPendingRequestedRole(requestedRole);
      await api.post("/api/users/role/request", { requestedRole, delivery: "email" }, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      Alert.alert("Check your email", "Enter the 6-digit code we sent to verify.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.response?.data?.message || "Could not request role change.");
    } finally {
      setRequesting(false);
    }
  };

  const verifyRole = async () => {
    if (!otp.trim()) return Alert.alert("Enter Code", "Please type the verification code.");
    try {
      setVerifying(true);
      const { data } = await api.post("/api/users/role/verify", { otp }, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setRole(data.role);
      setRoles(data.roles);
      setOtp("");
      setPendingRequestedRole(null);
      Alert.alert("Success", `Role updated to ${data.role}.`);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.response?.data?.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const openAudit = async () => {
    try {
      const { data } = await api.get("/api/users/privacy-audit", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      Alert.alert(
        "Privacy Audit",
        `You: ${data.you.email}\nRole(s): ${data.you.role} ${data.you.roles?.join(",")}\n\nShared:\n• Trends: ${shareMoodTrends ? "Yes" : "No"}\n• Wellness Score: ${shareWellnessScore ? "Yes" : "No"}\n• Alerts Only: ${shareAlertsOnly ? "Yes" : "No"}`
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not load privacy audit.");
    }
  };

  const exportData = async () => {
    try {
      // This will return JSON. For mobile, you might download via WebBrowser or share via Share API.
      const url = `${api.defaults.baseURL}/api/users/export`;
      Alert.alert("Export", `Hit this URL in browser to download:\n\n${url}\n\n(Requires your auth token)`);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Export failed.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.title}>Role & Privacy</Text>
        <Text style={styles.subtitle}>Control your role and what’s shared.</Text>
      </Animated.View>

      {/* Avatar and basic info */}
      <Animated.View entering={FadeInDown.delay(80)} style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={pickImage}>
          <View style={styles.avatar}>
            <Feather name="user" size={28} color={THEME.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              style={styles.input}
              placeholderTextColor="#64748b"
            />
          </View>
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 8 }]}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Tell a short story about yourself"
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          multiline
          placeholderTextColor="#64748b"
        />
      </Animated.View>

      {/* Role switcher */}
      <Animated.View entering={FadeInDown.delay(120)} style={styles.card}>
        <Text style={styles.sectionTitle}>Role</Text>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentBtn, role === "Youth" && styles.segmentActive]}
            onPress={() => requestRole("Youth")}
            disabled={requesting}
          >
            <Text style={[styles.segmentText, role === "Youth" && styles.segmentTextActive]}>
              Youth
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, role === "Trusted" && styles.segmentActive]}
            onPress={() => requestRole("Trusted")}
            disabled={requesting}
          >
            <Text style={[styles.segmentText, role === "Trusted" && styles.segmentTextActive]}>
              Trusted
            </Text>
          </TouchableOpacity>
        </View>

        {!!pendingRequestedRole && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.help}>
              Enter the verification code sent to your email to switch to <Text style={{fontWeight:"700"}}>{pendingRequestedRole}</Text>.
            </Text>
            <View style={styles.otpRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="6-digit code"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
              />
              <TouchableOpacity style={styles.verifyBtn} onPress={verifyRole} disabled={verifying}>
                {verifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.verifyText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!!roles?.length && (
          <Text style={styles.help}>Your roles: {roles.join(", ")}</Text>
        )}
      </Animated.View>

      {/* Share settings (only meaningful for Youth role) */}
      <Animated.View entering={FadeInDown.delay(160)} style={styles.card}>
        <Text style={styles.sectionTitle}>Sharing (what trusted persons can see)</Text>

        <RowSwitch
          label="Share mood trends"
          value={shareMoodTrends}
          onValueChange={setShareMoodTrends}
        />
        <RowSwitch
          label="Share wellness score"
          value={shareWellnessScore}
          onValueChange={setShareWellnessScore}
        />
        <RowSwitch
          label="Alerts only (no trends)"
          value={shareAlertsOnly}
          onValueChange={setShareAlertsOnly}
        />
        <Text style={styles.help}>
          Private journals are never shared. You can edit your trusted contacts in Profile → Trusted Contacts.
        </Text>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.actions}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: THEME.accent }]} onPress={saveProfile} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: THEME.primary }]} onPress={openAudit}>
          <Text style={styles.btnText}>Privacy Audit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: THEME.primary }]} onPress={exportData}>
          <Text style={styles.btnText}>Export Shared Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border }]}
          onPress={() => navigation.navigate("TrustedContacts")}
        >
          <Text style={[styles.btnText, { color: THEME.primary }]}>Edit Trusted Contacts</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function RowSwitch({ label, value, onValueChange }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} thumbColor="#fff" trackColor={{ true: "#10B981", false: "#CBD5E1" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg, padding: 16, paddingBottom: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: THEME.bg },
  header: { marginTop: 8, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: THEME.primary },
  subtitle: { color: "#475569", marginTop: 2 },

  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderColor: THEME.border,
    borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#E2E8F0",
    alignItems: "center", justifyContent: "center",
  },
  label: { color: "#64748b", fontSize: 12, marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderRadius: 10,
    color: THEME.text,
  },

  sectionTitle: { fontWeight: "800", color: THEME.text, marginBottom: 10 },
  segment: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentActive: { backgroundColor: "#fff" },
  segmentText: { color: "#475569", fontWeight: "600" },
  segmentTextActive: { color: THEME.primary, fontWeight: "800" },

  help: { color: "#64748b", marginTop: 6 },
  otpRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  verifyBtn: { backgroundColor: THEME.accent, paddingHorizontal: 16, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  verifyText: { color: "#fff", fontWeight: "700" },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  rowLabel: { color: THEME.text },

  actions: { gap: 10, marginTop: 4, marginBottom: 8 },
  btn: {
    height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
