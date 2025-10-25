import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { MotiView, MotiText } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../config/api";
import { AuthContext } from "../../context/AuthContext";

export default function TrustedContactsScreen({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContacts = async () => {
    try {
      // Use /api/users/me which now includes populated trustedContacts
      const { data } = await api.get("/api/users/me", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setContacts(data.trustedContacts || []);
    } catch (error) {
      Alert.alert("Error", "Could not load contacts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchContacts);
    return unsubscribe;
  }, [navigation]);

  // If another screen navigates back here with a refresh param, re-fetch
  useEffect(() => {
    if (route?.params?.refreshedAt) {
      fetchContacts();
    }
  }, [route?.params?.refreshedAt]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContacts();
  }, []);

  const handleDelete = async (id) => {
    Alert.alert("Confirm", "Delete this trusted contact?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/trusted/${id}`, {
              headers: { Authorization: `Bearer ${userToken}` },
            });
            // Re-sync from server to ensure /api/users/me is authoritative
            await fetchContacts();
          } catch {
            Alert.alert("Error", "Failed to delete contact.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item, index }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100 }}
      style={styles.card}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate("AddTrustedContact", { contact: item })}
        onLongPress={() => handleDelete(item._id)}
        style={{ flexDirection: "row", justifyContent: "space-between" }}
      >
        <View>
          <MotiText style={styles.name}>{item.name}</MotiText>
          <Text style={styles.relation}>{item.relationship}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
          <Text style={styles.privacy}>{item.privacyLevel}</Text>
        </View>
        <Feather name="chevron-right" size={22} color="#4A90E2" />
      </TouchableOpacity>
    </MotiView>
  );

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );

  return (
    <LinearGradient colors={["#F5F7FA", "#E0ECFF"]} style={styles.container}>
      {contacts.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <Text style={styles.empty}>No trusted contacts yet.</Text>
          <TouchableOpacity
            style={{ marginTop: 16, padding: 10, backgroundColor: "#10B981", borderRadius: 8 }}
            onPress={() => navigation.navigate("AddTrustedContact")}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Add your first trusted contact</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contacts}
          refreshing={refreshing}
          onRefresh={onRefresh}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.fab, { opacity: contacts.length >= 3 ? 0.6 : 1 }]}
        onPress={() => {
          if (contacts.length >= 3) {
            Alert.alert('Limit reached', 'You can only add up to 3 trusted contacts.');
            return;
          }
          navigation.navigate("AddTrustedContact");
        }}
        disabled={contacts.length >= 3}
      >
        <Feather name="plus" size={30} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: { fontSize: 18, fontWeight: "700", color: "#4A90E2" },
  relation: { fontSize: 14, color: "#555" },
  phone: { fontSize: 14, color: "#10B981" },
  privacy: { fontSize: 13, color: "#888", marginTop: 4 },
  empty: { textAlign: "center", color: "#777", marginTop: 60, fontSize: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#10B981",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
