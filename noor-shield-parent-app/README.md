# Noor Shield Parent (Android)

A phone app for parents to manage their family's paired Noor Shield PCs
remotely — the same functionality as the web dashboard
(`noor-shield-pc/cloud/dashboard.html`, deployed as `noor-shield-remote.html`
on diinislaam.com), but as a native Android app instead of a browser tab.

This is **not** the on-device content filter (that's `noor-shield-app/`, a
separate app installed on a child's phone). This app is the parent's remote
control — sign in, see your paired PCs, and manage each one.

## What it does (v1)

- Sign in / create an account (Supabase Auth — same account as the web
  dashboard; a parent can use either interchangeably).
- Pair a new PC by entering the 6-digit code it shows.
- Per paired PC:
  - Quick actions: Enforce sleep now, Cancel sleep, Lock, Unlock.
  - Blocked sites: view, add, remove (synced with the PC's own Blocklist
    tab and the web dashboard — same `device_domains` table).
  - Weekly bedtime: per-day start/end times, same as the web dashboard's
    day-chip editor — tap a day to toggle it and load its own time.

## Architecture

Talks directly to the same Supabase project as everything else in Noor
Shield (`noor-shield-pc/cloud/schema.sql`) via plain REST calls — Auth,
PostgREST, and RPC — with OkHttp and `org.json`, no Supabase SDK. This
mirrors exactly how `noor-shield-pc/service/cloudSync.js` and
`noor-shield-pc/cloud/dashboard.html` talk to Supabase, so all three
clients (PC app, web dashboard, this app) are interchangeable — a parent
can pair from any of them and manage from any of them.

- `SupabaseConfig.kt` — same project URL/anon key as
  `noor-shield-pc/service/supabaseConfig.js`.
- `network/SupabaseClient.kt` — Auth (sign up/in/out, token refresh),
  device list, pairing, commands, blocked sites.
- `data/SessionStore.kt` — persists the Auth session (access/refresh
  token) in DataStore, so signing in once survives app restarts.
- `data/DomainUtil.kt` — mirrors `dashboard.html`'s
  `normalizeDomain`/`isValidDomain` exactly, so a site added here is
  stored in the same canonical form.
- `ui/screens/` — `AuthScreen`, `DeviceListScreen`, `ManageDeviceScreen`
  (Compose, Material3).

## Building

```
./gradlew assembleDebug
```

Needs network access to Google's Maven repo (`dl.google.com`) for the
Android Gradle Plugin, and Maven Central for the rest — this project was
built in a sandbox where `dl.google.com` was blocked by egress policy, so
**the build could not be verified end-to-end from that environment**. The
Kotlin source was written and reviewed carefully (including working around
a real `kotlin.runCatching` + suspend-function pitfall — its lambda isn't
`suspend`, so a `resultOf` helper is used instead throughout
`SupabaseClient.kt`), but build it in Android Studio or a normal CI runner
before shipping, the same way `noor-shield-pc`'s Supabase-dependent code
needed a real device/network to confirm live.

## Roadmap

- iOS app (Swift/SwiftUI), reusing the same Supabase backend and REST
  calling conventions as this app.
- Forgot-password flow (the web dashboard has one; this app doesn't yet).
- Push notifications for reminder/status events.
