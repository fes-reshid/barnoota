import { DEMO_SCHOOL_ID } from './services';
import {
  schoolsRepo,
  usersRepo,
  studentsRepo,
  teachersRepo,
  academicYearsRepo,
  classesRepo,
  subjectsRepo,
  attendanceRepo,
  timetableRepo,
  homeworkRepo,
  homeworkSubmissionsRepo,
  examTypesRepo,
  examsRepo,
  examResultsRepo,
  feeCategoriesRepo,
  feeStructuresRepo,
  feeInvoicesRepo,
  feePaymentsRepo,
  announcementsRepo,
  booksRepo,
  bookLoansRepo,
  quranProgressRepo,
  iqraProgressRepo,
  islamicStudiesRepo,
  oromoProgressRepo,
} from './services';
import type {
  AcademicYear,
  Announcement,
  AppUser,
  AttendanceRecord,
  Book,
  BookLoan,
  Exam,
  ExamResult,
  ExamType,
  FeeCategory,
  FeeInvoice,
  FeePayment,
  FeeStructure,
  Homework,
  HomeworkSubmission,
  IqraProgress,
  IslamicStudiesProgress,
  QuranProgress,
  OromoProgress,
  School,
  SchoolClass,
  Student,
  Subject,
  Teacher,
  TimetableSlot,
} from '@/types';

const NOW = new Date().toISOString();

