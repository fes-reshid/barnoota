// Central domain model for the School Management System.
// These types describe the shape of every Firestore collection used by the
// app. Keeping them in one place lets the UI, the demo (localStorage) data
// store, and the real Firestore repositories all share a single contract.

export type Role = 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';

export interface BaseRecord {
  id: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface School extends BaseRecord {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  subscriptionPlan: 'trial' | 'basic' | 'standard' | 'premium';
  subscriptionStatus: 'active' | 'past_due' | 'canceled';
  islamicModulesEnabled: {
    quran: boolean;
    iqra: boolean;
    islamicStudies: boolean;
    oromoLanguage: boolean;
  };
}

export interface AppUser extends BaseRecord {
  authUid: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  active: boolean;
  // Role-specific linkage
  studentId?: string;
  teacherId?: string;
  childrenIds?: string[]; // for parents
}

export type Gender = 'male' | 'female';

export interface Student extends BaseRecord {
  studentCode: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  dob: string;
  gender: Gender;
  classId: string;
  yearLevel: string;
  enrollmentDate: string;
  status: 'active' | 'archived' | 'graduated';
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes?: string;
  parentUserId?: string;
}

export interface StudentDocument extends BaseRecord {
  studentId: string;
  name: string;
  category: 'id' | 'medical' | 'academic' | 'other';
  fileUrl: string;
  uploadedAt: string;
}

export interface Teacher extends BaseRecord {
  teacherCode: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  email: string;
  phone: string;
  subjectIds: string[];
  classIds: string[];
  employmentType: 'full_time' | 'part_time' | 'volunteer';
  hireDate: string;
  status: 'active' | 'archived';
  userId?: string;
}

export interface AcademicYear extends BaseRecord {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface SchoolClass extends BaseRecord {
  name: string;
  yearLevel: string;
  section: string;
  academicYearId: string;
  classTeacherId?: string;
  capacity: number;
}

export interface Subject extends BaseRecord {
  name: string;
  code: string;
  color: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord extends BaseRecord {
  classId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
  markedBy: string;
}

export interface TimetableSlot extends BaseRecord {
  classId: string;
  teacherId: string;
  subjectId: string;
  room: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface Homework extends BaseRecord {
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  attachmentUrl?: string;
  dueDate: string;
  assignedDate: string;
}

export interface HomeworkSubmission extends BaseRecord {
  homeworkId: string;
  studentId: string;
  submittedAt?: string;
  fileUrl?: string;
  status: 'pending' | 'submitted' | 'late' | 'graded';
  grade?: string;
  feedback?: string;
}

export interface ExamType extends BaseRecord {
  name: string; // Midterm, Final, Quiz...
}

export interface Exam extends BaseRecord {
  name: string;
  examTypeId: string;
  classId: string;
  subjectId: string;
  date: string;
  maxMarks: number;
}

export interface ExamResult extends BaseRecord {
  examId: string;
  studentId: string;
  marksObtained: number;
  grade?: string;
  teacherComment?: string;
}

export interface FeeCategory extends BaseRecord {
  name: string;
  description?: string;
}

export interface FeeStructure extends BaseRecord {
  name: string;
  categoryId: string;
  yearLevel: string;
  amount: number;
  dueDate: string;
  academicYearId: string;
}

export interface FeeInvoice extends BaseRecord {
  studentId: string;
  feeStructureId: string;
  amount: number;
  discount: number;
  amountPaid: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  dueDate: string;
}

export interface FeePayment extends BaseRecord {
  invoiceId: string;
  studentId: string;
  amount: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money';
  paidAt: string;
  receiptNumber: string;
  recordedBy: string;
}

export type AnnouncementAudience = 'everyone' | 'teachers' | 'parents' | 'students' | 'class';

export interface Announcement extends BaseRecord {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  classId?: string;
  authorId: string;
  authorName: string;
  pinned: boolean;
}

export interface MessageThread extends BaseRecord {
  subject: string;
  participantIds: string[];
  participantNames: string[];
  lastMessagePreview: string;
  lastMessageAt: string;
}

export interface Message extends BaseRecord {
  threadId: string;
  senderId: string;
  senderName: string;
  body: string;
  sentAt: string;
  readBy: string[];
}

export interface Book extends BaseRecord {
  title: string;
  author: string;
  category: string;
  isbn: string;
  totalCopies: number;
  availableCopies: number;
  coverUrl?: string;
}

export interface BookLoan extends BaseRecord {
  bookId: string;
  studentId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: 'borrowed' | 'returned' | 'overdue';
}

// --- Islamic weekend school modules ---

export interface QuranProgress extends BaseRecord {
  studentId: string;
  surah: string;
  ayahRange: string;
  memorisationStatus: 'not_started' | 'in_progress' | 'memorised' | 'revised';
  recitationLevel: 'beginner' | 'intermediate' | 'advanced';
  teacherComment?: string;
  date: string;
}

export interface IqraProgress extends BaseRecord {
  studentId: string;
  bookLevel: string; // Iqra 1-6
  lesson: string;
  completionStatus: 'not_started' | 'in_progress' | 'completed';
  teacherAssessment?: string;
  date: string;
}

export interface IslamicStudiesProgress extends BaseRecord {
  studentId: string;
  bookLevel: string;
  topic: string;
  lesson: string;
  assessment?: string;
  progress: 'not_started' | 'in_progress' | 'completed';
  date: string;
}

export interface OromoProgress extends BaseRecord {
  studentId: string;
  qubee: string;
  reading: 'not_started' | 'in_progress' | 'proficient';
  writing: 'not_started' | 'in_progress' | 'proficient';
  vocabulary: string;
  progress: 'not_started' | 'in_progress' | 'completed';
  date: string;
}

export interface TransportRoute extends BaseRecord {
  name: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  capacity: number;
  stops: string;
}

export interface ID {
  id: string;
}
