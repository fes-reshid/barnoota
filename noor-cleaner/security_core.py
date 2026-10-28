"""Security checks: Windows protection settings, the hosts file, places malware hides to start with
Windows, browser hijacking, remote access and program signatures.

Reading is always safe. Anything that changes the PC (turning protection on, moving a startup entry,
editing the hosts file) is a separate function that the user triggers, and each one keeps a backup or
can be undone.
"""

import json
import ntpath
import os
import re
import shutil
import tempfile
import time
from dataclasses import dataclass, field

import scanner_core as core
import winutil
from i18n import _

try:
    import winreg
except ImportError:  # not Windows
    winreg = None

OK, WARN, BAD, UNKNOWN = "ok", "warn", "bad", "unknown"
HIGH, MEDIUM, LOW, INFO = "high", "medium", "low", "info"


# =========================================================================== Windows protection

@dataclass
class Check:
    title: str
    status: str            # OK, WARN, BAD or UNKNOWN
    detail: str
    fix: str = ""          # key for fix(), empty when there is nothing to switch on


_HEALTH_SCRIPT = r"""
$fw = @(Get-NetFirewallProfile | ForEach-Object { [pscustomobject]@{ name=[string]$_.Name; enabled=[bool]$_.Enabled } })
$mp = $null; try { $mp = Get-MpComputerStatus -ErrorAction Stop } catch {}
$uac = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System' -ErrorAction SilentlyContinue).EnableLUA
$hf = $null; try { $hf = (Get-HotFix | Where-Object { $_.InstalledOn } | Sort-Object InstalledOn -Descending | Select-Object -First 1).InstalledOn } catch {}
$bl = $null; try { $bl = @(Get-BitLockerVolume -ErrorAction Stop | ForEach-Object { [pscustomobject]@{ mount=[string]$_.MountPoint; on=([string]$_.ProtectionStatus -eq 'On') } }) } catch {}
[pscustomobject]@{ firewall=$fw; defender=($mp -ne $null); realtime=$mp.RealTimeProtectionEnabled; sig_age=$mp.AntivirusSignatureAge;
  uac=$uac; hotfix=$(if ($hf) { $hf.ToString('yyyy-MM-dd') } else { $null }); bitlocker=$bl } | ConvertTo-Json -Depth 4 -Compress
"""


