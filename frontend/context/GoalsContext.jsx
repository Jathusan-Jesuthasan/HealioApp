// frontend/context/GoalsContext.js
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const GoalsContext = createContext();

export function GoalsProvider({ children }) {
  const [goals, setGoals] = useState({
    sessionsPerWeek: 3,
    minutesPerDay: 20,
  });

  // Load saved goals
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("goals");
        if (raw) {
          const parsed = JSON.parse(raw);
          setGoals(parsed);
        }
      } catch (err) {
        console.log("⚠️ Failed to load goals:", err);
      }
    })();
  }, []);

  // Save new goals
  const saveGoals = async (newGoals) => {
    setGoals(newGoals);
    try {
      await AsyncStorage.setItem("goals", JSON.stringify(newGoals));
      console.log("✅ Goals saved:", newGoals);
    } catch (err) {
      console.log("⚠️ Failed to save goals:", err);
    }
  };

  return (
    <GoalsContext.Provider value={{ goals, setGoals, saveGoals }}>
      {children}
    </GoalsContext.Provider>
  );
}
