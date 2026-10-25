"""The "Recover deleted files" page: Recycle Bin, restore points, and Windows File Recovery."""

import ntpath
import os
import tkinter as tk
from tkinter import filedialog, ttk

import recovery_core as recovery
import scanner_core as core
from i18n import _
from ui_base import clear_tree, human_size, make_tree


class RecoverMixin:
    def _recover_view(self):
        self.handlers.update({"bin_done": self._show_recycle_bin, "points_done": self._show_restore_points,
                              "points_progress": self._points_progress, "missing_done": self._show_missing})
        view = self._view("recover", _("Recover deleted files"),
                          _("Get back files you deleted. Try as soon as you can, and avoid saving new files to that "
                            "drive until you have."))
        self._segments(view, [("bin", _("Recycle Bin"), self._recycle_page),
                              ("points", _("Restore points"), self._points_page),
                              ("deep", _("Permanently deleted"), self._deep_page)])

    def _restore_bar(self, card, tree, restore):
        bar = ttk.Frame(card, style="Plain.TFrame")
        self._button(bar, _("Select all"), lambda: tree.selection_set(list(tree.items)))
        self._button(bar, _("Restore"), lambda: restore(False), style="Primary.TButton")
        self._button(bar, _("Restore to a folder..."), lambda: restore(True))
        return bar

    def _recycle_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        top = self._row(card, pady=(0, px(10)))
        self._button(top, _("Look in the Recycle Bin"), self.load_recycle_bin, style="Primary.TButton", gap=12)
        self.bin_status = ttk.Label(top, text=_("Files you deleted normally wait here until the bin is emptied."),
                                    style="CardSub.TLabel")
        self.bin_status.pack(side=self.L)
        frame, self.bin_tree = make_tree(card, [("name", _("File"), 220), ("size", _("Size"), 85),
                                                ("deleted", _("Deleted on"), 140),
                                                ("original", _("Original location"), 420)])
        self._restore_bar(card, self.bin_tree, self.restore_from_bin).pack(fill="x", side="bottom", pady=(px(10), 0))
        frame.pack(fill="both", expand=True)
        return card

    def _points_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        row1 = self._row(card)
        self._button(row1, _("Find restore points"), self.load_restore_points, style="Primary.TButton", gap=10)
        self.point_var = tk.StringVar()
        self.point_box = ttk.Combobox(row1, textvariable=self.point_var, state="readonly", width=30)
        self.point_box.pack(side=self.L, padx=self.pad(0, px(10)))
        self.points_status = ttk.Label(row1, text=_("Needs administrator rights and System Protection turned on."),
                                       style="Hint.TLabel")
        self.points_status.pack(side=self.L)
        row2 = self._row(card, pady=(px(10), px(10)))
        ttk.Label(row2, text=_("Folder to check:"), style="Card.TLabel").pack(side=self.L)
        self.points_folder = tk.StringVar(value=os.path.expanduser("~"))
        ttk.Entry(row2, textvariable=self.points_folder, width=48).pack(side=self.L, padx=px(8))
        self._button(row2, _("Browse..."), lambda: self._browse_into(self.points_folder), gap=8)
        self._button(row2, _("Look for missing files"), self.find_missing, style="Primary.TButton")
        frame, self.points_tree = make_tree(card, [("name", _("File"), 220), ("size", _("Size"), 85),
                                                   ("modified", _("Modified"), 140), ("folder", _("Was in"), 420)])
        self.shadows = []
        self._restore_bar(card, self.points_tree, self.restore_from_point).pack(fill="x", side="bottom",
                                                                               pady=(px(10), 0))
        frame.pack(fill="both", expand=True)
        return card

    def _deep_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        self._text(card, _("For files deleted with Shift+Delete, emptied from the Recycle Bin, or deleted permanently "
                           "by a program. NoorCleaner sets up Microsoft's free Windows File Recovery tool for you; it "
                           "reads the deleted data straight off the drive."), pady=(0, px(12)))
        form = ttk.Frame(card, style="Plain.TFrame")
        form.pack(fill="x")
        drives = [d.rstrip("\\") for d in core.list_drives()]
        self.deep_source = tk.StringVar(value="C:" if "C:" in drives else drives[0])
        self.deep_patterns = tk.StringVar(value="*.docx *.pdf *.jpg")
        other = next((d for d in drives if d != self.deep_source.get()), "")
        self.deep_dest = tk.StringVar(value=os.path.join(other + os.sep, "Recovered files") if other else "")
        self.deep_thorough = tk.BooleanVar(value=False)
        rows = ((_("Drive the files were on:"), ttk.Combobox(form, textvariable=self.deep_source, values=drives,
                                                             state="readonly", width=8), None),
                (_("Look for:"), ttk.Entry(form, textvariable=self.deep_patterns, width=40),
                 _("File types like  *.jpg  or part of a name like  holiday  (separate several with spaces)")),
                (_("Save recovered files to:"), ttk.Entry(form, textvariable=self.deep_dest, width=40),
                 _("Must be a different drive, such as a USB stick, so nothing gets overwritten")))
        for r, (label, widget, hint) in enumerate(rows):
            ttk.Label(form, text=label, style="Card.TLabel").grid(row=2 * r, column=self.col(0, 3), sticky=self.W,
                                                                  pady=(px(6), 0))
            widget.grid(row=2 * r, column=self.col(1, 3), sticky=self.W, padx=px(10), pady=(px(6), 0))
            if hint:
                ttk.Label(form, text=hint, style="Hint.TLabel").grid(row=2 * r + 1, column=self.col(1, 3),
                                                                     sticky=self.W, padx=px(10))
        ttk.Button(form, text=_("Browse..."), style="Ghost.TButton",
                   command=lambda: self._browse_into(self.deep_dest)).grid(row=4, column=self.col(2, 3),
                                                                           sticky=self.W, pady=(px(6), 0))
        ttk.Checkbutton(card, text=_("Thorough mode - slower, also finds files deleted longer ago or on USB sticks"),
                        variable=self.deep_thorough, style="Card.TCheckbutton").pack(anchor=self.W, pady=(px(10), 0))
        bar = self._row(card, pady=(px(14), px(14)))
        self._button(bar, _("Start recovery"), self.start_deep_recovery, style="Primary.TButton", gap=8)
        if not recovery.find_winfr():
            self._button(bar, _("Get Windows File Recovery (free, Microsoft Store)"), self.get_winfr)
        note = self._card(card, _("Good to know"), style="Note.TFrame", fill="x")
        self._bullets(note, (_("The sooner you try, the better: new files can overwrite deleted ones at any moment."),
                             _("On SSDs, Windows usually wipes deleted data quickly, so permanently deleted files may "
                               "be gone for good. Restore points and the Recycle Bin are your best chance there."),
                             _("A window opens where Windows File Recovery asks you to confirm (press y) and shows "
                               "its progress.")), wrap=820)
        return card

    def _restore_target(self, to_folder):
        if not to_folder:
            return None, True
        folder = filedialog.askdirectory(title=_("Restore the files into..."))
        return (os.path.normpath(folder), True) if folder else (None, False)

    def _report_restore(self, done, failed, target):
        self.refresh_drives()
        message = (_("Restored to {folder}: {count}").format(folder=target, count=done) if target
                   else _("Restored to where they were: {count}").format(count=done))
        if failed:
            self.warn(message + "\n\n" + _("Some could not be restored:") + "\n\n" + "\n".join(failed[:10]))
        else:
            self.info(message)

    # ------------------------------------------------------------------ Recycle Bin

    def load_recycle_bin(self):
        if self._busy():
            return
        self.bin_status.config(text=_("Looking..."))
        self._start_worker(lambda: self.events.put(("bin_done", recovery.list_recycle_bin())))

    def _show_recycle_bin(self, items):
        tree = self.bin_tree
        clear_tree(tree)
        for item in items:
            name = ntpath.basename(item.original) + ("  " + _("(folder)") if item.is_folder else "")
            iid = tree.insert("", "end", values=(name, human_size(item.size), recovery.format_time(item.deleted),
                                                 ntpath.dirname(item.original)))
            tree.items[iid] = item
            tree.sizes[iid] = item.size
        total = sum(i.size for i in items)
        self.bin_status.config(text=_("Items in the Recycle Bin: {count} ({size})").format(
            count=f"{len(items):,}", size=human_size(total)) if items
            else _("The Recycle Bin is empty. Try 'Restore points' or 'Permanently deleted'."))

    def restore_from_bin(self, to_folder):
        chosen = self._selected_items(self.bin_tree)
        if not chosen:
            self.info(_("Press 'Look in the Recycle Bin', then select the files to restore."))
            return
        target, go = self._restore_target(to_folder)
        if not go:
            return
        done, failed = 0, []
        for item in chosen:
            try:
                recovery.restore_recycled(item, target)
                done += 1
            except Exception as exc:
                failed.append(f"{ntpath.basename(item.original)}: {exc}")
        self.load_recycle_bin()
        self._report_restore(done, failed, target)

    # ------------------------------------------------------------------ restore points

    def load_restore_points(self):
        if self._busy():
            return
        self.points_status.config(text=_("Looking for restore points..."))

        def work():
            try:
                self.events.put(("points_done", recovery.list_shadow_copies(), None))
            except Exception as exc:
                self.events.put(("points_done", [], str(exc)))

        self._start_worker(work)

    def _show_restore_points(self, copies, error):
        self.shadows = copies
        self.point_box.config(values=[c.label for c in copies])
        if copies:
            self.point_box.current(0)
            self.points_status.config(text=_("Restore points found: {count}. Pick one, then a folder.").format(
                count=len(copies)))
        else:
            self.point_var.set("")
            self.points_status.config(text=_("Could not list restore points.") if error else _("No restore points found."))
            if error:
                self.warn(error)
            elif core.IS_WINDOWS:
                self.info(_("This PC has no restore points, so there are no older copies to recover from.") + "\n\n"
                          + _("To have them in future, search Windows for 'Create a restore point' and turn on "
                              "Protection for drive C:."))

    def find_missing(self):
        if self._busy():
            return
        index = self.point_box.current()
        if index < 0:
            self.info(_("Press 'Find restore points' and pick one first."))
            return
        shadow = self.shadows[index]
        folder = self.points_folder.get().strip()
        drive = os.path.splitdrive(os.path.abspath(folder))[0]
        if shadow.drive != "?" and drive.lower() != shadow.drive.lower():
            self.info(_("This restore point is for drive {drive}. Choose a folder on that drive.").format(
                drive=shadow.drive))
            return
        snapshot = recovery.snapshot_path(shadow, folder)
        if not os.path.isdir(snapshot):
            self.info(_("That folder did not exist yet when this restore point was made."))
            return
        clear_tree(self.points_tree)
        self.points_status.config(text=_("Comparing with the restore point..."))
        self._start_worker(lambda: self.events.put(("missing_done", recovery.find_missing_files(
            snapshot, folder,
            on_progress=lambda s, m: self.events.put(("points_progress", s, m)) if s % 200 < 20 else None))))

    def _points_progress(self, seen, missing):
        self.points_status.config(text=_("Comparing... {seen} files checked, {missing} missing").format(
            seen=f"{seen:,}", missing=f"{missing:,}"))

    def _show_missing(self, items):
        tree = self.points_tree
        for item in sorted(items, key=lambda i: i.mtime, reverse=True):
            iid = tree.insert("", "end", values=(os.path.basename(item.live_path), human_size(item.size),
                                                 recovery.format_time(item.mtime), os.path.dirname(item.live_path)))
            tree.items[iid] = item
            tree.sizes[iid] = item.size
        self.points_status.config(text=_("Files in the restore point that are gone now: {count}").format(
            count=f"{len(items):,}") if items else _("Nothing missing: every file in the restore point is still here."))

    def restore_from_point(self, to_folder):
        chosen = self._selected_items(self.points_tree)
        if not chosen:
            self.info(_("Look for missing files first, then select the ones to restore."))
            return
        target, go = self._restore_target(to_folder)
        if not go:
            return
        done, failed, restored = 0, [], set()
        for item in chosen:
            try:
                recovery.restore_missing(item, target)
                done += 1
                restored.add(item.live_path)
            except Exception as exc:
                failed.append(f"{os.path.basename(item.live_path)}: {exc}")
        if target is None:  # back in place, so no longer missing
            for iid, item in list(self.points_tree.items.items()):
                if item.live_path in restored:
                    self.points_tree.delete(iid)
                    del self.points_tree.items[iid]
        self._report_restore(done, failed, target)

    # ------------------------------------------------------------------ Windows File Recovery

    def get_winfr(self):
        try:
            os.startfile(recovery.WINFR_STORE_URL)
        except (AttributeError, OSError):
            self.info(_("Search the Microsoft Store for 'Windows File Recovery' (free)."))

    def start_deep_recovery(self):
        try:
            command = recovery.winfr_command(self.deep_source.get(), self.deep_dest.get().strip(),
                                             self.deep_patterns.get(), self.deep_thorough.get())
        except ValueError as exc:
            self.info(str(exc))
            return
        if not recovery.find_winfr():
            if self.ask(_("Windows File Recovery is not installed yet. It is a free tool from Microsoft.") + "\n\n"
                        + _("Open the Microsoft Store to install it now? Afterwards, press Start recovery again.")):
                self.get_winfr()
            return
        if not self.ask(_("NoorCleaner will open Windows File Recovery as administrator with:") + f"\n\n{command}\n\n"
                        + _("Recovered files go to {folder}. Start?").format(folder=self.deep_dest.get())):
            return
        try:
            recovery.run_winfr(command)
        except Exception as exc:
            self.error(str(exc))
