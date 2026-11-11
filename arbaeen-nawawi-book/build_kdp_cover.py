#!/usr/bin/env python3
"""Amazon KDP paperback cover: one wrap-around PDF (back + spine + front) with 0.125in bleed.

Run after `EDITION=kdp python3 build.py`; the spine width is computed from the interior's page count.
KDP white paper, black ink: spine = pages x 0.002252 in.
"""
import os, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "src"))
import front  # noqa: E402
from figures import FIGURES  # noqa: E402
from pypdf import PdfReader  # noqa: E402

OUT_DIR = os.path.join(ROOT, "amazon-kdp")
COLOR = "color" in sys.argv[1:]   # python3 build_kdp_cover.py color  -> US Letter standard-colour edition
INTERIOR = os.path.join(OUT_DIR, "Forty-Hadith-KDP-Interior-Color.pdf" if COLOR else "Forty-Hadith-KDP-Interior-BW.pdf")
OUT = os.path.join(OUT_DIR, "Forty-Hadith-KDP-Cover-Color.pdf" if COLOR else "Forty-Hadith-KDP-Cover.pdf")
BLEED = 0.125
TRIM_W, TRIM_H = (8.5, 11.0) if COLOR else (8.27, 11.69)
PER_PAGE = 0.002252  # KDP white paper (black ink) and standard colour

BLURB = [
    "Imam an-Nawawī gathered forty-two short hadith, each one “a great foundation of the religion”. "
    "A century later al-Ḥāfiẓ Ibn Rajab added eight more. Together these fifty hadith hold the heart of Islam: "
    "belief, worship, character, dealings with people and the purification of the heart.",
    "This study edition turns them into a year of learning — one hadith a week. Read the Arabic, understand the meaning, "
    "meet the Companion who narrated it, then put it into practice with a to-do list for every day of the week.",
]
FEATURES = [
    "Fully voweled Arabic, with the Prophet’s ﷺ words highlighted",
    "English translation of every hadith",
    "A biography of each narrating Companion",
    "Explanatory notes, lessons and clear illustrations",
    "Step-by-step guides and weekly to-do lists",
    "Five review tests — 250 questions — with answer key",
    "Free online edition with audio and a certificate",
]


# On US Letter the A4 front design is kept: the frame and arch stretch to the page,
# and the lettering is scaled evenly (no distortion) and centred.
SCALE = 11.0 / 11.69
LETTER_CSS = f"""
.front .cover > .art {{ width: 100% !important; height: 100% !important; }}
.front .ov {{ position: absolute; left: 50%; top: 0; width: 210mm; height: 297mm; transform: translateX(-50%) scale({SCALE:.4f}); transform-origin: top center; }}
.back .in {{ transform: scale(.95); transform-origin: top center; }}
"""


def front_panel(lamp):
    if not COLOR:
        return front.cover_html_inner(lamp)
    inner = front.cover_html_inner(lamp)
    art_end = inner.index("</svg>") + len("</svg>")
    # <div class="cover"><svg art/> ...lettering... </div>  ->  art stretched, lettering in a scaled overlay
    return inner[:art_end] + '<div class="ov">' + inner[art_end:-len("</div>")] + "</div></div>"


def html(spine_in):
    W = 2 * BLEED + 2 * TRIM_W + spine_in
    H = 2 * BLEED + TRIM_H
    css = open(os.path.join(ROOT, "src", "book.css"), encoding="utf-8").read()
    feats = "".join(f"<li>{f}</li>" for f in FEATURES)
    blurb = "".join(f"<p>{b}</p>" for b in BLURB)
    lamp = FIGURES["lantern"]
    front_x = BLEED + TRIM_W + spine_in
    return f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../fonts/fonts.css">
