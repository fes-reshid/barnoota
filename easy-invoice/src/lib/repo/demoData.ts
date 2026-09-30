import { createCustomer } from "./customers";
import { createProduct } from "./products";
import { blankRawLine, buildLineItems, createDraftInvoice, customerSnapshotFrom, issueInvoice, recordPayment, totalsFromLineItems, businessSnapshotFrom, todayIso } from "./invoices";
import { createDraftQuote, sendQuote } from "./quotes";
import type { Business, Customer } from "../types";
import { EMPTY_ADDRESS } from "../types";

/**
 * Populates fictional sample data — clearly flagged isDemo — so a new
 * account can be explored immediately. Demo records are excluded from the
 * dashboard/report totals by default and labelled "Demo" throughout the UI,
 * so they never get mistaken for real bookkeeping.
 */
export async function loadDemoData(business: Business, uid: string, email: string) {
  const demoCustomers: Array<Omit<Customer, "id">> = [
    {
      type: "business",
      name: "Sunrise Cafe Pty Ltd",
      contactPerson: "Priya Nair",
      email: "priya@sunrisecafe.example",
      phone: "(02) 5550 1234",
      billingAddress: { ...EMPTY_ADDRESS, line1: "12 Bourke Street", city: "Sydney", state: "NSW", postcode: "2000" },
      abn: "51 824 753 556",
      notes: "Prefers invoices emailed on the 1st of the month.",
      archived: false,
      isDemo: true,
    },
    {
      type: "individual",
      name: "Marcus Webb",
      contactPerson: "",
      email: "marcus.webb@example.com",
      phone: "0412 345 678",
      billingAddress: { ...EMPTY_ADDRESS, line1: "8 Fernbank Ave", city: "Brisbane", state: "QLD", postcode: "4000" },
      abn: "",
      notes: "",
      archived: false,
      isDemo: true,
    },
    {
      type: "business",
      name: "Blue Gum Landscaping",
      contactPerson: "Tia Anderson",
      email: "accounts@bluegumlandscaping.example",
      phone: "(08) 5550 9876",
      billingAddress: { ...EMPTY_ADDRESS, line1: "3 Wattle Court", city: "Adelaide", state: "SA", postcode: "5000" },
      abn: "27 605 491 330",
      notes: "",
      archived: false,
      isDemo: true,
    },
  ];

  const customerIds: string[] = [];
  for (const c of demoCustomers) {
    customerIds.push(await createCustomer(business.id, c));
  }

  await createProduct(business.id, {
    name: "Consulting (hourly)",
    description: "General consulting and advisory work.",
    unitPriceCents: 15000,
    unit: "hour",
    taxTreatment: "taxable",
    archived: false,
    isDemo: true,
  });
  await createProduct(business.id, {
    name: "Website maintenance package",
    description: "Monthly website updates and hosting support.",
    unitPriceCents: 22000,
    unit: "month",
    taxTreatment: "taxable",
    archived: false,
    isDemo: true,
  });

  // A demo invoice, issued and partially paid, so the dashboard/reports have
  // something interesting to show straight away.
  const demoCustomer: Customer = { id: customerIds[0], ...demoCustomers[0] };
  const lineItems = buildLineItems(
    [
      { ...blankRawLine(), description: "Website redesign — homepage & menu pages", quantity: 6, unitPriceCents: 15000, discountType: "percent", discountValue: 0, taxTreatment: "taxable" },
      { ...blankRawLine(), description: "Website maintenance package (first month)", quantity: 1, unitPriceCents: 22000, discountType: "percent", discountValue: 10, taxTreatment: "taxable" },
    ],
    business.taxRatePercent,
    business.pricesIncludeTax,
  );
  const totals = totalsFromLineItems(lineItems);
  const issueDate = todayIso();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + business.defaultPaymentTermsDays);

  const invoiceId = await createDraftInvoice(business.id, uid, {
    type: "invoice",
    invoiceNumber: null,
    invoiceSeq: null,
    status: "draft",
    customerId: demoCustomer.id,
    customer: customerSnapshotFrom(demoCustomer),
    business: businessSnapshotFrom(business),
    issueDate,
    dueDate: dueDate.toISOString().slice(0, 10),
    poNumber: "PO-DEMO-001",
    lineItems,
    ...totals,
    amountPaidCents: 0,
    balanceDueCents: totals.totalCents,
    notes: business.defaultInvoiceNotes || "Thank you for your business!",
    paymentInstructions: business.defaultPaymentInstructions,
    voidReason: null,
    relatedInvoiceId: null,
    quoteId: null,
    isDemo: true,
    createdBy: uid,
  });

  await issueInvoice(business.id, invoiceId, business, uid, email);

  // Record a partial payment so "Partially Paid" and balance tracking are
  // visible immediately.
  const partial = Math.round(totals.totalCents * 0.4);
  if (partial > 0) {
    await recordPayment(business.id, invoiceId, uid, email, {
      date: issueDate,
      amountCents: partial,
      method: "bank_transfer",
      reference: "DEMO-PMT-001",
      notes: "Demo part-payment.",
    });
  }

  // A demo quote, sent but not yet actioned.
  const quoteCustomer: Customer = { id: customerIds[2], ...demoCustomers[2] };
  const quoteLines = buildLineItems(
    [{ ...blankRawLine(), description: "Garden redesign consultation", quantity: 3, unitPriceCents: 15000, discountType: "percent", discountValue: 0, taxTreatment: "taxable" }],
    business.taxRatePercent,
    business.pricesIncludeTax,
  );
  const quoteTotals = totalsFromLineItems(quoteLines);
  const quoteExpiry = new Date();
  quoteExpiry.setDate(quoteExpiry.getDate() + 30);
  const quoteId = await createDraftQuote(business.id, uid, {
    quoteNumber: null,
    quoteSeq: null,
    status: "draft",
    customerId: quoteCustomer.id,
    customer: customerSnapshotFrom(quoteCustomer),
    business: businessSnapshotFrom(business),
    issueDate,
    expiryDate: quoteExpiry.toISOString().slice(0, 10),
    lineItems: quoteLines,
    ...quoteTotals,
    notes: "Thanks for the opportunity to quote on this work.",
    convertedInvoiceId: null,
    isDemo: true,
    createdBy: uid,
  });
  await sendQuote(business.id, quoteId, business, uid, email);
}
