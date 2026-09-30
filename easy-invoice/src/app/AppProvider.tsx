import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { createBusiness, getUserBusinessIds, linkUserToBusiness, subscribeBusiness } from "../lib/repo/business";
import type { Business } from "../lib/types";

interface AppContextValue {
  user: User | null;
  authLoading: boolean;
  business: Business | null;
  businessId: string | null;
  businessLoading: boolean;
  needsOnboarding: boolean;
  signUp: (email: string, password: string, businessName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  completeOnboarding: (businessName: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [checkedBusinessLink, setCheckedBusinessLink] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
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

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
