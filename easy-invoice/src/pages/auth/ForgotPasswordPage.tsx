import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { useApp } from "../../app/AppProvider";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { Spinner } from "../../components/ui/Spinner";

export function ForgotPasswordPage() {
  const { resetPassword } = useApp();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useAsyncAction(
    async () => {
      setError(null);
      await resetPassword(email.trim());
      setSent(true);
    },
    { onError: (e) => setError(e instanceof Error ? e.message : "Could not send the reset email.") },
  );

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to choose a new one.">
      {sent ? (
        <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-800">
          If an account exists for {email}, a password reset email is on its way.
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit.run();
          }}
        >
          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submit.pending}>
            {submit.pending && <Spinner className="h-4 w-4" />}
            Send reset link
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-ink-500">
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
