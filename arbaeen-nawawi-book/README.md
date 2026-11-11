# The Forty Hadith of Imam an-Nawawi: Study Edition

Compiled by Feysel Reshid.

`Forty-Hadith-Nawawi-Study-Book.pdf` is an A4 study book of the 50-hadith text: an-Nawawi's 42 plus Ibn Rajab's 8 additions. It has 226 pages including the cover.

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

The front matter holds the cover, title page, Preface, contents, a guide to using the book, short biographies of the two imams, and notes on the text and translation. The back matter holds a memorisation tracker, a glossary, a certificate and a closing supplication.

## Translations

- Hadith 1–42 come from sunnah.com, *Forty Hadith of an-Nawawi*. The source data is in `data/nawawi42-sunnah.json`. The only change is that "(peace and blessings of Allah be upon him)" is printed as ﷺ.
- Hadith 43–50 use sunnah.com's translation from each hadith's original collection (Bukhari, Muslim or Tirmidhi), cited per hadith in `src/texts.py`.
- One part of hadith 50 is not on sunnah.com: the narration of Mu'adh from Ibn Hibban. The book gives its own translation of it and labels it as such.

## Building

The build needs Python 3 (with reportlab, pypdf and pdfplumber), Node and Playwright Chromium.

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
