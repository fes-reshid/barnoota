import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, ArchiveRestore, Plus, Search, Users } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { useCustomers } from "../../lib/dataHooks";
import { useApp } from "../../app/AppProvider";
import { archiveCustomer } from "../../lib/repo/customers";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { CustomerFormModal } from "./CustomerFormModal";
import type { Customer } from "../../lib/types";

export function CustomersPage() {
  const { businessId } = useApp();
  const { data: customers, loading } = useCustomers();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers
      .filter((c) => c.archived === showArchived)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q));
  }, [customers, search, showArchived]);

  const archiveAction = useAsyncAction(async (customer: Customer) => {
    if (!businessId) return;
    await archiveCustomer(businessId, customer.id, !customer.archived);
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage the people and businesses you invoice."
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add customer
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input className="field-input pl-9" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-500">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
          Show archived
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={showArchived ? "No archived customers" : "No customers yet"}
          description="Add your first customer to start creating invoices and quotes for them."
          action={
            !showArchived && (
              <button className="btn-primary" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" /> Add customer
              </button>
            )
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-ink-100">
            {filtered.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-50 sm:px-5">
                <Link to={`/customers/${c.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800">
                    {c.name} {c.isDemo && <span className="ml-1 text-xs font-normal text-ink-400">(Demo)</span>}
                  </p>
                  <p className="truncate text-xs text-ink-400">{c.email || c.phone || "No contact details"}</p>
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => {
                      setEditing(c);
                      setFormOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => archiveAction.run(c)} title={c.archived ? "Restore" : "Archive"}>
                    {c.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CustomerFormModal open={formOpen} onClose={() => setFormOpen(false)} customer={editing} />
    </div>
  );
}
