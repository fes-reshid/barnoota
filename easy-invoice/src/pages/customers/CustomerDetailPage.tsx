import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Plus } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { useCustomers, useInvoicesForCustomer, usePayments } from "../../lib/dataHooks";
import { formatMoney, displayStatus } from "../../lib/money";
import { useApp } from "../../app/AppProvider";
import { CustomerFormModal } from "./CustomerFormModal";

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { business } = useApp();
  const { data: customers, loading: customersLoading } = useCustomers();
  const { data: invoices, loading: invoicesLoading } = useInvoicesForCustomer(customerId);
  const { data: allPayments } = usePayments();
  const [editOpen, setEditOpen] = useState(false);

  const customer = customers.find((c) => c.id === customerId);
  const payments = useMemo(() => allPayments.filter((p) => p.customerId === customerId && !p.voided), [allPayments, customerId]);

  const outstanding = useMemo(
    () => invoices.filter((i) => i.status !== "draft" && i.status !== "void").reduce((sum, i) => sum + i.balanceDueCents, 0),
    [invoices],
  );

  if (customersLoading && !customer) return <FullPageSpinner />;
  if (!customer) {
    return (
      <div>
        <button className="btn-ghost mb-4" onClick={() => navigate("/customers")}>
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </button>
        <p className="text-sm text-ink-500">Customer not found.</p>
      </div>
    );
  }

  const currency = business?.currency ?? "AUD";

  return (
    <div>
      <Link to="/customers" className="btn-ghost mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      <PageHeader
        title={customer.name}
        description={customer.type === "business" ? "Business customer" : "Individual customer"}
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setEditOpen(true)}>
              Edit
            </button>
            <Link to={`/invoices/new?customerId=${customer.id}`} className="btn-primary">
              <Plus className="h-4 w-4" /> New invoice
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-3 p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-ink-900">Details</h3>
          {customer.contactPerson && <p className="text-sm text-ink-600">Contact: {customer.contactPerson}</p>}
          {customer.email && (
            <p className="flex items-center gap-2 text-sm text-ink-600">
              <Mail className="h-4 w-4 text-ink-400" /> {customer.email}
            </p>
          )}
          {customer.phone && (
            <p className="flex items-center gap-2 text-sm text-ink-600">
              <Phone className="h-4 w-4 text-ink-400" /> {customer.phone}
            </p>
          )}
          {customer.billingAddress.line1 && (
            <p className="flex items-start gap-2 text-sm text-ink-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <span>
                {customer.billingAddress.line1}
                {customer.billingAddress.line2 && <>, {customer.billingAddress.line2}</>}
                <br />
                {[customer.billingAddress.city, customer.billingAddress.state, customer.billingAddress.postcode].filter(Boolean).join(" ")}
              </span>
            </p>
          )}
          {customer.abn && <p className="text-sm text-ink-600">ABN: {customer.abn}</p>}
          {customer.notes && <p className="whitespace-pre-wrap text-sm text-ink-500">{customer.notes}</p>}

          <div className="border-t border-ink-100 pt-3">
            <p className="text-xs text-ink-400">Outstanding balance</p>
            <p className="text-xl font-semibold text-ink-900">{formatMoney(outstanding, currency)}</p>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink-900">Invoice history</h3>
            {invoicesLoading ? (
              <p className="text-sm text-ink-400">Loading...</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-ink-400">No invoices yet for this customer.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link to={`/invoices/${inv.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-800">{inv.invoiceNumber ?? "Draft"}</p>
                      <p className="text-xs text-ink-400">{inv.issueDate}</p>
                    </Link>
                    <span className="text-sm font-medium text-ink-700">{formatMoney(inv.totalCents, currency)}</span>
                    <StatusBadge status={displayStatus(inv.status, inv.dueDate, inv.balanceDueCents)} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink-900">Payment history</h3>
            {payments.length === 0 ? (
              <p className="text-sm text-ink-400">No payments recorded yet.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-ink-800">{p.invoiceNumber}</p>
                      <p className="text-xs text-ink-400">
                        {p.date} · {p.method.replace("_", " ")}
                      </p>
                    </div>
                    <span className="font-medium text-brand-700">{formatMoney(p.amountCents, currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <CustomerFormModal open={editOpen} onClose={() => setEditOpen(false)} customer={customer} />
    </div>
  );
}
