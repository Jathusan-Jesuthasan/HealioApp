import React, { useState } from "react";
import { CommonActions } from "@react-navigation/native";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import api from "../config/api";

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).toLowerCase());

  // Always reaches Login even if stacks change
  const goToLogin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  };

  const handleSignup = async () => {
    if (!email || !password || !confirm) {
      return Alert.alert("Missing fields", "Please fill in all fields.");
    }
    if (!validateEmail(email)) {
      return Alert.alert("Invalid email", "Please enter a valid email address.");
    }
    if (password.length < 6) {
      return Alert.alert("Weak password", "Use at least 6 characters.");
    }
    if (password !== confirm) {
      return Alert.alert("Password mismatch", "Passwords do not match.");
    }

    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/register", { email, password });
      console.log("Registered:", data);
      Alert.alert("Welcome!", "Account created successfully. Please log in.");
      goToLogin();
    } catch (error) {
      console.error(error.response?.data || error.message);
      const msg = error.response?.data?.message || "Something went wrong";
      Alert.alert("Signup failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <View style={styles.header}>
          <Text style={styles.title}>Create your Healio account</Text>
          <Text style={styles.subtitle}>
            Start tracking your wellbeing with secure, private access.
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? <ActivityIndicator /> : <Text style={styles.signUpText}>Sign up</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={goToLogin}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchTextLink}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fbff", padding: 20 },
  header: { marginBottom: 30, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#4682e9", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#333", marginTop: 10, textAlign: "center" },
  form: { width: "100%" },
  input: {
    borderWidth: 1,
    borderColor: "#34c759",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  signUpButton: {
    backgroundColor: "#34c759",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  signUpText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  switchText: { fontSize: 14, color: "#333", textAlign: "center" },
  switchTextLink: { color: "#2a60d4", fontWeight: "600" },
});
