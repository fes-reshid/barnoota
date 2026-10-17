# Seeraa Quest — Book One, print interior

Rebuild of the KDP interior. **62 pages, 8.5 × 11 in trim with bleed (621 × 810 pt).**

## Why it changed

The previous interior showed **the same illustration three times on every story page**
(the three "panels" were one picture offset by 27 and 52 pixels). The numbered boxes
were narration in speech-bubble shapes, with tails pointing at nobody — there was no
dialogue anywhere in the book, and no reason to turn the page.

This version keeps the artwork and rebuilds the storytelling:

* every panel is a **different crop** of the illustration, in a different colour grade
* **real dialogue** in speech bubbles, narration in clearly different caption boxes
* **hand-lettered sound effects**, placed automatically in whatever part of the panel is clear
* **five page layouts** instead of one, including full-page splashes for the big moments
* a **cliffhanger** at the end of every map, pulling the reader into the next one
* Quest Check keeps the four questions, and gains **Think Deeper** (with ruled writing
  space) and an empty **Your Turn to Draw** frame

## Files

| | |
|---|---|
| `book.html` | builds all 62 pages from `content.js` |
| `content.js` | the writing: 9 maps, 36 stories, 108 panels |
| `print.css`  | page geometry, panel layouts, components |
| `fonts.css` + `fonts/` | Baloo 2, Nunito, Amiri — subsetted, self-hosted |
| `art/`       | illustrations, colour-graded at build time |
| `render.js`  | HTML → PDF via headless Chromium |
| `finalize.py`| trims the page box to exactly 621 × 810 pt |
| `build.sh`   | runs both |

## Rebuilding

    ./build.sh

Needs node with playwright (chromium), and python3 with pypdf.

## Artwork resolution

The illustrations were recovered from the previous interior at 1144 × 391, then
upscaled 2× with an unsharp pass, so they declare ~305 DPI across a full-width panel.
The real detail is ~150 DPI. It prints acceptably and matches what the previous
edition shipped — but if the original art files still exist, re-exporting them at
300 DPI and dropping them into `art/` will give a visibly sharper book.

## Before publishing

Get a qualified Islamic content review, and proofread every Arabic, Qur'an and
hadith reference against the edition you teach from.
