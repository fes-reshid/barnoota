#!/usr/bin/env python3
"""The Forty Hadith: Teacher & Parent Guide (8.5 x 11 in, full colour, with its own cover).

  python3 build_teacher.py

Companion to the Study Edition: how to teach each hadith, model answers to every chapter question, answer keys and marking
guides for the five part tests, lesson and course plans, class record sheets. Written for teachers and for parents.
Output: Forty-Hadith-Teacher-Parent-Guide.pdf
"""
import os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "src"))
import build as B  # noqa: E402  (page frame, cover, PDF assembly; the study book's own helpers)
from build import esc, CONTENT, PARTS, STAR, FIGURES, ICONS, part_of, ar_title, PART_WORD, LET, LET_10  # noqa: E402
import front, tests  # noqa: E402
import teach_01, teach_02, teach_03, teach_04, teach_05, teach_tests  # noqa: E402

TEACH = {}
for m in (teach_01, teach_02, teach_03, teach_04, teach_05):
    TEACH.update(m.TEACH)

OUT = os.path.join(ROOT, "Forty-Hadith-Teacher-Parent-Guide.pdf")
BUILD = os.path.join(ROOT, ".build-teacher")
os.makedirs(BUILD, exist_ok=True)
B.RUN_HEAD_RIGHT = "TEACHER & PARENT GUIDE"
mk = front.mk


def icon(name):
    return f'<span class="ci">{ICONS[name]}</span>'


# ------------------------------------------------------------------ cover, title, copyright
def cover():
    inner = front.cover_html_inner(FIGURES["lantern"])
    for a, b in [
        ('<div class="c-sub">with the eight additions of Ibn Rajab al-Ḥanbalī</div>', '<div class="c-sub tgsub">Teacher &amp; Parent Guide</div>'),
        ("Arabic Text · English Translation · Notes<br>Lessons · Pictures · Questions · Weekly To-Do Lists", "Teaching Notes · Model Answers · Activities<br>Lesson Plans · Marking Guide · Test Answer Keys"),
        ("A Complete Study Edition · 50 Hadith · 50 Weeks", "Companion to the Study Edition · 50 Hadith · 50 Weeks"),
    ]:
        assert a in inner, a[:40]
        inner = inner.replace(a, b)
    css = open(os.path.join(ROOT, "src", "book.css"), encoding="utf-8").read()
    extra = ".cover .c-sub.tgsub { font-family: 'Cinzel', serif; font-style: normal; font-weight: 700; font-size: 15pt; letter-spacing: .16em; text-transform: uppercase; color: #ecd391; margin-top: 4mm; }"
    return B.letter_cover_html(css, inner=inner, extra_css=extra)


def title_page():
    return f'''<section class="title-page">
  <div class="basm" lang="ar">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
  <div class="t-ar" lang="ar" dir="rtl">الأَرْبَعُونَ النَّوَوِيَّةُ</div>
  <div class="t-en">The Forty Hadith of Imam an-Nawawi</div>
  <div class="t-sub">Teacher &amp; Parent Guide</div>
  <div class="t-orn">{FIGURES["lantern"]}</div>
  <div class="t-feat">Teaching notes and activities for every hadith<br>Model answers to every question<br>Answer keys and a marking guide for the five part tests</div>
  <div class="t-by"><span>Compiled by</span><b>{front.AUTHOR}</b>Companion to the Study Edition · 1448 AH / 2026 CE</div>
</section>'''


def copyright_page():
    return f'''<section class="copyright">
<p><b>The Forty Hadith of Imam an-Nawawi</b><br>Teacher &amp; Parent Guide<br>Companion to the Study Edition</p>
<p>Compiled by <b>{front.AUTHOR}</b></p>
<p>Copyright © 2026 Feysel Reshid. All rights reserved.</p>
<p>This guide is for teachers and parents who use the Study Edition with children and students. It contains the answers to the questions in the Study Edition, so please keep it for the adult. You may copy the class record sheets for your own class or family. No other part may be reproduced, stored or transmitted in any form or by any means without the prior written permission of the author, except for brief quotations in reviews.</p>
<p>The model answers are drawn from the hadith, from the explanatory notes and lessons of the Study Edition, and from the classical commentaries named in its “Notes and References”. For rulings about a real situation, please ask a trusted scholar.</p>
<p>First edition · 1448 AH / 2026 CE</p>
<div class="cp-online">{front.qr.block("", "Online book")}<p>The online book, with audio, tests and a teacher page for your class:<br><b>diinislaam.com/40hadith</b></p></div>
<p class="cp-dua">We ask Allah to accept this work and to benefit by it whoever teaches and whoever learns.</p>
</section>'''


