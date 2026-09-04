import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import { timetableRepo, classesRepo, teachersRepo, subjectsRepo } from '@/lib/services';
import type { TimetableSlot } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { TimetableFormModal } from './TimetableFormModal';

const DAYS: TimetableSlot['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TimetableAdminPage() {
  usePageTitle('Timetable');
  const { data: slots, loading: l1, reload } = useRepoList(timetableRepo);
  const { data: classes, loading: l2 } = useRepoList(classesRepo);
  const { data: teachers, loading: l3 } = useRepoList(teachersRepo);
  const { data: subjects, loading: l4 } = useRepoList(subjectsRepo);
  const { showToast } = useToast();

  const [classId, setClassId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TimetableSlot | null>(null);
  const [deleting, setDeleting] = useState<TimetableSlot | null>(null);

  if (l1 || l2 || l3 || l4) return <Spinner />;

  const activeClassId = classId || classes[0]?.id || '';
  const classSlots = slots.filter((s) => s.classId === activeClassId);

  async function handleDelete() {
    if (!deleting) return;
    await timetableRepo.remove(deleting.id);
    showToast('Slot removed.');
    setDeleting(null);
    reload();
  }

  if (classes.length === 0) {
    return <EmptyState title="Create a class first" description="Timetable slots are organized by class." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select className="input !w-auto" value={activeClassId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
        </select>
        <button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add slot</button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DAYS.map((day) => {
          const daySlots = classSlots.filter((s) => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <Card key={day}>
              <CardHeader title={day} />
              {daySlots.length === 0 ? (
                <p className="px-5 py-6 text-center text-xs text-slate-400">No classes scheduled</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {daySlots.map((slot) => {
                    const subject = subjects.find((s) => s.id === slot.subjectId);
                    const teacher = teachers.find((t) => t.id === slot.teacherId);
                    return (
                      <div key={slot.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{subject?.name}</p>
                          <p className="text-xs text-slate-500">{slot.startTime}–{slot.endTime} · {teacher?.firstName} {teacher?.lastName} · {slot.room}</p>
                        </div>
                        <div className="flex gap-1">
                          <button className="btn-ghost !px-2 !py-1" onClick={() => { setEditing(slot); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /></button>
                          <button className="btn-ghost !px-2 !py-1" onClick={() => setDeleting(slot)}><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <TimetableFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        classes={classes}
        teachers={teachers}
        subjects={subjects}
        slot={editing}
      />
      <ConfirmDialog open={!!deleting} title="Remove slot?" message="This timetable slot will be deleted." onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
