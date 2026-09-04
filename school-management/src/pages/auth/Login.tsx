import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { DEMO_ACCOUNTS, homePathForRole } from '@/lib/roles';
import { isFirebaseConfigured } from '@/firebase/config';

export default function Login() {
  const { currentUser, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (currentUser) {
    const from = (location.state as { from?: Location })?.from?.pathname;
    return <Navigate to={from || homePathForRole(currentUser.role)} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(homePathForRole(user.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Barnoota Campus</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your school management account</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.org"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="label">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-brand-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        {!isFirebaseConfigured && (
          <div className="card mt-4 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Demo mode — try any role
            </p>
            <p className="mb-3 text-xs text-slate-500">
              No Firebase project is configured yet, so the app runs on local demo data. Use any password
              (4+ characters) with one of the accounts below.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  className="btn-secondary justify-start text-left"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('demo1234');
                  }}
                >
                  <span className="truncate">
                    <span className="block font-medium">{acc.label}</span>
                    <span className="block text-xs text-slate-400">{acc.email}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
