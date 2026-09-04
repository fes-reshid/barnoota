import { useState } from 'react';
import { Plus, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { studentsRepo } from '@/lib/services';
import type { Repository } from '@/lib/repository';
import type { BaseRecord } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export type FieldConfig =
  | { key: string; label: string; type: 'text' | 'date' }
  | { key: string; label: string; type: 'select'; options: string[] };

interface ProgressLogPageProps<T extends BaseRecord & { studentId: string; date: string }> {
  repo: Repository<T>;
  title: string;
  emptyIcon?: LucideIcon;
  fields: FieldConfig[];
  summaryLine: (entry: T) => string;
  badgeField?: string;
}

export function ProgressLogPage<T extends BaseRecord & { studentId: string; date: string }>({
  repo, title, emptyIcon, fields, summaryLine, badgeField,
}: ProgressLogPageProps<T>) {
  const { schoolId } = useAuth();
  const { data: students } = useRepoList(studentsRepo);
  const { data: entries, loading, reload } = useRepoList(repo);
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.type === 'select' ? f.options[0] : f.type === 'date' ? new Date().toISOString().slice(0, 10) : ''])),
  );

  function resetForm() {
    setForm(Object.fromEntries(fields.map((f) => [f.key, f.type === 'select' ? f.options[0] : f.type === 'date' ? new Date().toISOString().slice(0, 10) : ''])));
    setStudentId(students[0]?.id ?? '');
  }

  async function handleSave() {
    if (!studentId) return;
    await repo.create({ schoolId, studentId, ...form } as unknown as Omit<T, 'id' | 'createdAt' | 'updatedAt'>);
    showToast('Progress entry added.');
    setOpen(false);
    reload();
  }

  const activeStudents = students.filter((s) => s.status === 'active');
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { resetForm(); setOpen(true); }}><Plus className="h-4 w-4" /> Log progress</button>
      </div>

      <Card>
        <CardHeader title={title} />
        {sorted.length === 0 ? (
          <EmptyState icon={emptyIcon} title="No progress entries yet" action={<button className="btn-primary" onClick={() => { resetForm(); setOpen(true); }}><Plus className="h-4 w-4" /> Log progress</button>} />
        ) : (
          <CardBody className="!p-0 divide-y divide-slate-100">
            {sorted.map((entry) => {
              const student = students.find((s) => s.id === entry.studentId);
              return (
                <div key={entry.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{student ? `${student.firstName} ${student.lastName}` : entry.studentId}</p>
                    <p className="text-xs text-slate-500">{summaryLine(entry)} · {entry.date}</p>
                  </div>
                  {badgeField && <Badge tone="violet">{String((entry as unknown as Record<string, string>)[badgeField]).replace('_', ' ')}</Badge>}
                </div>
              );
            })}
          </CardBody>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Log progress"
        footer={<>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!studentId}>Save</button>
        </>}>
        <div className="space-y-4">
          <FormField label="Student" required>
            <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Select student</option>
              {activeStudents.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
            </select>
          </FormField>
          {fields.map((f) => (
            <FormField key={f.key} label={f.label}>
              {f.type === 'select' ? (
                <select className="input" value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                  {f.options.map((opt) => <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>)}
                </select>
              ) : (
                <input type={f.type} className="input" value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              )}
            </FormField>
          ))}
        </div>
      </Modal>
    </div>
  );
}
