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

const { width } = Dimensions.get('window');

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

      const res = await axios.get(`${baseURL}/api/dashboard?range=7d`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const formatted = {
        risks: res.data.aiRiskDetected
          ? [
              {
                category: "Mood Decline",
                message: "Your mood logs show repeated declines this week. Take time for self-care 🌱",
                score: 72,
                timestamp: new Date().toISOString(),
              },
            ]
          : [],
      };

      setRiskData(formatted);
      setLastChecked(new Date().toLocaleString());
      
      // Animate content appearance
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error("❌ Error fetching AI risk:", err);
      Alert.alert(
        "Connection Issue", 
        "Could not fetch risk data. Please check your connection and try again.",
        [{ text: "Try Again", onPress: () => fetchRiskData() }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRiskData();
  };

  const getSeverity = (score) => {
    if (score < 30) return { level: "Low", color: "#10B981", emoji: "😊" };
    if (score < 70) return { level: "Moderate", color: "#F59E0B", emoji: "😐" };
    return { level: "High", color: "#EF4444", emoji: "😔" };
  };

  const handleEmergencyContact = () => {
    Alert.alert(
      "Reach Out for Support",
      "Would you like to notify a trusted contact or view emergency resources?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Trusted Contacts", 
          onPress: () => navigation.navigate("AppTabs", {
            screen: "Profile",
            params: { screen: "TrustedContacts" },
          })
        },
        { 
          text: "Emergency Resources", 
          onPress: () => navigation.navigate("EmergencyResources"),
          style: "destructive"
        }
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Mental Wellness Insights</Text>
        <Text style={styles.subtitle}>
          AI-powered analysis of your recent patterns • Last checked: {lastChecked}
        </Text>
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>

        {/* Risk Status Card */}
        {riskData?.risks?.length > 0 ? (
          riskData.risks.map((risk, index) => {
            const severity = getSeverity(risk.score);
            return (
              <View key={index} style={[styles.card, styles.riskCard]}>
                <View style={styles.riskHeader}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.riskEmoji}>{severity.emoji}</Text>
                    <Text style={styles.riskTitle}>{risk.category}</Text>
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: severity.color + '20' }]}>
                    <View style={[styles.severityDot, { backgroundColor: severity.color }]} />
                    <Text style={[styles.severityText, { color: severity.color }]}>
                      {severity.level} Risk
                    </Text>
                  </View>
                </View>

                {/* Progress Visualization */}
                <View style={styles.progressSection}>
                  <AnimatedCircularProgress
                    size={140}
                    width={14}
                    fill={risk.score}
                    tintColor={severity.color}
                    backgroundColor="#F3F4F6"
                    rotation={0}
                    lineCap="round"
                  >
                    {(fill) => (
                      <View style={styles.progressContent}>
                        <Text style={styles.scoreText}>{risk.score}%</Text>
                        <Text style={styles.scoreLabel}>Risk Level</Text>
                      </View>
                    )}
                  </AnimatedCircularProgress>
                  
                  <View style={styles.riskInsight}>
                    <Ionicons name="bulb-outline" size={20} color={Colors.secondary} />
                    <Text style={styles.riskText}>{risk.message}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                  {severity.level === "High" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.emergencyBtn]}
                      onPress={handleEmergencyContact}
                    >
                      <Ionicons name="warning" size={18} color="#fff" />
                      <Text style={styles.emergencyBtnText}>Get Support</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.suggestionBtn]}
                    onPress={() => navigation.navigate("WellnessTips")}
                  >
                    <Ionicons name="heart" size={16} color={Colors.secondary} />
                    <Text style={styles.suggestionBtnText}>Wellness Tips</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={[styles.card, styles.safeCard]}>
            <View style={styles.safeHeader}>
              <Text style={styles.safeEmoji}>✅</Text>
              <Text style={styles.safeTitle}>Good Wellness Status</Text>
            </View>
            <Text style={styles.safeText}>
              No significant risks detected in your recent patterns. Keep up your healthy habits!
            </Text>
            <Text style={styles.tipText}>
              Continue logging daily to maintain accurate insights 🌟
            </Text>
          </View>
        )}

        {/* Wellness Suggestions */}
        <View style={[styles.card, styles.suggestionsCard]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Personalized Suggestions</Text>
          </View>
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionEmoji}>🌬️</Text>
            <Text style={styles.suggestionText}>Practice 5-minute deep breathing exercises</Text>
          </View>
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionEmoji}>👥</Text>
            <Text style={styles.suggestionText}>Connect with a friend today</Text>
          </View>
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionEmoji}>🚶‍♂️</Text>
            <Text style={styles.suggestionText}>Take a 15-minute walk outside</Text>
          </View>
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionEmoji}>📔</Text>
            <Text style={styles.suggestionText}>Reflect on positive moments in your journal</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeader}>
          <Ionicons name="compass" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.navGrid}>
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate("MoodLog")}
          >
            <View style={[styles.navIcon, { backgroundColor: "#F59E0B20" }]}>
              <Text style={styles.navEmoji}>📝</Text>
            </View>
            <Text style={styles.navText}>Log Mood</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate("MoodStats")}
          >
            <View style={[styles.navIcon, { backgroundColor: "#4A90E220" }]}>
              <Text style={styles.navEmoji}>📊</Text>
            </View>
            <Text style={styles.navText}>Mood Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate("Report")}
          >
            <View style={[styles.navIcon, { backgroundColor: "#8B5CF620" }]}>
              <Text style={styles.navEmoji}>🧠</Text>
            </View>
            <Text style={styles.navText}>AI Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate("EmergencyResources")}
          >
            <View style={[styles.navIcon, { backgroundColor: "#EF444420" }]}>
              <Ionicons name="shield-checkmark" size={22} color="#EF4444" />
            </View>
            <Text style={styles.navText}>Safety Resources</Text>
          </TouchableOpacity>
        </View>

        {/* Responsible Messaging */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
          <Text style={styles.disclaimerText}>
            This AI analysis is based on your logged data and is not a substitute for professional medical advice.
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background, 
    padding: 16 
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  riskCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  safeCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  suggestionsCard: {
    backgroundColor: "#F0F9FF",
  },
  riskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  riskEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  riskTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: Colors.textPrimary,
    flex: 1,
  },
  safeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  safeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  safeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
  },
  safeText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  severityText: {
    fontWeight: "600",
    fontSize: 12,
  },
  progressSection: {
    alignItems: "center",
    marginVertical: 16,
  },
  progressContent: {
    alignItems: "center",
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  riskInsight: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  riskText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  actionContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  emergencyBtn: {
    backgroundColor: "#EF4444",
  },
  suggestionBtn: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emergencyBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  suggestionBtnText: {
    color: Colors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
  },
  suggestionEmoji: { // ✅ FIXED: This was missing from the styles object
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    flex: 1,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  navEmoji: {
    fontSize: 24,
  },
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
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
  },
});

