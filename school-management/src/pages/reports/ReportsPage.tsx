import { Download, FileText } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import {
  studentsRepo, teachersRepo, classesRepo, attendanceRepo, feeInvoicesRepo,
  examResultsRepo, examsRepo, subjectsRepo, homeworkRepo, homeworkSubmissionsRepo, booksRepo, bookLoansRepo,
} from '@/lib/services';
import { exportToCsv } from '@/lib/csv';
import { Card, CardBody } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

export default function ReportsPage() {
  usePageTitle('Reports');
  const { data: students, loading: l1 } = useRepoList(studentsRepo);
  const { data: teachers, loading: l2 } = useRepoList(teachersRepo);
  const { data: classes, loading: l3 } = useRepoList(classesRepo);
  const { data: attendance, loading: l4 } = useRepoList(attendanceRepo);
  const { data: invoices, loading: l5 } = useRepoList(feeInvoicesRepo);
  const { data: results, loading: l6 } = useRepoList(examResultsRepo);
  const { data: exams } = useRepoList(examsRepo);
  const { data: subjects } = useRepoList(subjectsRepo);
  const { data: homework, loading: l7 } = useRepoList(homeworkRepo);
  const { data: submissions } = useRepoList(homeworkSubmissionsRepo);
  const { data: books, loading: l8 } = useRepoList(booksRepo);
  const { data: loans } = useRepoList(bookLoansRepo);

  const loading = [l1, l2, l3, l4, l5, l6, l7, l8].some(Boolean);
  if (loading) return <Spinner />;

  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? '—';

  const reports = [
    {
      title: 'Student report', description: 'Full roster with class, status and enrollment date.',
      run: () => exportToCsv('student-report.csv', students.map((s) => ({
        code: s.studentCode, name: `${s.firstName} ${s.lastName}`, class: className(s.classId), status: s.status, enrolled: s.enrollmentDate,
      }))),
    },
    {
      title: 'Attendance report', description: 'Every attendance record with status and notes.',
      run: () => exportToCsv('attendance-report.csv', attendance.map((a) => ({
        date: a.date, student: students.find((s) => s.id === a.studentId)?.firstName ?? a.studentId, class: className(a.classId), status: a.status,
      }))),
    },
    {
      title: 'Fees report', description: 'Invoice status and balances per student.',
      run: () => exportToCsv('fees-report.csv', invoices.map((i) => {
        const s = students.find((st) => st.id === i.studentId);
        return { student: s ? `${s.firstName} ${s.lastName}` : i.studentId, amount: i.amount, paid: i.amountPaid, balance: i.amount - i.discount - i.amountPaid, status: i.status };
      })),
    },
    {
      title: 'Exam results', description: 'Marks, percentage and grade for every recorded result.',
      run: () => exportToCsv('exam-results.csv', results.map((r) => {
        const exam = exams.find((e) => e.id === r.examId);
        const subject = subjects.find((s) => s.id === exam?.subjectId);
        const s = students.find((st) => st.id === r.studentId);
        return {
          student: s ? `${s.firstName} ${s.lastName}` : r.studentId, exam: exam?.name ?? '', subject: subject?.name ?? '',
          marks: r.marksObtained, max: exam?.maxMarks ?? '', grade: r.grade ?? '',
        };
      })),
    },
    {
      title: 'Teacher report', description: 'Teacher roster with subjects and employment type.',
      run: () => exportToCsv('teacher-report.csv', teachers.map((t) => ({
        code: t.teacherCode, name: `${t.firstName} ${t.lastName}`, email: t.email, employment: t.employmentType, status: t.status,
      }))),
    },
    {
      title: 'Class report', description: 'Enrollment counts and capacity per class.',
      run: () => exportToCsv('class-report.csv', classes.map((c) => ({
        class: c.name, yearLevel: c.yearLevel, students: students.filter((s) => s.classId === c.id && s.status === 'active').length, capacity: c.capacity,
      }))),
    },
    {
      title: 'Homework report', description: 'Assignment counts and submission rates.',
      run: () => exportToCsv('homework-report.csv', homework.map((h) => ({
        title: h.title, class: className(h.classId), due: h.dueDate,
        submitted: submissions.filter((s) => s.homeworkId === h.id && (s.status === 'submitted' || s.status === 'graded')).length,
      }))),
    },
    {
      title: 'Library report', description: 'Book inventory and current loan status.',
      run: () => exportToCsv('library-report.csv', books.map((b) => ({
        title: b.title, author: b.author, total: b.totalCopies, available: b.availableCopies,
        activeLoans: loans.filter((l) => l.bookId === b.id && l.status !== 'returned').length,
      }))),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {reports.map((r) => (
        <Card key={r.title}>
          <CardBody className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-50 p-2 text-brand-700"><FileText className="h-4 w-4" /></div>
              <p className="font-semibold text-slate-800">{r.title}</p>
            </div>
            <p className="text-sm text-slate-500">{r.description}</p>
            <button className="btn-secondary mt-auto" onClick={r.run}><Download className="h-4 w-4" /> Export CSV</button>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
