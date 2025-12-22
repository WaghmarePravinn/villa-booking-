
// Fix: Use named imports for "firebase/app" to resolve property non-existence errors in the modular SDK.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Note: If you have a real Firebase project, replace these values.
// The app will fallback to localStorage if this configuration is invalid or permissions are denied.
const firebaseConfig = {
  apiKey: "DEMO_KEY_PLACEHOLDER",
  authDomain: "peak-stay-destination.firebaseapp.com",
  projectId: "peak-stay-destination",
  storageBucket: "peak-stay-destination.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000"
};

// Fix: Singleton pattern for Firebase App initialization using modular SDK methods.
// Using getApps() and getApp() directly from named exports as required by the modular SDK.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
