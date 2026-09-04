import { getFirestore } from 'firebase-admin/firestore';

interface StudentDoc {
  schoolId: string;
  classId: string;
  status: string;
  guardianEmail?: string;
  firstName: string;
  lastName: string;
}

interface TeacherDoc {
  schoolId: string;
  status: string;
  email: string;
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

/** A single student's guardian email + display name, or null if missing. */
export async function guardianForStudent(studentId: string): Promise<{ email: string; studentName: string } | null> {
  const db = getFirestore();
  const doc = await db.collection('students').doc(studentId).get();
  if (!doc.exists) return null;
  const data = doc.data() as StudentDoc;
  if (!data.guardianEmail) return null;
  return { email: data.guardianEmail, studentName: `${data.firstName} ${data.lastName}` };
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
