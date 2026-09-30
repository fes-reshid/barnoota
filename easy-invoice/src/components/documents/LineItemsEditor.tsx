import { Plus, Trash2 } from "lucide-react";
import { blankRawLine, type RawLine } from "../../lib/repo/invoices";
import { calculateLine, centsToDollarsString, dollarsToCents, formatMoney } from "../../lib/money";
import type { Product } from "../../lib/types";

export function LineItemsEditor({
  lines,
  onChange,
  products,
  taxRatePercent,
  pricesIncludeTax,
  gstRegistered,
  currency,
}: {
  lines: RawLine[];
  onChange: (lines: RawLine[]) => void;
  products: Product[];
  taxRatePercent: number;
  pricesIncludeTax: boolean;
  gstRegistered: boolean;
  currency: string;
}) {
  const update = (id: string, patch: Partial<RawLine>) => {
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const remove = (id: string) => {
    onChange(lines.filter((l) => l.id !== id));
  };

  const applyProduct = (id: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      update(id, { productId: null });
      return;
    }
    update(id, {
      productId: product.id,
      description: product.description ? `${product.name} — ${product.description}` : product.name,
      unitPriceCents: product.unitPriceCents,
      taxTreatment: product.taxTreatment,
    });
  };

  return (
    <div className="space-y-3">
      {lines.map((line) => {
        const calc = calculateLine(line, taxRatePercent, pricesIncludeTax);
        return (
          <div key={line.id} className="card space-y-3 p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                {products.length > 0 && (
                  <select className="field-input" value={line.productId ?? ""} onChange={(e) => applyProduct(line.id, e.target.value)}>
                    <option value="">Custom line item...</option>
                    {products
                      .filter((p) => !p.archived)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatMoney(p.unitPriceCents, currency)}/{p.unit})
                        </option>
                      ))}
                  </select>
                )}
                <textarea
                  className="field-input"
                  rows={2}
                  placeholder="Description"
                  value={line.description}
                  onChange={(e) => update(line.id, { description: e.target.value })}
                />
              </div>
              <button type="button" className="btn-ghost btn-sm mt-1 text-red-500 hover:bg-red-50" onClick={() => remove(line.id)} aria-label="Remove line">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <div>
                <label className="field-label">Qty</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  className="field-input"
                  value={line.quantity}
                  onChange={(e) => update(line.id, { quantity: Math.max(0, Number(e.target.value)) })}
                />
              </div>
              <div>
                <label className="field-label">Unit price</label>
                <input
                  className="field-input"
                  inputMode="decimal"
                  defaultValue={centsToDollarsString(line.unitPriceCents)}
                  onBlur={(e) => update(line.id, { unitPriceCents: dollarsToCents(e.target.value) })}
                />
              </div>
              <div>
                <label className="field-label">Discount</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min={0}
                    className="field-input"
                    value={line.discountValue}
                    onChange={(e) => update(line.id, { discountValue: Math.max(0, Number(e.target.value)) })}
                  />
                  <select className="field-input w-16 px-1" value={line.discountType} onChange={(e) => update(line.id, { discountType: e.target.value as "percent" | "fixed" })}>
                    <option value="percent">%</option>
                    <option value="fixed">$</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="field-label">Tax</label>
                <select className="field-input" value={line.taxTreatment} onChange={(e) => update(line.id, { taxTreatment: e.target.value as "taxable" | "exempt" })} disabled={!gstRegistered}>
                  <option value="taxable">Taxable</option>
                  <option value="exempt">Exempt</option>
                </select>
              </div>
              <div>
                <label className="field-label">Amount</label>
                <p className="pt-2 text-right text-sm font-semibold text-ink-800 sm:text-left">{formatMoney(calc.totalCents, currency)}</p>
              </div>
            </div>
          </div>
        );
      })}

      <button type="button" className="btn-secondary" onClick={() => onChange([...lines, blankRawLine()])}>
        <Plus className="h-4 w-4" /> Add line
      </button>
    </div>
  );
}
