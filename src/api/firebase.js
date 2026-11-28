import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  disableNetwork,
  setDoc as fsSetDoc,
  deleteDoc as fsDeleteDoc,
  getDocs as fsGetDocs,
  getDocsFromServer as fsGetDocsFromServer,
  getDoc as fsGetDoc,
  getDocFromServer as fsGetDocFromServer,
  onSnapshot as fsOnSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Master cloud toggle: set to `true` for live Firebase Cloud sync, or `false` for instant Local Mode.
export const CLOUD_SYNC_ENABLED = true;

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

// Initialize Firestore with robust multi-tab offline persistence
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch {
  db = getFirestore(app);
}

if (!CLOUD_SYNC_ENABLED) {
  disableNetwork(db).catch(() => {});
}

// Guarded Firestore helpers: force live server reads when online so remote deletions
// never get masked by stale IndexedDB persistent cache, and short-circuit when Cloud is paused.
export const setDoc = (...args) => (CLOUD_SYNC_ENABLED ? fsSetDoc(...args) : Promise.resolve());
export const deleteDoc = (...args) => (CLOUD_SYNC_ENABLED ? fsDeleteDoc(...args) : Promise.resolve());
export const getDocs = async (...args) => {
  if (!CLOUD_SYNC_ENABLED) {
    return { empty: true, docs: [], size: 0, metadata: { fromCache: true } };
  }
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  if (isOnline) {
    try {
      return await fsGetDocsFromServer(...args);
    } catch {
      // Fall back to persistent cache if offline or unreachable
    }
  }
  return fsGetDocs(...args);
};
export const getDoc = async (...args) => {
  if (!CLOUD_SYNC_ENABLED) {
    return { exists: () => false, data: () => undefined };
  }
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  if (isOnline) {
    try {
      return await fsGetDocFromServer(...args);
    } catch {
      // Fall back to persistent cache if offline or unreachable
    }
  }
  return fsGetDoc(...args);
};
export const onSnapshot = (...args) => (CLOUD_SYNC_ENABLED ? fsOnSnapshot(...args) : () => {});
export const syncWithTimeout = (promise, ms = 1200) =>
  CLOUD_SYNC_ENABLED ? Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]) : Promise.resolve();

export { db };
export const auth = getAuth(app);
export default app;

