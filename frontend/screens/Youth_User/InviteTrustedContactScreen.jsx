// screens/Trusted_Contact/InviteTrustedContactScreen.jsx
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { db, ref, onValue, set } from "../../config/firebaseConfig"; // adjust path as needed
import { MotiView, MotiText } from "moti";
import api from "../../config/api";
import { AuthContext } from "../../context/AuthContext";

export default function InviteTrustedContactScreen({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const contact = route.params?.contact;
  const [inviteCode, setInviteCode] = useState("");
  const [status, setStatus] = useState("Pending");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    `Hey! 👋 Join me as my trusted support on Healio. Use this invite code: `
  );

  useEffect(() => {
    generateInvite();
  }, []);

  // 🔹 Generate invite code
  const generateInvite = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(
        "/api/trusted",
        {
          name: contact?.name,
          email: contact?.email,
          phone: contact?.phone,
          relationship: contact?.relationship,
          privacyLevel: contact?.privacyLevel || "Alerts Only",
        },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      setInviteCode(data.inviteCode);
      const statusRef = ref(db, `invites/${data._id}`);
      set(statusRef, { status: "Pending" });
      onValue(statusRef, (snapshot) => {
        const value = snapshot.val();
        if (value?.status) setStatus(value.status);
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not create invite");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Share link
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${message}${inviteCode}\n\nDownload Healio to accept the invite 💚`,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  // 🔹 Copy code
  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", "Invite code copied to clipboard!");
  };

  // 🔹 Resend invite
  const handleResend = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    generateInvite();
    Alert.alert("Resent", "Invitation re-sent successfully!");
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );

  return (
    <LinearGradient colors={["#F5F7FA", "#E0ECFF"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 100 }}>
        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15 }}
          style={styles.card}
        >
          <Text style={styles.title}>Invite Trusted Person</Text>
          <Text style={styles.subtitle}>
            Send this code to your trusted contact to connect securely.
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{inviteCode || "••••••••"}</Text>
            <TouchableOpacity onPress={handleCopy}>
              <Feather name="copy" size={22} color="#4A90E2" />
            </TouchableOpacity>
          </View>

          <QRCode value={inviteCode || "healio"} size={140} color="#4A90E2" />

          <TextInput
            style={styles.messageBox}
            multiline
            value={message}
            onChangeText={setMessage}
          />

          {/* Share Options */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
              <Feather name="share-2" size={22} color="#fff" />
              <Text style={styles.iconText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={handleResend}>
              <MaterialIcons name="refresh" size={22} color="#fff" />
              <Text style={styles.iconText}>Resend</Text>
            </TouchableOpacity>
          </View>

          {/* Status Tracker */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status: </Text>
            <MotiText
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ loop: true, type: "timing", duration: 1200 }}
              style={[
                styles.statusValue,
                status === "Accepted"
                  ? { color: "#10B981" }
                  : status === "Declined"
                  ? { color: "#EF4444" }
                  : { color: "#F59E0B" },
              ]}
            >
              {status}
            </MotiText>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("TrustedContacts")}
            style={styles.doneBtn}
          >
            <LinearGradient colors={["#4A90E2", "#10B981"]} style={styles.doneGradient}>
              <Text style={styles.doneText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Alert.alert(
              "Role Explanation",
              "Trusted persons can view your wellness trends and alerts, but cannot read private journals or notes. You can revoke access anytime."
            )}
            style={styles.infoBtn}
          >
            <Feather name="info" size={20} color="#4A90E2" />
            <Text style={styles.infoText}>What can they see?</Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginTop: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#4A90E2", marginBottom: 5 },
  subtitle: { color: "#555", textAlign: "center", marginBottom: 20 },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0F4FF",
    padding: 10,
    borderRadius: 10,
    width: "90%",
    marginBottom: 20,
  },
  codeText: { fontSize: 18, fontWeight: "700", color: "#4A90E2" },
  messageBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    width: "90%",
    marginVertical: 15,
    textAlignVertical: "top",
    height: 80,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: 15,
  },
  iconBtn: {
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    width: 100,
  },
  iconText: { color: "#fff", fontWeight: "600", marginTop: 5 },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  statusLabel: { fontSize: 16, fontWeight: "600" },
  statusValue: { fontSize: 16, fontWeight: "700" },
  doneBtn: { marginTop: 20 },
  doneGradient: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: "center",
  },
  doneText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  infoBtn: { flexDirection: "row", alignItems: "center", marginTop: 15 },
  infoText: { color: "#4A90E2", marginLeft: 5 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
