import { createRepository } from './repository';
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
  Message,
  MessageThread,
  OromoProgress,
  QuranProgress,
  School,
  SchoolClass,
  Student,
  StudentDocument,
  Subject,
  Teacher,
  TimetableSlot,
  TransportRoute,
} from '@/types';

export const DEMO_SCHOOL_ID = 'demo-school';

export const schoolsRepo = createRepository<School>('schools');
export const usersRepo = createRepository<AppUser>('users');
export const studentsRepo = createRepository<Student>('students');
export const studentDocumentsRepo = createRepository<StudentDocument>('studentDocuments');
export const teachersRepo = createRepository<Teacher>('teachers');
export const academicYearsRepo = createRepository<AcademicYear>('academicYears');
export const classesRepo = createRepository<SchoolClass>('classes');
export const subjectsRepo = createRepository<Subject>('subjects');
export const attendanceRepo = createRepository<AttendanceRecord>('attendance');
export const timetableRepo = createRepository<TimetableSlot>('timetable');
export const homeworkRepo = createRepository<Homework>('homework');
export const homeworkSubmissionsRepo = createRepository<HomeworkSubmission>('submissions');
export const examTypesRepo = createRepository<ExamType>('examTypes');
export const examsRepo = createRepository<Exam>('exams');
export const examResultsRepo = createRepository<ExamResult>('results');
export const feeCategoriesRepo = createRepository<FeeCategory>('feeCategories');
export const feeStructuresRepo = createRepository<FeeStructure>('feeStructures');
export const feeInvoicesRepo = createRepository<FeeInvoice>('feeInvoices');
export const feePaymentsRepo = createRepository<FeePayment>('payments');
export const announcementsRepo = createRepository<Announcement>('announcements');
export const messageThreadsRepo = createRepository<MessageThread>('messageThreads');
export const messagesRepo = createRepository<Message>('messages');
export const booksRepo = createRepository<Book>('books');
export const bookLoansRepo = createRepository<BookLoan>('loans');
export const quranProgressRepo = createRepository<QuranProgress>('quranProgress');
export const iqraProgressRepo = createRepository<IqraProgress>('iqraProgress');
export const islamicStudiesRepo = createRepository<IslamicStudiesProgress>('islamicStudies');
export const oromoProgressRepo = createRepository<OromoProgress>('oromoProgress');
export const transportRoutesRepo = createRepository<TransportRoute>('transportRoutes');
