# NoorCleaner

A Windows app that shows **what is taking up your storage**, frees space safely, and finds
**corrupted files** and **viruses**. It removes only the files *you* choose.

It shares Noor Shield's look: the same palette, shield logo, sidebar and rounded panels
(`theme.py` recreates `noor-shield-pc/src/renderer/styles.css` in Tkinter).

## What it does

| Page | |
|---|---|
| **What's using space** | How full each drive is, the **biggest folders** (open them to see what's inside), space **by type** (videos, photos, music, documents, installers...) and the **biggest files**. |
| **Junk files** | Safe-to-delete clutter with its size: Recycle Bin, temporary files, browser cache (Chrome, Edge, Brave, Opera, Firefox), thumbnail cache, crash dumps, used Windows Update downloads. Untick anything you want to keep, then *Clean selected*. A button opens Windows Disk Cleanup for things like old Windows versions. |
| **Duplicates** | Identical files (1 MB+) in your own folders, with how much space the extra copies use. *Select extra copies* keeps the oldest copy of each. |
| **Viruses & threats** | Optional full **Microsoft Defender** scan, plus NoorCleaner's own checks: known-malware hashes (`signatures.txt`), files Windows Security blocks, programs disguised as documents (`invoice.pdf.exe`), scripts in the Startup folder, USB `autorun.inf` worms. |
| **Corrupted files** | Empty or wiped files, cut-off downloads/copies (PDF, photos, videos, Office files, ZIPs, programs) and files the disk can no longer read. *Deep scan* also reads every byte. A button runs Microsoft's own repair for Windows system files (DISM + SFC). |
| **All files** | Every file found, searchable, largest first. Export the full list to Excel (CSV). |
| **Quarantine** | Files you quarantined, locked so they cannot run. Restore or delete them for good. |

For any file you can choose **Quarantine**, **Move to Recycle Bin** or **Delete permanently**.
NoorCleaner always asks first, and gives an extra warning before touching Windows system files.

## Getting NoorCleaner.exe

* **From GitHub:** Actions > **NoorCleaner** > *Run workflow*. When it finishes, download
  `NoorCleaner-Windows` from the run page and unzip it.
* **On your own PC:** install Python 3.10+ from python.org, then double-click `build.bat`.
  The app is created at `dist\NoorCleaner.exe`.
* **Without building:** `python noor_cleaner.py`

Right-click > **Run as administrator** to include protected folders and the Windows junk categories.

Windows SmartScreen may warn about a new, unsigned app: choose *More info > Run anyway*.

## Good to know

* Files moved to the Recycle Bin still use space until you empty it (Junk files tab).
* NoorCleaner's own virus checks are **not** a full antivirus. Real virus detection comes from
  Microsoft Defender, which NoorCleaner runs for you; keep Windows Security turned on.
* To test virus detection safely, save the harmless [EICAR test file](https://www.eicar.org/download-anti-malware-testfile/)
  and scan its folder.
* Add your own known-malware hashes to `%LOCALAPPDATA%\NoorCleaner\signatures.txt`
  (`<sha256>  <name>` per line).

## Development

```
python -m unittest discover -s tests -v
```

`scanner_core.py` walks the drives and checks for corruption and threats, `cleaner_core.py` works out
storage use, junk and duplicates, `noor_cleaner.py` is the window and `theme.py` its Noor Shield styling
(Tkinter, standard library only). The logo and icon come from `assets/logo.svg`; after changing it run
`node tools/build_assets.js` to regenerate `logo_data.py` and `assets/icon.ico`.
