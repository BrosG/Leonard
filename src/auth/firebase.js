import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Current user state
let currentUser = null;
let idToken = null;

// Auth state listener
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    idToken = await user.getIdToken();
    // Sync user profile with backend
    try {
      await fetch("/api/user", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
    } catch (e) {
      console.warn("Could not sync user profile:", e);
    }
    window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user, idToken } }));
  } else {
    idToken = null;
    window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user: null, idToken: null } }));
  }
});

// Google Sign-In
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

// Phone Sign-In - Step 1: Send verification code
let confirmationResult = null;

export function setupRecaptcha(buttonId) {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
      size: "invisible",
      callback: () => {},
    });
  }
  return window.recaptchaVerifier;
}

export async function sendPhoneVerification(phoneNumber, recaptchaContainerId) {
  try {
    const appVerifier = setupRecaptcha(recaptchaContainerId);
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return true;
  } catch (error) {
    console.error("Phone verification error:", error);
    // Reset recaptcha on error
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    throw error;
  }
}

// Phone Sign-In - Step 2: Verify the code
export async function verifyPhoneCode(code) {
  if (!confirmationResult) throw new Error("No verification in progress");
  try {
    const result = await confirmationResult.confirm(code);
    return result.user;
  } catch (error) {
    console.error("Code verification error:", error);
    throw error;
  }
}

// Sign out
export async function logOut() {
  await signOut(auth);
  currentUser = null;
  idToken = null;
}

// Get current auth token for API calls
export async function getAuthToken() {
  if (!currentUser) return null;
  // Refresh if needed
  idToken = await currentUser.getIdToken();
  return idToken;
}

// Authenticated fetch wrapper
export async function authFetch(url, options = {}) {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export function getCurrentUser() {
  return currentUser;
}

export { auth };