def _as_list(value):
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def evaluate_health(data, today=None):
    """Turns what PowerShell reported into plain-language checks."""
    checks = []
    profiles = _as_list(data.get("firewall"))
    if not profiles:
        checks.append(Check(_("Windows Firewall"), UNKNOWN, _("Windows did not say whether the firewall is on.")))
    else:
        off = [p.get("name", "?") for p in profiles if not p.get("enabled")]
        if off:
            checks.append(Check(_("Windows Firewall"), BAD,
                                _("The firewall is OFF for: {profiles}. Attackers can reach your PC more easily.").format(
                                    profiles=", ".join(off)), "firewall"))
        else:
            checks.append(Check(_("Windows Firewall"), OK, _("The firewall is on for every network type.")))

    if not data.get("defender"):
        checks.append(Check(_("Virus protection"), UNKNOWN,
                            _("Microsoft Defender is not reporting. Another antivirus may be in charge.")))
    else:
        if data.get("realtime"):
            checks.append(Check(_("Virus protection"), OK, _("Real-time protection is on.")))
        else:
            checks.append(Check(_("Virus protection"), BAD,
                                _("Real-time protection is OFF, so viruses are not stopped as they arrive."),
                                "realtime"))
        age = data.get("sig_age")
        if isinstance(age, (int, float)) and age > 7:
            checks.append(Check(_("Virus definitions"), WARN,
                                _("Virus definitions are {days} days old.").format(days=int(age)), "signatures"))
        elif isinstance(age, (int, float)):
            checks.append(Check(_("Virus definitions"), OK, _("Virus definitions are up to date.")))

    uac = data.get("uac")
    if uac == 0:
        checks.append(Check(_("Admin approval prompts (UAC)"), BAD,
                            _("User Account Control is OFF: programs can change your PC without asking."), "uac"))
    elif uac == 1:
        checks.append(Check(_("Admin approval prompts (UAC)"), OK, _("Windows asks before programs change your PC.")))

    hotfix = data.get("hotfix")
    if hotfix:
        try:
            installed = time.mktime(time.strptime(hotfix, "%Y-%m-%d"))
            days = int(((today or time.time()) - installed) // 86400)
        except ValueError:
            days = None
        if days is None:
            checks.append(Check(_("Windows updates"), UNKNOWN, _("Could not read the last update date.")))
        elif days > 90:
            checks.append(Check(_("Windows updates"), BAD,
                                _("The last update was {days} days ago. Old Windows has known holes attackers use.").format(
                                    days=days), "updates"))
        elif days > 45:
            checks.append(Check(_("Windows updates"), WARN, _("The last update was {days} days ago.").format(days=days),
                                "updates"))
        else:
            checks.append(Check(_("Windows updates"), OK, _("Updated recently ({days} days ago).").format(days=days)))
    else:
        checks.append(Check(_("Windows updates"), UNKNOWN, _("Could not read the last update date."), "updates"))

    volumes = _as_list(data.get("bitlocker"))
    if volumes:
        plain = [v.get("mount", "?") for v in volumes if not v.get("on")]
        if plain:
            checks.append(Check(_("Drive encryption (BitLocker)"), WARN,
                                _("Not encrypted: {drives}. If this PC is stolen, anyone can read these files.").format(
                                    drives=", ".join(plain)), "bitlocker"))
        else:
            checks.append(Check(_("Drive encryption (BitLocker)"), OK, _("Your drives are encrypted.")))
    return checks


def read_health():
    winutil.require_windows()
    rows = winutil.powershell_json(_HEALTH_SCRIPT, timeout=90)
    return evaluate_health(rows[0] if rows else {})


def fix_health(key):
    """Switches a protection back on (or opens the right Windows page). Needs administrator rights."""
    winutil.require_windows()
    scripts = {
        "firewall": "Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True",
        "realtime": "Set-MpPreference -DisableRealtimeMonitoring $false",
        "signatures": "Update-MpSignature",
        "uac": "Set-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System' "
               "-Name EnableLUA -Value 1",
    }
    if key == "updates":
        os.startfile("ms-settings:windowsupdate")
        return _("Windows Update is open. Press 'Check for updates'.")
    if key == "bitlocker":
        winutil.run(["control", "/name", "Microsoft.BitLockerDriveEncryption"], timeout=5)
        return _("The BitLocker page is open.")
    if key not in scripts:
        raise ValueError(_("Nothing to fix."))
    result = winutil.powershell(scripts[key], timeout=120)
    if result.returncode != 0:
        details = (result.stderr or result.stdout).strip().splitlines()
        raise RuntimeError(_("Windows refused: {details}").format(
            details=details[0] if details else _("administrator rights are needed")))
    return _("Done.") + (" " + _("Restart the PC for this to take effect.") if key == "uac" else "")


# =========================================================================== hosts file

HOSTS_PATH = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), r"System32\drivers\etc\hosts")
DEFAULT_HOSTS = """# Copyright (c) 1993-2009 Microsoft Corp.
#
# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.
#
# This file contains the mappings of IP addresses to host names. Each
# entry should be kept on an individual line. The IP address should
# be placed in the first column followed by the corresponding host name.
# The IP address and the host name should be separated by at least one
# space.
#
# localhost name resolution is handled within DNS itself.
#\t127.0.0.1       localhost
#\t::1             localhost
"""

_LOOPBACK = ("127.0.0.1", "::1", "0.0.0.0", "::")
_SECURITY_WORDS = ("windowsupdate", "microsoft.com", "defender", "kaspersky", "avast", "avg.", "eset", "norton",
                   "mcafee", "malwarebytes", "bitdefender", "virustotal", "symantec", "sophos", "trendmicro")
_FAMOUS_WORDS = ("google", "facebook", "paypal", "youtube", "instagram", "amazon", "apple", "whatsapp", "twitter",
                 "binance", "bank", "gmail", "yahoo", "outlook", "live.com", "tiktok", "telegram")


@dataclass
class HostEntry:
    line_no: int
    address: str
    names: list
    level: str
    reason: str


