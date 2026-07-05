import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

let auth = null;
let googleProvider = null;
let facebookProvider = null;

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  facebookProvider = new FacebookAuthProvider();
} else {
  console.warn(
    "Firebase is not configured (missing VITE_FIREBASE_* env vars). Auth features are disabled until you add them to a .env file — see .env.example."
  );
}

const requireAuth = () => {
  if (!auth) {
    throw new Error("Authentication is not configured yet. Add your Firebase credentials to a .env file.");
  }
  return auth;
};

export const signInWithGoogle = () => signInWithPopup(requireAuth(), googleProvider);
export const signInWithFacebook = () => signInWithPopup(requireAuth(), facebookProvider);
export const signUpWithEmail = (email, password) => createUserWithEmailAndPassword(requireAuth(), email, password);
export const signInWithEmail = (email, password) => signInWithEmailAndPassword(requireAuth(), email, password);
export const logOut = () => signOut(requireAuth());

export const subscribeToAuthChanges = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
