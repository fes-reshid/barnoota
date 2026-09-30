import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileSignature, Plus, Search } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Spinner } from "../../components/ui/Spinner";
import { useQuotes } from "../../lib/dataHooks";
import { useApp } from "../../app/AppProvider";
import { formatMoney } from "../../lib/money";

export function QuotesPage() {
  const { business } = useApp();
  const { data: quotes, loading } = useQuotes();
  const [search, setSearch] = useState("");
  const currency = business?.currency ?? "AUD";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotes.filter((qq) => !q || (qq.quoteNumber ?? "draft").toLowerCase().includes(q) || qq.customer.name.toLowerCase().includes(q));
  }, [quotes, search]);

  return (
    <div>
      <PageHeader
        title="Quotes"
        description="Send quotes and convert accepted ones straight into invoices."
        action={
          <Link to="/quotes/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New quote
          </Link>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input className="field-input pl-9" placeholder="Search quote # or customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="No quotes yet"
          description="Create a quote for a customer, and convert it to an invoice the moment they accept."
          action={
            <Link to="/quotes/new" className="btn-primary">
              <Plus className="h-4 w-4" /> New quote
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-ink-100">
            {filtered.map((q) => (
              <li key={q.id}>
                <Link to={q.status === "draft" ? `/quotes/${q.id}/edit` : `/quotes/${q.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-50 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">
                      {q.quoteNumber ?? "Draft"} {q.isDemo && <span className="ml-1 text-xs font-normal text-ink-400">(Demo)</span>}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {q.customer.name || "No customer"} · expires {q.expiryDate}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-sm font-medium text-ink-700 sm:block">{formatMoney(q.totalCents, currency)}</span>
                  <StatusBadge status={q.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
