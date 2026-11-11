# -*- coding: utf-8 -*-
"""Vector pictures for the book (inline SVG).  Colours: class "ac" = chapter accent
fill, "acs" = accent stroke, "sf" = soft accent fill; gold is #c9a14a."""
import math

GOLD = "#c9a14a"
INK = "#2b2620"
MUTED = "#6d5f45"
GREEN = "#2e7d4f"
RED = "#b23a3a"
AMBER = "#d49a2a"


def t(x, y, s, size=14, w=400, anchor="middle", fill=INK, fam="Lora", italic=False, extra=""):
    st = "italic " if italic else ""
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" fill="{fill}" '
            f'style="font:{st}{w} {size}px \'{fam}\'" {extra}>{s}</text>')


def ar(x, y, s, size=18, fill=INK, w=700):
    return f'<text x="{x}" y="{y}" text-anchor="middle" fill="{fill}" direction="rtl" style="font:{w} {size}px \'Amiri\'">{s}</text>'


def svg(w, h, body):
    return f'<svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg">{body}</svg>'


def star8(cx, cy, r, cls='class="ac"', stroke=GOLD, sw=2):
    """Round medallion (double gold ring) used as a badge in the pictures."""
    return (f'<circle cx="{cx}" cy="{cy}" r="{r * 0.86:.1f}" {cls} stroke="{stroke}" stroke-width="{sw}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r * 0.74:.1f}" fill="none" stroke="{stroke}" stroke-width="{sw * .5}" opacity=".8"/>')


def arrow(x1, y1, x2, y2, color=GOLD, w=2.5):
    ang = math.atan2(y2 - y1, x2 - x1)
    a1 = (x2 - 11 * math.cos(ang - 0.45), y2 - 11 * math.sin(ang - 0.45))
    a2 = (x2 - 11 * math.cos(ang + 0.45), y2 - 11 * math.sin(ang + 0.45))
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{w}"/>'
            f'<polygon points="{x2},{y2} {a1[0]:.1f},{a1[1]:.1f} {a2[0]:.1f},{a2[1]:.1f}" fill="{color}"/>')


def box(x, y, w, h, fill="#fff", stroke=GOLD, rx=10, sw=1.6, extra=""):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'


# ------------------------------------------------------------------ rosette
def lantern(glass='class="ac"', metal=GOLD, glow=True):
    """A hanging lantern (fanoos) ornament."""
    b = ('<defs><radialGradient id="lglow"><stop offset="0" stop-color="#ffd97a" stop-opacity=".55"/>'
         '<stop offset="1" stop-color="#ffd97a" stop-opacity="0"/></radialGradient>'
         '<linearGradient id="lflame" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff6d6"/>'
         '<stop offset="1" stop-color="#f2c45a"/></linearGradient></defs>')
    if glow:
        b += '<circle cx="50" cy="70" r="48" fill="url(#lglow)"/>'
    b += f'<line x1="50" y1="0" x2="50" y2="13" stroke="{metal}" stroke-width="1.6"/>'
    b += f'<circle cx="50" cy="16.5" r="3.2" fill="none" stroke="{metal}" stroke-width="1.6"/>'
    b += f'<path d="M37 36 Q50 15 63 36 Z" fill="{metal}"/><circle cx="50" cy="22" r="2" fill="{metal}"/>'
    b += f'<rect x="33" y="35.5" width="34" height="4.5" rx="1.5" fill="{metal}"/>'
    b += f'<polygon points="36,40 64,40 70,66 64,98 36,98 30,66" {glass} stroke="{metal}" stroke-width="2.2"/>'
    b += '<path d="M43 94 V66 Q43 52 50 47 Q57 52 57 66 V94 Z" fill="url(#lflame)" opacity=".92"/>'
    b += f'<path d="M43 94 V66 Q43 52 50 47 Q57 52 57 66 V94 Z" fill="none" stroke="{metal}" stroke-width="1.2"/>'
    b += f'<line x1="30" y1="66" x2="70" y2="66" stroke="{metal}" stroke-width="1" opacity=".7"/>'
    b += f'<rect x="33" y="97.5" width="34" height="4.5" rx="1.5" fill="{metal}"/>'
    b += f'<path d="M37 102 L63 102 L50 121 Z" fill="{metal}"/><circle cx="50" cy="124.5" r="2.4" fill="{metal}"/>'
    return f'<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">{b}</svg>'


def rosette():
    return lantern()


# ------------------------------------------------------------------ H1 intention
def intention():
    b = box(220, 20, 160, 56, 'url(#g1)', GOLD) + t(300, 45, "ONE DEED", 15, 700, fam="Cinzel") + t(300, 64, "e.g. moving to a new city", 11, italic=True, fill=MUTED)
    b += '<defs><linearGradient id="g1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#f3ead3"/></linearGradient></defs>'
    b += arrow(260, 78, 150, 130) + arrow(340, 78, 450, 130)
    b += box(40, 132, 220, 62, "#eaf5ee", GREEN) + t(150, 156, "Intention: for Allah", 14, 700, fill=GREEN) + t(150, 176, "and His Messenger", 13, fill=GREEN)
    b += box(340, 132, 220, 62, "#fbeeee", RED) + t(450, 156, "Intention: worldly gain", 14, 700, fill=RED) + t(450, 176, "money, marriage, fame", 13, fill=RED)
    b += arrow(150, 196, 150, 226, GREEN) + arrow(450, 196, 450, 226, GREEN if False else RED)
    b += t(150, 248, "Reward with Allah", 15, 700, fill=GREEN, fam="Cinzel") + t(450, 248, "Only what he aimed for", 15, 700, fill=RED, fam="Cinzel")
    return svg(600, 262, b)


