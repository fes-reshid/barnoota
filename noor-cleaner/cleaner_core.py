"""NoorCleaner storage engine.

Works out what is using disk space (folders, file types, biggest files),
finds junk that is safe to clear and duplicate files. Like scanner_core,
nothing is deleted unless clean_junk() or the scanner_core removal
functions are called explicitly.
"""

import ctypes
import fnmatch
import glob
import hashlib
import heapq
import os
import shutil
import stat
import time
from collections import defaultdict
from dataclasses import dataclass, field

import scanner_core as core

FILE_TYPES = {
    "Videos": {".mp4", ".mkv", ".avi", ".mov", ".wmv", ".m4v", ".flv", ".webm", ".mpg", ".mpeg", ".3gp", ".ts"},
    "Photos & pictures": {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".heic", ".webp", ".tif", ".tiff", ".raw",
                          ".cr2", ".nef", ".arw", ".psd", ".svg", ".ico", ".avif"},
    "Music & audio": {".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg", ".wma", ".opus"},
    "Documents": {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".rtf", ".odt", ".ods",
                  ".odp", ".epub", ".csv", ".md", ".pub", ".one"},
    "Archives & disk images": {".zip", ".rar", ".7z", ".gz", ".tar", ".bz2", ".xz", ".iso", ".img", ".vhd",
                               ".vhdx", ".vmdk", ".wim", ".esd", ".cab"},
    "Programs & installers": {".exe", ".msi", ".dll", ".sys", ".msix", ".appx", ".apk", ".jar", ".ocx"},
    "Game & app data": {".pak", ".vpk", ".bundle", ".asset", ".dat", ".db", ".sqlite", ".bin"},
}
_TYPE_OF = {ext: name for name, exts in FILE_TYPES.items() for ext in exts}


def file_type(path):
    return _TYPE_OF.get(os.path.splitext(path)[1].lower(), "Other")


# --------------------------------------------------------------------------- what uses the space

@dataclass
class StorageReport:
    totals: dict    # folder -> [bytes, files], counting everything below it
    direct: dict    # folder -> [bytes, files] directly inside it
    children: dict  # folder -> [subfolders that contain files]
    by_type: dict   # file type -> [bytes, files]
    biggest: list   # the largest FileEntry objects, biggest first
    total_bytes: int = 0
    total_files: int = 0

    @classmethod
    def build(cls, entries, top=300):
        totals, direct, by_type = {}, {}, defaultdict(lambda: [0, 0])
        total = 0
        for e in entries:
            size = e.size
            total += size
            folder = os.path.dirname(e.path)
            here = direct.get(folder)
            if here is None:
                direct[folder] = [size, 1]
            else:
                here[0] += size
                here[1] += 1
            while True:
                t = totals.get(folder)
                if t is None:
                    totals[folder] = [size, 1]
                else:
                    t[0] += size
                    t[1] += 1
                parent = os.path.dirname(folder)
                if parent == folder:
                    break
                folder = parent
            kind = by_type[file_type(e.path)]
            kind[0] += size
            kind[1] += 1
        children = defaultdict(list)
        for folder in totals:
            parent = os.path.dirname(folder)
            if parent != folder:
                children[parent].append(folder)
        for subfolders in children.values():
            subfolders.sort(key=lambda f: totals[f][0], reverse=True)
        biggest = heapq.nlargest(top, entries, key=lambda e: e.size)
        return cls(totals, direct, dict(children), dict(by_type), biggest, total, len(entries))


def drive_usage(root):
    """(total, used, free) bytes for the drive holding root, or None if it is not ready."""
    try:
        usage = shutil.disk_usage(root)
    except OSError:
        return None
    return usage.total, usage.used, usage.free


# --------------------------------------------------------------------------- junk

@dataclass
class JunkCategory:
    key: str
    name: str
    description: str
    folders: list = field(default_factory=list)   # glob patterns; their contents are junk
    patterns: tuple = ("*",)                      # file names to clear inside them
    min_age_hours: int = 0                        # leave newer files alone (may be in use)
    needs_admin: bool = False

    def existing_folders(self):
        found = []
        for pattern in self.folders:
            for folder in glob.glob(pattern):
                folder = os.path.normpath(folder)
                if os.path.isdir(folder) and _deep_enough(folder) and folder not in found:
                    found.append(folder)
        return found


