import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../utils/Colors";

export default function MoodHistoryScreen({ navigation }) {
  const [moods] = useState([
    { id: "1", emoji: "😊", note: "Had a good workout", date: "2025-09-24" },
    { id: "2", emoji: "😔", note: "Felt tired after class", date: "2025-09-23" },
    { id: "3", emoji: "😡", note: "Argument with a friend", date: "2025-09-22" },
  ]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("MoodDetailScreen", { mood: item })}
    >
      <Text style={styles.emoji}>{item.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.note} numberOfLines={1}>{item.note}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Mood History</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={moods}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
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
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    margin: 12,
    elevation: 2,
  },
  emoji: { fontSize: 28, marginRight: 12 },
  note: { fontSize: 16, color: Colors.textDark },
  date: { fontSize: 12, color: Colors.textLight },
});
