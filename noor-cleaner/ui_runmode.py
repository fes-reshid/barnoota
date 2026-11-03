"""Asking how to run: as administrator (recommended) or as a standard user.

Administrator rights let the programs look at the whole PC, at every user's folders, and delete files Windows
protects. A standard user can only see and change what that user owns. The choice is the user's: it can be
remembered, and changed later in Settings.
"""

import tkinter as tk
from tkinter import ttk

from i18n import _

ASK, ADMIN, STANDARD = "ask", "admin", "standard"


def start_action(mode, is_admin, background=False):
    """What to do at start-up: 'run' (go on as we are), 'elevate' (restart as administrator) or 'ask'."""
    if is_admin or background:
        return "run"  # already administrator, or started quietly at sign-in: never interrupt with a question
    if mode == ADMIN:
        return "elevate"
    if mode == STANDARD:
        return "run"
    return "ask"


def ask_run_mode(root, name, style):
    """Shown in the main window before it opens. Returns (ADMIN or STANDARD, remember) or None when closed."""
    import theme
    px = style.px
    root.title(name)
    chosen, remember = tk.StringVar(), tk.BooleanVar(value=False)
    root.protocol("WM_DELETE_WINDOW", lambda: chosen.set("closed"))
    outer = ttk.Frame(root, padding=px(30))
    outer.pack(fill="both", expand=True)
    ttk.Label(outer, text=_("How do you want to run {name}?").format(name=name), style="H1.TLabel").pack(
        anchor="w", pady=(0, px(4)))
    ttk.Label(outer, text=_("You can change this later in Settings."), style="Sub.TLabel").pack(anchor="w", pady=(0, px(16)))
    for mode, title, points, button, kind in (
            (ADMIN, _("Run as administrator (recommended)"),
             (_("Checks the whole PC, including every user's folders and protected folders."),
              _("Can delete and repair files that Windows protects."),
              _("Windows will ask for your approval once.")),
             _("Run as administrator"), "Primary.TButton"),
            (STANDARD, _("Run as a standard user"),
             (_("Only looks at files and settings that belong to you."),
              _("Some checks will be incomplete and some files cannot be deleted."),
              _("No approval window.")),
             _("Run as a standard user"), "Ghost.TButton")):
        card = ttk.Frame(outer, style="Card.TFrame", padding=(px(22), px(16)))
        card.pack(fill="x", pady=(0, px(12)))
        ttk.Label(card, text=title, style="H3.TLabel").pack(anchor="w", pady=(0, px(6)))
        for point in points:
            ttk.Label(card, text="•  " + point, style="CardSub.TLabel", wraplength=px(560), justify="left").pack(
                anchor="w")
        ttk.Button(card, text=button, style=kind, command=lambda m=mode: chosen.set(m)).pack(
            anchor="w", pady=(px(12), 0))
    tk.Checkbutton(outer, text=_("Remember my choice"), variable=remember, bg=theme.SAND, activebackground=theme.SAND,
                   fg=theme.INK, font=(theme.FONT, 10)).pack(anchor="w", pady=(px(4), 0))
    root.geometry(f"{px(680)}x{px(620)}")
    root.wait_variable(chosen)
    outer.destroy()
    if chosen.get() == "closed":
        return None
    return chosen.get(), remember.get()
