# Noor Shield remote control + licensing (backend)

Two independent features share this one Supabase project:

- **Remote control** — lets a parent enforce bedtime on a paired PC from a
  web dashboard, without the PC ever holding a real login of its own.
- **Product-key licensing** — a real database of issued keys, so a key can't
  be reused across unlimited PCs the way the old fully-offline check
  allowed.

See the design comment at the top of `schema.sql` for the full rationale on
both; this file is just the setup steps.

## One-time setup (already done for this deployment)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `schema.sql` once, then `seed_license_keys.sql`
   once (seeds every hash currently in `../src/main/licenseKeyHashes.json`,
   i.e. every key whose plaintext someone actually has). Both are safe to
   re-run — re-running `seed_license_keys.sql` after minting a new batch of
   keys (see `../scripts/generate-keys.js`) only adds the new ones.
   `cleanup_dead_keys.sql` is a one-off: it deletes the very first batch of
   1000 keys, whose plaintext was lost before this workflow existed, so run
   it once and then forget about it.
3. From Project Settings → API, take the **Project URL** and the **anon /
   publishable** key (never the `service_role` key — that one must stay
   secret) and put them into `service/supabaseConfig.js` (`SUPABASE_URL`,
   `SUPABASE_ANON_KEY`) — the single place both `cloudSync.js` and
   `../src/main/license.js` read them from — and into:
   - `dashboard.html` (`SUPABASE_URL`, `SUPABASE_KEY`, same values) — and
     wherever the deployed copy of it lives (see below)

Both of those keys are meant to be public — the database's Row Level
Security policies and the `SECURITY DEFINER` functions in `schema.sql` are
what actually keep one family's data separate from another's, not secrecy
of these values.

## What's what

- **`schema.sql`** — the whole database: `devices`, `pairing_codes`,
  `commands` tables, Row Level Security policies for the parent's logged-in
  side, and the `SECURITY DEFINER` functions the PC calls anonymously
  (proving itself with a `device_secret` it generated at pairing time,
  never with a real login).
- **`dashboard.html`** — the parent-facing web page (sign in, link a
  device with its pairing code, send commands): the source of truth for
  its markup/logic. **Not deployed as a Claude Artifact** — Artifacts run
  under a CSP that only permits *loading a script* from a short CDN
  allowlist, not making fetch/XHR calls to arbitrary hosts (even from a
  library loaded off an allowed CDN), so Supabase's own auth/database
  calls were silently blocked there ("NetworkError when attempting to
  fetch resource" the moment anyone tried to sign in). The real deployed
  copy lives on the `main` branch of this repo as `noor-shield-remote.html`
  (a plain page on diinislaam.com, wrapped in a normal
  doctype/html/head/body) — a static site has no such restriction. When
  this file changes, copy it over to `noor-shield-remote.html` on `main`
  and re-wrap it.
- **`../service/cloudSync.js`** — the PC-side half: generates the pairing
  code, polls for it being claimed, then polls for commands and applies
  them (`enforce_sleep_now`, `cancel_sleep_now`). `shutdown` exists in the
  schema for later but is deliberately not implemented yet — see the
  comment at the top of that file for why.
- **`seed_license_keys.sql`** — one `insert` per already-issued key hash
  (regenerated from `../src/main/licenseKeyHashes.json` by
  `../scripts/gen-seed-sql.js`, only needed again if a new batch of keys is
  ever generated). Populates `license_keys` so `activate_license_key` has
  real keys to check against.
- **`../src/main/license.js`** — the PC-side half of licensing:
  `activateKeyOnline()` hashes the entered key and calls
  `activate_license_key`, scoped to a random `deviceId` this PC generates
  for itself once (`store.license.deviceId`) and reuses on every later
  attempt — so reinstalling the app on the *same* PC still activates
  cleanly, while a *different* PC trying the same key is rejected as
  `already_used`. Deliberately "check once": this only ever runs at the
  moment "Activate" is clicked, never again afterwards.

## Commands implemented so far

| Command | What it does |
|---|---|
| `enforce_sleep_now` | Sets `forceSleepUntil` 8 hours out. While active, `isScheduleActive` (in `filterService.js`) reports the schedule as on regardless of the PC's own configured weekly bedtime, and the reminder page (`reminderServer.js`) shows the sleeping-time page with a resume time computed from this, not the weekly schedule. |
| `cancel_sleep_now` | Clears `forceSleepUntil`. |
| `shutdown` | Schema-only. `cloudSync.js` marks it `failed` immediately rather than leaving it pending forever. |

## Extending it

Adding a new remote command means: add its name to the `kind` check
constraint in `schema.sql`'s `commands` table, handle it in
`applyCommand()` in `service/cloudSync.js`, and add a button for it in
`dashboard.html`. Keep the same shape — a command is inert until a PC
actually polls it and reports back `done`/`failed`.