# ------------------------------------------------------------------ H2 levels
def levels():
    b = f'<g class="hot" data-info="islam"><circle cx="190" cy="140" r="122" class="sf" stroke="{GOLD}" stroke-width="2"/>'
    b += t(190, 42, "ISLAM", 15, 700, fam="Cinzel", extra='class="act"') + '</g>'
    b += f'<g class="hot" data-info="iman"><circle cx="190" cy="158" r="84" fill="#fff" class="acs" stroke-width="2"/>'
    b += t(190, 92, "IMAN", 15, 700, fam="Cinzel", extra='class="act"') + '</g>'
    b += f'<g class="hot" data-info="ihsan"><circle cx="190" cy="178" r="44" class="ac" stroke="{GOLD}" stroke-width="2"/>'
    b += t(190, 176, "IHSAN", 13, 700, fill="#fff", fam="Cinzel") + t(190, 192, "the summit", 10, fill="#fff", italic=True) + '</g>'
    rows = [("islam", "Islam — the outward deeds", "5 pillars: Shahadah, Salah, Zakah, Sawm, Hajj"),
            ("iman", "Iman — the inward beliefs", "6 pillars: Allah, angels, books, messengers, Last Day, qadar"),
            ("ihsan", "Ihsan — the highest level", "Worship Allah as if you see Him; He surely sees you")]
    y = 52
    for key, h, d in rows:
        b += f'<g class="hot" data-info="{key}"><rect x="338" y="{y - 18}" width="250" height="62" rx="8" fill="#fff" stroke="{GOLD}"/>'
        b += t(350, y + 2, h, 13, 700, "start", extra='class="act"') + t(350, y + 22, d[:40], 10.5, anchor="start", fill=MUTED)
        if len(d) > 40:
            b += t(350, y + 36, d[40:].strip(), 10.5, anchor="start", fill=MUTED)
        b += '</g>'
        y += 80
    return svg(600, 280, b)


# ------------------------------------------------------------------ H3 pillars
def pillars():
    # parts marked class="hot" are clickable in the online book (see figinfo.py)
    b = '<g class="hot" data-info="islam">'
    b += f'<polygon points="60,92 300,18 540,92" class="ac" stroke="{GOLD}" stroke-width="2"/>'
    b += t(300, 74, "ISLAM", 22, 700, fill="#fff", fam="Cinzel") + ar(300, 52, "الإِسْلَام", 15, "#f3e6c4") + '</g>'
    b += f'<rect x="70" y="92" width="460" height="14" fill="{GOLD}"/>'
    names = [("Shahadah", "الشَّهَادَة", "shahadah"), ("Salah", "الصَّلَاة", "salah"), ("Zakah", "الزَّكَاة", "zakah"),
             ("Hajj", "الحَجّ", "hajj"), ("Sawm", "الصَّوْم", "sawm")]
    for i, (e, a_, key) in enumerate(names):
        x = 92 + i * 92
        b += f'<g class="hot" data-info="{key}">'
        b += f'<rect x="{x - 14}" y="106" width="76" height="160" fill="transparent"/>'
        b += f'<rect x="{x}" y="106" width="48" height="122" fill="#fff" class="acs" stroke-width="2"/>'
        b += f'<rect x="{x - 6}" y="106" width="60" height="8" class="ac"/><rect x="{x - 6}" y="222" width="60" height="8" class="ac"/>'
        b += f'<text x="{x + 24}" y="168" text-anchor="middle" fill="{INK}" style="font:600 12px Lora" transform="rotate(-90 {x + 24} 168)">{e}</text>'
        b += ar(x + 24, 252, a_, 14, MUTED) + '</g>'
    b += f'<rect x="50" y="230" width="500" height="6" fill="{GOLD}"/>'
    return svg(600, 262, b)


# ------------------------------------------------------------------ H4 womb timeline
def womb():
    # parts marked class="hot" are clickable in the online book (see embryo.py)
    b = ""
    stages = [("Nutfah", "drop", "نُطْفَة", "nutfah"), ("ʿAlaqah", "clinging clot", "عَلَقَة", "alaqah"), ("Mudghah", "chewed lump", "مُضْغَة", "mudghah")]
    for i, (e, d, a, key) in enumerate(stages):
        x = 20 + i * 150
        b += f'<g class="hot" data-info="{key}">'
        b += f'<rect x="{x}" y="40" width="140" height="70" rx="10" class="sf" stroke="{GOLD}" stroke-width="1.5"/>'
        b += t(x + 70, 30, f"Days {i * 40 + 1}–{i * 40 + 40}", 11, 700, fill=MUTED, fam="Cinzel")
        b += t(x + 70, 68, e, 15, 700, extra='class="act"') + t(x + 70, 86, d, 11, italic=True, fill=MUTED) + ar(x + 70, 104, a, 13, MUTED, 400) + '</g>'
    b += arrow(470, 75, 500, 75)
    b += '<g class="hot" data-info="soul">' + star8(545, 75, 40) + t(545, 72, "Soul", 13, 700, fill="#fff") + t(545, 88, "breathed in", 9.5, fill="#fff") + '</g>'
    four = ["Provision (rizq)", "Life-span (ajal)", "Deeds (ʿamal)", "Wretched or happy"]
    b += '<g class="hot" data-info="writing"><rect x="20" y="132" width="560" height="100" fill="#fff" fill-opacity="0"/>'
    b += t(300, 150, "The angel is commanded to write four things:", 13, 700, fam="Lora")
    for i, f in enumerate(four):
        x = 30 + i * 140
        b += f'<path d="M{x} 170 h120 a8 8 0 0 1 0 16 v34 a8 8 0 0 1 -8 8 h-112 a8 8 0 0 1 0 -16 v-34 a8 8 0 0 1 0 -8z" fill="#fffdf6" stroke="{GOLD}" stroke-width="1.5"/>'
        b += t(x + 58, 204, f, 11.5, 600)
    b += '</g>'
    return svg(600, 240, b)


