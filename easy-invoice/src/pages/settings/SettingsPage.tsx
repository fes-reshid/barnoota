import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { FullPageSpinner, Spinner } from "../../components/ui/Spinner";
import { useApp } from "../../app/AppProvider";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { updateBusiness, uploadBusinessLogo } from "../../lib/repo/business";
import type { Business } from "../../lib/types";

const CURRENCIES = ["AUD", "NZD", "USD", "GBP", "EUR", "CAD"];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const { business, businessId } = useApp();
  const [form, setForm] = useState<Business | null>(business);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(business);
  }, [business]);

  const save = useAsyncAction(
    async () => {
      if (!businessId || !form) return;
      await updateBusiness(businessId, form);
    },
    { successMessage: "Business settings saved." },
  );

  const logoUpload = useAsyncAction(async (file: File) => {
    if (!businessId) return;
    await uploadBusinessLogo(businessId, file);
  }, { successMessage: "Logo updated." });

  if (!form) return <FullPageSpinner />;

  const set = <K extends keyof Business>(key: K, value: Business[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <div>
      <PageHeader title="Business Settings" description="These details appear on every invoice and quote you issue." />

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.run();
        }}
      >
        <Section title="Profile">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-100">
              {form.logoUrl ? <img src={form.logoUrl} alt="Logo" className="h-full w-full object-cover" /> : <span className="text-xs text-ink-400">No logo</span>}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) logoUpload.run(file);
                }}
              />
              <button type="button" className="btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={logoUpload.pending}>
                {logoUpload.pending ? <Spinner className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                Upload logo
              </button>
              <p className="mt-1 text-xs text-ink-400">PNG or JPG, square works best.</p>
            </div>
          </div>

          <div>
            <label className="field-label">Business name</label>
            <input className="field-input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Email</label>
              <input type="email" className="field-input" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input className="field-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label">Address</label>
            <input className="field-input mb-2" placeholder="Address line 1" value={form.address.line1} onChange={(e) => set("address", { ...form.address, line1: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <input className="field-input" placeholder="City" value={form.address.city} onChange={(e) => set("address", { ...form.address, city: e.target.value })} />
              <input className="field-input" placeholder="State" value={form.address.state} onChange={(e) => set("address", { ...form.address, state: e.target.value })} />
              <input className="field-input" placeholder="Postcode" value={form.address.postcode} onChange={(e) => set("address", { ...form.address, postcode: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="field-label">ABN</label>
            <input className="field-input max-w-xs" value={form.abn} onChange={(e) => set("abn", e.target.value)} />
          </div>
        </Section>

        <Section title="Currency & tax" description="Controls how every invoice, quote and report calculates and labels tax.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Currency</label>
              <select className="field-input" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Tax rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                className="field-input"
                value={form.taxRatePercent}
                onChange={(e) => set("taxRatePercent", Number(e.target.value))}
                disabled={!form.gstRegistered}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={form.gstRegistered} onChange={(e) => set("gstRegistered", e.target.checked)} className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
            This business is registered for GST
          </label>
          {!form.gstRegistered && (
            <p className="rounded-lg bg-ink-100 p-3 text-xs text-ink-500">
              Invoices will be labelled "Invoice" rather than "Tax Invoice", and no tax will be charged on any line item.
            </p>
          )}
          <div>
            <label className="field-label">Prices entered on invoices are</label>
            <div className="flex gap-2">
              <button type="button" className={`btn-sm ${form.pricesIncludeTax ? "btn-primary" : "btn-secondary"}`} onClick={() => set("pricesIncludeTax", true)}>
                Tax-inclusive
              </button>
              <button type="button" className={`btn-sm ${!form.pricesIncludeTax ? "btn-primary" : "btn-secondary"}`} onClick={() => set("pricesIncludeTax", false)}>
                Tax-exclusive
              </button>
            </div>
          </div>
          <p className="text-xs text-ink-400">
            This app does not verify current tax-invoice or GST requirements for your jurisdiction — please confirm what your invoices legally need with your accountant or the ATO.
          </p>
        </Section>

        <Section title="Invoicing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Invoice number prefix</label>
              <input className="field-input" value={form.invoicePrefix} onChange={(e) => set("invoicePrefix", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Quote number prefix</label>
              <input className="field-input" value={form.quotePrefix} onChange={(e) => set("quotePrefix", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label">Default payment terms (days)</label>
            <input type="number" min={0} className="field-input max-w-xs" value={form.defaultPaymentTermsDays} onChange={(e) => set("defaultPaymentTermsDays", Number(e.target.value))} />
          </div>
          <p className="text-xs text-ink-400">Invoice numbers are allocated automatically and safely when you issue an invoice — they can't be edited here to prevent duplicates.</p>
        </Section>

        <Section title="Bank details" description="Shown in the payment instructions panel on invoices.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Bank name</label>
              <input className="field-input" value={form.bank.bankName} onChange={(e) => set("bank", { ...form.bank, bankName: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Account name</label>
              <input className="field-input" value={form.bank.accountName} onChange={(e) => set("bank", { ...form.bank, accountName: e.target.value })} />
            </div>
            <div>
              <label className="field-label">BSB</label>
              <input className="field-input" value={form.bank.bsb} onChange={(e) => set("bank", { ...form.bank, bsb: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Account number</label>
              <input className="field-input" value={form.bank.accountNumber} onChange={(e) => set("bank", { ...form.bank, accountNumber: e.target.value })} />
            </div>
          </div>
        </Section>

        <Section title="Defaults">
          <div>
            <label className="field-label">Default invoice notes</label>
            <textarea className="field-input" rows={2} value={form.defaultInvoiceNotes} onChange={(e) => set("defaultInvoiceNotes", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Default payment instructions</label>
            <textarea className="field-input" rows={2} value={form.defaultPaymentInstructions} onChange={(e) => set("defaultPaymentInstructions", e.target.value)} />
          </div>
        </Section>

        <Section title="Online payments (optional)" description="Paste a Stripe Payment Link (created in your own Stripe dashboard) to show a 'Pay online' button on invoices. Easy Invoice never touches card details — Stripe hosts the entire checkout.">
          <div>
            <label className="field-label">Stripe payment link URL</label>
            <input className="field-input" placeholder="https://buy.stripe.com/..." value={form.stripePaymentLinkUrl ?? ""} onChange={(e) => set("stripePaymentLinkUrl", e.target.value)} />
          </div>
        </Section>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={save.pending}>
            {save.pending && <Spinner className="h-4 w-4" />}
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
