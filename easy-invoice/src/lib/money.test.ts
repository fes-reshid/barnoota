import { describe, expect, it } from "vitest";
import {
  calculateLine,
  calculateDocumentTotals,
  dollarsToCents,
  centsToDollarsString,
  formatMoney,
  validatePaymentAmount,
  deriveInvoiceStatus,
  isOverdue,
  type LineInput,
} from "./money";

describe("dollarsToCents / centsToDollarsString", () => {
  it("round-trips common amounts without float drift", () => {
    expect(dollarsToCents("10.10")).toBe(1010);
    expect(dollarsToCents("0.1")).toBe(10);
    expect(dollarsToCents("0.2")).toBe(20);
    expect(dollarsToCents(19.99)).toBe(1999);
    expect(centsToDollarsString(1010)).toBe("10.10");
  });

  it("avoids the classic 0.1 + 0.2 floating point trap", () => {
    // Naive float math: 0.1 + 0.2 !== 0.3. Cents math must not repeat this.
    const a = dollarsToCents("0.1");
    const b = dollarsToCents("0.2");
    expect(a + b).toBe(30);
  });

  it("rounds half up to the nearest cent", () => {
    expect(dollarsToCents("1.005")).toBe(101);
    expect(dollarsToCents("1.004")).toBe(100);
  });

  it("formats money with the currency symbol", () => {
    expect(formatMoney(150000, "AUD")).toContain("1,500.00");
  });
});

describe("calculateLine — tax-exclusive pricing", () => {
  const base: LineInput = {
    quantity: 2,
    unitPriceCents: 10000, // $100.00
    discountType: "percent",
    discountValue: 0,
    taxTreatment: "taxable",
  };

  it("computes gross, tax and total with no discount", () => {
    const r = calculateLine(base, 10, false);
    expect(r.grossCents).toBe(20000);
    expect(r.discountCents).toBe(0);
    expect(r.subtotalExTaxCents).toBe(20000);
    expect(r.taxCents).toBe(2000);
    expect(r.totalCents).toBe(22000);
  });

  it("applies a percent discount before tax", () => {
    const r = calculateLine({ ...base, discountType: "percent", discountValue: 10 }, 10, false);
    expect(r.discountCents).toBe(2000); // 10% of 20000
    expect(r.netCents).toBe(18000);
    expect(r.taxCents).toBe(1800);
    expect(r.totalCents).toBe(19800);
  });

  it("applies a fixed discount and clamps it to the line gross", () => {
    const r = calculateLine({ ...base, discountType: "fixed", discountValue: 999999 }, 10, false);
    expect(r.discountCents).toBe(20000); // clamped, never negative net
    expect(r.netCents).toBe(0);
    expect(r.taxCents).toBe(0);
    expect(r.totalCents).toBe(0);
  });

  it("charges no tax on an exempt/GST-free line", () => {
    const r = calculateLine({ ...base, taxTreatment: "exempt" }, 10, false);
    expect(r.taxCents).toBe(0);
    expect(r.totalCents).toBe(20000);
  });

  it("charges no tax when the business is not GST registered (rate 0)", () => {
    const r = calculateLine(base, 0, false);
    expect(r.taxCents).toBe(0);
    expect(r.totalCents).toBe(20000);
  });
});

describe("calculateLine — tax-inclusive pricing", () => {
  const base: LineInput = {
    quantity: 1,
    unitPriceCents: 11000, // $110.00 incl. 10% GST -> $100 ex-tax + $10 tax
    discountType: "percent",
    discountValue: 0,
    taxTreatment: "taxable",
  };

  it("backs the tax out of a tax-inclusive price", () => {
    const r = calculateLine(base, 10, true);
    expect(r.netCents).toBe(11000);
    expect(r.subtotalExTaxCents).toBe(10000);
    expect(r.taxCents).toBe(1000);
    expect(r.totalCents).toBe(11000); // total charged doesn't change, just the breakdown
  });

  it("discount applies to the inclusive price, then tax is re-derived", () => {
    const r = calculateLine({ ...base, discountType: "percent", discountValue: 50 }, 10, true);
    expect(r.discountCents).toBe(5500);
    expect(r.netCents).toBe(5500);
    expect(r.subtotalExTaxCents).toBe(5000);
    expect(r.taxCents).toBe(500);
    expect(r.totalCents).toBe(5500);
  });
});

describe("calculateDocumentTotals", () => {
  it("sums multiple mixed taxable/exempt lines correctly", () => {
    const lines: LineInput[] = [
      { quantity: 3, unitPriceCents: 5000, discountType: "percent", discountValue: 0, taxTreatment: "taxable" },
      { quantity: 1, unitPriceCents: 20000, discountType: "fixed", discountValue: 5000, taxTreatment: "exempt" },
    ];
    const totals = calculateDocumentTotals(lines, 10, false);
    // Line 1: 15000 gross, no discount, tax 1500, total 16500
    // Line 2: 20000 gross, 5000 discount, exempt -> net 15000, tax 0, total 15000
    expect(totals.subtotalCents).toBe(15000 + 15000);
    expect(totals.discountTotalCents).toBe(5000);
    expect(totals.taxTotalCents).toBe(1500);
    expect(totals.totalCents).toBe(16500 + 15000);
  });

  it("returns all zeros for an empty line list", () => {
    const totals = calculateDocumentTotals([], 10, false);
    expect(totals).toEqual({ subtotalCents: 0, discountTotalCents: 0, taxTotalCents: 0, totalCents: 0 });
  });
});

describe("validatePaymentAmount", () => {
  it("rejects zero or negative amounts", () => {
    expect(validatePaymentAmount(0, 10000, 0).ok).toBe(false);
    expect(validatePaymentAmount(-100, 10000, 0).ok).toBe(false);
  });

  it("accepts a partial payment within the balance", () => {
    expect(validatePaymentAmount(4000, 10000, 0).ok).toBe(true);
  });

  it("accepts a payment that exactly settles the remaining balance", () => {
    expect(validatePaymentAmount(6000, 10000, 4000).ok).toBe(true);
  });

  it("rejects a payment that would overpay the invoice", () => {
    const result = validatePaymentAmount(6001, 10000, 4000);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/exceeds/);
  });

  it("rejects any payment once the invoice is already fully paid", () => {
    expect(validatePaymentAmount(1, 10000, 10000).ok).toBe(false);
  });
});

describe("deriveInvoiceStatus", () => {
  it("keeps draft and void invoices untouched by payment amounts", () => {
    expect(deriveInvoiceStatus("draft", 10000, 5000)).toBe("draft");
    expect(deriveInvoiceStatus("void", 10000, 5000)).toBe("void");
  });

  it("moves issued -> partially_paid -> paid as payments accumulate", () => {
    expect(deriveInvoiceStatus("issued", 10000, 0)).toBe("issued");
    expect(deriveInvoiceStatus("issued", 10000, 4000)).toBe("partially_paid");
    expect(deriveInvoiceStatus("partially_paid", 10000, 10000)).toBe("paid");
  });
});

describe("isOverdue", () => {
  it("is never overdue when fully paid", () => {
    expect(isOverdue("paid", "2000-01-01", 0)).toBe(false);
  });

  it("is overdue once the due date has passed with a balance remaining", () => {
    expect(isOverdue("issued", "2000-01-01", 5000)).toBe(true);
  });

  it("is not overdue before the due date", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
    expect(isOverdue("issued", future, 5000)).toBe(false);
  });

  it("draft invoices are never overdue", () => {
    expect(isOverdue("draft", "2000-01-01", 5000)).toBe(false);
  });
});
