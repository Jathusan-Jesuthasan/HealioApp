// frontend/src/config/api.js
import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Picks the right base URL:
 * - Android emulator -> http://10.0.2.2:5000
 * - Physical device (Expo Go) -> http://<your-computer-LAN-ip>:5000
 * - iOS simulator -> http://localhost:5000
 */
function guessBaseURL() {
  // Android emulator special alias for host machine
  if (Platform.OS === "android") return "http://10.0.2.2:5000";

  // Try to infer LAN IP from Expo hostUri (for physical devices)
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.hostUri;

  if (hostUri && hostUri.includes(":")) {
    const host = hostUri.split(":")[0]; // e.g., "192.168.1.23"
    return `http://${host}:5000`;
  }

  // Fallbacks
  return Platform.OS === "ios" ? "http://localhost:5000" : "http://10.0.2.2:5000";
}

const BASE_URL = guessBaseURL();

const API = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Optional: helpful logging
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = `${err?.config?.baseURL || ""}${err?.config?.url || ""}`;
    console.log("API error:", err?.message, "->", url);
    throw err;
  }
);

export default API;
