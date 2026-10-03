import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoginPage from '@/pages/auth/LoginPage';
import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard';
import SchoolAdminDashboard from '@/pages/schooladmin/SchoolAdminDashboard';
import SchoolLandingPage from '@/pages/public/SchoolLandingPage';

function Home() {
  const { firebaseUser, profile, loading } = useAuth();

  if (loading) return <p className="p-8 text-center text-sm text-slate-500">Loading…</p>;
  if (!firebaseUser || !profile) return <Navigate to="/login" replace />;
  if (profile.isPlatformAdmin) return <SuperAdminDashboard />;
  if (profile.schoolIds?.length) return <SchoolAdminDashboard />;
  return (
    <p className="p-8 text-center text-sm text-slate-500">
      Your account isn't linked to a school yet — contact the platform admin.
    </p>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/s/:slug" element={<SchoolLandingPage />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
