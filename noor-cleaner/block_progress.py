"""Classic green block progress bar, like the one in old Windows: little green squares that fill the bar."""
import tkinter as tk

BLOCK_GREEN = "#2fb12f"
TRACK = "#ffffff"


def blocks_filled(value, maximum, total):
    """How many of `total` blocks are lit for value out of maximum."""
    if maximum <= 0 or total <= 0:
        return 0
    return max(0, min(total, int(total * value / maximum)))


def percent_parts(value, maximum):
    """(done, left) whole percents that always add up to 100."""
    done = 0 if maximum <= 0 else max(0, min(100, int(100 * value / maximum)))
    return done, 100 - done


class BlockProgress(tk.Canvas):
    """Mimics the bits of ttk.Progressbar the app uses: config(mode, maximum, value), start(), stop()."""

    def __init__(self, master, px=lambda v: v, **kw):
        self.px = px
        h = px(22)
        super().__init__(master, height=h, highlightthickness=1, highlightbackground="#8a968e",
                         bg=TRACK, bd=0, **kw)
        self.mode, self.maximum, self.value = "determinate", 100, 0
        self._pos, self._job = 0, None
        self._block, self._gap = self.px(12), self.px(3)
        self.bind("<Configure>", lambda e: self._draw())

    def config(self, cnf=None, **kw):
        for key in ("mode", "maximum", "value"):
            if key in kw:
                setattr(self, key, kw.pop(key))
        if cnf or kw:
            super().config(cnf or {}, **kw)
        self._draw()
    configure = config

    def start(self, interval=80):
        self.mode = "indeterminate"
        self.stop()
        self._tick(max(40, interval * 5))

    def _tick(self, interval):
        self._pos += 1
        self._draw()
        self._job = self.after(interval, self._tick, interval)

    def stop(self):
        if self._job:
            self.after_cancel(self._job)
            self._job = None

    def _draw(self):
        self.delete("all")
        width, height = self.winfo_width(), self.winfo_height()
        if width < 10:
            return
        step = self._block + self._gap
        total = max(1, (width - self._gap) // step)
        if self.mode == "indeterminate":
            lit = {(self._pos + i) % total for i in range(3)}
        else:
            lit = set(range(blocks_filled(self.value, self.maximum, total)))
        pad = self.px(3)
        for i in lit:
            x = self._gap + i * step
            self.create_rectangle(x, pad, x + self._block, height - pad, fill=BLOCK_GREEN, outline="")
