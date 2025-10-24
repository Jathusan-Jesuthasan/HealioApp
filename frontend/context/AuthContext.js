// frontend/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebaseConfig";
import api from "../config/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // Youth / Trusted
  const [loading, setLoading] = useState(true);
  const [authType, setAuthType] = useState(null); // 'backend' or 'firebase'

  // ✅ Check authentication state persistence
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const role = await AsyncStorage.getItem("userRole");
      const authType = await AsyncStorage.getItem("authType");
      
      if (token && authType === 'backend') {
        setUserToken(token);
        setUserRole(role);
        setAuthType('backend');
        // Verify token is still valid by making a test request
        try {
          const { data } = await api.get("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(data);
        } catch (err) {
          // Token is invalid, clear it
          await AsyncStorage.multiRemove(["userToken", "userRole", "authType"]);
          setUserToken(null);
          setUserRole(null);
          setUser(null);
          setAuthType(null);
        }
      } else if (authType === 'firebase') {
        // Check Firebase auth state
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            const token = await firebaseUser.getIdToken();
            setUser(firebaseUser);
            setUserToken(token);
            setAuthType('firebase');
            const role = await AsyncStorage.getItem("userRole");
            if (role) setUserRole(role);
          } else {
            setUser(null);
            setUserToken(null);
            setAuthType(null);
          }
          setLoading(false);
        });
        return unsubscribe;
      }
    } catch (err) {
      console.error("Auth state check error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Backend Email/Password Login
  const loginWithEmail = async (email, password, role = "Youth") => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      
      await AsyncStorage.setItem("userToken", data.token);
      await AsyncStorage.setItem("userRole", data.role);
      await AsyncStorage.setItem("authType", "backend");
      setUser(data);
      setUserToken(data.token);
      setUserRole(data.role);
      setAuthType("backend");
      console.log("✅ Logged in with backend:", data.email);
    } catch (err) {
      console.error("Email login error:", err.response?.data?.message || err.message);
      throw err;
    }
  };

  // ✅ Firebase Google Sign-In
  const loginWithGoogle = async (role = "Youth") => {
    try {
      // For now, we'll use a mock Google login
      // In production, you would implement proper Google Sign-In for React Native
      const mockUser = {
        uid: "google_user_" + Date.now(),
        email: "user@gmail.com",
        displayName: "Google User",
        photoURL: "https://via.placeholder.com/150",
        getIdToken: async () => "mock_google_token_" + Date.now()
      };
      
      // Register/login with backend using Google info
      const { data } = await api.post("/api/auth/google", {
        googleId: mockUser.uid,
        email: mockUser.email,
        name: mockUser.displayName,
        avatarUrl: mockUser.photoURL,
        role: role
      });
      
      await AsyncStorage.setItem("userToken", data.token);
      await AsyncStorage.setItem("userRole", data.role);
      await AsyncStorage.setItem("authType", "backend");
      setUser(data);
      setUserToken(data.token);
      setUserRole(data.role);
      setAuthType("backend");
      console.log("✅ Google login successful");
      return data;
    } catch (err) {
      console.error("Google login error:", err.message);
      throw err;
    }
  };

  // ✅ Sign out completely
  const signOut = async () => {
    try {
      if (authType === 'firebase') {
        await firebaseSignOut(auth);
      }
      await AsyncStorage.multiRemove(["userToken", "userRole", "authType"]);
      setUser(null);
      setUserToken(null);
      setUserRole(null);
      setAuthType(null);
      console.log("🚪 Logged out successfully");
    } catch (e) {
      console.error("Error signing out:", e.message);
    }
  };

  // ✅ Expose AuthContext values
  return (
    <AuthContext.Provider
      value={{
        user,
        userToken,
        userRole,
        authType,
        loading,
        setUserRole,
        loginWithEmail,
        loginWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
