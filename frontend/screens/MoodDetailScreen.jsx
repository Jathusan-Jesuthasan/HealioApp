import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../utils/Colors";

export default function MoodDetailScreen({ route, navigation }) {
  const { mood } = route.params;

  const handleDelete = () => {
    Alert.alert("Delete Entry", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert("Deleted", "Mood entry removed.");
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header with back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mood Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>{mood.emoji}</Text>
        <Text style={styles.note}>{mood.note}</Text>
        <Text style={styles.date}>Date: {mood.date}</Text>

        <View style={styles.insightCard}>
          <Ionicons name="analytics-outline" size={20} color={Colors.secondary} />
          <Text style={styles.insightText}>
            Sentiment: {mood.emoji === "😊" ? "Positive" : "Needs attention"}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.secondary }]}
            onPress={() => Alert.alert("Edit feature coming soon!")}
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "red" }]}
            onPress={handleDelete}
          >
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.textLight,
    backgroundColor: "#fff",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: Colors.secondary,
  },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  emoji: { fontSize: 60, marginBottom: 20 },
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
  actions: { flexDirection: "row", justifyContent: "space-around", width: "100%" },
  actionBtn: { flex: 1, padding: 14, borderRadius: 12, marginHorizontal: 8, alignItems: "center" },
  actionText: { color: "white", fontSize: 16, fontWeight: "600" },
});
