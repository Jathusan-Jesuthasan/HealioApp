import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";

export default function HelpCenterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Help Center</Text>
      <Text style={styles.sub}>Browse FAQs or contact support.</Text>
      <TouchableOpacity style={styles.item} onPress={() => Linking.openURL("https://example.com/help")}>
        <Text style={styles.link}>Open FAQs</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => Linking.openURL("mailto:support@healio.app")}>
        <Text style={styles.link}>Email Support</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F5F7FB" },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  sub: { color: "#6B7280", marginBottom: 12 },
  item: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 10,
  },
  link: { color: "#377DFF", fontWeight: "700" },
});
