import { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import { usersRepo, studentsRepo } from '@/lib/services';
import { usePagedList } from '@/lib/usePagedList';
import type { AppUser } from '@/types';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { ParentFormModal } from './ParentFormModal';

export default function ParentsPage() {
  usePageTitle('Parents');
  const { data: users, loading, reload } = useRepoList(usersRepo);
  const { data: students } = useRepoList(studentsRepo);
  const [formOpen, setFormOpen] = useState(false);

  const parents = users.filter((u) => u.role === 'parent');
  const { search, setSearch, page, setPage, filtered, paged, pageSize } = usePagedList<AppUser>(
    parents,
    (p, q) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
  );

  const columns: Column<AppUser>[] = [
    { header: 'Parent', render: (p) => <div><p className="font-medium text-slate-800">{p.name}</p><p className="text-xs text-slate-500">{p.email}</p></div> },
    { header: 'Phone', render: (p) => p.phone || '—' },
    {
      header: 'Children',
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {(p.childrenIds ?? []).map((id) => {
            const s = students.find((st) => st.id === id);
            return s ? <Badge key={id} tone="green">{s.firstName} {s.lastName}</Badge> : null;
          })}
          {!(p.childrenIds ?? []).length && <span className="text-xs text-slate-400">No children linked</span>}
        </div>
      ),
    },
    { header: 'Status', render: (p) => <Badge tone={p.active ? 'green' : 'rose'}>{p.active ? 'Active' : 'Suspended'}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="w-full max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search parents…" />
        </div>
        <button className="btn-primary shrink-0" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Add parent
        </button>
      </div>
      <Card>
        <DataTable
          columns={columns}
          rows={paged}
          rowKey={(p) => p.id}
          loading={loading}
          emptyTitle="No parents yet"
          emptyDescription="Add a parent account and link it to their child's record."
          emptyAction={<button className="btn-primary" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add parent</button>}
        />
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </Card>

      <ParentFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={reload} students={students} />
    </div>
  );
}
