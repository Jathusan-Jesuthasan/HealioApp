import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../utils/Colors";
import { AnimatedCircularProgress } from "react-native-circular-progress";

const AIInsightsHistory = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const baseURL =
        Platform.OS === "android"
          ? "http://10.0.2.2:5000"
          : "http://localhost:5000";

      const res = await axios.get(`${baseURL}/api/ai/risk-history`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      setHistory(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching AI history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getSeverityColor = (level) => {
    switch (level) {
      case "LOW":
        return { color: "#10B981", emoji: "😊" };
      case "MODERATE":
        return { color: "#F59E0B", emoji: "😐" };
      case "SERIOUS":
        return { color: "#EF4444", emoji: "😔" };
      default:
        return { color: "#6B7280", emoji: "🙂" };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Loading your AI insights…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>AI Insights History</Text>
        <Text style={styles.subtitle}>
          View all your past AI risk analyses and mood patterns.
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="time-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No history found yet 🕓</Text>
          <Text style={styles.emptySubtext}>
            Start logging your moods and let AI detect insights automatically.
          </Text>
        </View>
      ) : (
        history.map((item, index) => {
          const sev = getSeverityColor(item.riskLevel);
          return (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.emoji}>{sev.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateText}>
                    {new Date(item.date).toLocaleString()}
                  </Text>
                  <Text style={[styles.levelText, { color: sev.color }]}>
                    {item.riskLevel} RISK
                  </Text>
                </View>
                <AnimatedCircularProgress
                  size={70}
                  width={8}
                  fill={item.wellnessIndex || 50}
                  tintColor={sev.color}
                  backgroundColor="#E5E7EB"
                  rotation={0}
                >
                  {() => (
                    <Text style={styles.scoreText}>
                      {item.wellnessIndex || 50}%
                    </Text>
                  )}
                </AnimatedCircularProgress>
              </View>

              <Text style={styles.summary}>{item.summary}</Text>

              {item.suggestions && item.suggestions.length > 0 && (
                <View style={styles.suggestionSection}>
                  {item.suggestions.map((s, i) => (
                    <View key={i} style={styles.suggestionItem}>
                      <Ionicons name="sparkles" size={16} color={Colors.primary} />
                      <Text style={styles.suggestionText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={18} color="#fff" />
        <Text style={styles.backBtnText}>Back to AI Risk Detection</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  header: { marginBottom: 20 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 15, color: Colors.textPrimary },
  card: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  emoji: { fontSize: 28, marginRight: 8 },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  levelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  summary: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 20,
  },
  suggestionSection: {
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  suggestionText: {
    marginLeft: 6,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  emptyBox: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyText: { fontSize: 18, fontWeight: "600", color: Colors.textPrimary },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
});

export default AIInsightsHistory;