def judge_host(address, names):
    """(HIGH/MEDIUM/LOW/INFO, reason) for one hosts-file line."""
    joined = " ".join(names).lower()
    loopback = address in _LOOPBACK
    if loopback and joined.strip() in ("localhost", "localhost.localdomain", "local", "broadcasthost"):
        return INFO, _("Normal entry for this PC.")
    if loopback:
        if any(word in joined for word in _SECURITY_WORDS):
            return HIGH, _("Blocks a security or update site, so your PC cannot get protection or updates.")
        return LOW, _("Blocks a website on this PC (ad blockers do this too).")
    if any(word in joined for word in _SECURITY_WORDS + _FAMOUS_WORDS):
        return HIGH, _("Sends a well-known site to another computer. This is how fake banking and login pages work.")
    return MEDIUM, _("Points a website name at an address outside this PC.")


def parse_hosts(text):
    """The active (non-comment) lines of a hosts file, each judged."""
    entries = []
    for number, line in enumerate(text.splitlines(), 1):
        body = line.split("#", 1)[0].strip()
        parts = body.split()
        if len(parts) < 2:
            continue
        level, reason = judge_host(parts[0], parts[1:])
        entries.append(HostEntry(number, parts[0], parts[1:], level, reason))
    return entries


def remove_hosts_lines(text, line_numbers):
    drop = set(line_numbers)
    return "".join(line for number, line in enumerate(text.splitlines(keepends=True), 1) if number not in drop)


def read_hosts(path=None):
    path = path or HOSTS_PATH
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError as exc:
        raise RuntimeError(_("Could not read the hosts file: {details}").format(details=exc)) from None


def write_hosts(new_text, path=None):
    """Writes the hosts file after saving a dated copy next to it. Needs administrator rights."""
    path = path or HOSTS_PATH
    backup = f"{path}.noorcleaner-{time.strftime('%Y%m%d-%H%M%S')}"
    try:
        shutil.copy2(path, backup)
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(new_text)
    except OSError as exc:
        raise RuntimeError(_("Could not change the hosts file (run NoorCleaner as administrator): {details}").format(
            details=exc)) from None
    return backup


# =========================================================================== hiding places (startup)

@dataclass
class PersistItem:
    kind: str              # run, startup, task, service, wmi
    name: str
    command: str
    where: str             # a readable location
    level: str = INFO
    reason: str = ""
    enabled: bool = True
    data: dict = field(default_factory=dict)  # what is needed to switch it off/on
    exe: str = ""

    @property
    def kind_label(self):
        return {"run": _("Startup entry"), "startup": _("Startup folder"), "task": _("Scheduled task"),
                "service": _("Service"), "wmi": _("WMI trigger")}.get(self.kind, self.kind)


_URL_RUNNERS = ("mshta", "wscript", "cscript", "regsvr32", "rundll32", "bitsadmin", "certutil", "msiexec")
_RISKY_DIRS = ("\\temp\\", "\\downloads\\", "\\users\\public\\", "$recycle.bin", "\\windows\\debug\\",
               "\\appdata\\local\\temp\\")


def judge_command(command):
    """(HIGH/MEDIUM/INFO, reason) for a command that starts by itself."""
    plain = (command or "").lower()
    c = plain.replace("/", "\\")
    if "powershell" in plain or "pwsh" in plain:
        if re.search(r"\s-(e|ec|enc|encodedcommand)\s", plain + " ") or "frombase64string" in plain:
            return HIGH, _("Runs a hidden, scrambled PowerShell command - a common malware trick.")
        if re.search(r"-w(indowstyle)?\s+hidden", plain) and ("http" in plain or "iex" in plain
                                                             or "invoke-expression" in plain or "downloadstring" in plain):
            return HIGH, _("Runs a hidden PowerShell command that downloads code.")
    if any(re.search(rf"\b{name}(\.exe)?\b", plain) for name in _URL_RUNNERS) and re.search(
            r"https?://|javascript:|vbscript:|-urlcache|/i:http", plain):
        return HIGH, _("Runs code straight from the internet.")
    if any(d in c for d in _RISKY_DIRS):
        return MEDIUM, _("Starts a program from a temporary or download folder, where real software rarely lives.")
    return INFO, ""


def extract_exe(command):
    """The program file a command starts, with environment variables expanded."""
    command = (command or "").strip()
    if command.startswith('"'):
        end = command.find('"', 1)
        path = command[1:end] if end > 0 else command.strip('"')
    else:
        match = re.match(r"(.+?\.(?:exe|dll|cmd|bat|com|scr|ps1|vbs|js))(?:\s|$)", command, re.I)
        path = match.group(1) if match else command.split(" ")[0]
    return os.path.expandvars(path)


