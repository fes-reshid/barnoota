import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { isFirebaseConfigured } from '@/firebase/config';
import { getSecondaryAuth, disposeSecondaryApp } from '@/firebase/secondaryAuth';
import { setById } from '@/lib/repository';
import type { AppUser, Role } from '@/types';

interface NewStaffAccount {
  schoolId: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  teacherId?: string;
}

/**
 * Creates a Firebase Auth account + matching Firestore profile for a staff
 * member (teacher or admin), keyed by the new account's uid, then emails
 * them a "set your password" reset link so nobody but them ever knows the
 * random temporary password used at creation time.
 *
 * In demo mode (no Firebase project configured) this just writes the
 * profile straight into the local demo store with a synthetic id, so every
 * screen that calls this works identically in both modes.
 */
export async function createStaffAccount(input: NewStaffAccount): Promise<AppUser> {
  const now = new Date().toISOString();

  if (!isFirebaseConfigured) {
    const id = crypto.randomUUID();
    const record: AppUser = {
      id,
      schoolId: input.schoolId,
      authUid: id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      teacherId: input.teacherId,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    await setById<AppUser>('users', id, record);
    return record;
  }

  const { auth: secondaryAuth, app: secondaryApp } = getSecondaryAuth();
  try {
    const tempPassword = crypto.randomUUID();
    const cred = await createUserWithEmailAndPassword(secondaryAuth, input.email, tempPassword);
    const uid = cred.user.uid;

    const record: Omit<AppUser, 'id'> = {
      schoolId: input.schoolId,
      authUid: uid,
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      teacherId: input.teacherId,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    await setById<AppUser>('users', uid, record);
    await sendPasswordResetEmail(secondaryAuth, input.email);

    return { id: uid, ...record };
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await disposeSecondaryApp(secondaryApp);
  }
}
