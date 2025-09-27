// /screens/RiskDetailScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../utils/Colors';

const RiskDetailScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState(null);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const baseURL =
          Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

        // ✅ Hitting backend AI risk endpoint
        const res = await axios.get(`${baseURL}/api/dashboard?range=7d`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
        });

        // Simulated risk payload formatting
        const formatted = {
          risks: res.data.aiRiskDetected
            ? [
                {
                  category: 'Mood Decline',
                  message:
                    'Multiple low-mood logs detected within the last week. You may be at increased risk of stress or burnout.',
                  score: 72,
                },
              ]
            : [],
        };

        setRiskData(formatted);
      } catch (err) {
        console.error('❌ Error fetching AI risk:', err.response?.data || err.message);
        Alert.alert('Error', 'Could not fetch risk data.');
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Analyzing risks…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🤖 AI-Powered Risk Detection</Text>

      {riskData?.risks?.length > 0 ? (
        riskData.risks.map((risk, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.riskTitle}>⚠️ {risk.category}</Text>
            <Text style={styles.riskText}>{risk.message}</Text>
            <Text style={styles.riskScore}>Risk Score: {risk.score}%</Text>
          </View>
        ))
      ) : (
        <View style={styles.card}>
          <Text style={styles.safeText}>✅ No risks detected</Text>
        </View>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>⬅ Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: Colors.textSecondary },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  riskTitle: { fontSize: 18, fontWeight: '600', color: 'red' },
  riskText: { fontSize: 15, marginTop: 6, color: Colors.textSecondary, lineHeight: 20 },
  riskScore: { fontSize: 14, marginTop: 8, fontWeight: 'bold', color: 'orange' },
  safeText: {
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: Colors.secondary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  backText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

export default RiskDetailScreen;
