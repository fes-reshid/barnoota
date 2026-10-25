"""The Noor Shield look for Tkinter.

Same palette and shapes as the Noor Shield desktop app
(noor-shield-pc/src/renderer/styles.css): sand background, white rounded
panels, green buttons, gold accents and a dark green sidebar. Rounded shapes
are anti-aliased PNGs drawn here at start-up (sized for the screen's DPI) and
used as stretchable ttk image elements, so no image files are needed.
"""

import base64
import struct
import tkinter as tk
import zlib
from tkinter import font as tkfont
from tkinter import ttk

SAND = "#f6f5f0"
SURFACE = "#ffffff"
SURFACE_2 = "#edeae1"
INK = "#16241d"
INK_SOFT = "#4b5a52"
INK_FAINT = "#8a968e"
GREEN = "#1b5e4f"
GREEN_DEEP = "#0a1a14"
GREEN_DIM = "#2a6f5e"
GOLD = "#c9a24b"
GOOD = "#2e7d32"
WARN = "#b26a00"
DANGER = "#a3352b"
LINE = "#ddd8cb"

GOOD_TINT = "#e2ede2"      # GOOD at 14% on white, like .statuspill.on
WARN_TINT = "#f3e7d6"      # WARN at 16% on white, like .statuspill.off
DANGER_TINT = "#f2e3e1"    # DANGER at 14% on white
NAV_TEXT = "#babfbd"       # white at 72% on GREEN_DEEP
NAV_HOVER = "#1b2a24"      # white at 7% on GREEN_DEEP

FONT = "Segoe UI"  # Noor Shield's font; replaced by a close match where it is missing
_FONT_FALLBACKS = ("Segoe UI", "Inter", "Noto Sans", "DejaVu Sans", "Helvetica")


def _rgb(color):
    return tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))


def _png(width, height, rows):
    raw = b"".join(b"\x00" + bytes(c for pixel in row for c in pixel) for row in rows)

    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))


def rounded_png(radius, fill, border=None, border_width=1, middle=120):
    """PNG bytes of an anti-aliased rounded rectangle, used as a 9-slice.

    Tk repeats (tiles) the middle of an image element to fill large areas, so
    the middle is kept big: a tiny one makes every redraw of a large panel slow.
    """
    edge = radius + 2
    size = 2 * edge + middle
    fill_rgb = _rgb(fill)
    border_rgb = _rgb(border) if border else fill_rgb

    def coverage(px, py, inset):
        r = radius - inset
        lo, hi = inset + r, size - inset - r
        dx = max(lo - px, 0, px - hi)
        dy = max(lo - py, 0, py - hi)
        return min(max(0.5 - ((dx * dx + dy * dy) ** 0.5 - r), 0.0), 1.0)

    def pixel(x, y):
        outer = coverage(x + 0.5, y + 0.5, 0)
        if outer <= 0:
            return (0, 0, 0, 0)
        inner = coverage(x + 0.5, y + 0.5, border_width) if border else outer
        rgb = tuple(round((b * (outer - inner) + f * inner) / outer) for b, f in zip(border_rgb, fill_rgb))
        return rgb + (round(outer * 255),)

    def row(y):  # every middle column of a row looks the same
        return ([pixel(x, y) for x in range(edge)] + [pixel(edge, y)] * middle
                + [pixel(x, y) for x in range(size - edge, size)])

    rows = ([row(y) for y in range(edge)] + [row(edge)] * middle
            + [row(y) for y in range(size - edge, size)])
    return _png(size, size, rows)


def get_style(root):
    """The theme for this window, created once (ttk elements can only be defined once per Tk root)."""
    style = getattr(root, "_noor_style", None)
    if style is None:
        style = root._noor_style = NoorStyle(root)
    return style


