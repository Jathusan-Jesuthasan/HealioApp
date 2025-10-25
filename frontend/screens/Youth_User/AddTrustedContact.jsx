import React, { useState, useContext, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import api from "../../config/api";
import * as Clipboard from 'expo-clipboard';
import { AuthContext } from "../../context/AuthContext";

export default function AddTrustedContact({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const contact = route.params?.contact;

  const [form, setForm] = useState({
    name: contact?.name || "",
    phone: contact?.phone || "",
    email: contact?.email || "",
    relationship: contact?.relationship || "",
    privacyLevel: contact?.privacyLevel || "Alerts Only",
  });
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef(null);

  const handleSave = async () => {
    // Basic validation
    if (!form.name?.trim()) {
      Alert.alert("Missing Info", "Please enter the contact's full name.");
      nameRef.current?.focus?.();
      return;
    }
    if (!form.phone?.trim()) {
      Alert.alert("Missing Info", "Please enter a phone number.");
      return;
    }

    // Optional email validation
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address or leave blank.");
      return;
    }

    setIsSaving(true);
    Keyboard.dismiss();
    try {
      let res;
      if (contact) {
        res = await api.put(`/api/trusted/${contact._id}`, form, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
      } else {
        res = await api.post("/api/trusted", form, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
      }

      // Success - notify and return to list with refresh signal
      Alert.alert("Saved", "Trusted contact saved successfully.");
      navigation.navigate("TrustedContacts", { refreshedAt: Date.now() });
      return res?.data;
    } catch (err) {
      // Try to show server-provided message when available
      const resp = err?.response?.data;
      const msg = resp?.message || err?.message || "Failed to save contact";
      if (resp?.inviteLink) {
        Alert.alert(
          "Contact not registered",
          `${msg}\nYou can copy an invite link to send to them.`,
          [
            { text: 'Copy Invite Link', onPress: async () => { await Clipboard.setStringAsync(resp.inviteLink); Alert.alert('Copied', 'Invite link copied to clipboard'); } },
            { text: 'OK' },
          ]
        );
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LinearGradient colors={["#F5F7FA", "#E0ECFF"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 80 }}>
        <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }} style={styles.form}>
          <Text style={styles.title}>
            {contact ? "Edit Trusted Contact" : "Add Trusted Contact"}
          </Text>
          <TextInput
            ref={nameRef}
            style={styles.input}
            placeholder="Full Name"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            autoCapitalize="words"
            returnKeyType="next"
            editable={!isSaving}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email (optional)"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Relationship (Parent, Mentor, etc.)"
            value={form.relationship}
            onChangeText={(v) => setForm({ ...form, relationship: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Privacy Level (Alerts Only / Mood Trends)"
            value={form.privacyLevel}
            onChangeText={(v) => setForm({ ...form, privacyLevel: v })}
          />

          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <LinearGradient
              colors={isSaving ? ["#94D7BF", "#9FE6C6"] : ["#10B981", "#34D399"]}
              style={[styles.saveBtn, isSaving && { opacity: 0.9 }]}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save Contact</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={isSaving}
            style={{ marginTop: 10 }}
          >
            <Text style={{ color: "#4A90E2", textAlign: "center" }}>Cancel</Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginTop: 40,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#4A90E2", marginBottom: 20, textAlign: "center" },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  saveBtn: { padding: 14, borderRadius: 12, alignItems: "center", marginTop: 10 },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
