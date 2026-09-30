import Decimal from "decimal.js";

/**
 * All monetary amounts in this app are stored and calculated as integer
 * cents (minor currency units) — never as floating-point dollars — so
 * storage is exact by construction. Decimal.js is used only for the
 * intermediate multiplication/division against non-integer quantities and
 * percentages, and every result is rounded back to whole cents (half-up)
 * before it is stored or added up.
 */
export type Cents = number;

const HALF_UP = Decimal.ROUND_HALF_UP;

function roundCents(d: Decimal): Cents {
  return d.toDecimalPlaces(0, HALF_UP).toNumber();
}

/** Parses a user-entered dollar amount (e.g. "12.5", 12.5) into integer cents. */
export function dollarsToCents(input: string | number): Cents {
  if (input === "" || input === null || input === undefined) return 0;
  const d = new Decimal(input);
  return roundCents(d.times(100));
}

/** Integer cents back to a fixed 2dp string for editing, e.g. "12.50". */
export function centsToDollarsString(cents: Cents): string {
  return new Decimal(cents || 0).dividedBy(100).toFixed(2);
}

export function formatMoney(cents: Cents, currency = "AUD", locale = "en-AU"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format((cents || 0) / 100);
}

export type TaxTreatment = "taxable" | "exempt";
export type DiscountType = "percent" | "fixed";

export interface LineInput {
  quantity: number;
  unitPriceCents: Cents;
  discountType: DiscountType;
  /** Percent (0-100) when discountType is "percent", cents when "fixed". */
  discountValue: number;
  taxTreatment: TaxTreatment;
}

export interface LineCalculated {
  /** quantity x unit price, in whatever basis prices were entered (incl. or excl. tax) */
  grossCents: Cents;
  discountCents: Cents;
  /** gross - discount, still in the entered basis */
  netCents: Cents;
  taxCents: Cents;
  /** Ex-tax amount after discount — rolls up into the invoice subtotal. */
  subtotalExTaxCents: Cents;
  /** Amount owed for this line (what the customer pays for it). */
  totalCents: Cents;
}

export function calculateLine(
  line: LineInput,
  taxRatePercent: number,
  pricesIncludeTax: boolean,
): LineCalculated {
  const quantity = new Decimal(Number.isFinite(line.quantity) ? line.quantity : 0);
  const unitPrice = new Decimal(line.unitPriceCents || 0);
  const gross = roundCents(quantity.times(unitPrice));

  let discount: number;
  if (line.discountType === "percent") {
    const pct = Math.max(0, Math.min(100, line.discountValue || 0));
    discount = roundCents(new Decimal(gross).times(pct).dividedBy(100));
  } else {
    discount = Math.round(line.discountValue || 0);
  }
  discount = Math.max(0, Math.min(discount, gross));

  const net = gross - discount;
  const rate = new Decimal(taxRatePercent || 0).dividedBy(100);
  const taxable = line.taxTreatment === "taxable" && taxRatePercent > 0;

  let tax = 0;
  let subtotalExTax = net;
  let total = net;

  if (taxable) {
    if (pricesIncludeTax) {
      const exTax = roundCents(new Decimal(net).dividedBy(rate.plus(1)));
      subtotalExTax = exTax;
      tax = net - exTax;
      total = net;
    } else {
      tax = roundCents(new Decimal(net).times(rate));
      subtotalExTax = net;
      total = net + tax;
    }
  }

  return { grossCents: gross, discountCents: discount, netCents: net, taxCents: tax, subtotalExTaxCents: subtotalExTax, totalCents: total };
}

export interface DocumentTotals {
  subtotalCents: Cents;
  discountTotalCents: Cents;
  taxTotalCents: Cents;
  totalCents: Cents;
}

export function calculateDocumentTotals(
  lines: LineInput[],
  taxRatePercent: number,
  pricesIncludeTax: boolean,
): DocumentTotals {
  let subtotalCents = 0;
  let discountTotalCents = 0;
  let taxTotalCents = 0;
  let totalCents = 0;
  for (const line of lines) {
    const c = calculateLine(line, taxRatePercent, pricesIncludeTax);
    subtotalCents += c.subtotalExTaxCents;
    discountTotalCents += c.discountCents;
    taxTotalCents += c.taxCents;
    totalCents += c.totalCents;
  }
  return { subtotalCents, discountTotalCents, taxTotalCents, totalCents };
}

export interface PaymentValidation {
  ok: boolean;
  error?: string;
}

/** Guards against zero/negative amounts and overpayment beyond the remaining balance. */
export function validatePaymentAmount(
  newPaymentCents: Cents,
  totalCents: Cents,
  alreadyPaidCents: Cents,
): PaymentValidation {
  if (!Number.isFinite(newPaymentCents) || newPaymentCents <= 0) {
    return { ok: false, error: "Payment amount must be greater than zero." };
  }
  if (!Number.isInteger(newPaymentCents)) {
    return { ok: false, error: "Payment amount must be a whole number of cents." };
  }
  const remaining = totalCents - alreadyPaidCents;
  if (newPaymentCents > remaining) {
    return {
      ok: false,
      error: `Payment of ${formatMoney(newPaymentCents)} exceeds the remaining balance of ${formatMoney(Math.max(remaining, 0))}.`,
    };
  }
  return { ok: true };
}

export type InvoiceMoneyStatus = "draft" | "issued" | "partially_paid" | "paid" | "void";

/** Status is always re-derived from paid/total, never trusted as free-standing state. */
export function deriveInvoiceStatus(
  currentStatus: InvoiceMoneyStatus,
  totalCents: Cents,
  amountPaidCents: Cents,
): InvoiceMoneyStatus {
  if (currentStatus === "draft" || currentStatus === "void") return currentStatus;
  if (amountPaidCents <= 0) return "issued";
  if (amountPaidCents >= totalCents) return "paid";
  return "partially_paid";
}

export function isOverdue(status: InvoiceMoneyStatus, dueDate: string | Date, balanceDueCents: Cents): boolean {
  if (status !== "issued" && status !== "partially_paid") return false;
  if (balanceDueCents <= 0) return false;
  const due = typeof dueDate === "string" ? new Date(dueDate + "T23:59:59") : dueDate;
  return due.getTime() < Date.now();
}

export function displayStatus(status: InvoiceMoneyStatus, dueDate: string | Date, balanceDueCents: Cents): InvoiceMoneyStatus | "overdue" {
  if (isOverdue(status, dueDate, balanceDueCents)) return "overdue";
  return status;
}
