import { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import { usersRepo, DEMO_SCHOOL_ID } from '@/lib/services';
import { createStaffAccount } from '@/lib/createStaffAccount';
import { isFirebaseConfigured } from '@/firebase/config';
import type { AppUser } from '@/types';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

const emptyForm = { name: '', email: '', phone: '' };

export default function AdminsPage() {
  usePageTitle('Administrators');
  const { data: users, loading, reload } = useRepoList(usersRepo);
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const admins = users.filter((u) => u.role === 'school_admin');

  async function handleCreate() {
    setSaving(true);
    try {
      await createStaffAccount({ schoolId: DEMO_SCHOOL_ID, role: 'school_admin', ...form });
      showToast(
        isFirebaseConfigured
          ? 'Administrator added. A password setup email has been sent to them.'
          : 'Administrator added.',
      );
      setOpen(false);
      setForm(emptyForm);
      reload();
    } catch {
      showToast('Could not add administrator.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: AppUser) {
    await usersRepo.update(u.id, { active: !u.active });
    reload();
  }

  const columns: Column<AppUser>[] = [
    { header: 'Name', render: (u) => <p className="font-medium text-slate-800">{u.name}</p> },
    { header: 'Email', render: (u) => u.email },
    { header: 'Phone', render: (u) => u.phone || '—' },
    { header: 'Status', render: (u) => <Badge tone={u.active ? 'green' : 'rose'}>{u.active ? 'Active' : 'Suspended'}</Badge> },
    {
      header: '',
      render: (u) => (
        <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => toggleActive(u)}>
          {u.active ? 'Suspend' : 'Reactivate'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">School administrators across the platform.</p>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add administrator</button>
      </div>

      <Card>
        <DataTable columns={columns} rows={admins} rowKey={(u) => u.id} loading={loading} emptyTitle="No administrators yet" />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add administrator"
        footer={<>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={saving || !form.name || !form.email}>Save</button>
        </>}>
        <div className="space-y-3">
          <FormField label="Full name" required>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Email" required>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="Phone">
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
