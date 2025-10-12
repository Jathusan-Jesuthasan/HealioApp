import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../config/api";

export default function ActivityDashboardScreen() {
  const [data, setData] = useState(null);
  const userId = "demo_user";

  useEffect(() => {
    api
      .get(`/api/activity-dashboard/${userId}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error("Dashboard fetch error:", err));
  }, []);

  if (!data)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ marginTop: 10, color: "#4A90E2" }}>Loading your progress...</Text>
      </View>
    );

  return (
    <LinearGradient colors={["#E0F2FE", "#FFFFFF"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>📊 Your Wellness Dashboard</Text>
        <Text style={styles.subtitle}>
          Track your mindfulness, workouts, and progress streaks.
        </Text>

        {/* Stats Cards */}
        <View style={styles.cardGrid}>
          <View style={[styles.card, { backgroundColor: "#DFF6DD" }]}>
            <Ionicons name="timer-outline" size={28} color="#10B981" />
            <Text style={styles.cardLabel}>Total Minutes</Text>
            <Text style={styles.cardValue}>{data.totalMinutes} min</Text>
          </View>

          <View style={[styles.card, { backgroundColor: "#DBEAFE" }]}>
            <Ionicons name="fitness-outline" size={28} color="#3B82F6" />
            <Text style={styles.cardLabel}>Total Sessions</Text>
            <Text style={styles.cardValue}>{data.totalSessions}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="flame-outline" size={28} color="#F59E0B" />
            <Text style={styles.cardLabel}>Current Streak</Text>
            <Text style={styles.cardValue}>{data.streak} days 🔥</Text>
          </View>

          <View style={[styles.card, { backgroundColor: "#FCE7F3" }]}>
            <Ionicons name="heart-outline" size={28} color="#EC4899" />
            <Text style={styles.cardLabel}>Last Activity</Text>
            <Text style={styles.cardValue}>{data.lastActivity || "N/A"}</Text>
          </View>
        </View>

        {/* Progress Tips */}
        <View style={styles.tipBox}>
          <Ionicons name="sparkles-outline" size={22} color="#4A90E2" />
          <Text style={styles.tipText}>
            Keep logging activities daily to maintain your streak and unlock new rewards!
          </Text>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshBtn} onPress={() => {
          setData(null);
          api.get(`/api/activity-dashboard/${userId}`).then((res) => setData(res.data));
        }}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.refreshText}>Refresh Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E3A8A",
    marginBottom: 6,
  },
  subtitle: {
    color: "#475569",
    marginBottom: 20,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "47%",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLabel: {
    marginTop: 8,
    color: "#1E293B",
    fontSize: 14,
  },
  cardValue: {
    marginTop: 4,
    fontWeight: "800",
    fontSize: 18,
    color: "#111827",
  },
  tipBox: {
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  tipText: {
    marginLeft: 8,
    color: "#1E3A8A",
    fontSize: 14,
    flex: 1,
  },
  refreshBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    borderRadius: 30,
    paddingVertical: 12,
    marginTop: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  refreshText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 16,
  },
});
