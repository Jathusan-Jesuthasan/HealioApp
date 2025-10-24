import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../../config/api';

export default function OnboardingWizard({ navigation, route }) {
  const role = route?.params?.role || 'youth';
  const returnTo = route?.params?.returnTo || 'Signup';

  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/api/auth/questions?role=${role}`);
        setQuestions(res.data.questions || []);
      } catch (err) {
        console.warn('Could not load onboarding questions', err.message || err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [role]);

  const current = questions[step];

  const setAnswerForCurrent = (value) => {
    if (!current) return;
    setAnswers(prev => ({ ...prev, [current._id || `q${step}`]: value }));
  };

  const handleFinish = () => {
    // return answers to Signup screen
    navigation.navigate(returnTo, { onboardingAnswers: answers });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>A few quick questions</Text>
        <Text style={styles.subtitle}>Help us personalize your experience — it only takes a moment.</Text>
      </View>

      {questions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>No questions available right now.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Question {step + 1} of {questions.length}</Text>
          </View>

          <View style={styles.questionWrap}>
            <Text style={styles.question}>{current.text}</Text>

            {current.type === 'mcq' ? (
              <View style={{ marginTop: 12 }}>
                {current.options.map((opt, idx) => {
                  const selected = answers[current._id] === opt;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.option, selected && styles.optionSelected]}
                      onPress={() => setAnswerForCurrent(opt)}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.inputContainer]}> 
                <TextInput
                  style={styles.input}
                  placeholder="Your answer"
                  value={answers[current._id] || ''}
                  onChangeText={(t) => setAnswerForCurrent(t)}
                />
              </View>
            )}
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              disabled={step === 0}
              onPress={() => setStep(s => Math.max(0, s - 1))}
              style={[styles.controlBtn, step === 0 && styles.controlDisabled]}
            >
              <Text style={styles.controlText}>Back</Text>
            </TouchableOpacity>

            {step < questions.length - 1 ? (
              <TouchableOpacity
                onPress={() => setStep(s => Math.min(questions.length - 1, s + 1))}
                style={styles.controlBtnPrimary}
              >
                <Text style={styles.controlTextPrimary}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleFinish} style={styles.controlBtnPrimary}>
                <Text style={styles.controlTextPrimary}>Finish</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  header: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#2D3748' },
  subtitle: { color: '#6B7280', marginTop: 6 },
  card: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, marginTop: 12 },
  progressRow: { marginBottom: 8 },
  progressText: { color: '#718096' },
  questionWrap: {},
  question: { fontSize: 16, fontWeight: '700', color: '#2D3748' },
  option: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8, backgroundColor: '#fff' },
  optionSelected: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.06)' },
  optionText: { color: '#2D3748' },
  optionTextSelected: { color: '#10B981', fontWeight: '700' },
  inputContainer: { marginTop: 12, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12 },
  input: { height: 48, fontSize: 16, color: '#2D3748' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  controlBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  controlBtnPrimary: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#10B981' },
  controlText: { color: '#2D3748', fontWeight: '700' },
  controlTextPrimary: { color: '#fff', fontWeight: '700' },
  controlDisabled: { opacity: 0.5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  empty: { color: '#718096' },
});
