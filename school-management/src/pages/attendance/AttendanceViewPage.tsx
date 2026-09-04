import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { studentsRepo, attendanceRepo } from '@/lib/services';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarCheck } from 'lucide-react';

export default function AttendanceViewPage() {
  usePageTitle('Attendance');
  const { currentUser } = useAuth();
  const { data: students, loading: l1 } = useRepoList(studentsRepo);
  const { data: attendance, loading: l2 } = useRepoList(attendanceRepo);

  if (l1 || l2) return <Spinner />;

  const targets = currentUser?.role === 'student'
    ? students.filter((s) => s.id === currentUser.studentId)
    : students.filter((s) => (currentUser?.childrenIds ?? []).includes(s.id));

  if (targets.length === 0) {
    return <EmptyState icon={CalendarCheck} title="No linked student profile" description="Contact your school admin to link a student." />;
  }

  return (
    <div className="space-y-4">
      {targets.map((student) => {
        const records = attendance.filter((a) => a.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
        const rate = records.length ? Math.round((records.filter((r) => r.status === 'present').length / records.length) * 100) : 0;
        return (
          <Card key={student.id}>
            <CardHeader title={`${student.firstName} ${student.lastName}`} subtitle={`${rate}% attendance rate`} />
            {records.length === 0 ? (
              <EmptyState title="No attendance records yet" />
            ) : (
              <CardBody className="!p-0 divide-y divide-slate-100">
                {records.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3">
                    <p className="text-sm text-slate-700">{r.date}</p>
                    <div className="flex items-center gap-2">
                      {r.note && <p className="text-xs text-slate-400">{r.note}</p>}
                      <Badge tone={r.status === 'present' ? 'green' : r.status === 'late' ? 'amber' : r.status === 'excused' ? 'sky' : 'rose'}>{r.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardBody>
            )}
          </Card>
        );
      })}
    </div>
  );
}
