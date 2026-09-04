import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { studentsRepo } from '@/lib/services';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ExamResultsFor } from './StudentExamsPage';

export default function ParentExamsPage() {
  usePageTitle('Exam Results');
  const { currentUser } = useAuth();
  const { data: students, loading } = useRepoList(studentsRepo);

  if (loading) return <Spinner />;
  const children = students.filter((s) => (currentUser?.childrenIds ?? []).includes(s.id));
  if (children.length === 0) return <EmptyState title="No children linked" />;

  return (
    <div className="space-y-6">
      {children.map((c) => <ExamResultsFor key={c.id} studentId={c.id} />)}
    </div>
  );
}