export default RiskDetectionScreen;


// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   Platform,
//   RefreshControl,
//   Animated,
//   Dimensions,
// } from "react-native";
// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Colors } from "../utils/Colors";
// import { Ionicons } from "@expo/vector-icons";
// import { AnimatedCircularProgress } from "react-native-circular-progress";

// const { width } = Dimensions.get('window');

// const RiskDetectionScreen = ({ navigation }) => {
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [riskData, setRiskData] = useState(null);
//   const [lastChecked, setLastChecked] = useState("");
//   const [fadeAnim] = useState(new Animated.Value(0));

//   useEffect(() => {
//     fetchRiskData();
//   }, []);

//   const fetchRiskData = async () => {
//     try {
//       const token = await AsyncStorage.getItem("userToken");
//       const baseURL = Platform.OS === "android" 
//         ? "http://10.0.2.2:5000" 
//         : "http://localhost:5000";

//       // Fetch mood logs data first to send to AI analysis
//       const dashboardRes = await axios.get(`${baseURL}/api/dashboard?range=7d`, {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: token ? `Bearer ${token}` : "",
//         },
//       });

//       // Get mood logs from dashboard response or prepare empty array
//       const moodLogs = dashboardRes.data.moodLogs || [];
      
//       // Call AI risk analysis endpoint
//       const aiRes = await axios.post(`${baseURL}/api/ai/risk-analysis`, 
//         { moodLogs: moodLogs }, 
//         {
//           headers: { 
//             "Content-Type": "application/json", 
//             Authorization: token ? `Bearer ${token}` : "" 
//           },
//         }
//       );

