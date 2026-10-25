"""NoorScanner: scans your computer's drives, lists every file, finds corrupted
files and viruses, and removes only the files you choose.

Run with:  python noor_scanner.py
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

import scanner_core as core

APP_NAME = "NoorScanner"
VERSION = "1.0.0"
MAX_LISTED_FILES = 5000  # rows shown at once in "All files"; search narrows it down


def human_size(size):
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{size:.0f} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"


def is_admin():
    if not core.IS_WINDOWS:
        return os.geteuid() == 0
    try:
        import ctypes
        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except OSError:
        return False


def open_location(path):
    if core.IS_WINDOWS:
        subprocess.Popen(f'explorer /select,"{os.path.normpath(path)}"')
    elif sys.platform == "darwin":
        subprocess.Popen(["open", "-R", path])
    else:
        subprocess.Popen(["xdg-open", os.path.dirname(path)])


def make_tree(parent, columns):
    """A Treeview with scrollbars and click-to-sort headings. columns: [(id, title, width)]."""
    frame = ttk.Frame(parent)
    tree = ttk.Treeview(frame, columns=[c[0] for c in columns], show="headings", selectmode="extended")
    for col, title, width in columns:
        tree.heading(col, text=title, command=lambda c=col: sort_tree(tree, c, False))
        tree.column(col, width=width, anchor="e" if col == "size" else "w", stretch=col != "size")
    ys = ttk.Scrollbar(frame, orient="vertical", command=tree.yview)
    xs = ttk.Scrollbar(frame, orient="horizontal", command=tree.xview)
    tree.configure(yscrollcommand=ys.set, xscrollcommand=xs.set)
    tree.grid(row=0, column=0, sticky="nsew")
    ys.grid(row=0, column=1, sticky="ns")
    xs.grid(row=1, column=0, sticky="ew")
    frame.rowconfigure(0, weight=1)
    frame.columnconfigure(0, weight=1)
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


class NoorScannerApp:
    def __init__(self, root):
        self.root = root
        root.title(f"{APP_NAME} {VERSION}")
        root.geometry("1150x740")
        root.minsize(900, 560)
        root.protocol("WM_DELETE_WINDOW", self.on_close)

        self.scanner = None
        self.scan_thread = None
        self.events = queue.Queue()
        self.all_files = []          # FileEntry for every file seen (appended by the scan thread)
        self.findings = {}           # path -> Finding
        self.extra_folders = []
        self.defender = core.find_defender()
        self.signatures = core.load_signatures(core.default_signature_files())

        self._build_ui()
        self.refresh_quarantine()
        self.root.after(150, self.poll)

    # ------------------------------------------------------------------ layout

    def _build_ui(self):
        style = ttk.Style()
        style.configure("Title.TLabel", font=("Segoe UI", 18, "bold"), foreground="#1f5c4a")
        style.configure("Sub.TLabel", foreground="#555555")
        style.configure("Big.TButton", font=("Segoe UI", 11, "bold"), padding=(18, 6))

        outer = ttk.Frame(self.root, padding=12)
        outer.pack(fill="both", expand=True)

        header = ttk.Frame(outer)
        header.pack(fill="x")
        ttk.Label(header, text="NoorScanner", style="Title.TLabel").pack(side="left")
        ttk.Label(header, text="  Find corrupted files and viruses. Nothing is removed unless you choose it.",
                  style="Sub.TLabel").pack(side="left", padx=8)

        # Where to scan
        where = ttk.LabelFrame(outer, text="What to scan", padding=8)
        where.pack(fill="x", pady=(10, 6))
        self.drive_vars = {}
        drives_row = ttk.Frame(where)
        drives_row.pack(fill="x")
        ttk.Label(drives_row, text="Drives:").pack(side="left", padx=(0, 6))
        for drive in core.list_drives():
            label = core.drive_label(drive)
            var = tk.BooleanVar(value=not any(k in label for k in ("Network", "CD/DVD")))
            self.drive_vars[drive] = var
            ttk.Checkbutton(drives_row, text=label, variable=var).pack(side="left", padx=4)
        folders_row = ttk.Frame(where)
        folders_row.pack(fill="x", pady=(6, 0))
        ttk.Button(folders_row, text="Add a folder...", command=self.add_folder).pack(side="left")
        ttk.Button(folders_row, text="Clear folders", command=self.clear_folders).pack(side="left", padx=6)
        self.folders_label = ttk.Label(folders_row, text="(no extra folders - only the ticked drives are scanned)",
                                       style="Sub.TLabel")
        self.folders_label.pack(side="left", padx=6)

        # Options
        opts = ttk.LabelFrame(outer, text="Checks", padding=8)
        opts.pack(fill="x", pady=6)
        self.opt_corrupt = tk.BooleanVar(value=True)
        self.opt_threats = tk.BooleanVar(value=True)
        self.opt_defender = tk.BooleanVar(value=bool(self.defender))
        self.opt_deep = tk.BooleanVar(value=False)
        ttk.Checkbutton(opts, text="Corrupted files", variable=self.opt_corrupt).pack(side="left", padx=4)
        ttk.Checkbutton(opts, text="Viruses & suspicious files", variable=self.opt_threats).pack(side="left", padx=4)
        defender_text = ("Also run Microsoft Defender virus scan" if self.defender
                         else "Microsoft Defender (not found on this computer)")
        ttk.Checkbutton(opts, text=defender_text, variable=self.opt_defender,
                        state="normal" if self.defender else "disabled").pack(side="left", padx=4)
        ttk.Checkbutton(opts, text="Deep scan (reads every byte - much slower)",
                        variable=self.opt_deep).pack(side="left", padx=4)

        # Start / stop / progress
        run = ttk.Frame(outer)
        run.pack(fill="x", pady=6)
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

        # Results
        self.tabs = ttk.Notebook(outer)
        self.tabs.pack(fill="both", expand=True, pady=(6, 0))
        finding_cols = [("name", "File", 220), ("problem", "Problem", 380), ("source", "Found by", 120),
                        ("size", "Size", 80), ("folder", "Folder", 330)]
        self.threat_tab, self.threat_tree = self._findings_tab(finding_cols, show_repair=False)
        self.corrupt_tab, self.corrupt_tree = self._findings_tab(finding_cols, show_repair=True)
        self.tabs.add(self.threat_tab, text="Viruses & threats (0)")
        self.tabs.add(self.corrupt_tab, text="Corrupted files (0)")
        self.tabs.add(self._all_files_tab(), text="All files")
        self.tabs.add(self._quarantine_tab(), text="Quarantine")

    def _idle_text(self):
        tip = "" if is_admin() else "  Tip: right-click NoorScanner > 'Run as administrator' to also check protected folders."
        return "Ready. Tick the drives to scan and press Start scan." + tip

    def _action_bar(self, parent, tree, show_repair=False, export=None):
        bar = ttk.Frame(parent)
        ttk.Button(bar, text="Select all", command=lambda: tree.selection_set(tree.get_children())).pack(side="left")
        ttk.Button(bar, text="Open file location", command=lambda: self.open_selected(tree)).pack(side="left", padx=4)
        ttk.Separator(bar, orient="vertical").pack(side="left", fill="y", padx=8)
        ttk.Button(bar, text="Quarantine", command=lambda: self.remove_selected(tree, "quarantine")).pack(side="left")
        ttk.Button(bar, text="Move to Recycle Bin", command=lambda: self.remove_selected(tree, "recycle")).pack(side="left", padx=4)
        ttk.Button(bar, text="Delete permanently", command=lambda: self.remove_selected(tree, "delete")).pack(side="left")
        ttk.Button(bar, text="Export report...", command=export or self.export_findings).pack(side="right")
        if show_repair:
            ttk.Button(bar, text="Repair Windows system files", command=self.repair_windows).pack(side="right", padx=4)
        return bar

    def _findings_tab(self, columns, show_repair):
        tab = ttk.Frame(self.tabs, padding=6)
        frame, tree = make_tree(tab, columns)
        tree.paths = {}  # iid -> path
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
        self.largest_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(top, text="Largest first", variable=self.largest_var,
                        command=self.refresh_all_files).pack(side="left", padx=8)
        self.all_label = ttk.Label(top, text="Run a scan to list every file.", style="Sub.TLabel")
        self.all_label.pack(side="left", padx=8)
        frame, self.files_tree = make_tree(tab, [("name", "File", 260), ("size", "Size", 90),
                                                 ("modified", "Modified", 140), ("folder", "Folder", 560)])
        self.files_tree.paths = {}
        self.files_tree.bind("<Double-1>", lambda e: self.open_selected(self.files_tree))
        self._action_bar(tab, self.files_tree, export=self.export_all_files).pack(fill="x", side="bottom", pady=(6, 0))
        frame.pack(fill="both", expand=True)
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

    # ------------------------------------------------------------------ scanning

    def add_folder(self):
        folder = filedialog.askdirectory(title="Choose a folder to scan")
        if folder and folder not in self.extra_folders:
            self.extra_folders.append(os.path.normpath(folder))
            self.folders_label.config(text="Also scanning: " + ";  ".join(self.extra_folders))

    def clear_folders(self):
        self.extra_folders = []
        self.folders_label.config(text="(no extra folders - only the ticked drives are scanned)")

    def start_scan(self):
        roots = [d for d, var in self.drive_vars.items() if var.get()]
        roots += [f for f in self.extra_folders if not any(f.lower().startswith(r.lower()) for r in roots)]
        if not roots:
            messagebox.showinfo(APP_NAME, "Tick at least one drive or add a folder to scan.")
            return
        if not (self.opt_corrupt.get() or self.opt_threats.get() or self.opt_defender.get()):
            messagebox.showinfo(APP_NAME, "Choose at least one check (corrupted files or viruses).")
            return

        self.all_files = []
        self.findings = {}
        for tree in (self.threat_tree, self.corrupt_tree, self.files_tree):
            tree.delete(*tree.get_children())
            tree.paths.clear()
            tree.sizes.clear()
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
        self.progress.start(12)

    def _run_scan(self):
        try:
            self.scanner.run()
        except Exception as exc:  # report anything unexpected instead of dying silently
            self.events.put(("status", f"Scan stopped by an error: {exc}"))
        self.events.put(("done", None))

    def stop_scan(self):
        if self.scanner:
            self.scanner.stop()
            self.status.config(text="Stopping...")

    def poll(self):
        try:
            while True:
                kind, value = self.events.get_nowait()
                if kind == "finding":
                    self._add_finding(value)
                elif kind == "status":
                    self.status.config(text=value)
                elif kind == "done":
                    self._scan_done()
        except queue.Empty:
            pass
        if self.scanner and self.scan_thread and self.scan_thread.is_alive():
            elapsed = int(time.monotonic() - self.started_at)
            self.counts.config(text=f"{self.scanner.files_seen:,} files checked  ·  "
                                    f"{len(self.threat_tree.paths)} threats  ·  "
                                    f"{len(self.corrupt_tree.paths)} corrupted  ·  "
                                    f"{elapsed // 60}m {elapsed % 60:02d}s")
        self.root.after(150, self.poll)

    def _add_finding(self, finding):
        existing = self.findings.get(finding.path)
        if existing and existing.kind != core.CORRUPTED:
            return  # already listed as a threat (e.g. by both NoorScanner and Defender)
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

    def _scan_done(self):
        self.progress.stop()
        self.start_btn.config(state="normal")
        self.stop_btn.config(state="disabled")
        s = self.scanner
        threats, corrupted = len(self.threat_tree.paths), len(self.corrupt_tree.paths)
        summary = (f"Checked {s.files_seen:,} files. Found {threats} threat(s) and {corrupted} corrupted file(s).")
        if s.skipped_dirs:
            summary += f" {s.skipped_dirs:,} protected folder(s) could not be opened."
        self.status.config(text=("Scan stopped. " if s.cancel.is_set() else "Scan finished. ") + summary)
        self.refresh_all_files()
        if threats:
            self.tabs.select(self.threat_tab)
        elif corrupted:
            self.tabs.select(self.corrupt_tab)
        if s.errors:
            messagebox.showwarning(APP_NAME, "\n\n".join(s.errors))
        elif not s.cancel.is_set():
            messagebox.showinfo(APP_NAME, summary + ("\n\nSelect files in the lists below and choose "
                                                     "Quarantine, Recycle Bin or Delete." if threats or corrupted
                                                     else "\n\nYour files look healthy."))

    def refresh_all_files(self):
        query = self.search_var.get().strip().lower()
        files = self.all_files
        matches = [e for e in files if query in e.path.lower()] if query else list(files)
        if self.largest_var.get():
            matches.sort(key=lambda e: e.size, reverse=True)
        tree = self.files_tree
        tree.delete(*tree.get_children())
        tree.paths.clear()
        tree.sizes.clear()
        for e in matches[:MAX_LISTED_FILES]:
            iid = tree.insert("", "end", values=(os.path.basename(e.path), human_size(e.size),
                                                 time.strftime("%Y-%m-%d %H:%M", time.localtime(e.mtime)),
                                                 os.path.dirname(e.path)))
            tree.paths[iid] = e.path
            tree.sizes[iid] = e.size
        total = sum(e.size for e in files)
        shown = f"Showing {min(len(matches), MAX_LISTED_FILES):,} of {len(matches):,} matching" if query \
            else f"Showing {min(len(matches), MAX_LISTED_FILES):,} of {len(files):,} files ({human_size(total)})"
        if len(matches) > MAX_LISTED_FILES:
            shown += " - search to narrow down, or Export report for the full list"
        self.all_label.config(text=shown)

    # ------------------------------------------------------------------ actions

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
        if self.scan_thread and self.scan_thread.is_alive():
            messagebox.showinfo(APP_NAME, "Please wait for the scan to finish (or press Stop) first.")
            return
        selected = self._selected_paths(tree)
        if not selected:
            messagebox.showinfo(APP_NAME, "Select one or more files in the list first "
                                          "(click, or Ctrl+click / Shift+click for several).")
            return
        paths = [p for _, p in selected]

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

        listing = "\n".join(os.path.basename(p) for p in paths[:10])
        if len(paths) > 10:
            listing += f"\n...and {len(paths) - 10} more"
        questions = {
            "quarantine": f"Move {len(paths)} file(s) to quarantine?\n\n{listing}\n\n"
                          "They will be locked away and can be restored from the Quarantine tab.",
            "recycle": f"Move {len(paths)} file(s) to the Recycle Bin?\n\n{listing}\n\n"
                       "You can still restore them from the Recycle Bin.",
            "delete": f"PERMANENTLY delete {len(paths)} file(s)?\n\n{listing}\n\n"
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
        if mode == "quarantine":
            self.refresh_quarantine()

        verb = {"quarantine": "quarantined", "recycle": "moved to the Recycle Bin", "delete": "deleted"}[mode]
        message = f"{len(done)} file(s) {verb}."
        if failed:
            message += (f"\n\n{len(failed)} could not be removed (they may be in use - close the program "
                        "using them or run NoorScanner as administrator):\n\n" + "\n".join(failed[:10]))
            messagebox.showwarning(APP_NAME, message)
        else:
            messagebox.showinfo(APP_NAME, message)

    def _drop_rows(self, paths):
        gone = set(paths)
        for tree in (self.threat_tree, self.corrupt_tree, self.files_tree):
            for iid, path in list(tree.paths.items()):
                if path in gone:
                    tree.delete(iid)
                    del tree.paths[iid]
                    tree.sizes.pop(iid, None)
        for path in gone:
            self.findings.pop(path, None)
        self.all_files = [e for e in self.all_files if e.path not in gone]
        self._update_tab_titles()

    def export_findings(self):
        if not self.findings:
            messagebox.showinfo(APP_NAME, "There are no findings to export yet.")
            return
        target = filedialog.asksaveasfilename(title="Save report", defaultextension=".csv",
                                              initialfile=f"NoorScanner-report-{time.strftime('%Y%m%d-%H%M')}.csv",
                                              filetypes=[("CSV (opens in Excel)", "*.csv")])
        if not target:
            return
        with open(target, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["Type", "File", "Problem", "Found by", "Size (bytes)"])
            for fd in self.findings.values():
                writer.writerow([fd.kind, fd.path, fd.reason, fd.source, fd.size])
        messagebox.showinfo(APP_NAME, f"Report saved to:\n{target}")

    def export_all_files(self):
        if not self.all_files:
            messagebox.showinfo(APP_NAME, "Run a scan first.")
            return
        target = filedialog.asksaveasfilename(title="Save file list", defaultextension=".csv",
                                              initialfile=f"NoorScanner-all-files-{time.strftime('%Y%m%d-%H%M')}.csv",
                                              filetypes=[("CSV (opens in Excel)", "*.csv")])
        if not target:
            return
        with open(target, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["File", "Size (bytes)", "Modified"])
            for e in self.all_files:
                writer.writerow([e.path, e.size, time.strftime("%Y-%m-%d %H:%M", time.localtime(e.mtime))])
        messagebox.showinfo(APP_NAME, f"{len(self.all_files):,} files saved to:\n{target}")

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
        tree.delete(*tree.get_children())
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
        if errors:
            messagebox.showwarning(APP_NAME, "Some files could not be deleted:\n\n" + "\n".join(errors[:10]))

    def on_close(self):
        if self.scan_thread and self.scan_thread.is_alive():
            if not messagebox.askyesno(APP_NAME, "A scan is running. Stop it and close NoorScanner?"):
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
    icon = os.path.join(getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__))), "noor_scanner.ico")
    if os.path.exists(icon):
        try:
            root.iconbitmap(icon)
        except tk.TclError:
            pass
    NoorScannerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
