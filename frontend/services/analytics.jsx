// frontend/services/analytics.js
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// -------- Base URL detection (emulator, device, web) --------
function guessBaseURL() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';

  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.hostUri;

  if (hostUri && hostUri.includes(':')) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000`;
  }

  return 'http://localhost:5000';
}

// -------- Axios instance --------
const api = axios.create({
  baseURL: `${guessBaseURL()}/api`, // ✅ root `/api` instead of `/api/dashboard`
  timeout: 15000,
});

// -------- Token Interceptor --------
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

// -------- API Methods --------

// Dashboard Summary (Mind Balance, Weekly Moods, Progress, Risk Flag)
export async function getDashboard(range = '7d') {
  const { data } = await api.get('/dashboard', { params: { range } });
  return data;
}

// AI Risk Analysis (e.g., Gemini-based analysis of recent mood logs)
export async function getRiskAnalysis() {
  const { data } = await api.get('/dashboard/risk-analysis');
  return data;
}
