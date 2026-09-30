/**
 * Demo-mode implementations of every repo function that normally talks to
 * Firestore. Each one matches the real function's signature exactly (see
 * src/lib/repo/*.ts, which import and dispatch to these when isDemoMode is
 * true), and reuses the same pure calculation helpers (money.ts,
 * businessSnapshotFrom, buildLineItems, etc.) so the numbers behave
 * identically — only persistence differs.
 */
import {
  addDoc as dbAdd,
  clearBusiness,
  getDocById,
  listCollection,
  newId,
  nextCounter,
  nowIso,
  subscribeCollection,
  subscribeDoc,
  updateDoc as dbUpdate,
} from "./store";
import { deriveInvoiceStatus, validatePaymentAmount } from "../money";
import { EMPTY_ADDRESS } from "../types";
import type {
  AuditAction,
  AuditEntry,
  Business,
  Customer,
  Invoice,
  Payment,
  PaymentMethod,
  Product,
  Quote,
} from "../types";

export const DEMO_BUSINESS_ID = "demo-business";
export const DEMO_USER_UID = "demo-user";
export const DEMO_USER_EMAIL = "you@example.com";

// ---------------------------------------------------------------- business

export function demoDefaultBusiness(): Business {
  return {
    id: DEMO_BUSINESS_ID,
    name: "Demo Easy Invoice Co",
    logoUrl: null,
    email: DEMO_USER_EMAIL,
    phone: "(02) 5550 1000",
    address: { ...EMPTY_ADDRESS, line1: "1 Example Street", city: "Sydney", state: "NSW", postcode: "2000" },
    abn: "12 345 678 901",
    currency: "AUD",
    gstRegistered: true,
    taxRatePercent: 10,
    pricesIncludeTax: true,
    invoicePrefix: "INV-",
    quotePrefix: "QUO-",
    defaultPaymentTermsDays: 14,
    bank: { bankName: "Demo Bank", accountName: "Demo Easy Invoice Co", bsb: "062-000", accountNumber: "12345678" },
    defaultInvoiceNotes: "Thank you for your business!",
    defaultPaymentInstructions: "Please pay by bank transfer using the details below.",
    members: { [DEMO_USER_UID]: "owner" },
    isDemo: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function demoEnsureBusiness(): Business {
  const existing = getDocById<Business>(DEMO_BUSINESS_ID, "business", DEMO_BUSINESS_ID);
  if (existing) return existing;
  const biz = demoDefaultBusiness();
  dbAdd(DEMO_BUSINESS_ID, "business", biz, DEMO_BUSINESS_ID);
  return biz;
}

export function demoGetBusiness(): Business | null {
  return getDocById<Business>(DEMO_BUSINESS_ID, "business", DEMO_BUSINESS_ID);
}

export function demoSubscribeBusiness(cb: (b: Business | null) => void) {
  return subscribeDoc<Business>(DEMO_BUSINESS_ID, "business", DEMO_BUSINESS_ID, cb);
}

export function demoUpdateBusiness(patch: Partial<Business>) {
  dbUpdate<Business>(DEMO_BUSINESS_ID, "business", DEMO_BUSINESS_ID, { ...patch, updatedAt: nowIso() });
}

export function demoUploadLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      demoUpdateBusiness({ logoUrl: url });
      resolve(url);
    };
    reader.onerror = () => reject(new Error("Could not read that image file."));
    reader.readAsDataURL(file);
  });
}

export function demoResetAll() {
  clearBusiness(DEMO_BUSINESS_ID);
}

// ---------------------------------------------------------------- customers

export function demoCreateCustomer(data: Omit<Customer, "id">): string {
  const doc = dbAdd<Omit<Customer, "id">>(DEMO_BUSINESS_ID, "customers", { ...data, createdAt: nowIso(), updatedAt: nowIso() } as Omit<Customer, "id">);
  return doc.id;
}

export function demoUpdateCustomer(id: string, patch: Partial<Customer>) {
  dbUpdate<Customer>(DEMO_BUSINESS_ID, "customers", id, { ...patch, updatedAt: nowIso() });
}

export function demoGetCustomer(id: string): Customer | null {
  return getDocById<Customer>(DEMO_BUSINESS_ID, "customers", id);
}

