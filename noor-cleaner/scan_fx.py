"""The "hacking style" scan screen: a green terminal that streams the files being checked,
and soft computer sounds that play while NoorCleaner scans.

Sounds are tiny tones the app makes itself and plays with winsound, so there is nothing to install.
On other systems the sounds are simply skipped.
"""

import io
import itertools
import os
import random
import struct
import sys
import tempfile
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
MAX_LINES = 400


def _wav(samples):
    out = io.BytesIO()
    with wave.open(out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", max(-32767, min(32767, int(v * 32767)))) for v in samples))
    return out.getvalue()


def _chirp(f1, f2, millis, volume=0.3, shape="square"):
    """Samples of a digital blip that slides from pitch f1 to f2 and fades out."""
    count = int(RATE * millis / 1000)
    phase, samples = 0.0, []
    for i in range(count):
        f = f1 * (f2 / f1) ** (i / count)
        phase += f / RATE
        frac = phase % 1.0
        wave_value = (1.0 if frac < 0.5 else -1.0) if shape == "square" else 2 * frac - 1  # square or saw
        samples.append(volume * wave_value * (1 - i / count) ** 1.5)
    return samples


def _click(volume=0.35, millis=9, seed=1):
    """A short burst of noise, like a key being struck."""
    rng = random.Random(seed)
    count = int(RATE * millis / 1000)
    return [volume * (rng.random() * 2 - 1) * (1 - i / count) ** 2 for i in range(count)]


def _mix(*parts):
    """Plays the (delay_ms, samples) parts on top of each other."""
    length = max(int(RATE * delay / 1000) + len(samples) for delay, samples in parts)
    mixed = [0.0] * length
    for delay, samples in parts:
        start = int(RATE * delay / 1000)
        for i, v in enumerate(samples):
            mixed[start + i] += v
    return mixed


def _tick_sounds():
    """A few different data-burst ticks: a key click with one or two quick rising chirps."""
    sounds = []
    for n in range(6):
        base = 700 + 260 * n
        parts = [(0, _click(0.3, 9, n)), (4, _chirp(base, base * 1.7, 30, 0.2))]
        if n % 2:
            parts.append((34, _chirp(base * 2, base * 2.7, 22, 0.14)))
        sounds.append(_wav(_mix(*parts)))
    return sounds


class ScanSound:
    """Hacker-style sounds: a boot-up sweep, data-burst ticks while scanning, a rising chirp when it ends
    and a siren for a threat.

    Windows cannot play a sound from memory in the background, so the sounds are written once as small
    .wav files in the temp folder and played from there.
    """

    def __init__(self, enabled=True):
        self.available = winsound is not None
        self.enabled = enabled and self.available
        self._last_tick = 0.0
        self._quiet_until = 0.0  # ticks wait while a longer sound is still playing
        self._ticks = self._start = self._done = self._alarm = None
        if not self.available:
            return
        try:
            folder = os.path.join(tempfile.gettempdir(), "NoorCleaner-sounds")
            os.makedirs(folder, exist_ok=True)
            self._ticks = itertools.cycle([self._save(folder, f"tick{n}", data) for n, data in enumerate(_tick_sounds())])
            self._start = self._save(folder, "start", _wav(_chirp(200, 1800, 450, 0.25, "saw")))
            self._done = self._save(folder, "done", _wav(_mix((0, _chirp(500, 1000, 120, 0.3)),
                                                              (130, _chirp(800, 1600, 120, 0.3)),
                                                              (260, _chirp(1200, 2400, 260, 0.3)))))
            self._alarm = self._save(folder, "alarm", _wav(_mix((0, _chirp(900, 300, 220, 0.4, "saw")),
                                                               (260, _chirp(900, 300, 220, 0.4, "saw")))))
        except OSError:
            self.available = self.enabled = False  # cannot write the sound files: run silently

    @staticmethod
    def _save(folder, name, data):
        path = os.path.join(folder, name + ".wav")
        with open(path, "wb") as f:
            f.write(data)
        return path

    def _play(self, path, seconds=0.0):
        if not self.enabled or not path:
            return
        try:
            winsound.PlaySound(path, winsound.SND_FILENAME | winsound.SND_ASYNC | winsound.SND_NODEFAULT)
            self._quiet_until = time.monotonic() + seconds
        except (RuntimeError, OSError):
            self.enabled = False  # no sound device: stop trying

    def set_enabled(self, on):
        self.enabled = bool(on) and self.available
        if not self.enabled:
            self.stop()

    def tick(self):
        now = time.monotonic()
        if self.enabled and now - self._last_tick > 0.09 and now > self._quiet_until:
            self._last_tick = now
            self._play(next(self._ticks))

    def started(self):
        self._play(self._start, 0.45)

    def finished(self):
        self._play(self._done, 0.6)

    def threat(self):
        self._play(self._alarm, 0.5)

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
