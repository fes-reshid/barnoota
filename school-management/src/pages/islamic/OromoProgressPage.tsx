import { Languages } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { oromoProgressRepo } from '@/lib/services';
import { ProgressLogPage } from '@/components/progress/ProgressLogPage';
import type { OromoProgress } from '@/types';

export default function OromoProgressPage() {
  usePageTitle('Oromo Language');
  return (
    <ProgressLogPage<OromoProgress>
      repo={oromoProgressRepo}
      title="Oromo language progress"
      emptyIcon={Languages}
      badgeField="progress"
      summaryLine={(e) => `Qubee: ${e.qubee} · ${e.vocabulary}`}
      fields={[
        { key: 'qubee', label: 'Qubee', type: 'text' },
        { key: 'reading', label: 'Reading', type: 'select', options: ['not_started', 'in_progress', 'proficient'] },
        { key: 'writing', label: 'Writing', type: 'select', options: ['not_started', 'in_progress', 'proficient'] },
        { key: 'vocabulary', label: 'Vocabulary focus', type: 'text' },
        { key: 'progress', label: 'Overall progress', type: 'select', options: ['not_started', 'in_progress', 'completed'] },
        { key: 'date', label: 'Date', type: 'date' },
      ]}
    />
  );
}
