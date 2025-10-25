import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../utils/Colors";

const MoodLogScreen = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [journalText, setJournalText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const moods = [
    { emoji: "😊", label: "Happy", color: "#F59E0B" },
    { emoji: "😐", label: "Neutral", color: "#4A90E2" },
    { emoji: "😔", label: "Sad", color: "#64748B" },
    { emoji: "😡", label: "Angry", color: "#EF4444" },
    { emoji: "😴", label: "Tired", color: "#10B981" },
  ];

  // Helper to convert hex to rgba with opacity
  const hexToRgba = (hex, alpha = 0.12) => {
    const match = hex.replace('#', '').match(/.{1,2}/g);
    if (!match || match.length < 3) return hex;
    const [r, g, b] = match.map((x) => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const factors = [
    "Work",
    "Exercise",
    "Family",
    "Hobbies",
    "Finances",
    "Sleep",
    "Drink",
    "Food",
    "Relationships",
    "Education",
    "Weather",
    "Music",
    "Travel",
    "Health",
  ];

  // simulated voice -> text
  const simulateSpeechRecognition = () => {
    setIsRecording(true);
    const responses = {
      Happy: "Today was a great day! I felt motivated and grateful.",
      Neutral: "It was an average day, nothing special.",
      Sad: "I felt down today, not very motivated.",
      Angry: "I got frustrated with some situations at work.",
      Tired: "I felt very drained and needed rest.",
    };

    const response =
      selectedMood && responses[selectedMood.label]
        ? responses[selectedMood.label]
        : "It was an okay day.";

    setTimeout(() => {
      setIsRecording(false);
      setJournalText((prev) => (prev ? prev + " " + response : response));
      Alert.alert("Voice Input", "Speech converted to text (simulated).");
    }, 2500);
  };

  const startSpeechToText = () => simulateSpeechRecognition();

  // tiny sentiment guesser
  const analyzeSentiment = (text) => {
    if (!text || text.length < 5) return null;
    const positive = ["happy", "good", "great", "love"];
    const negative = ["sad", "bad", "angry", "hate"];
    const tired = ["tired", "exhausted", "sleepy"];

    let score = { pos: 0, neg: 0, tired: 0 };
    text
      .toLowerCase()
      .split(/\s+/)
      .forEach((w) => {
        if (positive.includes(w)) score.pos++;
        if (negative.includes(w)) score.neg++;
        if (tired.includes(w)) score.tired++;
      });

    if (score.pos > score.neg && score.pos > score.tired) return "positive";
    if (score.neg > score.pos && score.neg > score.tired) return "negative";
    if (score.tired > score.pos && score.tired > score.neg) return "tired";
    return "neutral";
  };

  const suggestMoodFromText = async () => {
    if (!journalText) return;
    setIsProcessing(true);
    await new Promise((res) => setTimeout(res, 1000));

    const sentiment = analyzeSentiment(journalText);
    switch (sentiment) {
      case "positive":
        setSelectedMood(moods[0]);
        break;
      case "negative":
        setSelectedMood(moods[2]);
        break;
      case "tired":
        setSelectedMood(moods[4]);
        break;
      default:
        setSelectedMood(moods[1]);
    }
    setIsProcessing(false);
  };

  const toggleFactor = (factor) => {
    setSelectedFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    );
  };

  const handleSubmit = () => {
    if (!selectedMood) {
      Alert.alert("Select Mood", "Please choose your mood before submitting.");
      return;
    }

    // TODO: Send to backend (MongoDB) here
    console.log("Mood:", selectedMood);
    console.log("Factors:", selectedFactors);
    console.log("Journal:", journalText);

    // ✅ Go back to Dashboard tab (your AppTabs' "Home")
    navigation.navigate("Home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>🩺 Healio</Text>
            <Text style={styles.headerSubtitle}>Mood Journal</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>How are you feeling today?</Text>

            {/* moods */}
            <View style={styles.moodContainer}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.label}
                  style={[
                    styles.moodButton,
                    selectedMood?.label === mood.label && {
                      backgroundColor: hexToRgba(mood.color, 0.12),
                      borderColor: mood.color,
                      transform: [{ scale: 1.1 }],
                    },
                  ]}
                  onPress={() => setSelectedMood(mood)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* factors */}
            <Text style={styles.sectionTitle}>What's affecting your mood?</Text>
            <View style={styles.factorsContainer}>
              {factors.map((factor, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.factorButton,
                    selectedFactors.includes(factor) && styles.factorButtonSelected,
                  ]}
                  onPress={() => toggleFactor(factor)}
                >
                  <Text
                    style={[
                      styles.factorText,
                      selectedFactors.includes(factor) && styles.factorTextSelected,
                    ]}
                  >
                    {factor}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* journal */}
            <Text style={styles.sectionTitle}>Write about it</Text>
            <TextInput
              style={styles.journalInput}
              multiline
              placeholder="Write about your day..."
              value={journalText}
              onChangeText={setJournalText}
            />

            {/* voice + suggest */}
            <View style={styles.voiceActions}>
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                onPress={startSpeechToText}
                disabled={isRecording}
              >
                <Text style={styles.voiceButtonIcon}>{isRecording ? "⏹️" : "🎤"}</Text>
                <Text style={styles.voiceButtonText}>
                  {isRecording ? "Recording..." : "Tap to Speak"}
                </Text>
              </TouchableOpacity>

              {journalText.length > 5 && (
                <TouchableOpacity
                  style={styles.analyzeButton}
                  onPress={suggestMoodFromText}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.analyzeButtonText}>Suggest Mood</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* submit */}
            <TouchableOpacity
              style={[styles.submitButton, !selectedMood && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!selectedMood}
            >
              <Text style={styles.submitButtonText}>
                {selectedMood ? "Log Mood & Continue" : "Select a Mood"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  header: { alignItems: "center", padding: 16 },
  logo: { fontSize: 28, fontWeight: "bold", color: Colors.secondary },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 16, textAlign: "center" },
  moodContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  moodButton: {
    width: "28%",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 12,
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 12, marginTop: 4, color: Colors.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginVertical: 12 },
  factorsContainer: { flexDirection: "row", flexWrap: "wrap" },
  factorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    margin: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  factorButtonSelected: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  factorText: { fontSize: 13, color: Colors.textSecondary },
  factorTextSelected: { color: "white", fontWeight: "500" },
  journalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  voiceActions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  voiceButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  voiceButtonActive: { backgroundColor: "#E0F2FE" },
  voiceButtonIcon: { fontSize: 18, marginRight: 6 },
  voiceButtonText: { color: Colors.textSecondary },
  analyzeButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  analyzeButtonText: { color: "white", fontWeight: "600", fontSize: 12 },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: Colors.disabled },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default MoodLogScreen;
