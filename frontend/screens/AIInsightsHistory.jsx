import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { LineChart } from "react-native-chart-kit";

// ✅ Get screen dimensions for responsiveness
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const isSmallDevice = screenWidth < 375;

// ✅ Modern Color System with gradients
const Colors = {
  // Primary Colors
  primary: "#6366F1",
  primaryLight: "#EEF2FF",
  primaryDark: "#4338CA",
  
  // Secondary Colors
  secondary: "#10B981",
  secondaryLight: "#D1FAE5",
  secondaryDark: "#047857",
  
  // Background & Surface
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  
  // Text Colors
  textPrimary: "#1E293B",
  textSecondary: "#475569",
  textTertiary: "#64748B",
  textInverse: "#FFFFFF",
  
  // Semantic Colors
  success: "#10B981",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  info: "#3B82F6",
  
  // Emotion Colors
  stress: "#F59E0B",
  anxiety: "#8B5CF6",
  anger: "#EC4899",
  tiredness: "#6B7280",
  
  // UI Colors
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  shadow: "rgba(0, 0, 0, 0.08)",
  overlay: "rgba(0, 0, 0, 0.4)",
};

const AIInsightsHistory = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchHistory();
  }, []);

  // ✅ Enhanced fetch with error handling
  const fetchHistory = async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem("userToken");
      const baseURL =
        Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

      const res = await axios.get(`${baseURL}/api/ai/risk-history`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        timeout: 10000,
      });

      setHistory(res.data || []);
      
      // Animate content in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      
    } catch (err) {
      console.error("❌ Error fetching AI history:", err);
      setError(err.response?.data?.message || "Failed to load insights");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  // 🎨 Enhanced Emotion/Risk styling with better UX
  const getSeverityStyle = (level) => {
    const levelUpper = level?.toUpperCase();
    
    switch (levelUpper) {
      case "LOW":
        return { 
          color: Colors.success,
          bgColor: Colors.secondaryLight,
          emoji: "😊",
          label: "Doing Great",
          icon: "happy",
          gradient: ["#10B981", "#34D399"]
        };
      case "MODERATE":
        return { 
          color: Colors.warning,
          bgColor: Colors.warningLight,
          emoji: "😐",
          label: "Moderate",
          icon: "alert-circle",
          gradient: ["#F59E0B", "#FBBF24"]
        };
      case "SERIOUS":
        return { 
          color: Colors.error,
          bgColor: Colors.errorLight,
          emoji: "🚨",
          label: "Needs Attention",
          icon: "warning",
          gradient: ["#EF4444", "#F87171"]
        };
      case "STRESS":
        return { 
          color: Colors.stress,
          bgColor: "#FEF3C7",
          emoji: "😣",
          label: "Stressed",
          icon: "flash",
          gradient: ["#F59E0B", "#FBBF24"]
        };
      case "ANGER":
        return { 
          color: Colors.anger,
          bgColor: "#FCE7F3",
          emoji: "😡",
          label: "Angry",
          icon: "flame",
          gradient: ["#EC4899", "#F472B6"]
        };
      case "ANXIETY":
        return { 
          color: Colors.anxiety,
          bgColor: "#EDE9FE",
          emoji: "😰",
          label: "Anxious",
          icon: "cloudy",
          gradient: ["#8B5CF6", "#A78BFA"]
        };
      case "TIREDNESS":
        return { 
          color: Colors.tiredness,
          bgColor: "#F3F4F6",
          emoji: "😴",
          label: "Tired",
          icon: "moon",
          gradient: ["#6B7280", "#9CA3AF"]
        };
      default:
        return { 
          color: Colors.textTertiary,
          bgColor: Colors.borderLight,
          emoji: "🙂",
          label: "Neutral",
          icon: "help-circle",
          gradient: ["#64748B", "#94A3B8"]
        };
    }
  };

  // Header animation based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [1, 0.8, 0.6],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingTitle}>Loading Insights</Text>
          <Text style={styles.loadingSubtitle}>
            Analyzing your wellness patterns...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.errorContent}>
          <Ionicons name="cloud-offline" size={64} color={Colors.textTertiary} />
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchHistory}>
            <Ionicons name="reload" size={20} color={Colors.textInverse} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 🧠 Prepare chart data with safety checks
  const recent = history.slice(0, 7).reverse();
  
  const trendData = recent.map((item) => {
    const val = Number(item.wellnessIndex);
    return !isNaN(val) && val > 0 ? val : 50; // Default to 50 if invalid
  });

  const trendLabels = recent.map((item) => {
    const d = new Date(item.date);
    return isNaN(d) ? "—" : `${d.getDate()}/${d.getMonth() + 1}`;
  });

  // 🧩 Safe rendering of chart
  const hasValidData = trendData.filter((v) => v > 0).length >= 2;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Enhanced Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>AI Insights</Text>
            <Text style={styles.subtitle}>
              Your wellness journey overview
            </Text>
          </View>
          
          <View style={styles.headerIcon}>
            <Ionicons name="analytics" size={24} color={Colors.primary} />
          </View>
        </View>
      </Animated.View>

      {/* Main Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            title="Pull to refresh insights..."
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Insights Overview Card */}
          {history.length > 0 && (
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Text style={styles.overviewTitle}>Insights Overview</Text>
                <View style={styles.insightCountBadge}>
                  <Text style={styles.insightCountText}>
                    {history.length} {history.length === 1 ? 'Entry' : 'Entries'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.overviewStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round(history.reduce((sum, item) => sum + (Number(item.wellnessIndex) || 0), 0) / history.length)}%
                  </Text>
                  <Text style={styles.statLabel}>Avg. Score</Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {new Set(history.map(item => item.riskLevel)).size}
                  </Text>
                  <Text style={styles.statLabel}>States</Text>
                </View>
              </View>
            </View>
          )}

          {/* Trend Visualization */}
          {hasValidData && (
            <View style={styles.trendCard}>
              <View style={styles.trendHeader}>
                <View style={styles.trendTitleContainer}>
                  <Ionicons name="trending-up" size={20} color={Colors.primary} />
                  <Text style={styles.trendTitle}>Wellness Trend</Text>
                </View>
                <Text style={styles.trendSubtitle}>Last 7 entries</Text>
              </View>
              
              <LineChart
                data={{
                  labels: trendLabels,
                  datasets: [{ data: trendData }],
                }}
                width={Math.min(screenWidth - 80, 400)}
                height={200}
                yAxisInterval={1}
                fromZero={false}
                chartConfig={{
                  backgroundColor: Colors.surface,
                  backgroundGradientFrom: Colors.surface,
                  backgroundGradientTo: Colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                  labelColor: () => Colors.textSecondary,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: "5",
                    strokeWidth: "2",
                    stroke: Colors.primary,
                  },
                  propsForBackgroundLines: {
                    stroke: Colors.border,
                    strokeDasharray: "",
                  },
                  propsForLabels: {
                    fontSize: 11,
                  },
                }}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={true}
                withInnerLines={true}
              />
            </View>
          )}

          {/* History List */}
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <Ionicons name="bar-chart" size={72} color={Colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No insights yet</Text>
              <Text style={styles.emptyDescription}>
                Start logging your moods regularly to see AI-generated insights about your emotional patterns.
              </Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => navigation.navigate('MoodTracker')}
              >
                <Ionicons name="add-circle" size={20} color={Colors.textInverse} />
                <Text style={styles.primaryButtonText}>Log Your First Mood</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Recent Insights</Text>
              {history.map((item, index) => {
                const severity = getSeverityStyle(item.riskLevel);
                const parsedDate = new Date(item.date);
                const formattedDate = isNaN(parsedDate)
                  ? "Unknown Date"
                  : new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).format(parsedDate);

                return (
                  <View 
                    key={index} 
                    style={[
                      styles.insightCard,
                      index === 0 && styles.firstCard,
                    ]}
                  >
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.emotionSection}>
                        <Text style={styles.emoji}>{severity.emoji}</Text>
                        <View style={[styles.severityBadge, { backgroundColor: severity.bgColor }]}>
                          <Ionicons name={severity.icon} size={14} color={severity.color} />
                          <Text style={[styles.severityText, { color: severity.color }]}>
                            {severity.label}
                          </Text>
                        </View>
                      </View>
                      
                      <AnimatedCircularProgress
                        size={68}
                        width={6}
                        fill={Number(item.wellnessIndex) || 0}
                        tintColor={severity.color}
                        backgroundColor={Colors.borderLight}
                        rotation={0}
                        lineCap="round"
                        duration={1200}
                      >
                        {() => (
                          <View style={styles.scoreContainer}>
                            <Text style={styles.scoreText}>
                              {Math.round(Number(item.wellnessIndex) || 0)}%
                            </Text>
                          </View>
                        )}
                      </AnimatedCircularProgress>
                    </View>

                    {/* Date */}
                    <View style={styles.dateContainer}>
                      <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
                      <Text style={styles.dateText}>{formattedDate}</Text>
                    </View>

                    {/* Summary */}
                    <Text style={styles.summary}>
                      {item.summary || "No AI summary generated for this entry."}
                    </Text>

                    {/* Suggestions */}
                    {item.suggestions && item.suggestions.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        <View style={styles.suggestionsHeader}>
                          <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
                          <Text style={styles.suggestionsTitle}>AI Suggestions</Text>
                        </View>
                        {item.suggestions.slice(0, 3).map((suggestion, i) => (
                          <View key={i} style={styles.suggestionItem}>
                            <View style={[styles.suggestionDot, { backgroundColor: severity.color }]} />
                            <Text style={styles.suggestionText}>{suggestion}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Source */}
                    <View style={styles.sourceContainer}>
                      <Text style={styles.sourceText}>
                        Source: {item.source || "Healio AI Engine"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacer} />
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
};

// ✅ Modern, Professional Styles
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background,
  },
  
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  
  loadingSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  errorContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  
  errorMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  retryButtonText: {
    color: Colors.textInverse,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  
  header: {
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: 20,
  },
  
  content: {
    paddingHorizontal: 24,
  },
  
  overviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  
  insightCountBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  insightCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  
  overviewStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  
  statLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  
  trendCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  
  trendHeader: {
    marginBottom: 16,
  },
  
  trendTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  trendTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  
  trendSubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  
  chart: {
    borderRadius: 16,
    marginLeft: -10,
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  
  emptyDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  primaryButtonText: {
    color: Colors.textInverse,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  
  historySection: {
    marginTop: 8,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  
  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  firstCard: {
    marginTop: 4,
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  
  emotionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  severityText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  scoreContainer: {
    alignItems: 'center',
  },
  
  scoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  dateText: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginLeft: 6,
  },
  
  summary: {
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  
  suggestionsContainer: {
    backgroundColor: Colors.borderLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  
  suggestionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  
  sourceContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  
  sourceText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'right',
  },
  
  bottomSpacer: {
    height: 20,
  },
});

export default AIInsightsHistory;