function base(id: string) {
  return { id, schoolId: DEMO_SCHOOL_ID, createdAt: NOW, updatedAt: NOW };
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const CLASS_IDS = ['class-1', 'class-2', 'class-3'] as const;
const SUBJECT_IDS = ['subj-math', 'subj-eng', 'subj-sci', 'subj-arabic', 'subj-quran', 'subj-oromo'] as const;
const TEACHER_IDS = ['teacher-1', 'teacher-2', 'teacher-3', 'teacher-4', 'teacher-5'] as const;

const FIRST_NAMES = [
  'Amina', 'Yusuf', 'Zainab', 'Ibrahim', 'Khadija', 'Hamza', 'Maryam', 'Bilal',
  'Safiya', 'Omar', 'Layla', 'Ahmed',
];
const LAST_NAMES = [
  'Hassan', 'Ali', 'Ibrahim', 'Mohamed', 'Abdi', 'Nur', 'Warsame', 'Farah',
];

export async function seedDemoData(): Promise<void> {
  await schoolsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    {
      ...base(DEMO_SCHOOL_ID),
      name: 'Barnoota Campus Weekend School',
      address: '123 Community Way, Columbus, OH',
      phone: '+1 (614) 555-0142',
      email: 'info@barnoota.school',
      subscriptionPlan: 'standard',
      subscriptionStatus: 'active',
      islamicModulesEnabled: {
        quran: true,
        iqra: true,
        islamicStudies: true,
        oromoLanguage: true,
      },
    } as School,
  ]);

  await academicYearsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    {
      ...base('ay-2025-2026'),
      name: '2025 / 2026',
      startDate: '2025-09-01',
      endDate: '2026-06-30',
      isCurrent: true,
    } as AcademicYear,
  ]);

  await subjectsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('subj-math'), name: 'Mathematics', code: 'MATH', color: '#349563' } as Subject,
    { ...base('subj-eng'), name: 'English', code: 'ENG', color: '#2563eb' } as Subject,
    { ...base('subj-sci'), name: 'Science', code: 'SCI', color: '#d97706' } as Subject,
    { ...base('subj-arabic'), name: 'Arabic', code: 'ARB', color: '#7c3aed' } as Subject,
    { ...base('subj-quran'), name: 'Quran', code: 'QRN', color: '#0f766e' } as Subject,
    { ...base('subj-oromo'), name: 'Oromo Language', code: 'ORM', color: '#b45309' } as Subject,
  ]);

  await teachersRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    {
      ...base('teacher-1'), teacherCode: 'T-1001', firstName: 'Fatima', lastName: 'Ahmed',
      email: 'fatima.ahmed@barnoota.school', phone: '+1 614 555 0111',
      subjectIds: ['subj-math', 'subj-sci'], classIds: ['class-1'], employmentType: 'full_time',
      hireDate: '2022-08-15', status: 'active',
    } as Teacher,
    {
      ...base('teacher-2'), teacherCode: 'T-1002', firstName: 'Musa', lastName: 'Warsame',
      email: 'musa.warsame@barnoota.school', phone: '+1 614 555 0112',
      subjectIds: ['subj-arabic', 'subj-quran'], classIds: ['class-2'], employmentType: 'full_time',
      hireDate: '2021-08-01', status: 'active',
    } as Teacher,
    {
      ...base('teacher-3'), teacherCode: 'T-1003', firstName: 'Halima', lastName: 'Nur',
      email: 'halima.nur@barnoota.school', phone: '+1 614 555 0113',
      subjectIds: ['subj-eng'], classIds: ['class-3'], employmentType: 'part_time',
      hireDate: '2023-01-10', status: 'active',
    } as Teacher,
    {
      ...base('teacher-4'), teacherCode: 'T-1004', firstName: 'Abdikadir', lastName: 'Farah',
      email: 'abdikadir.farah@barnoota.school', phone: '+1 614 555 0114',
      subjectIds: ['subj-oromo'], classIds: ['class-1', 'class-2'], employmentType: 'volunteer',
      hireDate: '2024-02-20', status: 'active',
    } as Teacher,
    {
      ...base('teacher-5'), teacherCode: 'T-1005', firstName: 'Sumaya', lastName: 'Ali',
      email: 'sumaya.ali@barnoota.school', phone: '+1 614 555 0115',
      subjectIds: ['subj-quran', 'subj-arabic'], classIds: ['class-3'], employmentType: 'full_time',
      hireDate: '2020-09-05', status: 'active',
    } as Teacher,
  ]);

  await classesRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('class-1'), name: 'Year 3', yearLevel: 'Year 3', section: 'A', academicYearId: 'ay-2025-2026', classTeacherId: 'teacher-1', capacity: 25 } as SchoolClass,
    { ...base('class-2'), name: 'Year 4', yearLevel: 'Year 4', section: 'A', academicYearId: 'ay-2025-2026', classTeacherId: 'teacher-2', capacity: 25 } as SchoolClass,
    { ...base('class-3'), name: 'Year 5', yearLevel: 'Year 5', section: 'A', academicYearId: 'ay-2025-2026', classTeacherId: 'teacher-3', capacity: 25 } as SchoolClass,
  ]);

  const students: Student[] = FIRST_NAMES.map((first, i) => {
    const last = LAST_NAMES[i % LAST_NAMES.length];
    const classId = CLASS_IDS[i % CLASS_IDS.length];
    return {
      ...base(`student-${i + 1}`),
      studentCode: `S-${2000 + i + 1}`,
      firstName: first,
      lastName: last,
      dob: `201${4 + (i % 5)}-0${(i % 9) + 1}-1${i % 2}`,
      gender: i % 2 === 0 ? 'female' : 'male',
      classId,
      yearLevel: classId === 'class-1' ? 'Year 3' : classId === 'class-2' ? 'Year 4' : 'Year 5',
      enrollmentDate: isoDaysAgo(300 - i * 5),
      status: 'active',
      guardianName: `${LAST_NAMES[(i + 1) % LAST_NAMES.length]} Family`,
      guardianPhone: `+1 614 555 02${10 + i}`,
      guardianEmail: `guardian${i + 1}@example.com`,
      address: `${100 + i} Maple Street, Columbus, OH`,
      emergencyContactName: `${first} Emergency Contact`,
      emergencyContactPhone: `+1 614 555 03${10 + i}`,
      medicalNotes: i % 4 === 0 ? 'Mild peanut allergy.' : '',
    } as Student;
  });
  await studentsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => students);

  await usersRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('user-admin'), authUid: 'demo-admin', name: 'Amira Hassan', email: 'admin@barnoota.school', role: 'school_admin', active: true } as AppUser,
    { ...base('user-superadmin'), authUid: 'demo-superadmin', name: 'System Owner', email: 'owner@barnoota.school', role: 'super_admin', active: true } as AppUser,
    { ...base('user-teacher'), authUid: 'demo-teacher', name: 'Fatima Ahmed', email: 'fatima.ahmed@barnoota.school', role: 'teacher', teacherId: 'teacher-1', active: true } as AppUser,
    { ...base('user-parent'), authUid: 'demo-parent', name: 'Warsame Family', email: 'parent@example.com', role: 'parent', childrenIds: ['student-1', 'student-2'], active: true } as AppUser,
    { ...base('user-student'), authUid: 'demo-student', name: 'Amina Hassan', email: 'student@example.com', role: 'student', studentId: 'student-1', active: true } as AppUser,
  ]);

  // Attendance for the current class over the last 10 days
  const attendance: AttendanceRecord[] = [];
  let attId = 1;
  for (let d = 0; d < 10; d++) {
    const date = isoDaysAgo(d);
    for (const s of students.filter((s) => s.classId === 'class-1')) {
      const roll = Math.random();
      attendance.push({
        ...base(`att-${attId++}`),
        classId: 'class-1',
        studentId: s.id,
        date,
        status: roll > 0.85 ? 'absent' : roll > 0.75 ? 'late' : 'present',
        markedBy: 'teacher-1',
      } as AttendanceRecord);
    }
  }
  await attendanceRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => attendance);

  const timetable: TimetableSlot[] = [];
  const days: TimetableSlot['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  let ttId = 1;
  CLASS_IDS.forEach((classId, ci) => {
    days.forEach((day, di) => {
      const subjectId = SUBJECT_IDS[(ci + di) % SUBJECT_IDS.length];
      const teacherId = TEACHER_IDS[(ci + di) % TEACHER_IDS.length];
      timetable.push({
        ...base(`tt-${ttId++}`),
        classId,
        teacherId,
        subjectId,
        room: `Room ${100 + ci}`,
        day,
        startTime: '09:00',
        endTime: '10:00',
      } as TimetableSlot);
    });
  });
  await timetableRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => timetable);

  const homework: Homework[] = [
    {
      ...base('hw-1'), classId: 'class-1', subjectId: 'subj-math', teacherId: 'teacher-1',
      title: 'Fractions worksheet', description: 'Complete worksheet pages 12-14.',
      dueDate: isoDaysFromNow(3), assignedDate: isoDaysAgo(2),
    } as Homework,
    {
      ...base('hw-2'), classId: 'class-2', subjectId: 'subj-quran', teacherId: 'teacher-2',
      title: 'Memorise Surah Al-Fil', description: 'Practice recitation daily.',
      dueDate: isoDaysFromNow(7), assignedDate: isoDaysAgo(1),
    } as Homework,
    {
      ...base('hw-3'), classId: 'class-3', subjectId: 'subj-eng', teacherId: 'teacher-3',
      title: 'Reading comprehension', description: 'Read chapter 4 and answer questions.',
      dueDate: isoDaysFromNow(-1), assignedDate: isoDaysAgo(5),
    } as Homework,
  ];
  await homeworkRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => homework);

  const submissions: HomeworkSubmission[] = students.slice(0, 4).map((s, i) => ({
    ...base(`sub-${i + 1}`),
    homeworkId: 'hw-1',
    studentId: s.id,
    status: i % 2 === 0 ? 'submitted' : 'pending',
    submittedAt: i % 2 === 0 ? isoDaysAgo(1) : undefined,
  } as HomeworkSubmission));
  await homeworkSubmissionsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => submissions);

  await examTypesRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('etype-midterm'), name: 'Midterm' } as ExamType,
    { ...base('etype-final'), name: 'Final' } as ExamType,
    { ...base('etype-quiz'), name: 'Quiz' } as ExamType,
  ]);

  const exams: Exam[] = [
    { ...base('exam-1'), name: 'Midterm Mathematics', examTypeId: 'etype-midterm', classId: 'class-1', subjectId: 'subj-math', date: isoDaysFromNow(10), maxMarks: 100 } as Exam,
    { ...base('exam-2'), name: 'Quran Recitation Quiz', examTypeId: 'etype-quiz', classId: 'class-2', subjectId: 'subj-quran', date: isoDaysAgo(5), maxMarks: 50 } as Exam,
  ];
  await examsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => exams);

  const results: ExamResult[] = students
    .filter((s) => s.classId === 'class-2')
    .map((s, i) => ({
      ...base(`result-${i + 1}`),
      examId: 'exam-2',
      studentId: s.id,
      marksObtained: 30 + ((i * 7) % 20),
      grade: 'B',
      teacherComment: 'Good effort, keep practising tajweed.',
    } as ExamResult));
  await examResultsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => results);

  await feeCategoriesRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('fc-tuition'), name: 'Tuition', description: 'Weekend school tuition fee' } as FeeCategory,
    { ...base('fc-books'), name: 'Books & Materials' } as FeeCategory,
  ]);

  await feeStructuresRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('fs-1'), name: 'Term Tuition - Year 3', categoryId: 'fc-tuition', yearLevel: 'Year 3', amount: 300, dueDate: isoDaysFromNow(20), academicYearId: 'ay-2025-2026' } as FeeStructure,
    { ...base('fs-2'), name: 'Term Tuition - Year 4', categoryId: 'fc-tuition', yearLevel: 'Year 4', amount: 300, dueDate: isoDaysFromNow(20), academicYearId: 'ay-2025-2026' } as FeeStructure,
    { ...base('fs-3'), name: 'Books & Materials', categoryId: 'fc-books', yearLevel: 'Year 3', amount: 45, dueDate: isoDaysFromNow(20), academicYearId: 'ay-2025-2026' } as FeeStructure,
  ]);

  const invoices: FeeInvoice[] = students.map((s, i) => {
    const amount = 300;
    const paid = i % 3 === 0 ? amount : i % 3 === 1 ? amount / 2 : 0;
    return {
      ...base(`inv-${i + 1}`),
      studentId: s.id,
      feeStructureId: s.classId === 'class-1' ? 'fs-1' : 'fs-2',
      amount,
      discount: 0,
      amountPaid: paid,
      status: paid === amount ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      dueDate: isoDaysFromNow(20),
    } as FeeInvoice;
  });
  await feeInvoicesRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => invoices);

  const payments: FeePayment[] = invoices
    .filter((inv) => inv.amountPaid > 0)
    .map((inv, i) => ({
      ...base(`pay-${i + 1}`),
      invoiceId: inv.id,
      studentId: inv.studentId,
      amount: inv.amountPaid,
      method: i % 2 === 0 ? 'cash' : 'mobile_money',
      paidAt: isoDaysAgo(i + 1),
      receiptNumber: `RCPT-${1000 + i}`,
      recordedBy: 'user-admin',
    } as FeePayment));
  await feePaymentsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => payments);

  await announcementsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    {
      ...base('ann-1'), title: 'Weekend School Resumes This Saturday', body: 'Classes resume this Saturday at 9:00 AM. Please arrive 10 minutes early.',
      audience: 'everyone', authorId: 'user-admin', authorName: 'Amira Hassan', pinned: true,
    } as Announcement,
    {
      ...base('ann-2'), title: 'Year 4 Quran Quiz Results Posted', body: 'Quiz results have been posted to student profiles.',
      audience: 'class', classId: 'class-2', authorId: 'user-teacher', authorName: 'Fatima Ahmed', pinned: false,
    } as Announcement,
  ]);

  await booksRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('book-1'), title: 'Stories of the Prophets', author: 'Ibn Kathir', category: 'Islamic Studies', isbn: '978-1-000001', totalCopies: 5, availableCopies: 3 } as Book,
    { ...base('book-2'), title: 'Learning Qubee', author: 'Oromo Language Board', category: 'Language', isbn: '978-1-000002', totalCopies: 8, availableCopies: 8 } as Book,
    { ...base('book-3'), title: 'Tajweed Made Easy', author: 'Sumaya Ali', category: 'Quran', isbn: '978-1-000003', totalCopies: 4, availableCopies: 2 } as Book,
  ]);

  await bookLoansRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('loan-1'), bookId: 'book-1', studentId: 'student-1', borrowedAt: isoDaysAgo(10), dueDate: isoDaysFromNow(4), status: 'borrowed' } as BookLoan,
    { ...base('loan-2'), bookId: 'book-3', studentId: 'student-2', borrowedAt: isoDaysAgo(20), dueDate: isoDaysAgo(6), status: 'overdue' } as BookLoan,
  ]);

  await quranProgressRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('qp-1'), studentId: 'student-1', surah: 'Al-Fatiha', ayahRange: '1-7', memorisationStatus: 'memorised', recitationLevel: 'intermediate', teacherComment: 'Excellent tajweed.', date: isoDaysAgo(3) } as QuranProgress,
    { ...base('qp-2'), studentId: 'student-1', surah: 'Al-Ikhlas', ayahRange: '1-4', memorisationStatus: 'in_progress', recitationLevel: 'beginner', date: isoDaysAgo(1) } as QuranProgress,
  ]);

  await iqraProgressRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('iq-1'), studentId: 'student-2', bookLevel: 'Iqra 2', lesson: 'Lesson 9', completionStatus: 'in_progress', teacherAssessment: 'Needs more practice with madd letters.', date: isoDaysAgo(2) } as IqraProgress,
  ]);

  await islamicStudiesRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('is-1'), studentId: 'student-3', bookLevel: 'Level 1', topic: 'Pillars of Islam', lesson: 'The Five Pillars', assessment: 'Very good', progress: 'completed', date: isoDaysAgo(4) } as IslamicStudiesProgress,
  ]);

  await oromoProgressRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('op-1'), studentId: 'student-4', qubee: 'A - Z', reading: 'in_progress', writing: 'in_progress', vocabulary: 'Family & greetings', progress: 'in_progress', date: isoDaysAgo(2) } as OromoProgress,
  ]);
}
