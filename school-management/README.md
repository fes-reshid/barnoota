# Barnoota Campus — School Management System

A modern, responsive school management platform built with React, TypeScript, Tailwind CSS and Firebase. Includes an Islamic weekend school extension (Quran progress, Iqra, Islamic Studies, Oromo language).

## Getting started

```bash
npm install
npm run dev
```

The app opens with **demo mode** enabled automatically: since no Firebase project is configured, all data is generated on first load and stored in the browser's `localStorage`, so every screen is fully interactive out of the box. Sign in with any of the demo accounts shown on the login screen (any password, 4+ characters).

## Connecting a real Firebase project

1. Create a Firebase project with **Authentication** (Email/Password), **Firestore**, and **Storage** enabled.
2. Copy `.env.example` to `.env.local` and fill in your project's SDK config.
3. Restart the dev server. The app automatically switches from demo mode to Firebase — no code changes required, because every screen reads and writes through the repository layer in `src/lib/repository.ts`.
4. Configure Firestore security rules to scope each collection by `schoolId` and the signed-in user's role (see the domain model in `src/types/index.ts` for the collections used).

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
