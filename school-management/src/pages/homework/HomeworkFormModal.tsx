import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { homeworkRepo } from '@/lib/services';
import type { SchoolClass, Subject } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  classes: SchoolClass[];
  subjects: Subject[];
}

const emptyForm = {
  classId: '', subjectId: '', title: '', description: '',
  dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
};

export function HomeworkFormModal({ open, onClose, onSaved, classes, subjects }: Props) {
  const { schoolId, currentUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ ...emptyForm, classId: classes[0]?.id ?? '', subjectId: subjects[0]?.id ?? '' });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, classId: classes[0]?.id ?? '', subjectId: subjects[0]?.id ?? '' });
      setAttachment(null);
    }
  }, [open, classes, subjects]);

  async function handleSave() {
    if (!form.title.trim() || !form.classId) return;
    setSaving(true);
    try {
      await homeworkRepo.create({
        schoolId,
        teacherId: currentUser?.teacherId ?? '',
        ...form,
        attachmentUrl: attachment ? URL.createObjectURL(attachment) : undefined,
        assignedDate: new Date().toISOString().slice(0, 10),
      });
      showToast('Homework assigned.');
      onSaved();
      onClose();
    } catch {
      showToast('Could not assign homework.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Assign homework"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving || !form.title.trim()}>Assign</button>
      </>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Class" required>
            <select className="input" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Subject" required>
            <select className="input" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Title" required>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </FormField>
        <FormField label="Description">
          <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </FormField>
        <FormField label="Due date">
          <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </FormField>
        <FormField label="Attachment">
          <input type="file" className="input" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} />
        </FormField>
      </div>
    </Modal>
  );
}
