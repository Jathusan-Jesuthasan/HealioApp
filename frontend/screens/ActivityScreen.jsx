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
  FlatList,
} from "react-native";
import Header from "../components/HeaderBar.jsx";
import Footer from "../components/BottomBar.jsx";

function HubCard({ icon, title, onPress }) {
  const [highlighted, setHighlighted] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (v) =>
    Animated.spring(scale, {
      toValue: v,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();

  const onIn = () => {
    setHighlighted(true);
    animateTo(1.02);
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
      style={({ pressed }) => [
        styles.card,
        (pressed || highlighted) && styles.cardActive,
      ]}
      android_ripple={{ color: "rgba(59,130,246,0.08)", borderless: false }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function ActivityScreen({ navigation }) {
  const activities = [
    { key: "Meditation", icon: "🧘", title: "Meditation", go: () => navigation.navigate("Meditation") },
    { key: "Journaling", icon: "📓", title: "Journaling", go: () => navigation.navigate("Journal") },
    { key: "Exercise", icon: "💪", title: "Exercise", go: () => navigation.navigate("ExerciseList") },
    { key: "Music", icon: "🎵", title: "Music", go: () => navigation.navigate("ActivityDetail", { activity: "Music" }) },
  ];

  const tools = [
    { key: "GoalSetup", icon: "🎯", title: "Goal Setup", go: () => navigation.navigate("GoalSetup") },
    { key: "Progress", icon: "📊", title: "Progress", go: () => navigation.navigate("Progress") },
    { key: "Rewards", icon: "🏆", title: "Rewards", go: () => navigation.navigate("Rewards") },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <Header title="Activity Hub" />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Activities Block */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Activities</Text>
            <Text style={styles.blockSub}>
              
            </Text>

            <View style={styles.grid}>
              {activities.map((a) => (
                <View key={a.key} style={styles.cell}>
                  <HubCard icon={a.icon} title={a.title} onPress={a.go} />
                </View>
              ))}
              {activities.length % 2 !== 0 && <View style={styles.cell} />}
            </View>
          </View>

          {/* Tools & Goals Block */}
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Tools & Goals</Text>
            <Text style={styles.blockSub}>
             
            </Text>

            <FlatList
              data={tools}
              keyExtractor={(i) => i.key}
              renderItem={({ item }) => (
                <View style={{ width: 140, marginRight: 12 }}>
                  <HubCard
                    icon={item.icon}
                    title={item.title}
                    onPress={item.go}
                  />
                </View>
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
          </View>
        </ScrollView>

        <Footer />
      </View>
    </SafeAreaView>
  );
}

const GAP = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fbfcf8ff" },
  wrap: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 96,
    gap: 16,
  },

  block: {
    backgroundColor: "rgba(205, 211, 214, 1)",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  blockSub: {
    marginTop: 4,
    marginBottom: 12,
    color: "#6B7280",
    fontSize: 13,
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

  card: {
    height: 110,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardActive: {
    borderColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  cardIcon: { fontSize: 28, textAlign: "center", marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1F2937", textAlign: "center" },
});
