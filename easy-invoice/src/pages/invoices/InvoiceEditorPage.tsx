import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Send } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { FullPageSpinner, Spinner } from "../../components/ui/Spinner";
import { LineItemsEditor } from "../../components/documents/LineItemsEditor";
import { DocumentPreview } from "../../components/documents/DocumentPreview";
import { useApp } from "../../app/AppProvider";
import { useCustomers, useInvoice, useProducts } from "../../lib/dataHooks";
import { calculateDocumentTotals, formatMoney } from "../../lib/money";
import {
  blankRawLine,
  buildLineItems,
  customerSnapshotFrom,
  businessSnapshotFrom,
  createDraftInvoice,
  updateDraftInvoice,
  issueInvoice,
  type RawLine,
} from "../../lib/repo/invoices";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { CustomerFormModal } from "../customers/CustomerFormModal";
import type { DocumentView } from "../../lib/docView";

function rawLinesFromInvoice(lineItems: RawLine[] | undefined): RawLine[] {
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

export function InvoiceEditorPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { businessId, business, user } = useApp();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const { data: existingInvoice, loading: invoiceLoading } = useInvoice(invoiceId);

  const isEditing = Boolean(invoiceId);
  const [savedId, setSavedId] = useState<string | null>(invoiceId ?? null);
  const [customerId, setCustomerId] = useState<string | null>(searchParams.get("customerId"));
  const [rawLines, setRawLines] = useState<RawLine[]>([blankRawLine()]);
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (!business || initialised) return;
    if (!isEditing) {
      const today = new Date();
      const due = new Date();
      due.setDate(due.getDate() + business.defaultPaymentTermsDays);
      setIssueDate(today.toISOString().slice(0, 10));
      setDueDate(due.toISOString().slice(0, 10));
      setNotes(business.defaultInvoiceNotes);
      setPaymentInstructions(business.defaultPaymentInstructions);
      setInitialised(true);
    }
  }, [business, initialised, isEditing]);

  useEffect(() => {
    if (isEditing && existingInvoice) {
      setCustomerId(existingInvoice.customerId);
      setRawLines(rawLinesFromInvoice(existingInvoice.lineItems));
      setIssueDate(existingInvoice.issueDate);
      setDueDate(existingInvoice.dueDate);
      setPoNumber(existingInvoice.poNumber);
      setNotes(existingInvoice.notes);
      setPaymentInstructions(existingInvoice.paymentInstructions);
      setSavedId(existingInvoice.id);
      setInitialised(true);
    }
  }, [isEditing, existingInvoice]);

  const customer = customers.find((c) => c.id === customerId) ?? null;

  const lineItems = useMemo(
    () => (business ? buildLineItems(rawLines, business.taxRatePercent, business.pricesIncludeTax) : []),
    [rawLines, business],
  );
  const totals = useMemo(
    () => (business ? calculateDocumentTotals(rawLines, business.taxRatePercent, business.pricesIncludeTax) : { subtotalCents: 0, discountTotalCents: 0, taxTotalCents: 0, totalCents: 0 }),
    [rawLines, business],
  );

  const previewDoc: DocumentView | null = business
    ? {
        kind: "Invoice",
        documentNumber: existingInvoice?.invoiceNumber ?? "DRAFT",
        statusLabel: existingInvoice?.status === "issued" ? "Issued" : "Draft",
        business: businessSnapshotFrom(business),
        customer: customerSnapshotFrom(customer),
        issueDate,
        secondDateLabel: "Due date",
        secondDate: dueDate,
        poNumber,
        lineItems,
        ...totals,
        amountPaidCents: existingInvoice?.amountPaidCents ?? 0,
        balanceDueCents: existingInvoice ? existingInvoice.balanceDueCents : totals.totalCents,
        notes,
        paymentInstructions,
        currency: business.currency,
      }
    : null;

  // Returns the persisted draft's id directly, rather than relying on the
  // `savedId` component state, which — even after this write resolves —
  // isn't visible yet to code in the same event handler that awaits it.
  const persistDraft = async (): Promise<string> => {
    if (!businessId || !business || !user) throw new Error("Not ready yet.");
    const payload = {
      type: "invoice" as const,
      invoiceNumber: existingInvoice?.invoiceNumber ?? null,
      invoiceSeq: existingInvoice?.invoiceSeq ?? null,
      status: "draft" as const,
      customerId,
      customer: customerSnapshotFrom(customer),
      business: businessSnapshotFrom(business),
      issueDate,
      dueDate,
      poNumber,
      lineItems,
      ...totals,
      amountPaidCents: 0,
      balanceDueCents: totals.totalCents,
      notes,
      paymentInstructions,
      voidReason: null,
      relatedInvoiceId: existingInvoice?.relatedInvoiceId ?? null,
      quoteId: existingInvoice?.quoteId ?? null,
      isDemo: business.isDemo,
      createdBy: user.uid,
    };
    if (savedId) {
      await updateDraftInvoice(businessId, savedId, payload);
      return savedId;
    }
    const id = await createDraftInvoice(businessId, user.uid, payload);
    setSavedId(id);
    navigate(`/invoices/${id}/edit`, { replace: true });
    return id;
  };

  const saveDraft = useAsyncAction(
    async () => {
      await persistDraft();
    },
    { successMessage: "Draft saved." },
  );

  const issueAction = useAsyncAction(
    async () => {
      if (!businessId || !business || !user) throw new Error("Not ready yet.");
      if (!customerId) throw new Error("Select a customer before issuing.");
      if (!issueDate || !dueDate) throw new Error("Set an issue date and due date before issuing.");
      if (lineItems.length === 0 || lineItems.every((l) => !l.description.trim())) throw new Error("Add at least one line item.");
      const idToIssue = await persistDraft();
      await issueInvoice(businessId, idToIssue, business, user.uid, user.email ?? "");
      navigate(`/invoices/${idToIssue}`, { replace: true });
    },
    { successMessage: "Invoice issued." },
  );

  if (isEditing && invoiceLoading) return <FullPageSpinner />;
  if (isEditing && existingInvoice && existingInvoice.status !== "draft") {
    return (
      <div>
        <p className="text-sm text-ink-500">This invoice has already been issued and can no longer be edited.</p>
        <Link to={`/invoices/${existingInvoice.id}`} className="btn-primary mt-4 inline-flex">
          View invoice
        </Link>
      </div>
    );
  }
  if (!business) return <FullPageSpinner />;

  return (
    <div>
      <Link to="/invoices" className="btn-ghost mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to invoices
      </Link>
      <PageHeader title={isEditing ? "Edit draft invoice" : "New invoice"} description="Changes autosave to a draft — nothing is sent until you issue it." />

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
                <label className="field-label">Due date</label>
                <input type="date" className="field-input" value={dueDate} min={issueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="field-label">PO / reference number</label>
              <input className="field-input" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
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
            <div>
              <label className="field-label">Payment instructions</label>
              <textarea className="field-input" rows={2} value={paymentInstructions} onChange={(e) => setPaymentInstructions(e.target.value)} />
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
            <button className="btn-primary" onClick={() => issueAction.run()} disabled={issueAction.pending}>
              {issueAction.pending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              Issue invoice
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