# ------------------------------------------------------------------ front matter
FRONT = [("welcome", "Welcome"), ("howto", "How to Use This Guide"), ("lessons", "Lesson Plans: in Class and at Home"),
         ("course", "Course Plans"), ("sensitive", "Sensitive Topics: A Guide for Adults"), ("online", "Using the Online Book and Class Codes"),
         ("marking", "Marking and Feedback")]
BACK = [("records", "Class Record Sheets"), ("glossary", "Glossary of Terms"), ("closing", "Closing Supplication")]


def head(title, ar=""):
    return f'<h1 class="tg-h">{title}</h1>' + (f'<div class="fm-ar" lang="ar" dir="rtl">{ar}</div>' if ar else "") + front.RULE


def welcome():
    return f'''<section class="tg">{mk("welcome")}{head("Welcome", "أَهْلًا وَسَهْلًا")}
<p class="lead">For every teacher and every parent who sits down with a child and a hadith.</p>
<p>This guide goes with the <b>Study Edition</b> of <i>The Forty Hadith of Imam an-Nawawi</i> (the fifty hadith of an-Nawawī and Ibn Rajab). It is for anyone who teaches the book: teachers in a school, madrasah or weekend class, and parents at home. <b>You do not need to be a scholar.</b> You need the Study Edition, this guide, and the wish to learn alongside the child.</p>
<p>The Study Edition does not print the answers, so a child can think for himself or herself. This guide gives them to you, together with ideas that help you teach.</p>
<h3 class="tg-s">What is inside</h3>
<ul>
<li><b>One page for every hadith.</b> The aim of the lesson, a way to start the conversation, an activity to do together, something to take care about, and a <b>model answer to every question</b> in the Study Edition.</li>
<li><b>Answer keys for the five part tests</b>, with a marking guide and what a good written answer includes.</li>
<li><b>Lesson plans</b> for a 45-minute class and a 15-minute family session, and <b>course plans</b> for a year, a half-year or a ten-week course.</li>
<li><b>Sensitive topics:</b> a short guide for the few hadith that need extra care.</li>
<li><b>Class record sheets</b> to copy and use, and instructions for the <b>online book</b> and its teacher page.</li>
</ul>
<div class="tg-box g"><p><b>Our promise to the learner.</b> Every hadith in this book is taught to bring a person closer to Allah, to the Prophet ﷺ and to good character. Praise effort more than marks. Be gentle with mistakes. Practise what you teach: children learn more from what they see than from what they are told.</p></div>
<h3 class="tg-s" style="break-before: page; margin-top: 0">Eight habits of a good teacher of hadith</h3>
<div class="tg-habits">
<div class="tg-habit"><b>1 · Start with the Arabic</b><span>Read the hadith aloud and slowly. Let the children hear and say the Prophet’s ﷺ own words before any explanation.</span></div>
<div class="tg-habit"><b>2 · Ask before you tell</b><span>A question first (“Start the conversation”) makes children think. Let them answer before you read the hadith.</span></div>
<div class="tg-habit"><b>3 · Keep it short</b><span>Short, regular sessions beat long, rare ones. Stop while the child still wants more.</span></div>
<div class="tg-habit"><b>4 · Link it to life</b><span>Use examples from the child’s day: school, friends, home, phones, food, prayer.</span></div>
<div class="tg-habit"><b>5 · Praise effort</b><span>Say what the child did well. An honest “almost, try again” is better than a hollow “perfect”.</span></div>
<div class="tg-habit"><b>6 · Model it yourself</b><span>Do the to-do task yourself. Say sorry when you make a mistake. Children copy what we do.</span></div>
<div class="tg-habit"><b>7 · Say “Allah knows best”</b><span>You do not have to know everything. Write the question down, find out, and come back with the answer.</span></div>
<div class="tg-habit"><b>8 · Ask a scholar</b><span>For rulings in real situations, such as money, marriage or health, ask someone of knowledge. The notes here are an introduction, not a fatwa.</span></div>
</div>
<h3 class="tg-s">Different ages</h3>
<table class="tg-t">
<tr><th>Age</th><th>Suggestion</th></tr>
<tr><td class="k">About 6–9</td><td>Read the translation aloud together, look at the picture, choose two or three questions and one to-do task. Learn only the coloured Arabic words of the Prophet ﷺ.</td></tr>
<tr><td class="k">About 10–14</td><td>The whole chapter: Arabic, translation, narrator, note, lessons, all the questions and the full week of tasks.</td></tr>
<tr><td class="k">Teens and adults</td><td>Add the Background of the Hadith and the footnotes, discuss the critical-thinking questions in the tests, and read the sources in “Notes and References”.</td></tr>
</table>
</section>'''


