import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Receipt, Wallet, AlertTriangle, Clock, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatTile } from "../../components/ui/StatTile";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { useInvoices, usePayments } from "../../lib/dataHooks";
import { useApp } from "../../app/AppProvider";
import { formatMoney, displayStatus } from "../../lib/money";
import { isSameMonth, daysUntil } from "../../lib/reportCalc";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { loadDemoData } from "../../lib/repo/demoData";
import { Spinner } from "../../components/ui/Spinner";

export function DashboardPage() {
  const { business, user, businessId } = useApp();
  const { data: invoices, loading: invoicesLoading } = useInvoices();
  const { data: payments, loading: paymentsLoading } = usePayments();
  const [includeDemo, setIncludeDemo] = useState(false);

  const realInvoices = useMemo(() => (includeDemo ? invoices : invoices.filter((i) => !i.isDemo)), [invoices, includeDemo]);
  const realPayments = useMemo(() => (includeDemo ? payments : payments.filter((p) => !p.isDemo)), [payments, includeDemo]);

  const stats = useMemo(() => {
    let invoicedThisMonth = 0;
    let outstanding = 0;
    let overdue = 0;
    for (const inv of realInvoices) {
      if (inv.status === "draft" || inv.status === "void") continue;
      if (isSameMonth(inv.issueDate)) invoicedThisMonth += inv.totalCents;
      outstanding += inv.balanceDueCents;
      if (displayStatus(inv.status, inv.dueDate, inv.balanceDueCents) === "overdue") overdue += inv.balanceDueCents;
    }
    let paidThisMonth = 0;
    for (const p of realPayments) {
      if (p.voided) continue;
      if (isSameMonth(p.date)) paidThisMonth += p.amountCents;
    }
    return { invoicedThisMonth, paidThisMonth, outstanding, overdue };
  }, [realInvoices, realPayments]);

  const recentInvoices = useMemo(
    () => [...realInvoices].sort((a, b) => (b.issueDate > a.issueDate ? 1 : -1)).slice(0, 6),
    [realInvoices],
  );

  const dueSoon = useMemo(
    () =>
      realInvoices
        .filter((inv) => (inv.status === "issued" || inv.status === "partially_paid") && inv.balanceDueCents > 0)
        .map((inv) => ({ inv, days: daysUntil(inv.dueDate) }))
        .filter(({ days }) => days >= 0 && days <= 7)
        .sort((a, b) => a.days - b.days)
        .slice(0, 6),
    [realInvoices],
  );

  const currency = business?.currency ?? "AUD";
  const loading = invoicesLoading || paymentsLoading;

  const demoAction = useAsyncAction(
    async () => {
      if (!business || !user) return;
      await loadDemoData(business, user.uid, user.email ?? "");
      setIncludeDemo(true);
    },
    { successMessage: "Sample data loaded — look for the “Demo” badge." },
  );

  const isEmpty = !loading && realInvoices.length === 0 && realPayments.length === 0;

  return (
    <div>
      <PageHeader
        title={`Welcome${business?.name ? `, ${business.name}` : ""}`}
        description="Here's how your business is tracking."
        action={
          <Link to="/invoices/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New invoice
          </Link>
        }
      />

      <label className="mb-4 flex w-fit items-center gap-2 text-sm text-ink-500">
        <input type="checkbox" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
        Include demo data in these figures
      </label>

      {isEmpty ? (
        <EmptyState
          icon={Sparkles}
          title="Let's get you started"
          description={`Set up ${businessId ? "your business details" : "your account"}, add a customer, and create your first invoice — or load fictional sample data to explore Easy Invoice first.`}
          action={
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Link to="/settings" className="btn-secondary">
                Business settings
              </Link>
              <Link to="/invoices/new" className="btn-primary">
                <Plus className="h-4 w-4" /> Create an invoice
              </Link>
              <button className="btn-ghost" onClick={() => demoAction.run()} disabled={demoAction.pending}>
                {demoAction.pending && <Spinner className="h-4 w-4" />}
                Load sample data
              </button>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Invoiced this month" value={formatMoney(stats.invoicedThisMonth, currency)} icon={FileText} tone="brand" />
            <StatTile label="Payments received this month" value={formatMoney(stats.paidThisMonth, currency)} icon={Wallet} tone="brand" />
            <StatTile label="Outstanding balance" value={formatMoney(stats.outstanding, currency)} icon={Receipt} tone="warning" />
            <StatTile label="Overdue balance" value={formatMoney(stats.overdue, currency)} icon={AlertTriangle} tone="danger" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-ink-900">Recent invoices</h3>
              {recentInvoices.length === 0 ? (
                <p className="text-sm text-ink-400">No invoices yet.</p>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {recentInvoices.map(({ id, invoiceNumber, customer, totalCents, status, dueDate, balanceDueCents, isDemo }) => (
                    <li key={id} className="flex items-center justify-between gap-3 py-2.5">
                      <Link to={`/invoices/${id}`} className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-800">
                          {invoiceNumber ?? "Draft"} {isDemo && <span className="ml-1 text-xs text-ink-400">(Demo)</span>}
                        </p>
                        <p className="truncate text-xs text-ink-400">{customer.name || "No customer"}</p>
                      </Link>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-medium text-ink-700">{formatMoney(totalCents, currency)}</span>
                        <StatusBadge status={displayStatus(status, dueDate, balanceDueCents)} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900">
                <Clock className="h-4 w-4 text-ink-400" /> Due within 7 days
              </h3>
              {dueSoon.length === 0 ? (
                <p className="text-sm text-ink-400">Nothing due soon.</p>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {dueSoon.map(({ inv, days }) => (
                    <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                      <Link to={`/invoices/${inv.id}`} className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-800">{inv.invoiceNumber}</p>
                        <p className="truncate text-xs text-ink-400">{inv.customer.name}</p>
                      </Link>
                      <div className="flex shrink-0 items-center gap-2 text-right">
                        <span className="text-sm font-medium text-ink-700">{formatMoney(inv.balanceDueCents, currency)}</span>
                        <span className="text-xs text-ink-400">{days === 0 ? "Today" : `${days}d`}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
