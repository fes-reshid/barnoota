#!/usr/bin/env python3
"""Train Tracks puzzle generator + KDP interior PDF builder.

Usage:  python3 generate.py [--n6 100] [--n8 100] [--seed 1] [--out train-tracks.pdf]

Rules of the puzzle
  * One continuous track enters at the LEFT edge and leaves at the BOTTOM edge.
  * Numbers outside the grid = how many cells in that row / column hold track.
  * Some cells are pre-drawn (hints). The track never crosses itself.
  * Every puzzle has exactly ONE solution (checked by an exhaustive solver).
"""
import argparse, random, sys, json
from multiprocessing import Pool

# directions: U D L R
DV = {'U': (-1, 0), 'D': (1, 0), 'L': (0, -1), 'R': (0, 1)}
OPP = {'U': 'D', 'D': 'U', 'L': 'R', 'R': 'L'}


def random_path(n, rng, min_len, max_len):
    """Random self-avoiding path from left edge to bottom edge."""
    while True:
        r0 = rng.randrange(0, n - 1)           # entry row (not bottom row)
        c1 = rng.randrange(1, n)               # exit column (not left col)
        start, goal = (r0, 0), (n - 1, c1)
        path, seen = [start], {start}
        steps = 0
        # randomised DFS with step cap
        stack = [(start, None)]
        order = {}
        def nbrs(cell):
            r, c = cell
            ds = list('UDLR'); rng.shuffle(ds)
            # bias a little toward the goal so paths finish
            return [(r + DV[d][0], c + DV[d][1]) for d in ds
                    if 0 <= r + DV[d][0] < n and 0 <= c + DV[d][1] < n]
        it = {start: iter(nbrs(start))}
        while path and steps < 4000:
            steps += 1
            cur = path[-1]
            if cur == goal:
                break
            nxt = None
            for nb in it[cur]:
                if nb not in seen:
                    nxt = nb; break
            if nxt is None:
                seen.discard(cur); path.pop()
                continue
            if len(path) >= max_len and nxt != goal:
                continue
            path.append(nxt); seen.add(nxt); it[nxt] = iter(nbrs(nxt))
        if path and path[-1] == goal and len(path) >= min_len:
            return path


def piece(path, i, n):
    """Set of open sides for path[i]."""
    r, c = path[i]
    s = set()
    if i == 0: s.add('L')
    else: s.add(dir_between(path[i], path[i - 1]))
    if i == len(path) - 1: s.add('D')
    else: s.add(dir_between(path[i], path[i + 1]))
    return frozenset(s)


def dir_between(a, b):
    dr, dc = b[0] - a[0], b[1] - a[1]
    for d, v in DV.items():
        if v == (dr, dc): return d


class Budget(Exception): pass


def solve(n, rows, cols, start, goal, hints, limit=2, budget=30000):
    """Count solutions (up to `limit`). hints: {cell: frozenset(sides)}.
    Returns list of paths."""
    sols = []
    rused = [0] * n; cused = [0] * n
    rfree = [n] * n; cfree = [n] * n      # unvisited cells per row/col
    visited = set()
    nh = len(hints)
    total = sum(rows)
    gr, gc = goal
    path = []

    nodes = [0]

    def rec(cell, came_from, hits):
        if len(sols) >= limit: return
        nodes[0] += 1
        if nodes[0] > budget: raise Budget()
        r, c = cell
        if rused[r] >= rows[r] or cused[c] >= cols[c]: return
        h = hints.get(cell)
        if h is not None and came_from not in h: return
        visited.add(cell); rused[r] += 1; cused[c] += 1; path.append(cell)
        rfree[r] -= 1; cfree[c] -= 1
        nh_hits = hits + (1 if h is not None else 0)
        try:
            if cell == goal:
                if (h is None or 'D' in h) and nh_hits == nh \
                        and rused == list(rows) and cused == list(cols):
                    sols.append(list(path))
                return
            need = total - len(path)
            if abs(gr - r) + abs(gc - c) > need: return
            # flood fill over cells the track could still use
            stack = []
            seen = set()
            for d in 'UDLR':
                nr, nc = r + DV[d][0], c + DV[d][1]
                if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in visited \
                        and rused[nr] < rows[nr] and cused[nc] < cols[nc]:
                    stack.append((nr, nc)); seen.add((nr, nc))
            rc_ = [0] * n; cc_ = [0] * n
            while stack:
                a, b = stack.pop()
                rc_[a] += 1; cc_[b] += 1
                for d in 'UDLR':
                    x, y = a + DV[d][0], b + DV[d][1]
                    if 0 <= x < n and 0 <= y < n and (x, y) not in visited \
                            and (x, y) not in seen and rused[x] < rows[x] and cused[y] < cols[y]:
                        seen.add((x, y)); stack.append((x, y))
            if goal not in seen: return
            for i in range(n):
                if rows[i] - rused[i] > rc_[i] or cols[i] - cused[i] > cc_[i]:
                    return
            if nh_hits < nh:
                for hc in hints:
                    if hc not in visited and hc not in seen: return
            for d in 'UDLR':
                if d == came_from: continue
                if h is not None and d not in h: continue
                nr, nc = r + DV[d][0], c + DV[d][1]
                if not (0 <= nr < n and 0 <= nc < n): continue
                nb = (nr, nc)
                if nb in visited: continue
                rec(nb, OPP[d], nh_hits)
        finally:
            visited.discard(cell); rused[r] -= 1; cused[c] -= 1; path.pop()
            rfree[r] += 1; cfree[c] += 1

    try:
        rec(start, 'L', 0)
    except Budget:
        return [None, None]          # not proven unique -> treated as ambiguous
    return sols


