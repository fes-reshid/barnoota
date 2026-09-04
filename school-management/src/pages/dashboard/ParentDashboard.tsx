import { Link } from 'react-router-dom';
import { GraduationCap, CalendarCheck, Wallet, ClipboardList } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { studentsRepo, attendanceRepo, feeInvoicesRepo, homeworkRepo } from '@/lib/services';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ParentDashboard() {
  usePageTitle('Dashboard');
  const { currentUser } = useAuth();
  const { data: students, loading: l1 } = useRepoList(studentsRepo);
  const { data: attendance, loading: l2 } = useRepoList(attendanceRepo);
  const { data: invoices, loading: l3 } = useRepoList(feeInvoicesRepo);
  const { data: homework, loading: l4 } = useRepoList(homeworkRepo);

  if (l1 || l2 || l3 || l4) return <Spinner />;

  const childrenIds = currentUser?.childrenIds ?? [];
  const children = students.filter((s) => childrenIds.includes(s.id));

  if (children.length === 0) {
    return <EmptyState title="No children linked to this account" description="Contact the school office to link your children's profiles." />;
  }

  return (
    <div className="space-y-6">
      {children.map((child) => {
        const childAttendance = attendance.filter((a) => a.studentId === child.id);
        const presentCount = childAttendance.filter((a) => a.status === 'present').length;
        const rate = childAttendance.length ? Math.round((presentCount / childAttendance.length) * 100) : 0;
        const childInvoices = invoices.filter((i) => i.studentId === child.id);
        const outstanding = childInvoices.reduce((sum, i) => sum + (i.amount - i.discount - i.amountPaid), 0);
        const childHomework = homework.filter((h) => h.classId === child.classId);

        return (
          <Card key={child.id}>
            <CardHeader title={`${child.firstName} ${child.lastName}`} subtitle={`${child.yearLevel} · ${child.studentCode}`} />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Attendance rate" value={`${rate}%`} icon={CalendarCheck} tone="brand" />
              <StatCard label="Outstanding fees" value={`$${outstanding.toLocaleString()}`} icon={Wallet} tone="amber" />
              <StatCard label="Homework due" value={childHomework.length} icon={ClipboardList} tone="sky" />
            </CardBody>
          </Card>
        );
      })}

      <Card>
        <CardHeader title="Quick links" />
        <CardBody className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link to="/parent/attendance" className="btn-secondary justify-start"><CalendarCheck className="h-4 w-4" /> View attendance</Link>
          <Link to="/parent/homework" className="btn-secondary justify-start"><ClipboardList className="h-4 w-4" /> View homework</Link>
          <Link to="/parent/fees" className="btn-secondary justify-start"><Wallet className="h-4 w-4" /> Pay fees</Link>
          <Link to="/parent/children" className="btn-secondary justify-start"><GraduationCap className="h-4 w-4" /> View profiles</Link>
        </CardBody>
      </Card>
    </div>
  );
}