def howto():
    return f'''<section class="tg">{mk("howto")}{head("How to Use This Guide", "كَيْفَ تَسْتَعْمِلُ هَذَا الدَّلِيل")}
<p>Keep the Study Edition and this guide side by side. Each hadith has a chapter in the Study Edition and a page in this guide, in the same order.</p>
<h3 class="tg-s">One page for each hadith</h3>
<table class="tg-t">
<tr><th>Part of the page</th><th>What it gives you</th></tr>
<tr><td class="k">Aim</td><td>What the child should be able to do or say after the lesson. Use it to check that you have taught what matters.</td></tr>
<tr><td class="k">Start the conversation</td><td>A question or small scene that makes children curious. Use it before you read the hadith.</td></tr>
<tr><td class="k">Try it together</td><td>An activity for the class or the family, usually 5–10 minutes with simple materials.</td></tr>
<tr><td class="k">Take care</td><td>A point where it is easy to give the wrong idea, a sensitive topic, or something to explain gently.</td></tr>
<tr><td class="k">Answers</td><td>A model answer to each question in the Study Edition, in the same order. Where an answer is personal (“Answers will vary”) you are told what to look for.</td></tr>
</table>
<h3 class="tg-s">A weekly rhythm for each hadith</h3>
<table class="tg-t">
<tr><th>When</th><th>What to do</th></tr>
<tr><td class="k">Start of the week</td><td>Conversation, Arabic and translation, the Companion who narrated it, and the explanatory note. Do the activity together.</td></tr>
<tr><td class="k">Daily</td><td>One to-do task a day from the Study Edition, and one or two questions in the evening. Praise what is done.</td></tr>
<tr><td class="k">End of the week</td><td>Revise the Arabic from memory, check the answers with this guide, tick the to-do list and sign the memorisation line.</td></tr>
<tr><td class="k">After each ten hadith</td><td>The Part Review Test. Mark it with the answer key in this guide, and give feedback (see “Marking and Feedback”).</td></tr>
</table>
<div class="tg-box"><p><b>Using the answers well.</b> Do not read the model answers aloud first. Let the child try, then compare. Accept any answer that has the same meaning in different words. For personal questions, there is no single right answer: look for honesty and a small, practical step.</p></div>

</section>'''


