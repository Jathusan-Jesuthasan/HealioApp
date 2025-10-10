// /screens/MoodLogScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../utils/Colors';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MoodLogScreen = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [journalText, setJournalText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);

  const moods = [
    { emoji: '😊', label: 'Happy', color: '#F59E0B' },
    { emoji: '😐', label: 'Neutral', color: '#4A90E2' },
    { emoji: '😔', label: 'Sad', color: '#64748B' },
    { emoji: '😡', label: 'Angry', color: '#EF4444' },
    { emoji: '😴', label: 'Tired', color: '#10B981' },
  ];

  // Helper: convert hex color to rgba with opacity
  const hexToRgba = (hex, alpha = 0.12) => {
    const match = hex.replace('#', '').match(/.{1,2}/g);
    if (!match || match.length < 3) return hex;
    const [r, g, b] = match.map((x) => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const factors = [
    'Work',
    'Exercise',
    'Family',
    'Hobbies',
    'Finances',
    'Sleep',
    'Drink',
    'Food',
    'Relationships',
    'Education',
    'Weather',
    'Music',
    'Travel',
    'Health',
  ];

  // Fake speech-to-text simulation
  const simulateSpeechRecognition = () => {
    setIsRecording(true);
    const responses = {
      Happy: 'Today was a great day! I felt motivated and grateful.',
      Neutral: 'It was an average day, nothing special.',
      Sad: 'I felt down today, not very motivated.',
      Angry: 'I got frustrated with some situations at work.',
      Tired: 'I felt very drained and needed rest.',
    };
    const response =
      selectedMood && responses[selectedMood.label]
        ? responses[selectedMood.label]
        : 'It was an okay day.';

    setTimeout(() => {
      setIsRecording(false);
      setJournalText((prev) => (prev ? prev + ' ' + response : response));
      Alert.alert('Voice Input', 'Speech converted to text (simulated).');
    }, 2500);
  };

  const startSpeechToText = () => simulateSpeechRecognition();

  // Basic sentiment analysis
  const analyzeSentiment = (text) => {
    if (!text || text.length < 5) return null;
    const positive = ['happy', 'good', 'great', 'love'];
    const negative = ['sad', 'bad', 'angry', 'hate'];
    const tired = ['tired', 'exhausted', 'sleepy'];

    let score = { pos: 0, neg: 0, tired: 0 };
    text
      .toLowerCase()
      .split(/\s+/)
      .forEach((w) => {
        if (positive.includes(w)) score.pos++;
        if (negative.includes(w)) score.neg++;
        if (tired.includes(w)) score.tired++;
      });

    if (score.pos > score.neg && score.pos > score.tired) return 'positive';
    if (score.neg > score.pos && score.neg > score.tired) return 'negative';
    if (score.tired > score.pos && score.tired > score.neg) return 'tired';
    return 'neutral';
  };

  const suggestMoodFromText = async () => {
    if (!journalText) return;
    setIsProcessing(true);
    await new Promise((res) => setTimeout(res, 1000));
    const sentiment = analyzeSentiment(journalText);
    switch (sentiment) {
      case 'positive':
        setSelectedMood(moods[0]);
        break;
      case 'negative':
        setSelectedMood(moods[2]);
        break;
      case 'tired':
        setSelectedMood(moods[4]);
        break;
      default:
        setSelectedMood(moods[1]);
    }
    setIsProcessing(false);
  };

  const toggleFactor = (factor) => {
    setSelectedFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    );
  };

  // ✅ Save mood log to backend
  const handleSubmit = async () => {
    if (!selectedMood) {
      Alert.alert('Select Mood', 'Please choose your mood before submitting.');
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Auth Error', 'You are not logged in.');
        return;
      }

      const baseURL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

      const res = await axios.post(
        `${baseURL}/api/moodlogs`,
        {
          mood: selectedMood.label,
          factors: selectedFactors,
          journal: journalText,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 🔥 Trigger AI risk analysis automatically after mood log
      try {
        await axios.post(
          `${baseURL}/api/ai/risk-analysis`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('✅ AI risk analysis triggered');
      } catch (aiErr) {
        console.warn('⚠️ AI risk analysis failed:', aiErr.response?.data || aiErr.message);
      }

      console.log('✅ Mood log saved:', res.data);
      Alert.alert('Success', 'Mood log saved successfully!');
      navigation.navigate('Home'); // go back to dashboard
    } catch (error) {
      console.error('❌ Error saving mood:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save mood log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>🩺 Healio</Text>
            <Text style={styles.headerSubtitle}>Mood Journal</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>How are you feeling today?</Text>
            <View style={styles.moodContainer}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.label}
                  style={[
                    styles.moodButton,
                    selectedMood?.label === mood.label && {
                      backgroundColor: hexToRgba(mood.color, 0.12),
                      borderColor: mood.color,
                      transform: [{ scale: 1.1 }],
                    },
                  ]}
                  onPress={() => setSelectedMood(mood)}>
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>What&apos;s affecting your mood?</Text>
            <View style={styles.factorsContainer}>
              {factors.map((factor, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.factorButton,
                    selectedFactors.includes(factor) && styles.factorButtonSelected,
                  ]}
                  onPress={() => toggleFactor(factor)}>
                  <Text
                    style={[
                      styles.factorText,
                      selectedFactors.includes(factor) && styles.factorTextSelected,
                    ]}>
                    {factor}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Write about it</Text>
            <TextInput
              style={styles.journalInput}
              multiline
              placeholder="Write about your day..."
              value={journalText}
              onChangeText={setJournalText}
            />

            <View style={styles.voiceActions}>
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                onPress={startSpeechToText}>
                <Text style={styles.voiceButtonIcon}>{isRecording ? '⏹️' : '🎤'}</Text>
                <Text style={styles.voiceButtonText}>
                  {isRecording ? 'Recording...' : 'Tap to Speak'}
                </Text>
              </TouchableOpacity>

              {journalText.length > 5 && (
                <TouchableOpacity
                  style={styles.analyzeButton}
                  onPress={suggestMoodFromText}
                  disabled={isProcessing}>
                  {isProcessing ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.analyzeButtonText}>Suggest Mood</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedMood || loading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedMood || loading}>
              <Text style={styles.submitButtonText}>
                {loading ? 'Saving...' : 'Log Mood & Continue'}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Extra space for mobile responsiveness */}
            <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  header: { alignItems: 'center', padding: 16 },
  logo: { fontSize: 28, fontWeight: 'bold', color: Colors.secondary },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  moodButton: {
    width: '28%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 12, marginTop: 4, color: Colors.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginVertical: 12 },
  factorsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  factorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    margin: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  factorButtonSelected: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  factorText: { fontSize: 13, color: Colors.textSecondary },
  factorTextSelected: { color: 'white', fontWeight: '500' },
  journalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  voiceActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  voiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  voiceButtonActive: { backgroundColor: '#E0F2FE' },
  voiceButtonIcon: { fontSize: 18, marginRight: 6 },
  voiceButtonText: { color: Colors.textSecondary },
  analyzeButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  analyzeButtonText: { color: 'white', fontWeight: '600', fontSize: 12 },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: { backgroundColor: Colors.disabled },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default MoodLogScreen;