def make_puzzle(n, seed, tries=60):
    rng = random.Random(seed)
    min_len = int(n * n * (0.42 if n == 6 else 0.45))
    max_len = int(n * n * 0.7)
    while True:
        path = random_path(n, rng, min_len, max_len)
        if not path: continue
        start, goal = path[0], path[-1]
        if start == goal: continue
        rows = [0] * n; cols = [0] * n
        for r, c in path: rows[r] += 1; cols[c] += 1
        pcs = {path[i]: piece(path, i, n) for i in range(len(path))}
        hints = {}
        for c in rng.sample([c for c in path if c not in (start, goal)], 2 if n == 6 else 5):
            hints[c] = pcs[c]
        # add hints until unique (target alternative solution's differences)
        ok = True
        for _ in range(len(path)):
            sols = solve(n, rows, cols, start, goal, hints, 2)
            if len(sols) == 1: break
            alt = [s for s in sols if s is not None and s != path]
            if not alt:
                diff0 = [c for c in path if c not in hints and c not in (start, goal)]
                if not diff0: ok = False; break
                c = rng.choice(diff0); hints[c] = pcs[c]; continue
            diff = [c for c in path if c not in set(alt[0]) or
                    piece(path, path.index(c), n) != piece(alt[0], alt[0].index(c), n)]
            diff = [c for c in diff if c not in hints and c not in (start, goal)] \
                or [c for c in path if c not in hints]
            if not diff: ok = False; break
            c = rng.choice(diff); hints[c] = pcs[c]
        else:
            ok = False
        if not ok: continue
        if len(solve(n, rows, cols, start, goal, hints, 2)) != 1: continue
        # minimise hints
        for c in rng.sample(list(hints), len(hints)):
            if len(hints) <= (2 if n == 6 else 3): break
            h = hints.pop(c)
            if len(solve(n, rows, cols, start, goal, hints, 2)) != 1:
                hints[c] = h
        return {'n': n, 'rows': rows, 'cols': cols, 'start': start, 'goal': goal,
                'path': path, 'hints': {f'{r},{c}': sorted(v) for (r, c), v in hints.items()}}


def _job(args):
    n, seed = args
    return make_puzzle(n, seed)


def generate(n6, n8, seed):
    jobs = [(6, seed * 100000 + i) for i in range(n6)] + [(8, seed * 100000 + 50000 + i) for i in range(n8)]
    with Pool() as p:
        res = p.map(_job, jobs, chunksize=4)
    # order within each size: more hints = easier first
    def key(p): return -len(p['hints'])
    six = sorted([p for p in res if p['n'] == 6], key=key)
    eight = sorted([p for p in res if p['n'] == 8], key=key)
    return six + eight


# ---------------------------------------------------------------- PDF (reportlab)
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.pdfbase.pdfmetrics import stringWidth

PAGE_W, PAGE_H = 6 * inch, 9 * inch
GUT, OUT = 0.625 * inch, 0.5 * inch     # inside / outside margins (KDP 150-300 pages)


