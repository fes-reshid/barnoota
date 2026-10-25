"""NoorCleaner recovery engine: getting deleted files back.

Three sources, from easiest to hardest:
  1. the Recycle Bin (files deleted normally),
  2. restore points / "previous versions" (Volume Shadow Copies Windows keeps
     when System Protection is on),
  3. permanently deleted files, via Microsoft's Windows File Recovery tool
     (winfr), which reads deleted data straight off the drive.
"""

import json
import ntpath
import os
import shutil
import struct
import subprocess
import time
from dataclasses import dataclass

import scanner_core as core

_FILETIME_EPOCH = 116444736000000000  # 1601-01-01 to 1970-01-01, in 100 ns steps
_NO_WINDOW = subprocess.CREATE_NO_WINDOW if core.IS_WINDOWS else 0


def unique_target(path):
    """path, or 'name (restored).ext' / 'name (restored 2).ext' if something is already there."""
    if not os.path.exists(path):
        return path
    base, ext = os.path.splitext(path)
    candidate, n = f"{base} (restored){ext}", 2
    while os.path.exists(candidate):
        candidate, n = f"{base} (restored {n}){ext}", n + 1
    return candidate


def _move_or_copy(source, target, move):
    os.makedirs(os.path.dirname(target) or ".", exist_ok=True)
    if move:
        shutil.move(source, target)
    elif os.path.isdir(source):
        shutil.copytree(source, target)
    else:
        shutil.copy2(source, target)
    return target


# --------------------------------------------------------------------------- 1. Recycle Bin

@dataclass
class RecycledItem:
    info_path: str    # $I... file: where it came from, size, when deleted
    data_path: str    # $R... file or folder: the contents
    original: str
    size: int
    deleted: float    # unix time

    @property
    def is_folder(self):
        return os.path.isdir(self.data_path)


def parse_recycle_info(data):
    """(original path, size, deleted unix time) from a $I file, or None if unreadable.

    Version 1 (Vista-8.1) stores a fixed 260-character path, version 2
    (Windows 10/11) stores its length first.
    """
    if len(data) < 28:
        return None
    version, size, filetime = struct.unpack_from("<qqq", data, 0)
    if version == 1:
        raw = data[24:24 + 520]
    elif version == 2:
        length = struct.unpack_from("<i", data, 24)[0]
        raw = data[28:28 + 2 * length]
    else:
        return None
    path = raw.decode("utf-16-le", "replace").split("\0", 1)[0]
    if not path:
        return None
    return path, size, (filetime - _FILETIME_EPOCH) / 1e7


def current_user_sid():
    if not core.IS_WINDOWS:
        return None
    try:
        out = subprocess.run(["whoami", "/user", "/fo", "csv", "/nh"], capture_output=True, text=True,
                             timeout=15, creationflags=_NO_WINDOW).stdout
        return out.strip().split(",")[-1].strip('"') or None
    except (OSError, subprocess.SubprocessError):
        return None


def recycle_bin_folders(sid=None):
    """This user's Recycle Bin folder on every drive."""
    folders = []
    for drive in core.list_drives():
        bin_root = os.path.join(drive, "$Recycle.Bin")
        try:
            names = os.listdir(bin_root)
        except OSError:
            continue
        for name in names:
            if (sid is None and name.startswith("S-1-")) or name == sid:
                folders.append(os.path.join(bin_root, name))
    return folders


def list_recycle_bin(folders=None):
    """Everything in the Recycle Bin(s), most recently deleted first."""
    if folders is None:
        folders = recycle_bin_folders(current_user_sid())
    items = []
    for folder in folders:
        try:
            names = os.listdir(folder)
        except OSError:
            continue
        for name in names:
            if not name.upper().startswith("$I"):
                continue
            info_path = os.path.join(folder, name)
            data_path = os.path.join(folder, "$R" + name[2:])
            try:
                with open(info_path, "rb") as f:
                    parsed = parse_recycle_info(f.read(4096))
            except OSError:
                continue
            if parsed and os.path.exists(data_path):
                items.append(RecycledItem(info_path, data_path, *parsed))
    items.sort(key=lambda i: i.deleted, reverse=True)
    return items


def restore_recycled(item, target_folder=None):
    """Puts a Recycle Bin item back where it came from (or into target_folder). Returns the new path."""
    name = ntpath.basename(item.original)  # Recycle Bin paths are Windows paths; ntpath splits on \ and /
    target = item.original if target_folder is None else os.path.join(target_folder, name)
    target = _move_or_copy(item.data_path, unique_target(target), move=True)
    try:
        os.remove(item.info_path)
    except OSError:
        pass
    return target


# --------------------------------------------------------------------------- 2. restore points

@dataclass
class ShadowCopy:
    device: str       # \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopyN
    drive: str        # C:
    created: str      # 2026-10-20 03:00

    @property
    def label(self):
        return f"{self.drive}  -  {self.created}"


