import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";

const DEMO = [
  { id: "t1", name: "Ramesh K", relation: "Father" },
  { id: "t2", name: "Anjana S", relation: "Sister" },
];

export default function TrustedContactsScreen() {
  const [contacts, setContacts] = useState(DEMO);

  const addContact = () => {
    // TODO: navigate to AddTrustedContact or open modal
    Alert.alert("Add Trusted Person", "Open add-contact flow");
  };

  const sendAlert = (c) => {
    // TODO: cloud function / push / SMS
    Alert.alert("Emergency Alert", `Send urgent alert to ${c.name}?`, [
      { text: "Cancel" },
      { text: "Send", onPress: () => Alert.alert("Sent ✅") },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trusted Contacts</Text>
      <FlatList
        data={contacts}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.relation}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity style={styles.btn} onPress={() => sendAlert(item)}>
                <Text style={styles.btnText}>Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: "#10B981" }]}>
                <Text style={styles.btnText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={[styles.btn, { marginTop: 12 }]} onPress={addContact}>
        <Text style={styles.btnText}>Add Trusted Person</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F5F7FB" },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#E5E7EB",
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  name: { fontWeight: "700", color: "#111827" },
  sub: { color: "#6B7280", marginTop: 2 },
  btn: { backgroundColor: "#377DFF", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "700" },
});
