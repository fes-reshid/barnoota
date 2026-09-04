import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { studentsRepo, classesRepo } from '@/lib/services';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Mail, Phone, MapPin, HeartPulse } from 'lucide-react';

export default function MyProfilePage() {
  usePageTitle('My Profile');
  const { currentUser } = useAuth();
  const { data: students, loading: l1 } = useRepoList(studentsRepo);
  const { data: classes, loading: l2 } = useRepoList(classesRepo);

  if (l1 || l2) return <Spinner />;

  const me = students.find((s) => s.id === currentUser?.studentId);
  if (!me) return <EmptyState title="Your student profile isn't linked yet" />;
  const cls = classes.find((c) => c.id === me.classId);

  return (
    <Card>
      <CardHeader
        title={`${me.firstName} ${me.lastName}`}
        subtitle={`${me.studentCode} · ${cls?.name ?? '—'} · ${me.yearLevel}`}
        action={<Badge tone={me.status === 'active' ? 'green' : 'slate'}>{me.status}</Badge>}
      />
      <CardBody className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase text-slate-400">Personal details</p>
          <p><span className="text-slate-500">Date of birth:</span> {me.dob}</p>
          <p><span className="text-slate-500">Gender:</span> {me.gender}</p>
          <p><span className="text-slate-500">Enrolled:</span> {me.enrollmentDate}</p>
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {me.address || '—'}</p>
          <p className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-slate-400" /> {me.medicalNotes || 'No medical notes on file'}</p>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase text-slate-400">Guardian</p>
          <p className="font-medium text-slate-700">{me.guardianName}</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {me.guardianPhone}</p>
          {me.guardianEmail && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {me.guardianEmail}</p>}
        </div>
      </CardBody>
    </Card>
  );
}
