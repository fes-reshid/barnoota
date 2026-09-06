# Barnoota Campus — School Management System

A modern, responsive school management platform built with React, TypeScript, Tailwind CSS and Firebase. Includes an Islamic weekend school extension (Quran progress, Iqra, Islamic Studies, Oromo language).

## Getting started

```bash
npm install
npm run dev
```

The app opens with **demo mode** enabled automatically: since no Firebase project is configured, all data is generated on first load and stored in the browser's `localStorage`, so every screen is fully interactive out of the box. Sign in with any of the demo accounts shown on the login screen (any password, 4+ characters).

## Connecting a real Firebase project

### 1. Create the project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Add project**. Name it (e.g. "barnoota-campus"), and you can decline Google Analytics — it isn't needed.
2. In the left sidebar, open **Build → Authentication → Get started**, then enable the **Email/Password** sign-in provider.
3. Open **Build → Firestore Database → Create database**. Choose a region close to your users, and start in **production mode** (this repo's `firestore.rules` will lock it down properly on deploy).
4. Open **Build → Storage → Get started**, and accept the default bucket/rules prompt (this repo's `storage.rules` replaces it on deploy).
5. Open **Project settings → General**, scroll to "Your apps", click the **Web** icon (`</>`), register an app (nickname doesn't matter, skip Firebase Hosting setup here), and copy the `firebaseConfig` object it shows you.

### 2. Wire the config into the app

Copy `.env.example` to `.env.local` inside `school-management/` and fill in the values from the config object:

```bash
cp .env.example .env.local
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Also update `.firebaserc` — replace `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID` with your actual project id (the `projectId` value above).

Restart the dev server. The app automatically switches from demo mode to Firebase — no code changes required, since every screen reads/writes through the repository layer in `src/lib/repository.ts`. On first run in Firebase mode there is no seed data and no user profiles yet, so you'll need to create your first School Admin account directly in the Firebase console:
1. **Authentication → Users → Add user** — create an account with your email/password.
2. **Firestore Database → Start collection** → collection id `schools`, then create a document (any id) with at least `name`, and `islamicModulesEnabled: { quran: true, iqra: true, islamicStudies: true, oromoLanguage: true }`. Note its document id — that's your `schoolId`.
3. Create a `users` collection, and add a document **whose document ID is the Auth user's UID** (find it on the Authentication → Users page) with fields: `schoolId` (the id from step 2), `name`, `email`, `role: "school_admin"`, `active: true`. From then on, every other account (teachers, admins) can be created from inside the app itself — it provisions Firebase Auth accounts and profile documents automatically and emails the new user a "set your password" link.

### 3. Deploy security rules and Firestore/Storage

```bash
cd school-management
npx firebase-tools login          # opens a browser to sign into your Google account
npx firebase-tools deploy --only firestore:rules,storage
```

`firestore.rules` and `storage.rules` in this folder scope every collection to `schoolId` and role — review them against your school's privacy needs before going live.

### 4. Deploy the app to Firebase Hosting (to get a public URL)

```bash
npm run deploy
```

This builds the app and deploys `dist/` to Firebase Hosting, printing a URL like `https://your-project-id.web.app` you can open in any browser. Run it again any time you want to publish a new build. (`npm run deploy:all` also redeploys the Firestore/Storage rules in the same step.)

## Email notifications (Gmail SMTP)

Cloud Functions in `functions/` send email through a plain Gmail account whenever certain events happen:

| Event | Emailed to | 
| --- | --- |
| New announcement posted | Teachers / parents / everyone, depending on the announcement's audience |
| Homework assigned | Guardians of every student in that class (via each student's `guardianEmail`) |
| Student marked absent or late | That student's guardian |
| New fee invoice assigned | That student's guardian |
| Payment recorded | That student's guardian (receipt) |
| New teacher/admin account created | That person — via Firebase Auth's built-in password-setup email (no Gmail involved) |

Parent/student notifications go to the **`guardianEmail` already stored on the student record** — parents don't need an app login for this to work. Teacher notifications use the teacher's own `email` field.

### Set it up

**1. Get a Gmail App Password** (a regular Gmail account works — this is free, but Gmail caps sending at ~500 emails/day, which is plenty for a small school):
1. Go to your Google Account → **Security**.
2. Turn on **2-Step Verification** if it isn't already on (required for App Passwords).
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), create one named "Barnoota Campus", and copy the 16-character password it shows you (spaces don't matter).

**2. Upgrade the Firebase project to the Blaze plan.** Cloud Functions cannot deploy at all on the free Spark plan — Google requires Blaze (pay-as-you-go) even though the free monthly quota (2M invocations, etc.) means a small school will realistically pay **$0**. In the Firebase console: **⚙ Project settings → Usage and billing → Modify plan → Blaze**.

**3. Store the Gmail credentials as Cloud Functions secrets** (never put these in `.env` files or commit them):
```bash
cd school-management
npx firebase-tools functions:secrets:set GMAIL_USER
# paste your Gmail address when prompted

npx firebase-tools functions:secrets:set GMAIL_APP_PASSWORD
# paste the 16-character App Password when prompted
```

**4. Deploy the functions:**
```bash
npm run deploy:functions
```

That's it — from then on, the events in the table above send automatically. Check `npx firebase-tools functions:log` if an email doesn't arrive (most often: Blaze plan not enabled yet, or a typo in the App Password).

## Project structure

- `src/types` — domain model shared by every screen and the data layer.
- `src/lib/repository.ts` — generic Firestore/localStorage repository used by every collection.
- `src/lib/services.ts` — one repository instance per collection.
- `src/context` — auth and page-title React contexts.
- `src/components/ui` — shared UI kit (tables, modals, toasts, forms, empty/loading states).
- `src/components/layout` — sidebar, topbar, responsive dashboard shell.
- `src/pages` — one folder per module (students, teachers, attendance, timetable, homework, exams, fees, communication, library, reports, islamic modules, settings).

## Roles

Super Admin, School Admin, Teacher, Parent and Student each get a dedicated dashboard and a sidebar scoped to their permissions, enforced by `src/routes/ProtectedRoute.tsx`.

## Google sign-in

The login page shows a "Sign in with Google" button whenever a Firebase project is connected (it needs the **Google** provider enabled under Authentication → Sign-in method). One limitation to know about: a `users/{uid}` profile document is keyed by whichever Firebase Auth account signed in, and `createStaffAccount()` (used by "Add teacher"/"Add administrator") always creates an **email/password** account — so someone who signs in with Google for the first time will get a *different* uid than their email/password account, even with the same email, and see "No profile found." To let a specific person use Google: have them click "Sign in with Google" once (it'll fail with that message), find their new account under Authentication → Users by email to get its uid, then create (or move) their `users/{uid}` document to that uid.
