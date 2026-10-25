"""NoorCleaner scanning engine.

Walks drives and folders, checks each file for corruption and threats, and
recycles, quarantines or deletes the files the user picks. Nothing here touches
a file unless one of the delete/quarantine functions is called explicitly.

Kept free of any GUI code so it can be tested on its own.
"""

import ctypes
import errno
import glob
import gzip
import hashlib
import json
import os
import re
import shutil
import stat
import string
import struct
import subprocess
import sys
import threading
import time
import zipfile
import zlib
from dataclasses import dataclass

IS_WINDOWS = sys.platform == "win32"

APP_DIR = os.path.join(
    os.environ.get("LOCALAPPDATA") or os.path.expanduser("~/.local/share"), "NoorCleaner"
)
QUARANTINE_DIR = os.path.join(APP_DIR, "Quarantine")
QUARANTINE_INDEX = os.path.join(QUARANTINE_DIR, "index.json")

CORRUPTED = "corrupted"
THREAT = "threat"
SUSPICIOUS = "suspicious"

# Windows error codes that mean the disk itself could not return the data.
_DISK_WINERRORS = {23, 483, 1117, 1392}  # CRC error, hardware error, I/O device error, file corrupt
# Windows refuses to open a file because its own antivirus has flagged it.
_VIRUS_WINERRORS = {225, 226}  # ERROR_VIRUS_INFECTED, ERROR_VIRUS_DELETED
# Online-only cloud files (OneDrive etc.): reading them would download them.
_CLOUD_ONLY = 0x1000 | 0x40000 | 0x400000  # OFFLINE, RECALL_ON_OPEN, RECALL_ON_DATA_ACCESS

_SKIP_NAMES = {"pagefile.sys", "hiberfil.sys", "swapfile.sys", "dumpstack.log.tmp"}
_SKIP_DIRS = {"system volume information"}

ZIP_TYPES = {".zip", ".docx", ".xlsx", ".pptx", ".docm", ".xlsm", ".pptm", ".odt", ".ods",
             ".odp", ".epub", ".jar", ".apk", ".xps", ".vsix", ".nupkg", ".appx", ".msix"}
OLE_TYPES = {".doc", ".xls", ".ppt", ".msi", ".msg", ".pub", ".vsd"}
PE_TYPES = {".exe", ".dll", ".sys", ".scr", ".ocx", ".cpl", ".efi", ".drv"}
MP4_TYPES = {".mp4", ".m4a", ".m4v", ".mov", ".3gp", ".heic", ".avif"}
JPEG_TYPES = {".jpg", ".jpeg", ".jfif"}
RIFF_TYPES = {".wav", ".avi", ".webp"}

# Formats that are never legitimately empty: a 0-byte one has lost its contents.
NEVER_EMPTY = (ZIP_TYPES | OLE_TYPES | PE_TYPES | MP4_TYPES | JPEG_TYPES | RIFF_TYPES
               | {".pdf", ".png", ".gif", ".bmp", ".7z", ".rar", ".gz", ".mp3", ".mkv"})

# Programs and scripts: the file types worth hashing against the signature list.
RUNNABLE_TYPES = PE_TYPES | {".com", ".bat", ".cmd", ".vbs", ".vbe", ".js", ".jse", ".wsf",
                             ".wsh", ".hta", ".ps1", ".pif", ".lnk", ".msi", ".jar"}
# Extensions people trust; a runnable file pretending to be one of these is a classic trick.
DOCUMENT_LOOKALIKES = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt",
                       ".rtf", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".mp3", ".mp4",
                       ".avi", ".mov", ".wav", ".zip", ".rar", ".html", ".htm"}
MAX_HASH_SIZE = 50 * 1024 * 1024

