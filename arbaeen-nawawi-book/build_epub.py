#!/usr/bin/env python3
"""Kindle eBook: a reflowable EPUB 3 made from the same content as the printed book.

Output: amazon-kdp/Forty-Hadith-eBook.epub and amazon-kdp/Forty-Hadith-eBook-Cover.jpg (1600 x 2560).
Upload the EPUB as the Kindle manuscript and the JPG as the Kindle cover.
"""
import datetime, html, os, re, shutil, subprocess, sys, uuid, zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "src"))
import build  # noqa: E402
from build import CONTENT, PARTS, EXTRA, FIGURES, esc, part_of, ar_title, PART_WORD, LET, LET_10  # noqa: E402
import front, narrators, tests, sources, qr  # noqa: E402
from background import BACKGROUND  # noqa: E402
from lxml import html as LH, etree  # noqa: E402

OUT_DIR = os.path.join(ROOT, "amazon-kdp")
OUT = os.path.join(OUT_DIR, "Forty-Hadith-eBook.epub")
COVER = os.path.join(OUT_DIR, "Forty-Hadith-eBook-Cover.jpg")
WORK = os.path.join(ROOT, ".build-epub")
IMG = os.path.join(WORK, "img")
TITLE = "The Forty Hadith of Imam an-Nawawi"
SUB = "with the Additions of Ibn Rajab: A Study Edition"
BOOK_ID = "urn:uuid:" + str(uuid.uuid5(uuid.NAMESPACE_URL, "diinislaam.com/40hadith/ebook"))

CSS = """
body { font-family: serif; line-height: 1.5; margin: 0 2%; }
h1 { font-size: 1.5em; text-align: center; color: #0f4c45; margin: 1em 0 .2em; line-height: 1.25; page-break-before: always; }
h1.np { page-break-before: auto; }
h2 { font-size: 1.15em; color: #0f4c45; margin: 1.4em 0 .4em; border-bottom: 1px solid #c9a14a; padding-bottom: .15em; }
h3 { font-size: 1em; margin: 1em 0 .3em; }
p { margin: 0 0 .6em; text-align: left; }
.kick { text-align: center; font-size: .8em; letter-spacing: .15em; text-transform: uppercase; color: #8c7a55; margin: 1.5em 0 0; }
.art { text-align: center; font-size: 1.35em; color: #8c7a55; margin: .1em 0 .6em; }
.theme { text-align: center; font-style: italic; color: #6d5f45; }
.ar { text-align: right; font-size: 1.3em; line-height: 1.9; }
.ar-box { text-align: right; font-size: 1.3em; line-height: 1.9; border: 1px solid #c9a14a; padding: .5em .7em; margin: .8em 0; }
.ar-src { font-size: .75em; color: #6d5f45; }
.pw { color: #0f5a4f; font-weight: bold; }
.en-box { border-left: 3px solid #c9a14a; padding: .2em 0 .2em .8em; margin: .8em 0; }
.ref { font-size: .85em; color: #6d5f45; }
.online { text-align: center; font-size: .9em; margin: .8em 0; }
.box { border: 1px solid #e6d7b4; background: #fbf6ea; padding: .5em .8em; margin: .8em 0; }
.nr-n { font-weight: bold; }
figure { margin: 1em 0; text-align: center; }
figure img { max-width: 100%; }
figcaption { font-size: .85em; font-style: italic; color: #6d5f45; }
ol, ul { margin: .3em 0 .8em; padding-left: 1.6em; }
li { margin: .25em 0; }
ol.opts { list-style-type: upper-alpha; margin-top: .1em; }
table { border-collapse: collapse; width: 100%; margin: .5em 0 1em; }
td, th { border: 1px solid #e6d7b4; padding: .3em .4em; vertical-align: top; }
td.d { font-weight: bold; width: 3em; }
sup a, a.fn { text-decoration: none; font-size: .75em; vertical-align: super; line-height: 0; }
.notes li { margin: .4em 0; }
.back { font-size: .8em; }
.center { text-align: center; }
.title-ar { text-align: center; font-size: 2em; color: #8c6a1c; margin-top: 1.5em; }
.title-en { text-align: center; font-size: 1.6em; font-weight: bold; color: #0f4c45; margin: .3em 0; }
.small { font-size: .85em; }
.lantern { text-align: center; margin: 1.2em 0; }
.lantern img { width: 22%; }
"""


