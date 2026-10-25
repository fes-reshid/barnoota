# NoorCleaner

A Windows app that shows **what is taking up your storage**, frees space safely, manages programs,
checks disk health, finds **corrupted files** and **viruses**, and **recovers deleted files**.
It removes only the files *you* choose.

Available in **English, العربية (Arabic) and Afaan Oromoo**. The installer asks which language to
use; it can be changed any time in **Settings**. Arabic mirrors the whole window right-to-left.

It shares Noor Shield's look: the same palette, shield logo, sidebar and rounded panels
(`theme.py` recreates `noor-shield-pc/src/renderer/styles.css` in Tkinter).

## Pages

| Page | |
|---|---|
| **Scan** | Scan the ticked drives and folders. Optionally check for corrupted files, viruses (NoorCleaner's checks plus a full Microsoft Defender scan) and a deep byte-by-byte read. |
| **What's using space** | How full each drive is, the biggest folders (open them to look inside), space by type, and the biggest files. |
| **Junk files** | *Junk files*: Recycle Bin, temporary files, browser cache, thumbnail cache, crash dumps, used Windows Update downloads. *Old downloads*: installers, zip files and disk images in Downloads not touched for 90 days (changeable in Settings). |
| **Duplicates** | *Exact copies* (1 MB+) in your own folders, and *Similar photos* - resized, re-saved and WhatsApp copies of the same picture, best quality listed first. *Select extra copies* keeps one of each. |
| **Programs** | *Installed programs* biggest first, with the program's own uninstaller. *Startup programs*: turn programs on or off at sign-in, exactly like Task Manager does. |
| **Viruses & threats / Corrupted files** | What the scan found. Corrupted Windows files get a *Repair Windows files* button (DISM + SFC). |
| **Disk health** | A plain verdict for each drive (healthy / needs attention / failing) from the drive's own report: temperature, SSD wear, power-on hours, uncorrected errors. Plus Windows' own drive check (`chkdsk /scan`). |
| **All files** | Every file found, searchable, largest first. Export to Excel (CSV). |
| **Recover deleted files** | *Recycle Bin* restore, *Restore points* (copy back files that exist in a Windows restore point but are gone now), and *Permanently deleted* files via Microsoft's free Windows File Recovery tool. |
| **Quarantine** | Files you quarantined, locked so they cannot run. Restore or delete them for good. |
| **Settings** | Language, the junk reminder (off / weekly / monthly), and when downloads count as old. |

For any file you can choose **Quarantine**, **Recycle Bin** or **Delete permanently**. NoorCleaner
always asks first, and gives an extra warning before touching Windows system files.

The **junk reminder** checks quietly when you sign in (only when the chosen week or month has passed)
and shows a small notice if there is more than 300 MB to clean. It never deletes anything itself.

## Getting it

* **From GitHub:** Actions > **NoorCleaner** > *Run workflow*. Download `NoorCleaner-Windows` from the
  run page; it contains **NoorCleaner-Setup.exe** (the installer) and **NoorCleaner.exe** (runs
  without installing; it asks for the language the first time).
* **On your own PC:** install Python 3.10+, then double-click `build.bat`. With
  [Inno Setup 6](https://jrsoftware.org/isinfo.php) installed it also builds the installer.
* **Without building:** `pip install pillow`, then `python noor_cleaner.py`.

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
| `noor_cleaner.py` | The main window, scan/space/junk/duplicates/files/quarantine pages, and start-up |
| `ui_base.py`, `ui_*.py` | Shared layout helpers (incl. right-to-left) and the other pages |
| `theme.py` | Noor Shield styling for Tkinter |
| `i18n.py`, `locales/` | Translations |
| `settings.py`, `reminder.py` | Saved settings, installer hand-off, junk reminder |
| `scanner_core.py`, `cleaner_core.py`, `photos_core.py`, `programs_core.py`, `health_core.py`, `recovery_core.py` | The engines, with no GUI code |
| `installer/NoorCleaner.iss` | The Inno Setup installer with the language page |

The logo and icon come from `assets/logo.svg`; after changing it run `node tools/build_assets.js`.
