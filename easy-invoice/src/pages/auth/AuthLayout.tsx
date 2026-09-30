import type { ReactNode } from "react";
import { Receipt } from "lucide-react";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Easy Invoice</h1>
        </div>
        <div className="card p-6">
          <h2 className="mb-1 text-lg font-semibold text-ink-900">{title}</h2>
          {subtitle && <p className="mb-5 text-sm text-ink-500">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
