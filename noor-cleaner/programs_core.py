"""Installed programs and startup programs.

Installed programs come from the same registry list Windows' "Apps" settings
use. Startup programs are switched on and off exactly the way Task Manager
does it (the StartupApproved registry keys), so the change is reversible and
Task Manager shows the same state.
"""

import ctypes
import os
import struct
import time
from dataclasses import dataclass

import scanner_core as core
from i18n import _

if core.IS_WINDOWS:
    import winreg
else:  # lets the pure helpers be imported and tested elsewhere
    winreg = None

UNINSTALL_PATH = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"
RUN_PATH = r"Software\Microsoft\Windows\CurrentVersion\Run"
APPROVED_PATH = r"Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved"
_FILETIME_EPOCH = 116444736000000000


# --------------------------------------------------------------------------- shared helpers

def split_command(command):
    """('C:\\path\\app.exe', 'arguments') from a command line, coping with unquoted paths with spaces."""
    command = (command or "").strip()
    if command.startswith('"'):
        end = command.find('"', 1)
        if end > 0:
            return command[1:end], command[end + 1:].strip()
        return command.strip('"'), ""
    lower = command.lower()
    for ext in (".exe", ".cmd", ".bat", ".com", ".lnk"):
        index = lower.find(ext)
        while index != -1:
            end = index + len(ext)
            if end == len(command) or command[end] == " ":
                return command[:end], command[end:].strip()
            index = lower.find(ext, end)
    exe, _sep, args = command.partition(" ")
    return exe, args.strip()


def _expand(path):
    return os.path.expandvars(path) if path else path


# --------------------------------------------------------------------------- installed programs

@dataclass
class Program:
    name: str
    publisher: str
    version: str
    size: int          # bytes, 0 if unknown
    installed: str     # YYYY-MM-DD or ""
    location: str
    uninstall: str
    key: str           # registry key, for the "remove from list" leftovers case


def parse_install_date(value):
    value = str(value or "").strip()
    if len(value) == 8 and value.isdigit():
        return f"{value[:4]}-{value[4:6]}-{value[6:]}"
    return ""


def program_from_values(values, key=""):
    """A Program from an Uninstall registry key's values, or None for entries Windows itself hides."""
    name = str(values.get("DisplayName") or "").strip()
    if not name or not values.get("UninstallString"):
        return None
    if values.get("SystemComponent") == 1 or values.get("ParentKeyName"):
        return None  # hidden components and updates that belong to another program
    if str(values.get("ReleaseType") or "") in ("Update", "Hotfix", "Security Update"):
        return None
    size = values.get("EstimatedSize")
    size = int(size) * 1024 if isinstance(size, int) and size > 0 else 0
    return Program(name, str(values.get("Publisher") or ""), str(values.get("DisplayVersion") or ""),
                   size, parse_install_date(values.get("InstallDate")),
                   _expand(str(values.get("InstallLocation") or "").strip().strip('"')),
                   str(values.get("UninstallString")).strip(), key)


def _key_values(key):
    values, i = {}, 0
    while True:
        try:
            name, data, _kind = winreg.EnumValue(key, i)
        except OSError:
            return values
        values[name] = data
        i += 1


def _key_date(key):
    filetime = winreg.QueryInfoKey(key)[2]
    try:
        return time.strftime("%Y-%m-%d", time.localtime((filetime - _FILETIME_EPOCH) / 1e7))
    except (OverflowError, OSError, ValueError):
        return ""


def folder_size(folder, limit=50000):
    total = count = 0
    for dirpath, _dirs, files in os.walk(folder):
        for name in files:
            try:
                total += os.lstat(os.path.join(dirpath, name)).st_size
            except OSError:
                pass
            count += 1
            if count >= limit:
                return total
    return total


def list_installed_programs(cancel=None):
    """Installed desktop programs, biggest first."""
    if not core.IS_WINDOWS:
        return []
    sources = [(winreg.HKEY_LOCAL_MACHINE, winreg.KEY_WOW64_64KEY), (winreg.HKEY_LOCAL_MACHINE, winreg.KEY_WOW64_32KEY),
               (winreg.HKEY_CURRENT_USER, 0)]
    programs, seen = [], set()
    for root, view in sources:
        try:
            parent = winreg.OpenKey(root, UNINSTALL_PATH, 0, winreg.KEY_READ | view)
        except OSError:
            continue
        with parent:
            for i in range(winreg.QueryInfoKey(parent)[0]):
                if cancel is not None and cancel.is_set():
                    return programs
                try:
                    sub = winreg.EnumKey(parent, i)
                    with winreg.OpenKey(parent, sub) as key:
                        program = program_from_values(_key_values(key), f"{UNINSTALL_PATH}\\{sub}")
                        if program and not program.installed:
                            program.installed = _key_date(key)
                except OSError:
                    continue
                if not program or (program.name.lower(), program.version) in seen:
                    continue
                seen.add((program.name.lower(), program.version))
                if not program.size and program.location and os.path.isdir(program.location):
                    program.size = folder_size(program.location)
                programs.append(program)
    programs.sort(key=lambda p: p.size, reverse=True)
    return programs


