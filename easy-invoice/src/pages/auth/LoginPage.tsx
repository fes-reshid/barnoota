import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { useApp } from "../../app/AppProvider";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { Spinner } from "../../components/ui/Spinner";

function friendlyAuthError(e: unknown): string {
  const code = e instanceof Error ? (e as Error & { code?: string }).code : undefined;
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return e instanceof Error ? e.message : "Could not log in.";
  }
}

export function LoginPage() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = useAsyncAction(
    async () => {
      setError(null);
      await signIn(email.trim(), password);
      navigate("/", { replace: true });
    },
    { onError: (e) => setError(friendlyAuthError(e)) },
  );

  return (
    <AuthLayout title="Log in" subtitle="Welcome back.">
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
        <div>
          <div className="flex items-center justify-between">
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <Link to="/forgot-password" className="mb-1 text-xs font-medium text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input id="password" type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        {error && <p className="field-error">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={submit.pending}>
          {submit.pending && <Spinner className="h-4 w-4" />}
          Log in
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-500">
        New to Easy Invoice?{" "}
        <Link to="/signup" className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
