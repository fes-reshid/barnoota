import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, GraduationCap } from 'lucide-react';
import { NAV_BY_ROLE } from '@/lib/nav';
import { ROLE_LABELS } from '@/lib/roles';
import { useAuth } from '@/context/AuthContext';

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  const items = NAV_BY_ROLE[currentUser.role];

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-slate-100 bg-white transition-all duration-200 md:flex ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">Barnoota Campus</p>
            <p className="truncate text-[11px] text-slate-500">{ROLE_LABELS[currentUser.role]}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 text-xs font-medium text-slate-500 hover:bg-slate-50"
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        {!collapsed && 'Collapse'}
      </button>
    </aside>
  );
}