def lessons():
    return f'''<section class="tg">{mk("lessons")}{head("Lesson Plans", "خُطَطُ الدُّرُوس")}
<h3 class="tg-s">A 45-minute class</h3>
<table class="tg-t">
<tr><th>Time</th><th>Step</th><th>What to do</th></tr>
<tr><td class="k">0–5 min</td><td><b>Welcome and recap</b></td><td>Greet, make du‘a, and recite last week’s hadith together. Check who ticked their to-do list.</td></tr>
<tr><td class="k">5–10 min</td><td><b>Start the conversation</b></td><td>Use the question from this guide. Let two or three children answer. Do not give the answer yet.</td></tr>
<tr><td class="k">10–20 min</td><td><b>Read and understand</b></td><td>Read the Arabic aloud (children repeat), then the translation, the narrator and the explanatory note. Point to the picture.</td></tr>
<tr><td class="k">20–30 min</td><td><b>Try it together</b></td><td>Do the activity from this guide.</td></tr>
<tr><td class="k">30–40 min</td><td><b>Questions</b></td><td>Children answer in pairs, then share. Compare with the model answers.</td></tr>
<tr><td class="k">40–45 min</td><td><b>Plan and du‘a</b></td><td>Each child chooses one to-do task for the week. Finish with a short du‘a.</td></tr>
</table>
<h3 class="tg-s">A 15-minute family session</h3>
<table class="tg-t">
<tr><th>Time</th><th>Step</th><th>What to do</th></tr>
<tr><td class="k">0–3 min</td><td><b>Recite</b></td><td>Say the coloured Arabic words together. Repeat each day this week.</td></tr>
<tr><td class="k">3–7 min</td><td><b>Talk</b></td><td>Ask the “Start the conversation” question. Then read the translation and talk about it.</td></tr>
<tr><td class="k">7–11 min</td><td><b>One question</b></td><td>Choose one question from the chapter and answer it together.</td></tr>
<tr><td class="k">11–15 min</td><td><b>Act and du‘a</b></td><td>Pick today’s to-do task. Do it, or plan when. End with du‘a.</td></tr>
</table>
<div class="tg-box g"><p><b>For parents.</b> Choose a regular time (after Maghrib, on Friday, at breakfast at the weekend) and keep to it. Let the children see you do the to-do tasks too. Keep a small notebook, or use the “My Notes” lines in the Study Edition, for questions you want to ask a scholar. <b>When time is short,</b> do the aim, the Arabic and one question: one hadith learned slowly and kept is better than many rushed. The online book can read the Arabic aloud while you travel or cook.</p></div>

</section>'''


def course():
    return f'''<section class="tg">{mk("course")}{head("Course Plans", "خُطَطُ المَنْهَج")}
<p>Choose the plan that fits your class or family. All three use the same book and the same tests.</p>
<table class="tg-t">
<tr><th>Plan</th><th>Pace</th><th>Best for</th></tr>
<tr><td class="k">A · One year</td><td>One hadith a week (50 weeks). Use the two spare weeks of a school year for revision. Take each part test in the week after Hadith 10, 20, 30, 40 and 50.</td><td>Children and families. The pace the Study Edition was written for.</td></tr>
<tr><td class="k">B · Half a year</td><td>Two hadith a week (25 weeks). Do the activity for one hadith and the questions for the other. Choose three to-do tasks a week.</td><td>Madrasah terms, older children and teenagers.</td></tr>
<tr><td class="k">C · Ten weeks</td><td>Five hadith a week. Read the Arabic, translation and note, discuss the aim, and answer two questions each. One part per two weeks, with its test.</td><td>Adults and study circles, Ramadan or summer courses.</td></tr>
</table>
<h3 class="tg-s">Plan A at a glance</h3>
<table class="tg-t">
<tr><th>Weeks</th><th>Hadith</th><th>Part</th><th>Test</th></tr>
<tr><td class="k">1–10</td><td>1–10</td><td>Foundations of the Religion</td><td>Part One test, week 11</td></tr>
<tr><td class="k">11–20</td><td>11–20</td><td>Purity of Heart and Tongue</td><td>Part Two test, week 21</td></tr>
<tr><td class="k">21–30</td><td>21–30</td><td>The Paths of Goodness</td><td>Part Three test, week 31</td></tr>
<tr><td class="k">31–40</td><td>31–40</td><td>Brotherhood and Justice</td><td>Part Four test, week 41</td></tr>
<tr><td class="k">41–50</td><td>41–50</td><td>Mercy, Hope and Ibn Rajab’s Additions</td><td>Part Five test, week 51</td></tr>
</table>
<div class="tg-box"><p><b>Revision.</b> At the end of each part, recite the ten hadith together and redo the questions the children found hardest. The “Hadith to revise with the class” list on the online teacher page shows which hadith your class missed most in the tests.</p></div>
<h3 class="tg-s">The final celebration</h3>
<p>When the last test is done, hold a small gathering: each child recites a hadith they love, says what changed in them, and receives the online certificate. Make du‘a together, and thank the people who helped.</p>
</section>'''


