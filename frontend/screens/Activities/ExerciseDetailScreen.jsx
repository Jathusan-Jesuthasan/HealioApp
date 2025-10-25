// screens/ExerciseDetailScreen.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  FlatList,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../config/api";
import { showSyncedToast } from "../../utils/toastUtils";
import { useActivity } from "../../context/ActivityContext";

export default function ExerciseDetailScreen({ route, navigation }) {
  const exercise = route?.params?.exercise || { name: "Unknown Exercise" };

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [countdown, setCountdown] = useState(null); // Countdown state
  const { triggerRefresh } = useActivity();
  const scale = useRef(new Animated.Value(1)).current;
  const animationRef = useRef(null);
  const userId = "demo_user"; // later replace with AuthContext userId

  /* ---------- Exercise Info ---------- */
  const exerciseInfo = {
    "Push-ups": {
      instruction: "Keep your body straight. Lower and push back up smoothly.",
      animation: require("../../assets/lottie/pushup.json"),
    },
    Squats: {
      instruction: "Feet apart, sit back, keep your knees behind toes.",
      animation: require("../../assets/lottie/squat.json"),
    },
    Plank: {
      instruction: "Hold body straight, elbows below shoulders.",
      animation: require("../../assets/lottie/plank.json"),
    },
    "Jumping Jacks": {
      instruction: "Jump with legs apart, arms overhead, then back.",
      animation: require("../../assets/lottie/jumping.json"),
    },
  };

  const { instruction, animation } = exerciseInfo[exercise.name] || {};

  /* ---------- Timer ---------- */
  useEffect(() => {
    let t;
    if (running) t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  /* ---------- Countdown before start ---------- */
  const handleStart = () => setCountdown(3);

  useEffect(() => {
    let countdownInterval;
    if (countdown !== null) {
      if (countdown > 0) {
        countdownInterval = setTimeout(() => setCountdown(countdown - 1), 1000);
      } else {
        setCountdown(null);
        setRunning(true);
      }
    }
    return () => clearTimeout(countdownInterval);
  }, [countdown]);

  /* ---------- Animation ---------- */
  useEffect(() => {
    if (running) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
      animationRef.current?.play();
    } else {
      animationRef.current?.pause();
    }
  }, [running]);

  /* ---------- Save Session ---------- */
  const handleSaveSession = async () => {
    const durationMin = (seconds / 60).toFixed(1);
    const now = new Date();
    const session = {
      id: Date.now().toString(),
      name: exercise.name,
      durationMin,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
    };

    try {
      const old = (await AsyncStorage.getItem("exerciseSessions")) || "[]";
      const prev = JSON.parse(old);
      const updated = [session, ...prev];
      await AsyncStorage.setItem("exerciseSessions", JSON.stringify(updated));
      setSessions(updated);

      console.log("📤 Sending activity →", {
        userId,
        type: "Exercise",
        name: exercise.name,
        duration: parseFloat(durationMin),
        date: now,
        time: session.time,
      });

      const res = await api.post("/api/activities/add", {
        userId,
        type: "Exercise",
        name: exercise.name,
        duration: parseFloat(durationMin),
        date: now,
        time: session.time,
      });
      console.log("✅ Activity saved to Mongo:", res.data);

      showSyncedToast("💪 Activity Synced to Dashboard!");
      triggerRefresh();
    } catch (err) {
      console.error("❌ Exercise save error:", err.response?.data || err.message);
      Alert.alert("⚠️ Save Failed", "Could not save exercise session. Please retry.");
    }
  };

  /* ---------- Load Previous Sessions ---------- */
  useEffect(() => {
    const load = async () => {
      const data = await AsyncStorage.getItem("exerciseSessions");
      if (data) setSessions(JSON.parse(data));
    };
    load();
  }, []);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ---------- UI ---------- */
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#E0F2FE", "#F8FAFC"]} style={styles.bg}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.instruction}>{instruction || "Stay active and move!"}</Text>

        <Animated.View style={[styles.animationWrap, { transform: [{ scale }] }]}>
          {animation ? (
            <LottieView
              ref={animationRef}
              source={animation}
              autoPlay={false}
              loop
              style={styles.animation}
            />
          ) : (
            <View style={styles.noAnimBox}>
              <Text style={{ color: "#64748B" }}>🎬 No preview available</Text>
            </View>
          )}
        </Animated.View>

        {/* Timer / Countdown */}
        <Text style={styles.timer}>
          {countdown !== null ? countdown : formatTime(seconds)}
        </Text>

        {/* Controls */}
        <View style={styles.btnRow}>
          {!running && countdown === null ? (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#10B981" }]}
              onPress={handleStart}
            >
              <Ionicons name="play" size={22} color="#fff" />
              <Text style={styles.btnText}>Start</Text>
            </TouchableOpacity>
          ) : running ? (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#F59E0B" }]}
              onPress={() => setRunning(false)}
            >
              <Ionicons name="pause" size={22} color="#fff" />
              <Text style={styles.btnText}>Pause</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.btn, { backgroundColor: "#6B7280" }]}>
              <Text style={styles.btnText}>Get Ready...</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#3B82F6" }]}
            onPress={() => {
              setRunning(false);
              handleSaveSession();
              setSeconds(0);
            }}
          >
            <Ionicons name="stop" size={22} color="#fff" />
            <Text style={styles.btnText}>End</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        {sessions.length > 0 && (
          <View style={styles.historyBox}>
            <Text style={styles.sectionTitle}>📅 Past Sessions</Text>
            <FlatList
              data={sessions.filter((s) => s.name === exercise.name).slice(0, 8)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.sessionRow}>
                  <Text style={styles.sessionDate}>
                    {item.date} · {item.time}
                  </Text>
                  <Text style={styles.sessionDur}>{item.durationMin} min</Text>
                </View>
              )}
            />
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  bg: { flex: 1, alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "800", color: "#1E3A8A", marginBottom: 6 },
  instruction: { textAlign: "center", color: "#475569", marginBottom: 14 },
  animationWrap: { width: 250, height: 250, justifyContent: "center" },
  animation: { width: 220, height: 220 },
  noAnimBox: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  timer: { fontSize: 38, fontWeight: "bold", color: "#1E40AF", marginTop: 10 },
  btnRow: { flexDirection: "row", gap: 14, marginTop: 24 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  historyBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 30,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontWeight: "700", color: "#1E293B", marginBottom: 8 },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 1,
  },
  sessionDate: { color: "#374151", fontSize: 14 },
  sessionDur: { color: "#10B981", fontWeight: "700" },
});
