import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LogOut, Menu, RotateCcw, Sparkles, X } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { useApp } from "../../app/AppProvider";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { demoResetAll } from "../../lib/demo/repo";

function BrandMark({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={`${name} logo`} className="h-8 w-8 shrink-0 rounded-lg object-cover" />;
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
      {name ? name.trim().charAt(0).toUpperCase() : "E"}
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-100"
            }`
          }
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function AccountSection({ onNavigate }: { onNavigate?: () => void }) {
  const { signOutUser, user, isDemoMode } = useApp();
  const signOutAction = useAsyncAction(async () => signOutUser());

  const resetDemo = () => {
    onNavigate?.();
    if (!window.confirm("Reset the demo? This clears all sample data in this browser and starts fresh.")) return;
    demoResetAll();
    window.location.reload();
  };

  return (
    <div className="border-t border-ink-200 p-3">
      <div className="mb-2 truncate px-2 text-xs text-ink-400">{user?.email}</div>
      {isDemoMode ? (
        <button className="btn-ghost w-full justify-start" onClick={resetDemo}>
          <RotateCcw className="h-4 w-4" /> Reset demo data
        </button>
      ) : (
        <button className="btn-ghost w-full justify-start" onClick={() => signOutAction.run()} disabled={signOutAction.pending}>
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      )}
    </div>
  );
}

function DemoBanner() {
  const { isDemoMode } = useApp();
  if (!isDemoMode) return null;
  return (
    <div className="mb-6 flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <strong>You're viewing a live demo.</strong> Everything here — including any changes you make — is sample data stored only in
        this browser, not a real account. Connect a Firebase project to turn this into a real, secure multi-user app (see the project README).
      </p>
    </div>
  );
}

export function AppShell() {
  const { business } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-ink-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-ink-200 bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-ink-200 px-5 py-4">
          <BrandMark logoUrl={business?.logoUrl ?? null} name={business?.name ?? "Easy Invoice"} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{business?.name || "Easy Invoice"}</p>
            <p className="truncate text-xs text-ink-400">Easy Invoice</p>
          </div>
        </div>
        <NavList />
        <AccountSection />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <BrandMark logoUrl={business?.logoUrl ?? null} name={business?.name ?? "Easy Invoice"} />
          <p className="truncate text-sm font-semibold text-ink-900">{business?.name || "Easy Invoice"}</p>
        </div>
        <button className="rounded-lg p-2 text-ink-600 hover:bg-ink-100" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-200 px-4 py-4">
              <span className="text-sm font-semibold text-ink-900">Menu</span>
              <button className="rounded-full p-1.5 text-ink-500 hover:bg-ink-100" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setDrawerOpen(false)} />
            <AccountSection onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <DemoBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
