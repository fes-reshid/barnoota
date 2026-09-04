import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email.');
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
          <h1 className="text-xl font-bold text-slate-900">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your account email and we'll send you a reset link.
          </p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-brand-600" />
              <p className="text-sm text-slate-600">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              </p>
              <Link to="/login" className="btn-secondary mt-2">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email address</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.org"
                />
              </div>
              {error && (
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                  {error}
                </div>
              )}
              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Send reset link
              </button>
              <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
