import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Share,
} from "react-native";
import { Colors } from "../utils/Colors";
import { Ionicons } from "@expo/vector-icons";

const MotivationCard = ({ score = 0, moodData = [], showRefresh = true }) => {
  const [motivation, setMotivation] = useState("");
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(40));
  const [category, setCategory] = useState("general");

  /* ---------------------- Motivation messages (UX friendly) ---------------------- */
  const MOTIVATION_CATEGORIES = {
    low: [
      "💚 It's okay not to feel okay — today, just breathe and be gentle with yourself.",
      "🌧️ Even rain helps things grow — give yourself that patience too.",
      "🤍 Small acts of self-care are big wins. Rest is productive.",
      "🪴 Healing isn’t linear — you’re doing better than you think.",
      "🌙 Take it slow. The night always turns into morning again.",
    ],
    medium: [
      "🌿 You’re learning balance — keep showing up for yourself.",
      "⚖️ One calm breath at a time — that’s how peace begins.",
      "☕ Celebrate small wins — they quietly build your confidence.",
      "🌻 Progress over perfection — every day counts.",
      "💫 You’re finding your rhythm — stay kind to yourself.",
    ],
    high: [
      "🌞 You’re radiating good energy — let it ripple around you!",
      "💪 That focus and calm? It’s inspiring — keep nurturing it.",
      "🌈 You’re grounded and glowing — keep sharing your light.",
      "🧘 Balanced mind, open heart — that’s real strength.",
      "🏆 Your self-awareness is your superpower.",
    ],
    streak: [
      "🔥 Streak strong! You’re building a habit of self-care.",
      "💎 Consistency is power — you’re mastering balance.",
      "🚀 Momentum suits you — keep moving with intention.",
      "🏆 Every mindful day adds to your resilience.",
      "📅 Your dedication is shaping your growth story.",
    ],
    general: [
      "🌱 You’re growing beautifully — keep believing in yourself.",
      "💚 Every small step counts toward your balance.",
      "🌤️ Rest. Reflect. Rise again.",
      "✨ Progress isn’t loud — it’s steady and real.",
      "🌈 You’ve got this — one day, one breath at a time.",
    ],
  };

  /* ----------------------- Category based on score ----------------------- */
  const getMotivationCategory = useCallback((currentScore, history) => {
    if (currentScore < 50) return "low";
    if (currentScore < 70) return "medium";
    if (currentScore >= 70) return "high";

    if (history.length >= 7) {
      const last7 = history.slice(-7);
      const consistent = last7.filter((log) => log.mood >= 3).length;
      if (consistent >= 5) return "streak";
    }
    return "general";
  }, []);

  /* ---------------------------- Quote generator ---------------------------- */
  const generateLocalMotivation = useCallback(() => {
    const cat = getMotivationCategory(score, moodData);
    const pool = MOTIVATION_CATEGORIES[cat] || MOTIVATION_CATEGORIES.general;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setMotivation(random);
    setCategory(cat);
  }, [score, moodData, getMotivationCategory]);

  const refreshMotivation = () => {
    setLoading(true);
    generateLocalMotivation();
    setTimeout(() => {
      setLoading(false);
      startAnimations();
    }, 400);
  };

  const shareMotivation = async () => {
    try {
      await Share.share({
        message: `💫 Healio Daily Motivation\n\n${motivation}\n\n— Healio, your mental-wellness companion`,
        title: "Healio Daily Motivation",
      });
    } catch (err) {
      console.log("Share failed:", err);
    }
  };

  /* ------------------------------ Animations ------------------------------ */
  const startAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Animated.Easing?.out(Animated.Easing?.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    generateLocalMotivation();
    setTimeout(() => {
      setLoading(false);
      startAnimations();
    }, 500);
  }, [score]);

  /* ----------------------------- Icon + colors ----------------------------- */
  const getCategoryIcon = () => {
    const icons = { low: "🌧️", medium: "🌿", high: "🌞", streak: "🔥", general: "💬" };
    return icons[category] || "💬";
  };

  const getCategoryColor = () => {
    const colors = {
      low: "#EF4444", // caring red
      medium: "#F59E0B", // warm amber
      high: "#10B981", // emerald
      streak: "#4A90E2", // blue motivation
      general: Colors.secondary,
    };
    return colors[category] || Colors.secondary;
  };

  /* ------------------------------- Loading UI ------------------------------- */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.secondary} />
        <Text style={styles.loadingText}>Finding your moment of calm...</Text>
      </View>
    );
  }

  /* --------------------------------- Render --------------------------------- */
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderLeftColor: getCategoryColor(),
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryIcon}>{getCategoryIcon()}</Text>
          <Text style={[styles.categoryText, { color: getCategoryColor() }]}>
            {category.toUpperCase()} INSPIRATION
          </Text>
        </View>

        <View style={styles.actions}>
          {showRefresh && (
            <TouchableOpacity onPress={refreshMotivation} style={styles.actionButton}>
              <Ionicons name="refresh" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={shareMotivation} style={styles.actionButton}>
            <Ionicons name="share-outline" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quote */}
      <Text style={styles.text}>{motivation}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          Updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </Animated.View>
  );
};

/* ---------------------------------- Styles ---------------------------------- */
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F7FA", // 60% neutral tone
    borderLeftWidth: 4,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#4A90E2", // subtle blue glow
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  actions: { flexDirection: "row", gap: 6 },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(74,144,226,0.08)",
  },
  text: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontStyle: "italic",
    lineHeight: 22,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  footer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 8,
  },
  timestamp: {
    fontSize: 10,
    color: Colors.textSecondary,
    opacity: 0.7,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "rgba(74,144,226,0.03)",
    borderRadius: 16,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default MotivationCard;
