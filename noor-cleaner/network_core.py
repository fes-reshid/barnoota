"""Network safety: which ports are open, who is connected, whether someone is attacking - and blocking.

Everything is read with Windows' own tools (netstat, tasklist, PowerShell's event log reader) and
blocking uses Windows Firewall rules that NoorCleaner names "NoorCleaner block ...", so they are easy
to find and to undo. Nothing is blocked or stopped unless the user asks. Blocking needs administrator
rights.
"""

import ipaddress
import json
import ntpath
import os
import re
import socket
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from collections import Counter
from dataclasses import dataclass

import scanner_core as core
from i18n import _

RULE_PREFIX = "NoorCleaner block"
ATTACK_FAILED_LOGONS = 10   # this many failed sign-ins from one address in 24 hours looks like guessing passwords
ATTACK_CONNECTIONS = 25     # this many open connections from one address looks like a flood or scan
ATTACK_HALF_OPEN = 5        # this many half-open connections (SYN_RECEIVED) from one address looks like a port scan

# Programs that must never be stopped from here: Windows stops working (or logs you out) without them.
PROTECTED_PROGRAMS = {"system", "system idle process", "registry", "smss.exe", "csrss.exe", "wininit.exe",
                      "winlogon.exe", "services.exe", "lsass.exe", "svchost.exe", "explorer.exe", "dwm.exe",
                      "fontdrvhost.exe", "noorcleaner.exe"}

HIGH, MEDIUM, LOW, INFO = "high", "medium", "low", "info"


def known_ports():
    """port -> (name, how risky when reachable from other computers, what it means), in the current language."""
    return {
        21: ("FTP", HIGH, _("File transfer without encryption. Rarely needed on a home PC.")),
        22: ("SSH", MEDIUM, _("Remote command line. Fine if you set it up yourself.")),
        23: ("Telnet", HIGH, _("Remote control with no encryption. Attackers scan for it constantly.")),
        80: (_("Web server"), MEDIUM, _("A website running on this PC.")),
        135: (_("Windows RPC"), LOW, _("Normal for Windows. Do not block it.")),
        139: (_("File sharing (NetBIOS)"), MEDIUM, _("Old Windows file sharing. Block it if you do not share files.")),
        445: (_("File sharing (SMB)"), MEDIUM, _("Windows file sharing. A favourite target of worms; block it if you "
                                               "do not share files.")),
        1433: ("SQL Server", HIGH, _("A database. Should not be open to the internet.")),
        3306: ("MySQL", HIGH, _("A database. Should not be open to the internet.")),
        3389: (_("Remote Desktop"), HIGH, _("Lets someone control this PC. Constantly attacked; block it unless you "
                                           "use it.")),
        5900: ("VNC", HIGH, _("Remote screen control, often weakly protected.")),
        5985: (_("Remote management (WinRM)"), MEDIUM, _("Remote administration of this PC.")),
        5986: (_("Remote management (WinRM)"), MEDIUM, _("Remote administration of this PC.")),
        8080: (_("Web server"), MEDIUM, _("A website or web proxy running on this PC.")),
    }


@dataclass
class OpenPort:
    protocol: str        # TCP or UDP
    address: str         # the address it listens on
    port: int
    pid: int
    program: str = ""
    path: str = ""

    @property
    def reachable(self):
        """True when other computers can reach it (not just this PC)."""
        return self.address not in ("127.0.0.1", "::1")

    @property
    def service(self):
        return known_ports().get(self.port, ("",))[0]

    def risk(self):
        """(HIGH/MEDIUM/LOW/INFO, a plain-language note)."""
        known = known_ports().get(self.port)
        if not self.reachable:
            return INFO, _("Only this PC can reach it.")
        if known:
            return known[1], known[2]
        return INFO, _("Open to your network. Fine if you know the program.")


@dataclass
class Connection:
    protocol: str
    local: str
    remote_address: str
    remote_port: int
    state: str
    pid: int
    program: str = ""


@dataclass
class Suspect:
    address: str
    reason: str
    count: int


def _run(args, timeout=30):
    flags = subprocess.CREATE_NO_WINDOW if core.IS_WINDOWS else 0
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout, creationflags=flags,
                          encoding="utf-8", errors="replace")


