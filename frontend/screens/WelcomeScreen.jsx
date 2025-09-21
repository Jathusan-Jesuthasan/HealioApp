import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export default function WelcomeScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Safe redirect to Login (must exist in the current stack)
      navigation.replace("Login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/healio_logo.png")} // adjust path if your assets folder differs
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.tagline}>Your healing journey begins...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 260,
    height: 160,
    marginBottom: 16,
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
});