def uninstall_program(program):
    """Starts the program's own uninstaller (Windows asks for administrator approval if it needs it)."""
    exe, args = split_command(program.uninstall)
    if ctypes.windll.shell32.ShellExecuteW(None, "open", exe, args or None, None, 1) <= 32:
        raise RuntimeError(_("Windows could not start the uninstaller for {name}.").format(name=program.name))


# --------------------------------------------------------------------------- startup programs

@dataclass
class StartupItem:
    name: str
    command: str        # what runs (command line, or the shortcut/file in a Startup folder)
    where: str          # where it is registered, in plain words
    enabled: bool
    for_all_users: bool  # changing it needs administrator rights
    approved: tuple     # (registry root, key path, value name) of its StartupApproved switch


def is_enabled_flag(data):
    """Task Manager stores 02 (or 06) for enabled and 03 (or 07) for disabled in the first byte."""
    return not data or not (data[0] & 1)


def approved_value(enabled, now=None):
    if enabled:
        return bytes([2, 0, 0, 0]) + bytes(8)
    filetime = int((now or time.time()) * 1e7) + _FILETIME_EPOCH
    return bytes([3, 0, 0, 0]) + struct.pack("<Q", filetime)


def _startup_folders():
    return [(os.path.join(os.environ.get("APPDATA", ""), r"Microsoft\Windows\Start Menu\Programs\Startup"), False),
            (os.path.join(os.environ.get("PROGRAMDATA", ""), r"Microsoft\Windows\Start Menu\Programs\StartUp"), True)]


def _approved_state(root, sub, name):
    try:
        with winreg.OpenKey(root, f"{APPROVED_PATH}\\{sub}") as key:
            data, _kind = winreg.QueryValueEx(key, name)
            return is_enabled_flag(data)
    except OSError:
        return True


def list_startup_items():
    if not core.IS_WINDOWS:
        return []
    HKCU, HKLM = winreg.HKEY_CURRENT_USER, winreg.HKEY_LOCAL_MACHINE
    runs = [(HKCU, 0, "Run", False, _("Registry (this user)")),
            (HKLM, winreg.KEY_WOW64_64KEY, "Run", True, _("Registry (all users)")),
            (HKLM, winreg.KEY_WOW64_32KEY, "Run32", True, _("Registry (all users, 32-bit)"))]
    items = []
    for root, view, approved_sub, all_users, where in runs:
        try:
            key = winreg.OpenKey(root, RUN_PATH, 0, winreg.KEY_READ | view)
        except OSError:
            continue
        with key:
            for name, command in _key_values(key).items():
                if name:
                    items.append(StartupItem(name, str(command), where, _approved_state(root, approved_sub, name),
                                             all_users, (root, f"{APPROVED_PATH}\\{approved_sub}", name)))
    for folder, all_users in _startup_folders():
        try:
            names = os.listdir(folder)
        except OSError:
            continue
        root = HKLM if all_users else HKCU
        for name in names:
            if name.lower() == "desktop.ini":
                continue
            items.append(StartupItem(os.path.splitext(name)[0], os.path.join(folder, name),
                                     _("Startup folder (all users)") if all_users else _("Startup folder"),
                                     _approved_state(root, "StartupFolder", name), all_users,
                                     (root, f"{APPROVED_PATH}\\StartupFolder", name)))
    items.sort(key=lambda i: i.name.lower())
    return items


def set_startup_enabled(item, enabled):
    """Turns a startup program on or off the way Task Manager does. Raises PermissionError if not allowed."""
    root, path, name = item.approved
    with winreg.CreateKeyEx(root, path, 0, winreg.KEY_SET_VALUE) as key:
        winreg.SetValueEx(key, name, 0, winreg.REG_BINARY, approved_value(enabled))
    item.enabled = enabled


def startup_target(item):
    """The program file a startup entry runs, for "open file location"."""
    if os.path.exists(item.command):
        return item.command
    return _expand(split_command(item.command)[0])