def sensitive():
    rows = [
        ("8", "The word “fight”", "This concerns the Muslim state, under legitimate authority and its conditions: never individuals, never an excuse to harm anyone. There is no compulsion in religion (al-Baqarah 2:256)."),
        ("14", "Punishments", "Three cases, for courts only, after proof and a fair trial. Stress the value of human life."),
        ("17", "Slaughter and animals", "Focus on mercy and kindness. For young children, mention only that Islam requires kindness to animals and a sharp knife."),
        ("25", "A husband and wife", "Explain simply that even lawful, ordinary enjoyments become charity with a good intention. Leave details to parents for younger children."),
        ("28", "The caliphs and bidʿah", "Teach holding to the Sunnah with love, knowledge and good manners. Do not use the words to label other Muslims."),
        ("29", "Jihad", "Keep to the meaning in the note, by its rules and under legitimate leadership. Keep the lesson on worship and the tongue."),
        ("34", "Changing evil", "Hand only for those with authority (parents, teachers, the ruler). Children use gentle words, or dislike it in the heart and leave."),
        ("38", "“I am his hearing…”", "It does not mean that Allah enters His creation (a false belief). It means He guides and protects every limb of the one He loves."),
        ("43, 44", "Inheritance and fosterage", "Topics for older students and parents. Teach the idea, not the calculations. Real cases need a scholar."),
        ("45, 46", "Interest, alcohol and drugs", "Be honest and calm, not frightening. Make sure children know a safe adult they can ask."),
        ("48", "Hypocrisy", "This is minor hypocrisy of actions. Never use it to label a child. We fear it for ourselves."),
    ]
    tr = "".join(f'<tr><td class="k">{a}</td><td><b>{esc(b)}</b></td><td>{esc(c)}</td></tr>' for a, b, c in rows)
    return f'''<section class="tg">{mk("sensitive")}{head("Sensitive Topics", "مَوَاضِعُ تَحْتَاجُ إِلَى حِكْمَة")}
<table class="tg-t"><tr><th>Hadith</th><th>Topic</th><th>How to teach it</th></tr>{tr}</table>
<div class="tg-box g"><p><b>If a child asks something you cannot answer,</b> say “Allah knows best”, write the question down, and ask a trusted scholar. If a child tells you about harm done to them or to someone else, take it seriously and follow your school’s or family’s safeguarding steps.</p></div>
</section>'''


def online():
    return f'''<section class="tg">{mk("online")}{head("The Online Book and Class Codes", "الكِتَابُ عَلَى الإِنْتَرْنِت")}
<p>The online book at <b>diinislaam.com/40hadith</b> has every hadith with audio in Arabic and English, the part tests marked automatically, and a certificate. It also has a teacher page, so you can follow a whole class. Parents can use it for the family in the same way.</p>
<h3 class="tg-s">Set up a class (about five minutes)</h3>
<ol class="plain">
<li>Open <b>diinislaam.com/teacher</b> and sign in with your teacher login (or ask your school administrator to approve a new teacher account). Choose the <b>Forty Hadith</b> tab.</li>
<li>Press <b>+ New class</b>. Give the class a name (for example “Year 7 Forty Hadith” or “Our family”) and the teacher name that students will see.</li>
<li>You receive a <b>6-letter class code</b> and an <b>invite link</b>. Send the link by WhatsApp or print the code.</li>
<li>Each student opens the link, creates an account (or signs in), and joins the class. They can use the same username as in the Diin Islaam quest games.</li>
</ol>
<h3 class="tg-s">What you see</h3>
<ul>
<li>Every student’s hadith studied (of 50), test scores, certificate and last activity.</li>
<li>Who needs attention, and which hadith the class missed most (“Hadith to revise with the class”).</li>
<li>Each student’s <b>written answers</b> for sections C and D of the tests, next to the model answers, where you give your marks and a comment. Students see your marks in the book.</li>
<li>Downloads: a CSV file (opens in Excel) and a printable report, for your school records.</li>
</ul>
<div class="tg-box"><p><b>Privacy.</b> A student’s private “My Notes” never leave their device. Only progress, scores and written test answers are shared, and only with the teacher of the class they joined. Students can leave a class at any time. Do not share the class code in public.</p></div>
<p>The printed book and the online book go together. The QR code on each chapter and test page opens the same page online.</p>
</section>'''


