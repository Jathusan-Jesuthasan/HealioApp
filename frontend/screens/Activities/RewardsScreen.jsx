import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../config/api";

export default function RewardsScreen() {
  const [rewards, setRewards] = useState(null);
  const [dailyCelebrate, setDailyCelebrate] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const userId = "demo_user";

  // ✅ Fetch rewards and trigger celebration
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/api/rewards/${userId}`);
        setRewards(res.data);
        animateProgress(res.data.xp % 1000);
        setTimeout(checkDailyCelebration, 800);
      } catch (err) {
        console.error("Rewards fetch error:", err);
      }
    };
    fetchData();
  }, []);

  // 🎉 Daily celebration logic
  const checkDailyCelebration = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const lastCelebration = await AsyncStorage.getItem("lastCelebrateDate");

      if (lastCelebration !== today) {
        setDailyCelebrate(true);
        playGlowAnimation();
        await AsyncStorage.setItem("lastCelebrateDate", today);
        Alert.alert("🎉 Welcome Back!", "Keep your streak alive today 💪");
        setTimeout(() => setDailyCelebrate(false), 4000);
      }
    } catch (err) {
      console.error("Daily celebration error:", err);
    }
  };

  // 🌈 XP bar animation
  const animateProgress = (xpValue) => {
    const target = Math.min((xpValue / 1000) * 100, 100);
    Animated.timing(progressAnim, {
      toValue: target,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  };

  // 💫 Glow animation
  const playGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  // 🔁 Refresh data
  const handleRefresh = async () => {
    try {
      const res = await api.get(`/api/rewards/${userId}`);
      setRewards(res.data);
      animateProgress(res.data.xp % 1000);
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  // 🧮 Format numbers to 2 digits
  const formatNum = (value) => {
    if (value === null || value === undefined) return "0.00";
    const num = parseFloat(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // 🎨 Tier styles
  const getBadgeStyle = (tier) => {
    switch (tier) {
      case "Bronze":
        return ["#FDE68A", "#F59E0B"];
      case "Silver":
        return ["#E5E7EB", "#9CA3AF"];
      case "Gold":
        return ["#FACC15", "#CA8A04"];
      case "Platinum":
        return ["#93C5FD", "#1E3A8A"];
      default:
        return ["#C7E8FF", "#4A90E2"];
    }
  };

  const getBadgeEmoji = (tier) => {
    switch (tier) {
      case "Bronze":
        return "🥉";
      case "Silver":
        return "🥈";
      case "Gold":
        return "🥇";
      case "Platinum":
        return "💎";
      default:
        return "🎖️";
    }
  };

  if (!rewards)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ color: "#4A90E2", marginTop: 8 }}>Loading rewards...</Text>
      </View>
    );

  return (
    <LinearGradient colors={["#E0F2FE", "#FFFFFF"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>🏆 Your Achievements</Text>
        <Text style={styles.subtitle}>Welcome back! Let’s keep your streak strong 💪</Text>

        {/* 🏅 Badge Section */}
        <Animated.View
          style={[
            styles.glowWrapper,
            {
              shadowColor: "#10B981",
              shadowOpacity: glowAnim,
              shadowRadius: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 25],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={getBadgeStyle(rewards.badge)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badgeCard}
          >
            <Text style={styles.badgeEmoji}>{getBadgeEmoji(rewards.badge)}</Text>
            <Text style={styles.badgeText}>{rewards.badge} Tier</Text>
          </LinearGradient>

          {dailyCelebrate && (
            <LottieView
              source={require("../../assets/lottie/confetti.json")}
              autoPlay
              loop={false}
              style={styles.lottie}
            />
          )}
        </Animated.View>

        {/* 📊 Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="timer-outline" color="#3B82F6" label="Minutes" value={formatNum(rewards.totalMinutes)} />
          <StatCard icon="fitness-outline" color="#10B981" label="Sessions" value={formatNum(rewards.totalSessions)} />
          <StatCard icon="flame-outline" color="#F97316" label="Streak" value={`${formatNum(rewards.streakDays)} days`} />
          <StatCard icon="star-outline" color="#8B5CF6" label="XP" value={formatNum(rewards.xp)} />
        </View>

        {/* 🔄 Refresh Button */}
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.refreshText}>Refresh Rewards</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

/* --- Stat Card --- */
const StatCard = ({ icon, color, label, value }) => (
  <View style={[styles.card, { backgroundColor: "#fff" }]}>
    <Ionicons name={icon} size={26} color={color} />
    <Text style={[styles.label, { color }]}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

/* --- Styles --- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 26, fontWeight: "800", color: "#1E3A8A", marginBottom: 6 },
  subtitle: { color: "#475569", marginBottom: 20, fontSize: 14 },
  glowWrapper: { alignItems: "center", marginBottom: 20 },
  badgeCard: {
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 35,
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeEmoji: { fontSize: 56 },
  badgeText: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 8 },
  lottie: { position: "absolute", top: -40, width: 300, height: 300 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "47%",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  value: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 2 },
  refreshBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    borderRadius: 30,
    paddingVertical: 12,
    marginTop: 30,
  },
  refreshText: { color: "#fff", fontWeight: "700", marginLeft: 8, fontSize: 16 },
});
