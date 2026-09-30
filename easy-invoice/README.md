# Easy Invoice

A complete, mobile-friendly invoicing app for a small business: customers, invoices,
quotes, a product/service catalogue, payments, reports, and business settings —
with an editable business name and logo.

Live at **https://diinislaam.com/invoice/** (built output committed to the repo's
top-level `invoice/` folder, since this site is plain static hosting with no
build step — see "Deployment" below).

## Demo mode (what's live right now)

No Firebase project is configured yet, so the deployed site currently runs in
**Demo Mode**: the exact same app and code paths, but with a localStorage-backed
store instead of Firestore. Visiting the site drops you straight onto a
pre-populated dashboard — no sign-up, no login — clearly labelled with a green
"You're viewing a live demo" banner. Every feature works (create customers,
issue invoices, record payments, generate PDFs, quotes, reports, CSV export);
the only difference is that data lives only in that one browser, not a shared
account, and a **"Reset demo data"** button clears it and reseeds fresh sample
data.

**This flips to the real, secure, multi-tenant Firebase backend automatically**
the moment a real Firebase project is configured (section 1 below) and the app
is rebuilt — `isDemoMode` in `src/lib/firebase.ts` is simply `!isFirebaseConfigured`,
and every repo function (`src/lib/repo/*.ts`) branches on it. No other code
changes are needed to go from "demo you can click around" to "real app with
real accounts" — just add the `.env` values, deploy the security rules, and
run `npm run build` again.

See `src/lib/demo/` for the demo store/repo implementation, and
`scripts/demo-mode.smoke.mjs` for the browser test that verifies it (auto-seed
on first visit, data persists across reloads, new invoices get their own
sequential numbers, reset re-seeds cleanly).

## Tech stack

- **React 19 + TypeScript + Vite**, Tailwind CSS v4 for styling
- **Firebase**: Authentication (email/password), Firestore (data), Storage (logo uploads)
- **@react-pdf/renderer** for PDF generation (invoices, credit notes, quotes)
- **decimal.js** + integer-cents storage for exact money math (no floating-point drift)
- **Vitest** for unit tests, **Firebase Emulator Suite** + `@firebase/rules-unit-testing`
  for security-rules and real-concurrency tests
- **react-router-dom** (`HashRouter`, so the SPA works from a static file host with
  no server-side rewrite rule)

## 1. Firebase project setup (required before this app can do anything)

The app needs a Firebase project. Nothing works — sign-up, data, logo upload —
until this is done.

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com) (the free Spark plan is enough).
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → create a database (any region; start in production mode —
   the rules in this repo handle access control).
4. **Storage** → create a default bucket (used for business logo uploads).
5. Project settings → General → "Your apps" → add a **Web app**, copy its config.
6. In `easy-invoice/`, copy `.env.example` to `.env` and paste that config in:
   ```sh
   cp .env.example .env
   ```
   These `VITE_FIREBASE_*` values are the public web config Firebase expects to ship
   to the browser — they are **not secrets**. All access control is enforced
   server-side by `firestore.rules` / `storage.rules`, not by hiding this config.
