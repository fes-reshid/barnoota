#!/usr/bin/env python3
"""Build "The Forty Hadith of Imam an-Nawawi — Study Edition" as an A4 PDF.

Pipeline:
  1. Assemble HTML (front matter + 50 hadith chapters + back matter).
  2. Render cover and body with headless Chromium (render.js).
  3. Draw the page underlay (paper colour, frame, running head, page number)
     with reportlab and put it beneath every body page.
  4. Two passes: the second pass fills the table of contents with the page
     numbers found in the first.
"""
import html, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "src"))

from texts import ARABIC, EXTRA  # noqa: E402
from figures import FIGURES  # noqa: E402
import front  # noqa: E402

CONTENT = {}
for mod in ("content_01", "content_02", "content_03", "content_04", "content_05"):
    try:
        m = __import__(mod)
    except ModuleNotFoundError:
        continue
    for h in m.HADITH:
        CONTENT[h["n"]] = h

OUT_PDF = os.path.join(ROOT, "Forty-Hadith-Nawawi-Study-Book.pdf")
BUILD = os.path.join(ROOT, ".build")
os.makedirs(BUILD, exist_ok=True)

AR_ORD = ["الأَوَّلُ", "الثَّانِي", "الثَّالِثُ", "الرَّابِعُ", "الخَامِسُ", "السَّادِسُ", "السَّابِعُ", "الثَّامِنُ", "التَّاسِعُ", "العَاشِرُ"]
AR_TENS = {1: "عَشَرَ", 2: "وَالعِشْرُونَ", 3: "وَالثَّلَاثُونَ", 4: "وَالأَرْبَعُونَ"}
AR_UNITS_M = ["الحَادِي", "الثَّانِي", "الثَّالِثَ", "الرَّابِعَ", "الخَامِسَ", "السَّادِسَ", "السَّابِعَ", "الثَّامِنَ", "التَّاسِعَ"]
AR_UNITS = ["الحَادِي", "الثَّانِي", "الثَّالِثُ", "الرَّابِعُ", "الخَامِسُ", "السَّادِسُ", "السَّابِعُ", "الثَّامِنُ", "التَّاسِعُ"]


def ar_title(n):
    if n <= 10:
        return "الحَدِيثُ " + AR_ORD[n - 1]
    if n == 20:
        return "الحَدِيثُ العِشْرُونَ"
    if n == 30:
        return "الحَدِيثُ الثَّلَاثُونَ"
    if n == 40:
        return "الحَدِيثُ الأَرْبَعُونَ"
    if n == 50:
        return "الحَدِيثُ الخَمْسُونَ"
    t, u = divmod(n, 10)
    if t == 1:
        return "الحَدِيثُ " + AR_UNITS_M[u - 1] + " " + AR_TENS[1]
    return "الحَدِيثُ " + AR_UNITS[u - 1] + " " + AR_TENS[t]


PARTS = [  # (first, last, name, accent, accent-soft)
    (1, 10, "Part One · Foundations of the Religion", "#0f5a4f", "#e3f0ec"),
    (11, 20, "Part Two · Purity of Heart and Tongue", "#1d4e7a", "#e4edf6"),
    (21, 30, "Part Three · The Paths of Goodness", "#6b2d5c", "#f3e6ef"),
    (31, 40, "Part Four · Brotherhood and Justice", "#8a4b12", "#f6ebdd"),
    (41, 50, "Part Five · Mercy, Hope and the Additions of Ibn Rajab", "#2f5d34", "#e6f0e3"),
]


def part_of(n):
    for p in PARTS:
        if p[0] <= n <= p[1]:
            return p
    raise ValueError(n)


# ---------------------------------------------------------------- texts
SUNNAH = {h["n"]: h for h in json.load(open(os.path.join(ROOT, "data", "nawawi42-sunnah.json"), encoding="utf-8"))}


def clean_en(t):
    t = t.replace("(peace and blessings of Allah be upon him)", "(ﷺ)")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def english(n):
    if n <= 42:
        return clean_en(SUNNAH[n]["en"]), f"Forty Hadith of an-Nawawi {n}", f"sunnah.com/nawawi40:{n}"
    e = EXTRA[n]
    return e["en"], e["ref"], e["url"]


def ar_html(n):
    """Arabic text: {…} marks the Prophetic (or Divine) words, shown in the accent colour."""
    a = ARABIC[n]
    body = html.escape(a["text"])
    body = re.sub(r"\{(.+?)\}", r'<b class="pw">\1</b>', body, flags=re.S)
    body = body.replace("\n", "<br>")
    return body, html.escape(a["src"])


