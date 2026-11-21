# The Forty Hadith of Imam an-Nawawi: Study Edition

Compiled by Feysel Reshid.

`Forty-Hadith-Nawawi-Study-Book.pdf` is an 8.5 × 11 in study book (the same size as the Tuhfatul Atfaal book) of the 50-hadith text: an-Nawawi's 42 plus Ibn Rajab's 8 additions. It has 265 pages including the cover.

Each hadith has its own chapter with:

- the voweled Arabic text, with the Prophet's words in colour
- the English translation from sunnah.com, laid out like the Arabic with the Prophet's words in colour
- a short biography of the narrating Companion (full at the first hadith they narrate; later hadith refer back)
- an explanatory note
- a picture, where one helps
- lessons from the hadith
- step-by-step guides, where the hadith calls for action
- 5 to 7 questions with space to write
- a to-do list for the week (Saturday to Friday)
- ruled "My Notes" lines

The front matter holds the cover, title page, Preface, contents, a guide to using the book, short biographies of the two imams, and notes on the text and translation. The back matter holds a memorisation tracker, a glossary, the Notes and References (footnote sources, Arabic originals, bibliography) and a closing supplication.

## Translations

- Hadith 1–42 come from sunnah.com, *Forty Hadith of an-Nawawi*. The source data is in `data/nawawi42-sunnah.json`. The only change is that "(peace and blessings of Allah be upon him)" is printed as ﷺ.
- Hadith 43–50 use sunnah.com's translation from each hadith's original collection (Bukhari, Muslim or Tirmidhi), cited per hadith in `src/texts.py`.
- One part of hadith 50 is not on sunnah.com: the narration of Mu'adh from Ibn Hibban. The book gives its own translation of it and labels it as such.

## Building

The build needs Python 3 (with reportlab, pypdf, pdfplumber and segno), Node and Playwright Chromium.

```bash
python3 build.py
```

| File | Contents |
|---|---|
| `src/texts.py` | Arabic texts, and the English for hadith 43–50 |
| `src/english.py` | Paragraphs and highlighting of the English (the words are not changed; each mark is checked against the text) |
| `src/narrators.py` | Biographies of the narrating Companions |
| `src/content_0*.py` | Notes, lessons, steps, questions and to-do lists |
| `src/figures.py` | The pictures, drawn as SVG |
| `src/front.py` | Cover, Preface and the other front and back matter |
| `src/book.css` | The design |

## The Teacher & Parent Guide

`Forty-Hadith-Teacher-Parent-Guide.pdf` (built by `build_teacher.py`) is the companion for teachers and parents. The Study Edition no longer prints answers; this guide has them. It has one page for every hadith (aim, a way to start the conversation, an activity, a point to take care with, and a model answer to every question), answer keys and a marking guide for the five part tests, lesson and course plans, a guide to sensitive topics and class record sheets. The text is in `src/teach_01.py` to `teach_05.py` and `src/teach_tests.py`, and the design in `src/teacher.css`. It is not published on the website, so that students cannot read the answers.

## All editions

| Edition | Files | Build |
|---|---|---|
| Study book, 8.5 × 11 in (colour, cover included) | `Forty-Hadith-Nawawi-Study-Book.pdf` | `python3 build.py` |
| Amazon paperback, black and white, 8.5 × 11 in | `amazon-kdp/Forty-Hadith-KDP-Interior-BW.pdf`, `…-KDP-Cover.pdf` | `EDITION=kdp python3 build.py`, `python3 build_kdp_cover.py` |
| Amazon paperback, colour, 8.5 × 11 in | `amazon-kdp/Forty-Hadith-KDP-Interior-Color.pdf`, `…-KDP-Cover-Color.pdf` | `EDITION=kdp-color …`, `build_kdp_cover.py color` |
| Amazon hardcover, black and white, 8.25 × 11 in | `amazon-kdp/Forty-Hadith-Hardcover-Interior-BW.pdf`, `…-Hardcover-Cover-BW.pdf` | `EDITION=hc …`, `build_kdp_cover.py hc` |
| Amazon hardcover, premium colour, 8.25 × 11 in | `amazon-kdp/Forty-Hadith-Hardcover-Interior-Color.pdf`, `…-Hardcover-Cover-Color.pdf` | `EDITION=hc-color …`, `build_kdp_cover.py hc-color` |
| Teacher & Parent Guide, 8.5 × 11 in (colour, own cover) | `Forty-Hadith-Teacher-Parent-Guide.pdf` | `python3 build_teacher.py` |
| Kindle eBook (EPUB 3) | `amazon-kdp/Forty-Hadith-eBook.epub`, `…-eBook-Cover.jpg` | `python3 build_epub.py` (needs lxml) |

