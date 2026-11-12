#!/usr/bin/env python3
"""Build "Zaad: Provision for the Day", a Muslim daily planner for 2027 (1448-1449 AH), as an A5 PDF.

  python3 build.py            # full planner
  SAMPLE=1 python3 build.py   # front matter, January and the first week only (quick check)

Needs: Python 3 with hijridate, Node with Playwright Chromium. Fonts are shared with ../arbaeen-nawawi-book.
"""
import calendar, datetime as dt, json, os, re, subprocess, sys, unicodedata

from hijridate import Gregorian

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "src"))
from content import (EVIDENCE, EV_NUM, SEASONAL, SEA, WEEKLY, SEASON_WEEK_TITLES, MONTHS,  # noqa: E402
                     HIJRI_MONTHS, WEEKDAYS_AR, ADHKAR, NAMES)
import art  # noqa: E402

YEAR = 2027
SAMPLE = bool(os.environ.get("SAMPLE"))
BUILD = os.path.join(ROOT, ".build")
# EDITION=weekly builds the slim edition: one week on two facing pages instead of one page per day.
WEEKLY_ED = os.environ.get("EDITION") == "weekly"
OUT = os.path.join(ROOT, "Zaad-Planner-2027-sample.pdf" if SAMPLE else
                   "Zaad-Muslim-Weekly-Planner-2027.pdf" if WEEKLY_ED else "Zaad-Muslim-Daily-Planner-2027.pdf")
# Pages left out of the weekly edition, by page title.
WEEKLY_SKIP = ("Goals in six areas", "Memorisation and revision", "Sadaqah and zakah", "Knowledge log", "Next year, in sha Allah")
os.makedirs(BUILD, exist_ok=True)

TITLE = "Zaad"
MONTH_NAMES = list(calendar.month_name)
DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
AR_DIG = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")


def hij(d):
    h = Gregorian(d.year, d.month, d.day).to_hijri()
    return h.year, h.month, h.day


def hname(m):
    return HIJRI_MONTHS[m - 1][0]


def all_days():
    d = dt.date(YEAR, 1, 1)
    while d.year == YEAR:
        yield d
        d += dt.timedelta(days=1)


