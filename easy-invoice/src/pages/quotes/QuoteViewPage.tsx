import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRightLeft, Check, Copy, Download, Printer, X } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { FullPageSpinner, Spinner } from "../../components/ui/Spinner";
import { DocumentPreview } from "../../components/documents/DocumentPreview";
import { downloadPdf, openPdfForPrint } from "../../lib/pdfLoader";
import { useApp } from "../../app/AppProvider";
import { useQuote } from "../../lib/dataHooks";
import { duplicateQuote, markQuoteAccepted, markQuoteDeclined, convertQuoteToInvoice } from "../../lib/repo/quotes";
import { useAsyncAction } from "../../lib/useAsyncAction";
import type { DocumentView } from "../../lib/docView";

export function QuoteViewPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { businessId, business, user } = useApp();
  const { data: quote, loading } = useQuote(quoteId);

  const previewDoc: DocumentView | null = quote
    ? {
        kind: "Quote",
        documentNumber: quote.quoteNumber ?? "DRAFT",
        statusLabel: quote.status,
        business: quote.business,
        customer: quote.customer,
        issueDate: quote.issueDate,
        secondDateLabel: "Expiry date",
        secondDate: quote.expiryDate,
        lineItems: quote.lineItems,
        subtotalCents: quote.subtotalCents,
        discountTotalCents: quote.discountTotalCents,
        taxTotalCents: quote.taxTotalCents,
        totalCents: quote.totalCents,
        notes: quote.notes,
        currency: quote.business.currency,
      }
    : null;

  const downloadAction = useAsyncAction(async () => {
    if (!previewDoc || !quote) return;
    await downloadPdf(previewDoc, `${quote.quoteNumber ?? "quote"}.pdf`);
  });

  const printAction = useAsyncAction(async () => {
    if (!previewDoc) return;
    await openPdfForPrint(previewDoc);
  });

  const duplicateAction = useAsyncAction(async () => {
    if (!businessId || !business || !user || !quote) return;
    const id = await duplicateQuote(businessId, user.uid, quote, business);
    navigate(`/quotes/${id}/edit`);
  });

  const acceptAction = useAsyncAction(async () => {
    if (!businessId || !user || !quote) return;
    await markQuoteAccepted(businessId, quote.id, user.uid, user.email ?? "");
  }, { successMessage: "Quote marked accepted." });

  const declineAction = useAsyncAction(async () => {
    if (!businessId || !user || !quote) return;
    await markQuoteDeclined(businessId, quote.id, user.uid, user.email ?? "");
  }, { successMessage: "Quote marked declined." });

  const convertAction = useAsyncAction(async () => {
    if (!businessId || !business || !user || !quote) return;
    const id = await convertQuoteToInvoice(businessId, user.uid, user.email ?? "", quote, business);
    navigate(`/invoices/${id}/edit`);
  }, { successMessage: "Converted to a draft invoice." });

  if (loading) return <FullPageSpinner />;
  if (!quote) {
    return (
      <div>
        <Link to="/quotes" className="btn-ghost mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to quotes
        </Link>
        <p className="text-sm text-ink-500">Quote not found.</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/quotes" className="btn-ghost mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to quotes
      </Link>
      <PageHeader title={quote.quoteNumber ?? "Draft quote"} description={quote.customer.name} action={<StatusBadge status={quote.status} />} />

      <div className="mb-6 flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={() => downloadAction.run()} disabled={downloadAction.pending}>
          {downloadAction.pending ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} Download PDF
        </button>
        <button className="btn-secondary" onClick={() => printAction.run()} disabled={printAction.pending}>
          {printAction.pending ? <Spinner className="h-4 w-4" /> : <Printer className="h-4 w-4" />} Print
        </button>
        <button className="btn-secondary" onClick={() => duplicateAction.run()} disabled={duplicateAction.pending}>
          {duplicateAction.pending ? <Spinner className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Duplicate
        </button>
        {quote.status === "sent" && (
          <>
            <button className="btn-secondary" onClick={() => acceptAction.run()} disabled={acceptAction.pending}>
              {acceptAction.pending ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />} Mark accepted
            </button>
            <button className="btn-secondary" onClick={() => declineAction.run()} disabled={declineAction.pending}>
              {declineAction.pending ? <Spinner className="h-4 w-4" /> : <X className="h-4 w-4" />} Mark declined
            </button>
          </>
        )}
        {quote.status === "accepted" && !quote.convertedInvoiceId && (
          <button className="btn-primary" onClick={() => convertAction.run()} disabled={convertAction.pending}>
            {convertAction.pending ? <Spinner className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />} Convert to invoice
          </button>
        )}
        {quote.convertedInvoiceId && (
          <Link to={`/invoices/${quote.convertedInvoiceId}`} className="btn-secondary">
            View resulting invoice
          </Link>
        )}
      </div>

      {previewDoc && <DocumentPreview doc={previewDoc} />}
    </div>
  );
}
