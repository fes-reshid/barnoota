import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Visiting /demo sets this flag (see src/pages/DemoEntry.tsx) to force the
// whole app into demo mode for that browser even though real Firebase
// credentials ARE configured — so anyone can be handed a link that lets
// them click through the entire real app (every module, every role) against
// safe local data, with zero risk to real school data. Cleared by the "Exit
// demo" banner (see DemoModeBanner.tsx).
const FORCE_DEMO_KEY = 'sms:forceDemoMode';

export function isForcedDemoMode(): boolean {
  try {
    return localStorage.getItem(FORCE_DEMO_KEY) === '1';
  } catch {
    return false;
  }
}

export function enterForcedDemoMode(): void {
  localStorage.setItem(FORCE_DEMO_KEY, '1');
}

export function exitForcedDemoMode(): void {
  localStorage.removeItem(FORCE_DEMO_KEY);
}

// The app runs in "demo mode" (localStorage-backed data + mock auth)
// whenever Firebase credentials have not been supplied, OR when forced on
// via /demo above. This lets the UI be fully functional out of the box,
// while every data access point is written against the same repository
// interface so switching to a real Firebase project only requires setting
// the VITE_FIREBASE_* env vars.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
) && !isForcedDemoMode();

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Persistent local cache (IndexedDB): once a document has been fetched,
  // later visits read it from disk immediately while Firestore refreshes it
  // over the network in the background, instead of every navigation paying
  // a full round trip. persistentMultipleTabManager keeps multiple open
  // tabs sharing one cache instead of fighting over it.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    // Firestore's default connection looks like a long-lived WebSocket,
    // which some corporate/school networks (proxies that do TLS
    // inspection, strict firewalls) silently hang instead of blocking
    // outright — the app loads, but no data ever arrives. This detects
    // that case automatically and falls back to plain HTTP long-polling,
    // which passes through those networks normally. Has no effect on
    // networks where the default connection already works fine.
    experimentalAutoDetectLongPolling: true,
    // Several forms in this app build a record with optional fields left
    // as `undefined` when not filled in (e.g. a new admin's phone number).
    // Firestore rejects `undefined` outright rather than just omitting the
    // field, which otherwise surfaces as a confusing "unsupported field
    // value" error on save. Treat undefined the same as "don't write this
    // field" everywhere, instead of requiring every call site to strip it.
    ignoreUndefinedProperties: true,
  });
  storage = getStorage(app);
}

export { app, auth, db, storage };