def marking():
    return f'''<section class="tg">{mk("marking")}{head("Marking and Feedback", "التَّقْوِيمُ وَالمُلَاحَظَات")}
<p>Each part test has <b>50 marks</b>. The answer keys are at the end of each part.</p>
<table class="tg-t">
<tr><th>Section</th><th>Marks</th><th>How to mark</th></tr>
<tr><td class="k">A · Multiple choice</td><td>25</td><td>1 mark for each correct answer. Use the key.</td></tr>
<tr><td class="k">B · Matching</td><td>10</td><td>1 mark for each correct pair. Use the key.</td></tr>
<tr><td class="k">C · Short answer</td><td>10</td><td>1 mark for each answer with the right meaning. Give ½ mark if only part of the answer is there. Accept different words with the same meaning.</td></tr>
<tr><td class="k">D · Critical thinking</td><td>5</td><td>Up to 1 mark for each question (see below). The key lists what a good answer includes.</td></tr>
</table>
<p><b>Marking section D.</b> Give <b>1 mark</b> for a clear answer that uses the hadith and adds an example or reasoning of the child’s own; <b>½ mark</b> if it mentions the hadith or gives an example, but not both, or the reasoning is unclear; <b>0</b> for no answer, or one that does not use the hadith or contradicts it.</p>
<h3 class="tg-s">Pass mark and what it means</h3>
<table class="tg-t">
<tr><th>Score</th><th>Meaning</th><th>What to do</th></tr>
<tr><td class="k">45–50</td><td>Excellent</td><td>Praise. Ask the child to teach one hadith to someone else.</td></tr>
<tr><td class="k">40–44</td><td>Passed (80% or more)</td><td>Go through the mistakes and re-read the hadith involved.</td></tr>
<tr><td class="k">30–39</td><td>Nearly there</td><td>Revise the hadith that were missed, redo those questions, then retake the test.</td></tr>
<tr><td class="k">Below 30</td><td>More time needed</td><td>Go back to the chapters, one hadith a day, and sit with the child. Retake the test later.</td></tr>
</table>
<div class="tg-box g"><p><b>Giving feedback.</b> Say one thing the child did well before the thing to improve. Write a short comment on the test. A child who has not passed has not failed: the reward is in seeking knowledge. The online book marks sections A and B automatically (35 marks, pass at 28), and you give the marks for C and D on the teacher page.</p></div>
</section>'''


# ------------------------------------------------------------------ parts and hadith
def part_page(k):
    first, last, name, acc, soft = PARTS[k - 1]
    title = teach_tests.PART_INTRO[k][0]
    summary, tip = teach_tests.PART_INTRO[k][1], teach_tests.PART_INTRO[k][2]
    rows = "".join(f'<tr><td class="n">{n}</td><td class="t">{esc(CONTENT[n]["title"])}</td><td>{esc(TEACH[n]["aim"])}</td></tr>' for n in range(first, last + 1))
    return f'''<section class="tg tg-part" style="--accent:{acc};--soft:{soft}">{mk(f"tgpart{k}")}
<div class="pl">{PART_WORD[k]}</div><h1>{esc(title)}</h1><div class="rng">Hadith {first} – {last}</div>
<p>{esc(summary)}</p>
<div class="tg-box"><p><b>Teaching tip.</b> {esc(tip)}</p></div>
<table class="tg-t"><tr><th>#</th><th>Hadith</th><th>Aim: after the lesson, the child can…</th></tr>{rows}</table>
</section>'''


