# School Platform

A multi-tenant school management platform: you (the platform admin) create
schools, each school gets its own admin who customizes their branding (logo,
theme color, name/contact info) and manages their own classes (e.g.
"Tuhfatul Atfaal"). Every school's data is isolated — enforced server-side
by `firestore.rules`, not just hidden in the UI.

This is a **separate Firebase project** from the one behind diinislaam.com's
existing apps (`diinislaam-8fdeb`). Keeping it separate means nothing here
can ever touch your live site's existing student/teacher data, even by
mistake.

## How it works

- `/schools/{slug}` — one document per school, keyed by its URL slug. Holds
  branding (logo, color, welcome text), contact info, subscription plan, and
  a `members` map (`{ uid: role }`) that Firestore rules check on every
  read/write.
- `/schools/{slug}/classes/{classId}` — a school's classes (e.g. "Tuhfatul
  Atfaal", "Seerah"). Public to view, writable only by that school's members.
- `/users/{uid}` — a signed-in user's own profile: which school(s) they
  belong to, and whether they're a platform admin. A user can only ever
  write their *own* profile doc, and can never set `isPlatformAdmin: true`
  themselves.
- `/s/:slug` is a public page (no login required) showing that school's
  branding and class list — this is the "integrate into their own website"
  piece: the school links to this URL from their own site, or embeds it as
  a button.

## Setup

1. Create a **new** Firebase project (Console → Add project). Enable:
   - **Authentication** → Sign-in method → Email/Password
   - **Firestore Database** (production mode, any region)
   - **Storage** (needs the Blaze pay-as-you-go plan)
2. Register a Web app in that project, copy its config into `.env.local`
   (copy `.env.example` first).
3. Deploy the security rules (from this folder):
   ```
   npx firebase-tools deploy --only firestore:rules,storage --project <your-project-id>
   ```
4. **Bootstrap yourself as the first platform admin** — there's no self-serve
   way to do this on purpose (nobody should be able to grant themselves
   super-admin powers from the browser):
   1. Sign up / sign in once through the app's login screen using a
      throwaway password (any password — you'll set a real one in the
      console). This creates your `/users/{uid}` profile automatically.
   2. In the Firebase Console → Firestore → `users` → your document, edit
      `isPlatformAdmin` from `false` to `true`.
   3. Reload the app — you'll now see the Super Admin "Schools" dashboard.

## Local development

```
npm install
cp .env.example .env.local   # fill in your Firebase config
npm run dev
```

## Deploy

```
npm run build
npx firebase-tools deploy --project <your-project-id>
```

## What's not built yet

- **Billing** — `subscriptionPlan`/`subscriptionStatus` exist on each
  school but aren't wired to a payment processor. Add Stripe (or similar)
  once a school is ready to pay; the Super Admin dashboard already shows
  each school's current plan/status so it has somewhere to display it.
- **Full class content** — "Add class" here creates an administrative
  record (name/description) scoped to a school. It doesn't (yet) give that
  class the full interactive Tuhfatul Atfaal / Tajweed Quest experience
  from diinislaam.com — that's a bigger follow-up: making those existing
  app pages school-aware so each school can run their own copy.
- **Teacher accounts** — only a school admin account is created when a
  school is added. Teacher invites (same pattern, different role in
  `members`) are a small follow-up once this foundation is confirmed
  working.
