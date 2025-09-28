// frontend/screens/MoodDetailScreen.jsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../utils/Colors";
import { deleteMood } from "../config/api";
import Toast from "react-native-toast-message";

export default function MoodDetailScreen({ route, navigation }) {
  const { mood } = route.params;
  const insets = useSafeAreaInsets();

  // Delete function
  const handleDelete = () => {
    Alert.alert("Delete Entry", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMood(mood._id);
            Toast.show({
              type: "success",
              text1: "Deleted 🗑️",
              text2: "Mood entry removed successfully",
            });
            navigation.navigate("MoodHistory");
          } catch (err) {
            console.error("Delete mood error:", err.message);
            Toast.show({
              type: "error",
              text1: "Delete Failed",
              text2: "Could not remove mood. Try again.",
            });
          }
        },
      },
    ]);
  };

  // Navigate to edit screen
  const handleEdit = () => {
    navigation.navigate("EditMood", { mood });
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={Colors.secondary} />
      </TouchableOpacity>

      <Text style={styles.emoji}>{mood.emoji}</Text>
      <Text style={styles.note}>{mood.note}</Text>
      <Text style={styles.date}>
        Date: {new Date(mood.createdAt).toLocaleDateString()}
      </Text>

      <View style={styles.insightCard}>
        <Ionicons name="analytics-outline" size={20} color={Colors.secondary} />
        <Text style={styles.insightText}>
          Sentiment: {mood.emoji === "😊" ? "Positive" : "Needs attention"}
        </Text>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.secondary }]}
          onPress={handleEdit}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={[styles.actionText, { color: "#fff" }]}> Edit Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: "#fff", borderWidth: 1, borderColor: "red" },
          ]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="red" />
          <Text style={[styles.actionText, { color: "red" }]}> Delete Entry</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", backgroundColor: Colors.primary, padding: 16 },
  backBtn: { position: "absolute", top: 20, left: 20 },
  emoji: { fontSize: 60, marginBottom: 20, marginTop: 60 },
  note: { fontSize: 18, color: Colors.textDark, marginBottom: 10, textAlign: "center" },
  date: { fontSize: 14, color: Colors.textLight, marginBottom: 30 },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 30,
    elevation: 2,
  },
  insightText: { marginLeft: 8, color: Colors.textDark },
  bottomActions: { position: "absolute", bottom: 80, left: 20, right: 20 },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3,
  },
  actionText: { fontSize: 16, fontWeight: "600" },
});
