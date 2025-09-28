// frontend/screens/MoodHistoryScreen.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../utils/Colors";
import { getMoods, deleteMood } from "../config/api";
import Toast from "react-native-toast-message";

export default function MoodHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch moods
  const fetchMoods = async () => {
    try {
      const res = await getMoods();
      setMoods(res.data || []);
    } catch (err) {
      console.error("Fetch moods error:", err.message);
      Toast.show({ type: "error", text1: "Failed to load moods" });
    } finally {
      setLoading(false);
    }
  };

  // Delete mood
  const handleDelete = (id) => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this mood?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMood(id);
            Toast.show({ type: "success", text1: "Deleted 🗑️" });
            fetchMoods(); // reload
          } catch (err) {
            console.error("Delete mood error:", err.message);
            Toast.show({ type: "error", text1: "Delete failed" });
          }
        },
      },
    ]);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchMoods);
    return unsubscribe;
  }, [navigation]);

  // Render list item
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
          {item.note || "No note"}
        </Text>
        <Text style={styles.date}>
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : "Unknown date"}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => handleDelete(item._id)}
        style={styles.deleteBtn}
      >
        <Ionicons name="trash-outline" size={20} color="red" />
      </TouchableOpacity>

      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { paddingTop: insets.top, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text>Loading moods...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Your Mood History</Text>
      <FlatList
        data={moods}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40, color: Colors.textLight }}>
            No moods logged yet 🌱
          </Text>
        }
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
  deleteBtn: { marginRight: 10 },
});
