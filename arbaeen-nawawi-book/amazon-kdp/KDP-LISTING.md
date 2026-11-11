# Amazon KDP: The Forty Hadith of Imam an-Nawawi (paperback, black and white)

## Before you publish: translation permission
The English translations come from sunnah.com, which presents translations owned by their publishers. Get written permission to use them in a book you sell before you click **Publish**. Then update the credit line on the copyright page:

- the text is `TRANSLATION_CREDIT` in `src/front.py`
- after editing it, rebuild both files (see "Rebuilding" below)

## Files to upload
| File | Use |
|---|---|
| `Forty-Hadith-KDP-Interior-BW.pdf` | Manuscript (interior): 239 pages, A4, black and white |
| `Forty-Hadith-KDP-Cover.pdf` | Cover: one wrap-around PDF (back, spine and front), 17.328 × 11.94 in with bleed |

## Print settings in KDP (Paperback content page)
- **Print ISBN:** use KDP's free ISBN, or your own
- **Ink and paper:** Black & white interior with **white paper**. The cover's spine width is calculated for white paper.
- **Trim size:** 8.27 × 11.69 in (21 × 29.7 cm, A4)
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
> Each of the five parts ends with a **review test** (250 questions in all), and an **answer key** for teachers and parents is at the back. A memorisation tracker and a glossary are included.
>
> Ideal for families, Islamic schools, weekend classes, study circles and anyone who wants to learn — and live — the most important hadith of the Prophet ﷺ. A free online edition with audio and a certificate of completion accompanies the book at diinislaam.com.

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
At 239 pages, large trim, black ink, the printing cost is about **$1.00 + 239 × $0.017 ≈ $5.06** per copy. KDP's price calculator shows the exact figure.

| List price | Royalty (60% − printing) | With Expanded Distribution (40% − printing) |
|---|---|---|
| $14.99 | ≈ $3.93 | ≈ $0.94 |
| **$16.99 (suggested)** | **≈ $5.13** | ≈ $1.74 |
| $19.99 | ≈ $6.93 | ≈ $2.94 |

Let KDP convert the price for the other marketplaces (UK, EU, CA, AU…) and round it, or set each one yourself.

## Rebuilding after any change
From the `arbaeen-nawawi-book/` folder, run these in order:

```bash
EDITION=kdp python3 build.py
python3 build_kdp_cover.py
```

The cover script reads the interior's page count and resizes the spine. **If the page count changes, you must upload the new cover too.**