def esc(s):
    """Escape, then allow a tiny inline markup: *italic*, **bold**, [ar]…[/ar]."""
    s = html.escape(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"\*(.+?)\*", r"<i>\1</i>", s)
    s = re.sub(r"\[ar\](.+?)\[/ar\]", r'<span class="ar-in" lang="ar" dir="rtl">\1</span>', s)
    # isolate quoted Arabic phrases inside English text so punctuation stays in place
    s = re.sub(r"«([^»]*[\u0600-\u06FF][^»]*)»", r'<span class="ar-in" lang="ar" dir="rtl">«\1»</span>', s)
    return s


STAR = ('<svg class="star" viewBox="0 0 100 100" aria-hidden="true">'
        '<circle cx="50" cy="50" r="46" fill="none" stroke="#c9a14a" stroke-width="1.6"/>'
        '<circle cx="50" cy="50" r="40" fill="var(--accent)" stroke="#c9a14a" stroke-width="2.6"/>'
        '<circle cx="50" cy="50" r="34" fill="none" stroke="#e8d29a" stroke-width="1"/>'
        '</svg>')

ICONS = {
    "note": '<svg viewBox="0 0 24 24"><path d="M5 3h10l4 4v14H5z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11h8M8 15h8M8 7h5" stroke="currentColor" stroke-width="1.8"/></svg>',
    "lessons": '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    "steps": '<svg viewBox="0 0 24 24"><path d="M3 20h5v-5h5v-5h5V5h3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
    "questions": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 9.3a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.1.9-1.1 1.8M12 17h.01" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    "todo": '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 12l3 3 5-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "picture": '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="1.8" fill="currentColor"/><path d="M4 17l5-4 4 3 3-2 4 3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    "book": '<svg viewBox="0 0 24 24"><path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 6v14" stroke="currentColor" stroke-width="1.6"/></svg>',
}


def sec_head(icon, label, sub=""):
    s = f'<span class="sub">{sub}</span>' if sub else ""
    return f'<h3 class="sec"><span class="ic">{ICONS[icon]}</span>{label}{s}</h3>'


DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]


def hadith_html(n):
    c = CONTENT.get(n)
    p = part_of(n)
    ar, src = ar_html(n)
    en, ref, url = english(n)
    out = [f'<section class="hadith" id="h{n}" style="--accent:{p[3]};--soft:{p[4]}">']
    if n == p[0]:
        out.append(part_page(p))
    out.append(f'''<header class="h-head">
  <div class="medal">{STAR}<span class="num">{n}</span></div>
  <div class="h-titles">
    <div class="kicker">Hadith {n} of 50</div>
    <h2>{esc(c["title"]) if c else "…"}</h2>
    <div class="ar-title" lang="ar" dir="rtl">{ar_title(n)}</div>
  </div>
</header>''')
    if c and c.get("theme"):
        out.append(f'<p class="theme">{esc(c["theme"])}</p>')
    out.append(f'''<div class="ar-box" lang="ar" dir="rtl"><div class="ar-text">{ar}</div>
  <div class="ar-src">{src}</div></div>''')
    extra = ""
    if n > 42 and EXTRA[n].get("extra_en"):
        extra = "".join(f'<p class="en-extra">{esc(x)}</p>' for x in EXTRA[n]["extra_en"])
    out.append(f'''<div class="en-box"><p class="en-text"><span class="en-label">English translation <span>· sunnah.com</span></span><br>{esc(en)}</p>{extra}
  <div class="en-ref">{esc(ref)} — <i>{esc(url)}</i></div></div>''')
    if not c:
        out.append("</section>")
        return "\n".join(out)
    if c.get("narrator"):
        out.append(f'<div class="narrator"><b>The narrator:</b> {esc(c["narrator"])}</div>')
    # Note
    out.append('<div class="block"><div class="keep">' + sec_head("note", "Explanatory Note") + f"<p>{esc(c['note'][0])}</p></div>")
    out.extend(f"<p>{esc(x)}</p>" for x in c["note"][1:])
    out.append("</div>")
    # Picture
    if c.get("fig"):
        key, cap = c["fig"]
        out.append(f'<figure class="fig">{sec_head("picture", "Picture", "see and remember")}<div class="svgwrap">{FIGURES[key]}</div><figcaption>{esc(cap)}</figcaption></figure>')
    # Lessons
    ls = c["lessons"]
    out.append('<div class="block"><div class="keep">' + sec_head("lessons", "Lessons from the Hadith") + f'<ol class="lessons"><li>{esc(ls[0])}</li></ol></div>'
               + f'<ol class="lessons" start="2" style="counter-reset:l 1">' + "".join(f"<li>{esc(x)}</li>" for x in ls[1:]) + "</ol></div>")
    # Steps
    if c.get("steps"):
        st_title, items = c["steps"]
        cards = []
        for i, it in enumerate(items, 1):
            head, body = (it.split("|", 1) + [""])[:2] if "|" in it else (it, "")
            cards.append(f'<div class="step"><span class="sn">{i}</span><div><b>{esc(head.strip())}</b>{("<br>" + esc(body.strip())) if body else ""}</div></div>')
        out.append(f'<div class="block steps-block"><div class="keep">{sec_head("steps", "Step by Step", esc(st_title))}<div class="steps">{cards[0]}</div></div>'
                   f'<div class="steps" style="margin-top:2mm">{"".join(cards[1:])}</div></div>')
    # Questions
    qs = [f'<li><div class="q">{esc(q)}</div><div class="lines"><i></i><i></i></div></li>' for q in c["questions"]]
    out.append('<div class="block qs"><div class="keep">' + sec_head("questions", "Questions", "think, then write") + f'<ol class="questions">{qs[0]}</ol></div>'
               + f'<ol class="questions" style="counter-reset:q 1">{"".join(qs[1:])}</ol></div>')
    # To-do
    out.append('<div class="block todo-block">' + sec_head("todo", "To-Do List for the Week", "tick each day") + '<table class="todo">')
    for d, t in zip(DAYS, c["todo"]):
        out.append(f'<tr><td class="d">{d}</td><td>{esc(t)}</td><td class="cb"><span></span></td></tr>')
    out.append("</table>")
    out.append('<div class="memo"><span>Memorised the Arabic?</span><i></i><span>Date:</span><i class="w"></i><span>Teacher / parent:</span><i class="w"></i></div>')
    out.append("</div></section>")
    return "\n".join(out)