# ------------------------------------------------------------------ H5 two conditions
def conditions():
    b = box(30, 30, 230, 110, "#eaf5ee", GREEN) + t(145, 62, "1. IKHLAS", 16, 700, fill=GREEN, fam="Cinzel") + t(145, 86, "Done sincerely", 13) + t(145, 106, "for Allah alone", 13) + t(145, 128, "(Hadith 1 — the inside)", 10.5, italic=True, fill=MUTED)
    b += t(300, 92, "+", 34, 700, fill=GOLD)
    b += box(340, 30, 230, 110, "#eaf5ee", GREEN) + t(455, 62, "2. MUTABAʿAH", 16, 700, fill=GREEN, fam="Cinzel") + t(455, 86, "Done the way the", 13) + t(455, 106, "Prophet ﷺ taught", 13) + t(455, 128, "(Hadith 5 — the outside)", 10.5, italic=True, fill=MUTED)
    b += arrow(300, 146, 300, 176)
    b += star8(300, 214, 34) + t(300, 212, "Accepted", 12, 700, fill="#fff") + t(300, 226, "deed", 11, fill="#fff")
    return svg(600, 258, b)


# ------------------------------------------------------------------ H6 spectrum
def spectrum():
    b = '<defs><linearGradient id="sp" x1="0" x2="1"><stop offset="0" stop-color="#3f9a63"/><stop offset=".33" stop-color="#9ccf7a"/><stop offset=".5" stop-color="#f1c453"/><stop offset=".67" stop-color="#ef9a4a"/><stop offset="1" stop-color="#c0392b"/></linearGradient></defs>'
    b += '<rect x="20" y="40" width="560" height="44" rx="22" fill="url(#sp)"/>'
    b += t(100, 68, "HALAL — clear", 14, 700, fill="#fff", fam="Cinzel") + t(300, 68, "DOUBTFUL", 14, 700, fill="#5a3b00", fam="Cinzel") + t(500, 68, "HARAM — clear", 14, 700, fill="#fff", fam="Cinzel")
    # fence + sanctuary
    b += f'<rect x="420" y="112" width="160" height="96" rx="8" fill="#fbeeee" stroke="{RED}" stroke-width="2" stroke-dasharray="7 5"/>'
    b += t(500, 150, "Allah’s sanctuary", 13, 700, fill=RED) + t(500, 170, "= His prohibitions", 12, fill=RED)
    for i in range(7):
        b += f'<line x1="{420}" y1="{116 + i * 14}" x2="{408}" y2="{120 + i * 14}" stroke="{RED}" stroke-width="2"/>'
    # shepherd and sheep
    b += f'<circle cx="300" cy="150" r="16" fill="#fff" stroke="{AMBER}" stroke-width="2.5"/>' + t(300, 155, "you", 11, 700, fill=AMBER)
    for (x, y) in [(345, 132), (372, 160), (350, 184), (396, 140)]:
        b += f'<ellipse cx="{x}" cy="{y}" rx="13" ry="9" fill="#fff" stroke="{MUTED}" stroke-width="1.6"/><circle cx="{x + 12}" cy="{y - 3}" r="4" fill="{MUTED}"/>'
    b += t(170, 140, "Grazing near the", 13, 600, fill=AMBER) + t(170, 160, "boundary is risky…", 13, 600, fill=AMBER)
    b += t(170, 188, "…so keep a safe distance.", 12.5, italic=True, fill=GREEN)
    b += t(300, 238, "The heart is the king of the body: guard it and the limbs follow.", 13, 600, extra='class="act"')
    return svg(600, 252, b)


# ------------------------------------------------------------------ H7 naseeha
def naseeha():
    b = star8(300, 130, 62) + t(300, 124, "NASEEHAH", 13, 700, fill="#fff", fam="Cinzel") + t(300, 142, "sincerity", 11, fill="#fff", italic=True)
    items = [(300, 26, "To Allah"), (520, 92, "To His Book"), (470, 228, "To His Messenger"), (130, 228, "To the leaders"), (80, 92, "To the common folk")]
    for (x, y, s) in items:
        b += f'<line x1="300" y1="130" x2="{x}" y2="{y}" stroke="{GOLD}" stroke-width="1.6" stroke-dasharray="4 4"/>'
    for (x, y, s) in items:
        b += box(x - 72, y - 18, 144, 34, "#fff", GOLD, 17) + t(x, y + 4, s, 13, 700, extra='class="act"')
    return svg(600, 256, b)


