// frontend/src/config/api.js
import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

function guessBaseURL() {
  // ✅ Web (browser)
  if (Platform.OS === "web") {
    const host = window.location.hostname; // e.g., localhost or 192.168.x.x
    return `http://${host}:5000`;
  }

  // ✅ Try to detect Expo physical device (hostUri present when running on LAN)
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.hostUri;

  if (hostUri && hostUri.includes(":")) {
    const host = hostUri.split(":")[0]; // e.g., 192.168.1.163
    return `http://${host}:5000`;
  }

  // ✅ iOS Simulator
  if (Platform.OS === "ios") return "http://localhost:5000";

  // ✅ Android Emulator (only if no hostUri)
  if (Platform.OS === "android") return "http://10.0.2.2:5000";

  // ✅ Manual fallback to your LAN IP
  return "http://192.168.1.163:5000";
}

const BASE_URL = guessBaseURL();

const API = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Debugging helper
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = `${err?.config?.baseURL || ""}${err?.config?.url || ""}`;
    console.log("API error:", err?.message, "->", url);
    throw err;
  }
);

export default API;
