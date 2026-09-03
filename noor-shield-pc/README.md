# Noor Shield for PC (Windows)

The desktop companion to `noor-shield-app/` (Android): a device-wide
adult-content filter with Islamic reminders, where every protection setting is
behind a parent password. Same palette, same blocklist, same cited Hadith set
as the Android version.

## Two processes, on purpose

Protection and the app window are now **separate processes**, so that closing
the window, quitting, logging off, or even nobody being signed in at all does
not stop the filter. This is the whole point of "runs always."

```
┌─────────────────────────────┐        named pipe         ┌──────────────────────────────┐
│  Noor Shield Filter Service  │◄──────────────────────────►│   Noor Shield (Electron GUI)  │
│  (Windows service, LocalSystem,        \\.\pipe\           │   control panel + reminders    │
│   starts at boot, auto-restarts)   NoorShieldControl        (runs as the signed-in user)   │
│                               │                            │                                │
│  • DNS proxy (127.0.0.1:53)  │                            │  • Dashboard / blocklist UI    │
│  • Windows DNS apply/restore │                            │  • Desktop notifications       │
│  • parent password + gate    │                            │    (services can't show these) │
│  • blocklist (seed + custom) │                            │  • Tawbah journal (per-user)   │
└─────────────────────────────┘                            └──────────────────────────────┘
```

The service is the actual enforcer and owns the parent password. The GUI is a
thin client: every protection-changing button just calls the service over a
local named pipe and shows whatever it says. **The parent gate lives in the
service, not the GUI** — verified in `service/handlers.js`, where every
mutating RPC method checks `parentAuth.isUnlocked()` itself, and confirmed in
`verify-service.js` (see Testing below), where the unlock state is shown to
survive a brand new pipe connection, i.e. it belongs to the service, not to
whichever GUI happened to ask.

## How the filter works

```
Any app/browser on the PC
        │  DNS query
        ▼
  127.0.0.1:53  ← Windows' DNS is pointed here (Set-DnsClientServerAddress)
   Noor Shield local resolver (inside the service)
        ├── domain on the blocklist → NXDOMAIN (site does not resolve)
        └── anything else → forwarded to 1.1.1.1, reply relayed back
```

This is the desktop equivalent of the Android app's `BlockVpnService`, and
shares its `dnsMessage` logic so both platforms answer the same query the same
way. It is a DNS-level filter: no traffic is proxied, nothing leaves the
machine except ordinary DNS lookups to the upstream resolver.

| Piece | File |
|---|---|
| The always-on service entrypoint | `service/filterService.js` |
| RPC methods + the parent gate (the real enforcement) | `service/handlers.js` |
| Pipe transport (named pipe / Unix socket, newline-JSON) | `service/pipeTransport.js` |
| Install/uninstall the Windows service | `service/install.js`, `service/uninstall.js` |
| Local resolver (UDP, id remapping, upstream forwarding) | `src/main/dnsProxy.js` |
| Windows DNS apply/restore, admin detection | `src/main/systemDns.js` |
| Seed + parent-added domain matching | `src/main/blocklist.js` |
| Parent password, recovery key, lockout | `src/main/parentAuth.js` |
| Activity log (blocked attempts) | `service/handlers.js` (`appendActivity`, `activity.*`) |
| Email report (on request, no schedule) | `src/main/emailReport.js` |
| Encrypted SMTP password storage | `src/main/secretStore.js` |
| GUI: thin client, journal, reminders | `src/main/main.js`, `src/main/serviceClient.js` |
| UI | `src/renderer/` |

## The parent lock

A parent password is set on first run (in the GUI, but stored and checked by
the service) and gates:

- turning the filter on or off
- adding or removing blocked sites
- removing the protection service entirely
- viewing or clearing the activity log, and the email report settings/sending

Left deliberately open, with no password: seeing the protection status,
reading the Hadith, writing in the tawbah journal, changing the reminder
interval, and **closing or quitting the app window** — none of those affect
protection, so none of them need to ask. Repairing DNS from the tray is also
unlocked on purpose (see "If the PC loses internet" below).

Other details that matter:

- Passwords are stored as **scrypt** hashes (`N=16384, r=8, p=1`) with a random
  per-password salt, compared in constant time. Never plaintext, never
  reversibly encrypted.
- A **one-time recovery key** (`XXXXX-XXXXX-XXXXX-XXXXX`) is shown once at
  setup and stored only as a hash. It's the way back in from a forgotten
  password. Using it burns the old key and issues a new one.
- **Five wrong attempts** locks unlocking for 5 minutes.
- The parent session **auto-relocks after 10 idle minutes**.
- Data lives in `%ProgramData%\NoorShield`, not a per-user profile —
  LocalSystem has no meaningful home directory, and one parent password
  protecting the whole PC regardless of which Windows account is signed in is
  the right model for a family computer. The journal and reminder interval
  are the exception: those stay in the GUI's own per-user profile, since
  they're a personal thing tied to whoever is using that account, not a
  PC-wide protection setting.

