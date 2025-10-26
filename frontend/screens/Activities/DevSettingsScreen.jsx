// screens/DevSettingsScreen.jsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { saveApiKey, deleteApiKey } from "../../services/secretStore";
import { resetApiKeyCache } from "../../services/llmClient";

export default function DevSettingsScreen({ navigation }) {
  const [key, setKey] = useState("");

  const onSave = async () => {
    if (!key || !key.startsWith("sk-")) {
      Alert.alert("Invalid key", "Please paste a valid key that starts with sk-");
      return;
    }
    await saveApiKey(key.trim());
    resetApiKeyCache();
    setKey("");
    Alert.alert("Saved", "API key stored securely on this device.");
  };

  const onRemove = async () => {
    await deleteApiKey();
    resetApiKeyCache();
    Alert.alert("Removed", "API key removed.");
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* simple header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 18 }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Developer Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.wrap}>
        <Text style={styles.sub}>
          Paste your OpenAI API key. It will be saved in secure storage on this device.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="sk-proj-…"
          value={key}
          onChangeText={setKey}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={onSave}>
          <Text style={styles.btnText}>Save API Key</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#EF4444", marginTop: 8 }]}
          onPress={onRemove}
        >
          <Text style={styles.btnText}>Remove API Key</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FF" },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { padding: 6, width: 60 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  wrap: { padding: 16, gap: 12 },
  sub: { color: "#475569" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
  },
  btn: { backgroundColor: "#377DFF", padding: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
});