import { useEffect, useState } from 'react';
import { CheckCircle2, Lock, Mail, Palette } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { schoolsRepo, studentsRepo } from '@/lib/services';
import type { School } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { FileUpload } from '@/components/ui/FileUpload';
import { useToast } from '@/components/ui/Toast';
import { PLAN_LIMITS, planLimitsFor, isTrialExpired, trialDaysRemaining } from '@/lib/planLimits';
import { APP_THEMES, applyAppTheme } from '@/lib/appTheme';
import { schoolLogoPath } from '@/lib/fileStorage';

const MODULES: { key: keyof School['islamicModulesEnabled']; label: string; description: string }[] = [
  { key: 'quran', label: 'Quran Progress', description: 'Surah/ayah memorisation tracking' },
  { key: 'iqra', label: 'Iqra', description: 'Iqra book level progress' },
  { key: 'islamicStudies', label: 'Islamic Studies', description: 'Book level, topics and assessments' },
  { key: 'oromoLanguage', label: 'Oromo Language', description: 'Qubee, reading and writing progress' },
  { key: 'tuhfatulAtfaal', label: 'Tuhfatul Atfaal', description: 'Tajweed poem memorisation tracking for children' },
];

const UPGRADE_EMAIL = 'mailto:sales@barnoota.school?subject=Upgrade%20my%20plan';

export default function SettingsPage() {
  usePageTitle('Settings');
  const { schoolId } = useAuth();
  const { data: schools, loading, reload } = useRepoList(schoolsRepo);
  const { data: students, loading: studentsLoading } = useRepoList(studentsRepo);
  const { showToast } = useToast();
  const school = schools.find((s) => s.id === schoolId);
  const limits = planLimitsFor(school);
  const activeCount = students.filter((s) => s.status === 'active').length;
  const trialExpired = isTrialExpired(school);
  const daysLeft = trialDaysRemaining(school);

  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', website: '' });

  useEffect(() => {
    if (school) setForm({ name: school.name, address: school.address, phone: school.phone, email: school.email, website: school.website ?? '' });
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

  async function setTheme(theme: NonNullable<School['theme']>) {
    if (!school || !limits.customBranding) return;
    await schoolsRepo.update(school.id, { theme });
    applyAppTheme(theme);
    reload();
  }

  async function setLogo(url: string) {
    if (!school || !limits.customBranding) return;
    await schoolsRepo.update(school.id, { logoUrl: url });
    reload();
  }

  if (loading || studentsLoading || !school) return <Spinner />;

  const studentPct = limits.studentCap === Infinity ? 0 : Math.min(100, Math.round((activeCount / limits.studentCap) * 100));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Plan & usage"
          action={<Badge tone={school.subscriptionPlan === 'premium' ? 'violet' : school.subscriptionPlan === 'trial' ? 'amber' : 'green'}>{limits.label}</Badge>}
        />
        <CardBody className="space-y-5">
          {school.subscriptionPlan === 'trial' && (
            <div className={`rounded-lg px-3 py-2 text-sm ${trialExpired ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
              {trialExpired
                ? "Your trial has ended. You can keep using what you've already set up, but upgrade to add more students or unlock paid features."
                : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left on your trial.`}
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-slate-600">Students</span>
              <span className="font-medium text-slate-800">
                {activeCount} / {limits.studentCap === Infinity ? 'Unlimited' : limits.studentCap}
              </span>
            </div>
            {limits.studentCap !== Infinity && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${studentPct >= 100 ? 'bg-rose-500' : studentPct >= 80 ? 'bg-amber-500' : 'bg-brand-500'}`}
                  style={{ width: `${studentPct}%` }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {([
              ['Email notifications', limits.email],
              ['WhatsApp & Telegram notifications', limits.whatsappTelegram],
              ['Islamic studies modules', limits.islamicModules],
              ['Custom branding (logo & theme)', limits.customBranding],
              ['Parent self-registration invites', limits.parentInvites],
            ] as const).map(([label, included]) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                {included ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-brand-600" />
                ) : (
                  <Lock className="h-4 w-4 flex-shrink-0 text-slate-300" />
                )}
                <span className={included ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
              </div>
            ))}
          </div>

          {school.subscriptionPlan !== 'premium' && (
            <a href={UPGRADE_EMAIL} className="btn-primary w-fit">
              <Mail className="h-4 w-4" /> Talk to us about upgrading
            </a>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="School details" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="School name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Email"><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
          <FormField label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
          <FormField label="Address"><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></FormField>
          <FormField label="Website (optional)">
            <input className="input" placeholder="https://yourschool.org" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </FormField>
          <div className="sm:col-span-2">
            <button className="btn-primary" onClick={saveGeneral}>Save changes</button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Islamic weekend school modules"
          subtitle={limits.islamicModules ? 'Enable or disable optional modules for your school' : `Available on the ${PLAN_LIMITS.standard.label} plan and above`}
        />
        <CardBody className="!p-0 divide-y divide-slate-100">
          {MODULES.map((m) => (
            <div key={m.key} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">{m.label}</p>
                <p className="text-xs text-slate-500">{m.description}</p>
              </div>
              {limits.islamicModules ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={school.islamicModulesEnabled[m.key]}
                  onClick={() => toggleModule(m.key)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${school.islamicModulesEnabled[m.key] ? 'bg-brand-600' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${school.islamicModulesEnabled[m.key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              ) : (
                <span title={`Upgrade to ${PLAN_LIMITS.standard.label} to enable`} className="flex items-center gap-1 text-xs text-slate-400">
                  <Lock className="h-3.5 w-3.5" /> Locked
                </span>
              )}
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Branding & theme"
          subtitle={limits.customBranding ? 'Your logo and color theme, applied across the dashboard and on printed ID cards' : `Available on the ${PLAN_LIMITS.standard.label} plan and above`}
        />
        <CardBody className="space-y-5">
          <div>
            <p className="label">School logo</p>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {school.logoUrl ? (
                  <img src={school.logoUrl} alt="School logo" className="h-full w-full object-cover" />
                ) : (
                  <Palette className="h-5 w-5 text-slate-300" />
                )}
              </div>
              {limits.customBranding ? (
                <FileUpload
                  label={school.logoUrl ? 'Replace logo' : 'Upload logo'}
                  accept="image/*"
                  buildPath={(fileName) => schoolLogoPath(school.id, fileName)}
                  onUploaded={(file) => setLogo(file.url)}
                />
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-400"><Lock className="h-3.5 w-3.5" /> Locked</span>
              )}
            </div>
          </div>

          <div>
            <p className="label">Color theme</p>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(APP_THEMES) as [NonNullable<School['theme']>, typeof APP_THEMES[keyof typeof APP_THEMES]][]).map(([key, theme]) => {
                const active = (school.theme ?? 'forest') === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!limits.customBranding}
                    onClick={() => setTheme(key)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                      active ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    } ${!limits.customBranding ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: theme.scale['600'] }} />
                    {theme.label}
                    {active && <CheckCircle2 className="h-4 w-4 text-brand-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
