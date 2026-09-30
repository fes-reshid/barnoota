import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, CreditCard, Download, FileMinus2, Mail, Printer, Wallet, Ban, History } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { FullPageSpinner, Spinner } from "../../components/ui/Spinner";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DocumentPreview } from "../../components/documents/DocumentPreview";
import { downloadPdf, openPdfForPrint } from "../../lib/pdfLoader";
import { SendEmailModal } from "../../components/documents/SendEmailModal";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { useApp } from "../../app/AppProvider";
import { useAuditForEntity, usePayments } from "../../lib/dataHooks";
import { useInvoice } from "../../lib/dataHooks";
import { displayStatus, formatMoney } from "../../lib/money";
import { duplicateInvoice, voidInvoice, createCreditNote } from "../../lib/repo/invoices";
import { voidPayment } from "../../lib/repo/invoices";
import { useAsyncAction } from "../../lib/useAsyncAction";
import type { DocumentView } from "../../lib/docView";

export function InvoiceViewPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { businessId, business, user } = useApp();
  const { data: invoice, loading } = useInvoice(invoiceId);
  const { data: allPayments } = usePayments();
  const { data: auditEntries } = useAuditForEntity(invoiceId);

  const [voidOpen, setVoidOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const payments = useMemo(() => allPayments.filter((p) => p.invoiceId === invoiceId), [allPayments, invoiceId]);

  const previewDoc: DocumentView | null = invoice
    ? {
        kind: invoice.type === "credit_note" ? "Credit Note" : "Invoice",
        documentNumber: invoice.invoiceNumber ?? "DRAFT",
        statusLabel: displayStatus(invoice.status, invoice.dueDate, invoice.balanceDueCents).replace("_", " "),
        business: invoice.business,
        customer: invoice.customer,
        issueDate: invoice.issueDate,
        secondDateLabel: "Due date",
        secondDate: invoice.dueDate,
        poNumber: invoice.poNumber,
        lineItems: invoice.lineItems,
        subtotalCents: invoice.subtotalCents,
        discountTotalCents: invoice.discountTotalCents,
        taxTotalCents: invoice.taxTotalCents,
        totalCents: invoice.totalCents,
        amountPaidCents: invoice.amountPaidCents,
        balanceDueCents: invoice.balanceDueCents,
        notes: invoice.notes,
        paymentInstructions: invoice.paymentInstructions,
        currency: invoice.business.currency,
      }
    : null;

  const downloadAction = useAsyncAction(async () => {
    if (!previewDoc || !invoice) return;
    await downloadPdf(previewDoc, `${invoice.invoiceNumber ?? "invoice"}.pdf`);
  });

  const printAction = useAsyncAction(async () => {
    if (!previewDoc) return;
    await openPdfForPrint(previewDoc);
  });

  const duplicateAction = useAsyncAction(async () => {
    if (!businessId || !business || !user || !invoice) return;
    const id = await duplicateInvoice(businessId, user.uid, invoice, business);
    navigate(`/invoices/${id}/edit`);
  });

  const voidAction = useAsyncAction(
    async (reason?: string) => {
      if (!businessId || !user || !invoice || !reason) return;
      await voidInvoice(businessId, invoice.id, reason, user.uid, user.email ?? "");
      setVoidOpen(false);
    },
    { successMessage: "Invoice voided." },
  );

  const creditNoteAction = useAsyncAction(async () => {
    if (!businessId || !business || !user || !invoice) return;
    const id = await createCreditNote(businessId, user.uid, invoice, business);
    navigate(`/invoices/${id}/edit`);
  });

  const voidPaymentAction = useAsyncAction(async (paymentId: string) => {
    if (!businessId || !user) return;
    await voidPayment(businessId, paymentId, user.uid, user.email ?? "");
  });

  if (loading) return <FullPageSpinner />;
  if (!invoice) {
    return (
      <div>
        <Link to="/invoices" className="btn-ghost mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </Link>
        <p className="text-sm text-ink-500">Invoice not found.</p>
      </div>
    );
  }

  const status = displayStatus(invoice.status, invoice.dueDate, invoice.balanceDueCents);
  const currency = invoice.business.currency;

  return (
    <div>
      <Link to="/invoices" className="btn-ghost mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to invoices
      </Link>

      <PageHeader
        title={invoice.invoiceNumber ?? "Draft invoice"}
        description={invoice.customer.name}
        action={<StatusBadge status={status} />}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={() => downloadAction.run()} disabled={downloadAction.pending}>
          {downloadAction.pending ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Download PDF
        </button>
        <button className="btn-secondary" onClick={() => printAction.run()} disabled={printAction.pending}>
          {printAction.pending ? <Spinner className="h-4 w-4" /> : <Printer className="h-4 w-4" />} Print
        </button>
        <button className="btn-secondary" onClick={() => setEmailOpen(true)}>
          <Mail className="h-4 w-4" /> Send by email
        </button>
        <button className="btn-secondary" onClick={() => duplicateAction.run()} disabled={duplicateAction.pending}>
          {duplicateAction.pending ? <Spinner className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Duplicate
        </button>
        {invoice.status !== "draft" && invoice.status !== "void" && invoice.balanceDueCents > 0 && (
          <button className="btn-primary" onClick={() => setPaymentOpen(true)}>
            <Wallet className="h-4 w-4" /> Record payment
          </button>
        )}
        {business?.stripePaymentLinkUrl && invoice.balanceDueCents > 0 && (
          <a className="btn-secondary" href={business.stripePaymentLinkUrl} target="_blank" rel="noreferrer">
            <CreditCard className="h-4 w-4" /> Pay online
          </a>
        )}
        {invoice.type === "invoice" && invoice.status !== "draft" && invoice.status !== "void" && (
          <button className="btn-secondary" onClick={() => creditNoteAction.run()} disabled={creditNoteAction.pending}>
            {creditNoteAction.pending ? <Spinner className="h-4 w-4" /> : <FileMinus2 className="h-4 w-4" />} Create credit note
          </button>
        )}
        <button className="btn-ghost" onClick={() => setHistoryOpen((v) => !v)}>
          <History className="h-4 w-4" /> Audit history
        </button>
        {invoice.status !== "draft" && invoice.status !== "void" && (
          <button className="btn-danger ml-auto" onClick={() => setVoidOpen(true)}>
            <Ban className="h-4 w-4" /> Void
          </button>
        )}
      </div>

      {invoice.status === "void" && invoice.voidReason && (
        <div className="mb-6 rounded-lg bg-ink-100 p-4 text-sm text-ink-600">
          <span className="font-medium">Voided:</span> {invoice.voidReason}
        </div>
      )}

      {historyOpen && (
        <div className="card mb-6 p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-900">Audit history</h3>
          {auditEntries.length === 0 ? (
            <p className="text-sm text-ink-400">No history yet.</p>
          ) : (
            <ul className="space-y-2">
              {auditEntries.map((e) => (
                <li key={e.id} className="text-sm text-ink-600">
                  <span className="font-medium text-ink-800">{e.summary}</span> — {e.performedByEmail}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">{previewDoc && <DocumentPreview doc={previewDoc} />}</div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink-900">Payment history</h3>
            {payments.length === 0 ? (
              <p className="text-sm text-ink-400">No payments recorded.</p>
            ) : (
              <ul className="space-y-2.5">
                {payments.map((p) => (
                  <li key={p.id} className={`flex items-center justify-between gap-2 text-sm ${p.voided ? "opacity-50" : ""}`}>
                    <div>
                      <p className="font-medium text-ink-800">{formatMoney(p.amountCents, currency)}</p>
                      <p className="text-xs text-ink-400">
                        {p.date} · {p.method.replace("_", " ")}
                        {p.voided && " · voided"}
                      </p>
                    </div>
                    {!p.voided && (
                      <button className="btn-ghost btn-sm" onClick={() => voidPaymentAction.run(p.id)}>
                        Void
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <RecordPaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} invoice={invoice} />
      <SendEmailModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        defaultTo={invoice.customer.email}
        defaultSubject={`${invoice.business.name} — ${invoice.invoiceNumber ?? "Invoice"}`}
        defaultBody={`Hi ${invoice.customer.contactPerson || invoice.customer.name},\n\nPlease find attached invoice ${invoice.invoiceNumber ?? ""} for ${formatMoney(invoice.totalCents, currency)}, due ${invoice.dueDate}.\n\n${invoice.paymentInstructions || ""}\n\nThanks,\n${invoice.business.name}`}
      />
      <ConfirmDialog
        open={voidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={(reason) => voidAction.run(reason)}
        title="Void this invoice"
        description="Voiding marks this invoice as cancelled. It stays on record for your audit history but no longer counts toward outstanding balances."
        confirmLabel="Void invoice"
        danger
        requireReason
        reasonLabel="Reason for voiding"
      />
    </div>
  );
}
