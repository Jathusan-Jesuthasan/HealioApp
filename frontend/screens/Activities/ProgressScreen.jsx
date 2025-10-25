import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-chart-kit";
import { GoalsContext } from "../../context/GoalsContext";
import { AuthContext } from "../../context/AuthContext";
import api from "../../config/api";

const LOG_KEY = "exerciseLogs";
const STREAK_KEY = "userStreak";

export default function ProgressScreen() {
  const { goals, saveGoals } = useContext(GoalsContext);
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const userId = useMemo(() => {
    const candidate = user?.id || user?._id || user?.uid;
    return candidate || "demo_user";
  }, [user]);

  useEffect(() => {
    const fetchFromBackend = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const [goalRes, medRes] = await Promise.all([
          api.get(`/api/goals/${userId}`),
          api.get(`/api/meditations/${userId}`),
        ]);

        if (goalRes.data && Object.keys(goalRes.data).length) {
          const backendGoals = {
            sessionsPerWeek: Number(goalRes.data.sessionsPerWeek) || 0,
            minutesPerDay: Number(goalRes.data.minutesPerDay) || 0,
            updatedAt: goalRes.data.updatedAt
              ? new Date(goalRes.data.updatedAt).getTime()
              : 0,
          };

          const localUpdatedAt = Number(goals?.updatedAt) || 0;
          if (backendGoals.updatedAt >= localUpdatedAt) {
            await saveGoals(backendGoals, { skipStorage: true });
          } else {
            console.log("ℹ️ Skipped backend goals sync (local newer):", {
              backend: backendGoals,
              local: goals,
            });
          }
        }

        if (medRes.data?.length) {
          const formatted = medRes.data.map((m) => ({
            ts: new Date(m.createdAt).getTime(),
            duration: m.duration || 0,
          }));
          await AsyncStorage.setItem(LOG_KEY, JSON.stringify(formatted));
          setLogs(formatted);
          calculateAndSaveStreak(formatted);
        } else {
          const offlineLogs = await AsyncStorage.getItem(LOG_KEY);
          setLogs(offlineLogs ? JSON.parse(offlineLogs) : []);
        }
      } catch (err) {
        console.log("⚠️ Backend fetch failed:", err.message);
        const offlineLogs = await AsyncStorage.getItem(LOG_KEY);
        setLogs(offlineLogs ? JSON.parse(offlineLogs) : []);
      } finally {
        setLoading(false);
      }
    };
    fetchFromBackend();
  }, [userId, saveGoals]);

  const calculateAndSaveStreak = async (logList) => {
    if (!logList.length) {
      setStreak(0);
      await AsyncStorage.setItem(STREAK_KEY, "0");
      return;
    }

    const dates = [
      ...new Set(logList.map((l) => new Date(l.ts).toDateString())),
    ]
      .map((d) => new Date(d))
      .sort((a, b) => b - a);

    let currentStreak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const diffDays = (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) currentStreak++;
      else break;
    }

    setStreak(currentStreak);
    await AsyncStorage.setItem(STREAK_KEY, currentStreak.toString());
  };

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });

  const counts = last7Days.map(
    (day) => logs.filter((l) => new Date(l.ts).toDateString() === day).length
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ marginTop: 10, color: "#555" }}>Loading progress...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>📈 Your Progress</Text>

        {/* Goal Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Your Goals</Text>
          <View style={styles.cardRow}>
            <View style={styles.goalBox}>
              <Text style={styles.goalLabel}>Weekly Sessions</Text>
              <Text style={styles.goalValue}>{goals.sessionsPerWeek}</Text>
            </View>
            <View style={styles.goalBox}>
              <Text style={styles.goalLabel}>Daily Minutes</Text>
              <Text style={styles.goalValue}>{goals.minutesPerDay}</Text>
            </View>
          </View>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <Text style={styles.streakText}>🔥 {streak}-Day Streak</Text>
          <Text style={styles.streakSubtext}>
            Keep your consistency going strong!
          </Text>
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>📊 Weekly Activity</Text>
          <LineChart
            data={{
              labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              datasets: [{ data: counts }],
            }}
            width={Dimensions.get("window").width - 40}
            height={230}
            fromZero
            yAxisLabel=""
            chartConfig={{
              backgroundGradientFrom: "#E8F1FC",
              backgroundGradientTo: "#C8E1FA",
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              labelColor: () => "#555",
              decimalPlaces: 0,
              style: { borderRadius: 16 },
              propsForDots: {
                r: "5",
                strokeWidth: "2",
                stroke: "#2196F3",
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginVertical: 15,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  goalBox: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 5,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  goalLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  goalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2563EB",
  },
  streakCard: {
    backgroundColor: "#FFEDD5",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  streakText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FB923C",
  },
  streakSubtext: {
    color: "#78350F",
    fontSize: 14,
    marginTop: 5,
  },
  chartCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: 25,
  },
  chart: {
    borderRadius: 16,
    marginTop: 10,
  },
});
