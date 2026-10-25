"""NoorCleaner: shows what is taking up space on your computer, clears junk,
finds duplicate files, corrupted files and viruses, and removes only the files
you choose.

Run with:  python noor_cleaner.py
"""

import csv
import os
import queue
import subprocess
import sys
import threading
import time
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

import cleaner_core as storage
import logo_data
import scanner_core as core
import theme

APP_NAME = "NoorCleaner"
VERSION = "1.2.0"
MAX_LISTED_FILES = 5000  # rows shown at once in "All files"; search narrows it down


def human_size(size):
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024:
            return f"{size:.0f} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.2f} TB"


def share_bar(part, whole):
    share = part / whole if whole else 0
    return f"{share:.0%}" if share >= 0.01 or not part else "<1%"


def is_admin():
    if not core.IS_WINDOWS:
        return os.geteuid() == 0
    try:
        import ctypes
        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except OSError:
        return False


def open_location(path, select=True):
    if core.IS_WINDOWS:
        if select:
            subprocess.Popen(f'explorer /select,"{os.path.normpath(path)}"')
        else:
            os.startfile(path)
    elif sys.platform == "darwin":
        subprocess.Popen(["open", "-R", path] if select else ["open", path])
    else:
        subprocess.Popen(["xdg-open", os.path.dirname(path) if select else path])


def make_tree(parent, columns, tree_title=None, tree_width=300, sortable=True, height=None):
    """A Treeview with scrollbars and click-to-sort headings. columns: [(id, title, width)]."""
    frame = ttk.Frame(parent)
    options = {"height": height} if height else {}
    tree = ttk.Treeview(frame, columns=[c[0] for c in columns], selectmode="extended",
                        show="tree headings" if tree_title else "headings", **options)
    if tree_title:
        tree.heading("#0", text=tree_title, anchor="w")
        tree.column("#0", width=tree_width, stretch=True)
    for col, title, width in columns:
        tree.heading(col, text=title, command=(lambda c=col: sort_tree(tree, c, False)) if sortable else "")
        fixed = col in ("size", "files", "share", "modified")
        tree.column(col, width=width, minwidth=width if fixed else 40, stretch=not fixed,
                    anchor="e" if col in ("size", "files") else "w")
    ys = ttk.Scrollbar(frame, orient="vertical", command=tree.yview)
    xs = ttk.Scrollbar(frame, orient="horizontal", command=tree.xview)
    tree.configure(yscrollcommand=ys.set, xscrollcommand=xs.set)
    tree.grid(row=0, column=0, sticky="nsew")
    ys.grid(row=0, column=1, sticky="ns")
    xs.grid(row=1, column=0, sticky="ew")
    frame.rowconfigure(0, weight=1)
    frame.columnconfigure(0, weight=1)
    tree.paths = {}  # iid -> file path, for rows that are files
    tree.sizes = {}  # iid -> size in bytes, so the size column sorts by number
    return frame, tree


def sort_tree(tree, col, reverse):
    rows = tree.get_children("")
    if col == "size":
        keyed = [(tree.sizes.get(iid, 0), iid) for iid in rows]
    else:
        keyed = [(str(tree.set(iid, col)).lower(), iid) for iid in rows]
    keyed.sort(reverse=reverse)
    for index, (_, iid) in enumerate(keyed):
        tree.move(iid, "", index)
    tree.heading(col, command=lambda: sort_tree(tree, col, not reverse))


def clear_tree(tree):
    tree.delete(*tree.get_children())
    tree.paths.clear()
    tree.sizes.clear()


