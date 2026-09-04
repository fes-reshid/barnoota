import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { teachersRepo } from '@/lib/services';
import { createStaffAccount } from '@/lib/createStaffAccount';
import { isFirebaseConfigured } from '@/firebase/config';
import type { Subject, Teacher } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  subjects: Subject[];
  teacher?: Teacher | null;
}

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '', subjectIds: [] as string[],
  employmentType: 'full_time' as Teacher['employmentType'], hireDate: new Date().toISOString().slice(0, 10),
};

export function TeacherFormModal({ open, onClose, onSaved, subjects, teacher }: Props) {
  const { schoolId } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (teacher) {
      setForm({
        firstName: teacher.firstName, lastName: teacher.lastName, email: teacher.email, phone: teacher.phone,
        subjectIds: teacher.subjectIds, employmentType: teacher.employmentType, hireDate: teacher.hireDate,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [teacher, open]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Required.';
    if (!form.lastName.trim()) e.lastName = 'Required.';
    if (!form.email.trim()) e.email = 'Required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function toggleSubject(id: string) {
    setForm((f) => ({
      ...f,
      subjectIds: f.subjectIds.includes(id) ? f.subjectIds.filter((s) => s !== id) : [...f.subjectIds, id],
    }));
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (teacher) {
        await teachersRepo.update(teacher.id, form);
        showToast('Teacher updated.');
      } else {
        const count = (await teachersRepo.list(schoolId)).length;
        const newTeacher = await teachersRepo.create({
          schoolId, teacherCode: `T-${1000 + count + 1}`, classIds: [], status: 'active', ...form,
        });
        await createStaffAccount({
          schoolId, role: 'teacher', teacherId: newTeacher.id,
          name: `${form.firstName} ${form.lastName}`, email: form.email, phone: form.phone,
        });
        showToast(
          isFirebaseConfigured
            ? 'Teacher added. A password setup email has been sent to them.'
            : 'Teacher added.',
        );
      }
      onSaved();
      onClose();
    } catch {
      showToast('Could not save teacher.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={teacher ? 'Edit teacher' : 'Add teacher'} size="lg"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{teacher ? 'Save changes' : 'Add teacher'}</button>
      </>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="First name" required error={errors.firstName}>
          <input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </FormField>
        <FormField label="Last name" required error={errors.lastName}>
          <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </FormField>
        <FormField label="Email" required error={errors.email}>
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>
        <FormField label="Phone">
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </FormField>
        <FormField label="Employment type">
          <select className="input" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value as Teacher['employmentType'] })}>
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="volunteer">Volunteer</option>
          </select>
        </FormField>
        <FormField label="Hire date">
          <input type="date" className="input" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Subjects taught">
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    form.subjectIds.includes(s.id) ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </FormField>
        </div>
      </div>
    </Modal>
  );
}
