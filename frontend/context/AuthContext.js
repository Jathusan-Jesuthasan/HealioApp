// frontend/src/context/AuthContext.js
import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from storage on app start
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (token) setUserToken(token);
      } catch (err) {
        console.error("Error loading token:", err);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);

  // ✅ signIn
  const signIn = async (token) => {
    try {
      await AsyncStorage.setItem("userToken", token);
      setUserToken(token);
    } catch (err) {
      console.error("Error saving token:", err);
    }
  };

  // ✅ signOut
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      setUserToken(null);
    } catch (err) {
      console.error("Error removing token:", err);
    }
  };

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
