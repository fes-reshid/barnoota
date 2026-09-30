import {
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { bizCollection, bizSubDoc, newLineItemId, withId } from "./common";
import { logAudit } from "./audit";
import { calculateLine, deriveInvoiceStatus, validatePaymentAmount, type DocumentTotals } from "../money";
import type { Business, BusinessSnapshot, Customer, CustomerSnapshot, Invoice, LineItem, Payment, PaymentMethod } from "../types";
import { EMPTY_ADDRESS } from "../types";

export function businessSnapshotFrom(b: Business): BusinessSnapshot {
  return {
    name: b.name,
    logoUrl: b.logoUrl,
    email: b.email,
    phone: b.phone,
    address: b.address,
    abn: b.abn,
    currency: b.currency,
    gstRegistered: b.gstRegistered,
    taxRatePercent: b.taxRatePercent,
    pricesIncludeTax: b.pricesIncludeTax,
    bank: b.bank,
  };
}

export function customerSnapshotFrom(c: Customer | null): CustomerSnapshot {
  if (!c) return { customerId: null, name: "", contactPerson: "", email: "", phone: "", billingAddress: { ...EMPTY_ADDRESS }, abn: "" };
  return {
    customerId: c.id,
    name: c.name,
    contactPerson: c.contactPerson,
    email: c.email,
    phone: c.phone,
    billingAddress: c.billingAddress,
    abn: c.abn,
  };
}

export interface RawLine {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountType: "percent" | "fixed";
  discountValue: number;
  taxTreatment: "taxable" | "exempt";
}

export function blankRawLine(): RawLine {
  return { id: newLineItemId(), productId: null, description: "", quantity: 1, unitPriceCents: 0, discountType: "percent", discountValue: 0, taxTreatment: "taxable" };
}

export function buildLineItems(rawLines: RawLine[], taxRatePercent: number, pricesIncludeTax: boolean): LineItem[] {
  return rawLines.map((raw) => {
    const calc = calculateLine(raw, taxRatePercent, pricesIncludeTax);
    return {
      id: raw.id,
      productId: raw.productId,
      description: raw.description,
      quantity: raw.quantity,
      unitPriceCents: raw.unitPriceCents,
      discountType: raw.discountType,
      discountValue: raw.discountValue,
      taxTreatment: raw.taxTreatment,
      subtotalExTaxCents: calc.subtotalExTaxCents,
      discountCents: calc.discountCents,
      taxCents: calc.taxCents,
      totalCents: calc.totalCents,
    };
  });
}

export function totalsFromLineItems(items: LineItem[]): DocumentTotals {
  return items.reduce(
    (acc, li) => ({
      subtotalCents: acc.subtotalCents + li.subtotalExTaxCents,
      discountTotalCents: acc.discountTotalCents + li.discountCents,
      taxTotalCents: acc.taxTotalCents + li.taxCents,
      totalCents: acc.totalCents + li.totalCents,
    }),
    { subtotalCents: 0, discountTotalCents: 0, taxTotalCents: 0, totalCents: 0 },
  );
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function blankInvoice(business: Business, customer: Customer | null, type: Invoice["type"] = "invoice"): Omit<Invoice, "id"> {
  const issueDate = todayIso();
  const lineItems = buildLineItems([blankRawLine()], business.taxRatePercent, business.pricesIncludeTax);
  const totals = totalsFromLineItems(lineItems);
  return {
    type,
    invoiceNumber: null,
    invoiceSeq: null,
    status: "draft",
    customerId: customer?.id ?? null,
    customer: customerSnapshotFrom(customer),
    business: businessSnapshotFrom(business),
    issueDate,
    dueDate: addDays(issueDate, business.defaultPaymentTermsDays),
    poNumber: "",
    lineItems,
    ...totals,
    amountPaidCents: 0,
    balanceDueCents: totals.totalCents,
    notes: business.defaultInvoiceNotes,
    paymentInstructions: business.defaultPaymentInstructions,
    voidReason: null,
    relatedInvoiceId: null,
    quoteId: null,
    isDemo: business.isDemo,
    createdBy: "",
  };
}

export async function createDraftInvoice(businessId: string, uid: string, data: Omit<Invoice, "id">): Promise<string> {
  const ref = doc(bizCollection(businessId, "invoices"));
  await setDoc(ref, { ...data, createdBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateDraftInvoice(businessId: string, invoiceId: string, patch: Partial<Invoice>) {
  await updateDoc(bizSubDoc(businessId, "invoices", invoiceId), { ...patch, updatedAt: serverTimestamp() });
}

export async function getInvoice(businessId: string, invoiceId: string): Promise<Invoice | null> {
  const snap = await getDoc(bizSubDoc(businessId, "invoices", invoiceId));
  return snap.exists() ? withId<Invoice>(snap) : null;
}

export function subscribeInvoice(businessId: string, invoiceId: string, cb: (inv: Invoice | null) => void) {
  return onSnapshot(bizSubDoc(businessId, "invoices", invoiceId), (snap) => cb(snap.exists() ? withId<Invoice>(snap) : null));
}

export function subscribeInvoices(businessId: string, cb: (invoices: Invoice[]) => void) {
  const q = query(bizCollection(businessId, "invoices"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<Invoice>(d))));
}

export function subscribeInvoicesForCustomer(businessId: string, customerId: string, cb: (invoices: Invoice[]) => void) {
  const q = query(bizCollection(businessId, "invoices"), where("customerId", "==", customerId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => withId<Invoice>(d))));
}

export async function issueInvoice(businessId: string, invoiceId: string, business: Business, uid: string, email: string): Promise<string> {
  const invoiceRef = bizSubDoc(businessId, "invoices", invoiceId);
  const counterName = "invoice";
  const counterRef = doc(db, "businesses", businessId, "counters", counterName);

  const invoiceNumber = await runTransaction(db, async (tx) => {
    const [invoiceSnap, counterSnap] = await Promise.all([tx.get(invoiceRef), tx.get(counterRef)]);
    if (!invoiceSnap.exists()) throw new Error("Invoice not found.");
    const invoice = withId<Invoice>(invoiceSnap);
    if (invoice.status !== "draft") throw new Error("Only draft invoices can be issued.");
    if (invoice.lineItems.length === 0) throw new Error("Add at least one line item before issuing.");

    const current = counterSnap.exists() ? ((counterSnap.data().seq as number) ?? 0) : 0;
    const seq = current + 1;
    const prefix = invoice.type === "credit_note" ? "CN-" : business.invoicePrefix;
    const number = `${prefix}${String(seq).padStart(4, "0")}`;

    if (counterSnap.exists()) tx.update(counterRef, { seq });
    else tx.set(counterRef, { seq });

    tx.update(invoiceRef, {
      status: "issued",
      invoiceNumber: number,
      invoiceSeq: seq,
      business: businessSnapshotFrom(business),
      issuedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return number;
  });

  await logAudit(businessId, {
    entityType: "invoice",
    entityId: invoiceId,
    action: "issued",
    summary: `Issued as ${invoiceNumber}`,
    performedBy: uid,
    performedByEmail: email,
  });

  return invoiceNumber;
}

export async function voidInvoice(businessId: string, invoiceId: string, reason: string, uid: string, email: string) {
  if (!reason.trim()) throw new Error("A reason is required to void an invoice.");
  const invoiceRef = bizSubDoc(businessId, "invoices", invoiceId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(invoiceRef);
    if (!snap.exists()) throw new Error("Invoice not found.");
    const invoice = withId<Invoice>(snap);
    if (invoice.status === "void") throw new Error("Invoice is already void.");
    if (invoice.status === "draft") throw new Error("Delete or discard a draft instead of voiding it.");
    tx.update(invoiceRef, { status: "void", voidReason: reason, voidedAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
  await logAudit(businessId, { entityType: "invoice", entityId: invoiceId, action: "voided", summary: `Voided: ${reason}`, performedBy: uid, performedByEmail: email });
}

export async function duplicateInvoice(businessId: string, uid: string, source: Invoice, business: Business): Promise<string> {
  const issueDate = todayIso();
  const lineItems = source.lineItems.map((li) => ({ ...li }));
  const totals = totalsFromLineItems(lineItems);
  const data: Omit<Invoice, "id"> = {
    type: "invoice",
    invoiceNumber: null,
    invoiceSeq: null,
    status: "draft",
    customerId: source.customerId,
    customer: source.customer,
    business: businessSnapshotFrom(business),
    issueDate,
    dueDate: addDays(issueDate, business.defaultPaymentTermsDays),
    poNumber: source.poNumber,
    lineItems,
    ...totals,
    amountPaidCents: 0,
    balanceDueCents: totals.totalCents,
    notes: source.notes,
    paymentInstructions: source.paymentInstructions,
    voidReason: null,
    relatedInvoiceId: null,
    quoteId: null,
    isDemo: source.isDemo,
    createdBy: uid,
  };
  return createDraftInvoice(businessId, uid, data);
}

/** Creates a draft credit note that mirrors an issued invoice's lines with negated amounts. */
export async function createCreditNote(businessId: string, uid: string, source: Invoice, business: Business): Promise<string> {
  if (source.status === "draft") throw new Error("Only issued invoices can be credited.");
  const negatedLines: LineItem[] = source.lineItems.map((li) => ({
    ...li,
    quantity: -li.quantity,
    subtotalExTaxCents: -li.subtotalExTaxCents,
    discountCents: -li.discountCents,
    taxCents: -li.taxCents,
    totalCents: -li.totalCents,
  }));
  const totals = totalsFromLineItems(negatedLines);
  const issueDate = todayIso();
  const data: Omit<Invoice, "id"> = {
    type: "credit_note",
    invoiceNumber: null,
    invoiceSeq: null,
    status: "draft",
    customerId: source.customerId,
    customer: source.customer,
    business: businessSnapshotFrom(business),
    issueDate,
    dueDate: issueDate,
    poNumber: source.poNumber,
    lineItems: negatedLines,
    ...totals,
    amountPaidCents: 0,
    balanceDueCents: totals.totalCents,
    notes: `Credit note for ${source.invoiceNumber ?? "invoice"}.`,
    paymentInstructions: "",
    voidReason: null,
    relatedInvoiceId: source.id,
    quoteId: null,
    isDemo: source.isDemo,
    createdBy: uid,
  };
  return createDraftInvoice(businessId, uid, data);
}

export interface PaymentInput {
  date: string;
  amountCents: number;
  method: PaymentMethod;
  reference: string;
  notes: string;
}

export async function recordPayment(businessId: string, invoiceId: string, uid: string, email: string, input: PaymentInput) {
  if (!input.date) throw new Error("A payment date is required.");
  const invoiceRef = bizSubDoc(businessId, "invoices", invoiceId);
  const paymentRef = doc(bizCollection(businessId, "payments"));

  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(invoiceRef);
    if (!snap.exists()) throw new Error("Invoice not found.");
    const invoice = withId<Invoice>(snap);
    if (invoice.status === "draft" || invoice.status === "void") {
      throw new Error("Cannot record a payment against a draft or void document.");
    }
    const validation = validatePaymentAmount(input.amountCents, invoice.totalCents, invoice.amountPaidCents);
    if (!validation.ok) throw new Error(validation.error);

    const newPaid = invoice.amountPaidCents + input.amountCents;
    const newBalance = Math.max(invoice.totalCents - newPaid, 0);
    const newStatus = deriveInvoiceStatus(invoice.status, invoice.totalCents, newPaid);

    tx.set(paymentRef, {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber ?? "",
      customerId: invoice.customerId,
      customerName: invoice.customer.name,
      date: input.date,
      amountCents: input.amountCents,
      method: input.method,
      reference: input.reference,
      notes: input.notes,
      voided: false,
      isDemo: invoice.isDemo,
      createdBy: uid,
      createdAt: serverTimestamp(),
    });
    tx.update(invoiceRef, { amountPaidCents: newPaid, balanceDueCents: newBalance, status: newStatus, updatedAt: serverTimestamp() });

    return { paymentId: paymentRef.id, newStatus, invoiceNumber: invoice.invoiceNumber ?? "" };
  });

  await logAudit(businessId, {
    entityType: "invoice",
    entityId: invoiceId,
    action: "payment_recorded",
    summary: `Payment recorded (${input.method}) for ${result.invoiceNumber}`,
    performedBy: uid,
    performedByEmail: email,
  });

  return result;
}

export async function voidPayment(businessId: string, paymentId: string, uid: string, email: string) {
  const paymentRef = bizSubDoc(businessId, "payments", paymentId);

  const invoiceId = await runTransaction(db, async (tx) => {
    const paymentSnap = await tx.get(paymentRef);
    if (!paymentSnap.exists()) throw new Error("Payment not found.");
    const payment = withId<Payment>(paymentSnap);
    if (payment.voided) throw new Error("Payment is already voided.");

    const invoiceRef = bizSubDoc(businessId, "invoices", payment.invoiceId);
    const invoiceSnap = await tx.get(invoiceRef);
    if (!invoiceSnap.exists()) throw new Error("Related invoice not found.");
    const invoice = withId<Invoice>(invoiceSnap);

    const newPaid = Math.max(invoice.amountPaidCents - payment.amountCents, 0);
    const newBalance = Math.max(invoice.totalCents - newPaid, 0);
    const restoredStatus = deriveInvoiceStatus(
      invoice.status === "paid" ? "issued" : invoice.status,
      invoice.totalCents,
      newPaid,
    );

    tx.update(paymentRef, { voided: true });
    tx.update(invoiceRef, { amountPaidCents: newPaid, balanceDueCents: newBalance, status: restoredStatus, updatedAt: serverTimestamp() });

    return payment.invoiceId;
  });

  await logAudit(businessId, {
    entityType: "invoice",
    entityId: invoiceId,
    action: "payment_voided",
    summary: "A payment was voided.",
    performedBy: uid,
    performedByEmail: email,
  });
}
