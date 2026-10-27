"""The "hacking style" scan screen: a green terminal that streams the files being checked,
and soft computer sounds that play while NoorCleaner scans.

Sounds are tiny tones made in memory and played with winsound, so there are no sound files and
nothing to install. On other systems the sounds are simply skipped.
"""

import io
import itertools
import math
import os
import struct
import sys
import time
import tkinter as tk
import wave

try:
    import winsound
except ImportError:  # not Windows
    winsound = None

BLACK = "#020b06"
GREEN = "#39ff7a"
GREEN_DIM = "#1f9d4d"
AMBER = "#ffc857"
RED = "#ff5c5c"

RATE = 22050
TICK_NOTES = (1320, 1568, 1760, 1976, 2349)  # a pentatonic-ish run, so the ticks sound like a machine thinking
MAX_LINES = 400


def _tone(notes, millis, volume=0.35):
    """WAV bytes for the given notes played one after another, each fading out."""
    frames = bytearray()
    for note in notes:
        count = int(RATE * millis / 1000)
        for i in range(count):
            fade = (1 - i / count) ** 2
            frames += struct.pack("<h", int(32767 * volume * fade * math.sin(2 * math.pi * note * i / RATE)))
    out = io.BytesIO()
    with wave.open(out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(bytes(frames))
    return out.getvalue()


class ScanSound:
    """Soft ticks while scanning, a rising chime when it finishes and a low double beep for a threat."""

    def __init__(self, enabled=True):
        self.available = winsound is not None
        self.enabled = enabled and self.available
        self._ticks = itertools.cycle([_tone([n], 22, 0.22) for n in TICK_NOTES]) if self.available else None
        self._done = _tone([880, 1175, 1568], 120) if self.available else None
        self._alarm = _tone([330, 262, 330, 262], 110, 0.45) if self.available else None
        self._last_tick = 0.0

    def _play(self, data):
        if not self.enabled:
            return
        try:
            winsound.PlaySound(data, winsound.SND_MEMORY | winsound.SND_ASYNC | winsound.SND_NODEFAULT)
        except (RuntimeError, OSError):
            self.enabled = False  # no sound device: stop trying

    def set_enabled(self, on):
        self.enabled = bool(on) and self.available
        if not self.enabled:
            self.stop()

    def tick(self):
        now = time.monotonic()
        if self.enabled and now - self._last_tick > 0.09:
            self._last_tick = now
            self._play(next(self._ticks))

    def finished(self):
        self._play(self._done)

    def threat(self):
        self._play(self._alarm)

    def stop(self):
        if self.available:
            try:
                winsound.PlaySound(None, winsound.SND_PURGE)
            except (RuntimeError, OSError):
                pass


def _font(px):
    family = "Consolas" if sys.platform == "win32" else "DejaVu Sans Mono"
    return (family, max(9, round(9 * px(1))))


class ScanScreen(tk.Frame):
    """A black screen with green text. Lines are added with line(); old ones scroll away."""

    def __init__(self, parent, px, height=9):
        super().__init__(parent, bg=BLACK, highlightthickness=1, highlightbackground=GREEN_DIM)
        self.text = tk.Text(self, bg=BLACK, fg=GREEN, insertbackground=GREEN, relief="flat", height=height,
                            wrap="none", state="disabled", cursor="arrow", font=_font(px), padx=px(10), pady=px(6),
                            highlightthickness=0, selectbackground=GREEN_DIM)
        self.text.pack(fill="both", expand=True)
        self.text.tag_configure("ok", foreground=GREEN)
        self.text.tag_configure("dim", foreground=GREEN_DIM)
        self.text.tag_configure("warn", foreground=AMBER)
        self.text.tag_configure("bad", foreground=RED)
        self.width_chars = 110
        self.bind("<Configure>", self._resized)

    def _resized(self, event):
        char = max(1, self.text.winfo_reqwidth() // max(1, self.text.cget("width")))
        self.width_chars = max(40, event.width // char)

    def line(self, text, tag="ok"):
        self.lines([(text, tag)])

    def lines(self, items):
        """Adds several lines at once (one redraw) and keeps the newest in view."""
        t = self.text
        t.configure(state="normal")
        for text, tag in items:
            t.insert("end", text + "\n", tag)
        extra = int(t.index("end-1c").split(".")[0]) - MAX_LINES
        if extra > 0:
            t.delete("1.0", f"{extra + 1}.0")
        t.see("end")
        t.configure(state="disabled")

    def clear(self):
        self.text.configure(state="normal")
        self.text.delete("1.0", "end")
        self.text.configure(state="disabled")

    # ------------------------------------------------------------------ what the scan prints

    def fit_path(self, path):
        """A path short enough for one line: the start and the end are kept, the middle is dropped."""
        room = self.width_chars - 20
        if len(path) <= room:
            return path
        keep = max(8, (room - 3) // 2)
        return path[:keep] + "..." + path[-keep:]

    def idle(self, version):
        self.clear()
        self.lines([(f"NOORCLEANER v{version}  //  READY", "ok"),
                    ("> storage analyser online", "dim"), ("> awaiting your command_", "dim")])

    def begin(self, places):
        self.clear()
        self.lines([("> INITIALISING SCAN ENGINE ...", "ok"), ("> TARGETS: " + "  ".join(places), "dim"),
                    ("> READ-ONLY MODE: nothing is changed or deleted", "dim")])

    def checked(self, entries):
        self.lines([(f"[ OK ] {self.fit_path(os.path.normpath(e.path))}", "ok") for e in entries])

    def finding(self, finding, threat):
        tag = "bad" if threat else "warn"
        label = "THREAT" if threat else "DAMAGED"
        self.line(f"[ !! ] {label}: {self.fit_path(os.path.normpath(finding.path))}  ({finding.reason})", tag)

    def finished(self, files, threats, corrupted, stopped=False):
        self.lines([("> SCAN STOPPED" if stopped else "> SCAN COMPLETE", "warn" if stopped else "ok"),
                    (f"> files checked: {files:,}   threats: {threats}   corrupted: {corrupted}", "dim")])
