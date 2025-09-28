// frontend/services/analytics.js
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

//
// ---------- Base URL detection (emulator, device, web) ----------
//
function guessBaseURL() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000'; // Android emulator

  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.hostUri;

  if (hostUri && hostUri.includes(':')) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000`;
  }

  return 'http://localhost:5000'; // default for local dev
}

//
// ---------- Axios instance ----------
//
const api = axios.create({
  baseURL: `${guessBaseURL()}/api`, // root points to /api
  timeout: 15000,
});

//
// ---------- Token Interceptor ----------
//
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('No token found in storage');
  }
  return config;
});

//
// ---------- API Methods ----------
//

// ✅ Dashboard Summary (Mind Balance, Weekly Moods, Progress, Risk Flag)
export async function getDashboard(range = '7d') {
  const { data } = await api.get('/dashboard', { params: { range } });
  return data;
}

// ✅ AI Risk Analysis via backend (Gemini call happens server-side)
export async function getRiskAnalysis(moodLogs = []) {
  // We send moodLogs or any input to backend
  const { data } = await api.post('/ai/risk-analysis', { moodLogs });
  return data; // expects { riskLevel, suggestion, history }
}

// ✅ Fetch AI analysis history
export async function getRiskHistory() {
  const { data } = await api.get('/ai/risk-history');
  return data; // expects an array of previous AI analyses
}

// ✅ Trigger an immediate report send (optional)
export async function sendWeeklyReport() {
  const { data } = await api.post('/ai/send-report');
  return data; // expects { success: true/false, message }
}
