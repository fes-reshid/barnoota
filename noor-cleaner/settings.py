"""NoorCleaner's saved settings (%LOCALAPPDATA%\\NoorCleaner\\settings.json)."""

import json
import os
import time

import scanner_core as core

SETTINGS_FILE = os.path.join(core.APP_DIR, "settings.json")
# The installer writes the choices made during setup here ("language=ar", "reminder_days=30");
# the app adopts them on its next start and deletes the file.
INSTALLER_CHOICES_FILE = os.path.join(core.APP_DIR, "installer.txt")

DEFAULTS = {
    "language": None,          # None until chosen (installer or first-run picker)
    "reminder_days": 0,        # 0 = off, 7 = weekly, 30 = monthly
    "last_reminder": 0,        # unix time the reminder last ran
    "old_download_days": 90,
    "scan_sound": True,        # soft sounds while scanning
    "live_monitor": False,     # watch for network attacks while the app is open
    "country_lookup": False,   # ask an online service which country an attacker is in (opt-in)
    "router_password_changed": "",  # date the user ticked "I changed my router password"
    "tray_autostart": False,   # start hidden in the tray when signing in to Windows
    "known_devices": [],       # hardware IDs of devices on the home network the user said are theirs
}


class Settings(dict):
    """The settings, remembering what was loaded so save() writes only what this program changed."""
    loaded = None


def load():
    data = Settings(DEFAULTS)
    try:
        with open(SETTINGS_FILE, encoding="utf-8") as f:
            saved = json.load(f)
        if isinstance(saved, dict):
            data.update({k: v for k, v in saved.items() if k in DEFAULTS})
    except (OSError, ValueError):
        pass
    try:
        with open(INSTALLER_CHOICES_FILE, encoding="utf-8-sig") as f:
            choices = dict(line.strip().split("=", 1) for line in f if "=" in line)
        if choices.get("language"):
            data["language"] = choices["language"].strip()
        if choices.get("reminder_days", "").strip().isdigit():
            data["reminder_days"] = int(choices["reminder_days"])
            data["last_reminder"] = data.get("last_reminder") or time.time()
        for key in ("tray_autostart", "live_monitor"):  # NoorGuard's installer task
            if choices.get(key, "").strip() == "1":
                data[key] = True
        save(data)
        os.remove(INSTALLER_CHOICES_FILE)
    except (OSError, ValueError):
        pass
    data.loaded = dict(data)
    return data


def save(data):
    """Writes the settings. NoorCleaner and NoorGuard share one file, so only the values this program
    changed since it loaded them are written; the other program's changes are kept."""
    try:
        with open(SETTINGS_FILE, encoding="utf-8") as f:
            current = json.load(f)
        if not isinstance(current, dict):
            current = {}
    except (OSError, ValueError):
        current = {}
    merged = {k: current.get(k, v) for k, v in DEFAULTS.items()}
    loaded = getattr(data, "loaded", None)
    for key, default in DEFAULTS.items():
        value = data.get(key, default)
        if loaded is None or key not in loaded or loaded[key] != value:
            merged[key] = value
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    tmp = SETTINGS_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=1)
    os.replace(tmp, SETTINGS_FILE)
    if loaded is not None:
        data.loaded = {k: data.get(k, v) for k, v in DEFAULTS.items()}
