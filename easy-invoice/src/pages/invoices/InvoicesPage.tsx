import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, Search } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Spinner } from "../../components/ui/Spinner";
import { useInvoices } from "../../lib/dataHooks";
import { useApp } from "../../app/AppProvider";
import { displayStatus, formatMoney } from "../../lib/money";

const FILTERS = ["all", "draft", "issued", "partially_paid", "paid", "overdue", "void"] as const;
const FILTER_LABELS: Record<(typeof FILTERS)[number], string> = {
  all: "All",
  draft: "Draft",
  issued: "Issued",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export function InvoicesPage() {
  const { business } = useApp();
  const { data: invoices, loading } = useInvoices();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [search, setSearch] = useState("");
  const currency = business?.currency ?? "AUD";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices
      .filter((i) => i.type === "invoice")
      .filter((i) => {
        const status = displayStatus(i.status, i.dueDate, i.balanceDueCents);
        return filter === "all" || status === filter;
      })
      .filter((i) => !q || (i.invoiceNumber ?? "draft").toLowerCase().includes(q) || i.customer.name.toLowerCase().includes(q));
  }, [invoices, filter, search]);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Every invoice and credit note you've created."
        action={
          <Link to="/invoices/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New invoice
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input className="field-input pl-9" placeholder="Search invoice # or customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}>
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description="Try a different filter, or create your first invoice."
          action={
            <Link to="/invoices/new" className="btn-primary">
              <Plus className="h-4 w-4" /> New invoice
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-ink-100">
            {filtered.map((inv) => (
              <li key={inv.id}>
                <Link to={inv.status === "draft" ? `/invoices/${inv.id}/edit` : `/invoices/${inv.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-50 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">
                      {inv.invoiceNumber ?? "Draft"} {inv.isDemo && <span className="ml-1 text-xs font-normal text-ink-400">(Demo)</span>}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {inv.customer.name || "No customer"} · {inv.issueDate}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-sm font-medium text-ink-700 sm:block">{formatMoney(inv.totalCents, currency)}</span>
                  <StatusBadge status={displayStatus(inv.status, inv.dueDate, inv.balanceDueCents)} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
