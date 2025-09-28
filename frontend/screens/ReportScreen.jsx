// /screens/ReportScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors } from '../utils/Colors';
import { getDashboard } from '../services/analytics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const screenWidth = Math.min(Dimensions.get('window').width - 32, 720);

export default function ReportScreen() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');
  const [dashboard, setDashboard] = useState(null);
  const [shareWithTrusted, setShareWithTrusted] = useState(false);

  const filters = [
    { label: 'Weekly', value: '7d' },
    { label: 'Monthly', value: '30d' },
    { label: '3 Months', value: '90d' },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDashboard(range);
      setDashboard(data);
    } catch (err) {
      console.error('Report load error:', err);
      Alert.alert('Error', 'Could not load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [range]);

  // Export report as PDF
  const exportPDF = async () => {
    if (!dashboard) return;
    try {
      const html = `
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h1>📑 Wellness Report</h1>
            <p><b>Range:</b> ${range}</p>
            <h2>⚖️ Mind Balance Score</h2>
            <p>${dashboard.mindBalanceScore}/100</p>
            <h2>📈 Wellness Progress</h2>
            <p>${Math.round(dashboard.progressMilestone * 100)}%</p>
            <h2>🤖 Risk Detection</h2>
            <p>${dashboard.aiRiskDetected ? '⚠️ Risk Detected' : '✅ No Risks'}</p>
            <h2>📅 Weekly Moods</h2>
            <p>${dashboard.weeklyMoods.join(', ')}</p>
            <h2>Privacy Sharing Enabled:</h2>
            <p>${shareWithTrusted ? 'Yes' : 'No'}</p>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (err) {
      console.error('PDF export failed:', err);
      Alert.alert('Error', 'Could not export PDF.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📑 Wellness Report</Text>
      <Text style={styles.subtitle}>View and export your mood & wellness trends</Text>

      {/* Date Range Selection */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterButton, range === f.value && styles.filterButtonActive]}
            onPress={() => setRange(f.value)}>
            <Text style={[styles.filterText, range === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.secondary} />
      ) : dashboard ? (
        <>
          {/* Mind Balance */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>⚖️ Mind Balance Score</Text>
            <Text style={styles.bigScore}>{dashboard.mindBalanceScore}/100</Text>
          </View>

          {/* Wellness Progress */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📈 Wellness Progress</Text>
            <Text style={styles.info}>
              {Math.round(dashboard.progressMilestone * 100)}% positive moods
            </Text>
          </View>

          {/* Mood Summary Overview */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>😊 Mood Summary</Text>
            <Text style={styles.info}>
              Weekly mood data available for visualization
            </Text>
            <Text style={styles.info}>
              Total mood entries tracked across {range}
            </Text>
          </View>

          {/* Wellness Index Graph */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📅 Mood Trend</Text>
            <LineChart
              data={{
                labels: dashboard.weeklyLabels || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
                datasets: [{ data: dashboard.weeklyMoods || [0,0,0,0,0,0,0] }],
              }}
              width={screenWidth}
              height={220}
              fromZero
              chartConfig={{
                backgroundColor: Colors.card,
                backgroundGradientFrom: Colors.card,
                backgroundGradientTo: Colors.card,
                decimalPlaces: 0,
                color: () => Colors.secondary,
                labelColor: () => Colors.textSecondary,
                propsForDots: { r: '5', strokeWidth: '2', stroke: Colors.secondary },
              }}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Risk Alerts History */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🤖 Risk Analysis</Text>
            <Text style={styles.info}>
              {dashboard.aiRiskDetected 
                ? '⚠️ AI detected potential risks based on mood patterns' 
                : '✅ No significant risks detected during this period'}
            </Text>
          </View>

          {/* Privacy & Consent Controls */}
          <View style={styles.cardRow}>
            <Text style={styles.sectionTitle}>🔒 Share with Trusted Person</Text>
            <Switch
              value={shareWithTrusted}
              onValueChange={setShareWithTrusted}
              trackColor={{ false: '#767577', true: Colors.secondary }}
              thumbColor={shareWithTrusted ? Colors.primary : '#f4f3f4'}
            />
          </View>

          {/* Export & Share Button */}
          <TouchableOpacity style={styles.exportButton} onPress={exportPDF}>
            <Text style={styles.exportText}>📤 Export & Share Report</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.info}>No data available for this range.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: 16 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  filterButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: Colors.primary },
  filterButtonActive: { backgroundColor: Colors.secondary },
  filterText: { color: Colors.textSecondary },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 16 },
  cardRow: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  bigScore: { fontSize: 32, fontWeight: '700', color: Colors.secondary },
  info: { fontSize: 15, color: Colors.textSecondary },
  chart: { marginTop: 8, borderRadius: 12 },
  exportButton: { backgroundColor: Colors.secondary, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  exportText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
