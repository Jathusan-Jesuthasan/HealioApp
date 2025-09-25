import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, ScrollView, SafeAreaView, Platform, StatusBar } from "react-native";
import { logActivity } from "../utils/logActivity.jsx";

export default function ExerciseDetailScreen({ route }) {
  const { exercise } = route.params;
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = timeLeft > 0 && setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    if (timeLeft === 0) {
      logActivity(exercise.name, exercise.duration);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  const instructions = {
    "Push-ups": "Place hands shoulder-width apart. Lower your body and push back up.",
    Squats: "Stand with feet shoulder-width. Lower down and rise back up.",
    Plank: "Hold your body straight on elbows and toes.",
    "Jumping Jacks": "Jump with legs apart, arms overhead, then back together.",
  };

  const reps = {
    "Push-ups": 15,
    Squats: 20,
    Plank: "30 sec",
    "Jumping Jacks": 30,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.instruction}>{instructions[exercise.name]}</Text>
        <Text style={styles.reps}>Reps/Time: {reps[exercise.name]}</Text>
        <Text style={styles.timer}>Timer: {timeLeft}s</Text>
        <View style={styles.buttonContainer}>
          <Button title="Restart Timer" onPress={() => setTimeLeft(30)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  instruction: { fontSize: 18, textAlign: "center", marginBottom: 20 },
  reps: { fontSize: 16, marginBottom: 20 },
  timer: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  buttonContainer: { width: "80%" },
});
