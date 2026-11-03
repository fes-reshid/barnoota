"""The junk reminder: at login, when the chosen interval has passed, NoorCleaner
measures the junk quickly and, if there is a fair amount, shows a small notice.

It is started at sign-in by a scheduled task (see below) and does nothing at all
on logins when it is not due.
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
        command = f'"{python}" "{os.path.abspath(sys.argv[0])}"'
    return f"{command} {extra}".strip()


REMIND_TASK = "NoorCleaner reminder"
TRAY_VALUE = "NoorCleanerTray"
TRAY_TASKS = {"NoorGuardTray": "NoorGuard tray", "NoorCleanerTray": "NoorCleaner tray"}


# NoorCleaner and NoorGuard always run as administrator, and Windows does not start such a program from the
# sign-in list (the Run key). So what must start when you sign in is a scheduled task that runs with the
# highest privileges. Creating one needs administrator rights, which the programs have.

def _schtasks(args):
    """Runs schtasks; returns its exit code (1 when it cannot run)."""
    try:
        flags = subprocess.CREATE_NO_WINDOW if core.IS_WINDOWS else 0
        return subprocess.run(["schtasks", *args], capture_output=True, creationflags=flags, timeout=30).returncode
    except (OSError, subprocess.SubprocessError):
        return 1


def logon_task(name, extra_arg, enabled, runner=_schtasks):
    """Creates (or removes) a task that starts this program at sign-in. True when it worked."""
    if not enabled:
        runner(["/delete", "/tn", name, "/f"])
        return True
    return runner(["/create", "/tn", name, "/tr", app_command(extra_arg), "/sc", "onlogon", "/rl", "highest",
                   "/f"]) == 0


def logon_task_exists(name, runner=_schtasks):
    return runner(["/query", "/tn", name]) == 0


def _run_value(name, command=None):
    """The old way (a per-user Run entry): removes it, or sets it when a task could not be made."""
    if not core.IS_WINDOWS:
        return
    import winreg
    with winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, RUN_PATH, 0, winreg.KEY_SET_VALUE) as key:
        if command:
            winreg.SetValueEx(key, name, 0, winreg.REG_SZ, command)
        else:
            try:
                winreg.DeleteValue(key, name)
            except FileNotFoundError:
                pass


def _switch(task, value_name, arg, enabled):
    if not core.IS_WINDOWS:
        return
    _run_value(value_name)  # an entry from an older version would start a second copy
    if enabled and not logon_task(task, arg, True):
        _run_value(value_name, app_command(arg))  # no administrator rights (a development copy): the old way
    elif not enabled:
        logon_task(task, arg, False)


def set_reminder(days, data=None):
    """Saves the interval (0 = off) and registers or removes the sign-in task."""
    data = data if data is not None else settings.load()
    data["reminder_days"] = days
    if days and not data.get("last_reminder"):
        data["last_reminder"] = time.time()  # first notice one interval from now, not at the next login
    settings.save(data)
    _switch(REMIND_TASK, VALUE_NAME, "--remind", bool(days))


def set_tray_autostart(enabled, value_name=TRAY_VALUE):
    """Starts the program hidden in the tray when you sign in, so live protection is always on."""
    _switch(TRAY_TASKS.get(value_name, value_name + " tray"), value_name, "--tray", enabled)


def ensure_tasks(config, edition_key, runner=_schtasks):
    """At start-up: makes sure the sign-in task the settings ask for exists. The installer cannot create it
    (it does not run as administrator), so it leaves the choice in the settings and the program does it here."""
    if edition_key == "cleaner":
        _run_value("NoorCleanerTray")  # NoorCleaner 2.2's tray entry: the tray belongs to NoorGuard now
    if edition_key == "cleaner" and config.get("reminder_days"):
        if not logon_task_exists(REMIND_TASK, runner):
            _switch(REMIND_TASK, VALUE_NAME, "--remind", True)
    elif edition_key == "guard" and config.get("tray_autostart"):
        if not logon_task_exists(TRAY_TASKS["NoorGuardTray"], runner):
            _switch(TRAY_TASKS["NoorGuardTray"], "NoorGuardTray", "--tray", True)


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
