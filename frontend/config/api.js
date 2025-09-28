// frontend/config/api.js
import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

function guessBaseURL() {
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

  if (Platform.OS === "ios") return "http://localhost:5000";
  if (Platform.OS === "android") return "http://10.0.2.2:5000";

  // Manual LAN fallback
  return "http://192.168.1.163:5000";
}

const API = axios.create({
  baseURL: guessBaseURL() + "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// 🔹 Attach token to every request
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("userToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Debug logging
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = `${err?.config?.baseURL || ""}${err?.config?.url || ""}`;
    console.log("API error:", err?.message, "->", url);
    throw err;
  }
);

// ----------- API Calls ------------
export const getMoods = () => API.get("/moods");
export const addMood = (data) => API.post("/moods/add", data);
export const deleteMood = (id) => API.delete(`/moods/${id}`);
export const updateMood = (id, data) => API.put(`/moods/${id}`, data);

export default API;
