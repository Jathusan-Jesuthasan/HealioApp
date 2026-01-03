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
import { getEmotionEmoji } from '../../utils/emotionEmoji';

/* ---------------- Funny Message Helpers ---------------- */
const funnyMessages = {
  Happy: ['🌈 You’re basically a walking sunshine today!', '😎 Even the Wi-Fi can feel your positive vibes.'],
  Sad: ['😭 Sending virtual hugs... and maybe chocolate?', '🌧️ Even clouds need a break sometimes.'],
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
  const [loadingStep, setLoadingStep] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const moods = [
    { emoji: '😊', label: 'Happy', color: '#F59E0B' },
    { emoji: '😐', label: 'Neutral', color: '#4A90E2' },
    { emoji: '😔', label: 'Sad', color: '#64748B' },
    { emoji: '😡', label: 'Angry', color: '#EF4444' },
    { emoji: '😴', label: 'Tired', color: '#10B981' },
  ];

  const factors = [
    'Work','Exercise','Family','Hobbies','Finances','Sleep','Drink','Food',
    'Relationships','Education','Weather','Music','Travel','Health',
  ];

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
      const baseURL = Platform.OS === 'android'
        ? 'http://10.0.2.2:5000'
        : 'http://localhost:5000';

      let emotion = null;
      let confidence = null;
      let confPct = null;
      let mappedMood = null;

      try {
        const { data } = await axios.post(
          `${baseURL}/api/analyze-emotion`,
          { text: journalText },
          { headers: { 'Content-Type': 'application/json' } }
        );
        emotion = data?.emotion || null;
        confidence = data?.confidence || null;
        confPct = typeof confidence === 'number' ? Math.round(confidence * 100) : null;
        mappedMood = data?.mappedMood || null;
      } catch {}

      const finalMood = mappedMood || selectedMood.label || 'Neutral';
      const joke = getFunnyLine(finalMood);
      const resultEmoji = getEmotionEmoji(emotion, finalMood, selectedMood?.emoji);

      setLoadingStep('saving');

      await axios.post(
        `${baseURL}/api/moodlogs/add`,
        { mood: finalMood, factors: selectedFactors, journal: journalText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigation.navigate('Profile', {
        screen: 'MoodResult',
        params: { emoji: resultEmoji, sentiment: finalMood, emotion, confidence: confPct, funnyComment: joke, note: journalText },
      });
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  /* ---------------- Animations ---------------- */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: '100%', alignItems: 'center' }}>
            <View style={styles.card}>
              <Text style={styles.title}>How are you feeling today?</Text>

              <View style={styles.moodGrid}>
                {moods.map((mood) => (
                  <TouchableOpacity
                    key={mood.label}
                    style={[
                      styles.moodButton,
                      selectedMood?.label === mood.label && {
                        backgroundColor: hexToRgba(mood.color),
                        borderColor: mood.color,
                      },
                    ]}
                    onPress={() => setSelectedMood(mood)}
                    activeOpacity={0.85}>
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={styles.moodLabel}>{mood.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>What’s affecting your mood?</Text>
              <View style={styles.factorsContainer}>
                {factors.map((factor) => (
                  <TouchableOpacity
                    key={factor}
                    style={[
                      styles.factorChip,
                      selectedFactors.includes(factor) && styles.factorChipSelected,
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

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}>
                  <Text style={styles.submitText}>
                    {loadingStep === 'analyzing'
                      ? '🧠 AI is generating your insight...'
                      : loadingStep === 'saving'
                      ? '💾 Saving your mood log...'
                      : 'Log Mood & Continue'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },

  card: {
    backgroundColor: Colors.card,
    margin: 12,
    padding: 16,
    borderRadius: 14,
    elevation: 2,
    alignSelf: 'center',
    width: '92%',
    maxWidth: 420,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },

  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  moodButton: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },

  moodEmoji: { fontSize: 26 },
  moodLabel: { fontSize: 12, marginTop: 4, color: Colors.textSecondary },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginVertical: 10,
  },

  factorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },

  factorChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    margin: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  factorChipSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },

  factorText: { fontSize: 12, color: Colors.textSecondary },
  factorTextSelected: { color: 'white', fontWeight: '500' },

  journalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 12,
    textAlignVertical: 'top',
  },

  submitButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },

  submitDisabled: { opacity: 0.7 },

  submitText: { color: 'white', fontSize: 15, fontWeight: '600' },
});

export default MoodLogScreen;