def part_page(p):
    first, last, name, acc, soft = p
    label, title = name.split(" · ")
    rng = f"Hadith {first} – {last}"
    items = "".join(f'<li><span>{n}</span>{esc(CONTENT[n]["title"]) if n in CONTENT else ""}</li>' for n in range(first, last + 1))
    return f'''<div class="part-page">
  <div class="part-orn">{FIGURES["rosette"]}</div>
  <div class="part-label">{label}</div>
  <h1 class="part-title">{esc(title)}</h1>
  <div class="part-range">{rng}</div>
  <ol class="part-list">{items}</ol>
</div>'''


def toc_html(pages):
    rows = []
    for key, label in front.TOC_FRONT:
        pg = pages.get(key, "")
        rows.append(f'<tr class="tf"><td colspan="2">{esc(label)}</td><td class="pg">{pg}</td></tr>')
    for p in PARTS:
        rows.append(f'<tr class="tp" style="--accent:{p[3]}"><td colspan="3">{esc(p[2])}</td></tr>')
        for n in range(p[0], p[1] + 1):
            t = CONTENT[n]["title"] if n in CONTENT else ""
            rows.append(f'<tr><td class="tn" style="--accent:{p[3]}">{n}</td><td>{esc(t)}</td><td class="pg">{pages.get(f"h{n}", "")}</td></tr>')
    for key, label in front.TOC_BACK:
        rows.append(f'<tr class="tf"><td colspan="2">{esc(label)}</td><td class="pg">{pages.get(key, "")}</td></tr>')
    return '<section class="page-sec toc" id="toc"><h1 class="fm-title">Contents</h1><div class="fm-ar" lang="ar" dir="rtl">الفِهْرِس</div><table class="toc-t">' + "".join(rows) + "</table></section>"