def _deep_enough(folder):
    """Guards against ever clearing a drive root or a top-level folder like C:\\Users."""
    return len([p for p in os.path.normpath(folder).split(os.sep) if p]) >= 3


def _join(base, *parts):
    return os.path.join(base, *parts) if base else None


def junk_categories():
    env = os.environ.get
    if not core.IS_WINDOWS:  # development on Linux/macOS
        cache = os.path.expanduser("~/.cache")
        return [JunkCategory("cache", "App caches", "Files apps keep to start faster; they are rebuilt.", [cache])]
    local, windir, programdata = env("LOCALAPPDATA"), env("SYSTEMROOT", r"C:\Windows"), env("PROGRAMDATA")

    browsers = []
    for profiles in (r"Google\Chrome\User Data\*", r"Microsoft\Edge\User Data\*",
                     r"BraveSoftware\Brave-Browser\User Data\*", r"Opera Software\Opera Stable"):
        for cache in ("Cache", "Code Cache", "GPUCache"):
            browsers.append(_join(local, profiles, cache))
    browsers.append(_join(local, r"Mozilla\Firefox\Profiles\*\cache2"))

    categories = [
        JunkCategory("recycle", "Recycle Bin", "Files you already deleted. They still use space until the bin is emptied."),
        JunkCategory("temp", "Temporary files", "Leftovers programs and installers did not clean up (older than 1 day).",
                     [env("TEMP")], min_age_hours=24),
        JunkCategory("wintemp", "Windows temporary files", "Windows' own leftovers (older than 1 day).",
                     [_join(windir, "Temp")], min_age_hours=24, needs_admin=True),
        JunkCategory("browser", "Browser cache", "Saved copies of websites from Chrome, Edge, Brave, Opera and Firefox. "
                     "Close your browser first. Passwords and history are not touched.", browsers),
        JunkCategory("thumbs", "Thumbnail cache", "Picture previews; Windows rebuilds them when needed.",
                     [_join(local, r"Microsoft\Windows\Explorer")], ("thumbcache_*.db", "iconcache_*.db")),
        JunkCategory("crash", "Crash dumps & error reports", "Reports saved when programs crashed.",
                     [_join(local, "CrashDumps"), _join(windir, "Minidump"),
                      _join(local, r"Microsoft\Windows\WER\ReportArchive"),
                      _join(local, r"Microsoft\Windows\WER\ReportQueue"),
                      _join(programdata, r"Microsoft\Windows\WER\ReportArchive"),
                      _join(programdata, r"Microsoft\Windows\WER\ReportQueue")]),
        JunkCategory("update", "Windows Update downloads", "Update installers Windows has already used.",
                     [_join(windir, r"SoftwareDistribution\Download")], min_age_hours=24, needs_admin=True),
        JunkCategory("delivery", "Delivery Optimization cache", "Update pieces Windows shared with other PCs.",
                     [_join(windir, r"ServiceProfiles\NetworkService\AppData\Local\Microsoft\Windows"
                                    r"\DeliveryOptimization\Cache")], needs_admin=True),
    ]
    for c in categories:
        c.folders = [f for f in c.folders if f]
    return categories


def _junk_files(category, cancel=None):
    cutoff = time.time() - category.min_age_hours * 3600
    for folder in category.existing_folders():
        for dirpath, _dirs, files in os.walk(folder):
            for name in files:
                if cancel is not None and cancel.is_set():
                    return
                if not any(fnmatch.fnmatch(name.lower(), p) for p in category.patterns):
                    continue
                path = os.path.join(dirpath, name)
                try:
                    st = os.lstat(path)
                except OSError:
                    continue
                if stat.S_ISREG(st.st_mode) and (not category.min_age_hours or st.st_mtime < cutoff):
                    yield path, st.st_size


def measure_junk(category, cancel=None):
    """(bytes, files) that cleaning this category would remove."""
    if category.key == "recycle":
        return recycle_bin_size()
    size = count = 0
    for _path, file_size in _junk_files(category, cancel):
        size += file_size
        count += 1
    return size, count