# ---------------------------------------------------------------- helpers
def x(fragment):
    """HTML fragment -> well-formed XHTML (text of the body)."""
    doc = LH.document_fromstring("<html><body><div id='__r'>" + fragment + "</div></body></html>")
    root = doc.get_element_by_id("__r")
    out = html.escape(root.text or "", quote=False)
    for ch in root:
        out += etree.tostring(ch, method="xml", encoding="unicode")
    return out


def strip_print(s):
    s = re.sub(r'<span style="font-size:1px[^>]*>MK-[^<]*</span>', "", s)       # page-number markers
    s = re.sub(r'<a class="qr[^"]*"[^>]*>.*?</a>', "", s, flags=re.S)             # QR codes
    s = re.sub(r'<div class="fm-rule">.*?</div>', "", s, flags=re.S)              # ornament rule
    s = re.sub(r"<svg\b.*?</svg>", '<span class="lantern"><img src="img/lantern.png" alt=""/></span>', s, flags=re.S)  # the lantern
    return s


def page(title, body, lang="en"):
    return f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="{lang}" xml:lang="{lang}">
<head><meta charset="utf-8"/><title>{html.escape(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
{x(body)}
</body>
</html>
"""


def ar(s, cls="ar"):
    return f'<div class="{cls}" lang="ar" dir="rtl">{s}</div>'


def link(route, label=None):
    u = qr.url(route)
    return f'<a href="{u}">{label or qr.shown(route)}</a>'


def hfile(n):
    return f"h{n:02d}.xhtml"


# ---------------------------------------------------------------- images
def make_images():
    os.makedirs(IMG, exist_ok=True)
    css = open(os.path.join(ROOT, "src", "book.css"), encoding="utf-8").read()
    figs = []
    for n in range(1, 51):
        c = CONTENT[n]
        if c.get("fig"):
            p = part_of(n)
            figs.append(f'<section class="hadith" style="--accent:{p[3]};--soft:{p[4]};background:#fff;padding:8px;width:900px">'
                        f'<figure class="fig" style="margin:0"><div class="svgwrap" data-out="fig{n:02d}" style="border:0">{FIGURES[c["fig"][0]]}</div></figure></section>')
    figs.append(f'<div data-out="lantern" style="width:240px;background:#fff">{FIGURES["lantern"]}</div>')
    doc = (f'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../fonts/fonts.css"><style>{css}'
           'body{background:#fff;margin:0} .fig .hot{cursor:default} svg{display:block;width:100%;height:auto;max-height:none!important}</style></head><body>'
           + "".join(figs) + "</body></html>")
    p = os.path.join(WORK, "figs.html")
    open(p, "w", encoding="utf-8").write(doc)
    subprocess.run(["node", os.path.join(ROOT, "render_img.js"), p, IMG, "1.6", "1000", "1200"], check=True)

    # Kindle cover: 1600 x 2560 (1 : 1.6). The A4 cover is stretched to 210 x 336 mm, positions scaled to match.
    k = 336 / 297
    extra = (f".cover{{height:336mm}} .cover .art{{height:336mm}}"
             f".cover .c-top{{top:{21 * k:.1f}mm}} .cover .c-lamp{{top:{66 * k:.1f}mm;width:36mm;margin-left:-18mm}}"
             f".cover .c-body{{top:{118 * k:.1f}mm;left:28mm;right:28mm}} .cover .c-ar{{font-size:54pt}} .cover .c-en{{font-size:27pt}}"
             f".cover .c-sub{{font-size:13pt}} .cover .c-feat{{font-size:9.6pt}}"
             f".cover .c-author{{top:{247 * k:.1f}mm;font-size:21pt}} .cover .c-foot{{bottom:{18.5 * k:.1f}mm;font-size:9pt}}")
    cov = (f'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../fonts/fonts.css"><style>{css}{extra}'
           'body{margin:0}</style></head><body>'
           + front.cover_html_inner(FIGURES["lantern"]).replace('<div class="cover">', '<div class="cover" data-out="cover">', 1)
           + "</body></html>")
    p = os.path.join(WORK, "cover.html")
    open(p, "w", encoding="utf-8").write(cov)
    subprocess.run(["node", os.path.join(ROOT, "render_img.js"), p, WORK, str(1600 / (210 / 25.4 * 96)), "794", "1270"], check=True)
    from PIL import Image
    im = Image.open(os.path.join(WORK, "cover.png")).convert("RGB").resize((1600, 2560), Image.LANCZOS)
    os.makedirs(OUT_DIR, exist_ok=True)
    im.save(COVER, "JPEG", quality=92, optimize=True, dpi=(300, 300))
    im.save(os.path.join(IMG, "cover.jpg"), "JPEG", quality=88, optimize=True)


# ---------------------------------------------------------------- chapters
NOTES = {}   # n -> list of footnote id lists


def hadith_page(n):
    c = CONTENT[n]
    p = part_of(n)
    a, src = build.ar_html(n)
    en, ref, url = build.english(n)
    en_body, en_tail = build.en_html(n, en)
    tail = f"{esc(en_tail)} · " if en_tail else ""
    out = [f'<p class="kick">Hadith {n} of 50 · {esc(p[2].split(" · ")[0])}</p>',
           f'<h1 class="np" id="top">{esc(c["title"])}</h1>', ar(ar_title(n), "art")]
    if c.get("theme"):
        out.append(f'<p class="theme">{esc(c["theme"])}</p>')
    out.append(f'<div class="ar-box" lang="ar" dir="rtl">{a}<div class="ar-src">{src}</div></div>')
    extra = "".join(f"<p>{esc(t)}</p>" for t in EXTRA[n].get("extra_en", [])) if n > 42 else ""
    out.append(f'<h2>English Translation</h2><div class="en-box">{en_body}{extra}<p class="ref">{tail}{esc(ref)} · '
               f'<a href="https://{esc(url)}">{esc(url)}</a></p></div>')
    out.append(f'<p class="online">Listen to this hadith online: {link(str(n))}</p>')
    # narrators
    first = narrators.first_seen()
    keys = narrators.NARRATORS.get(n, [])
    out.append(f'<h2 id="narr">About the Narrator{"s" if len(keys) > 1 else ""}</h2>')
    for k in keys:
        b = narrators.BIO[k]
        dates = f' ({b["dates"]})' if b["dates"] else ""
        head = f'<p><span class="nr-n">{esc(b["name"])}</span>{dates} <span lang="ar" dir="rtl">{b["ar"]}</span></p>'
        if first[k] == n:
            out.append(head + f'<p>{esc(b["text"])}</p>')
        else:
            out.append(head + f'<p>Biography: see <a href="{hfile(first[k])}#narr">Hadith {first[k]}</a>.</p>')
    if narrators.CONTEXT.get(n):
        out.append(f"<p><i>{esc(narrators.CONTEXT[n])}</i></p>")
    # background and note, with footnotes linked to the notes chapter
    bg, note, fns = sources.annotate(n, BACKGROUND.get(n, {}).get("paras"), c["note"])
    NOTES[n] = fns
    fm = lambda t: sources.place_marks(esc(t), lambda k: f'<sup><a epub:type="noteref" id="r{n}-{k}" href="notes.xhtml#n{n}-{k}">{k}</a></sup>')
    if bg:
        out.append('<h2>Background of the Hadith</h2>' + "".join(f"<p>{fm(t)}</p>" for t in bg))
    out.append('<h2>Explanatory Note</h2>' + "".join(f"<p>{fm(t)}</p>" for t in note))
    if c.get("fig"):
        out.append(f'<figure><img src="img/fig{n:02d}.png" alt="{html.escape(c["fig"][1], quote=True)}"/><figcaption>{esc(c["fig"][1])}</figcaption></figure>')
    out.append('<h2>Lessons from the Hadith</h2><ol>' + "".join(f"<li>{esc(t)}</li>" for t in c["lessons"]) + "</ol>")
    if c.get("steps"):
        title, items = c["steps"]
        lis = []
        for it in items:
            h, b = (it.split("|", 1) + [""])[:2] if "|" in it else (it, "")
            lis.append(f"<li><b>{esc(h.strip())}</b>{(': ' + esc(b.strip())) if b else ''}</li>")
        out.append(f'<h2>Step by Step: {esc(title)}</h2><ol>{"".join(lis)}</ol>')
    out.append('<h2>Questions</h2><p class="small">Think, then write your answers in a notebook.</p><ol>'
               + "".join(f"<li>{esc(q)}</li>" for q in c["questions"]) + "</ol>")
    days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    out.append('<h2>To-Do List for the Week</h2><table>' + "".join(f'<tr><td class="d">{d[:3]}</td><td>{esc(t)}</td></tr>' for d, t in zip(days, c["todo"])) + "</table>")
    nxt = f'<a href="{hfile(n + 1)}">Next: Hadith {n + 1}</a>' if n < 50 else '<a href="glossary.xhtml">Next: Glossary</a>'
    if n % 10 == 0:
        nxt = f'<a href="test{n // 10}.xhtml">Next: {PART_WORD[n // 10]} Review Test</a>'
    out.append(f'<p class="center small">{nxt}</p>')
    return page(f"Hadith {n}: {c['title']}", "\n".join(out))


def part_intro(k):
    first, last, name, *_ = PARTS[k - 1]
    label, title = name.split(" · ")
    items = "".join(f'<li><a href="{hfile(n)}">{esc(CONTENT[n]["title"])}</a></li>' for n in range(first, last + 1))
    return page(name, f'<p class="kick">{label}</p><h1 class="np">{esc(title)}</h1><p class="center">Hadith {first} to {last}</p>'
                      f'<ol start="{first}">{items}</ol><p class="center small"><a href="test{k}.xhtml">{PART_WORD[k]} Review Test</a></p>')


def test_page(k):
    p = PARTS[k - 1]
    t = tests.TESTS[k]
    out = [f'<p class="kick">{PART_WORD[k]} · Hadith {p[0]}–{p[1]}</p><h1 class="np">Review Test</h1>',
           f'<p class="center">Answer from memory first, then check with the <a href="answers.xhtml#a{k}">answer key</a>. '
           f'You can also take this test online with instant marking: {link(f"test{k}")}</p>',
           '<h2>A. Multiple Choice (25 marks)</h2><ol>']
    for q, opts, _ in tests.shuffled_mcq(k):
        out.append(f'<li>{esc(q)}<ol class="opts">' + "".join(f"<li>{esc(o)}</li>" for o in opts) + "</ol></li>")
    out.append("</ol>")
    lefts, rights, _ = tests.shuffled_match(k)
    out.append('<h2>B. Matching (10 marks)</h2><p>Match each Arabic phrase (1–10) with its English meaning (A–J).</p><table>'
               + "".join(f'<tr><td>{i + 1}</td><td lang="ar" dir="rtl" class="ar">{esc(l)}</td><td>{LET_10[i]}</td><td>{esc(r)}</td></tr>'
                         for i, (l, r) in enumerate(zip(lefts, rights))) + "</table>")
    out.append('<h2>C. Short Answer (10 marks)</h2><ol>' + "".join(f"<li>{esc(q)}</li>" for q, _ in t["short"]) + "</ol>")
    out.append('<h2>D. Critical Thinking (5 marks)</h2><ol>' + "".join(f"<li>{esc(q)}</li>" for q in t["critical"]) + "</ol>")
    nxt = f'<a href="part{k + 1}.xhtml">Next: {PART_WORD[k + 1]}</a>' if k < 5 else '<a href="glossary.xhtml">Next: Glossary</a>'
    out.append(f'<p class="center small">{nxt}</p>')
    return page(f"{PART_WORD[k]} Review Test", "\n".join(out))


def answers_page():
    out = ['<h1 class="np">Answer Key</h1><p class="center">For teachers and parents. Short answers are a guide: accept any answer with the same meaning.</p>']
    for k in range(1, 6):
        p = PARTS[k - 1]
        mcq = tests.shuffled_mcq(k)
        _, _, key = tests.shuffled_match(k)
        out.append(f'<h2 id="a{k}">{PART_WORD[k]} · Hadith {p[0]}–{p[1]}</h2>'
                   f'<p><b>A. Multiple choice:</b> ' + ", ".join(f"{i + 1} {LET[a]}" for i, (_, _, a) in enumerate(mcq)) + "</p>"
                   f'<p><b>B. Matching:</b> ' + ", ".join(f"{i + 1} {LET_10[key[i]]}" for i in range(10)) + "</p>"
                   '<p><b>C. Short answer:</b></p><ol>' + "".join(f"<li>{esc(a)}</li>" for _, a in tests.TESTS[k]["short"]) + "</ol>"
                   f'<p class="small"><a href="test{k}.xhtml">Back to the test</a></p>')
    return page("Answer Key", "\n".join(out))


def notes_page():
    out = ['<h1 class="np">Notes and References</h1>',
           '<p>The small numbers in the chapters lead here; tap ↩ to go back. Hadith numbers follow sunnah.com. Qur’an references are given as sūrah:verse.</p>']
    for n in range(1, 51):
        fns = NOTES.get(n)
        if not fns:
            continue
        out.append(f'<h2>Hadith {n} · {esc(CONTENT[n]["title"])}</h2><ol class="notes">')
        for k, ids in enumerate(fns, 1):
            refs = [sources.resolve(i) for i in ids]
            links = " ".join(f'<a href="{r["url"]}">link</a>' for r in refs if r.get("url"))
            ar_txt = "".join(f'<div class="ar" lang="ar" dir="rtl">{esc(r["ar"])}</div>' for r in refs if r["ar"])
            out.append(f'<li id="n{n}-{k}" epub:type="footnote"><a class="back" href="{hfile(n)}#r{n}-{k}">↩</a> {esc(sources.label(ids))} {links}{ar_txt}</li>')
        out.append("</ol>")
    out.append('<h2>Bibliography</h2><ul>' + "".join(f"<li>{esc(b)}</li>" for b in sources.BIBLIOGRAPHY) + "</ul>")
    return page("Notes and References", "\n".join(out))


def how_to_use_ebook():
    steps = [
        ("Read the Arabic", "Read the hadith aloud, slowly. The Prophet’s ﷺ own words are in colour. Repeat them until you can say them without looking."),
        ("Read the translation", "The English is from sunnah.com, with a link to look the hadith up. Then read about the Companion who narrated it."),
        ("Study the note and the picture", "The note gives the meaning and the background; tap a small number to see its source. The picture puts the hadith in one drawing."),
        ("Learn the lessons", "Each lesson is one thing the hadith teaches. Choose one and share it with someone this week."),
        ("Follow the steps", "When a hadith asks you to do something, ‘Step by Step’ shows how, in order."),
        ("Answer the questions", "Write your answers in a notebook. The last questions ask you to think about your own life."),
        ("Live the to-do list", "Seven small tasks, one for each day from Saturday to Friday."),
        ("Take the part tests", "After every ten hadith there is a review test, with an answer key at the back of the book."),
    ]
    return ('<h1 class="np">How to Use This Book</h1><p>Every chapter follows the same parts. Work through them in order; a chapter takes about a week.</p><ol>'
            + "".join(f"<li><b>{h}.</b> {d}</li>" for h, d in steps) + "</ol>"
            '<h2>The online book</h2><div class="box"><p>Visit ' + link("") + ' to <b>listen</b> to every hadith in Arabic and English, take the five part tests with '
            'instant marking, and receive a <b>certificate of completion</b>. Each chapter of this eBook links to its own online page.</p></div>'
            '<h2>For parents and teachers</h2><p>For younger children, read the translation aloud, talk about the picture together and choose two or three of the to-do tasks. '
            'Praise effort more than perfection, and act on the hadith yourself first: children learn more from what they see than from what they are told.</p>')


def front_section(fn):
    s = strip_print(fn())
    s = s.replace('<h1 class="fm-title">', '<h1 class="np">')
    s = re.sub(r'<div class="fm-ar" lang="ar" dir="rtl">(.*?)</div>', r'<div class="art" lang="ar" dir="rtl">\1</div>', s)
    s = re.sub(r' style="[^"]*"', "", s)
    s = s.replace('class="callout', 'class="box')
    return s


def chapters():
    """[(file, title, xhtml, nav-group)]"""
    ch = []
    ch.append(("cover.xhtml", "Cover", page("Cover", '<div class="center"><img src="img/cover.jpg" alt="Cover" style="max-width:100%"/></div>'), None))
    tp = (f'<div class="title-ar" lang="ar" dir="rtl">الأَرْبَعُونَ النَّوَوِيَّةُ</div><div class="title-en">{TITLE}</div>'
          f'<p class="center"><i>with the additions of al-Ḥāfiẓ Ibn Rajab: fifty hadith in all</i></p>'
          f'<div class="lantern"><img src="img/lantern.png" alt=""/></div>'
          f'<p class="center">Compiled by<br/><b>{front.AUTHOR}</b></p><p class="center small">A Study Edition · 1448 AH / 2026 CE</p>')
    ch.append(("title.xhtml", "Title Page", page("Title Page", tp), None))
    cp = strip_print(front.copyright_page())
    cp = re.sub(r'<div class="cp-online">.*?</div>', f'<p>Online edition with audio, tests and certificate: {link("")}</p>', cp, flags=re.S)
    ch.append(("copyright.xhtml", "Copyright", page("Copyright", cp), None))
    b = ('<div class="center"><div class="title-ar" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>'
         '<div class="ar center" lang="ar" dir="rtl">﴿وَمَا آتَاكُمُ الرَّسُولُ فَخُذُوهُ وَمَا نَهَاكُمْ عَنْهُ فَانْتَهُوا﴾</div>'
         '<p><i>“And whatever the Messenger has given you — take; and what he has forbidden you — refrain from.” (al-Ḥashr 59:7)</i></p>'
         '<div class="ar center" lang="ar" dir="rtl">«نَضَّرَ اللَّهُ امْرَأً سَمِعَ مِنَّا حَدِيثًا فَحَفِظَهُ حَتَّى يُبَلِّغَهُ»</div>'
         '<p><i>“May Allah brighten the face of a person who hears a hadith from us, memorises it and passes it on.” (Abū Dāwūd, at-Tirmidhī)</i></p></div>')
    ch.append(("bismillah.xhtml", "Bismillah", page("Bismillah", b), None))
    ch.append(("toc.xhtml", "Contents", None, None))   # filled in below
    ch.append(("preface.xhtml", "Preface", page("Preface", front_section(front.preface)), "front"))
    ch.append(("howto.xhtml", "How to Use This Book", page("How to Use This Book", how_to_use_ebook()), "front"))
    ch.append(("imams.xhtml", "The Two Imams: an-Nawawi and Ibn Rajab", page("The Two Imams", front_section(front.about_nawawi)), "front"))
    ch.append(("translation.xhtml", "About the Arabic Text and the Translation", page("About the Text and Translation", front_section(front.about_translation)), "front"))
    for k in range(1, 6):
        first, last = PARTS[k - 1][:2]
        ch.append((f"part{k}.xhtml", PARTS[k - 1][2], part_intro(k), f"part{k}"))
        for n in range(first, last + 1):
            ch.append((hfile(n), f"{n}. {CONTENT[n]['title']}", hadith_page(n), f"part{k}"))
        ch.append((f"test{k}.xhtml", f"{PART_WORD[k]} Review Test", test_page(k), f"part{k}"))
    gl = "".join(f"<p><b>{a}</b> — {b}</p>" for a, b in front.GLOSS)
    ch.append(("glossary.xhtml", "Glossary of Terms", page("Glossary", f'<h1 class="np">Glossary of Terms</h1>{gl}'), "back"))
    ch.append(("answers.xhtml", "Answer Key to the Part Tests", answers_page(), "back"))
    ch.append(("notes.xhtml", "Notes and References", notes_page(), "back"))
    ch.append(("closing.xhtml", "Closing Supplication", page("Closing Supplication", front_section(front.closing).replace('<img', '<img')), "back"))
    # contents page
    rows = []
    for f, t, _, g in ch:
        if g in ("front", "back"):
            rows.append(f'<li><a href="{f}">{esc(t)}</a></li>')
        elif g and g.startswith("part") and f.startswith("part"):
            rows.append(f'<li><a href="{f}"><b>{esc(t)}</b></a></li>')
        elif g:
            rows.append(f'<li style="list-style:none;margin-left:1em"><a href="{f}">{esc(t)}</a></li>')
    toc = page("Contents", '<h1 class="np">Contents</h1><ul style="list-style:none;padding-left:0">' + "".join(rows) + "</ul>")
    ch[4] = ("toc.xhtml", "Contents", toc, None)
    return ch


def nav(ch):
    items, k = [], 0
    for f, t, _, g in ch:
        if g in ("front", "back") or f == "toc.xhtml":
            items.append(f'<li><a href="{f}">{html.escape(t)}</a></li>')
        elif g and f.startswith("part"):
            sub = "".join(f'<li><a href="{f2}">{html.escape(t2)}</a></li>' for f2, t2, _, g2 in ch if g2 == g and not f2.startswith("part"))
            items.append(f'<li><a href="{f}">{html.escape(t)}</a><ol>{sub}</ol></li>')
    return f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">
<head><meta charset="utf-8"/><title>Contents</title></head>
<body>
<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>{"".join(items)}</ol></nav>
<nav epub:type="landmarks" hidden=""><ol>
<li><a epub:type="cover" href="cover.xhtml">Cover</a></li>
<li><a epub:type="toc" href="toc.xhtml">Contents</a></li>
<li><a epub:type="bodymatter" href="preface.xhtml">Start</a></li>
</ol></nav>
</body></html>
"""


def ncx(ch):
    pts, i = [], 0
    for f, t, _, g in ch:
        if f in ("cover.xhtml", "bismillah.xhtml"):
            continue
        i += 1
        pts.append(f'<navPoint id="np{i}" playOrder="{i}"><navLabel><text>{html.escape(t)}</text></navLabel><content src="{f}"/></navPoint>')
    return f"""<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="{BOOK_ID}"/></head>
<docTitle><text>{TITLE}</text></docTitle><navMap>{"".join(pts)}</navMap></ncx>
"""


def opf(ch, images):
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    man = ['<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
           '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
           '<item id="css" href="style.css" media-type="text/css"/>']
    for f, *_ in ch:
        man.append(f'<item id="{f[:-6]}" href="{f}" media-type="application/xhtml+xml"/>')
    for im in images:
        props = ' properties="cover-image"' if im == "cover.jpg" else ""
        mt = "image/jpeg" if im.endswith(".jpg") else "image/png"
        man.append(f'<item id="img-{im.split(".")[0]}" href="img/{im}" media-type="{mt}"{props}/>')
    spine = "".join(f'<itemref idref="{f[:-6]}"/>' for f, *_ in ch)
    return f"""<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">{BOOK_ID}</dc:identifier>
<dc:title>{TITLE}</dc:title>
<dc:creator>{front.AUTHOR}</dc:creator>
<dc:language>en</dc:language>
<dc:language>ar</dc:language>
<dc:publisher>Diin Islaam</dc:publisher>
<dc:date>2026</dc:date>
<dc:description>{SUB}. The fifty hadith of an-Nawawi and Ibn Rajab with the Arabic text, English translation, notes, pictures, lessons, questions, weekly to-do lists and five review tests.</dc:description>
<meta property="dcterms:modified">{now}</meta>
<meta name="cover" content="img-cover"/>
</metadata>
<manifest>{"".join(man)}</manifest>
<spine toc="ncx">{spine}</spine>
</package>
"""


def main():
    if os.path.isdir(WORK):
        shutil.rmtree(WORK)
    os.makedirs(IMG)
    make_images()
    ch = chapters()
    images = sorted(os.listdir(IMG))
    with zipfile.ZipFile(OUT, "w") as z:
        z.writestr(zipfile.ZipInfo("mimetype"), "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        z.writestr("META-INF/container.xml", '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
                   '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
                   compress_type=zipfile.ZIP_DEFLATED)
        w = lambda name, data: z.writestr("OEBPS/" + name, data, compress_type=zipfile.ZIP_DEFLATED)
        w("content.opf", opf(ch, images))
        w("nav.xhtml", nav(ch))
        w("toc.ncx", ncx(ch))
        w("style.css", CSS)
        for f, _, xhtml, _ in ch:
            w(f, xhtml)
        for im in images:
            z.write(os.path.join(IMG, im), "OEBPS/img/" + im, compress_type=zipfile.ZIP_DEFLATED)
    print("epub:", OUT, os.path.getsize(OUT) // 1024, "KB;", len(ch), "chapters;", len(images), "images; cover", COVER)


if __name__ == "__main__":
    main()
