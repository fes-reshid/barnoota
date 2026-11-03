"""The pop-up that asks before files are removed: it lists the files, says which program (or Windows) each one
belongs to, and only goes ahead when the user presses the button."""

import tkinter as tk
from tkinter import ttk

import ownership
import theme
from i18n import _
from ui_base import human_size

MAX_ROWS = 400


def confirm_files(app, title, intro, items, button, danger=True, notes=()):
    """items: [(path, size)]. Shows the pop-up and returns True when the user confirms."""
    index = app.owner_index()
    rows, groups = ownership.summarise(index, items)
    px = app.theme.px
    related = {name: g for name, g in groups.items() if g[0] in (ownership.PROGRAM, ownership.DATA)}
    windows = {name: g for name, g in groups.items() if g[0] == ownership.WINDOWS}

    win = tk.Toplevel(app.root)
    win.title(title)
    win.configure(bg=theme.SAND)
    win.transient(app.root)
    win.resizable(True, True)
    outer = ttk.Frame(win, padding=(px(22), px(18), px(22), px(16)))
    outer.pack(fill="both", expand=True)
    def label(text, size=10, bold=False, color=theme.INK_SOFT, pady=(0, 0)):
        tk.Label(outer, text=text, bg=theme.SAND, fg=color, font=(theme.FONT, size, "bold" if bold else "normal"),
                 wraplength=px(720), justify=app.JUSTIFY, anchor="w").pack(anchor=app.W, fill="x", pady=pady)

    label(title, 12, True, theme.INK)
    label(intro, pady=(px(6), px(10)))

    if related or windows:
        warn = tk.Frame(outer, bg="#f3e7d6", highlightthickness=1, highlightbackground=theme.WARN)
        warn.pack(fill="x", pady=(0, px(10)))
        tk.Label(warn, text=_("Some of these files belong to programs"), bg="#f3e7d6", fg=theme.WARN,
                 font=(theme.FONT, 10, "bold"), anchor="w", justify=app.JUSTIFY).pack(fill="x", padx=px(12), pady=(px(8), 0))
        lines = [f"•  {name}: " + _("{count} file(s) ({size})").format(count=count, size=human_size(size))
                 for name, (_kind, count, size) in {**related, **windows}.items()]
        tk.Label(warn, text="\n".join(lines[:8]) + (("\n" + _("...and {count} more").format(count=len(lines) - 8))
                                                    if len(lines) > 8 else ""),
                 bg="#f3e7d6", fg=theme.INK, font=(theme.FONT, 10), anchor="w", justify=app.JUSTIFY,
                 wraplength=px(700)).pack(fill="x", padx=px(12), pady=(px(2), px(4)))
        tk.Label(warn, text=_("Removing them can make those programs stop working. To remove a program properly, "
                              "use its own uninstaller (Programs page)."),
                 bg="#f3e7d6", fg=theme.INK_SOFT, font=(theme.FONT, 9), anchor="w", justify=app.JUSTIFY,
                 wraplength=px(700)).pack(fill="x", padx=px(12), pady=(0, px(8)))

    frame = ttk.Frame(outer)
    frame.pack(fill="both", expand=True)
    tree = ttk.Treeview(frame, columns=("owner", "file", "size"), show="headings", height=9, selectmode="browse")
    for col, text, width in (("owner", _("Belongs to"), 190), ("file", _("File"), 470), ("size", _("Size"), 80)):
        tree.heading(col, text=text)
        tree.column(col, width=round(width * app.theme.scale), anchor="e" if col == "size" else "w",
                    stretch=(col == "file"))
    bar = ttk.Scrollbar(frame, orient="vertical", command=tree.yview)
    tree.configure(yscrollcommand=bar.set)
    tree.pack(side="left", fill="both", expand=True)
    bar.pack(side="left", fill="y")
    for owner, path, size, _kind in rows[:MAX_ROWS]:
        tree.insert("", "end", values=(owner, path, human_size(size) if size else ""))
    if len(rows) > MAX_ROWS:
        label(_("...and {count} more").format(count=len(rows) - MAX_ROWS), 9, pady=(px(4), 0))
    for note in notes:
        label(note, pady=(px(8), 0))

    answer = {"go": False}
    understood = tk.BooleanVar(value=not (related or windows))
    buttons = ttk.Frame(outer)
    buttons.pack(fill="x", pady=(px(14), 0))
    cancel = ttk.Button(buttons, text=_("Cancel"), style="Ghost.TButton", command=win.destroy)
    go = ttk.Button(buttons, text=button, style="Danger.TButton" if danger else "Primary.TButton",
                    command=lambda: (answer.update(go=True), win.destroy()))
    go.pack(side=app.R)
    cancel.pack(side=app.R, padx=app.pad(px(8), 0))
    if related or windows:
        go.state(["disabled"])
        tk.Checkbutton(buttons, text=_("I understand that these files belong to programs"), variable=understood,
                       bg=theme.SAND, activebackground=theme.SAND, fg=theme.INK, font=(theme.FONT, 10),
                       command=lambda: go.state(["!disabled"] if understood.get() else ["disabled"])).pack(side=app.L)
        understood.set(False)
    win.bind("<Escape>", lambda e: win.destroy())
    win.protocol("WM_DELETE_WINDOW", win.destroy)
    win.update_idletasks()
    width, height = max(win.winfo_reqwidth(), px(780)), win.winfo_reqheight()
    win.geometry(f"{width}x{height}+{app.root.winfo_rootx() + px(60)}+{app.root.winfo_rooty() + px(40)}")
    win.grab_set()
    cancel.focus_set()  # Enter cancels: removing needs a deliberate click
    win.wait_window()
    return answer["go"]
