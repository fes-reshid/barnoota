import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatTile } from "../../components/ui/StatTile";
import { useInvoices, usePayments } from "../../lib/dataHooks";
import { useApp } from "../../app/AppProvider";
import { displayStatus, formatMoney } from "../../lib/money";
import { inRange } from "../../lib/reportCalc";
import { downloadCsv } from "../../lib/csv";
import { FileText, Wallet, Receipt, Percent } from "lucide-react";

function firstOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function ReportsPage() {
  const { business, isDemoMode } = useApp();
  const { data: invoices } = useInvoices();
  const { data: payments } = usePayments();
  const [start, setStart] = useState(firstOfMonthIso());
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const [includeDemo, setIncludeDemo] = useState(isDemoMode);
  const currency = business?.currency ?? "AUD";

  const invoicesInRange = useMemo(
    () =>
      invoices
        .filter((i) => includeDemo || !i.isDemo)
        .filter((i) => i.status !== "draft")
        .filter((i) => inRange(i.issueDate, start, end)),
    [invoices, start, end, includeDemo],
  );

  const paymentsInRange = useMemo(
    () =>
      payments
        .filter((p) => includeDemo || !p.isDemo)
        .filter((p) => !p.voided)
        .filter((p) => inRange(p.date, start, end)),
    [payments, start, end, includeDemo],
  );

  const totals = useMemo(() => {
    const invoiced = invoicesInRange.reduce((s, i) => s + i.totalCents, 0);
    const tax = invoicesInRange.reduce((s, i) => s + i.taxTotalCents, 0);
    const receivedInRange = paymentsInRange.reduce((s, p) => s + p.amountCents, 0);
    const outstanding = invoices
      .filter((i) => includeDemo || !i.isDemo)
      .filter((i) => i.status !== "draft" && i.status !== "void")
      .reduce((s, i) => s + i.balanceDueCents, 0);
    return { invoiced, tax, receivedInRange, outstanding };
  }, [invoicesInRange, paymentsInRange, invoices, includeDemo]);

  const exportInvoicesCsv = () => {
    downloadCsv(
      `invoices_${start}_to_${end}.csv`,
      ["Invoice #", "Customer", "Issue date", "Due date", "Status", "Subtotal", "Discount", "Tax", "Total", "Paid", "Balance due"],
      invoicesInRange.map((i) => [
        i.invoiceNumber ?? "",
        i.customer.name,
        i.issueDate,
        i.dueDate,
        displayStatus(i.status, i.dueDate, i.balanceDueCents),
        (i.subtotalCents / 100).toFixed(2),
        (i.discountTotalCents / 100).toFixed(2),
        (i.taxTotalCents / 100).toFixed(2),
        (i.totalCents / 100).toFixed(2),
        (i.amountPaidCents / 100).toFixed(2),
        (i.balanceDueCents / 100).toFixed(2),
      ]),
    );
  };

  const exportPaymentsCsv = () => {
    downloadCsv(
      `payments_${start}_to_${end}.csv`,
      ["Date", "Invoice #", "Customer", "Amount", "Method", "Reference"],
      paymentsInRange.map((p) => [p.date, p.invoiceNumber, p.customerName, (p.amountCents / 100).toFixed(2), p.method, p.reference]),
    );
  };

  return (
    <div>
      <PageHeader title="Reports" description="Date-filtered figures for invoicing, payments, outstanding balances and tax." />

      <div className="card mb-6 flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="field-label">From</label>
          <input type="date" className="field-input" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="field-label">To</label>
          <input type="date" className="field-input" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <label className="mb-2 flex items-center gap-2 text-sm text-ink-500">
          <input type="checkbox" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
          Include demo data
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Invoiced (range)" value={formatMoney(totals.invoiced, currency)} icon={FileText} tone="brand" />
        <StatTile label="Payments received (range)" value={formatMoney(totals.receivedInRange, currency)} icon={Wallet} tone="brand" />
        <StatTile label="Outstanding balance (all time)" value={formatMoney(totals.outstanding, currency)} icon={Receipt} tone="warning" />
        <StatTile label={business?.gstRegistered ? "GST charged (range)" : "Tax charged (range)"} value={formatMoney(totals.tax, currency)} icon={Percent} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900">Invoices in range ({invoicesInRange.length})</h3>
            <button className="btn-secondary btn-sm" onClick={exportInvoicesCsv} disabled={invoicesInRange.length === 0}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
          {invoicesInRange.length === 0 ? (
            <p className="text-sm text-ink-400">No invoices in this date range.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto">
              {invoicesInRange.map((i) => (
                <li key={i.id} className="flex justify-between py-2 text-sm">
                  <span className="text-ink-600">
                    {i.invoiceNumber} · {i.customer.name}
                  </span>
                  <span className="font-medium text-ink-800">{formatMoney(i.totalCents, currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900">Payments in range ({paymentsInRange.length})</h3>
            <button className="btn-secondary btn-sm" onClick={exportPaymentsCsv} disabled={paymentsInRange.length === 0}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
          {paymentsInRange.length === 0 ? (
            <p className="text-sm text-ink-400">No payments in this date range.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto">
              {paymentsInRange.map((p) => (
                <li key={p.id} className="flex justify-between py-2 text-sm">
                  <span className="text-ink-600">
                    {p.date} · {p.customerName}
                  </span>
                  <span className="font-medium text-brand-700">{formatMoney(p.amountCents, currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