def tpath(cv, cx, cy, s, sides, lw, rails=True):
    """Draw a track piece centred (cx,cy) in a cell of size s."""
    sides = list(sides)
    def pt(d):
        return {'U': (cx, cy + s / 2), 'D': (cx, cy - s / 2),
                'L': (cx - s / 2, cy), 'R': (cx + s / 2, cy)}[d]
    import math
    a, b = sides
    cv.setLineWidth(lw)
    if OPP[a] == b:      # straight
        (x1, y1), (x2, y2) = pt(a), pt(b)
        cv.line(x1, y1, x2, y2)
        horiz = a in 'LR'
        k = 5
        for i in range(k):
            t = (i + 0.5) / k
            x = x1 + (x2 - x1) * t; y = y1 + (y2 - y1) * t
            w = s * 0.22
            cv.setLineWidth(lw * 0.7)
            if horiz: cv.line(x, y - w, x, y + w)
            else: cv.line(x - w, y, x + w, y)
        cv.setLineWidth(lw)
    else:                # curve: quarter circle around the shared corner
        corner = {'U': {'L': (-1, 1), 'R': (1, 1)}, 'D': {'L': (-1, -1), 'R': (1, -1)}}
        v = a if a in 'UD' else b; h = a if a in 'LR' else b
        kx, ky = corner[v][h]
        ox, oy = cx + kx * s / 2, cy + ky * s / 2
        rad = s / 2
        # angle range
        ang = {(1, 1): 180, (-1, 1): 270, (-1, -1): 0, (1, -1): 90}[(kx, ky)]
        cv.setLineWidth(lw)
        p = cv.beginPath()
        p.arc(ox - rad, oy - rad, ox + rad, oy + rad, ang, 90)
        cv.drawPath(p, stroke=1, fill=0)
        for i in range(3):
            th = math.radians(ang + (i + 0.5) * 90 / 3)
            x, y = ox + rad * math.cos(th), oy + rad * math.sin(th)
            w = s * 0.17
            cv.setLineWidth(lw * 0.6)
            cv.line(x - w * math.cos(th), y - w * math.sin(th), x + w * math.cos(th), y + w * math.sin(th))
        cv.setLineWidth(lw)


def draw_grid(cv, P, x0, y0, size, solution=False, small=False):
    """Draw puzzle with lower-left at (x0,y0), cell size `size`."""
    n = P['n']; s = size
    lm = 0.6 * s if not small else 0.55 * s       # label margin
    cv.setStrokeColorRGB(0.1, 0.1, 0.1); cv.setFillColorRGB(0.1, 0.1, 0.1)
    # grid
    cv.setLineWidth(0.5 if small else 0.9)
    for i in range(n + 1):
        cv.line(x0, y0 + i * s, x0 + n * s, y0 + i * s)
        cv.line(x0 + i * s, y0, x0 + i * s, y0 + n * s)
    # numbers
    fs = s * 0.5 if not small else s * 0.55
    cv.setFont('Helvetica-Bold', fs)
    for c in range(n):
        cv.drawCentredString(x0 + c * s + s / 2, y0 + n * s + s * 0.2, str(P['cols'][c]))
    for r in range(n):
        cv.drawString(x0 + n * s + s * 0.2, y0 + (n - 1 - r) * s + s * 0.3, str(P['rows'][r]))
    cell = lambda r, c: (x0 + c * s + s / 2, y0 + (n - 1 - r) * s + s / 2)
    lw = s * 0.07 if not small else s * 0.09
    # entry / exit stubs
    sr, sc = P['start']; er, ec = P['goal']
    for (r, c), side in ((P['start'], 'L'), (P['goal'], 'D')):
        cx, cy = cell(r, c)
        stub = {'L': (cx - s / 2 - s * 0.45, cy, cx - s / 2, cy),
                'D': (cx, cy - s / 2 - s * 0.45, cx, cy - s / 2)}[side]
        cv.setLineWidth(lw); cv.line(*stub)
        cv.setFillColorRGB(0.1, 0.1, 0.1)
    path = P['path']
    if solution:
        cv.setStrokeColorRGB(0.1, 0.1, 0.1)
        for i, (r, c) in enumerate(path):
            tpath(cv, *cell(r, c), s, piece(path, i, n), lw)
    else:
        for k, sides in P['hints'].items():
            r, c = map(int, k.split(','))
            cv.setFillColorRGB(0.88, 0.88, 0.88)
            cv.rect(x0 + c * s, y0 + (n - 1 - r) * s, s, s, stroke=0, fill=1)
            cv.setStrokeColorRGB(0.1, 0.1, 0.1)
            tpath(cv, *cell(r, c), s, sides, lw)
    cv.setFillColorRGB(0, 0, 0); cv.setStrokeColorRGB(0, 0, 0)


def footer(cv, text, page):
    cv.setFont('Helvetica', 8); cv.setFillColorRGB(0.35, 0.35, 0.35)
    cv.drawCentredString(PAGE_W / 2, 0.3 * inch, text)
    cv.setFillColorRGB(0, 0, 0)


