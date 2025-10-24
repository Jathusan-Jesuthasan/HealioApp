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
// Optional: Expo AuthSession Google provider (used if available)
import googleConfig from "../config/googleConfig";
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
        // normalize stored role to capitalized form
        if (role) {
          const r = role.toString().toLowerCase() === 'trusted' ? 'Trusted' : 'Youth';
          setUserRole(r);
        } else setUserRole(null);
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
      
  // normalize role
  const canonicalRole = data.role && data.role.toString().toLowerCase() === 'trusted' ? 'Trusted' : 'Youth';
  await AsyncStorage.setItem("userToken", data.token);
  await AsyncStorage.setItem("userRole", canonicalRole);
      await AsyncStorage.setItem("authType", "backend");
  setUser(data);
  setUserToken(data.token);
  setUserRole(canonicalRole);
      setAuthType("backend");
      console.log("✅ Logged in with backend:", data.email);
    } catch (err) {
      console.error("Email login error:", err.response?.data?.message || err.message);
      throw err;
    }
  };

  // ✅ Helper to set auth state from backend response (used after register / google)
  const setAuthFromBackend = async (data) => {
    try {
      const canonicalRole = data.role && data.role.toString().toLowerCase() === 'trusted' ? 'Trusted' : 'Youth';
      await AsyncStorage.setItem("userToken", data.token);
      await AsyncStorage.setItem("userRole", canonicalRole);
      await AsyncStorage.setItem("authType", "backend");
      // persist user object minimally
      await AsyncStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      setUserToken(data.token);
      setUserRole(canonicalRole);
      setAuthType("backend");
    } catch (err) {
      console.error("Error setting auth from backend:", err);
      throw err;
    }
  };

  // Convenience wrapper used by screens that expect a 'signIn(token, profile)' API
  // This builds a minimal backend-data object and delegates to setAuthFromBackend
  const signIn = async (token, profile = {}) => {
    try {
      const role = profile.role || profile.userRole || profile.roleName || 'Youth';
      const payload = { ...profile, token, role };
      await setAuthFromBackend(payload);
      return payload;
    } catch (err) {
      console.error('signIn wrapper failed:', err.message || err);
      throw err;
    }
  };

  // ✅ Refresh current user from backend (/api/users/me)
  const refreshUser = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return null;
      const { data } = await api.get("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data);
      return data;
    } catch (err) {
      console.warn("refreshUser failed:", err.message || err);
      return null;
    }
  };

  // ✅ Firebase Google Sign-In
  const loginWithGoogle = async (role = "Youth") => {
    // We can't reliably call AuthSession.startAsync from a non-component context.
    // Prefer using Firebase client-side flow (components use useGoogleAuth hook). Here we try to
    // use any existing Firebase authenticated user, otherwise fall back to backend/local mock.
    try {
      const firebaseUser = auth?.currentUser || null;

      if (firebaseUser) {
        // Use Firebase user token if available
        let tokenToUse = null;
        try {
          tokenToUse = await firebaseUser.getIdToken();
        } catch (tErr) {
          console.warn('Could not get firebase id token:', tErr?.message || tErr);
        }

        const profile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };

        // Attempt backend exchange; if backend unavailable, fallback to local payload
        try {
          const { data } = await api.post('/api/auth/google', {
            googleId: profile.uid,
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.photoURL,
            role,
          });

          try {
            await AsyncStorage.setItem('lastGoogleUser', JSON.stringify({ googleId: profile.uid, name: profile.name, email: profile.email, avatarUrl: profile.photoURL }));
          } catch (e) {
            console.warn('Could not persist lastGoogleUser:', e.message || e);
          }

          await setAuthFromBackend(data);
          return data;
        } catch (backendErr) {
          console.warn('Backend /api/auth/google unavailable, using firebase token locally:', backendErr?.message || backendErr);
          const fallbackPayload = {
            token: tokenToUse || `local-google-${Date.now()}`,
            role,
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.photoURL,
            uid: profile.uid,
          };
          await setAuthFromBackend(fallbackPayload);
          return fallbackPayload;
        }
      }
    } catch (err) {
      console.warn('loginWithGoogle encountered an error when checking firebase currentUser:', err?.message || err);
    }

    // If no firebase user, fall back to creating a mock local user and optionally calling backend
    try {
      const mockUser = {
        uid: 'google_user_' + Date.now(),
        email: 'user@gmail.com',
        displayName: 'Google User',
        photoURL: null,
      };

      try {
        const { data } = await api.post('/api/auth/google', {
          googleId: mockUser.uid,
          email: mockUser.email,
          name: mockUser.displayName,
          avatarUrl: mockUser.photoURL,
          role,
        });

        try {
          await AsyncStorage.setItem('lastGoogleUser', JSON.stringify({ googleId: mockUser.uid, name: mockUser.displayName, email: mockUser.email, avatarUrl: mockUser.photoURL }));
        } catch (e) {
          console.warn('Could not persist lastGoogleUser:', e.message || e);
        }

        await setAuthFromBackend(data);
        return data;
      } catch (backendErr) {
        // Backend unavailable — persist local payload
        const fallbackPayload = {
          token: `local-google-${Date.now()}`,
          role,
          email: mockUser.email,
          name: mockUser.displayName,
          avatarUrl: mockUser.photoURL,
          uid: mockUser.uid,
        };
        await setAuthFromBackend(fallbackPayload);
        return fallbackPayload;
      }
    } catch (err) {
      console.error('Google login fallback error:', err.message || err);
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
        signIn,
        loginWithEmail,
        loginWithGoogle,
        refreshUser,
        signOut,
        setAuthFromBackend,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
