// frontend/context/GoalsContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const GoalsContext = createContext();

const STORAGE_KEY = "goals";
const DEFAULT_GOALS = {
  sessionsPerWeek: 3,
  minutesPerDay: 20,
  updatedAt: 0,
};

// Normalises any persisted or incoming goal payload into a predictable shape
const normalizeGoals = (payload = {}, fallbackTimestamp = 0) => {
  const sessions = Number(payload.sessionsPerWeek);
  const minutes = Number(payload.minutesPerDay);

  let updated = payload.updatedAt;
  if (typeof updated === "string") {
    const parsed = Date.parse(updated);
    updated = Number.isNaN(parsed) ? undefined : parsed;
  }

  if (!Number.isFinite(updated)) {
    updated = fallbackTimestamp;
  }

  return {
    sessionsPerWeek: Number.isFinite(sessions) ? sessions : 0,
    minutesPerDay: Number.isFinite(minutes) ? minutes : 0,
    updatedAt: updated,
  };
};

export function GoalsProvider({ children }) {
  const [goals, setGoals] = useState(DEFAULT_GOALS);

  // Load saved goals
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setGoals(normalizeGoals(parsed, 0));
        }
      } catch (err) {
        console.log("⚠️ Failed to load goals:", err);
      }
    })();
  }, []);

  // Save new goals
  const saveGoals = useCallback(async (nextGoals, opts = {}) => {
    const { skipStorage = false } = opts;
    const normalized = normalizeGoals(nextGoals, Date.now());
    setGoals(normalized);

    try {
      if (!skipStorage) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        console.log("✅ Goals saved:", normalized);
      } else {
        console.log("ℹ️ Goals synced:", normalized);
      }
    } catch (err) {
      console.log("⚠️ Failed to save goals:", err);
    }
  }, []);

  return (
    <GoalsContext.Provider value={{ goals, setGoals, saveGoals }}>
      {children}
    </GoalsContext.Provider>
  );
}
