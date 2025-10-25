import React from "react";
import { SafeAreaView, Text, StyleSheet } from "react-native";

import Footer from "../components/BottomBar.jsx";

export default function SettingsScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.h1}>Settings</Text>
      <Footer />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F9FF" },
  h1: { fontSize: 24, fontWeight: "800", color: "#111827" },
});
