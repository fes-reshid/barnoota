import { Moon } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { quranProgressRepo } from '@/lib/services';
import { ProgressLogPage } from '@/components/progress/ProgressLogPage';
import type { QuranProgress } from '@/types';

export default function QuranProgressPage() {
  usePageTitle('Quran Progress');
  return (
    <ProgressLogPage<QuranProgress>
      repo={quranProgressRepo}
      title="Quran memorisation & recitation log"
      emptyIcon={Moon}
      badgeField="memorisationStatus"
      summaryLine={(e) => `${e.surah} (${e.ayahRange}) · ${e.recitationLevel}`}
      fields={[
        { key: 'surah', label: 'Surah', type: 'text' },
        { key: 'ayahRange', label: 'Ayah range', type: 'text' },
        { key: 'memorisationStatus', label: 'Memorisation status', type: 'select', options: ['not_started', 'in_progress', 'memorised', 'revised'] },
        { key: 'recitationLevel', label: 'Recitation level', type: 'select', options: ['beginner', 'intermediate', 'advanced'] },
        { key: 'teacherComment', label: 'Teacher comment', type: 'text' },
        { key: 'date', label: 'Date', type: 'date' },
      ]}
    />
  );
}
