import { useState } from 'react';
import { Plus, PencilLine } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import { examsRepo, examTypesRepo, examResultsRepo, classesRepo, subjectsRepo, studentsRepo } from '@/lib/services';
import type { Exam } from '@/types';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { ExamFormModal } from './ExamFormModal';
import { EnterMarksModal } from './EnterMarksModal';

export default function ExamsListPage() {
  usePageTitle('Exams & Results');
  const { data: exams, loading, reload } = useRepoList(examsRepo);
  const { data: examTypes } = useRepoList(examTypesRepo);
  const { data: classes } = useRepoList(classesRepo);
  const { data: subjects } = useRepoList(subjectsRepo);
  const { data: students } = useRepoList(studentsRepo);
  const { data: results, reload: reloadResults } = useRepoList(examResultsRepo);

  const [examOpen, setExamOpen] = useState(false);
  const [marksExam, setMarksExam] = useState<Exam | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const columns: Column<Exam>[] = [
    { header: 'Exam', render: (e) => <p className="font-medium text-slate-800">{e.name}</p> },
    { header: 'Class', render: (e) => classes.find((c) => c.id === e.classId)?.name ?? '—' },
    { header: 'Subject', render: (e) => subjects.find((s) => s.id === e.subjectId)?.name ?? '—' },
    { header: 'Type', render: (e) => examTypes.find((t) => t.id === e.examTypeId)?.name ?? '—' },
    { header: 'Date', render: (e) => <Badge tone={e.date >= today ? 'sky' : 'slate'}>{e.date}</Badge> },
    {
      header: 'Recorded', render: (e) => {
        const classSize = students.filter((s) => s.classId === e.classId && s.status === 'active').length;
        const recorded = results.filter((r) => r.examId === e.id).length;
        return `${recorded} / ${classSize}`;
      },
    },
    {
      header: '', className: 'text-right',
      render: (e) => (
        <button className="btn-secondary !py-1 !px-3 text-xs" onClick={() => setMarksExam(e)}>
          <PencilLine className="h-3.5 w-3.5" /> Enter marks
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setExamOpen(true)}><Plus className="h-4 w-4" /> Schedule exam</button>
      </div>

      <Card>
        <DataTable columns={columns} rows={exams} rowKey={(e) => e.id} loading={loading} emptyTitle="No exams scheduled yet" />
      </Card>

      <ExamFormModal open={examOpen} onClose={() => setExamOpen(false)} onSaved={reload} classes={classes} subjects={subjects} examTypes={examTypes} />
      <EnterMarksModal
        open={!!marksExam}
        onClose={() => setMarksExam(null)}
        onSaved={reloadResults}
        exam={marksExam}
        students={students}
        results={results}
      />
    </div>
  );
}
