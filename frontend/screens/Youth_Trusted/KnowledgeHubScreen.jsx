import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function KnowledgeHubScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Knowledge Hub</Text>
      <View style={styles.card}>
        <Text>Articles • Coping skills • Tips</Text>
      </View>
      {/* TODO: fetch articles, categories */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F7FB' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
