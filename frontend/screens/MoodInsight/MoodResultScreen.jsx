// /screens/MoodResultScreen.jsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ConfettiCannon from "react-native-confetti-cannon";

const MoodResultScreen = ({ route, navigation }) => {
  const { emoji, sentiment, emotion, confidence, funnyComment, note } =
    route.params || {};

  const confettiRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current; // 🎚️ Confidence bar animation

  useEffect(() => {
    setTimeout(() => confettiRef.current?.start(), 400);

    // Entry animations
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for Share button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Confidence progress bar
    const confValue =
      typeof confidence === "number"
        ? confidence / 100 // if already in %, adjust to 0–1 range
        : parseFloat(confidence) / 100 || 0;

    Animated.timing(progressAnim, {
      toValue: confValue,
      duration: 1200,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, []);

  // Format confidence text
  const confidencePct =
    typeof confidence === "number"
      ? `${Math.round(confidence)}%`
      : confidence
      ? `${confidence}%`
      : "—";

  const handleShare = async () => {
    try {
      const message = `💚 My Healio Mood Today: ${sentiment || "Neutral"}\n🧠 Emotion: ${
        emotion || "unknown"
      } (${confidencePct})\n💬 "${funnyComment}"\n📝 ${note}\n\n#Healio #MentalWellness`;
      await Share.share({ message });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🎊 Confetti */}
      <ConfettiCannon
        ref={confettiRef}
        count={40}
        origin={{ x: 200, y: 0 }}
        fadeOut
        autoStart={false}
      />

      <View style={styles.card}>
        <Text style={styles.emoji}>{emoji || "🙂"}</Text>
        <Text style={styles.moodTitle}>{sentiment || "Neutral"}</Text>

        <View style={styles.divider} />

        {/* 🧠 AI Emotion Analysis */}
        <Text style={styles.sectionHeader}>🧠 AI Emotion Analysis</Text>
        <Text style={styles.detail}>
          Emotion Detected: <Text style={styles.highlight}>{emotion || "unknown"}</Text>
        </Text>

        {/* 🎚️ Confidence Meter */}
        <View style={styles.confidenceWrapper}>
          <Text style={styles.confidenceLabel}>Confidence: {confidencePct}</Text>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* 🎯 Mood Summary */}
        <Text style={styles.detail}>
          🎯 Suggested Mood: <Text style={styles.highlight}>{sentiment || "Neutral"}</Text>
        </Text>

        {/* 💬 Support Message */}
        <Text style={styles.comment}>{funnyComment}</Text>

        {/* 📝 Journal */}
        <Text style={styles.noteTitle}>📝 Your Note</Text>
        <Text style={styles.noteText}>{note}</Text>

        {/* 🎞️ Buttons */}
        <Animated.View
          style={{
            flexDirection: "row",
            marginTop: 25,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* 📅 View History */}
          <TouchableOpacity
            style={[styles.buttonWrapper, { flex: 1, marginRight: 8 }]}
            onPress={() => navigation.navigate('Profile', { screen: 'MoodHistory' })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#4A90E2", "#6EB5FF"]}
              start={[0, 0]}
              end={[1, 1]}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>📅 View History</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* 📤 Share */}
          <Animated.View style={{ flex: 1, transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.85}>
              <LinearGradient
                colors={["#10B981", "#34D399"]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>📤 Share</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

// ---------------------- Styles ----------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 25,
    width: "92%",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.2,
    shadowRadius: 6,
  },
  emoji: { fontSize: 70, marginBottom: 8 },
  moodTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#1E293B",
  },
  divider: {
    width: "60%",
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
    color: "#4A90E2",
  },
  detail: {
    fontSize: 15,
    color: "#475569",
    marginVertical: 2,
    textAlign: "center",
  },
  highlight: {
    color: "#111827",
    fontWeight: "600",
  },
  confidenceWrapper: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "500",
    marginBottom: 4,
  },
  progressBarBackground: {
    width: "85%",
    height: 10,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#10B981",
  },
  comment: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#10B981",
    marginVertical: 12,
    textAlign: "center",
  },
  noteTitle: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  noteText: {
    fontSize: 15,
    color: "#1E293B",
    marginTop: 5,
    textAlign: "center",
    marginBottom: 10,
  },
  buttonWrapper: {
    borderRadius: 14,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 14,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
});

export default MoodResultScreen;
