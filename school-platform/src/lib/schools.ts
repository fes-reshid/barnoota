import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { db } from '@/firebase/config';
import { getSecondaryAuth, disposeSecondaryApp } from '@/firebase/secondaryAuth';
import { ensureUserProfile } from './users';
import type { School, SchoolClass } from '@/types';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(doc(db, 'schools', slug));
  return snap.exists();
}

export async function getSchoolBySlug(slug: string): Promise<School | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'schools', slug));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as School) : null;
}

export async function listAllSchools(): Promise<School[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'schools'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as School);
}

interface NewSchoolInput {
  name: string;
  slug: string;
  adminName: string;
  adminEmail: string;
}

/**
 * Creates a new school plus its first school admin account, in one flow:
 * 1. A Firebase Auth account for the admin (on a throwaway secondary app,
 *    so the platform admin creating it stays signed in as themselves).
 * 2. That new account's own /users/{uid} profile (must be self-written —
 *    see firestore.rules), already pointing at the new school.
 * 3. The /schools/{slug} document itself, with the new admin in `members`.
 * 4. A password-reset email so the admin can set their own password.
 */
export async function createSchoolWithAdmin(input: NewSchoolInput): Promise<School> {
  if (!db) throw new Error('Firestore is not configured.');
  if (await isSlugTaken(input.slug)) {
    throw new Error(`The URL "${input.slug}" is already taken by another school.`);
  }

  const { auth: secondaryAuth, app: secondaryApp } = getSecondaryAuth();
  const secondaryDb = getFirestore(secondaryApp);
  let adminUid: string;
  try {
    const tempPassword = crypto.randomUUID();
    const cred = await createUserWithEmailAndPassword(secondaryAuth, input.adminEmail, tempPassword);
    adminUid = cred.user.uid;
    await ensureUserProfile(adminUid, input.adminEmail, input.adminName, [input.slug], secondaryDb);
    await sendPasswordResetEmail(secondaryAuth, input.adminEmail);
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await disposeSecondaryApp(secondaryApp);
  }

  const now = new Date().toISOString();
  const school: Omit<School, 'id'> = {
    name: input.name,
    slug: input.slug,
    email: input.adminEmail,
    branding: { primaryColor: '#16a34a' },
    members: { [adminUid]: 'school_admin' },
    subscriptionPlan: 'trial',
    subscriptionStatus: 'active',
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'schools', input.slug), school);
  return { id: input.slug, ...school };
}

export async function updateSchoolBranding(
  schoolId: string,
  patch: Partial<Pick<School, 'name' | 'email' | 'phone' | 'address' | 'branding'>>,
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'schools', schoolId), { ...patch, updatedAt: new Date().toISOString() });
}

export async function listClasses(schoolId: string): Promise<SchoolClass[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'schools', schoolId, 'classes'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SchoolClass);
}

export async function createClass(
  schoolId: string,
  data: { name: string; description?: string },
): Promise<SchoolClass> {
  if (!db) throw new Error('Firestore is not configured.');
  const now = new Date().toISOString();
  const ref = doc(collection(db, 'schools', schoolId, 'classes'));
  const record: Omit<SchoolClass, 'id'> = {
    schoolId,
    name: data.name,
    description: data.description,
    teacherIds: [],
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, record);
  return { id: ref.id, ...record };
}

export async function updateClass(
  schoolId: string,
  classId: string,
  patch: Partial<Pick<SchoolClass, 'name' | 'description' | 'archived' | 'teacherIds'>>,
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'schools', schoolId, 'classes', classId), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}
