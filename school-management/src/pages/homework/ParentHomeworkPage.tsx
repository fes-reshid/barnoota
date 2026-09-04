import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { homeworkRepo, homeworkSubmissionsRepo, studentsRepo, subjectsRepo } from '@/lib/services';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { ClipboardList } from 'lucide-react';

export default function ParentHomeworkPage() {
  usePageTitle('Homework');
  const { currentUser } = useAuth();
  const { data: students, loading: l1 } = useRepoList(studentsRepo);
  const { data: homework, loading: l2 } = useRepoList(homeworkRepo);
  const { data: subjects, loading: l3 } = useRepoList(subjectsRepo);
  const { data: submissions, loading: l4 } = useRepoList(homeworkSubmissionsRepo);

  if (l1 || l2 || l3 || l4) return <Spinner />;

  const children = students.filter((s) => (currentUser?.childrenIds ?? []).includes(s.id));
  if (children.length === 0) return <EmptyState icon={ClipboardList} title="No children linked" />;

  return (
    <div className="space-y-6">
      {children.map((child) => {
        const childHomework = homework.filter((h) => h.classId === child.classId).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
        return (
          <Card key={child.id}>
            <CardHeader title={`${child.firstName} ${child.lastName}`} />
            {childHomework.length === 0 ? (
              <EmptyState title="No homework assigned" />
            ) : (
              <CardBody className="!p-0 divide-y divide-slate-100">
                {childHomework.map((h) => {
                  const subject = subjects.find((s) => s.id === h.subjectId);
                  const submission = submissions.find((s) => s.homeworkId === h.id && s.studentId === child.id);
                  const submitted = submission?.status === 'submitted' || submission?.status === 'graded';
                  return (
                    <div key={h.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{h.title}</p>
                        <p className="text-xs text-slate-500">{subject?.name} · Due {h.dueDate}</p>
                      </div>
                      <Badge tone={submitted ? 'green' : 'amber'}>{submission?.status ?? 'pending'}</Badge>
                    </div>
                  );
                })}
              </CardBody>
            )}
          </Card>
        );
      })}
    </div>
  );
}
