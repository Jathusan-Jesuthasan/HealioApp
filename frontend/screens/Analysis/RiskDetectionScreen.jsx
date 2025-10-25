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
  SafeAreaView,
  Easing,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../../utils/Colors";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 375;

const RiskDetectionScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [lastChecked, setLastChecked] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [analysisStage, setAnalysisStage] = useState("");

  // Analysis stages for better UX
  const analysisStages = [
    "Analyzing your mood patterns...",
    "Checking emotional trends...",
    "Generating AI insights...",
    "Preparing your wellness report..."
  ];

  useEffect(() => {
    fetchRiskData();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      // Show analysis stages for better UX
      let stageIndex = 0;
      const stageInterval = setInterval(() => {
        setAnalysisStage(analysisStages[stageIndex]);
        stageIndex = (stageIndex + 1) % analysisStages.length;
      }, 1200);

      const token = await AsyncStorage.getItem("userToken");
      const baseURL = Platform.OS === "android"
        ? "http://10.0.2.2:5000"
        : "http://localhost:5000";

      // Step 1️⃣: Fetch dashboard logs
      const dashboardRes = await axios.get(`${baseURL}/api/dashboard?range=7d`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const moodLogs = dashboardRes.data.moodLogs || [];

      // Step 2️⃣: Request AI hybrid analysis
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

      clearInterval(stageInterval);
      const ai = aiRes.data;

      // Step 3️⃣: Format backend JSON safely
      const formatted = {
        mindBalanceScore: ai.mindBalanceScore ?? 75,
        riskLevel: ai.risks && ai.risks[0]
          ? ai.risks[0].category?.toUpperCase() || "STABLE"
          : "STABLE",
        summary: ai.risks && ai.risks[0]
          ? ai.risks[0].message || "Your emotional patterns show good balance and resilience."
          : "Your emotional patterns show good balance and resilience.",
        suggestions: ai.suggestion
          ? [ai.suggestion]
          : ["Keep maintaining your emotional balance! 💪"],
        timestamp: ai.createdAt || new Date().toISOString(),
        source: ai.source || "AI Wellness Analysis",
        confidence: ai.confidence || 92,
        factors: ai.factors || ["Mood consistency", "Sleep patterns", "Activity levels"],
      };

      setRiskData(formatted);
      setLastChecked(new Date().toLocaleString());

      // Animate content in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start();

    } catch (err) {
      console.error("❌ AI Risk fetch failed:", err);
      performFallbackAnalysis();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const performFallbackAnalysis = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const baseURL = Platform.OS === "android"
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
        const moodMap = { Happy: 5, Neutral: 3, Sad: 2, Angry: 1, Tired: 1 };
        const total = recentMoods.reduce(
          (sum, log) => sum + (moodMap[log.mood] || 3),
          0
        );
        avgMood = total / recentMoods.length;
      }

      const riskScore = avgMood < 2.5 ? 75 : avgMood < 3 ? 50 : 20;
      const riskLevel = riskScore >= 70 ? "ELEVATED" : riskScore >= 40 ? "MODERATE" : "BALANCED";
      
      const summary = riskLevel === "ELEVATED"
        ? "Your recent patterns suggest increased emotional sensitivity. Consider mindfulness practices."
        : riskLevel === "MODERATE"
        ? "Some emotional fluctuations detected. Regular self-care can help maintain balance."
        : "Your emotional patterns show good stability and resilience.";

      setRiskData({
        mindBalanceScore: 100 - riskScore, // Invert for wellness score
        riskLevel,
        summary,
        suggestions: [
          "Take a mindful walk in nature 🌿",
          "Practice 5-minute deep breathing 🧘‍♀️",
          "Connect with supportive friends 🤝",
          "Engage in creative activities 🎨"
        ],
        timestamp: new Date().toISOString(),
        source: "Local Analysis",
        confidence: 85,
        factors: ["Recent mood entries", "Pattern consistency", "Entry frequency"]
      });
      setLastChecked(new Date().toLocaleString() + " (Local Analysis)");

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start();

    } catch (error) {
      console.error("Fallback analysis failed:", error);
      Alert.alert(
        "Connection Issue", 
        "We're having trouble analyzing your data. Please check your connection.",
        [{ text: "Try Again", onPress: fetchRiskData }]
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRiskData();
  };

  const getSeverityConfig = (level) => {
    const configs = {
      "BALANCED": { 
        color: "#10B981", 
        emoji: "😊", 
        label: "Well Balanced",
        gradient: ["#10B981", "#34D399"]
      },
      "MODERATE": { 
        color: "#F59E0B", 
        emoji: "😐", 
        label: "Needs Attention",
        gradient: ["#F59E0B", "#FBBF24"]
      },
      "ELEVATED": { 
        color: "#EF4444", 
        emoji: "😔", 
        label: "Elevated",
        gradient: ["#EF4444", "#F87171"]
      },
      "STABLE": { 
        color: "#60A5FA", 
        emoji: "🙂", 
        label: "Stable",
        gradient: ["#60A5FA", "#93C5FD"]
      }
    };
    return configs[level] || configs.STABLE;
  };

  const handleEmergencyContact = () => {
    Alert.alert(
      "Support Options",
      "Remember, reaching out is a sign of strength. Choose an option:",
      [
        { 
          text: "Trusted Contacts", 
          onPress: () => navigation.navigate("TrustedContacts")
        },
        {
          text: "Crisis Resources",
          onPress: () => navigation.navigate("EmergencyResources"),
          style: "destructive"
        },
        { text: "Not Now", style: "cancel" }
      ]
    );
  };

  const LoadingScreen = () => (
    <SafeAreaView style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LottieView
            source={require('../../assets/animations/ai-analysis.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        </Animated.View>
        
        <Text style={styles.loadingTitle}>AI Wellness Analysis</Text>
        <Text style={styles.loadingStage}>{analysisStage}</Text>
        
        <View style={styles.loadingTips}>
          <Text style={styles.loadingTip}>🔍 Analyzing your mood patterns</Text>
          <Text style={styles.loadingTip}>📊 Checking emotional trends</Text>
          <Text style={styles.loadingTip}>🤖 Generating insights</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  const ErrorScreen = () => (
    <SafeAreaView style={styles.center}>
      <LottieView
        source={require('../../assets/animations/error.json')}
        autoPlay
        loop
        style={styles.errorAnimation}
      />
      <Text style={styles.errorTitle}>Analysis Unavailable</Text>
      <Text style={styles.errorText}>
        We're having trouble connecting to our analysis service.
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={fetchRiskData}
      >
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  if (loading) return <LoadingScreen />;
  if (!riskData) return <ErrorScreen />;

  const severity = getSeverityConfig(riskData.riskLevel);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.secondary}
            colors={[Colors.secondary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🌱 Wellness Insights</Text>
          <Text style={styles.subtitle}>
            AI-powered emotional pattern analysis
          </Text>
          <View style={styles.lastUpdated}>
            <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.lastUpdatedText}>Updated {lastChecked}</Text>
          </View>
        </View>

        <Animated.View 
          style={[
            styles.animatedContent,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Main Risk Analysis Card */}
          <View style={[styles.card, styles.riskCard]}>
            <View style={styles.riskHeader}>
              <View style={styles.riskBadge}>
                <Text style={styles.riskEmoji}>{severity.emoji}</Text>
                <Text style={styles.riskLabel}>{severity.label}</Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                <Text style={styles.confidenceText}>{riskData.confidence}% confidence</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <AnimatedCircularProgress
                size={isSmallScreen ? 140 : 160}
                width={16}
                fill={riskData.mindBalanceScore}
                tintColor={severity.color}
                backgroundColor="#F3F4F6"
                rotation={0}
                lineCap="round"
                backgroundWidth={8}
              >
                {() => (
                  <View style={styles.progressContent}>
                    <Text style={styles.scoreText}>
                      {riskData.mindBalanceScore}%
                    </Text>
                    <Text style={styles.scoreLabel}>Wellness Score</Text>
                  </View>
                )}
              </AnimatedCircularProgress>
            </View>

            <Text style={styles.summaryText}>{riskData.summary}</Text>

            {/* Analysis Factors */}
            <View style={styles.factorsSection}>
              <Text style={styles.factorsTitle}>Key Factors Considered</Text>
              <View style={styles.factorsGrid}>
                {riskData.factors?.map((factor, index) => (
                  <View key={index} style={styles.factorChip}>
                    <Ionicons name="checkmark-circle" size={14} color={severity.color} />
                    <Text style={styles.factorText}>{factor}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* AI Suggestions */}
            <View style={styles.suggestionsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Personalized Suggestions</Text>
              </View>

              {riskData.suggestions?.map((tip, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <View style={[styles.suggestionIcon, { backgroundColor: `${severity.color}15` }]}>
                    <Text style={[styles.suggestionNumber, { color: severity.color }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={styles.suggestionText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Emergency Action */}
            {riskData.riskLevel === "ELEVATED" && (
              <TouchableOpacity
                style={[styles.actionButton, styles.emergencyButton]}
                onPress={handleEmergencyContact}
              >
                <View style={styles.emergencyHeader}>
                  <Ionicons name="warning" size={20} color="#fff" />
                  <Text style={styles.emergencyTitle}>Get Support Now</Text>
                </View>
                <Text style={styles.emergencyText}>
                  You're not alone. Reach out to trusted contacts or emergency resources.
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Actions Grid */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("MoodLog")}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
                <Text style={styles.actionEmoji}>📝</Text>
              </View>
              <Text style={styles.actionText}>Log Current Mood</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("MoodStats")}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Text style={styles.actionEmoji}>📊</Text>
              </View>
              <Text style={styles.actionText}>View Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("Report")}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEF7CD' }]}>
                <Text style={styles.actionEmoji}>🧠</Text>
              </View>
              <Text style={styles.actionText}>AI Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("EmergencyResources")}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#EF4444" />
              </View>
              <Text style={styles.actionText}>Safety Resources</Text>
            </TouchableOpacity>
          </View>

          {/* History & Resources */}
          <View style={styles.resourcesSection}>
            <TouchableOpacity
              style={styles.historyCard}
              onPress={() => navigation.navigate("AIInsightsHistory")}
            >
              <Ionicons name="analytics" size={20} color={Colors.primary} />
              <View style={styles.historyTextContent}>
                <Text style={styles.historyTitle}>Analysis History</Text>
                <Text style={styles.historySubtitle}>View past wellness reports</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.disclaimer}>
              <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
              <Text style={styles.disclaimerText}>
                This AI analysis provides insights based on your mood patterns and is not a substitute for professional medical advice.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
  },
  // Loading Styles
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingAnimation: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingStage: {
    fontSize: 14,
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  loadingTips: {
    gap: 8,
  },
  loadingTip: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Error Styles
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
  },
  errorAnimation: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Main Content Styles
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: isSmallScreen ? 24 : 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  animatedContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  riskCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskEmoji: {
    fontSize: 20,
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  confidenceText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressContent: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  summaryText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  factorsSection: {
    marginBottom: 20,
  },
  factorsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  factorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  factorText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  suggestionsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  suggestionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  suggestionNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  actionButton: {
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  emergencyButton: {
    backgroundColor: '#EF4444',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  emergencyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emergencyText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    width: (width - 56) / 2,
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 20,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  resourcesSection: {
    gap: 12,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  historyTextContent: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  historySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
});

export default RiskDetectionScreen;