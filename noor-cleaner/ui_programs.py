"""The "Programs" page: installed programs by size (with uninstall) and startup programs (on/off)."""

import os
import subprocess
from tkinter import ttk

import programs_core as programs
import scanner_core as core
from i18n import _
from ui_base import clear_tree, human_size, make_tree, open_location


class ProgramsMixin:
    def _programs_view(self):
        self.handlers.update({"programs_done": self._show_programs, "startup_done": self._show_startup})
        view = self._view("programs", _("Programs"), _("See which programs take the most space, uninstall the ones you "
                                                       "no longer use, and choose what starts with Windows."))
        self._segments(view, [("installed", _("Installed programs"), self._installed_page),
                              ("startup", _("Startup programs"), self._startup_page)])

    # ------------------------------------------------------------------ installed

    def _installed_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        top = self._row(card, pady=(0, px(10)))
        self._button(top, _("Find installed programs"), self.load_programs, style="Primary.TButton", gap=12)
        self.programs_status = self._status_label(top, _("Biggest first. Old games and programs you never open are "
                                                         "often the biggest space users."))
        self.programs_status.pack(side=self.L)
        frame, self.programs_tree = make_tree(card, [("name", _("Program"), 280), ("size", _("Size"), 90),
                                                     ("installed", _("Installed on"), 110),
                                                     ("publisher", _("Publisher"), 200), ("version", _("Version"), 110)])
        bar = self._row(card, side="bottom", pady=(px(10), 0))
        self._button(bar, _("Uninstall"), self.uninstall_selected, style="Danger.TButton")
        self._button(bar, _("Open install folder"), self.open_program_folder)
        if core.IS_WINDOWS:
            self._button(bar, _("Microsoft Store apps (Windows Settings)"),
                         lambda: os.startfile("ms-settings:appsfeatures"), side=self.R, gap=0)
        frame.pack(fill="both", expand=True)
        return card

    def _status_label(self, parent, text):
        return ttk.Label(parent, text=text, style="CardSub.TLabel")

    def load_programs(self):
        if self._busy():
            return
        self.programs_status.config(text=_("Looking..."))
        self._start_worker(lambda: self.events.put(("programs_done", programs.list_installed_programs())))

    def _show_programs(self, found):
        tree = self.programs_tree
        clear_tree(tree)
        for p in found:
            iid = tree.insert("", "end", values=(p.name, human_size(p.size) if p.size else "-", p.installed or "-",
                                                 p.publisher, p.version))
            tree.items[iid] = p
            tree.sizes[iid] = p.size
        total = sum(p.size for p in found)
        self.programs_status.config(text=_("Installed programs: {count} ({size})").format(
            count=len(found), size=human_size(total)) if found else _("No installed programs were found."))

    def uninstall_selected(self):
        chosen = self._selected_items(self.programs_tree)
        if not chosen:
            self.info(_("Press 'Find installed programs', then select the program to uninstall."))
            return
        program = chosen[0]
        if not self.ask(_("Uninstall {name}?").format(name=program.name) + "\n\n"
                        + _("Its own uninstaller will open. Follow its steps, then press 'Find installed programs' "
                            "again to refresh the list."), danger=True):
            return
        try:
            programs.uninstall_program(program)
        except Exception as exc:
            self.error(str(exc))

    def open_program_folder(self):
        chosen = self._selected_items(self.programs_tree)
        if not chosen:
            self.info(_("Select a program first."))
        elif chosen[0].location and os.path.isdir(chosen[0].location):
            open_location(chosen[0].location, select=False)
        else:
            self.info(_("Windows does not know where this program's files are."))

    # ------------------------------------------------------------------ startup

    def _startup_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        top = self._row(card, pady=(0, px(10)))
        self._button(top, _("Find startup programs"), self.load_startup, style="Primary.TButton", gap=12)
        self.startup_status = self._status_label(top, _("Programs that start by themselves when you sign in to "
                                                        "Windows. Turning one off makes your PC start faster."))
        self.startup_status.pack(side=self.L)
        frame, self.startup_tree = make_tree(card, [("name", _("Program"), 240), ("state", _("Status"), 80),
                                                    ("where", _("Where it is set"), 210),
                                                    ("command", _("What it runs"), 420)])
        bar = self._row(card, side="bottom", pady=(px(10), 0))
        self._button(bar, _("Turn off"), lambda: self.set_startup(False), style="Primary.TButton")
        self._button(bar, _("Turn on"), lambda: self.set_startup(True))
        self._button(bar, _("Open file location"), self.open_startup_location)
        if core.IS_WINDOWS:
            self._button(bar, _("Task Manager"), lambda: subprocess.Popen(["taskmgr", "/0", "/startup"]),
                         side=self.R, gap=0)
        frame.pack(fill="both", expand=True)
        note = self._card(card, style="Note.TFrame", fill="x", side="bottom", pady=(px(10), 0))
        self._bullets(note, (_("Turning a program off does not uninstall it; you can still open it yourself. "
                               "Turn it back on any time."),
                             _("Not sure what something is? Leave it on, or search its name online first.")))
        return card

    def load_startup(self):
        if self._busy():
            return
        self.startup_status.config(text=_("Looking..."))
        self._start_worker(lambda: self.events.put(("startup_done", programs.list_startup_items())))

    def _show_startup(self, items):
        tree = self.startup_tree
        clear_tree(tree)
        for item in items:
            iid = tree.insert("", "end", values=(item.name, _("On") if item.enabled else _("Off"), item.where,
                                                 item.command))
            tree.items[iid] = item
        on = sum(1 for i in items if i.enabled)
        self.startup_status.config(text=_("Startup programs: {count} ({on} on)").format(count=len(items), on=on)
                                   if items else _("No startup programs were found."))

    def set_startup(self, enabled):
        chosen = self._selected_items(self.startup_tree)
        if not chosen:
            self.info(_("Press 'Find startup programs', then select one or more programs."))
            return
        need_admin = []
        for item in chosen:
            try:
                programs.set_startup_enabled(item, enabled)
            except PermissionError:
                need_admin.append(item.name)
            except OSError as exc:
                need_admin.append(f"{item.name}: {exc}")
        for iid, item in self.startup_tree.items.items():
            self.startup_tree.set(iid, "state", _("On") if item.enabled else _("Off"))
        if need_admin:
            self.warn(_("These are set for all users, so changing them needs administrator rights (use 'Run as "
                        "admin' at the bottom left):") + "\n\n" + "\n".join(need_admin[:10]))
        elif enabled:
            self.info(_("Turned on. They will start the next time you sign in."))
        else:
            self.info(_("Turned off. They will not start by themselves from the next time you sign in."))

    def open_startup_location(self):
        chosen = self._selected_items(self.startup_tree)
        if not chosen:
            self.info(_("Select a program first."))
            return
        target = programs.startup_target(chosen[0])
        if target and os.path.exists(target):
            open_location(target)
        else:
            self.info(_("The program file could not be found. It may already have been removed."))
