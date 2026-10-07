import { getFirestore } from 'firebase-admin/firestore';

interface StudentDoc {
  schoolId: string;
  classId: string;
  status: string;
  guardianEmail?: string;
  guardianPhone?: string;
  firstName: string;
  lastName: string;
}

interface TeacherDoc {
  schoolId: string;
  status: string;
  email: string;
}

interface AppUserDoc {
  role: string;
  childrenIds?: string[];
  telegramChatId?: string;
}

/** Guardian emails for every active student in a school, deduplicated. */
export async function guardianEmailsForSchool(schoolId: string): Promise<string[]> {
  const db = getFirestore();
  const snap = await db.collection('students').where('schoolId', '==', schoolId).where('status', '==', 'active').get();
  return dedupeEmails(snap.docs.map((d) => (d.data() as StudentDoc).guardianEmail));
}

/** Guardian email(s) for the students in one class. */
export async function guardianEmailsForClass(schoolId: string, classId: string): Promise<string[]> {
  const db = getFirestore();
  const snap = await db
    .collection('students')
    .where('schoolId', '==', schoolId)
    .where('classId', '==', classId)
    .where('status', '==', 'active')
    .get();
  return dedupeEmails(snap.docs.map((d) => (d.data() as StudentDoc).guardianEmail));
}

/** Guardian phone numbers (for WhatsApp) for every active student in a school. */
export async function guardianPhonesForSchool(schoolId: string): Promise<string[]> {
  const db = getFirestore();
  const snap = await db.collection('students').where('schoolId', '==', schoolId).where('status', '==', 'active').get();
  return dedupePhones(snap.docs.map((d) => (d.data() as StudentDoc).guardianPhone));
}

/** Guardian phone number(s) (for WhatsApp) for the students in one class. */
export async function guardianPhonesForClass(schoolId: string, classId: string): Promise<string[]> {
  const db = getFirestore();
  const snap = await db
    .collection('students')
    .where('schoolId', '==', schoolId)
    .where('classId', '==', classId)
    .where('status', '==', 'active')
    .get();
  return dedupePhones(snap.docs.map((d) => (d.data() as StudentDoc).guardianPhone));
}

/** A single student's guardian email + phone + display name, or null if the student doesn't exist. */
export async function guardianForStudent(
  studentId: string,
): Promise<{ email?: string; phone?: string; studentName: string } | null> {
  const db = getFirestore();
  const doc = await db.collection('students').doc(studentId).get();
  if (!doc.exists) return null;
  const data = doc.data() as StudentDoc;
  if (!data.guardianEmail && !data.guardianPhone) return null;
  return { email: data.guardianEmail, phone: data.guardianPhone, studentName: `${data.firstName} ${data.lastName}` };
}

/**
 * Telegram chat ids for every parent account linked to a student (via that
 * parent's own `childrenIds`), for parents who've connected Telegram. Most
 * students will have zero until their parent does — that's expected, not
 * an error; the WhatsApp/email channels don't need this step at all.
 */
export async function telegramChatIdsForStudent(studentId: string): Promise<string[]> {
  const db = getFirestore();
  const snap = await db.collection('users').where('childrenIds', 'array-contains', studentId).get();
  return [...new Set(
    snap.docs
      .map((d) => d.data() as AppUserDoc)
      .filter((u) => u.role === 'parent' && u.telegramChatId)
      .map((u) => u.telegramChatId as string),
  )];
}

/** Telegram chat ids for every connected parent of every active student in a class. */
export async function telegramChatIdsForClass(schoolId: string, classId: string): Promise<string[]> {
  const db = getFirestore();
  const studentsSnap = await db
    .collection('students')
    .where('schoolId', '==', schoolId)
    .where('classId', '==', classId)
    .where('status', '==', 'active')
    .get();
  const ids = await Promise.all(studentsSnap.docs.map((d) => telegramChatIdsForStudent(d.id)));
  return [...new Set(ids.flat())];
}

/** Telegram chat ids for every connected parent of every active student in a school. */
export async function telegramChatIdsForSchool(schoolId: string): Promise<string[]> {
  const db = getFirestore();
  const studentsSnap = await db.collection('students').where('schoolId', '==', schoolId).where('status', '==', 'active').get();
  const ids = await Promise.all(studentsSnap.docs.map((d) => telegramChatIdsForStudent(d.id)));
  return [...new Set(ids.flat())];
}

/** Every active teacher's email in a school. */
export async function teacherEmailsForSchool(schoolId: string): Promise<string[]> {
  const db = getFirestore();
  const snap = await db.collection('teachers').where('schoolId', '==', schoolId).where('status', '==', 'active').get();
  return dedupeEmails(snap.docs.map((d) => (d.data() as TeacherDoc).email));
}

function dedupeEmails(emails: (string | undefined)[]): string[] {
  return [...new Set(emails.filter((e): e is string => Boolean(e && e.includes('@'))))];
}

function dedupePhones(phones: (string | undefined)[]): string[] {
  return [...new Set(phones.filter((p): p is string => Boolean(p && p.replace(/[^\d]/g, '').length >= 8)))];
}
