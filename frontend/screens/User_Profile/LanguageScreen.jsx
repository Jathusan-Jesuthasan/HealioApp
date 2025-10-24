import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const LANGS = ["English (EN)", "தமிழ் (TA)", "සිංහල (SI)"];

export default function LanguageScreen() {
  const [lang, setLang] = useState("English (EN)");
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Language</Text>
      {LANGS.map(l => (
        <TouchableOpacity key={l} style={[styles.item, lang === l && styles.active]} onPress={() => setLang(l)}>
          <Text style={[styles.text, lang === l && styles.textActive]}>{l}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F5F7FB" },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
  item: {
    padding: 14, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1,
    borderColor: "#E5E7EB", marginBottom: 10,
  },
  active: { borderColor: "#377DFF" },
  text: { fontWeight: "600", color: "#111827" },
  textActive: { color: "#377DFF" },
});
