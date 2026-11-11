# -*- coding: utf-8 -*-
"""Front and back matter of the book."""
from figures import FIGURES

GOLD = "#c9a14a"


def mk(key):
    """Near-invisible text marker so the build can find this page's number."""
    return f'<span style="font-size:1px;color:rgba(255,255,255,0.02)">MK-{key}-MK</span>'


PAGE_MARKERS = [(k, rf"MK-{k}-MK") for k in ("preface", "howto", "nawawi", "translation", "tracker", "glossary", "answers", "closing",
                                              "test1", "test2", "test3", "test4", "test5")]
TOC_FRONT = [("preface", "Preface"), ("howto", "How to Use This Book"), ("nawawi", "The Two Imams: an-Nawawi and Ibn Rajab"),
             ("translation", "About the Arabic Text and the Translation")]
TOC_BACK = [("tracker", "Memorisation Tracker"), ("glossary", "Glossary of Terms"), ("answers", "Answer Key to the Part Tests"),
            ("closing", "Closing Supplication")]

RULE = ('<div class="fm-rule"><i></i><svg viewBox="0 0 20 20"><g transform="translate(10 10)">'
        '<rect x="-6" y="-6" width="12" height="12" fill="#c9a14a"/><rect x="-6" y="-6" width="12" height="12" fill="#c9a14a" transform="rotate(45)"/></g></svg><i></i></div>')


def head(title, ar):
    return f'<h1 class="fm-title">{title}</h1><div class="fm-ar" lang="ar" dir="rtl">{ar}</div>{RULE}'


# ------------------------------------------------------------------ cover
AUTHOR = "Feysel Reshid"


def cover_art():
    """Full-page cover artwork (mm units): frame with concave corners, pointed arch, lantern."""
    G = "#c9a14a"

    def frame(i, w):
        r = 7
        x0, y0, x1, y1 = i, i, 210 - i, 297 - i
        return (f'<path d="M{x0 + r} {y0} H{x1 - r} A{r} {r} 0 0 0 {x1} {y0 + r} V{y1 - r} A{r} {r} 0 0 0 {x1 - r} {y1} '
                f'H{x0 + r} A{r} {r} 0 0 0 {x0} {y1 - r} V{y0 + r} A{r} {r} 0 0 0 {x0 + r} {y0} Z" fill="none" stroke="{G}" stroke-width="{w}"/>')

    def arch(d, extra=""):
        l, r_, top, spring, base = 36 + d, 174 - d, 46 + d * 1.25, 104, 236 - d
        return (f'<path d="M{l} {base} V{spring} C{l} {spring - 32} {105 - 30 + d * .4} {top + 18} 105 {top} '
                f'C{105 + 30 - d * .4} {top + 18} {r_} {spring - 32} {r_} {spring} V{base} Z" {extra}/>')

    b = ('<defs><radialGradient id="cbg" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#17594f"/>'
         '<stop offset=".55" stop-color="#0c3d36"/><stop offset="1" stop-color="#05211d"/></radialGradient>'
         '<radialGradient id="cin" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#1b6457"/>'
         '<stop offset="1" stop-color="#0b3832"/></radialGradient></defs>')
    b += '<rect width="210" height="297" fill="url(#cbg)"/>'
    b += frame(9, .9) + frame(11.2, .35)
    # small leaf flourishes at the corners
    for (x, y, sx, sy) in [(9, 9, 1, 1), (201, 9, -1, 1), (9, 288, 1, -1), (201, 288, -1, -1)]:
        b += (f'<g transform="translate({x} {y}) scale({sx} {sy})"><path d="M5 14 Q5 5 14 5" fill="none" stroke="{G}" stroke-width=".5"/>'
              f'<circle cx="7.2" cy="7.2" r="1.1" fill="{G}"/></g>')
    b += arch(0, 'fill="url(#cin)" stroke="%s" stroke-width="1"' % G)
    b += arch(2.6, 'fill="none" stroke="%s" stroke-width=".35"' % G)
    # base line of the arch with a small step
    b += f'<rect x="30" y="236" width="150" height="1" fill="{G}"/><rect x="33" y="238.4" width="144" height=".35" fill="{G}"/>'
    return f'<svg class="art" viewBox="0 0 210 297" preserveAspectRatio="none">{b}</svg>'


