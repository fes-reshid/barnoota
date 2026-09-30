import { useCallback } from "react";
import { useApp } from "../app/AppProvider";
import { useSubscription } from "./hooks";
import { subscribeCustomers, getCustomer as fetchCustomer } from "./repo/customers";
import { subscribeProducts } from "./repo/products";
import { subscribeInvoices, subscribeInvoice, subscribeInvoicesForCustomer } from "./repo/invoices";
import { subscribeQuotes, subscribeQuote } from "./repo/quotes";
import { subscribePayments } from "./repo/payments";
import { subscribeAuditForEntity } from "./repo/audit";
import type { Customer, Invoice, Quote, Product, Payment, AuditEntry } from "./types";

export function useCustomers(): { data: Customer[]; loading: boolean } {
  const { businessId } = useApp();
  const sub = useCallback((cb: (v: Customer[]) => void) => subscribeCustomers(businessId!, cb), [businessId]);
  const { data, loading } = useSubscription<Customer[]>(businessId ? sub : null, [businessId]);
  return { data: data ?? [], loading };
}

export function useProducts(): { data: Product[]; loading: boolean } {
  const { businessId } = useApp();
  const sub = useCallback((cb: (v: Product[]) => void) => subscribeProducts(businessId!, cb), [businessId]);
  const { data, loading } = useSubscription<Product[]>(businessId ? sub : null, [businessId]);
  return { data: data ?? [], loading };
}

export function useInvoices(): { data: Invoice[]; loading: boolean } {
  const { businessId } = useApp();
  const sub = useCallback((cb: (v: Invoice[]) => void) => subscribeInvoices(businessId!, cb), [businessId]);
  const { data, loading } = useSubscription<Invoice[]>(businessId ? sub : null, [businessId]);
  return { data: data ?? [], loading };
}

export function useInvoice(invoiceId: string | undefined): { data: Invoice | null | undefined; loading: boolean } {
  const { businessId } = useApp();
  const sub = useCallback((cb: (v: Invoice | null) => void) => subscribeInvoice(businessId!, invoiceId!, cb), [businessId, invoiceId]);
  return useSubscription<Invoice | null>(businessId && invoiceId ? sub : null, [businessId, invoiceId]);
}

export function useInvoicesForCustomer(customerId: string | undefined): { data: Invoice[]; loading: boolean } {
  const { businessId } = useApp();
  const sub = useCallback((cb: (v: Invoice[]) => void) => subscribeInvoicesForCustomer(businessId!, customerId!, cb), [businessId, customerId]);
  const { data, loading } = useSubscription<Invoice[]>(businessId && customerId ? sub : null, [businessId, customerId]);
  return { data: data ?? [], loading };
}

export function useQuotes(): { data: Quote[]; loading: boolean } {
  const { businessId } = useApp();
  const sub = useCallback((cb: (v: Quote[]) => void) => subscribeQuotes(businessId!, cb), [businessId]);
  const { data, loading } = useSubscription<Quote[]>(businessId ? sub : null, [businessId]);
  return { data: data ?? [], loading };
}

export function useQuote(quoteId: string | undefined): { data: Quote | null | undefined; loading: boolean } {
  const { businessId } = useApp();
  const sub = useCallback((cb: (v: Quote | null) => void) => subscribeQuote(businessId!, quoteId!, cb), [businessId, quoteId]);
  return useSubscription<Quote | null>(businessId && quoteId ? sub : null, [businessId, quoteId]);
}

export function usePayments(): { data: Payment[]; loading: boolean } {
  const { businessId } = useApp();
  const sub = useCallback((cb: (v: Payment[]) => void) => subscribePayments(businessId!, cb), [businessId]);
  const { data, loading } = useSubscription<Payment[]>(businessId ? sub : null, [businessId]);
  return { data: data ?? [], loading };
}

export function useAuditForEntity(entityId: string | undefined): { data: AuditEntry[]; loading: boolean } {
  const { businessId } = useApp();
  const sub = useCallback((cb: (v: AuditEntry[]) => void) => subscribeAuditForEntity(businessId!, entityId!, cb), [businessId, entityId]);
  const { data, loading } = useSubscription<AuditEntry[]>(businessId && entityId ? sub : null, [businessId, entityId]);
  return { data: data ?? [], loading };
}

export function useCustomerLookup(customerId: string | null | undefined) {
  const { data: customers } = useCustomers();
  return customers.find((c) => c.id === customerId) ?? null;
}

export { fetchCustomer };