7. Install the Firebase CLI and deploy the security rules and indexes:
   ```sh
   npm install -g firebase-tools   # or use `npx firebase` for every command below
   firebase login
   firebase deploy --only firestore:rules,firestore:indexes,storage --project <your-project-id>
   ```
   **This step is not optional.** Tenant isolation (one business can never read or
   write another business's data) is enforced entirely by `firestore.rules` — it is
   not just hidden by the UI. Skipping this step leaves Firestore with no
   protection.

## 2. Local development

```sh
cd easy-invoice
npm install
npm run dev
```

Open the printed URL (something like `http://localhost:5173/invoice/`).

### Developing against the Firebase Emulator Suite (no real project needed)

For local development/testing without touching a real Firebase project:

```sh
firebase emulators:start          # starts Auth + Firestore + Storage emulators + a UI at :4000
```

In another terminal, set `.env.local`:
```
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_PROJECT_ID=easy-invoice-emulator-tests
VITE_FIREBASE_AUTH_DOMAIN=easy-invoice-emulator-tests.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=easy-invoice-emulator-tests.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:0
VITE_USE_FIREBASE_EMULATORS=true
```
then `npm run dev`. Data created this way lives only in the emulator's memory and
disappears when it stops.

## 3. Testing

```sh
npm test                 # unit tests: money/tax/discount math, payment allocation,
                          # derived status, and a simulated-concurrency numbering test
                          # (26 tests — no external services needed)

npm run test:emulator    # security-rules + REAL concurrent-numbering tests against
                          # the Firebase emulator (7 tests). Spins the emulator up
                          # and down for you.
```

See **"Test results"** below for what these actually verified, including two real
bugs the emulator tests and a manual browser run caught and that are now fixed.

### End-to-end smoke scripts (Playwright, optional)

These drive a real browser against the app + emulator to exercise full user flows —
not part of `npm test`, but how the flows below were actually verified:

```sh
firebase emulators:start &            # terminal 1
npm run dev -- --port 5183 --strictPort &   # terminal 2, with .env.local from above
npm run smoke:golden-path             # terminal 3: signup → settings → customer →
                                       #   invoice → issue → PDF → payment → paid
npm run smoke:pdf-multipage           # 27-line invoice with a long description →
                                       #   confirms the PDF paginates correctly
node scripts/quote-flow.smoke.mjs     # quote → send → accept → convert → issue
```

## 4. Building & deploying

This repository is a plain static site served by GitHub Pages straight from the
repo root — there's no CI build step for the rest of the site, so **the production
build output is committed**, the same way the site's other mini-apps work.

```sh
npm run build
```

`vite.config.ts` sets `base: '/invoice/'` and outputs to `../invoice` (i.e.
`<repo-root>/invoice/`), so `npm run build` regenerates exactly the folder GitHub
Pages serves at `/invoice/`. After building, commit the changed files under
`invoice/` along with your source changes.

To point this at a different Firebase project or host it elsewhere, only the
`.env` values and (if not serving at `/invoice/`) the `base` in `vite.config.ts`
need to change — everything else is portable.

## 5. Data model & security

- `businesses/{id}` — one document per business (name, logo, ABN, currency, GST
  settings, invoice numbering prefix, bank details, `members: {uid: role}`).
- `businesses/{id}/customers`, `/products`, `/invoices`, `/quotes`, `/payments`,
  `/auditLog`, `/counters` — all scoped under the business.
- **Tenant isolation** (`firestore.rules`): every rule checks
  `request.auth.uid in business(businessId).data.members` — enforced by
  Firestore itself, not by hiding UI. See `tests/emulator/security-rules.test.ts`
  for a suite that proves one business's user cannot read or write another's data,
  and cannot tamper with a frozen (issued) invoice's line items or total.
- **Atomic, gap-free invoice/quote numbering** (`src/lib/repo/numbering.ts`,
  `issueInvoice`/`sendQuote`): a Firestore transaction reads the business's counter
  document and writes its increment in one atomic step. Firestore's transaction
  layer — not the security rules — is what guarantees two concurrent "Issue" clicks
  can never produce the same invoice number; see the design note at the top of the
  `counters` rule block in `firestore.rules` for why the rule deliberately does
  *not* also re-validate the increment (doing so broke retry-on-conflict — see
  "Test results").
- **Issued documents are frozen**: once an invoice/quote leaves `draft`, the rules
  reject any write that changes its `lineItems`, `customer`, or `totalCents` —
  only status/payment/void bookkeeping fields may still change. Corrections to an
  issued invoice go through **Create credit note** (mirrors the original invoice's
  lines with negated amounts, linked via `relatedInvoiceId`), never by editing it.
- **Money** is stored as integer cents everywhere (`src/lib/money.ts`), with
  `decimal.js` used only for the qty × price / percentage arithmetic before
  rounding half-up back to a whole cent — this avoids the classic
  `0.1 + 0.2 !== 0.3` floating-point trap entirely (see `money.test.ts`).

## 6. Demo data

From an empty Dashboard, **"Load sample data"** creates three fictional customers,
two catalogue items, a demo invoice (issued, 40% paid), and a demo quote — all
flagged `isDemo: true`. Demo records:
- are labelled "(Demo)" throughout the UI,
- are **excluded from Dashboard and Reports totals by default** (an "Include demo
  data" checkbox opts back in), so they can never be mistaken for real revenue,
- can be deleted (customers/products only — see `firestore.rules`) to reset.

## 7. Integrations that still require credentials

These are intentionally **not wired to a live provider** — the app never claims to
have done something it hasn't:

| Integration | Status | What's needed |
|---|---|---|
| **Firebase** (auth, data, logo storage) | Required for the app to run at all | A Firebase project — see section 1 |
| **Sending email** (invoices/reminders) | Not connected. "Send by email" shows a preview you can edit, then either opens your own email client via `mailto:` (PDF attach is manual) or, if configured, calls your own send endpoint. It **never shows a "sent" success message unless an email actually was sent.** | Set `VITE_SEND_EMAIL_FUNCTION_URL` to an HTTPS endpoint (e.g. a Cloud Function) that accepts `{to, subject, body}` and sends via a provider such as Resend, SendGrid, Postmark, or Mailgun — bring your own API key for that provider. |
| **Online card payments** | Optional, off by default. If a business pastes a **Stripe Payment Link** URL (created in their own Stripe dashboard — no code) into Business Settings, invoices show a "Pay online" button linking straight to it. Card details never touch this app; Stripe hosts the entire checkout. | A Stripe account, to generate the Payment Link. No API key is stored in this app. |

## 8. What's implemented vs. simplified

Implemented in full: business settings (incl. logo upload), customers (CRUD,
archive, search, per-customer invoice/payment history), invoice editor with live
preview, draft/issue/duplicate/void-with-reason, credit notes, decimal-safe
tax-inclusive/exclusive calculation with per-line discounts, partial/full payment
recording with overpayment prevention, derived Overdue status, quotes with
expiry/accept/decline/convert-to-invoice, a reusable product/service catalogue,
a dashboard, date-filtered reports with CSV export, responsive nav (sidebar on
desktop, a slide-in drawer on mobile), audit history per invoice, sign-up/
login/logout/password reset, and server-enforced multi-tenancy.

Known simplification: one business per user account (no multi-business switcher,
no inviting additional staff members to a business yet — the data model already
supports a `members` map with roles, so this is a UI addition, not a schema
change).

## 9. Test results (as of this build)

```
$ npm test
 Test Files  2 passed (2)
      Tests  26 passed (26)      # money.test.ts + numbering.simulated.test.ts

$ npm run test:emulator
 Test Files  2 passed (2)
      Tests  7 passed (7)        # security-rules.test.ts + numbering-concurrency.test.ts
```

Manual verification, driven end-to-end through a real Chromium browser against the
Firebase emulator (`scripts/*.smoke.mjs`):
- **Golden path**: sign up → configure business (GST on, bank details) → add a
  customer → create a 2-line invoice → issue it (allocated `INV-0001`, correct
  10% GST breakdown on tax-inclusive pricing) → download a valid PDF → record a
  payment → invoice flips to **Paid** with a **$0.00** balance.
- **Multi-page PDF**: a 27-line invoice with one long, repeated-paragraph
  description produced a valid 2-page PDF that breaks cleanly between rows
  (no row split across the page boundary) with correct running headers/footers
  ("Page 1 of 2", "Page 2 of 2") and the totals block landing intact on the
  final page.
- **Quote lifecycle**: create a quote → send it (`QUO-0001` allocated) → mark
  accepted → convert to invoice (customer, line items, and notes carried over
  with zero re-entry, quote linked via `convertedInvoiceId`) → issue the
  resulting invoice → original quote shows status **Converted**.
- Refreshing mid-flow preserved all data (Firestore-backed, not client state).
- A second account could not see the first account's customers or invoices
  (see the automated security-rules tests above for the enforced version of
  this check).
- **Demo mode** (`scripts/demo-mode.smoke.mjs`, run against a build with no
  Firebase env configured): visiting the site with no prior state lands
  straight on a pre-seeded dashboard with no login step; all data survives a
  full page reload (localStorage); a newly created invoice gets its own
  correct sequential number (`INV-0002` alongside the seeded `INV-0001`); and
  "Reset demo data" clears everything and re-seeds cleanly.

**Four real bugs were found and fixed by this testing, not just by reading the
code:**
1. Both the invoice and quote editors initialized a `useState` flag backwards,
   so a brand-new document's issue/due (or issue/expiry) dates were silently
   never populated — only caught by actually opening "New invoice" in a browser.
2. "Issue invoice" read the just-created draft's id from React component state
   immediately after awaiting the save — a classic stale-closure bug, since a
   state update isn't visible inside the very closure that triggered it. Fixed
   by having the save function return the id directly instead of reading it
   back from state.
3. (Caught by the emulator tests, not the browser) The original `counters`
   security rule additionally validated `newSeq == oldSeq + 1`. That's
   redundant with the transaction's own guarantee and actively harmful: a
   losing transaction's retry gets rejected as `PERMISSION_DENIED` by that
   rule, which the Firestore SDK — correctly — does *not* auto-retry the way
   it retries a genuine write conflict (`ABORTED`). Removed the redundant
   check; membership is the only thing the rule needs to gate.
4. (Caught while verifying Demo Mode) The Dashboard, Reports, and Payments
   pages default to *excluding* records flagged `isDemo` from their totals —
   correct for a real account that clicked "Load sample data" to explore the
   app alongside its real invoices, but every record in a genuine Demo Mode
   account inherits `isDemo: true` from the business itself, so with that
   same default the dashboard looked permanently empty no matter how much
   demo data existed. Fixed by defaulting that filter to "include" whenever
   the account itself is a demo account (`isDemoMode` from `useApp()`).

Not run in this environment: this sandbox's egress policy blocks the one-time
emulator binary download from `firebase-public.firebaseio.com` on a clean
machine — `npm run test:emulator` needs that download to succeed once (it's
cached after). It ran successfully here because a prior attempt had already
cached the emulator jar; on a machine with normal internet access this is a
non-issue.
