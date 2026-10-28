"""Small helpers for running Windows tools: a command, or a PowerShell script (optionally with JSON back).

Values that come from files or the user (names, paths) are passed to PowerShell through environment
variables, never pasted into the script text, so they cannot change what the script does.
"""

import json
import os
import subprocess

import scanner_core as core
from i18n import _


def run(args, timeout=30, env=None):
    flags = subprocess.CREATE_NO_WINDOW if core.IS_WINDOWS else 0
    full_env = dict(os.environ, **env) if env else None
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout, creationflags=flags,
                          encoding="utf-8", errors="replace", env=full_env)


def powershell(script, timeout=60, env=None):
    """Runs a PowerShell script and returns the CompletedProcess."""
    return run(["powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
               timeout=timeout, env=env)


def powershell_json(script, timeout=60, env=None):
    """Runs a script that ends in ConvertTo-Json and returns a list of dicts (empty when it printed nothing)."""
    try:
        result = powershell(script, timeout, env)
    except (OSError, subprocess.SubprocessError) as exc:
        raise RuntimeError(_("Windows did not answer: {details}").format(details=exc)) from None
    out = result.stdout.strip()
    if not out:
        if result.returncode != 0:
            raise RuntimeError((result.stderr or "").strip() or _("administrator rights are needed"))
        return []
    try:
        data = json.loads(out)
    except ValueError:
        raise RuntimeError(_("Windows gave an answer NoorCleaner could not read.")) from None
    if isinstance(data, dict):
        return [data]
    return [d for d in data if isinstance(d, dict)]


def require_windows():
    if not core.IS_WINDOWS:
        raise RuntimeError(_("This check is only available on Windows."))
