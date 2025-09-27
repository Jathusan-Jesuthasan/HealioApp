import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function YouthDashboardScreen({ route }) {
  // Optional: receive youth info when navigating: navigation.navigate('YouthDashboard', { youth })
  const youth = route?.params?.youth ?? { name: 'Demo Youth' };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Youth Dashboard</Text>
      <Text style={styles.sub}>Monitoring: {youth.name}</Text>

      {/* TODO: Replace with charts, recent moods, alerts, trends, etc. */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        <Text style={styles.cardText}>No data yet. Hook this to your backend.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Risk Signals</Text>
        <Text style={styles.cardText}>Show elevated/normal markers here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F7F9FF' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6, color: '#111827' },
  sub: { color: '#6B7280', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { fontWeight: '700', marginBottom: 6, color: '#111827' },
  cardText: { color: '#6B7280' },
});
