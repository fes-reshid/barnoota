import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { useApp } from "../../app/AppProvider";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { Spinner } from "../../components/ui/Spinner";

function friendlyAuthError(e: unknown): string {
  const code = e instanceof Error ? (e as Error & { code?: string }).code : undefined;
  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists with that email.";
    case "auth/weak-password":
      return "Choose a password with at least 6 characters.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    default:
      return e instanceof Error ? e.message : "Could not create your account.";
  }
}

export function SignupPage() {
  const { signUp } = useApp();
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = useAsyncAction(
    async () => {
      setError(null);
      await signUp(email.trim(), password, businessName.trim() || "My Business");
      navigate("/", { replace: true });
    },
    { onError: (e) => setError(friendlyAuthError(e)) },
  );

  return (
    <AuthLayout title="Create your account" subtitle="Set up Easy Invoice for your business in a minute.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit.run();
        }}
      >
        <div>
          <label className="field-label" htmlFor="businessName">
            Business name
          </label>
          <input id="businessName" className="field-input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Sunrise Cafe Pty Ltd" required />
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input id="password" type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
        </div>
        {error && <p className="field-error">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={submit.pending}>
          {submit.pending && <Spinner className="h-4 w-4" />}
          Create account
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
