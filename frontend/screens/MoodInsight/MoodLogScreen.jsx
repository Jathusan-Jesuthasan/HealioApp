import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import { Colors } from '../../utils/Colors';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

/* ---------------- Funny Message Helpers ---------------- */
const funnyMessages = {
  Happy: [
    '🌈 You’re basically a walking sunshine today!',
    '😎 Even the Wi-Fi can feel your positive vibes.',
  ],
  Sad: [
    '😭 Sending virtual hugs... and maybe chocolate?',
    '🌧️ Even clouds need a break sometimes.',
  ],
  Angry: ['😡 Breathe in… breathe out… coffee helps too!', '🔥 Oops, someone woke up spicy today!'],
  Tired: ['😴 Power-nap protocol initiated…', '☕ Caffeine levels dangerously low!'],
  Neutral: ['😐 Meh-mode activated.', '🤔 Not bad, not great — just existing.'],
};

function getFunnyLine(mood) {
  const lines = funnyMessages[mood] || funnyMessages.Neutral;
  return lines[Math.floor(Math.random() * lines.length)];
}

/* ---------------- Main Component ---------------- */
const MoodLogScreen = () => {
  const navigation = useNavigation();

  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [journalText, setJournalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(null); // "analyzing" | "saving" | null

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const moods = [
    { emoji: '😊', label: 'Happy', color: '#F59E0B' },
    { emoji: '😐', label: 'Neutral', color: '#4A90E2' },
    { emoji: '😔', label: 'Sad', color: '#64748B' },
    { emoji: '😡', label: 'Angry', color: '#EF4444' },
    { emoji: '😴', label: 'Tired', color: '#10B981' },
  ];

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

  // Convert HEX → RGBA
  const hexToRgba = (hex, alpha = 0.12) => {
    const match = hex.replace('#', '').match(/.{1,2}/g);
    if (!match) return hex;
    const [r, g, b] = match.map((x) => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const toggleFactor = (factor) => {
    setSelectedFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    );
  };

  /* ---------------- Submit Handler ---------------- */
  const handleSubmit = async () => {
    if (!selectedMood) {
      Alert.alert('Select Mood', 'Please choose your mood before submitting.');
      return;
    }
    if (!journalText.trim()) {
      Alert.alert('Write about it', 'Please add some text to analyze.');
      return;
    }

    try {
      setLoading(true);
      setLoadingStep('analyzing');

      const token = await AsyncStorage.getItem('userToken');
      const baseURL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

      // 1️⃣ Analyze Emotion using backend
      let emotion = null;
      let confidence = null;
      let confPct = null;
      let mappedMood = null;

      try {
        const { data } = await axios.post(
          `${baseURL}/api/analyze-emotion`,
          { text: journalText },
          { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
        );
        emotion = data?.emotion || null;
        confidence = data?.confidence || null;
        confPct = typeof confidence === 'number' ? Math.round(confidence * 100) : null;
        mappedMood = data?.mappedMood || null;
      } catch (err) {
        console.error('❌ Emotion analyze error:', err.response?.data || err.message);
      }

      // 2️⃣ Final Mood + funny message
      const finalMood = mappedMood || selectedMood.label || 'Neutral';
      const joke = getFunnyLine(finalMood);

      // 3️⃣ Save to backend
      if (!token) {
        Alert.alert('Auth Error', 'You are not logged in.');
        return;
      }

      setLoadingStep('saving');

      await axios.post(
        `${baseURL}/api/moodlogs/add`,
        {
          mood: finalMood,
          factors: selectedFactors,
          journal: journalText,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        }
      );

      // 4️⃣ Save locally
      try {
        const previous = JSON.parse(await AsyncStorage.getItem('localMoodLogs')) || [];
        const newEntry = {
          date: new Date().toISOString(),
          emoji: selectedMood.emoji,
          mood: finalMood,
          factors: selectedFactors,
          journal: journalText,
          funnyComment: joke,
          emotion,
          confidence: confPct,
        };
        await AsyncStorage.setItem('localMoodLogs', JSON.stringify([newEntry, ...previous]));
      } catch (err) {
        console.error('Local save error:', err);
      }

      // 5️⃣ Navigate to results (MoodResult is inside the Profile stack)
      navigation.navigate('Profile', {
        screen: 'MoodResult',
        params: {
          emoji: selectedMood.emoji,
          sentiment: finalMood,
          emotion,
          confidence: confPct,
          funnyComment: joke,
          note: journalText,
        },
      });
    } catch (error) {
      console.error('❌ Error saving mood:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to save mood log.');
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  /* ---------------- Pulse Animation ---------------- */
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [loading]);

  /* ---------------- UI ---------------- */
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

            {/* Mood Selection */}
            <View style={styles.moodContainer}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.label}
                  style={[
                    styles.moodButton,
                    selectedMood?.label === mood.label && {
                      backgroundColor: hexToRgba(mood.color, 0.12),
                      borderColor: mood.color,
                      transform: [{ scale: 1.05 }],
                    },
                  ]}
                  onPress={() => setSelectedMood(mood)}>
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Factors */}
            <Text style={styles.sectionTitle}>What’s affecting your mood?</Text>
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

            {/* Journal Input */}
            <Text style={styles.sectionTitle}>Write about it</Text>
            <TextInput
              style={styles.journalInput}
              multiline
              placeholder="Write about your day..."
              value={journalText}
              onChangeText={setJournalText}
            />

            {/* Submit Button */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedMood || loading) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedMood || loading}>
                <Text style={styles.submitButtonText}>
                  {loadingStep === 'analyzing'
                    ? '🧠 AI is generating your insight...'
                    : loadingStep === 'saving'
                      ? '💾 Saving your mood log...'
                      : loading
                        ? '⏳ Please wait...'
                        : 'Log Mood & Continue'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
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
  title: { fontSize: 20, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
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
