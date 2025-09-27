import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  Dimensions,
  RefreshControl,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import Card from "../components/Card";
import ProgressBarCustom from "../components/ProgressBarCustom";
import { Colors } from "../utils/Colors";
import { getDashboard } from "../services/analytics";

const screenWidth = Math.min(Dimensions.get("window").width - 48, 720);

// Helper for risk labels
const getRiskLevel = (score) => {
  if (score >= 70) return { label: "Stable", color: Colors.stable };
  if (score >= 50) return { label: "Mild Concern", color: Colors.warning };
  return { label: "High Risk", color: Colors.danger };
};

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Backend data
  const [mindBalanceScore, setMindBalanceScore] = useState(0);
  const [progressMilestone, setProgressMilestone] = useState(0);
  const [weeklyMoods, setWeeklyMoods] = useState([]);
  const [aiRiskDetected, setAiRiskDetected] = useState(false);

  const risk = useMemo(() => getRiskLevel(mindBalanceScore), [mindBalanceScore]);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const data = await getDashboard("7d");

      setMindBalanceScore(Math.round(data?.mindBalanceScore ?? 0));
      setProgressMilestone(Math.max(0, Math.min(1, data?.progressMilestone ?? 0)));
      setWeeklyMoods(Array.isArray(data?.weeklyMoods) ? data.weeklyMoods : []);
      setAiRiskDetected(!!data?.aiRiskDetected);
    } catch (e) {
      console.error("Dashboard load failed:", e);
      setError(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.secondary}
        />
      }
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loading}>Preparing your insights…</Text>
        </View>
      ) : error ? (
        <Card>
          <Text style={[styles.title, { color: Colors.danger }]}>
            Couldn’t load dashboard
          </Text>
          <Text style={styles.description}>{String(error)}</Text>
          <Text onPress={onRefresh} style={[styles.link]}>
            Tap to retry
          </Text>
        </Card>
      ) : (
        <>
          {/* Mind Balance Score */}
          <Card>
            <Text style={styles.title}>⚖️ Mind Balance Score</Text>
            <Text style={styles.score}>{mindBalanceScore}/100</Text>
            <Text style={[styles.status, { color: risk.color }]}>{risk.label}</Text>
          </Card>

          {/* Wellness Progress */}
          <Card>
            <Text style={styles.title}>📈 Wellness Progress</Text>
            <Text style={styles.description}>
              {Math.round(progressMilestone * 100)}% more positive moods compared
              to last month
            </Text>
            <ProgressBarCustom progress={progressMilestone} showLabel />
          </Card>

          {/* Weekly Mood Trend */}
          <Card>
            <Text style={styles.title}>📅 Weekly Mood Trend</Text>
            <LineChart
              data={{
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                datasets: [
                  {
                    data: weeklyMoods.length ? weeklyMoods : [0, 0, 0, 0, 0, 0, 0],
                  },
                ],
              }}
              width={screenWidth}
              height={220}
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: Colors.card,
                backgroundGradientFrom: Colors.card,
                backgroundGradientTo: Colors.card,
                decimalPlaces: 0,
                color: () => Colors.secondary,
                labelColor: () => Colors.textSecondary,
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: Colors.secondary,
                },
                propsForBackgroundLines: {
                  strokeDasharray: "",
                  stroke: Colors.border,
                },
              }}
              bezier
              style={styles.chart}
            />
            {!weeklyMoods.length && (
              <Text style={[styles.description, { marginTop: 6 }]}>
                No logs this week yet. Start logging to see your trend.
              </Text>
            )}
          </Card>

          {/* AI Risk Detection */}
          <Card>
            <TouchableOpacity onPress={() => navigation.navigate("RiskDetail")}>
              <Text style={styles.title}>🤖 AI-Powered Risk Detection</Text>
              <Text
                style={[
                  styles.description,
                  {
                    color: aiRiskDetected ? Colors.danger : Colors.stable,
                    fontWeight: "600",
                  },
                ]}
              >
                {aiRiskDetected
                  ? "⚠️ Risk Detected! Take Care"
                  : "✅ No risks detected"}
              </Text>
              <Text style={[styles.link, { marginTop: 4 }]}>View Details</Text>
            </TouchableOpacity>
          </Card>

          {/* Trusted Notifications */}
          <Card>
            <Text style={styles.title}>👨‍👩‍👧 Trusted Person Notification</Text>
            <Text style={styles.description}>
              Notifications are sent to your trusted person when risks are detected.
            </Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 6, color: Colors.textPrimary },
  score: { fontSize: 36, fontWeight: "700", color: Colors.secondary, marginBottom: 6 },
  status: { fontSize: 16, fontWeight: "500" },
  description: { fontSize: 15, color: Colors.textSecondary, lineHeight: 20 },
  chart: { marginVertical: 8, borderRadius: 12 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  loading: { marginTop: 12, color: Colors.textSecondary },
  link: { marginTop: 8, color: Colors.secondary, fontWeight: "600" },
});
