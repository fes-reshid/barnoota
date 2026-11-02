"""What is making the PC slow: it looks at memory, processor, disk, start-up programs, free space, how long
Windows has been running and the power plan, and explains the likely causes in plain words.

Reading is safe and changes nothing. Each cause names the page of NoorCleaner (or the Windows tool) that
helps; NoorCleaner never stops a program by itself.
"""

import re
import shutil
import time
from collections import defaultdict
from dataclasses import dataclass

import scanner_core as core
import winutil
from i18n import _

HIGH, MEDIUM, LOW, INFO = "high", "medium", "low", "info"

_SCRIPT = r"""
$os = Get-CimInstance Win32_OperatingSystem
$mem = @(Get-Process | Group-Object ProcessName | ForEach-Object { [pscustomobject]@{ name=$_.Name; count=$_.Count; mem=[int64](($_.Group | Measure-Object WorkingSet64 -Sum).Sum) } } | Sort-Object mem -Descending | Select-Object -First 15)
$cpu = @(Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.Name -ne '_Total' -and $_.Name -ne 'Idle' } | Sort-Object PercentProcessorTime -Descending | Select-Object -First 25 | ForEach-Object { [pscustomobject]@{ name=[string]$_.Name; cpu=[int]$_.PercentProcessorTime } })
$load = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
$disk = (Get-CimInstance Win32_PerfFormattedData_PerfDisk_PhysicalDisk | Where-Object { $_.Name -eq '_Total' }).PercentDiskTime
$pend = (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending') -or (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired')
$plan = [string](powercfg /getactivescheme 2>$null)
[pscustomobject]@{ total_kb=[int64]$os.TotalVisibleMemorySize; free_kb=[int64]$os.FreePhysicalMemory; mem=$mem; cpu=$cpu; load=$load; disk=$disk;
  boot=$os.LastBootUpTime.ToString('yyyy-MM-ddTHH:mm:ss'); plan=$plan; pending=[bool]$pend } | ConvertTo-Json -Depth 4 -Compress
"""


@dataclass
class Cause:
    level: str
    key: str        # what the page offers to do: startup, junk, space, taskmgr, restart, power, unused, none
    title: str
    detail: str


def _gb(kb_or_bytes, unit="kb"):
    value = kb_or_bytes * (1024 if unit == "kb" else 1)
    return f"{value / 1024 ** 3:.1f} GB"


def _as_list(value):
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def top_by_cpu(rows, count=8):
    """Processor use per program name (Windows lists 'chrome', 'chrome#1'... separately), biggest first."""
    total = defaultdict(int)
    for row in _as_list(rows):
        total[re.sub(r"#\d+$", "", str(row.get("name", "")))] += int(row.get("cpu") or 0)
    return sorted(((n, c) for n, c in total.items() if c), key=lambda item: -item[1])[:count]


def collect():
    """Everything the checks need. Windows only."""
    winutil.require_windows()
    rows = winutil.powershell_json(_SCRIPT, timeout=60)
    data = rows[0] if rows else {}
    system_drive = (shutil.disk_usage("C:\\") if core.IS_WINDOWS else None)
    if system_drive:
        data["c_free"], data["c_total"] = system_drive.free, system_drive.total
    try:
        import programs_core as programs
        data["startup"] = [i.name for i in programs.list_startup_items() if i.enabled]
    except Exception:
        data["startup"] = []
    try:
        import privacy_core as privacy
        data["c_kind"] = privacy.drive_kinds(["C"]).get("C", "")
    except Exception:
        data["c_kind"] = ""
    return data


