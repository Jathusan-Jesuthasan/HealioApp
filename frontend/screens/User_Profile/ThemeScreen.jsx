import React, { useState } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";

export default function ThemeScreen() {
  const [dark, setDark] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Theme</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Dark Mode</Text>
        <Switch value={dark} onValueChange={setDark} />
      </View>
      {/* TODO: Integrate with app theme provider */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F5F7FB" },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
  row: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  label: { fontWeight: "600", color: "#111827" },
});
