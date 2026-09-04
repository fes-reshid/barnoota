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

export default function ParentsPage() {
  usePageTitle('Parents');
  const { data: users, loading } = useRepoList(usersRepo);
  const { data: students } = useRepoList(studentsRepo);

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
      <div className="w-full max-w-xs">
        <SearchInput value={search} onChange={setSearch} placeholder="Search parents…" />
      </div>
      <Card>
        <DataTable columns={columns} rows={paged} rowKey={(p) => p.id} loading={loading} emptyTitle="No parents yet" />
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </Card>
    </div>
  );
}
