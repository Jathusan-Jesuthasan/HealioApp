import React, { useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { GoalsContext } from "../../context/GoalsContext.jsx";
import { AuthContext } from "../../context/AuthContext.js";
import api from "../../config/api.js";

export default function GoalSetupScreen({ navigation }) {
  const { goals, saveGoals } = useContext(GoalsContext);
  const { user } = useContext(AuthContext);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(
    String(goals.sessionsPerWeek)
  );
  const [minutesPerDay, setMinutesPerDay] = useState(
    String(goals.minutesPerDay)
  );

  const userId = useMemo(() => {
    const candidate = user?.id || user?._id || user?.uid;
    return candidate || "demo_user";
  }, [user]);

  const handleSave = async () => {
    const newGoals = {
      sessionsPerWeek: parseInt(sessionsPerWeek) || 0,
      minutesPerDay: parseInt(minutesPerDay) || 0,
    };

    try {
      // ✅ Persist to backend (MongoDB) and rely on the canonical response
      const { data } = await api.post("/api/goals/add", { userId, ...newGoals });

      const backendSessions = Number(data?.sessionsPerWeek);
      const backendMinutes = Number(data?.minutesPerDay);

      const persistedGoals = {
        sessionsPerWeek: Number.isFinite(backendSessions)
          ? backendSessions
          : newGoals.sessionsPerWeek,
        minutesPerDay: Number.isFinite(backendMinutes)
          ? backendMinutes
          : newGoals.minutesPerDay,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt).getTime() : Date.now(),
      };

      // ✅ Save locally (AsyncStorage + context)
      await saveGoals(persistedGoals);

      Alert.alert("✅ Saved", "Your new goals have been updated!");
      navigation.goBack();
    } catch (err) {
      console.error("Goal save error:", err);
      Alert.alert("⚠️ Error", "Failed to save goals. Check your connection.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111827",
  },
  label: { marginTop: 10, fontSize: 16, color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4B9CD3",
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});
