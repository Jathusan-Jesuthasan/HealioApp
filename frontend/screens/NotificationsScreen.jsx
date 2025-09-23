import React, { useState } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";

export default function NotificationsScreen() {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Push Notifications</Text>
        <Switch value={push} onValueChange={setPush} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Email Alerts</Text>
        <Switch value={email} onValueChange={setEmail} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F5F7FB" },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
  row: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 10,
  },
  label: { fontWeight: "600", color: "#111827" },
});