def cover_html(css):
    lamp = FIGURES["lantern"]
    return f'''<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../fonts/fonts.css">
<style>{css}
@page {{ size: A4; margin: 0; }}</style></head><body>
<div class="cover">{cover_art()}
  <div class="c-top">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
  <div class="c-lamp">{lamp}</div>
  <div class="c-body">
    <div class="c-ar">الأَرْبَعُونَ النَّوَوِيَّةُ</div>
    <div class="c-en">The Forty Hadith<br>of Imam an-Nawawi</div>
    <div class="c-sub">with the eight additions of Ibn Rajab al-Ḥanbalī</div>
    <div class="c-div"><i></i><b></b><i></i></div>
    <div class="c-feat">Arabic Text · English Translation · Notes<br>Lessons · Pictures · Questions · Weekly To-Do Lists</div>
  </div>
  <div class="c-author"><span>Compiled by</span>{AUTHOR}</div>
  <div class="c-foot">A Complete Study Edition · 50 Hadith · 50 Weeks</div>
</div></body></html>'''


# ------------------------------------------------------------------ title & bismillah
def title_page():
    return f'''<section class="title-page">
  <div class="basm" lang="ar">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
  <div class="t-ar" lang="ar" dir="rtl">الأَرْبَعُونَ النَّوَوِيَّةُ</div>
  <div class="t-en">The Forty Hadith of Imam an-Nawawi</div>
  <div class="t-sub">with the additions of al-Ḥāfiẓ Ibn Rajab — fifty hadith in all</div>
  <div class="t-orn">{FIGURES["lantern"]}</div>
  <div class="t-feat">The Arabic text · English translation from sunnah.com<br>An explanatory note, lessons, pictures and step-by-step guides<br>Questions and a to-do list for every week</div>
  <div class="t-by"><span>Compiled by</span><b>{AUTHOR}</b>A Study Edition · 1448 AH / 2026 CE</div>
</section>'''


def bismillah_page():
    return '''<section class="bism-page">
  <div class="b1" lang="ar">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
  <div class="q" lang="ar">﴿وَمَا آتَاكُمُ الرَّسُولُ فَخُذُوهُ وَمَا نَهَاكُمْ عَنْهُ فَانْتَهُوا﴾</div>
  <div class="qe">“And whatever the Messenger has given you — take; and what he has forbidden you — refrain from.” (al-Ḥashr 59:7)</div>
  <div class="q" lang="ar">«نَضَّرَ اللَّهُ امْرَأً سَمِعَ مِنَّا حَدِيثًا فَحَفِظَهُ حَتَّى يُبَلِّغَهُ»</div>
  <div class="qe">“May Allah brighten the face of a person who hears a hadith from us, memorises it and passes it on.” (Abū Dāwūd, at-Tirmidhī)</div>
</section>'''


