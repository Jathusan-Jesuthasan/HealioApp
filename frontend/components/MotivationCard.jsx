// components/MotivationCard.jsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated, Platform } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../utils/Colors";

const MotivationCard = ({ score }) => {
  const [motivation, setMotivation] = useState("");
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  const fetchMotivation = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const baseURL =
        Platform.OS === "android"
          ? "http://10.0.2.2:5000"
          : "http://localhost:5000";

      const res = await axios.post(
        `${baseURL}/api/motivation`,
        { score },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMotivation(res.data.message);
    } catch (err) {
      console.warn("Motivation API failed:", err.message);

      // fallback local quotes
      const localQuotes = [
        "You're doing great! Every step counts 🌱",
        "Your effort matters, even on tough days 💪",
        "Progress, not perfection ✨",
        "Rest. Recharge. Rise again 🌤️",
        "Keep believing in your growth 💚",
      ];
      setMotivation(localQuotes[Math.floor(Math.random() * localQuotes.length)]);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    if (score > 0) fetchMotivation();
  }, [score]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.secondary} />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.icon}>💬</Text>
      <Text style={styles.text}>{motivation}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(74,144,226,0.08)",
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  text: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 20,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
});

export default MotivationCard;