export function demoSubscribeCustomers(cb: (customers: Customer[]) => void) {
  return subscribeCollection<Customer>(DEMO_BUSINESS_ID, "customers", (items) => cb([...items].sort((a, b) => a.name.localeCompare(b.name))));
}

// ---------------------------------------------------------------- products

export function demoCreateProduct(data: Omit<Product, "id">): string {
  const doc = dbAdd<Omit<Product, "id">>(DEMO_BUSINESS_ID, "products", { ...data, createdAt: nowIso(), updatedAt: nowIso() } as Omit<Product, "id">);
  return doc.id;
}

export function demoUpdateProduct(id: string, patch: Partial<Product>) {
  dbUpdate<Product>(DEMO_BUSINESS_ID, "products", id, { ...patch, updatedAt: nowIso() });
}

export function demoGetProduct(id: string): Product | null {
  return getDocById<Product>(DEMO_BUSINESS_ID, "products", id);
}

export function demoSubscribeProducts(cb: (products: Product[]) => void) {
  return subscribeCollection<Product>(DEMO_BUSINESS_ID, "products", (items) => cb([...items].sort((a, b) => a.name.localeCompare(b.name))));
}

// ---------------------------------------------------------------- invoices

export function demoCreateDraftInvoice(data: Omit<Invoice, "id">): string {
  const doc = dbAdd<Omit<Invoice, "id">>(DEMO_BUSINESS_ID, "invoices", { ...data, createdAt: nowIso(), updatedAt: nowIso() } as Omit<Invoice, "id">);
  return doc.id;
}

export function demoUpdateDraftInvoice(id: string, patch: Partial<Invoice>) {
  dbUpdate<Invoice>(DEMO_BUSINESS_ID, "invoices", id, { ...patch, updatedAt: nowIso() });
}

export function demoGetInvoice(id: string): Invoice | null {
  return getDocById<Invoice>(DEMO_BUSINESS_ID, "invoices", id);
}

function sortByCreatedDesc<T extends { createdAt?: unknown }>(items: T[]): T[] {
  return [...items].sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}

export function demoSubscribeInvoice(id: string, cb: (inv: Invoice | null) => void) {
  return subscribeDoc<Invoice>(DEMO_BUSINESS_ID, "invoices", id, cb);
}

export function demoSubscribeInvoices(cb: (invoices: Invoice[]) => void) {
  return subscribeCollection<Invoice>(DEMO_BUSINESS_ID, "invoices", (items) => cb(sortByCreatedDesc(items)));
}

export function demoSubscribeInvoicesForCustomer(customerId: string, cb: (invoices: Invoice[]) => void) {
  return subscribeCollection<Invoice>(DEMO_BUSINESS_ID, "invoices", (items) => cb(sortByCreatedDesc(items.filter((i) => i.customerId === customerId))));
}

export function demoIssueInvoice(invoiceId: string, invoicePrefixForType: (type: Invoice["type"]) => string): string {
  const invoice = getDocById<Invoice>(DEMO_BUSINESS_ID, "invoices", invoiceId);
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status !== "draft") throw new Error("Only draft invoices can be issued.");
  if (invoice.lineItems.length === 0) throw new Error("Add at least one line item before issuing.");

  const counterName = invoice.type === "credit_note" ? "credit_note" : "invoice";
  const seq = nextCounter(DEMO_BUSINESS_ID, counterName);
  const number = `${invoicePrefixForType(invoice.type)}${String(seq).padStart(4, "0")}`;

  dbUpdate<Invoice>(DEMO_BUSINESS_ID, "invoices", invoiceId, {
    status: "issued",
    invoiceNumber: number,
    invoiceSeq: seq,
    issuedAt: nowIso(),
    updatedAt: nowIso(),
  });
  demoLogAudit({ entityType: "invoice", entityId: invoiceId, action: "issued", summary: `Issued as ${number}`, performedBy: DEMO_USER_UID, performedByEmail: DEMO_USER_EMAIL });
  return number;
}

