// frontend/config/api.js
import axios from "axios";
import { Platform } from "react-native";

const getBaseURL = () => {
  // 1️⃣ Try environment variable first (optional)
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // 2️⃣ Platform-specific detection
  if (Platform.OS === "android") return "http://10.0.2.2:5000";       // Android emulator
  if (Platform.OS === "ios") return "http://127.0.0.1:5000";          // iOS simulator

  // 3️⃣ Web (running in browser on same machine) — use localhost by default
  if (Platform.OS === "web") return "http://localhost:5000";

  // 3️⃣ Web / physical device — replace with your machine's LAN IP when testing on a phone.
  // Using the IP you pasted from ipconfig (Wi-Fi): 192.168.1.5
  return "http://192.168.1.5:5000";  // 🔄 Your machine's IPv4 address for device testing
};

export const BASE_URL = getBaseURL();
console.log("🌐 Using API base URL:", BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

// Optional: auto-log errors for easier debugging
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === "ECONNABORTED") console.warn("⏱️ API Timeout:", err.config.url);
    else if (err.message.includes("Network Error"))
      console.warn("🌐 Network Error – check backend/IP");
    return Promise.reject(err);
  }
);

export default api;
