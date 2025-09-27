import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function EmergencyContactScreen() {
  const [phone, setPhone] = useState('');

  const save = () => {
    // TODO: save with user profile
    Alert.alert('Saved', 'Emergency contact updated.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contact</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone (e.g. +94 7X XXX XXXX)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TouchableOpacity style={styles.btn} onPress={save}>
        <Text style={styles.btnText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F7FB' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 10,
  },
  btn: { backgroundColor: '#377DFF', padding: 14, borderRadius: 12 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});
