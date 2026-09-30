import { useState } from "react";
import { AuthLayout } from "./AuthLayout";
import { useApp } from "../../app/AppProvider";
import { useAsyncAction } from "../../lib/useAsyncAction";
import { Spinner } from "../../components/ui/Spinner";

export function OnboardingPage() {
  const { completeOnboarding } = useApp();
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = useAsyncAction(
    async () => {
      setError(null);
      await completeOnboarding(businessName.trim() || "My Business");
    },
    { onError: (e) => setError(e instanceof Error ? e.message : "Could not create your business.") },
  );

  return (
    <AuthLayout title="Let's set up your business" subtitle="You can change everything here later in Business Settings.">
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
          <input id="businessName" className="field-input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="My Business" required autoFocus />
        </div>
        {error && <p className="field-error">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={submit.pending}>
          {submit.pending && <Spinner className="h-4 w-4" />}
          Continue
        </button>
      </form>
    </AuthLayout>
  );
}
