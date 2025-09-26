import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../utils/Colors";

export default function MoodHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [moods] = useState([
    { id: "1", emoji: "😊", note: "Had a good workout", date: "2025-09-24" },
    { id: "2", emoji: "😔", note: "Felt tired after class", date: "2025-09-23" },
    { id: "3", emoji: "😡", note: "Argument with a friend", date: "2025-09-22" },
  ]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("MoodDetail", { mood: item })}
    >
      <View style={styles.emojiWrapper}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>

      <View style={styles.textWrapper}>
        <Text style={styles.note} numberOfLines={1}>
          {item.note}
        </Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Your Mood History</Text>
      <FlatList
        data={moods}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, paddingHorizontal: 16 },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: Colors.secondary,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
  },
  emojiWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  emoji: { fontSize: 26 },
  textWrapper: { flex: 1 },
  note: { fontSize: 16, fontWeight: "500", color: Colors.textDark },
  date: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
});