def _item(kind, name, command, where, data=None, enabled=True):
    level, reason = judge_command(command)
    return PersistItem(kind, name, command, where, level, reason, enabled, data or {}, extract_exe(command))


RUN_KEYS = (r"Software\Microsoft\Windows\CurrentVersion\Run", r"Software\Microsoft\Windows\CurrentVersion\RunOnce",
            r"Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run")
DISABLED_KEY = r"Software\NoorCleaner\DisabledRun"


def _read_run_keys():
    items = []
    for hive_name, hive in (("HKCU", winreg.HKEY_CURRENT_USER), ("HKLM", winreg.HKEY_LOCAL_MACHINE)):
        for sub in RUN_KEYS:
            try:
                key = winreg.OpenKey(hive, sub)
            except OSError:
                continue
            with key:
                index = 0
                while True:
                    try:
                        name, value, _kind = winreg.EnumValue(key, index)
                    except OSError:
                        break
                    index += 1
                    items.append(_item("run", name, str(value), f"{hive_name}\\{sub}",
                                       {"hive": hive_name, "sub": sub, "name": name}))
        try:  # entries NoorCleaner switched off earlier
            key = winreg.OpenKey(hive, DISABLED_KEY)
        except OSError:
            continue
        with key:
            index = 0
            while True:
                try:
                    stored, value, _kind = winreg.EnumValue(key, index)
                except OSError:
                    break
                index += 1
                sub, _sep, name = stored.partition("|")
                items.append(_item("run", name, str(value), f"{hive_name}\\{sub}",
                                   {"hive": hive_name, "sub": sub, "name": name}, enabled=False))
    return items


def _read_startup_folders():
    items = []
    folders = [os.path.join(os.environ.get(var, ""), sub) for var, sub in (
        ("APPDATA", r"Microsoft\Windows\Start Menu\Programs\Startup"),
        ("PROGRAMDATA", r"Microsoft\Windows\Start Menu\Programs\StartUp")) if os.environ.get(var)]
    for folder in folders:
        try:
            names = os.listdir(folder)
        except OSError:
            continue
        for name in names:
            if name.lower() == "desktop.ini":
                continue
            path = os.path.join(folder, name)
            item = _item("startup", name, path, folder)
            if item.level == INFO and name.lower().endswith((".vbs", ".js", ".bat", ".cmd", ".ps1", ".exe", ".scr")):
                item.level, item.reason = MEDIUM, _("A program or script placed directly in the Startup folder.")
            items.append(item)
    return items


_TASKS_SCRIPT = r"""
@(Get-ScheduledTask | Where-Object { $_.TaskPath -notlike '\Microsoft\*' } | ForEach-Object {
  $a = @($_.Actions | ForEach-Object { ($_.Execute + ' ' + $_.Arguments).Trim() }) -join ' && '
  [pscustomobject]@{ name=$_.TaskName; path=$_.TaskPath; state=[string]$_.State; command=$a } }) | ConvertTo-Json -Compress
"""
_SERVICES_SCRIPT = r"""
@(Get-CimInstance Win32_Service | Where-Object { $_.StartMode -eq 'Auto' -and $_.PathName -and
  $_.PathName -notlike '*\Windows\*' -and $_.PathName -notlike '*Program Files*' -and $_.PathName -notlike '*ProgramData\Microsoft*' } |
  ForEach-Object { [pscustomobject]@{ name=$_.Name; display=$_.DisplayName; command=$_.PathName; state=[string]$_.State } }) | ConvertTo-Json -Compress
"""
_WMI_SCRIPT = r"""
@(Get-CimInstance -Namespace root\subscription -ClassName __EventConsumer -ErrorAction SilentlyContinue | ForEach-Object {
  [pscustomobject]@{ name=$_.Name; cls=$_.CimClass.CimClassName; command=[string]($_.CommandLineTemplate + $_.ScriptText) } }) | ConvertTo-Json -Compress
"""


