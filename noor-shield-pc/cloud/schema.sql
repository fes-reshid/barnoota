-- Noor Shield remote control — Supabase schema.
--
-- Run this once in your Supabase project's SQL Editor (Project → SQL Editor →
-- New query → paste this whole file → Run). Safe to re-run: every statement
-- either creates something or replaces it, nothing here deletes data.
--
-- Design in one paragraph: a parent's PC never logs into Supabase as a real
-- user — it only ever proves it holds a long random `device_secret` it
-- generated for itself at pairing time. The device-facing functions below
-- (start_pairing, poll_pairing, get_pending_commands, complete_command,
-- get_device_domains) check that secret themselves and are safe to call
-- with only the public "anon"/"publishable" key. The parent's web dashboard, in contrast,
-- logs in for real via Supabase Auth, and Row Level Security (the "policy"
-- blocks below) makes sure a logged-in parent can only ever see or command
-- their own paired devices — never anyone else's.

create extension if not exists pgcrypto; -- for gen_random_uuid() / gen_random_bytes()

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  device_secret text not null unique,
  name text not null default 'Family PC',
  paired_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- Short-lived, single-use codes bridging "a PC that just generated a secret"
-- to "a parent who is logged into the web dashboard" — the pairing flow's
-- only genuinely public-write table, and only while a code is unclaimed.
create table if not exists public.pairing_codes (
  code text primary key,
  device_secret text not null,
  device_name text not null default 'Family PC',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  claimed_device_id uuid references public.devices(id)
);

create table if not exists public.commands (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  kind text not null check (kind in ('enforce_sleep_now', 'cancel_sleep_now', 'shutdown', 'lock_computer', 'unlock_computer', 'set_schedule')),
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  requested_by uuid not null references auth.users(id),
  -- Small per-command extras that don't need their own column — currently
  -- just enforce_sleep_now's { "hours": N } duration, defaulting to 8 when
  -- absent so older rows (and a plain insert with no payload) still work.
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Re-run-safe: adds `payload` and newer kinds to a commands table
-- created before they existed, without touching existing rows.
alter table public.commands add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.commands drop constraint if exists commands_kind_check;
alter table public.commands add constraint commands_kind_check
  check (kind in ('enforce_sleep_now', 'cancel_sleep_now', 'shutdown', 'lock_computer', 'unlock_computer', 'set_schedule'));

create index if not exists commands_device_pending_idx
  on public.commands (device_id, status)
  where status = 'pending';

-- Sites the parent has added for one specific paired PC, from the web
-- dashboard. Separate from the PC's own locally-added list (customDomains
-- in its local store) — this one is authoritative from the cloud side and
-- synced down into the PC's blocklist on every command poll (see
-- get_device_domains below and service/cloudSync.js).
create table if not exists public.device_domains (
  device_id uuid not null references public.devices(id) on delete cascade,
  domain text not null,
  added_at timestamptz not null default now(),
  primary key (device_id, domain)
);

-- Product keys. Replaces the old fully-offline scheme (a fixed list of 1000
-- precomputed key hashes shipped inside the app, in licenseKeyHashes.json)
-- with a real record of which keys exist and which PC each one activated —
-- so the same key can no longer be reused across unlimited computers, and a
-- key can be told apart from a made-up string. Only key_hash is stored,
-- never the plaintext key, matching how the app already hashed keys before
-- checking them locally.
create table if not exists public.license_keys (
  key_hash text primary key,
  activated_device_id text,
  activated_at timestamptz
);

alter table public.devices enable row level security;
alter table public.pairing_codes enable row level security;
alter table public.commands enable row level security;
alter table public.device_domains enable row level security;
alter table public.license_keys enable row level security;

-- No policies for license_keys either (same reasoning as pairing_codes
-- below): every interaction goes through activate_license_key, so the raw
-- table is never directly queryable, even by a logged-in user.

-- ---------------------------------------------------------------------
-- Row Level Security — the parent-facing (logged-in) side only.
-- The device-facing side never queries these tables directly; it only
-- calls the SECURITY DEFINER functions below, which do their own checks.
-- ---------------------------------------------------------------------

drop policy if exists "parents see their own devices" on public.devices;
create policy "parents see their own devices"
  on public.devices for select
  using (owner_id = auth.uid());

drop policy if exists "parents rename their own devices" on public.devices;
create policy "parents rename their own devices"
  on public.devices for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "parents remove their own devices" on public.devices;
create policy "parents remove their own devices"
  on public.devices for delete
  using (owner_id = auth.uid());

drop policy if exists "parents see commands for their own devices" on public.commands;
create policy "parents see commands for their own devices"
  on public.commands for select
  using (device_id in (select id from public.devices where owner_id = auth.uid()));

drop policy if exists "parents queue commands for their own devices" on public.commands;
create policy "parents queue commands for their own devices"
  on public.commands for insert
  with check (
    requested_by = auth.uid()
    and device_id in (select id from public.devices where owner_id = auth.uid())
  );

-- No policies at all are defined for pairing_codes: RLS with zero policies
-- denies every direct table access (even to logged-in users), which is
-- exactly right here — every interaction with this table goes through the
-- functions below instead, so the raw codes/secrets are never queryable.

