#!/usr/bin/env python3
"""Build the wrap-around covers (back + spine + front, with 3 mm bleed) for printing.

  python3 build_cover.py

One PDF per edition and per cover: Zaad-Cover-Wrap-Weekly.pdf, -Daily.pdf, and the two Ramadan 1448 gift versions.
The spine width is the page count of the interior PDF times PAPER_MM (the thickness of ONE page, which is half a sheet).
Your printer's cover calculator gives the exact figure for its paper: set PAPER_MM or SPINE_MM to match before you print.
Page size is A5 (148 x 210 mm); bleed 3 mm on all outer edges.
"""
import os, subprocess, sys

import pypdf

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "src"))
os.environ.setdefault("EDITION", "")
import build as B  # noqa: E402
import art  # noqa: E402

BLEED, W, H = 3.0, 148.0, 210.0
PAPER_MM = float(os.environ.get("PAPER_MM", "0.05"))
os.makedirs(B.BUILD, exist_ok=True)


def pages_of(name):
    p = os.path.join(ROOT, name)
    return len(pypdf.PdfReader(p).pages) if os.path.exists(p) else 400


def back_cover(edition, ramadan):
    weekly = edition == "Weekly"
    what = ("one week on two facing pages, to carry in your bag" if weekly else "a page for every day of the year")
    gift = '<p class="bk-p">Ramadan 1448 Edition: a gift for the month of the Qur&#39;an.</p>' if ramadan else ""
    return f'''<div class="bkc">
<div class="bk-t">ZAAD</div><div class="bk-ar" lang="ar" dir="rtl">زَادُ اليَوْم</div><div class="bk-s">Provision for the Day</div>
<div class="cv-r"><i></i>{B.STAR}<i></i></div>
<p class="bk-p">A Muslim's planner for 2027, with {what}, built around the five prayers.</p>
<ul class="bk-l">
<li>A hadith in Arabic and English for every week, with its narrator</li>
<li>The ninety-nine names of Allah, two to memorise each week</li>
<li>Hijri dates, Ramadan and Dhul-Hijjah pages, prayer-time strips</li>
<li>Qur'an, fasting, sadaqah and dua trackers</li>
<li>A Sunnah to practise every week; bookmarks and stickers</li></ul>
{gift}
<p class="bk-q">“And take provision, for the best provision is taqwa.”<span>al-Baqarah 2:197</span></p>
<div class="bk-bar"><span>Barcode / ISBN area</span></div>
<p class="bk-by">Compiled by Feysel Reshid · diinislaam.com</p></div>'''


