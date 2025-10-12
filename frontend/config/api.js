// frontend/config/api.js
import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Picks the correct base URL automatically:
 * - Android emulator → http://10.0.2.2:5000
 * - Physical device (Expo Go) → http://<your-laptop-ip>:5000
 * - iOS simulator → http://localhost:5000
 * - Web → http://localhost:5000 or http://<your-ip>:5000
 */

function guessBaseURL() {
  if (Platform.OS === "android") return "http://10.0.2.2:5000";

  if (Platform.OS === "web") {
    const host = window.location.hostname;
    return `http://${host}:5000`;
  }

  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.hostUri;

  if (hostUri && hostUri.includes(":")) {
    const host = hostUri.split(":")[0];
    return `http://${host}:5000`;
  }

  return Platform.OS === "ios"
    ? "http://localhost:5000"
    : "http://10.0.2.2:5000";
}

// ✅ define and export the BASE_URL here
export const BASE_URL = guessBaseURL();

// ✅ axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ✅ Optional logging interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = `${err?.config?.baseURL || ""}${err?.config?.url || ""}`;
    console.log("🚨 API error:", err?.message, "->", url);
    throw err;
  }
);

export default api;
