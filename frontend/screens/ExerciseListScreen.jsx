import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const exercises = [
  { name: "Push-ups", duration: 30, reps: 15 },
  { name: "Squats", duration: 40, reps: 20 },
  { name: "Plank", duration: 60, reps: 1 },
  { name: "Jumping Jacks", duration: 45, reps: 30 },
];

export default function ExerciseListScreen({ navigation }) {
  const [progress, setProgress] = useState({}); // store completion per exercise

  const handleExerciseComplete = (exerciseName) => {
    setProgress((prev) => ({ ...prev, [exerciseName]: true }));
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("ExerciseDetail", {
          exercise: item,
          onComplete: handleExerciseComplete, // callback for completion
        })
      }
    >
      <LinearGradient
        colors={["#4e8cff", "#6ea8ff"]}
        style={styles.item}
      >
        <Text style={styles.text}>{item.name}</Text>
        {progress[item.name] && (
          <Text style={styles.completedText}>✅ Completed</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 10 },
  item: {
    padding: 20,
    marginVertical: 8,
    borderRadius: 12,
    justifyContent: "space-between",
  },
  text: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  completedText: { color: "#fff", fontSize: 14, marginTop: 5 },
});