# ------------------------------------------------------------------ preface
def preface():
    return f'''<section class="page-sec" style="font-size:10.15pt;line-height:1.5">{mk("preface")}{head("Preface", "المُقَدِّمَة")}
<p class="dropcap">All praise belongs to Allah, Lord of the worlds, and may peace and blessings be upon our Prophet Muhammad, upon his family and all of his Companions. Among the gifts Allah gave His Messenger ﷺ was <i>jawāmiʿ al-kalim</i>: short sentences that carry a great deal of meaning. A few words from him can hold a whole chapter of the religion, and the scholars of every generation have collected such sayings so that Muslims can learn the most with the least effort.</p>
<p>The most loved of these collections is the <b>Forty Hadith</b> of Imam Yaḥyā ibn Sharaf an-Nawawī (d. 676 AH). He chose forty-two hadith, each of which, in his words, is “a great foundation of the foundations of the religion”. They cover belief, worship, character, dealings with people and the purification of the heart. Some scholars said that the whole of Islam turns on a handful of them: “Actions are by intentions”, “Whoever introduces into this affair of ours…”, “The halal is clear and the haram is clear”, and “Leave what does not concern you”. A century later, al-Ḥāfiẓ Ibn Rajab al-Ḥanbalī (d. 795 AH) wrote his famous commentary <i>Jāmiʿ al-ʿUlūm wa-l-Ḥikam</i> on them and added eight more, bringing the total to fifty. This book follows that fifty-hadith text exactly as it is printed in the source edition.</p>
<p>This is a <b>study edition</b>. It is meant to be read with a pen in your hand, not only memorised and put on a shelf. Each hadith has its own chapter, and every chapter is built the same way:</p>
<div class="callout">the <b>Arabic text</b>, fully voweled, with the Prophet’s own words in colour · the <b>English translation</b> from sunnah.com, with its reference · a short <b>biography of the Companion</b> who narrated it · an <b>explanatory note</b> drawn from the classical commentaries of an-Nawawī, Ibn Rajab, Ibn Daqīq al-ʿĪd and later scholars · the <b>lessons</b> of the hadith · a <b>picture</b> wherever a picture makes the meaning clearer · <b>step-by-step guides</b> wherever the hadith asks us to do something · five to seven <b>questions</b> with space to write · a <b>to-do list for the week</b>, so that the hadith leaves the page and enters your day, and ruled pages for <b>your own notes</b>.</div>
<p>Fifty hadith fit neatly into a year: one hadith a week, with two weeks left for revision. A family can read a chapter together at the weekend and tick the to-do list each evening; a teacher can use one chapter per lesson; a student can work alone with the memorisation tracker at the back.</p>
<p>The notes are brief on purpose: a doorway, not the whole house. Whoever wants more should read the commentaries, above all <i>Jāmiʿ al-ʿUlūm wa-l-Ḥikam</i>, and study with people of knowledge; where scholars differ on a ruling, ask a trusted scholar about your own situation.</p>
<p>The Companions did not move past ten verses of the Qur’an until they had learned the knowledge and the action in them. Learn the words, understand the meaning, then <b>act</b>. Whatever is correct in this book is from Allah alone, and whatever mistake it contains is from its compiler and from Shayṭān. We ask Allah to make it sincerely for His Face, to benefit its readers, and to forgive whoever reads it and makes du‘a for those who worked on it.</p>
<p class="sign" style="margin-top:3mm"><b>Feysel Reshid</b> · 1448 AH / 2026 CE</p>
</section>'''


# ------------------------------------------------------------------ how to use
def how_to_use():
    rows = [
        ("1 · Read the Arabic", "Read the hadith aloud in Arabic, slowly. The Prophet’s ﷺ own words are in colour. Repeat the coloured part until you can say it without looking."),
        ("2 · Read the translation", "The English is from sunnah.com, with the reference so you can look the hadith up online. The Prophet’s ﷺ words are in colour here too. Then read about the Companion who narrated it."),
        ("3 · Study the note and the picture", "The explanatory note gives the meaning and the background. The picture puts the whole hadith in one drawing — try to redraw it from memory."),
        ("4 · Learn the lessons", "Each numbered lesson is one thing the hadith teaches. Choose one lesson and share it with someone this week."),
        ("5 · Follow the steps", "When a hadith asks you to do something, the ‘Step by Step’ box shows how, in order."),
        ("6 · Answer the questions", "Write your answers in the space given. Some questions test what you understood; the last ones ask you to think about your own life."),
        ("7 · Live the to-do list", "Seven small tasks, one for each day from Saturday to Friday. Tick each box when it is done. At the end of the week, sign the memorisation line."),
        ("8 · Write your notes", "Use the ‘My Notes’ lines at the end of each chapter for what you learned, questions to ask your teacher, and du‘as to remember."),
    ]
    items = "".join(f'<div class="step"><span class="sn">{i + 1}</span><div><b>{h.split(" · ")[1]}</b><br>{d}</div></div>' for i, (h, d) in enumerate(rows))
    plan = "".join(f"<tr><td><b>{a}</b></td><td>{b}</td></tr>" for a, b in [
        ("Weekend", "Read the chapter together, memorise the coloured Arabic, look at the picture."),
        ("Weekdays", "One to-do task a day. Answer one or two questions each evening."),
        ("Friday", "Revise the hadith from memory, check the to-do list, sign the memorisation line."),
        ("Every 10 weeks", "A revision week: recite the ten hadith of the part and redo the questions you found hardest.")])
    return f'''<section class="page-sec" style="--accent:#0f5a4f;--soft:#e3f0ec">{mk("howto")}{head("How to Use This Book", "كَيْفَ تَسْتَفِيدُ مِنْ هَذَا الكِتَاب")}
<p>Every chapter follows the same eight parts. Work through them in order. A chapter takes about a week.</p>
<div class="steps">{items}</div>
<h3>A suggested weekly rhythm</h3>
<table class="todo" style="margin-top:2mm">{plan}</table>
<h3>The online book: audio and certificate</h3>
<div class="callout">Visit <b>diinislaam.com/arbaeen-nawawi</b> to <b>listen</b> to every hadith in Arabic and English, take the five part tests with instant marking, and receive your <b>certificate of completion</b> after passing all five tests with 80% or more.</div>
<h3>For parents and teachers</h3>
<p>For younger children, read the translation aloud, talk about the picture together and choose two or three of the to-do tasks. Older children and adults can do the whole chapter. Praise effort more than perfection, and act on the hadith yourself first: children learn more from what they see than from what they are told.</p>
</section>'''


