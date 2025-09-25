import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function JournalScreen() {
  const [entry, setEntry] = useState("");
  const [journalHistory, setJournalHistory] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  // Load journal history from AsyncStorage
  const loadJournalHistory = async () => {
    try {
      const history = await AsyncStorage.getItem("journalHistory");
      if (history) {
        setJournalHistory(JSON.parse(history));
      } else {
        setJournalHistory([]);
      }
    } catch (error) {
      console.log("Failed to load journal history", error);
    }
  };

  // Trigger loading when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadJournalHistory();
    }, [])
  );

  // Save a new journal entry
  const saveEntry = async () => {
    if (entry.trim() === "") return;
    const newEntry = { id: Date.now().toString(), text: entry };
    const updatedHistory = [newEntry, ...journalHistory];

    try {
      await AsyncStorage.setItem(
        "journalHistory",
        JSON.stringify(updatedHistory)
      );
      setJournalHistory(updatedHistory);
      setEntry("");
      setSuccessMsg("Journal saved successfully!");
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (error) {
      console.log("Failed to save journal", error);
    }
  };

  // Delete a journal entry
  const deleteEntry = (id) => {
    Alert.alert(
      "Delete Entry",
      "Do you want to delete this journal entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            const updatedHistory = journalHistory.filter((item) => item.id !== id);
            try {
              await AsyncStorage.setItem(
                "journalHistory",
                JSON.stringify(updatedHistory)
              );
              setJournalHistory(updatedHistory);
            } catch (error) {
              console.log("Failed to delete journal", error);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyCard}>
      <Text style={{ flex: 1 }}>{item.text}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteEntry(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete ❌</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Your Journal</Text>

          <TextInput
            style={styles.input}
            placeholder="Write something..."
            value={entry}
            onChangeText={setEntry}
            multiline
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveEntry}>
            <Text style={styles.saveButtonText}>Save Journal ✏️</Text>
          </TouchableOpacity>

          {successMsg ? <Text style={styles.successMsg}>{successMsg}</Text> : null}

          {journalHistory.length > 0 && (
            <FlatList
              data={journalHistory}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.historyList}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  successMsg: { color: "green", marginTop: 10, fontWeight: "500" },
  historyList: { marginTop: 20, paddingBottom: 50 },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  deleteButton: {
    marginLeft: 10,
    backgroundColor: "#FF5252",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  deleteButtonText: { color: "#fff", fontWeight: "500" },
});
