"""Shared building blocks for NoorCleaner's window: formatting helpers, lists,
the page/panel layout in Noor Shield's style, and right-to-left support.

Every page module (ui_*.py) is a mixin on the main app class and uses these.
For Arabic the whole layout is mirrored: the sidebar moves to the right, text
lines up on the right and rows of buttons run right to left. Use self.L/self.R
for pack sides, self.W/self.E for anchors and self.col() for grid columns.
"""

import os
import subprocess
import sys
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

import i18n
import scanner_core as core
from i18n import _

APP_NAME = "NoorCleaner"
VERSION = "2.2.0"


def human_size(size):
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024:
            return f"{size:.0f} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.2f} TB"


def share_text(part, whole):
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


def app_launch_args():
    """The program and arguments that start NoorCleaner again."""
    if getattr(sys, "frozen", False):
        return sys.executable, ""
    return sys.executable, f'"{os.path.join(os.path.dirname(os.path.abspath(__file__)), "noor_cleaner.py")}"'


NUMERIC_COLUMNS = ("size", "files", "share", "modified", "deleted", "date", "installed", "pixels")


def make_tree(parent, columns, tree_title=None, tree_width=300, sortable=True, height=None):
    """A Treeview with scrollbars and click-to-sort headings. columns: [(id, title, width)].

    In right-to-left languages the columns run right to left and text lines up on the right.
    """
    rtl = i18n.is_rtl()
    scale = max(1.0, parent.winfo_fpixels("1i") / 96)  # widths are given for a 100% screen
    frame = ttk.Frame(parent)
    options = {"height": height} if height else {}
    tree = ttk.Treeview(frame, columns=[c[0] for c in columns], selectmode="extended",
                        show="tree headings" if tree_title else "headings", **options)
    text_anchor = "e" if rtl else "w"
    if tree_title:
        tree.heading("#0", text=tree_title, anchor=text_anchor)
        tree.column("#0", width=round(tree_width * scale), stretch=True, anchor=text_anchor)
    for col, title, width in columns:
        width = round(width * scale)
        tree.heading(col, text=title, command=(lambda c=col: sort_tree(tree, c, False)) if sortable else "")
        fixed = col in NUMERIC_COLUMNS
        tree.column(col, width=width, minwidth=width if fixed else 40, stretch=not fixed,
                    anchor="e" if col in ("size", "files", "pixels") or rtl else "w")
    if rtl and not tree_title:
        tree["displaycolumns"] = [c[0] for c in reversed(columns)]
    ys = ttk.Scrollbar(frame, orient="vertical", command=tree.yview)
    xs = ttk.Scrollbar(frame, orient="horizontal", command=tree.xview)
    tree.configure(yscrollcommand=ys.set, xscrollcommand=xs.set)
    tree_col, bar_col = (1, 0) if rtl else (0, 1)
    tree.grid(row=0, column=tree_col, sticky="nsew")
    ys.grid(row=0, column=bar_col, sticky="ns")
    xs.grid(row=1, column=tree_col, sticky="ew")
    frame.rowconfigure(0, weight=1)
    frame.columnconfigure(tree_col, weight=1)
    tree.paths = {}  # iid -> file path, for rows that are files
    tree.sizes = {}  # iid -> size in bytes, so the size column sorts by number
    tree.items = {}  # iid -> the object a row shows (program, startup item...), where useful
    return frame, tree


def sort_tree(tree, col, reverse):
    rows = tree.get_children("")
    if col == "size":
        keyed = [(tree.sizes.get(iid, 0), iid) for iid in rows]
    else:
        keyed = [(str(tree.set(iid, col)).lower(), iid) for iid in rows]
    keyed.sort(reverse=reverse)
    for index, (_key, iid) in enumerate(keyed):
        tree.move(iid, "", index)
    tree.heading(col, command=lambda: sort_tree(tree, col, not reverse))


def clear_tree(tree):
    tree.delete(*tree.get_children())
    tree.paths.clear()
    tree.sizes.clear()
    tree.items.clear()