# ------------------------------------------------------------------ about the imams
def about_nawawi():
    return f'''<section class="page-sec">{mk("nawawi")}{head("The Two Imams", "الإِمَامَانِ النَّوَوِيُّ وَابْنُ رَجَب")}
<h3>Imam an-Nawawī (631 – 676 AH)</h3>
<p><b>Abū Zakariyyā Yaḥyā ibn Sharaf an-Nawawī</b> was born in Muḥarram 631 AH in Nawā, a village in the Ḥawrān region south of Damascus. As a boy he loved the Qur’an so much that, it is reported, when other children forced him to play he would run away from them crying and reciting. At about nineteen his father brought him to Damascus, where he lived in a small room of the Rawāḥiyyah school and studied with remarkable discipline: twelve lessons a day with his teachers, in fiqh, hadith, Arabic grammar, principles and more.</p>
<p>In a short life of about forty-five years he wrote books that Muslims still read every day: <i>Riyāḍ aṣ-Ṣāliḥīn</i>, <i>al-Adhkār</i>, his commentary on <i>Ṣaḥīḥ Muslim</i>, <i>al-Majmūʿ</i>, <i>Rawḍat aṭ-Ṭālibīn</i>, <i>Minhāj aṭ-Ṭālibīn</i> and the <i>Forty Hadith</i>. He lived simply, never married, ate little, and taught at Dār al-Ḥadīth al-Ashrafiyyah without taking its salary. He spoke the truth to the rulers of his time, and wrote to the Sultan advising him to lift unjust taxes from the people. He died in Rajab 676 AH in his home village, may Allah have mercy on him.</p>
<p>In his introduction to the Forty Hadith, an-Nawawī explains that scholars before him had gathered forty hadith on single subjects, while he chose forty that each serve as “a great foundation of the religion”, all of them authentic or good, and with their chains removed so that they are easy to memorise. He hoped the reader would be among those who preserve and pass on the Sunnah.</p>
<div class="callout"><b>An-Nawawī said:</b> “It is fitting for everyone who desires the Hereafter to know these hadith, because of the important matters they contain and the attention they draw to every kind of obedience. That is clear to anyone who reflects on them.”</div>
<h3>Al-Ḥāfiẓ Ibn Rajab (736 – 795 AH)</h3>
<p><b>Zayn ad-Dīn ʿAbd ar-Raḥmān ibn Aḥmad ibn Rajab al-Ḥanbalī</b> was born in Baghdad and grew up in Damascus. He studied under Ibn al-Qayyim and other great scholars, and became one of the leading masters of hadith and of the knowledge of the heart. His books include a commentary on <i>Ṣaḥīḥ al-Bukhārī</i> (<i>Fatḥ al-Bārī</i>), <i>Laṭāʾif al-Maʿārif</i> and a commentary on at-Tirmidhī’s <i>al-ʿIlal</i>.</p>
<p>His best-known work is <b><i>Jāmiʿ al-ʿUlūm wa-l-Ḥikam</i></b>, “The Compendium of Knowledge and Wisdom”, a commentary on an-Nawawī’s forty-two hadith. He added <b>eight more</b> concise and comprehensive hadith — on inheritance, fosterage, forbidden trade, intoxicants, moderation in eating, hypocrisy, reliance on Allah and the remembrance of Allah — to complete fifty. In this book they are hadith 43 to 50.</p>
</section>'''