//       const aiResult = aiRes.data;

//       // Extract score from AI response or calculate based on risk level
//       const extractScoreFromAIResponse = (rawText) => {
//         // Look for percentage patterns in the text
//         const percentageMatch = rawText.match(/(\d+)%/);
//         if (percentageMatch) return parseInt(percentageMatch[1]);
        
//         // Look for score patterns
//         const scoreMatch = rawText.match(/score[:\s]*(\d+)/i);
//         if (scoreMatch) return parseInt(scoreMatch[1]);
        
//         // Look for risk level indicators
//         if (rawText.toLowerCase().includes('high') || rawText.toLowerCase().includes('severe')) return 75;
//         if (rawText.toLowerCase().includes('moderate') || rawText.toLowerCase().includes('medium')) return 50;
//         if (rawText.toLowerCase().includes('low') || rawText.toLowerCase().includes('mild')) return 25;
        
//         // Default moderate risk if no indicators found
//         return 50;
//       };

//       const aiScore = extractScoreFromAIResponse(aiResult.raw);

//       const formatted = {
//         risks: aiResult.riskDetected ? [
//           {
//             category: "AI Wellness Analysis",
//             message: aiResult.raw || "No specific insights available at this time.",
//             score: aiScore,
//             timestamp: new Date().toISOString(),
//           },
//         ] : [],
//       };

//       setRiskData(formatted);
//       setLastChecked(new Date().toLocaleString());
      
//       // Animate content appearance
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }).start();
//     } catch (err) {
//       console.error("❌ Error fetching AI risk analysis:", err);
      
//       // Fallback to local analysis if API fails
//       if (err.response?.status === 404 || err.response?.status === 501) {
//         console.log("AI endpoint not available, using fallback analysis");
//         performFallbackAnalysis();
//       } else {
//         Alert.alert(
//           "Connection Issue", 
//           "Could not fetch risk analysis. Please check your connection and try again.",
//           [{ text: "Try Again", onPress: () => fetchRiskData() }]
//         );
//       }
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   // Fallback analysis when AI endpoint is not available
//   const performFallbackAnalysis = async () => {
//     try {
//       const token = await AsyncStorage.getItem("userToken");
//       const baseURL = Platform.OS === "android" 
//         ? "http://10.0.2.2:5000" 
//         : "http://localhost:5000";

//       const dashboardRes = await axios.get(`${baseURL}/api/dashboard?range=7d`, {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: token ? `Bearer ${token}` : "",
//         },
//       });

//       // Simple local risk detection based on mood trends
//       const moodLogs = dashboardRes.data.moodLogs || [];
//       const recentMoods = moodLogs.slice(-7); // Last 7 entries
      
//       let riskDetected = false;
//       let message = "Your mood patterns appear stable. Keep up the good work! 🌟";
//       let score = 20;

//       if (recentMoods.length >= 3) {
//         const moodValues = recentMoods.map(log => {
//           // Convert mood to numerical value (1-5 scale)
//           const moodMap = { 'very bad': 1, 'bad': 2, 'neutral': 3, 'good': 4, 'very good': 5 };
//           return moodMap[log.mood?.toLowerCase()] || 3;
//         });

//         // Calculate trend (simple linear regression)
//         const trend = moodValues.reduce((sum, mood, index) => sum + mood * index, 0) / moodValues.length;
//         const avgMood = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;

//         if (avgMood < 2.5 && trend < 0) {
//           riskDetected = true;
//           score = 75;
//           message = "Your recent mood logs show concerning patterns. Consider reaching out to supportive friends or trying relaxation techniques. 🌱";
//         } else if (avgMood < 3) {
//           riskDetected = true;
//           score = 50;
//           message = "You've had some lower mood entries recently. Remember to practice self-care and engage in activities you enjoy. 💫";
//         }
//       }

//       const formatted = {
//         risks: riskDetected ? [
//           {
//             category: "Mood Pattern Analysis",
//             message: message,
//             score: score,
//             timestamp: new Date().toISOString(),
//           },
//         ] : [],
//       };

