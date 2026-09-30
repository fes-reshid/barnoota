import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc } from "firebase/firestore";
import { auth, db, isDemoMode } from "../lib/firebase";
import { createBusiness, getUserBusinessIds, linkUserToBusiness, subscribeBusiness } from "../lib/repo/business";
import { DEMO_BUSINESS_ID, DEMO_USER_EMAIL, DEMO_USER_UID, demoEnsureBusiness, demoListCollection } from "../lib/demo/repo";
import { loadDemoData } from "../lib/repo/demoData";
import type { Business } from "../lib/types";

/** The parts of a Firebase Auth `User` this app actually reads — narrow
 * enough that a plain demo-mode object satisfies it too. */
export interface AppUser {
  uid: string;
  email: string | null;
}

interface AppContextValue {
  user: AppUser | null;
  authLoading: boolean;
  business: Business | null;
  businessId: string | null;
  businessLoading: boolean;
  needsOnboarding: boolean;
  isDemoMode: boolean;
  signUp: (email: string, password: string, businessName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  completeOnboarding: (businessName: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function DemoAppProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);

  useEffect(() => {
    const existed = Boolean(demoListCollection<Business>(DEMO_BUSINESS_ID, "business").length);
    const biz = demoEnsureBusiness();
    setBusiness(biz);
    setBusinessLoading(false);

    if (!existed) {
      // First-ever visit in this browser: populate it immediately so there's
      // something to look at, rather than an empty account.
      loadDemoData(biz, DEMO_USER_UID, DEMO_USER_EMAIL).catch(() => {
        // Demo seeding is a nicety, not a requirement — an empty demo
        // account (with its own "Load sample data" button) is still fine.
      });
    }

    return subscribeBusiness(DEMO_BUSINESS_ID, (b) => setBusiness(b));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      user: { uid: DEMO_USER_UID, email: DEMO_USER_EMAIL },
      authLoading: false,
      business,
      businessId: DEMO_BUSINESS_ID,
      businessLoading,
      needsOnboarding: false,
      isDemoMode: true,
      signUp: async () => {},
      signIn: async () => {},
      signOutUser: async () => {},
      resetPassword: async () => {},
      completeOnboarding: async () => {},
    }),
    [business, businessLoading],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function FirebaseAppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [checkedBusinessLink, setCheckedBusinessLink] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid, email: u.email } : null);
      setAuthLoading(false);
      if (!u) {
        setBusinessId(null);
        setBusiness(null);
        setBusinessLoading(false);
        setCheckedBusinessLink(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setBusinessLoading(true);
    getUserBusinessIds(user.uid).then((ids) => {
      if (cancelled) return;
      setBusinessId(ids[0] ?? null);
      setCheckedBusinessLink(true);
      if (!ids[0]) setBusinessLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!businessId) return;
    setBusinessLoading(true);
    return subscribeBusiness(businessId, (b) => {
      setBusiness(b);
      setBusinessLoading(false);
    });
  }, [businessId]);

  const signUp = async (email: string, password: string, businessName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: businessName });
    const newBizRef = doc(db, "businesses", crypto.randomUUID());
    await createBusiness(newBizRef.id, businessName, cred.user.uid, email);
    await linkUserToBusiness(cred.user.uid, newBizRef.id);
    setBusinessId(newBizRef.id);
  };

  const completeOnboarding = async (businessName: string) => {
    if (!user) throw new Error("Not signed in.");
    const newBizRef = doc(db, "businesses", crypto.randomUUID());
    await createBusiness(newBizRef.id, businessName, user.uid, user.email ?? "");
    await linkUserToBusiness(user.uid, newBizRef.id);
    setBusinessId(newBizRef.id);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authLoading,
      business,
      businessId,
      businessLoading,
      needsOnboarding: Boolean(user && checkedBusinessLink && !businessId),
      isDemoMode: false,
      signUp,
      signIn,
      signOutUser,
      resetPassword,
      completeOnboarding,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, authLoading, business, businessId, businessLoading, checkedBusinessLink],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  return isDemoMode ? <DemoAppProvider>{children}</DemoAppProvider> : <FirebaseAppProvider>{children}</FirebaseAppProvider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
