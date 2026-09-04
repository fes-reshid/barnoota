import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { examResultsRepo, examsRepo, subjectsRepo, studentsRepo } from '@/lib/services';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Printer, FileSpreadsheet } from 'lucide-react';

export function ExamResultsFor({ studentId }: { studentId: string }) {
  const { data: results, loading: l1 } = useRepoList(examResultsRepo);
  const { data: exams, loading: l2 } = useRepoList(examsRepo);
  const { data: subjects, loading: l3 } = useRepoList(subjectsRepo);
  const { data: students, loading: l4 } = useRepoList(studentsRepo);

  if (l1 || l2 || l3 || l4) return <Spinner />;

  const student = students.find((s) => s.id === studentId);
  const myResults = results.filter((r) => r.studentId === studentId);

  if (myResults.length === 0) {
    return <EmptyState icon={FileSpreadsheet} title="No exam results yet" />;
  }

  const totalObtained = myResults.reduce((sum, r) => sum + r.marksObtained, 0);
  const totalMax = myResults.reduce((sum, r) => {
    const exam = exams.find((e) => e.id === r.examId);
    return sum + (exam?.maxMarks ?? 0);
  }, 0);
  const average = totalMax ? Math.round((totalObtained / totalMax) * 100) : 0;

  return (
    <Card>
      <CardHeader
        title="Report card"
        subtitle={student ? `${student.firstName} ${student.lastName} · ${student.yearLevel}` : undefined}
        action={<button className="btn-secondary !py-1 !px-3 text-xs" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print</button>}
      />
      <CardBody className="!p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-medium">Exam</th>
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">Marks</th>
              <th className="px-5 py-3 font-medium">%</th>
              <th className="px-5 py-3 font-medium">Grade</th>
              <th className="px-5 py-3 font-medium">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {myResults.map((r) => {
              const exam = exams.find((e) => e.id === r.examId);
              const subject = subjects.find((s) => s.id === exam?.subjectId);
              const pct = exam ? Math.round((r.marksObtained / exam.maxMarks) * 100) : 0;
              return (
                <tr key={r.id}>
                  <td className="px-5 py-3">{exam?.name}</td>
                  <td className="px-5 py-3">{subject?.name}</td>
                  <td className="px-5 py-3">{r.marksObtained}/{exam?.maxMarks}</td>
                  <td className="px-5 py-3">{pct}%</td>
                  <td className="px-5 py-3 font-medium">{r.grade}</td>
                  <td className="px-5 py-3 text-slate-500">{r.teacherComment}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-slate-100 px-5 py-3 text-sm font-semibold text-slate-800">
          Overall average: {average}%
        </div>
      </CardBody>
    </Card>
  );
}

export default function StudentExamsPage() {
  usePageTitle('Exams & Results');
  const { currentUser } = useAuth();
  if (!currentUser?.studentId) return <EmptyState title="No student profile linked" />;
  return <ExamResultsFor studentId={currentUser.studentId} />;
}
