"""The "Settings" page (language, junk reminder, old downloads) and the first-run language picker."""

import tkinter as tk
from tkinter import ttk

import i18n
import reminder
import settings
import theme
from i18n import _
from ui_base import VERSION

# "Choose your language" in each language, so everyone can read the first screen.
CHOOSE_LANGUAGE = ("Choose your language", "اختر لغتك", "Afaan kee filadhu")


def choose_language_first_run(root):
    """Shown once, when no language has been chosen yet (e.g. the app was not installed with the installer)."""
    style = theme.get_style(root)
    px = style.px
    root.title("NoorCleaner")
    chosen = tk.StringVar()
    root.protocol("WM_DELETE_WINDOW", lambda: chosen.set("en"))
    outer = ttk.Frame(root, padding=px(40))
    outer.pack(fill="both", expand=True)
    card = ttk.Frame(outer, style="Card.TFrame", padding=(px(40), px(32)))
    card.pack(expand=True)
    ttk.Label(card, text="NoorCleaner", style="Metric.TLabel").pack(pady=(0, px(16)))
    for line in CHOOSE_LANGUAGE:
        ttk.Label(card, text=line, style="CardSub.TLabel").pack()
    buttons = ttk.Frame(card, style="Plain.TFrame")
    buttons.pack(pady=(px(24), 0))
    for code, name in i18n.LANGUAGES.items():
        ttk.Button(buttons, text=name, style="Primary.TButton" if code == "en" else "Ghost.TButton",
                   command=lambda c=code: chosen.set(c)).pack(fill="x", pady=px(4), ipadx=px(30))
    root.geometry(f"{px(560)}x{px(460)}")
    root.wait_variable(chosen)
    outer.destroy()
    return chosen.get()


class SettingsMixin:
    def _settings_view(self):
        px = self.theme.px
        view = self._view("settings", _("Settings"), _("Language and reminders."))

        language = self._card(view, _("Language"), fill="x", **self._gap())
        self.language_var = tk.StringVar(value=i18n.language())
        row = self._row(language)
        for code, name in i18n.LANGUAGES.items():
            ttk.Radiobutton(row, text=name, value=code, variable=self.language_var,
                            style="Card.TRadiobutton").pack(side=self.L, padx=self.pad(0, px(28)))
        self._button(self._row(language, pady=(px(12), 0)), _("Save and restart NoorCleaner"), self.save_language,
                     style="Primary.TButton")

        remind = self._card(view, _("Junk reminder"), fill="x", **self._gap())
        self._text(remind, _("NoorCleaner can quietly check for junk when you sign in and tell you when there is "
                             "a lot to clean. Nothing is deleted without you."), pady=(0, px(8)))
        self.reminder_var = tk.IntVar(value=int(self.config.get("reminder_days") or 0))
        row = self._row(remind)
        for days, label in ((0, _("Off")), (7, _("Every week")), (30, _("Every month"))):
            ttk.Radiobutton(row, text=label, value=days, variable=self.reminder_var, style="Card.TRadiobutton",
                            command=self.save_reminder).pack(side=self.L, padx=self.pad(0, px(28)))

        downloads = self._card(view, _("Old downloads"), fill="x", **self._gap())
        self._text(downloads, _("Count installers and zip files in Downloads as old after:"), pady=(0, px(8)))
        self.download_days_var = tk.IntVar(value=int(self.config.get("old_download_days") or 90))
        row = self._row(downloads)
        for days in (30, 90, 180, 365):
            ttk.Radiobutton(row, text=_("{days} days").format(days=days), value=days, variable=self.download_days_var,
                            style="Card.TRadiobutton", command=self.save_download_days).pack(
                side=self.L, padx=self.pad(0, px(28)))

        about = self._card(view, _("About"), style="Note.TFrame", fill="x")
        self._bullets(about, (_("NoorCleaner {version}, from the makers of Noor Shield.").format(version=VERSION),
                              _("Translations into Arabic and Afaan Oromo: corrections are welcome."),
                              _("Your files never leave this PC: NoorCleaner works without the internet.")))

    def save_language(self):
        code = self.language_var.get()
        if code == i18n.language():
            self.info(_("This language is already in use."))
            return
        self.config["language"] = code
        settings.save(self.config)
        self.restart_app()

    def save_reminder(self):
        days = self.reminder_var.get()
        try:
            reminder.set_reminder(days, self.config)
        except OSError as exc:
            self.error(str(exc))
            return
        if days:
            self.info(_("Reminder on. NoorCleaner will check for junk when you sign in, every {days} days.").format(
                days=days))

    def save_download_days(self):
        self.config["old_download_days"] = self.download_days_var.get()
        settings.save(self.config)
