# Amazon KDP: The Forty Hadith of Imam an-Nawawi

There are five Amazon editions. In KDP, a paperback, a hardcover and a Kindle eBook of the same book can share one title. Each print version needs its own ISBN (KDP gives them free). A black-and-white and a colour version of the same format must be set up as separate books.

| Edition | Interior / manuscript | Cover | Size | Pages |
|---|---|---|---|---|
| **Paperback, black and white** | `Forty-Hadith-KDP-Interior-BW.pdf` | `Forty-Hadith-KDP-Cover.pdf` | 8.5 × 11 in | 263 |
| **Paperback, colour** | `Forty-Hadith-KDP-Interior-Color.pdf` | `Forty-Hadith-KDP-Cover-Color.pdf` | 8.5 × 11 in | 263 |
| **Hardcover, black and white** | `Forty-Hadith-Hardcover-Interior-BW.pdf` | `Forty-Hadith-Hardcover-Cover-BW.pdf` | 8.25 × 11 in | 264 |
| **Hardcover, premium colour** | `Forty-Hadith-Hardcover-Interior-Color.pdf` | `Forty-Hadith-Hardcover-Cover-Color.pdf` | 8.25 × 11 in | 264 |
| **Kindle eBook** | `Forty-Hadith-eBook.epub` | `Forty-Hadith-eBook-Cover.jpg` | reflowable, 1600 × 2560 px cover | — |

All print editions are **8.5 × 11 in**, the same size as the Tuhfatul Atfaal and Seeraa Quest books, except the hardcover: 8.25 × 11 in is the largest hardcover size KDP offers. The study book (`../Forty-Hadith-Nawawi-Study-Book.pdf`, 8.5 × 11 in with its cover inside, 265 pages) is for printing at home or at a local printer, and for the website. For the old A4 versions, build with `SIZE=a4` (see "Rebuilding").

The sections below describe the black-and-white paperback. The other editions' differences follow it.

## Before you publish: translation permission
The English translations come from sunnah.com, which presents translations owned by their publishers. Get written permission to use them in a book you sell before you click **Publish**. Then update the credit line on the copyright page:

- the text is `TRANSLATION_CREDIT` in `src/front.py`
- after editing it, rebuild both files (see "Rebuilding" below)

## Files to upload
| File | Use |
|---|---|
| `Forty-Hadith-KDP-Interior-BW.pdf` | Manuscript (interior): 263 pages, 8.5 × 11 in, black and white |
| `Forty-Hadith-KDP-Cover.pdf` | Cover: one wrap-around PDF (back, spine and front), 17.842 × 11.25 in with bleed, spine 0.592 in |

## Print settings in KDP (Paperback content page)
- **Print ISBN:** use KDP's free ISBN, or your own
- **Ink and paper:** Black & white interior with **white paper**. The cover's spine width is calculated for white paper.
- **Trim size:** 8.5 × 11 in (21.59 × 27.94 cm)
- **Bleed:** No bleed. Nothing in the interior runs to the page edge.
- **Cover finish:** Matte (recommended for this design) or Glossy
- **Manuscript:** upload the interior PDF
- **Book cover:** choose "Upload a cover you already have" and upload the cover PDF
- Open the **Launch Previewer** and check every page. Then order a **proof copy** before publishing.

## Listing details (Paperback details page)
- **Language:** English
- **Book title:** The Forty Hadith of Imam an-Nawawi
- **Subtitle:** With the Additions of Ibn Rajab — A Study Edition with Arabic Text, English Translation, Notes, Lessons, Questions and Weekly To-Do Lists
- **Edition number:** 1
- **Author:** Feysel Reshid. In KDP, add him as "Author". Use "Compiler" only if you prefer that, under Contributors.
- **Publishing rights:** "I own the copyright and I hold the necessary publishing rights". Only choose this once the translation permission is in place.
- **Primary audience:** not sexually explicit; the reading age can be left blank, or set 12–18+ for families and schools.

