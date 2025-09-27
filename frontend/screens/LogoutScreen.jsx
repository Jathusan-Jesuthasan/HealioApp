import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LogoutScreen({ navigation }) {
  const { signOut } = useContext(AuthContext);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log Out</Text>
      <Text style={styles.sub}>Are you sure you want to log out?</Text>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444' }]} onPress={signOut}>
        <Text style={styles.btnText}>Log Out</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#D1D5DB' }]}
        onPress={() => navigation.goBack()}>
        <Text style={[styles.btnText, { color: '#111827' }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F7FB' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  sub: { color: '#6B7280', marginBottom: 12 },
  btn: { padding: 14, borderRadius: 12, marginBottom: 10 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});
