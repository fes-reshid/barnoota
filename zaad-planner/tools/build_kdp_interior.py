#!/usr/bin/env python3
"""Make the Amazon KDP interior PDFs: the A5 pages with 0.125 in bleed added on the top, bottom and outer edge.

  python3 tools/build_kdp_interior.py

KDP paperback, trim 5.83 x 8.27 in (A5), "my book has bleed": every page is 5.955 x 8.52 in. Page 1 is a right-hand page,
so its bleed is on the right; left-hand pages have it on the left. The bleed is made by stretching the outermost
point of each edge out by 0.125 in (the usual way when the artwork has no extra bleed), which is trimmed off in printing.
Reads Zaad-Muslim-{Weekly,Daily}-Planner-2027.pdf, writes Zaad-KDP-Interior-{Weekly,Daily}.pdf.
"""
import os, warnings
warnings.simplefilter("ignore")
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TW, TH, B = 5.83 * 72, 8.27 * 72, 0.125 * 72     # trim width and height, bleed (points)
E = 0.4                                          # thickness of the source edge that is stretched (points)


def make(edition):
    src = pymupdf.open(os.path.join(ROOT, f"Zaad-Muslim-{edition}-Planner-2027.pdf"))
    out = pymupdf.open()
    for i, sp in enumerate(src):
        w, h = sp.rect.width, sp.rect.height
        recto = i % 2 == 0
        x0 = 0 if recto else B                   # left edge of the trimmed page on the sheet
        pg = out.new_page(width=TW + B, height=TH + 2 * B)
        x1, y0, y1 = x0 + TW, B, B + TH

        def put(dest, clip):
            pg.show_pdf_page(pymupdf.Rect(*dest), src, i, clip=pymupdf.Rect(*clip), keep_proportion=False)

        put((x0, 0, x1, y0), (0, 0, w, E))                       # top
        put((x0, y1, x1, y1 + B), (0, h - E, w, h))              # bottom
        if recto:
            put((x1, y0, x1 + B, y1), (w - E, 0, w, h))          # outer edge, right
            put((x1, 0, x1 + B, y0), (w - E, 0, w, E)); put((x1, y1, x1 + B, y1 + B), (w - E, h - E, w, h))
        else:
            put((0, y0, B, y1), (0, 0, E, h))                    # outer edge, left
            put((0, 0, B, y0), (0, 0, E, E)); put((0, y1, B, y1 + B), (0, h - E, E, h))
        pg.show_pdf_page(pymupdf.Rect(x0, y0, x1, y1), src, i, keep_proportion=False)   # the page itself, on top
    path = os.path.join(ROOT, f"Zaad-KDP-Interior-{edition}.pdf")
    out.save(path, garbage=4, deflate=True)
    print(f"{path}: {len(out)} pages, {(TW + B) / 72:.3f} x {(TH + 2 * B) / 72:.3f} in, {os.path.getsize(path) / 1e6:.1f} MB")


if __name__ == "__main__":
    for ed in ("Weekly", "Daily"):
        make(ed)
