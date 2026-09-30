import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { useApp } from "../../app/AppProvider";
import { recordPayment } from "../../lib/repo/invoices";
import { centsToDollarsString, dollarsToCents, formatMoney } from "../../lib/money";
import type { Invoice, PaymentMethod } from "../../lib/types";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export function RecordPaymentModal({ open, onClose, invoice }: { open: boolean; onClose: () => void; invoice: Invoice }) {
  const { businessId, user } = useApp();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(centsToDollarsString(invoice.balanceDueCents));
      setDate(new Date().toISOString().slice(0, 10));
      setMethod("bank_transfer");
      setReference("");
      setNotes("");
    }
  }, [open, invoice.balanceDueCents]);

  const submit = useAsyncAction(
    async () => {
      if (!businessId || !user) return;
      const amountCents = dollarsToCents(amount);
      await recordPayment(businessId, invoice.id, user.uid, user.email ?? "", { date, amountCents, method, reference, notes });
      onClose();
    },
    { successMessage: "Payment recorded." },
  );

  return (
    <Modal open={open} onClose={onClose} title="Record a payment">
      <p className="mb-4 text-sm text-ink-500">
        Balance due: <span className="font-medium text-ink-800">{formatMoney(invoice.balanceDueCents, invoice.business.currency)}</span>
      </p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit.run();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Amount</label>
            <input className="field-input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="field-label">Date</label>
            <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} required max={new Date().toISOString().slice(0, 10)} />
          </div>
        </div>
        <div>
          <label className="field-label">Method</label>
          <select className="field-input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Reference</label>
          <input className="field-input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Receipt or transaction #" />
        </div>
        <div>
          <label className="field-label">Notes</label>
          <textarea className="field-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submit.pending}>
            {submit.pending && <Spinner className="h-4 w-4" />}
            Record payment
          </button>
        </div>
      </form>
    </Modal>
  );
}
