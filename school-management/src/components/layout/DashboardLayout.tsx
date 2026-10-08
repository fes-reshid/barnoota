import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { PageTitleProvider, usePageTitleValue } from '@/context/PageTitleContext';
import { useMySchool } from '@/lib/useMySchool';
import { applyAppTheme } from '@/lib/appTheme';

function LayoutBody() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = usePageTitleValue();
  const { school } = useMySchool();

  // Repaints the whole app (sidebar, buttons, badges — anything using the
  // `brand-*` color scale) to this school's chosen theme the moment it's
  // known, and back to the default the moment they sign out of a themed
  // school (e.g. a super admin navigating around has no school at all).
  useEffect(() => {
    applyAppTheme(school?.theme);
  }, [school?.theme]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout() {
  return (
    <PageTitleProvider>
      <LayoutBody />
    </PageTitleProvider>
  );
}
