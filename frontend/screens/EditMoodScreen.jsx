// frontend/screens/EditMoodScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Colors } from "../utils/Colors";
import { updateMood } from "../config/api";
import Toast from "react-native-toast-message";

export default function EditMoodScreen({ route, navigation }) {
  const mood = route?.params?.mood; // ✅ Safe access
  const [note, setNote] = useState(mood?.note || "");

  const handleSave = async () => {
    if (!mood?._id) {
      Toast.show({ type: "error", text1: "Invalid mood data" });
      return;
    }

    try {
      await updateMood(mood._id, { note, emoji: mood.emoji });
      Toast.show({ type: "success", text1: "Mood updated ✅" });
      navigation.goBack();
    } catch (err) {
      console.error("Update error:", err.message);
      Toast.show({ type: "error", text1: "Update failed" });
    }
  };

  if (!mood) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: "red", fontSize: 16 }}>
          ⚠️ No mood data provided.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.emoji}>{mood.emoji}</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="Edit your note"
      />
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  emoji: { fontSize: 60, marginBottom: 20 },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.secondary,
    padding: 14,
    borderRadius: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
