import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  Animated,
  Dimensions,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../utils/Colors";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedCircularProgress } from "react-native-circular-progress";

const { width } = Dimensions.get("window");

const RiskDetectionScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [lastChecked, setLastChecked] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const baseURL =
        Platform.OS === "android"
          ? "http://10.0.2.2:5000"
          : "http://localhost:5000";

      // Step 1: Fetch mood logs
      const dashboardRes = await axios.get(`${baseURL}/api/dashboard?range=4d`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const moodLogs = dashboardRes.data.moodLogs || [];

      // Step 2: Send to Gemini AI backend
      const aiRes = await axios.post(
        `${baseURL}/api/ai/risk-analysis`,
        { moodLogs },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      const ai = aiRes.data;

      // Step 3: Format response
      // Step 3: Format response
const formatted = {
  mindBalanceScore: ai.mindBalanceScore || 70,
  riskLevel:
    ai.risks && ai.risks[0]
      ? ai.risks[0].category.toUpperCase()
      : "STABLE",
  summary:
    ai.risks && ai.risks[0]
      ? ai.risks[0].message
      : "No significant risk patterns found.",
  suggestions: ai.suggestion ? [ai.suggestion] : ["Keep maintaining your emotional balance! 💪"],
  timestamp: ai.createdAt || new Date().toISOString(),
};


      setRiskData(formatted);
      setLastChecked(new Date().toLocaleString());

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error("❌ AI Risk fetch failed:", err);
      performFallbackAnalysis();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- Local fallback if AI fails ---
  const performFallbackAnalysis = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const baseURL =
        Platform.OS === "android"
          ? "http://10.0.2.2:5000"
          : "http://localhost:5000";

      const res = await axios.get(`${baseURL}/api/dashboard?range=7d`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const moodLogs = res.data.moodLogs || [];
      const recentMoods = moodLogs.slice(-7);
      let avgMood = 3;

      if (recentMoods.length > 0) {
        const moodMap = { Happy: 5, Neutral: 3, Sad: 2, Angry: 1, Stressed: 1 };
        const total = recentMoods.reduce(
          (sum, log) => sum + (moodMap[log.mood] || 3),
          0
        );
        avgMood = total / recentMoods.length;
      }

      const riskScore = avgMood < 2.5 ? 75 : avgMood < 3 ? 50 : 20;
      const riskLevel =
        riskScore >= 70 ? "SERIOUS" : riskScore >= 40 ? "MODERATE" : "LOW";
      const summary =
        riskLevel === "SERIOUS"
          ? "Your recent logs indicate emotional decline. Please consider relaxation or reaching out."
          : riskLevel === "MODERATE"
          ? "Some signs of mood dips were found. Take time for mindfulness."
          : "Your mood is stable overall.";

      setRiskData({
        mindBalanceScore: riskScore,
        riskLevel,
        summary,
        suggestions: [
          "Take a short walk outdoors",
          "Talk with someone you trust",
          "Try breathing meditation for 5 minutes",
        ],
        timestamp: new Date().toISOString(),
      });
      setLastChecked(new Date().toLocaleString() + " (Local Analysis)");
    } catch (error) {
      Alert.alert("Error", "Unable to perform fallback analysis.");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRiskData();
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

  const handleEmergencyContact = () => {
    Alert.alert(
      "Reach Out for Support",
      "Would you like to notify a trusted contact or view emergency resources?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Trusted Contacts",
          onPress: () =>
            navigation.navigate("AppTabs", {
              screen: "Profile",
              params: { screen: "TrustedContacts" },
            }),
        },
        {
          text: "Emergency Resources",
          onPress: () => navigation.navigate("EmergencyResources"),
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Analyzing your wellness patterns…</Text>
        <Text style={styles.loadingSubtext}>This may take a moment</Text>
      </View>
    );
  }

  // Error state: if riskData is null or missing required fields
  if (!riskData || typeof riskData !== 'object' || !('mindBalanceScore' in riskData)) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning" size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={styles.loadingText}>Unable to load AI risk analysis.</Text>
        <Text style={styles.loadingSubtext}>Please try refreshing or check your connection.</Text>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.primary, marginTop: 24 }]}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sev = getSeverityColor(riskData?.riskLevel);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>AI Wellness Insights</Text>
        <Text style={styles.subtitle}>
          Based on your recent 4-day mood logs • Last checked: {lastChecked}
        </Text>
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>
        {/* --- AI Risk Card --- */}
        <View style={[styles.card, styles.riskCard]}>
          <View style={styles.riskHeader}>
            <Text style={styles.riskEmoji}>{sev.emoji}</Text>
            <Text style={styles.riskTitle}>Current Mental Balance</Text>
          </View>

          <AnimatedCircularProgress
            size={150}
            width={16}
            fill={riskData.mindBalanceScore}
            tintColor={sev.color}
            backgroundColor="#E5E7EB"
            rotation={0}
            lineCap="round"
          >
            {() => (
              <View style={styles.progressContent}>
                <Text style={styles.scoreText}>
                  {riskData.mindBalanceScore}%
                </Text>
                <Text style={styles.scoreLabel}>{riskData.riskLevel} Risk</Text>
              </View>
            )}
          </AnimatedCircularProgress>

          <Text style={styles.summaryText}>{riskData.summary}</Text>

          {/* --- Suggestions --- */}
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>AI Wellness Suggestions</Text>
          </View>
          {Array.isArray(riskData.suggestions) && riskData.suggestions.length > 0 ? (
            riskData.suggestions.map((tip, i) => (
              <View key={i} style={styles.suggestionItem}>
                <Text style={styles.suggestionEmoji}>💡</Text>
                <Text style={styles.suggestionText}>{tip}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.suggestionText}>No suggestions available.</Text>
          )}

          {riskData.riskLevel === "SERIOUS" && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.emergencyBtn]}
              onPress={handleEmergencyContact}
            >
              <Ionicons name="warning" size={18} color="#fff" />
              <Text style={styles.emergencyBtnText}>Get Support</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- History Navigation --- */}
        <TouchableOpacity
          style={styles.historyCard}
          onPress={() => navigation.navigate("AIInsightsHistory")}
        >
          <Ionicons name="time-outline" size={22} color={Colors.primary} />
          <Text style={styles.historyText}>View AI Analysis History</Text>
        </TouchableOpacity>

        {/* --- Quick Actions --- */}
        <View style={styles.sectionHeader}>
          <Ionicons name="compass" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.navGrid}>
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate("MoodLog")}
          >
            <Text style={styles.navEmoji}>📝</Text>
            <Text style={styles.navText}>Log Mood</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate("MoodStats")}
          >
            <Text style={styles.navEmoji}>📊</Text>
            <Text style={styles.navText}>Mood Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate("Report")}
          >
            <Text style={styles.navEmoji}>🧠</Text>
            <Text style={styles.navText}>AI Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate("EmergencyResources")}
          >
            <Ionicons name="shield-checkmark" size={22} color="#EF4444" />
            <Text style={styles.navText}>Safety Resources</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
          <Text style={styles.disclaimerText}>
            This AI analysis provides early risk detection. It is not a medical diagnosis.
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  loadingSubtext: { marginTop: 4, fontSize: 14, color: Colors.textSecondary },
  header: { marginBottom: 24, paddingHorizontal: 8 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: { textAlign: "center", color: Colors.textSecondary, fontSize: 14 },
  card: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 3,
  },
  riskCard: { borderLeftWidth: 4, borderLeftColor: "#EF4444" },
  riskHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  riskEmoji: { fontSize: 28, marginRight: 8 },
  riskTitle: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },
  progressContent: { alignItems: "center", marginVertical: 12 },
  scoreText: { fontSize: 28, fontWeight: "bold", color: Colors.textPrimary },
  scoreLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryText: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 12,
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginLeft: 6,
  },
  suggestionItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  suggestionEmoji: { fontSize: 18, marginRight: 8 },
  suggestionText: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  actionBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  emergencyBtn: { backgroundColor: "#EF4444" },
  emergencyBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    padding: 14,
    borderRadius: 14,
    justifyContent: "center",
    marginBottom: 16,
  },
  historyText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "600",
    marginLeft: 8,
  },
  navGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  navCard: {
    width: (width - 48) / 2,
    alignItems: "center",
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    elevation: 2,
  },
  navEmoji: { fontSize: 24 },
  navText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 12,
    color: "#92400E",
    marginLeft: 8,
    flex: 1,
  },
});

export default RiskDetectionScreen;
