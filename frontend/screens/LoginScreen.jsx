import React, { useContext, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import api from "../config/api";
import { AuthContext } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).toLowerCase());

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      return Alert.alert("Error", "Please enter email and password");
    }
    if (!isValidEmail(trimmedEmail)) {
      return Alert.alert("Invalid Email", "Please enter a valid email address");
    }

    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/login", {
        email: trimmedEmail,
        password,
      });
    await signIn(data.token); // saved to AsyncStorage via context
    Alert.alert("Success", "Login Successful!");
    navigation.replace("MoodLog"); // Go to MoodLogScreen after login
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";
      console.error("Login error:", msg);
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return Alert.alert("Enter Email", "Please type your email first.");
    }
    if (!isValidEmail(trimmedEmail)) {
      return Alert.alert("Invalid Email", "Please enter a valid email address");
    }
    try {
      setLoading(true);
      await api.post("/api/auth/forgot-password", { email: trimmedEmail });
      Alert.alert(
        "Check Your Inbox",
        "If that email exists, a reset link has been sent."
      );
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Could not send reset link";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log in to continue{"\n"}your journey</Text>
        <Text style={styles.subtitle}>
          Welcome back ! Your healing journey continues.
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
          onSubmitEditing={handleSignIn}
          returnKeyType="go"
        />

        <TouchableOpacity onPress={handleForgot} disabled={loading}>
          <Text style={styles.forgotText}>Forgot your password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signInButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? <ActivityIndicator /> : <Text style={styles.signInText}>Sign in</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.createAccount}>Create new account</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>Or continue with</Text>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <AntDesign name="google" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="facebook" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <AntDesign name="apple1" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fbff", padding: 20, justifyContent: "center" },
  header: { marginBottom: 40, alignItems: "center" },
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
  forgotText: { color: "#2a60d4", fontSize: 14, alignSelf: "flex-end", marginBottom: 20 },
  signInButton: {
    backgroundColor: "#34c759",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  signInText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  createAccount: { fontSize: 14, color: "#333", textAlign: "center", marginBottom: 20 },
  orText: { textAlign: "center", color: "#4682e9", fontWeight: "500", marginBottom: 15 },
  socialContainer: { flexDirection: "row", justifyContent: "center", gap: 20 },
  socialButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
});
