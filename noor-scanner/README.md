# NoorScanner

A Windows app that scans your drives, lists every file, finds **corrupted files** and
**viruses**, and removes only the files *you* choose.

## What it does

| | |
|---|---|
| **Scan** | Every ticked drive (C:, D:, USB sticks...) plus any folders you add. |
| **All files** | Every file found, with search, size and date. Export the full list to Excel (CSV). |
| **Corrupted files** | Empty or wiped files, cut-off downloads/copies (PDF, JPEG, PNG, GIF, BMP, MP4/MOV, WAV/AVI/WebP), broken Office documents and archives (DOCX/XLSX/PPTX/ZIP/APK...), truncated programs (EXE/DLL), and files the disk can no longer read. *Deep scan* also reads every byte and verifies internal checksums. |
| **Viruses & threats** | Runs **Microsoft Defender**'s virus engine on the same drives, and adds its own checks: a known-malware hash list (`signatures.txt`), files Windows Security blocks, programs disguised with double extensions (`invoice.pdf.exe`) or hidden right-to-left characters, scripts dropped in the Startup folder, and USB `autorun.inf` worms. |
| **Remove on request** | Select files, then **Quarantine** (locked away, restorable), **Move to Recycle Bin**, or **Delete permanently**. Every action asks first. Windows system files get an extra warning and a **Repair Windows system files** button (DISM + SFC) instead. |

Nothing is ever deleted automatically.

## Getting NoorScanner.exe

* **From GitHub:** Actions > **NoorScanner** > *Run workflow*. When it finishes, download
  `NoorScanner-Windows` from the run page and unzip it.
* **On your own PC:** install Python 3.10+ from python.org, then double-click `build.bat`.
  The app is created at `dist\NoorScanner.exe`.
* **Without building:** `python noor_scanner.py`

Right-click > **Run as administrator** to also check protected folders and let Defender scan everything.

Windows SmartScreen may warn about a new, unsigned app: choose *More info > Run anyway*.

## Good to know

* NoorScanner's own checks are **not** a full antivirus. Real virus detection comes from
  Microsoft Defender, which NoorScanner drives for you; keep Windows Security turned on and updated.
* To test virus detection safely, save the harmless [EICAR test file](https://www.eicar.org/download-anti-malware-testfile/)
  and scan its folder.
* Add your own known-malware hashes to `%LOCALAPPDATA%\NoorScanner\signatures.txt`
  (`<sha256>  <name>` per line).
* Quarantined files live in `%LOCALAPPDATA%\NoorScanner\Quarantine`, renamed to `.quarantined` so they cannot run.

## Development

```
python -m unittest discover -s tests -v
```

`scanner_core.py` is the engine (no GUI), `noor_scanner.py` is the window (Tkinter, standard library only).
