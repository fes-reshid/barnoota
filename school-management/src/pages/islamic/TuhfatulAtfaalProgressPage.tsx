import { BookOpen } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { tuhfatulAtfaalProgressRepo } from '@/lib/services';
import { ProgressLogPage } from '@/components/progress/ProgressLogPage';
import type { TuhfatulAtfaalProgress } from '@/types';

export default function TuhfatulAtfaalProgressPage() {
  usePageTitle('Tuhfatul Atfaal');
  return (
    <ProgressLogPage<TuhfatulAtfaalProgress>
      repo={tuhfatulAtfaalProgressRepo}
      title="Tuhfatul Atfaal memorisation & recitation log"
      emptyIcon={BookOpen}
      badgeField="memorisationStatus"
      summaryLine={(e) => `${e.chapter} (${e.verseRange}) · ${e.recitationLevel}`}
      fields={[
        { key: 'chapter', label: 'Chapter', type: 'text' },
        { key: 'verseRange', label: 'Verse range', type: 'text' },
        { key: 'memorisationStatus', label: 'Memorisation status', type: 'select', options: ['not_started', 'in_progress', 'memorised', 'revised'] },
        { key: 'recitationLevel', label: 'Recitation level', type: 'select', options: ['beginner', 'intermediate', 'advanced'] },
        { key: 'teacherComment', label: 'Teacher comment', type: 'text' },
        { key: 'date', label: 'Date', type: 'date' },
      ]}
    />
  );
}