# The EICAR antivirus test string, split so this file itself is not detected as one.
_EICAR = (b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$" +
          b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*")


@dataclass(slots=True)  # one per file on the disk, so keep them small
class FileEntry:
    path: str
    size: int
    mtime: float


@dataclass
class Finding:
    path: str
    kind: str          # CORRUPTED, THREAT or SUSPICIOUS
    reason: str
    size: int = 0
    source: str = "NoorCleaner"


# --------------------------------------------------------------------------- drives

def list_drives():
    """Every mounted drive root (C:\\, D:\\, ...) on Windows, or / elsewhere."""
    if not IS_WINDOWS:
        return ["/"]
    mask = ctypes.windll.kernel32.GetLogicalDrives()
    return [f"{letter}:\\" for i, letter in enumerate(string.ascii_uppercase) if mask >> i & 1]


def drive_label(root):
    if not IS_WINDOWS:
        return root
    kinds = {2: "Removable", 3: "Local disk", 4: "Network", 5: "CD/DVD", 6: "RAM disk"}
    kind = kinds.get(ctypes.windll.kernel32.GetDriveTypeW(root), "Drive")
    return f"{root}  ({kind})"


class BlockedAsVirus(Exception):
    """Windows Security would not let the file be read because it detected a virus."""


# --------------------------------------------------------------------------- reading helpers

def _is_disk_error(exc):
    return getattr(exc, "winerror", None) in _DISK_WINERRORS or exc.errno == errno.EIO


def _all_zero(data):
    return bool(data) and not data.strip(b"\x00")


def _looks_like_text(data):
    sample = data[:512]
    if sample.startswith((b"\xef\xbb\xbf", b"\xff\xfe", b"\xfe\xff")):
        return True
    return bool(sample) and all(b in b"\t\r\n" or 32 <= b < 127 or b >= 128 for b in sample)


def read_whole_file(path, cancel=None):
    """Reads every byte, so a damaged disk sector surfaces as an OSError."""
    with open(path, "rb") as f:
        while f.read(1024 * 1024):
            if cancel is not None and cancel.is_set():
                return


# --------------------------------------------------------------------------- corruption

def check_corruption(path, size, deep=False, cancel=None):
    """Returns a plain-language description of what is wrong with the file, or None."""
    ext = os.path.splitext(path)[1].lower()
    if size == 0:
        if ext in NEVER_EMPTY:
            return "File is empty (0 bytes) - its contents have been lost."
        return None
    try:
        if deep:
            read_whole_file(path, cancel)
        if ext not in NEVER_EMPTY:
            return None
        with open(path, "rb") as f:
            head = f.read(4096)
            f.seek(max(0, size - 4096))
            tail = f.read(4096)
            return _check_format(path, f, ext, size, head, tail, deep)
    except OSError as exc:
        if getattr(exc, "winerror", None) in _VIRUS_WINERRORS:
            raise BlockedAsVirus(path) from exc
        if isinstance(exc, PermissionError):
            return None  # in use or protected: cannot judge, so do not accuse it
        if _is_disk_error(exc):
            return "The disk could not read this file (damaged sector or failing drive)."
        return None


def _check_format(path, f, ext, size, head, tail, deep):
    if _all_zero(head):
        return "The start of the file is blank (all zeros) - the data has been wiped or damaged."

    if ext in ZIP_TYPES:
        if not head.startswith((b"PK\x03\x04", b"PK\x05\x06")):
            return "Not a valid archive/Office file (wrong header)."
        try:
            with zipfile.ZipFile(path) as zf:
                if deep:
                    bad = zf.testzip()
                    if bad:
                        return f"Damaged data inside the file (part '{bad}' fails its checksum)."
        except zipfile.BadZipFile:
            return "The file structure is broken (incomplete copy or download)."
        except (RuntimeError, NotImplementedError):
            pass  # password-protected or unusual compression: cannot verify
        except (zlib.error, EOFError):
            return "Damaged compressed data inside the file."
        return None

    if ext in OLE_TYPES:
        if head.startswith((b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1", b"PK\x03\x04", b"{\\rtf")):
            return None
        if _looks_like_text(head):
            return None  # old Office happily saves HTML/CSV under these names
        return "Not a valid Office file (wrong header)."

    if ext == ".pdf":
        if b"%PDF" not in head[:1024]:
            return "Not a valid PDF (missing PDF header)."
        if b"%%EOF" not in tail:
            return "The PDF is cut off (missing end marker) - probably an incomplete download or copy."
        return None

    if ext == ".png":
        if not head.startswith(b"\x89PNG\r\n\x1a\n"):
            return "Not a valid PNG image (wrong header)."
        if b"IEND" not in tail[-64:]:
            return "The image is cut off (missing end of image)."
        if deep:
            return _check_png_chunks(f, size)
        return None

    if ext in JPEG_TYPES:
        if not head.startswith(b"\xff\xd8\xff"):
            return "Not a valid JPEG image (wrong header)."
        if b"\xff\xd9" not in tail:
            return "The image is cut off (missing end of image)."
        return None

    if ext == ".gif":
        if not head.startswith((b"GIF87a", b"GIF89a")):
            return "Not a valid GIF image (wrong header)."
        if not tail.rstrip(b"\x00").endswith(b";"):
            return "The image is cut off (missing end of image)."
        return None

    if ext == ".bmp":
        if not head.startswith(b"BM") or len(head) < 6:
            return "Not a valid BMP image (wrong header)."
        declared = struct.unpack_from("<I", head, 2)[0]
        if declared > size:
            return "The image is cut off (file is smaller than its header says)."
        return None

    if ext in RIFF_TYPES:
        if not head.startswith(b"RIFF") or len(head) < 12:
            return "Not a valid media file (wrong header)."
        declared = struct.unpack_from("<I", head, 4)[0] + 8
        if declared > size:
            return "The file is cut off (smaller than its header says)."
        return None

    if ext in MP4_TYPES:
        return _check_mp4_boxes(f, size, head)

    if ext in PE_TYPES:
        return _check_pe(f, size, head)

    if ext == ".7z" and not head.startswith(b"7z\xbc\xaf\x27\x1c"):
        return "Not a valid 7-Zip archive (wrong header)."
    if ext == ".rar" and not head.startswith(b"Rar!\x1a\x07"):
        return "Not a valid RAR archive (wrong header)."
    if ext == ".gz":
        if not head.startswith(b"\x1f\x8b"):
            return "Not a valid GZip archive (wrong header)."
        if deep:
            try:
                with gzip.open(path, "rb") as gz:
                    while gz.read(1024 * 1024):
                        pass
            except (OSError, EOFError, zlib.error):
                return "Damaged compressed data inside the archive."
    return None


def _check_png_chunks(f, size):
    f.seek(8)
    while f.tell() < size:
        header = f.read(8)
        if len(header) < 8:
            return "The image is cut off (incomplete data block)."
        length, kind = struct.unpack(">I4s", header)
        data = f.read(length)
        crc = f.read(4)
        if len(data) < length or len(crc) < 4:
            return "The image is cut off (incomplete data block)."
        if zlib.crc32(kind + data) & 0xFFFFFFFF != struct.unpack(">I", crc)[0]:
            return f"Damaged image data (block '{kind.decode('latin-1')}' fails its checksum)."
        if kind == b"IEND":
            return None
    return "The image is cut off (missing end of image)."


def _check_mp4_boxes(f, size, head):
    if len(head) < 8 or head[4:8] not in (b"ftyp", b"moov", b"mdat", b"wide", b"free", b"skip"):
        return "Not a valid video/audio file (wrong header)."
    pos = 0
    while pos < size:
        f.seek(pos)
        header = f.read(16)
        if len(header) < 8:
            return "The file is cut off (incomplete data block)."
        box_size = struct.unpack(">I", header[:4])[0]
        if box_size == 1:
            if len(header) < 16:
                return "The file is cut off (incomplete data block)."
            box_size = struct.unpack(">Q", header[8:16])[0]
        elif box_size == 0:
            return None  # box runs to the end of the file
        if box_size < 8:
            return "The file structure is broken (invalid data block)."
        if pos + box_size > size:
            return "The video/audio is cut off - probably an incomplete download, copy or recording."
        pos += box_size
    return None


def _check_pe(f, size, head):
    if not head.startswith(b"MZ"):
        return "Not a valid Windows program (missing 'MZ' header)."
    if len(head) < 0x40:
        return "The program file is cut off."
    pe_offset = struct.unpack_from("<I", head, 0x3C)[0]
    if pe_offset + 24 > size:
        return "The program file is cut off (missing PE header)."
    f.seek(pe_offset)
    pe = f.read(24)
    if pe[:4] != b"PE\x00\x00":
        return None  # old DOS/16-bit program: nothing more to check
    sections, opt_size = struct.unpack_from("<H12xH", pe, 6)
    f.seek(pe_offset + 24 + opt_size)
    table = f.read(40 * sections)
    if len(table) < 40 * sections:
        return "The program file is cut off (incomplete section table)."
    for i in range(sections):
        raw_size, raw_ptr = struct.unpack_from("<II", table, 40 * i + 16)
        if raw_size and raw_ptr + raw_size > size:
            return "The program file is cut off - it will not run (incomplete install or download)."
    return None


# --------------------------------------------------------------------------- threats

def load_signatures(paths):
    """Reads 'sha256  name' lines from each existing file into a {hash: name} dict."""
    signatures = {}
    for path in paths:
        try:
            with open(path, encoding="utf-8") as f:
                for line in f:
                    line = line.split("#", 1)[0].strip()
                    if not line:
                        continue
                    digest, _, name = line.partition(" ")
                    if re.fullmatch(r"[0-9a-fA-F]{64}", digest):
                        signatures[digest.lower()] = name.strip() or "Known malware"
        except OSError:
            pass
    return signatures


def default_signature_files():
    here = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return [os.path.join(here, "signatures.txt"), os.path.join(APP_DIR, "signatures.txt")]


def sha256_of(path, cancel=None):
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            if cancel is not None and cancel.is_set():
                return None
            digest.update(block)
    return digest.hexdigest()


def _startup_folders():
    folders = []
    for var, sub in (("APPDATA", r"Microsoft\Windows\Start Menu\Programs\Startup"),
                     ("PROGRAMDATA", r"Microsoft\Windows\Start Menu\Programs\StartUp")):
        if os.environ.get(var):
            folders.append(os.path.normcase(os.path.join(os.environ[var], sub)))
    return folders


_STARTUP_FOLDERS = _startup_folders()


def check_threat(path, size, signatures, cancel=None):
    """Returns (kind, reason) for a threat or suspicious file, or None."""
    name = os.path.basename(path)
    ext = os.path.splitext(name)[1].lower()
    try:
        if len(_EICAR) <= size <= 128:
            with open(path, "rb") as f:
                if f.read(128).startswith(_EICAR):
                    return THREAT, "EICAR antivirus test file (harmless, made for testing scanners)"
        if signatures and ext in RUNNABLE_TYPES and size <= MAX_HASH_SIZE:
            digest = sha256_of(path, cancel)
            if digest in signatures:
                return THREAT, f"Known malware: {signatures[digest]}"
    except OSError as exc:
        if getattr(exc, "winerror", None) in _VIRUS_WINERRORS:
            return THREAT, "Windows Security blocked this file because it contains a virus"

    if "\u202e" in name:
        return SUSPICIOUS, "Name uses a hidden right-to-left character to disguise its real type"
    if ext in RUNNABLE_TYPES:
        stem = os.path.splitext(name)[0]
        inner = os.path.splitext(stem.rstrip(" ."))[1].lower()
        if inner in DOCUMENT_LOOKALIKES:
            return SUSPICIOUS, f"Program disguised as a '{inner}' file (double extension) - a common virus trick"
        if re.search(r"\s{5,}$", stem):
            return SUSPICIOUS, "Program name is padded with spaces to hide its real type"
        if os.path.normcase(os.path.dirname(path)) in _STARTUP_FOLDERS and ext != ".lnk":
            return SUSPICIOUS, "Program/script placed directly in the Startup folder (runs at every login)"
    if name.lower() == "autorun.inf" and os.path.dirname(path) == os.path.splitdrive(path)[0] + os.sep:
        try:
            with open(path, "rb") as f:
                text = f.read(8192).lower()
            if re.search(rb"^\s*(open|shellexecute|shell\\[^=]*\\command)\s*=", text, re.M):
                return SUSPICIOUS, "Drive autorun file that launches a program (typical of USB worms)"
        except OSError:
            pass
    return None


# --------------------------------------------------------------------------- Microsoft Defender

def find_defender():
    """Path to MpCmdRun.exe (newest platform version first), or None."""
    if not IS_WINDOWS:
        return None
    candidates = glob.glob(os.path.join(os.environ.get("PROGRAMDATA", r"C:\ProgramData"),
                                        r"Microsoft\Windows Defender\Platform\*\MpCmdRun.exe"))

    def version_key(path):
        version = os.path.basename(os.path.dirname(path))
        return [int(p) if p.isdigit() else 0 for p in re.split(r"[.-]", version)]

    candidates.sort(key=version_key, reverse=True)
    candidates.append(os.path.join(os.environ.get("PROGRAMFILES", r"C:\Program Files"),
                                   r"Windows Defender\MpCmdRun.exe"))
    return next((c for c in candidates if os.path.isfile(c)), None)


def parse_defender_output(text):
    """Pulls (threat name, file path) pairs out of MpCmdRun's report."""
    found = []
    threat = None
    for line in text.splitlines():
        key, sep, value = line.partition(":")
        if not sep:
            continue
        key, value = key.strip().lower(), value.strip()
        if key == "threat":
            threat = value
        elif key in ("file", "containerfile") and threat:
            # "C:\x.zip->inner.exe" names a file inside an archive: the archive is what we act on.
            found.append((threat, value.split("->", 1)[0].strip()))
    return found


def defender_scan(root, cancel, timeout=None):
    """Runs a Defender custom scan of root without letting it remove anything.

    Returns a list of (threat name, path). Raises RuntimeError if Defender is
    missing, disabled, or reports an error.
    """
    exe = find_defender()
    if not exe:
        raise RuntimeError("Microsoft Defender was not found on this computer.")
    flags = subprocess.CREATE_NO_WINDOW if IS_WINDOWS else 0
    proc = subprocess.Popen([exe, "-Scan", "-ScanType", "3", "-File", root, "-DisableRemediation"],
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            creationflags=flags)
    output = []
    reader = threading.Thread(target=lambda: output.append(proc.stdout.read()), daemon=True)
    reader.start()
    started = time.monotonic()
    while proc.poll() is None:
        if cancel.is_set() or (timeout and time.monotonic() - started > timeout):
            proc.kill()
            return []
        time.sleep(0.3)
    reader.join(5)
    text = b"".join(output).decode("utf-8", "replace")
    if proc.returncode not in (0, 2):  # 0 = clean, 2 = threats found
        last = next((l for l in reversed(text.splitlines()) if l.strip()), "no details")
        raise RuntimeError(f"Microsoft Defender could not scan {root}: {last.strip()}")
    return parse_defender_output(text)


# --------------------------------------------------------------------------- scanning

class Scanner:
    """Walks the given roots on the calling thread and reports through callbacks.

    on_file(FileEntry), on_finding(Finding), on_progress(files_seen, current_dir)
    and on_status(text) are all optional.
    """

    def __init__(self, roots, check_corrupted=True, check_threats=True,
                 use_defender=False, deep=False, signatures=None,
                 on_file=None, on_finding=None, on_progress=None, on_status=None):
        self.roots = roots
        self.check_corrupted = check_corrupted
        self.check_threats = check_threats
        self.use_defender = use_defender
        self.deep = deep
        self.signatures = signatures or {}
        self.on_file = on_file or (lambda e: None)
        self.on_finding = on_finding or (lambda f: None)
        self.on_progress = on_progress or (lambda n, d: None)
        self.on_status = on_status or (lambda s: None)
        self.cancel = threading.Event()
        self.files_seen = 0
        self.skipped_dirs = 0
        self.errors = []
        self._quarantine = os.path.normcase(os.path.abspath(QUARANTINE_DIR))

    def stop(self):
        self.cancel.set()

    def run(self):
        for root in self.roots:
            if self.cancel.is_set():
                break
            self.on_status(f"Scanning {root}")
            self._walk(root)
        if self.use_defender and not self.cancel.is_set():
            for root in self.roots:
                if self.cancel.is_set():
                    break
                self.on_status(f"Microsoft Defender is scanning {root} (this can take a while)...")
                try:
                    for threat, path in defender_scan(root, self.cancel):
                        size = os.path.getsize(path) if os.path.isfile(path) else 0
                        self.on_finding(Finding(path, THREAT, threat, size, "Microsoft Defender"))
                except (RuntimeError, OSError) as exc:
                    self.errors.append(str(exc))
        self.on_status("Scan stopped." if self.cancel.is_set() else "Scan finished.")

    def _walk(self, root):
        stack = [root]
        last_report = 0.0
        while stack and not self.cancel.is_set():
            folder = stack.pop()
            if os.path.normcase(os.path.abspath(folder)) == self._quarantine:
                continue
            try:
                with os.scandir(folder) as it:
                    entries = list(it)
            except OSError:
                self.skipped_dirs += 1
                continue
            for entry in entries:
                if self.cancel.is_set():
                    return
                try:
                    if entry.is_symlink():
                        continue
                    st = entry.stat(follow_symlinks=False)
                    attributes = getattr(st, "st_file_attributes", 0)
                    if entry.is_dir(follow_symlinks=False):
                        # Junctions point at folders that are scanned under their real path.
                        if (not attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT
                                and entry.name.lower() not in _SKIP_DIRS):
                            stack.append(entry.path)
                        continue
                    if entry.name.lower() in _SKIP_NAMES or attributes & _CLOUD_ONLY:
                        continue
                except OSError:
                    continue
                self._scan_file(entry.path, st.st_size, st.st_mtime)
                now = time.monotonic()
                if now - last_report > 0.1:
                    last_report = now
                    self.on_progress(self.files_seen, folder)
        self.on_progress(self.files_seen, root)

    def _scan_file(self, path, size, mtime):
        self.files_seen += 1
        self.on_file(FileEntry(path, size, mtime))
        if self.check_threats:
            hit = check_threat(path, size, self.signatures, self.cancel)
            if hit:
                self.on_finding(Finding(path, hit[0], hit[1], size))
                return
        if self.check_corrupted:
            try:
                problem = check_corruption(path, size, self.deep, self.cancel)
            except BlockedAsVirus:
                self.on_finding(Finding(path, THREAT, "Windows Security blocked this file because "
                                                      "it contains a virus", size, "Windows Security"))
                return
            if problem:
                self.on_finding(Finding(path, CORRUPTED, problem, size))


# --------------------------------------------------------------------------- removing files

def is_protected(path):
    """True for Windows system files, which should be repaired rather than deleted."""
    if not IS_WINDOWS:
        return False
    windir = os.path.normcase(os.environ.get("SYSTEMROOT", r"C:\Windows"))
    target = os.path.normcase(os.path.abspath(path))
    drive_root = os.path.splitdrive(target)[0] + os.sep
    return (target.startswith(windir + os.sep)
            or target in (os.path.join(drive_root, "bootmgr"), os.path.join(drive_root, "bootnxt")))


def _make_writable(path):
    try:
        os.chmod(path, stat.S_IWRITE | stat.S_IREAD)
    except OSError:
        pass


def delete_permanently(path):
    _make_writable(path)
    os.remove(path)


def move_to_recycle_bin(path):
    """Sends the file to the Windows Recycle Bin so it can still be restored."""
    if not IS_WINDOWS:
        quarantine(path, "Moved to bin")
        return
    from ctypes import wintypes

    class SHFILEOPSTRUCTW(ctypes.Structure):
        _fields_ = [("hwnd", wintypes.HWND), ("wFunc", wintypes.UINT),
                    ("pFrom", wintypes.LPCWSTR), ("pTo", wintypes.LPCWSTR),
                    ("fFlags", ctypes.c_uint16), ("fAnyOperationsAborted", wintypes.BOOL),
                    ("hNameMappings", ctypes.c_void_p), ("lpszProgressTitle", wintypes.LPCWSTR)]

    FO_DELETE, FOF_SILENT, FOF_NOCONFIRMATION, FOF_ALLOWUNDO, FOF_NOERRORUI = 3, 4, 0x10, 0x40, 0x400
    op = SHFILEOPSTRUCTW(wFunc=FO_DELETE, pFrom=os.path.abspath(path) + "\0",
                         fFlags=FOF_SILENT | FOF_NOCONFIRMATION | FOF_ALLOWUNDO | FOF_NOERRORUI)
    result = ctypes.windll.shell32.SHFileOperationW(ctypes.byref(op))
    if result or op.fAnyOperationsAborted or os.path.exists(path):
        raise OSError(f"Windows could not move the file to the Recycle Bin (code {result}).")


def _read_index():
    try:
        with open(QUARANTINE_INDEX, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return []


def _write_index(items):
    os.makedirs(QUARANTINE_DIR, exist_ok=True)
    tmp = QUARANTINE_INDEX + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=1)
    os.replace(tmp, QUARANTINE_INDEX)


def quarantine(path, reason=""):
    """Moves the file into NoorCleaner's quarantine, renamed so it cannot run."""
    os.makedirs(QUARANTINE_DIR, exist_ok=True)
    stored = os.path.join(QUARANTINE_DIR, f"{time.strftime('%Y%m%d-%H%M%S')}-"
                                          f"{os.urandom(3).hex()}-{os.path.basename(path)}.quarantined")
    _make_writable(path)
    shutil.move(path, stored)
    items = _read_index()
    items.append({"stored": stored, "original": os.path.abspath(path), "reason": reason,
                  "date": time.strftime("%Y-%m-%d %H:%M")})
    _write_index(items)
    return stored


def list_quarantine():
    return [item for item in _read_index() if os.path.exists(item["stored"])]


def restore_from_quarantine(stored):
    items = _read_index()
    item = next(i for i in items if i["stored"] == stored)
    target = item["original"]
    if os.path.exists(target):
        base, ext = os.path.splitext(target)
        target = f"{base} (restored){ext}"
    os.makedirs(os.path.dirname(target), exist_ok=True)
    shutil.move(stored, target)
    _write_index([i for i in items if i["stored"] != stored])
    return target


def delete_from_quarantine(stored):
    if os.path.exists(stored):
        delete_permanently(stored)
    _write_index([i for i in _read_index() if i["stored"] != stored])


def repair_windows_system_files():
    """Opens an administrator window running Microsoft's own system-file repair tools."""
    if not IS_WINDOWS:
        raise RuntimeError("System file repair is only available on Windows.")
    command = ("/k echo NoorCleaner: repairing Windows system files. Keep this window open. && "
               "DISM /Online /Cleanup-Image /RestoreHealth && sfc /scannow")
    result = ctypes.windll.shell32.ShellExecuteW(None, "runas", "cmd.exe", command, None, 1)
    if result <= 32:
        raise RuntimeError("Windows did not allow the repair to start (administrator approval is needed).")