def _read_ps_items():
    items = []
    for row in winutil.powershell_json(_TASKS_SCRIPT, timeout=60):
        item = _item("task", row.get("name", "?"), row.get("command") or "", "Task Scheduler" + row.get("path", ""),
                     {"name": row.get("name", ""), "path": row.get("path", "\\")},
                     enabled=row.get("state") != "Disabled")
        items.append(item)
    for row in winutil.powershell_json(_SERVICES_SCRIPT, timeout=60):
        items.append(_item("service", row.get("display") or row.get("name", "?"), row.get("command") or "",
                           f"Service {row.get('name', '')}", {"name": row.get("name", "")}))
    for row in winutil.powershell_json(_WMI_SCRIPT, timeout=60):
        item = _item("wmi", row.get("name", "?"), row.get("command") or "", f"WMI {row.get('cls', '')}")
        if item.level == INFO:
            item.level, item.reason = MEDIUM, _("A WMI trigger runs code in the background. Real programs rarely use "
                                                 "these; malware often does.")
        items.append(item)
    return items


_ORDER = {HIGH: 0, MEDIUM: 1, LOW: 2, INFO: 3}


def collect_persistence(with_signatures=True):
    """Everything that starts by itself, the riskiest first."""
    winutil.require_windows()
    items = _read_run_keys() + _read_startup_folders()
    errors = []
    try:
        items += _read_ps_items()
    except RuntimeError as exc:
        errors.append(str(exc))
    if with_signatures:
        paths = sorted({i.exe for i in items if i.exe and os.path.isfile(i.exe)})
        try:
            signatures = check_signatures(paths)
        except RuntimeError:
            signatures = {}
        for item in items:
            status = signatures.get(item.exe)
            if not status:
                continue
            level, reason = judge_signature(status[0], item.exe)
            if _ORDER[level] < _ORDER[item.level]:
                item.level, item.reason = level, reason
    items.sort(key=lambda i: (_ORDER[i.level], i.name.lower()))
    return items, errors


def set_persist_enabled(item, enabled):
    """Switches an item off or back on. Nothing is deleted, so this can always be undone."""
    winutil.require_windows()
    if item.kind == "run":
        hive = winreg.HKEY_CURRENT_USER if item.data["hive"] == "HKCU" else winreg.HKEY_LOCAL_MACHINE
        stored = f"{item.data['sub']}|{item.data['name']}"
        try:
            if enabled:
                with winreg.OpenKey(hive, DISABLED_KEY, 0, winreg.KEY_ALL_ACCESS) as src:
                    value, kind = winreg.QueryValueEx(src, stored)
                    with winreg.OpenKey(hive, item.data["sub"], 0, winreg.KEY_SET_VALUE) as dst:
                        winreg.SetValueEx(dst, item.data["name"], 0, kind, value)
                    winreg.DeleteValue(src, stored)
            else:
                with winreg.OpenKey(hive, item.data["sub"], 0, winreg.KEY_ALL_ACCESS) as src:
                    value, kind = winreg.QueryValueEx(src, item.data["name"])
                    with winreg.CreateKey(hive, DISABLED_KEY) as dst:
                        winreg.SetValueEx(dst, stored, 0, kind, value)
                    winreg.DeleteValue(src, item.data["name"])
        except OSError as exc:
            raise RuntimeError(_("Windows refused (run NoorCleaner as administrator for entries that apply to all "
                                 "users): {details}").format(details=exc)) from None
    elif item.kind == "task":
        verb = "Enable" if enabled else "Disable"
        result = winutil.powershell(f"{verb}-ScheduledTask -TaskName $env:NC_NAME -TaskPath $env:NC_PATH",
                                    env={"NC_NAME": item.data["name"], "NC_PATH": item.data["path"]})
        if result.returncode != 0:
            raise RuntimeError(_("Windows refused: {details}").format(
                details=(result.stderr or result.stdout).strip()[:300] or _("administrator rights are needed")))
    elif item.kind == "service":
        name = item.data["name"]
        if not re.fullmatch(r"[\w .\-$]+", name):
            raise ValueError(_("Unusual service name; not changed."))
        result = winutil.run(["sc", "config", name, "start=", "auto" if enabled else "disabled"])
        if result.returncode != 0:
            raise RuntimeError(_("Windows refused: {details}").format(
                details=(result.stdout or result.stderr).strip()[:300] or _("administrator rights are needed")))
        if not enabled:
            winutil.run(["sc", "stop", name])
    else:
        raise ValueError(_("This kind of item cannot be switched off here. Open its location instead."))
    item.enabled = enabled


