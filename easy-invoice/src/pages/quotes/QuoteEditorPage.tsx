import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Send } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { FullPageSpinner, Spinner } from "../../components/ui/Spinner";
import { LineItemsEditor } from "../../components/documents/LineItemsEditor";
import { DocumentPreview } from "../../components/documents/DocumentPreview";
import { useApp } from "../../app/AppProvider";
import { useCustomers, useProducts, useQuote } from "../../lib/dataHooks";
import { calculateDocumentTotals, formatMoney } from "../../lib/money";
import { blankRawLine, customerSnapshotFrom, businessSnapshotFrom, buildLineItems, type RawLine } from "../../lib/repo/invoices";
import { createDraftQuote, updateDraftQuote, sendQuote } from "../../lib/repo/quotes";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { CustomerFormModal } from "../customers/CustomerFormModal";
import type { DocumentView } from "../../lib/docView";

function rawLinesFromQuote(lineItems: RawLine[] | undefined): RawLine[] {
  if (!lineItems || lineItems.length === 0) return [blankRawLine()];
  return lineItems.map((li) => ({
    id: li.id,
    productId: li.productId,
    description: li.description,
    quantity: li.quantity,
    unitPriceCents: li.unitPriceCents,
    discountType: li.discountType,
    discountValue: li.discountValue,
    taxTreatment: li.taxTreatment,
  }));
}

