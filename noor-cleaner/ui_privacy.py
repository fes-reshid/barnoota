"""The "Privacy tools" page: camera and microphone use, password-leak check and secure delete."""

import os
import threading
import tkinter as tk
from tkinter import filedialog, ttk

import privacy_core as privacy
import scanner_core as core
from i18n import _
from ui_base import clear_tree, make_tree


class PrivacyMixin:
    def _privacy_view(self):
        self.handlers.update({"priv_access": self._show_access, "priv_pwned": self._show_pwned,
                              "priv_shred": self._show_shred, "priv_shred_progress": self._shred_progress})
        view = self._view("privacy", _("Privacy tools"),
                          _("See who used your camera and microphone, check a password against known leaks, and "
                            "delete files so they can never be recovered."))
        self._segments(view, [("camera", _("Camera & microphone"), self._camera_page),
                              ("password", _("Password check"), self._password_page),
                              ("shred", _("Secure delete"), self._shred_page)])

    # ------------------------------------------------------------------ camera and microphone

    def _camera_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        row = self._row(card, pady=(0, px(10)))
        self._button(row, _("Show recent use"), self.load_access, style="Primary.TButton", gap=12)
        self.access_status = ttk.Label(row, text=_("Programs that used your camera or microphone, newest first."),
                                       style="CardSub.TLabel")
        self.access_status.pack(side=self.L)
        frame, self.access_tree = make_tree(card, [("device", _("Device"), 110), ("app", _("Program"), 470),
                                                   ("last", _("Last used"), 150), ("state", _("State"), 150)])
        bar = self._row(card, pady=(px(10), 0))
        self._button(bar, _("Camera privacy settings"), lambda: os.startfile("ms-settings:privacy-webcam"),
                     style="Primary.TButton")
        self._button(bar, _("Microphone privacy settings"), lambda: os.startfile("ms-settings:privacy-microphone"))
        bar.pack_configure(side="bottom")
        frame.pack(fill="both", expand=True)
        return card

    def load_access(self):
        if self._busy():
            return
        self.access_status.config(text=_("Looking..."))

        def work():
            try:
                camera = privacy.read_access("webcam")
                mic = privacy.read_access("microphone")
                self.events.put(("priv_access", camera, mic, None))
            except Exception as exc:
                self.events.put(("priv_access", [], [], str(exc)))

        self._start_worker(work)

    def _show_access(self, camera, mic, error):
        tree = self.access_tree
        clear_tree(tree)
        if error:
            self.access_status.config(text=_("Could not read."))
            self.warn(error)
            return
        live = 0
        for device, entries in ((_("Camera"), camera), (_("Microphone"), mic)):
            for e in entries:
                if e.in_use:
                    live += 1
                    state = _("In use right now")
                elif not e.allowed:
                    state = _("Blocked")
                else:
                    state = _("Allowed")
                tree.insert("", "end", values=(device, e.app, privacy.format_when(e.last_start), state))
        self.access_status.config(text=_("In use right now: {count}").format(count=live) if live
                                  else _("Nothing is using the camera or microphone right now."))

    # ------------------------------------------------------------------ password check

    def _password_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        self._text(card, _("Type a password to see whether it appears in known data leaks. Only the first 5 "
                           "characters of its fingerprint (hash) are sent, so the service never learns the password. "
                           "It needs the internet."), pady=(0, px(12)))
        row = self._row(card)
        self.pw_var = tk.StringVar()
        self.pw_entry = ttk.Entry(row, textvariable=self.pw_var, show="•", width=36)
        self.pw_entry.pack(side=self.L, padx=self.pad(0, px(10)))
        self.pw_show = tk.BooleanVar(value=False)
        ttk.Checkbutton(row, text=_("Show"), variable=self.pw_show, style="Card.TCheckbutton",
                        command=lambda: self.pw_entry.config(show="" if self.pw_show.get() else "•")).pack(
            side=self.L, padx=self.pad(0, px(10)))
        self._button(row, _("Check"), self.check_password, style="Primary.TButton")
        self.pw_entry.bind("<Return>", lambda e: self.check_password())
        self.pw_result = ttk.Label(card, text="", style="H3.TLabel", justify=self.JUSTIFY, wraplength=px(760))
        self.pw_result.pack(anchor=self.W, pady=(px(16), px(6)))
        self.pw_tips = ttk.Frame(card, style="Plain.TFrame")
        self.pw_tips.pack(fill="x")
        return card

    def check_password(self):
        password = self.pw_var.get()
        if not password:
            self.info(_("Type a password first."))
            return
        self.pw_result.config(text=_("Checking..."))
        for child in self.pw_tips.winfo_children():
            child.destroy()
        tips = privacy.strength_tips(password)

        def work():
            try:
                self.events.put(("priv_pwned", privacy.leak_count(password), tips, None))
            except Exception as exc:
                self.events.put(("priv_pwned", None, tips, str(exc)))

        threading.Thread(target=work, daemon=True).start()

    def _show_pwned(self, count, tips, error):
        if error:
            self.pw_result.config(text=_("Could not check the leak list."))
            self.warn(error)
        elif count:
            self.pw_result.config(text=_("This password appeared in data leaks {count} times. Do not use it.").format(
                count=f"{count:,}"))
        else:
            self.pw_result.config(text=_("This password was not found in known leaks."))
        for child in self.pw_tips.winfo_children():
            child.destroy()
        self._bullets(self.pw_tips, tips, style="CardSub.TLabel", wrap=760)
        self.pw_var.set("")  # do not leave the password sitting in the box

    # ------------------------------------------------------------------ secure delete

    def _shred_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        self._text(card, _("Overwrites files with random data before deleting them, so recovery tools cannot bring "
                           "them back. This cannot be undone."), pady=(0, px(8)))
        frame, self.shred_tree = make_tree(card, [("path", _("Files and folders to wipe"), 760)], height=6)
        frame.pack(fill="both", expand=True)
        bar = self._row(card, pady=(px(8), 0))
        self._button(bar, _("Add files..."), self.add_shred_files)
        self._button(bar, _("Add a folder..."), self.add_shred_folder)
        self._button(bar, _("Remove from list"), self.remove_shred_items)
        self.shred_passes = tk.IntVar(value=1)
        for passes, label in ((1, _("1 pass (fast)")), (3, _("3 passes (slower)"))):
            ttk.Radiobutton(bar, text=label, value=passes, variable=self.shred_passes,
                            style="Card.TRadiobutton").pack(side=self.R, padx=self.pad(px(14), 0))
        row = self._row(card, pady=(px(8), 0))
        self._button(row, _("Wipe now"), self.start_shred, style="Danger.TButton", gap=12)
        self.shred_status = ttk.Label(row, text="", style="CardSub.TLabel")
        self.shred_status.pack(side=self.L)
        free = self._card(card, _("Wipe free space"), style="Note.TFrame", fill="x", pady=(px(12), 0))
        self._text(free, _("Files you deleted earlier can still be recovered until their space is overwritten. This "
                           "opens Windows' own tool (cipher), which overwrites a drive's free space. It is slow."),
                   style="Note.TLabel", pady=(0, px(6)))
        drow = ttk.Frame(free, style="Note.TFrame")
        drow.pack(fill="x")
        drives = [d.rstrip("\\") for d in core.list_drives()]
        self.wipe_drive = tk.StringVar(value="C:" if "C:" in drives else drives[0])
        ttk.Combobox(drow, textvariable=self.wipe_drive, values=drives, state="readonly", width=8).pack(
            side=self.L, padx=self.pad(0, px(10)))
        self._button(drow, _("Wipe free space"), self.start_wipe_free)
        self._bullets(card, (_("On SSDs and USB sticks, the drive may keep old copies that no program can reach. "
                               "For the strongest protection, turn on BitLocker encryption too."),),
                      style="CardSub.TLabel", wrap=760)
        return card

    def _add_shred_path(self, path):
        path = os.path.normpath(path)
        if path not in [self.shred_tree.items[i] for i in self.shred_tree.get_children("")]:
            iid = self.shred_tree.insert("", "end", values=(path,))
            self.shred_tree.items[iid] = path

    def add_shred_files(self):
        for path in filedialog.askopenfilenames(title=_("Choose files to wipe")):
            self._add_shred_path(path)

    def add_shred_folder(self):
        folder = filedialog.askdirectory(title=_("Choose a folder to wipe"))
        if folder:
            self._add_shred_path(folder)

    def remove_shred_items(self):
        for iid in self.shred_tree.selection():
            self.shred_tree.items.pop(iid, None)
            self.shred_tree.delete(iid)

    def start_shred(self):
        paths = [self.shred_tree.items[i] for i in self.shred_tree.get_children("")]
        if not paths or self._busy():
            if not paths:
                self.info(_("Add files or folders to wipe first."))
            return
        if not self.ask(_("Permanently wipe {count} item(s)? Nothing can bring them back.").format(count=len(paths)),
                        danger=True):
            return
        passes = self.shred_passes.get()
        self.shred_status.config(text=_("Wiping..."))

        def work():
            try:
                done, problems = privacy.shred_paths(
                    paths, passes, on_progress=lambda d, t: self.events.put(("priv_shred_progress", d, t)))
                self.events.put(("priv_shred", done, problems))
            except privacy.ShredError as exc:
                self.events.put(("priv_shred", 0, [str(exc)]))

        self._start_worker(work)

    def _shred_progress(self, done, total):
        self.shred_status.config(text=_("Wiped {done} of {total} files...").format(done=done, total=total))

    def _show_shred(self, done, problems):
        clear_tree(self.shred_tree)
        self.shred_status.config(text=_("Files wiped: {count}").format(count=done))
        self.refresh_drives()
        if problems:
            self.warn(_("Some could not be wiped:") + "\n\n" + "\n".join(problems[:10]))
        else:
            self.info(_("Files wiped: {count}").format(count=done))

    def start_wipe_free(self):
        try:
            privacy.wipe_free_space(self.wipe_drive.get())
        except (ValueError, RuntimeError, OSError) as exc:
            self.error(str(exc))
