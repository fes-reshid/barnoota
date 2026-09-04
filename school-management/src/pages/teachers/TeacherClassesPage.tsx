import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { classesRepo, studentsRepo, subjectsRepo, timetableRepo } from '@/lib/services';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

export default function TeacherClassesPage() {
  usePageTitle('My Classes');
  const { currentUser } = useAuth();
  const { data: classes, loading: l1 } = useRepoList(classesRepo);
  const { data: students, loading: l2 } = useRepoList(studentsRepo);
  const { data: subjects, loading: l3 } = useRepoList(subjectsRepo);
  const { data: timetable, loading: l4 } = useRepoList(timetableRepo);

  if (l1 || l2 || l3 || l4) return <Spinner />;

  const myClasses = classes.filter((c) => c.classTeacherId === currentUser?.teacherId || timetable.some((t) => t.classId === c.id && t.teacherId === currentUser?.teacherId));

  if (myClasses.length === 0) return <EmptyState title="No classes assigned yet" />;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {myClasses.map((c) => {
        const roster = students.filter((s) => s.classId === c.id && s.status === 'active');
        const mySubjects = [...new Set(timetable.filter((t) => t.classId === c.id && t.teacherId === currentUser?.teacherId).map((t) => t.subjectId))];
        return (
          <Card key={c.id}>
            <CardHeader title={`${c.name} — ${c.section}`} subtitle={`${roster.length} students`} />
            <CardBody className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {mySubjects.map((id) => <Badge key={id} tone="sky">{subjects.find((s) => s.id === id)?.name ?? id}</Badge>)}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