# ---------------------------------------------------------------------------
# What is special about a day
# ---------------------------------------------------------------------------
def day_info(d):
    """Badges, extra ticks and the footer reminder for a date."""
    hy, hm, hd = hij(d)
    wd = d.weekday()
    badges, ticks, remind = [], [], None
    no_fast = (hm == 10 and hd == 1) or (hm == 12 and 10 <= hd <= 13)
    if hm == 9:
        badges.append(f"Ramadan · day {hd}")
        ticks += [("Suhoor", "suhoor"), ("Fasted today", "ramadan"), ("Iftar on time, with dua", "iftar"),
                  ("Tarawih / night prayer", "taraweeh")]
        remind = "ramadan"
        if hd >= 20 and (hd + 1) % 2 == 1 and hd + 1 <= 29:
            badges.append(f"Tonight: the {hd + 1}{'st' if hd + 1 == 21 else 'rd' if hd + 1 == 23 else 'th'} night")
            remind = "qadr"
        elif hd >= 20:
            remind = "qadr"
    elif hm == 10 and hd == 1:
        badges.append("Eid al-Fitr")
        ticks += [("Zakat al-Fitr given before the prayer", None), ("Takbir, ghusl and the Eid prayer", None)]
    elif hm == 10:
        ticks.append(("A fast of the six of Shawwal", "shawwal"))
        remind = "shawwal"
    elif hm == 12 and hd <= 9:
        badges.append(f"Dhul-Hijjah · day {hd} of the ten")
        ticks.append(("Takbir, tahlil and tahmid often", "tendays"))
        remind = "tendays"
        if hd == 9:
            badges.append("Day of 'Arafah")
            ticks.append(("Fast of 'Arafah", "arafah"))
            remind = "arafah"
        else:
            ticks.append(("Fasted (first nine days)", "tendays"))
    elif hm == 12 and hd == 10:
        badges.append("Eid al-Adha")
        ticks += [("Takbir, ghusl and the Eid prayer", None), ("Sacrifice (udhiyah)", None)]
        remind = "tendays"
    elif hm == 12 and hd <= 13:
        badges.append("Days of Tashriq")
        ticks.append(("Takbir after each prayer", "tashriq"))
        remind = "tashriq"
    elif hm == 1 and hd == 1:
        badges.append(f"1 Muharram · Hijri new year {hy}")
    elif hm == 1 and hd == 9:
        badges.append("Tasu'a · 9 Muharram")
        ticks.append(("Fast of the ninth (with 'Ashura)", "arafah"))
        remind = "arafah"
    elif hm == 1 and hd == 10:
        badges.append("'Ashura · 10 Muharram")
        ticks.append(("Fast of 'Ashura", "arafah"))
        remind = "arafah"

    sunnah_fast_ok = hm != 9 and not no_fast and not any("Fast of" in t[0] or "Fasted" in t[0] for t in ticks)
    if wd == 4:
        badges.insert(0, "Jumu'ah")
        ticks = [("Ghusl, best clothes, early to Jumu'ah", "jumuah"), ("Surat al-Kahf", "kahf"),
                 ("Dua in the last hour after 'Asr", "hour")] + ticks
        remind = remind or ("kahf", "hour")[d.timetuple().tm_yday // 7 % 2]
    if sunnah_fast_ok and 13 <= hd <= 15:
        badges.append("White day")
        ticks.append(("White-day fast (13 · 14 · 15)", "white"))
        remind = remind or "white"
    elif sunnah_fast_ok and wd in (0, 3):
        ticks.append(("Sunnah fast (Monday / Thursday)", "monthu"))
        remind = remind or "monthu"
    return badges, ticks, remind


# ---------------------------------------------------------------------------
# Small HTML helpers
# ---------------------------------------------------------------------------
PAGES = []  # (html, classes, accent, soft, tab_index, toc_label)


def add(html, cls="", month=None, toc=None, nofoot=False, band=""):
    """band: full-bleed HTML placed behind / above the page content (cover art, day and week headers)."""
    if WEEKLY_ED and any(f"<h1>{t}</h1>" in html for t in WEEKLY_SKIP):
        return
    PAGES.append(dict(html=html, cls=cls, month=month, toc=toc, nofoot=nofoot, band=band))


def recto():
    """Make the next page fall on a right-hand page (odd PDF page)."""
    if len(PAGES) % 2 == 1:
        add(notes_html("Notes"), month=PAGES[-1]["month"] if PAGES else None)


CB = '<i class="cb"></i>'
O = '<i class="o"></i>'
STAR = ('<svg viewBox="0 0 24 24"><path d="M12 1l3.2 5.1 5.9-1.3-1.3 5.9L25 14l-5.2 3.2 1.3 5.9-5.9-1.3L12 27l-3.2-5.2-5.9 1.3'
        ' 1.3-5.9L-1 14l5.2-3.3-1.3-5.9 5.9 1.3z" transform="translate(1.6 -.4) scale(.86)"/></svg>')


def lines(n, cls=""):
    return "".join(f'<div class="ln {cls}"></div>' for _ in range(n))


def cblines(n):
    return "".join(f'<div class="ln cbl">{CB}</div>' for _ in range(n))


def head(title, sub="", ar=""):
    return (f'<div class="ph"><div><h1>{title}</h1>{f"<p>{sub}</p>" if sub else ""}</div>'
            f'{f"<span class=ar lang=ar dir=rtl>{ar}</span>" if ar else ""}</div>')


def box(title, body, cls="", n=None):
    sup = f"<sup>{n}</sup>" if n else ""
    return f'<section class="bx {cls}"><h4>{title}{sup}</h4>{body}</section>'


def notes_html(title="Notes"):
    return head(title) + '<div class="dots"></div>'


def ev(key):
    """Superscript number that points at the evidence list."""
    if key in EV_NUM:
        return f"<sup>{EV_NUM[key]}</sup>"
    if key in SEA:
        return f"<sup>{len(EVIDENCE) + 1 + [s[0] for s in SEASONAL].index(key)}</sup>"
    return ""


# ---------------------------------------------------------------------------
# Front matter
# ---------------------------------------------------------------------------
def pattern_svg(color, op=.16, sw=.7):
    """Eight-pointed star tiling used on the cover and the month openers."""
    return (f'<svg class="pat" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs>'
            f'<pattern id="p8" width="40" height="40" patternUnits="userSpaceOnUse">'
            f'<g fill="none" stroke="{color}" stroke-width="{sw}" opacity="{op}">'
            f'<rect x="8.3" y="8.3" width="23.4" height="23.4"/>'
            f'<rect x="8.3" y="8.3" width="23.4" height="23.4" transform="rotate(45 20 20)"/>'
            f'<path d="M0 20h3.4M36.6 20H40M20 0v3.4M20 36.6V40M0 0l8.3 8.3M40 0l-8.3 8.3M0 40l8.3-8.3M40 40l-8.3-8.3"/>'
            f'<circle cx="20" cy="20" r="5.2"/></g></pattern></defs>'
            f'<rect width="100%" height="100%" fill="url(#p8)"/></svg>')


def band_orn(cols, rows, size=9.0):
    """A strip of eight-pointed star tiles, drawn as plain vector paths."""
    t = ""
    for r in range(rows):
        for c in range(cols):
            t += f'<use href="#gt" x="{c * 40}" y="{r * 40}"/>'
    return (f'<svg class="orn" width="{cols * size}mm" height="{rows * size}mm" viewBox="0 0 {cols * 40} {rows * 40}">{t}</svg>')


GT_DEF = ('<svg width="0" height="0" style="position:absolute"><defs><g id="gt" fill="none" stroke="#e7c873" stroke-width=".9">'
          '<rect x="8.3" y="8.3" width="23.4" height="23.4"/><rect x="8.3" y="8.3" width="23.4" height="23.4" transform="rotate(45 20 20)"/>'
          '<path d="M0 20h3.4M36.6 20H40M20 0v3.4M20 36.6V40M0 0l8.3 8.3M40 0l-8.3 8.3M0 40l8.3-8.3M40 40l-8.3-8.3"/>'
          '<circle cx="20" cy="20" r="5.2"/></g></defs></svg>')
DAY_ORN = band_orn(6, 3, 8.8)
WEEK_ORN = band_orn(10, 6, 14.8)


def cover():
    return f'''<div class="cv-arch"><div class="cv-in">
  <div class="cv-moon"><svg viewBox="0 0 60 60"><path d="M40 6a25 25 0 1 0 14 38A21 21 0 0 1 40 6z" fill="#e7c873"/>
    <path d="M46 20l1.9 4.4 4.8.4-3.7 3.1 1.2 4.7-4.2-2.6-4.2 2.6 1.2-4.7-3.7-3.1 4.8-.4z" fill="#e7c873"/></svg></div>
  <div class="cv-ar" lang="ar" dir="rtl">زَادُ اليَوْم</div>
  <div class="cv-t">ZAAD</div>
  <div class="cv-s">Provision for the Day</div>
  <div class="cv-r"><i></i>{STAR}<i></i></div>
  <div class="cv-d">A Muslim's Daily Planner<br>lived by the Sunnah</div>
  <div class="cv-y">2027</div>
  <div class="cv-h">1448 – 1449 AH</div>
<div class="cv-q">“And take provision, for the best<br>provision is taqwa.”<span>al-Baqarah 2:197</span></div>
</div></div>'''


def front():
    add(cover(), cls="cover", nofoot=True, band=art.cover_art())
    add('''<div class="center">
<div class="basm" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
<div class="ayah" lang="ar" dir="rtl">يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ ۖ وَاتَّقُوا اللَّهَ ۚ إِنَّ اللَّهَ خَبِيرٌ بِمَا تَعْمَلُونَ</div>
<p class="ayah-en">O you who believe, fear Allah, and let every soul look to what it has sent forth for tomorrow.
Fear Allah. Indeed, Allah is fully aware of what you do.</p>
<p class="ref">al-Hashr 59:18</p></div>''', nofoot=True)
    add(f'''<div class="center tp">
<div class="tp-ar" lang="ar" dir="rtl">زَادُ اليَوْم</div>
<div class="tp-t">ZAAD</div><div class="tp-s">Provision for the Day</div>
<div class="cv-r dark"><i></i>{STAR}<i></i></div>
<p class="tp-d">A Muslim's Daily Planner for 2027<br>1448 – 1449 AH</p>
<p class="tp-f">Every day from Fajr to sleep · Every tick tied to a hadith<br>Hijri dates · Ramadan and Dhul-Hijjah pages · 53 hadith to live by</p>
<div class="own"><span>This planner belongs to</span><div class="ln"></div><span>If found, please return it. Contact</span><div class="ln"></div></div>
<p class="tp-by">Compiled by Feysel Reshid · diinislaam.com</p></div>''', nofoot=True)

    add(head("Before you begin", "Three notes on what is printed here") + '''
<div class="prose">
<h3>The hadith</h3>
<p>Every hadith in this planner is from the well-known collections and is cited by collection and number, or by
the scholar who graded it. The English is worded briefly for a planner page. Where a hadith is long, only the part
that is needed is given. Read the full text in its source before you teach or quote it.</p>
<h3>The Hijri dates</h3>
<p>The Hijri dates follow the Umm al-Qura calendar. The true start of each month depends on the sighting of the
moon where you live, so a date may fall a day earlier or later. This matters most for Ramadan, the two Eids, the
day of 'Arafah and 'Ashura. Follow your local announcement, and correct the page by hand if you need to.</p>
<h3>The ticks</h3>
<p>The tick boxes are a mirror, not a scoreboard. The five prayers are the obligation. The rest are sunnah acts,
and the Prophet ﷺ said that the most beloved deeds to Allah are the most consistent, even if they are few. Start
with a few, keep them, then add. Keep your ticks between you and Allah.</p>
<h3>Honorifics</h3>
<p>ﷺ stands for <i>sallallahu 'alayhi wa sallam</i>: may Allah send blessings and peace upon him. Say it whenever
you read his name.</p>
</div>
<div class="callout">“The most beloved of deeds to Allah are the most consistent of them, even if they are few.”
<span>al-Bukhari 6464, Muslim 783</span></div>''', toc="Before you begin")

    add("@@TOC@@", toc=None)

    add(head("How to use this planner", "One year, twelve months, fifty-three weeks, 365 days") + f'''
<div class="how">
<div><b>1</b><div><h3>Set the year</h3><p>Write your intention and your goals in six areas of life on the “My year”
pages. Mark the Islamic dates. Choose your Qur'an plan.</p></div></div>
<div><b>2</b><div><h3>Open each month</h3><p>Each month has a theme and an ayah, a calendar with Hijri dates, a
goals page and a habit grid. Shade one square in the grid for each day you keep a habit.</p></div></div>
<div><b>3</b><div><h3>Start each week with one hadith</h3><p>The week page gives a hadith to live by and one action
for it. Plan the seven days and review the week before.</p></div></div>
<div><b>4</b><div><h3>Live the day around the prayer</h3><p>The day page is built on the five prayers. Write your
intention in the morning, plan your tasks between the prayers, and tick each act as you do it.</p></div></div>
<div><b>5</b><div><h3>Close the day with muhasabah</h3><p>Before you sleep, write what you thank Allah for, your
best deed, and what you seek forgiveness for. Then sleep with wudu and the adhkar.</p></div></div>
</div>
<div class="keybox"><h4>Reading the day page</h4>
<p><span class="k">{CB}</span> A tick box. Tick it when the act is done.</p>
<p><span class="k">{O}</span> A prayer circle. Fill it for each prayer: the obligatory prayer, on time, in congregation, its sunnah.</p>
<p><span class="k"><sup>7</sup></span> A small number. It points to the hadith for that act on the pages “The hadith behind every tick”.</p>
<p><span class="k badge">Jumu'ah</span> A badge. It marks a special day and adds the ticks that belong to it.</p>
</div>''', toc="How to use this planner")

    # --- evidence pages ---
    def ev_items(items, start):
        out = ""
        for i, (_k, label, text, ref) in enumerate(items):
            out += (f'<div class="evi"><b class="n">{start + i}</b><div><h5>{label}</h5>'
                    f'<p>{text}</p><span class="rf">{ref}</span></div></div>')
        return out

    chunks = [EVIDENCE[0:6], EVIDENCE[6:14], EVIDENCE[14:22]]
    n = 1
    for i, ch in enumerate(chunks):
        add(head("The hadith behind every tick" if i == 0 else "The hadith behind every tick",
                 "The daily acts" + ("" if i == 0 else ", continued"), "السُّنَّة" if i == 0 else "")
            + f'<div class="evl">{ev_items(ch, n)}</div>',
            toc="The hadith behind every tick" if i == 0 else None)
        n += len(ch)
    add(head("The hadith behind every tick", "Friday, the week and the month") + f'<div class="evl">{ev_items(SEASONAL[0:5], n)}</div>')
    n += 5
    add(head("The hadith behind every tick", "Ramadan and the seasons of worship") + f'<div class="evl tight">{ev_items(SEASONAL[5:], n)}</div>')

    # --- a day by the sunnah timeline ---
    tl = [
        ("Before Fajr", "Wake with the dua of waking. Siwak, wudu. Two rak'ahs or more of night prayer, Witr if not yet prayed, istighfar before dawn."),
        ("Fajr", "Two sunnah rak'ahs at home, then Fajr in congregation. Dhikr after the prayer. Morning adhkar. Qur'an."),
        ("Morning", "Set your intention and your three priorities. Seek halal provision with ihsan. Duha prayer once the sun has risen."),
        ("Dhuhr", "Four before, the prayer, two after. A short rest if you can. Lunch with Bismillah and the right hand."),
        ("'Asr", "Pray it on time, before the sun weakens. Evening adhkar from 'Asr to Maghrib. On Friday, dua in the last hour."),
        ("Maghrib", "Break the fast at once if you are fasting. The prayer, then two sunnah rak'ahs. Time for family."),
        ("'Isha", "The prayer, two sunnah rak'ahs, then Witr unless you will rise at night. Avoid idle talk after it."),
        ("Before sleep", "Take account of your day. Wudu. Ayat al-Kursi, the last two verses of al-Baqarah, the three Quls. Lie on your right side."),
    ]
    add(head("A day lived by the Sunnah", "From waking to sleep, built on the five prayers", "يَوْمُ المُسْلِم")
        + '<div class="tl">' + "".join(f'<div><b>{a}</b><p>{b}</p></div>' for a, b in tl) + '</div>',
        toc="A day lived by the Sunnah")


def year_glance():
    out = head(f"{YEAR} at a glance", "Coloured days are marked in the list of Islamic dates") + '<div class="yg">'
    for m in range(1, 13):
        out += f'<div class="mini" style="--ac:{MONTHS[m-1][3]};--soft:{MONTHS[m-1][4]}"><h5>{MONTH_NAMES[m]}</h5><table><tr>'
        out += "".join(f"<th>{c}</th>" for c in "MTWTFSS") + "</tr>"
        for wk in calendar.Calendar(0).monthdayscalendar(YEAR, m):
            out += "<tr>"
            for i, dnum in enumerate(wk):
                if not dnum:
                    out += "<td></td>"
                    continue
                d = dt.date(YEAR, m, dnum)
                _, hm, hd = hij(d)
                cls = "sp" if (hm == 9 or (hm, hd) in ((10, 1), (12, 9), (12, 10), (1, 1), (1, 10))) else ""
                cls += " fr" if i == 4 else ""
                out += f'<td class="{cls}">{dnum}</td>'
            out += "</tr>"
        out += "</table></div>"
    add(out + "</div>", toc=f"{YEAR} at a glance")


def islamic_dates():
    rows = []
    seen = set()
    for d in all_days():
        hy, hm, hd = hij(d)
        ev_ = {(9, 1): "Ramadan begins", (9, 21): "The last ten days begin (first odd night is the night before)",
               (10, 1): "Eid al-Fitr", (12, 1): "Dhul-Hijjah begins: the ten best days",
               (12, 9): "Day of 'Arafah", (12, 10): "Eid al-Adha", (12, 11): "Days of Tashriq (11 to 13)",
               (1, 1): f"Hijri new year {hy}", (1, 10): "'Ashura", (7, 1): "Rajab begins, a sacred month",
               (8, 1): "Sha'ban begins: prepare for Ramadan", (11, 1): "Dhul-Qa'dah begins, a sacred month"}.get((hm, hd))
        if ev_ and (hy, hm, hd) not in seen:
            seen.add((hy, hm, hd))
            rows.append((d, f"{hd} {hname(hm)} {hy}", ev_))
    tr = "".join(f'<tr><td class="g">{d.strftime("%a")} {d.day} {MONTH_NAMES[d.month][:3]}</td><td class="h">{h}</td>'
                 f'<td>{e}</td><td class="c">{CB}</td></tr>' for d, h, e in rows)
    months = []
    for d in all_days():
        hy, hm, hd = hij(d)
        if hd == 1 or d == dt.date(YEAR, 1, 1):
            months.append((d, hy, hm, hd))
    mrow = "".join(f'<span><b>{hname(hm)} {hy}</b> {"from" if hd == 1 else "until late"} '
                   f'{d.day if hd == 1 else ""} {MONTH_NAMES[d.month][:3] if hd == 1 else "January"}</span>'
                   for d, hy, hm, hd in months)
    add(head("Islamic dates 1448 – 1449", "Umm al-Qura calendar. Confirm each with your local moon sighting.", "التَّقْوِيم")
        + f'<table class="idt"><tr><th>{YEAR}</th><th>Hijri</th><th>Occasion</th><th>Local</th></tr>{tr}</table>'
        + f'<div class="hm"><h4>The Hijri months in {YEAR}</h4>{mrow}</div>'
        + '<p class="fine">Tick “Local” once your community has confirmed the date. The white days are the 13th, 14th and '
          '15th of each Hijri month and are marked on every calendar page.</p>',
        toc="Islamic dates 1448 – 1449")


def year_pages():
    add(head("My year with Allah", "Write it once. Return to it every month.", "نِيَّتِي")
        + box("My intention for this year", lines(4))
        + box("The person I want to be when this planner is full", lines(4))
        + box("Three things I will leave for the sake of Allah", cblines(3))
        + box("Three habits I will build, small and constant", cblines(3), n=EV_NUM["constant"])
        + box("My dua for this year", lines(4)), toc="My year")
    areas = [("My Lord", "Prayer, dhikr, dua, tawbah"), ("The Qur'an", "Recitation, memorising, understanding"),
             ("Knowledge", "What I will study, and with whom"), ("Family", "Parents, spouse, children, kin"),
             ("Body and mind", "Sleep, food, strength, calm"), ("Wealth and work", "Halal income, zakah, sadaqah, skill")]
    add(head("Goals in six areas", "One clear goal in each is enough")
        + '<div class="g2">' + "".join(box(f"{a} <em>{b}</em>", lines(5)) for a, b in areas) + "</div>")


def trackers():
    juz = "".join(f"<i>{n}</i>" for n in range(1, 31))
    add(head("Qur'an tracker", "Shade a square for each juz you complete", "القُرْآن")
        + "".join(f'<div class="kh"><h4>Khatmah {k} <span>Started ______ Finished ______</span></h4><div class="juz">{juz}</div></div>'
                  for k in range(1, 6))
        + '<div class="callout">“Recite the Qur\'an, for it will come on the Day of Resurrection as an intercessor for its '
          'companions.”<span>Muslim 804</span></div>'
        + '<p class="fine">One juz a day completes the Qur\'an every month. Four pages after each prayer is one juz a day.</p>',
        toc="Trackers: Qur'an, fasting, sadaqah, dua, knowledge")
    row = "<tr>" + "<td></td>" * 5 + "</tr>"
    add(head("Memorisation and revision", "What is new, and what is kept")
        + '<table class="log"><tr><th style="width:30%">Surah / ayat</th><th>Started</th><th>Memorised</th><th>Revised 1 · 2 · 3</th><th>Heard by</th></tr>'
        + row * 22 + "</table>")
    # fasting year grid
    grid = '<table class="fy"><tr><th></th>' + "".join(f"<th>{n}</th>" for n in range(1, 32)) + "</tr>"
    for m in range(1, 13):
        grid += f"<tr><th>{MONTH_NAMES[m][:3]}</th>"
        nd = calendar.monthrange(YEAR, m)[1]
        for dn in range(1, 32):
            if dn > nd:
                grid += '<td class="x"></td>'
                continue
            d = dt.date(YEAR, m, dn)
            _, hm, hd = hij(d)
            badges, ticks, _r = day_info(d)
            c = "r" if hm == 9 else "n" if ((hm, hd) == (10, 1) or (hm == 12 and 10 <= hd <= 13)) else \
                "s" if any("ast" in t[0] for t in ticks) else ""
            grid += f'<td class="{c}"></td>'
        grid += "</tr>"
    grid += "</table>"
    add(head("Fasting through the year", "Put a tick in each day you fast", "الصِّيَام") + grid
        + '<div class="lg"><span><i class="r"></i>Ramadan</span><span><i class="s"></i>Recommended fast: Monday, Thursday, white days, '
          'Shawwal, the nine days, \'Arafah, \'Ashura</span><span><i class="n"></i>No fasting: Eid and Tashriq</span></div>'
        + box("Fasts I owe from Ramadan", '<div class="mk">' + "".join(f"{CB}" for _ in range(30)) + "</div>"
              '<p class="fine">Make them up before the next Ramadan.</p>')
        + box("Six days of Shawwal", '<div class="mk">' + CB * 6 + "</div>", n=ev_n("shawwal")))
    blank = '<table class="fy px"><tr><th></th>' + "".join(f"<th>{n}</th>" for n in range(1, 32)) + "</tr>"
    for m in range(1, 13):
        nd = calendar.monthrange(YEAR, m)[1]
        blank += f"<tr><th>{MONTH_NAMES[m][:3]}</th>" + "".join(f'<td class="{"x" if n > nd else ""}"></td>' for n in range(1, 32)) + "</tr>"
    add(head("My year of prayer", "Colour one square each night", "الصَّلَاة") + blank + "</table>"
        + '<div class="lg px"><span><i style="background:#0f5a4f"></i>All five on time</span><span><i style="background:#7fb5a6"></i>All five, some late</span>'
          '<span><i style="background:#e7c873"></i>Missed one, made it up</span><span><i></i>A day to repent for</span></div>'
        + '<div class="callout">“The first thing a servant will be called to account for on the Day of Resurrection is his prayer.”'
          '<span>at-Tirmidhi 413, an-Nasa\'i 465</span></div>'
        + '<div class="g2">' + box("What helps me pray on time", lines(2)) + box("What gets in the way", lines(2)) + "</div>")
    row = "<tr>" + "<td></td>" * 4 + "</tr>"
    add(head("Sadaqah and zakah", "What the right hand gives", "الصَّدَقَة")
        + '<div class="zk"><div><span>Zakah due date</span><div class="ln"></div></div><div><span>Wealth above nisab</span><div class="ln"></div></div>'
          '<div><span>Zakah (2.5%)</span><div class="ln"></div></div><div><span>Paid on</span><div class="ln"></div></div></div>'
        + '<table class="log"><tr><th>Date</th><th style="width:44%">Given to / for</th><th>Amount</th><th>Ongoing?</th></tr>'
        + row * 17 + "</table>"
        + '<div class="callout">“Charity does not decrease wealth.”<span>Muslim 2588</span></div>')
    add(head("My dua list", "Ask, and be certain of the answer", "الدُّعَاء")
        + '<table class="log dua"><tr><th style="width:62%">What I am asking Allah for</th><th>Since</th><th>Answered, alhamdulillah</th></tr>'
        + ("<tr>" + "<td></td>" * 3 + "</tr>") * 19 + "</table>"
        + '<p class="fine">Times when dua is answered: the last third of the night, between adhan and iqamah, in sujud, the last hour '
          'of Friday, while fasting and at iftar, when travelling, and when it rains.</p>')
    add(head("Knowledge log", "Books, courses and lectures", "العِلْم")
        + '<table class="log"><tr><th style="width:44%">Title / teacher</th><th>Started</th><th>Finished</th><th>One lesson I will act on</th></tr>'
        + row * 16 + "</table>"
        + '<div class="callout">“Whoever treads a path seeking knowledge, Allah will make easy for him a path to Paradise.”'
          '<span>Muslim 2699</span></div>')


def ev_n(key):
    if key in EV_NUM:
        return EV_NUM[key]
    return len(EVIDENCE) + 1 + [s[0] for s in SEASONAL].index(key)


def seasons():
    ram = [d for d in all_days() if hij(d)[1] == 9]
    eid = next(d for d in all_days() if hij(d)[1:] == (10, 1))
    add(head("Ramadan 1448", f"Expected {ram[0].day} {MONTH_NAMES[ram[0].month]} to {ram[-1].day} {MONTH_NAMES[ram[-1].month]} {YEAR}", "رَمَضَان")
        + '<div class="callout">“Whoever fasts Ramadan with faith and hoping for reward, his previous sins are forgiven.”'
          '<span>al-Bukhari 38, Muslim 760</span></div>'
        + box("My intention for this Ramadan", lines(3))
        + '<div class="g2">' + box("Qur'an goal", lines(3)) + box("Sadaqah goal", lines(3))
        + box("A sin to leave for good", lines(3)) + box("People to feed and to forgive", lines(3)) + "</div>"
        + box("Before it begins", '<div class="ck2">' + "".join(f"<p>{CB}{t}</p>" for t in [
            "Make up fasts I still owe", "Learn the rulings of fasting", "Plan Qur'an: pages per prayer",
            "Calculate and set aside zakah", "Clear my schedule for the last ten", "Seek forgiveness from people I wronged"]) + "</div>"),
        toc="Ramadan and Dhul-Hijjah pages")
    hdr = "<tr><th>Day</th><th>Date</th><th>Fast</th><th>5 prayers</th><th>Tarawih</th><th>Qur'an (juz / pages)</th><th>Sadaqah</th><th>Dua at iftar</th></tr>"
    rows = ""
    for i, d in enumerate(ram):
        rows += (f'<tr class="{"l10" if i >= 20 else ""}"><td>{i + 1}</td><td>{d.strftime("%a")} {d.day} {MONTH_NAMES[d.month][:3]}</td>'
                 + f"<td>{CB}</td>" * 3 + "<td></td>" + f"<td>{CB}</td>" * 2 + "</tr>")
    if len(ram) == 29:
        rows += ('<tr class="l10"><td>30</td><td class="na">if the month is thirty</td>' + f"<td>{CB}</td>" * 3 + "<td></td>"
                 + f"<td>{CB}</td>" * 2 + "</tr>")
    add(head("Ramadan day by day", "The last ten days are shaded") + f'<table class="log ram">{hdr}{rows}</table>')
    nights = ""
    for i, d in enumerate(ram):
        n = i + 2  # the night after day i+1 is night i+2
        if 21 <= n <= 30 and i + 1 < len(ram) + 1:
            odd = n % 2 == 1
            nights += (f'<tr class="{"odd" if odd else ""}"><td><b>{n}</b>{" · odd" if odd else " · if thirty" if n > len(ram) else ""}</td>'
                       f'<td>{d.strftime("%a")} {d.day} {MONTH_NAMES[d.month][:3]}</td>' + f"<td>{CB}</td>" * 5 + "</tr>")
    add(head("The last ten nights", "Seek Laylat al-Qadr in the odd nights", "لَيْلَةُ القَدْر")
        + '<div class="callout dua"><em>Say often on these nights</em>'
          '<p class="ar" lang="ar" dir="rtl">اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي</p>'
          '<p class="tr">Allahumma innaka \'afuwwun tuhibbul-\'afwa fa\'fu \'anni</p>'
          '<p>O Allah, You are Pardoning and love to pardon, so pardon me.</p><span>at-Tirmidhi 3513</span></div>'
        + '<table class="log ram"><tr><th>Night</th><th>Evening of</th><th>\'Isha and Fajr in congregation</th><th>Qiyam</th><th>Qur\'an</th>'
          f'<th>Long dua</th><th>Sadaqah</th></tr>{nights}</table>'
        + box("My dua list for these nights", lines(5))
        + '<p class="fine">The night comes before its day: the 21st night is the evening of the 20th fast. I\'tikaf in the last ten is a '
          'sunnah of the Prophet ﷺ (al-Bukhari 2026, Muslim 1172).</p>')
    add(head("Eid al-Fitr and after", f"Expected {eid.strftime('%A')} {eid.day} {MONTH_NAMES[eid.month]} {YEAR}", "عِيدُ الفِطْر")
        + box("Zakat al-Fitr", '<p class="txt">One sa\' of staple food for every member of the household, given to the poor before the '
              'Eid prayer (al-Bukhari 1503, Muslim 984).</p><div class="zk"><div><span>People in my care</span><div class="ln"></div></div>'
              '<div><span>Given to</span><div class="ln"></div></div><div><span>Given on</span><div class="ln"></div></div></div>')
        + box("The sunnah of Eid day", '<div class="ck2">' + "".join(f"<p>{CB}{t}</p>" for t in [
            "Ghusl and best clothes", "Eat dates, an odd number, before leaving", "Takbir on the way to the prayer",
            "Eid prayer with the Muslims", "Return by a different road", "Greet, visit and gladden family"]) + "</div>")
        + box("What I will carry on after Ramadan", cblines(4))
        + box("Six days of Shawwal", '<div class="mk big">' + "".join(f"<span>{CB}<em>date ____</em></span>" for _ in range(6)) + "</div>", n=ev_n("shawwal")))
    dh = [d for d in all_days() if hij(d)[1] == 12 and hij(d)[2] <= 13]
    rows = ""
    for d in dh:
        hd = hij(d)[2]
        label = {9: "'Arafah", 10: "Eid al-Adha", 11: "Tashriq", 12: "Tashriq", 13: "Tashriq"}.get(hd, "")
        fast = "<td class='na'>no fast</td>" if hd >= 10 else f"<td>{CB}</td>"
        rows += (f'<tr class="{"l10" if hd in (9, 10) else ""}"><td><b>{hd}</b> {label}</td><td>{d.strftime("%a")} {d.day} {MONTH_NAMES[d.month][:3]}</td>'
                 f'{fast}<td>{CB}</td><td>{CB}</td><td>{CB}</td><td></td></tr>')
    add(head("The ten days of Dhul-Hijjah", "The best days of the year", "ذُو الحِجَّة")
        + '<div class="callout">“There are no days in which righteous deeds are more beloved to Allah than these ten days.”'
          '<span>al-Bukhari 969</span></div>'
        + f'<table class="log ram"><tr><th>Day</th><th>Date</th><th>Fast</th><th>Takbir</th><th>Qur\'an</th><th>Sadaqah</th><th>A deed I added</th></tr>{rows}</table>'
        + box("Udhiyah (sacrifice)", '<div class="zk"><div><span>Arranged with</span><div class="ln"></div></div><div><span>Shares</span>'
              '<div class="ln"></div></div><div><span>Meat given to</span><div class="ln"></div></div></div>'
              '<p class="fine">Whoever intends to sacrifice does not cut his hair or nails from the start of Dhul-Hijjah until he has '
              'sacrificed (Muslim 1977).</p>'))


def adhkar_pages():
    src = open(os.path.join(ROOT, "..", "hisnul-muslim", "data.js"), encoding="utf-8").read()
    arabic = re.findall(r'"arabic":"((?:[^"\\]|\\.)*)"', src)
    arabic = [json.loads('"' + a + '"') for a in arabic]

    def strip(s):
        s = unicodedata.normalize("NFD", s)
        s = "".join(c for c in s if not unicodedata.combining(c) and c != "ـ")
        s = re.sub("[أإآٱ]", "ا", s).replace("ى", "ي").replace("ٰ", "")
        return re.sub(r"[^ء-ي ]", "", re.sub(r"\s+", " ", s))

    items = ""
    for i, (title, key, en, ref, note) in enumerate(ADHKAR):
        k = strip(key)
        hit = next((a for a in arabic if k in strip(a)), None)
        if not hit:
            sys.exit(f"adhkar not found in hisnul data: {title}")
        ar = re.sub(r"\s+", " ", hit)
        ar = " ".join(re.findall(r"\(\((.*?)\)\)", ar)) or ar  # keep the supplication, drop editorial notes
        ar = re.sub(r"\[[^\]]*\]|\([^)]*\)", "", ar).strip(" .")
        print("adhkar:", title, "|", ar)
        items += (f'<div class="dh"><h5>{title}</h5><p class="ar" lang="ar" dir="rtl">{ar}</p><p>{en}</p>'
                  f'{f"<p class=nt>{note}</p>" if note else ""}<span class="rf">{ref}</span></div>')
        if i == 2:
            add(head("Adhkar to know by heart", "Six short supplications for every day", "الأَذْكَار") + f'<div class="dhl">{items}</div>',
                toc="Adhkar to know by heart")
            items = ""
    add(head("Adhkar to know by heart", "Continued") + f'<div class="dhl">{items}</div>'
        + '<p class="fine">The Arabic is from Hisn al-Muslim by Sa\'id ibn \'Ali al-Qahtani. For the full morning and evening adhkar, '
          'see that book or diinislaam.com/hisnul-muslim.</p>')


# ---------------------------------------------------------------------------
# Month pages
# ---------------------------------------------------------------------------
HABITS = ["Fajr on time", "Five prayers", "In congregation", "12 sunnah rak'ahs", "Morning adhkar", "Evening adhkar",
          "Qur'an", "Witr", "Duha", "Istighfar ×100", "Sadaqah", "Sleep adhkar"]


def hijri_span(m):
    first, last = dt.date(YEAR, m, 1), dt.date(YEAR, m, calendar.monthrange(YEAR, m)[1])
    a, b = hij(first), hij(last)
    seq, cur = [], (a[0], a[1])
    while True:
        seq.append(cur)
        if cur == (b[0], b[1]):
            break
        cur = (cur[0], cur[1] + 1) if cur[1] < 12 else (cur[0] + 1, 1)
    en = " · ".join(hname(mm) for _y, mm in seq) + f" {a[0]}" + (f" – {b[0]}" if b[0] != a[0] else "")
    ar = " · ".join(HIJRI_MONTHS[mm - 1][1] for _y, mm in seq)
    return en, ar


def month_pages(m):
    theme, ayah, ref, ac, soft = MONTHS[m - 1]
    en, ar = hijri_span(m)
    recto()
    add(f'''<div class="mo">
<div class="mo-n">{m:02d}</div><div class="mo-t">{MONTH_NAMES[m]}</div><div class="mo-y">{YEAR}</div>
<div class="mo-ar" lang="ar" dir="rtl">{ar}</div><div class="mo-h">{en}</div>
<div class="mo-th">{theme}</div>
<p class="mo-a">“{ayah}”</p><p class="mo-r">{ref}</p></div>''', cls="opener", month=m, toc=MONTH_NAMES[m], nofoot=True,
        band=art.scene(m, ac))

    # calendar
    cal = '<table class="cal"><tr>' + "".join(f'<th class="{"fr" if i == 4 else ""}">{n[:3]}</th>' for i, n in enumerate(DAY_NAMES)) + "</tr>"
    notes = []
    for wk in calendar.Calendar(0).monthdayscalendar(YEAR, m):
        cal += "<tr>"
        for i, dn in enumerate(wk):
            if not dn:
                cal += '<td class="e"></td>'
                continue
            d = dt.date(YEAR, m, dn)
            hy, hm, hd = hij(d)
            badges, _t, _r = day_info(d)
            sp = [b for b in badges if b not in ("Jumu'ah", "White day") and not b.startswith(("Ramadan · day", "Dhul-Hijjah · day", "Tonight"))]
            if hm == 9 and hd == 1:
                sp.append("Ramadan begins")
            if hm == 12 and hd == 1:
                sp.append("Dhul-Hijjah begins")
            if sp and not (sp == ["Days of Tashriq"] and hd != 11):
                notes.append(f"<b>{dn}</b> {sp[0]}")
            cls = ("fr " if i == 4 else "") + ("ram " if hm == 9 else "") + ("big " if sp else "")
            hl = f"{hd} {hname(hm)[:3]}" if hd == 1 or dn == 1 else str(hd)
            wh = '<i class="wd"></i>' if "White day" in badges else ""
            cal += f'<td class="{cls}"><b>{dn}</b><span>{hl}</span>{wh}</td>'
        cal += "</tr>"
    cal += "</table>"
    add(head(f"{MONTH_NAMES[m]} {YEAR}", en, ar) + cal
        + '<div class="lg"><span><i class="wd"></i>White day (13 · 14 · 15)</span><span><i class="fr"></i>Jumu\'ah</span>'
          '<span><i class="ram"></i>Ramadan</span><span><i class="big"></i>Special day</span></div>'
        + (f'<p class="spd">{" &nbsp;·&nbsp; ".join(notes)}</p>' if notes else "")
        + box("Dates to remember", lines(4 if notes else 5)), month=m)

    add(head(f"{MONTH_NAMES[m]}: my plan", f"Theme of the month: {theme.lower()}")
        + box("My intention this month", lines(2))
        + '<div class="g2">' + box("With my Lord", cblines(3)) + box("With the Qur'an", cblines(3))
        + box("With my family", cblines(3)) + box("Work, study and health", cblines(3)) + "</div>"
        + '<div class="g2">' + box("One habit to build", lines(2)) + box("One habit to leave", lines(2)) + "</div>"
        + box("Sadaqah I plan to give", lines(2)) + box("My dua this month", lines(3)), month=m)

    nd = calendar.monthrange(YEAR, m)[1]
    hg = '<table class="hb"><tr><th></th>' + "".join(
        f'<th class="{"fr" if dt.date(YEAR, m, n).weekday() == 4 else ""}">{n}</th>' for n in range(1, nd + 1)) + "</tr>"
    hg += '<tr class="wdr"><th></th>' + "".join(f'<th>{"MTWTFSS"[dt.date(YEAR, m, n).weekday()]}</th>' for n in range(1, nd + 1)) + "</tr>"
    for h in HABITS + [""] * 5:
        hg += f"<tr><th>{h}</th>" + "".join(
            f'<td class="{"fr" if dt.date(YEAR, m, n).weekday() == 4 else ""}"></td>' for n in range(1, nd + 1)) + "</tr>"
    hg += "</table>"
    add(head(f"{MONTH_NAMES[m]}: habit grid", "Shade one square for each day you keep the habit") + hg
        + '<p class="fine">The empty rows are yours: a page of tafsir, a walk, no phone after \'Isha, a call to your mother.</p>'
        + '<div class="callout">“The most beloved of deeds to Allah are the most consistent of them, even if they are few.”'
          '<span>al-Bukhari 6464, Muslim 783</span></div>', month=m)


def month_review(m):
    add(head(f"{MONTH_NAMES[m]}: looking back", "Take account of yourself before you are taken to account", "مُحَاسَبَة")
        + '<div class="sc">' + "".join(f"<div><span>{t}</span><b>____</b></div>" for t in [
            "Prayers on time", "Prayers in congregation", "Qur'an pages", "Days fasted", "Days I gave sadaqah", "Nights with Witr"]) + "</div>"
        + box("What Allah made easy for me this month", lines(4))
        + box("Where I fell short, and why", lines(4))
        + box("What I will do differently next month", lines(4))
        + box("Someone I need to thank, visit or ask forgiveness from", lines(2)), month=m)


# ---------------------------------------------------------------------------
# Week and day pages
# ---------------------------------------------------------------------------
def assign_weeks():
    """Give each week (keyed by its first day) a hadith, placing the seasonal ones in season."""
    starts = [dt.date(YEAR, 1, 1)] + [d for d in all_days() if d.weekday() == 0 and d != dt.date(YEAR, 1, 1)]
    by_title = {w[0]: w for w in WEEKLY}
    slot = {}
    ram = [d for d in all_days() if hij(d)[1] == 9]
    eid = next(d for d in all_days() if hij(d)[1:] == (10, 1))
    dh1 = next(d for d in all_days() if hij(d)[1:] == (12, 1))

    def week_of(d):
        return max(s for s in starts if s <= d)

    r0 = starts.index(week_of(ram[0]))
    slot[starts[r0 - 1]] = "pre_ramadan"
    for i, k in enumerate(("ramadan1", "ramadan2", "ramadan3", "ramadan4")):
        slot[starts[r0 + i]] = k
    e = starts.index(week_of(eid))
    slot[starts[e] if starts[e] not in slot else starts[e + 1]] = "shawwal"
    slot[week_of(dh1 + dt.timedelta(days=3))] = "dhulhijjah"
    slot[starts[-1]] = "last"
    seasonal_titles = set(SEASON_WEEK_TITLES.values())
    generic = iter([w for w in WEEKLY if w[0] not in seasonal_titles])
    out = {}
    for s in starts:
        out[s] = by_title[SEASON_WEEK_TITLES[slot[s]]] if s in slot else next(generic)
    left = list(generic)
    if left:
        print(f"note: {len(left)} weekly hadith not used: {[w[0] for w in left]}")
    return starts, out


def week_page(n, start, hadith):
    days = [start]
    while (nx := days[-1] + dt.timedelta(days=1)).weekday() != 0 and nx.year == YEAR:
        days.append(nx)
    a, b = days[0], days[-1]
    ha, hb = hij(a), hij(b)
    rng = (f"{a.day} – {b.day} {MONTH_NAMES[b.month]}" if a.month == b.month
           else f"{a.day} {MONTH_NAMES[a.month][:3]} – {b.day} {MONTH_NAMES[b.month][:3]}")
    hr = (f"{ha[2]} – {hb[2]} {hname(hb[1])} {hb[0]}" if ha[1] == hb[1]
          else f"{ha[2]} {hname(ha[1])} – {hb[2]} {hname(hb[1])} {hb[0]}")
    title, text, ref, action = hadith
    rows = ""
    for d in days:
        badges, _t, _r = day_info(d)
        bd = " · ".join(b for b in badges if not b.startswith("Tonight"))
        rows += (f'<tr class="{"fr" if d.weekday() == 4 else ""}"><th>{DAY_NAMES[d.weekday()][:3]}<b>{d.day}</b></th>'
                 f'<td><span>{bd}</span></td></tr>')
    dots = "".join(f"<span>{DAY_NAMES[d.weekday()][0]}{O}</span>" for d in days)
    name = NAMES[(n - 1) % len(NAMES)]
    band = (f'<div class="wkb">{WEEK_ORN}<div class="wkb-h"><span class="wn">Week {n}</span><h1>{rng}</h1><p>{hr}</p></div>'
            f'<div class="wkb-q"><span class="lb">Hadith of the week</span><h3>{title}</h3>'
            f'<p class="q">{text}</p><span class="rf">{ref}</span></div></div>')
    body = (f'<div class="act"><div><b>Live it</b>{action}</div><div class="dots7">{dots}</div></div>'
            f'<div class="wkc"><table class="wkt">{rows}</table><div class="wkr">'
            f'<section class="nm"><span class="lb">A name of Allah this week</span><div class="ar" lang="ar" dir="rtl">{name[1]}</div>'
            f'<h3>{name[0]}</h3><p>{name[2]}</p><em>Call upon Him by it in your dua (al-A\'raf 7:180)</em></section>'
            + box("Three goals for this week", cblines(3))
            + box("Last week, honestly", '<div class="sc s2">' + "".join(f"<div><span>{t}</span><b>__</b></div>" for t in [
                "Prayers on time /35", "Qur'an pages", "Days fasted", "Days of sadaqah"]) + "</div>") + "</div></div>")
    return body, band


BASE_TICKS = [("Morning adhkar", "adhkar"), ("Qur'an: from ______ to ______", "quran"), ("Dhikr after every prayer", "tasbih"),
              ("Istighfar ×100", "istighfar"), ("Salawat on the Prophet", "salawat"), ("Sadaqah or a kind act", "sadaqah"),
              ("Parents and kin: call, serve, dua", "kin"), ("Guarded my tongue", "tongue"), ("Evening adhkar", "adhkar"),
              ("Ayat al-Kursi, end of al-Baqarah", "kursi"), ("Slept with wudu, on my right", "sleep")]
PRAYERS = [("Fajr", "2"), ("Dhuhr", "4+2"), ("'Asr", ""), ("Maghrib", "2"), ("'Isha", "2")]
PICON = {"Fajr": "fajr", "Dhuhr": "dhuhr", "'Asr": "asr", "Maghrib": "maghrib", "'Isha": "isha"}
BLOCKS = ["After Fajr", "Morning", "After Dhuhr", "After 'Asr", "After Maghrib", "After 'Isha"]
SEASON_TITLES = set(SEASON_WEEK_TITLES.values())
# Hadith for the foot of ordinary days: the tick hadith and the shorter weekly ones. (label, text, reference)
FOOT = ([(e[1], e[2], e[3]) for e in EVIDENCE if e[0] != "tasbih"]
        + [(w[0], w[1], w[2]) for w in WEEKLY if w[0] not in SEASON_TITLES and len(w[1]) < 215])


def day_page(d):
    hy, hm, hd = hij(d)
    wd = d.weekday()
    badges, extra, remind = day_info(d)
    yday = d.timetuple().tm_yday
    bh = "".join(f'<span class="badge">{b}</span>' for b in badges)
    band = (f'<div class="db">{DAY_ORN}<div class="dn">{d.day:02d}</div><div class="dw"><h1>{DAY_NAMES[wd]}</h1>'
            f'<p>{MONTH_NAMES[d.month]} {YEAR} · day {yday} of 365</p></div>'
            f'<div class="dj"><span class="ar" lang="ar" dir="rtl">{WEEKDAYS_AR[wd]} · {str(hd).translate(AR_DIG)} {HIJRI_MONTHS[hm-1][1]}</span>'
            f'<p>{hd} {hname(hm)} {hy}</p></div></div>')
    hdr = f'<div class="niy"><span>My intention today</span><i></i>{bh}</div>'
    # salah table
    st = ('<table class="sal"><tr><th></th><th>Fard</th><th>On time' + ev("ontime") + '</th><th>Jama\'ah' + ev("jamaah")
          + '</th><th>Sunnah' + ev("rawatib") + '</th></tr>')
    for p, s in PRAYERS:
        st += (f"<tr><th>{art.ICON[PICON[p]]}{p}</th><td>{O}</td><td>{O}</td><td>{O}</td>"
               + (f"<td>{O}<em>{s}</em></td>" if s else '<td class="na">–</td>') + "</tr>")
    st += "</table>"
    st += (f'<div class="xtra"><span>{O}Duha{ev("duha")}</span><span>{O}Witr{ev("witr")}</span>'
           f'<span>{O}Night prayer{ev("qiyam")}</span></div>')
    ticks = "".join(f'<p class="sp">{CB}{t}{ev(k) if k else ""}</p>' for t, k in extra)
    ticks += "".join(f"<p>{CB}{t}{ev(k)}</p>" for t, k in BASE_TICKS)
    left = box("Salah", st, "salah") + box("Sunnah of the day", f'<div class="tk{" dense" if len(extra) > 4 else ""}">{ticks}</div>', "ticks")
    plan = "".join(f'<div class="blk"><span>{b}</span><div class="ln cbl">{CB}</div><div class="ln cbl">{CB}</div></div>' for b in BLOCKS)
    right = (box("Three that matter most", "".join(f'<div class="ln num"><b>{i}</b></div>' for i in (1, 2, 3)), "top3")
             + box("My day between the prayers", plan, "plan"))
    # reminder
    if remind:
        _k, label, text, ref = SEA[remind]
    else:
        label, text, ref = FOOT[(yday * 29) % len(FOOT)]
    text = re.sub(r"\s+", " ", text)
    strip = (f'<div class="strip"><span>Water</span><b>{art.ICON["drop"] * 8}</b><span>My heart today</span>'
             f'<b>{art.ICON["heart"] * 5}</b><span>Sleep</span><u></u><span>h</span></div>')
    bottom = (strip + '<div class="g2 eve">'
              + box("Alhamdulillah for", "".join(f'<div class="ln num"><b>{i}</b></div>' for i in (1, 2, 3)), n=EV_NUM["shukr"])
              + box("Before I sleep", '<div class="ln lab"><span>Best deed</span></div><div class="ln lab"><span>I seek forgiveness for</span></div>'
                    '<div class="ln lab"><span>Tomorrow, in sha Allah</span></div>') + "</div>"
              + f'<div class="rem">{STAR}<div><b>{label}</b><p>{text} <span>{ref}</span></p></div></div>')
    return hdr + f'<div class="cols"><div class="c1">{left}</div><div class="c2">{right}</div></div>' + bottom, band


# ---------------------------------------------------------------------------
# Weekly edition: one week on two facing pages
# ---------------------------------------------------------------------------
SHORT = {"Ghusl, best clothes, early to Jumu'ah": "Ghusl, go early", "Dua in the last hour after 'Asr": "Last-hour dua",
         "Iftar on time, with dua": "Iftar on time", "Tarawih / night prayer": "Tarawih", "A fast of the six of Shawwal": "Shawwal fast",
         "Takbir, tahlil and tahmid often": "Takbir often", "Fasted (first nine days)": "Fasted", "Zakat al-Fitr given before the prayer": "Zakat al-Fitr",
         "Takbir, ghusl and the Eid prayer": "Eid prayer", "Sacrifice (udhiyah)": "Udhiyah", "Fast of the ninth (with 'Ashura)": "Fast of the 9th",
         "White-day fast (13 · 14 · 15)": "White-day fast", "Sunnah fast (Monday / Thursday)": "Sunnah fast", "Takbir after each prayer": "Takbir after prayers"}
MINI_TICKS = [("Morning adhkar", "adhkar"), ("Evening adhkar", "adhkar"), ("Qur'an", "quran"), ("Dhikr after prayers", "tasbih"),
              ("Istighfar ×100", "istighfar"), ("Salawat", "salawat"), ("Sadaqah", "sadaqah"), ("Sleep adhkar", "kursi")]


def day_block(d):
    hy, hm, hd = hij(d)
    badges, extra, _r = day_info(d)
    bh = "".join(f'<span class="badge">{b}</span>' for b in badges)
    pr = "".join(f"<span>{art.ICON[PICON[p]]}{O}<em>{p}</em></span>" for p, _s in PRAYERS)
    pr += '<i class="sep"></i>' + "".join(f"<span>{O}<em>{t}</em></span>" for t in ("Duha", "Witr", "Night"))
    ticks = "".join(f'<p class="sp">{CB}{SHORT.get(t, t)}{ev(k) if k else ""}</p>' for t, k in extra)
    ticks += "".join(f"<p>{CB}{t}{ev(k)}</p>" for t, k in MINI_TICKS)
    return (f'<div class="dbk{" fri" if d.weekday() == 4 else ""}"><div class="dbh"><b>{d.day:02d}</b><span class="wd">{DAY_NAMES[d.weekday()]}</span>'
            f'<span class="hj">{hd} {hname(hm)}</span><span class="ar" lang="ar" dir="rtl">{WEEKDAYS_AR[d.weekday()]}</span>{bh}</div>'
            f'<div class="dbb"><div class="dl"><div class="pr">{pr}</div><div class="tk3">{ticks}</div></div>'
            f'<div class="dr">{cblines(4)}<div class="ln lab"><span>Alhamdulillah for</span></div></div></div></div>')


def week_spread(n, start, hadith, month):
    days = [start]
    while (nx := days[-1] + dt.timedelta(days=1)).weekday() != 0 and nx.year == YEAR:
        days.append(nx)
    _body, band = week_page(n, start, hadith)
    title, text, ref, action = hadith
    name = NAMES[(n - 1) % len(NAMES)]
    left = [d for d in days if d.weekday() < 3]
    right = [d for d in days if d.weekday() >= 3]
    fill = '<div class="dots"></div>'
    assert len(PAGES) % 2 == 1, "a week must open on a left-hand page"
    add(f'<div class="act"><div><b>Live it</b>{action}</div></div>' + "".join(day_block(d) for d in left) + (fill if len(left) < 3 else ""),
        cls="week wk2", month=month, band=band.replace('class="wkb"', 'class="wkb sm"'))
    add("".join(day_block(d) for d in right) + (fill if len(right) < 4 else "")
        + f'<div class="wfoot"><section class="nm"><div class="ar" lang="ar" dir="rtl">{name[1]}</div><div><span class="lb">A name of Allah this week</span>'
          f'<h3>{name[0]}</h3><p>{name[2]}</p></div></section>'
        + '<div class="sc s3">' + "".join(f"<div><span>{t}</span><b>__</b></div>" for t in [
            "Prayers on time /35", "Qur'an pages", "Days fasted", "Days of sadaqah"]) + "</div></div>",
        cls="wk2", month=month)


def month_pages_weekly(m):
    """Opener, calendar and one combined page: intention, goals and the habit grid."""
    theme = MONTHS[m - 1][0]
    month_pages(m)
    plan, grid = PAGES.pop(-2), PAGES.pop()
    table = re.search(r'<table class="hb">.*?</table>', grid["html"], re.S).group(0)
    add(head(f"{MONTH_NAMES[m]}: my month", f"Theme of the month: {theme.lower()}")
        + box("My intention this month", lines(2))
        + '<div class="g2">' + box("Goals", cblines(3)) + box("One habit to build, one to leave", lines(3)) + "</div>"
        + f'<div class="hbs">{table}</div>'
        + '<p class="fine">Shade one square for each day you keep the habit. The empty rows are yours.</p>', month=m)


def build_weekly():
    front()
    year_glance()
    islamic_dates()
    year_pages()
    trackers()
    seasons()
    adhkar_pages()
    starts, hw = assign_weeks()
    cur = 0
    for n, s in enumerate(starts, 1):
        if SAMPLE and n > 3:
            break
        if s.month != cur:
            if len(PAGES) % 2 == 1:
                month_review(cur) if cur else add(notes_html("Notes"))
            cur = s.month
            month_pages_weekly(cur)
        week_spread(n, s, hw[s], cur)
    month_review(cur)
    back()


def back():
    add(head(f"{YEAR}: my year in review", "Deeds are only judged by their endings", "خِتَام")
        + '<div class="sc">' + "".join(f"<div><span>{t}</span><b>____</b></div>" for t in [
            "Khatmahs of the Qur'an", "Ayat memorised", "Days fasted", "Books finished", "Habits built", "Habits left"]) + "</div>"
        + box("The greatest gifts Allah gave me this year", lines(4))
        + box("My hardest test, and what it taught me", lines(4))
        + box("The deed I most hope Allah accepts", lines(3))
        + box("What I must repair before next year", lines(3)), toc="Year in review and notes")
    add(head("Next year, in sha Allah", "Carry forward what is constant")
        + box("Habits I will keep", cblines(4)) + box("Goals I carry forward", cblines(4))
        + box("A new intention", lines(5))
        + '<div class="callout">“Take account of yourselves before you are taken to account.”'
          '<span>A saying of \'Umar ibn al-Khattab, may Allah be pleased with him</span></div>')
    for _ in range(4):
        add(notes_html("Notes"))
    if len(PAGES) % 2 == 0:
        add(notes_html("Notes"))
    add(f'''<div class="center">
<div class="cv-r dark"><i></i>{STAR}<i></i></div>
<div class="ayah" lang="ar" dir="rtl">سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ</div>
<p class="ayah-en">Glory be to You, O Allah, and praise. I bear witness that none has the right to be worshipped but
You. I seek Your forgiveness and I turn to You in repentance.</p>
<p class="ref">The supplication at the end of a gathering · at-Tirmidhi 3433</p>
<p class="tp-by" style="margin-top:22mm">{TITLE}: Provision for the Day · {YEAR}<br>diinislaam.com</p></div>''', nofoot=True)


# ---------------------------------------------------------------------------
# Assemble
# ---------------------------------------------------------------------------
def build():
    assert len(WEEKLY) >= 53 + 0, len(WEEKLY)
    if WEEKLY_ED:
        build_weekly()
    else:
        build_daily()
    render()


def build_daily():
    front()
    year_glance()
    islamic_dates()
    year_pages()
    trackers()
    seasons()
    adhkar_pages()
    starts, hw = assign_weeks()
    wn = 0
    last_month = 12 if not SAMPLE else 1
    for d in all_days():
        if d.month > last_month or (SAMPLE and d.day > 10):
            break
        if d.day == 1:
            month_pages(d.month)
        if d in hw:
            wn += 1
            wb, wband = week_page(wn, d, hw[d])
            add(wb, cls="week", month=d.month, band=wband)
        db, dband = day_page(d)
        add(db, cls="day" + (" fri" if d.weekday() == 4 else ""), month=d.month, band=dband)
        if d.day == calendar.monthrange(YEAR, d.month)[1]:
            month_review(d.month)
    back()


def render():
    # table of contents
    toc = "".join(f'<tr class="{"m" if p["cls"] == "opener" else ""}"><td>{p["toc"]}</td><td class="pg">{i + 1}</td></tr>'
                  for i, p in enumerate(PAGES) if p["toc"])
    body = []
    for i, p in enumerate(PAGES):
        h = p["html"].replace("@@TOC@@", head("Contents") + f'<table class="toc">{toc}</table>')
        h = h.replace("ﷺ", '<span class="saw">ﷺ</span>')
        if WEEKLY_ED:
            for a, b in (("A Muslim's Daily Planner", "A Muslim's Weekly Planner"), ("Reading the day page", "Reading the week pages"),
                         ("fifty-three weeks, 365 days", "fifty-three weeks, each on two pages"),
                         ("Live the day around the prayer", "Live each day around the prayer"),
                         ("The day page is built on the five prayers. Write your\nintention in the morning, plan your tasks between the prayers, and tick each act as you do it.",
                          "Each week opens flat on two pages, with a block for every day built on the five prayers. Fill a circle for each prayer, tick each sunnah act as you do it, and write your tasks beside it."),
                         ("Before you sleep, write what you thank Allah for, your\nbest deed, and what you seek forgiveness for. Then sleep with wudu and the adhkar.",
                          "Before you sleep, write one thing you thank Allah for and seek His forgiveness. At the end of the week, count your prayers, Qur'an, fasts and sadaqah."),
                         ("The week page gives a hadith to live by and one action\nfor it. Plan the seven days and review the week before.",
                          "The week opens with a hadith to live by, one action for it, and a name of Allah to call upon."),
                         ("Every day from Fajr to sleep", "A week on two pages")):
                h = h.replace(a, b)
        m = p["month"]
        style = f' style="--ac:{MONTHS[m-1][3]};--soft:{MONTHS[m-1][4]}"' if m else ""
        side = "r" if i % 2 == 0 else "l"
        tab = f'<div class="tab" style="top:{29 + (m - 1) * 14.4:.1f}mm">{MONTH_NAMES[m][:3]}</div>' if m and p["cls"] != "opener" else ""
        foot = "" if p["nofoot"] else f'<div class="pf"><span>{TITLE} · {YEAR}</span><b>{i + 1}</b></div>'
        body.append(f'<div class="page {side} {p["cls"]}"{style}>{p["band"]}<div class="in">{h}</div>{tab}{foot}</div>')
    css = open(os.path.join(ROOT, "src", "planner.css"), encoding="utf-8").read()
    html = (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{TITLE}: Provision for the Day {YEAR}</title>'
            f'<link rel="stylesheet" href="../../arbaeen-nawawi-book/fonts/fonts.css"><style>{css}</style></head><body>' + GT_DEF
            + "".join(body) + "</body></html>")
    hp = os.path.join(BUILD, "planner.html")
    open(hp, "w", encoding="utf-8").write(html)
    subprocess.run(["node", os.path.join(ROOT, "render.js"), hp, OUT], check=True)
    print(f"{len(PAGES)} pages -> {OUT}")


if __name__ == "__main__":
    build()
