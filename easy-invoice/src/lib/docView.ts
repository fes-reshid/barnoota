import type { BusinessSnapshot, CustomerSnapshot, LineItem } from "./types";

export interface DocumentView {
  kind: "Invoice" | "Quote" | "Credit Note";
  documentNumber: string;
  statusLabel: string;
  business: BusinessSnapshot;
  customer: CustomerSnapshot;
  issueDate: string;
  secondDateLabel: string;
  secondDate: string;
  poNumber?: string;
  lineItems: LineItem[];
  subtotalCents: number;
  discountTotalCents: number;
  taxTotalCents: number;
  totalCents: number;
  amountPaidCents?: number;
  balanceDueCents?: number;
  notes: string;
  paymentInstructions?: string;
  currency: string;
}

/**
 * "Tax Invoice" is only shown when the business is GST-registered — an
 * unregistered business must not print that label. This app does not
 * verify current ATO requirements; the business owner is responsible for
 * confirming what their invoices must say.
 */
export function documentTitle(kind: DocumentView["kind"], gstRegistered: boolean): string {
  if (kind === "Invoice") return gstRegistered ? "Tax Invoice" : "Invoice";
  if (kind === "Credit Note") return gstRegistered ? "Adjustment Note" : "Credit Note";
  return "Quote";
}
