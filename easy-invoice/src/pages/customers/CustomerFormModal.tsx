import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { createCustomer, updateCustomer, blankCustomer } from "../../lib/repo/customers";
import { useApp } from "../../app/AppProvider";
import type { Customer, CustomerType } from "../../lib/types";

export function CustomerFormModal({
  open,
  onClose,
  customer,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSaved?: (id: string) => void;
}) {
  const { businessId } = useApp();
  const [form, setForm] = useState<Omit<Customer, "id">>(blankCustomer());

  useEffect(() => {
    if (open) setForm(customer ? { ...customer } : blankCustomer());
  }, [open, customer]);

  const submit = useAsyncAction(
    async () => {
      if (!businessId) return;
      if (!form.name.trim()) throw new Error("A name is required.");
      let id: string;
      if (customer) {
        await updateCustomer(businessId, customer.id, form);
        id = customer.id;
      } else {
        id = await createCustomer(businessId, form);
      }
      onSaved?.(id);
      onClose();
    },
    { successMessage: customer ? "Customer updated." : "Customer added." },
  );

  return (
    <Modal open={open} onClose={onClose} title={customer ? "Edit customer" : "Add customer"} maxWidth="max-w-xl">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit.run();
        }}
      >
        <div className="flex gap-2">
          {(["business", "individual"] as CustomerType[]).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setForm((f) => ({ ...f, type: t }))}
              className={`btn-sm ${form.type === t ? "btn-primary" : "btn-secondary"}`}
            >
              {t === "business" ? "Business" : "Individual"}
            </button>
          ))}
        </div>

        <div>
          <label className="field-label">{form.type === "business" ? "Business name" : "Full name"}</label>
          <input className="field-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required autoFocus />
        </div>

        {form.type === "business" && (
          <div>
            <label className="field-label">Contact person</label>
            <input className="field-input" value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Email</label>
            <input type="email" className="field-input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input className="field-input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="field-label">Billing address</label>
          <input className="field-input mb-2" placeholder="Address line 1" value={form.billingAddress.line1} onChange={(e) => setForm((f) => ({ ...f, billingAddress: { ...f.billingAddress, line1: e.target.value } }))} />
          <input className="field-input mb-2" placeholder="Address line 2 (optional)" value={form.billingAddress.line2} onChange={(e) => setForm((f) => ({ ...f, billingAddress: { ...f.billingAddress, line2: e.target.value } }))} />
          <div className="grid grid-cols-3 gap-2">
            <input className="field-input" placeholder="City" value={form.billingAddress.city} onChange={(e) => setForm((f) => ({ ...f, billingAddress: { ...f.billingAddress, city: e.target.value } }))} />
            <input className="field-input" placeholder="State" value={form.billingAddress.state} onChange={(e) => setForm((f) => ({ ...f, billingAddress: { ...f.billingAddress, state: e.target.value } }))} />
            <input className="field-input" placeholder="Postcode" value={form.billingAddress.postcode} onChange={(e) => setForm((f) => ({ ...f, billingAddress: { ...f.billingAddress, postcode: e.target.value } }))} />
          </div>
        </div>

        <div>
          <label className="field-label">ABN (if applicable)</label>
          <input className="field-input" value={form.abn} onChange={(e) => setForm((f) => ({ ...f, abn: e.target.value }))} />
        </div>

        <div>
          <label className="field-label">Notes</label>
          <textarea className="field-input" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submit.pending}>
            {submit.pending && <Spinner className="h-4 w-4" />}
            {customer ? "Save changes" : "Add customer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
