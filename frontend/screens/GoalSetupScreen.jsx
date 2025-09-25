import React, { useContext, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { GoalsContext } from "../context/GoalsContext.jsx";

export default function GoalSetupScreen({ navigation }) {
  const { goals, saveGoals } = useContext(GoalsContext);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(String(goals.sessionsPerWeek));
  const [minutesPerDay, setMinutesPerDay] = useState(String(goals.minutesPerDay));

  const handleSave = async () => {
    await saveGoals({
      sessionsPerWeek: parseInt(sessionsPerWeek),
      minutesPerDay: parseInt(minutesPerDay),
    });
    navigation.goBack(); // Go back after saving
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🎯 Set Your Goals</Text>

      <Text style={styles.label}>Workouts per week</Text>
      <TextInput
        value={sessionsPerWeek}
        onChangeText={setSessionsPerWeek}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Minutes per day</Text>
      <TextInput
        value={minutesPerDay}
        onChangeText={setMinutesPerDay}
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Goals ✅</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },
  label: { marginTop: 10, fontSize: 16, color: "#444" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#4B9CD3",
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
