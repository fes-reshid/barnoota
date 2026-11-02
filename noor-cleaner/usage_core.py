"""Which installed programs have not been used for a long time.

Windows does not keep one "last used" date per program, so NoorCleaner combines two records Windows does keep:
  * UserAssist (per user): programs started from the Start menu, the desktop, the taskbar or by double-clicking,
    with a run count and the last start time. It lasts for years.
  * Prefetch (needs administrator rights): the last time each .exe ran. Windows only keeps the newest few
    hundred, so a program missing from it proves nothing.
Programs that are only ever started by another program, by a right-click menu or at sign-in may show no record
even though they are used, so the results are "possibly unused": the page says so, and nothing is removed
without you.
"""

import codecs
import os
import re
import struct
import time
from dataclasses import dataclass

import scanner_core as core
from i18n import _

try:
    import winreg
except ImportError:  # not Windows
    winreg = None

_FILETIME_EPOCH = 116444736000000000
USERASSIST = r"Software\Microsoft\Windows\CurrentVersion\Explorer\UserAssist"
PREFETCH_DIR = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), "Prefetch")

# The folder IDs UserAssist uses in front of a path.
KNOWN_FOLDERS = {
    "6d809377-6af0-444b-8957-a3773f02200e": "%ProgramFiles%",
    "905e63b6-c1bf-494e-b29c-65b732d3d21a": "%ProgramFiles%",
    "7c5a40ef-a0fb-4bfc-874a-c0f2e0b9fa8e": "%ProgramFiles(x86)%",
    "f38bf404-1d43-42f2-9305-67de0b28fc23": "%SystemRoot%",
    "1ac14e77-02e7-4e5d-b744-2eb1ae5198b7": "%SystemRoot%\\System32",
    "f1b32785-6fba-4fcf-9d55-7b8e7f157091": "%LOCALAPPDATA%",
    "3eb685db-65f9-4cf6-a03a-e3ef65729f3d": "%APPDATA%",
    "5e6c858f-0e22-4760-9afe-ea3317b67173": "%USERPROFILE%",
    "62ab5d82-fdc1-4dc3-a9dd-070d1d495d97": "%ProgramData%",
    "b4bfcc3a-db2c-424c-b029-7fe99a87c641": "%USERPROFILE%\\Desktop",
    "374de290-123f-4565-9164-39c4925e467b": "%USERPROFILE%\\Downloads",
}

# Exe names that tell nothing about whether the program itself is used.
GENERIC_EXES = ("setup", "uninstall", "unins", "update", "updater", "install", "crash", "report", "helper",
                "vc_redist", "dotnet", "repair", "elevate", "notification")
COMPONENT_WORDS = ("redistributable", "runtime", "driver", "framework", ".net", "visual c++", "sdk", "directx",
                   "vulkan", "update for", "hotfix", "language pack", "webview2", "microsoft edge", "oem")
COMPONENT_PUBLISHERS = ("microsoft corporation", "nvidia", "intel", "advanced micro devices", "amd", "realtek",
                        "qualcomm", "dell", "hp inc", "lenovo", "asus")


def rot13(text):
    return codecs.decode(text, "rot13")


def filetime_to_unix(value):
    return (value - _FILETIME_EPOCH) / 10_000_000 if value > _FILETIME_EPOCH else 0


def _expand_env(template, environ):
    def value(match):
        name = match.group(1).upper()
        for key, val in environ.items():
            if key.upper() == name:
                return val
        return match.group(0)
    return re.sub(r"%([^%]+)%", value, template)


def expand_known_folder(path, environ=None):
    """'{6D809377-...}\\App\\a.exe' -> 'C:\\Program Files\\App\\a.exe' (unknown IDs are left alone)."""
    environ = environ if environ is not None else os.environ
    if path.startswith("{") and "}" in path:
        guid, _sep, rest = path[1:].partition("}")
        template = KNOWN_FOLDERS.get(guid.lower())
        if template:
            return _expand_env(template, environ) + rest
    return path


def parse_userassist_value(name, data, environ=None):
    """(path, run count, last run unix time) from one UserAssist value, or None when it is not a program."""
    path = expand_known_folder(rot13(name), environ)
    if not path.lower().endswith((".exe", ".lnk", ".msc", ".bat", ".cmd")) or len(data) < 68:
        return None
    count = struct.unpack_from("<I", data, 4)[0]
    last = filetime_to_unix(struct.unpack_from("<Q", data, 60)[0])
    return path, count, last


