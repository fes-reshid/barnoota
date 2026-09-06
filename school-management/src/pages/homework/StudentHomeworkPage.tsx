import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { homeworkRepo, homeworkSubmissionsRepo, studentsRepo, subjectsRepo } from '@/lib/services';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { FileLink } from '@/components/ui/FileLink';
import { ClipboardList } from 'lucide-react';

export default function StudentHomeworkPage() {
  usePageTitle('Homework');
  const { currentUser, schoolId } = useAuth();
  const { data: students, loading: l1 } = useRepoList(studentsRepo);
  const { data: homework, loading: l2 } = useRepoList(homeworkRepo);
  const { data: subjects, loading: l3 } = useRepoList(subjectsRepo);
  const { data: submissions, loading: l4, reload } = useRepoList(homeworkSubmissionsRepo);
  const { showToast } = useToast();

  if (l1 || l2 || l3 || l4) return <Spinner />;

  const me = students.find((s) => s.id === currentUser?.studentId);
  if (!me) return <EmptyState icon={ClipboardList} title="No student profile linked" />;

  const myHomework = homework.filter((h) => h.classId === me.classId).sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  async function submit(homeworkId: string) {
    const existing = submissions.find((s) => s.homeworkId === homeworkId && s.studentId === me!.id);
    if (existing) {
      await homeworkSubmissionsRepo.update(existing.id, { status: 'submitted', submittedAt: new Date().toISOString() });
    } else {
      await homeworkSubmissionsRepo.create({
        schoolId, homeworkId, studentId: me!.id, status: 'submitted', submittedAt: new Date().toISOString(),
      });
    }
    showToast('Homework submitted.');
    reload();
  }

  if (myHomework.length === 0) return <EmptyState icon={ClipboardList} title="No homework assigned yet" />;

  return (
    <div className="space-y-4">
      {myHomework.map((h) => {
        const subject = subjects.find((s) => s.id === h.subjectId);
        const submission = submissions.find((s) => s.homeworkId === h.id && s.studentId === me.id);
        const submitted = submission?.status === 'submitted' || submission?.status === 'graded';
        return (
          <Card key={h.id}>
            <CardHeader
              title={h.title}
              subtitle={`${subject?.name ?? ''} · Due ${h.dueDate}`}
              action={<Badge tone={submitted ? 'green' : 'amber'}>{submission?.status ?? 'pending'}</Badge>}
            />
            <CardBody className="space-y-3">
              <p className="text-sm text-slate-600">{h.description}</p>
              {h.attachmentUrl && <FileLink url={h.attachmentUrl} name="Download attachment" />}
              {submission?.grade && <p className="text-xs text-slate-500">Grade: <span className="font-medium text-slate-700">{submission.grade}</span></p>}
              {submission?.feedback && <p className="text-xs text-slate-500">Feedback: {submission.feedback}</p>}
              {!submitted && (
                <button className="btn-primary" onClick={() => submit(h.id)}>Mark as submitted</button>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
