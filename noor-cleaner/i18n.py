"""Translations for NoorCleaner: English, Arabic and Afaan Oromo.

The English text itself is the key: code writes _("Start scan") and
locales/<code>.json maps that English text to the translation. Missing
entries fall back to English, so the app always shows something readable.
Text with values in it uses named placeholders: _("{count} files").format(count=3).
"""

import json
import os
import sys

LANGUAGES = {"en": "English", "ar": "العربية", "om": "Afaan Oromoo"}
RTL_LANGUAGES = {"ar"}

_current = "en"
_table = {}
_brand = ("NoorCleaner", "نور كلينر")  # (English name, Arabic name) of the program being run


def locales_dir():
    here = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(here, "locales")


def load_table(code):
    if code == "en":
        return {}
    try:
        with open(os.path.join(locales_dir(), f"{code}.json"), encoding="utf-8") as f:
            return {k: v for k, v in json.load(f).items() if isinstance(v, str) and v.strip()}
    except (OSError, ValueError):
        return {}


def set_language(code):
    global _current, _table
    _current = code if code in LANGUAGES else "en"
    _table = load_table(_current)


def language():
    return _current


def is_rtl():
    return _current in RTL_LANGUAGES


def set_brand(name, name_ar):
    """Texts are written for NoorCleaner; the other program shows its own name in their place."""
    global _brand
    _brand = (name, name_ar)


def _(text):
    text = _table.get(text, text)
    if _brand[0] != "NoorCleaner":
        text = text.replace("NoorCleaner", _brand[0]).replace("نور كلينر", _brand[1])
    return text
