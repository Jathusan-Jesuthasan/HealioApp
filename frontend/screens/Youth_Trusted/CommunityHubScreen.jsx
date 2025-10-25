import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import api from "../../config/api";
import { AuthContext } from "../../context/AuthContext";

export default function CommunityHubScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", message: "", anonymous: true });
  const [roleFilter, setRoleFilter] = useState("");

  const fetchPosts = async () => {
    try {
      const { data } = await api.get(`/api/community`, {
        headers: { Authorization: `Bearer ${userToken}` },
        params: { search, roleFilter },
      });
      setPosts(data);
    } catch (err) {
      Alert.alert("Error", "Could not load community posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [search, roleFilter]);

  const handlePost = async () => {
    if (!newPost.title || !newPost.message)
      return Alert.alert("Missing fields", "Please fill in title and message");
    try {
      await api.post("/api/community", newPost, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setModalVisible(false);
      setNewPost({ title: "", message: "", anonymous: true });
      fetchPosts();
    } catch {
      Alert.alert("Error", "Failed to post");
    }
  };

  const handleLike = async (id) => {
    await api.patch(`/api/community/${id}/like`, {}, { headers: { Authorization: `Bearer ${userToken}` } });
    fetchPosts();
  };

  const handleReport = async (id) => {
    await api.patch(`/api/community/${id}/report`, {}, { headers: { Authorization: `Bearer ${userToken}` } });
    Alert.alert("Reported", "This post has been flagged for moderation.");
  };

  const renderPost = ({ item }) => (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
      <View style={styles.headerRow}>
        <Feather name="user" size={18} color="#4A90E2" />
        <Text style={styles.author}>
          {item.anonymous ? "Anonymous" : item.authorRole} • {item.authorRole}
        </Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.message}>{item.message}</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleLike(item._id)}>
          <Feather name="thumbs-up" size={16} color="#10B981" />
        </TouchableOpacity>
        <Text>{item.likes}</Text>
        <TouchableOpacity onPress={() => handleReport(item._id)}>
          <Feather name="flag" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4A90E2", "#10B981"]} style={styles.header}>
        <Text style={styles.headerText}>Community Hub</Text>
      </LinearGradient>

      {/* Search and Filters */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search topics..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Feather name="plus-circle" size={26} color="#10B981" />
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterBtn, roleFilter === "Youth" && styles.filterActive]}
          onPress={() => setRoleFilter(roleFilter === "Youth" ? "" : "Youth")}
        >
          <Text style={styles.filterText}>Youth</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, roleFilter === "Trusted" && styles.filterActive]}
          onPress={() => setRoleFilter(roleFilter === "Trusted" ? "" : "Trusted")}
        >
          <Text style={styles.filterText}>Trusted</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={renderPost}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {/* New Post Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Start Discussion</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={newPost.title}
              onChangeText={(v) => setNewPost({ ...newPost, title: v })}
            />
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Write something..."
              value={newPost.message}
              onChangeText={(v) => setNewPost({ ...newPost, message: v })}
              multiline
            />

            <TouchableOpacity
              style={styles.anonToggle}
              onPress={() => setNewPost({ ...newPost, anonymous: !newPost.anonymous })}
            >
              <Feather
                name={newPost.anonymous ? "eye-off" : "eye"}
                size={16}
                color="#4A90E2"
              />
              <Text style={styles.anonText}>
                {newPost.anonymous ? "Post Anonymously" : "Show my role"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.postButton} onPress={handlePost}>
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#EF4444", textAlign: "center", marginTop: 10 }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { padding: 16 },
  headerText: { color: "#fff", fontSize: 20, fontWeight: "700", textAlign: "center" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    elevation: 3,
  },
  searchInput: { flex: 1, height: 40, color: "#111827" },
  filters: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
  filterBtn: {
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 5,
  },
  filterActive: { backgroundColor: "#10B981" },
  filterText: { color: "#000", fontWeight: "500" },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  author: { marginLeft: 6, color: "#4A90E2", fontWeight: "500" },
  title: { fontWeight: "700", fontSize: 16, color: "#111827" },
  message: { color: "#475569", marginTop: 4 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#4A90E2", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    color: "#111827",
  },
  anonToggle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  anonText: { color: "#4A90E2" },
  postButton: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  postButtonText: { color: "#fff", fontWeight: "700" },
});
