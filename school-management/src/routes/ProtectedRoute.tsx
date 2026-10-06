import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import type { Role } from '@/types';
import { homePathForRole } from '@/lib/roles';

export function ProtectedRoute({ allow }: { allow?: Role[] }) {
  const { currentUser, loading, loadError } = useAuth();
  const location = useLocation();

  if (loadError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-slate-600">{loadError}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner label="Loading your account…" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allow && !allow.includes(currentUser.role)) {
    return <Navigate to={homePathForRole(currentUser.role)} replace />;
  }

  return <Outlet />;
}
