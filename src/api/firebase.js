import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDxEITlu72KfPd6zdY3mfzwBRX_MSCVNBs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'rehmat-lawnmowers.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'rehmat-lawnmowers',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'rehmat-lawnmowers.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '646042897022',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:646042897022:web:b736288663084fe8a6cf2f',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-N0J5LPXZEC'
};

// Initialize Firebase once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

