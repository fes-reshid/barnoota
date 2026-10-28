"""The "Disk health" page: a plain verdict for every drive, and Windows' own drive check."""

import tkinter as tk
from tkinter import ttk

import health_core as health
import scanner_core as core
from i18n import _
from ui_base import human_size


class HealthMixin:
    def _health_view(self):
        px = self.theme.px
        self.handlers["health_done"] = self._show_health
        view = self._view("health", _("Disk health"), _("Whether your drives are healthy, from what the drives "
                                                       "report to Windows. A failing drive is the main cause of lost "
                                                       "and corrupted files."))
        top = self._card(view, fill="x", **self._gap())
        row = self._row(top)
        self._button(row, _("Check disk health"), self.load_health, style="Primary.TButton", gap=12)
        self.health_status = ttk.Label(row, text=_("Temperature, wear and error readings need administrator rights."),
                                       style="CardSub.TLabel")
        self.health_status.pack(side=self.L)
        self.health_box = ttk.Frame(view)
        self.health_box.pack(fill="x")

        check = self._card(view, _("Check a drive for errors"), fill="x", side="bottom")
        self._text(check, _("Windows' own check (chkdsk) looks for damaged parts of the file system while you keep "
                            "working. It opens in a separate window and needs administrator approval."),
                   pady=(0, px(10)))
        row = self._row(check)
        drives = [d.rstrip("\\") for d in core.list_drives()]
        self.chkdsk_drive = tk.StringVar(value="C:" if "C:" in drives else drives[0])
        ttk.Combobox(row, textvariable=self.chkdsk_drive, values=drives, state="readonly", width=8).pack(
            side=self.L, padx=self.pad(0, px(10)))
        self._button(row, _("Check this drive"), self.check_drive)

    def load_health(self):
        if self._busy() or not self.admin_gate(_("Temperature, wear and error readings of your drives need "
                                                 "administrator rights.")):
            return
        self.health_status.config(text=_("Asking Windows..."))

        def work():
            try:
                self.events.put(("health_done", health.read_disk_health(), None))
            except Exception as exc:
                self.events.put(("health_done", [], str(exc)))

        self._start_worker(work)

    def _show_health(self, disks, error):
        px = self.theme.px
        for child in self.health_box.winfo_children():
            child.destroy()
        if error:
            self.health_status.config(text=_("Could not read disk health."))
            self.warn(error)
            return
        if not disks:
            self.health_status.config(text=_("Windows did not report any drives.") if core.IS_WINDOWS
                                      else _("Disk health is only available on Windows."))
            return
        worst = health.GOOD
        for disk in disks:
            level, reasons = disk.verdict()
            if level == health.BAD or (level == health.WARNING and worst == health.GOOD):
                worst = level
            card = self._card(self.health_box, fill="x", **self._gap())
            head = self._row(card)
            ttk.Label(head, text=disk.name, style="H3.TLabel").pack(side=self.L)
            pill = {health.GOOD: (_("Healthy"), "PillOn.TLabel"), health.WARNING: (_("Needs attention"), "PillOff.TLabel"),
                    health.BAD: (_("Failing - back up now"), "PillBad.TLabel")}[level]
            ttk.Label(head, text=pill[0], style=pill[1]).pack(side=self.L, padx=self.pad(px(12)))
            facts = [disk.kind]
            if disk.bus:
                facts.append(disk.bus)
            if disk.size:
                facts.append(human_size(disk.size))
            if disk.temperature is not None:
                facts.append(_("{temp} °C").format(temp=disk.temperature))
            if disk.wear is not None and disk.media == "SSD":
                facts.append(_("{wear}% worn").format(wear=disk.wear))
            if disk.hours is not None:
                facts.append(_("{hours} hours switched on").format(hours=f"{disk.hours:,}"))
            self._text(card, "  ·  ".join(facts), style="Hint.TLabel", pady=(px(6), px(4)))
            if reasons:
                self._bullets(card, reasons, style="CardSub.TLabel")
            else:
                self._text(card, _("No problems reported."), style="CardSub.TLabel")
        self.health_status.config(text={health.GOOD: _("All drives look healthy."),
                                        health.WARNING: _("A drive needs attention - see below."),
                                        health.BAD: _("A drive is failing. Copy your important files to another "
                                                      "drive or the cloud now.")}[worst])

    def check_drive(self):
        drive = self.chkdsk_drive.get()
        if not self.admin_gate(_("Checking a drive for errors needs administrator rights.")):
            return
        if not self.ask(_("Check drive {drive} for errors now? A window opens and shows the result.").format(drive=drive)):
            return
        try:
            health.check_drive_for_errors(drive)
        except Exception as exc:
            self.error(str(exc))
