import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export default function WelcomeScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      // 👇 Move to Onboarding, not Login
      navigation.replace("Onboarding1");
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/healio_logo.png")}
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
    width: 1000,   // ✅ smaller size for mobile
    height: 400,
    marginBottom: 16,
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
});
