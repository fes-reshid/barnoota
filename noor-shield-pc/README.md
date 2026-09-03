# Noor Shield for PC (Windows)

The desktop companion to `noor-shield-app/` (Android): a device-wide
adult-content filter with Islamic reminders, where every protection setting is
behind a parent password.

Electron app, Windows-first. Same palette, same blocklist, same cited Hadith set
as the Android version.

## How the filter works

```
Any app/browser on the PC
        │  DNS query
        ▼
  127.0.0.1:53  ← Windows' DNS is pointed here (Set-DnsClientServerAddress)
   Noor Shield local resolver
        ├── domain on the blocklist → NXDOMAIN (site does not resolve)
        └── anything else → forwarded to 1.1.1.1, reply relayed back
```

This is the desktop equivalent of the Android app's `BlockVpnService`, and
shares its `dnsMessage` logic so both platforms answer the same query the same
way. It is a DNS-level filter: no traffic is proxied, nothing leaves the machine
except ordinary DNS lookups to the upstream resolver.

| Piece | File |
|---|---|
| Local resolver (UDP, id remapping, upstream forwarding) | `src/main/dnsProxy.js` |
| Windows DNS apply/restore, admin detection | `src/main/systemDns.js` |
| Seed + parent-added domain matching | `src/main/blocklist.js` |
| Parent password, recovery key, lockout | `src/main/parentAuth.js` |
| IPC surface and the parent gate | `src/main/main.js`, `src/main/preload.js` |
| UI | `src/renderer/` |

## The parent lock

A parent password is set on first run and gates **everything that changes
protection**:

- turning the filter on or off
- adding or removing blocked sites
- changing reminder settings
- quitting the app

Left deliberately open, with no password: seeing the protection status, reading
the Hadith, and writing in the tawbah journal. The journal is the user's own
spiritual practice, not a protection setting — locking it would serve nobody.

**Where the enforcement actually lives:** in the main process. Every mutating
IPC handler is wrapped in `parentOnly()`, which checks the unlock session in
`ParentAuth` before running. The renderer is a web page; anything it claims
about being unlocked is unverifiable, so it isn't trusted. Hiding a button in
the UI is cosmetic — `parentOnly()` is the lock.

Other details that matter:

- Passwords are stored as **scrypt** hashes (`N=16384, r=8, p=1`) with a random
  per-password salt, compared in constant time. Never plaintext, never
  reversibly encrypted.
- A **one-time recovery key** (`XXXXX-XXXXX-XXXXX-XXXXX`) is shown once at
  setup and stored only as a hash. It's the way back in from a forgotten
  password. Using it burns the old key and issues a new one.
- **Five wrong attempts** locks unlocking for 5 minutes.
- The parent session **auto-relocks after 10 idle minutes**, so an unlocked
  session left open doesn't stay open all day.

## Honest limitations — read before trusting this

1. **Protection is active only while Noor Shield is running.** There is no
   installed Windows service in this MVP. Closing the window keeps it alive in
   the notification area, and quitting needs the parent password — but a user
   who can kill the process in Task Manager stops the filter. Adding a
   Windows service that runs independently of the logged-in user is the main
   thing that would harden this.
2. **A user with their own administrator account can undo it.** Changing DNS
   requires admin, so this is a real barrier for a standard (non-admin) user
   account — which is how a child's account should be set up. It is not a
   barrier for someone who is themselves an administrator. For a family PC,
   give the child a standard account.
3. **Domain filtering has known bypasses.** Sites reached by raw IP address,
   or a browser using its own DNS-over-HTTPS to a hardcoded resolver (Chrome
   and Firefox can both be configured this way), skip DNS filtering entirely.
   Turning off "Secure DNS" in each browser is worth doing alongside this.
4. **The blocklist is a curated seed list, not exhaustive.** No app can
   automatically discover every adult site. Merge in a maintained feed for real
   coverage — see the header of `resources/blocklist_domains.txt`.
5. **UDP only.** DNS over TCP (used for oversized responses) is not currently
   intercepted.

## If the PC loses internet ("DNS not responding")

Because only `127.0.0.1` is set as the DNS server — deliberately, since a
public fallback server would let Windows route around the filter exactly when
it matters — DNS stops resolving if Noor Shield dies while the redirect is in
place. Three ways back:

1. **Start Noor Shield again.** On launch it reconciles: it restarts the
   resolver, or if it can't, puts the old DNS settings back.
2. **Tray menu → "Repair DNS (restore Windows settings)."** Deliberately *not*
   password-protected: a family whose internet is broken shouldn't have to wait
   for the parent to get home. It only restores DNS; it never disables the
   filter's intent, so the next launch resumes protecting.
3. **Manually**, in an admin PowerShell:

   ```powershell
   Get-NetIPInterface -AddressFamily IPv4 |
     ForEach-Object { Set-DnsClientServerAddress -InterfaceIndex $_.ifIndex -ResetServerAddresses }
   Clear-DnsClientCache
   ```

## Running and building

Requires Node 18+ and Windows 10/11. **Must run as Administrator** — changing
DNS and binding port 53 both require it.

```powershell
npm install
npm start          # development
npm run dist       # builds an NSIS installer (requestedExecutionLevel: requireAdministrator)
```

Not yet run or built: this was authored in a Linux sandbox with no Windows
machine and no network access to npm, so `npm install`/`npm start` have never
been executed against it. Expect to fix small things on first run —
particularly the tray icon (`src/renderer/assets/tray.png` is referenced but
not yet added; `createTray()` degrades gracefully without it) and the exact
PowerShell output shapes on your Windows build.

## Keeping the two apps in sync

`resources/blocklist_domains.txt` is intentionally a duplicate of
`noor-shield-app/app/src/main/res/raw/blocklist_domains.txt`. Edit both, or a
family running Noor Shield on the phone and the PC will get different answers
for the same domain. The Hadith set in `src/main/hadith.js` mirrors
`reminders/Hadith.kt` the same way.