class NoorCleanerApp:
    def __init__(self, root):
        self.root = root
        root.title(f"{APP_NAME} {VERSION}")
        self.theme = theme.NoorStyle(root)
        px = self.theme.px
        root.geometry(f"{px(1240)}x{px(820)}")
        root.minsize(px(1060), px(660))
        root.protocol("WM_DELETE_WINDOW", self.on_close)

        self.scanner = None
        self.scan_thread = None
        self.worker = None            # junk / duplicate background job
        self.events = queue.Queue()
        self.all_files = []           # FileEntry for every file seen (appended by the scan thread)
        self.findings = {}            # path -> Finding
        self.report = None            # StorageReport from the last scan
        self.extra_folders = []
        self.defender = core.find_defender()
        self.signatures = core.load_signatures(core.default_signature_files())
        self.junk = storage.junk_categories()
        self.junk_sizes = {}
        self.views, self.nav_buttons = {}, {}

        self._build_ui()
        self.refresh_drives()
        self.refresh_quarantine()
        self.show_view("scan")
        self.root.after(150, self.poll)

    # ------------------------------------------------------------------ layout helpers

    def _view(self, name, title, subtitle):
        view = ttk.Frame(self.content, padding=(self.theme.px(30), self.theme.px(24), self.theme.px(30), self.theme.px(18)))
        view.grid(row=0, column=0, sticky="nsew")
        head = ttk.Frame(view)
        head.pack(fill="x", pady=(0, self.theme.px(14)))
        ttk.Label(head, text=title, style="H1.TLabel").pack(anchor="w")
        ttk.Label(head, text=subtitle, style="Sub.TLabel").pack(anchor="w", pady=(self.theme.px(2), 0))
        self.views[name] = view
        return view

    def _card(self, parent, title=None, style="Card.TFrame", **pack):
        card = ttk.Frame(parent, style=style, padding=self.theme.card_padding)
        if pack:
            card.pack(**pack)
        if title:
            ttk.Label(card, text=title, style="NoteH3.TLabel" if style == "Note.TFrame" else "H3.TLabel"
                      ).pack(anchor="w", pady=(0, self.theme.px(8)))
        return card

    def _gap(self):
        return {"pady": (0, self.theme.px(14))}

    def show_view(self, name):
        self.views[name].tkraise()
        for key, button in self.nav_buttons.items():
            button.configure(style="NavOn.TButton" if key == name else "Nav.TButton")
        self.current_view = name

    # ------------------------------------------------------------------ layout

    def _build_ui(self):
        px = self.theme.px
        shell = ttk.Frame(self.root)
        shell.pack(fill="both", expand=True)

        sidebar = ttk.Frame(shell, style="Sidebar.TFrame", width=px(232), padding=(px(14), px(20), px(14), px(14)))
        sidebar.pack(side="left", fill="y")
        sidebar.pack_propagate(False)
        brand = ttk.Frame(sidebar, style="Sidebar.TFrame", padding=(px(8), 0, 0, px(20)))
        brand.pack(fill="x")
        logo_size = min(logo_data.LOGO_PNG, key=lambda h: abs(h - 26 * self.theme.scale))
        self.logo = tk.PhotoImage(master=self.root, data=logo_data.LOGO_PNG[logo_size])
        ttk.Label(brand, image=self.logo, style="Brand.TLabel").pack(side="left")
        ttk.Label(brand, text=APP_NAME, style="Brand.TLabel").pack(side="left", padx=(px(10), 0))

        for key, text in (("scan", "Scan"), ("space", "What's using space"), ("junk", "Junk files"),
                          ("dups", "Duplicates"), ("threats", "Viruses & threats"), ("corrupt", "Corrupted files"),
                          ("files", "All files"), ("quarantine", "Quarantine")):
            button = ttk.Button(sidebar, text=text, style="Nav.TButton", takefocus=False,
                                command=lambda k=key: self.show_view(k))
            button.pack(fill="x", pady=(0, px(2)))
            self.nav_buttons[key] = button

        bottom = ttk.Frame(sidebar, style="Sidebar.TFrame")
        bottom.pack(side="bottom", fill="x")
        self.side_status = ttk.Label(bottom, text="", style="SideNote.TLabel", wraplength=px(196))
        self.side_status.pack(fill="x", padx=px(10), pady=(0, px(8)))
        tk.Frame(bottom, bg="#26332d", height=1).pack(fill="x")
        state = ttk.Frame(bottom, style="Sidebar.TFrame", padding=(px(10), px(12), px(10), px(4)))
        state.pack(fill="x")
        admin = is_admin()
        dot = tk.Canvas(state, width=px(8), height=px(8), bg=theme.GREEN_DEEP, highlightthickness=0)
        dot.create_oval(0, 0, px(8), px(8), fill=theme.GOOD if admin else theme.WARN, outline="")
        dot.pack(side="left", padx=(0, px(8)))
        ttk.Label(state, text="Administrator" if admin else "Standard user", style="SideNote.TLabel").pack(side="left")
        if core.IS_WINDOWS and not admin:
            link = ttk.Label(state, text="Run as admin", style="Link.TLabel", cursor="hand2")
            link.pack(side="left", padx=(px(8), 0))
            link.bind("<Button-1>", lambda e: self.restart_as_admin())

        self.content = ttk.Frame(shell)
        self.content.pack(side="left", fill="both", expand=True)
        self.content.rowconfigure(0, weight=1)
        self.content.columnconfigure(0, weight=1)

        self._scan_view()
        self._space_view()
        self._junk_view()
        self._duplicates_view()
        finding_cols = [("name", "File", 220), ("problem", "Problem", 380), ("source", "Found by", 120),
                        ("size", "Size", 80), ("folder", "Folder", 330)]
        self.threat_tree = self._findings_view(
            "threats", "Viruses & threats",
            "Viruses and suspicious files from your last scan. Microsoft Defender does the real virus detection.",
            finding_cols, show_repair=False)
        self.corrupt_tree = self._findings_view(
            "corrupt", "Corrupted files",
            "Files that are damaged, cut off or unreadable. Broken Windows files should be repaired, not deleted.",
            finding_cols, show_repair=True)
        self._all_files_view()
        self._quarantine_view()

    def _scan_view(self):
        px = self.theme.px
        view = self._view("scan", "Scan your PC", "See what is filling your storage and find corrupted files and "
                                                 "viruses. Nothing is removed unless you choose it.")
        row = ttk.Frame(view)
        row.pack(fill="x", **self._gap())
        row.columnconfigure(0, weight=16, uniform="status")
        row.columnconfigure(1, weight=10, uniform="status")

        status = self._card(row)
        status.grid(row=0, column=0, sticky="nsew", padx=(0, px(14)))
        self.status_pill = ttk.Label(status, text="Ready", style="Pill.TLabel")
        self.status_pill.pack(anchor="w")
        self.status_detail = ttk.Label(status, text=self._idle_text(), style="CardSub.TLabel", wraplength=px(560))
        self.status_detail.pack(anchor="w", fill="x", pady=(px(10), px(8)))
        self.progress = ttk.Progressbar(status, mode="indeterminate", style="Green.Horizontal.TProgressbar")
        self.progress.pack(fill="x", pady=(0, px(12)))
        buttons = ttk.Frame(status, style="Plain.TFrame")
        buttons.pack(anchor="w")
        self.start_btn = ttk.Button(buttons, text="Start scan", style="Primary.TButton", command=self.start_scan)
        self.start_btn.pack(side="left")
        self.stop_btn = ttk.Button(buttons, text="Stop", style="Ghost.TButton", command=self.stop_scan, state="disabled")
        self.stop_btn.pack(side="left", padx=px(8))

        metrics = self._card(row)
        metrics.grid(row=0, column=1, sticky="new")
        self.metric_values = {}
        for col, (key, label) in enumerate((("files", "Files checked"), ("space", "Space used"),
                                            ("threats", "Threats"), ("corrupt", "Corrupted"))):
            metrics.columnconfigure(col, weight=1)
            value = ttk.Label(metrics, text="0", style="Metric.TLabel")
            value.grid(row=0, column=col, pady=(px(10), 0))
            ttk.Label(metrics, text=label, style="MetricLabel.TLabel").grid(row=1, column=col)
            self.metric_values[key] = value

        where = self._card(view, "What to scan", fill="x", **self._gap())
        self.drive_vars = {}
        drives = ttk.Frame(where, style="Plain.TFrame")
        drives.pack(fill="x")
        for drive in core.list_drives():
            label = core.drive_label(drive)
            var = tk.BooleanVar(value=not any(k in label for k in ("Network", "CD/DVD")))
            self.drive_vars[drive] = var
            ttk.Checkbutton(drives, text=label, variable=var, style="Card.TCheckbutton").pack(side="left", padx=(0, px(18)))
        folders = ttk.Frame(where, style="Plain.TFrame")
        folders.pack(fill="x", pady=(px(10), 0))
        ttk.Button(folders, text="Add a folder...", style="Ghost.TButton", command=self.add_folder).pack(side="left")
        ttk.Button(folders, text="Clear folders", style="Ghost.TButton", command=self.clear_folders).pack(side="left", padx=px(8))
        self.folders_label = ttk.Label(folders, text="", style="Hint.TLabel")
        self.folders_label.pack(side="left", padx=px(6))

        checks = self._card(view, "Also check for", fill="x", **self._gap())
        self.opt_corrupt = tk.BooleanVar(value=True)
        self.opt_threats = tk.BooleanVar(value=True)
        self.opt_defender = tk.BooleanVar(value=False)
        self.opt_deep = tk.BooleanVar(value=False)
        grid = ttk.Frame(checks, style="Plain.TFrame")
        grid.pack(fill="x")
        defender_text = ("Full Microsoft Defender virus scan (slow)" if self.defender
                         else "Microsoft Defender (not found on this computer)")
        options = ((self.opt_corrupt, "Corrupted files", "normal"),
                   (self.opt_threats, "Viruses & suspicious files", "normal"),
                   (self.opt_defender, defender_text, "normal" if self.defender else "disabled"),
                   (self.opt_deep, "Deep scan - reads every byte (much slower)", "normal"))
        for i, (var, text, state) in enumerate(options):
            ttk.Checkbutton(grid, text=text, variable=var, state=state, style="Card.TCheckbutton").grid(
                row=i // 2, column=i % 2, sticky="w", padx=(0, px(40)), pady=px(2))

        note = self._card(view, "How NoorCleaner works, honestly", style="Note.TFrame", fill="x")
        for line in ("Nothing is deleted unless you select it and confirm. Quarantined files can be restored.",
                     "Microsoft Defender does the real virus detection. NoorCleaner's own checks catch known "
                     "malware, disguised programs and USB worms, but they are not a full antivirus.",
                     "Files sent to the Recycle Bin still use space until you empty it (Junk files)."):
            ttk.Label(note, text="•  " + line, style="Note.TLabel", wraplength=px(880)).pack(anchor="w", pady=px(2))

    def _idle_text(self):
        tip = "" if is_admin() else " Run as administrator to include protected folders."
        return "Tick the drives to scan and press Start scan." + tip

    def _action_bar(self, parent, tree, show_repair=False, export=None, extra=(), compact=False):
        px = self.theme.px
        bar = ttk.Frame(parent, style="Plain.TFrame")

        def button(text, command, style="Ghost.TButton", side="left", pad=(0, px(6))):
            ttk.Button(bar, text=text, style=style, command=command).pack(side=side, padx=pad)

        if not compact:
            button("Select all", lambda: tree.selection_set(list(tree.paths)))
        for text, command in extra:
            button(text, command)
        button("Open location", lambda: self.open_selected(tree))
        if not compact:
            button("Quarantine", lambda: self.remove_selected(tree, "quarantine"), pad=(px(14), px(6)))
        button("Recycle Bin", lambda: self.remove_selected(tree, "recycle"))
        button("Delete" if compact else "Delete permanently", lambda: self.remove_selected(tree, "delete"),
               style="Danger.TButton")
        button("Export...", export or self.export_findings, side="right", pad=0)
        if show_repair:
            button("Repair Windows files", self.repair_windows, style="Primary.TButton",
                   side="right", pad=(0, px(6)))
        return bar

    def _tree_card(self, parent, columns, **tree_options):
        card = self._card(parent, fill="both", expand=True)
        frame, tree = make_tree(card, columns, **tree_options)
        return card, frame, tree

    def _space_view(self):
        px = self.theme.px
        view = self._view("space", "What's using space", "The biggest folders, file types and files from your last scan.")
        self.drives_box = self._card(view, "Your drives", fill="x", **self._gap())

        panes = ttk.PanedWindow(view, orient="horizontal")
        panes.pack(fill="both", expand=True)
        left = self._card(panes, "Biggest folders")
        frame, self.folder_tree = make_tree(left, [("size", "Size", 85), ("share", "Share", 60), ("files", "Files", 70)],
                                            tree_title="Folder (open to look inside)", tree_width=260, sortable=False)
        self.folder_tree.folders = {}  # iid -> folder path
        self.folder_tree.bind("<<TreeviewOpen>>", self._open_folder_node)
        self.folder_tree.bind("<Double-1>", lambda e: self.open_selected_folder())
        bar = ttk.Frame(left, style="Plain.TFrame")
        bar.pack(fill="x", side="bottom", pady=(px(10), 0))
        ttk.Button(bar, text="Open folder", style="Ghost.TButton", command=self.open_selected_folder).pack(side="left")
        ttk.Button(bar, text="Show its files", style="Ghost.TButton", command=self.show_folder_files).pack(side="left", padx=px(6))
        frame.pack(fill="both", expand=True)
        panes.add(left, weight=1)

        right = ttk.PanedWindow(panes, orient="vertical")
        types_box = self._card(right, "By type")
        frame, self.type_tree = make_tree(types_box, [("type", "Type", 170), ("size", "Size", 85),
                                                      ("share", "Share", 60), ("files", "Files", 70)], height=5)
        frame.pack(fill="both", expand=True)
        right.add(types_box, weight=2)
        big_box = self._card(right, "Biggest files")
        frame, self.big_tree = make_tree(big_box, [("name", "File", 200), ("size", "Size", 85),
                                                   ("type", "Type", 120), ("folder", "Folder", 260)])
        self.big_tree.bind("<Double-1>", lambda e: self.open_selected(self.big_tree))
        self._action_bar(big_box, self.big_tree, export=self.export_all_files, compact=True).pack(
            fill="x", side="bottom", pady=(px(10), 0))
        frame.pack(fill="both", expand=True)
        right.add(big_box, weight=3)
        panes.add(right, weight=1)

    def _junk_view(self):
        px = self.theme.px
        view = self._view("junk", "Junk files", "Clutter that builds up over time and is safe to delete. "
                                                "Untick anything you want to keep.")
        top = self._card(view, fill="x", **self._gap())
        self.junk_status = ttk.Label(top, text="Press Check junk to see how much space you can free.",
                                     style="Metric.TLabel")
        self.junk_status.pack(anchor="w")
        bar = ttk.Frame(top, style="Plain.TFrame")
        bar.pack(anchor="w", pady=(px(12), 0))
        self.junk_check_btn = ttk.Button(bar, text="Check junk", style="Primary.TButton", command=self.measure_junk)
        self.junk_check_btn.pack(side="left")
        self.junk_clean_btn = ttk.Button(bar, text="Clean selected", style="Ghost.TButton", command=self.clean_junk)
        self.junk_clean_btn.pack(side="left", padx=px(8))
        if core.IS_WINDOWS:
            ttk.Button(bar, text="Windows Disk Cleanup (old Windows versions, etc.)", style="Ghost.TButton",
                       command=lambda: subprocess.Popen("cleanmgr")).pack(side="left")

        rows = self._card(view, fill="x")
        rows.columnconfigure(0, weight=1)
        self.junk_vars, self.junk_size_labels = {}, {}
        admin = is_admin()
        for i, cat in enumerate(self.junk):
            if i:
                tk.Frame(rows, bg=theme.LINE, height=1).grid(row=3 * i - 1, column=0, columnspan=2, sticky="ew",
                                                             pady=px(8))
            var = tk.BooleanVar(value=admin or not cat.needs_admin)
            self.junk_vars[cat.key] = var
            name = cat.name + ("  (needs administrator)" if cat.needs_admin and not admin else "")
            ttk.Checkbutton(rows, text=name, variable=var, style="Bold.Card.TCheckbutton",
                            command=self._update_junk_total).grid(row=3 * i, column=0, sticky="w")
            size_label = ttk.Label(rows, text="-", style="Size.TLabel")
            size_label.grid(row=3 * i, column=1, sticky="e")
            self.junk_size_labels[cat.key] = size_label
            ttk.Label(rows, text=cat.description, style="CardSub.TLabel", wraplength=px(760)).grid(
                row=3 * i + 1, column=0, columnspan=2, sticky="w", padx=(px(24), 0))

    def _duplicates_view(self):
        px = self.theme.px
        view = self._view("dups", "Duplicates", "Identical files (1 MB or bigger) in your own folders. "
                                               "Keep one copy and remove the rest.")
        card = self._card(view, fill="both", expand=True)
        top = ttk.Frame(card, style="Plain.TFrame")
        top.pack(fill="x", pady=(0, px(10)))
        ttk.Button(top, text="Find duplicates", style="Primary.TButton", command=self.find_duplicates).pack(side="left")
        self.dup_status = ttk.Label(top, text="Run a scan first, then press Find duplicates.", style="CardSub.TLabel")
        self.dup_status.pack(side="left", padx=px(12))
        frame, self.dup_tree = make_tree(card, [("size", "Size", 90), ("modified", "Modified", 140),
                                                ("folder", "Folder", 480)], tree_title="File", tree_width=300)
        self.dup_tree.bind("<Double-1>", lambda e: self.open_selected(self.dup_tree))
        self._action_bar(card, self.dup_tree, export=self.export_duplicates,
                         extra=[("Select extra copies", self.select_extra_copies)]
                         ).pack(fill="x", side="bottom", pady=(px(10), 0))
        frame.pack(fill="both", expand=True)

    def _findings_view(self, name, title, subtitle, columns, show_repair):
        view = self._view(name, title, subtitle)
        card = self._card(view, fill="both", expand=True)
        frame, tree = make_tree(card, columns)
        tree.bind("<Double-1>", lambda e: self.open_selected(tree))
        self._action_bar(card, tree, show_repair).pack(fill="x", side="bottom", pady=(self.theme.px(10), 0))
        frame.pack(fill="both", expand=True)
        return tree

    def _all_files_view(self):
        px = self.theme.px
        view = self._view("files", "All files", "Every file from your last scan. Search by name or folder.")
        card = self._card(view, fill="both", expand=True)
        top = ttk.Frame(card, style="Plain.TFrame")
        top.pack(fill="x", pady=(0, px(10)))
        self.search_var = tk.StringVar()
        entry = ttk.Entry(top, textvariable=self.search_var, width=42)
        entry.pack(side="left")
        entry.bind("<Return>", lambda e: self.refresh_all_files())
        ttk.Button(top, text="Search", style="Primary.TButton", command=self.refresh_all_files).pack(side="left", padx=px(8))
        self.largest_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(top, text="Largest first", variable=self.largest_var, style="Card.TCheckbutton",
                        command=self.refresh_all_files).pack(side="left", padx=px(8))
        self.all_label = ttk.Label(top, text="Run a scan to list every file.", style="Hint.TLabel")
        self.all_label.pack(side="left", padx=px(8))
        frame, self.files_tree = make_tree(card, [("name", "File", 260), ("size", "Size", 90),
                                                  ("modified", "Modified", 140), ("folder", "Folder", 520)])
        self.files_tree.bind("<Double-1>", lambda e: self.open_selected(self.files_tree))
        self._action_bar(card, self.files_tree, export=self.export_all_files).pack(fill="x", side="bottom", pady=(px(10), 0))
        frame.pack(fill="both", expand=True)

    def _quarantine_view(self):
        px = self.theme.px
        view = self._view("quarantine", "Quarantine", "Files locked away so they cannot run. Restore one if it was "
                                                     "a mistake, or delete it for good.")
        card = self._card(view, fill="both", expand=True)
        frame, self.q_tree = make_tree(card, [("name", "File", 240), ("reason", "Reason", 360),
                                              ("date", "Quarantined on", 130), ("original", "Original location", 400)])
        bar = ttk.Frame(card, style="Plain.TFrame")
        bar.pack(fill="x", side="bottom", pady=(px(10), 0))
        ttk.Button(bar, text="Restore", style="Ghost.TButton", command=self.restore_quarantined).pack(side="left")
        ttk.Button(bar, text="Delete for good", style="Danger.TButton", command=self.delete_quarantined).pack(side="left", padx=px(6))
        ttk.Button(bar, text="Refresh", style="Ghost.TButton", command=self.refresh_quarantine).pack(side="left")
        frame.pack(fill="both", expand=True)

    def restart_as_admin(self):
        if self.scan_thread and self.scan_thread.is_alive() or self.worker and self.worker.is_alive():
            if not messagebox.askyesno(APP_NAME, "A job is running. Stop it and restart as administrator?"):
                return
            if self.scanner:
                self.scanner.stop()
        import ctypes
        if getattr(sys, "frozen", False):
            exe, args = sys.executable, ""
        else:
            exe, args = sys.executable, f'"{os.path.abspath(sys.argv[0])}"'
        if ctypes.windll.shell32.ShellExecuteW(None, "runas", exe, args, None, 1) > 32:
            self.root.destroy()

    # ------------------------------------------------------------------ drives & space view

    def refresh_drives(self):
        for child in self.drives_box.winfo_children():
            child.destroy()
        px = self.theme.px
        ttk.Label(self.drives_box, text="Your drives", style="H3.TLabel").grid(
            row=0, column=0, columnspan=3, sticky="w", pady=(0, px(6)))
        row = 1
        for drive in core.list_drives():
            usage = storage.drive_usage(drive)
            if not usage:
                continue
            total, used, free = usage
            low = bool(total) and free / total < 0.1
            ttk.Label(self.drives_box, text=drive, style="H3.TLabel", width=6).grid(row=row, column=0, sticky="w")
            ttk.Progressbar(self.drives_box, length=px(360), maximum=total or 1, value=used,
                            style=("Low" if low else "Green") + ".Horizontal.TProgressbar").grid(
                row=row, column=1, sticky="w", padx=px(12), pady=px(3))
            ttk.Label(self.drives_box, text=f"{human_size(used)} used of {human_size(total)}  \u00b7  "
                                            f"{human_size(free)} free" + ("  -  almost full!" if low else ""),
                      style="CardSub.TLabel").grid(row=row, column=2, sticky="w")
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
        for name, (size, files) in sorted(report.by_type.items(), key=lambda kv: kv[1][0], reverse=True):
            iid = self.type_tree.insert("", "end", values=(name, human_size(size),
                                                           share_bar(size, report.total_bytes), f"{files:,}"))
            self.type_tree.sizes[iid] = size
        for e in report.biggest:
            iid = self.big_tree.insert("", "end", values=(os.path.basename(e.path), human_size(e.size),
                                                          storage.file_type(e.path), os.path.dirname(e.path)))
            self.big_tree.paths[iid] = e.path
            self.big_tree.sizes[iid] = e.size

    def _insert_folder(self, parent_iid, folder, parent_size, label=None):
        size, files = self.report.totals[folder]
        iid = self.folder_tree.insert(parent_iid, "end", text=label or os.path.basename(folder) or folder,
                                      values=(human_size(size), share_bar(size, parent_size), f"{files:,}"))
        self.folder_tree.folders[iid] = folder
        if folder in self.report.children:
            self.folder_tree.insert(iid, "end", text="loading...")  # placeholder so it gets an arrow
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
            tree.insert(iid, "end", text="(files directly in this folder)",
                        values=(human_size(here[0]), share_bar(here[0], size), f"{here[1]:,}"))

    def _open_folder_node(self, _event):
        iid = self.folder_tree.focus()
        children = self.folder_tree.get_children(iid)
        if iid in self.folder_tree.folders and len(children) == 1 and \
                self.folder_tree.item(children[0], "text") == "loading...":
            self._fill_folder(iid)

    def _selected_folder(self):
        tree = self.folder_tree
        for iid in tree.selection():
            if iid in tree.folders:
                return tree.folders[iid]
            parent = tree.parent(iid)  # "(files directly in this folder)" row
            if parent in tree.folders:
                return tree.folders[parent]
        messagebox.showinfo(APP_NAME, "Select a folder first.")
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
        folder = filedialog.askdirectory(title="Choose a folder to scan")
        if folder and os.path.normpath(folder) not in self.extra_folders:
            self.extra_folders.append(os.path.normpath(folder))
            self.folders_label.config(text="Also: " + ";  ".join(self.extra_folders))

    def clear_folders(self):
        self.extra_folders = []
        self.folders_label.config(text="")

    def _busy(self):
        if self.scan_thread and self.scan_thread.is_alive() or self.worker and self.worker.is_alive():
            messagebox.showinfo(APP_NAME, "Please wait for the current job to finish (or press Stop) first.")
            return True
        return False

    def start_scan(self):
        if self._busy():
            return
        roots = [d for d, var in self.drive_vars.items() if var.get()]
        roots += [f for f in self.extra_folders
                  if not any(os.path.normcase(f).startswith(os.path.normcase(r)) for r in roots)]
        if not roots:
            messagebox.showinfo(APP_NAME, "Tick at least one drive or add a folder to scan.")
            return

        self.all_files = []
        self.findings = {}
        self.report = None
        for tree in (self.threat_tree, self.corrupt_tree, self.files_tree, self.dup_tree,
                     self.folder_tree, self.type_tree, self.big_tree):
            clear_tree(tree)
        self.dup_status.config(text="Run a scan first, then press Find duplicates.")
        self._update_nav_counts()
        self.all_label.config(text="Scanning... the list fills in when the scan finishes (or press Search).")
        for value in self.metric_values.values():
            value.config(text="0")
        self.status_pill.config(text="Scanning...", style="Pill.TLabel")
        self.status_detail.config(text="Starting...")

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
        self.progress.config(mode="indeterminate")
        self.progress.start(12)

    def _run_scan(self):
        try:
            self.scanner.run()
            self.events.put(("status", "Adding up folder sizes..."))
            self.report = storage.StorageReport.build(self.all_files)
        except Exception as exc:  # report anything unexpected instead of dying silently
            self.events.put(("status", f"Scan stopped by an error: {exc}"))
        self.events.put(("done", None))

    def stop_scan(self):
        if self.scanner and self.scan_thread and self.scan_thread.is_alive():
            self.scanner.stop()
            self.status_detail.config(text="Stopping...")

    def poll(self):
        try:
            while True:
                kind, *values = self.events.get_nowait()
                if kind == "finding":
                    self._add_finding(values[0])
                elif kind == "status":
                    self.status_detail.config(text=values[0])
                elif kind == "done":
                    self._scan_done()
                elif kind == "junk_size":
                    self._show_junk_size(*values)
                elif kind == "junk_done":
                    self._junk_done(*values)
                elif kind == "dup_progress":
                    self.dup_status.config(text=f"Comparing files... {values[0]:,} of {values[1]:,} size groups")
                elif kind == "dup_done":
                    self._show_duplicates(values[0])
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
            self.side_status.config(text=f"Scanning... {self.scanner.files_seen:,} files  \u00b7  "
                                         f"{elapsed // 60}m {elapsed % 60:02d}s")
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
        problem = finding.reason if finding.kind != core.SUSPICIOUS else "Suspicious: " + finding.reason
        iid = tree.insert("", "end", values=(os.path.basename(finding.path), problem, finding.source,
                                             human_size(finding.size), os.path.dirname(finding.path)))
        tree.paths[iid] = finding.path
        tree.sizes[iid] = finding.size
        self._update_nav_counts()

    def _update_nav_counts(self):
        for key, title, count in (("threats", "Viruses & threats", len(self.threat_tree.paths)),
                                  ("corrupt", "Corrupted files", len(self.corrupt_tree.paths)),
                                  ("dups", "Duplicates", len(self.dup_tree.get_children("")))):
            self.nav_buttons[key].config(text=f"{title}   {count}" if count else title)

    def _scan_done(self):
        self.progress.stop()
        self.start_btn.config(state="normal")
        self.stop_btn.config(state="disabled")
        s = self.scanner
        threats, corrupted = len(self.threat_tree.paths), len(self.corrupt_tree.paths)
        total = self.report.total_bytes if self.report else 0
        summary = f"Checked {s.files_seen:,} files using {human_size(total)}."
        if self.opt_threats.get() or self.opt_defender.get():
            summary += f" {threats} threat(s)."
        if self.opt_corrupt.get():
            summary += f" {corrupted} corrupted file(s)."
        if s.skipped_dirs:
            summary += f" {s.skipped_dirs:,} protected folder(s) could not be opened."
        if s.cancel.is_set():
            self.status_pill.config(text="Stopped", style="PillOff.TLabel")
        elif threats:
            self.status_pill.config(text=f"{threats} threat{'s' if threats != 1 else ''} found", style="PillOff.TLabel")
        else:
            self.status_pill.config(text="Scan finished", style="PillOn.TLabel")
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
            messagebox.showwarning(APP_NAME, "\n\n".join(s.errors))
        elif not s.cancel.is_set():
            biggest = ""
            if self.report and self.report.biggest:
                top = self.report.biggest[0]
                biggest = f"\n\nYour biggest file is {os.path.basename(top.path)} ({human_size(top.size)})."
            messagebox.showinfo(APP_NAME, summary + biggest + "\n\nSee 'What's using space' for the biggest "
                                "folders and files, and 'Junk files' to free space safely.")

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
        matched_size = sum(e.size for e in matches)
        shown = (f"Showing {min(len(matches), MAX_LISTED_FILES):,} of {len(matches):,} "
                 f"{'matching ' if query else ''}files ({human_size(matched_size)})")
        if len(matches) > MAX_LISTED_FILES:
            shown += " - search to narrow down, or Export report for the full list"
        self.all_label.config(text=shown)

    # ------------------------------------------------------------------ junk

    def measure_junk(self):
        if self._busy():
            return
        self.junk_sizes = {}
        for label in self.junk_size_labels.values():
            label.config(text="...")
        self.junk_status.config(text="Checking...")
        self.worker = threading.Thread(target=self._measure_junk_worker, daemon=True)
        self.worker.start()

    def _measure_junk_worker(self):
        for cat in self.junk:
            try:
                size, files = storage.measure_junk(cat)
            except OSError:
                size, files = 0, 0
            self.events.put(("junk_size", cat.key, size, files))
        self.events.put(("junk_done", None))

    def _show_junk_size(self, key, size, files):
        self.junk_sizes[key] = size
        self.junk_size_labels[key].config(text=human_size(size) if files else "nothing")
        self._update_junk_total()

    def _update_junk_total(self):
        if not self.junk_sizes:
            return
        total = sum(size for key, size in self.junk_sizes.items() if self.junk_vars[key].get())
        self.junk_status.config(text=f"You can free {human_size(total)}")

    def _junk_done(self, result):
        if result is None:  # measuring finished
            self._update_junk_total()
            return
        freed, deleted, skipped = result
        self.refresh_drives()
        message = f"Freed {human_size(freed)} ({deleted:,} files removed)."
        if skipped:
            message += (f"\n\n{skipped:,} files were skipped because a program is using them "
                        "(close your browser and other programs, then try again).")
        self.junk_status.config(text=f"Freed {human_size(freed)}")
        messagebox.showinfo(APP_NAME, message)
        self.measure_junk()

    def clean_junk(self):
        if self._busy():
            return
        chosen = [c for c in self.junk if self.junk_vars[c.key].get()]
        if not chosen:
            messagebox.showinfo(APP_NAME, "Tick at least one kind of junk to clean.")
            return
        known = sum(self.junk_sizes.get(c.key, 0) for c in chosen)
        amount = f" ({human_size(known)})" if self.junk_sizes else ""
        if not messagebox.askyesno(APP_NAME, f"Delete these junk files{amount}?\n\n"
                                   + "\n".join("  - " + c.name for c in chosen)
                                   + "\n\nThis cannot be undone. Files in use are skipped.", default="no"):
            return
        self.junk_status.config(text="Cleaning...")

        def work():
            freed = deleted = skipped = 0
            for cat in chosen:
                try:
                    f, d, s = storage.clean_junk(cat)
                except OSError:
                    continue
                freed, deleted, skipped = freed + f, deleted + d, skipped + s
            self.events.put(("junk_done", (freed, deleted, skipped)))

        self.worker = threading.Thread(target=work, daemon=True)
        self.worker.start()

    # ------------------------------------------------------------------ duplicates

    def find_duplicates(self):
        if self._busy():
            return
        if not self.all_files:
            messagebox.showinfo(APP_NAME, "Run a scan first, then look for duplicates.")
            return
        files = list(self.all_files)
        self.dup_status.config(text="Comparing files...")
        clear_tree(self.dup_tree)
        self.worker = threading.Thread(target=lambda: self.events.put(("dup_done", storage.find_duplicates(
            files, on_progress=lambda d, t: self.events.put(("dup_progress", d, t)) if d % 50 == 0 else None))),
            daemon=True)
        self.worker.start()

    def _show_duplicates(self, groups):
        tree = self.dup_tree
        clear_tree(tree)
        wasted = 0
        for n, group in enumerate(groups):
            extra = group[0].size * (len(group) - 1)
            wasted += extra
            parent = tree.insert("", "end", open=n < 30,
                                 text=f"{len(group)} copies of {os.path.basename(group[0].path)}",
                                 values=(f"{human_size(extra)} extra", "", ""))
            tree.sizes[parent] = extra
            for e in group:
                iid = tree.insert(parent, "end", text=os.path.basename(e.path),
                                  values=(human_size(e.size), time.strftime("%Y-%m-%d %H:%M", time.localtime(e.mtime)),
                                          os.path.dirname(e.path)))
                tree.paths[iid] = e.path
                tree.sizes[iid] = e.size
        self.dup_status.config(text=f"{len(groups):,} set{'s' if len(groups) != 1 else ''} of duplicates - {human_size(wasted)} could be freed"
                               if groups else "No duplicate files found.")
        self._update_nav_counts()

    def select_extra_copies(self):
        """Selects every copy except the oldest one in each set."""
        tree = self.dup_tree
        extra = [iid for parent in tree.get_children("") for iid in tree.get_children(parent)[1:]]
        tree.selection_set(extra)
        if not extra:
            messagebox.showinfo(APP_NAME, "Press 'Find duplicates' first.")

    # ------------------------------------------------------------------ removing files

    def _selected_paths(self, tree):
        return [(iid, tree.paths[iid]) for iid in tree.selection() if iid in tree.paths]

    def open_selected(self, tree):
        selected = self._selected_paths(tree)
        if not selected:
            messagebox.showinfo(APP_NAME, "Select a file first.")
            return
        for _, path in selected[:5]:
            open_location(path)

    def remove_selected(self, tree, mode):
        if self._busy():
            return
        selected = self._selected_paths(tree)
        if not selected:
            messagebox.showinfo(APP_NAME, "Select one or more files in the list first "
                                          "(click, or Ctrl+click / Shift+click for several).")
            return
        paths = list(dict.fromkeys(p for _, p in selected))

        protected = [p for p in paths if core.is_protected(p)]
        if protected:
            keep_going = messagebox.askyesno(
                APP_NAME, f"{len(protected)} of the selected files are Windows system files:\n\n"
                + "\n".join(protected[:5]) + "\n\nRemoving them can stop Windows from working. For a "
                "corrupted system file, use 'Repair Windows system files' instead.\n\n"
                "Remove these system files anyway?", icon="warning", default="no")
            if not keep_going:
                paths = [p for p in paths if p not in protected]
                if not paths:
                    return

        if tree is self.dup_tree:
            for parent in tree.get_children(""):
                group = {tree.paths[i] for i in tree.get_children(parent)}
                if group and group <= set(paths):
                    if not messagebox.askyesno(APP_NAME, "You selected every copy of at least one file, so no copy "
                                               "would be left.\n\nTip: use 'Select extra copies' to keep one of "
                                               "each.\n\nContinue anyway?", icon="warning", default="no"):
                        return
                    break

        listing = "\n".join(os.path.basename(p) for p in paths[:10])
        if len(paths) > 10:
            listing += f"\n...and {len(paths) - 10} more"
        size = human_size(sum(tree.sizes.get(iid, 0) for iid, p in selected if p in paths))
        questions = {
            "quarantine": f"Move {len(paths)} file(s) ({size}) to quarantine?\n\n{listing}\n\n"
                          "They will be locked away and can be restored from the Quarantine tab.",
            "recycle": f"Move {len(paths)} file(s) ({size}) to the Recycle Bin?\n\n{listing}\n\n"
                       "You can still restore them. They keep using space until you empty the Recycle Bin "
                       "(Junk files tab).",
            "delete": f"PERMANENTLY delete {len(paths)} file(s) ({size})?\n\n{listing}\n\n"
                      "This cannot be undone.",
        }
        if not messagebox.askyesno(APP_NAME, questions[mode], icon="warning", default="no"):
            return

        done, failed = [], []
        for path in paths:
            finding = self.findings.get(path)
            try:
                if mode == "quarantine":
                    core.quarantine(path, finding.reason if finding else "Chosen by user")
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

        verb = {"quarantine": "quarantined", "recycle": "moved to the Recycle Bin", "delete": "deleted"}[mode]
        message = f"{len(done)} file(s) {verb}."
        if failed:
            message += (f"\n\n{len(failed)} could not be removed (they may be in use - close the program "
                        "using them or run NoorCleaner as administrator):\n\n" + "\n".join(failed[:10]))
            messagebox.showwarning(APP_NAME, message)
        else:
            messagebox.showinfo(APP_NAME, message)

    def _drop_rows(self, paths):
        gone = set(paths)
        for tree in (self.threat_tree, self.corrupt_tree, self.files_tree, self.big_tree, self.dup_tree):
            for iid, path in list(tree.paths.items()):
                if path in gone:
                    tree.delete(iid)
                    del tree.paths[iid]
                    tree.sizes.pop(iid, None)
        for parent in self.dup_tree.get_children(""):
            if len(self.dup_tree.get_children(parent)) < 2:
                for iid in self.dup_tree.get_children(parent):
                    self.dup_tree.paths.pop(iid, None)
                self.dup_tree.delete(parent)
        for path in gone:
            self.findings.pop(path, None)
        self.all_files = [e for e in self.all_files if e.path not in gone]
        self._update_nav_counts()

    # ------------------------------------------------------------------ reports

    def _save_csv(self, title, name, header, rows):
        target = filedialog.asksaveasfilename(title=title, defaultextension=".csv",
                                              initialfile=f"NoorCleaner-{name}-{time.strftime('%Y%m%d-%H%M')}.csv",
                                              filetypes=[("CSV (opens in Excel)", "*.csv")])
        if not target:
            return
        with open(target, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(header)
            writer.writerows(rows)
        messagebox.showinfo(APP_NAME, f"Saved to:\n{target}")

    def export_findings(self):
        if not self.findings:
            messagebox.showinfo(APP_NAME, "There are no findings to export yet.")
            return
        self._save_csv("Save report", "report", ["Type", "File", "Problem", "Found by", "Size (bytes)"],
                       ([fd.kind, fd.path, fd.reason, fd.source, fd.size] for fd in self.findings.values()))

    def export_all_files(self):
        if not self.all_files:
            messagebox.showinfo(APP_NAME, "Run a scan first.")
            return
        self._save_csv("Save file list", "all-files", ["File", "Size (bytes)", "Type", "Modified"],
                       ([e.path, e.size, storage.file_type(e.path),
                         time.strftime("%Y-%m-%d %H:%M", time.localtime(e.mtime))]
                        for e in sorted(self.all_files, key=lambda e: e.size, reverse=True)))

    def export_duplicates(self):
        tree = self.dup_tree
        rows = [[n, tree.paths[iid], tree.sizes.get(iid, 0)]
                for n, parent in enumerate(tree.get_children(""), 1) for iid in tree.get_children(parent)]
        if not rows:
            messagebox.showinfo(APP_NAME, "Press 'Find duplicates' first.")
            return
        self._save_csv("Save duplicates list", "duplicates", ["Set", "File", "Size (bytes)"], rows)

    def repair_windows(self):
        if not messagebox.askyesno(APP_NAME, "This opens Microsoft's own repair tools (DISM and System File "
                                             "Checker) as administrator. They fix corrupted Windows system "
                                             "files and can take 15-30 minutes.\n\nStart the repair now?"):
            return
        try:
            core.repair_windows_system_files()
        except RuntimeError as exc:
            messagebox.showerror(APP_NAME, str(exc))

    # ------------------------------------------------------------------ quarantine

    def refresh_quarantine(self):
        tree = self.q_tree
        clear_tree(tree)
        tree.stored = {}
        for item in core.list_quarantine():
            iid = tree.insert("", "end", values=(os.path.basename(item["original"]), item.get("reason", ""),
                                                 item.get("date", ""), item["original"]))
            tree.stored[iid] = item["stored"]

    def _selected_quarantine(self):
        chosen = [self.q_tree.stored[i] for i in self.q_tree.selection() if i in self.q_tree.stored]
        if not chosen:
            messagebox.showinfo(APP_NAME, "Select a quarantined file first.")
        return chosen

    def restore_quarantined(self):
        chosen = self._selected_quarantine()
        if not chosen or not messagebox.askyesno(
                APP_NAME, f"Restore {len(chosen)} file(s) to where they came from?\n\n"
                          "Only do this if you are sure they are safe."):
            return
        errors = []
        for stored in chosen:
            try:
                core.restore_from_quarantine(stored)
            except Exception as exc:
                errors.append(str(exc))
        self.refresh_quarantine()
        if errors:
            messagebox.showwarning(APP_NAME, "Some files could not be restored:\n\n" + "\n".join(errors[:10]))

    def delete_quarantined(self):
        chosen = self._selected_quarantine()
        if not chosen or not messagebox.askyesno(APP_NAME, f"Permanently delete {len(chosen)} quarantined "
                                                           "file(s)? This cannot be undone.",
                                                 icon="warning", default="no"):
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
            messagebox.showwarning(APP_NAME, "Some files could not be deleted:\n\n" + "\n".join(errors[:10]))

    def on_close(self):
        if self.scan_thread and self.scan_thread.is_alive():
            if not messagebox.askyesno(APP_NAME, "A scan is running. Stop it and close NoorCleaner?"):
                return
            self.scanner.stop()
        self.root.destroy()


def main():
    if core.IS_WINDOWS:
        try:
            import ctypes
            ctypes.windll.shcore.SetProcessDpiAwareness(1)  # sharp text on high-DPI screens
        except (AttributeError, OSError):
            pass
    root = tk.Tk()
    icon = os.path.join(getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__))), "assets", "icon.ico")
    if core.IS_WINDOWS and os.path.exists(icon):
        root.iconbitmap(default=icon)
    NoorCleanerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
