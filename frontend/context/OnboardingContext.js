// frontend/context/OnboardingContext.js

import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const OnboardingContext = createContext();

export const OnboardingProvider = ({ children }) => {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [answers, setAnswers] = useState({
    age: "",
    gender: "",
    stressLevel: "",
    studyHours: "",
    role: "Youth", // default selection
  });

  /* ========================================
     Load stored onboarding data on mount
     ======================================== */
  useEffect(() => {
    (async () => {
      try {
        const storedFlag = await AsyncStorage.getItem("hasOnboarded");
        const storedAnswers = await AsyncStorage.getItem("onboardingAnswers");

        if (storedFlag === "true") setHasOnboarded(true);
        if (storedAnswers) setAnswers(JSON.parse(storedAnswers));
      } catch (err) {
        console.error("Error loading onboarding state:", err);
      }
    })();
  }, []);

  /* ========================================
     Mark onboarding as complete
     ======================================== */
  const markAsOnboarded = async (finalAnswers = {}) => {
    try {
      const merged = { ...answers, ...finalAnswers };
      await AsyncStorage.setItem("hasOnboarded", "true");
      await AsyncStorage.setItem("onboardingAnswers", JSON.stringify(merged));
      setAnswers(merged);
      setHasOnboarded(true);
    } catch (err) {
      console.error("Error saving onboarding data:", err);
    }
  };

  /* ========================================
     Reset onboarding (for testing / logout)
     ======================================== */
  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem("hasOnboarded");
      await AsyncStorage.removeItem("onboardingAnswers");
      setHasOnboarded(false);
      setAnswers({
        age: "",
        gender: "",
        stressLevel: "",
        studyHours: "",
        role: "Youth",
      });
    } catch (err) {
      console.error("Error resetting onboarding data:", err);
    }
  };

  const value = {
    hasOnboarded,
    answers,
    setAnswers,
    markAsOnboarded,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
