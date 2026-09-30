import { doc, getDoc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { bizCollection, bizSubDoc, withId } from "./common";
import { logAudit } from "./audit";
import { blankRawLine, buildLineItems, businessSnapshotFrom, createDraftInvoice, customerSnapshotFrom, todayIso, totalsFromLineItems, type RawLine } from "./invoices";
import type { Business, Customer, Invoice, Quote } from "../types";

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function blankQuote(business: Business, customer: Customer | null): Omit<Quote, "id"> {
  const issueDate = todayIso();
  const lineItems = buildLineItems([blankRawLine()], business.taxRatePercent, business.pricesIncludeTax);
  const totals = totalsFromLineItems(lineItems);
  return {
    quoteNumber: null,
    quoteSeq: null,
    status: "draft",
    customerId: customer?.id ?? null,
    customer: customerSnapshotFrom(customer),
    business: businessSnapshotFrom(business),
    issueDate,
    expiryDate: addDays(issueDate, 30),
    lineItems,
    ...totals,
    notes: business.defaultInvoiceNotes,
    convertedInvoiceId: null,
    isDemo: business.isDemo,
    createdBy: "",
  };
}

export async function createDraftQuote(businessId: string, uid: string, data: Omit<Quote, "id">): Promise<string> {
  const ref = doc(bizCollection(businessId, "quotes"));
  await setDoc(ref, { ...data, createdBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateDraftQuote(businessId: string, quoteId: string, patch: Partial<Quote>) {
  await updateDoc(bizSubDoc(businessId, "quotes", quoteId), { ...patch, updatedAt: serverTimestamp() });
}

export async function getQuote(businessId: string, quoteId: string): Promise<Quote | null> {
  const snap = await getDoc(bizSubDoc(businessId, "quotes", quoteId));
  return snap.exists() ? withId<Quote>(snap) : null;
}

export function subscribeQuote(businessId: string, quoteId: string, cb: (q: Quote | null) => void) {
  return onSnapshot(bizSubDoc(businessId, "quotes", quoteId), (snap) => cb(snap.exists() ? withId<Quote>(snap) : null));
}

export function subscribeQuotes(businessId: string, cb: (quotes: Quote[]) => void) {
  const q = query(bizCollection(businessId, "quotes"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<Quote>(d))));
}

export async function sendQuote(businessId: string, quoteId: string, business: Business, uid: string, email: string): Promise<string> {
  const quoteRef = bizSubDoc(businessId, "quotes", quoteId);
  const counterRef = doc(db, "businesses", businessId, "counters", "quote");

  const quoteNumber = await runTransaction(db, async (tx) => {
    const [quoteSnap, counterSnap] = await Promise.all([tx.get(quoteRef), tx.get(counterRef)]);
    if (!quoteSnap.exists()) throw new Error("Quote not found.");
    const quote = withId<Quote>(quoteSnap);
    if (quote.status !== "draft") throw new Error("Only draft quotes can be sent.");
    if (quote.lineItems.length === 0) throw new Error("Add at least one line item before sending.");

    const current = counterSnap.exists() ? ((counterSnap.data().seq as number) ?? 0) : 0;
    const seq = current + 1;
    const number = `${business.quotePrefix}${String(seq).padStart(4, "0")}`;

    if (counterSnap.exists()) tx.update(counterRef, { seq });
    else tx.set(counterRef, { seq });

    tx.update(quoteRef, {
      status: "sent",
      quoteNumber: number,
      quoteSeq: seq,
      business: businessSnapshotFrom(business),
      updatedAt: serverTimestamp(),
    });

    return number;
  });

  await logAudit(businessId, { entityType: "quote", entityId: quoteId, action: "sent", summary: `Sent as ${quoteNumber}`, performedBy: uid, performedByEmail: email });
  return quoteNumber;
}

export async function markQuoteAccepted(businessId: string, quoteId: string, uid: string, email: string) {
  await updateDoc(bizSubDoc(businessId, "quotes", quoteId), { status: "accepted", updatedAt: serverTimestamp() });
  await logAudit(businessId, { entityType: "quote", entityId: quoteId, action: "accepted", summary: "Marked accepted", performedBy: uid, performedByEmail: email });
}

export async function markQuoteDeclined(businessId: string, quoteId: string, uid: string, email: string) {
  await updateDoc(bizSubDoc(businessId, "quotes", quoteId), { status: "declined", updatedAt: serverTimestamp() });
  await logAudit(businessId, { entityType: "quote", entityId: quoteId, action: "declined", summary: "Marked declined", performedBy: uid, performedByEmail: email });
}

export async function duplicateQuote(businessId: string, uid: string, source: Quote, business: Business): Promise<string> {
  const issueDate = todayIso();
  const lineItems = source.lineItems.map((li) => ({ ...li }));
  const totals = totalsFromLineItems(lineItems);
  const data: Omit<Quote, "id"> = {
    quoteNumber: null,
    quoteSeq: null,
    status: "draft",
    customerId: source.customerId,
    customer: source.customer,
    business: businessSnapshotFrom(business),
    issueDate,
    expiryDate: addDays(issueDate, 30),
    lineItems,
    ...totals,
    notes: source.notes,
    convertedInvoiceId: null,
    isDemo: source.isDemo,
    createdBy: uid,
  };
  return createDraftQuote(businessId, uid, data);
}

export async function convertQuoteToInvoice(businessId: string, uid: string, email: string, quote: Quote, business: Business): Promise<string> {
  if (quote.status !== "accepted") throw new Error("Only an accepted quote can be converted to an invoice.");
  if (quote.convertedInvoiceId) throw new Error("This quote has already been converted.");

  const issueDate = todayIso();
  const lineItems = quote.lineItems.map((li) => ({ ...li }));
  const totals = totalsFromLineItems(lineItems);
  const invoiceData: Omit<Invoice, "id"> = {
    type: "invoice",
    invoiceNumber: null,
    invoiceSeq: null,
    status: "draft",
    customerId: quote.customerId,
    customer: quote.customer,
    business: businessSnapshotFrom(business),
    issueDate,
    dueDate: addDays(issueDate, business.defaultPaymentTermsDays),
    poNumber: "",
    lineItems,
    ...totals,
    amountPaidCents: 0,
    balanceDueCents: totals.totalCents,
    notes: quote.notes,
    paymentInstructions: business.defaultPaymentInstructions,
    voidReason: null,
    relatedInvoiceId: null,
    quoteId: quote.id,
    isDemo: quote.isDemo,
    createdBy: uid,
  };
  const invoiceId = await createDraftInvoice(businessId, uid, invoiceData);

  await updateDoc(bizSubDoc(businessId, "quotes", quote.id), { status: "converted", convertedInvoiceId: invoiceId, updatedAt: serverTimestamp() });
  await logAudit(businessId, { entityType: "quote", entityId: quote.id, action: "converted", summary: `Converted to draft invoice`, performedBy: uid, performedByEmail: email });

  return invoiceId;
}

export type { RawLine };