### Description (paste into the description box)
> **The fifty hadith that hold the whole religion, made into a year of learning.**
>
> Imam an-Nawawī gathered forty-two short sayings of the Prophet ﷺ, each one "a great foundation of the religion". Al-Ḥāfiẓ Ibn Rajab later added eight more. Together they cover belief, worship, character, dealings with people and the purification of the heart.
>
> This study edition takes you through all fifty, one hadith a week. Each chapter gives you:
>
> - the fully voweled **Arabic text**, with the Prophet's ﷺ words highlighted
> - an **English translation** with its reference
> - a short **biography of the Companion** who narrated it
> - an **explanatory note** drawn from the classical commentaries
> - **lessons**, **illustrations** and **step-by-step guides**
> - 5–7 **questions** with space to write, a **to-do list for every day of the week**, and pages for your own notes
>
> Each of the five parts ends with a **review test** (250 questions in all), and a separate **Teacher & Parent Guide** has the answers. A memorisation tracker and a glossary are included.
>
> Ideal for families, Islamic schools, weekend classes, study circles and anyone who wants to learn — and live — the most important hadith of the Prophet ﷺ. A free online edition with audio and a certificate of completion accompanies the book at diinislaam.com/40hadith, and every chapter has a QR code that opens it online.

### Keywords (7 boxes)
1. 40 hadith nawawi arabic english
2. arbaeen nawawi study book workbook
3. hadith workbook questions answers
4. ibn rajab jami al ulum wal hikam
5. islamic studies curriculum homeschool
6. learn hadith for teens and adults
7. muslim gift book islamic knowledge

### Categories (choose up to three in KDP)
- Religion & Spirituality › Islam › Sacred Writings
- Religion & Spirituality › Islam › General
- Religion & Spirituality › Religious Studies (or Education › Religious)

## Price (Amazon.com, paperback)
At 263 pages, large trim, black ink, the printing cost is about **$1.00 + 263 × $0.017 ≈ $5.47** per copy. KDP's price calculator shows the exact figure.

| List price | Royalty (60% − printing) | With Expanded Distribution (40% − printing) |
|---|---|---|
| $14.99 | ≈ $3.52 | ≈ $0.53 |
| **$16.99 (suggested)** | **≈ $4.72** | ≈ $1.33 |
| $19.99 | ≈ $6.52 | ≈ $2.53 |

Let KDP convert the price for the other marketplaces (UK, EU, CA, AU…) and round it, or set each one yourself.

## Colour edition: what is different
- **Ink and paper:** Standard color, white paper. (KDP does not offer standard colour at A4, so both paperbacks use 8.5 × 11 in.)
- **Trim size:** 8.5 × 11 in (21.59 × 27.94 cm). **Bleed:** No bleed. **Cover finish:** Glossy shows the colours best; Matte also works.
- **Files:** `Forty-Hadith-KDP-Interior-Color.pdf` (263 pages) and `Forty-Hadith-KDP-Cover-Color.pdf` (17.842 × 11.25 in, spine 0.592 in).
- **Subtitle:** you can add "Full Colour Edition" at the end so readers can tell the two listings apart.
- **Price:** standard colour printing at large trim is about $1.00 + 263 × $0.0402 ≈ **$11.57** per copy. Check the exact figure in KDP's calculator.

| List price | Royalty (60% − printing) | With Expanded Distribution (40% − printing) |
|---|---|---|
| $22.99 | ≈ $2.22 | — |
| **$24.99 (suggested)** | **≈ $3.42** | — |
| $29.99 | ≈ $6.42 | ≈ $0.43 |

## Hardcover: what is different
KDP hardcovers are case laminate: the cover is printed and wrapped around 2 mm boards. The largest hardcover size is **8.25 × 11 in**. A4 and 8.5 × 11 in are not offered for hardcover, and standard colour is not available (only black ink or premium colour).

- **Ink and paper:** Black & white with **white paper** (`…-BW` files), or **Premium color** (`…-Color` files)
- **Trim size:** 8.25 × 11 in (20.96 × 27.94 cm). **Bleed:** No bleed. **Cover finish:** Matte or Glossy.
- **Covers:** made to KDP's cover calculator for 264 pages:
  - Black and white: **18.858 × 12.417 in**, spine 0.784 in
  - Premium colour: **18.883 × 12.417 in**, spine 0.809 in
  - Both: boards 8.447 × 11.236 in, wrap 0.591 in, hinge 0.394 in. Text is kept out of the hinge and the wrap, and the barcode area on the back is left empty.