# =========================================================================== program signatures

SIGNATURE_EXTS = (".exe", ".dll", ".scr", ".sys", ".msi", ".ps1", ".bat", ".vbs", ".js", ".cmd")

_SIG_SCRIPT = r"""
@(Get-Content -LiteralPath $env:NC_LIST -Encoding UTF8 | ForEach-Object {
  $s = Get-AuthenticodeSignature -LiteralPath $_ -ErrorAction SilentlyContinue
  [pscustomobject]@{ path=$_; status=[string]$s.Status; subject=[string]$s.SignerCertificate.Subject } }) | ConvertTo-Json -Compress
"""


def check_signatures(paths, batch=120):
    """{path: (status, publisher)} using Windows' own signature check (Valid, NotSigned, HashMismatch...)."""
    winutil.require_windows()
    found = {}
    for start in range(0, len(paths), batch):
        chunk = paths[start:start + batch]
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
            f.write("\n".join(chunk))
            listing = f.name
        try:
            rows = winutil.powershell_json(_SIG_SCRIPT, timeout=180, env={"NC_LIST": listing})
        finally:
            try:
                os.remove(listing)
            except OSError:
                pass
        for row in rows:
            match = re.search(r"CN=([^,]+)", row.get("subject", ""))
            found[row.get("path", "")] = (row.get("status", ""), match.group(1).strip('"') if match else "")
    return found


def judge_signature(status, path=""):
    """(level, reason) for a signature status."""
    folder = ntpath.dirname(path.replace("/", "\\")).lower() + "\\"
    risky_place = any(d in folder for d in _RISKY_DIRS)
    if status == "HashMismatch":
        return HIGH, _("The file was changed after it was signed - it may have been tampered with.")
    if status == "NotSigned":
        if risky_place:
            return MEDIUM, _("Not signed by any publisher, and it sits in a temporary or download folder.")
        return INFO, _("Not signed by any publisher (normal for small tools and older programs).")
    if status in ("NotTrusted", "UnknownError", "Incompatible", "NotSupportedFileFormat"):
        return MEDIUM if status == "NotTrusted" else INFO, _("Windows could not confirm who made this file.")
    return INFO, ""


def default_scan_folders():
    home = os.path.expanduser("~")
    folders = [os.path.join(home, "Downloads"), os.path.join(home, "Desktop"),
               os.environ.get("TEMP", ""), os.path.join(os.environ.get("PUBLIC", ""), "")]
    return [f for f in folders if f and os.path.isdir(f)]


def find_program_files(folders, limit=400, depth=3, cancel=None):
    """Program and script files in the folders (a few levels deep), newest first."""
    found = []
    for folder in folders:
        base_depth = folder.rstrip("\\/").count(os.sep)
        for root, dirs, files in os.walk(folder):
            if cancel is not None and cancel.is_set():
                return found
            if root.rstrip("\\/").count(os.sep) - base_depth >= depth:
                dirs[:] = []
            for name in files:
                if name.lower().endswith(SIGNATURE_EXTS):
                    path = os.path.join(root, name)
                    try:
                        found.append((os.path.getmtime(path), path))
                    except OSError:
                        pass
    found.sort(reverse=True)
    return [p for _t, p in found[:limit]]


# =========================================================================== browsers

BROWSERS = {"Chrome": r"Google\Chrome\User Data", "Edge": r"Microsoft\Edge\User Data",
            "Brave": r"BraveSoftware\Brave-Browser\User Data"}
_ALL_SITES = ("<all_urls>", "*://*/*", "http://*/*", "https://*/*")


@dataclass
class BrowserFinding:
    browser: str
    kind: str      # extension, setting
    name: str
    level: str
    reason: str
    ident: str = ""


def judge_extension(manifest):
    permissions = {p for p in manifest.get("permissions", []) if isinstance(p, str)}
    hosts = {h for h in manifest.get("host_permissions", []) if isinstance(h, str)}
    for script in manifest.get("content_scripts", []):
        hosts |= {m for m in script.get("matches", []) if isinstance(m, str)}
    sees_all = bool(hosts & set(_ALL_SITES)) or bool(permissions & set(_ALL_SITES))
    strong = permissions & {"webRequest", "webRequestBlocking", "cookies", "history", "tabs", "debugger", "proxy",
                            "nativeMessaging", "management"}
    if permissions & {"debugger", "proxy", "nativeMessaging"}:
        return MEDIUM, _("Can control your browser or talk to programs on your PC.")
    if sees_all and strong:
        return MEDIUM, _("Can read what you do on every website (pages, cookies or history).")
    if sees_all:
        return LOW, _("Can see every website you open.")
    return INFO, _("Limited access.")


