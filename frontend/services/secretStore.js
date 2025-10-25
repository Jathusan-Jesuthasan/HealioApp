import * as SecureStore from "expo-secure-store";

const KEY = "openai_api_key";

export async function saveApiKey(value) {
  if (!value) return;
  await SecureStore.setItemAsync(KEY, value);
}

export async function loadApiKey() {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}
