# Noor Shield remote control (backend)

Lets a parent enforce bedtime on a paired PC from a web dashboard, without
the PC ever holding a real login of its own. See the design comment at the
top of `schema.sql` for the full rationale; this file is just the setup
steps.

## One-time setup (already done for this deployment)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `schema.sql` once. Safe to re-run.
3. From Project Settings → API, take the **Project URL** and the **anon /
   publishable** key (never the `service_role` key — that one must stay
   secret) and put them into:
   - `service/cloudSync.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
   - `cloud/dashboard.html` (`SUPABASE_URL`, `SUPABASE_KEY`, same values)

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
  device with its pairing code, send commands). Published as a Claude
  Artifact; this file is the source of truth if it ever needs updating —
  republish the artifact from an edited copy of this file.
- **`../service/cloudSync.js`** — the PC-side half: generates the pairing
  code, polls for it being claimed, then polls for commands and applies
  them (`enforce_sleep_now`, `cancel_sleep_now`). `shutdown` exists in the
  schema for later but is deliberately not implemented yet — see the
  comment at the top of that file for why.

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