- **Subtitle:** you can add "Hardcover Edition" (and "Full Colour" for the colour one).
- **Price (Amazon.com):** printing cost is the fixed cost plus a cost per page (large trim):
  - Black and white: $5.65 + 264 × $0.017 ≈ **$10.14**
  - Premium colour: $5.65 + 264 × $0.080 ≈ **$26.77**. KDP won't accept a list price below printing cost ÷ 60%, so the colour hardcover must be priced at about $44.62 or more.

| Hardcover | List price | Royalty (60% − printing) |
|---|---|---|
| Black and white | $24.99 | ≈ $4.85 |
| Black and white | **$27.99 (suggested)** | **≈ $6.65** |
| Premium colour | **$49.99 (suggested)** | **≈ $3.22** |
| Premium colour | $54.99 | ≈ $6.22 |

The premium colour hardcover is expensive to print. Most buyers will choose the colour paperback or the black-and-white hardcover, so publishing the colour hardcover is optional.

## Kindle eBook
- **Manuscript:** upload `Forty-Hadith-eBook.epub` (KDP accepts EPUB). It is reflowable, so readers can change the font size. It has the Arabic, translations, biographies, notes with tappable footnotes, pictures, lessons, steps, questions, to-do lists and the five tests (the answers are in the separate Teacher & Parent Guide), and links to the online book. It passes EPUBCheck 5.4.
- **Cover:** upload `Forty-Hadith-eBook-Cover.jpg` (1600 × 2560 px, the size KDP recommends).
- **ISBN:** not needed for a Kindle eBook.
- **DRM:** your choice.
- **Preview:** open the book in the **Kindle Previewer** in KDP and check a few chapters, the tests and the footnotes.
- **Price:** the 70% royalty applies to prices from $2.99 to $9.99, minus a small delivery fee based on file size (about 2.6 MB). For example, at **$7.99 (suggested)** the royalty is about 70% × ($7.99 − delivery fee) ≈ $5.30. KDP shows the exact figure.
- **KDP Select** (optional) puts the eBook in Kindle Unlimited, but the eBook can then only be sold on Amazon.

## Rebuilding after any change
From the `arbaeen-nawawi-book/` folder, run these in order:

```bash
EDITION=kdp python3 build.py          # black and white interior
python3 build_kdp_cover.py            # its cover
EDITION=kdp-color python3 build.py    # colour interior
python3 build_kdp_cover.py color      # its cover
EDITION=hc python3 build.py           # hardcover interior, black and white
python3 build_kdp_cover.py hc         # its cover
EDITION=hc-color python3 build.py     # hardcover interior, premium colour
python3 build_kdp_cover.py hc-color   # its cover
python3 build.py                      # the study book (8.5 x 11 in, cover included)
python3 build_epub.py                 # Kindle eBook and its cover
python3 -m epubcheck amazon-kdp/Forty-Hadith-eBook.epub   # check the eBook (pip install epubcheck)
```

The paperback cover script reads the interior's page count and resizes the spine. **If the page count changes, you must upload the new cover too.** For a hardcover, the script stops if the page count is not 264. Add `SIZE=a4` before `python3` (for example `SIZE=a4 python3 build.py`) for the A4 study book or black-and-white paperback. Read the new spine width from KDP's cover calculator (kdp.amazon.com/cover-calculator) and add it to `HC_SPINE` in `build_kdp_cover.py`.

## Teacher & Parent Guide (separate book)
`../Forty-Hadith-Teacher-Parent-Guide.pdf` is the companion for teachers and parents: 82 pages, 8.5 × 11 in, full colour, with its own cover. It holds the answers that are no longer printed in the Study Edition:

- one page for every hadith: the aim, a way to start the conversation, an activity, a point to take care with, and a model answer to every question in the Study Edition
- answer keys for the five part tests, with what a good written answer includes
- lesson plans (45-minute class, 15-minute family session), three course plans, a guide to sensitive topics, a marking guide, and class record sheets
- how to use the online book and its teacher page with a class

It is a PDF for printing at home, in a school or at a print shop. It is **not** on the website, so that students cannot read the answers. It is not yet set up for Amazon (it would need a KDP interior with binding margins and a wrap cover, like the other editions). Build it with `python3 build_teacher.py`.
