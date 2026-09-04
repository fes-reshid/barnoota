import { Link } from 'react-router-dom';
import { School, GraduationCap, ClipboardList, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { classesRepo, studentsRepo, homeworkRepo, examsRepo } from '@/lib/services';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

export default function TeacherDashboard() {
  usePageTitle('Dashboard');
  const { currentUser } = useAuth();
  const { data: classes, loading: l1 } = useRepoList(classesRepo);
  const { data: students, loading: l2 } = useRepoList(studentsRepo);
  const { data: homework, loading: l3 } = useRepoList(homeworkRepo);
  const { data: exams, loading: l4 } = useRepoList(examsRepo);

  if (l1 || l2 || l3 || l4) return <Spinner />;

  const myClasses = classes.filter((c) => c.classTeacherId === currentUser?.teacherId);
  const myClassIds = myClasses.length ? myClasses.map((c) => c.id) : classes.map((c) => c.id);
  const myStudents = students.filter((s) => myClassIds.includes(s.classId));
  const myHomework = homework.filter((h) => h.teacherId === currentUser?.teacherId);
  const today = new Date().toISOString().slice(0, 10);
  const upcomingExams = exams.filter((e) => e.date >= today);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Classes" value={myClasses.length || classes.length} icon={School} tone="brand" />
        <StatCard label="My Students" value={myStudents.length} icon={GraduationCap} tone="sky" />
        <StatCard label="Homework Assigned" value={myHomework.length} icon={ClipboardList} tone="violet" />
        <StatCard label="Upcoming Exams" value={upcomingExams.length} icon={FileSpreadsheet} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Quick actions"
          />
          <CardBody className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link to="/teacher/attendance" className="btn-secondary justify-start">Mark attendance</Link>
            <Link to="/teacher/homework" className="btn-secondary justify-start">Assign homework</Link>
            <Link to="/teacher/exams" className="btn-secondary justify-start">Enter marks</Link>
            <Link to="/teacher/students" className="btn-secondary justify-start">View students</Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="My classes"
            action={<Link to="/teacher/classes" className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>}
          />
          <CardBody className="!p-0 divide-y divide-slate-100">
            {(myClasses.length ? myClasses : classes).map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-medium text-slate-700">{c.name} — {c.section}</p>
                <p className="text-xs text-slate-500">{students.filter((s) => s.classId === c.id).length} students</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