def build_html(pages):
    css = open(os.path.join(ROOT, "src", "book.css"), encoding="utf-8").read()
    parts = [front.title_page(), front.bismillah_page(), front.preface(), toc_html(pages), front.how_to_use(),
             front.about_nawawi(), front.about_translation()]
    parts += [hadith_html(n) for n in range(1, 51)]
    parts += [front.tracker({n: c.get("short", c["title"]) for n, c in CONTENT.items()}), front.glossary(), front.certificate(), front.closing()]
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="../fonts/fonts.css"><style>{css}</style></head>
<body>{"".join(parts)}</body></html>'''


# ---------------------------------------------------------------- render
def render(html_path, pdf_path):
    subprocess.run(["node", os.path.join(ROOT, "render.js"), html_path, pdf_path], check=True)


MARKERS = [("toc", r"^\s*Contents\s*$")]


def find_pages(pdf_path):
    """Map section keys to printed page numbers by reading the rendered text."""
    import logging
    import pdfplumber
    logging.getLogger("pdfminer").setLevel(logging.ERROR)
    pages = {}
    with pdfplumber.open(pdf_path) as pdf:
        for i, pg in enumerate(pdf.pages, 1):
            txt = pg.extract_text() or ""
            for m in re.finditer(r"(?i)hadith (\d+) of 50", txt):
                pages.setdefault(f"h{int(m.group(1))}", i)
            for key, pat in front.PAGE_MARKERS:
                if key not in pages and re.search(pat, txt, re.M):
                    pages[key] = i
    return pages


def underlay(n_pages, path):
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.colors import HexColor
    W, H = A4
    c = canvas.Canvas(path, pagesize=A4)
    paper, gold, ink = HexColor("#fbf6ea"), HexColor("#c9a14a"), HexColor("#0f4c45")
    mm = 72 / 25.4
    for i in range(1, n_pages + 1):
        c.setFillColor(paper)
        c.rect(0, 0, W, H, stroke=0, fill=1)
        if i > 1:
            m1, m2 = 8 * mm, 9.6 * mm
            c.setStrokeColor(gold)
            c.setLineWidth(1.1)
            c.rect(m1, m1, W - 2 * m1, H - 2 * m1)
            c.setLineWidth(0.4)
            c.rect(m2, m2, W - 2 * m2, H - 2 * m2)
            for (x, y) in [(m1, m1), (W - m1, m1), (m1, H - m1), (W - m1, H - m1)]:
                star(c, x, y, 3.2 * mm, gold, paper)
            # running head
            c.setFont("Times-Roman", 7.2)
            c.setFillColor(HexColor("#8c7a55"))
            c.drawString(16 * mm, H - 13.2 * mm, "THE FORTY HADITH OF IMAM AN-NAWAWI")
            c.drawRightString(W - 16 * mm, H - 13.2 * mm, "STUDY EDITION")
            # page number medallion
            star(c, W / 2, 9.0 * mm + 0.2 * mm, 5.0 * mm, gold, ink)
            c.setFillColor(HexColor("#ffffff"))
            c.setFont("Times-Bold", 8.5 if i < 100 else 7.2)
            c.drawCentredString(W / 2, 9.0 * mm - 1.1 * mm, str(i))
        c.showPage()
    c.save()


def star(c, x, y, r, stroke, fill):
    """Small round ornament: a filled circle with a gold ring."""
    c.saveState()
    c.setStrokeColor(stroke)
    c.setFillColor(fill)
    c.setLineWidth(0.8)
    c.circle(x, y, r * 0.8, stroke=1, fill=1)
    c.restoreState()


def compose(body_pdf, cover_pdf, out_pdf):
    from pypdf import PdfReader, PdfWriter
    body = PdfReader(body_pdf)
    under_path = os.path.join(BUILD, "underlay.pdf")
    underlay(len(body.pages), under_path)
    under = PdfReader(under_path)
    w = PdfWriter()
    for pg in PdfReader(cover_pdf).pages:
        w.add_page(pg)
    for i, pg in enumerate(body.pages):
        pg.merge_page(under.pages[i], over=False)
        w.add_page(pg).compress_content_streams()
    w.compress_identical_objects(remove_identicals=True, remove_unreferenced=True)
    w.add_metadata({"/Title": "The Forty Hadith of Imam an-Nawawi — Study Edition",
                    "/Subject": "Arabic text, sunnah.com English translation, notes, lessons, questions and weekly to-do lists"})
    with open(out_pdf, "wb") as f:
        w.write(f)


def main():
    cover = os.path.join(BUILD, "cover.html")
    open(cover, "w", encoding="utf-8").write(front.cover_html(open(os.path.join(ROOT, "src", "book.css"), encoding="utf-8").read()))
    render(cover, os.path.join(BUILD, "cover.pdf"))
    pages = {}
    for pas in (1, 2):
        hp = os.path.join(BUILD, "book.html")
        open(hp, "w", encoding="utf-8").write(build_html(pages))
        render(hp, os.path.join(BUILD, "body.pdf"))
        new = find_pages(os.path.join(BUILD, "body.pdf"))
        if new == pages:
            break
        pages = new
    compose(os.path.join(BUILD, "body.pdf"), os.path.join(BUILD, "cover.pdf"), OUT_PDF)
    missing = [n for n in range(1, 51) if f"h{n}" not in pages]
    print("pages:", len(__import__("pypdf").PdfReader(OUT_PDF).pages), "missing toc:", missing)


if __name__ == "__main__":
    main()
