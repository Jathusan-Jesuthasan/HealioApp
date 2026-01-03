import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const exercises = [
  { name: "Push-ups", duration: 30, reps: 15, icon: "arm-flex" },
  { name: "Squats", duration: 40, reps: 20, icon: "human-handsup" },
  { name: "Plank", duration: 60, reps: 1, icon: "human-push-up" },
  { name: "Jumping Jacks", duration: 45, reps: 30, icon: "run" },
];

export default function ExerciseListScreen({ navigation }) {
  const [progress, setProgress] = useState({});
  const scaleAnim = useRef({}).current;

  const handleExerciseComplete = (exerciseName) => {
    setProgress((prev) => ({ ...prev, [exerciseName]: true }));
  };

  const handlePressIn = (name) => {
    if (!scaleAnim[name]) scaleAnim[name] = new Animated.Value(1);
    Animated.spring(scaleAnim[name], {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = (name) => {
    if (!scaleAnim[name]) scaleAnim[name] = new Animated.Value(1);
    Animated.spring(scaleAnim[name], {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const renderItem = ({ item }) => {
    const completed = progress[item.name];
    if (!scaleAnim[item.name]) scaleAnim[item.name] = new Animated.Value(1);

    return (
      <Animated.View 
        style={{ 
          transform: [{ scale: scaleAnim[item.name] }], 
          marginBottom: 16, 
          marginHorizontal: 20, 
          width: width - 40,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPressIn={() => handlePressIn(item.name)}
          onPressOut={() => handlePressOut(item.name)}
          onPress={() =>
            navigation.navigate("ExerciseDetail", {
              exercise: item,
              onComplete: handleExerciseComplete,
            })
          }
        >
          <LinearGradient
            colors={completed ? ["#43e97b", "#38f9d7"] : ["#4e8cff", "#6ea8ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, completed && styles.completedCard]}
          >
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={completed ? ["#38c97b", "#2ce9c7"] : ["#3a7bd5", "#4a9fff"]}
                style={styles.iconCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name={item.icon} size={24} color="#fff" />
              </LinearGradient>
              <View style={styles.titleContainer}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.cardBody}>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Ionicons name="timer-outline" size={18} color="#fff" />
                  <Text style={styles.statText}>{item.duration}s</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="repeat" size={18} color="#fff" />
                  <Text style={styles.statText}>{item.reps} reps</Text>
                </View>
              </View>
            </View>
            
            {completed && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={["#fff", "#f0f8ff"]}
                    style={styles.progressFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.progressText}>100%</Text>
              </View>
            )}
            
            <View style={styles.cardFooter}>
              <Text style={styles.startText}>Start Exercise →</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#e0eafc", "#cfdef3"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Today's Exercises</Text>
        <View style={styles.headerSubtitleContainer}>
          <Ionicons name="fitness-outline" size={20} color="#2d3a4b" />
          <Text style={styles.headerSubtitle}>4 exercises • 30 min</Text>
        </View>
      </View>
      
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    position: 'relative' 
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  header: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2d3a4b",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#5a6c8d",
    fontWeight: "500",
  },
  listContainer: { 
    paddingBottom: 30, 
    paddingTop: 8 
  },
  card: {
    padding: 20,
    borderRadius: 24,
    minHeight: 120,
    overflow: 'hidden',
  },
  completedCard: {
    borderWidth: 2,
    borderColor: '#43e97b',
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  completedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  statText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: 'right',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  startText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});