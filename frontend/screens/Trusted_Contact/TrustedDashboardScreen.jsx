import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import api from "../../config/api";
import { getDatabase, ref, onValue } from "firebase/database";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../../config/firebaseConfig";
import { getAuth } from "firebase/auth";

const screenWidth = Dimensions.get("window").width;

export default function TrustedDashboardScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [firebaseConnected, setFirebaseConnected] = useState(false);

  // 🔹 Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      const { data } = await api.get("/api/trusted/dashboard", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setDashboard(data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch alerts
  const fetchAlerts = async () => {
    try {
      const { data } = await api.get("/api/trusted/alerts", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setAlerts(data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Real-time Firebase updates
  useEffect(() => {
    const db = getDatabase();
    const refAlerts = ref(db, "alerts/");
    const unsubscribe = onValue(refAlerts, (snapshot) => {
      if (snapshot.exists()) {
        const fbAlerts = Object.values(snapshot.val());
        setFirebaseConnected(true);
        setAlerts(fbAlerts);
      }
    });

    fetchDashboard();
    fetchAlerts();

    return () => unsubscribe();
  }, []);

  // 🔹 Open chat or call actions
  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleChat = () => navigation.navigate("Messages");

  const downloadReport = async () => {
    const url = `${api.defaults.baseURL}/api/trusted/report`;
    Alert.alert("Report", `Download weekly summary:\n\n${url}`);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Trusted Dashboard</Text>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ This dashboard is for emotional support only — not a clinical tool.
        </Text>
      </View>

      {/* Wellness Overview */}
      {dashboard.map((youth, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.name}>{youth.name}</Text>
          <Text style={styles.score}>
            Wellness Score: <Text style={styles.scoreValue}>{youth.wellnessScore || 0}</Text>
          </Text>

          <LineChart
            data={{
              labels: ["M", "T", "W", "T", "F", "S", "S"],
              datasets: [
                {
                  data: youth.recentMood?.map((m) => m.value) || [0, 0, 0, 0, 0, 0, 0],
                },
              ],
            }}
            width={screenWidth - 60}
            height={180}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: "#F5F7FA",
              backgroundGradientFrom: "#F5F7FA",
              backgroundGradientTo: "#E2E8F0",
              color: (opacity = 1) => `rgba(74,144,226, ${opacity})`,
              strokeWidth: 2,
              style: { borderRadius: 16 },
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />

          <TouchableOpacity style={styles.actionBtn} onPress={handleChat}>
            <Feather name="message-circle" size={18} color="#fff" />
            <Text style={styles.actionText}>Send Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#4A90E2" }]}
            onPress={() => handleCall("0771234567")}
          >
            <Feather name="phone" size={18} color="#fff" />
            <Text style={styles.actionText}>Call Now</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Notification Feed */}
      <View style={styles.card}>
        <Text style={styles.subHeader}>Recent Alerts</Text>
        {alerts.length === 0 ? (
          <Text style={styles.noAlert}>No alerts yet.</Text>
        ) : (
          alerts.map((a, i) => (
            <View key={i} style={styles.alertItem}>
              <Feather name="alert-triangle" size={18} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertMsg}>
                  {a.youthName}: {a.message}
                </Text>
                <Text style={styles.alertTime}>
                  {new Date(a.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.reportBtn} onPress={downloadReport}>
        <Feather name="download" size={18} color="#fff" />
        <Text style={styles.reportText}>Download Weekly Report</Text>
      </TouchableOpacity>

      <Text
        style={{
          textAlign: "center",
          fontSize: 12,
          marginTop: 20,
          color: "#6B7280",
        }}
      >
        {firebaseConnected
          ? "Live data synced via Firebase ✅"
          : "Realtime feed offline 🔄"}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 24, fontWeight: "700", color: "#4A90E2", marginBottom: 10 },
  subHeader: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#111827" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  disclaimer: {
    backgroundColor: "#E0F2FE",
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  disclaimerText: { color: "#0369A1", fontSize: 13, textAlign: "center" },
  name: { fontSize: 18, fontWeight: "700", color: "#111827" },
  score: { color: "#475569", marginTop: 6 },
  scoreValue: { fontWeight: "bold", color: "#10B981" },
  actionBtn: {
    backgroundColor: "#10B981",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  actionText: { color: "#fff", fontWeight: "600" },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 8,
  },
  alertMsg: { fontSize: 14, color: "#111827", fontWeight: "500" },
  alertTime: { fontSize: 12, color: "#6B7280" },
  noAlert: { textAlign: "center", color: "#6B7280", fontSize: 13 },
  reportBtn: {
    backgroundColor: "#4A90E2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  reportText: { color: "#fff", fontWeight: "700" },
});
