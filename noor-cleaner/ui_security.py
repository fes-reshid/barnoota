"""The "Security check" page: Windows protection, hiding places, hosts file, browsers, remote access
and program signatures."""

import os
import subprocess
import tkinter as tk
from tkinter import ttk

import scanner_core as core
import security_core as sec
from i18n import _
from ui_base import clear_tree, make_tree, open_location


def level_label(level):
    return {sec.HIGH: _("High"), sec.MEDIUM: _("Medium"), sec.LOW: _("Low"), sec.INFO: _("Fine")}.get(level, level)


def status_pill(status):
    """(text, style) for a check result or a risk level."""
    if status in (sec.OK, sec.INFO):
        return _("OK"), "PillOn.TLabel"
    if status in (sec.BAD, sec.HIGH):
        return _("Risk"), "PillBad.TLabel"
    if status in (sec.WARN, sec.MEDIUM, sec.LOW):
        return _("Warning"), "PillOff.TLabel"
    return _("Unknown"), "Pill.TLabel"


class SecurityMixin:
    def _security_view(self):
        self.handlers.update({"sec_health": self._show_health_checks, "sec_persist": self._show_persist,
                              "sec_hosts": self._show_hosts, "sec_browser": self._show_browser,
                              "sec_remote": self._show_remote, "sec_sigs": self._show_sigs,
                              "sec_fixed": self._after_fix, "sec_sig_progress": self._sig_progress})
        view = self._view("security", _("Security check"),
                          _("Checks Windows' protection, the places viruses hide, and whether anyone can control "
                            "your PC remotely. Nothing changes unless you press a button."))
        self._segments(view, [("health", _("Protection"), self._sec_health_page),
                              ("hide", _("Hiding places"), self._sec_hide_page),
                              ("hosts", _("Hosts file"), self._sec_hosts_page),
                              ("browser", _("Browsers"), self._sec_browser_page),
                              ("remote", _("Remote access"), self._sec_remote_page),
                              ("sigs", _("Program signatures"), self._sec_sigs_page)])

    # ------------------------------------------------------------------ helpers

    def _top_row(self, card, text, command, status_text):
        row = self._row(card, pady=(0, self.theme.px(10)))
        self._button(row, text, command, style="Primary.TButton", gap=12)
        label = ttk.Label(row, text=status_text, style="CardSub.TLabel")
        label.pack(side=self.L)
        return label

    def _render_rows(self, box, rows):
        """rows: [(level, title, detail, fix_key, fix_command)] drawn as a list with a pill, text and a button."""
        px = self.theme.px
        for child in box.winfo_children():
            child.destroy()
        for level, title, detail, fix_key, fix in rows:
            row = ttk.Frame(box, style="Plain.TFrame")
            row.pack(fill="x", pady=(0, px(10)))
            text, style = status_pill(level)
            ttk.Label(row, text=text, style=style, width=9, anchor="center").pack(side=self.L, anchor="n",
                                                                                   padx=self.pad(0, px(12)))
            if fix_key and fix:
                self._button(row, fix[0], lambda k=fix_key, f=fix: self._run_fix(k, f), style="Primary.TButton",
                             side=self.R, gap=0)
            body = ttk.Frame(row, style="Plain.TFrame")
            body.pack(side=self.L, fill="x", expand=True)
            ttk.Label(body, text=title, style="H3.TLabel").pack(anchor=self.W)
            self._text(body, detail, style="CardSub.TLabel", wrap=640)

    def _scroll_box(self, parent):
        box = ttk.Frame(parent, style="Plain.TFrame")
        box.pack(fill="x")
        return box

    def _run_fix(self, key, fix):
        """fix = (button text, function(key) -> message, needs administrator?, question)."""
        _label, function, needs_admin, question = fix
        if needs_admin and not self.admin_gate(_("Changing this needs administrator rights.")):
            return
        if question and not self.ask(question):
            return
        if self._busy():
            return

        def work():
            try:
                self.events.put(("sec_fixed", function(key), None))
            except Exception as exc:
                self.events.put(("sec_fixed", None, str(exc)))

        self._start_worker(work)

    def _after_fix(self, message, error):
        if error:
            self.error(error)
        else:
            self.info(message or _("Done."))

    # ------------------------------------------------------------------ protection

    def _sec_health_page(self, parent):
        card = self._card(parent)
        self.sec_health_status = self._top_row(card, _("Check my security"), self.load_health_checks,
                                               _("Firewall, virus protection, updates, UAC and drive encryption."))
        self.sec_health_box = self._scroll_box(card)
        return card

    def load_health_checks(self):
        if self._busy():
            return
        self.sec_health_status.config(text=_("Asking Windows..."))

        def work():
            try:
                self.events.put(("sec_health", sec.read_health(), None))
            except Exception as exc:
                self.events.put(("sec_health", [], str(exc)))

        self._start_worker(work)

    def _show_health_checks(self, checks, error):
        if error:
            self.sec_health_status.config(text=_("Could not check."))
            self.warn(error)
            return
        fixes = {"firewall": _("Turn on"), "realtime": _("Turn on"), "uac": _("Turn on"), "signatures": _("Update now"),
                 "updates": _("Open Windows Update"), "bitlocker": _("Open BitLocker")}
        admin = {"firewall": True, "realtime": True, "uac": True, "signatures": True, "updates": False,
                 "bitlocker": False}
        rows = []
        for c in checks:
            fix = (fixes[c.fix], sec.fix_health, admin[c.fix], None) if c.fix else None
            rows.append((c.status, c.title, c.detail, c.fix, fix))
        self._render_rows(self.sec_health_box, rows)
        bad = sum(1 for c in checks if c.status == sec.BAD)
        warn = sum(1 for c in checks if c.status == sec.WARN)
        self.sec_health_status.config(text=_("Problems: {bad}  ·  warnings: {warn}").format(bad=bad, warn=warn)
                                      if bad or warn else _("Everything looks fine."))

    # ------------------------------------------------------------------ hiding places

    def _sec_hide_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        self.persist_status = self._top_row(
            card, _("Look for hiding places"), self.load_persistence,
            _("Startup entries, scheduled tasks, services and WMI triggers, riskiest first."))
        frame, self.persist_tree = make_tree(card, [("risk", _("Risk"), 70), ("name", _("Name"), 190),
                                                    ("type", _("Type"), 120), ("state", _("State"), 60),
                                                    ("why", _("Why"), 360), ("command", _("What it runs"), 420)])
        bar = self._row(card, pady=(px(10), 0))
        self._button(bar, _("Switch off"), lambda: self.switch_persist(False), style="Primary.TButton")
        self._button(bar, _("Switch on"), lambda: self.switch_persist(True))
        self._button(bar, _("Open location"), self.open_persist)
        bar.pack_configure(side="bottom")
        frame.pack(fill="both", expand=True)
        return card

    def load_persistence(self):
        if self._busy():
            return
        self.persist_status.config(text=_("Looking (this takes a minute)..."))

        def work():
            try:
                items, errors = sec.collect_persistence()
                self.events.put(("sec_persist", items, errors))
            except Exception as exc:
                self.events.put(("sec_persist", [], [str(exc)]))

        self._start_worker(work)

    def _show_persist(self, items, errors):
        tree = self.persist_tree
        clear_tree(tree)
        for item in items:
            iid = tree.insert("", "end", values=(level_label(item.level), item.name, item.kind_label,
                                                 _("On") if item.enabled else _("Off"), item.reason, item.command))
            tree.items[iid] = item
        risky = sum(1 for i in items if i.level in (sec.HIGH, sec.MEDIUM))
        self.persist_status.config(text=_("Items that start by themselves: {count}  ·  worth a look: {risky}").format(
            count=len(items), risky=risky))
        if errors:
            self.warn("\n".join(errors))

    def switch_persist(self, enabled):
        chosen = self._selected_items(self.persist_tree)
        if not chosen:
            self.info(_("Select an item first."))
            return
        item = chosen[0]
        if item.kind not in ("run", "task", "service"):
            self.info(_("This kind of item cannot be switched off here. Open its location instead."))
            return
        if not self.admin_gate(_("Changing items that start for every user, and services, needs administrator "
                                 "rights.")):
            return
        if not enabled and not self.ask(_("Switch off '{name}'? Nothing is deleted: you can switch it on again here.").format(
                name=item.name), danger=True):
            return
        try:
            sec.set_persist_enabled(item, enabled)
        except (ValueError, RuntimeError) as exc:
            self.error(str(exc))
            return
        self.load_persistence()

    def open_persist(self):
        chosen = self._selected_items(self.persist_tree)
        if not chosen or not chosen[0].exe or not os.path.exists(chosen[0].exe):
            self.info(_("The program file for this item was not found."))
            return
        open_location(chosen[0].exe)

    # ------------------------------------------------------------------ hosts file

    def _sec_hosts_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        self.hosts_status = self._top_row(card, _("Check the hosts file"), self.load_hosts,
                                          _("A file malware edits to send you to fake websites."))
        frame, self.hosts_tree = make_tree(card, [("line", _("Line"), 50), ("address", _("Address"), 130),
                                                  ("names", _("Website names"), 250), ("risk", _("Risk"), 70),
                                                  ("why", _("Why"), 420)])
        bar = self._row(card, pady=(px(10), 0))
        self._button(bar, _("Remove selected lines"), self.remove_hosts_selected, style="Primary.TButton")
        self._button(bar, _("Reset to Windows default"), self.reset_hosts, style="Danger.TButton")
        self._button(bar, _("Open hosts file"), self.open_hosts)
        bar.pack_configure(side="bottom")
        frame.pack(fill="both", expand=True)
        return card

    def load_hosts(self):
        if self._busy():
            return
        try:
            self._hosts_text = sec.read_hosts()
        except RuntimeError as exc:
            self.error(str(exc))
            return
        self._show_hosts(sec.parse_hosts(self._hosts_text))

    def _show_hosts(self, entries):
        tree = self.hosts_tree
        clear_tree(tree)
        for e in entries:
            iid = tree.insert("", "end", values=(e.line_no, e.address, " ".join(e.names), level_label(e.level), e.reason))
            tree.items[iid] = e
        bad = sum(1 for e in entries if e.level in (sec.HIGH, sec.MEDIUM))
        self.hosts_status.config(text=_("Lines in the hosts file: {count}  ·  suspicious: {bad}").format(
            count=len(entries), bad=bad) if entries else _("The hosts file is clean: it has no extra entries."))

    def _change_hosts(self, new_text):
        if not self.admin_gate(_("Changing the hosts file needs administrator rights.")):
            return
        try:
            backup = sec.write_hosts(new_text)
        except RuntimeError as exc:
            self.error(str(exc))
            return
        self.info(_("Done. A copy of the old file was saved as:") + "\n" + backup)
        self.load_hosts()

    def remove_hosts_selected(self):
        chosen = self._selected_items(self.hosts_tree)
        if not chosen:
            self.info(_("Select the lines to remove first."))
            return
        if not self.ask(_("Remove {count} line(s) from the hosts file? A copy of the old file is saved first.").format(
                count=len(chosen)), danger=True):
            return
        self._change_hosts(sec.remove_hosts_lines(self._hosts_text, [e.line_no for e in chosen]))

    def reset_hosts(self):
        if not self.ask(_("Replace the hosts file with the Windows default? Every custom entry is removed. A copy of "
                          "the old file is saved first."), danger=True):
            return
        self._change_hosts(sec.DEFAULT_HOSTS)

    def open_hosts(self):
        try:
            subprocess.Popen(["notepad", sec.HOSTS_PATH])
        except OSError as exc:
            self.error(str(exc))

    # ------------------------------------------------------------------ browsers

    def _sec_browser_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        self.browser_status = self._top_row(card, _("Check browsers"), self.load_browsers,
                                            _("Chrome, Edge and Brave: extensions, start pages and proxy."))
        frame, self.browser_tree = make_tree(card, [("browser", _("Browser"), 90), ("type", _("Type"), 90),
                                                    ("name", _("Name"), 230), ("risk", _("Risk"), 70),
                                                    ("why", _("Why"), 450)])
        bar = self._row(card, pady=(px(10), 0))
        self._button(bar, _("Open extensions page"), self.open_extensions, style="Primary.TButton")
        self._button(bar, _("Open proxy settings"), lambda: os.startfile("ms-settings:network-proxy"))
        bar.pack_configure(side="bottom")
        frame.pack(fill="both", expand=True)
        return card

    def load_browsers(self):
        if self._busy():
            return
        self.browser_status.config(text=_("Looking..."))

        def work():
            try:
                self.events.put(("sec_browser", sec.check_browsers(), None))
            except Exception as exc:
                self.events.put(("sec_browser", [], str(exc)))

        self._start_worker(work)

    def _show_browser(self, findings, error):
        tree = self.browser_tree
        clear_tree(tree)
        if error:
            self.browser_status.config(text=_("Could not check."))
            self.warn(error)
            return
        for f in findings:
            kind = _("Extension") if f.kind == "extension" else _("Setting")
            iid = tree.insert("", "end", values=(f.browser, kind, f.name, level_label(f.level), f.reason))
            tree.items[iid] = f
        worth = sum(1 for f in findings if f.level in (sec.HIGH, sec.MEDIUM))
        self.browser_status.config(text=_("Items found: {count}  ·  worth a look: {worth}").format(
            count=len(findings), worth=worth) if findings else _("No browsers or extensions found."))

    def open_extensions(self):
        chosen = self._selected_items(self.browser_tree)
        browser = chosen[0].browser if chosen else "Chrome"
        commands = {"Chrome": ("chrome", "chrome://extensions"), "Edge": ("msedge", "edge://extensions"),
                    "Brave": ("brave", "brave://extensions")}
        program, url = commands.get(browser, commands["Chrome"])
        try:
            subprocess.Popen(["cmd", "/c", "start", "", program, url])
        except OSError as exc:
            self.error(str(exc))

    # ------------------------------------------------------------------ remote access

    def _sec_remote_page(self, parent):
        card = self._card(parent)
        self.remote_status = self._top_row(card, _("Check remote access"), self.load_remote,
                                           _("Whether anyone can control this PC from far away."))
        self.remote_box = self._scroll_box(card)
        return card

    def load_remote(self):
        if self._busy():
            return
        self.remote_status.config(text=_("Looking..."))

        def work():
            try:
                self.events.put(("sec_remote", sec.check_remote_access(), None))
            except Exception as exc:
                self.events.put(("sec_remote", [], str(exc)))

        self._start_worker(work)

    def _show_remote(self, findings, error):
        if error:
            self.remote_status.config(text=_("Could not check."))
            self.warn(error)
            return
        rows = []
        for f in findings:
            fix = (_("Turn off"), sec.fix_remote, True, _("Turn this off?")) if f.fix else None
            rows.append((f.level, f.title, f.detail, f.fix, fix))
        self._render_rows(self.remote_box, rows)
        risky = sum(1 for f in findings if f.level in (sec.HIGH, sec.MEDIUM))
        self.remote_status.config(text=_("Worth a look: {count}").format(count=risky) if risky
                                  else _("No remote access is open."))

    # ------------------------------------------------------------------ program signatures

    def _sec_sigs_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        self._text(card, _("Windows checks who made each program and whether it was changed after they signed it. "
                           "Unsigned programs in Downloads or Temp are worth a second look."), pady=(0, px(8)))
        row = self._row(card, pady=(0, px(8)))
        ttk.Label(row, text=_("Folders:"), style="Card.TLabel").pack(side=self.L)
        self.sig_folders = tk.StringVar(value=";".join(sec.default_scan_folders()))
        ttk.Entry(row, textvariable=self.sig_folders, width=60).pack(side=self.L, padx=px(8))
        self._button(row, _("Browse..."), self._add_sig_folder, gap=8)
        row2 = self._row(card, pady=(0, px(8)))
        self._button(row2, _("Check signatures"), self.load_signatures, style="Primary.TButton", gap=12)
        self.sig_status = ttk.Label(row2, text=_("Looks at program files a few folders deep."), style="CardSub.TLabel")
        self.sig_status.pack(side=self.L)
        frame, self.sig_tree = make_tree(card, [("risk", _("Risk"), 70), ("name", _("File"), 200),
                                                ("status", _("Signature"), 110), ("publisher", _("Publisher"), 180),
                                                ("why", _("Why"), 300), ("folder", _("Folder"), 300)])
        bar = self._action_bar(card, self.sig_tree, short=True)
        bar.pack(fill="x", side="bottom", pady=(px(10), 0))
        frame.pack(fill="both", expand=True)
        return card

    def _add_sig_folder(self):
        from tkinter import filedialog
        folder = filedialog.askdirectory(title=_("Choose a folder"))
        if folder:
            current = [f for f in self.sig_folders.get().split(";") if f]
            current.append(os.path.normpath(folder))
            self.sig_folders.set(";".join(current))

    def load_signatures(self):
        if self._busy():
            return
        folders = [f.strip() for f in self.sig_folders.get().split(";") if f.strip() and os.path.isdir(f.strip())]
        if not folders:
            self.info(_("Choose at least one folder that exists."))
            return
        clear_tree(self.sig_tree)
        self.sig_status.config(text=_("Looking for programs..."))

        def work():
            try:
                paths = sec.find_program_files(folders)
                self.events.put(("sec_sig_progress", 0, len(paths)))
                result = {}
                for start in range(0, len(paths), 120):
                    result.update(sec.check_signatures(paths[start:start + 120]))
                    self.events.put(("sec_sig_progress", min(start + 120, len(paths)), len(paths)))
                self.events.put(("sec_sigs", paths, result, None))
            except Exception as exc:
                self.events.put(("sec_sigs", [], {}, str(exc)))

        self._start_worker(work)

    def _sig_progress(self, done, total):
        self.sig_status.config(text=_("Checked {done} of {total} files...").format(done=done, total=total))

    def _show_sigs(self, paths, signatures, error):
        tree = self.sig_tree
        clear_tree(tree)
        if error:
            self.sig_status.config(text=_("Could not check."))
            self.warn(error)
            return
        rows = []
        for path in paths:
            status, publisher = signatures.get(path, ("", ""))
            level, reason = sec.judge_signature(status, path)
            rows.append((level, path, status, publisher, reason))
        order = {sec.HIGH: 0, sec.MEDIUM: 1, sec.LOW: 2, sec.INFO: 3}
        rows.sort(key=lambda r: order[r[0]])
        for level, path, status, publisher, reason in rows:
            iid = tree.insert("", "end", values=(level_label(level), os.path.basename(path), status or "?", publisher,
                                                 reason, os.path.dirname(path)))
            tree.paths[iid] = path
            try:
                tree.sizes[iid] = os.path.getsize(path)
            except OSError:
                pass
        worth = sum(1 for r in rows if r[0] in (sec.HIGH, sec.MEDIUM))
        self.sig_status.config(text=_("Files checked: {count}  ·  worth a look: {worth}").format(count=len(rows),
                                                                                                  worth=worth))