def build_pdf(puzzles, out, title, author):
    cv = canvas.Canvas(out, pagesize=(PAGE_W, PAGE_H))
    cv.setTitle(title); cv.setAuthor(author)
    page = 0

    def newpage():
        nonlocal page
        cv.showPage(); page += 1

    def centered(y, text, font='Helvetica-Bold', size=24):
        cv.setFont(font, size); cv.drawCentredString(PAGE_W / 2, y, text)

    def wrap(text, font, size, width):
        words, lines, cur = text.split(), [], ''
        for w in words:
            t = (cur + ' ' + w).strip()
            if stringWidth(t, font, size) <= width: cur = t
            else: lines.append(cur); cur = w
        lines.append(cur); return lines

    # title page
    centered(PAGE_H - 2.6 * inch, 'TRAIN TRACKS', size=34)
    centered(PAGE_H - 3.1 * inch, '200 Logic Puzzles for Adults', 'Helvetica', 16)
    centered(PAGE_H - 3.5 * inch, '6x6 and 8x8 Grids', 'Helvetica', 14)
    centered(PAGE_H - 7.5 * inch, author, 'Helvetica', 13)
    newpage()
    # copyright page
    cv.setFont('Helvetica', 9)
    y = PAGE_H - 1 * inch
    for ln in [f'Copyright (c) {2026} {author}. All rights reserved.', '',
               'No part of this book may be reproduced without written permission.',
               'All puzzles in this book were generated and verified by computer:',
               'every puzzle has exactly one solution.']:
        cv.drawString(GUT, y, ln); y -= 14
    newpage()
    # how to play
    centered(PAGE_H - 1 * inch, 'How to Play', size=22)
    rules = ['Every puzzle hides one continuous railway track.',
             '1. The track ENTERS the grid at the short stub on the LEFT edge and LEAVES through the stub on the BOTTOM edge.',
             '2. The numbers outside the grid tell you how many squares in that row or column contain track.',
             '3. The grey squares are already drawn for you. Use them as starting clues.',
             '4. The track moves up, down, left or right. It never crosses or touches itself, and never branches.',
             '5. Every puzzle has exactly one solution. No guessing is needed: logic is enough.',
             'Tips: A row or column whose number is 0 is empty. If a number equals the squares left, fill them all. Squares that cannot be reached by the track can be crossed out. Pencil in the cells you are unsure of.']
    y = PAGE_H - 1.6 * inch
    for r in rules:
        for ln in wrap(r, 'Helvetica', 11, PAGE_W - GUT - OUT):
            cv.setFont('Helvetica', 11); cv.drawString(GUT, y, ln); y -= 15
        y -= 6
    ex = puzzles[0]
    sz = 0.42 * inch
    draw_grid(cv, ex, (PAGE_W - 6 * sz) / 2 - 0.15 * inch, 0.9 * inch, sz)
    newpage()
    # intro to 6x6
    sections = [(6, 'PART 1', '6 x 6 Puzzles'), (8, 'PART 2', '8 x 8 Puzzles')]
    num = 0
    for n, tag, name in sections:
        centered(PAGE_H / 2 + 0.3 * inch, tag, size=16)
        centered(PAGE_H / 2 - 0.2 * inch, name, size=30)
        newpage()
        for P in [p for p in puzzles if p['n'] == n]:
            num += 1
            P['num'] = num
            centered(PAGE_H - 1.0 * inch, f'Puzzle {num}', size=20)
            size = 0.62 * inch if n == 6 else 0.5 * inch
            x0 = (PAGE_W - n * size) / 2 - 0.15 * inch
            y0 = (PAGE_H - n * size) / 2 - 0.4 * inch
            draw_grid(cv, P, x0, y0, size)
            footer(cv, f'{name}', page)
            newpage()
    # solutions
    centered(PAGE_H / 2, 'SOLUTIONS', size=30)
    newpage()
    per_page = 6
    sz = 0.2 * inch
    cols_ = 2
    allp = puzzles
    for i in range(0, len(allp), per_page):
        chunk = allp[i:i + per_page]
        for k, P in enumerate(chunk):
            col, row = k % cols_, k // cols_
            n = P['n']
            bw = n * sz + 0.6 * sz * 2
            x0 = GUT + 0.3 * inch + col * (PAGE_W - GUT - OUT) / 2
            y0 = PAGE_H - 1.5 * inch - row * 2.55 * inch - n * sz
            cv.setFont('Helvetica-Bold', 9); cv.drawString(x0, y0 + n * sz + sz * 1.3, f'Puzzle {P["num"]}')
            draw_grid(cv, P, x0, y0, sz, solution=True, small=True)
        footer(cv, 'Solutions', page)
        newpage()
    cv.save()


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--n6', type=int, default=100)
    ap.add_argument('--n8', type=int, default=100)
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--out', default='train-tracks-interior.pdf')
    ap.add_argument('--json', default='puzzles.json')
    ap.add_argument('--title', default='Train Tracks: 200 Logic Puzzles for Adults')
    ap.add_argument('--author', default='Your Name')
    a = ap.parse_args()
    ps = generate(a.n6, a.n8, a.seed)
    json.dump(ps, open(a.json, 'w'))
    build_pdf(ps, a.out, a.title, a.author)
    print(f'{len(ps)} puzzles -> {a.out}')
