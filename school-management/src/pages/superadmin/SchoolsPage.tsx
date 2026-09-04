import { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import { schoolsRepo, DEMO_SCHOOL_ID } from '@/lib/services';
import type { School } from '@/types';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

const emptyForm = { name: '', address: '', phone: '', email: '', subscriptionPlan: 'trial' as School['subscriptionPlan'] };

export default function SchoolsPage() {
  usePageTitle('Schools');
  const { data: schools, loading, reload } = useRepoList(schoolsRepo);
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setSaving(true);
    try {
      await schoolsRepo.create({
        schoolId: DEMO_SCHOOL_ID,
        ...form,
        subscriptionStatus: 'active',
        islamicModulesEnabled: { quran: true, iqra: true, islamicStudies: true, oromoLanguage: true },
      });
      showToast('School added.');
      setOpen(false);
      setForm(emptyForm);
      reload();
    } catch {
      showToast('Could not add school.', 'error');
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
          <button className="btn-primary" onClick={handleCreate} disabled={saving || !form.name}>Save</button>
        </>}>
        <div className="space-y-3">
          <FormField label="School name" required>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Email">
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="Phone">
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <FormField label="Address">
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </FormField>
          <FormField label="Subscription plan">
            <select className="input" value={form.subscriptionPlan} onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value as School['subscriptionPlan'] })}>
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