def read_userassist():
    """{normalised path: (run count, last run unix time)} for the current user."""
    found = {}
    if winreg is None:
        return found
    try:
        root = winreg.OpenKey(winreg.HKEY_CURRENT_USER, USERASSIST)
    except OSError:
        return found
    with root:
        for i in range(winreg.QueryInfoKey(root)[0]):
            try:
                with winreg.OpenKey(root, winreg.EnumKey(root, i) + r"\Count") as count_key:
                    for j in range(winreg.QueryInfoKey(count_key)[1]):
                        name, data, _kind = winreg.EnumValue(count_key, j)
                        parsed = parse_userassist_value(name, data) if isinstance(data, bytes) else None
                        if parsed:
                            path, count, last = parsed
                            key = os.path.normcase(path)
                            old = found.get(key)
                            if not old or last > old[1]:
                                found[key] = (count, last)
            except OSError:
                continue
    return found


def read_prefetch(folder=None):
    """{EXE NAME: last run unix time} from Windows' Prefetch folder. Empty without administrator rights."""
    found = {}
    try:
        entries = list(os.scandir(folder or PREFETCH_DIR))
    except OSError:
        return found
    for entry in entries:
        if not entry.name.lower().endswith(".pf") or "-" not in entry.name:
            continue
        exe = entry.name.rsplit("-", 1)[0].upper()
        try:
            found[exe] = max(found.get(exe, 0), entry.stat().st_mtime)
        except OSError:
            pass
    return found


def program_exes(location, limit=300, depth=2):
    """Paths of the .exe files in a program's folder (a couple of levels deep), without installer helpers."""
    exes = []
    if not location or not os.path.isdir(location):
        return exes
    base = location.rstrip("\\/").count(os.sep)
    for root, dirs, files in os.walk(location):
        if root.count(os.sep) - base >= depth:
            dirs[:] = []
        for name in files:
            lower = name.lower()
            if lower.endswith(".exe") and not lower.startswith(GENERIC_EXES):
                exes.append(os.path.join(root, name))
                if len(exes) >= limit:
                    return exes
    return exes


def last_used_for(location, exes, userassist, prefetch):
    """Latest evidence that something in the program's folder ran: (unix time or 0, number of exes looked for)."""
    best = 0
    folder = os.path.normcase(location.rstrip("\\/")) + os.sep if location else ""
    if folder:
        for path, (_count, last) in userassist.items():
            if path.startswith(folder):
                best = max(best, last)
    for exe in exes:
        best = max(best, prefetch.get(os.path.basename(exe).upper(), 0))
        best = max(best, userassist.get(os.path.normcase(exe), (0, 0))[1])
    return best


def is_component(program):
    """Runtimes, drivers and updates: nobody 'uses' them directly, so they are never listed as unused."""
    name, publisher = program.name.lower(), program.publisher.lower()
    return any(w in name for w in COMPONENT_WORDS) or (
        any(p in publisher for p in COMPONENT_PUBLISHERS) and any(w in name for w in ("driver", "chipset", "firmware")))


@dataclass
class UnusedProgram:
    program: object
    last_used: float      # unix time, 0 when there is no record
    note: str


def format_date(timestamp):
    try:
        return time.strftime("%Y-%m-%d", time.localtime(timestamp))
    except (OverflowError, OSError, ValueError):
        return "?"


def unused_report(programs, userassist, prefetch, months=6, now=None, exes_of=program_exes):
    """Programs with no sign of use for at least `months` months, biggest first."""
    now = now or time.time()
    limit = now - months * 30.4 * 86400
    have_history = bool(userassist)  # without UserAssist data, "no record" would mean nothing
    result = []
    for program in programs:
        if is_component(program):
            continue
        exes = exes_of(program.location)
        last = last_used_for(program.location, exes, userassist, prefetch)
        if last:
            if last < limit:
                result.append(UnusedProgram(program, last, _("Last seen in use: {date}").format(date=format_date(last))))
            continue
        if not (have_history and exes and program.installed):
            continue  # nothing to judge by: not listed
        try:
            installed = time.mktime(time.strptime(program.installed, "%Y-%m-%d"))
        except ValueError:
            continue
        if installed < limit:
            result.append(UnusedProgram(program, 0, _("No record of use since it was installed on {date}").format(
                date=program.installed)))
    result.sort(key=lambda u: u.program.size, reverse=True)
    return result
