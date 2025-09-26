import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Colors } from "../utils/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MoodLogScreen({ navigation }) {
  const insets = useSafeAreaInsets();
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
      Toast.show({
        type: "error",
        text1: "Oops!",
        text2: "Please select an emoji or enter your mood.",
      });
      return;
    }

    Toast.show({
      type: "success",
      text1: "Mood Saved 🌱",
      text2: "Your entry has been added to history.",
    });

    setSelectedEmoji(null);
    setMoodText("");

    navigation.navigate("MoodHistory");
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 220 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>How are you feeling today? 🌱</Text>

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

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Write about your mood..."
            placeholderTextColor={Colors.textLight}
            value={moodText}
            onChangeText={setMoodText}
            multiline
          />
          <TouchableOpacity
            style={styles.micButton}
            onPress={() =>
              Toast.show({
                type: "info",
                text1: "🎙️ Voice Input",
                text2: "Recording mood... (mock feature)",
              })
            }
          >
            <Ionicons name="mic-outline" size={24} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.faceScan}
          onPress={() =>
            Toast.show({
              type: "info",
              text1: "📸 Face Scan",
              text2: "Opening camera... (mock feature)",
            })
          }
        >
          <Ionicons name="camera-outline" size={20} color={Colors.secondary} />
          <Text style={styles.faceScanText}> Use Face Scan</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.btnText}>Save Mood</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate("MoodHistory")}
        >
          <Ionicons name="time-outline" size={18} color={Colors.secondary} />
          <Text style={styles.historyText}> View History</Text>
        </TouchableOpacity>
      </View>
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
  input: { flex: 1, minHeight: 50, maxHeight: 120, paddingVertical: 8, color: Colors.textDark },
  micButton: { padding: 8 },
  faceScan: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  faceScanText: { color: Colors.secondary, fontSize: 16 },
  bottomActions: { position: "absolute", bottom: 80, left: 20, right: 20 },
  saveButton: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  btnText: { color: "white", fontSize: 18, fontWeight: "bold" },
  historyButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    elevation: 3,
  },
  historyText: { color: Colors.secondary, fontSize: 16, marginLeft: 6 },
});