class NoorStyle:
    """Applies the theme to a Tk root and keeps the generated images alive."""

    @property
    def card_padding(self):
        return (self.px(20), self.px(16))

    def __init__(self, root):
        global FONT
        self.root = root
        families = set(tkfont.families(root))
        FONT = next((f for f in _FONT_FALLBACKS if f in families), "TkDefaultFont")
        self.scale = max(1.0, root.winfo_fpixels("1i") / 96)
        self.images = {}
        self.style = ttk.Style(root)
        self.style.theme_use("clam")
        root.configure(bg=SAND)
        self._base()
        self._panels()
        self._buttons()
        self._labels()
        self._controls()

    def px(self, value):
        return max(1, round(value * self.scale))

    def _image(self, name, radius, fill, border=None):
        if name not in self.images:
            data = base64.b64encode(rounded_png(self.px(radius), fill, border))
            self.images[name] = tk.PhotoImage(master=self.root, data=data)
        return self.images[name]

    def _element(self, name, radius, normal, states=()):
        """A stretchable rounded image element. normal/states: (fill, border) pairs."""
        border = self.px(radius) + 2  # the corner zone; see rounded_png
        specs = [self._image(f"{name}-normal", radius, *normal)]
        for state, colors in states:
            specs.append((state, self._image(f"{name}-{state.replace('!', 'not')}", radius, *colors)))
        # width/height: the minimum size, so the big image never makes the widget big
        self.style.element_create(f"{name}.bg", "image", *specs, border=border, sticky="nsew",
                                  width=2 * border + 2, height=2 * border + 2)

    def _base(self):
        s = self.style
        s.configure(".", background=SAND, foreground=INK, font=(FONT, 10), bordercolor=LINE,
                    lightcolor=SURFACE, darkcolor=LINE, troughcolor=SURFACE_2, focuscolor=GOLD,
                    selectbackground=GREEN_DIM, selectforeground="#ffffff")
        s.configure("TFrame", background=SAND)
        s.configure("Sidebar.TFrame", background=GREEN_DEEP)
        s.configure("Plain.TFrame", background=SURFACE)

    def _panels(self):
        s = self.style
        self._element("Card", 12, (SURFACE, LINE))
        s.layout("Card.TFrame", [("Card.bg", {"sticky": "nsew"})])
        s.configure("Card.TFrame", background=SAND)
        self._element("Note", 12, (SURFACE_2, None))
        s.layout("Note.TFrame", [("Note.bg", {"sticky": "nsew"})])
        s.configure("Note.TFrame", background=SAND)
        for name, fill, fg in (("Pill", SURFACE_2, INK_SOFT), ("PillOn", GOOD_TINT, GOOD), ("PillOff", WARN_TINT, WARN),
                               ("PillBad", DANGER_TINT, DANGER)):
            self._element(name, 9, (fill, None))
            s.layout(f"{name}.TLabel", [("Label.background", {"sticky": "nsew", "children": [
                (f"{name}.bg", {"sticky": "nsew", "children": [
                    ("Label.padding", {"sticky": "nsew", "children": [("Label.label", {"sticky": "nsew"})]})]})]})])
            s.configure(f"{name}.TLabel", background=SURFACE, foreground=fg, font=(FONT, 9, "bold"),
                        padding=(self.px(12), self.px(3)))

    def _buttons(self):
        s = self.style
        kinds = {
            "Primary": ((GREEN, None), [("disabled", (INK_FAINT, None)), ("pressed", (GREEN_DEEP, None)),
                                        ("active", (GREEN_DIM, None))], "#ffffff"),
            "Danger": ((DANGER, None), [("disabled", (INK_FAINT, None)), ("pressed", ("#7a271f", None)),
                                        ("active", ("#8e2c23", None))], "#ffffff"),
            "Ghost": ((SURFACE, LINE), [("disabled", (SURFACE, LINE)), ("pressed", (SURFACE_2, LINE)),
                                        ("active", ("#f3f1ea", LINE))], INK_SOFT),
        }
        for name, (normal, states, fg) in kinds.items():
            self._element(name, 8, normal, states)
            s.layout(f"{name}.TButton", [("Button.background", {"sticky": "nsew", "children": [
                (f"{name}.bg", {"sticky": "nsew", "children": [
                    ("Button.padding", {"sticky": "nsew", "children": [("Button.label", {"sticky": "nsew"})]})]})]})])
            s.configure(f"{name}.TButton", background=SURFACE, foreground=fg, font=(FONT, 10, "bold"),
                        padding=(self.px(16), self.px(7)), anchor="center", width=0)
            s.map(f"{name}.TButton", foreground=[("disabled", "#ffffff" if fg == "#ffffff" else INK_FAINT)])
            s.configure(f"{name}Sand.TButton", background=SAND)
            s.layout(f"{name}Sand.TButton", s.layout(f"{name}.TButton"))
            s.configure(f"{name}Sand.TButton", foreground=fg, font=(FONT, 10, "bold"),
                        padding=(self.px(16), self.px(7)), anchor="center", width=0)

        # Sidebar navigation, like .navitem / .navitem.active
        self._element("Nav", 8, (GREEN_DEEP, None), [("pressed", (GREEN, None)), ("active", (NAV_HOVER, None))])
        self._element("NavOn", 8, (GREEN, None))
        for name, fg, weight in (("Nav", NAV_TEXT, "normal"), ("NavOn", "#ffffff", "bold")):
            s.configure(f"{name}.TButton", background=GREEN_DEEP, foreground=fg, font=(FONT, 10, weight),
                        padding=(self.px(12), self.px(7)), width=0)
        self.set_direction(rtl=False)
        s.map("Nav.TButton", foreground=[("active", "#ffffff")])

    def set_direction(self, rtl):
        """Sidebar items line their text up on the right for right-to-left languages."""
        side = "e" if rtl else "w"
        for name in ("Nav", "NavOn"):
            self.style.layout(f"{name}.TButton", [("Button.background", {"sticky": "nsew", "children": [
                (f"{name}.bg", {"sticky": "nsew", "children": [
                    ("Button.padding", {"sticky": "nsew", "children": [("Button.label", {"sticky": side})]})]})]})])
            self.style.configure(f"{name}.TButton", anchor=side)

    def _labels(self):
        s = self.style
        on_card = dict(background=SURFACE)
        s.configure("H1.TLabel", font=(FONT, 16, "bold"), foreground=INK)
        s.configure("Sub.TLabel", foreground=INK_SOFT)
        s.configure("Card.TLabel", **on_card, foreground=INK)
        s.configure("CardSub.TLabel", **on_card, foreground=INK_SOFT)
        s.configure("H3.TLabel", **on_card, foreground=INK, font=(FONT, 10, "bold"))
        s.configure("Hint.TLabel", **on_card, foreground=INK_FAINT, font=(FONT, 9))
        s.configure("Metric.TLabel", **on_card, foreground=GREEN, font=(FONT, 17, "bold"))
        s.configure("MetricLabel.TLabel", **on_card, foreground=INK_FAINT, font=(FONT, 8))
        s.configure("Size.TLabel", **on_card, foreground=GREEN, font=(FONT, 10, "bold"))
        s.configure("Note.TLabel", background=SURFACE_2, foreground=INK_SOFT)
        s.configure("NoteH3.TLabel", background=SURFACE_2, foreground=INK, font=(FONT, 10, "bold"))
        s.configure("Brand.TLabel", background=GREEN_DEEP, foreground="#ffffff", font=(FONT, 12, "bold"))
        s.configure("SideNote.TLabel", background=GREEN_DEEP, foreground=NAV_TEXT, font=(FONT, 9))
        s.configure("Link.TLabel", background=GREEN_DEEP, foreground=GOLD, font=(FONT, 9, "underline"))

    def _controls(self):
        s = self.style
        s.configure("Card.TCheckbutton", background=SURFACE, foreground=INK, indicatorbackground=SURFACE,
                    indicatorforeground="#ffffff", upperbordercolor=LINE, lowerbordercolor=LINE,
                    indicatormargin=(0, 0, self.px(6), 0), padding=(0, self.px(2)))
        s.map("Card.TCheckbutton",
              indicatorbackground=[("disabled", SURFACE_2), ("selected", GREEN_DIM)],
              upperbordercolor=[("selected", GREEN_DIM)], lowerbordercolor=[("selected", GREEN_DIM)],
              foreground=[("disabled", INK_FAINT)], background=[("active", SURFACE)])
        s.configure("Bold.Card.TCheckbutton", font=(FONT, 10, "bold"))
        s.configure("Card.TRadiobutton", background=SURFACE, foreground=INK, indicatorbackground=SURFACE,
                    indicatorforeground="#ffffff", upperbordercolor=LINE, lowerbordercolor=LINE,
                    indicatormargin=(0, 0, self.px(6), 0), padding=(0, self.px(2)))
        s.map("Card.TRadiobutton",
              indicatorbackground=[("selected", GREEN_DIM)], upperbordercolor=[("selected", GREEN_DIM)],
              lowerbordercolor=[("selected", GREEN_DIM)], background=[("active", SURFACE)])

        s.configure("TEntry", fieldbackground=SURFACE, foreground=INK, bordercolor=LINE,
                    lightcolor=LINE, darkcolor=LINE, padding=(self.px(8), self.px(5)))
        s.map("TEntry", bordercolor=[("focus", GREEN_DIM)], lightcolor=[("focus", GREEN_DIM)])

        s.configure("TCombobox", fieldbackground=SURFACE, background=SURFACE, foreground=INK, bordercolor=LINE,
                    lightcolor=LINE, darkcolor=LINE, arrowcolor=INK_SOFT, padding=(self.px(8), self.px(4)))
        s.map("TCombobox", fieldbackground=[("readonly", SURFACE)], selectbackground=[("readonly", SURFACE)],
              selectforeground=[("readonly", INK)], bordercolor=[("focus", GREEN_DIM)],
              background=[("active", SURFACE_2)])
        self.root.option_add("*TCombobox*Listbox.background", SURFACE)
        self.root.option_add("*TCombobox*Listbox.selectBackground", GREEN_DIM)
        self.root.option_add("*TCombobox*Listbox.font", (FONT, 10))

        s.configure("Treeview", background=SURFACE, fieldbackground=SURFACE, foreground=INK,
                    rowheight=self.px(26), borderwidth=0, font=(FONT, 10))
        s.map("Treeview", background=[("selected", GREEN_DIM)], foreground=[("selected", "#ffffff")])
        s.layout("Treeview", [("Treeview.treearea", {"sticky": "nsew"})])
        s.configure("Treeview.Heading", background=SURFACE_2, foreground=INK_SOFT, relief="flat",
                    font=(FONT, 9, "bold"), bordercolor=SURFACE_2, lightcolor=SURFACE_2, darkcolor=SURFACE_2,
                    padding=(self.px(6), self.px(4)))
        s.map("Treeview.Heading", background=[("active", LINE)])

        for orient in ("Vertical", "Horizontal"):
            s.configure(f"{orient}.TScrollbar", background=SURFACE_2, troughcolor=SURFACE, bordercolor=SURFACE,
                        lightcolor=SURFACE_2, darkcolor=SURFACE_2, arrowcolor=INK_FAINT, gripcount=0,
                        arrowsize=self.px(12))
            s.map(f"{orient}.TScrollbar", background=[("active", LINE)])

        for name, color in (("Green", GREEN_DIM), ("Low", WARN)):
            s.configure(f"{name}.Horizontal.TProgressbar", troughcolor=SURFACE_2, background=color,
                        bordercolor=SURFACE_2, lightcolor=color, darkcolor=color, thickness=self.px(8))

        s.configure("TPanedwindow", background=SAND)
        s.configure("Sash", sashthickness=self.px(14), gripcount=0, background=SAND,
                    lightcolor=SAND, bordercolor=SAND)
        s.configure("Line.TSeparator", background=LINE)