def clean_junk(category, cancel=None):
    """Deletes the category's junk. Returns (bytes freed, files deleted, files skipped)."""
    if category.key == "recycle":
        size, count = recycle_bin_size()
        empty_recycle_bin()
        return size, count, 0
    freed = deleted = skipped = 0
    for path, size in list(_junk_files(category, cancel)):
        try:
            core.delete_permanently(path)
            freed += size
            deleted += 1
        except OSError:
            skipped += 1  # in use by a running program
    for folder in category.existing_folders():
        for dirpath, _dirs, _files in os.walk(folder, topdown=False):
            if dirpath != folder:
                try:
                    os.rmdir(dirpath)  # only succeeds when empty
                except OSError:
                    pass
    return freed, deleted, skipped


class _SHQUERYRBINFO(ctypes.Structure):
    _fields_ = [("cbSize", ctypes.c_uint32), ("i64Size", ctypes.c_int64), ("i64NumItems", ctypes.c_int64)]


def recycle_bin_size():
    if not core.IS_WINDOWS:
        return 0, 0
    info = _SHQUERYRBINFO(cbSize=ctypes.sizeof(_SHQUERYRBINFO))
    if ctypes.windll.shell32.SHQueryRecycleBinW(None, ctypes.byref(info)) != 0:
        return 0, 0
    return info.i64Size, info.i64NumItems


def empty_recycle_bin():
    if not core.IS_WINDOWS:
        return
    SHERB_NOCONFIRMATION, SHERB_NOPROGRESSUI, SHERB_NOSOUND = 1, 2, 4
    ctypes.windll.shell32.SHEmptyRecycleBinW(None, None, SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI | SHERB_NOSOUND)


# --------------------------------------------------------------------------- duplicates

def is_app_managed(path):
    """Folders where Windows and programs keep their own copies; duplicates there are normal."""
    if not core.IS_WINDOWS:
        return False
    target = os.path.normcase(os.path.abspath(path))
    roots = [os.environ.get(v) for v in ("SYSTEMROOT", "PROGRAMFILES", "PROGRAMFILES(X86)",
                                         "PROGRAMDATA", "APPDATA", "LOCALAPPDATA")]
    return any(target.startswith(os.path.normcase(r) + os.sep) for r in roots if r)


def _quick_hash(path, size):
    with open(path, "rb") as f:
        digest = hashlib.sha256(f.read(65536))
        if size > 131072:
            f.seek(size - 65536)
            digest.update(f.read(65536))
    return digest.hexdigest()


def find_duplicates(entries, min_size=1024 * 1024, cancel=None, on_progress=None):
    """Groups of identical files (lists of FileEntry, oldest first), most wasted space first.

    Files are compared by size, then the first and last 64 KB, then the full
    contents, so only real candidates are read in full.
    """
    by_size = defaultdict(list)
    for e in entries:
        if e.size >= min_size and not is_app_managed(e.path):
            by_size[e.size].append(e)
    candidates = [g for g in by_size.values() if len(g) > 1]
    groups = []
    for done, group in enumerate(candidates, 1):
        if cancel is not None and cancel.is_set():
            break
        if on_progress:
            on_progress(done, len(candidates))
        for same_start in _split(group, lambda e: _quick_hash(e.path, e.size)):
            groups += _split(same_start, lambda e: core.sha256_of(e.path, cancel))
    for g in groups:
        g.sort(key=lambda e: e.mtime)
    groups.sort(key=lambda g: g[0].size * (len(g) - 1), reverse=True)
    return groups


def _split(group, key):
    """Sub-groups (2+ members) of files that share key, ignoring hard links to one file."""
    buckets, seen = defaultdict(list), set()
    for e in group:
        try:
            st = os.stat(e.path)
            if st.st_ino and (st.st_dev, st.st_ino) in seen:
                continue  # another name for a file already counted: deleting it frees nothing
            seen.add((st.st_dev, st.st_ino))
            k = key(e)
        except OSError:
            continue
        if k is not None:
            buckets[k].append(e)
    return [b for b in buckets.values() if len(b) > 1]
