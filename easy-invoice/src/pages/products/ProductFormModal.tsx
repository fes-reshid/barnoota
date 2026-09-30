import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { createProduct, updateProduct, blankProduct } from "../../lib/repo/products";
import { useApp } from "../../app/AppProvider";
import { centsToDollarsString, dollarsToCents } from "../../lib/money";
import type { Product, TaxTreatment } from "../../lib/types";

const UNITS = ["item", "hour", "day", "session", "month", "kg", "unit"];

export function ProductFormModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}) {
  const { businessId } = useApp();
  const [form, setForm] = useState<Omit<Product, "id">>(blankProduct());
  const [priceInput, setPriceInput] = useState("0.00");

  useEffect(() => {
    if (open) {
      const base = product ? { ...product } : blankProduct();
      setForm(base);
      setPriceInput(centsToDollarsString(base.unitPriceCents));
    }
  }, [open, product]);

  const submit = useAsyncAction(
    async () => {
      if (!businessId) return;
      if (!form.name.trim()) throw new Error("A name is required.");
      const payload = { ...form, unitPriceCents: dollarsToCents(priceInput) };
      if (product) await updateProduct(businessId, product.id, payload);
      else await createProduct(businessId, payload);
      onClose();
    },
    { successMessage: product ? "Item updated." : "Item added." },
  );

  return (
    <Modal open={open} onClose={onClose} title={product ? "Edit item" : "Add item"} maxWidth="max-w-lg">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit.run();
        }}
      >
        <div>
          <label className="field-label">Name</label>
          <input className="field-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required autoFocus />
        </div>
        <div>
          <label className="field-label">Description</label>
          <textarea className="field-input" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Default unit price</label>
            <input className="field-input" inputMode="decimal" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Unit</label>
            <select className="field-input" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="field-label">Default tax treatment</label>
          <select className="field-input" value={form.taxTreatment} onChange={(e) => setForm((f) => ({ ...f, taxTreatment: e.target.value as TaxTreatment }))}>
            <option value="taxable">Taxable</option>
            <option value="exempt">GST-free / exempt</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submit.pending}>
            {submit.pending && <Spinner className="h-4 w-4" />}
            {product ? "Save changes" : "Add item"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
