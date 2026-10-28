"""Privacy tools: which programs used your camera and microphone, a safe password-leak check, and
secure deletion (overwriting files so they cannot be recovered)."""

import hashlib
import ntpath
import os
import random
import re
import subprocess
import time
import urllib.error
import urllib.request
from dataclasses import dataclass

import scanner_core as core
import winutil
from i18n import _

try:
    import winreg
except ImportError:
    winreg = None

_FILETIME_EPOCH = 116444736000000000
CONSENT = r"Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore"


# =========================================================================== camera and microphone

@dataclass
class AccessEntry:
    app: str
    last_start: float      # unix time, 0 when never
    last_stop: float
    in_use: bool
    allowed: bool


def filetime_to_unix(value):
    return (value - _FILETIME_EPOCH) / 10_000_000 if value else 0


def app_display_name(raw):
    """'C:#Users#me#app.exe' -> 'C:\\Users\\me\\app.exe'; 'Microsoft.WindowsCamera_8we...' -> 'Microsoft.WindowsCamera'."""
    if "#" in raw:
        return raw.replace("#", "\\")
    return raw.split("_", 1)[0]


def make_entry(raw, start, stop, value):
    start_t, stop_t = filetime_to_unix(start), filetime_to_unix(stop)
    return AccessEntry(app_display_name(raw), start_t, stop_t, bool(start) and (not stop or start > stop),
                       str(value or "Allow").lower() != "deny")


def read_access(kind):
    """Programs that used the 'webcam' or 'microphone', newest first. Windows 10 and 11 keep this list."""
    winutil.require_windows()
    entries = []

    def read_app(parent, name):
        try:
            with winreg.OpenKey(parent, name) as key:
                def get(value):
                    try:
                        return winreg.QueryValueEx(key, value)[0]
                    except OSError:
                        return None
                start = get("LastUsedTimeStart")
                if start is not None:
                    entries.append(make_entry(name, start, get("LastUsedTimeStop"), get("Value")))
        except OSError:
            pass

    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, f"{CONSENT}\\{kind}") as root:
            index = 0
            while True:
                try:
                    name = winreg.EnumKey(root, index)
                except OSError:
                    break
                index += 1
                if name == "NonPackaged":
                    with winreg.OpenKey(root, name) as non_packaged:
                        sub = 0
                        while True:
                            try:
                                read_app(non_packaged, winreg.EnumKey(non_packaged, sub))
                            except OSError:
                                break
                            sub += 1
                else:
                    read_app(root, name)
    except OSError:
        pass
    entries.sort(key=lambda e: (not e.in_use, -e.last_start))
    return entries


def format_when(timestamp):
    if not timestamp:
        return "-"
    try:
        return time.strftime("%Y-%m-%d %H:%M", time.localtime(timestamp))
    except (OverflowError, OSError, ValueError):
        return "?"


# =========================================================================== password leak check

COMMON_PASSWORDS = {"123456", "123456789", "12345678", "password", "qwerty", "111111", "123123", "abc123", "iloveyou",
                    "admin", "welcome", "letmein", "monkey", "dragon", "000000", "1234567", "password1", "qwerty123",
                    "football", "12345", "1q2w3e4r", "passw0rd", "123321", "654321", "666666", "master", "hello"}
PWNED_URL = "https://api.pwnedpasswords.com/range/"


def hash_parts(password):
    digest = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()  # noqa: S324 - the service uses SHA-1
    return digest[:5], digest[5:]


def count_in_range(body, suffix):
    """How many times the hash suffix appears in the service's answer (0 when it does not)."""
    for line in body.splitlines():
        found, _sep, count = line.strip().partition(":")
        if found.upper() == suffix and count.strip().isdigit():
            return int(count.strip())
    return 0


def leak_count(password, opener=urllib.request.urlopen):
    """Times this password appears in known data breaches. Only the first 5 characters of its hash are sent,
    so the service never learns the password (k-anonymity)."""
    prefix, suffix = hash_parts(password)
    request = urllib.request.Request(PWNED_URL + prefix, headers={"Add-Padding": "true",
                                                                  "User-Agent": "NoorCleaner"})
    try:
        with opener(request, timeout=15) as response:
            body = response.read().decode("utf-8", "replace")
    except (urllib.error.URLError, OSError) as exc:
        raise RuntimeError(_("Could not reach the password-leak service (is the internet on?): {details}").format(
            details=getattr(exc, "reason", exc))) from None
    return count_in_range(body, suffix)


