import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const GoalsContext = createContext();

export function GoalsProvider({ children }) {
  const [goals, setGoals] = useState({
    sessionsPerWeek: 3,
    minutesPerDay: 20,
  });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("goals");
        if (raw) setGoals(JSON.parse(raw));
      } catch (err) {
        console.log("Failed to load goals", err);
      }
    })();
  }, []);

  const saveGoals = async (newGoals) => {
    setGoals(newGoals);
    try {
      await AsyncStorage.setItem("goals", JSON.stringify(newGoals));
    } catch (err) {
      console.log("Failed to save goals", err);
    }
  };

  return (
    <GoalsContext.Provider value={{ goals, saveGoals }}>
      {children}
    </GoalsContext.Provider>
  );
}
