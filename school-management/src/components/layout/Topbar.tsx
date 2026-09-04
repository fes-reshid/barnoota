import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/roles';
import { useToast } from '@/components/ui/Toast';

export function Topbar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    showToast('You have been signed out.', 'info');
    navigate('/login');
  }

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-slate-800 md:text-lg">{title}</h1>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight text-slate-700">{currentUser?.name}</p>
            <p className="text-xs leading-tight text-slate-500">
              {currentUser && ROLE_LABELS[currentUser.role]}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