//       setRiskData(formatted);
//       setLastChecked(new Date().toLocaleString() + " (Local Analysis)");
      
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }).start();
//     } catch (fallbackErr) {
//       console.error("❌ Fallback analysis failed:", fallbackErr);
//       Alert.alert(
//         "Analysis Unavailable", 
//         "Unable to perform risk analysis at this time. Please try again later.",
//         [{ text: "OK" }]
//       );
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchRiskData();
//   };

//   const getSeverity = (score) => {
//     if (score < 30) return { level: "Low", color: "#10B981", emoji: "😊" };
//     if (score < 70) return { level: "Moderate", color: "#F59E0B", emoji: "😐" };
//     return { level: "High", color: "#EF4444", emoji: "😔" };
//   };

//   const handleEmergencyContact = () => {
//     Alert.alert(
//       "Reach Out for Support",
//       "Would you like to notify a trusted contact or view emergency resources?",
//       [
//         { text: "Cancel", style: "cancel" },
//         { 
//           text: "Trusted Contacts", 
//           onPress: () => navigation.navigate("AppTabs", {
//             screen: "Profile",
//             params: { screen: "TrustedContacts" },
//           })
//         },
//         { 
//           text: "Emergency Resources", 
//           onPress: () => navigation.navigate("EmergencyResources"),
//           style: "destructive"
//         }
//       ]
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={Colors.secondary} />
//         <Text style={styles.loadingText}>Analyzing your wellness patterns…</Text>
//         <Text style={styles.loadingSubtext}>This may take a moment</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView 
//       style={styles.container}
//       refreshControl={
//         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//       }
//       showsVerticalScrollIndicator={false}
//     >
//       {/* Header Section */}
//       <View style={styles.header}>
//         <Text style={styles.title}>Mental Wellness Insights</Text>
//         <Text style={styles.subtitle}>
//           AI-powered analysis of your recent patterns • Last checked: {lastChecked}
//         </Text>
//       </View>

//       <Animated.View style={{ opacity: fadeAnim }}>

//         {/* Risk Status Card */}
//         {riskData?.risks?.length > 0 ? (
//           riskData.risks.map((risk, index) => {
//             const severity = getSeverity(risk.score);
//             return (
//               <View key={index} style={[styles.card, styles.riskCard]}>
//                 <View style={styles.riskHeader}>
//                   <View style={styles.titleContainer}>
//                     <Text style={styles.riskEmoji}>{severity.emoji}</Text>
//                     <Text style={styles.riskTitle}>{risk.category}</Text>
//                   </View>
//                   <View style={[styles.severityBadge, { backgroundColor: severity.color + '20' }]}>
//                     <View style={[styles.severityDot, { backgroundColor: severity.color }]} />
//                     <Text style={[styles.severityText, { color: severity.color }]}>
//                       {severity.level} Risk
//                     </Text>
//                   </View>
//                 </View>

//                 {/* Progress Visualization */}
//                 <View style={styles.progressSection}>
//                   <AnimatedCircularProgress
//                     size={140}
//                     width={14}
//                     fill={risk.score}
//                     tintColor={severity.color}
//                     backgroundColor="#F3F4F6"
//                     rotation={0}
//                     lineCap="round"
//                   >
//                     {(fill) => (
//                       <View style={styles.progressContent}>
//                         <Text style={styles.scoreText}>{risk.score}%</Text>
//                         <Text style={styles.scoreLabel}>Risk Level</Text>
//                       </View>
//                     )}
//                   </AnimatedCircularProgress>
                  
//                   <View style={styles.riskInsight}>
//                     <Ionicons name="bulb-outline" size={20} color={Colors.secondary} />
//                     <Text style={styles.riskText}>{risk.message}</Text>
//                   </View>
//                 </View>

//                 {/* Action Buttons */}
//                 <View style={styles.actionContainer}>
//                   {severity.level === "High" && (
//                     <TouchableOpacity
//                       style={[styles.actionBtn, styles.emergencyBtn]}
//                       onPress={handleEmergencyContact}
//                     >
//                       <Ionicons name="warning" size={18} color="#fff" />
//                       <Text style={styles.emergencyBtnText}>Get Support</Text>
//                     </TouchableOpacity>
//                   )}
                  