export function QuoteEditorPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { businessId, business, user } = useApp();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const { data: existingQuote, loading: quoteLoading } = useQuote(quoteId);

  const isEditing = Boolean(quoteId);
  const [savedId, setSavedId] = useState<string | null>(quoteId ?? null);
  const [customerId, setCustomerId] = useState<string | null>(searchParams.get("customerId"));
  const [rawLines, setRawLines] = useState<RawLine[]>([blankRawLine()]);
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (!business || initialised) return;
    if (!isEditing) {
      const today = new Date();
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      setIssueDate(today.toISOString().slice(0, 10));
      setExpiryDate(expiry.toISOString().slice(0, 10));
      setNotes(business.defaultInvoiceNotes);
      setInitialised(true);
    }
  }, [business, initialised, isEditing]);

  useEffect(() => {
    if (isEditing && existingQuote) {
      setCustomerId(existingQuote.customerId);
      setRawLines(rawLinesFromQuote(existingQuote.lineItems));
      setIssueDate(existingQuote.issueDate);
      setExpiryDate(existingQuote.expiryDate);
      setNotes(existingQuote.notes);
      setSavedId(existingQuote.id);
      setInitialised(true);
    }
  }, [isEditing, existingQuote]);

  const customer = customers.find((c) => c.id === customerId) ?? null;
  const lineItems = useMemo(() => (business ? buildLineItems(rawLines, business.taxRatePercent, business.pricesIncludeTax) : []), [rawLines, business]);
  const totals = useMemo(
    () => (business ? calculateDocumentTotals(rawLines, business.taxRatePercent, business.pricesIncludeTax) : { subtotalCents: 0, discountTotalCents: 0, taxTotalCents: 0, totalCents: 0 }),
    [rawLines, business],
  );

  const previewDoc: DocumentView | null = business
    ? {
        kind: "Quote",
        documentNumber: existingQuote?.quoteNumber ?? "DRAFT",
        statusLabel: existingQuote?.status ?? "Draft",
        business: businessSnapshotFrom(business),
        customer: customerSnapshotFrom(customer),
        issueDate,
        secondDateLabel: "Expiry date",
        secondDate: expiryDate,
        lineItems,
        ...totals,
        notes,
        currency: business.currency,
      }
    : null;

  // Returns the persisted draft's id directly — see the identical comment
  // in InvoiceEditorPage.tsx for why reading `savedId` state right after an
  // await in the same handler doesn't work.
  const persistDraft = async (): Promise<string> => {
    if (!businessId || !business || !user) throw new Error("Not ready yet.");
    const payload = {
      quoteNumber: existingQuote?.quoteNumber ?? null,
      quoteSeq: existingQuote?.quoteSeq ?? null,
      status: "draft" as const,
      customerId,
      customer: customerSnapshotFrom(customer),
      business: businessSnapshotFrom(business),
      issueDate,
      expiryDate,
      lineItems,
      ...totals,
      notes,
      convertedInvoiceId: existingQuote?.convertedInvoiceId ?? null,
      isDemo: business.isDemo,
      createdBy: user.uid,
    };
    if (savedId) {
      await updateDraftQuote(businessId, savedId, payload);
      return savedId;
    }
    const id = await createDraftQuote(businessId, user.uid, payload);
    setSavedId(id);
    navigate(`/quotes/${id}/edit`, { replace: true });
    return id;
  };

  const saveDraft = useAsyncAction(
    async () => {
      await persistDraft();
    },
    { successMessage: "Draft saved." },
  );

  const sendAction = useAsyncAction(async () => {
    if (!businessId || !business || !user) throw new Error("Not ready yet.");
    if (!customerId) throw new Error("Select a customer before sending.");
    if (!issueDate || !expiryDate) throw new Error("Set an issue date and expiry date before sending.");
    const idToSend = await persistDraft();
    await sendQuote(businessId, idToSend, business, user.uid, user.email ?? "");
    navigate(`/quotes/${idToSend}`, { replace: true });
  }, { successMessage: "Quote sent." });

  if (isEditing && quoteLoading) return <FullPageSpinner />;
  if (isEditing && existingQuote && existingQuote.status !== "draft") {
    return (
      <div>
        <p className="text-sm text-ink-500">This quote has already been sent and can no longer be edited.</p>
        <Link to={`/quotes/${existingQuote.id}`} className="btn-primary mt-4 inline-flex">
          View quote
        </Link>
      </div>
    );
  }
  if (!business) return <FullPageSpinner />;

  return (
    <div>
      <Link to="/quotes" className="btn-ghost mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to quotes
      </Link>
      <PageHeader title={isEditing ? "Edit draft quote" : "New quote"} description="Changes autosave to a draft — nothing is sent until you send it." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card space-y-4 p-5">
            <div>
              <label className="field-label">Customer</label>
              <div className="flex gap-2">
                <select className="field-input" value={customerId ?? ""} onChange={(e) => setCustomerId(e.target.value || null)}>
                  <option value="">Select a customer...</option>
                  {customers
                    .filter((c) => !c.archived)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <button type="button" className="btn-secondary shrink-0" onClick={() => setCustomerModalOpen(true)}>
                  <Plus className="h-4 w-4" /> New
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Issue date</label>
                <input type="date" className="field-input" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Expiry date</label>
                <input type="date" className="field-input" value={expiryDate} min={issueDate} onChange={(e) => setExpiryDate(e.target.value)} required />
              </div>
            </div>
          </div>

          <LineItemsEditor
            lines={rawLines}
            onChange={setRawLines}
            products={products}
            taxRatePercent={business.taxRatePercent}
            pricesIncludeTax={business.pricesIncludeTax}
            gstRegistered={business.gstRegistered}
            currency={business.currency}
          />

          <div className="card space-y-4 p-5">
            <div>
              <label className="field-label">Notes</label>
              <textarea className="field-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="card p-5">
            <div className="flex justify-between text-sm text-ink-600">
              <span>Subtotal</span>
              <span>{formatMoney(totals.subtotalCents, business.currency)}</span>
            </div>
            {totals.discountTotalCents > 0 && (
              <div className="flex justify-between text-sm text-ink-600">
                <span>Discount</span>
                <span>-{formatMoney(totals.discountTotalCents, business.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-ink-600">
              <span>{business.gstRegistered ? "GST" : "Tax"}</span>
              <span>{formatMoney(totals.taxTotalCents, business.currency)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-ink-200 pt-2 text-base font-semibold text-ink-900">
              <span>Total</span>
              <span>{formatMoney(totals.totalCents, business.currency)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => saveDraft.run()} disabled={saveDraft.pending}>
              {saveDraft.pending && <Spinner className="h-4 w-4" />}
              Save draft
            </button>
            <button className="btn-primary" onClick={() => sendAction.run()} disabled={sendAction.pending}>
              {sendAction.pending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              Send quote
            </button>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-6">{previewDoc && <DocumentPreview doc={previewDoc} />}</div>
        </div>
      </div>

      <CustomerFormModal open={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onSaved={(id) => setCustomerId(id)} />
    </div>
  );
}
