import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import { schoolsRepo } from '@/lib/services';
import type { School } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

const MODULES: { key: keyof School['islamicModulesEnabled']; label: string; description: string }[] = [
  { key: 'quran', label: 'Quran Progress', description: 'Surah/ayah memorisation tracking' },
  { key: 'iqra', label: 'Iqra', description: 'Iqra book level progress' },
  { key: 'islamicStudies', label: 'Islamic Studies', description: 'Book level, topics and assessments' },
  { key: 'oromoLanguage', label: 'Oromo Language', description: 'Qubee, reading and writing progress' },
];

export default function SystemSettingsPage() {
  usePageTitle('System Settings');
  const { data: schools, loading, reload } = useRepoList(schoolsRepo);
  const { showToast } = useToast();

  async function toggleModule(school: School, key: keyof School['islamicModulesEnabled']) {
    await schoolsRepo.update(school.id, {
      islamicModulesEnabled: { ...school.islamicModulesEnabled, [key]: !school.islamicModulesEnabled[key] },
    });
    showToast('Module setting updated.');
    reload();
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {schools.map((school) => (
        <Card key={school.id}>
          <CardHeader title={school.name} subtitle="Islamic weekend school modules" />
          <CardBody className="divide-y divide-slate-100 !p-0">
            {MODULES.map((m) => (
              <div key={m.key} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{m.label}</p>
                  <p className="text-xs text-slate-500">{m.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={school.islamicModulesEnabled[m.key]}
                  onClick={() => toggleModule(school, m.key)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    school.islamicModulesEnabled[m.key] ? 'bg-brand-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      school.islamicModulesEnabled[m.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
