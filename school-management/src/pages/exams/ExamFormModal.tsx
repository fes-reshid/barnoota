import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { examsRepo } from '@/lib/services';
import type { ExamType, SchoolClass, Subject } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  classes: SchoolClass[];
  subjects: Subject[];
  examTypes: ExamType[];
}

export function ExamFormModal({ open, onClose, onSaved, classes, subjects, examTypes }: Props) {
  const { schoolId } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '', examTypeId: examTypes[0]?.id ?? '', classId: classes[0]?.id ?? '', subjectId: subjects[0]?.id ?? '',
    date: new Date().toISOString().slice(0, 10), maxMarks: 100,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: '', examTypeId: examTypes[0]?.id ?? '', classId: classes[0]?.id ?? '', subjectId: subjects[0]?.id ?? '',
        date: new Date().toISOString().slice(0, 10), maxMarks: 100,
      });
    }
  }, [open, examTypes, classes, subjects]);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await examsRepo.create({ schoolId, ...form });
      showToast('Exam scheduled.');
      onSaved();
      onClose();
    } catch {
      showToast('Could not schedule exam.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule exam"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>Schedule</button>
      </>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField label="Exam name" required>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
        </div>
        <FormField label="Exam type">
          <select className="input" value={form.examTypeId} onChange={(e) => setForm({ ...form, examTypeId: e.target.value })}>
            {examTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </FormField>
        <FormField label="Class">
          <select className="input" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <FormField label="Subject">
          <select className="input" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>
        <FormField label="Date"><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></FormField>
        <FormField label="Max marks"><input type="number" className="input" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })} /></FormField>
      </div>
    </Modal>
  );
}
