// /frontend/services/analytics.js
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

//
// ---------- Base URL detection (emulator, device, web) ----------
//
function guessBaseURL() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000'; // Android emulator
  if (Platform.OS === 'ios') return 'http://127.0.0.1:5000'; // iOS simulator

  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.hostUri;

  if (hostUri && hostUri.includes(':')) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000`;
  }

  return 'http://localhost:5000'; // default fallback
}

//
// ---------- Axios instance ----------
//
const api = axios.create({
  baseURL: `${guessBaseURL()}/api`,
  timeout: 15000,
});

//
// ---------- Token Interceptor ----------
//
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    console.warn('⚠️ No token found in AsyncStorage');
  }
  return config;
});

//
// ---------- Helper: mood → numeric scale ----------
//
const moodToScore = (mood) => {
  switch (mood) {
    case 'Happy': return 5;
    case 'Neutral': return 3;
    case 'Sad': return 2;
    case 'Angry': return 1;
    case 'Tired': return 2;
    default: return 3;
  }
};

//
// ---------- Fallback: compute analytics locally ----------
//
async function computeLocalDashboard(logs = []) {
  if (!logs.length) {
    return {
      mindBalanceScore: 0,
      progressMilestone: 0,
      weeklyMoods: Array(7).fill(0),
      aiRiskDetected: false,
      riskPatterns: [],
      trustedPersonStatus: 'inactive',
      wellnessStreak: 0,
      aiSummary: null,
    };
  }

  const scores = logs.map((l) => moodToScore(l.mood));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Weekly averages (Mon–Sun)
  const dailyScores = {};
  logs.forEach((log) => {
    const d = new Date(log.createdAt).getDay(); // 0–6
    const idx = d === 0 ? 6 : d - 1;
    if (!dailyScores[idx]) dailyScores[idx] = [];
    dailyScores[idx].push(moodToScore(log.mood));
  });

  const weeklyMoods = Array(7).fill(0);
  Object.keys(dailyScores).forEach((idx) => {
    const arr = dailyScores[idx];
    weeklyMoods[idx] = arr.reduce((a, b) => a + b, 0) / arr.length;
  });

  // AI Risk detection
  let aiRiskDetected = false;
  let streak = 0;
  weeklyMoods.forEach((v) => {
    if (v > 0 && v < 3) {
      streak++;
      if (streak >= 3) aiRiskDetected = true;
    } else streak = 0;
  });

  const happyCount = logs.filter((l) => l.mood === 'Happy').length;
  const progressMilestone = +(happyCount / scores.length).toFixed(2);

  // Wellness streak (consecutive days ≥3)
  let wellnessStreak = 0;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (moodToScore(logs[i].mood) >= 3) wellnessStreak++;
    else break;
  }

  const riskPatterns = aiRiskDetected
    ? [{ type: 'Mood Decline', message: '3+ consecutive days of low mood detected.' }]
    : [];

  const aiSummary = aiRiskDetected
    ? {
        risks: [
          { category: 'Mood Decline', message: '3+ consecutive low moods detected.', score: 70 },
        ],
        suggestion: 'Try journaling, breathing, or reach out to your trusted contact.',
      }
    : {
        risks: [{ category: 'Stable Mood', message: 'No concerning mood fluctuations.', score: 90 }],
        suggestion: 'Keep up your positive habits 💚',
      };

  return {
    mindBalanceScore: Math.round(avg * 20),
    progressMilestone,
    weeklyMoods: weeklyMoods.map((v) => Math.round(v)),
    aiRiskDetected,
    riskPatterns,
    trustedPersonStatus: 'inactive',
    wellnessStreak,
    aiSummary,
  };
}

//
// ---------- MAIN API METHODS ----------
//

// ✅ Dashboard Summary
export async function getDashboard(range = '7d') {
  try {
    // Try backend-provided analytics (preferred)
    const { data } = await api.get('/dashboard', { params: { range } });
    if (data && data.mindBalanceScore !== undefined) return data;

    // If backend doesn’t support /dashboard, fallback to local compute
    console.log('⚠️ /dashboard not available — computing locally...');
    const { data: logs } = await api.get('/moodlogs');
    return await computeLocalDashboard(logs);
  } catch (err) {
    console.warn('Dashboard error, computing locally:', err.message);
    try {
      const { data: logs } = await api.get('/moodlogs');
      return await computeLocalDashboard(logs);
    } catch (e2) {
      console.error('Local fallback also failed:', e2.message);
      throw new Error('Failed to fetch dashboard data');
    }
  }
}

// ✅ AI Risk Analysis (backend handles Gemini or ML model)
export async function getRiskAnalysis(moodLogs = []) {
  const { data } = await api.post('/ai/risk-analysis', { moodLogs });
  return data; // expects { risks, suggestion, history }
}

// ✅ Fetch AI analysis history
export async function getRiskHistory() {
  const { data } = await api.get('/ai/risk-history');
  return data; // expects an array of previous AI analyses
}

// ✅ Send weekly email / report summary (optional)
export async function sendWeeklyReport() {
  const { data } = await api.post('/ai/send-report');
  return data; // expects { success, message }
}
