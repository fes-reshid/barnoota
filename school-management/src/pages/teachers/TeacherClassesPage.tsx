import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { classesRepo, studentsRepo, subjectsRepo, timetableRepo, academicYearsRepo } from '@/lib/services';
import type { SchoolClass } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const emptyForm = { name: '', yearLevel: '', section: 'A', capacity: 25 };

export default function TeacherClassesPage() {
  usePageTitle('My Classes');
  const { schoolId, currentUser } = useAuth();
  const { data: classes, loading: l1, reload } = useRepoList(classesRepo);
  const { data: students, loading: l2 } = useRepoList(studentsRepo);
  const { data: subjects, loading: l3 } = useRepoList(subjectsRepo);
  const { data: timetable, loading: l4 } = useRepoList(timetableRepo);
  const { data: years, loading: l5 } = useRepoList(academicYearsRepo);
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<SchoolClass | null>(null);

  useEffect(() => {
    setForm(editing ? { name: editing.name, yearLevel: editing.yearLevel, section: editing.section, capacity: editing.capacity } : emptyForm);
  }, [editing, open]);

  if (l1 || l2 || l3 || l4 || l5) return <Spinner />;

  // A class a teacher can *manage* is one they're the homeroom (class)
  // teacher for — teaching a single subject into someone else's class
  // doesn't carry rights to rename it or change its capacity. The
  // read-only "taught via timetable" view some teachers also see lives on
  // their dashboard; this page is specifically about ownership.
  const myClasses = classes.filter((c) => c.classTeacherId === currentUser?.teacherId);

  async function handleSave() {
    if (!currentUser?.teacherId) return;
    const currentYear = years.find((y) => y.isCurrent)?.id ?? years[0]?.id ?? '';
    if (editing) {
      await classesRepo.update(editing.id, form);
      showToast('Class updated.');
    } else {
      await classesRepo.create({ schoolId, academicYearId: currentYear, classTeacherId: currentUser.teacherId, ...form });
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add class
        </button>
      </div>

      {myClasses.length === 0 ? (
        <EmptyState title="No classes yet" description="Add a class to start assigning homework, attendance, and exams to it." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {myClasses.map((c) => {
            const roster = students.filter((s) => s.classId === c.id && s.status === 'active');
            const mySubjects = [...new Set(timetable.filter((t) => t.classId === c.id && t.teacherId === currentUser?.teacherId).map((t) => t.subjectId))];
            return (
              <Card key={c.id}>
                <CardHeader
                  title={`${c.name} — ${c.section}`}
                  subtitle={`${roster.length} / ${c.capacity} students`}
                  action={
                    <div className="flex gap-1">
                      <button className="btn-ghost !px-2 !py-1" title="Edit" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></button>
                      <button className="btn-ghost !px-2 !py-1" title="Delete" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  }
                />
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {mySubjects.map((id) => <Badge key={id} tone="sky">{subjects.find((s) => s.id === id)?.name ?? id}</Badge>)}
                  </div>
                  <Link to="/teacher/students" className="btn-secondary !py-1 !px-3 text-xs w-fit">
                    <Users className="h-3.5 w-3.5" /> View roster
                  </Link>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

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
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete class?" message={`${deleting?.name} will be permanently removed.`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
