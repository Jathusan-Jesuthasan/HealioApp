import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
  FlatList,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import api from "../../config/api";
import { useActivity } from "../../context/ActivityContext";
import { showSyncedToast } from "../../utils/toastUtils";

export default function MeditationScreen() {
  const [seconds, setSeconds] = useState(300); // default 5 min
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState([]);
  const scale = useRef(new Animated.Value(1)).current;
  const { triggerRefresh } = useActivity();
  const userId = "demo_user"; // TODO: Replace with actual user from AuthContext

  /* ---------------- Timer Logic ---------------- */
  useEffect(() => {
    let timer;
    if (running && seconds > 0) {
      timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && running) {
      handleSaveSession();
      setRunning(false);
    }
    return () => clearInterval(timer);
  }, [running, seconds]);

  /* ---------------- Breathing Animation ---------------- */
  useEffect(() => {
    if (!running) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.25,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [running]);

  /* ---------------- Save Meditation ---------------- */
  const handleSaveSession = async () => {
    const durationMin = ((300 - seconds) / 60).toFixed(1);
    const now = new Date();
    const session = {
      id: Date.now().toString(),
      durationMin,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
    };

    const updated = [session, ...sessions];

    try {
      // 🧠 1️⃣ Save locally
      await AsyncStorage.setItem("meditationSessions", JSON.stringify(updated));
      setSessions(updated);

      // 🧘 2️⃣ Save to MongoDB
      console.log("📤 Sending meditation session:", {
        userId,
        duration: parseFloat(durationMin),
        moodBefore: "Neutral",
        moodAfter: "Relaxed",
        date: now,
      });

      await api.post("/api/meditations/add", {
        userId,
        duration: parseFloat(durationMin),
        moodBefore: "Neutral",
        moodAfter: "Relaxed",
        date: now,
      });

      // ✅ 3️⃣ UI Feedback + Dashboard Sync
      showSyncedToast("🧘 Meditation Synced to Dashboard!");
      triggerRefresh();

      // Reset
      setSeconds(300);
      setRunning(false);
    } catch (err) {
      console.error("❌ Meditation save error:", err);
      Alert.alert("⚠️ Error", "Could not save meditation session.");
    }
  };

  /* ---------------- Load Previous Sessions ---------------- */
  useEffect(() => {
    const loadSessions = async () => {
      const data = await AsyncStorage.getItem("meditationSessions");
      if (data) setSessions(JSON.parse(data));
    };
    loadSessions();
  }, []);

  const format = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#C7E8FF", "#E0F2FE", "#FFFFFF"]} style={styles.bg}>
        <Text style={styles.title}>🌿 Mindfulness Meditation</Text>

        {/* Breathing Circle */}
        <Animated.View style={[styles.circleWrap, { transform: [{ scale }] }]}>
          <View style={styles.circleInner}>
            <Text style={styles.timer}>{format(seconds)}</Text>
          </View>
        </Animated.View>

        {/* Control Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: running ? "#EF4444" : "#10B981" }]}
            onPress={() => {
              if (running) {
                handleSaveSession();
                setRunning(false);
              } else {
                setRunning(true);
              }
            }}
          >
            <Ionicons name={running ? "pause" : "play"} size={22} color="#fff" />
            <Text style={styles.btnText}>{running ? "Stop" : "Start"}</Text>
          </TouchableOpacity>

          {!running && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#3B82F6" }]}
              onPress={() => setSeconds(300)}
            >
              <Ionicons name="refresh" size={22} color="#fff" />
              <Text style={styles.btnText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* History */}
        {sessions.length > 0 && (
          <View style={styles.historyBox}>
            <Text style={styles.sectionTitle}>🕒 Past Meditation Sessions</Text>
            <FlatList
              data={sessions.slice(0, 8)}
              keyExtractor={(item, index) =>
                (item.id ? item.id.toString() : "session") + "-" + index
              }
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

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  bg: { flex: 1, alignItems: "center", paddingTop: 24, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#1E3A8A", marginBottom: 18 },
  circleWrap: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  circleInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  timer: { fontSize: 38, color: "#1E40AF", fontWeight: "900" },
  btnRow: { flexDirection: "row", marginTop: 20, gap: 14 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  historyBox: {
    width: "100%",
    marginTop: 35,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 10 },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sessionDate: { color: "#374151", fontSize: 14 },
  sessionDur: { color: "#10B981", fontWeight: "700" },
});
