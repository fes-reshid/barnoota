import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { feeInvoicesRepo, feePaymentsRepo } from '@/lib/services';
import type { FeeInvoice, FeePayment } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  invoice: FeeInvoice | null;
}

export function RecordPaymentModal({ open, onClose, onSaved, invoice }: Props) {
  const { schoolId, currentUser } = useAuth();
  const { showToast } = useToast();
  const balance = invoice ? invoice.amount - invoice.discount - invoice.amountPaid : 0;
  const [amount, setAmount] = useState(balance);
  const [method, setMethod] = useState<FeePayment['method']>('cash');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (invoice) setAmount(invoice.amount - invoice.discount - invoice.amountPaid);
  }, [invoice, open]);

  async function handleSave() {
    if (!invoice || amount <= 0) return;
    setSaving(true);
    try {
      const newPaid = invoice.amountPaid + amount;
      const newStatus: FeeInvoice['status'] = newPaid >= invoice.amount - invoice.discount ? 'paid' : 'partial';
      await feeInvoicesRepo.update(invoice.id, { amountPaid: newPaid, status: newStatus });
      await feePaymentsRepo.create({
        schoolId, invoiceId: invoice.id, studentId: invoice.studentId, amount, method,
        paidAt: new Date().toISOString(), receiptNumber: `RCPT-${Date.now()}`, recordedBy: currentUser?.id ?? '',
      });
      showToast('Payment recorded.');
      onSaved();
      onClose();
    } catch {
      showToast('Could not record payment.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Record payment"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving || amount <= 0}>Record payment</button>
      </>}>
      {invoice && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Balance due: <span className="font-semibold text-slate-800">${balance.toLocaleString()}</span></p>
          <FormField label="Amount">
            <input type="number" min={0} max={balance} className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </FormField>
          <FormField label="Payment method">
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value as FeePayment['method'])}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="mobile_money">Mobile money</option>
            </select>
          </FormField>
        </div>
      )}
    </Modal>
  );
}
