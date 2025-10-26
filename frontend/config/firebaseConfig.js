// frontend/config/firebaseConfig.js

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { initializeFirestore } from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyA1gJx67UkCQin2SkmhcKpumeZTa140hCE",
  authDomain: "healio-4c32e.firebaseapp.com",
  projectId: "healio-4c32e",
  storageBucket: "healio-4c32e.firebasestorage.app",
  messagingSenderId: "462500880660",
  appId: "1:462500880660:web:f993ff690a3cce7492a201",
  databaseURL: "https://healio-4c32e-default-rtdb.firebaseio.com",
  measurementId: "G-0D5YSNFQP9",
};

// --- Initialize Firebase App ---
const app = initializeApp(firebaseConfig);

// --- Setup Auth ---
const auth = getAuth(app);

// --- Google Auth Provider ---
const googleProvider = new GoogleAuthProvider();

// --- Realtime Database ---
const db = getDatabase(app);

// Firestore (for messaging, etc.)
const firestore = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

// --- Exports ---
export { app, auth, googleProvider, db, firestore, ref, onValue, set };