<style>{css}
@page {{ size: {W:.4f}in {H:.4f}in; margin: 0; }}
html, body {{ margin: 0; width: {W:.4f}in; height: {H:.4f}in; }}
.wrap {{ position: relative; width: {W:.4f}in; height: {H:.4f}in; overflow: hidden;
  background: radial-gradient(ellipse at 50% 45%, #145248 0%, #0c3d36 55%, #06231f 100%); }}
.panel {{ position: absolute; top: {BLEED}in; width: {TRIM_W}in; height: {TRIM_H}in; }}
.panel .cover {{ width: {TRIM_W}in; height: {TRIM_H}in; background: transparent; }}
.back {{ left: {BLEED}in; color: #f3e6c4; }}
.back .bframe {{ position: absolute; inset: 9mm; border: 1px solid #c9a14a; border-radius: 6mm; }}
.back .bframe2 {{ position: absolute; inset: 11.2mm; border: .4px solid #c9a14a; border-radius: 5mm; }}
.back .in {{ position: absolute; left: 22mm; right: 22mm; top: 26mm; }}
.back .b-ar {{ font-family: 'Amiri', serif; font-weight: 700; color: #ecd391; font-size: 30pt; text-align: center; }}
.back h2 {{ font-family: 'Cinzel', serif; color: #fff; font-size: 21pt; text-align: center; margin: 3mm 0 9mm; letter-spacing: .04em; line-height: 1.3; }}
.back p {{ font-family: 'Lora', serif; font-size: 12.4pt; line-height: 1.7; color: #f3ead2; text-align: justify; margin: 0 0 5mm; hyphens: none; }}
.back ul {{ list-style: none; padding: 0; margin: 8mm 0; }}
.back li {{ font-family: 'Lora', serif; font-size: 11.6pt; color: #fff; padding: 2.1mm 0 2.1mm 8mm; position: relative; border-bottom: 1px solid rgba(201,161,74,.25); }}
.back li::before {{ content: ""; position: absolute; left: 1mm; top: 4.4mm; width: 2.4mm; height: 2.4mm; background: #c9a14a; transform: rotate(45deg); }}
.back .quote {{ text-align: center; margin-top: 10mm; }}
.back .quote .qa {{ font-family: 'Amiri', serif; font-size: 26pt; color: #ecd391; }}
.back .quote .qe {{ font-family: 'Lora', serif; font-style: italic; font-size: 11.5pt; color: #d9c79a; }}
.back .by {{ position: absolute; left: 22mm; bottom: 20mm; font-family: 'Lora', serif; font-size: 9.5pt; color: #d9c79a; line-height: 1.5; }}
.back .by b {{ display: block; font-family: 'Cinzel', serif; color: #ecd391; font-size: 13pt; letter-spacing: .1em; }}
/* keep clear for the KDP barcode (2in x 1.2in, lower right of the back cover) */
.back .barcode {{ position: absolute; right: 0.25in; bottom: 0.25in; width: 2in; height: 1.2in; }}
.spine {{ position: absolute; top: 0; left: {BLEED + TRIM_W}in; width: {spine_in:.4f}in; height: {H:.4f}in;
  background: linear-gradient(90deg, #082b26, #0f4c45 50%, #082b26); border-left: .4px solid #c9a14a; border-right: .4px solid #c9a14a; }}
.spine .st {{ position: absolute; left: 50%; top: 50%; width: {TRIM_H - 1.2:.2f}in; transform: translate(-50%, -50%) rotate(90deg);
  display: flex; align-items: center; justify-content: space-between; white-space: nowrap; }}
.spine .t1 {{ font-family: 'Cinzel', serif; font-weight: 700; color: #ecd391; font-size: 10pt; letter-spacing: .1em; }}
.spine .t2 {{ font-family: 'Amiri', serif; font-weight: 700; color: #fff; font-size: 11pt; }}
.spine .t3 {{ font-family: 'Cinzel', serif; color: #d9c79a; font-size: 8.5pt; letter-spacing: .12em; }}
.front {{ left: {front_x:.4f}in; }}
{LETTER_CSS if COLOR else ""}
</style></head><body><div class="wrap">
<div class="panel back"><div class="bframe"></div><div class="bframe2"></div>
  <div class="in">
    <div class="b-ar" lang="ar" dir="rtl">الأَرْبَعُونَ النَّوَوِيَّةُ</div>
    <h2>Fifty hadith that hold<br>the whole religion</h2>
    {blurb}
    <ul>{feats}</ul>
    <div class="quote"><div class="qa" lang="ar" dir="rtl">«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ»</div><div class="qe">“Actions are only by intentions.” — Hadith 1</div></div>
  </div>
  <div class="by"><b>Feysel Reshid</b>Compiler · Diin Islaam<br>diinislaam.com/arbaeen-nawawi</div>
  <div class="barcode"></div>
</div>
<div class="spine"><div class="st"><span class="t1">The Forty Hadith of Imam an-Nawawi</span><span class="t2" lang="ar">الأربعون النووية</span><span class="t3">Feysel Reshid</span></div></div>
<div class="panel front">{front_panel(lamp)}</div>
</div></body></html>'''


def main():
    pages = len(PdfReader(INTERIOR).pages)
    spine = pages * PER_PAGE
    W = 2 * BLEED + 2 * TRIM_W + spine
    H = 2 * BLEED + TRIM_H
    hp = os.path.join(ROOT, ".build-kdp", "kdp-cover.html")
    os.makedirs(os.path.dirname(hp), exist_ok=True)
    open(hp, "w", encoding="utf-8").write(html(spine))
    out = OUT
    subprocess.run(["node", os.path.join(ROOT, "render.js"), hp, out], check=True)
    # Chromium rounds the page to whole pixels; trim to the exact KDP size (content is anchored top-left)
    from pypdf import PdfWriter
    from pypdf.generic import RectangleObject
    r = PdfReader(out)
    page = r.pages[0]
    top = float(page.mediabox.top)
    box = RectangleObject([0, top - H * 72, W * 72, top])
    page.mediabox = box
    page.cropbox = box
    page.trimbox = box
    wtr = PdfWriter()
    wtr.add_page(page)
    with open(out, "wb") as f:
        wtr.write(f)
    pg = PdfReader(out).pages
    w_in, h_in = float(pg[0].mediabox.width) / 72, float(pg[0].mediabox.height) / 72
    print(f"interior pages: {pages}  spine: {spine:.3f} in  cover: {W:.3f} x {H:.3f} in  (pdf {w_in:.3f} x {h_in:.3f}, {len(pg)} page)")


if __name__ == "__main__":
    main()
