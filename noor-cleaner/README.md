# NoorCleaner and NoorGuard, by Noorsoft

Two Windows programs built from one code base, so each does one job:

* **NoorCleaner** shows **what is taking up your storage**, frees space safely, manages programs, checks
  disk health, finds **corrupted files** and **recovers deleted files**.
* **NoorGuard** is the security program: it scans for **viruses**, watches the **network** for attacks
  (with a tray icon and live protection), checks Windows' **security settings** and protects **privacy**.

Both remove only the files *you* choose, share one Quarantine (a file removed by either can be restored
from either) and one settings file, and each has its own installer: `NoorCleaner-Setup.exe` and
`NoorGuard-Setup.exe`.

Available in **English, العربية (Arabic) and Afaan Oromoo**. The installer asks which language to
use; it can be changed any time in **Settings**. Arabic mirrors the whole window right-to-left.

It shares Noor Shield's look: the same palette, shield logo, sidebar and rounded panels
(`theme.py` recreates `noor-shield-pc/src/renderer/styles.css` in Tkinter).

## NoorCleaner pages

| Page | |
|---|---|
| **Scan** | Scan the ticked drives and folders. Optionally check for corrupted files and do a deep byte-by-byte read. Shows free space and the time left. |
| **What's using space** | How full each drive is, the biggest folders (open them to look inside), space by type, and the biggest files. |
| **Junk files** | *Junk files*: Recycle Bin, temporary files, browser cache, thumbnail cache, crash dumps, used Windows Update downloads. *Old downloads*: installers, zip files and disk images in Downloads not touched for 90 days (changeable in Settings). |
| **Duplicates** | *Exact copies* (1 MB+) in your own folders, and *Similar photos* - resized, re-saved and WhatsApp copies of the same picture, best quality listed first. *Select extra copies* keeps one of each. |
| **Programs** | *Installed programs* biggest first, with the program's own uninstaller. *Startup programs*: turn programs on or off at sign-in, exactly like Task Manager does. |
| **Corrupted files** | What the scan found. Corrupted Windows files get a *Repair Windows files* button (DISM + SFC). |
| **Disk health** | A plain verdict for each drive (healthy / needs attention / failing) from the drive's own report: temperature, SSD wear, power-on hours, uncorrected errors. Plus Windows' own drive check (`chkdsk /scan`). |
| **All files** | Every file found, searchable, largest first. Export to Excel (CSV). |
| **Recover deleted files** | *Recycle Bin* restore, *Restore points* (copy back files that exist in a Windows restore point but are gone now), and *Permanently deleted* files via Microsoft's free Windows File Recovery tool. |
| **Quarantine** | Files you quarantined, locked so they cannot run. Restore or delete them for good. |
| **Settings** | Language, scan sound, the junk reminder (off / weekly / monthly), and when downloads count as old. |

## NoorGuard pages

| Page | |
|---|---|
| **Virus scan** | NoorGuard's own checks (known malware, disguised programs, USB worms) plus an optional full Microsoft Defender scan. |
| **Viruses & threats** | What the scan found: quarantine or delete. |
| **Network & ports** | Open ports and who can reach them, connections, attack detection (port scans, floods, password guessing), blocking with Windows Firewall, devices on your Wi-Fi, a router checklist, attack history, optional attacker country, and **live protection** that keeps watching from the tray. |
| **Security check** | Windows protection health with fixes, hiding places (startup, tasks, services, WMI), the hosts file, browser extensions and proxy, remote access, program signatures. |
| **Privacy tools** | Camera and microphone use, password-leak check, secure delete (SSD-aware) and free-space wipe. |
| **Quarantine / Settings** | Shared Quarantine; language, sound and start-with-Windows in the tray. |

For any file you can choose **Quarantine**, **Recycle Bin** or **Delete permanently**. NoorCleaner
always asks first, and gives an extra warning before touching Windows system files.

The **junk reminder** checks quietly when you sign in (only when the chosen week or month has passed)
and shows a small notice if there is more than 300 MB to clean. It never deletes anything itself.

## Getting it

* **From GitHub:** Actions > **NoorCleaner and NoorGuard** > *Run workflow*. It publishes two releases,
  `noorcleaner-latest` and `noorguard-latest`, each with its **-Setup.exe** installer and a plain
  **.exe** (runs without installing; it asks for the language the first time).
* **On your own PC:** install Python 3.10+, then double-click `build.bat`. With
  [Inno Setup 6](https://jrsoftware.org/isinfo.php) installed it also builds the installer.
* **Without building:** `pip install pillow pystray`, then `python noor_cleaner.py` or `python noor_guard.py`.

The installer installs for the current user (no administrator prompt). Right-click NoorCleaner >
**Run as administrator** (or use *Run as admin* in the sidebar) for protected folders, Windows junk,
disk health details and all-users startup programs.

Windows SmartScreen may warn about a new, unsigned app: choose *More info > Run anyway*.

## Translations

All text lives in `locales/ar.json` and `locales/om.json`: the English text on the left, the
translation on the right. To fix a translation, edit the right-hand side and rebuild. After adding
new text to the code, run `python tools/extract_strings.py --update` to add it to both files, then
translate it; the tests fail while any text is untranslated.

The Arabic and Afaan Oromo translations were written without a native-speaker review yet:
corrections are very welcome.

## Good to know

* Files moved to the Recycle Bin still use space until you empty it (Junk files).
* NoorCleaner's own virus checks are **not** a full antivirus. Real virus detection comes from
  Microsoft Defender; keep Windows Security turned on.
* Recovering permanently deleted files works best straight away. On SSDs Windows usually wipes
  deleted data quickly, so the Recycle Bin and restore points are the most reliable way back.

## Development

```
python -m unittest discover -s tests -v
```

| File | |
|---|---|
| `noor_cleaner.py`, `noor_guard.py` | The two entry points |
| `app.py`, `editions.py` | The shared window, and which pages and name each program has |
| `ui_base.py`, `ui_*.py` | Shared layout helpers (incl. right-to-left) and the other pages |
| `theme.py` | Noor Shield styling for Tkinter |
| `i18n.py`, `locales/` | Translations |
| `settings.py`, `reminder.py` | Saved settings, installer hand-off, junk reminder |
| `scanner_core.py`, `cleaner_core.py`, `photos_core.py`, `programs_core.py`, `health_core.py`, `recovery_core.py`, `network_core.py`, `security_core.py`, `privacy_core.py` | The engines, with no GUI code |
| `installer/NoorApp.iss` | The Inno Setup installer for both programs (`/DAppKey=cleaner` or `guard`) with the language page |

The logo and icon come from `assets/logo.svg`; after changing it run `node tools/build_assets.js`.