def split_address(text):
    """'1.2.3.4:80' -> ('1.2.3.4', 80); '[::1]:445' -> ('::1', 445)."""
    host, _sep, port = text.rpartition(":")
    return host.strip("[]"), int(port) if port.isdigit() else 0


def parse_netstat(text):
    """Turns `netstat -ano` output into (listening ports, other connections)."""
    ports, connections = [], []
    for line in text.splitlines():
        parts = line.split()
        if len(parts) < 4 or parts[0].upper() not in ("TCP", "UDP"):
            continue
        protocol = parts[0].upper()
        local_host, local_port = split_address(parts[1])
        if protocol == "TCP" and len(parts) >= 5:
            state, pid = parts[3].upper(), parts[4]
        elif protocol == "UDP":
            state, pid = "", parts[-1]
        else:
            continue
        if not pid.isdigit():
            continue
        remote_host, remote_port = split_address(parts[2])
        if protocol == "UDP" or state == "LISTENING":
            if local_port:
                ports.append(OpenPort(protocol, local_host, local_port, int(pid)))
        else:
            connections.append(Connection(protocol, parts[1], remote_host, remote_port, state, int(pid)))
    return ports, connections


def parse_tasklist(text):
    """`tasklist /fo csv /nh` output -> {pid: program name}."""
    names = {}
    for line in text.splitlines():
        match = re.match(r'"([^"]*)","(\d+)"', line.strip())
        if match:
            names[int(match.group(2))] = match.group(1)
    return names


def program_paths():
    """{pid: path of the program file}, from Windows (best effort)."""
    script = ("@(Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath } | "
              "ForEach-Object { [pscustomobject]@{ pid=[int]$_.ProcessId; path=[string]$_.ExecutablePath } }) | "
              "ConvertTo-Json -Compress")
    try:
        out = _run(["powershell", "-NoProfile", "-NonInteractive", "-Command", script], timeout=40).stdout.strip()
        data = json.loads(out) if out else []
    except (OSError, ValueError, subprocess.SubprocessError):
        return {}
    if isinstance(data, dict):
        data = [data]
    return {item["pid"]: item["path"] for item in data if isinstance(item, dict) and "pid" in item}


def read_network():
    """(open ports, other connections) with the program behind each. Windows only."""
    if not core.IS_WINDOWS:
        raise RuntimeError(_("Network checks are only available on Windows."))
    ports, connections = parse_netstat(_run(["netstat", "-ano"]).stdout)
    names = parse_tasklist(_run(["tasklist", "/fo", "csv", "/nh"]).stdout)
    paths = program_paths()
    for port in ports:
        port.program = names.get(port.pid, "") or ("System" if port.pid in (0, 4) else "")
        port.path = paths.get(port.pid, "")
    for conn in connections:
        conn.program = names.get(conn.pid, "")
    seen, unique = set(), []
    for port in ports:  # the same program listens on IPv4 and IPv6: show each port once per protocol and program
        key = (port.protocol, port.port, port.pid, port.reachable)
        if key not in seen:
            seen.add(key)
            unique.append(port)
    unique.sort(key=lambda p: (not p.reachable, p.port))
    return unique, connections


def _is_outside(address):
    """True for an address on the internet or another network (not this PC, not a link-local or unspecified one)."""
    try:
        ip = ipaddress.ip_address(address.split("%")[0])
    except ValueError:
        return False
    return not (ip.is_loopback or ip.is_unspecified or ip.is_multicast or ip.is_link_local)


def find_suspects(connections, failed_logons=None):
    """Addresses that behave like an attack. failed_logons: Counter of address -> failed sign-ins."""
    found = []
    per_address = Counter(c.remote_address for c in connections if c.state == "ESTABLISHED" and _is_outside(c.remote_address))
    half_open = Counter(c.remote_address for c in connections if c.state == "SYN_RECEIVED" and _is_outside(c.remote_address))
    for address, count in half_open.items():
        if count >= ATTACK_HALF_OPEN:
            found.append(Suspect(address, _("Knocking on many doors at once (a port scan)"), count))
    for address, count in per_address.items():
        if count >= ATTACK_CONNECTIONS and address not in half_open:
            found.append(Suspect(address, _("An unusually large number of connections at once"), count))
    for address, count in (failed_logons or {}).items():
        if count >= ATTACK_FAILED_LOGONS:
            found.append(Suspect(address, _("Many failed sign-in attempts (guessing passwords)"), count))
    found.sort(key=lambda s: -s.count)
    return found


