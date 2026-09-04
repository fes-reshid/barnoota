import { BookOpen } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { islamicStudiesRepo } from '@/lib/services';
import { ProgressLogPage } from '@/components/progress/ProgressLogPage';
import type { IslamicStudiesProgress } from '@/types';

export default function IslamicStudiesPage() {
  usePageTitle('Islamic Studies');
  return (
    <ProgressLogPage<IslamicStudiesProgress>
      repo={islamicStudiesRepo}
      title="Islamic studies progress"
      emptyIcon={BookOpen}
      badgeField="progress"
      summaryLine={(e) => `${e.bookLevel} · ${e.topic} — ${e.lesson}`}
      fields={[
        { key: 'bookLevel', label: 'Book level', type: 'text' },
        { key: 'topic', label: 'Topic', type: 'text' },
        { key: 'lesson', label: 'Lesson', type: 'text' },
        { key: 'assessment', label: 'Assessment', type: 'text' },
        { key: 'progress', label: 'Progress', type: 'select', options: ['not_started', 'in_progress', 'completed'] },
        { key: 'date', label: 'Date', type: 'date' },
      ]}
    />
  );
}