def _extension_name(manifest, version_dir):
    name = str(manifest.get("name", "?"))
    match = re.fullmatch(r"__MSG_(.+)__", name)
    if match:
        for lang in ("en", "en_US", manifest.get("default_locale", "en")):
            try:
                with open(os.path.join(version_dir, "_locales", lang, "messages.json"), encoding="utf-8") as f:
                    messages = json.load(f)
                for key, value in messages.items():
                    if key.lower() == match.group(1).lower():
                        return value.get("message", name)
            except (OSError, ValueError):
                continue
    return name


def read_extensions(local_app_data=None):
    base = local_app_data or os.environ.get("LOCALAPPDATA", "")
    findings = []
    for browser, sub in BROWSERS.items():
        root = os.path.join(base, *sub.split("\\"))
        try:
            profiles = [p for p in os.listdir(root) if p == "Default" or p.startswith("Profile ")]
        except OSError:
            continue
        for profile in profiles:
            ext_root = os.path.join(root, profile, "Extensions")
            try:
                ids = os.listdir(ext_root)
            except OSError:
                continue
            for ext_id in ids:
                try:
                    versions = sorted(os.listdir(os.path.join(ext_root, ext_id)))
                    version_dir = os.path.join(ext_root, ext_id, versions[-1])
                    with open(os.path.join(version_dir, "manifest.json"), encoding="utf-8-sig") as f:
                        manifest = json.load(f)
                except (OSError, ValueError, IndexError):
                    continue
                level, reason = judge_extension(manifest)
                findings.append(BrowserFinding(browser, "extension", _extension_name(manifest, version_dir), level,
                                               reason, ext_id))
    return findings


_TRUSTED_START = ("google.", "bing.", "duckduckgo.", "microsoft.", "msn.", "yahoo.", "edge://", "chrome://", "about:",
                  "brave.", "startpage.", "ecosia.")


def judge_start_pages(urls):
    bad = [u for u in urls if u and not any(t in u.lower() for t in _TRUSTED_START)]
    if bad:
        return MEDIUM, _("Opens these pages when the browser starts: {urls}. Hijackers use this to push ads or "
                         "fake search.").format(urls=", ".join(bad[:3]))
    return INFO, ""


def read_browser_settings(local_app_data=None):
    base = local_app_data or os.environ.get("LOCALAPPDATA", "")
    findings = []
    for browser, sub in BROWSERS.items():
        path = os.path.join(base, *sub.split("\\"), "Default", "Preferences")
        try:
            with open(path, encoding="utf-8") as f:
                prefs = json.load(f)
        except (OSError, ValueError):
            continue
        urls = []
        if prefs.get("session", {}).get("restore_on_startup") == 4:
            urls += prefs.get("session", {}).get("startup_urls", [])
        if prefs.get("homepage") and not prefs.get("homepage_is_newtabpage", True):
            urls.append(prefs["homepage"])
        level, reason = judge_start_pages(urls)
        if level != INFO:
            findings.append(BrowserFinding(browser, "setting", _("Start pages"), level, reason))
    return findings


def read_proxy_settings():
    """Windows' own proxy settings, which browsers share and hijackers like to change."""
    findings = []
    if winreg is None:
        return findings
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Internet Settings") as key:
            def get(name):
                try:
                    return winreg.QueryValueEx(key, name)[0]
                except OSError:
                    return None
            if get("ProxyEnable") == 1 and get("ProxyServer"):
                server = str(get("ProxyServer"))
                local = server.startswith(("127.", "localhost"))
                findings.append(BrowserFinding(_("Windows"), "setting", _("Proxy"), LOW if local else MEDIUM,
                                               _("All web traffic goes through the proxy {server}. Attackers use this "
                                                 "to watch or change what you see.").format(server=server)))
            if get("AutoConfigURL"):
                findings.append(BrowserFinding(_("Windows"), "setting", _("Proxy script"), MEDIUM,
                                               _("A proxy script is set ({url}). Check that you set it up.").format(
                                                   url=get("AutoConfigURL"))))
    except OSError:
        pass
    return findings


