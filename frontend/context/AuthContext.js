// frontend/src/context/AuthContext.js
import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load token from storage on app start
  useEffect(() => {
    const loadToken = async () => {
      try {
        // 👉 For debugging: clear stored token once to force Welcome/Onboarding
        // ⚠️ Remove this line later once flow is confirmed working
        await AsyncStorage.removeItem("userToken");

        const token = await AsyncStorage.getItem("userToken");
        console.log("🔑 Loaded token from storage:", token);
        if (token) {
          setUserToken(token);
        }
      } catch (err) {
        console.error("Error loading token:", err);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);

  // 🔹 Sign In → Save token
  const signIn = async (token) => {
    try {
      await AsyncStorage.setItem("userToken", token);
      setUserToken(token);
      console.log("✅ Token saved, user signed in");
    } catch (err) {
      console.error("Error saving token:", err);
    }
  };

  // 🔹 Sign Out → Clear token
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      console.log("🚪 Token removed, user signed out");
    } catch (err) {
      console.error("Error removing token:", err);
    } finally {
      setUserToken(null);
    }
  };

  // 🔹 Context value
  return (
    <AuthContext.Provider
      value={{
        userToken,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
