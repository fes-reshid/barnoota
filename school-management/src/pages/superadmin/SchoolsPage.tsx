import { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoListAll } from '@/lib/useRepoList';
import { schoolsRepo } from '@/lib/services';
import { createStaffAccount } from '@/lib/createStaffAccount';
import { setById } from '@/lib/repository';
import { isFirebaseConfigured } from '@/firebase/config';
import { friendlyErrorMessage } from '@/lib/friendlyError';
import type { School } from '@/types';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

const emptyForm = {
  name: '', address: '', phone: '', email: '', website: '', subscriptionPlan: 'trial' as School['subscriptionPlan'],
  adminName: '', adminEmail: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SchoolsPage() {
  usePageTitle('Schools');
  const { data: schools, loading, reload } = useRepoListAll(schoolsRepo);
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Required.';
    if (!form.phone.trim()) e.phone = 'Required.';
    if (!form.email.trim()) e.email = 'Required.';
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (!form.adminName.trim()) e.adminName = 'Required.';
    if (!form.adminEmail.trim()) e.adminEmail = 'Required.';
    else if (!EMAIL_RE.test(form.adminEmail.trim())) e.adminEmail = 'Enter a valid email address.';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    setError('');
    if (!validate()) return;
    setSaving(true);
    try {
      // Each school is its own tenant with a fresh, unique id — generated
      // up front (rather than letting Firestore auto-assign one after the
      // fact) so the admin account can be created FIRST, against that id.
      // If creating the admin's login fails (e.g. the email is already in
      // use), nothing has been written to the schools collection at all —
      // no half-created, admin-less school left behind to clean up.
      const schoolId = crypto.randomUUID();

      await createStaffAccount({
        schoolId,
        role: 'school_admin',
        name: form.adminName,
        email: form.adminEmail,
      });

      const now = new Date().toISOString();
      await setById<School>('schools', schoolId, {
        schoolId,
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        website: form.website.trim() || undefined,
        subscriptionPlan: form.subscriptionPlan,
        subscriptionStatus: 'active',
        islamicModulesEnabled: { quran: true, iqra: true, islamicStudies: true, oromoLanguage: true, tuhfatulAtfaal: true },
        createdAt: now,
        updatedAt: now,
      });

      showToast(
        isFirebaseConfigured
          ? 'School added. A password setup email has been sent to the admin.'
          : 'School added.',
      );
      setOpen(false);
      setForm(emptyForm);
      setFieldErrors({});
      reload();
    } catch (err) {
      setError(friendlyErrorMessage(err, 'Could not add school.'));
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<School>[] = [
    { header: 'School', render: (s) => <div><p className="font-medium text-slate-800">{s.name}</p><p className="text-xs text-slate-500">{s.email}</p></div> },
    { header: 'Phone', render: (s) => s.phone },
    { header: 'Plan', render: (s) => <Badge tone="violet">{s.subscriptionPlan}</Badge> },
    { header: 'Status', render: (s) => <Badge tone={s.subscriptionStatus === 'active' ? 'green' : 'rose'}>{s.subscriptionStatus}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Manage every school on the platform.</p>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add school</button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={schools}
          rowKey={(s) => s.id}
          loading={loading}
          emptyTitle="No schools yet"
          emptyDescription="Add your first school to get started."
          emptyAction={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add school</button>}
        />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add school"
        footer={<>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={saving || !form.name || !form.adminEmail}>Save</button>
        </>}>
        <div className="space-y-3">
          <FormField label="School name" required error={fieldErrors.name}>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Email" required error={fieldErrors.email}>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="Phone" required error={fieldErrors.phone}>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <FormField label="Address">
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </FormField>
          <FormField label="Website">
            <input className="input" type="url" placeholder="https://example.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </FormField>
          <FormField label="Subscription plan">
            <select className="input" value={form.subscriptionPlan} onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value as School['subscriptionPlan'] })}>
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </FormField>

          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">School admin login</p>
            <div className="space-y-3">
              <FormField label="Admin's name" required error={fieldErrors.adminName}>
                <input className="input" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} />
              </FormField>
              <FormField label="Admin's email" required error={fieldErrors.adminEmail}>
                <input className="input" type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
                <p className="mt-1 text-xs text-slate-500">They'll get an email to set their own password.</p>
              </FormField>
            </div>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