export function demoVoidInvoice(invoiceId: string, reason: string) {
  if (!reason.trim()) throw new Error("A reason is required to void an invoice.");
  const invoice = getDocById<Invoice>(DEMO_BUSINESS_ID, "invoices", invoiceId);
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status === "void") throw new Error("Invoice is already void.");
  if (invoice.status === "draft") throw new Error("Delete or discard a draft instead of voiding it.");
  dbUpdate<Invoice>(DEMO_BUSINESS_ID, "invoices", invoiceId, { status: "void", voidReason: reason, voidedAt: nowIso(), updatedAt: nowIso() });
  demoLogAudit({ entityType: "invoice", entityId: invoiceId, action: "voided", summary: `Voided: ${reason}`, performedBy: DEMO_USER_UID, performedByEmail: DEMO_USER_EMAIL });
}

export interface DemoPaymentInput {
  date: string;
  amountCents: number;
  method: PaymentMethod;
  reference: string;
  notes: string;
}

export function demoRecordPayment(invoiceId: string, input: DemoPaymentInput) {
  if (!input.date) throw new Error("A payment date is required.");
  const invoice = getDocById<Invoice>(DEMO_BUSINESS_ID, "invoices", invoiceId);
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status === "draft" || invoice.status === "void") throw new Error("Cannot record a payment against a draft or void document.");

  const validation = validatePaymentAmount(input.amountCents, invoice.totalCents, invoice.amountPaidCents);
  if (!validation.ok) throw new Error(validation.error);

  const newPaid = invoice.amountPaidCents + input.amountCents;
  const newBalance = Math.max(invoice.totalCents - newPaid, 0);
  const newStatus = deriveInvoiceStatus(invoice.status, invoice.totalCents, newPaid);

  const payment = dbAdd<Omit<Payment, "id">>(DEMO_BUSINESS_ID, "payments", {
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
    isDemo: true,
    createdBy: DEMO_USER_UID,
    createdAt: nowIso(),
  } as Omit<Payment, "id">);

  dbUpdate<Invoice>(DEMO_BUSINESS_ID, "invoices", invoiceId, { amountPaidCents: newPaid, balanceDueCents: newBalance, status: newStatus, updatedAt: nowIso() });
  demoLogAudit({ entityType: "invoice", entityId: invoiceId, action: "payment_recorded", summary: `Payment recorded (${input.method}) for ${invoice.invoiceNumber ?? ""}`, performedBy: DEMO_USER_UID, performedByEmail: DEMO_USER_EMAIL });

  return { paymentId: payment.id, newStatus, invoiceNumber: invoice.invoiceNumber ?? "" };
}

export function demoVoidPayment(paymentId: string) {
  const payment = getDocById<Payment>(DEMO_BUSINESS_ID, "payments", paymentId);
  if (!payment) throw new Error("Payment not found.");
  if (payment.voided) throw new Error("Payment is already voided.");
  const invoice = getDocById<Invoice>(DEMO_BUSINESS_ID, "invoices", payment.invoiceId);
  if (!invoice) throw new Error("Related invoice not found.");

  const newPaid = Math.max(invoice.amountPaidCents - payment.amountCents, 0);
  const newBalance = Math.max(invoice.totalCents - newPaid, 0);
  const restoredStatus = deriveInvoiceStatus(invoice.status === "paid" ? "issued" : invoice.status, invoice.totalCents, newPaid);

  dbUpdate<Payment>(DEMO_BUSINESS_ID, "payments", paymentId, { voided: true });
  dbUpdate<Invoice>(DEMO_BUSINESS_ID, "invoices", payment.invoiceId, { amountPaidCents: newPaid, balanceDueCents: newBalance, status: restoredStatus, updatedAt: nowIso() });
  demoLogAudit({ entityType: "invoice", entityId: payment.invoiceId, action: "payment_voided", summary: "A payment was voided.", performedBy: DEMO_USER_UID, performedByEmail: DEMO_USER_EMAIL });
}

// ------------------------------------------------------------------ quotes

export function demoCreateDraftQuote(data: Omit<Quote, "id">): string {
  const doc = dbAdd<Omit<Quote, "id">>(DEMO_BUSINESS_ID, "quotes", { ...data, createdAt: nowIso(), updatedAt: nowIso() } as Omit<Quote, "id">);
  return doc.id;
}

export function demoUpdateDraftQuote(id: string, patch: Partial<Quote>) {
  dbUpdate<Quote>(DEMO_BUSINESS_ID, "quotes", id, { ...patch, updatedAt: nowIso() });
}

