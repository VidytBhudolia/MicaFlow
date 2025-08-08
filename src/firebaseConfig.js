// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration using environment variables (recommended for production)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCxUGMjwCqamuuZsUzLkNsyd0Z9c-8x_pM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "micaflow-bhu.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "micaflow-bhu",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "micaflow-bhu.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "248902874197",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:248902874197:web:d4ff7c5b7ddf756d4b10dc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-8Q5S8PSRJS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
// Enable IndexedDB persistence (best-effort)
enableIndexedDbPersistence(db).catch((err) => {
  console.warn('Firestore persistence not enabled:', err?.code || err);
});

const auth = getAuth(app);
// Ensure we are authenticated (works with AUTH-based rules)
onAuthStateChanged(auth, (user) => {
  if (user) console.log('Signed in as', user.uid);
});
signInAnonymously(auth).catch((e) => console.error('Anon sign-in failed', e));

const analytics = getAnalytics(app);

// Export Firebase services for use in other parts of the app
export { app, db, auth, analytics };
export default app;