def diagnose(data, now=None):
    """Likely causes of a slow PC from the collected data, most important first."""
    causes = []
    total_kb, free_kb = data.get("total_kb") or 0, data.get("free_kb") or 0
    if total_kb:
        used = 100 * (total_kb - free_kb) / total_kb
        biggest = [m for m in _as_list(data.get("mem"))][:3]
        names = ", ".join(f"{m.get('name')} ({_gb(m.get('mem') or 0, 'b')})" for m in biggest)
        if used >= 90:
            causes.append(Cause(HIGH, "taskmgr", _("Memory is almost full ({percent}%)").format(percent=int(used)),
                                _("Windows has little memory left, so it keeps swapping to the disk, which is slow. "
                                  "Biggest users: {names}. Close programs and browser tabs you do not need.").format(
                                      names=names)))
        elif used >= 80:
            causes.append(Cause(MEDIUM, "taskmgr", _("Memory use is high ({percent}%)").format(percent=int(used)),
                                _("Biggest users: {names}.").format(names=names)))
        if total_kb < 6 * 1024 * 1024:
            causes.append(Cause(MEDIUM, "none", _("This PC has little memory ({size})").format(size=_gb(total_kb)),
                                _("Modern Windows and browsers like 8 GB or more. Adding memory is often the best "
                                  "upgrade for an old PC.")))
    load = data.get("load")
    busy = top_by_cpu(data.get("cpu"))
    if isinstance(load, (int, float)) and load >= 80:
        who = ", ".join(f"{n} ({c}%)" for n, c in busy[:3])
        causes.append(Cause(HIGH, "taskmgr", _("The processor is very busy ({percent}%)").format(percent=int(load)),
                            _("Right now these use the most: {names}. A busy moment is normal; if it stays like this, "
                              "close them or check for a stuck program.").format(names=who or "?")))
    disk = data.get("disk")
    if isinstance(disk, (int, float)) and disk >= 90:
        causes.append(Cause(HIGH, "taskmgr", _("The disk is working flat out ({percent}%)").format(percent=int(disk)),
                            _("Everything waits for the disk. This is common on hard disks while Windows updates, "
                              "searches or scans. Wait a few minutes, or check what is using the disk.")))
    c_total, c_free = data.get("c_total") or 0, data.get("c_free") or 0
    if c_total:
        share = 100 * c_free / c_total
        if share < 10:
            causes.append(Cause(HIGH, "junk", _("Drive C: is almost full ({free} free)").format(free=_gb(c_free, "b")),
                                _("Windows needs free space to work. Clear junk files, remove duplicates and "
                                  "uninstall programs you do not use.")))
        elif share < 20:
            causes.append(Cause(MEDIUM, "junk", _("Drive C: is getting full ({free} free)").format(
                free=_gb(c_free, "b")), _("Keep at least 15-20% free so Windows runs smoothly.")))
    startup = _as_list(data.get("startup"))
    if len(startup) >= 15:
        causes.append(Cause(HIGH, "startup", _("{count} programs start with Windows").format(count=len(startup)),
                            _("Every one of them slows the start-up and keeps using memory. Turn off the ones you "
                              "do not need.")))
    elif len(startup) >= 8:
        causes.append(Cause(MEDIUM, "startup", _("{count} programs start with Windows").format(count=len(startup)),
                            _("Turning off the ones you do not need makes Windows start faster.")))
    boot = data.get("boot")
    if boot:
        try:
            days = int(((now or time.time()) - time.mktime(time.strptime(boot, "%Y-%m-%dT%H:%M:%S"))) // 86400)
        except ValueError:
            days = 0
        if days >= 14:
            causes.append(Cause(MEDIUM, "restart", _("Windows has not been restarted for {days} days").format(days=days),
                                _("A restart clears memory leaks and finishes updates. Save your work and restart.")))
    if data.get("pending"):
        causes.append(Cause(MEDIUM, "restart", _("Windows is waiting for a restart"),
                            _("An update or installation needs a restart to finish. Until then things can be slow.")))
    if "power saver" in (data.get("plan") or "").lower():
        causes.append(Cause(MEDIUM, "power", _("The power plan is 'Power saver'"),
                            _("This slows the processor on purpose to save battery. Choose 'Balanced' or "
                              "'High performance' when you plug in.")))
    if data.get("c_kind") == "hdd":
        causes.append(Cause(LOW, "none", _("Windows is on a hard disk"),
                            _("A hard disk is much slower than an SSD. Moving Windows to an SSD is the biggest "
                              "speed-up for an older PC.")))
    order = {HIGH: 0, MEDIUM: 1, LOW: 2, INFO: 3}
    causes.sort(key=lambda c: order[c.level])
    if not causes:
        causes.append(Cause(INFO, "none", _("Nothing obvious is slowing this PC"),
                            _("Memory, processor, disk, free space and start-up all look fine right now. If it still "
                              "feels slow, try the 'Unused programs' list and a restart.")))
    return causes
