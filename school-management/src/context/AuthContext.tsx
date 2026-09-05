import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  confirmPasswordReset as fbConfirmPasswordReset,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/firebase/config';
import { seedDemoData } from '@/lib/seed';
import { DEMO_SCHOOL_ID, usersRepo } from '@/lib/services';
import type { AppUser } from '@/types';

interface AuthContextValue {
  currentUser: AppUser | null;
  loading: boolean;
  schoolId: string;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_SESSION_KEY = 'sms:demoSession';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!isFirebaseConfigured) {
        await seedDemoData();
      }

      if (isFirebaseConfigured && auth) {
        return onAuthStateChanged(auth, async (fbUser) => {
          if (!fbUser) {
            if (!cancelled) {
              setCurrentUser(null);
              setLoading(false);
            }
            return;
          }
          // The user's profile document is keyed by their Firebase Auth uid
          // (see createStaffAccount / setById) so this is a single cheap
          // get() rather than a collection scan — which also lets Firestore
          // security rules allow "read your own profile" without exposing
          // the rest of the users collection.
          const match = await usersRepo.get(fbUser.uid);
          if (!cancelled) {
            setCurrentUser(match);
            setLoading(false);
          }
        });
      }

      // Demo mode: restore a previously "logged in" demo user, if any.
      const savedId = localStorage.getItem(DEMO_SESSION_KEY);
      if (savedId) {
        const users = await usersRepo.list(DEMO_SCHOOL_ID);
        const match = users.find((u) => u.id === savedId) ?? null;
        if (!cancelled) setCurrentUser(match);
      }
      if (!cancelled) setLoading(false);
      return undefined;
    }

    const unsubPromise = init();
    return () => {
      cancelled = true;
      unsubPromise.then((unsub) => unsub?.());
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      loading,
      // Falls back to the demo school only when nobody is signed in yet
      // (e.g. brief render before ProtectedRoute redirects to /login).
      // Every signed-in user's own schoolId drives what data they see.
      schoolId: currentUser?.schoolId ?? DEMO_SCHOOL_ID,

      async login(email, password) {
        if (isFirebaseConfigured && auth) {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const match = await usersRepo.get(cred.user.uid);
          if (!match) throw new Error('No profile found for this account. Contact your school admin.');
          setCurrentUser(match);
          return match;
        }

        // Demo mode: any password is accepted for the seeded demo accounts.
        if (password.length < 4) {
          throw new Error('Password must be at least 4 characters.');
        }
        const users = await usersRepo.list(DEMO_SCHOOL_ID);
        const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!match) throw new Error('No account found with that email.');
        localStorage.setItem(DEMO_SESSION_KEY, match.id);
        setCurrentUser(match);
        return match;
      },

      async logout() {
        if (isFirebaseConfigured && auth) {
          await fbSignOut(auth);
        } else {
          localStorage.removeItem(DEMO_SESSION_KEY);
        }
        setCurrentUser(null);
      },

      async requestPasswordReset(email) {
        if (isFirebaseConfigured && auth) {
          await sendPasswordResetEmail(auth, email);
          return;
        }
        const users = await usersRepo.list(DEMO_SCHOOL_ID);
        if (!users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          throw new Error('No account found with that email.');
        }
        // Demo mode has no email delivery; the UI simply confirms the request.
      },

      async confirmPasswordReset(oobCode, newPassword) {
        if (isFirebaseConfigured && auth) {
          await fbConfirmPasswordReset(auth, oobCode, newPassword);
          return;
        }
        // Demo mode: nothing to persist, the flow is illustrative only.
      },
    }),
    [currentUser, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
