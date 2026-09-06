import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { FileUpload } from '@/components/ui/FileUpload';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { studentsRepo } from '@/lib/services';
import { studentPhotoPath } from '@/lib/fileStorage';
import type { SchoolClass, Student } from '@/types';

interface StudentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  classes: SchoolClass[];
  student?: Student | null;
}

const emptyForm = {
  firstName: '', lastName: '', dob: '', gender: 'male' as Student['gender'], classId: '',
  guardianName: '', guardianPhone: '', guardianEmail: '', address: '',
  emergencyContactName: '', emergencyContactPhone: '', medicalNotes: '',
};

export function StudentFormModal({ open, onClose, onSaved, classes, student }: StudentFormModalProps) {
  const { schoolId } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [draftId, setDraftId] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (student) {
      setForm({
        firstName: student.firstName, lastName: student.lastName, dob: student.dob, gender: student.gender,
        classId: student.classId, guardianName: student.guardianName, guardianPhone: student.guardianPhone,
        guardianEmail: student.guardianEmail ?? '', address: student.address,
        emergencyContactName: student.emergencyContactName, emergencyContactPhone: student.emergencyContactPhone,
        medicalNotes: student.medicalNotes ?? '',
      });
      setPhotoUrl(student.photoUrl);
    } else {
      setForm({ ...emptyForm, classId: classes[0]?.id ?? '' });
      setPhotoUrl(undefined);
      setDraftId(crypto.randomUUID());
    }
    setErrors({});
  }, [student, open, classes]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    if (!form.lastName.trim()) e.lastName = 'Last name is required.';
    if (!form.dob) e.dob = 'Date of birth is required.';
    if (!form.classId) e.classId = 'Select a class.';
    if (!form.guardianName.trim()) e.guardianName = 'Guardian name is required.';
    if (!form.guardianPhone.trim()) e.guardianPhone = 'Guardian phone is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const classObj = classes.find((c) => c.id === form.classId);
      if (student) {
        await studentsRepo.update(student.id, { ...form, photoUrl, yearLevel: classObj?.yearLevel ?? student.yearLevel });
        showToast('Student updated.');
      } else {
        const count = (await studentsRepo.list(schoolId)).length;
        await studentsRepo.create({
          schoolId,
          studentCode: `S-${2000 + count + 1}`,
          ...form,
          photoUrl,
          yearLevel: classObj?.yearLevel ?? '',
          enrollmentDate: new Date().toISOString().slice(0, 10),
          status: 'active',
        });
        showToast('Student added.');
      }
      onSaved();
      onClose();
    } catch {
      showToast('Could not save student.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={student ? 'Edit student' : 'Add student'}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {student ? 'Save changes' : 'Add student'}
          </button>
        </>
      }
    >
      <div className="mb-4 flex items-center gap-3">
        <Avatar photoUrl={photoUrl} initials={`${form.firstName[0] ?? '?'}${form.lastName[0] ?? ''}`} size="lg" />
        <FileUpload
          label={photoUrl ? 'Change photo' : 'Upload photo'}
          accept="image/*"
          buildPath={(fileName) => studentPhotoPath(schoolId, student?.id ?? draftId, fileName)}
          onUploaded={(file) => setPhotoUrl(file.url)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="First name" required error={errors.firstName}>
          <input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </FormField>
        <FormField label="Last name" required error={errors.lastName}>
          <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </FormField>
        <FormField label="Date of birth" required error={errors.dob}>
          <input type="date" className="input" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
        </FormField>
        <FormField label="Gender" required>
          <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Student['gender'] })}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </FormField>
        <FormField label="Class" required error={errors.classId}>
          <select className="input" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
            <option value="">Select a class</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
          </select>
        </FormField>
        <FormField label="Guardian / Parent name" required error={errors.guardianName}>
          <input className="input" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
        </FormField>
        <FormField label="Guardian phone" required error={errors.guardianPhone}>
          <input className="input" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
        </FormField>
        <FormField label="Guardian email">
          <input type="email" className="input" value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} />
        </FormField>
        <FormField label="Address">
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </FormField>
        <FormField label="Emergency contact name">
          <input className="input" value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />
        </FormField>
        <FormField label="Emergency contact phone">
          <input className="input" value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />
        </FormField>
        <FormField label="Medical notes">
          <textarea className="input" rows={2} value={form.medicalNotes} onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })} />
        </FormField>
      </div>
    </Modal>
  );
}