_SHADOW_SCRIPT = (
    "$v=@{}; Get-CimInstance Win32_Volume | ForEach-Object { $v[$_.DeviceID]=$_.DriveLetter }; "
    "@(Get-CimInstance Win32_ShadowCopy | ForEach-Object { [pscustomobject]@{ device=$_.DeviceObject; "
    "drive=$v[$_.VolumeName]; created=$_.InstallDate.ToString('yyyy-MM-dd HH:mm') } }) | ConvertTo-Json -Compress"
)


def parse_shadow_json(text):
    text = text.strip()
    if not text:
        return []
    data = json.loads(text)
    if isinstance(data, dict):
        data = [data]
    copies = [ShadowCopy(d["device"], d.get("drive") or "?", d.get("created") or "")
              for d in data if d.get("device")]
    copies.sort(key=lambda c: c.created, reverse=True)
    return copies


def list_shadow_copies():
    """Restore points on this PC, newest first. Needs administrator rights."""
    if not core.IS_WINDOWS:
        return []
    result = subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", _SHADOW_SCRIPT],
                            capture_output=True, text=True, timeout=120, creationflags=_NO_WINDOW)
    if result.returncode != 0:
        raise RuntimeError("Windows would not list restore points. Run NoorCleaner as administrator.\n\n"
                           + result.stderr.strip()[-300:])
    return parse_shadow_json(result.stdout)


def snapshot_path(shadow, live_folder):
    """The same folder as it was inside a restore point."""
    rest = os.path.splitdrive(os.path.abspath(live_folder))[1]
    return shadow.device.rstrip("\\") + rest


@dataclass
class MissingFile:
    snapshot_path: str
    live_path: str
    size: int
    mtime: float


def find_missing_files(snapshot_folder, live_folder, cancel=None, on_progress=None, skip_dirs=("appdata",)):
    """Files inside snapshot_folder whose counterpart under live_folder no longer exists."""
    missing, seen = [], 0
    for dirpath, dirnames, filenames in os.walk(snapshot_folder):
        if cancel is not None and cancel.is_set():
            break
        dirnames[:] = [d for d in dirnames if d.lower() not in skip_dirs and not d.startswith("$")]
        rel_dir = os.path.relpath(dirpath, snapshot_folder)
        live_dir = os.path.normpath(os.path.join(live_folder, rel_dir))
        live_names = None
        for name in filenames:
            seen += 1
            if live_names is None:
                try:
                    live_names = {n.lower() for n in os.listdir(live_dir)}
                except OSError:
                    live_names = set()  # the whole folder is gone
            if name.lower() in live_names:
                continue
            path = os.path.join(dirpath, name)
            try:
                st = os.stat(path)
            except OSError:
                continue
            missing.append(MissingFile(path, os.path.join(live_dir, name), st.st_size, st.st_mtime))
        if on_progress:
            on_progress(seen, len(missing))
    return missing


def restore_missing(item, target_folder=None):
    """Copies a file out of a restore point, back to where it was (or into target_folder)."""
    target = item.live_path if target_folder is None else os.path.join(target_folder, os.path.basename(item.live_path))
    return _move_or_copy(item.snapshot_path, unique_target(target), move=False)


# --------------------------------------------------------------------------- 3. permanently deleted

WINFR_STORE_URL = "ms-windows-store://pdp/?productid=9N26S50LN705"


def find_winfr():
    if not core.IS_WINDOWS:
        return None
    found = shutil.which("winfr")
    if found:
        return found
    candidate = os.path.join(os.environ.get("LOCALAPPDATA", ""), r"Microsoft\WindowsApps\winfr.exe")
    return candidate if os.path.exists(candidate) else None


def winfr_command(source_drive, destination, patterns, thorough=False):
    """The Windows File Recovery command line. patterns: e.g. '*.docx, *.pdf' or 'holiday'."""
    source = os.path.splitdrive(source_drive)[0] or source_drive.rstrip(":\\") + ":"
    if os.path.splitdrive(os.path.abspath(destination))[0].lower() == source.lower():
        raise ValueError("Recovered files must be saved to a different drive than the one you recover from, "
                         "or they could overwrite the very files you are trying to get back.")
    filters = []
    for pattern in patterns.replace(",", " ").split():
        if not any(ch in pattern for ch in "*?\\"):
            pattern = f"*{pattern}*"
        filters += ["/n", pattern]
    if not filters:
        raise ValueError("Type what to look for, for example  *.docx  or  holiday")
    parts = ["winfr", source, f'"{destination}"', "/extensive" if thorough else "/regular"] + filters
    return " ".join(parts)


def run_winfr(command):
    """Opens the recovery in an administrator console, where the user confirms and watches it."""
    import ctypes
    args = "/k echo NoorCleaner: Windows File Recovery - answer y to start. && " + command
    if ctypes.windll.shell32.ShellExecuteW(None, "runas", "cmd.exe", args, None, 1) <= 32:
        raise RuntimeError("Windows did not allow the recovery to start (administrator approval is needed).")


def format_time(timestamp):
    try:
        return time.strftime("%Y-%m-%d %H:%M", time.localtime(timestamp))
    except (OverflowError, OSError, ValueError):
        return "?"
