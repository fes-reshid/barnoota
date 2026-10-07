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
  return isoDaysAgo(-days);
}

const CLASS_IDS = ['class-1', 'class-2', 'class-3'] as const;
const SUBJECT_IDS = ['subj-math', 'subj-eng', 'subj-sci', 'subj-arabic', 'subj-quran', 'subj-oromo'] as const;
const TEACHER_IDS = ['teacher-1', 'teacher-2', 'teacher-3', 'teacher-4', 'teacher-5'] as const;

// A wider name pool so a full, 36-student roster (12 per class) still reads
// as a real school rather than three repeating names.
const FIRST_NAMES = [
  'Amina', 'Yusuf', 'Zainab', 'Ibrahim', 'Khadija', 'Hamza', 'Maryam', 'Bilal',
  'Safiya', 'Omar', 'Layla', 'Ahmed', 'Sumaya', 'Yasin', 'Hawa', 'Idris',
  'Ruqiya', 'Mustafa', 'Fardowsa', 'Zakariya', 'Nasra', 'Jamal', 'Ikram', 'Said',
  'Munira', 'Abdirahman', 'Deeqa', 'Faysal', 'Asha', 'Liban', 'Hodan', 'Mohamed',
  'Rahma', 'Abdullahi', 'Sagal', 'Nuur',
];
const LAST_NAMES = [
  'Hassan', 'Ali', 'Ibrahim', 'Mohamed', 'Abdi', 'Nur', 'Warsame', 'Farah',
  'Hussein', 'Omar', 'Yusuf', 'Ahmed',
];