def hadith_page(n):
    c, t, p = CONTENT[n], TEACH[n], part_of(n)
    qa = []
    for q, a in zip(c["questions"], t["answers"]):
        vary = a.startswith("Answers will vary")
        qa.append(f'<li><div class="q">{esc(q)}</div><div class="a{" vary" if vary else ""}">{esc(a)}</div></li>')
    k = (n - 1) // 10 + 1
    return f'''<section class="tg-hadith" id="tg{n}" style="--accent:{p[3]};--soft:{p[4]}">{mk(f"tg{n}")}
<header class="h-head"><div class="medal">{STAR}<span class="num">{n}</span></div>
 <div class="h-titles"><div class="kicker">Hadith {n} of 50 · {esc(p[2].split(" · ")[0])}</div><h2>{esc(c["title"])}</h2><div class="ar-title" lang="ar" dir="rtl">{ar_title(n)}</div></div></header>
<div class="tg-aim"><b>Aim</b>{esc(t["aim"])}</div>
<div class="tg-cards">
 <div class="tg-card">{icon("questions")}<b>Start the conversation</b><p>{esc(t["start"])}</p></div>
 <div class="tg-card">{icon("steps")}<b>Try it together</b><p>{esc(t["activity"])}</p></div>
 <div class="tg-card care">{icon("note")}<b>Take care</b><p>{esc(t["watch"])}</p></div>
</div>
{B.sec_head("questions", "Answers to the questions", "in the order of the Study Edition")}
<ol class="tg-ans">{"".join(qa)}</ol>
<div class="tg-foot">Study Edition: chapter “{esc(c["title"])}” · Part {k} Review Test follows Hadith {k * 10}</div>
</section>'''


def test_key(k):
    first, last = PARTS[k - 1][:2]
    acc, soft = PARTS[k - 1][3], PARTS[k - 1][4]
    mcq = tests.shuffled_mcq(k)
    lefts, rights, key = tests.shuffled_match(k)
    items = "".join(f'<li><b class="n">{i + 1}</b><span class="qq">{esc(q)}</span><br><span class="ans">{LET[a]}.</span> {esc(opts[a])}</li>' for i, (q, opts, a) in enumerate(mcq))
    mrows = "".join(f'<tr><td class="n">{i + 1}</td><td class="ar" lang="ar" dir="rtl">{esc(lefts[i])}</td><td class="l">{LET_10[key[i]]}</td><td>{esc(rights[key[i]])}</td></tr>' for i in range(10))
    sa = "".join(f'<li><span class="qq">{esc(q)}</span>{esc(a)}</li>' for q, a in tests.TESTS[k]["short"])
    crit = "".join(f'<li><span class="qq">{esc(q)}</span><b>A good answer includes:</b> {esc(g)}</li>' for q, g in zip(tests.TESTS[k]["critical"], teach_tests.CRIT[k]))
    return f'''<section class="tg-test" style="--accent:{acc};--soft:{soft}">{mk(f"tgtest{k}")}
<div class="kick">{PART_WORD[k]} · Hadith {first}–{last}</div><h1>Review Test: Answer Key</h1>
<h3 class="tg-s">A · Multiple choice <span>1 mark each · 25 marks</span></h3><ol class="keymcq">{items}</ol>
<h3 class="tg-s">B · Matching <span>1 mark each · 10 marks</span></h3><table class="keymatch">{mrows}</table>
<div class="page2"><h3 class="tg-s">C · Short answer <span>model answers · 10 marks</span></h3><ol class="keysa">{sa}</ol>
<h3 class="tg-s">D · Critical thinking <span>up to 1 mark each · 5 marks</span></h3><ol class="keysa">{crit}</ol>
<div class="keymark"><b>Total: 50 marks.</b> 40 or more is a pass (80%). Record the result on the class sheet at the back of this guide.</div></div>
</section>'''


# ------------------------------------------------------------------ record sheets
def records():
    rows = "".join('<tr><td class="nm">&nbsp;</td>' + "<td></td>" * 5 + "<td></td></tr>" for _ in range(17))
    head_ = "<tr><th style='width:52mm'>Student</th>" + "".join(f"<th>Test {k}<br>/ 50</th>" for k in range(1, 6)) + "<th>Certificate</th></tr>"
    chart_head = "<tr><th style='width:34mm'>Student</th>" + "".join(f"<th>{n}</th>" for n in range(1, 51)) + "</tr>"
    chart_rows = "".join('<tr><td class="nm">&nbsp;</td>' + "<td></td>" * 50 + "</tr>" for _ in range(20))
    return f'''<section class="tg">{mk("records")}{head("Class Record Sheets", "سِجِلُّ الفَصْل")}
<p class="lead">You may copy these pages for your own class or family.</p>
<p><b>Class:</b> ______________________________ &nbsp;&nbsp; <b>Teacher:</b> ______________________________ &nbsp;&nbsp; <b>Year:</b> ____________</p>
<h3 class="tg-s">Part test scores</h3>
<table class="rec">{head_}{rows}</table>
</section>
<section class="tg">
<h3 class="tg-s" style="margin-top:0">Hadith memorised and studied</h3>
<p style="font-size:10pt">Tick or date each box when the child can recite the Arabic of the hadith from memory.</p>
<table class="rec chart">{chart_head}{chart_rows}</table>
</section>'''


