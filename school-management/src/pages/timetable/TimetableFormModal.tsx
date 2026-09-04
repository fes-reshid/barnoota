import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { timetableRepo } from '@/lib/services';
import type { SchoolClass, Subject, Teacher, TimetableSlot } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  slot?: TimetableSlot | null;
}

const DAYS: TimetableSlot['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const emptyForm = {
  classId: '', teacherId: '', subjectId: '', room: '', day: 'Mon' as TimetableSlot['day'],
  startTime: '09:00', endTime: '10:00',
};

export function TimetableFormModal({ open, onClose, onSaved, classes, teachers, subjects, slot }: Props) {
  const { schoolId } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(slot ? {
      classId: slot.classId, teacherId: slot.teacherId, subjectId: slot.subjectId, room: slot.room,
      day: slot.day, startTime: slot.startTime, endTime: slot.endTime,
    } : { ...emptyForm, classId: classes[0]?.id ?? '', teacherId: teachers[0]?.id ?? '', subjectId: subjects[0]?.id ?? '' });
  }, [slot, open, classes, teachers, subjects]);

  async function handleSave() {
    setSaving(true);
    try {
      if (slot) {
        await timetableRepo.update(slot.id, form);
        showToast('Timetable slot updated.');
      } else {
        await timetableRepo.create({ schoolId, ...form });
        showToast('Timetable slot added.');
      }
      onSaved();
      onClose();
    } catch {
      showToast('Could not save timetable slot.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={slot ? 'Edit slot' : 'Add slot'}
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>Save</button>
      </>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Class" required>
          <select className="input" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <FormField label="Teacher" required>
          <select className="input" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
          </select>
        </FormField>
        <FormField label="Subject" required>
          <select className="input" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>
        <FormField label="Room"><input className="input" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></FormField>
        <FormField label="Day">
          <select className="input" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value as TimetableSlot['day'] })}>
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Start"><input type="time" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></FormField>
          <FormField label="End"><input type="time" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></FormField>
        </div>
      </div>
    </Modal>
  );
}
