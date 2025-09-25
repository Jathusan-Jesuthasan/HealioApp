import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, Dimensions, SafeAreaView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-chart-kit";
import { GoalsContext } from "../context/GoalsContext.jsx";

const LOG_KEY = "exerciseLogs";
const STREAK_KEY = "userStreak";

export default function ProgressScreen() {
  const { goals } = useContext(GoalsContext);
  const [logs, setLogs] = useState([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      const rawLogs = await AsyncStorage.getItem(LOG_KEY);
      const parsedLogs = rawLogs ? JSON.parse(rawLogs) : [];
      setLogs(parsedLogs);

      // Load saved streak
      const savedStreak = await AsyncStorage.getItem(STREAK_KEY);
      if (savedStreak) {
        setStreak(parseInt(savedStreak));
      }

      // Recalculate based on logs
      calculateAndSaveStreak(parsedLogs);
    })();
  }, []);

  // Generate last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });

  const counts = last7Days.map(
    (day) => logs.filter((l) => new Date(l.ts).toDateString() === day).length
  );

  // 🔥 Calculate and persist streak
  const calculateAndSaveStreak = async (logList) => {
    if (!logList.length) {
      setStreak(0);
      await AsyncStorage.setItem(STREAK_KEY, "0");
      return;
    }

    // Extract unique activity dates
    const dates = [...new Set(logList.map((l) => new Date(l.ts).toDateString()))]
      .map((d) => new Date(d))
      .sort((a, b) => b - a); // sort descending

    let currentStreak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const diffDays = Math.floor(
        (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break; // streak broken
      }
    }

    setStreak(currentStreak);
    await AsyncStorage.setItem(STREAK_KEY, currentStreak.toString());
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📊 Your Progress</Text>

      <Text style={styles.goalText}>
        Weekly Goal: {goals.sessionsPerWeek} sessions
      </Text>
      <Text style={styles.goalText}>
        Daily Goal: {goals.minutesPerDay} minutes
      </Text>

      {/* 🔥 Streak counter */}
      <Text style={styles.streakText}>🔥 {streak}-day streak</Text>

      <LineChart
        data={{
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [{ data: counts }],
        }}
        width={Dimensions.get("window").width - 20}
        height={220}
        fromZero
        yAxisLabel=""
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          color: () => "#4B9CD3",
          labelColor: () => "#333",
        }}
        style={{ marginTop: 20, borderRadius: 10 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  goalText: { fontSize: 16, marginBottom: 5, color: "#555" },
  streakText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF5722",
    marginTop: 15,
    marginBottom: 5,
  },
});
