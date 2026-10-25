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
import scanner_core as core

APP_NAME = "NoorCleaner"
VERSION = "1.1.0"
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
        tree.column(col, width=width, anchor="e" if col in ("size", "files") else "w",
                    stretch=col not in ("size", "files", "share", "modified"))
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
        root.geometry("1200x800")
        root.minsize(980, 620)
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

        self._build_ui()
        self.refresh_drives()
        self.refresh_quarantine()
        self.root.after(150, self.poll)

    # ------------------------------------------------------------------ layout

    def _build_ui(self):
        style = ttk.Style()
        style.configure("Title.TLabel", font=("Segoe UI", 18, "bold"), foreground="#1f5c4a")
        style.configure("Sub.TLabel", foreground="#555555")
        style.configure("Big.TButton", font=("Segoe UI", 11, "bold"), padding=(18, 6))
        style.configure("Treeview", rowheight=22)

        outer = ttk.Frame(self.root, padding=10)
        outer.pack(fill="both", expand=True)

        header = ttk.Frame(outer)
        header.pack(fill="x")
        ttk.Label(header, text="NoorCleaner", style="Title.TLabel").pack(side="left")
        ttk.Label(header, text="  See what is filling your storage, free up space, and find corrupted files "
                               "and viruses. Nothing is removed unless you choose it.",
                  style="Sub.TLabel").pack(side="left", padx=8)

        where = ttk.LabelFrame(outer, text="What to scan", padding=8)
        where.pack(fill="x", pady=(8, 4))
        self.drive_vars = {}
        drives_row = ttk.Frame(where)
        drives_row.pack(fill="x")
        ttk.Label(drives_row, text="Drives:").pack(side="left", padx=(0, 6))
        for drive in core.list_drives():
            label = core.drive_label(drive)
            var = tk.BooleanVar(value=not any(k in label for k in ("Network", "CD/DVD")))
            self.drive_vars[drive] = var
            ttk.Checkbutton(drives_row, text=label, variable=var).pack(side="left", padx=4)
        ttk.Button(drives_row, text="Add a folder...", command=self.add_folder).pack(side="left", padx=(16, 0))
        ttk.Button(drives_row, text="Clear folders", command=self.clear_folders).pack(side="left", padx=6)
        self.folders_label = ttk.Label(drives_row, text="", style="Sub.TLabel")
        self.folders_label.pack(side="left", padx=6)

        checks = ttk.Frame(where)
        checks.pack(fill="x", pady=(6, 0))
        ttk.Label(checks, text="Also check for:").pack(side="left", padx=(0, 6))
        self.opt_corrupt = tk.BooleanVar(value=True)
        self.opt_threats = tk.BooleanVar(value=True)
        self.opt_defender = tk.BooleanVar(value=False)
        self.opt_deep = tk.BooleanVar(value=False)
        ttk.Checkbutton(checks, text="Corrupted files", variable=self.opt_corrupt).pack(side="left", padx=4)
        ttk.Checkbutton(checks, text="Viruses & suspicious files", variable=self.opt_threats).pack(side="left", padx=4)
        defender_text = ("Full Microsoft Defender virus scan (slow)" if self.defender
                         else "Microsoft Defender (not found on this computer)")
        ttk.Checkbutton(checks, text=defender_text, variable=self.opt_defender,
                        state="normal" if self.defender else "disabled").pack(side="left", padx=4)
        ttk.Checkbutton(checks, text="Deep scan (reads every byte - much slower)",
                        variable=self.opt_deep).pack(side="left", padx=4)

        run = ttk.Frame(outer)
        run.pack(fill="x", pady=4)
        self.start_btn = ttk.Button(run, text="Start scan", style="Big.TButton", command=self.start_scan)
        self.start_btn.pack(side="left")
        self.stop_btn = ttk.Button(run, text="Stop", command=self.stop_scan, state="disabled")
        self.stop_btn.pack(side="left", padx=6)
        status_box = ttk.Frame(run)
        status_box.pack(side="left", fill="x", expand=True, padx=10)
        self.progress = ttk.Progressbar(status_box, mode="indeterminate")
        self.progress.pack(fill="x")
        self.status = ttk.Label(status_box, text=self._idle_text())
        self.status.pack(fill="x", pady=(3, 0))
        self.counts = ttk.Label(status_box, text="", style="Sub.TLabel")
        self.counts.pack(fill="x")

        self.tabs = ttk.Notebook(outer)
        self.tabs.pack(fill="both", expand=True, pady=(6, 0))
        self.space_tab = self._space_tab()
        self.junk_tab = self._junk_tab()
        self.dup_tab = self._duplicates_tab()
        finding_cols = [("name", "File", 220), ("problem", "Problem", 380), ("source", "Found by", 120),
                        ("size", "Size", 80), ("folder", "Folder", 330)]
        self.threat_tab, self.threat_tree = self._findings_tab(finding_cols, show_repair=False)
        self.corrupt_tab, self.corrupt_tree = self._findings_tab(finding_cols, show_repair=True)
        self.tabs.add(self.space_tab, text="What's using space")
        self.tabs.add(self.junk_tab, text="Junk files")
        self.tabs.add(self.dup_tab, text="Duplicates")
        self.tabs.add(self.threat_tab, text="Viruses & threats (0)")
        self.tabs.add(self.corrupt_tab, text="Corrupted files (0)")
        self.tabs.add(self._all_files_tab(), text="All files")
        self.tabs.add(self._quarantine_tab(), text="Quarantine")

    def _idle_text(self):
        tip = "" if is_admin() else "  Tip: right-click NoorCleaner > 'Run as administrator' to include protected folders."
        return "Ready. Tick the drives to scan and press Start scan." + tip

    def _action_bar(self, parent, tree, show_repair=False, export=None, extra=(), compact=False):
        bar = ttk.Frame(parent)
        if not compact:
            ttk.Button(bar, text="Select all", command=lambda: tree.selection_set(list(tree.paths))).pack(side="left")
        for text, command in extra:
            ttk.Button(bar, text=text, command=command).pack(side="left", padx=(4, 0))
        ttk.Button(bar, text="Open location" if compact else "Open file location",
                   command=lambda: self.open_selected(tree)).pack(side="left", padx=4)
        ttk.Separator(bar, orient="vertical").pack(side="left", fill="y", padx=8)
        if not compact:
            ttk.Button(bar, text="Quarantine", command=lambda: self.remove_selected(tree, "quarantine")).pack(side="left")
        ttk.Button(bar, text="Recycle Bin" if compact else "Move to Recycle Bin",
                   command=lambda: self.remove_selected(tree, "recycle")).pack(side="left", padx=4)
        ttk.Button(bar, text="Delete" if compact else "Delete permanently",
                   command=lambda: self.remove_selected(tree, "delete")).pack(side="left")
        ttk.Button(bar, text="Export..." if compact else "Export report...",
                   command=export or self.export_findings).pack(side="right")
        if show_repair:
            ttk.Button(bar, text="Repair Windows system files", command=self.repair_windows).pack(side="right", padx=4)
        return bar

    def _space_tab(self):
        tab = ttk.Frame(self.tabs, padding=6)
        self.drives_box = ttk.LabelFrame(tab, text="Your drives", padding=6)
        self.drives_box.pack(fill="x")

        panes = ttk.PanedWindow(tab, orient="horizontal")
        panes.pack(fill="both", expand=True, pady=(6, 0))

        left = ttk.LabelFrame(panes, text="Biggest folders (click the arrows to look inside)", padding=4)
        frame, self.folder_tree = make_tree(left, [("size", "Size", 85), ("share", "Share", 60), ("files", "Files", 70)],
                                            tree_title="Folder", tree_width=280, sortable=False)
        self.folder_tree.folders = {}  # iid -> folder path
        self.folder_tree.bind("<<TreeviewOpen>>", self._open_folder_node)
        self.folder_tree.bind("<Double-1>", lambda e: self.open_selected_folder())
        bar = ttk.Frame(left)
        bar.pack(fill="x", side="bottom", pady=(4, 0))
        ttk.Button(bar, text="Open folder", command=self.open_selected_folder).pack(side="left")
        ttk.Button(bar, text="Show its files in 'All files'", command=self.show_folder_files).pack(side="left", padx=4)
        frame.pack(fill="both", expand=True)
        panes.add(left, weight=1)

        right = ttk.PanedWindow(panes, orient="vertical")
        types_box = ttk.LabelFrame(right, text="By type", padding=4)
        frame, self.type_tree = make_tree(types_box, [("type", "Type", 170), ("size", "Size", 85),
                                                      ("share", "Share", 60), ("files", "Files", 70)], height=6)
        frame.pack(fill="both", expand=True)
        right.add(types_box, weight=1)
        big_box = ttk.LabelFrame(right, text="Biggest files", padding=4)
        frame, self.big_tree = make_tree(big_box, [("name", "File", 200), ("size", "Size", 85),
                                                   ("type", "Type", 120), ("folder", "Folder", 260)])
        self.big_tree.bind("<Double-1>", lambda e: self.open_selected(self.big_tree))
        self._action_bar(big_box, self.big_tree, export=self.export_all_files, compact=True).pack(fill="x", side="bottom", pady=(4, 0))
        frame.pack(fill="both", expand=True)
        right.add(big_box, weight=3)
        panes.add(right, weight=1)
        return tab

    def _junk_tab(self):
        tab = ttk.Frame(self.tabs, padding=10)
        ttk.Label(tab, text="Files that build up over time and are safe to delete. Press 'Check junk' to see how "
                            "much space you can free, untick anything you want to keep, then 'Clean selected'.",
                  style="Sub.TLabel", wraplength=1050).pack(fill="x")
        bar = ttk.Frame(tab)
        bar.pack(fill="x", pady=8)
        self.junk_check_btn = ttk.Button(bar, text="Check junk", style="Big.TButton", command=self.measure_junk)
        self.junk_check_btn.pack(side="left")
        self.junk_clean_btn = ttk.Button(bar, text="Clean selected", command=self.clean_junk)
        self.junk_clean_btn.pack(side="left", padx=6)
        if core.IS_WINDOWS:
            ttk.Button(bar, text="Open Windows Disk Cleanup (old Windows versions, etc.)",
                       command=lambda: subprocess.Popen("cleanmgr")).pack(side="left", padx=6)
        self.junk_status = ttk.Label(bar, text="", font=("Segoe UI", 11, "bold"))
        self.junk_status.pack(side="left", padx=12)

        grid = ttk.Frame(tab)
        grid.pack(fill="x")
        grid.columnconfigure(2, weight=1)
        self.junk_vars, self.junk_size_labels = {}, {}
        admin = is_admin()
        for row, cat in enumerate(self.junk):
            var = tk.BooleanVar(value=admin or not cat.needs_admin)
            self.junk_vars[cat.key] = var
            name = cat.name + ("  (needs administrator)" if cat.needs_admin and not admin else "")
            ttk.Checkbutton(grid, text=name, variable=var, command=self._update_junk_total).grid(
                row=row, column=0, sticky="w", pady=3)
            size_label = ttk.Label(grid, text="-", width=12, anchor="e", font=("Segoe UI", 10, "bold"))
            size_label.grid(row=row, column=1, sticky="e", padx=12)
            self.junk_size_labels[cat.key] = size_label
            ttk.Label(grid, text=cat.description, style="Sub.TLabel", wraplength=640).grid(
                row=row, column=2, sticky="w")
        return tab

    def _duplicates_tab(self):
        tab = ttk.Frame(self.tabs, padding=6)
        top = ttk.Frame(tab)
        top.pack(fill="x", pady=(0, 6))
        ttk.Button(top, text="Find duplicates", command=self.find_duplicates).pack(side="left")
        ttk.Label(top, text="Identical files (1 MB or bigger) in your own folders - keep one copy, remove the rest. "
                            "Run a scan first.", style="Sub.TLabel").pack(side="left", padx=8)
        self.dup_status = ttk.Label(top, text="", font=("Segoe UI", 10, "bold"))
        self.dup_status.pack(side="left", padx=8)
        frame, self.dup_tree = make_tree(tab, [("size", "Size", 90), ("modified", "Modified", 140),
                                               ("folder", "Folder", 520)], tree_title="File", tree_width=320)
        self.dup_tree.bind("<Double-1>", lambda e: self.open_selected(self.dup_tree))
        self._action_bar(tab, self.dup_tree, export=self.export_duplicates,
                         extra=[("Select extra copies", self.select_extra_copies)]
                         ).pack(fill="x", side="bottom", pady=(6, 0))
        frame.pack(fill="both", expand=True)
        return tab

    def _findings_tab(self, columns, show_repair):
        tab = ttk.Frame(self.tabs, padding=6)
        frame, tree = make_tree(tab, columns)
        tree.bind("<Double-1>", lambda e: self.open_selected(tree))
        self._action_bar(tab, tree, show_repair).pack(fill="x", side="bottom", pady=(6, 0))
        frame.pack(fill="both", expand=True)
        return tab, tree

    def _all_files_tab(self):
        tab = ttk.Frame(self.tabs, padding=6)
        top = ttk.Frame(tab)
        top.pack(fill="x", pady=(0, 6))
        ttk.Label(top, text="Search:").pack(side="left")
        self.search_var = tk.StringVar()
        entry = ttk.Entry(top, textvariable=self.search_var, width=40)
        entry.pack(side="left", padx=4)
        entry.bind("<Return>", lambda e: self.refresh_all_files())
        ttk.Button(top, text="Search / refresh", command=self.refresh_all_files).pack(side="left")
        self.largest_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(top, text="Largest first", variable=self.largest_var,
                        command=self.refresh_all_files).pack(side="left", padx=8)
        self.all_label = ttk.Label(top, text="Run a scan to list every file.", style="Sub.TLabel")
        self.all_label.pack(side="left", padx=8)
        frame, self.files_tree = make_tree(tab, [("name", "File", 260), ("size", "Size", 90),
                                                 ("modified", "Modified", 140), ("folder", "Folder", 560)])
        self.files_tree.bind("<Double-1>", lambda e: self.open_selected(self.files_tree))
        self._action_bar(tab, self.files_tree, export=self.export_all_files).pack(fill="x", side="bottom", pady=(6, 0))
        frame.pack(fill="both", expand=True)
        self.all_files_tab = tab
        return tab

    def _quarantine_tab(self):
        tab = ttk.Frame(self.tabs, padding=6)
        ttk.Label(tab, text="Quarantined files are moved here and renamed so they cannot run. "
                            "Restore one if it was a mistake, or delete it for good.",
                  style="Sub.TLabel").pack(fill="x", pady=(0, 6))
        frame, self.q_tree = make_tree(tab, [("name", "File", 240), ("reason", "Reason", 360),
                                             ("date", "Quarantined on", 130), ("original", "Original location", 420)])
        bar = ttk.Frame(tab)
        bar.pack(fill="x", side="bottom", pady=(6, 0))
        ttk.Button(bar, text="Restore", command=self.restore_quarantined).pack(side="left")
        ttk.Button(bar, text="Delete for good", command=self.delete_quarantined).pack(side="left", padx=4)
        ttk.Button(bar, text="Refresh", command=self.refresh_quarantine).pack(side="left")
        frame.pack(fill="both", expand=True)
        return tab

    # ------------------------------------------------------------------ drives & space view

    def refresh_drives(self):
        for child in self.drives_box.winfo_children():
            child.destroy()
        row = 0
        for drive in core.list_drives():
            usage = storage.drive_usage(drive)
            if not usage:
                continue
            total, used, free = usage
            ttk.Label(self.drives_box, text=drive, width=6, font=("Segoe UI", 10, "bold")).grid(row=row, column=0, sticky="w")
            bar = ttk.Progressbar(self.drives_box, length=380, maximum=total or 1, value=used)
            bar.grid(row=row, column=1, sticky="w", padx=8, pady=2)
            warn = "  - almost full!" if total and free / total < 0.1 else ""
            ttk.Label(self.drives_box, text=f"{human_size(used)} used of {human_size(total)}  -  "
                                            f"{human_size(free)} free{warn}").grid(row=row, column=2, sticky="w")
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
            self.tabs.select(self.all_files_tab)

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
        self.dup_status.config(text="")
        self._update_tab_titles()
        self.all_label.config(text="Scanning... the list fills in when the scan finishes (or press Search / refresh).")

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
            self.status.config(text="Stopping...")

    def poll(self):
        try:
            while True:
                kind, *values = self.events.get_nowait()
                if kind == "finding":
                    self._add_finding(values[0])
                elif kind == "status":
                    self.status.config(text=values[0])
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
            self.counts.config(text=f"{self.scanner.files_seen:,} files  ·  "
                                    f"{len(self.threat_tree.paths)} threats  ·  "
                                    f"{len(self.corrupt_tree.paths)} corrupted  ·  "
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
        self._update_tab_titles()

    def _update_tab_titles(self):
        self.tabs.tab(self.threat_tab, text=f"Viruses & threats ({len(self.threat_tree.paths)})")
        self.tabs.tab(self.corrupt_tab, text=f"Corrupted files ({len(self.corrupt_tree.paths)})")
        groups = len(self.dup_tree.get_children(""))
        self.tabs.tab(self.dup_tab, text=f"Duplicates ({groups})" if groups else "Duplicates")

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
        self.status.config(text=("Scan stopped. " if s.cancel.is_set() else "Scan finished. ") + summary)
        self.show_storage()
        self.refresh_all_files()
        self.tabs.select(self.threat_tab if threats else self.space_tab)
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
        self._update_tab_titles()

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
        self._update_tab_titles()

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
    NoorCleanerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
