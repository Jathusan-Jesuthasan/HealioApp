import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const exercises = [
  { name: "Push-ups", duration: 30, reps: 15 },
  { name: "Squats", duration: 40, reps: 20 },
  { name: "Plank", duration: 60, reps: 1 },
  { name: "Jumping Jacks", duration: 45, reps: 30 },
];

export default function ExerciseListScreen({ navigation }) {
  const [progress, setProgress] = useState({});

  const handleExerciseComplete = (exerciseName) => {
    setProgress((prev) => ({ ...prev, [exerciseName]: true }));
  };

  const renderItem = ({ item }) => {
    const completed = progress[item.name];

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("ExerciseDetail", {
            exercise: item,
            onComplete: handleExerciseComplete,
          })
        }
      >
        <LinearGradient
          colors={completed ? ["#4caf50", "#66bb6a"] : ["#4e8cff", "#6ea8ff"]}
          style={[styles.card, completed && styles.completedCard]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            {completed && <Ionicons name="checkmark-circle" size={24} color="#fff" />}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardText}>Duration: {item.duration}s</Text>
            <Text style={styles.cardText}>Reps: {item.reps}</Text>
          </View>
          {completed && (
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Today's Exercises</Text>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f3f8", padding: 10 },
  header: { fontSize: 24, fontWeight: "bold", marginVertical: 15, color: "#333" },
  card: {
    padding: 20,
    borderRadius: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  completedCard: {
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  cardBody: { marginTop: 10 },
  cardText: { color: "#fff", fontSize: 16, marginVertical: 2 },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    marginTop: 15,
  },
  progressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 3,
  },
});
