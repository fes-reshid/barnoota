import { BookMarked } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { iqraProgressRepo } from '@/lib/services';
import { ProgressLogPage } from '@/components/progress/ProgressLogPage';
import type { IqraProgress } from '@/types';

export default function IqraProgressPage() {
  usePageTitle('Iqra Progress');
  return (
    <ProgressLogPage<IqraProgress>
      repo={iqraProgressRepo}
      title="Iqra book progress"
      emptyIcon={BookMarked}
      badgeField="completionStatus"
      summaryLine={(e) => `${e.bookLevel} — ${e.lesson}`}
      fields={[
        { key: 'bookLevel', label: 'Iqra book / level', type: 'text' },
        { key: 'lesson', label: 'Lesson', type: 'text' },
        { key: 'completionStatus', label: 'Completion status', type: 'select', options: ['not_started', 'in_progress', 'completed'] },
        { key: 'teacherAssessment', label: 'Teacher assessment', type: 'text' },
        { key: 'date', label: 'Date', type: 'date' },
      ]}
    />
  );
}