def check_browsers():
    winutil.require_windows()
    findings = read_extensions() + read_browser_settings() + read_proxy_settings()
    findings.sort(key=lambda f: (_ORDER[f.level], f.browser, f.name.lower()))
    return findings


# =========================================================================== remote access

REMOTE_TOOLS = {"anydesk": "AnyDesk", "teamviewer": "TeamViewer", "ultraviewer": "UltraViewer", "rustdesk": "RustDesk",
                "supremo": "Supremo", "ammyy": "Ammyy Admin", "lmiguardian": "LogMeIn", "logmein": "LogMeIn",
                "splashtop": "Splashtop", "screenconnect": "ScreenConnect", "connectwise": "ConnectWise",
                "winvnc": "VNC", "vncserver": "VNC", "tvnserver": "TightVNC", "radmin": "Radmin",
                "quickassist": "Quick Assist", "remoting_host": "Chrome Remote Desktop", "meshagent": "MeshCentral",
                "aeroadmin": "AeroAdmin", "zohoassist": "Zoho Assist"}


@dataclass
class RemoteFinding:
    title: str
    level: str
    detail: str
    fix: str = ""


def match_remote_tools(process_names):
    """Names of remote-control programs among running programs."""
    found = {}
    for name in process_names:
        lower = name.lower()
        for key, label in REMOTE_TOOLS.items():
            if key in lower:
                found.setdefault(label, name)
    return sorted(found)


def _reg_value(hive, sub, name):
    try:
        with winreg.OpenKey(hive, sub) as key:
            return winreg.QueryValueEx(key, name)[0]
    except OSError:
        return None


def check_remote_access():
    winutil.require_windows()
    findings = []
    rdp_off = _reg_value(winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Control\Terminal Server",
                         "fDenyTSConnections")
    if rdp_off == 0:
        nla = _reg_value(winreg.HKEY_LOCAL_MACHINE,
                         r"SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp", "UserAuthentication")
        findings.append(RemoteFinding(
            _("Remote Desktop is ON"), HIGH if nla == 0 else MEDIUM,
            _("Someone with your password can control this PC from the network. Turn it off unless you use it.")
            + (" " + _("It also does not require network-level authentication, which is risky.") if nla == 0 else ""),
            "rdp"))
    else:
        findings.append(RemoteFinding(_("Remote Desktop is off"), INFO, _("Nobody can connect with Remote Desktop.")))
    assist = _reg_value(winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Control\Remote Assistance",
                        "fAllowToGetHelp")
    if assist == 1:
        findings.append(RemoteFinding(_("Remote Assistance is ON"), MEDIUM,
                                      _("Scam callers sometimes talk people into using this. Turn it off unless you "
                                        "need it."), "assist"))
    names = []
    try:
        for line in winutil.run(["tasklist", "/fo", "csv", "/nh"]).stdout.splitlines():
            match = re.match(r'"([^"]+)"', line)
            if match:
                names.append(match.group(1))
    except (OSError, ValueError):
        pass
    for label in match_remote_tools(names):
        findings.append(RemoteFinding(_("{tool} is running").format(tool=label), MEDIUM,
                                      _("A remote-control program is running. If you did not start it, or someone "
                                        "phoned you and asked you to install it, close it and uninstall it.")))
    return findings


def fix_remote(key):
    winutil.require_windows()
    try:
        if key == "rdp":
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Control\Terminal Server", 0,
                                winreg.KEY_SET_VALUE) as k:
                winreg.SetValueEx(k, "fDenyTSConnections", 0, winreg.REG_DWORD, 1)
        elif key == "assist":
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Control\Remote Assistance", 0,
                                winreg.KEY_SET_VALUE) as k:
                winreg.SetValueEx(k, "fAllowToGetHelp", 0, winreg.REG_DWORD, 0)
        else:
            raise ValueError(_("Nothing to fix."))
    except PermissionError:
        raise RuntimeError(_("Windows refused. Run NoorCleaner as administrator.")) from None
    except OSError as exc:
        raise RuntimeError(str(exc)) from None