def about_translation():
    return f'''<section class="page-sec">{mk("translation")}{head("About the Text and Translation", "عَنِ النَّصِّ وَالتَّرْجَمَة")}
<h3>The Arabic text</h3>
<p>The Arabic follows the fifty-hadith text as printed in the source edition (<i>Mutūn Ṭālib al-ʿIlm</i>): an-Nawawī’s forty-two hadith followed by Ibn Rajab’s eight additions. The words of the Prophet ﷺ — and, in the <i>ḥadīth qudsī</i>, the words he relates from his Lord — are printed in the chapter’s accent colour, as in the original. The line under the Arabic gives the compiler’s note on where the hadith is recorded and how strong it is.</p>
<h3>The English translation</h3>
<p>The English translations are taken from <b>sunnah.com</b>:</p>
<div class="callout">
<p><b>Hadith 1–42:</b> sunnah.com, <i>Forty Hadith of an-Nawawi</i> (sunnah.com/nawawi40), reproduced as published, except that the long English blessing “(peace and blessings of Allah be upon him)” is written with the symbol <b>ﷺ</b> to save space.</p>
<p><b>Hadith 43–50:</b> sunnah.com does not list Ibn Rajab’s additions as a separate book, so each is given in sunnah.com’s translation from its original collection (Ṣaḥīḥ al-Bukhārī, Ṣaḥīḥ Muslim or Jāmiʿ at-Tirmidhī), with the exact reference. These versions sometimes contain a little more of the story, or put the clauses in a slightly different order, than the wording Ibn Rajab quotes.</p>
<p style="margin:0"><b>One exception:</b> the narration of Muʿādh ibn Jabal at the end of hadith 50 (from Ibn Ḥibbān) is not on sunnah.com, so it is given in this book’s own translation and is marked as such.</p></div>
<p>Translations by different people use different spellings (Hurayrah / Huraira, Ramadan / Ramadhan, salah / prayer). They have been left as sunnah.com has them.</p>
<h3>Honorifics</h3>
<p><b>ﷺ</b> — <i>ṣallā Allāhu ʿalayhi wa sallam</i>: may Allah send blessings and peace upon him (said after the Prophet’s name). <b>(ra)</b> / <span class="ar-in">رَضِيَ اللَّهُ عَنْهُ</span> — may Allah be pleased with him (said after the name of a Companion).</p>
<h3>Grades used in this book</h3>
<p><b>Ṣaḥīḥ</b> (authentic): narrated by trustworthy, precise narrators with an unbroken chain, free of hidden defects. <b>Ḥasan</b> (good): the same, but with narrators slightly less precise; it is still acted upon. <b>Gharīb</b>: narrated through a single chain at some point; this describes the chain, not necessarily weakness. <b>Mursal</b>: a Successor narrates directly from the Prophet ﷺ without naming the Companion.</p>
</section>'''


# ------------------------------------------------------------------ back matter
PART_COLORS = ["#0f5a4f", "#1d4e7a", "#6b2d5c", "#8a4b12", "#2f5d34"]


def tracker(titles):
    cells = "".join(f'<div style="--c:{PART_COLORS[(n - 1) // 10]}"><b>{n}</b>{titles.get(n, "")}<i></i></div>' for n in range(1, 51))
    return f'''<section class="page-sec">{mk("tracker")}{head("Memorisation Tracker", "جَدْوَلُ الحِفْظ")}
<p style="text-align:center">Tick the box when you can recite the Arabic of the hadith from memory. Colours show the five parts of the book.</p>
<div class="tracker tracker-sec">{cells}</div>
</section>'''