export async function seedDemoData(): Promise<void> {
  await schoolsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    {
      ...base(DEMO_SCHOOL_ID),
      name: 'Barnoota Campus Weekend School',
      address: '123 Community Way, Columbus, OH',
      phone: '+1 (614) 555-0142',
      email: 'info@barnoota.school',
      website: 'https://barnoota.school',
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

  // 12 students per class (36 total) so every list, report and ID-card batch
  // looks like a real roster rather than a 3-row sample.
  const STUDENTS_PER_CLASS = 12;
  const students: Student[] = [];
  CLASS_IDS.forEach((classId, ci) => {
    const yearLevel = classId === 'class-1' ? 'Year 3' : classId === 'class-2' ? 'Year 4' : 'Year 5';
    for (let j = 0; j < STUDENTS_PER_CLASS; j++) {
      const i = ci * STUDENTS_PER_CLASS + j;
      const first = FIRST_NAMES[i % FIRST_NAMES.length];
      const last = LAST_NAMES[(i + ci) % LAST_NAMES.length];
      students.push({
        ...base(`student-${i + 1}`),
        studentCode: `S-${2000 + i + 1}`,
        firstName: first,
        lastName: last,
        dob: `201${4 + (i % 5)}-0${(i % 9) + 1}-1${i % 2}`,
        gender: i % 2 === 0 ? 'female' : 'male',
        classId,
        yearLevel,
        enrollmentDate: isoDaysAgo(300 - i * 2),
        status: 'active',
        guardianName: `${LAST_NAMES[(i + 1) % LAST_NAMES.length]} Family`,
        guardianPhone: `+1 614 555 ${String(2100 + i).padStart(4, '0')}`,
        guardianEmail: `guardian${i + 1}@example.com`,
        address: `${100 + i} Maple Street, Columbus, OH`,
        emergencyContactName: `${first} Emergency Contact`,
        emergencyContactPhone: `+1 614 555 ${String(3100 + i).padStart(4, '0')}`,
        medicalNotes: i % 7 === 0 ? 'Mild peanut allergy.' : '',
      } as Student);
    }
  });
  await studentsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => students);

  await usersRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('user-admin'), authUid: 'demo-admin', name: 'Amira Hassan', email: 'admin@barnoota.school', role: 'school_admin', active: true } as AppUser,
    { ...base('user-superadmin'), authUid: 'demo-superadmin', name: 'System Owner', email: 'owner@barnoota.school', role: 'super_admin', active: true } as AppUser,
    { ...base('user-teacher'), authUid: 'demo-teacher', name: 'Fatima Ahmed', email: 'fatima.ahmed@barnoota.school', role: 'teacher', teacherId: 'teacher-1', active: true } as AppUser,
    { ...base('user-parent'), authUid: 'demo-parent', name: 'Warsame Family', email: 'parent@example.com', role: 'parent', childrenIds: ['student-1', 'student-2'], active: true } as AppUser,
    { ...base('user-student'), authUid: 'demo-student', name: students[0].firstName + ' ' + students[0].lastName, email: 'student@example.com', role: 'student', studentId: 'student-1', active: true } as AppUser,
  ]);

  // Attendance for every class over the last 21 days (skip weekends), so the
  // attendance reports have real trends instead of one thin class/week.
  const attendance: AttendanceRecord[] = [];
  let attId = 1;
  for (let d = 0; d < 21; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // weekends
    const dateStr = date.toISOString().slice(0, 10);
    for (const classId of CLASS_IDS) {
      const teacherId = classId === 'class-1' ? 'teacher-1' : classId === 'class-2' ? 'teacher-2' : 'teacher-3';
      for (const s of students.filter((s) => s.classId === classId)) {
        const roll = Math.random();
        attendance.push({
          ...base(`att-${attId++}`),
          classId,
          studentId: s.id,
          date: dateStr,
          status: roll > 0.9 ? 'absent' : roll > 0.8 ? 'late' : roll > 0.75 ? 'excused' : 'present',
          markedBy: teacherId,
        } as AttendanceRecord);
      }
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

  // Two homework assignments per class (one upcoming, one overdue) across a
  // mix of subjects, so each role sees a realistic homework load.
  const homeworkSeeds: Array<[string, string, string, string, string, number, number]> = [
    ['hw-1', 'class-1', 'subj-math', 'teacher-1', 'Fractions worksheet', 3, -2],
    ['hw-2', 'class-1', 'subj-sci', 'teacher-1', 'Plant life cycle poster', -1, -6],
    ['hw-3', 'class-2', 'subj-quran', 'teacher-2', 'Memorise Surah Al-Fil', 7, -1],
    ['hw-4', 'class-2', 'subj-arabic', 'teacher-2', 'Arabic vocabulary flashcards', -2, -8],
    ['hw-5', 'class-3', 'subj-eng', 'teacher-3', 'Reading comprehension', -1, -5],
    ['hw-6', 'class-3', 'subj-oromo', 'teacher-4', 'Qubee writing practice', 5, -1],
  ];
  const homework: Homework[] = homeworkSeeds.map(([id, classId, subjectId, teacherId, title, dueIn, assignedIn]) => ({
    ...base(id),
    classId,
    subjectId,
    teacherId,
    title,
    description: `${title}. See class notes for full instructions.`,
    dueDate: isoDaysFromNow(dueIn),
    assignedDate: isoDaysFromNow(assignedIn),
  } as Homework));
  await homeworkRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => homework);

  // Every student submits (or doesn't) the homework assigned to their own
  // class, with a mix of pending/submitted/late/graded statuses.
  const submissions: HomeworkSubmission[] = [];
  let subId = 1;
  for (const hw of homework) {
    for (const s of students.filter((s) => s.classId === hw.classId)) {
      const roll = Math.random();
      const status: HomeworkSubmission['status'] =
        roll > 0.85 ? 'pending' : roll > 0.65 ? 'late' : roll > 0.3 ? 'graded' : 'submitted';
      submissions.push({
        ...base(`sub-${subId++}`),
        homeworkId: hw.id,
        studentId: s.id,
        status,
        submittedAt: status === 'pending' ? undefined : isoDaysAgo(1),
        grade: status === 'graded' ? ['A', 'A-', 'B+', 'B'][Math.floor(Math.random() * 4)] : undefined,
      } as HomeworkSubmission);
    }
  }
  await homeworkSubmissionsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => submissions);

  await examTypesRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('etype-midterm'), name: 'Midterm' } as ExamType,
    { ...base('etype-final'), name: 'Final' } as ExamType,
    { ...base('etype-quiz'), name: 'Quiz' } as ExamType,
  ]);

  // One midterm per class plus a couple of quizzes, so the exams module and
  // report cards have more than a single data point to show.
  const examSeeds: Array<[string, string, string, string, string, number, number]> = [
    ['exam-1', 'Midterm Mathematics', 'etype-midterm', 'class-1', 'subj-math', 10, 100],
    ['exam-2', 'Quran Recitation Quiz', 'etype-quiz', 'class-2', 'subj-quran', -5, 50],
    ['exam-3', 'Midterm English', 'etype-midterm', 'class-3', 'subj-eng', -3, 100],
    ['exam-4', 'Science Quiz', 'etype-quiz', 'class-1', 'subj-sci', -8, 50],
    ['exam-5', 'Arabic Midterm', 'etype-midterm', 'class-2', 'subj-arabic', -2, 100],
  ];
  const exams: Exam[] = examSeeds.map(([id, name, examTypeId, classId, subjectId, dateIn, maxMarks]) => ({
    ...base(id),
    name,
    examTypeId,
    classId,
    subjectId,
    date: isoDaysFromNow(dateIn),
    maxMarks,
  } as Exam));
  await examsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => exams);

  // Results for every exam that has already happened (date in the past).
  const results: ExamResult[] = [];
  let resultId = 1;
  const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+'];
  for (const exam of exams) {
    if (new Date(exam.date) > new Date()) continue;
    for (const s of students.filter((s) => s.classId === exam.classId)) {
      const marks = Math.round(exam.maxMarks * (0.55 + Math.random() * 0.4));
      results.push({
        ...base(`result-${resultId++}`),
        examId: exam.id,
        studentId: s.id,
        marksObtained: marks,
        grade: grades[Math.min(grades.length - 1, Math.floor((1 - marks / exam.maxMarks) * grades.length))],
        teacherComment: marks / exam.maxMarks > 0.75 ? 'Excellent work, keep it up.' : 'Good effort, keep practising.',
      } as ExamResult);
    }
  }
  await examResultsRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => results);

  await feeCategoriesRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('fc-tuition'), name: 'Tuition', description: 'Weekend school tuition fee' } as FeeCategory,
    { ...base('fc-books'), name: 'Books & Materials' } as FeeCategory,
  ]);

  await feeStructuresRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('fs-1'), name: 'Term Tuition - Year 3', categoryId: 'fc-tuition', yearLevel: 'Year 3', amount: 300, dueDate: isoDaysFromNow(20), academicYearId: 'ay-2025-2026' } as FeeStructure,
    { ...base('fs-2'), name: 'Term Tuition - Year 4', categoryId: 'fc-tuition', yearLevel: 'Year 4', amount: 300, dueDate: isoDaysFromNow(20), academicYearId: 'ay-2025-2026' } as FeeStructure,
    { ...base('fs-3'), name: 'Term Tuition - Year 5', categoryId: 'fc-tuition', yearLevel: 'Year 5', amount: 320, dueDate: isoDaysFromNow(20), academicYearId: 'ay-2025-2026' } as FeeStructure,
    { ...base('fs-4'), name: 'Books & Materials', categoryId: 'fc-books', yearLevel: 'Year 3', amount: 45, dueDate: isoDaysFromNow(20), academicYearId: 'ay-2025-2026' } as FeeStructure,
  ]);

  const feeStructureForClass = (classId: string) =>
    classId === 'class-1' ? 'fs-1' : classId === 'class-2' ? 'fs-2' : 'fs-3';
  const amountForClass = (classId: string) => (classId === 'class-3' ? 320 : 300);

  // A realistic spread: some invoices paid in full, some partial, some
  // untouched, and a few genuinely overdue (due date already passed).
  const invoices: FeeInvoice[] = students.map((s, i) => {
    const amount = amountForClass(s.classId);
    const bucket = i % 5;
    const paid = bucket === 0 || bucket === 1 ? amount : bucket === 2 ? amount / 2 : 0;
    const overdue = bucket === 4;
    return {
      ...base(`inv-${i + 1}`),
      studentId: s.id,
      feeStructureId: feeStructureForClass(s.classId),
      amount,
      discount: 0,
      amountPaid: paid,
      status: paid === amount ? 'paid' : paid > 0 ? 'partial' : overdue ? 'overdue' : 'unpaid',
      dueDate: overdue ? isoDaysAgo(10) : isoDaysFromNow(20),
    } as FeeInvoice;
  });
  await feeInvoicesRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => invoices);

  const methods: FeePayment['method'][] = ['cash', 'card', 'bank_transfer', 'mobile_money'];
  const payments: FeePayment[] = invoices
    .filter((inv) => inv.amountPaid > 0)
    .map((inv, i) => ({
      ...base(`pay-${i + 1}`),
      invoiceId: inv.id,
      studentId: inv.studentId,
      amount: inv.amountPaid,
      method: methods[i % methods.length],
      paidAt: isoDaysAgo((i % 15) + 1),
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
    {
      ...base('ann-3'), title: 'Term Fee Reminder', body: 'A friendly reminder that Term 1 tuition is due in 20 days. Payment plans are available on request.',
      audience: 'parents', authorId: 'user-admin', authorName: 'Amira Hassan', pinned: true,
    } as Announcement,
    {
      ...base('ann-4'), title: 'Staff Meeting Friday', body: 'All teachers please attend the short staff meeting after classes this Friday.',
      audience: 'teachers', authorId: 'user-admin', authorName: 'Amira Hassan', pinned: false,
    } as Announcement,
    {
      ...base('ann-5'), title: 'Library Returns Due', body: 'Please return any overdue library books by the end of this week.',
      audience: 'students', authorId: 'user-admin', authorName: 'Amira Hassan', pinned: false,
    } as Announcement,
  ]);

  await booksRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('book-1'), title: 'Stories of the Prophets', author: 'Ibn Kathir', category: 'Islamic Studies', isbn: '978-1-000001', totalCopies: 5, availableCopies: 3 } as Book,
    { ...base('book-2'), title: 'Learning Qubee', author: 'Oromo Language Board', category: 'Language', isbn: '978-1-000002', totalCopies: 8, availableCopies: 7 } as Book,
    { ...base('book-3'), title: 'Tajweed Made Easy', author: 'Sumaya Ali', category: 'Quran', isbn: '978-1-000003', totalCopies: 4, availableCopies: 2 } as Book,
    { ...base('book-4'), title: 'Arabic for Beginners', author: 'Musa Warsame', category: 'Language', isbn: '978-1-000004', totalCopies: 6, availableCopies: 5 } as Book,
    { ...base('book-5'), title: 'Science Explorers Grade 3', author: 'Fatima Ahmed', category: 'Science', isbn: '978-1-000005', totalCopies: 6, availableCopies: 6 } as Book,
    { ...base('book-6'), title: 'Math Puzzles for Kids', author: 'Halima Nur', category: 'Mathematics', isbn: '978-1-000006', totalCopies: 5, availableCopies: 4 } as Book,
  ]);

  await bookLoansRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('loan-1'), bookId: 'book-1', studentId: 'student-1', borrowedAt: isoDaysAgo(10), dueDate: isoDaysFromNow(4), status: 'borrowed' } as BookLoan,
    { ...base('loan-2'), bookId: 'book-3', studentId: 'student-2', borrowedAt: isoDaysAgo(20), dueDate: isoDaysAgo(6), status: 'overdue' } as BookLoan,
    { ...base('loan-3'), bookId: 'book-2', studentId: 'student-13', borrowedAt: isoDaysAgo(5), dueDate: isoDaysFromNow(9), status: 'borrowed' } as BookLoan,
    { ...base('loan-4'), bookId: 'book-4', studentId: 'student-14', borrowedAt: isoDaysAgo(15), dueDate: isoDaysAgo(1), status: 'overdue' } as BookLoan,
    { ...base('loan-5'), bookId: 'book-6', studentId: 'student-25', borrowedAt: isoDaysAgo(3), dueDate: isoDaysFromNow(11), status: 'borrowed' } as BookLoan,
    { ...base('loan-6'), bookId: 'book-5', studentId: 'student-26', borrowedAt: isoDaysAgo(30), dueDate: isoDaysAgo(16), status: 'returned' } as BookLoan,
  ]);

  await quranProgressRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('qp-1'), studentId: 'student-1', surah: 'Al-Fatiha', ayahRange: '1-7', memorisationStatus: 'memorised', recitationLevel: 'intermediate', teacherComment: 'Excellent tajweed.', date: isoDaysAgo(3) } as QuranProgress,
    { ...base('qp-2'), studentId: 'student-1', surah: 'Al-Ikhlas', ayahRange: '1-4', memorisationStatus: 'in_progress', recitationLevel: 'beginner', date: isoDaysAgo(1) } as QuranProgress,
    { ...base('qp-3'), studentId: 'student-13', surah: 'An-Nas', ayahRange: '1-6', memorisationStatus: 'memorised', recitationLevel: 'intermediate', teacherComment: 'Confident recitation.', date: isoDaysAgo(2) } as QuranProgress,
    { ...base('qp-4'), studentId: 'student-25', surah: 'Al-Kawthar', ayahRange: '1-3', memorisationStatus: 'in_progress', recitationLevel: 'beginner', date: isoDaysAgo(4) } as QuranProgress,
  ]);

  await iqraProgressRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('iq-1'), studentId: 'student-2', bookLevel: 'Iqra 2', lesson: 'Lesson 9', completionStatus: 'in_progress', teacherAssessment: 'Needs more practice with madd letters.', date: isoDaysAgo(2) } as IqraProgress,
    { ...base('iq-2'), studentId: 'student-14', bookLevel: 'Iqra 3', lesson: 'Lesson 4', completionStatus: 'completed', teacherAssessment: 'Reads smoothly, ready for Iqra 4.', date: isoDaysAgo(6) } as IqraProgress,
  ]);

  await islamicStudiesRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('is-1'), studentId: 'student-3', bookLevel: 'Level 1', topic: 'Pillars of Islam', lesson: 'The Five Pillars', assessment: 'Very good', progress: 'completed', date: isoDaysAgo(4) } as IslamicStudiesProgress,
    { ...base('is-2'), studentId: 'student-15', bookLevel: 'Level 2', topic: 'Prophets', lesson: 'Prophet Nuh (AS)', assessment: 'Good understanding', progress: 'in_progress', date: isoDaysAgo(7) } as IslamicStudiesProgress,
  ]);

  await oromoProgressRepo.seedIfEmpty(DEMO_SCHOOL_ID, () => [
    { ...base('op-1'), studentId: 'student-4', qubee: 'A - Z', reading: 'in_progress', writing: 'in_progress', vocabulary: 'Family & greetings', progress: 'in_progress', date: isoDaysAgo(2) } as OromoProgress,
    { ...base('op-2'), studentId: 'student-16', qubee: 'A - M', reading: 'proficient', writing: 'in_progress', vocabulary: 'Numbers & colors', progress: 'in_progress', date: isoDaysAgo(5) } as OromoProgress,
  ]);
}
