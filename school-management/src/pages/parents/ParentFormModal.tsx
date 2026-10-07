import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { usersRepo, studentsRepo } from '@/lib/services';
import { createStaffAccount } from '@/lib/createStaffAccount';
import { isFirebaseConfigured } from '@/firebase/config';
import { friendlyErrorMessage } from '@/lib/friendlyError';
import type { Student } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  students: Student[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ParentFormModal({ open, onClose, onSaved, students }: Props) {
  const { schoolId } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [childIds, setChildIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName('');
      setEmail('');
      setPhone('');
      setChildIds([]);
      setSearch('');
      setErrors({});
    }
  }, [open]);

  function toggleChild(id: string) {
    setChildIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Required.';
    if (!email.trim()) e.email = 'Required.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address.';
    if (childIds.length === 0) e.children = 'Link at least one student.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const parent = await createStaffAccount({
        schoolId,
        role: 'parent',
        name,
        email,
        phone: phone || undefined,
        childrenIds: childIds,
      });
      // Keep the relationship visible from the student side too (used by
      // Messages to resolve "this student's parent" without scanning every
      // parent's childrenIds).
      await Promise.all(childIds.map((id) => studentsRepo.update(id, { parentUserId: parent.id })));

      showToast(
        isFirebaseConfigured
          ? 'Parent added. A password setup email has been sent.'
          : 'Parent added.',
      );
      onSaved();
      onClose();
    } catch (err) {
      setErrors({ form: friendlyErrorMessage(err, 'Could not add parent.') });
    } finally {
      setSaving(false);
    }
  }

  const filteredStudents = students.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.studentCode}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add parent"
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>Add parent</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Parent's name" required error={errors.name}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Parent's email" required error={errors.email}>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="mt-1 text-xs text-slate-500">They'll get an email to set their own password.</p>
          </FormField>
          <FormField label="Phone">
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
        </div>

        <FormField label="Children" required error={errors.children}>
          <input
            className="input mb-2"
            placeholder="Search students by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {filteredStudents.length === 0 && <p className="px-1 py-2 text-sm text-slate-400">No students match.</p>}
            {filteredStudents.map((s) => (
              <label key={s.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                <input type="checkbox" checked={childIds.includes(s.id)} onChange={() => toggleChild(s.id)} />
                <span className="font-medium text-slate-700">{s.firstName} {s.lastName}</span>
                <span className="text-xs text-slate-400">{s.studentCode}</span>
              </label>
            ))}
          </div>
        </FormField>

        {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
      </div>
    </Modal>
  );
}
