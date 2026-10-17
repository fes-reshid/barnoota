#!/usr/bin/env python3
"""Normalise the exported PDF to the exact KDP page box.

Chromium rounds the page width up by 0.12pt, so the MediaBox comes out
8.6267in instead of 8.6250in. The excess sits inside the bleed area, so
trimming the box to the exact spec changes nothing that prints.
"""
import sys
from pypdf import PdfReader, PdfWriter

W, H = 621.0, 810.0          # 8.5 x 11 in trim + KDP bleed
src = sys.argv[1] if len(sys.argv) > 1 else 'Seeraa_Quest_Book_1_Interior_KDP.pdf'

r = PdfReader(src)
w = PdfWriter()
for page in r.pages:
    for box in ('mediabox', 'cropbox', 'trimbox', 'bleedbox', 'artbox'):
        try:
            b = getattr(page, box)
        except Exception:
            continue
        if b is None:
            continue
        b.lower_left = (0, 0)
        b.upper_right = (W, H)
    w.add_page(page)
w.add_metadata({
    '/Title': 'Seeraa Quest - Book One',
    '/Author': 'Feysel Reshid',
    '/Subject': 'The early life of Prophet Muhammad (peace be upon him), in comic pages',
    '/Creator': 'Seeraa Quest',
})
with open(src, 'wb') as fh:
    w.write(fh)

chk = PdfReader(src)
sizes = {(round(float(p.mediabox.width), 3), round(float(p.mediabox.height), 3)) for p in chk.pages}
print('pages: %d  sizes: %s' % (len(chk.pages), sizes))