def build(edition, ramadan):
    pages = pages_of(f"Zaad-Muslim-{edition}-Planner-2027.pdf")
    spine = float(os.environ.get("SPINE_MM", round(pages * PAPER_MM, 1)))
    B.RAMADAN_COVER = ramadan
    total_w = BLEED + W + spine + W + BLEED
    total_h = H + 2 * BLEED
    ac = B.MONTHS[1][3]
    scene = art.scene(2, ac) if ramadan else art.cover_art()
    back_scene = scene.replace('class="art"', 'class="art flip"')
    front = (f'<div class="fr">{scene}<div class="page r cover" style="position:absolute;left:0;top:{BLEED}mm;background:transparent">'
             f'<div class="in">{B.cover().replace("Daily Planner", "Weekly Planner") if edition == "Weekly" else B.cover()}</div></div></div>')
    html = f'''<!doctype html><html><head><meta charset="utf-8"><title>Zaad cover</title>
<link rel="stylesheet" href="../../arbaeen-nawawi-book/fonts/fonts.css"><style>
{open(os.path.join(ROOT, "src", "planner.css"), encoding="utf-8").read()}
@page {{ size: {total_w}mm {total_h}mm; margin: 0; }}
.wrap {{ position: relative; width: {total_w}mm; height: {total_h}mm; background: #072a26; overflow: hidden; }}
.bk, .fr {{ position: absolute; top: 0; width: {BLEED + W}mm; height: {total_h}mm; overflow: hidden; }}
.bk {{ left: 0; }} .fr {{ left: {BLEED + W + spine}mm; }} .art {{ position: absolute; inset: 0; width: 100%; height: 100%; }} .art.flip {{ transform: scaleX(-1); }}
.bk::after {{ content: ''; position: absolute; inset: 0; background: rgba(4,28,25,.55); }}
.bkc {{ position: absolute; z-index: 2; left: {BLEED + 14}mm; right: 14mm; top: {BLEED + 20}mm; color: #f6edd4; text-align: center; font-size: 8.4pt; }}
.bk-t {{ font-family: 'Cinzel', serif; font-weight: 700; font-size: 30pt; letter-spacing: .26em; padding-left: .26em; color: #e7c873; }}
.bk-ar {{ font-family: 'Scheherazade New', serif; font-size: 22pt; color: #e7c873; line-height: 1.4; }} .bk-s {{ font-style: italic; font-size: 11pt; color: #e7c873; }}
.bk-p {{ margin: 3mm 0; line-height: 1.5; }} .bk-l {{ list-style: none; padding: 0; margin: 4mm 0; text-align: left; }} .bk-l li {{ padding: 1.4mm 0 1.4mm 5mm; position: relative; border-bottom: .5px solid rgba(231,200,115,.35); }}
.bk-l li::before {{ content: '✦'; position: absolute; left: 0; color: #e7c873; font-size: 7pt; top: 1.9mm; }}
.bk-q {{ font-style: italic; margin-top: 6mm; font-size: 9pt; }} .bk-q span {{ display: block; font-family: 'Inter', sans-serif; font-style: normal; font-size: 5.8pt; letter-spacing: .16em; text-transform: uppercase; color: #e7c873; margin-top: 1.4mm; }}
.bk-bar {{ width: 46mm; height: 28mm; background: #fff; margin: 9mm auto 3mm; display: flex; align-items: center; justify-content: center; color: #888; font-family: 'Inter', sans-serif; font-size: 5.6pt; letter-spacing: .1em; text-transform: uppercase; }}
.bk-by {{ font-family: 'Inter', sans-serif; font-size: 5.8pt; letter-spacing: .16em; text-transform: uppercase; color: #e7c873; }}
.spine {{ position: absolute; left: {BLEED + W}mm; top: 0; width: {spine}mm; height: {total_h}mm; background: #0b3b35; display: flex; align-items: center; justify-content: center; z-index: 3; border-left: .4px solid #e7c873; border-right: .4px solid #e7c873; }}
.spine span {{ writing-mode: vertical-rl; transform: rotate(180deg); font-family: 'Cinzel', serif; color: #e7c873; font-size: {min(11, max(5, spine * .6)):.1f}pt; letter-spacing: .2em; white-space: nowrap; }}
.spine b {{ color: #fff; }}
.fr .page {{ width: {W}mm; height: {H}mm; }} .fr .page .art {{ display: none; }}
.fr .cover .in {{ top: 0; bottom: 0; }}
</style></head><body style="margin:0"><div class="wrap">
<div class="bk">{back_scene}{back_cover(edition, ramadan)}</div>
<div class="spine"><span><b>ZAAD</b> &nbsp;·&nbsp; Provision for the Day &nbsp;·&nbsp; 2027{" &nbsp;·&nbsp; Ramadan 1448" if ramadan else ""}</span></div>
{front}</div></body></html>'''
    name = f"Zaad-Cover-Wrap-{edition}{'-Ramadan' if ramadan else ''}"
    hp = os.path.join(B.BUILD, name + ".html")
    open(hp, "w", encoding="utf-8").write(html)
    out = os.path.join(ROOT, name + ".pdf")
    subprocess.run(["node", os.path.join(ROOT, "render.js"), hp, out], check=True)
    print(f"{name}: {total_w:.1f} x {total_h:.1f} mm, spine {spine} mm ({pages} pages)")


if __name__ == "__main__":
    for ed in ("Weekly", "Daily"):
        for r in (False, True):
            build(ed, r)
