import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function SecurityScreen() {
  const changePassword = () => Alert.alert('Change Password', 'Open change password form.');
  const enable2FA = () => Alert.alert('Two-Factor Auth', 'Toggle 2FA.');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Security</Text>
      <TouchableOpacity style={styles.item} onPress={changePassword}>
        <Text style={styles.text}>Change Password</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={enable2FA}>
        <Text style={styles.text}>Enable Two-Factor Authentication</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F7FB' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  text: { fontWeight: '600', color: '#111827' },
});
