// /screens/DashboardScreen.jsx
import React from "react";
import { ScrollView, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import Card from "../components/Card";
import ProgressBarCustom from "../components/ProgressBarCustom";
import { Colors } from "../utils/Colors";

const screenWidth = Dimensions.get("window").width - 48; // account for padding + card spacing

const DashboardScreen = () => {
  // Dummy data (replace later with DB/API)
  const mindBalanceScore = 72;
  const progressMilestone = 0.2; // 20%
  const weeklyMoods = [3, 4, 2, 5, 4, 3, 4]; // scale 1–5
  const aiRiskDetected = false;

  // Risk level based on score (simple rule)
  const getRiskLevel = (score) => {
    if (score >= 70) return { label: "Stable", color: Colors.stable };
    if (score >= 50) return { label: "Mild Concern", color: Colors.warning };
    return { label: "High Risk", color: Colors.danger };
  };

  const risk = getRiskLevel(mindBalanceScore);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>🩺 Healio Dashboard</Text>
      <Text style={styles.subHeader}>
        Your personalized mental wellness insights
      </Text>

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
          {Math.round(progressMilestone * 100)}% more positive moods compared to
          last month
        </Text>
        <ProgressBarCustom progress={progressMilestone} showLabel />
      </Card>

      {/* Weekly Mood Trend */}
      <Card>
        <Text style={styles.title}>📅 Weekly Mood Trend</Text>
        <LineChart
          data={{
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{ data: weeklyMoods }],
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
              strokeDasharray: "", // solid lines
              stroke: Colors.border,
            },
          }}
          style={styles.chart}
        />
      </Card>

      {/* AI Risk Detection */}
      <Card>
        <Text style={styles.title}>🤖 AI-Powered Risk Detection</Text>
        <Text
          style={[
            styles.description,
            { color: aiRiskDetected ? Colors.danger : Colors.stable },
          ]}
        >
          {aiRiskDetected
            ? "⚠️ Risk Detected! Take Care"
            : "✅ No risks detected"}
        </Text>
      </Card>

      {/* Trusted Notifications */}
      <Card>
        <Text style={styles.title}>👨‍👩‍👧 Trusted Person Notification</Text>
        <Text style={styles.description}>
          Notifications will be sent to your trusted person if risks are
          detected.
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
    color: Colors.secondary,
  },
  subHeader: {
    fontSize: 14,
    textAlign: "center",
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    color: Colors.textPrimary,
  },
  score: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: 6,
  },
  status: {
    fontSize: 16,
    fontWeight: "500",
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
});

export default DashboardScreen;
