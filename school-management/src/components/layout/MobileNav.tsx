import { NavLink } from 'react-router-dom';
import { GraduationCap, X } from 'lucide-react';
import { NAV_BY_ROLE } from '@/lib/nav';
import { useAuth } from '@/context/AuthContext';

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser } = useAuth();
  if (!open || !currentUser) return null;
  const items = NAV_BY_ROLE[currentUser.role];

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-slate-800">Barnoota Campus</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length <= 2}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
