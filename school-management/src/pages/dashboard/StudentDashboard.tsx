import { Link } from 'react-router-dom';
import { CalendarCheck, ClipboardList, Wallet, FileSpreadsheet } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { studentsRepo, attendanceRepo, feeInvoicesRepo, homeworkRepo, timetableRepo } from '@/lib/services';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export default function StudentDashboard() {
  usePageTitle('Dashboard');
  const { currentUser } = useAuth();
  const { data: students, loading: l1 } = useRepoList(studentsRepo);
  const { data: attendance, loading: l2 } = useRepoList(attendanceRepo);
  const { data: invoices, loading: l3 } = useRepoList(feeInvoicesRepo);
  const { data: homework, loading: l4 } = useRepoList(homeworkRepo);
  const { data: timetable, loading: l5 } = useRepoList(timetableRepo);

  if (l1 || l2 || l3 || l4 || l5) return <Spinner />;

  const me = students.find((s) => s.id === currentUser?.studentId);
  if (!me) {
    return <EmptyState title="Your student profile isn't linked yet" description="Contact your school admin to link your account." />;
  }

  const myAttendance = attendance.filter((a) => a.studentId === me.id);
  const presentCount = myAttendance.filter((a) => a.status === 'present').length;
  const rate = myAttendance.length ? Math.round((presentCount / myAttendance.length) * 100) : 0;
  const myInvoices = invoices.filter((i) => i.studentId === me.id);
  const outstanding = myInvoices.reduce((sum, i) => sum + (i.amount - i.discount - i.amountPaid), 0);
  const myHomework = homework.filter((h) => h.classId === me.classId);
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'short' }) as typeof timetable[number]['day'];
  const todaySlots = timetable.filter((t) => t.classId === me.classId && t.day === todayName);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance rate" value={`${rate}%`} icon={CalendarCheck} tone="brand" />
        <StatCard label="Homework due" value={myHomework.length} icon={ClipboardList} tone="sky" />
        <StatCard label="Outstanding fees" value={`$${outstanding.toLocaleString()}`} icon={Wallet} tone="amber" />
        <StatCard label="Today's classes" value={todaySlots.length} icon={FileSpreadsheet} tone="violet" />
      </div>

      <Card>
        <CardHeader title="Today's timetable" />
        <CardBody className="!p-0 divide-y divide-slate-100">
          {todaySlots.length === 0 ? (
            <EmptyState title="No classes scheduled today" />
          ) : (
            todaySlots.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-medium text-slate-700">{t.startTime} - {t.endTime}</p>
                <p className="text-xs text-slate-500">Room {t.room}</p>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Quick links" />
        <CardBody className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link to="/student/homework" className="btn-secondary justify-start"><ClipboardList className="h-4 w-4" /> View homework</Link>
          <Link to="/student/exams" className="btn-secondary justify-start"><FileSpreadsheet className="h-4 w-4" /> View results</Link>
          <Link to="/student/fees" className="btn-secondary justify-start"><Wallet className="h-4 w-4" /> View fees</Link>
          <Link to="/student/timetable" className="btn-secondary justify-start"><CalendarCheck className="h-4 w-4" /> Full timetable</Link>
        </CardBody>
      </Card>
    </div>
  );
}