# ------------------------------------------------------------------ H10 accepted dua
def dua():
    b = t(300, 26, "What stands between a du‘a and its answer?", 15, 700, extra='class="act"')
    good = ["Long journey", "Dishevelled & dusty", "Raised hands", "Calling ‘O Lord!’"]
    bad = ["Haram food", "Haram drink", "Haram clothing", "Nourished on haram"]
    for i, g in enumerate(good):
        b += box(20, 46 + i * 46, 230, 36, "#eaf5ee", GREEN, 18) + t(135, 69 + i * 46, "✓ " + g, 13, 600, fill=GREEN)
    for i, g in enumerate(bad):
        b += box(350, 46 + i * 46, 230, 36, "#fbeeee", RED, 18) + t(465, 69 + i * 46, "✗ " + g, 13, 600, fill=RED)
    b += f'<rect x="282" y="46" width="36" height="174" rx="6" fill="{RED}" opacity=".85"/>' + f'<text x="300" y="133" text-anchor="middle" fill="#fff" style="font:700 12px Cinzel" transform="rotate(-90 300 133)">BARRIER</text>'
    b += t(135, 242, "reasons for an answer", 11.5, italic=True, fill=MUTED) + t(465, 242, "…blocked by the haram", 11.5, italic=True, fill=MUTED)
    return svg(600, 252, b)


# ------------------------------------------------------------------ H16 anger
def anger():
    b = f'<rect x="60" y="20" width="40" height="190" rx="20" fill="#fff" stroke="{MUTED}" stroke-width="2"/>'
    b += '<defs><linearGradient id="th" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#3f9a63"/><stop offset=".55" stop-color="#f1c453"/><stop offset="1" stop-color="#c0392b"/></linearGradient></defs>'
    b += '<rect x="70" y="40" width="20" height="170" rx="10" fill="url(#th)"/><circle cx="80" cy="215" r="24" fill="#3f9a63" stroke="#fff" stroke-width="3"/>'
    b += t(140, 40, "Boiling", 12, 700, "start", RED) + t(140, 125, "Rising", 12, 700, "start", AMBER) + t(140, 205, "Calm", 12, 700, "start", GREEN)
    cures = [("Seek refuge", "A‘ūdhu billāhi mina sh-shayṭāni r-rajīm"), ("Stay silent", "Words in anger are often regretted"),
             ("Change position", "If standing, sit; if sitting, lie down"), ("Make wudu", "Cool the fire with water"),
             ("Remember the reward", "Paradise for those who restrain anger (3:134)")]
    for i, (h, d) in enumerate(cures):
        y = 22 + i * 44
        b += box(240, y, 340, 38, "#fff", GOLD, 8) + f'<circle cx="262" cy="{y + 19}" r="11" class="ac"/>' + t(262, y + 24, str(i + 1), 12, 700, fill="#fff")
        b += t(282, y + 16, h, 13, 700, "start", extra='class="act"') + t(282, y + 32, d, 10.5, anchor="start", fill=MUTED, italic=True)
    b += arrow(200, 120, 232, 120)
    return svg(600, 246, b)


# ------------------------------------------------------------------ H18 erase
def erase():
    b = box(20, 60, 150, 80, "#fbeeee", RED) + t(95, 96, "A bad deed", 15, 700, fill=RED) + t(95, 118, "slips out", 12, italic=True, fill=MUTED)
    b += t(200, 108, "+", 36, 700, fill=GOLD)
    b += box(230, 60, 150, 80, "#eaf5ee", GREEN) + t(305, 92, "A good deed", 15, 700, fill=GREEN) + t(305, 112, "istighfar, salah,", 11.5, fill=MUTED) + t(305, 128, "charity, kindness", 11.5, fill=MUTED)
    b += arrow(390, 100, 430, 100)
    b += f'<rect x="440" y="60" width="140" height="80" rx="10" fill="#fff" stroke="{GOLD}" stroke-width="1.6" stroke-dasharray="6 5"/>'
    b += t(510, 96, "Wiped out", 15, 700, extra='class="act"') + t(510, 118, "by Allah’s mercy", 12, italic=True, fill=MUTED)
    b += t(300, 186, "Taqwa everywhere  •  Repair mistakes quickly  •  Good character with people", 13, 600, extra='class="act"')
    b += t(300, 40, "Three commands in one hadith", 12, italic=True, fill=MUTED)
    return svg(600, 204, b)


# ------------------------------------------------------------------ H19 guard
def guard():
    b = ""
    pairs = [("Guard Allah’s limits", "Allah guards you"), ("Know Allah in ease", "He knows you in hardship"),
             ("Ask Allah", "the One who gives"), ("Seek help from Allah", "the One who helps")]
    for i, (a, c) in enumerate(pairs):
        y = 18 + i * 56
        b += box(20, y, 240, 44, "#fff", GOLD, 22) + t(140, y + 27, a, 13.5, 700, extra='class="act"')
        b += arrow(268, y + 22, 326, y + 22)
        b += f'<rect x="334" y="{y}" width="246" height="44" rx="22" class="ac"/>' + t(457, y + 27, c, 13.5, 700, fill="#fff")
    b += t(300, 248, "The pens have been lifted and the pages have dried.", 13, italic=True, fill=MUTED)
    return svg(600, 258, b)


