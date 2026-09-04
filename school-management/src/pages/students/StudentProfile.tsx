import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, HeartPulse, CalendarCheck, ClipboardList, FileSpreadsheet, Wallet, FileText, Moon } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import {
  studentsRepo, classesRepo, attendanceRepo, homeworkRepo, homeworkSubmissionsRepo,
  examResultsRepo, examsRepo, subjectsRepo, feeInvoicesRepo, feeStructuresRepo,
  studentDocumentsRepo, quranProgressRepo, iqraProgressRepo, islamicStudiesRepo, oromoProgressRepo,
} from '@/lib/services';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

const TABS = ['Overview', 'Attendance', 'Homework', 'Exams', 'Fees', 'Documents', 'Progress'] as const;
type Tab = (typeof TABS)[number];

export default function StudentProfile() {
  usePageTitle('Student Profile');
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('Overview');

  const { data: students, loading: l1 } = useRepoList(studentsRepo);
  const { data: classes, loading: l2 } = useRepoList(classesRepo);
  const { data: attendance, loading: l3 } = useRepoList(attendanceRepo);
  const { data: homework, loading: l4 } = useRepoList(homeworkRepo);
  const { data: submissions, loading: l5 } = useRepoList(homeworkSubmissionsRepo);
  const { data: results, loading: l6 } = useRepoList(examResultsRepo);
  const { data: exams, loading: l7 } = useRepoList(examsRepo);
  const { data: subjects, loading: l8 } = useRepoList(subjectsRepo);
  const { data: invoices, loading: l9 } = useRepoList(feeInvoicesRepo);
  const { data: feeStructures, loading: l10 } = useRepoList(feeStructuresRepo);
  const { data: documents, loading: l11 } = useRepoList(studentDocumentsRepo);
  const { data: quran, loading: l12 } = useRepoList(quranProgressRepo);
  const { data: iqra, loading: l13 } = useRepoList(iqraProgressRepo);
  const { data: islamic, loading: l14 } = useRepoList(islamicStudiesRepo);
  const { data: oromo, loading: l15 } = useRepoList(oromoProgressRepo);

  const loading = [l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14, l15].some(Boolean);

  if (loading) return <Spinner label="Loading student profile…" />;

  const student = students.find((s) => s.id === id);
  if (!student) {
    return <EmptyState title="Student not found" description="This student may have been removed." action={<Link to=".." className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Back to students</Link>} />;
  }

  const studentClass = classes.find((c) => c.id === student.classId);
  const myAttendance = attendance.filter((a) => a.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const presentCount = myAttendance.filter((a) => a.status === 'present').length;
  const attendanceRate = myAttendance.length ? Math.round((presentCount / myAttendance.length) * 100) : 0;

  const myHomework = homework.filter((h) => h.classId === student.classId);
  const mySubmissions = submissions.filter((s) => s.studentId === student.id);

  const myResults = results.filter((r) => r.studentId === student.id);
  const myInvoices = invoices.filter((i) => i.studentId === student.id);
  const myDocuments = documents.filter((d) => d.studentId === student.id);

  const myQuran = quran.filter((q) => q.studentId === student.id);
  const myIqra = iqra.filter((q) => q.studentId === student.id);
  const myIslamic = islamic.filter((q) => q.studentId === student.id);
  const myOromo = oromo.filter((q) => q.studentId === student.id);

  return (
    <div className="space-y-4">
      <Link to=".." className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>

      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{student.firstName} {student.lastName}</h2>
              <p className="text-sm text-slate-500">{student.studentCode} · {studentClass?.name ?? '—'} · {student.yearLevel}</p>
              <div className="mt-1"><Badge tone={student.status === 'active' ? 'green' : 'slate'}>{student.status}</Badge></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-lg font-bold text-slate-900">{attendanceRate}%</p><p className="text-xs text-slate-500">Attendance</p></div>
            <div><p className="text-lg font-bold text-slate-900">{myHomework.length}</p><p className="text-xs text-slate-500">Homework</p></div>
            <div><p className="text-lg font-bold text-slate-900">{myResults.length}</p><p className="text-xs text-slate-500">Exams</p></div>
          </div>
        </CardBody>
      </Card>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Personal details" />
            <CardBody className="space-y-3 text-sm">
              <p><span className="text-slate-500">Date of birth:</span> {student.dob}</p>
              <p><span className="text-slate-500">Gender:</span> {student.gender}</p>
              <p><span className="text-slate-500">Enrollment date:</span> {student.enrollmentDate}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {student.address || '—'}</p>
              <p className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-slate-400" /> {student.medicalNotes || 'No medical notes on file'}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Guardian & emergency contact" />
            <CardBody className="space-y-3 text-sm">
              <p className="font-medium text-slate-700">{student.guardianName}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {student.guardianPhone}</p>
              {student.guardianEmail && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {student.guardianEmail}</p>}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold uppercase text-slate-400">Emergency contact</p>
                <p className="mt-1 font-medium text-slate-700">{student.emergencyContactName || '—'}</p>
                <p className="text-slate-600">{student.emergencyContactPhone || '—'}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'Attendance' && (
        <Card>
          <CardHeader title="Attendance history" subtitle={`${attendanceRate}% present overall`} />
          {myAttendance.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No attendance records yet" />
          ) : (
            <CardBody className="!p-0 divide-y divide-slate-100">
              {myAttendance.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-slate-700">{a.date}</p>
                  <Badge tone={a.status === 'present' ? 'green' : a.status === 'late' ? 'amber' : 'rose'}>{a.status}</Badge>
                </div>
              ))}
            </CardBody>
          )}
        </Card>
      )}

      {tab === 'Homework' && (
        <Card>
          <CardHeader title="Homework" />
          {myHomework.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No homework assigned" />
          ) : (
            <CardBody className="!p-0 divide-y divide-slate-100">
              {myHomework.map((h) => {
                const sub = mySubmissions.find((s) => s.homeworkId === h.id);
                return (
                  <div key={h.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{h.title}</p>
                      <p className="text-xs text-slate-500">Due {h.dueDate}</p>
                    </div>
                    <Badge tone={sub?.status === 'submitted' || sub?.status === 'graded' ? 'green' : 'amber'}>{sub?.status ?? 'pending'}</Badge>
                  </div>
                );
              })}
            </CardBody>
          )}
        </Card>
      )}

      {tab === 'Exams' && (
        <Card>
          <CardHeader title="Exam results" />
          {myResults.length === 0 ? (
            <EmptyState icon={FileSpreadsheet} title="No exam results recorded" />
          ) : (
            <CardBody className="!p-0 divide-y divide-slate-100">
              {myResults.map((r) => {
                const exam = exams.find((e) => e.id === r.examId);
                const subject = subjects.find((s) => s.id === exam?.subjectId);
                const pct = exam ? Math.round((r.marksObtained / exam.maxMarks) * 100) : 0;
                return (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{exam?.name} {subject && `· ${subject.name}`}</p>
                      <p className="text-xs text-slate-500">{r.teacherComment}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{r.marksObtained}/{exam?.maxMarks} ({pct}%)</p>
                      {r.grade && <Badge tone="violet">{r.grade}</Badge>}
                    </div>
                  </div>
                );
              })}
            </CardBody>
          )}
        </Card>
      )}

      {tab === 'Fees' && (
        <Card>
          <CardHeader title="Fee invoices" />
          {myInvoices.length === 0 ? (
            <EmptyState icon={Wallet} title="No invoices yet" />
          ) : (
            <CardBody className="!p-0 divide-y divide-slate-100">
              {myInvoices.map((inv) => {
                const structure = feeStructures.find((f) => f.id === inv.feeStructureId);
                const balance = inv.amount - inv.discount - inv.amountPaid;
                return (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{structure?.name ?? 'Fee'}</p>
                      <p className="text-xs text-slate-500">Due {inv.dueDate} · Paid ${inv.amountPaid.toLocaleString()} of ${inv.amount.toLocaleString()}</p>
                    </div>
                    <Badge tone={inv.status === 'paid' ? 'green' : inv.status === 'partial' ? 'amber' : 'rose'}>
                      {inv.status === 'paid' ? 'Paid' : `$${balance.toLocaleString()} due`}
                    </Badge>
                  </div>
                );
              })}
            </CardBody>
          )}
        </Card>
      )}

      {tab === 'Documents' && (
        <Card>
          <CardHeader title="Documents" />
          {myDocuments.length === 0 ? (
            <EmptyState icon={FileText} title="No documents uploaded" description="Documents such as ID copies and medical records will appear here." />
          ) : (
            <CardBody className="!p-0 divide-y divide-slate-100">
              {myDocuments.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-slate-700">{d.name}</p>
                  <Badge tone="sky">{d.category}</Badge>
                </div>
              ))}
            </CardBody>
          )}
        </Card>
      )}

      {tab === 'Progress' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Quran progress" />
            {myQuran.length === 0 ? <EmptyState icon={Moon} title="No Quran progress recorded" /> : (
              <CardBody className="!p-0 divide-y divide-slate-100">
                {myQuran.map((q) => (
                  <div key={q.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-slate-700">{q.surah} ({q.ayahRange})</p>
                    <p className="text-xs text-slate-500">{q.memorisationStatus.replace('_', ' ')} · {q.recitationLevel} · {q.date}</p>
                  </div>
                ))}
              </CardBody>
            )}
          </Card>
          <Card>
            <CardHeader title="Iqra progress" />
            {myIqra.length === 0 ? <EmptyState title="No Iqra progress recorded" /> : (
              <CardBody className="!p-0 divide-y divide-slate-100">
                {myIqra.map((q) => (
                  <div key={q.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-slate-700">{q.bookLevel} — {q.lesson}</p>
                    <p className="text-xs text-slate-500">{q.completionStatus.replace('_', ' ')} · {q.date}</p>
                  </div>
                ))}
              </CardBody>
            )}
          </Card>
          <Card>
            <CardHeader title="Islamic studies" />
            {myIslamic.length === 0 ? <EmptyState title="No Islamic studies progress recorded" /> : (
              <CardBody className="!p-0 divide-y divide-slate-100">
                {myIslamic.map((q) => (
                  <div key={q.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-slate-700">{q.topic} — {q.lesson}</p>
                    <p className="text-xs text-slate-500">{q.progress.replace('_', ' ')} · {q.date}</p>
                  </div>
                ))}
              </CardBody>
            )}
          </Card>
          <Card>
            <CardHeader title="Oromo language" />
            {myOromo.length === 0 ? <EmptyState title="No Oromo progress recorded" /> : (
              <CardBody className="!p-0 divide-y divide-slate-100">
                {myOromo.map((q) => (
                  <div key={q.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-slate-700">{q.vocabulary}</p>
                    <p className="text-xs text-slate-500">Reading: {q.reading} · Writing: {q.writing} · {q.date}</p>
                  </div>
                ))}
              </CardBody>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
