import { Receipt, TriangleAlert } from "lucide-react";

export function SetupRequiredPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Easy Invoice</h1>
        </div>
        <div className="card p-6">
          <div className="mb-4 flex items-start gap-3 rounded-lg bg-amber-50 p-4 text-amber-800">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Firebase isn't configured yet</p>
              <p className="mt-1 text-sm">This app needs a Firebase project (Auth + Firestore + Storage) before it can sign anyone in or store any data.</p>
            </div>
          </div>
          <ol className="list-inside list-decimal space-y-2 text-sm text-ink-600">
            <li>
              Create a free project at{" "}
              <a className="font-medium text-brand-700 hover:underline" href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
                console.firebase.google.com
              </a>
              .
            </li>
            <li>Enable Authentication → Sign-in method → Email/Password.</li>
            <li>Create a Firestore database and a default Storage bucket.</li>
            <li>Deploy this app's security rules: firestore.rules and storage.rules (see the README).</li>
            <li>
              Copy <code className="rounded bg-ink-100 px-1 py-0.5">.env.example</code> to <code className="rounded bg-ink-100 px-1 py-0.5">.env</code> and fill in your web app's
              config from Project Settings → General.
            </li>
            <li>Rebuild and redeploy.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
