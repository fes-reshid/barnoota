import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { classesRepo, teachersRepo, studentsRepo, academicYearsRepo } from '@/lib/services';
import type { SchoolClass } from '@/types';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const emptyForm = { name: '', yearLevel: '', section: 'A', classTeacherId: '', capacity: 25 };

export default function ClassesPage() {
  usePageTitle('Classes');
  const { schoolId } = useAuth();
  const { data: classes, loading, reload } = useRepoList(classesRepo);
  const { data: teachers } = useRepoList(teachersRepo);
  const { data: students } = useRepoList(studentsRepo);
  const { data: years } = useRepoList(academicYearsRepo);
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<SchoolClass | null>(null);

  useEffect(() => {
    setForm(editing ? {
      name: editing.name, yearLevel: editing.yearLevel, section: editing.section,
      classTeacherId: editing.classTeacherId ?? '', capacity: editing.capacity,
    } : emptyForm);
  }, [editing, open]);

  async function handleSave() {
    const currentYear = years.find((y) => y.isCurrent)?.id ?? years[0]?.id ?? '';
    if (editing) {
      await classesRepo.update(editing.id, form);
      showToast('Class updated.');
    } else {
      await classesRepo.create({ schoolId, academicYearId: currentYear, ...form });
      showToast('Class created.');
    }
    setOpen(false);
    reload();
  }

  async function handleDelete() {
    if (!deleting) return;
    await classesRepo.remove(deleting.id);
    showToast('Class removed.');
    setDeleting(null);
    reload();
  }

  const columns: Column<SchoolClass>[] = [
    { header: 'Class', render: (c) => <p className="font-medium text-slate-800">{c.name} — {c.section}</p> },
    { header: 'Year level', render: (c) => c.yearLevel },
    { header: 'Class teacher', render: (c) => { const t = teachers.find((x) => x.id === c.classTeacherId); return t ? `${t.firstName} ${t.lastName}` : '—'; } },
    { header: 'Students', render: (c) => `${students.filter((s) => s.classId === c.id && s.status === 'active').length} / ${c.capacity}` },
    {
      header: '', className: 'text-right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <button className="btn-ghost !px-2 !py-1" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost !px-2 !py-1" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add class</button>
      </div>

      <Card>
        <DataTable columns={columns} rows={classes} rowKey={(c) => c.id} loading={loading} emptyTitle="No classes yet" />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit class' : 'Add class'}
        footer={<>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!form.name}>Save</button>
        </>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Class name" required><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Year level"><input className="input" value={form.yearLevel} onChange={(e) => setForm({ ...form, yearLevel: e.target.value })} /></FormField>
          <FormField label="Section"><input className="input" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></FormField>
          <FormField label="Capacity"><input type="number" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></FormField>
          <div className="sm:col-span-2">
            <FormField label="Class teacher">
              <select className="input" value={form.classTeacherId} onChange={(e) => setForm({ ...form, classTeacherId: e.target.value })}>
                <option value="">Unassigned</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </FormField>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete class?" message={`${deleting?.name} will be permanently removed.`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
