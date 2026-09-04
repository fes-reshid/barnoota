import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { timetableRepo, classesRepo, subjectsRepo, studentsRepo, teachersRepo } from '@/lib/services';
import type { TimetableSlot } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

const DAYS: TimetableSlot['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TimetableViewPage() {
  usePageTitle('Timetable');
  const { currentUser } = useAuth();
  const { data: slots, loading: l1 } = useRepoList(timetableRepo);
  const { data: classes, loading: l2 } = useRepoList(classesRepo);
  const { data: subjects, loading: l3 } = useRepoList(subjectsRepo);
  const { data: students, loading: l4 } = useRepoList(studentsRepo);
  const { data: teachers, loading: l5 } = useRepoList(teachersRepo);

  if (l1 || l2 || l3 || l4 || l5) return <Spinner />;

  let relevantSlots: TimetableSlot[] = [];
  if (currentUser?.role === 'teacher') {
    relevantSlots = slots.filter((s) => s.teacherId === currentUser.teacherId);
  } else if (currentUser?.role === 'student') {
    const me = students.find((s) => s.id === currentUser.studentId);
    relevantSlots = me ? slots.filter((s) => s.classId === me.classId) : [];
  } else if (currentUser?.role === 'parent') {
    const childIds = currentUser.childrenIds ?? [];
    const classIds = students.filter((s) => childIds.includes(s.id)).map((s) => s.classId);
    relevantSlots = slots.filter((s) => classIds.includes(s.classId));
  }

  if (relevantSlots.length === 0) {
    return <EmptyState title="No timetable available yet" description="Check back once your school publishes the schedule." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {DAYS.map((day) => {
        const daySlots = relevantSlots.filter((s) => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
        if (daySlots.length === 0) return null;
        return (
          <Card key={day}>
            <CardHeader title={day} />
            <div className="divide-y divide-slate-100">
              {daySlots.map((slot) => {
                const subject = subjects.find((s) => s.id === slot.subjectId);
                const cls = classes.find((c) => c.id === slot.classId);
                const teacher = teachers.find((t) => t.id === slot.teacherId);
                return (
                  <div key={slot.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-slate-700">{subject?.name}</p>
                    <p className="text-xs text-slate-500">
                      {slot.startTime}–{slot.endTime} · {cls?.name} · {teacher?.firstName} {teacher?.lastName} · {slot.room}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
