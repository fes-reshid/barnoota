#!/usr/bin/env python3
"""KDP paperback cover (back + spine + front, with bleed) for the Train Tracks book.

Usage: python3 cover.py --pages 240 --author "Your Name" [--paper white|cream]
Spine width = pages x 0.002252in (white) or 0.0025in (cream), per KDP.
"""
import argparse, json
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.pdfbase.pdfmetrics import stringWidth
from generate import draw_grid

NAVY = (0.06, 0.24, 0.25); CREAM = (0.96, 0.92, 0.80); ORANGE = (0.91, 0.44, 0.16); DARK = (0.1, 0.1, 0.1)


def wrap(text, font, size, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if stringWidth(t, font, size) <= width: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pages', type=int, default=240)
    ap.add_argument('--author', default='Your Name')
    ap.add_argument('--paper', default='white')
    ap.add_argument('--puzzles', default='puzzles.json')
    ap.add_argument('--out', default='train-tracks-cover.pdf')
    ap.add_argument('--isbn', default='', help='13-digit ISBN; draws an EAN-13 barcode. Omit to leave the white box for KDP\'s free ISBN barcode')
    ap.add_argument('--back-only', action='store_true', help='write only the back cover (6.25 x 9.25 in) instead of the full wrap')
    a = ap.parse_args()

    trim_w, trim_h, bleed = 6 * inch, 9 * inch, 0.125 * inch
    spine = a.pages * (0.002252 if a.paper == 'white' else 0.0025) * inch
    W = 2 * trim_w + spine + 2 * bleed
    H = trim_h + 2 * bleed
    bx = bleed                          # back cover trim-left
    sx = bleed + trim_w                 # spine left
    fx = sx + spine                     # front cover left
    cv = canvas.Canvas(a.out, pagesize=((trim_w + 2 * bleed) if a.back_only else W, H))
    cv.setTitle('Train Tracks - cover'); cv.setAuthor(a.author)

    # background
    cv.setFillColorRGB(*NAVY); cv.rect(0, 0, W, H, stroke=0, fill=1)
    # subtle sleeper stripe along bottom, full wrap
    cv.setStrokeColorRGB(*ORANGE); cv.setLineWidth(3)
    y = bleed + 0.3 * inch
    for x0, x1 in ((0, sx), (fx, W)):          # back and front only, not the spine
        cv.setStrokeColorRGB(*ORANGE); cv.setLineWidth(3)
        cv.line(x0, y, x1, y); cv.line(x0, y + 0.18 * inch, x1, y + 0.18 * inch)
        cv.setStrokeColorRGB(*CREAM); cv.setLineWidth(2)
        x = x0 + 0.1 * inch
        while x < x1:
            cv.line(x, y - 0.04 * inch, x, y + 0.22 * inch); x += 0.22 * inch

    # ---------------- front
    cx = fx + trim_w / 2
    cv.setFillColorRGB(*CREAM)
    cv.setFont('Helvetica-Bold', 54); cv.drawCentredString(cx, H - bleed - 1.25 * inch, 'TRAIN')
    cv.drawCentredString(cx, H - bleed - 1.95 * inch, 'TRACKS')
    cv.setFillColorRGB(*ORANGE); cv.setFont('Helvetica-Bold', 15)
    cv.drawCentredString(cx, H - bleed - 2.35 * inch, '200 LOGIC PUZZLES FOR ADULTS')
    # puzzle card
    puzzles = json.load(open(a.puzzles))
    P = [p for p in puzzles if p['n'] == 8][3]
    P['path'] = [tuple(c) for c in P['path']]; P['start'] = tuple(P['start']); P['goal'] = tuple(P['goal'])
    s = 0.42 * inch; gw = 8 * s
    card_w, card_h = gw + 0.95 * inch, gw + 0.95 * inch
    cx0, cy0 = cx - card_w / 2, bleed + 1.75 * inch
    cv.setFillColorRGB(*CREAM); cv.roundRect(cx0, cy0, card_w, card_h, 12, stroke=0, fill=1)
    draw_grid(cv, P, cx0 + 0.3 * inch, cy0 + 0.3 * inch, s, solution=True)
    # badge
    cv.setFillColorRGB(*ORANGE)
    bw, bh = 2.3 * inch, 0.38 * inch
    cv.roundRect(cx - bw / 2, bleed + 1.08 * inch, bw, bh, 8, stroke=0, fill=1)
    cv.setFillColorRGB(1, 1, 1); cv.setFont('Helvetica-Bold', 13)
    cv.drawCentredString(cx, bleed + 1.08 * inch + 0.12 * inch, '6x6  &  8x8 GRIDS')
    # author
    cv.setFillColorRGB(*CREAM); cv.setFont('Helvetica-Bold', 13)
    cv.drawCentredString(cx, bleed + 0.7 * inch, a.author.upper())

    # ---------------- spine
    cv.saveState()
    cv.translate(sx + spine / 2, H / 2)
    cv.rotate(-90)
    cv.setFillColorRGB(*CREAM); cv.setFont('Helvetica-Bold', 17)
    cv.drawCentredString(0, -6, 'TRAIN TRACKS')
    cv.setFont('Helvetica', 10); cv.setFillColorRGB(*ORANGE)
    cv.drawString(-trim_h / 2 + 0.4 * inch, -4, a.author)
    cv.drawRightString(trim_h / 2 - 0.4 * inch, -4, '200 LOGIC PUZZLES')
    cv.restoreState()

    # ---------------- back
    m = 0.55 * inch
    bxl, bw_ = bx + m, trim_w - 2 * m
    y = H - bleed - 0.95 * inch
    cv.setFillColorRGB(*CREAM); cv.setFont('Helvetica-Bold', 21)
    cv.drawString(bxl, y, 'Climb aboard your next')
    y -= 27; cv.drawString(bxl, y, 'puzzle obsession.')
    y -= 30
    body = ('Lay the rails, follow the clues, and bring the train safely home. '
            'Each puzzle gives you number clues for every row and column, a few '
            'pre-drawn pieces, and one track that must run from the entry to the exit. '
            'Every puzzle has exactly one solution, so pure logic is all you need.')
    cv.setFont('Helvetica', 11.5)
    for ln in wrap(body, 'Helvetica', 11.5, bw_):
        cv.drawString(bxl, y, ln); y -= 16
    y -= 10
    cv.setFillColorRGB(*ORANGE); cv.setFont('Helvetica-Bold', 12)
    cv.drawString(bxl, y, 'INSIDE THIS BOOK'); y -= 20
    cv.setFillColorRGB(*CREAM); cv.setFont('Helvetica', 11.5)
    for b in ['100 puzzles on 6x6 grids, 100 puzzles on 8x8 grids',
              'Easy to hard, so you can build your skills',
              'Clear instructions with a worked example',
              'Full solutions at the back',
              'One puzzle per page, with room to pencil in']:
        cv.setFillColorRGB(*ORANGE); cv.circle(bxl + 4, y + 4, 2.5, stroke=0, fill=1)
        cv.setFillColorRGB(*CREAM)
        for i, ln in enumerate(wrap(b, 'Helvetica', 11.5, bw_ - 16)):
            cv.drawString(bxl + 16, y, ln); y -= 16
        y -= 3
    # barcode area (KDP places the barcode here: 2in x 1.2in)
    box_x, box_y = bx + trim_w - 0.25 * inch - 2 * inch, bleed + 0.25 * inch + 0.75 * inch
    cv.setFillColorRGB(1, 1, 1)
    cv.rect(box_x, box_y, 2 * inch, 1.2 * inch, stroke=0, fill=1)
    if a.isbn:
        from reportlab.graphics.barcode.eanbc import Ean13BarcodeWidget
        from reportlab.graphics.shapes import Drawing
        from reportlab.graphics import renderPDF
        d = ''.join(ch for ch in a.isbn if ch.isdigit())
        assert len(d) == 13 and d[:3] in ('978', '979'), 'ISBN must be 13 digits starting 978 or 979'
        w = Ean13BarcodeWidget(d, barHeight=0.75 * inch, fontSize=8, humanReadable=True)
        x0, y0, x1, y1 = w.getBounds()
        bw_, bh_ = x1 - x0, y1 - y0
        sc = min((2 * inch - 0.2 * inch) / bw_, (1.2 * inch - 0.35 * inch) / bh_)
        dr = Drawing(bw_ * sc, bh_ * sc); dr.scale(sc, sc); dr.add(w)
        renderPDF.draw(dr, cv, box_x + (2 * inch - bw_ * sc) / 2 - x0 * sc, box_y + 0.08 * inch - y0 * sc)
        cv.setFillColorRGB(0, 0, 0); cv.setFont('Helvetica', 8)
        cv.drawCentredString(box_x + inch, box_y + 1.2 * inch - 0.15 * inch, f'ISBN {d[:3]}-{d[3]}-{d[4:9]}-{d[9:12]}-{d[12]}')
    cv.save()
    print(f'{a.out}: {W/inch:.3f} x {H/inch:.3f} in, spine {spine/inch:.3f} in ({a.pages} pages, {a.paper})')

main()
