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
  them (`enforce_sleep_now`, `cancel_sleep_now`, `lock_computer`).
  `shutdown` exists in the schema for later but is deliberately not
  implemented yet — see the comment at the top of that file for why. Also
  polls `get_device_domains` on the same interval and folds the result into
  the PC's live blocklist (see `refreshBlocklist` in `handlers.js`). Its
  `unpair(store)` also calls `unpair_device` (best-effort, before clearing
  local state either way) so unpairing from inside the app deletes the
  device row on the Supabase side too — otherwise a parent removing the PC
  locally would still see it sitting in the web dashboard forever, with the
  cloud-side row (and its commands/sites, via `on delete cascade`) never
  actually going anywhere.
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
| `enforce_sleep_now` | Sets `forceSleepUntil` this many hours out (`payload.hours`, default 8 when absent — the dashboard's quick button sends no payload; its Manage panel's sleep-timer picker does). While active, `isScheduleActive` (in `filterService.js`) reports the schedule as on regardless of the PC's own configured weekly bedtime, and the reminder page (`reminderServer.js`) shows the sleeping-time page with a resume time computed from this, not the weekly schedule. |
| `cancel_sleep_now` | Clears `forceSleepUntil`. |
| `lock_computer` | Runs `rundll32.exe user32.dll,LockWorkStation` (Windows-only; fails on any other platform) **and** calls `setRemoteLockActive(store, true)`, which sets `remoteLockActive` and hides Windows' "Switch User" option (see below). The Windows lock alone does nothing for a child with their own account — they just log back in — so `remoteLockActive` is what actually keeps them out: the GUI polls it independently of window visibility and shows a full-screen, unclosable "ask your parent" window (`src/renderer/lock-overlay.html`) for as long as it's set. |
| `unlock_computer` | Calls `setRemoteLockActive(store, false)`, which the GUI notices on its next poll (≤5s) and closes the overlay, and restores "Switch User". |
| `set_schedule` | Validates `payload` with `isValidSchedule` (`src/main/schedule.js`) and, if valid, replaces the PC's local `schedule` outright — its own weekly bedtime setting from Parent settings, now settable remotely too. `payload.perDay` is keyed by day-of-week (`"0"`=Sun..`"6"`=Sat), each with its own `{enabled, startTime, endTime}` — every day can carry a different bedtime window, not just one shared time across all selected days. Invalid payloads (e.g. no day enabled) are marked `failed` rather than silently ignored. |
| `shutdown` | Schema-only. `cloudSync.js` marks it `failed` immediately rather than leaving it pending forever. |

## The remote lock, in full

The overlay window (`src/renderer/lock-overlay.html`) only exists inside the
Windows session that was running when `lock_computer` arrived — Ctrl+Alt+Del
→ "Switch User" opens a *different* session with no overlay in it at all,
since Fast User Switching keeps the locked session running in the
background instead of ending it. `setRemoteLockActive()` closes that hole by
setting the `HideFastUserSwitching` registry policy (the same one Group
Policy's "Hide entry points for Fast User Switching" uses) for as long as
the lock is active, and clearing it again on unlock. A normal sign-out
still works fine either way — it ends the session, so the next sign-in
re-evaluates the lock from scratch.

The overlay also has its own fallback, entirely separate from the cloud:
tapping "Parent: enter the local password instead" on the lock screen and
typing the same password used for Parent settings clears
`remoteLockActive` directly through the service (`handlers.js`'s
`cloud.localUnlock`, wired via `src/main/preload-lock.js`) — no internet, no
Supabase round trip. This exists for exactly the case the remote unlock
can't cover: no internet on this PC, Supabase unreachable, or the parent's
phone being the thing that's dead.

## Per-PC blocked sites

Separate from commands: the dashboard's Manage panel lets a parent add or
remove sites for one specific paired PC, stored directly in
`device_domains` (the parent's logged-in session writes to it under Row
Level Security — no function needed, unlike the device-facing side). The PC
reads its own list back through `get_device_domains`, polled alongside
commands, and merges the result into its live blocklist (`buildBlocklist()`
in `handlers.js`) alongside whatever's been added from the app itself. The
function always returns the *current full list*, not just new additions,
so a site the parent removes from the dashboard simply stops appearing on
the PC's next poll — no separate "removed" signal needed.

Sync goes the other way too: a site added from the PC's own Add-a-site
screen (`blocklist.add` in `handlers.js`) calls `cloudSync.addDeviceDomain`,
which calls `add_device_domain` — a device-facing counterpart to the
dashboard's direct insert, checked against `device_secret` instead of a
login — so it shows up in the dashboard's list too, not just enforced
silently. `blocklist.remove` mirrors this with `removeDeviceDomain` /
`remove_device_domain`. Both are best-effort and fire-and-forget: the site
is already added/removed locally regardless of whether the sync succeeds,
and the next `get_device_domains` poll (or a page refresh on the dashboard)
reconciles either side if it was briefly out of sync. The local Blocklist
tab's `blocklist.list` folds `cloudBlockedDomains` into what it shows,
badging any site that's only there because the parent added it from the
dashboard (`addedRemotely`) — so the two lists always show the same sites,
regardless of which side a site was added from.

## Extending it

Adding a new remote command means: add its name to the `kind` check
constraint in `schema.sql`'s `commands` table, handle it in
`applyCommand()` in `service/cloudSync.js`, and add a button for it in
`dashboard.html`. Keep the same shape — a command is inert until a PC
actually polls it and reports back `done`/`failed`.