//                   <TouchableOpacity
//                     style={[styles.actionBtn, styles.suggestionBtn]}
//                     onPress={() => navigation.navigate("WellnessTips")}
//                   >
//                     <Ionicons name="heart" size={16} color={Colors.secondary} />
//                     <Text style={styles.suggestionBtnText}>Wellness Tips</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             );
//           })
//         ) : (
//           <View style={[styles.card, styles.safeCard]}>
//             <View style={styles.safeHeader}>
//               <Text style={styles.safeEmoji}>✅</Text>
//               <Text style={styles.safeTitle}>Good Wellness Status</Text>
//             </View>
//             <Text style={styles.safeText}>
//               No significant risks detected in your recent patterns. Keep up your healthy habits!
//             </Text>
//             <Text style={styles.tipText}>
//               Continue logging daily to maintain accurate insights 🌟
//             </Text>
//           </View>
//         )}

//         {/* Rest of the component remains the same */}
//         {/* Wellness Suggestions */}
//         <View style={[styles.card, styles.suggestionsCard]}>
//           <View style={styles.sectionHeader}>
//             <Ionicons name="sparkles" size={20} color={Colors.primary} />
//             <Text style={styles.sectionTitle}>Personalized Suggestions</Text>
//           </View>
//           <View style={styles.suggestionItem}>
//             <Text style={styles.suggestionEmoji}>🌬️</Text>
//             <Text style={styles.suggestionText}>Practice 5-minute deep breathing exercises</Text>
//           </View>
//           <View style={styles.suggestionItem}>
//             <Text style={styles.suggestionEmoji}>👥</Text>
//             <Text style={styles.suggestionText}>Connect with a friend today</Text>
//           </View>
//           <View style={styles.suggestionItem}>
//             <Text style={styles.suggestionEmoji}>🚶‍♂️</Text>
//             <Text style={styles.suggestionText}>Take a 15-minute walk outside</Text>
//           </View>
//           <View style={styles.suggestionItem}>
//             <Text style={styles.suggestionEmoji}>📔</Text>
//             <Text style={styles.suggestionText}>Reflect on positive moments in your journal</Text>
//           </View>
//         </View>

//         {/* Quick Actions Grid */}
//         <View style={styles.sectionHeader}>
//           <Ionicons name="compass" size={20} color={Colors.primary} />
//           <Text style={styles.sectionTitle}>Quick Actions</Text>
//         </View>
//         <View style={styles.navGrid}>
//           <TouchableOpacity
//             style={styles.navCard}
//             onPress={() => navigation.navigate("MoodLog")}
//           >
//             <View style={[styles.navIcon, { backgroundColor: "#F59E0B20" }]}>
//               <Text style={styles.navEmoji}>📝</Text>
//             </View>
//             <Text style={styles.navText}>Log Mood</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.navCard}
//             onPress={() => navigation.navigate("MoodStats")}
//           >
//             <View style={[styles.navIcon, { backgroundColor: "#4A90E220" }]}>
//               <Text style={styles.navEmoji}>📊</Text>
//             </View>
//             <Text style={styles.navText}>Mood Stats</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.navCard}
//             onPress={() => navigation.navigate("Report")}
//           >
//             <View style={[styles.navIcon, { backgroundColor: "#8B5CF620" }]}>
//               <Text style={styles.navEmoji}>🧠</Text>
//             </View>
//             <Text style={styles.navText}>AI Reports</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.navCard}
//             onPress={() => navigation.navigate("EmergencyResources")}
//           >
//             <View style={[styles.navIcon, { backgroundColor: "#EF444420" }]}>
//               <Ionicons name="shield-checkmark" size={22} color="#EF4444" />
//             </View>
//             <Text style={styles.navText}>Safety Resources</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Responsible Messaging */}
//         <View style={styles.disclaimer}>
//           <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
//           <Text style={styles.disclaimerText}>
//             This AI analysis is based on your logged data and is not a substitute for professional medical advice.
//           </Text>
//         </View>
//       </Animated.View>
//     </ScrollView>
//   );
// };

