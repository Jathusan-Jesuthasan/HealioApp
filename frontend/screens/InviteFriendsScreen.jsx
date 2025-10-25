import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Share } from "react-native";

export default function InviteFriendsScreen() {
  const invite = async () => {
    await Share.share({
      message: "Join me on Healio! Download the app: https://example.com/app",
    });
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invite Friends</Text>
      <Text style={styles.sub}>Share the app link with your trusted circle.</Text>
      <TouchableOpacity style={styles.btn} onPress={invite}>
        <Text style={styles.btnText}>Share Invite Link</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F5F7FB" },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  sub: { color: "#6B7280", marginBottom: 12 },
  btn: { backgroundColor: "#377DFF", padding: 14, borderRadius: 12 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "700" },
});
