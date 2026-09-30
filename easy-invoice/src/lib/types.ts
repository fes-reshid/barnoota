import type { Timestamp } from "firebase/firestore";
import type { Cents, DiscountType, TaxTreatment } from "./money";

export type { TaxTreatment, DiscountType } from "./money";

export type ID = string;
export type Role = "owner" | "admin" | "staff";

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export const EMPTY_ADDRESS: Address = { line1: "", line2: "", city: "", state: "", postcode: "", country: "Australia" };

export interface BankDetails {
  bankName: string;
  accountName: string;
  bsb: string;
  accountNumber: string;
}

export interface Business {
  id: ID;
  name: string;
  logoUrl: string | null;
  email: string;
  phone: string;
  address: Address;
  abn: string;
  currency: string;
  gstRegistered: boolean;
  taxRatePercent: number;
  pricesIncludeTax: boolean;
  invoicePrefix: string;
  quotePrefix: string;
  defaultPaymentTermsDays: number;
  bank: BankDetails;
  defaultInvoiceNotes: string;
  defaultPaymentInstructions: string;
  stripePaymentLinkUrl?: string;
  members: Record<ID, Role>;
  isDemo: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type CustomerType = "individual" | "business";

export interface Customer {
  id: ID;
  type: CustomerType;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  billingAddress: Address;
  abn: string;
  notes: string;
  archived: boolean;
  isDemo: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** A frozen snapshot of a customer's details, captured onto a document at issue time. */
export interface CustomerSnapshot {
  customerId: ID | null;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  billingAddress: Address;
  abn: string;
}

/** A frozen snapshot of the business's details/settings, captured onto a document at issue time. */
export interface BusinessSnapshot {
  name: string;
  logoUrl: string | null;
  email: string;
  phone: string;
  address: Address;
  abn: string;
  currency: string;
  gstRegistered: boolean;
  taxRatePercent: number;
  pricesIncludeTax: boolean;
  bank: BankDetails;
}

export interface Product {
  id: ID;
  name: string;
  description: string;
  unitPriceCents: Cents;
  unit: string;
  taxTreatment: TaxTreatment;
  archived: boolean;
  isDemo: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface LineItem {
  id: string;
  productId: ID | null;
  description: string;
  quantity: number;
  unitPriceCents: Cents;
  discountType: DiscountType;
  discountValue: number;
  taxTreatment: TaxTreatment;
  // Calculated + stored redundantly so an issued document's numbers never drift:
  subtotalExTaxCents: Cents;
  discountCents: Cents;
  taxCents: Cents;
  totalCents: Cents;
}

export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "void";
export type DocType = "invoice" | "credit_note";

export interface Invoice {
  id: ID;
  type: DocType;
  invoiceNumber: string | null; // null until issued? no — allocated at issue time; drafts show "DRAFT"
  invoiceSeq: number | null;
  status: InvoiceStatus;
  customerId: ID | null;
  customer: CustomerSnapshot;
  business: BusinessSnapshot;
  issueDate: string; // ISO yyyy-mm-dd
  dueDate: string;
  poNumber: string;
  lineItems: LineItem[];
  subtotalCents: Cents;
  discountTotalCents: Cents;
  taxTotalCents: Cents;
  totalCents: Cents;
  amountPaidCents: Cents;
  balanceDueCents: Cents;
  notes: string;
  paymentInstructions: string;
  voidReason: string | null;
  voidedAt?: Timestamp | null;
  relatedInvoiceId: ID | null; // credit note -> original invoice
  quoteId: ID | null; // set when converted from a quote
  isDemo: boolean;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  issuedAt?: Timestamp | null;
}

export type PaymentMethod = "bank_transfer" | "cash" | "card" | "cheque" | "other";

export interface Payment {
  id: ID;
  invoiceId: ID;
  invoiceNumber: string;
  customerId: ID | null;
  customerName: string;
  date: string; // ISO yyyy-mm-dd
  amountCents: Cents;
  method: PaymentMethod;
  reference: string;
  notes: string;
  voided: boolean;
  isDemo: boolean;
  createdBy: string;
  createdAt?: Timestamp;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired" | "converted";

export interface Quote {
  id: ID;
  quoteNumber: string | null;
  quoteSeq: number | null;
  status: QuoteStatus;
  customerId: ID | null;
  customer: CustomerSnapshot;
  business: BusinessSnapshot;
  issueDate: string;
  expiryDate: string;
  lineItems: LineItem[];
  subtotalCents: Cents;
  discountTotalCents: Cents;
  taxTotalCents: Cents;
  totalCents: Cents;
  notes: string;
  convertedInvoiceId: ID | null;
  isDemo: boolean;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type AuditAction =
  | "created"
  | "updated"
  | "issued"
  | "voided"
  | "payment_recorded"
  | "payment_voided"
  | "converted"
  | "accepted"
  | "declined"
  | "sent";

export interface AuditEntry {
  id: ID;
  entityType: "invoice" | "quote" | "payment" | "customer";
  entityId: ID;
  action: AuditAction;
  summary: string;
  performedBy: string;
  performedByEmail: string;
  at?: Timestamp;
}
