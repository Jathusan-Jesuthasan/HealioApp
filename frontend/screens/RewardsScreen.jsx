// screens/RewardsScreen.jsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Footer from "../components/BottomBar.jsx";

export default function RewardsScreen() {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    (async () => {
      const logsJson = await AsyncStorage.getItem("exerciseLogs");
      const streakStr = await AsyncStorage.getItem("userStreak");
      const logs = logsJson ? JSON.parse(logsJson) : [];
      const streak = streakStr ? parseInt(streakStr, 10) : 0;

      const unlocked = [];

      // Basic badges
      if (logs.length > 0) unlocked.push("✅ First Activity");
      if (streak >= 3) unlocked.push("🔥 3-Day Streak");

      // Weekly goal: 5 logs this week (Mon–Sun)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      const day = startOfWeek.getDay(); // 0 Sun ... 6 Sat
      const diffToMonday = (day + 6) % 7;
      startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      const thisWeekCount = logs.filter((log) => {
        const ts = log.ts ?? log.date ?? log.timestamp ?? Date.now();
        const d = new Date(ts);
        return d >= startOfWeek && d < endOfWeek;
      }).length;

      if (thisWeekCount >= 5) unlocked.push("🏆 Weekly Goal Achieved");

      setBadges(unlocked);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <Text style={styles.title}>🏆 Your Rewards</Text>

        {badges.length > 0 ? (
          <FlatList
            data={badges}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }) => (
              <View style={styles.badgeCard}>
                <Text style={styles.badgeText}>{item}</Text>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noBadges}>No badges yet. Keep going! 🚀</Text>
        )}
      </View>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FF" },
  wrap: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 16, color: "#111827" },
  badgeCard: {
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#E0F2FE",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  badgeText: { fontSize: 16, fontWeight: "700", color: "#1D4ED8" },
  noBadges: { fontSize: 16, color: "#6B7280", marginTop: 8 },
});
