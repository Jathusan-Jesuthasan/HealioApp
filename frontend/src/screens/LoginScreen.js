import React, { useState, useContext } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
import API from '../api/api';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      const res = await API.post('/login', { email, password });
      login(res.data.token);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Go to Sign Up" onPress={() => navigation.navigate('Signup')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:20 },
  input: { borderWidth:1, marginVertical:10, padding:10, borderRadius:5 },
  title: { fontSize:24, textAlign:'center', marginBottom:20 }
});