def failed_logons(hours=24):
    """Counter of address -> failed Windows sign-ins in the last hours. Needs administrator rights."""
    script = ("Get-WinEvent -FilterHashtable @{LogName='Security';Id=4625;StartTime=(Get-Date).AddHours(-%d)} "
              "-MaxEvents 5000 -ErrorAction Stop | ForEach-Object { $x=[xml]$_.ToXml(); "
              "($x.Event.EventData.Data | Where-Object { $_.Name -eq 'IpAddress' }).'#text' }" % hours)
    result = _run(["powershell", "-NoProfile", "-NonInteractive", "-Command", script], timeout=90)
    text = result.stdout
    if result.returncode != 0 and "No events were found" not in result.stderr:
        raise RuntimeError(_("Windows would not let NoorCleaner read the sign-in log. Run NoorCleaner as "
                             "administrator."))
    return Counter(line.strip() for line in text.splitlines() if _is_outside(line.strip()))


# --------------------------------------------------------------------------- blocking

def _firewall(*args):
    result = _run(["netsh", "advfirewall", "firewall", *args])
    if result.returncode != 0:
        raise RuntimeError(_("Windows Firewall refused: {details}").format(
            details=(result.stdout or result.stderr).strip() or _("administrator rights are needed")))


def block_port(port, protocol="TCP"):
    """Blocks incoming connections to a port."""
    port, protocol = int(port), protocol.upper()
    if protocol not in ("TCP", "UDP") or not 0 < port < 65536:
        raise ValueError(_("That is not a valid port."))
    _firewall("add", "rule", f"name={RULE_PREFIX} port {port} ({protocol})", "dir=in", "action=block",
              f"protocol={protocol}", f"localport={port}")


def block_address(address):
    """Blocks all traffic to and from one address."""
    try:
        ip = str(ipaddress.ip_address(address.split("%")[0]))
    except ValueError:
        raise ValueError(_("That is not a valid address.")) from None
    if not _is_outside(ip):
        raise ValueError(_("This address belongs to your own PC and cannot be blocked."))
    for direction in ("in", "out"):
        _firewall("add", "rule", f"name={RULE_PREFIX} address {ip} ({direction})", f"dir={direction}",
                  "action=block", f"remoteip={ip}")


def list_blocks():
    """Names of the NoorCleaner firewall rules, newest unknown order."""
    result = _run(["netsh", "advfirewall", "firewall", "show", "rule", "name=all"])
    names = re.findall(r"^Rule Name:\s*(.+)$", result.stdout, re.M)
    return sorted({n.strip() for n in names if n.strip().startswith(RULE_PREFIX)})


def unblock(rule_name):
    if not rule_name.startswith(RULE_PREFIX):
        raise ValueError(_("That is not a NoorCleaner block."))
    _firewall("delete", "rule", f"name={rule_name}")


def can_stop(program):
    return program.lower() not in PROTECTED_PROGRAMS and ntpath.basename(program).lower() not in PROTECTED_PROGRAMS


def stop_program(pid, program):
    """Ends the program using a port. Refuses Windows' own essential programs."""
    if pid <= 4 or not can_stop(program):
        raise ValueError(_("{program} is part of Windows and is not stopped from here. Block the port instead.").format(
            program=program or "System"))
    result = _run(["taskkill", "/PID", str(int(pid)), "/F"])
    if result.returncode != 0:
        raise RuntimeError((result.stdout or result.stderr).strip())


# --------------------------------------------------------------------------- devices on your network

@dataclass
class Device:
    address: str
    mac: str
    is_router: bool = False
    is_this_pc: bool = False


def parse_route(text):
    """The default gateway (your router) from `route print -4`; the lowest metric wins."""
    best = None
    for line in text.splitlines():
        parts = line.split()
        if len(parts) >= 5 and parts[0] == "0.0.0.0" and parts[1] == "0.0.0.0":
            try:
                ipaddress.ip_address(parts[2])
                metric = int(parts[4])
            except ValueError:
                continue
            if best is None or metric < best[0]:
                best = (metric, parts[2], parts[3])
    return (best[1], best[2]) if best else (None, None)  # (router, this PC's address)


