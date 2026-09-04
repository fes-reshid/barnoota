import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { examResultsRepo } from '@/lib/services';
import { gradeForPercentage } from '@/lib/grading';
import type { Exam, ExamResult, Student } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  exam: Exam | null;
  students: Student[];
  results: ExamResult[];
}

export function EnterMarksModal({ open, onClose, onSaved, exam, students, results }: Props) {
  const { schoolId } = useAuth();
  const { showToast } = useToast();
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const classStudents = exam ? students.filter((s) => s.classId === exam.classId && s.status === 'active') : [];

  useEffect(() => {
    if (!exam) return;
    const m: Record<string, string> = {};
    const c: Record<string, string> = {};
    classStudents.forEach((s) => {
      const existing = results.find((r) => r.examId === exam.id && r.studentId === s.id);
      m[s.id] = existing ? String(existing.marksObtained) : '';
      c[s.id] = existing?.teacherComment ?? '';
    });
    setMarks(m);
    setComments(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.id, open]);

  async function handleSave() {
    if (!exam) return;
    setSaving(true);
    try {
      for (const s of classStudents) {
        const raw = marks[s.id];
        if (raw === undefined || raw === '') continue;
        const marksObtained = Math.max(0, Math.min(exam.maxMarks, Number(raw)));
        const grade = gradeForPercentage((marksObtained / exam.maxMarks) * 100);
        const existing = results.find((r) => r.examId === exam.id && r.studentId === s.id);
        if (existing) {
          await examResultsRepo.update(existing.id, { marksObtained, grade, teacherComment: comments[s.id] });
        } else {
          await examResultsRepo.create({
            schoolId, examId: exam.id, studentId: s.id, marksObtained, grade, teacherComment: comments[s.id],
          });
        }
      }
      showToast('Marks saved.');
      onSaved();
      onClose();
    } catch {
      showToast('Could not save marks.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={exam ? `Enter marks — ${exam.name}` : 'Enter marks'} size="lg"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving || !exam}>Save marks</button>
      </>}>
      {!exam ? null : (
        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          {classStudents.map((s) => {
            const pct = marks[s.id] ? Math.round((Number(marks[s.id]) / exam.maxMarks) * 100) : null;
            return (
              <div key={s.id} className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center">
                <p className="w-40 shrink-0 text-sm font-medium text-slate-700">{s.firstName} {s.lastName}</p>
                <input
                  type="number"
                  min={0}
                  max={exam.maxMarks}
                  className="input !w-28"
                  placeholder={`/ ${exam.maxMarks}`}
                  value={marks[s.id] ?? ''}
                  onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value }))}
                />
                {pct !== null && <span className="text-xs font-medium text-slate-500">{pct}% · {gradeForPercentage(pct)}</span>}
                <input
                  className="input flex-1"
                  placeholder="Teacher comment"
                  value={comments[s.id] ?? ''}
                  onChange={(e) => setComments((c) => ({ ...c, [s.id]: e.target.value }))}
                />
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
