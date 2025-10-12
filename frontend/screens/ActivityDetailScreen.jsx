import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import Header from "../components/HeaderBar.jsx";
//import Footer from "../components/BottomBar.jsx";
import { logActivity } from "../utils/logActivity.jsx";

export default function ActivityDetailScreen({ route, navigation }) {
  const { activity } = route.params; // "Meditation" | "Journaling" | "Exercise" | "Music" | ...
  const [started, setStarted] = useState(false);

  // Meditation state
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Journaling state
  const [journalText, setJournalText] = useState("");

  // ---------- Meditation: countdown ----------
  useEffect(() => {
    if (activity !== "Meditation") return;

    let timer;
    if (started && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    // When finished, log once
    if (timeLeft === 0) {
      logActivity("Meditation", "Meditation Session", 5, "demo_user"); // 5 minutes duration
    }
    return () => clearInterval(timer);
  }, [started, timeLeft, activity]);

  // ---------- Meditation: breathing animation ----------
  useEffect(() => {
    if (!started || activity !== "Meditation") return;

    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loopAnim.start();

    return () => loopAnim.stop();
  }, [started, activity, scaleAnim]);

  // ---------- Handlers ----------
  const handleStart = () => setStarted(true);

  const handleStop = () => {
    setStarted(false);
    // Log generic activity end if not meditation (meditation logs on finish)
    if (activity !== "Meditation") {
      logActivity(activity, activity + " Session", 1, "demo_user"); // 1 minute default duration
    }
  };

  const handleSaveJournal = () => {
    if (journalText.trim() === "") {
      Alert.alert("Please write something before saving.");
      return;
    }
    Alert.alert("Journal Saved ✅");
    logActivity("Journal", "Journal Entry", Math.ceil(journalText.length / 50), "demo_user"); // Estimate duration based on text length
    setJournalText("");
    setStarted(false);
  };

  // ---------- Helpers ----------
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ---------- UI ----------
  const renderMeditation = () => {
    if (!started) {
      return (
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>Start Meditation 🧘‍♂️</Text>
        </TouchableOpacity>
      );
    }

    if (timeLeft > 0) {
      return (
        <View style={styles.animationContainer}>
          <Animated.View
            style={[styles.circle, { transform: [{ scale: scaleAnim }] }]}
          />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          <Text style={styles.instructionText}>Breathe with the circle</Text>

          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return <Text style={styles.doneText}>Meditation Completed ✅</Text>;
  };

  const renderJournaling = () => (
    <View style={styles.journalContainer}>
      {!started ? (
        <TouchableOpacity style={styles.button} onPress={() => setStarted(true)}>
          <Text style={styles.buttonText}>Start Journaling ✍️</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            style={styles.journalInput}
            placeholder="Write your thoughts here..."
            multiline
            value={journalText}
            onChangeText={setJournalText}
          />
          <View style={styles.journalActions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveJournal}>
              <Text style={styles.saveButtonText}>Save Journal ✅</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleStop}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  const renderGeneric = () => (
    <>
      {!started ? (
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>Start {activity} ▶️</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.genericText}>{activity} in progress…</Text>
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        </>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {activity !== "Music" && (
  <Header title={activity} navigation={navigation} showBack={true} />
)}
      <ScrollView contentContainerStyle={styles.content}>
        {activity === "Meditation"
          ? renderMeditation()
          : activity === "Journaling"
          ? renderJournaling()
          : renderGeneric()}
      </ScrollView>

     {/* <Footer /> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Buttons
  button: {
    backgroundColor: "#4B9CD3",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontSize: 18, textAlign: "center" },

  // Meditation
  animationContainer: { justifyContent: "center", alignItems: "center" },
  circle: {
    width: 160,
    height: 160,
    backgroundColor: "#4B9CD3",
    borderRadius: 80,
    marginBottom: 20,
  },
  timerText: { fontSize: 28, fontWeight: "bold", marginBottom: 10 },
  instructionText: { fontSize: 16, color: "#555", marginBottom: 15 },

  // Stop / Complete
  stopButton: {
    backgroundColor: "#FF5C5C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  stopButtonText: { color: "#fff", fontSize: 16 },
  doneText: { fontSize: 22, color: "green", fontWeight: "bold" },

  // Journaling
  journalContainer: { width: "100%", marginTop: 10 },
  journalInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    minHeight: 150,
    textAlignVertical: "top",
    marginTop: 12,
    backgroundColor: "#fff",
  },
  journalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    justifyContent: "space-between",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#4B9CD3",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelButton: {
    width: 120,
    backgroundColor: "#e5e7eb",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: { color: "#111827", fontSize: 16, fontWeight: "600" },

  // Generic
  genericText: { fontSize: 18, color: "#333", marginBottom: 16 },
});
