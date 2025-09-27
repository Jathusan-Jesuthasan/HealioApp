import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function PersonalInfoScreen() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  const save = () => {
    // TODO: save to API/Firebase
    Alert.alert('Saved', 'Personal information updated.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personal Information</Text>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Bio"
        multiline
        value={bio}
        onChangeText={setBio}
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  btn: { backgroundColor: '#377DFF', padding: 14, borderRadius: 12, marginTop: 8 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});
