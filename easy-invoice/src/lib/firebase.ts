import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = initializeApp(
  isFirebaseConfigured
    ? firebaseConfig
    : { apiKey: "demo-api-key", projectId: "easy-invoice-demo", appId: "demo-app-id" },
);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Optional email-sending Cloud Function endpoint. Left unset by default —
// the app must never claim an email was sent unless this is configured
// and the function call actually succeeds.
export const sendEmailFunctionUrl = import.meta.env.VITE_SEND_EMAIL_FUNCTION_URL as string | undefined;
export const isEmailSendingConfigured = Boolean(sendEmailFunctionUrl);

const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}
