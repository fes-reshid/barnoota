"""The "What's slowing your PC" page: likely causes in plain words, and the programs using the most memory
and processor right now."""

import subprocess
from tkinter import ttk

import scanner_core as core
import speed_core as speed
from i18n import _
from ui_base import clear_tree, human_size, make_tree
from ui_security import status_pill


class SpeedMixin:
    def _speed_view(self):
        self.handlers["speed_done"] = self._show_speed
        view = self._view("speed", _("What's slowing your PC"),
                          _("Finds the likely reasons your PC feels slow and tells you what to do. Nothing is "
                            "changed unless you press a button."))
        self._segments(view, [("causes", _("Likely causes"), self._causes_page),
                              ("busy", _("Busy programs"), self._busy_page)])

    def _causes_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        row = self._row(card, pady=(0, px(10)))
        self._button(row, _("Check my PC"), self.load_speed, style="Primary.TButton", gap=12)
        self.speed_status = ttk.Label(row, text=_("Looks at memory, processor, disk, free space, start-up programs "
                                                  "and how long Windows has been running."), style="CardSub.TLabel")
        self.speed_status.pack(side=self.L)
        self.speed_box = ttk.Frame(card, style="Plain.TFrame")
        self.speed_box.pack(fill="x")
        return card

    def _busy_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        ttk.Label(card, text=_("Using the most memory"), style="H3.TLabel").pack(anchor=self.W, pady=(0, px(4)))
        frame, self.mem_tree = make_tree(card, [("name", _("Program"), 300), ("count", _("Running copies"), 120),
                                                ("mem", _("Memory"), 120)], height=6)
        frame.pack(fill="both", expand=True)
        ttk.Label(card, text=_("Using the most processor right now"), style="H3.TLabel").pack(
            anchor=self.W, pady=(px(12), px(4)))
        frame, self.cpu_tree = make_tree(card, [("name", _("Program"), 300), ("cpu", _("Processor"), 120)], height=6)
        frame.pack(fill="both", expand=True)
        bar = self._row(card, pady=(px(10), 0))
        self._button(bar, _("Open Task Manager"), self.open_task_manager, style="Primary.TButton")
        bar.pack_configure(side="bottom")
        return card

    # ------------------------------------------------------------------ checking

    def load_speed(self):
        if self._busy():
            return
        self.speed_status.config(text=_("Looking (about 10 seconds)..."))

        def work():
            try:
                data = speed.collect()
                self.events.put(("speed_done", data, speed.diagnose(data), None))
            except Exception as exc:
                self.events.put(("speed_done", {}, [], str(exc)))

        self._start_worker(work)

    def _show_speed(self, data, causes, error):
        px = self.theme.px
        if error:
            self.speed_status.config(text=_("Could not check."))
            self.warn(error)
            return
        for child in self.speed_box.winfo_children():
            child.destroy()
        actions = {"startup": (_("Open startup programs"), self._go_startup),
                   "junk": (_("Open junk files"), lambda: self.show_view("junk")),
                   "taskmgr": (_("Open Task Manager"), self.open_task_manager),
                   "power": (_("Open power options"), self.open_power_options)}
        for cause in causes:
            row = ttk.Frame(self.speed_box, style="Plain.TFrame")
            row.pack(fill="x", pady=(0, px(10)))
            text, style = status_pill(cause.level)
            ttk.Label(row, text=text, style=style, width=9, anchor="center").pack(
                side=self.L, anchor="n", padx=self.pad(0, px(12)))
            action = actions.get(cause.key)
            if action:
                self._button(row, action[0], action[1], style="Primary.TButton", side=self.R, gap=0)
            body = ttk.Frame(row, style="Plain.TFrame")
            body.pack(side=self.L, fill="x", expand=True)
            ttk.Label(body, text=cause.title, style="H3.TLabel").pack(anchor=self.W)
            self._text(body, cause.detail, style="CardSub.TLabel", wrap=640)
        clear_tree(self.mem_tree)
        for m in data.get("mem") or []:
            if isinstance(m, dict):
                iid = self.mem_tree.insert("", "end", values=(m.get("name"), m.get("count"), human_size(m.get("mem") or 0)))
                self.mem_tree.sizes[iid] = m.get("mem") or 0
        clear_tree(self.cpu_tree)
        for name, percent in speed.top_by_cpu(data.get("cpu")):
            self.cpu_tree.insert("", "end", values=(name, f"{percent}%"))
        worth = sum(1 for c in causes if c.level in (speed.HIGH, speed.MEDIUM))
        self.speed_status.config(text=_("Likely causes: {count}").format(count=worth) if worth
                                 else _("Nothing obvious is slowing this PC."))

    # ------------------------------------------------------------------ actions

    def _go_startup(self):
        self.show_view("programs")
        self._show_segment(self.views["programs"].segments, "startup")

    def open_task_manager(self):
        try:
            subprocess.Popen(["taskmgr"])
        except OSError as exc:
            self.error(str(exc))

    def open_power_options(self):
        try:
            subprocess.Popen(["control", "powercfg.cpl"])
        except OSError as exc:
            self.error(str(exc))