def strength_tips(password):
    """Plain advice, no internet needed."""
    tips = []
    if password.lower() in COMMON_PASSWORDS:
        tips.append(_("This is one of the most common passwords in the world."))
    if len(password) < 12:
        tips.append(_("Use at least 12 characters. A few random words in a row works well."))
    kinds = sum(bool(re.search(p, password)) for p in (r"[a-z]", r"[A-Z]", r"\d", r"[^\w\s]"))
    if kinds < 3 and len(password) < 16:
        tips.append(_("Mix lower-case, UPPER-case, numbers and symbols, or make it longer."))
    if re.fullmatch(r"(.)\1+", password) or password.isdigit():
        tips.append(_("Repeated characters or only digits are easy to guess."))
    return tips


# =========================================================================== secure delete

class ShredError(Exception):
    pass


def _refuse_if_protected(path):
    full = os.path.abspath(path)
    anchor = os.path.splitdrive(full)[0]
    if full.rstrip("\\/") == anchor or full == os.sep:
        raise ShredError(_("A whole drive cannot be wiped from here."))
    system = [os.environ.get(v) for v in ("SystemRoot", "ProgramFiles", "ProgramFiles(x86)", "ProgramData")]
    for folder in filter(None, system):
        if os.path.normcase(full).startswith(os.path.normcase(os.path.abspath(folder)) + os.sep):
            raise ShredError(_("{path} is part of Windows or your programs and is not wiped.").format(path=path))
    if core.is_protected(full):
        raise ShredError(_("{path} is part of Windows and is not wiped.").format(path=path))


def shred_file(path, passes=1, cancel=None, chunk=1024 * 1024):
    """Overwrites a file with random data, empties it, gives it a random name and deletes it."""
    _refuse_if_protected(path)
    if os.path.islink(path):
        os.unlink(path)
        return
    try:
        os.chmod(path, 0o600)
        size = os.path.getsize(path)
        with open(path, "r+b", buffering=0) as f:
            for number in range(max(1, passes)):
                f.seek(0)
                written = 0
                while written < size:
                    if cancel is not None and cancel.is_set():
                        raise ShredError(_("Stopped."))
                    block = min(chunk, size - written)
                    f.write(os.urandom(block) if number % 2 == 0 else bytes(block))
                    written += block
                f.flush()
                os.fsync(f.fileno())
            f.truncate(0)
        folder = os.path.dirname(os.path.abspath(path))
        scrambled = os.path.join(folder, "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=12)))
        os.rename(path, scrambled)
        os.remove(scrambled)
    except OSError as exc:
        raise ShredError(f"{ntpath.basename(path)}: {exc}") from None


def expand_paths(paths):
    """Files inside any folders given, plus the folders themselves (deepest first, for removing)."""
    files, folders = [], []
    for path in paths:
        if os.path.isdir(path) and not os.path.islink(path):
            for root, dirs, names in os.walk(path, topdown=False):
                files += [os.path.join(root, n) for n in names]
                folders.append(root)
        else:
            files.append(path)
    return files, folders


def shred_paths(paths, passes=1, cancel=None, on_progress=None):
    """Securely deletes files and folders. Returns (files wiped, [problems])."""
    for path in paths:
        _refuse_if_protected(path)
    files, folders = expand_paths(paths)
    done, problems = 0, []
    for index, path in enumerate(files, 1):
        if cancel is not None and cancel.is_set():
            break
        try:
            shred_file(path, passes, cancel)
            done += 1
        except ShredError as exc:
            problems.append(str(exc))
        if on_progress:
            on_progress(index, len(files))
    for folder in folders:
        try:
            os.rmdir(folder)
        except OSError:
            pass
    return done, problems


def wipe_free_space(drive):
    """Opens Windows' own 'cipher /w' in a window: it overwrites the free space on a drive (slow)."""
    winutil.require_windows()
    if not re.fullmatch(r"[A-Za-z]:\\?", drive):
        raise ValueError(_("That is not a drive."))
    subprocess.Popen(["cmd", "/k", "cipher", f"/w:{drive.rstrip(chr(92))}\\"], creationflags=subprocess.CREATE_NEW_CONSOLE)
