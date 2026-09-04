import { useState } from 'react';
import { Plus, Send } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { feeCategoriesRepo, feeStructuresRepo, studentsRepo, feeInvoicesRepo, academicYearsRepo } from '@/lib/services';
import type { FeeStructure } from '@/types';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';

export default function FeeStructuresPage() {
  usePageTitle('Fee Structures');
  const { schoolId } = useAuth();
  const { data: categories, reload: reloadCategories } = useRepoList(feeCategoriesRepo);
  const { data: structures, loading, reload } = useRepoList(feeStructuresRepo);
  const { data: students } = useRepoList(studentsRepo);
  const { data: years } = useRepoList(academicYearsRepo);
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', categoryId: '', yearLevel: '', amount: 0, dueDate: new Date().toISOString().slice(0, 10) });
  const [newCategory, setNewCategory] = useState('');

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    await feeCategoriesRepo.create({ schoolId, name: newCategory.trim() });
    setNewCategory('');
    reloadCategories();
  }

  async function handleCreateStructure() {
    if (!form.name.trim() || !form.categoryId) return;
    const currentYear = years.find((y) => y.isCurrent)?.id ?? years[0]?.id ?? '';
    await feeStructuresRepo.create({ schoolId, academicYearId: currentYear, ...form });
    showToast('Fee structure created.');
    setOpen(false);
    setForm({ name: '', categoryId: '', yearLevel: '', amount: 0, dueDate: new Date().toISOString().slice(0, 10) });
    reload();
  }

  async function generateInvoices(structure: FeeStructure) {
    const targets = students.filter((s) => s.status === 'active' && (structure.yearLevel === '' || s.yearLevel === structure.yearLevel));
    let created = 0;
    for (const s of targets) {
      await feeInvoicesRepo.create({
        schoolId, studentId: s.id, feeStructureId: structure.id, amount: structure.amount, discount: 0,
        amountPaid: 0, status: 'unpaid', dueDate: structure.dueDate,
      });
      created += 1;
    }
    showToast(`Generated ${created} invoice${created === 1 ? '' : 's'}.`);
  }

  const columns: Column<FeeStructure>[] = [
    { header: 'Fee', render: (f) => f.name },
    { header: 'Category', render: (f) => categories.find((c) => c.id === f.categoryId)?.name ?? '—' },
    { header: 'Year level', render: (f) => f.yearLevel || 'All' },
    { header: 'Amount', render: (f) => `$${f.amount.toLocaleString()}` },
    { header: 'Due date', render: (f) => f.dueDate },
    {
      header: '', className: 'text-right',
      render: (f) => (
        <button className="btn-secondary !py-1 !px-3 text-xs" onClick={() => generateInvoices(f)}>
          <Send className="h-3.5 w-3.5" /> Assign to students
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input className="input !w-52" placeholder="New fee category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          <button className="btn-secondary" onClick={handleAddCategory}>Add category</button>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add fee structure</button>
      </div>

      <Card>
        <DataTable columns={columns} rows={structures} rowKey={(f) => f.id} loading={loading} emptyTitle="No fee structures yet" />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add fee structure"
        footer={<>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleCreateStructure} disabled={!form.name || !form.categoryId}>Save</button>
        </>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Fee name" required><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          </div>
          <FormField label="Category" required>
            <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Year level (blank = all)"><input className="input" value={form.yearLevel} onChange={(e) => setForm({ ...form, yearLevel: e.target.value })} /></FormField>
          <FormField label="Amount"><input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></FormField>
          <FormField label="Due date"><input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></FormField>
        </div>
      </Modal>
    </div>
  );
}
