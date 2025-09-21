import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function LaunchScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("MoodLog"); // go to mood log after 2s
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/Healio.png")} // add your logo inside /assets
        style={styles.logo}
      />
      <Text style={styles.title}>Healio</Text>
      <Text style={styles.subtitle}>Your Mental Wellness Companion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4A90E2",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 6,
    color: "#6B7280",
  },
});
