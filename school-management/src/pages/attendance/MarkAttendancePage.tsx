import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Save } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { classesRepo, studentsRepo, attendanceRepo } from '@/lib/services';
import type { AttendanceStatus } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; tone: string }[] = [
  { value: 'present', label: 'Present', tone: 'bg-brand-600 text-white border-brand-600' },
  { value: 'absent', label: 'Absent', tone: 'bg-rose-600 text-white border-rose-600' },
  { value: 'late', label: 'Late', tone: 'bg-amber-500 text-white border-amber-500' },
  { value: 'excused', label: 'Excused', tone: 'bg-sky-500 text-white border-sky-500' },
];

export default function MarkAttendancePage() {
  usePageTitle('Attendance');
  const { currentUser, schoolId } = useAuth();
  const { data: classes, loading: l1 } = useRepoList(classesRepo);
  const { data: students, loading: l2 } = useRepoList(studentsRepo);
  const { data: attendance, loading: l3, reload } = useRepoList(attendanceRepo);
  const { showToast } = useToast();

  const teacherClasses = currentUser?.role === 'teacher'
    ? classes.filter((c) => c.classTeacherId === currentUser.teacherId)
    : classes;

  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [draft, setDraft] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!classId && teacherClasses.length) setClassId(teacherClasses[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherClasses.length]);

  const classStudents = students.filter((s) => s.classId === classId && s.status === 'active');

  useEffect(() => {
    const existing: Record<string, { status: AttendanceStatus; note: string }> = {};
    classStudents.forEach((s) => {
      const rec = attendance.find((a) => a.classId === classId && a.studentId === s.id && a.date === date);
      existing[s.id] = { status: rec?.status ?? 'present', note: rec?.note ?? '' };
    });
    setDraft(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date, students.length, attendance.length]);

  const summary = useMemo(() => {
    const values = Object.values(draft);
    return {
      present: values.filter((v) => v.status === 'present').length,
      absent: values.filter((v) => v.status === 'absent').length,
      late: values.filter((v) => v.status === 'late').length,
      excused: values.filter((v) => v.status === 'excused').length,
    };
  }, [draft]);

  async function handleSubmit() {
    setSaving(true);
    try {
      for (const s of classStudents) {
        const value = draft[s.id];
        const existing = attendance.find((a) => a.classId === classId && a.studentId === s.id && a.date === date);
        if (existing) {
          await attendanceRepo.update(existing.id, { status: value.status, note: value.note });
        } else {
          await attendanceRepo.create({
            schoolId, classId, studentId: s.id, date, status: value.status, note: value.note,
            markedBy: currentUser?.id ?? '',
          });
        }
      }
      showToast('Attendance submitted.');
      reload();
    } catch {
      showToast('Could not submit attendance.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (l1 || l2 || l3) return <Spinner />;

  if (teacherClasses.length === 0) {
    return <EmptyState icon={CalendarCheck} title="No classes available" description="Create a class first." />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="label">Class</label>
            <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {teacherClasses.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || classStudents.length === 0}>
            <Save className="h-4 w-4" /> Submit attendance
          </button>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-3 text-center"><p className="text-lg font-bold text-brand-700">{summary.present}</p><p className="text-xs text-slate-500">Present</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-bold text-rose-600">{summary.absent}</p><p className="text-xs text-slate-500">Absent</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-bold text-amber-600">{summary.late}</p><p className="text-xs text-slate-500">Late</p></div>
        <div className="card p-3 text-center"><p className="text-lg font-bold text-sky-600">{summary.excused}</p><p className="text-xs text-slate-500">Excused</p></div>
      </div>

      <Card>
        <CardHeader title="Students" subtitle={`${classStudents.length} students in this class`} />
        {classStudents.length === 0 ? (
          <EmptyState title="No students in this class" />
        ) : (
          <CardBody className="!p-0 divide-y divide-slate-100">
            {classStudents.map((s) => (
              <div key={s.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-700">{s.firstName} {s.lastName}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, [s.id]: { ...d[s.id], status: opt.value } }))}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        draft[s.id]?.status === opt.value ? opt.tone : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <input
                    className="input !w-40 !py-1 text-xs"
                    placeholder="Note (optional)"
                    value={draft[s.id]?.note ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, [s.id]: { ...d[s.id], note: e.target.value } }))}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        )}
      </Card>
    </div>
  );
}