class BaseApp:
    """Layout and dialog helpers shared by every page."""

    # ------------------------------------------------------------------ direction

    def _setup_direction(self):
        self.rtl = i18n.is_rtl()
        self.L, self.R = ("right", "left") if self.rtl else ("left", "right")
        self.W, self.E = ("e", "w") if self.rtl else ("w", "e")
        self.JUSTIFY = "right" if self.rtl else "left"

    def col(self, index, count):
        return count - 1 - index if self.rtl else index

    def pad(self, before, after=0):
        """A (left, right) padding pair: 'before' sits on the side text starts from."""
        return (after, before) if self.rtl else (before, after)

    # ------------------------------------------------------------------ layout

    def _view(self, name, title, subtitle):
        px = self.theme.px
        view = ttk.Frame(self.content, padding=(px(30), px(24), px(30), px(18)))
        view.grid(row=0, column=0, sticky="nsew")
        head = ttk.Frame(view)
        head.pack(fill="x", pady=(0, px(14)))
        ttk.Label(head, text=title, style="H1.TLabel").pack(anchor=self.W)
        sub = ttk.Label(head, text=subtitle, style="Sub.TLabel", justify=self.JUSTIFY, anchor=self.W,
                        wraplength=px(900))
        sub.pack(anchor=self.W, fill="x", pady=(px(2), 0))
        self._wrap_to_width(sub)
        self.views[name] = view
        return view

    def _card(self, parent, title=None, style="Card.TFrame", **pack):
        card = ttk.Frame(parent, style=style, padding=self.theme.card_padding)
        if pack:
            card.pack(**pack)
        if title:
            ttk.Label(card, text=title, style="NoteH3.TLabel" if style == "Note.TFrame" else "H3.TLabel"
                      ).pack(anchor=self.W, pady=(0, self.theme.px(8)))
        return card

    def _gap(self):
        return {"pady": (0, self.theme.px(14))}

    def _row(self, parent, **pack):
        row = ttk.Frame(parent, style="Plain.TFrame")
        row.pack(fill="x", **pack)
        return row

    def _button(self, parent, text, command, style="Ghost.TButton", gap=6, side=None, **options):
        button = ttk.Button(parent, text=text, style=style, command=command, **options)
        button.pack(side=side or self.L, padx=self.pad(0, self.theme.px(gap)) if (side or self.L) == self.L
                    else self.pad(self.theme.px(gap), 0))
        return button

    def _text(self, parent, text, style="CardSub.TLabel", wrap=860, **pack):
        """A paragraph that wraps to the space it actually gets, so no language is ever cut off."""
        label = ttk.Label(parent, text=text, style=style, justify=self.JUSTIFY, anchor=self.W,
                          wraplength=self.theme.px(wrap) if wrap else 0)
        if wrap:
            pack.setdefault("fill", "x")
            self._wrap_to_width(label)
        pack.setdefault("anchor", self.W)
        label.pack(**pack)
        return label

    def _wrap_to_width(self, label):
        label.bind("<Configure>", lambda e: label.configure(wraplength=max(e.width - 4, 60)), add="+")

    def _bullets(self, card, lines, style="Note.TLabel", wrap=860):
        for line in lines:
            text = f"{line}  •" if self.rtl else f"•  {line}"
            self._text(card, text, style=style, wrap=wrap, pady=self.theme.px(2))

    def _segments(self, view, items):
        """Noor Shield-style switcher between sub-pages. items: [(key, label, builder(parent) -> frame)]."""
        px = self.theme.px
        bar = ttk.Frame(view)
        bar.pack(fill="x", pady=(0, px(12)))
        body = ttk.Frame(view)
        body.pack(fill="both", expand=True)
        body.rowconfigure(0, weight=1)
        body.columnconfigure(0, weight=1)
        group = {"buttons": {}, "pages": {}}
        for key, label, builder in items:
            button = ttk.Button(bar, text=label, style="GhostSand.TButton",
                                command=lambda k=key: self._show_segment(group, k))
            button.pack(side=self.L, padx=self.pad(0, px(8)))
            group["buttons"][key] = button
            page = builder(body)
            page.grid(row=0, column=0, sticky="nsew")
            group["pages"][key] = page
        self._show_segment(group, items[0][0])
        return group

    def _show_segment(self, group, key):
        group["pages"][key].tkraise()
        for k, button in group["buttons"].items():
            button.configure(style="PrimarySand.TButton" if k == key else "GhostSand.TButton")

    def show_view(self, name):
        self.views[name].tkraise()
        for key, button in self.nav_buttons.items():
            button.configure(style="NavOn.TButton" if key == name else "Nav.TButton")
        self.current_view = name

    def _tree_in(self, card, columns, **options):
        frame, tree = make_tree(card, columns, **options)
        return frame, tree

    # ------------------------------------------------------------------ background jobs

    def _busy(self):
        if self.scan_thread and self.scan_thread.is_alive() or self.worker and self.worker.is_alive():
            self.info(_("Please wait for the current job to finish (or press Stop) first."))
            return True
        return False

    def _start_worker(self, work):
        """Runs work() on a background thread; it reports back with self.events.put((kind, ...))."""
        def run():
            try:
                work()
            except Exception as exc:  # never let a background job fail silently
                self.events.put(("worker_error", str(exc)))
        self.worker = threading.Thread(target=run, daemon=True)
        self.worker.start()

    # ------------------------------------------------------------------ dialogs

    def info(self, message):
        messagebox.showinfo(APP_NAME, message)

    def warn(self, message):
        messagebox.showwarning(APP_NAME, message)

    def error(self, message):
        messagebox.showerror(APP_NAME, message)

    def ask(self, message, danger=False):
        if danger:
            return messagebox.askyesno(APP_NAME, message, icon="warning", default="no")
        return messagebox.askyesno(APP_NAME, message)

    def _browse_into(self, variable):
        folder = filedialog.askdirectory(title=_("Choose a folder"), initialdir=variable.get() or None)
        if folder:
            variable.set(os.path.normpath(folder))

    def _selected_paths(self, tree):
        return [(iid, tree.paths[iid]) for iid in tree.selection() if iid in tree.paths]

    def _selected_items(self, tree):
        return [tree.items[iid] for iid in tree.selection() if iid in tree.items]

    def open_selected(self, tree):
        selected = self._selected_paths(tree)
        if not selected:
            self.info(_("Select a file first."))
            return
        for _iid, path in selected[:5]:
            open_location(path)

    def admin_gate(self, reason):
        """True to go ahead. When NoorCleaner is not running as administrator, says so, explains what needs
        it, and offers to restart as administrator (answering No carries on without)."""
        if not core.IS_WINDOWS or is_admin():
            return True
        answer = messagebox.askyesnocancel(
            APP_NAME, _("NoorCleaner is not running as administrator.") + "\n\n" + reason + "\n\n"
            + _("Restart as administrator now? Choose No to carry on without."), icon="warning")
        if answer is None:
            return False
        if answer:
            self.restart_app(as_admin=True)
            return False
        return True

    def restart_app(self, as_admin=False):
        """Starts a fresh NoorCleaner (optionally as administrator) and closes this one."""
        if self.scan_thread and self.scan_thread.is_alive() or self.worker and self.worker.is_alive():
            if not self.ask(_("A job is running. Stop it and restart NoorCleaner?")):
                return
            if self.scanner:
                self.scanner.stop()
        exe, args = app_launch_args()
        if core.IS_WINDOWS:
            import ctypes
            verb = "runas" if as_admin else "open"
            if ctypes.windll.shell32.ShellExecuteW(None, verb, exe, args or None, None, 1) <= 32:
                return
        else:
            subprocess.Popen([exe] + ([args.strip('"')] if args else []))
        self.root.destroy()
