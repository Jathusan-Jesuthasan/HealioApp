import React, { useContext, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import api from "../../config/api";
import { AuthContext } from "../../context/AuthContext";

export default function EmergencyAlertScreen() {
  const { userToken } = useContext(AuthContext);
  const [sending, setSending] = useState(false);

  const sendAlert = async () => {
    setSending(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    try {
      await api.post("/api/trusted/emergency", {}, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      Alert.alert("🚨 Alert Sent", "Your trusted contacts have been notified.");
    } catch {
      Alert.alert("Error", "Failed to send alert.");
    } finally {
      setSending(false);
    }
  };

  return (
    <LinearGradient colors={["#F5F7FA", "#E0ECFF"]} style={styles.container}>
      <MotiView
        from={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 10 }}
        style={styles.inner}
      >
        <Text style={styles.title}>Emergency Support</Text>
        <Text style={styles.desc}>If you feel unsafe or distressed, press below to alert your trusted contacts.</Text>

        <TouchableOpacity style={styles.alertBtn} onPress={sendAlert} disabled={sending}>
          <LinearGradient colors={["#EF4444", "#DC2626"]} style={styles.alertGradient}>
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.alertText}>SEND ALERT</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  inner: { width: "90%", backgroundColor: "#fff", borderRadius: 20, padding: 25, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 22, fontWeight: "700", color: "#4A90E2", textAlign: "center" },
  desc: { fontSize: 15, color: "#555", textAlign: "center", marginVertical: 15 },
  alertBtn: { marginTop: 10 },
  alertGradient: { paddingVertical: 18, borderRadius: 50, alignItems: "center" },
  alertText: { color: "#fff", fontWeight: "700", fontSize: 18 },
});
