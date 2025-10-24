import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Pressable,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/* ───────────────  CARD COMPONENT  ─────────────── */
function HubCard({ icon, title, onPress }) {
  const [highlighted, setHighlighted] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (v) =>
    Animated.spring(scale, {
      toValue: v,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();

  const onIn = () => {
    setHighlighted(true);
    animateTo(1.05);
  };
  const onOut = () => {
    setHighlighted(false);
    animateTo(1);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onIn}
      onPressOut={onOut}
      {...(Platform.OS === "web"
        ? { onHoverIn: onIn, onHoverOut: onOut }
        : {})}
      android_ripple={{ color: "rgba(59,130,246,0.08)", borderless: false }}
      style={({ pressed }) => [
        styles.card,
        (pressed || highlighted) && styles.cardActive,
      ]}
    >
      <Animated.View style={[styles.cardContent, { transform: [{ scale }] }]}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

/* ───────────────  MAIN SCREEN  ─────────────── */
export default function ActivityScreen({ navigation }) {
  const activities = [
    {
      key: "Meditation",
      icon: "🧘‍♀️",
      title: "Meditation",
      go: () => navigation.navigate("Meditation"),
    },
    {
      key: "Journaling",
      icon: "📓",
      title: "Journaling",
      go: () => navigation.navigate("Journal"),
    },
    {
      key: "Exercise",
      icon: "💪",
      title: "Exercise",
      go: () => navigation.navigate("ExerciseList"),
    },
    {
      key: "Music",
      icon: "🎵",
      title: "Music Therapy",
      go: () => navigation.navigate("Music"),
    },
  ];

  const tools = [
    {
      key: "GoalSetup",
      icon: "🎯",
      title: "Set Goals",
      go: () => navigation.navigate("GoalSetup"),
    },
    
    {
      key: "Progress",
      icon: "📊",
      title: "Progress",
      go: () => navigation.navigate("Progress"),
    },
    {
      key: "Rewards",
      icon: "🏆",
      title: "Rewards",
      go: () => navigation.navigate("Rewards"),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#f0f7ff", "#f8fafc"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerWrap}>
            <Text style={styles.headerEmoji}>🌿</Text>
            <Text style={styles.headerTitle}>Your Wellness Hub</Text>
            <Text style={styles.headerSubtitle}>
              Explore activities & tools to lift your mood
            </Text>
          </View>

          {/* Activities Section */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Activities</Text>
            <View style={styles.grid}>
              {activities.map((a) => (
                <View key={a.key} style={styles.cell}>
                  <HubCard icon={a.icon} title={a.title} onPress={a.go} />
                </View>
              ))}
            </View>
          </View>

          {/* Tools Section */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Tools & Goals</Text>
            <View style={styles.grid}>
              {tools.map((t) => (
                <View key={t.key} style={styles.cell}>
                  <HubCard icon={t.icon} title={t.title} onPress={t.go} />
                </View>
              ))}
            </View>
          </View>

          {/* Footer spacing */}
          <View style={{ height: 80 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ───────────────  STYLES  ─────────────── */
const GAP = 14;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 60,
    gap: 20,
  },

  /* Header Section */
  headerWrap: {
    alignItems: "center",
    marginBottom: 6,
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },

  /* Section Containers */
  block: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  blockTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -GAP / 2,
  },
  cell: {
    width: "50%",
    paddingHorizontal: GAP / 2,
    marginBottom: GAP,
  },

  /* Cards */
  card: {
    height: 115,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardActive: {
    borderColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardIcon: {
    fontSize: 34,
    textAlign: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
});
