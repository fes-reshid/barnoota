import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, CheckCircle2, AlertCircle, Receipt, Settings2 } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useRepoList } from '@/lib/useRepoList';
import { feeInvoicesRepo, feeStructuresRepo, studentsRepo } from '@/lib/services';
import type { FeeInvoice } from '@/types';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { usePagedList } from '@/lib/usePagedList';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { RecordPaymentModal } from './RecordPaymentModal';

export default function FeesAdminPage() {
  usePageTitle('Fees');
  const { data: invoices, loading, reload } = useRepoList(feeInvoicesRepo);
  const { data: structures } = useRepoList(feeStructuresRepo);
  const { data: students } = useRepoList(studentsRepo);

  const [payingInvoice, setPayingInvoice] = useState<FeeInvoice | null>(null);

  const collected = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const outstanding = invoices.reduce((sum, i) => sum + (i.amount - i.discount - i.amountPaid), 0);
  const paidCount = invoices.filter((i) => i.status === 'paid').length;
  const unpaidCount = invoices.filter((i) => i.status !== 'paid').length;

  const { search, setSearch, page, setPage, filtered, paged, pageSize } = usePagedList<FeeInvoice>(
    invoices,
    (inv, q) => {
      const s = students.find((st) => st.id === inv.studentId);
      return `${s?.firstName} ${s?.lastName}`.toLowerCase().includes(q);
    },
  );

  const columns: Column<FeeInvoice>[] = [
    {
      header: 'Student', render: (inv) => {
        const s = students.find((st) => st.id === inv.studentId);
        return s ? `${s.firstName} ${s.lastName}` : '—';
      },
    },
    { header: 'Fee', render: (inv) => structures.find((f) => f.id === inv.feeStructureId)?.name ?? '—' },
    { header: 'Amount', render: (inv) => `$${inv.amount.toLocaleString()}` },
    { header: 'Paid', render: (inv) => `$${inv.amountPaid.toLocaleString()}` },
    { header: 'Status', render: (inv) => <Badge tone={inv.status === 'paid' ? 'green' : inv.status === 'partial' ? 'amber' : 'rose'}>{inv.status}</Badge> },
    {
      header: '', className: 'text-right',
      render: (inv) => inv.status !== 'paid' && (
        <button className="btn-secondary !py-1 !px-3 text-xs" onClick={() => setPayingInvoice(inv)}>
          <Receipt className="h-3.5 w-3.5" /> Record payment
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total collected" value={`$${collected.toLocaleString()}`} icon={Wallet} tone="brand" />
        <StatCard label="Total outstanding" value={`$${outstanding.toLocaleString()}`} icon={AlertCircle} tone="amber" />
        <StatCard label="Paid invoices" value={paidCount} icon={CheckCircle2} tone="sky" />
        <StatCard label="Unpaid invoices" value={unpaidCount} icon={Receipt} tone="rose" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student…" />
        </div>
        <Link to="structures" className="btn-secondary w-fit"><Settings2 className="h-4 w-4" /> Manage fee structures</Link>
      </div>

      <Card>
        <DataTable columns={columns} rows={paged} rowKey={(i) => i.id} loading={loading} emptyTitle="No invoices yet" />
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </Card>

      <RecordPaymentModal open={!!payingInvoice} onClose={() => setPayingInvoice(null)} onSaved={reload} invoice={payingInvoice} />
    </div>
  );
}
