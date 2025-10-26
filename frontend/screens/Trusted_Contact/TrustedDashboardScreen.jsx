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
  Platform,
  Pressable,
  Animated,
  RefreshControl,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import api from "../../config/api";
import { getDatabase, ref, onValue } from "firebase/database";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../../config/firebaseConfig";

const { width: screenWidth } = Dimensions.get("window");

export default function TrustedDashboardScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const Touchable = Platform.OS === "web" ? Pressable : TouchableOpacity;
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // 🔹 Fetch all data
  const fetchAllData = async () => {
    try {
      await Promise.all([fetchDashboard(), fetchAlerts(), fetchRequests()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

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

  const fetchRequests = async () => {
    if (!userToken) return;
    setRequestsLoading(true);
    try {
      const { data } = await api.get("/api/trusted/requests/incoming", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setRequests(data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    if (!requestId || !action) return;
    setProcessingRequestId(`${requestId}-${action}`);
    try {
      await api.patch(
        `/api/trusted/requests/${requestId}`,
        { action },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      await Promise.all([fetchRequests(), fetchDashboard()]);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Unable to update request.";
      Alert.alert("Request", msg);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
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

    fetchAllData().finally(() => setLoading(false));

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
      }),
    ]).start();

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

  const getWellnessColor = (score) => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  const getWellnessStatus = (score) => {
    if (score >= 80) return "Doing Great";
    if (score >= 60) return "Stable";
    return "Needs Support";
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <Animated.View 
        style={[
          styles.headerSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Trusted Dashboard</Text>
            <Text style={styles.headerSubtitle}>Supporting youth wellness together</Text>
          </View>
          <Touchable style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#4A90E2" />
            {alerts.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>{alerts.length}</Text>
              </View>
            )}
          </Touchable>
        </View>

        <View style={styles.statsOverview}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dashboard.length}</Text>
            <Text style={styles.statLabel}>Youth Connected</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{alerts.length}</Text>
            <Text style={styles.statLabel}>Active Alerts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{requests.length}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
        </View>
      </Animated.View>

      {/* Disclaimer Banner */}
      <Animated.View 
        style={[
          styles.disclaimer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Ionicons name="medical-outline" size={20} color="#0369A1" />
        <Text style={styles.disclaimerText}>
          This dashboard is for emotional support only — not a clinical tool.
        </Text>
      </Animated.View>

      {/* Requests Section */}
      {requests.length > 0 && (
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="person-add-outline" size={22} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Connection Requests</Text>
            </View>
            <View style={styles.requestCountBadge}>
              <Text style={styles.requestCountText}>{requests.length}</Text>
            </View>
          </View>

          {requests.map((req, index) => {
            const youth = req.youthId || {};
            const createdAt = req.createdAt ? new Date(req.createdAt) : null;
            const acceptKey = `${req._id}-accept`;
            const declineKey = `${req._id}-decline`;
            
            return (
              <View key={req._id} style={[
                styles.requestCard,
                index === requests.length - 1 && styles.requestCardLast
              ]}>
                <View style={styles.requestHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {youth.name ? youth.name.charAt(0).toUpperCase() : "Y"}
                    </Text>
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{youth.name || "Youth User"}</Text>
                    {youth.email && (
                      <Text style={styles.requestEmail}>{youth.email}</Text>
                    )}
                  </View>
                  <Text style={styles.requestTime}>
                    {createdAt ? createdAt.toLocaleDateString() : ''}
                  </Text>
                </View>

                {req.message && (
                  <Text style={styles.requestMessage}>&ldquo;{req.message}&rdquo;</Text>
                )}

                {req.status === "Pending" ? (
                  <View style={styles.requestActions}>
                    <Touchable
                      style={[styles.requestButton, styles.acceptButton]}
                      onPress={() => handleRequestAction(req._id, "accept")}
                      disabled={processingRequestId === acceptKey}
                    >
                      {processingRequestId === acceptKey ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={18} color="#fff" />
                          <Text style={styles.requestButtonText}>Accept</Text>
                        </>
                      )}
                    </Touchable>
                    <Touchable
                      style={[styles.requestButton, styles.declineButton]}
                      onPress={() => handleRequestAction(req._id, "decline")}
                      disabled={processingRequestId === declineKey}
                    >
                      {processingRequestId === declineKey ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="close" size={18} color="#fff" />
                          <Text style={styles.requestButtonText}>Decline</Text>
                        </>
                      )}
                    </Touchable>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, styles[`status${req.status}`]]}>
                    <Text style={styles.statusText}>{req.status}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </Animated.View>
      )}

      {/* Youth Wellness Cards */}
      {dashboard.map((youth, index) => (
        <Animated.View 
          key={youth.id || youth._id}
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.youthCard}>
            <View style={styles.youthHeader}>
              <View style={styles.youthInfo}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarLargeText}>
                    {youth.name ? youth.name.charAt(0).toUpperCase() : "Y"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.youthName}>{youth.name}</Text>
                  <View style={styles.wellnessStatus}>
                    <View 
                      style={[
                        styles.statusDot, 
                        { backgroundColor: getWellnessColor(youth.wellnessScore || 0) }
                      ]} 
                    />
                    <Text style={styles.wellnessStatusText}>
                      {getWellnessStatus(youth.wellnessScore || 0)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Wellness Score</Text>
                <Text style={[
                  styles.scoreValue,
                  { color: getWellnessColor(youth.wellnessScore || 0) }
                ]}>
                  {youth.wellnessScore || 0}
                </Text>
              </View>
            </View>

            {/* Mood Chart */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Weekly Mood Trend</Text>
                <Feather name="bar-chart-2" size={16} color="#6B7280" />
              </View>
              <LineChart
                data={{
                  labels: ["M", "T", "W", "T", "F", "S", "S"],
                  datasets: [
                    {
                      data: youth.recentMood?.map((m) => m.value) || [0, 0, 0, 0, 0, 0, 0],
                    },
                  ],
                }}
                width={screenWidth - 80}
                height={160}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: "#FFFFFF",
                  backgroundGradientFrom: "#FFFFFF",
                  backgroundGradientTo: "#FFFFFF",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#4A90E2",
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: "#F3F4F6",
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionGrid}>
              <Touchable
                style={[styles.actionButton, styles.analyticsButton]}
                onPress={() => navigation.navigate("TrustedAnalytics", { youthId: youth.id || youth._id })}
              >
                <Feather name="bar-chart-2" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Analytics</Text>
              </Touchable>

              <Touchable style={styles.actionButton} onPress={handleChat}>
                <Feather name="message-circle" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Message</Text>
              </Touchable>

              <Touchable
                style={[styles.actionButton, styles.callButton]}
                onPress={() => handleCall("0771234567")}
              >
                <Feather name="phone" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Call</Text>
              </Touchable>
            </View>
          </View>
        </Animated.View>
      ))}

      {/* Alerts Section */}
      <Animated.View 
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
          </View>
          {alerts.length > 0 && (
            <View style={styles.alertCountBadge}>
              <Text style={styles.alertCountText}>{alerts.length}</Text>
            </View>
          )}
        </View>

        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
            <Text style={styles.emptyStateTitle}>All Clear</Text>
            <Text style={styles.emptyStateText}>No alerts at this time</Text>
          </View>
        ) : (
          alerts.map((alert, index) => (
            <View 
              key={index} 
              style={[
                styles.alertCard,
                index === alerts.length - 1 && styles.alertCardLast
              ]}
            >
              <View style={styles.alertIcon}>
                <Ionicons name="warning" size={20} color="#EF4444" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.youthName}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </Animated.View>

      {/* Report Section */}
      <Animated.View 
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Touchable style={styles.reportCard} onPress={downloadReport}>
          <View style={styles.reportIcon}>
            <Feather name="download" size={24} color="#4A90E2" />
          </View>
          <View style={styles.reportContent}>
            <Text style={styles.reportTitle}>Weekly Wellness Report</Text>
            <Text style={styles.reportDescription}>
              Download comprehensive insights and trends
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Touchable>
      </Animated.View>

      {/* Footer Status */}
      <Animated.View 
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <View style={styles.statusIndicator}>
          <View 
            style={[
              styles.statusDot,
              { backgroundColor: firebaseConnected ? "#10B981" : "#6B7280" }
            ]} 
          />
          <Text style={styles.statusText}>
            {firebaseConnected ? "Live data connected" : "Connecting to live data..."}
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 16,
  },
  headerSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "500",
  },
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationCount: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  statsOverview: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E0F2FE",
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#0369A1",
  },
  disclaimerText: {
    flex: 1,
    color: "#0369A1",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  requestCountBadge: {
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  requestCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  requestCardLast: {
    marginBottom: 0,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  requestEmail: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  requestTime: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  requestMessage: {
    fontSize: 14,
    color: "#475569",
    fontStyle: "italic",
    lineHeight: 20,
    marginBottom: 16,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 8,
  },
  requestActions: {
    flexDirection: "row",
    gap: 12,
  },
  requestButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButton: {
    backgroundColor: "#10B981",
  },
  declineButton: {
    backgroundColor: "#EF4444",
  },
  requestButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusAccepted: {
    backgroundColor: "#DCFCE7",
  },
  statusDeclined: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  youthCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  youthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  youthInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLargeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  youthName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  wellnessStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  wellnessStatusText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  chart: {
    borderRadius: 12,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#10B981",
  },
  analyticsButton: {
    backgroundColor: "#6366F1",
  },
  callButton: {
    backgroundColor: "#4A90E2",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  alertCountBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alertCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  alertCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  alertCardLast: {
    marginBottom: 0,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: "#94A3B8",
  },
  reportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: "#64748B",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
});