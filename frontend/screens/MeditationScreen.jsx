// screens/MeditationScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Footer from "../components/BottomBar.jsx";
import { logActivity } from "../utils/logActivity.jsx";

export default function MeditationScreen() {
  const [seconds, setSeconds] = useState(360); // 6:00 to match the mock
  const [running, setRunning] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let t;
    if (running && seconds > 0) {
      t = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0) {
      logActivity("Meditation", 360);
    }
    return () => clearInterval(t);
  }, [running, seconds]);

  useEffect(() => {
    if (!running) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.25, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [running]);

  const format = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={["#A7F3D0", "#86EFAC"]} style={styles.bg}>
        <Text style={styles.title}>Mindfulness Meditation</Text>

        <Animated.View style={[styles.circleWrap, { transform: [{ scale }] }]}>
          <View style={styles.circleInner} />
        </Animated.View>

        <Text style={styles.timer}>{format(seconds)}</Text>

        <View style={{ marginTop: 14 }}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: running ? "#F59E0B" : "#111827" }]}
            onPress={() => setRunning((r) => !r)}
          >
            <Text style={styles.primaryText}>{running ? "Pause" : "Start"}</Text>
          </TouchableOpacity>
        </View>

        {/* next task card */}
        <View style={styles.nextCard}>
          <Text style={{ fontWeight: "700", color: "#111827" }}>First Session Meditation</Text>
          <Text style={{ color: "#6B7280", marginTop: 4 }}>15 min · ★ 4.5</Text>
        </View>
      </LinearGradient>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, alignItems: "center", paddingTop: 26, paddingHorizontal: 18 },
  title: { fontSize: 20, color: "#064E3B", fontWeight: "800", marginBottom: 12 },
  circleWrap: {
    width: 200, height: 200, borderRadius: 100, borderWidth: 6, borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.25)",
  },
  circleInner: { width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.55)" },
  timer: { fontSize: 34, color: "#065F46", fontWeight: "900", marginTop: 18 },
  primaryBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 14 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  nextCard: {
    marginTop: 22, backgroundColor: "#FFFFFF", width: "100%", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
});
