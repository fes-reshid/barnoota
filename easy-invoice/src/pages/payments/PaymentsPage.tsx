import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { usePayments } from "../../lib/dataHooks";
import { useApp } from "../../app/AppProvider";
import { formatMoney } from "../../lib/money";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { voidPayment } from "../../lib/repo/invoices";

export function PaymentsPage() {
  const { business, businessId, user } = useApp();
  const { data: payments, loading } = usePayments();
  const [includeDemo, setIncludeDemo] = useState(false);
  const currency = business?.currency ?? "AUD";

  const filtered = useMemo(() => (includeDemo ? payments : payments.filter((p) => !p.isDemo)), [payments, includeDemo]);
  const total = useMemo(() => filtered.filter((p) => !p.voided).reduce((s, p) => s + p.amountCents, 0), [filtered]);

  const voidAction = useAsyncAction(async (paymentId: string) => {
    if (!businessId || !user) return;
    await voidPayment(businessId, paymentId, user.uid, user.email ?? "");
  });

  return (
    <div>
      <PageHeader title="Payments" description="Every payment recorded across all your invoices." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-500">
          <input type="checkbox" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
          Include demo data
        </label>
        <p className="text-sm text-ink-500">
          Total received: <span className="font-semibold text-ink-800">{formatMoney(total, currency)}</span>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="No payments yet" description="Payments you record against invoices will show up here." />
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-ink-100">
            {filtered.map((p) => (
              <li key={p.id} className={`flex items-center justify-between gap-3 px-4 py-3 sm:px-5 ${p.voided ? "opacity-50" : ""}`}>
                <Link to={`/invoices/${p.invoiceId}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800">
                    {p.invoiceNumber} · {p.customerName} {p.isDemo && <span className="ml-1 text-xs font-normal text-ink-400">(Demo)</span>}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {p.date} · {p.method.replace("_", " ")} {p.reference && `· ${p.reference}`}
                    {p.voided && " · voided"}
                  </p>
                </Link>
                <span className="shrink-0 text-sm font-semibold text-brand-700">{formatMoney(p.amountCents, currency)}</span>
                {!p.voided && (
                  <button className="btn-ghost btn-sm" onClick={() => voidAction.run(p.id)}>
                    Void
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