## What "runs always" actually means here

- **Survives the GUI closing or quitting.** The tray's "Quit Noor Shield" now
  only closes the control panel — it does not touch the service.
- **Survives logoff and reboot.** The service starts at boot under
  LocalSystem, before any user signs in, via Windows' normal service
  auto-start (`StartType: Automatic`, node-windows' default).
- **Restarts itself if it crashes.** Configured in `service/install.js`
  (`wait`, `grow`, `maxRestarts`, `maxRetries` — WinSW's backoff settings): a
  crash gets retried with growing delay rather than staying dead.
- **Does not survive:** the PC being off, or someone with an administrator
  account running `sc stop`/`sc delete` or Task Manager → End Task on the
  service process, or using "Remove protection completely" in Settings
  (which is the intended, parent-gated way to turn this off for good).

## Activity log and email reports

The Activity Log tab shows **blocked attempts only** — domains the filter
actually stopped — not a full browsing history of every site visited. This is
a deliberate scope choice: it answers "what has the filter been catching"
without keeping a complete log of everything the child looked at.

- Recorded by the service itself, the moment `DnsProxy` emits a `blocked`
  event (`service/handlers.js`'s `appendActivity`), capped at the most recent
  2000 entries so a PC left running for months doesn't grow the log without
  bound.
- Viewing or clearing the log requires the parent password, same as
  everything else that reveals what the child has been doing.
- **Emailing a report is on-request only** — there is no schedule and nothing
  is sent automatically. The parent configures an SMTP account once (an app
  password from Gmail/Outlook/etc. works well) and clicks "Send report now"
  whenever they want a copy.
- The SMTP password is encrypted at rest via Electron's `safeStorage` (OS
  keychain / Windows DPAPI) — never written to the plaintext settings file.
  If a machine has no OS-level secure storage available (rare, but possible
  in some locked-down environments), saving a password is refused outright
  rather than silently falling back to plaintext; the UI says so.
- The recipient address and non-secret SMTP settings (host, port, username)
  live in the GUI's own per-user store, not the service's — this is
  configuration for how a report leaves the machine, not a protection
  setting, but it's still gated behind the same parent session (checked
  against the service, since the GUI holds no password state of its own).

## Honest limitations — read before trusting this

1. **A user with their own administrator account can still stop or remove the
   service.** Windows itself restricts starting/stopping/deleting a service to
   administrators, which is a real, OS-enforced barrier for a standard
   (non-admin) child account — give the child a standard account, not an
   administrator one. It is not a barrier against an administrator, including
   a parent who forgets they're logged in as one.
2. **Domain filtering has known bypasses.** Sites reached by raw IP address,
   or a browser using its own DNS-over-HTTPS to a hardcoded resolver (Chrome
   and Firefox can both be configured this way), skip DNS filtering entirely.
   Turning off "Secure DNS" in each browser is worth doing alongside this.
3. **The blocklist is a curated seed list, not exhaustive.** No app can
   automatically discover every adult site. Merge in a maintained feed for
   real coverage — see the header of `resources/blocklist_domains.txt`.
4. **UDP only.** DNS over TCP (used for oversized responses) is not currently
   intercepted.
5. **Notifications need someone signed in.** Windows services run in Session 0,
   isolated from any desktop, so Hadith reminders come from the GUI process,
   not the service — they pause while the GUI isn't running, which is fine
   for reminders but is why they're architecturally separate from filtering.
6. **The activity log only knows about DNS-level blocks.** A site reached via
   raw IP, or bypassing DNS filtering some other way (see #2), won't appear
   in the log even though it wasn't actually blocked — the log reflects what
   the filter caught, not a full record of everything accessed.
7. **The parent's own inbox is a new place this data lives.** Emailing a
   report moves a list of blocked domains off the PC and onto whatever mail
   provider the parent used — worth choosing a recipient address the parent
   actually controls, for the same reason the SMTP password is encrypted at
   rest rather than left in plain text.

## If the PC loses internet ("DNS not responding")

Because only `127.0.0.1` is set as the DNS server — deliberately, since a
public fallback server would let Windows route around the filter exactly when
it matters — DNS stops resolving if the service dies while the redirect is in
place (it shouldn't, given the auto-restart above, but "shouldn't" isn't
"can't"). Three ways back:

1. **The service reconciles on its own next start.** `filterService.js`'s
   startup check restarts the resolver, or if it can't, puts the old DNS
   settings back — this now happens independently of the GUI.
2. **Tray menu → "Repair DNS (restore Windows settings)."** Not
   password-protected: a family whose internet is broken shouldn't have to
   wait for the parent to get home. It only restores DNS; it never disables
   the filter's saved intent, so the service resumes protecting on its own
   next start.
3. **Manually**, in an admin PowerShell:

   ```powershell
   Get-NetIPInterface -AddressFamily IPv4 |
     ForEach-Object { Set-DnsClientServerAddress -InterfaceIndex $_.ifIndex -ResetServerAddresses }
   Clear-DnsClientCache
   ```

## Removing protection completely

Settings → "Remove protection completely" (parent password required). This is
different from quitting the app:

1. The service verifies the parent password and restores DNS
   (`service.prepareUninstall`).
2. The GUI — already running elevated — then deletes the Windows service
   registration itself (`service/uninstall.js`), which is the standard
   node-windows stop-then-uninstall sequence run from *outside* the service.
   (Doing this from inside the very service being torn down is a
   self-referential mess: `NET STOP` would kill the process before it could
   finish uninstalling itself, so the deletion step deliberately always runs
   from the external, already-elevated GUI process instead.)

## Running, installing the service, and building

Requires Node 18+ and Windows 10/11. **Must run as Administrator** —
installing a service, changing DNS, and binding port 53 all require it.

```powershell
npm install
npm start                # development: launches the GUI, which installs and
                          # starts the service automatically on first run
npm run service:install  # install + start the service directly, without the GUI
npm run service:uninstall
npm run dist              # builds an NSIS installer (requestedExecutionLevel: requireAdministrator)
```

The packaged app ships with **asar packaging disabled** (`"asar": false` in
package.json). This is deliberate, not an oversight: `node-windows` writes a
generated wrapper executable and XML config to disk next to `filterService.js`
when installing the service, and the process it registers is later launched
directly by Windows — both need real files on a real filesystem, which an
asar archive's virtual filesystem cannot provide for writes or for spawning.

### Troubleshooting the service

- **Logs**: once installed, `service/daemon/noorshieldfilter.wrapper.log`
  (and `.out.log`/`.err.log`) are written by the WinSW wrapper — check these
  first if the service won't start.
- **A stuck/incomplete previous install**: if `service/install.js` reports an
  incomplete installation, remove the `service/daemon/` folder and re-run
  `npm run service:install`.
- **Checking service state directly**: `sc query noorshieldfilter` (the
  service's internal id — see `service/serviceName.js`).

## Testing without a Windows machine

This was authored and tested in a Linux sandbox with no Windows machine
available, so the Windows-specific pieces (actually changing system DNS,
actually registering a service with the SCM) are necessarily unverified here —
`systemDns.js` shells out to `powershell.exe`, and `service/install.js`
requires `node-windows`, neither of which exist on Linux.

Everything platform-independent is exercised by four scripts (not checked
into this repo, but reproducible from their descriptions):

- DNS packet parsing/NXDOMAIN construction, subdomain and suffix-lookalike
  blocklist matching, and the full parent-auth state machine (20 checks).
- The DNS proxy end-to-end against a stub upstream, including two concurrent
  queries sharing one transaction id (proving the id-remapping prevents
  crossed replies) and a live blocklist swap while running (8 checks).
- `appendActivity`'s cap-and-order behavior, the email report's text/HTML
  formatting (including that it escapes its input rather than injecting it
  raw), and `secretStore` failing with a clear error — rather than crashing
  or silently storing plaintext — when run outside a real Electron process
  with no OS keychain available (10 checks).
- **The real service**, forked as an actual child process exactly as
  node-windows' wrapper would run it, driven entirely over the real pipe
  transport: setup, the parent gate refusing mutations while locked (checked
  directly against the pipe, not through the GUI, and including the activity
  log specifically), wrong-password rejection, the unlock persisting across
  a brand-new pipe connection (proving the gate lives in the service), the
  recovery-key reset flow, a pre-seeded activity entry round-tripping through
  `activity.list`/`activity.clear`, and a clean SIGTERM shutdown that doesn't
  hang even when the DNS-restore call fails fast on a non-Windows host
  (17 checks).

55 checks passing across all four. What remains genuinely unverified: the
actual `Set-DnsClientServerAddress` PowerShell calls, actually registering
with the Windows Service Control Manager, the packaged NSIS installer, and
sending a real email through a real SMTP server (nodemailer's `sendMail` API
was confirmed against the actual installed package rather than assumed, but
no test here talks to a real mail server).
Expect to fix small things on first real run — particularly the tray icon
(`src/renderer/assets/tray.png` is referenced but not yet added; `createTray()`
degrades gracefully without it) and the exact PowerShell output shapes on your
Windows build.

## Keeping the two apps in sync

`resources/blocklist_domains.txt` is intentionally a duplicate of
`noor-shield-app/app/src/main/res/raw/blocklist_domains.txt`. Edit both, or a
family running Noor Shield on the phone and the PC will get different answers
for the same domain. The Hadith set in `src/main/hadith.js` mirrors
`reminders/Hadith.kt` the same way.
