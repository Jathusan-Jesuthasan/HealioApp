import * as SecureStore from "expo-secure-store";

const KEY = "openai_api_key";

export async function saveApiKey(value) {
  if (!value) return;
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    // SecureStore is unavailable (e.g., web). Swallow so callers can handle via env vars.
  }
}

export async function loadApiKey() {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function deleteApiKey() {
  try {
    if (typeof SecureStore.deleteItemAsync === "function") {
      await SecureStore.deleteItemAsync(KEY);
    } else {
      await SecureStore.setItemAsync(KEY, "");
    }
  } catch {
    // suppress platform-specific errors so the caller can continue gracefully
  }
}