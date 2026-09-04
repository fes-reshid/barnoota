import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { transportRoutesRepo } from '@/lib/services';
import type { TransportRoute } from '@/types';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const emptyForm = { name: '', driverName: '', driverPhone: '', vehiclePlate: '', capacity: 20, stops: '' };

export default function TransportPage() {
  usePageTitle('Transport');
  const { schoolId } = useAuth();
  const { data: routes, loading, reload } = useRepoList(transportRoutesRepo);
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TransportRoute | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<TransportRoute | null>(null);

  useEffect(() => {
    setForm(editing ? {
      name: editing.name, driverName: editing.driverName, driverPhone: editing.driverPhone,
      vehiclePlate: editing.vehiclePlate, capacity: editing.capacity, stops: editing.stops,
    } : emptyForm);
  }, [editing, open]);

  async function handleSave() {
    if (!form.name.trim()) return;
    if (editing) {
      await transportRoutesRepo.update(editing.id, form);
      showToast('Route updated.');
    } else {
      await transportRoutesRepo.create({ schoolId, ...form });
      showToast('Route added.');
    }
    setOpen(false);
    reload();
  }

  async function handleDelete() {
    if (!deleting) return;
    await transportRoutesRepo.remove(deleting.id);
    showToast('Route removed.');
    setDeleting(null);
    reload();
  }

  const columns: Column<TransportRoute>[] = [
    { header: 'Route', render: (r) => <p className="font-medium text-slate-800">{r.name}</p> },
    { header: 'Driver', render: (r) => <div><p>{r.driverName}</p><p className="text-xs text-slate-500">{r.driverPhone}</p></div> },
    { header: 'Vehicle', render: (r) => r.vehiclePlate },
    { header: 'Capacity', render: (r) => r.capacity },
    { header: 'Stops', render: (r) => <span className="text-xs text-slate-500">{r.stops}</span> },
    {
      header: '', className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button className="btn-ghost !px-2 !py-1" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost !px-2 !py-1" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add route</button>
      </div>

      <Card>
        <DataTable columns={columns} rows={routes} rowKey={(r) => r.id} loading={loading} emptyTitle="No transport routes yet" emptyDescription="Add a bus route to get started." />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit route' : 'Add route'}
        footer={<>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!form.name.trim()}>Save</button>
        </>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><FormField label="Route name" required><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField></div>
          <FormField label="Driver name"><input className="input" value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} /></FormField>
          <FormField label="Driver phone"><input className="input" value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} /></FormField>
          <FormField label="Vehicle plate"><input className="input" value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} /></FormField>
          <FormField label="Capacity"><input type="number" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></FormField>
          <div className="sm:col-span-2"><FormField label="Stops (comma separated)"><input className="input" value={form.stops} onChange={(e) => setForm({ ...form, stops: e.target.value })} /></FormField></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Remove route?" message={`${deleting?.name} will be permanently removed.`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