GLOSS = [
    ("ʿAqīdah", "Creed; the beliefs of a Muslim."), ("Bidʿah", "An innovation in the religion: a practice of worship with no basis in the Qur’an and Sunnah."),
    ("Duʿā’", "Supplication; calling upon Allah."), ("Dhikr", "Remembrance of Allah with the heart and tongue."),
    ("Farḍ / Farīḍah", "An obligation; also the fixed shares of inheritance (farā’iḍ)."), ("Fiṭrah", "The natural disposition Allah created people upon."),
    ("Ḥadīth", "A report of what the Prophet ﷺ said, did or approved."), ("Ḥadīth qudsī", "A hadith in which the Prophet ﷺ relates words from his Lord."),
    ("Ḥalāl / Ḥarām", "Lawful / forbidden."), ("Ḥimā", "A protected pasture or sanctuary; Allah’s ḥimā is what He has forbidden."),
    ("Iḥsān", "Excellence: worshipping Allah as though you see Him."), ("Ikhlāṣ", "Sincerity: doing a deed for Allah alone."),
    ("Īmān", "Faith: belief in the heart, statement of the tongue and action of the limbs."), ("Istighfār", "Seeking Allah’s forgiveness."),
    ("Istiqāmah", "Steadfastness: keeping to the straight path."), ("Mahram", "A close relative whom one may never marry."),
    ("Makrūh", "Disliked: better to leave, but not sinful."), ("Mubāḥ", "Permissible: neither rewarded nor punished in itself."),
    ("Munkar", "Evil; what the Shariah condemns."), ("Maʿrūf", "Good; what the Shariah approves."),
    ("Nafl / Nawāfil", "Voluntary acts of worship beyond the obligations."), ("Naṣīḥah", "Sincere goodwill and advice."),
    ("Niyyah", "Intention."), ("Qadar", "Allah’s decree and measuring out of all things."),
    ("Riyā’", "Showing off: doing good so that people see it."), ("Ṣadaqah", "Charity, in wealth or in good deeds."),
    ("Shubuhāt", "Doubtful matters, between the clearly lawful and the clearly forbidden."), ("Sunnah", "The way of the Prophet ﷺ: his words, deeds and approvals."),
    ("Taqwā", "Mindfulness of Allah: placing a shield between yourself and His punishment."), ("Tawakkul", "Reliance on Allah while taking the means."),
    ("Tawbah", "Repentance: returning to Allah from sin."), ("Wara‘", "Scrupulousness: leaving what may harm your religion."),
    ("Walī", "A friend of Allah: a believer with taqwā."), ("Zuhd", "Detachment from the world: leaving what will not benefit you in the Hereafter."),
]


def glossary():
    items = "".join(f"<p><b>{a}</b> — {b}</p>" for a, b in GLOSS)
    return f'<section class="page-sec">{mk("glossary")}{head("Glossary of Terms", "مُصْطَلَحَات")}<div class="gloss">{items}</div></section>'


def certificate():
    orn = FIGURES["lantern"]
    return f'''<section class="cert">{mk("certificate")}
<div style="width:22mm;margin-bottom:4mm">{orn}</div>
<div class="c1">Certificate of Completion</div>
<div class="c2">This is to certify that</div>
<div class="line"></div><div class="lab">Name</div>
<div class="c2" style="margin:0 0 6mm">has studied, understood and acted upon</div>
<div class="ar">الأَرْبَعُونَ النَّوَوِيَّةُ</div>
<div style="font-family:Cinzel,serif;font-size:14pt;color:#0f4c45;margin-bottom:10mm">The Forty Hadith of Imam an-Nawawi<br><span style="font-size:10pt">with the additions of Ibn Rajab</span></div>
<div style="display:flex;gap:16mm"><div><div class="line" style="width:60mm"></div><div class="lab">Teacher / Parent</div></div>
<div><div class="line" style="width:60mm"></div><div class="lab">Date</div></div></div>
</section>'''


def closing():
    return f'''<section class="closing">{mk("closing")}{head("Closing Supplication", "دُعَاءُ الخِتَام")}
<div class="ar" lang="ar">سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ</div>
<p style="text-align:center;font-style:italic;color:#6d5f45;max-width:150mm;margin:3mm auto 10mm">“Glory and praise be to You, O Allah. I bear witness that there is no god but You. I seek Your forgiveness and turn to You in repentance.” (The supplication for the end of a gathering, at-Tirmidhī)</p>
<div class="ar" lang="ar">اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي، وَعَلِّمْنِي مَا يَنْفَعُنِي، وَزِدْنِي عِلْمًا</div>
<p style="text-align:center;font-style:italic;color:#6d5f45;max-width:150mm;margin:3mm auto 10mm">“O Allah, benefit me with what You have taught me, teach me what will benefit me, and increase me in knowledge.” (Ibn Mājah, at-Tirmidhī)</p>
<div class="ar" lang="ar">وَصَلَّى اللَّهُ وَسَلَّمَ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ</div>
<div style="width:20mm;margin:12mm auto 0">{FIGURES["lantern"]}</div>
</section>'''
