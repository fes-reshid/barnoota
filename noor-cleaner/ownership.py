"""Which program do files belong to?

Before anything is removed, the confirmation window shows which installed program (or Windows) each file belongs to,
so nobody deletes a program's files by accident. A file belongs to a program when it is inside the program's install
folder, or inside a folder in Program Files, ProgramData or AppData named after the program (or its publisher).
"""

import ntpath
import os
from dataclasses import dataclass

from i18n import _

PROGRAM, WINDOWS, DATA, OTHER, PERSONAL = "program", "windows", "data", "other", "personal"

# Folders that hold things for many programs: they say nothing about one program.
GENERIC_FOLDERS = {"microsoft", "windows", "packages", "temp", "programs", "common files", "windowsapps", "crashdumps",
                   "d3dscache", "history", "inetcache", "publishers", "wer", "package cache", "installer", "software",
                   "microsoft shared", "system32", "syswow64", "winsxs", "downloaded installations", "caches"}


@dataclass
class Owner:
    kind: str       # PROGRAM, WINDOWS, DATA (data of a program that is not in the installed list), OTHER
                    # (temporary or shared files that belong to no one program) or PERSONAL
    name: str       # the program's name, or the folder name for DATA

    @property
    def label(self):
        if self.kind == WINDOWS:
            return _("Windows")
        if self.kind == DATA:
            return _("Data of {name}").format(name=self.name)
        if self.kind == OTHER:
            return _("Temporary or shared files")
        if self.kind == PERSONAL:
            return _("Your own files")
        return self.name


def _norm(path):
    return ntpath.normcase(ntpath.normpath(path.replace("/", "\\")))


class OwnerIndex:
    def __init__(self, programs, environ=None):
        env = environ if environ is not None else os.environ
        get = lambda name, default="": env.get(name) or env.get(name.upper()) or default  # noqa: E731
        self.programs = [p for p in programs]
        self.locations = sorted(
            ((_norm(p.location) + "\\", p.name) for p in self.programs
             if p.location and len(ntpath.normpath(p.location).strip("\\").split("\\")) >= 3),
            key=lambda item: -len(item[0]))
        self.windows = _norm(get("SystemRoot", r"C:\Windows")) + "\\"
        local, roaming = get("LOCALAPPDATA"), get("APPDATA")
        roots = [get("ProgramFiles"), get("ProgramFiles(x86)"), get("ProgramData"),
                 ntpath.join(local, "Programs") if local else "", local, roaming,
                 ntpath.join(ntpath.dirname(local), "LocalLow") if local else ""]
        self.data_roots = sorted({_norm(r) + "\\" for r in roots if r}, key=lambda r: -len(r))

    def _match_folder(self, folder):
        """The installed program a folder named `folder` belongs to, or None."""
        f = folder.lower()
        if f in GENERIC_FOLDERS or len(f) < 3:
            return None
        best, best_rank = None, 9
        for p in self.programs:
            name, publisher = p.name.lower(), p.publisher.lower()
            base = ntpath.basename(p.location.rstrip("\\/")).lower() if p.location else ""
            if f == base or f == name:
                rank = 0
            elif name.startswith(f) or f.startswith(name):
                rank = 1
            elif len(f) >= 4 and f in name.split():
                rank = 2
            elif publisher.split() and publisher.split()[0].strip(",.") == f:
                rank = 3
            else:
                continue
            if rank < best_rank:
                best, best_rank = p, rank
        return best

    def owner_of(self, path):
        full = _norm(path)
        for prefix, name in self.locations:
            if full.startswith(prefix):
                return Owner(PROGRAM, name)
        if full.startswith(self.windows):
            return Owner(WINDOWS, "Windows")
        for root in self.data_roots:
            if full.startswith(root):
                parts = full[len(root):].split("\\")
                folder = parts[0] if parts else ""
                if folder and len(parts) > 1:
                    program = self._match_folder(folder)
                    if program:
                        return Owner(PROGRAM, program.name)
                    if folder not in GENERIC_FOLDERS:
                        return Owner(DATA, ntpath.basename(ntpath.normpath(path[:len(root) + len(folder)])) or folder)
                    return Owner(OTHER, "")
                break
        return Owner(PERSONAL, "")


def summarise(index, items):
    """items: [(path, size)]. Returns (rows, groups): rows [(owner label, path, size, kind)] and groups
    {owner label: [kind, file count, bytes]} - program and Windows groups first."""
    rows, groups = [], {}
    for path, size in items:
        owner = index.owner_of(path)
        rows.append((owner.label, path, size, owner.kind))
        group = groups.setdefault(owner.label, [owner.kind, 0, 0])
        group[1] += 1
        group[2] += size or 0
    order = {PROGRAM: 0, WINDOWS: 1, DATA: 2, OTHER: 3, PERSONAL: 4}
    rows.sort(key=lambda r: (order[r[3]], r[0], r[1].lower()))
    return rows, dict(sorted(groups.items(), key=lambda g: (order[g[1][0]], g[0])))