# ------------------------------------------------------------------ H23 scale
def scale():
    b = f'<line x1="300" y1="30" x2="300" y2="210" stroke="{MUTED}" stroke-width="5"/><polygon points="260,222 340,222 300,200" fill="{MUTED}"/>'
    b += f'<line x1="140" y1="70" x2="460" y2="50" stroke="{GOLD}" stroke-width="5"/><circle cx="300" cy="60" r="9" fill="{GOLD}"/>'
    b += f'<line x1="150" y1="70" x2="110" y2="150" stroke="{MUTED}" stroke-width="1.5"/><line x1="150" y1="70" x2="190" y2="150" stroke="{MUTED}" stroke-width="1.5"/>'
    b += f'<path d="M90 150 h120 a60 30 0 0 1 -120 0z" class="ac"/>' + ar(150, 168, "الحَمْدُ لِلَّه", 17, "#fff")
    b += f'<line x1="450" y1="50" x2="410" y2="118" stroke="{MUTED}" stroke-width="1.5"/><line x1="450" y1="50" x2="490" y2="118" stroke="{MUTED}" stroke-width="1.5"/>'
    b += f'<path d="M390 118 h120 a60 26 0 0 1 -120 0z" fill="#fff" stroke="{GOLD}" stroke-width="2"/>'
    b += t(150, 228, "“Alhamdulillah fills the scale”", 13, 700, extra='class="act"')
    gifts = ["Salah = light", "Charity = proof", "Patience = radiance", "Qur’an = proof for/against"]
    for i, g in enumerate(gifts):
        b += t(470, 160 + i * 20, g, 11.5, 600, fill=MUTED)
    return svg(600, 244, b)


