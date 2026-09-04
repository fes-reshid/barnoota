import { useState } from 'react';
import { Plus, Paperclip } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import { homeworkRepo, homeworkSubmissionsRepo, classesRepo, subjectsRepo, studentsRepo } from '@/lib/services';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { HomeworkFormModal } from './HomeworkFormModal';

export default function HomeworkListPage() {
  usePageTitle('Homework');
  const { data: homework, loading: l1, reload } = useRepoList(homeworkRepo);
  const { data: submissions, loading: l2 } = useRepoList(homeworkSubmissionsRepo);
  const { data: classes, loading: l3 } = useRepoList(classesRepo);
  const { data: subjects, loading: l4 } = useRepoList(subjectsRepo);
  const { data: students, loading: l5 } = useRepoList(studentsRepo);
  const [open, setOpen] = useState(false);

  if (l1 || l2 || l3 || l4 || l5) return <Spinner />;

  const sorted = [...homework].sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Assign homework</button>
      </div>

      {sorted.length === 0 ? (
        <Card><EmptyState title="No homework assigned yet" action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Assign homework</button>} /></Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((h) => {
            const cls = classes.find((c) => c.id === h.classId);
            const subject = subjects.find((s) => s.id === h.subjectId);
            const classSize = students.filter((s) => s.classId === h.classId && s.status === 'active').length;
            const submitted = submissions.filter((s) => s.homeworkId === h.id && (s.status === 'submitted' || s.status === 'graded')).length;
            const overdue = h.dueDate < new Date().toISOString().slice(0, 10);
            return (
              <Card key={h.id}>
                <CardHeader
                  title={h.title}
                  subtitle={`${cls?.name ?? ''} · ${subject?.name ?? ''} · Due ${h.dueDate}`}
                  action={<Badge tone={overdue ? 'rose' : 'green'}>{overdue ? 'Overdue' : 'Open'}</Badge>}
                />
                <CardBody className="space-y-2">
                  <p className="text-sm text-slate-600">{h.description}</p>
                  {h.attachmentUrl && (
                    <a href={h.attachmentUrl} target="_blank" rel="noreferrer" className="flex w-fit items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                      <Paperclip className="h-3.5 w-3.5" /> View attachment
                    </a>
                  )}
                  <p className="text-xs text-slate-500">{submitted} of {classSize} students submitted</p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <HomeworkFormModal open={open} onClose={() => setOpen(false)} onSaved={reload} classes={classes} subjects={subjects} />
    </div>
  );
}
