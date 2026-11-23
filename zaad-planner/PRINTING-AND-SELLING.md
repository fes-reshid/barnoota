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

## Amazon KDP (paperback, full colour)

KDP prints glued paperbacks only: no spiral or wire binding, no ribbon or elastic. Files made for it:

| File | What it is |
|---|---|
| `Zaad-KDP-Interior-Weekly.pdf` | 184 pages, every page 5.955 x 8.52 in (trim 5.83 x 8.27 in, A5, plus 0.125 in bleed on the top, bottom and outer edge) |
| `Zaad-KDP-Interior-Daily.pdf` | The same for the 436-page daily edition |
| `Zaad-KDP-Cover-Weekly.pdf`, `-Daily.pdf` | Back cover, spine and front cover in one sheet, 0.125 in bleed, no barcode box (KDP prints its own at the lower right of the back cover) |

Rebuild: `python3 tools/build_kdp_interior.py` and `KDP=1 python3 build_cover.py`.

In KDP: Create, Paperback. Print options: **Premium colour**, **white paper**, trim **5.83 x 8.27 in (14.81 x 21.01 cm)**, **bleed: "Bleed (PDF only)"**, matte or glossy cover. Upload the interior and the cover. Open the online previewer and look at every page before you submit.

- **Spine.** The covers assume 0.002347 in a page for premium colour paper (11.0 mm weekly, 26.0 mm daily). KDP's cover calculator, with your page count and paper, gives the real figure; if it differs, rebuild with `SPINE_MM=... KDP=1 python3 build_cover.py`.
- **Bleed.** The interior has no separate bleed artwork, so the edge colour of each page is stretched 0.125 in outward. That is trimmed off in printing; the page content does not move.
- **Inside margin.** The pages have 15 mm (0.59 in) on the binding side. KDP asks for at least 0.5 in at 151 to 300 pages (the weekly: fine) and 0.625 in at 301 to 500 pages (the daily: about 1 mm short). Look at the binding side in the previewer.
- **First page.** The interior starts with the planner's own title page. Keep it or delete it before uploading, as you like.
- **Cost.** Colour printing is charged per page, so the 436-page daily costs much more than the weekly. Look at KDP's "printing cost" figure for your page count before you set the price, and start with the weekly edition.
- **ISBN.** KDP's free ISBN is fine; it lists KDP as the publisher. Use your own if you want to be the publisher of record.

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

1. **Free:** the sample PDF and the web page (`/planner/`). They bring people in.
2. **Weekly edition:** the entry price, the one most people will buy.
3. **Daily edition:** the premium version, priced well above the weekly because it is more than twice the pages.
4. **Ramadan 1448 gift edition:** the weekly with the gift cover, sold before Ramadan. It has the gift page for a name and a dua.
5. **Extras:** a set of printed stickers, or two copies together for a couple or a family.

## Other places to sell

- **Print on demand** (Amazon KDP and similar): they do not offer hardcovers with ribbons or elastic. KDP files are ready (see above); check the colour page limit for a 436-page book before choosing the daily edition there.
- **A local printer**: usually the better route for ribbons, elastic, pockets and foil, but you order a run.
- **Digital download**: the PDFs can be sold as they are for people who print at home. The weekly edition is the sensible one for that.