// // Styles remain the same as previous version
// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: Colors.background, 
//     padding: 16 
//   },
//   center: { 
//     flex: 1, 
//     justifyContent: "center", 
//     alignItems: "center" 
//   },
//   loadingText: { 
//     marginTop: 12, 
//     fontSize: 16,
//     color: Colors.textPrimary,
//     fontWeight: "600",
//   },
//   loadingSubtext: {
//     marginTop: 4,
//     fontSize: 14,
//     color: Colors.textSecondary,
//   },
//   header: {
//     marginBottom: 24,
//     paddingHorizontal: 8,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: Colors.textPrimary,
//     marginBottom: 8,
//     textAlign: "center",
//   },
//   subtitle: {
//     textAlign: "center",
//     color: Colors.textSecondary,
//     fontSize: 14,
//     lineHeight: 20,
//   },
//   card: {
//     backgroundColor: Colors.card,
//     padding: 20,
//     borderRadius: 20,
//     marginBottom: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   riskCard: {
//     borderLeftWidth: 4,
//     borderLeftColor: "#EF4444",
//   },
//   safeCard: {
//     borderLeftWidth: 4,
//     borderLeftColor: "#10B981",
//   },
//   suggestionsCard: {
//     backgroundColor: "#F0F9FF",
//   },
//   riskHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     marginBottom: 16,
//   },
//   titleContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//   },
//   riskEmoji: {
//     fontSize: 24,
//     marginRight: 8,
//   },
//   riskTitle: { 
//     fontSize: 20, 
//     fontWeight: "700", 
//     color: Colors.textPrimary,
//     flex: 1,
//   },
//   safeHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   safeEmoji: {
//     fontSize: 24,
//     marginRight: 12,
//   },
//   safeTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#059669",
//   },
//   safeText: {
//     fontSize: 15,
//     color: Colors.textPrimary,
//     lineHeight: 22,
//     marginBottom: 8,
//   },
//   severityBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//   },
//   severityDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     marginRight: 6,
//   },
//   severityText: {
//     fontWeight: "600",
//     fontSize: 12,
//   },
//   progressSection: {
//     alignItems: "center",
//     marginVertical: 16,
//   },
//   progressContent: {
//     alignItems: "center",
//   },
//   scoreText: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: Colors.textPrimary,
//   },
//   scoreLabel: {
//     fontSize: 12,
//     color: Colors.textSecondary,
//     marginTop: 4,
//   },
//   riskInsight: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     marginTop: 16,
//     padding: 12,
//     backgroundColor: "#F8FAFC",
//     borderRadius: 12,
//   },
//   riskText: {
//     fontSize: 14,
//     color: Colors.textSecondary,
//     lineHeight: 20,
//     marginLeft: 8,
//     flex: 1,
//   },
//   tipText: {
//     fontSize: 13,
//     color: Colors.textSecondary,
//     fontStyle: "italic",
//   },
//   actionContainer: {
//     flexDirection: "row",
//     gap: 12,
//     marginTop: 16,
//   },
//   actionBtn: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     gap: 6,
//   },
//   emergencyBtn: {
//     backgroundColor: "#EF4444",
//   },
//   suggestionBtn: {
//     backgroundColor: "#F3F4F6",
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   emergencyBtnText: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: 14,
//   },
//   suggestionBtnText: {
//     color: Colors.textPrimary,
//     fontWeight: "600",
//     fontSize: 14,
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 16,
//     marginTop: 8,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: Colors.textPrimary,
//     marginLeft: 8,
//   },
//   suggestionItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//     paddingVertical: 8,
//   },
//   suggestionEmoji: {
//     fontSize: 20,
//     marginRight: 12,
//     width: 24,
//   },
//   suggestionText: {
//     fontSize: 14,
//     color: Colors.textPrimary,
//     lineHeight: 20,
//     flex: 1,
//   },
//   navGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//     marginBottom: 24,
//   },
//   navCard: {
//     width: (width - 48) / 2,
//     alignItems: "center",
//     marginBottom: 16,
//     padding: 16,
//     backgroundColor: Colors.card,
//     borderRadius: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   navIcon: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   navEmoji: {
//     fontSize: 24,
//   },
//   navText: {
//     fontSize: 13,
//     fontWeight: "600",
//     color: Colors.textPrimary,
//     textAlign: "center",
//   },
//   disclaimer: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     padding: 16,
//     backgroundColor: "#FEF3C7",
//     borderRadius: 12,
//     marginBottom: 24,
//   },
//   disclaimerText: {
//     fontSize: 12,
//     color: "#92400E",
//     lineHeight: 16,
//     marginLeft: 8,
//     flex: 1,
//   },
// });

// export default RiskDetectionScreen;