import { useState } from 'react';
import { Plus, Pencil, Archive } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import { teachersRepo, subjectsRepo, classesRepo } from '@/lib/services';
import type { Teacher } from '@/types';
import { usePagedList } from '@/lib/usePagedList';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { TeacherFormModal } from './TeacherFormModal';

export default function TeacherList() {
  usePageTitle('Teachers');
  const { data: teachers, loading, reload } = useRepoList(teachersRepo);
  const { data: subjects } = useRepoList(subjectsRepo);
  const { data: classes } = useRepoList(classesRepo);
  const { showToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [archiving, setArchiving] = useState<Teacher | null>(null);

  const { search, setSearch, page, setPage, filtered, paged, pageSize } = usePagedList<Teacher>(
    teachers.filter((t) => t.status === 'active'),
    (t, q) => `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) || t.email.toLowerCase().includes(q),
  );

  async function handleArchive() {
    if (!archiving) return;
    await teachersRepo.update(archiving.id, { status: 'archived' });
    showToast('Teacher archived.');
    setArchiving(null);
    reload();
  }

  const columns: Column<Teacher>[] = [
    {
      header: 'Teacher',
      render: (t) => (
        <div className="flex items-center gap-3">
          <Avatar photoUrl={t.photoUrl} initials={`${t.firstName[0]}${t.lastName[0]}`} tone="sky" />
          <div>
            <p className="font-medium text-slate-800">{t.firstName} {t.lastName}</p>
            <p className="text-xs text-slate-500">{t.teacherCode}</p>
          </div>
        </div>
      ),
    },
    { header: 'Contact', render: (t) => <div><p>{t.email}</p><p className="text-xs text-slate-500">{t.phone}</p></div> },
    {
      header: 'Subjects',
      render: (t) => (
        <div className="flex flex-wrap gap-1">
          {t.subjectIds.map((id) => <Badge key={id} tone="sky">{subjects.find((s) => s.id === id)?.name ?? id}</Badge>)}
        </div>
      ),
    },
    { header: 'Classes', render: (t) => classes.filter((c) => c.classTeacherId === t.id).map((c) => c.name).join(', ') || '—' },
    { header: 'Employment', render: (t) => <Badge tone="violet">{t.employmentType.replace('_', ' ')}</Badge> },
    {
      header: '',
      render: (t) => (
        <div className="flex justify-end gap-1">
          <button className="btn-ghost !px-2 !py-1" onClick={() => { setEditing(t); setFormOpen(true); }}><Pencil className="h-4 w-4" /></button>
          <button className="btn-ghost !px-2 !py-1" onClick={() => setArchiving(t)}><Archive className="h-4 w-4" /></button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search teachers…" />
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add teacher</button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={paged}
          rowKey={(t) => t.id}
          loading={loading}
          emptyTitle="No teachers yet"
          emptyAction={<button className="btn-primary" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add teacher</button>}
        />
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </Card>

      <TeacherFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={reload} subjects={subjects} teacher={editing} />
      <ConfirmDialog
        open={!!archiving}
        title="Archive teacher?"
        message={`${archiving?.firstName} ${archiving?.lastName} will be archived and hidden from active lists.`}
        onConfirm={handleArchive}
        onCancel={() => setArchiving(null)}
      />
    </div>
  );
}
