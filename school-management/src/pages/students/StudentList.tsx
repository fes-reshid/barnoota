import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, Upload, GraduationCap, Archive, Pencil } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/context/AuthContext';
import { useRepoList } from '@/lib/useRepoList';
import { classesRepo, studentsRepo } from '@/lib/services';
import type { Student } from '@/types';
import { usePagedList } from '@/lib/usePagedList';
import { exportToCsv, parseCsv } from '@/lib/csv';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { StudentFormModal } from './StudentFormModal';

export default function StudentList({ readOnly = false }: { readOnly?: boolean }) {
  usePageTitle('Students');
  const { schoolId, currentUser } = useAuth();
  const { data: students, loading, reload } = useRepoList(studentsRepo);
  const { data: classes } = useRepoList(classesRepo);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<Student['status'] | 'all'>('active');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [archiving, setArchiving] = useState<Student | null>(null);

  const teacherClassIds = readOnly && currentUser?.teacherId
    ? classes.filter((c) => c.classTeacherId === currentUser.teacherId).map((c) => c.id)
    : null;

  const scoped = students.filter((s) => {
    if (teacherClassIds && teacherClassIds.length && !teacherClassIds.includes(s.classId)) return false;
    if (classFilter !== 'all' && s.classId !== classFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  const { search, setSearch, page, setPage, filtered, paged, pageSize } = usePagedList<Student>(
    scoped,
    (s, q) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.studentCode.toLowerCase().includes(q) ||
      s.guardianName.toLowerCase().includes(q),
  );

  function className(classId: string) {
    return classes.find((c) => c.id === classId)?.name ?? '—';
  }

  async function handleArchive() {
    if (!archiving) return;
    await studentsRepo.update(archiving.id, { status: archiving.status === 'archived' ? 'active' : 'archived' });
    showToast(archiving.status === 'archived' ? 'Student restored.' : 'Student archived.');
    setArchiving(null);
    reload();
  }

  function handleExport() {
    exportToCsv(
      'students.csv',
      filtered.map((s) => ({
        code: s.studentCode, firstName: s.firstName, lastName: s.lastName, class: className(s.classId),
        gender: s.gender, dob: s.dob, guardian: s.guardianName, phone: s.guardianPhone, status: s.status,
      })),
    );
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    let created = 0;
    for (const row of rows) {
      if (!row.firstName || !row.lastName) continue;
      const targetClass = classes.find((c) => c.name === row.class) ?? classes[0];
      await studentsRepo.create({
        schoolId,
        studentCode: row.code || `S-IMP-${Date.now()}-${created}`,
        firstName: row.firstName,
        lastName: row.lastName,
        dob: row.dob || '2015-01-01',
        gender: (row.gender as Student['gender']) || 'male',
        classId: targetClass?.id ?? '',
        yearLevel: targetClass?.yearLevel ?? '',
        enrollmentDate: new Date().toISOString().slice(0, 10),
        status: 'active',
        guardianName: row.guardian || 'Unknown',
        guardianPhone: row.phone || '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
      created += 1;
    }
    showToast(`Imported ${created} student${created === 1 ? '' : 's'}.`);
    e.target.value = '';
    reload();
  }

  const columns: Column<Student>[] = [
    {
      header: 'Student',
      render: (s) => (
        <Link to={`${s.id}`} className="flex items-center gap-3 hover:underline">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {s.firstName[0]}{s.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-slate-800">{s.firstName} {s.lastName}</p>
            <p className="text-xs text-slate-500">{s.studentCode}</p>
          </div>
        </Link>
      ),
    },
    { header: 'Class', render: (s) => className(s.classId) },
    { header: 'Guardian', render: (s) => <div><p>{s.guardianName}</p><p className="text-xs text-slate-500">{s.guardianPhone}</p></div> },
    { header: 'Status', render: (s) => <Badge tone={s.status === 'active' ? 'green' : s.status === 'archived' ? 'slate' : 'sky'}>{s.status}</Badge> },
    ...(readOnly
      ? []
      : [{
          header: '',
          render: (s: Student) => (
            <div className="flex justify-end gap-1">
              <button className="btn-ghost !px-2 !py-1" title="Edit" onClick={() => { setEditing(s); setFormOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </button>
              <button className="btn-ghost !px-2 !py-1" title={s.status === 'archived' ? 'Restore' : 'Archive'} onClick={() => setArchiving(s)}>
                <Archive className="h-4 w-4" />
              </button>
            </div>
          ),
          className: 'text-right',
        }]),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code or guardian…" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="input !w-auto" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="all">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="graduated">Graduated</option>
            <option value="all">All statuses</option>
          </select>
          <button className="btn-secondary" onClick={handleExport}><Download className="h-4 w-4" /> Export</button>
          {!readOnly && (
            <>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
              <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Import</button>
              <button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add student</button>
            </>
          )}
        </div>
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={paged}
          rowKey={(s) => s.id}
          loading={loading}
          emptyTitle="No students found"
          emptyDescription="Try adjusting your filters, or add a new student."
          emptyAction={!readOnly && <button className="btn-primary" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add student</button>}
        />
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </Card>

      {!readOnly && (
        <>
          <StudentFormModal
            open={formOpen}
            onClose={() => setFormOpen(false)}
            onSaved={reload}
            classes={classes}
            student={editing}
          />
          <ConfirmDialog
            open={!!archiving}
            title={archiving?.status === 'archived' ? 'Restore student?' : 'Archive student?'}
            message={
              archiving?.status === 'archived'
                ? `${archiving?.firstName} ${archiving?.lastName} will be restored to active status.`
                : `${archiving?.firstName} ${archiving?.lastName} will be archived and hidden from active lists. This can be undone.`
            }
            confirmLabel={archiving?.status === 'archived' ? 'Restore' : 'Archive'}
            danger={archiving?.status !== 'archived'}
            onConfirm={handleArchive}
            onCancel={() => setArchiving(null)}
          />
        </>
      )}

      {classes.length === 0 && (
        <p className="flex items-center gap-2 text-xs text-slate-500"><GraduationCap className="h-4 w-4" /> Create a class first to enroll students.</p>
      )}
    </div>
  );
}
