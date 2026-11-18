# Printing and selling Zaad

## What you have

| File | What it is | Pages | Use |
|---|---|---|---|
| `Zaad-Muslim-Weekly-Planner-2027.pdf` | Weekly edition: one week on two facing pages | 184 | The planner to carry in a bag |
| `Zaad-Muslim-Daily-Planner-2027.pdf` | Daily edition: one page for every day | 436 | The premium desk planner |
| `Zaad-Free-Sample-2027.pdf` | February 1448 (Ramadan), the names of Allah, the adhkar | 27 | A free preview to share or put online |
| `Zaad-Cover-Wrap-Weekly.pdf`, `-Daily.pdf` | Back cover, spine and front cover in one sheet, with 3 mm bleed | 1 | The cover for the printer |
| `...-Ramadan` versions | The same with a Ramadan 1448 gift cover | | A seasonal edition |

The Ramadan interior PDFs are not kept in the repository. Rebuild them with `COVER=ramadan` (see the README).

All interiors are A5 portrait (148 x 210 mm), full colour. Page counts include the cover and are always even.

## Before you order a printed copy

1. **Bleed.** The coloured header bands and month pictures run to the edge of the page. The interior PDFs have **no bleed**, so a printer that trims will risk a thin white edge on those pages. Ask the printer if it accepts the file as it is at 100% scale, or have the interior rebuilt with 3 mm bleed.
2. **Spine width.** The wrap covers use 0.05 mm of spine for each page (9.2 mm weekly, 21.8 mm daily). Your printer's paper decides the real figure. Take the width from the printer's cover calculator, then rebuild with `SPINE_MM=... python3 build_cover.py`.
3. **Barcode.** The back covers have a white box for a barcode or ISBN. Fill it or remove it.
4. **Check the texts.** Have someone who knows the sources read the hand-typed items listed in the README, and confirm the Hijri dates against your local moon sighting.
5. **Order one proof copy** and look at the paper, the margins on the binding side and the thin ticks before ordering a run.

## Making it a real planner (not in the PDF)

A PDF cannot contain these. Ask for them when you order, if your printer offers them:

- **Hardcover with a ribbon bookmark.** One ribbon for the weekly, two for the daily.
- **Elastic closing band**, so it stays shut in a bag.
- **A pocket inside the back cover**, for notes, cards and receipts.
- **Rounded corners and a matt finish.**
- **Wire or spiral binding** instead of a spine, so the planner lies flat. This is the usual choice for the weekly edition.
- **Gold foil on the title.** This needs a separate vector file from the printer.

Suggested pairing: the weekly edition with wire binding or a flexible cover, ribbon and elastic, for carrying; the daily edition as a hardcover with two ribbons, for the desk.

## A simple price ladder

Work from your quote, not from a guess. A common rule of thumb for printed books is to price at about 2.5 to 3 times the printing cost per copy. Check that against what similar planners sell for where you sell.

1. **Free:** the sample PDF and the web page (`/zaad/`). They bring people in.
2. **Weekly edition:** the entry price, the one most people will buy.
3. **Daily edition:** the premium version, priced well above the weekly because it is more than twice the pages.
4. **Ramadan 1448 gift edition:** the weekly with the gift cover, sold before Ramadan. It has the gift page for a name and a dua.
5. **Extras:** a set of printed stickers, or two copies together for a couple or a family.

## Other places to sell

- **Print on demand** (Amazon KDP and similar): they do not offer hardcovers with ribbons or elastic. Check the colour page limit for a 436-page book before choosing the daily edition there.
- **A local printer**: usually the better route for ribbons, elastic, pockets and foil, but you order a run.
- **Digital download**: the PDFs can be sold as they are for people who print at home. The weekly edition is the sensible one for that.
