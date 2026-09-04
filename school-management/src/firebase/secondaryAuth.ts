import { getApps, initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { app as primaryApp } from './config';

/**
 * A second, throwaway Firebase App instance pointed at the same project.
 *
 * Creating a staff account (teacher/admin) from the client SDK normally
 * signs the *current* admin out and into the new account. Running
 * createUserWithEmailAndPassword against a secondary app instance avoids
 * that: the admin's primary session is untouched, and the secondary app
 * (with its brand-new user session) is torn down immediately after.
 */
export function getSecondaryAuth() {
  if (!primaryApp) throw new Error('Firebase is not configured.');
  const name = 'secondary';
  const existing = getApps().find((a) => a.name === name);
  const secondaryApp: FirebaseApp = existing ?? initializeApp(primaryApp.options, name);
  return { auth: getAuth(secondaryApp), app: secondaryApp };
}

export async function disposeSecondaryApp(app: FirebaseApp) {
  await deleteApp(app);
}
