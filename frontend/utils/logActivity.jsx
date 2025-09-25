import AsyncStorage from "@react-native-async-storage/async-storage";

const LOG_KEY = "exerciseLogs";

export async function logActivity(activityName, duration = 0) {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const logs = raw ? JSON.parse(raw) : [];

    logs.push({
      name: activityName,
      ts: new Date().toISOString(),
      duration,
    });

    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(logs));
    console.log("✅ Logged activity:", activityName);
  } catch (err) {
    console.error("❌ Failed to log activity:", err);
  }
}
