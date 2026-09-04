import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { subjectsRepo } from '@/lib/services';
import type { Subject } from '@/types';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const emptyForm = { name: '', code: '', color: '#349563' };

export default function SubjectsPage() {
  usePageTitle('Subjects');
  const { schoolId } = useAuth();
  const { data: subjects, loading, reload } = useRepoList(subjectsRepo);
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<Subject | null>(null);

  useEffect(() => {
    setForm(editing ? { name: editing.name, code: editing.code, color: editing.color } : emptyForm);
  }, [editing, open]);

  async function handleSave() {
    if (editing) {
      await subjectsRepo.update(editing.id, form);
      showToast('Subject updated.');
    } else {
      await subjectsRepo.create({ schoolId, ...form });
      showToast('Subject created.');
    }
    setOpen(false);
    reload();
  }

  async function handleDelete() {
    if (!deleting) return;
    await subjectsRepo.remove(deleting.id);
    showToast('Subject removed.');
    setDeleting(null);
    reload();
  }

  const columns: Column<Subject>[] = [
    { header: 'Subject', render: (s) => <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />{s.name}</div> },
    { header: 'Code', render: (s) => s.code },
    {
      header: '', className: 'text-right',
      render: (s) => (
        <div className="flex justify-end gap-1">
          <button className="btn-ghost !px-2 !py-1" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost !px-2 !py-1" onClick={() => setDeleting(s)}><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add subject</button>
      </div>

      <Card>
        <DataTable columns={columns} rows={subjects} rowKey={(s) => s.id} loading={loading} emptyTitle="No subjects yet" />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit subject' : 'Add subject'}
        footer={<>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!form.name}>Save</button>
        </>}>
        <div className="space-y-4">
          <FormField label="Subject name" required><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Code"><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
          <FormField label="Color"><input type="color" className="h-10 w-16 rounded border border-slate-300" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete subject?" message={`${deleting?.name} will be permanently removed.`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
