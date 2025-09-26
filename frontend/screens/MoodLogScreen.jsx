import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../utils/Colors";

export default function MoodLogScreen({ navigation }) {
  const [moodText, setMoodText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(null);

  const emojis = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😔", label: "Sad" },
    { emoji: "😡", label: "Angry" },
    { emoji: "😐", label: "Neutral" },
    { emoji: "😴", label: "Tired" },
  ];

  const handleSave = () => {
    if (!selectedEmoji && !moodText.trim()) {
      Alert.alert("Oops!", "Please select an emoji or enter your mood.");
      return;
    }

    Alert.alert("Mood Saved ✅", "Your entry has been added to history.");

    setSelectedEmoji(null);
    setMoodText("");

    // Replace instead of navigate
    navigation.replace("MoodHistoryScreen");
  };

  const handleVoiceInput = () => {
    Alert.alert("🎙️ Voice Input", "Recording mood... (mock feature)");
  };

  const handleFaceScan = () => {
    Alert.alert("📸 Face Scan", "Opening camera... (mock feature)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>How are you feeling today? 🌱</Text>

        {/* Emoji grid */}
        <View style={styles.emojiGrid}>
          {emojis.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.emojiWrapper,
                selectedEmoji === item.emoji && styles.selectedEmoji,
              ]}
              onPress={() => setSelectedEmoji(item.emoji)}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.emojiLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chat-style input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Write about your mood..."
            placeholderTextColor={Colors.textLight}
            value={moodText}
            onChangeText={setMoodText}
            multiline
          />
          <TouchableOpacity style={styles.micButton} onPress={handleVoiceInput}>
            <Ionicons name="mic-outline" size={24} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Face scan */}
        <TouchableOpacity style={styles.faceScan} onPress={handleFaceScan}>
          <Ionicons name="camera-outline" size={20} color={Colors.secondary} />
          <Text style={styles.faceScanText}> Use Face Scan</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save button */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.btnText}>Save Mood</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.secondary,
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  emojiWrapper: { alignItems: "center", marginBottom: 20, width: "30%" },
  selectedEmoji: { transform: [{ scale: 1.2 }] },
  emoji: { fontSize: 40 },
  emojiLabel: { fontSize: 14, color: Colors.textDark, marginTop: 5 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 12,
    backgroundColor: "white",
    paddingHorizontal: 10,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    paddingVertical: 8,
    color: Colors.textDark,
  },
  micButton: { padding: 8, justifyContent: "center", alignItems: "center" },
  faceScan: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  faceScanText: { color: Colors.secondary, fontSize: 16 },
  button: {
    position: "absolute",
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    elevation: 5,
  },
  btnText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
