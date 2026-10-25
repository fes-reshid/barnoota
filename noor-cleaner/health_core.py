"""Disk health: what Windows itself knows about each physical drive.

Reads the drive's own health report (Get-PhysicalDisk and its reliability
counters: temperature, wear, power-on hours, uncorrected errors) and turns it
into a plain verdict. The detailed counters need administrator rights.
"""

import json
import subprocess
from dataclasses import dataclass, field

import scanner_core as core
from i18n import _

GOOD, WARNING, BAD = "good", "warning", "bad"

_SCRIPT = (
    "@(Get-PhysicalDisk | ForEach-Object { $r = $null; "
    "try { $r = $_ | Get-StorageReliabilityCounter -ErrorAction Stop } catch {}; "
    "[pscustomobject]@{ name=$_.FriendlyName; media=[string]$_.MediaType; bus=[string]$_.BusType; "
    "size=[int64]$_.Size; health=[string]$_.HealthStatus; status=($_.OperationalStatus -join ', '); "
    "temperature=$r.Temperature; wear=$r.Wear; hours=$r.PowerOnHours; "
    "read_errors=$r.ReadErrorsUncorrected; write_errors=$r.WriteErrorsUncorrected } }) | ConvertTo-Json -Compress"
)


@dataclass
class DiskHealth:
    name: str
    media: str = ""          # SSD, HDD or Unspecified
    bus: str = ""            # NVMe, SATA, USB...
    size: int = 0
    health: str = ""         # Healthy, Warning, Unhealthy
    status: str = ""         # OK, or what is wrong
    temperature: int = None  # degrees C
    wear: int = None         # % of an SSD's life used
    hours: int = None        # power-on hours
    read_errors: int = None
    write_errors: int = None
    notes: list = field(default_factory=list)

    @property
    def kind(self):
        return self.media if self.media in ("SSD", "HDD") else _("Drive")

    def verdict(self):
        """(GOOD/WARNING/BAD, [reasons in plain words])."""
        level, reasons = GOOD, []

        def flag(new_level, reason):
            nonlocal level
            if new_level == BAD or level == GOOD:
                level = new_level
            reasons.append(reason)

        if self.health == "Unhealthy":
            flag(BAD, _("Windows reports this drive as failing. Back up your files now."))
        elif self.health == "Warning":
            flag(WARNING, _("Windows reports a problem with this drive. Back up your files soon."))
        if self.wear is not None and self.wear >= 100:
            flag(BAD, _("This SSD has used up its expected life ({wear}%).").format(wear=self.wear))
        elif self.wear is not None and self.wear >= 80:
            flag(WARNING, _("This SSD has used {wear}% of its expected life.").format(wear=self.wear))
        if (self.read_errors or 0) + (self.write_errors or 0) > 0:
            flag(WARNING, _("The drive has had errors it could not correct."))
        if self.temperature is not None and self.temperature >= 60:
            flag(WARNING, _("The drive is running hot ({temp} °C). Check the PC's fans and air flow.").format(
                temp=self.temperature))
        if self.status and self.status != "OK":
            flag(WARNING, _("Windows says: {status}").format(status=self.status))
        return level, reasons


def _int(value):
    return int(value) if isinstance(value, (int, float)) and value >= 0 else None


def parse_disks(text):
    text = (text or "").strip()
    if not text:
        return []
    data = json.loads(text)
    if isinstance(data, dict):
        data = [data]
    disks = []
    for d in data:
        disks.append(DiskHealth(
            name=str(d.get("name") or _("Drive")).strip(), media=str(d.get("media") or ""),
            bus=str(d.get("bus") or ""), size=_int(d.get("size")) or 0, health=str(d.get("health") or ""),
            status=str(d.get("status") or ""), temperature=_int(d.get("temperature")) or None,
            wear=_int(d.get("wear")), hours=_int(d.get("hours")),
            read_errors=_int(d.get("read_errors")), write_errors=_int(d.get("write_errors"))))
    return disks


def read_disk_health():
    """Every physical drive Windows knows about. Raises RuntimeError if Windows will not say."""
    if not core.IS_WINDOWS:
        return []
    result = subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", _SCRIPT],
                            capture_output=True, text=True, timeout=120,
                            creationflags=subprocess.CREATE_NO_WINDOW)
    if result.returncode != 0:
        raise RuntimeError(_("Windows would not report disk health.") + "\n\n" + result.stderr.strip()[-300:])
    return parse_disks(result.stdout)


def check_drive_for_errors(drive):
    """Runs Windows' own online drive check (chkdsk /scan) in an administrator window."""
    letter = drive.rstrip("\\")
    core.run_elevated_console(f"chkdsk {letter} /scan", f"checking drive {letter} for errors.")
