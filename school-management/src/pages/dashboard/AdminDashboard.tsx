import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Users, School, CalendarCheck, Wallet, FileSpreadsheet,
  UserPlus, ClipboardList, Megaphone, ArrowRight,
} from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import {
  studentsRepo, teachersRepo, classesRepo, attendanceRepo, feeInvoicesRepo,
  examsRepo, announcementsRepo,
} from '@/lib/services';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EnrollmentChart } from '@/components/charts/EnrollmentChart';
import { AttendanceChart } from '@/components/charts/AttendanceChart';
import { FeesChart } from '@/components/charts/FeesChart';

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function AdminDashboard() {
  usePageTitle('Dashboard');

  const { data: students, loading: l1 } = useRepoList(studentsRepo);
  const { data: teachers, loading: l2 } = useRepoList(teachersRepo);
  const { data: classes, loading: l3 } = useRepoList(classesRepo);
  const { data: attendance, loading: l4 } = useRepoList(attendanceRepo);
  const { data: invoices, loading: l5 } = useRepoList(feeInvoicesRepo);
  const { data: exams, loading: l6 } = useRepoList(examsRepo);
  const { data: announcements, loading: l7 } = useRepoList(announcementsRepo);

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7;

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter((a) => a.date === today);
  const todayPresentRate = todayAttendance.length
    ? Math.round((todayAttendance.filter((a) => a.status === 'present').length / todayAttendance.length) * 100)
    : 0;

  const outstanding = invoices.reduce((sum, inv) => sum + (inv.amount - inv.discount - inv.amountPaid), 0);
  const collected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const upcomingExams = exams.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  const enrollmentData = useMemo(
    () =>
      classes.map((c) => ({
        className: c.name,
        students: students.filter((s) => s.classId === c.id && s.status === 'active').length,
      })),
    [classes, students],
  );

  const attendanceTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i));
    return days.map((date) => {
      const dayRecords = attendance.filter((a) => a.date === date);
      const rate = dayRecords.length
        ? Math.round((dayRecords.filter((a) => a.status === 'present').length / dayRecords.length) * 100)
        : 0;
      return { date: date.slice(5), rate };
    });
  }, [attendance]);

  const recentStudents = [...students]
    .sort((a, b) => b.enrollmentDate.localeCompare(a.enrollmentDate))
    .slice(0, 5);

  if (loading) return <Spinner label="Loading dashboard…" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Students" value={students.filter((s) => s.status === 'active').length} icon={GraduationCap} tone="brand" />
        <StatCard label="Total Teachers" value={teachers.filter((t) => t.status === 'active').length} icon={Users} tone="sky" />
        <StatCard label="Total Classes" value={classes.length} icon={School} tone="violet" />
        <StatCard label="Today's Attendance" value={`${todayPresentRate}%`} icon={CalendarCheck} tone="brand" hint={`${todayAttendance.length} records today`} />
        <StatCard label="Outstanding Fees" value={`$${outstanding.toLocaleString()}`} icon={Wallet} tone="amber" />
        <StatCard label="Upcoming Exams" value={upcomingExams.length} icon={FileSpreadsheet} tone="rose" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Weekly attendance trend" subtitle="Present rate across the last 7 days" />
          <CardBody><AttendanceChart data={attendanceTrend} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Fee collection" subtitle="Collected vs outstanding" />
          <CardBody><FeesChart collected={collected} outstanding={outstanding} /></CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Enrollment by class" />
          <CardBody><EnrollmentChart data={enrollmentData} /></CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Quick actions"
          />
          <CardBody className="grid grid-cols-1 gap-2">
            <Link to="/admin/students" className="btn-secondary justify-start"><UserPlus className="h-4 w-4" /> Add student</Link>
            <Link to="/admin/attendance" className="btn-secondary justify-start"><CalendarCheck className="h-4 w-4" /> Mark attendance</Link>
            <Link to="/admin/homework" className="btn-secondary justify-start"><ClipboardList className="h-4 w-4" /> Assign homework</Link>
            <Link to="/admin/announcements" className="btn-secondary justify-start"><Megaphone className="h-4 w-4" /> Post announcement</Link>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent student registrations"
            action={<Link to="/admin/students" className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>}
          />
          <CardBody className="!p-0 divide-y divide-slate-100">
            {recentStudents.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-slate-500">{s.yearLevel} · Enrolled {s.enrollmentDate}</p>
                </div>
                <Badge tone="green">{s.status}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent announcements"
            action={<Link to="/admin/announcements" className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>}
          />
          <CardBody className="!p-0 divide-y divide-slate-100">
            {announcements.slice(0, 5).map((a) => (
              <div key={a.id} className="px-5 py-3">
                <p className="text-sm font-medium text-slate-700">{a.title}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{a.body}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
