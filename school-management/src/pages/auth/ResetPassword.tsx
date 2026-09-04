import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ResetPassword() {
  const { confirmPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode') ?? 'demo-code';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(oobCode, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
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
          <h1 className="text-xl font-bold text-slate-900">Choose a new password</h1>
        </div>

        <div className="card p-6">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-brand-600" />
              <p className="text-sm text-slate-600">Your password has been updated.</p>
              <button className="btn-primary mt-2" onClick={() => navigate('/login')}>
                Continue to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="label">New password</label>
                <input
                  id="password"
                  type="password"
                  required
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirm" className="label">Confirm new password</label>
                <input
                  id="confirm"
                  type="password"
                  required
                  className="input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {error && (
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                  {error}
                </div>
              )}
              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset password
              </button>
              <Link to="/login" className="block text-center text-sm text-slate-500 hover:text-slate-700">
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
