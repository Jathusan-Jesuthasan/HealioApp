// frontend/config/firebaseConfig.js

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { getFirestore } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyA1gJx67UkCQin2SkmhcKpumeZTa140hCE",
  authDomain: "healio-4c32e.firebaseapp.com",
  projectId: "healio-4c32e",
  storageBucket: "healioapp.appspot.com",
  messagingSenderId: "462500880660",
  appId: "1:462500880660:android:8fac52d481c03fa292a201",
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
const firestore = getFirestore(app);

// --- Exports ---
export { app, auth, googleProvider, db, firestore, ref, onValue, set };
