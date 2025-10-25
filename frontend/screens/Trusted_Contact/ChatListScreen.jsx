import React, { useContext, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from "react-native";
import dayjs from "dayjs";
import api from "../../config/api";
import { AuthContext } from "../../context/AuthContext";

export default function ChatListScreen({ navigation }) {
  const { userToken, user } = useContext(AuthContext);
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/api/chat/conversations", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setConvos(data);
    } catch (e) {
      console.log(e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation]);

  const renderItem = ({ item }) => {
    const others = (item.participants || []).filter((p) => p._id !== user?._id);
    const other = others[0] || {};
    const fullName = (other?.firstName || other?.givenName) && (other?.lastName || other?.familyName)
      ? `${other?.firstName || other?.givenName} ${other?.lastName || other?.familyName}`
      : null;
    const display = fullName || other?.name || other?.displayName || other?.email || other?.phone || 'Trusted Person';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("Profile", { screen: "ChatRoom", params: { conversationId: item._id, other } })}
      >
        <Image source={ other.profileImage ? { uri: other.profileImage } : require("../../assets/icon.png") } style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{display}</Text>
          <Text style={styles.sub}>{other.role || "Trusted"}</Text>
        </View>
        <Text style={styles.time}>{dayjs(item.lastMessageAt).fromNow()}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Support Messages</Text>
      <FlatList
        data={convos}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA", padding: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#4A90E2", marginBottom: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.15)",
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  name: { fontWeight: "700", color: "#0f172a" },
  sub: { color: "#64748B", fontSize: 12 },
  time: { color: "#64748B", fontSize: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
