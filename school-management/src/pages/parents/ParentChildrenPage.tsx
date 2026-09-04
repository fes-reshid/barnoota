import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { studentsRepo, classesRepo } from '@/lib/services';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Phone, MapPin, HeartPulse } from 'lucide-react';

export default function ParentChildrenPage() {
  usePageTitle('Children');
  const { currentUser } = useAuth();
  const { data: students, loading: l1 } = useRepoList(studentsRepo);
  const { data: classes, loading: l2 } = useRepoList(classesRepo);

  if (l1 || l2) return <Spinner />;

  const children = students.filter((s) => (currentUser?.childrenIds ?? []).includes(s.id));
  if (children.length === 0) return <EmptyState title="No children linked to this account" description="Contact the school office to link your children's profiles." />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {children.map((child) => {
        const cls = classes.find((c) => c.id === child.classId);
        return (
          <Card key={child.id}>
            <CardHeader
              title={`${child.firstName} ${child.lastName}`}
              subtitle={`${child.studentCode} · ${cls?.name ?? '—'} · ${child.yearLevel}`}
              action={<Badge tone={child.status === 'active' ? 'green' : 'slate'}>{child.status}</Badge>}
            />
            <CardBody className="space-y-2 text-sm text-slate-600">
              <p><span className="text-slate-500">Date of birth:</span> {child.dob}</p>
              <p><span className="text-slate-500">Enrolled:</span> {child.enrollmentDate}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {child.address || '—'}</p>
              <p className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-slate-400" /> {child.medicalNotes || 'No medical notes on file'}</p>
              <div className="border-t border-slate-100 pt-2">
                <p className="text-xs font-semibold uppercase text-slate-400">Emergency contact</p>
                <p className="mt-1 font-medium text-slate-700">{child.emergencyContactName || '—'}</p>
                <p className="flex items-center gap-2 text-slate-600"><Phone className="h-3.5 w-3.5" /> {child.emergencyContactPhone || '—'}</p>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