# ------------------------------------------------------------------ contents
def toc(pages):
    def pg(k):
        return pages.get(k, "")
    rows = []
    for key, label in FRONT:
        rows.append(f'<tr class="tf"><td colspan="2">{esc(label)}</td><td class="pg">{pg(key)}</td></tr>')
    for k in range(1, 6):
        first, last, name, acc, soft = PARTS[k - 1]
        rows.append(f'<tr class="tp" style="--accent:{acc}"><td colspan="2">{esc(name)}</td><td class="pg">{pg(f"tgpart{k}")}</td></tr>')
        for n in range(first, last + 1):
            rows.append(f'<tr><td class="tn" style="--accent:{acc}">{n}</td><td>{esc(CONTENT[n]["title"])}</td><td class="pg">{pg(f"tg{n}")}</td></tr>')
        rows.append(f'<tr class="tt" style="--accent:{acc}"><td class="tn">✎</td><td>{PART_WORD[k]} Review Test: Answer Key</td><td class="pg">{pg(f"tgtest{k}")}</td></tr>')
    for key, label in BACK:
        rows.append(f'<tr class="tf"><td colspan="2">{esc(label)}</td><td class="pg">{pg(key)}</td></tr>')
    return '<section class="page-sec toc tg-toc" id="toc"><h1 class="fm-title">Contents</h1><div class="fm-ar" lang="ar" dir="rtl">الفِهْرِس</div><table class="toc-t">' + "".join(rows) + "</table></section>"


def build_html(pages):
    css = "".join(open(os.path.join(ROOT, "src", f), encoding="utf-8").read() for f in ("book.css", "letter.css", "teacher.css"))
    parts = [title_page(), copyright_page(), toc(pages), welcome(), howto(), lessons(), course(), sensitive(), online(), marking()]
    for k in range(1, 6):
        parts.append(part_page(k))
        parts.extend(hadith_page(n) for n in range(PARTS[k - 1][0], PARTS[k - 1][1] + 1))
        parts.append(test_key(k))
    parts += [records(), front.glossary(), front.closing()]
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="../fonts/fonts.css"><style>{css}</style></head>
<body>{"".join(parts)}</body></html>'''


def find_pages(pdf_path):
    import logging
    import pdfplumber
    logging.getLogger("pdfminer").setLevel(logging.ERROR)
    pages = {}
    with pdfplumber.open(pdf_path) as pdf:
        for i, pg in enumerate(pdf.pages, 1):
            for m in re.finditer(r"MK-([A-Za-z0-9]+)-MK", pg.extract_text() or ""):
                pages.setdefault(m.group(1), i)
    return pages


def main():
    cover_html = os.path.join(BUILD, "cover.html")
    open(cover_html, "w", encoding="utf-8").write(cover())
    cover_pdf = os.path.join(BUILD, "cover.pdf")
    B.render(cover_html, cover_pdf)
    hp, body = os.path.join(BUILD, "guide.html"), os.path.join(BUILD, "body.pdf")
    pages = {}
    for _ in range(4):
        open(hp, "w", encoding="utf-8").write(build_html(pages))
        B.render(hp, body)
        new = find_pages(body)
        if new == pages:
            break
        pages = new
    B.compose(body, cover_pdf, OUT, title="The Forty Hadith of Imam an-Nawawi — Teacher & Parent Guide",
              subject="Teaching notes, model answers, test answer keys, lesson and course plans")
    expected = [f"tg{n}" for n in range(1, 51)] + [f"tgpart{k}" for k in range(1, 6)] + [f"tgtest{k}" for k in range(1, 6)] + [k for k, _ in FRONT + BACK]
    missing = [k for k in expected if k not in pages]
    from pypdf import PdfReader
    print("pages:", len(PdfReader(OUT).pages), "missing markers:", missing)


if __name__ == "__main__":
    main()
