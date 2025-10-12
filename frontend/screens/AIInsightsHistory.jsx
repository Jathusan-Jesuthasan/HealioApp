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
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { LineChart } from "react-native-chart-kit";

// ✅ Healio Color System
const Colors = {
  primary: "#4A90E2",
  secondary: "#10B981",
  background: "#F5F7FA",
  card: "#FFFFFF",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  warning: "#F59E0B",
  danger: "#EF4444",
  purple: "#8B5CF6",
  pink: "#EC4899",
  gray: "#94A3B8",
};

const AIInsightsHistory = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  // ✅ Fetch AI risk history
  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const baseURL =
        Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

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

  // 🎨 Emotion/Risk color mapping
  const getSeverityColor = (level) => {
    switch (level?.toUpperCase()) {
      case "LOW":
        return { color: Colors.secondary, emoji: "😊" };
      case "MODERATE":
        return { color: Colors.warning, emoji: "😐" };
      case "SERIOUS":
        return { color: Colors.danger, emoji: "🚨" };
      case "STRESS":
        return { color: Colors.warning, emoji: "😣" };
      case "ANGER":
        return { color: Colors.pink, emoji: "😡" };
      case "ANXIETY":
        return { color: Colors.purple, emoji: "😰" };
      case "TIREDNESS":
        return { color: Colors.gray, emoji: "😴" };
      default:
        return { color: Colors.textSecondary, emoji: "🙂" };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your AI insights…</Text>
      </View>
    );
  }

  // 🧠 Prepare chart data (last 7 entries safely)
  const recent = history.slice(0, 7).reverse();

  const trendData = recent.map((item) => {
    const val = Number(item.wellnessIndex);
    return !isNaN(val) && val > 0 ? val : 0;
  });

  const trendLabels = recent.map((item) => {
    const d = new Date(item.date);
    return isNaN(d) ? "—" : `${d.getDate()}/${d.getMonth() + 1}`;
  });

  // 🧩 Safe rendering of chart (only if there’s valid data)
  const hasValidData = trendData.filter((v) => v > 0).length >= 2;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🤖 AI Insights History</Text>
        <Text style={styles.subtitle}>
          Track your AI-generated wellness and emotion insights over time.
        </Text>
      </View>

      {/* Mini Trend Chart */}
      {hasValidData && (
        <View style={styles.trendBox}>
          <Text style={styles.trendTitle}>Mind Balance Trend (Last 7)</Text>
          <LineChart
            data={{
              labels: trendLabels,
              datasets: [{ data: trendData }],
            }}
            width={340}
            height={180}
            fromZero
            chartConfig={{
              backgroundColor: Colors.card,
              backgroundGradientFrom: Colors.card,
              backgroundGradientTo: Colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(74,144,226,${opacity})`,
              labelColor: () => Colors.textSecondary,
              propsForDots: { r: "4", strokeWidth: "2", stroke: Colors.primary },
              fillShadowGradient: Colors.secondary,
              fillShadowGradientOpacity: 0.1,
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Empty State */}
      {history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="time-outline" size={56} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No AI insights yet 🕓</Text>
          <Text style={styles.emptySubtext}>
            Log moods regularly to help Healio learn your emotional patterns.
          </Text>
        </View>
      ) : (
        history.map((item, index) => {
          const sev = getSeverityColor(item.riskLevel);
          const parsedDate = new Date(item.date);
          const formattedDate = isNaN(parsedDate)
            ? "Unknown Date"
            : parsedDate.toLocaleString();

          return (
            <View key={index} style={styles.card}>
              {/* Header Row */}
              <View style={styles.cardHeader}>
                <Text style={styles.emoji}>{sev.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateText}>{formattedDate}</Text>
                  <Text style={[styles.levelText, { color: sev.color }]}>
                    {item.riskLevel?.toUpperCase() || "UNKNOWN"}
                  </Text>
                </View>

                <AnimatedCircularProgress
                  size={70}
                  width={8}
                  fill={Number(item.wellnessIndex) || 0}
                  tintColor={sev.color}
                  backgroundColor="#E5E7EB"
                  rotation={0}
                  lineCap="round"
                >
                  {() => (
                    <Text style={styles.scoreText}>
                      {Math.round(Number(item.wellnessIndex) || 0)}%
                    </Text>
                  )}
                </AnimatedCircularProgress>
              </View>

              {/* Summary */}
              <Text style={styles.summary}>
                {item.summary || "No AI summary generated for this entry."}
              </Text>

              {/* Suggestions */}
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

              <Text style={styles.sourceText}>
                🔍 Source: {item.source || "Hybrid AI Engine"}
              </Text>
            </View>
          );
        })
      )}

      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={18} color="#fff" />
        <Text style={styles.backBtnText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ✅ Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 15, color: Colors.textPrimary },

  header: { marginBottom: 20, alignItems: "center" },
  title: { fontSize: 26, fontWeight: "700", color: Colors.textPrimary, marginBottom: 6 },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    width: "90%",
  },

  // 📊 Trend Chart
  trendBox: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    elevation: 3,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: "center",
  },
  chart: { borderRadius: 12 },

  // 🪄 Card Design
  card: {
    backgroundColor: Colors.card,
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  emoji: { fontSize: 28, marginRight: 10 },
  dateText: { fontSize: 13, color: Colors.textSecondary },
  levelText: { fontSize: 15, fontWeight: "700" },
  scoreText: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary },
  summary: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 20,
  },

  suggestionSection: {
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  suggestionItem: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  suggestionText: {
    marginLeft: 6,
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
    flexWrap: "wrap",
  },
  sourceText: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, textAlign: "right" },

  emptyBox: { alignItems: "center", marginTop: 60, paddingHorizontal: 20 },
  emptyText: { fontSize: 18, fontWeight: "600", color: Colors.textPrimary },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  backBtnText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
});

export default AIInsightsHistory;
