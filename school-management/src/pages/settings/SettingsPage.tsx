import { useEffect, useState } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { schoolsRepo } from '@/lib/services';
import type { School } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

const MODULES: { key: keyof School['islamicModulesEnabled']; label: string; description: string }[] = [
  { key: 'quran', label: 'Quran Progress', description: 'Surah/ayah memorisation tracking' },
  { key: 'iqra', label: 'Iqra', description: 'Iqra book level progress' },
  { key: 'islamicStudies', label: 'Islamic Studies', description: 'Book level, topics and assessments' },
  { key: 'oromoLanguage', label: 'Oromo Language', description: 'Qubee, reading and writing progress' },
];

export default function SettingsPage() {
  usePageTitle('Settings');
  const { schoolId } = useAuth();
  const { data: schools, loading, reload } = useRepoList(schoolsRepo);
  const { showToast } = useToast();
  const school = schools.find((s) => s.id === schoolId);

  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' });

  useEffect(() => {
    if (school) setForm({ name: school.name, address: school.address, phone: school.phone, email: school.email });
  }, [school]);

  async function saveGeneral() {
    if (!school) return;
    await schoolsRepo.update(school.id, form);
    showToast('Settings saved.');
    reload();
  }

  async function toggleModule(key: keyof School['islamicModulesEnabled']) {
    if (!school) return;
    await schoolsRepo.update(school.id, { islamicModulesEnabled: { ...school.islamicModulesEnabled, [key]: !school.islamicModulesEnabled[key] } });
    reload();
  }

  if (loading || !school) return <Spinner />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="School details" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="School name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Email"><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
          <FormField label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
          <FormField label="Address"><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></FormField>
          <div className="sm:col-span-2">
            <button className="btn-primary" onClick={saveGeneral}>Save changes</button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Islamic weekend school modules" subtitle="Enable or disable optional modules for your school" />
        <CardBody className="!p-0 divide-y divide-slate-100">
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
                onClick={() => toggleModule(m.key)}
                className={`relative h-6 w-11 rounded-full transition-colors ${school.islamicModulesEnabled[m.key] ? 'bg-brand-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${school.islamicModulesEnabled[m.key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