-- device_domains, unlike pairing_codes, IS meant to be queried and written
-- directly by the logged-in parent's dashboard (list/add/remove a site) —
-- one policy covering all four operations is enough since the ownership
-- check is identical for each.
drop policy if exists "parents manage sites for their own devices" on public.device_domains;
create policy "parents manage sites for their own devices"
  on public.device_domains for all
  using (device_id in (select id from public.devices where owner_id = auth.uid()))
  with check (device_id in (select id from public.devices where owner_id = auth.uid()));

-- ---------------------------------------------------------------------
-- Device-facing functions (called with only the public anon/publishable
-- key — no Supabase login). Each one re-checks device_secret itself.
-- ---------------------------------------------------------------------

-- Called once by a PC that has just generated its own device_secret and a
-- 6-digit code to show the parent. Anyone could technically call this, but
-- all it does is insert a throwaway pairing attempt that expires in 10
-- minutes and is useless without also being shown the code on the PC itself.
create or replace function public.start_pairing(p_code text, p_device_secret text, p_device_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pairing_codes (code, device_secret, device_name)
  values (p_code, p_device_secret, coalesce(nullif(trim(p_device_name), ''), 'Family PC'));
end;
$$;

-- Polled by the PC every few seconds while its pairing screen is showing.
-- Returns the new device_id once a parent has claimed the code, else null.
create or replace function public.poll_pairing(p_code text, p_device_secret text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device_id uuid;
begin
  select claimed_device_id into v_device_id
  from public.pairing_codes
  where code = p_code and device_secret = p_device_secret and expires_at > now();

  return v_device_id;
end;
$$;

-- Called by the logged-in parent's web dashboard (auth.uid() is real here).
create or replace function public.claim_pairing_code(p_code text, p_device_name_override text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.pairing_codes;
  v_device_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to pair a device';
  end if;

  select * into v_row from public.pairing_codes
  where code = p_code and expires_at > now() and claimed_device_id is null
  for update;

  if not found then
    raise exception 'That code is invalid or has expired. Ask for a new one on the PC.';
  end if;

  insert into public.devices (owner_id, device_secret, name)
  values (auth.uid(), v_row.device_secret, coalesce(nullif(trim(p_device_name_override), ''), v_row.device_name))
  returning id into v_device_id;

  update public.pairing_codes set claimed_device_id = v_device_id where code = p_code;

  return v_device_id;
end;
$$;

-- Polled by the PC once paired. Also updates last_seen_at as a side effect,
-- so the dashboard can show roughly how recently the PC last checked in.
create or replace function public.get_pending_commands(p_device_id uuid, p_device_secret text)
returns setof public.commands
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.devices
  set last_seen_at = now()
  where id = p_device_id and device_secret = p_device_secret;

  if not found then
    raise exception 'Unrecognized device';
  end if;

  return query
    select * from public.commands
    where device_id = p_device_id and status = 'pending'
    order by created_at asc;
end;
$$;

create or replace function public.complete_command(
  p_device_id uuid,
  p_device_secret text,
  p_command_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('done', 'failed') then
    raise exception 'invalid status';
  end if;

  update public.commands
  set status = p_status, completed_at = now()
  where id = p_command_id
    and device_id = p_device_id
    and device_id in (select id from public.devices where id = p_device_id and device_secret = p_device_secret);
end;
$$;

-- Polled by the PC alongside get_pending_commands, on the same interval —
-- returns the full current list of parent-added sites for this device so
-- the PC can fold them into its blocklist. Deliberately returns the whole
-- list every time rather than just new additions: it's the simplest way to
-- also pick up a removal (a domain the parent deleted from the dashboard
-- just stops appearing here, no separate "removed" signal needed).
create or replace function public.get_device_domains(p_device_id uuid, p_device_secret text)
returns setof text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.devices where id = p_device_id and device_secret = p_device_secret
  ) then
    raise exception 'Unrecognized device';
  end if;

  return query
    select domain from public.device_domains
    where device_id = p_device_id
    order by added_at asc;
end;
$$;

-- Called once by a PC when the parent clicks "Activate". p_device_id here is
-- just a random id the PC generated for itself the first time it tried to
-- activate (see license.js) — nothing to do with the `devices`/pairing
-- system above, which only exists once a PC is paired for remote control.
-- Returns 'ok' the first time a key is claimed, 'ok' again on every later
-- call from the *same* device id (so reinstalling the app on the same PC
-- keeps working), 'already_used' if a *different* device id already claimed
-- it, and 'invalid' if the hash isn't a known key at all.
create or replace function public.activate_license_key(p_key_hash text, p_device_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.license_keys;
begin
  select * into v_row from public.license_keys where key_hash = p_key_hash for update;

  if not found then
    return 'invalid';
  end if;

  if v_row.activated_device_id is null then
    update public.license_keys
    set activated_device_id = p_device_id, activated_at = now()
    where key_hash = p_key_hash;
    return 'ok';
  end if;

  if v_row.activated_device_id = p_device_id then
    return 'ok';
  end if;

  return 'already_used';
end;
$$;
