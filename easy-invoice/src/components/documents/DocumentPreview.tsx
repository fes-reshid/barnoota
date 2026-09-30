import { formatMoney } from "../../lib/money";
import { documentTitle, type DocumentView } from "../../lib/docView";

function fmtAddress(a: { line1: string; line2: string; city: string; state: string; postcode: string; country: string }) {
  const lines = [a.line1, a.line2].filter(Boolean);
  const cityLine = [a.city, a.state, a.postcode].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (a.country && a.country !== "Australia") lines.push(a.country);
  return lines;
}

export function DocumentPreview({ doc }: { doc: DocumentView }) {
  const title = documentTitle(doc.kind, doc.business.gstRegistered);
  const gstLabel = doc.business.gstRegistered ? "GST" : "Tax";

  return (
    <div className="mx-auto w-full max-w-[210mm] rounded-2xl border border-ink-200 bg-white p-6 text-ink-800 shadow-sm sm:p-10">
      <div className="flex flex-col justify-between gap-6 border-b border-ink-200 pb-6 sm:flex-row">
        <div className="flex items-start gap-3">
          {doc.business.logoUrl && <img src={doc.business.logoUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />}
          <div>
            <p className="text-lg font-semibold text-ink-900">{doc.business.name || "Your business"}</p>
            {doc.business.abn && <p className="text-xs text-ink-500">ABN {doc.business.abn}</p>}
            {fmtAddress(doc.business.address).map((l, i) => (
              <p key={i} className="text-xs text-ink-500">
                {l}
              </p>
            ))}
            {doc.business.email && <p className="text-xs text-ink-500">{doc.business.email}</p>}
            {doc.business.phone && <p className="text-xs text-ink-500">{doc.business.phone}</p>}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <h2 className="text-2xl font-bold uppercase tracking-wide text-brand-700">{title}</h2>
          <p className="text-sm text-ink-500">{doc.documentNumber}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-ink-400">{doc.statusLabel}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase text-ink-400">Bill to</p>
          <p className="mt-1 text-sm font-medium text-ink-800">{doc.customer.name || "—"}</p>
          {doc.customer.contactPerson && <p className="text-xs text-ink-500">Attn: {doc.customer.contactPerson}</p>}
          {fmtAddress(doc.customer.billingAddress).map((l, i) => (
            <p key={i} className="text-xs text-ink-500">
              {l}
            </p>
          ))}
          {doc.customer.abn && <p className="text-xs text-ink-500">ABN {doc.customer.abn}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-ink-400">Issue date</p>
          <p className="text-sm text-ink-700">{doc.issueDate}</p>
          <p className="mt-2 text-xs font-semibold uppercase text-ink-400">{doc.secondDateLabel}</p>
          <p className="text-sm text-ink-700">{doc.secondDate}</p>
        </div>
        {doc.poNumber && (
          <div>
            <p className="text-xs font-semibold uppercase text-ink-400">Reference / PO</p>
            <p className="text-sm text-ink-700">{doc.poNumber}</p>
          </div>
        )}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase text-ink-400">
              <th className="py-2 pr-2">Description</th>
              <th className="px-2 py-2 text-right">Qty</th>
              <th className="px-2 py-2 text-right">Unit price</th>
              <th className="px-2 py-2 text-right">Discount</th>
              <th className="py-2 pl-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {doc.lineItems.map((li) => (
              <tr key={li.id} className="border-b border-ink-100">
                <td className="py-2.5 pr-2 text-ink-700">{li.description || "—"}</td>
                <td className="px-2 py-2.5 text-right text-ink-600">{li.quantity}</td>
                <td className="px-2 py-2.5 text-right text-ink-600">{formatMoney(li.unitPriceCents, doc.currency)}</td>
                <td className="px-2 py-2.5 text-right text-ink-600">{li.discountCents > 0 ? formatMoney(li.discountCents, doc.currency) : "—"}</td>
                <td className="py-2.5 pl-2 text-right font-medium text-ink-800">{formatMoney(li.totalCents, doc.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-ink-600">
            <span>Subtotal</span>
            <span>{formatMoney(doc.subtotalCents, doc.currency)}</span>
          </div>
          {doc.discountTotalCents > 0 && (
            <div className="flex justify-between text-ink-600">
              <span>Discount</span>
              <span>-{formatMoney(doc.discountTotalCents, doc.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-ink-600">
            <span>{gstLabel}</span>
            <span>{formatMoney(doc.taxTotalCents, doc.currency)}</span>
          </div>
          <div className="flex justify-between border-t border-ink-200 pt-1.5 text-base font-semibold text-ink-900">
            <span>Total</span>
            <span>{formatMoney(doc.totalCents, doc.currency)}</span>
          </div>
          {typeof doc.amountPaidCents === "number" && (
            <>
              <div className="flex justify-between text-ink-600">
                <span>Amount paid</span>
                <span>-{formatMoney(doc.amountPaidCents, doc.currency)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-brand-700">
                <span>Balance due</span>
                <span>{formatMoney(doc.balanceDueCents ?? 0, doc.currency)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {doc.paymentInstructions && (
        <div className="mt-6 rounded-lg bg-brand-50 p-4 text-xs text-brand-800">
          <p className="mb-1 font-semibold uppercase tracking-wide">Payment instructions</p>
          <p className="whitespace-pre-wrap">{doc.paymentInstructions}</p>
          {doc.business.bank.bsb && (
            <p className="mt-2">
              {doc.business.bank.bankName} · {doc.business.bank.accountName} · BSB {doc.business.bank.bsb} · Acc {doc.business.bank.accountNumber}
            </p>
          )}
        </div>
      )}

      {doc.notes && (
        <div className="mt-4 text-xs text-ink-500">
          <p className="mb-1 font-semibold uppercase tracking-wide text-ink-400">Notes</p>
          <p className="whitespace-pre-wrap">{doc.notes}</p>
        </div>
      )}
    </div>
  );
}