def parse_arp(text):
    """[(ip, mac)] from `arp -a`, without broadcast and multicast entries."""
    devices = []
    for line in text.splitlines():
        match = re.match(r"\s*(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F]{2}(?:-[0-9a-fA-F]{2}){5})", line)
        if not match:
            continue
        ip, mac = match.group(1), match.group(2).lower()
        first = int(ip.split(".")[0])
        if mac == "ff-ff-ff-ff-ff-ff" or mac.startswith("01-00-5e") or ip.endswith(".255") or first >= 224:
            continue
        devices.append((ip, mac))
    return devices


def _ping(address):
    try:
        _run(["ping", "-n", "1", "-w", "300", address], timeout=3)
    except (OSError, subprocess.SubprocessError):
        pass


def read_devices():
    """Devices that answered on your home network (the /24 around this PC). Windows only."""
    if not core.IS_WINDOWS:
        raise RuntimeError(_("Network checks are only available on Windows."))
    router, mine = parse_route(_run(["route", "print", "-4"]).stdout)
    if not mine:
        raise RuntimeError(_("This PC does not seem to be connected to a network."))
    base = ".".join(mine.split(".")[:3])
    with ThreadPoolExecutor(max_workers=48) as pool:
        list(pool.map(_ping, [f"{base}.{n}" for n in range(1, 255)]))
    found = {ip: mac for ip, mac in parse_arp(_run(["arp", "-a"]).stdout) if ip.startswith(base + ".")}
    devices = [Device(ip, mac, ip == router, False) for ip, mac in found.items()]
    devices.append(Device(mine, "", False, True))
    devices.sort(key=lambda d: tuple(int(x) for x in d.address.split(".")))
    return devices, router


def router_check(router):
    """Quick look at the router's own doors. Returns [(level, text)]."""
    if not router:
        return []

    def open_port(port):
        try:
            with socket.create_connection((router, port), timeout=0.8):
                return True
        except OSError:
            return False

    with ThreadPoolExecutor(max_workers=6) as pool:
        ports = dict(zip((21, 23, 80, 443, 7547, 8080), pool.map(open_port, (21, 23, 80, 443, 7547, 8080))))
    findings = []
    if ports[23]:
        findings.append((HIGH, _("Your router accepts Telnet (port 23). This old remote control has no encryption and "
                                 "is used by router botnets. Turn it off in the router settings.")))
    if ports[21]:
        findings.append((MEDIUM, _("Your router accepts FTP (port 21). Turn it off unless you use it.")))
    if ports[7547]:
        findings.append((MEDIUM, _("Your router answers on port 7547 (remote management by your internet provider). "
                                   "Attackers have abused this on some routers; keep the router updated.")))
    if ports[80] and not ports[443]:
        findings.append((LOW, _("Your router's settings page uses plain http, so only log in to it from your own "
                                "home network.")))
    if not findings:
        findings.append((INFO, _("No weak doors found on the router.")))
    findings.append((INFO, _("NoorCleaner cannot see the router's password. Make sure you changed it from the one on "
                             "the sticker.")))
    return findings


# --------------------------------------------------------------------------- attack history

LOG_FILE = os.path.join(core.APP_DIR, "attack_log.json")
LOG_LIMIT = 500


def load_log(path=None):
    try:
        with open(path or LOG_FILE, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except (OSError, ValueError):
        return []


def log_event(address, reason, count, action="detected", path=None, now=None):
    """Adds an entry unless the same address and reason was logged in the last hour."""
    path = path or LOG_FILE
    now = now or time.time()
    entries = load_log(path)
    for entry in reversed(entries):
        if now - entry.get("time", 0) > 3600:
            break
        if (entry.get("address"), entry.get("reason"), entry.get("action")) == (address, reason, action):
            return False
    entries.append({"time": now, "address": address, "reason": reason, "count": count, "action": action})
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(entries[-LOG_LIMIT:], f)
    except OSError:
        return False
    return True


def clear_log(path=None):
    try:
        os.remove(path or LOG_FILE)
    except OSError:
        pass
