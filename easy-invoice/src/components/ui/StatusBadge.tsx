import type { InvoiceStatus, QuoteStatus } from "../../lib/types";

type AnyStatus = InvoiceStatus | "overdue" | QuoteStatus;

const STYLES: Record<string, string> = {
  draft: "bg-ink-100 text-ink-600",
  issued: "bg-blue-50 text-blue-700",
  sent: "bg-blue-50 text-blue-700",
  partially_paid: "bg-amber-50 text-amber-700",
  paid: "bg-brand-100 text-brand-800",
  accepted: "bg-brand-100 text-brand-800",
  overdue: "bg-red-50 text-red-700",
  void: "bg-ink-100 text-ink-400 line-through",
  declined: "bg-red-50 text-red-700",
  expired: "bg-ink-100 text-ink-500",
  converted: "bg-purple-50 text-purple-700",
};

const LABELS: Record<string, string> = {
  draft: "Draft",
  issued: "Issued",
  sent: "Sent",
  partially_paid: "Partially Paid",
  paid: "Paid",
  accepted: "Accepted",
  overdue: "Overdue",
  void: "Void",
  declined: "Declined",
  expired: "Expired",
  converted: "Converted",
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  return <span className={`badge ${STYLES[status] ?? "bg-ink-100 text-ink-600"}`}>{LABELS[status] ?? status}</span>;
}
