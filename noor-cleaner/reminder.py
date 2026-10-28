"""The junk reminder: at login, when the chosen interval has passed, NoorCleaner
measures the junk quickly and, if there is a fair amount, shows a small notice.

It is registered as a normal per-user startup entry (no administrator rights
needed) and does nothing at all on logins when it is not due.
"""

import os
import subprocess
import sys
import time

import cleaner_core as storage
import scanner_core as core
import settings

RUN_PATH = r"Software\Microsoft\Windows\CurrentVersion\Run"
VALUE_NAME = "NoorCleanerReminder"
MIN_JUNK = 300 * 1024 * 1024  # stay quiet below this


def app_command(extra=""):
    """How to start NoorCleaner itself, as a command line."""
    if getattr(sys, "frozen", False):
        command = f'"{sys.executable}"'
    else:
        python = sys.executable
        windowless = os.path.join(os.path.dirname(python), "pythonw.exe")
        if os.path.exists(windowless):
            python = windowless
        command = f'"{python}" "{os.path.join(os.path.dirname(os.path.abspath(__file__)), "noor_cleaner.py")}"'
    return f"{command} {extra}".strip()


def set_reminder(days, data=None):
    """Saves the interval (0 = off) and registers or removes the login entry."""
    data = data if data is not None else settings.load()
    data["reminder_days"] = days
    if days and not data.get("last_reminder"):
        data["last_reminder"] = time.time()  # first notice one interval from now, not at the next login
    settings.save(data)
    if not core.IS_WINDOWS:
        return
    import winreg
    with winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, RUN_PATH, 0, winreg.KEY_SET_VALUE) as key:
        if days:
            winreg.SetValueEx(key, VALUE_NAME, 0, winreg.REG_SZ, app_command("--remind"))
        else:
            try:
                winreg.DeleteValue(key, VALUE_NAME)
            except FileNotFoundError:
                pass


TRAY_VALUE = "NoorCleanerTray"


def set_tray_autostart(enabled):
    """Starts NoorCleaner hidden in the tray when you sign in, so live protection is always on."""
    if not core.IS_WINDOWS:
        return
    import winreg
    with winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, RUN_PATH, 0, winreg.KEY_SET_VALUE) as key:
        if enabled:
            winreg.SetValueEx(key, TRAY_VALUE, 0, winreg.REG_SZ, app_command("--tray"))
        else:
            try:
                winreg.DeleteValue(key, TRAY_VALUE)
            except FileNotFoundError:
                pass


def is_due(data, now=None):
    days = data.get("reminder_days") or 0
    return bool(days) and (now or time.time()) - (data.get("last_reminder") or 0) >= days * 86400


def junk_total():
    """Junk this user can clean without administrator rights, in bytes."""
    total = 0
    for category in storage.junk_categories():
        if not category.needs_admin:
            try:
                total += storage.measure_junk(category)[0]
            except OSError:
                pass
    return total


def run_reminder():
    """Entry point for `NoorCleaner.exe --remind`."""
    data = settings.load()
    if not is_due(data):
        return
    data["last_reminder"] = time.time()
    settings.save(data)
    total = junk_total()
    if total >= MIN_JUNK:
        show_notice(total)


def show_notice(total):
    import tkinter as tk
    from tkinter import ttk

    import i18n
    import theme
    from i18n import _

    i18n.set_language(settings.load().get("language") or "en")
    root = tk.Tk()
    root.title("NoorCleaner")
    style = theme.get_style(root)
    px = style.px
    root.attributes("-topmost", True)
    card = ttk.Frame(root, style="Card.TFrame", padding=style.card_padding)
    card.pack(fill="both", expand=True, padx=px(10), pady=px(10))
    anchor = "e" if i18n.is_rtl() else "w"
    ttk.Label(card, text="NoorCleaner", style="H3.TLabel").pack(anchor=anchor)
    size = f"{total / 1024 ** 3:.1f} GB" if total >= 1024 ** 3 else f"{total / 1024 ** 2:.0f} MB"
    ttk.Label(card, text=_("Your PC has {size} of junk files that can be cleaned safely.").format(size=size),
              style="CardSub.TLabel", wraplength=px(300), justify="right" if i18n.is_rtl() else "left").pack(
        anchor=anchor, pady=(px(6), px(12)))
    buttons = ttk.Frame(card, style="Plain.TFrame")
    buttons.pack(anchor=anchor)
    side = "right" if i18n.is_rtl() else "left"

    def open_app():
        subprocess.Popen(app_command(), shell=False)
        root.destroy()

    ttk.Button(buttons, text=_("Open NoorCleaner"), style="Primary.TButton", command=open_app).pack(side=side)
    ttk.Button(buttons, text=_("Later"), style="Ghost.TButton", command=root.destroy).pack(side=side, padx=px(8))
    root.update_idletasks()
    width, height = root.winfo_reqwidth(), root.winfo_reqheight()
    root.geometry(f"+{root.winfo_screenwidth() - width - px(24)}+{root.winfo_screenheight() - height - px(72)}")
    root.after(5 * 60 * 1000, root.destroy)  # do not linger all day
    root.mainloop()
