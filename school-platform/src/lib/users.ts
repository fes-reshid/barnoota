import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { AppUser } from '@/types';

/**
 * Ensures a /users/{uid} profile doc exists for a freshly signed-in Firebase
 * Auth account. Safe to call on every login — it never overwrites an
 * existing profile (in particular, never touches isPlatformAdmin).
 *
 * `firestore` defaults to the primary app's db, but accepts a secondary
 * app's Firestore instance too — Firestore rules only allow a user to
 * create their own /users/{uid} doc, so when a platform admin provisions a
 * new school admin account, that write has to happen while signed in as
 * the new user (on a throwaway secondary app), not as the admin.
 */
export async function ensureUserProfile(
  uid: string,
  email: string,
  name: string,
  initialSchoolIds: string[] = [],
  firestore: Firestore | undefined = db,
): Promise<AppUser> {
  if (!firestore) throw new Error('Firestore is not configured.');
  const ref = doc(firestore, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: uid, ...snap.data() } as AppUser;

  const now = new Date().toISOString();
  const profile: Omit<AppUser, 'id'> & { schoolIds: string[] } = {
    authUid: uid,
    name,
    email,
    isPlatformAdmin: false,
    schoolIds: initialSchoolIds,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, profile);
  return { id: uid, ...profile };
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? ({ id: uid, ...snap.data() } as AppUser) : null;
}
