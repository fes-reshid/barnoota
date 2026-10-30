"""The two programs built from this code: NoorCleaner (storage and cleanup) and NoorGuard (security).

Each edition lists its own pages and its own name. They share the engine, the look, the languages, the
Quarantine (so a file removed by one can be restored from either) and the settings file.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Edition:
    key: str
    name: str            # shown everywhere in English and Afaan Oromoo
    name_ar: str         # shown in Arabic text
    exe: str
    pages: tuple         # navigation order
    run_value: str       # Windows "start with sign-in" entry name for the tray / reminder


CLEANER = Edition(
    "cleaner", "NoorCleaner", "نور كلينر", "NoorCleaner",
    ("scan", "space", "junk", "dups", "programs", "corrupt", "health", "files", "recover", "quarantine", "settings"),
    "NoorCleanerReminder")

GUARD = Edition(
    "guard", "NoorGuard", "نور جارد", "NoorGuard",
    ("scan", "threats", "network", "security", "privacy", "quarantine", "settings"),
    "NoorGuardTray")

EDITIONS = {e.key: e for e in (CLEANER, GUARD)}