# ------------------------------------------------------------------ H26 daily charity
def charity():
    b = t(300, 24, "360 joints → a charity for each, every day", 14, 700, extra='class="act"')
    items = [("⚖", "Judge fairly between two"), ("🐪", "Help someone with his mount"), ("💬", "Say a good word"),
             ("👣", "Each step to the prayer"), ("🪨", "Remove harm from the road"), ("☀", "…every day the sun rises")]
    for i, (ic, s) in enumerate(items):
        x = 20 + (i % 3) * 190
        y = 44 + (i // 3) * 92
        b += box(x, y, 180, 80, "#fff", GOLD, 12)
        b += f'<circle cx="{x + 90}" cy="{y + 28}" r="18" class="sf" stroke="{GOLD}"/>'
        b += f'<text x="{x + 90}" y="{y + 35}" text-anchor="middle" style="font:18px \'Noto Color Emoji\'">{ic}</text>'
        b += t(x + 90, y + 66, s, 11.5, 600)
    return svg(600, 236, b)


# ------------------------------------------------------------------ H29 tent
def tent():
    b = f'<polygon points="300,30 90,210 510,210" class="sf" stroke="{GOLD}" stroke-width="2.5"/>'
    b += f'<line x1="300" y1="30" x2="300" y2="214" class="acs" stroke-width="9"/>'
    b += f'<circle cx="300" cy="30" r="13" fill="{GOLD}"/>'
    b += f'<line x1="60" y1="214" x2="540" y2="214" stroke="{MUTED}" stroke-width="3"/>'
    b += box(330, 14, 250, 34, "#fff", GOLD, 17) + t(455, 36, "Peak (summit): Jihad", 13, 700, extra='class="act"')
    b += box(330, 104, 250, 34, "#fff", GOLD, 17) + t(455, 126, "Central pole: the Prayer", 13, 700, extra='class="act"')
    b += box(20, 104, 250, 34, "#fff", GOLD, 17) + t(145, 126, "The whole matter: Islam", 13, 700, extra='class="act"')
    b += box(150, 222, 300, 30, "#fbeeee", RED, 15) + t(300, 242, "What holds it together: control of the tongue", 12, 700, fill=RED)
    return svg(600, 258, b)


# ------------------------------------------------------------------ H30 four
def four():
    q = [("Obligations", "do not neglect them", GREEN, "#eaf5ee"), ("Limits", "do not overstep them", AMBER, "#fdf3e1"),
         ("Prohibitions", "do not violate them", RED, "#fbeeee"), ("Things left unmentioned", "a mercy — do not dig into them", "#1d4e7a", "#e4edf6")]
    b = ""
    for i, (h, d, c, f) in enumerate(q):
        x = 20 + (i % 2) * 285
        y = 14 + (i // 2) * 104
        b += box(x, y, 275, 94, f, c, 12) + t(x + 137, y + 42, h, 17, 700, fill=c, fam="Cinzel") + t(x + 137, y + 66, d, 12.5, italic=True, fill=INK)
    return svg(600, 222, b)


# ------------------------------------------------------------------ H34 stairs
def stairs():
    b = ""
    lv = [("With the hand", "if you have authority (parent, ruler)"), ("With the tongue", "wise, gentle words"), ("With the heart", "hate it & leave it — the weakest of faith")]
    for i, (h, d) in enumerate(lv):
        x = 20 + i * 190
        y = 30 + i * 60
        hgt = 200 - i * 60
        b += f'<rect x="{x}" y="{y}" width="180" height="{hgt}" rx="6" class="ac" opacity="{1 - i * .25}"/>'
        b += t(x + 90, y + 30, f"Level {i + 1}", 11, 700, fill="#f3e6c4", fam="Cinzel") + t(x + 90, y + 54, h, 15, 700, fill="#fff")
        words = d.split(" — ")
        b += t(x + 90, y + 76, words[0], 10.5, fill="#fff", italic=True)
        if len(words) > 1:
            b += t(x + 90, y + 92, words[1], 10.5, fill="#fff", italic=True)
    b += t(300, 18, "See an evil? Change it according to your ability", 13, 700, extra='class="act"')
    return svg(600, 238, b)


# ------------------------------------------------------------------ H37 multiply
def multiply():
    rows = [("Intend good, don’t do it", 1, GREEN, "1 good deed"), ("Intend good and do it", 10, GREEN, "10 → 700 → many more"),
            ("Intend evil, leave it for Allah", 1, GREEN, "1 good deed"), ("Intend evil and do it", 1, RED, "only 1 bad deed")]
    b = ""
    for i, (h, n, c, lab) in enumerate(rows):
        y = 16 + i * 52
        b += t(222, y + 24, h, 13, 600, "end")
        w = 30 if n == 1 else 300
        if n == 10:
            b += f'<rect x="232" y="{y + 6}" width="{w}" height="26" rx="6" fill="{c}" opacity=".9"/><rect x="532" y="{y + 6}" width="44" height="26" rx="6" fill="{c}" opacity=".35"/>'
        else:
            b += f'<rect x="232" y="{y + 6}" width="{w}" height="26" rx="6" fill="{c}"/>'
        b += t(232 + w + 10 if n == 1 else 382, y + 24, lab, 12, 700, "start" if n == 1 else "middle", "#fff" if n == 10 else c)
    return svg(600, 222, b)


# ------------------------------------------------------------------ H38 ladder
def ladder():
    b = f'<line x1="200" y1="20" x2="200" y2="236" stroke="{MUTED}" stroke-width="6"/><line x1="320" y1="20" x2="320" y2="236" stroke="{MUTED}" stroke-width="6"/>'
    rungs = ["Obligations (fara’id) — the base", "Sunnah prayers", "Voluntary fasting", "Qur’an & dhikr", "Charity & good deeds"]
    for i, r in enumerate(rungs):
        y = 220 - i * 40
        b += f'<line x1="200" y1="{y}" x2="320" y2="{y}" stroke="{GOLD}" stroke-width="6"/>' + t(340, y + 5, r, 13, 700 if i == 0 else 500, "start", extra='class="act"' if i == 0 else "")
    b += star8(260, 26, 26) + t(260, 31, "LOVE", 11, 700, fill="#fff", fam="Cinzel")
    b += t(100, 70, "Allah loves him:", 12, 700, extra='class="act"') + t(100, 90, "guides his hearing,", 11, fill=MUTED) + t(100, 106, "sight, hands, feet;", 11, fill=MUTED) + t(100, 122, "answers his du‘a,", 11, fill=MUTED) + t(100, 138, "grants him refuge", 11, fill=MUTED)
    return svg(600, 244, b)


# ------------------------------------------------------------------ H40 traveller
def traveller():
    b = '<path d="M10 210 C 160 160, 260 230, 380 170 S 560 110, 590 120" fill="none" stroke="#d8c79f" stroke-width="26" stroke-linecap="round"/>'
    b += '<path d="M10 210 C 160 160, 260 230, 380 170 S 560 110, 590 120" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="10 10"/>'
    b += f'<circle cx="120" cy="170" r="11" class="ac"/><line x1="120" y1="181" x2="120" y2="206" class="acs" stroke-width="4"/><line x1="120" y1="190" x2="134" y2="198" class="acs" stroke-width="3"/><line x1="134" y1="198" x2="134" y2="160" stroke="{MUTED}" stroke-width="2"/><rect x="104" y="186" width="10" height="14" rx="2" fill="{GOLD}"/>'
    b += f'<rect x="520" y="40" width="6" height="90" fill="{MUTED}"/><path d="M470 44 h110 l14 14 -14 14 h-110z" class="ac"/>' + t(530, 63, "AKHIRAH", 12, 700, fill="#fff", fam="Cinzel")
    b += t(300, 34, "A stranger or a wayfarer: travels light, does not settle, keeps his eye on home", 12, 600, extra='class="act"')
    tips = ["Health before sickness", "Life before death", "Do not wait for evening", "Do not wait for morning"]
    for i, s in enumerate(tips):
        b += t(30 + i * 140, 82, "•", 14, 700, "start", GOLD) + t(42 + i * 140, 82, s, 11, anchor="start", fill=MUTED)
    return svg(600, 236, b)


# ------------------------------------------------------------------ H42 forgiveness
def forgive():
    cols = [("Call on Me & hope", "I forgive whatever you did", "🤲"), ("Sins reach the clouds", "…then ask forgiveness → forgiven", "☁"),
            ("Sins fill the earth", "…meet Me without shirk → equal forgiveness", "🌍")]
    b = ""
    for i, (h, d, ic) in enumerate(cols):
        x = 20 + i * 192
        b += box(x, 20, 180, 170, "#fff", GOLD, 14) + f'<circle cx="{x + 90}" cy="66" r="30" class="sf" stroke="{GOLD}"/>'
        b += f'<text x="{x + 90}" y="76" text-anchor="middle" style="font:28px \'Noto Color Emoji\'">{ic}</text>'
        b += t(x + 90, 124, h, 13, 700, extra='class="act"')
        parts = d.split(" → ") if " → " in d else [d]
        for j, p in enumerate(parts):
            b += t(x + 90, 148 + j * 18, p, 11, italic=True, fill=MUTED)
    b += t(300, 214, "Three doors of forgiveness: du‘a with hope · istighfar · tawhid", 13, 700, extra='class="act"')
    return svg(600, 226, b)


# ------------------------------------------------------------------ H43 inheritance
def inherit():
    b = star8(80, 110, 54) + t(80, 106, "ESTATE", 12, 700, fill="#fff", fam="Cinzel") + t(80, 122, "after debts", 9.5, fill="#fff") + t(80, 134, "& wasiyyah", 9.5, fill="#fff")
    b += arrow(140, 110, 196, 70) + arrow(140, 110, 196, 160)
    b += box(204, 34, 220, 72, "#eaf5ee", GREEN) + t(314, 62, "1. Fixed shares first", 14, 700, fill=GREEN) + t(314, 84, "½, ¼, ⅛, ⅔, ⅓, ⅙ (Qur’an 4:11-12, 176)", 10.5, fill=MUTED)
    b += box(204, 124, 220, 72, "#fdf3e1", AMBER) + t(314, 152, "2. Whatever remains", 14, 700, fill=AMBER) + t(314, 174, "goes to the nearest male (‘asabah)", 10.5, fill=MUTED)
    b += arrow(428, 160, 470, 160)
    b += box(474, 124, 110, 72, "#fff", GOLD) + t(529, 152, "son, father,", 11, 600) + t(529, 168, "brother, uncle…", 11, 600) + t(529, 186, "nearest first", 10, italic=True, fill=MUTED)
    b += t(300, 226, "Order: funeral costs → debts → bequest (max ⅓) → shares → residue", 12, 700, extra='class="act"')
    return svg(600, 238, b)


# ------------------------------------------------------------------ H44 fosterage
def foster():
    b = box(220, 14, 160, 50, "#fff", GOLD, 25) + t(300, 36, "Foster mother", 13, 700, extra='class="act"') + t(300, 53, "nursed the baby", 10.5, italic=True, fill=MUTED)
    kids = [(70, "Her children", "foster siblings"), (230, "Her husband", "foster father"), (390, "Her sisters", "foster aunts"), (530, "Her parents", "foster grandparents")]
    for x, h, d in kids:
        b += f'<line x1="300" y1="64" x2="{x}" y2="104" stroke="{GOLD}" stroke-width="1.6"/>'
        b += box(x - 66, 104, 132, 50, "#eaf5ee", GREEN, 10) + t(x, 126, h, 12.5, 700, fill=GREEN) + t(x, 144, d, 10.5, italic=True, fill=MUTED)
    b += box(90, 172, 420, 50, "#fff", GOLD, 12) + t(300, 193, "They become mahram (marriage forbidden; may see & sit with),", 11.5, 600) + t(300, 211, "but there is NO inheritance or financial duty through fosterage", 11.5, 600, fill=RED)
    return svg(600, 232, b)


# ------------------------------------------------------------------ H47 stomach
def stomach():
    cx, cy, r = 150, 120, 96
    cols = [("#c9a14a", "Food"), ("#3b82a6", "Drink"), ("#e9e2cf", "Breath")]
    b = ""
    for i, (c, _) in enumerate(cols):
        a0, a1 = math.radians(-90 + i * 120), math.radians(-90 + (i + 1) * 120)
        x0, y0, x1, y1 = cx + r * math.cos(a0), cy + r * math.sin(a0), cx + r * math.cos(a1), cy + r * math.sin(a1)
        b += f'<path d="M{cx} {cy} L{x0:.1f} {y0:.1f} A{r} {r} 0 0 1 {x1:.1f} {y1:.1f}z" fill="{c}" stroke="#fff" stroke-width="3"/>'
    b += t(196, 98, "⅓ food", 14, 700, fill="#fff") + t(150, 196, "⅓ drink", 14, 700, fill="#fff") + t(102, 98, "⅓ breath", 14, 700, fill=MUTED)
    tips = ["Best: a few morsels to keep your back straight", "If you must eat more — stop at one-third", "Say Bismillah; eat with the right hand", "Eat from what is in front of you", "Finish with Alhamdulillah"]
    for i, s in enumerate(tips):
        b += f'<circle cx="300" cy="{42 + i * 38}" r="10" class="ac"/>' + t(300, 46 + i * 38, str(i + 1), 11, 700, fill="#fff") + t(318, 47 + i * 38, s, 12.5, anchor="start")
    return svg(600, 236, b)


# ------------------------------------------------------------------ H48 hypocrisy
def hypocrisy():
    signs = [("Speaks", "→ lies", "Truthfulness"), ("Promises", "→ breaks it", "Keeping promises"), ("Disputes", "→ goes beyond limits", "Fairness in argument"), ("Makes a pact", "→ betrays it", "Loyalty")]
    b = ""
    for i, (a, c, cure) in enumerate(signs):
        x = 16 + i * 146
        b += box(x, 18, 136, 120, "#fbeeee", RED, 12) + t(x + 68, 52, "When he…", 11, italic=True, fill=MUTED) + t(x + 68, 78, a, 15, 700, fill=RED) + t(x + 68, 102, c, 12, 600, fill=RED)
        b += arrow(x + 68, 144, x + 68, 170, GREEN)
        b += box(x, 174, 136, 46, "#eaf5ee", GREEN, 23) + t(x + 68, 202, cure, 11.5, 700, fill=GREEN)
    return svg(600, 230, b)


# ------------------------------------------------------------------ H49 birds
def birds():
    def bird(x, y, s, full):
        body = 26 if full else 16
        return (f'<ellipse cx="{x}" cy="{y}" rx="{body * s}" ry="{body * .62 * s}" class="ac"/>'
                f'<circle cx="{x + body * s * .9}" cy="{y - 10 * s}" r="{9 * s}" class="ac"/>'
                f'<polygon points="{x + body * s * .9 + 8 * s},{y - 12 * s} {x + body * s * .9 + 20 * s},{y - 9 * s} {x + body * s * .9 + 8 * s},{y - 6 * s}" fill="{GOLD}"/>'
                f'<path d="M{x - 6} {y - 4} q -14 -26 -36 -22 q 16 10 26 24z" fill="{GOLD}" opacity=".8"/>'
                f'<circle cx="{x + body * s * .9 + 3}" cy="{y - 12 * s}" r="1.8" fill="#fff"/>')
    b = '<defs><linearGradient id="dawn" x1="0" x2="1"><stop offset="0" stop-color="#fdf0d5"/><stop offset="1" stop-color="#e3e8f3"/></linearGradient></defs>'
    b += '<rect x="0" y="0" width="600" height="220" rx="14" fill="url(#dawn)"/>'
    b += f'<circle cx="70" cy="58" r="26" fill="{AMBER}"/>' + t(70, 104, "Morning", 12, 700, fill=MUTED, fam="Cinzel")
    b += f'<path d="M548 40 a24 24 0 1 0 22 34 a19 19 0 1 1 -22 -34z" fill="#8a96b8"/>' + t(545, 104, "Evening", 12, 700, fill=MUTED, fam="Cinzel")
    b += bird(180, 130, 1, False) + t(180, 186, "goes out hungry (khimas)", 12, 600, extra='class="act"')
    b += arrow(250, 130, 340, 130)
    b += t(295, 118, "trusts + strives", 10.5, italic=True, fill=MUTED)
    b += bird(420, 130, 1, True) + t(420, 186, "returns full (bitan)", 12, 600, extra='class="act"')
    b += t(300, 210, "Tawakkul = the heart relies on Allah while the body takes the means", 12, 700, fill=INK)
    return svg(600, 222, b)


# ------------------------------------------------------------------ H50 dhikr clock
def dhikr():
    cx, cy, r = 140, 120, 96
    b = f'<circle cx="{cx}" cy="{cy}" r="{r}" class="sf" stroke="{GOLD}" stroke-width="2"/>' + f'<circle cx="{cx}" cy="{cy}" r="40" class="ac"/>' + ar(cx, cy + 7, "ذِكْرُ اللَّه", 17, "#fff")
    slots = ["Waking up", "After Fajr", "Morning adhkar", "After each salah", "Evening adhkar", "Before sleep"]
    for i, s in enumerate(slots):
        a = math.radians(-90 + i * 60)
        x, y = cx + 70 * math.cos(a), cy + 70 * math.sin(a)
        b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7" fill="{GOLD}"/>'
    lines = [("SubḥānAllāh", "light on the tongue, heavy on the scale"), ("Al-ḥamdu lillāh", "fills the scale"),
             ("Lā ilāha illallāh", "the best dhikr"), ("Allāhu akbar", "greater than everything"), ("Astaghfirullāh", "100× a day, as the Prophet ﷺ did")]
    for i, (h, d) in enumerate(lines):
        y = 30 + i * 42
        b += box(270, y - 18, 312, 36, "#fff", GOLD, 18) + t(290, y + 4, h, 13.5, 700, "start", extra='class="act"') + t(570, y + 4, d, 10.5, anchor="end", fill=MUTED, italic=True)
    b += t(cx, 236, "a moist tongue all day", 11.5, italic=True, fill=MUTED)
    return svg(600, 244, b)


# ------------------------------------------------------------------ H24 ocean
def ocean():
    b = '<defs><linearGradient id="sea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7fb4d6"/><stop offset="1" stop-color="#1d4e7a"/></linearGradient></defs>'
    b += '<path d="M0 90 q 50 -18 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 v 120 h -600z" fill="url(#sea)"/>'
    b += f'<line x1="300" y1="20" x2="300" y2="104" stroke="{MUTED}" stroke-width="2.5"/><ellipse cx="300" cy="26" rx="3" ry="6" fill="none" stroke="{MUTED}" stroke-width="1.5"/>'
    b += t(300, 150, "If all creation asked and were all given —", 14, 700, fill="#fff") + t(300, 172, "it would decrease Allah’s treasures only as a needle", 13, fill="#fff") + t(300, 192, "decreases the ocean when dipped into it.", 13, fill="#fff")
    return svg(600, 210, b)


# ------------------------------------------------------------------ H15 three rights
def rights():
    items = [("🗣", "Your tongue", "speak good or stay silent"), ("🏠", "Your neighbour", "honour and never harm"), ("🍽", "Your guest", "welcome and serve generously")]
    b = t(300, 24, "Signs of true faith in Allah and the Last Day", 14, 700, extra='class="act"')
    for i, (ic, h, d) in enumerate(items):
        x = 20 + i * 192
        b += box(x, 40, 180, 150, "#fff", GOLD, 14) + f'<circle cx="{x + 90}" cy="84" r="28" class="sf" stroke="{GOLD}"/>'
        b += f'<text x="{x + 90}" y="93" text-anchor="middle" style="font:26px \'Noto Color Emoji\'">{ic}</text>'
        b += t(x + 90, 140, h, 15, 700, extra='class="act"') + t(x + 90, 164, d, 11, italic=True, fill=MUTED)
    return svg(600, 204, b)


FIGURES = {
    "rosette": rosette(), "lantern": lantern('fill="#0f5a4f"'), "intention": intention(), "levels": levels(), "pillars": pillars(), "womb": womb(),
    "conditions": conditions(), "spectrum": spectrum(), "naseeha": naseeha(), "dua": dua(), "anger": anger(),
    "erase": erase(), "guard": guard(), "scale": scale(), "charity": charity(), "tent": tent(), "four": four(),
    "stairs": stairs(), "multiply": multiply(), "ladder": ladder(), "traveller": traveller(), "forgive": forgive(),
    "inherit": inherit(), "foster": foster(), "stomach": stomach(), "hypocrisy": hypocrisy(), "birds": birds(),
    "dhikr": dhikr(), "ocean": ocean(), "rights": rights(),
}
