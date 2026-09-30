import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, Package, Plus } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { useProducts } from "../../lib/dataHooks";
import { useApp } from "../../app/AppProvider";
import { archiveProduct } from "../../lib/repo/products";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { formatMoney } from "../../lib/money";
import { ProductFormModal } from "./ProductFormModal";
import type { Product } from "../../lib/types";

export function ProductsPage() {
  const { businessId, business } = useApp();
  const { data: products, loading } = useProducts();
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = useMemo(() => products.filter((p) => p.archived === showArchived), [products, showArchived]);
  const currency = business?.currency ?? "AUD";

  const archiveAction = useAsyncAction(async (product: Product) => {
    if (!businessId) return;
    await archiveProduct(businessId, product.id, !product.archived);
  });

  return (
    <div>
      <PageHeader
        title="Products & Services"
        description="Your reusable catalogue — pick these straight into invoices and quotes."
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add item
          </button>
        }
      />

      <label className="mb-4 flex w-fit items-center gap-2 text-sm text-ink-500">
        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
        Show archived
      </label>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={showArchived ? "No archived items" : "No items yet"}
          description="Add the products or services you sell so you can add them to invoices in one click."
          action={
            !showArchived && (
              <button className="btn-primary" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" /> Add item
              </button>
            )
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-ink-100">
            {filtered.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-50 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800">{p.name}</p>
                  <p className="truncate text-xs text-ink-400">
                    {formatMoney(p.unitPriceCents, currency)} / {p.unit} · {p.taxTreatment === "taxable" ? "Taxable" : "GST-free"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => archiveAction.run(p)} title={p.archived ? "Restore" : "Archive"}>
                    {p.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ProductFormModal open={formOpen} onClose={() => setFormOpen(false)} product={editing} />
    </div>
  );
}
