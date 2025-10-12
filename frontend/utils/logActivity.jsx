// frontend/utils/logActivity.jsx
import api from "../config/api";
import { showSyncedToast } from "./toastUtils";

export const logActivity = async (type, name, duration, userId, moods = {}) => {
  try {
    const res = await api.post("/api/activities/add", {
      userId,
      type,
      name,
      duration,
      moodBefore: moods.before,
      moodAfter: moods.after,
    });

    console.log("✅ Activity logged:", res.data);
    showSyncedToast("💪 Activity synced to dashboard!");
  } catch (err) {
    console.error("🚨 logActivity error:", err);
  }
};