export function demoGetQuote(id: string): Quote | null {
  return getDocById<Quote>(DEMO_BUSINESS_ID, "quotes", id);
}

export function demoSubscribeQuote(id: string, cb: (q: Quote | null) => void) {
  return subscribeDoc<Quote>(DEMO_BUSINESS_ID, "quotes", id, cb);
}

export function demoSubscribeQuotes(cb: (quotes: Quote[]) => void) {
  return subscribeCollection<Quote>(DEMO_BUSINESS_ID, "quotes", (items) => cb(sortByCreatedDesc(items)));
}

export function demoSendQuote(quoteId: string, prefix: string): string {
  const quote = getDocById<Quote>(DEMO_BUSINESS_ID, "quotes", quoteId);
  if (!quote) throw new Error("Quote not found.");
  if (quote.status !== "draft") throw new Error("Only draft quotes can be sent.");
  if (quote.lineItems.length === 0) throw new Error("Add at least one line item before sending.");

  const seq = nextCounter(DEMO_BUSINESS_ID, "quote");
  const number = `${prefix}${String(seq).padStart(4, "0")}`;
  dbUpdate<Quote>(DEMO_BUSINESS_ID, "quotes", quoteId, { status: "sent", quoteNumber: number, quoteSeq: seq, updatedAt: nowIso() });
  demoLogAudit({ entityType: "quote", entityId: quoteId, action: "sent", summary: `Sent as ${number}`, performedBy: DEMO_USER_UID, performedByEmail: DEMO_USER_EMAIL });
  return number;
}

export function demoMarkQuoteAccepted(quoteId: string) {
  dbUpdate<Quote>(DEMO_BUSINESS_ID, "quotes", quoteId, { status: "accepted", updatedAt: nowIso() });
  demoLogAudit({ entityType: "quote", entityId: quoteId, action: "accepted", summary: "Marked accepted", performedBy: DEMO_USER_UID, performedByEmail: DEMO_USER_EMAIL });
}

export function demoMarkQuoteDeclined(quoteId: string) {
  dbUpdate<Quote>(DEMO_BUSINESS_ID, "quotes", quoteId, { status: "declined", updatedAt: nowIso() });
  demoLogAudit({ entityType: "quote", entityId: quoteId, action: "declined", summary: "Marked declined", performedBy: DEMO_USER_UID, performedByEmail: DEMO_USER_EMAIL });
}

export function demoMarkQuoteConverted(quoteId: string, invoiceId: string) {
  dbUpdate<Quote>(DEMO_BUSINESS_ID, "quotes", quoteId, { status: "converted", convertedInvoiceId: invoiceId, updatedAt: nowIso() });
  demoLogAudit({ entityType: "quote", entityId: quoteId, action: "converted", summary: "Converted to draft invoice", performedBy: DEMO_USER_UID, performedByEmail: DEMO_USER_EMAIL });
}

// ----------------------------------------------------------------- payments

export function demoSubscribePayments(cb: (payments: Payment[]) => void) {
  return subscribeCollection<Payment>(DEMO_BUSINESS_ID, "payments", (items) => cb(sortByCreatedDesc(items)));
}

// -------------------------------------------------------------------- audit

export function demoLogAudit(entry: {
  entityType: AuditEntry["entityType"];
  entityId: string;
  action: AuditAction;
  summary: string;
  performedBy: string;
  performedByEmail: string;
}) {
  dbAdd<Omit<AuditEntry, "id">>(DEMO_BUSINESS_ID, "auditLog", { ...entry, at: nowIso() } as Omit<AuditEntry, "id">, newId());
}

export function demoSubscribeAuditForEntity(entityId: string, cb: (entries: AuditEntry[]) => void) {
  return subscribeCollection<AuditEntry>(DEMO_BUSINESS_ID, "auditLog", (items) =>
    cb([...items.filter((e) => e.entityId === entityId)].sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? "")))),
  );
}

export function demoSubscribeRecentAudit(cb: (entries: AuditEntry[]) => void) {
  return subscribeCollection<AuditEntry>(DEMO_BUSINESS_ID, "auditLog", (items) =>
    cb([...items].sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? ""))).slice(0, 50)),
  );
}

export { listCollection as demoListCollection };
