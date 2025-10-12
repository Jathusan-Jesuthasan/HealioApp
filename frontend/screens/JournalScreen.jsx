// screens/JournalScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import api from "../config/api";
import { showSyncedToast } from "../utils/toastUtils";
import { useActivity } from "../context/ActivityContext";

export default function JournalScreen() {
  const [entry, setEntry] = useState("");
  const [journals, setJournals] = useState([]);
  const { triggerRefresh } = useActivity();
  const userId = "demo_user"; // later use AuthContext userId

  // 🧠 Load existing journal entries
  useEffect(() => {
    const loadJournals = async () => {
      const saved = await AsyncStorage.getItem("journals");
      if (saved) setJournals(JSON.parse(saved));
    };
    loadJournals();
  }, []);

  // 💾 Save new entry
  const handleSave = async () => {
    if (!entry.trim()) return Alert.alert("✏️ Empty Entry", "Please write something first.");

    const now = new Date();
    const newEntry = {
      id: Date.now().toString(),
      text: entry.trim(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
    };

    try {
      const updated = [newEntry, ...journals];
      setJournals(updated);
      await AsyncStorage.setItem("journals", JSON.stringify(updated));

      // ✅ Send to MongoDB
      await api.post("/api/journals/add", {
        userId,
        text: newEntry.text,
        date: now,
      });

      showSyncedToast("📝 Journal Synced to Dashboard!");
      triggerRefresh();
      setEntry("");
    } catch (err) {
      console.error("Journal save error:", err);
      Alert.alert("⚠️ Error", "Could not save journal entry.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#F5F7FA", "#E0F2FE"]} style={styles.container}>
        <Text style={styles.title}>Daily Journal</Text>

        <TextInput
          style={styles.input}
          placeholder="Reflect on your day..."
          placeholderTextColor="#94A3B8"
          value={entry}
          onChangeText={setEntry}
          multiline
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={styles.saveText}>Save Entry</Text>
        </TouchableOpacity>

        {journals.length > 0 && (
          <View style={styles.historyBox}>
            <Text style={styles.sectionTitle}>🕓 Past Entries</Text>
            <FlatList
              data={journals.slice(0, 10)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.entryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryText}>{item.text}</Text>
                    <Text style={styles.entryDate}>
                      {item.date} • {item.time}
                    </Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E3A8A",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  saveBtn: {
    flexDirection: "row",
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    marginBottom: 16,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  historyBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    flex: 1,
  },
  sectionTitle: { fontWeight: "700", color: "#1E293B", marginBottom: 8 },
  entryRow: {
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  entryText: { color: "#334155", fontSize: 15 },
  entryDate: { color: "#64748B", fontSize: 12, marginTop: 4 },
});