How to upload and price each one: `amazon-kdp/KDP-LISTING.md`.

## Online edition

`../arbaeen-nawawi/` is the online book (diinislaam.com/arbaeen-nawawi/, short address diinislaam.com/40hadith): all 50 hadith with Listen buttons, the five part tests marked automatically, and a certificate that unlocks after passing all five tests with 80% or more. Progress is saved in the reader's browser.

Each narrator card has a **Read more** button that opens a longer life story of the Companion (`src/stories.py`, online edition only). The certificate is drawn in the browser with a background of gold Arabic calligraphy (Hadith 36).

It is generated from the same sources as the PDF:

```bash
python3 build_web.py
```

To add audio recordings, see `../arbaeen-nawawi/audio/README.md`.

## QR codes and short addresses

Every hadith chapter and every review test has a QR code with its address printed under it, so a reader can open that page of the online book. The copyright page, the "How to Use" page and the back cover of the Amazon editions have a code for the online book's home page.

| Printed address | Opens |
|---|---|
| `diinislaam.com/40hadith` | the online book |
| `diinislaam.com/40hadith/1` … `/50` | that hadith |
| `diinislaam.com/40hadith/test1` … `/test5` | that review test |

The short addresses are small redirect pages in `../40hadith/`, written by `build_web.py`. The codes are made by `src/qr.py`.

## Teachers and classes

The online book can be used in a class. Students keep working without an account if they prefer; with one, the teacher sees their progress.

**For the teacher:** open `diinislaam.com/teacher/` and choose the **Forty Hadith** tab (or go straight to `/arbaeen-nawawi-admin/`). It uses the same teacher login and approval as the other courses. A teacher can:

- create a class (a 6-letter code and an invite link such as `diinislaam.com/40hadith/?class=ABC123`, with a WhatsApp share button)
- see every student's hadith studied (of 50), part-test scores (pass is 28 of 35), certificate status and last activity
- see who needs attention (no activity for 7 days, or a failed test) and which hadith the class misses most
- open a student to read the written answers of each test next to the model answers, and give marks for section C (out of 10) and D (out of 5) with a comment. The student sees the marks in the book.
- download the class as CSV (opens in Excel) or JSON, or print a report. This is how to move results into another school system.

**For the student:** on the book's home page, "My class" lets them sign in (the same Diin Islaam / Kids Quest username as the quest games) or create an account, then enter the class code. Their progress saves automatically.

**How it is built:** it reuses the existing Kids Quest accounts, classes and teacher links (`kids-quest-cloud.js`, Firestore project `diinislaam-8fdeb`).

| Data | Where | Who can read it |
|---|---|---|
| Progress, scores, written answers | `kids_quest_students/{uid}.progress["arbaeen-nawawi"]` | the student, and teachers linked to that student by joining their class |
| Teacher marks and comments | `kids_quest_students/{uid}.progress["arbaeen-nawawi-teacher"]` | the same |
| Classes | `kids_quest_classes/{code}` with `game: "arbaeen-nawawi"` | as for the other courses |

"My Notes" and the chosen multiple-choice answers never leave the student's device. No new Firestore rules are needed if the rules already allow what Tuhfatul Atfaal and Seeraa do (students write their own record and join classes; teachers read their linked students and write `progress`). If your rules limit `game` names or `progress` keys, add `arbaeen-nawawi` and `arbaeen-nawawi-teacher`.

| File | Contents |
|---|---|
| `../arbaeen-nawawi/class.js` | the student's "My class" card and the cloud sync |
| `../arbaeen-nawawi-admin/index.html` | the teacher page |
| `../arbaeen-nawawi-admin/meta.js` | hadith titles and written questions for the teacher page (made by `build_web.py`) |
| `tests/` | a simulated cloud and an end-to-end test of the whole flow |

To run the test: start a web server in the repository root (`python3 -m http.server 8765`), then `node tests/classes-flow.js`. It needs Playwright. The simulated cloud stands in for Firebase, so also try the real thing once with a teacher and a student account.
