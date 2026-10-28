"""NoorCleaner: shows what is taking up space on your computer, clears junk,
finds duplicate files and similar photos, manages programs, checks disk health,
finds corrupted files and viruses, recovers deleted files - and removes only
the files you choose. In English, Arabic and Afaan Oromo.

Run with:  python noor_cleaner.py            (python noor_cleaner.py --remind runs the junk reminder)
"""

import csv
import os
import queue
import sys
import threading
import time
import tkinter as tk
from tkinter import filedialog, ttk

import cleaner_core as storage
import i18n
import logo_data
import photos_core as photos
import scan_fx
import scanner_core as core
import settings
import theme
from i18n import _
from ui_base import (APP_NAME, VERSION, BaseApp, clear_tree, human_size, is_admin, make_tree, open_location,
                     share_text)
from ui_health import HealthMixin
from ui_programs import ProgramsMixin
from ui_recover import RecoverMixin
from ui_settings import SettingsMixin, choose_language_first_run

MAX_LISTED_FILES = 5000  # rows shown at once in "All files"; search narrows it down


class NoorCleanerApp(BaseApp, RecoverMixin, ProgramsMixin, HealthMixin, SettingsMixin):
    def __init__(self, root, config):
        self.root = root
        self.config = config
        self._setup_direction()
        root.title(f"{APP_NAME} {VERSION}")
        self.theme = theme.get_style(root)
        px = self.theme.px
        root.geometry(f"{px(1240)}x{px(820)}")
        root.minsize(px(1060), px(660))
        root.protocol("WM_DELETE_WINDOW", self.on_close)

        self.scanner = None
        self.scan_thread = None
        self.worker = None            # background job other than the scan
        self.events = queue.Queue()
        self.handlers = {}            # event kind -> method, filled in as pages are built
        self.all_files = []           # FileEntry for every file seen (appended by the scan thread)
        self.findings = {}            # path -> Finding
        self.report = None            # StorageReport from the last scan
        self.extra_folders = []
        self.defender = core.find_defender()
        self.signatures = core.load_signatures(core.default_signature_files())
        self.junk = storage.junk_categories()
        self.junk_sizes = {}
        self.views, self.nav_buttons = {}, {}
        self.group_trees = []         # trees that show sets (duplicates, similar photos)
        self.sound = scan_fx.ScanSound(bool(config.get("scan_sound", True)))
        self.fx_index = 0             # how many of all_files the scan screen has shown
        self.fx_running = False

        self._build_ui()
        self.refresh_drives()
        self.refresh_quarantine()
        self.show_view("scan")
        self.root.after(150, self.poll)

    # ------------------------------------------------------------------ shell

    def _build_ui(self):
        px = self.theme.px
        shell = ttk.Frame(self.root)
        shell.pack(fill="both", expand=True)

        sidebar = ttk.Frame(shell, style="Sidebar.TFrame", width=px(236), padding=(px(14), px(20), px(14), px(14)))
        sidebar.pack(side=self.L, fill="y")
        sidebar.pack_propagate(False)
        brand = ttk.Frame(sidebar, style="Sidebar.TFrame", padding=(px(8), 0, px(8), px(18)))
        brand.pack(fill="x")
        logo_size = min(logo_data.LOGO_PNG, key=lambda h: abs(h - 26 * self.theme.scale))
        self.logo = tk.PhotoImage(master=self.root, data=logo_data.LOGO_PNG[logo_size])
        ttk.Label(brand, image=self.logo, style="Brand.TLabel").pack(side=self.L)
        ttk.Label(brand, text=APP_NAME, style="Brand.TLabel").pack(side=self.L, padx=self.pad(px(10)))

        self.theme.set_direction(self.rtl)
        pages = (("scan", _("Scan")), ("space", _("What's using space")), ("junk", _("Junk files")),
                 ("dups", _("Duplicates")), ("programs", _("Programs")), ("threats", _("Viruses & threats")),
                 ("corrupt", _("Corrupted files")), ("health", _("Disk health")), ("files", _("All files")),
                 ("recover", _("Recover deleted files")), ("quarantine", _("Quarantine")), ("settings", _("Settings")))
        self.nav_titles = dict(pages)
        for key, text in pages:
            button = ttk.Button(sidebar, text=text, style="Nav.TButton", takefocus=False,
                                command=lambda k=key: self.show_view(k))
            button.pack(fill="x", pady=(0, px(1)))
            self.nav_buttons[key] = button

        bottom = ttk.Frame(sidebar, style="Sidebar.TFrame")
        bottom.pack(side="bottom", fill="x")
        self.side_status = ttk.Label(bottom, text="", style="SideNote.TLabel", wraplength=px(196), justify=self.JUSTIFY)
        self.side_status.pack(fill="x", padx=px(10), pady=(0, px(8)))
        tk.Frame(bottom, bg="#26332d", height=1).pack(fill="x")
        state = ttk.Frame(bottom, style="Sidebar.TFrame", padding=(px(10), px(12), px(10), px(4)))
        state.pack(fill="x")
        admin = is_admin()
        dot = tk.Canvas(state, width=px(8), height=px(8), bg=theme.GREEN_DEEP, highlightthickness=0)
        dot.create_oval(0, 0, px(8), px(8), fill=theme.GOOD if admin else theme.WARN, outline="")
        dot.pack(side=self.L, padx=self.pad(0, px(8)))
        ttk.Label(state, text=_("Administrator") if admin else _("Standard user"),
                  style="SideNote.TLabel").pack(side=self.L)
        if core.IS_WINDOWS and not admin:
            link = ttk.Label(state, text=_("Run as admin"), style="Link.TLabel", cursor="hand2")
            link.pack(side=self.L, padx=self.pad(px(8)))
            link.bind("<Button-1>", lambda e: self.restart_app(as_admin=True))

        self.content = ttk.Frame(shell)
        self.content.pack(side=self.L, fill="both", expand=True)
        self.content.rowconfigure(0, weight=1)
        self.content.columnconfigure(0, weight=1)

        self.handlers.update({"finding": self._add_finding, "status": self._set_status, "done": self._scan_done,
                              "junk_size": self._show_junk_size, "junk_done": self._junk_done,
                              "dup_progress": self._dup_progress, "dup_done": self._show_duplicates,
                              "downloads_done": self._show_old_downloads, "photo_progress": self._photo_progress,
                              "photos_done": self._show_similar_photos, "worker_error": self._worker_error})
        self._scan_view()
        self._space_view()
        self._junk_view()
        self._duplicates_view()
        self._programs_view()
        finding_cols = [("name", _("File"), 220), ("problem", _("Problem"), 380), ("source", _("Found by"), 120),
                        ("size", _("Size"), 80), ("folder", _("Folder"), 330)]
        self.threat_tree = self._findings_view(
            "threats", _("Viruses & threats"),
            _("Viruses and suspicious files from your last scan. Microsoft Defender does the real virus detection."),
            finding_cols, show_repair=False)
        self.corrupt_tree = self._findings_view(
            "corrupt", _("Corrupted files"),
            _("Files that are damaged, cut off or unreadable. Broken Windows files should be repaired, not deleted."),
            finding_cols, show_repair=True)
        self._health_view()
        self._all_files_view()
        self._recover_view()
        self._quarantine_view()
        self._settings_view()

    def _worker_error(self, message):
        self.warn(_("Something went wrong:") + "\n\n" + message)

    # ------------------------------------------------------------------ scan page

    def _scan_view(self):
        px = self.theme.px
        view = self._view("scan", _("Scan your PC"), _("See what is filling your storage and find corrupted files "
                                                      "and viruses. Nothing is removed unless you choose it."))
        row = ttk.Frame(view)
        row.pack(fill="x", **self._gap())
        row.columnconfigure(self.col(0, 2), weight=16, uniform="status")
        row.columnconfigure(self.col(1, 2), weight=10, uniform="status")

        status = self._card(row)
        status.grid(row=0, column=self.col(0, 2), sticky="nsew", padx=self.pad(0, px(14)))
        self.status_pill = ttk.Label(status, text=_("Ready"), style="Pill.TLabel")
        self.status_pill.pack(anchor=self.W)
        self.status_detail = self._text(status, self._idle_text(), wrap=520, pady=(px(10), px(8)))
        self.progress = ttk.Progressbar(status, mode="indeterminate", style="Green.Horizontal.TProgressbar")
        self.progress.pack(fill="x", pady=(0, px(12)))
        buttons = self._row(status)
        self.start_btn = self._button(buttons, _("Start scan"), self.start_scan, style="Primary.TButton", gap=8)
        self.stop_btn = self._button(buttons, _("Stop"), self.stop_scan, state="disabled")

        metrics = self._card(row)
        metrics.grid(row=0, column=self.col(1, 2), sticky="new")
        self.metric_values = {}
        names = (("files", _("Files checked")), ("space", _("Space used")), ("threats", _("Threats")),
                 ("corrupt", _("Corrupted")))
        for i, (key, label) in enumerate(names):  # a 2 x 2 grid, so long numbers and words always fit
            row, column = 2 * (i // 2), self.col(i % 2, 2)
            metrics.columnconfigure(column, weight=1, uniform="metric")
            value = ttk.Label(metrics, text="0", style="Metric.TLabel")
            value.grid(row=row, column=column, pady=(px(4) if row else 0, 0))
            ttk.Label(metrics, text=label, style="MetricLabel.TLabel", wraplength=px(130), justify="center").grid(
                row=row + 1, column=column, sticky="n", pady=(0, px(4)))
            self.metric_values[key] = value

        self.screen = scan_fx.ScanScreen(view, px, height=6)
        self.screen.pack(fill="x", **self._gap())
        self.screen.idle(VERSION)

        where = self._card(view, _("What to scan"), fill="x", **self._gap())
        self.drive_vars = {}
        drives = self._row(where)
        for drive in core.list_drives():
            var = tk.BooleanVar(value=not core.drive_is_optional(drive))
            self.drive_vars[drive] = var
            ttk.Checkbutton(drives, text=core.drive_label(drive), variable=var, style="Card.TCheckbutton").pack(
                side=self.L, padx=self.pad(0, px(18)))
        folders = self._row(where, pady=(px(10), 0))
        self._button(folders, _("Add a folder..."), self.add_folder, gap=8)
        self._button(folders, _("Clear folders"), self.clear_folders)
        self.folders_label = ttk.Label(folders, text="", style="Hint.TLabel")
        self.folders_label.pack(side=self.L, padx=px(6))

        checks = self._card(view, _("Also check for"), fill="x", **self._gap())
        self.opt_corrupt = tk.BooleanVar(value=True)
        self.opt_threats = tk.BooleanVar(value=True)
        self.opt_defender = tk.BooleanVar(value=False)
        self.opt_deep = tk.BooleanVar(value=False)
        grid = self._row(checks)
        defender_text = (_("Full Microsoft Defender virus scan (slow)") if self.defender
                         else _("Microsoft Defender (not found on this computer)"))
        options = ((self.opt_corrupt, _("Corrupted files"), "normal"),
                   (self.opt_threats, _("Viruses & suspicious files"), "normal"),
                   (self.opt_defender, defender_text, "normal" if self.defender else "disabled"),
                   (self.opt_deep, _("Deep scan - reads every byte (much slower)"), "normal"))
        for i, (var, text, state) in enumerate(options):
            ttk.Checkbutton(grid, text=text, variable=var, state=state, style="Card.TCheckbutton").grid(
                row=i // 2, column=self.col(i % 2, 2), sticky=self.W, padx=self.pad(0, px(40)), pady=px(2))

        note = self._card(view, _("How NoorCleaner works, honestly"), style="Note.TFrame", fill="x")
        self._bullets(note, (_("Nothing is deleted unless you select it and confirm. Quarantined files can be restored."),
                             _("Microsoft Defender does the real virus detection. NoorCleaner's own checks catch known "
                               "malware, disguised programs and USB worms, but they are not a full antivirus."),
                             _("Files sent to the Recycle Bin still use space until you empty it (Junk files).")))

    def _idle_text(self):
        text = _("Tick the drives to scan and press Start scan.")
        if not is_admin():
            text += " " + _("Run as administrator to include protected folders.")
        return text

    def _action_bar(self, parent, tree, show_repair=False, export=None, extra=(), select_all=True,
                    quarantine=True, short=False):
        px = self.theme.px
        bar = ttk.Frame(parent, style="Plain.TFrame")
        if select_all:
            self._button(bar, _("Select all"), lambda: tree.selection_set(list(tree.paths)))
        for text, command in extra:
            self._button(bar, text, command)
        self._button(bar, _("Open location"), lambda: self.open_selected(tree), gap=14 if quarantine else 6)
        if quarantine:
            self._button(bar, _("Quarantine"), lambda: self.remove_selected(tree, "quarantine"))
        self._button(bar, _("Recycle Bin"), lambda: self.remove_selected(tree, "recycle"))
        self._button(bar, _("Delete") if short else _("Delete permanently"),
                     lambda: self.remove_selected(tree, "delete"), style="Danger.TButton")
        if export:
            self._button(bar, _("Export..."), export, side=self.R, gap=0)
        if show_repair:
            self._button(bar, _("Repair Windows files"), self.repair_windows, style="Primary.TButton", side=self.R)
        return bar

    # ------------------------------------------------------------------ space page

    def _space_view(self):
        px = self.theme.px
        view = self._view("space", _("What's using space"),
                          _("The biggest folders, file types and files from your last scan."))
        self.drives_box = self._card(view, fill="x", **self._gap())

        panes = ttk.PanedWindow(view, orient="horizontal")
        panes.pack(fill="both", expand=True)
        left = self._card(panes, _("Biggest folders"))
        frame, self.folder_tree = make_tree(left, [("size", _("Size"), 80), ("share", _("Share"), 55),
                                                   ("files", _("Files"), 65)],
                                            tree_title=_("Folder (open to look inside)"), tree_width=170, sortable=False)
        self.folder_tree.folders = {}  # iid -> folder path
        self.folder_tree.bind("<<TreeviewOpen>>", self._open_folder_node)
        self.folder_tree.bind("<Double-1>", lambda e: self.open_selected_folder())
        bar = ttk.Frame(left, style="Plain.TFrame")
        bar.pack(fill="x", side="bottom", pady=(px(10), 0))
        self._button(bar, _("Open folder"), self.open_selected_folder)
        self._button(bar, _("Show its files"), self.show_folder_files)
        frame.pack(fill="both", expand=True)

        right = ttk.PanedWindow(panes, orient="vertical")
        types_box = self._card(right, _("By type"))
        frame, self.type_tree = make_tree(types_box, [("type", _("Type"), 170), ("size", _("Size"), 85),
                                                      ("share", _("Share"), 60), ("files", _("Files"), 70)], height=5)
        frame.pack(fill="both", expand=True)
        right.add(types_box, weight=2)
        big_box = self._card(right, _("Biggest files"))
        frame, self.big_tree = make_tree(big_box, [("name", _("File"), 200), ("size", _("Size"), 85),
                                                   ("type", _("Type"), 120), ("folder", _("Folder"), 260)])
        self.big_tree.bind("<Double-1>", lambda e: self.open_selected(self.big_tree))
        self._action_bar(big_box, self.big_tree, select_all=False, quarantine=False, short=True).pack(fill="x", side="bottom", pady=(px(10), 0))
        frame.pack(fill="both", expand=True)
        right.add(big_box, weight=3)
        for pane in ((right, left) if self.rtl else (left, right)):
            panes.add(pane, weight=1)

        def split_evenly(event, done=[]):  # otherwise the wider right side squeezes the folder list
            if not done and event.width > 200:
                done.append(True)
                panes.sashpos(0, int(event.width * (0.55 if self.rtl else 0.45)))
        panes.bind("<Configure>", split_evenly, add="+")

    def refresh_drives(self):
        for child in self.drives_box.winfo_children():
            child.destroy()
        px = self.theme.px
        ttk.Label(self.drives_box, text=_("Your drives"), style="H3.TLabel").grid(
            row=0, column=0, columnspan=3, sticky=self.W, pady=(0, px(6)))
        row = 1
        for drive in core.list_drives():
            usage = storage.drive_usage(drive)
            if not usage:
                continue
            total, used, free = usage
            low = bool(total) and free / total < 0.1
            text = _("{used} used of {total}  ·  {free} free").format(
                used=human_size(used), total=human_size(total), free=human_size(free))
            if low:
                text += "  -  " + _("almost full!")
            ttk.Label(self.drives_box, text=drive, style="H3.TLabel", width=6).grid(
                row=row, column=self.col(0, 3), sticky=self.W)
            ttk.Progressbar(self.drives_box, length=px(360), maximum=total or 1, value=used,
                            style=("Low" if low else "Green") + ".Horizontal.TProgressbar").grid(
                row=row, column=self.col(1, 3), sticky=self.W, padx=px(12), pady=px(3))
            ttk.Label(self.drives_box, text=text, style="CardSub.TLabel").grid(
                row=row, column=self.col(2, 3), sticky=self.W)
            row += 1

    def show_storage(self):
        report = self.report
        tree = self.folder_tree
        clear_tree(tree)
        tree.folders = {}
        clear_tree(self.type_tree)
        clear_tree(self.big_tree)
        if not report or not report.total_files:
            return
        for root in self.scanner.roots:
            if root in report.totals:
                iid = self._insert_folder("", root, report.total_bytes or 1, label=root)
                tree.item(iid, open=True)
                self._fill_folder(iid)
        for kind, (size, files) in sorted(report.by_type.items(), key=lambda kv: kv[1][0], reverse=True):
            iid = self.type_tree.insert("", "end", values=(storage.file_type_label(kind), human_size(size),
                                                           share_text(size, report.total_bytes), f"{files:,}"))
            self.type_tree.sizes[iid] = size
        for e in report.biggest:
            iid = self.big_tree.insert("", "end", values=(os.path.basename(e.path), human_size(e.size),
                                                          storage.file_type_label(storage.file_type(e.path)),
                                                          os.path.dirname(e.path)))
            self.big_tree.paths[iid] = e.path
            self.big_tree.sizes[iid] = e.size

    def _insert_folder(self, parent_iid, folder, parent_size, label=None):
        size, files = self.report.totals[folder]
        iid = self.folder_tree.insert(parent_iid, "end", text=label or os.path.basename(folder) or folder,
                                      values=(human_size(size), share_text(size, parent_size), f"{files:,}"))
        self.folder_tree.folders[iid] = folder
        if folder in self.report.children:
            self.folder_tree.insert(iid, "end", text="...")  # placeholder so it gets an arrow
        return iid

    def _fill_folder(self, iid):
        tree = self.folder_tree
        tree.delete(*tree.get_children(iid))
        folder = tree.folders[iid]
        size = self.report.totals[folder][0] or 1
        for sub in self.report.children.get(folder, [])[:500]:
            self._insert_folder(iid, sub, size)
        here = self.report.direct.get(folder)
        if here:
            tree.insert(iid, "end", text=_("(files directly in this folder)"),
                        values=(human_size(here[0]), share_text(here[0], size), f"{here[1]:,}"))

    def _open_folder_node(self, _event):
        iid = self.folder_tree.focus()
        children = self.folder_tree.get_children(iid)
        if iid in self.folder_tree.folders and len(children) == 1 and self.folder_tree.item(children[0], "text") == "...":
            self._fill_folder(iid)

    def _selected_folder(self):
        tree = self.folder_tree
        for iid in tree.selection():
            if iid in tree.folders:
                return tree.folders[iid]
            parent = tree.parent(iid)  # "(files directly in this folder)" row
            if parent in tree.folders:
                return tree.folders[parent]
        self.info(_("Select a folder first."))
        return None

    def open_selected_folder(self):
        folder = self._selected_folder()
        if folder:
            open_location(folder, select=False)

    def show_folder_files(self):
        folder = self._selected_folder()
        if folder:
            self.search_var.set(folder.rstrip("\\/") + os.sep)
            self.largest_var.set(True)
            self.refresh_all_files()
            self.show_view("files")

    # ------------------------------------------------------------------ scanning

    def add_folder(self):
        folder = filedialog.askdirectory(title=_("Choose a folder to scan"))
        if folder and os.path.normpath(folder) not in self.extra_folders:
            self.extra_folders.append(os.path.normpath(folder))
            self.folders_label.config(text=_("Also: {folders}").format(folders=";  ".join(self.extra_folders)))

    def clear_folders(self):
        self.extra_folders = []
        self.folders_label.config(text="")

    def start_scan(self):
        if self._busy():
            return
        roots = [d for d, var in self.drive_vars.items() if var.get()]
        roots += [f for f in self.extra_folders
                  if not any(os.path.normcase(f).startswith(os.path.normcase(r)) for r in roots)]
        if not roots:
            self.info(_("Tick at least one drive or add a folder to scan."))
            return

        self.all_files = []
        self.findings = {}
        self.report = None
        for tree in (self.threat_tree, self.corrupt_tree, self.files_tree, self.dup_tree, self.photo_tree,
                     self.folder_tree, self.type_tree, self.big_tree):
            clear_tree(tree)
        self.dup_status.config(text=_("Run a scan first, then press Find duplicates."))
        self._update_nav_counts()
        self.all_label.config(text=_("Scanning... the list fills in when the scan finishes (or press Search)."))
        for value in self.metric_values.values():
            value.config(text="0")
        self.status_pill.config(text=_("Scanning..."), style="Pill.TLabel")
        self.status_detail.config(text=_("Starting..."))

        self.scanner = core.Scanner(
            roots,
            check_corrupted=self.opt_corrupt.get(),
            check_threats=self.opt_threats.get(),
            use_defender=self.opt_defender.get() and bool(self.defender),
            deep=self.opt_deep.get(),
            signatures=self.signatures,
            on_file=self.all_files.append,
            on_finding=lambda f: self.events.put(("finding", f)),
            on_status=lambda s: self.events.put(("status", s)),
        )
        self.started_at = time.monotonic()
        self.scan_thread = threading.Thread(target=self._run_scan, daemon=True)
        self.scan_thread.start()
        self.start_btn.config(state="disabled")
        self.stop_btn.config(state="normal")
        self.progress.start(12)
        self.screen.begin([os.path.normpath(r) for r in roots])
        self.fx_index = 0
        self.sound.started()
        if not self.fx_running:
            self.fx_running = True
            self._fx_tick()

    def _fx_tick(self):
        """Streams the files the scan has just checked onto the green screen, a few lines at a time."""
        files = self.all_files
        new = files[self.fx_index:]
        if new:
            self.fx_index = len(files)
            if len(new) > 4:  # the scan is faster than the eye: show an even sample
                new = [new[i * len(new) // 4] for i in range(4)]
            self.screen.checked(new)
            self.sound.tick()
        if self.scan_thread and self.scan_thread.is_alive():
            self.root.after(80, self._fx_tick)
        else:
            self.fx_running = False

    def _run_scan(self):
        try:
            self.scanner.run()
            self.events.put(("status", _("Adding up folder sizes...")))
            self.report = storage.StorageReport.build(self.all_files)
        except Exception as exc:  # report anything unexpected instead of dying silently
            self.events.put(("status", _("Scan stopped by an error: {error}").format(error=exc)))
        self.events.put(("done",))

    def stop_scan(self):
        if self.scanner and self.scan_thread and self.scan_thread.is_alive():
            self.scanner.stop()
            self.status_detail.config(text=_("Stopping..."))

    def _set_status(self, text):
        self.status_detail.config(text=text)

    def poll(self):
        try:
            while True:
                kind, *values = self.events.get_nowait()
                handler = self.handlers.get(kind)
                if handler:
                    handler(*values)
        except queue.Empty:
            pass
        if self.scanner and self.scan_thread and self.scan_thread.is_alive():
            elapsed = int(time.monotonic() - self.started_at)
            files = self.all_files
            self.metric_values["files"].config(text=f"{self.scanner.files_seen:,}")
            self.metric_values["threats"].config(text=str(len(self.threat_tree.paths)))
            self.metric_values["corrupt"].config(text=str(len(self.corrupt_tree.paths)))
            if elapsed != getattr(self, "_last_size_update", None):  # adding up sizes once a second is plenty
                self._last_size_update = elapsed
                self.metric_values["space"].config(text=human_size(sum(e.size for e in files)))
            self.side_status.config(text=_("Scanning... {files} files  ·  {minutes}m {seconds}s").format(
                files=f"{self.scanner.files_seen:,}", minutes=elapsed // 60, seconds=f"{elapsed % 60:02d}"))
        self.root.after(150, self.poll)

    def _add_finding(self, finding):
        existing = self.findings.get(finding.path)
        if existing and existing.kind != core.CORRUPTED:
            return  # already listed as a threat (e.g. by both NoorCleaner and Defender)
        if existing:  # a "corrupted" file that turns out to be a threat moves to the threats list
            for iid, path in list(self.corrupt_tree.paths.items()):
                if path == finding.path:
                    self.corrupt_tree.delete(iid)
                    del self.corrupt_tree.paths[iid]
        self.findings[finding.path] = finding
        tree = self.corrupt_tree if finding.kind == core.CORRUPTED else self.threat_tree
        is_threat = finding.kind != core.CORRUPTED
        self.screen.finding(finding, is_threat)
        if is_threat:
            self.sound.threat()
        problem = finding.reason if finding.kind != core.SUSPICIOUS else _("Suspicious: {reason}").format(
            reason=finding.reason)
        iid = tree.insert("", "end", values=(os.path.basename(finding.path), problem, finding.source,
                                             human_size(finding.size), os.path.dirname(finding.path)))
        tree.paths[iid] = finding.path
        tree.sizes[iid] = finding.size
        self._update_nav_counts()

    def _update_nav_counts(self):
        counts = {"threats": len(self.threat_tree.paths), "corrupt": len(self.corrupt_tree.paths),
                  "dups": len(self.dup_tree.get_children("")) + len(self.photo_tree.get_children(""))}
        for key, count in counts.items():
            title = self.nav_titles[key]
            self.nav_buttons[key].config(text=(f"{count}   {title}" if self.rtl else f"{title}   {count}")
                                         if count else title)

    def _scan_done(self):
        self.progress.stop()
        self.start_btn.config(state="normal")
        self.stop_btn.config(state="disabled")
        s = self.scanner
        threats, corrupted = len(self.threat_tree.paths), len(self.corrupt_tree.paths)
        total = self.report.total_bytes if self.report else 0
        self.screen.finished(s.files_seen, threats, corrupted, stopped=s.cancel.is_set())
        if not s.cancel.is_set() and not threats:
            self.sound.finished()
        summary = _("Checked {files} files using {size}.").format(files=f"{s.files_seen:,}", size=human_size(total))
        if self.opt_threats.get() or self.opt_defender.get():
            summary += " " + _("Threats found: {count}.").format(count=threats)
        if self.opt_corrupt.get():
            summary += " " + _("Corrupted files: {count}.").format(count=corrupted)
        if s.skipped_dirs:
            summary += " " + _("Protected folders that could not be opened: {count}.").format(
                count=f"{s.skipped_dirs:,}")
        if s.cancel.is_set():
            self.status_pill.config(text=_("Stopped"), style="PillOff.TLabel")
        elif threats:
            self.status_pill.config(text=_("Threats found: {count}").format(count=threats), style="PillOff.TLabel")
        else:
            self.status_pill.config(text=_("Scan finished"), style="PillOn.TLabel")
        self.status_detail.config(text=summary)
        self.side_status.config(text="")
        self.metric_values["files"].config(text=f"{s.files_seen:,}")
        self.metric_values["space"].config(text=human_size(total))
        self.metric_values["threats"].config(text=str(threats))
        self.metric_values["corrupt"].config(text=str(corrupted))
        self.show_storage()
        self.refresh_all_files()
        self.show_view("threats" if threats else "space")
        if s.errors:
            self.warn("\n\n".join(s.errors))
        elif not s.cancel.is_set():
            message = summary
            if self.report and self.report.biggest:
                top = self.report.biggest[0]
                message += "\n\n" + _("Your biggest file is {name} ({size}).").format(
                    name=os.path.basename(top.path), size=human_size(top.size))
            message += "\n\n" + _("See 'What's using space' for the biggest folders and files, and 'Junk files' "
                                  "to free space safely.")
            self.info(message)

    # ------------------------------------------------------------------ junk page

    def _junk_view(self):
        view = self._view("junk", _("Junk files"), _("Clutter that builds up over time and is safe to delete."))
        self._segments(view, [("junk", _("Junk files"), self._junk_page),
                              ("downloads", _("Old downloads"), self._downloads_page)])

    def _junk_page(self, parent):
        px = self.theme.px
        page = ttk.Frame(parent)
        top = self._card(page, fill="x", **self._gap())
        self.junk_status = ttk.Label(top, text=_("Press Check junk to see how much space you can free."),
                                     style="Metric.TLabel")
        self.junk_status.pack(anchor=self.W)
        bar = self._row(top, pady=(px(12), 0))
        self._button(bar, _("Check junk"), self.measure_junk, style="Primary.TButton", gap=8)
        self._button(bar, _("Clean selected"), self.clean_junk, gap=8)
        if core.IS_WINDOWS:
            import subprocess
            self._button(bar, _("Windows Disk Cleanup (old Windows versions, etc.)"),
                         lambda: subprocess.Popen("cleanmgr"))

        rows = self._card(page, fill="x")
        rows.columnconfigure(self.col(0, 2), weight=1)
        self.junk_vars, self.junk_size_labels = {}, {}
        admin = is_admin()
        for i, cat in enumerate(self.junk):
            if i:
                tk.Frame(rows, bg=theme.LINE, height=1).grid(row=3 * i - 1, column=0, columnspan=2, sticky="ew",
                                                             pady=px(7))
            var = tk.BooleanVar(value=admin or not cat.needs_admin)
            self.junk_vars[cat.key] = var
            name = cat.name + ("  " + _("(needs administrator)") if cat.needs_admin and not admin else "")
            ttk.Checkbutton(rows, text=name, variable=var, style="Bold.Card.TCheckbutton",
                            command=self._update_junk_total).grid(row=3 * i, column=self.col(0, 2), sticky=self.W)
            size_label = ttk.Label(rows, text="-", style="Size.TLabel")
            size_label.grid(row=3 * i, column=self.col(1, 2), sticky=self.E)
            self.junk_size_labels[cat.key] = size_label
            ttk.Label(rows, text=cat.description, style="CardSub.TLabel", wraplength=px(760), justify=self.JUSTIFY
                      ).grid(row=3 * i + 1, column=0, columnspan=2, sticky=self.W, padx=self.pad(px(24)))
        return page

    def measure_junk(self):
        if self._busy():
            return
        self.junk_sizes = {}
        for label in self.junk_size_labels.values():
            label.config(text="...")
        self.junk_status.config(text=_("Checking..."))

        def work():
            for cat in self.junk:
                try:
                    size, files = storage.measure_junk(cat)
                except OSError:
                    size, files = 0, 0
                self.events.put(("junk_size", cat.key, size, files))
            self.events.put(("junk_done", None))

        self._start_worker(work)

    def _show_junk_size(self, key, size, files):
        self.junk_sizes[key] = size
        self.junk_size_labels[key].config(text=human_size(size) if files else _("nothing"))
        self._update_junk_total()

    def _update_junk_total(self):
        if not self.junk_sizes:
            return
        total = sum(size for key, size in self.junk_sizes.items() if self.junk_vars[key].get())
        self.junk_status.config(text=_("You can free {size}").format(size=human_size(total)))

    def _junk_done(self, result):
        if result is None:  # measuring finished
            self._update_junk_total()
            return
        freed, deleted, skipped = result
        self.refresh_drives()
        message = _("Freed {size} ({count} files removed).").format(size=human_size(freed), count=f"{deleted:,}")
        if skipped:
            message += "\n\n" + _("{count} files were skipped because a program is using them (close your browser "
                                  "and other programs, then try again).").format(count=f"{skipped:,}")
        self.junk_status.config(text=_("Freed {size}").format(size=human_size(freed)))
        self.info(message)
        self.measure_junk()

    def clean_junk(self):
        if self._busy():
            return
        chosen = [c for c in self.junk if self.junk_vars[c.key].get()]
        if not chosen:
            self.info(_("Tick at least one kind of junk to clean."))
            return
        known = sum(self.junk_sizes.get(c.key, 0) for c in chosen)
        question = (_("Delete these junk files ({size})?").format(size=human_size(known)) if self.junk_sizes
                    else _("Delete these junk files?"))
        question += "\n\n" + "\n".join("  - " + c.name for c in chosen) + "\n\n" + _(
            "This cannot be undone. Files in use are skipped.")
        if not self.ask(question, danger=True):
            return
        self.junk_status.config(text=_("Cleaning..."))

        def work():
            freed = deleted = skipped = 0
            for cat in chosen:
                try:
                    f, d, s = storage.clean_junk(cat)
                except OSError:
                    continue
                freed, deleted, skipped = freed + f, deleted + d, skipped + s
            self.events.put(("junk_done", (freed, deleted, skipped)))

        self._start_worker(work)

    def _downloads_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        top = self._row(card, pady=(0, px(10)))
        self._button(top, _("Find old downloads"), self.find_old_downloads, style="Primary.TButton", gap=12)
        self.downloads_status = ttk.Label(top, text=_("Installers, zip files and disk images in your Downloads folder "
                                                      "that you have not touched for a while."),
                                          style="CardSub.TLabel")
        self.downloads_status.pack(side=self.L)
        frame, self.downloads_tree = make_tree(card, [("name", _("File"), 260), ("size", _("Size"), 90),
                                                      ("modified", _("Last changed"), 140), ("folder", _("Folder"), 400)])
        self.downloads_tree.bind("<Double-1>", lambda e: self.open_selected(self.downloads_tree))
        self._action_bar(card, self.downloads_tree, quarantine=False).pack(fill="x", side="bottom", pady=(px(10), 0))
        frame.pack(fill="both", expand=True)
        return card

    def find_old_downloads(self):
        if self._busy():
            return
        days = int(self.config.get("old_download_days") or 90)
        self.downloads_status.config(text=_("Looking..."))
        self._start_worker(lambda: self.events.put(("downloads_done", storage.old_downloads(min_age_days=days), days)))

    def _show_old_downloads(self, found, days):
        tree = self.downloads_tree
        clear_tree(tree)
        for e in found:
            iid = tree.insert("", "end", values=(os.path.basename(e.path), human_size(e.size),
                                                 time.strftime("%Y-%m-%d", time.localtime(e.mtime)),
                                                 os.path.dirname(e.path)))
            tree.paths[iid] = e.path
            tree.sizes[iid] = e.size
        total = sum(e.size for e in found)
        self.downloads_status.config(
            text=_("{count} old downloads ({size}) not changed for {days} days. Select the ones you no longer need."
                   ).format(count=len(found), size=human_size(total), days=days)
            if found else _("No old installers or archives in your Downloads folder."))

    # ------------------------------------------------------------------ duplicates page

    def _duplicates_view(self):
        view = self._view("dups", _("Duplicates"), _("Copies of the same file or photo. Keep the best one and remove "
                                                    "the rest."))
        self._segments(view, [("exact", _("Exact copies"), self._exact_page),
                              ("photos", _("Similar photos"), self._photos_page)])

    def _group_tree(self, card, columns):
        frame, tree = make_tree(card, columns, tree_title=_("File"), tree_width=260)
        tree.bind("<Double-1>", lambda e: self.open_selected(tree))
        self.group_trees.append(tree)
        return frame, tree

    def _exact_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        top = self._row(card, pady=(0, px(10)))
        self._button(top, _("Find duplicates"), self.find_duplicates, style="Primary.TButton", gap=12)
        self.dup_status = ttk.Label(top, text=_("Run a scan first, then press Find duplicates."), style="CardSub.TLabel")
        self.dup_status.pack(side=self.L)
        frame, self.dup_tree = self._group_tree(card, [("size", _("Size"), 125), ("modified", _("Modified"), 140),
                                                       ("folder", _("Folder"), 480)])
        self._action_bar(card, self.dup_tree, export=self.export_duplicates, select_all=False,
                         extra=[(_("Select extra copies"), lambda: self.select_extra_copies(self.dup_tree))]
                         ).pack(fill="x", side="bottom", pady=(px(10), 0))
        frame.pack(fill="both", expand=True)
        return card

    def _photos_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        top = self._row(card, pady=(0, px(10)))
        self._button(top, _("Find similar photos"), self.find_similar_photos, style="Primary.TButton", gap=12,
                     state="normal" if photos.available() else "disabled")
        self.photo_status = ttk.Label(top, text=_("Resized, re-saved and WhatsApp copies of the same picture. The "
                                                  "best quality one is listed first.") if photos.available()
                                      else _("Similar photo search is not available in this version."),
                                      style="CardSub.TLabel")
        self.photo_status.pack(side=self.L)
        frame, self.photo_tree = self._group_tree(card, [("size", _("Size"), 125), ("pixels", _("Resolution"), 110),
                                                         ("modified", _("Modified"), 140), ("folder", _("Folder"), 400)])
        self._action_bar(card, self.photo_tree, select_all=False,
                         extra=[(_("Select extra copies"), lambda: self.select_extra_copies(self.photo_tree))]
                         ).pack(fill="x", side="bottom", pady=(px(10), 0))
        frame.pack(fill="both", expand=True)
        return card

    def find_duplicates(self):
        if self._busy():
            return
        if not self.all_files:
            self.info(_("Run a scan first, then look for duplicates."))
            return
        files = list(self.all_files)
        self.dup_status.config(text=_("Comparing files..."))
        clear_tree(self.dup_tree)
        self._start_worker(lambda: self.events.put(("dup_done", storage.find_duplicates(
            files, on_progress=lambda d, t: self.events.put(("dup_progress", d, t)) if d % 50 == 0 else None))))

    def _dup_progress(self, done, total):
        self.dup_status.config(text=_("Comparing files... {done} of {total} size groups").format(
            done=f"{done:,}", total=f"{total:,}"))

    def _show_duplicates(self, groups):
        tree = self.dup_tree
        clear_tree(tree)
        wasted = 0
        for n, group in enumerate(groups):
            extra = group[0].size * (len(group) - 1)
            wasted += extra
            parent = tree.insert("", "end", open=n < 30,
                                 text=_("{count} copies of {name}").format(count=len(group),
                                                                          name=os.path.basename(group[0].path)),
                                 values=(_("{size} extra").format(size=human_size(extra)), "", ""))
            tree.sizes[parent] = extra
            for e in group:
                iid = tree.insert(parent, "end", text=os.path.basename(e.path),
                                  values=(human_size(e.size), time.strftime("%Y-%m-%d %H:%M", time.localtime(e.mtime)),
                                          os.path.dirname(e.path)))
                tree.paths[iid] = e.path
                tree.sizes[iid] = e.size
        self.dup_status.config(text=_("Sets of duplicates: {count}. {size} could be freed.").format(
            count=f"{len(groups):,}", size=human_size(wasted)) if groups else _("No duplicate files found."))
        self._update_nav_counts()

    def find_similar_photos(self):
        if self._busy():
            return
        if not self.all_files:
            self.info(_("Run a scan first, then look for similar photos."))
            return
        files = list(self.all_files)
        self.photo_status.config(text=_("Looking at your photos..."))
        clear_tree(self.photo_tree)
        self._start_worker(lambda: self.events.put(("photos_done", photos.find_similar_photos(
            files, on_progress=lambda d, t: self.events.put(("photo_progress", d, t))))))

    def _photo_progress(self, done, total):
        self.photo_status.config(text=_("Looking at your photos... {done} of {total}").format(
            done=f"{done:,}", total=f"{total:,}"))

    def _show_similar_photos(self, groups):
        tree = self.photo_tree
        clear_tree(tree)
        wasted = 0
        for n, group in enumerate(groups):
            extra = sum(p.entry.size for p in group[1:])
            wasted += extra
            parent = tree.insert("", "end", open=n < 30,
                                 text=_("{count} similar photos").format(count=len(group)),
                                 values=(_("{size} extra").format(size=human_size(extra)), "", "", ""))
            tree.sizes[parent] = extra
            for p in group:
                e = p.entry
                iid = tree.insert(parent, "end", text=os.path.basename(e.path),
                                  values=(human_size(e.size), f"{p.width} × {p.height}",
                                          time.strftime("%Y-%m-%d %H:%M", time.localtime(e.mtime)),
                                          os.path.dirname(e.path)))
                tree.paths[iid] = e.path
                tree.sizes[iid] = e.size
        self.photo_status.config(text=_("Sets of similar photos: {count}. {size} could be freed.").format(
            count=f"{len(groups):,}", size=human_size(wasted)) if groups else _("No similar photos found."))
        self._update_nav_counts()

    def select_extra_copies(self, tree):
        """Selects every copy except the first (kept) one in each set."""
        extra = [iid for parent in tree.get_children("") for iid in tree.get_children(parent)[1:]]
        tree.selection_set(extra)
        if not extra:
            self.info(_("Search first, then select the extra copies."))

    # ------------------------------------------------------------------ findings, all files, quarantine

    def _findings_view(self, name, title, subtitle, columns, show_repair):
        view = self._view(name, title, subtitle)
        card = self._card(view, fill="both", expand=True)
        frame, tree = make_tree(card, columns)
        tree.bind("<Double-1>", lambda e: self.open_selected(tree))
        self._action_bar(card, tree, show_repair, export=self.export_findings).pack(
            fill="x", side="bottom", pady=(self.theme.px(10), 0))
        frame.pack(fill="both", expand=True)
        return tree

    def _all_files_view(self):
        px = self.theme.px
        view = self._view("files", _("All files"), _("Every file from your last scan. Search by name or folder."))
        card = self._card(view, fill="both", expand=True)
        top = self._row(card, pady=(0, px(10)))
        self.search_var = tk.StringVar()
        entry = ttk.Entry(top, textvariable=self.search_var, width=42, justify=self.JUSTIFY)
        entry.pack(side=self.L)
        entry.bind("<Return>", lambda e: self.refresh_all_files())
        self._button(top, _("Search"), self.refresh_all_files, style="Primary.TButton", side=self.L, gap=8)
        self.largest_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(top, text=_("Largest first"), variable=self.largest_var, style="Card.TCheckbutton",
                        command=self.refresh_all_files).pack(side=self.L, padx=px(8))
        self.all_label = ttk.Label(top, text=_("Run a scan to list every file."), style="Hint.TLabel")
        self.all_label.pack(side=self.L, padx=px(8))
        frame, self.files_tree = make_tree(card, [("name", _("File"), 260), ("size", _("Size"), 90),
                                                  ("modified", _("Modified"), 140), ("folder", _("Folder"), 520)])
        self.files_tree.bind("<Double-1>", lambda e: self.open_selected(self.files_tree))
        self._action_bar(card, self.files_tree, export=self.export_all_files).pack(fill="x", side="bottom",
                                                                                 pady=(px(10), 0))
        frame.pack(fill="both", expand=True)

    def refresh_all_files(self):
        query = self.search_var.get().strip().lower()
        files = self.all_files
        matches = [e for e in files if query in e.path.lower()] if query else list(files)
        if self.largest_var.get():
            matches.sort(key=lambda e: e.size, reverse=True)
        tree = self.files_tree
        clear_tree(tree)
        for e in matches[:MAX_LISTED_FILES]:
            iid = tree.insert("", "end", values=(os.path.basename(e.path), human_size(e.size),
                                                 time.strftime("%Y-%m-%d %H:%M", time.localtime(e.mtime)),
                                                 os.path.dirname(e.path)))
            tree.paths[iid] = e.path
            tree.sizes[iid] = e.size
        text = _("Showing {shown} of {total} files ({size})").format(
            shown=f"{min(len(matches), MAX_LISTED_FILES):,}", total=f"{len(matches):,}",
            size=human_size(sum(e.size for e in matches)))
        if len(matches) > MAX_LISTED_FILES:
            text += " - " + _("search to narrow down, or Export for the full list")
        self.all_label.config(text=text)

    def _quarantine_view(self):
        px = self.theme.px
        view = self._view("quarantine", _("Quarantine"), _("Files locked away so they cannot run. Restore one if it "
                                                          "was a mistake, or delete it for good."))
        card = self._card(view, fill="both", expand=True)
        frame, self.q_tree = make_tree(card, [("name", _("File"), 240), ("reason", _("Reason"), 360),
                                              ("date", _("Quarantined on"), 130),
                                              ("original", _("Original location"), 400)])
        bar = ttk.Frame(card, style="Plain.TFrame")
        bar.pack(fill="x", side="bottom", pady=(px(10), 0))
        self._button(bar, _("Restore"), self.restore_quarantined)
        self._button(bar, _("Delete for good"), self.delete_quarantined, style="Danger.TButton")
        self._button(bar, _("Refresh"), self.refresh_quarantine)
        frame.pack(fill="both", expand=True)

    def refresh_quarantine(self):
        tree = self.q_tree
        clear_tree(tree)
        for item in core.list_quarantine():
            iid = tree.insert("", "end", values=(os.path.basename(item["original"]), item.get("reason", ""),
                                                 item.get("date", ""), item["original"]))
            tree.items[iid] = item["stored"]

    def _selected_quarantine(self):
        chosen = self._selected_items(self.q_tree)
        if not chosen:
            self.info(_("Select a quarantined file first."))
        return chosen

    def restore_quarantined(self):
        chosen = self._selected_quarantine()
        if not chosen or not self.ask(_("Restore {count} file(s) to where they came from?").format(count=len(chosen))
                                      + "\n\n" + _("Only do this if you are sure they are safe.")):
            return
        errors = []
        for stored in chosen:
            try:
                core.restore_from_quarantine(stored)
            except Exception as exc:
                errors.append(str(exc))
        self.refresh_quarantine()
        if errors:
            self.warn(_("Some files could not be restored:") + "\n\n" + "\n".join(errors[:10]))

    def delete_quarantined(self):
        chosen = self._selected_quarantine()
        if not chosen or not self.ask(_("Permanently delete {count} quarantined file(s)? This cannot be undone.").format(
                count=len(chosen)), danger=True):
            return
        errors = []
        for stored in chosen:
            try:
                core.delete_from_quarantine(stored)
            except Exception as exc:
                errors.append(str(exc))
        self.refresh_quarantine()
        self.refresh_drives()
        if errors:
            self.warn(_("Some files could not be deleted:") + "\n\n" + "\n".join(errors[:10]))

    # ------------------------------------------------------------------ removing files

    def remove_selected(self, tree, mode):
        if self._busy():
            return
        selected = self._selected_paths(tree)
        if not selected:
            self.info(_("Select one or more files in the list first (click, or Ctrl+click / Shift+click for several)."))
            return
        paths = list(dict.fromkeys(p for _iid, p in selected))

        protected = [p for p in paths if core.is_protected(p)]
        if protected:
            question = (_("{count} of the selected files are Windows system files:").format(count=len(protected))
                        + "\n\n" + "\n".join(protected[:5]) + "\n\n"
                        + _("Removing them can stop Windows from working. For a corrupted system file, use "
                            "'Repair Windows files' instead.") + "\n\n" + _("Remove these system files anyway?"))
            if not self.ask(question, danger=True):
                paths = [p for p in paths if p not in protected]
                if not paths:
                    return

        if tree in self.group_trees:
            for parent in tree.get_children(""):
                group = {tree.paths[i] for i in tree.get_children(parent) if i in tree.paths}
                if group and group <= set(paths):
                    if not self.ask(_("You selected every copy of at least one file, so no copy would be left.") + "\n\n"
                                    + _("Tip: use 'Select extra copies' to keep one of each.") + "\n\n"
                                    + _("Continue anyway?"), danger=True):
                        return
                    break

        listing = "\n".join(os.path.basename(p) for p in paths[:10])
        if len(paths) > 10:
            listing += "\n" + _("...and {count} more").format(count=len(paths) - 10)
        size = human_size(sum(tree.sizes.get(iid, 0) for iid, p in selected if p in paths))
        questions = {
            "quarantine": _("Move {count} file(s) ({size}) to quarantine?").format(count=len(paths), size=size)
                          + f"\n\n{listing}\n\n" + _("They will be locked away and can be restored from Quarantine."),
            "recycle": _("Move {count} file(s) ({size}) to the Recycle Bin?").format(count=len(paths), size=size)
                       + f"\n\n{listing}\n\n" + _("You can still restore them. They keep using space until you "
                                                 "empty the Recycle Bin (Junk files)."),
            "delete": _("PERMANENTLY delete {count} file(s) ({size})?").format(count=len(paths), size=size)
                      + f"\n\n{listing}\n\n" + _("This cannot be undone."),
        }
        if not self.ask(questions[mode], danger=True):
            return

        done, failed = [], []
        for path in paths:
            finding = self.findings.get(path)
            try:
                if mode == "quarantine":
                    core.quarantine(path, finding.reason if finding else _("Chosen by you"))
                elif mode == "recycle":
                    core.move_to_recycle_bin(path)
                else:
                    core.delete_permanently(path)
                done.append(path)
            except FileNotFoundError:
                done.append(path)  # already gone (e.g. removed by Windows Security)
            except Exception as exc:
                failed.append(f"{os.path.basename(path)}: {exc}")
        self._drop_rows(done)
        self.refresh_drives()
        if mode == "quarantine":
            self.refresh_quarantine()

        message = {"quarantine": _("Files quarantined: {count}."), "recycle": _("Files moved to the Recycle Bin: {count}."),
                   "delete": _("Files deleted: {count}.")}[mode].format(count=len(done))
        if failed:
            message += "\n\n" + _("{count} could not be removed (they may be in use - close the program using them "
                                  "or run NoorCleaner as administrator):").format(count=len(failed))
            self.warn(message + "\n\n" + "\n".join(failed[:10]))
        else:
            self.info(message)

    def _drop_rows(self, paths):
        gone = set(paths)
        for tree in (self.threat_tree, self.corrupt_tree, self.files_tree, self.big_tree, self.downloads_tree,
                     *self.group_trees):
            for iid, path in list(tree.paths.items()):
                if path in gone:
                    tree.delete(iid)
                    del tree.paths[iid]
                    tree.sizes.pop(iid, None)
        for tree in self.group_trees:
            for parent in tree.get_children(""):
                if len(tree.get_children(parent)) < 2:
                    for iid in tree.get_children(parent):
                        tree.paths.pop(iid, None)
                    tree.delete(parent)
        for path in gone:
            self.findings.pop(path, None)
        self.all_files = [e for e in self.all_files if e.path not in gone]
        self._update_nav_counts()

    # ------------------------------------------------------------------ reports

    def _save_csv(self, name, header, rows):
        target = filedialog.asksaveasfilename(title=_("Save report"), defaultextension=".csv",
                                              initialfile=f"NoorCleaner-{name}-{time.strftime('%Y%m%d-%H%M')}.csv",
                                              filetypes=[(_("CSV (opens in Excel)"), "*.csv")])
        if not target:
            return
        with open(target, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(header)
            writer.writerows(rows)
        self.info(_("Saved to:") + "\n" + target)

    def export_findings(self):
        if not self.findings:
            self.info(_("There is nothing to export yet."))
            return
        self._save_csv("report", [_("Type"), _("File"), _("Problem"), _("Found by"), _("Size (bytes)")],
                       ([fd.kind, fd.path, fd.reason, fd.source, fd.size] for fd in self.findings.values()))

    def export_all_files(self):
        if not self.all_files:
            self.info(_("Run a scan first."))
            return
        self._save_csv("all-files", [_("File"), _("Size (bytes)"), _("Type"), _("Modified")],
                       ([e.path, e.size, storage.file_type_label(storage.file_type(e.path)),
                         time.strftime("%Y-%m-%d %H:%M", time.localtime(e.mtime))]
                        for e in sorted(self.all_files, key=lambda e: e.size, reverse=True)))

    def export_duplicates(self):
        tree = self.dup_tree
        rows = [[n, tree.paths[iid], tree.sizes.get(iid, 0)]
                for n, parent in enumerate(tree.get_children(""), 1) for iid in tree.get_children(parent)]
        if not rows:
            self.info(_("There is nothing to export yet."))
            return
        self._save_csv("duplicates", [_("Set"), _("File"), _("Size (bytes)")], rows)

    def repair_windows(self):
        if not self.ask(_("This opens Microsoft's own repair tools (DISM and System File Checker) as administrator. "
                          "They fix corrupted Windows system files and can take 15-30 minutes.") + "\n\n"
                        + _("Start the repair now?")):
            return
        try:
            core.repair_windows_system_files()
        except RuntimeError as exc:
            self.error(str(exc))

    def on_close(self):
        if self.scan_thread and self.scan_thread.is_alive():
            if not self.ask(_("A scan is running. Stop it and close NoorCleaner?")):
                return
            self.scanner.stop()
        self.sound.stop()
        self.root.destroy()


def main():
    if "--remind" in sys.argv:
        import reminder
        reminder.run_reminder()
        return
    if core.IS_WINDOWS:
        try:
            import ctypes
            ctypes.windll.shcore.SetProcessDpiAwareness(1)  # sharp text on high-DPI screens
        except (AttributeError, OSError):
            pass
    config = settings.load()
    root = tk.Tk()
    icon = os.path.join(getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__))), "assets", "icon.ico")
    if core.IS_WINDOWS and os.path.exists(icon):
        root.iconbitmap(default=icon)
    if config.get("language") not in i18n.LANGUAGES:
        config["language"] = choose_language_first_run(root)
        settings.save(config)
    i18n.set_language(config["language"])
    NoorCleanerApp(root, config)
    root.mainloop()


if __name__ == "__main__":
    main()
