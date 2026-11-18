"""Illustrations for the Zaad planner, drawn as SVG. All scenes use a 148 x 210 canvas (A5 in mm)."""
import math, random

GOLD, GOLD2 = "#e7c873", "#f6e3a8"


def mix(a, b, t):
    a, b = a.lstrip("#"), b.lstrip("#")
    ca = [int(a[i:i + 2], 16) for i in (0, 2, 4)]
    cb = [int(b[i:i + 2], 16) for i in (0, 2, 4)]
    return "#" + "".join(f"{round(x + (y - x) * t):02x}" for x, y in zip(ca, cb))


def shade(c, t):
    return mix(c, "#000000", t)


def tint(c, t):
    return mix(c, "#ffffff", t)


# ---------------------------------------------------------------------------
# Elements
# ---------------------------------------------------------------------------
def stars(seed, n=70, ymax=150, xmax=148):
    r = random.Random(seed)
    out = ""
    for _ in range(n):
        x, y = r.uniform(2, xmax - 2), r.uniform(2, ymax)
        out += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r.choice([.18, .22, .28, .36]):.2f}" fill="{GOLD2}" opacity="{r.uniform(.35, .95):.2f}"/>'
    for _ in range(n // 10):
        x, y, s = r.uniform(6, xmax - 6), r.uniform(6, ymax * .8), r.uniform(.9, 1.7)
        out += (f'<path d="M{x:.1f} {y - s:.1f}Q{x:.1f} {y:.1f} {x + s:.1f} {y:.1f}Q{x:.1f} {y:.1f} {x:.1f} {y + s:.1f}'
                f'Q{x:.1f} {y:.1f} {x - s:.1f} {y:.1f}Q{x:.1f} {y:.1f} {x:.1f} {y - s:.1f}Z" fill="{GOLD2}" opacity=".9"/>')
    return out


def crescent(cx, cy, R, fill=GOLD, rot=-25, thin=.78):
    a = math.radians(62)
    x, y1, y2 = R * math.cos(a), -R * math.sin(a), R * math.sin(a)
    r = R * thin
    return (f'<path transform="translate({cx} {cy}) rotate({rot})" d="M{x:.2f} {y1:.2f}A{R} {R} 0 1 0 {x:.2f} {y2:.2f}'
            f'A{r:.2f} {r:.2f} 0 1 1 {x:.2f} {y1:.2f}Z" fill="{fill}"/>')


def glow(cx, cy, r, color=GOLD, op=.5, gid="g"):
    return (f'<radialGradient id="{gid}"><stop offset="0" stop-color="{color}" stop-opacity="{op}"/>'
            f'<stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{gid})"/>')


def dune(y, amp, fill, seed=1, w=148, bottom=210):
    r = random.Random(seed)
    pts = [(x, y + r.uniform(-amp, amp)) for x in range(-10, w + 31, 26)]
    d = f"M{pts[0][0]} {pts[0][1]:.1f}"
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        mx = (x0 + x1) / 2
        d += f"C{mx:.1f} {y0:.1f} {mx:.1f} {y1:.1f} {x1} {y1:.1f}"
    return f'<path d="{d}V{bottom}H-10Z" fill="{fill}"/>'


def mountains(y, h, fill, seed=1, n=6, snow=None):
    r = random.Random(seed)
    xs = sorted(r.uniform(-10, 158) for _ in range(n))
    out = ""
    for x in xs:
        hh, w = h * r.uniform(.55, 1), h * r.uniform(.9, 1.5)
        out += f'<path d="M{x - w:.1f} {y}L{x:.1f} {y - hh:.1f}L{x + w:.1f} {y}Z" fill="{fill}"/>'
        if snow:
            k = .26
            out += (f'<path d="M{x - w * k:.1f} {y - hh * (1 - k):.1f}L{x:.1f} {y - hh:.1f}L{x + w * k:.1f} {y - hh * (1 - k):.1f}'
                    f'L{x + w * k * .4:.1f} {y - hh * (1 - k * 1.25):.1f}L{x:.1f} {y - hh * (1 - k * .8):.1f}L{x - w * k * .5:.1f} {y - hh * (1 - k * 1.3):.1f}Z" fill="{snow}"/>')
    return out + f'<rect x="-10" y="{y - .2}" width="170" height="{210 - y + 1}" fill="{fill}"/>'


def dome(cx, base, w, h, fill):
    return (f'<path d="M{cx - w:.2f} {base}C{cx - w * 1.18:.2f} {base - h * .55:.2f} {cx - w * .5:.2f} {base - h * .86:.2f} {cx} {base - h * 1.16:.2f}'
            f'C{cx + w * .5:.2f} {base - h * .86:.2f} {cx + w * 1.18:.2f} {base - h * .55:.2f} {cx + w:.2f} {base}Z" fill="{fill}"/>')


def arch(cx, base, w, h, fill):
    return (f'<path d="M{cx - w / 2:.2f} {base}V{base - h * .55:.2f}Q{cx - w / 2:.2f} {base - h * .9:.2f} {cx} {base - h:.2f}'
            f'Q{cx + w / 2:.2f} {base - h * .9:.2f} {cx + w / 2:.2f} {base - h * .55:.2f}V{base}Z" fill="{fill}"/>')


def finial(cx, y, s, color=GOLD):
    return (f'<path d="M{cx} {y}v{-2.6 * s:.2f}" stroke="{color}" stroke-width="{.28 * s:.2f}"/>'
            + crescent(cx, y - 3.4 * s, .95 * s, color, rot=-90))


def minaret(cx, base, s, fill, h=34, light=None):
    w = 2.6 * s
    out = f'<rect x="{cx - w / 2:.2f}" y="{base - h * s:.2f}" width="{w:.2f}" height="{h * s:.2f}" fill="{fill}"/>'
    for k in (.62, .86):
        out += f'<rect x="{cx - w * .9:.2f}" y="{base - h * s * k:.2f}" width="{w * 1.8:.2f}" height="{1.1 * s:.2f}" rx="{.3 * s:.2f}" fill="{fill}"/>'
    top = base - h * s
    out += f'<path d="M{cx - w * .6:.2f} {top}Q{cx - w * .55:.2f} {top - 3 * s:.2f} {cx} {top - 6 * s:.2f}Q{cx + w * .55:.2f} {top - 3 * s:.2f} {cx + w * .6:.2f} {top}Z" fill="{fill}"/>'
    out += finial(cx, top - 5.6 * s, s * .8)
    if light:
        out += arch(cx, base - h * s * .66, w * .5, 2.6 * s, light) + arch(cx, base - h * s * .9, w * .5, 2.2 * s, light)
    return out


def mosque(cx, base, s, fill, light=None, minarets=2, mh=34, dome_fill=None):
    df = dome_fill or fill
    out = ""
    if minarets:
        offs = {2: (-19, 19), 4: (-27, -19, 19, 27), 1: (19,)}[minarets]
        for i, o in enumerate(offs):
            hh = mh * (.8 if minarets == 4 and abs(o) > 20 else 1)
            out += minaret(cx + o * s, base, s, fill, hh, light)
    out += f'<rect x="{cx - 15 * s:.2f}" y="{base - 13 * s:.2f}" width="{30 * s:.2f}" height="{13 * s:.2f}" fill="{fill}"/>'
    out += f'<rect x="{cx - 9.6 * s:.2f}" y="{base - 15.5 * s:.2f}" width="{19.2 * s:.2f}" height="{2.6 * s:.2f}" fill="{fill}"/>'
    out += dome(cx, base - 15.4 * s, 8.6 * s, 10 * s, df) + finial(cx, base - 26.6 * s, s)
    for o in (-12, 12):
        out += dome(cx + o * s, base - 13 * s, 2.7 * s, 3 * s, df)
    if light:
        out += arch(cx, base, 5 * s, 9 * s, light)
        for o in (-11, -6.3, 6.3, 11):
            out += arch(cx + o * s, base - 3 * s, 2.4 * s, 5.4 * s, light)
    return out


def skyline(base, fill, seed=3, light=None, w=148):
    """A row of small houses, domes and minarets."""
    r = random.Random(seed)
    out, x = "", -4.0
    while x < w + 4:
        bw, bh = r.uniform(5, 11), r.uniform(5, 13)
        out += f'<rect x="{x:.1f}" y="{base - bh:.1f}" width="{bw + .3:.1f}" height="{bh + .2:.1f}" fill="{fill}"/>'
        k = r.random()
        if k < .3:
            out += dome(x + bw / 2, base - bh, bw * .36, bw * .4, fill)
        elif k < .42:
            out += minaret(x + bw / 2, base - bh, .42, fill, r.uniform(20, 30))
        if light and r.random() < .75:
            for wx in (x + bw * .3, x + bw * .7):
                if r.random() < .7:
                    out += arch(wx, base - bh * r.uniform(.25, .55), 1.1, 2.2, light)
        x += bw
    return out


def palm(x, y, h, fill, lean=3, seed=1):
    r = random.Random(seed)
    tx, ty = x + lean, y - h
    out = (f'<path d="M{x - h * .03:.2f} {y}Q{x + lean * .1:.2f} {y - h * .55:.2f} {tx - h * .016:.2f} {ty:.2f}L{tx + h * .016:.2f} {ty:.2f}'
           f'Q{x + lean * .35 + h * .03:.2f} {y - h * .5:.2f} {x + h * .035:.2f} {y}Z" fill="{fill}"/>')
    for ang in (-168, -140, -112, -86, -62, -36, -10):
        L = h * r.uniform(.42, .56)
        droop = L * .42
        out += (f'<path transform="translate({tx:.2f} {ty:.2f}) rotate({ang + r.uniform(-5, 5):.1f})" '
                f'd="M0 0Q{L * .5:.2f} {-droop * .9:.2f} {L:.2f} {droop * .45:.2f}Q{L * .5:.2f} {-droop * .25:.2f} 0 0Z" fill="{fill}"/>')
    return out + f'<circle cx="{tx:.2f}" cy="{ty + h * .02:.2f}" r="{h * .035:.2f}" fill="{fill}"/>'


def lantern(x, top, drop, s, body, glowc=GOLD, gid="l"):
    y = top + drop
    out = f'<path d="M{x} {top}V{y}" stroke="{GOLD}" stroke-width=".25" opacity=".8"/>'
    out += glow(x, y + 7.5 * s, 13 * s, glowc, .55, gid)
    out += f'<path d="M{x - 1.2 * s:.2f} {y}h{2.4 * s:.2f}l{1.6 * s:.2f} {2.6 * s:.2f}h{-5.6 * s:.2f}Z" fill="{GOLD}"/>'
    out += dome(x, y + .2, 1.5 * s, 1.5 * s, GOLD)
    out += (f'<path d="M{x - 2.8 * s:.2f} {y + 2.6 * s:.2f}h{5.6 * s:.2f}l{1.4 * s:.2f} {5 * s:.2f}l{-2.2 * s:.2f} {5.2 * s:.2f}h{-4 * s:.2f}'
            f'l{-2.2 * s:.2f} {-5.2 * s:.2f}Z" fill="{body}" stroke="{GOLD}" stroke-width="{.3 * s:.2f}"/>')
    out += arch(x, y + 11.6 * s, 3.2 * s, 7.4 * s, GOLD2)
    out += f'<path d="M{x} {y + 2.6 * s:.2f}v{10.2 * s:.2f}" stroke="{GOLD}" stroke-width="{.22 * s:.2f}"/>'
    out += f'<path d="M{x - 2.4 * s:.2f} {y + 12.8 * s:.2f}h{4.8 * s:.2f}l{-1 * s:.2f} {1.6 * s:.2f}h{-2.8 * s:.2f}Z" fill="{GOLD}"/>'
    out += f'<circle cx="{x}" cy="{y + 15.6 * s:.2f}" r="{.55 * s:.2f}" fill="{GOLD}"/>'
    return out


def kaaba(cx, base, s):
    w, h = 26 * s, 28 * s
    x, y = cx - w / 2, base - h
    out = f'<path d="M{x:.2f} {base}V{y:.2f}H{x + w:.2f}V{base}Z" fill="#14110d"/>'
    out += f'<path d="M{x + w:.2f} {base}V{y:.2f}l{7 * s:.2f} {-3.4 * s:.2f}V{base - 3 * s:.2f}Z" fill="#0a0907"/>'
    out += f'<path d="M{x:.2f} {y:.2f}l{7 * s:.2f} {-3.4 * s:.2f}h{w:.2f}l{-7 * s:.2f} {3.4 * s:.2f}Z" fill="#221d16"/>'
    out += f'<rect x="{x:.2f}" y="{y + 6 * s:.2f}" width="{w:.2f}" height="{3.2 * s:.2f}" fill="{GOLD}"/>'
    out += f'<path d="M{x + w:.2f} {y + 6 * s:.2f}l{7 * s:.2f} {-3.4 * s:.2f}v{3.2 * s:.2f}l{-7 * s:.2f} {3.4 * s:.2f}Z" fill="#b8913f"/>'
    for i in range(7):
        out += f'<rect x="{x + (1.6 + i * 3.4) * s:.2f}" y="{y + 6.9 * s:.2f}" width="{2.2 * s:.2f}" height="{1.4 * s:.2f}" fill="#14110d" opacity=".55"/>'
    out += f'<rect x="{x + w * .58:.2f}" y="{base - 12 * s:.2f}" width="{6 * s:.2f}" height="{10.5 * s:.2f}" fill="{GOLD}"/>'
    out += f'<rect x="{x + w * .58 + .7 * s:.2f}" y="{base - 11.3 * s:.2f}" width="{4.6 * s:.2f}" height="{9.1 * s:.2f}" fill="none" stroke="#14110d" stroke-width="{.25 * s:.2f}" opacity=".6"/>'
    return out


def birds(seed, n, x0, y0, x1, y1, color, size=2.4):
    r = random.Random(seed)
    out = ""
    for _ in range(n):
        x, y, s = r.uniform(x0, x1), r.uniform(y0, y1), size * r.uniform(.55, 1.2)
        out += (f'<path d="M{x - s:.1f} {y + s * .1:.1f}Q{x - s * .5:.1f} {y - s * .6:.1f} {x:.1f} {y:.1f}Q{x + s * .5:.1f} {y - s * .75:.1f} {x + s * 1.1:.1f} {y - s * .1:.1f}" '
                f'fill="none" stroke="{color}" stroke-width="{s * .16:.2f}" stroke-linecap="round"/>')
    return out


def waves(y, fill, seed, amp=1.6, step=9):
    r = random.Random(seed)
    d = f"M-10 {y}"
    x = -10
    while x < 160:
        d += f"q{step / 2} {-amp * r.uniform(.6, 1.3):.2f} {step} 0"
        x += step
    return f'<path d="{d}V210H-10Z" fill="{fill}"/>'


def book(cx, base, s, page, edge, stand):
    out = (f'<path d="M{cx - 9 * s:.2f} {base}L{cx + 7 * s:.2f} {base - 15 * s:.2f}M{cx + 9 * s:.2f} {base}L{cx - 7 * s:.2f} {base - 15 * s:.2f}" '
           f'stroke="{stand}" stroke-width="{1.5 * s:.2f}" stroke-linecap="round"/>')
    y = base - 12 * s
    for sign in (-1, 1):
        out += (f'<path d="M{cx} {y:.2f}C{cx + sign * 5 * s:.2f} {y - 5 * s:.2f} {cx + sign * 12 * s:.2f} {y - 5.5 * s:.2f} {cx + sign * 17 * s:.2f} {y - 3 * s:.2f}'
                f'L{cx + sign * 17 * s:.2f} {y - 14 * s:.2f}C{cx + sign * 12 * s:.2f} {y - 16.5 * s:.2f} {cx + sign * 5 * s:.2f} {y - 16 * s:.2f} {cx} {y - 11 * s:.2f}Z" fill="{page}" stroke="{edge}" stroke-width="{.35 * s:.2f}"/>')
        for k in range(4):
            yy = y - (5.2 + k * 2.2) * s
            out += (f'<path d="M{cx + sign * 2.4 * s:.2f} {yy + 1.3 * s:.2f}Q{cx + sign * 8 * s:.2f} {yy - 2.2 * s:.2f} {cx + sign * 14.6 * s:.2f} {yy - .6 * s:.2f}" '
                    f'fill="none" stroke="{edge}" stroke-width="{.3 * s:.2f}" opacity=".7"/>')
    return out


def tree(cx, base, s, trunk, leaf, leaf2, seed=4):
    r = random.Random(seed)
    out = (f'<path d="M{cx - 2.2 * s:.2f} {base}C{cx - 1.2 * s:.2f} {base - 8 * s:.2f} {cx - 2.4 * s:.2f} {base - 12 * s:.2f} {cx - 6 * s:.2f} {base - 18 * s:.2f}'
           f'L{cx - 4.6 * s:.2f} {base - 18.6 * s:.2f}C{cx - 1.6 * s:.2f} {base - 14 * s:.2f} {cx - .4 * s:.2f} {base - 14 * s:.2f} {cx} {base - 20 * s:.2f}'
           f'L{cx + 1.4 * s:.2f} {base - 20 * s:.2f}C{cx + 1 * s:.2f} {base - 14 * s:.2f} {cx + 2.6 * s:.2f} {base - 13 * s:.2f} {cx + 6.4 * s:.2f} {base - 17 * s:.2f}'
           f'L{cx + 7.2 * s:.2f} {base - 16 * s:.2f}C{cx + 3 * s:.2f} {base - 11 * s:.2f} {cx + 2 * s:.2f} {base - 7 * s:.2f} {cx + 2.8 * s:.2f} {base}Z" fill="{trunk}"/>')
    for i in range(46):
        a, d = r.uniform(0, math.tau), r.uniform(0, 1) ** .6
        x, y = cx + math.cos(a) * d * 15 * s, base - 24 * s + math.sin(a) * d * 9.5 * s
        out += f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r.uniform(2.4, 4.4) * s:.2f}" fill="{leaf if i % 3 else leaf2}"/>'
    return out


def beads(cx, cy, rx, ry, n, color, color2):
    out = ""
    for i in range(n):
        a = math.tau * i / n + math.pi / 2
        x, y = cx + rx * math.cos(a), cy + ry * math.sin(a)
        big = i % 11 == 0
        out += f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{1.5 if big else 1.05}" fill="{color2 if big else color}"/>'
    y = cy + ry
    out += f'<circle cx="{cx}" cy="{y + 2.6:.2f}" r="1.7" fill="{color2}"/><path d="M{cx} {y + 4.2:.2f}v3" stroke="{color2}" stroke-width=".5"/>'
    for dx in (-1.6, -.8, 0, .8, 1.6):
        out += f'<path d="M{cx} {y + 7:.2f}q{dx * .6:.2f} 4 {dx:.2f} 9" fill="none" stroke="{color2}" stroke-width=".35"/>'
    return out


def scales(cx, base, s, color):
    top = base - 34 * s
    out = f'<path d="M{cx} {base}V{top:.2f}" stroke="{color}" stroke-width="{1.1 * s:.2f}"/>'
    out += f'<path d="M{cx - 7 * s:.2f} {base}h{14 * s:.2f}l{-2.5 * s:.2f} {-2.6 * s:.2f}h{-9 * s:.2f}Z" fill="{color}"/>'
    out += f'<path d="M{cx - 20 * s:.2f} {top + 2.5 * s:.2f}Q{cx} {top - 2.5 * s:.2f} {cx + 20 * s:.2f} {top + 2.5 * s:.2f}" fill="none" stroke="{color}" stroke-width="{1 * s:.2f}" stroke-linecap="round"/>'
    out += f'<circle cx="{cx}" cy="{top - .6 * s:.2f}" r="{1.9 * s:.2f}" fill="{color}"/>'
    for sign in (-1, 1):
        px, py = cx + sign * 20 * s, top + 2.5 * s
        out += (f'<path d="M{px:.2f} {py:.2f}l{-6 * s:.2f} {14 * s:.2f}M{px:.2f} {py:.2f}l{6 * s:.2f} {14 * s:.2f}" stroke="{color}" stroke-width="{.3 * s:.2f}"/>'
                f'<path d="M{px - 7.4 * s:.2f} {py + 14 * s:.2f}h{14.8 * s:.2f}q{-1.4 * s:.2f} {5 * s:.2f} {-7.4 * s:.2f} {5 * s:.2f}t{-7.4 * s:.2f} {-5 * s:.2f}Z" fill="{color}"/>')
    return out


def rays(cx, cy, r0, r1, n, color, op=.22, spread=180, start=180):
    out = ""
    for i in range(n):
        a = math.radians(start + spread * (i + .5) / n)
        w = math.radians(spread / n * .28)
        p = [(cx + r0 * math.cos(a - w), cy + r0 * math.sin(a - w)), (cx + r1 * math.cos(a - w * 1.6), cy + r1 * math.sin(a - w * 1.6)),
             (cx + r1 * math.cos(a + w * 1.6), cy + r1 * math.sin(a + w * 1.6)), (cx + r0 * math.cos(a + w), cy + r0 * math.sin(a + w))]
        out += '<path d="M' + "L".join(f"{x:.1f} {y:.1f}" for x, y in p) + f'Z" fill="{color}" opacity="{op}"/>'
    return out


def sky(stops, gid="sky"):
    st = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">{st}</linearGradient><rect width="148" height="210" fill="url(#{gid})"/>'


def girih(color, op=.16, sw=.25, size=13, pid="p8"):
    """Eight-pointed star tiling."""
    k = size / 40
    return (f'<pattern id="{pid}" width="{size}" height="{size}" patternUnits="userSpaceOnUse"><g transform="scale({k})" fill="none" '
            f'stroke="{color}" stroke-width="{sw / k:.2f}" opacity="{op}"><rect x="8.3" y="8.3" width="23.4" height="23.4"/>'
            f'<rect x="8.3" y="8.3" width="23.4" height="23.4" transform="rotate(45 20 20)"/>'
            f'<path d="M0 20h3.4M36.6 20H40M20 0v3.4M20 36.6V40M0 0l8.3 8.3M40 0l-8.3 8.3M0 40l8.3-8.3M40 40l-8.3-8.3"/>'
            f'<circle cx="20" cy="20" r="5.2"/></g></pattern>')


_UID = [0]


def wrap(body, cls="art"):
    """Wrap a scene, giving its gradient and pattern ids a unique prefix (all pages share one HTML document)."""
    import re
    _UID[0] += 1
    u = f"a{_UID[0]}"
    body = re.sub(r'id="([^"]+)"', lambda m: f'id="{u}{m.group(1)}"', body)
    body = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{u}{m.group(1)})", body)
    return f'<svg class="{cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 148 210" preserveAspectRatio="xMidYMid slice">{body}</svg>'


# ---------------------------------------------------------------------------
# Month scenes
# ---------------------------------------------------------------------------
def scene(m, ac):
    d1, d2, d3 = shade(ac, .72), shade(ac, .5), shade(ac, .3)
    night = sky([(0, shade(ac, .78)), (.55, shade(ac, .5)), (1, shade(ac, .2))])
    lit = "#f3cf7a"
    if m == 1:  # dawn
        b = sky([(0, shade(ac, .7)), (.45, shade(ac, .35)), (.68, "#c98d55"), (.8, "#f0c987")])
        b += stars(11, 40, 80) + glow(74, 168, 62, "#fff1c4", .85, "sun") + rays(74, 168, 22, 190, 13, "#fff1c4", .09)
        b += f'<circle cx="74" cy="168" r="15" fill="#fff3cf"/>'
        b += birds(5, 7, 20, 96, 128, 132, shade(ac, .6))
        b += dune(166, 3, shade(ac, .45), 2) + mosque(110, 168, .52, shade(ac, .62), lit, 2, 30)
        b += dune(178, 4, shade(ac, .6), 3) + palm(26, 186, 30, shade(ac, .75), 4, 2) + palm(37, 188, 21, shade(ac, .75), -3, 5)
        b += dune(192, 4, shade(ac, .78), 6)
    elif m == 2:  # Ramadan lanterns
        b = night + stars(21, 80, 150) + glow(74, 121, 34, GOLD, .22, "mg") + crescent(74, 121, 12.5)
        for i, (x, dr, s) in enumerate([(13, 26, .95), (30, 9, .7), (118, 12, .7), (135, 32, .95)]):
            b += lantern(x, 0, dr, s, shade(ac, .35), GOLD, f"l{i}")
        b += skyline(178, d3, 4, lit) + mosque(74, 186, .95, d2, lit, 4, 44) + skyline(196, d1, 9, lit)
        b += f'<rect y="195.8" width="148" height="15" fill="{d1}"/>'
    elif m == 3:  # palms, new crescent
        b = sky([(0, shade(ac, .75)), (.6, shade(ac, .4)), (1, tint(ac, .25))])
        b += stars(31, 60, 140) + crescent(104, 126, 9, GOLD, -35, .9)
        b += dune(170, 4, shade(ac, .35), 7) + palm(112, 176, 26, shade(ac, .5), -3, 1) + palm(124, 178, 34, shade(ac, .5), 4, 2)
        b += dune(180, 5, shade(ac, .55), 8) + palm(22, 190, 46, shade(ac, .78), 6, 3) + palm(40, 192, 32, shade(ac, .78), -4, 4) + palm(8, 192, 26, shade(ac, .78), -2, 6)
        b += dune(194, 4, shade(ac, .8), 9)
    elif m == 4:  # mountains
        b = sky([(0, shade(ac, .78)), (.6, shade(ac, .45)), (1, tint(ac, .2))])
        b += stars(41, 70, 130) + crescent(34, 124, 8) + glow(34, 124, 24, GOLD, .2, "mg")
        b += mountains(176, 46, shade(ac, .3), 3, 5, tint(ac, .75)) + mountains(186, 34, shade(ac, .52), 8, 6)
        b += mosque(96, 190, .4, shade(ac, .78), lit, 1, 32) + mountains(200, 18, shade(ac, .8), 5, 7)
    elif m == 5:  # the Kaaba
        b = night + stars(51, 80, 150) + crescent(118, 122, 7)
        for x, hh in ((16, 58), (40, 50), (108, 50), (132, 58)):
            b += minaret(x, 190, 1.05, d3, hh / 1.05, lit)
        b += f'<rect y="168" width="148" height="42" fill="{d3}"/>'
        for i in range(13):
            b += arch(8 + i * 11, 182, 6.4, 11, shade(ac, .62))
        b += f'<rect y="182" width="148" height="28" fill="{tint(ac, .82)}"/><ellipse cx="74" cy="197" rx="62" ry="6.5" fill="{tint(ac, .65)}"/>'
        b += glow(74, 176, 44, "#ffffff", .3, "kg") + kaaba(71, 198, 1.02)
    elif m == 6:  # hijrah: the road through the desert
        b = sky([(0, shade(ac, .8)), (.6, shade(ac, .5)), (1, shade(ac, .15))])
        b += stars(61, 90, 150) + crescent(112, 120, 6.5, GOLD, -30, .92)
        b += dune(166, 3, d3, 4) + mosque(104, 170, .6, shade(ac, .55), lit, 2, 32, "#2f7d5b") + palm(80, 171, 19, shade(ac, .55), 2, 1) + palm(128, 171, 15, shade(ac, .55), -2, 3)
        b += dune(178, 5, d2, 12)
        b += f'<path d="M20 210C42 196 58 190 72 184S92 174 98 170" fill="none" stroke="{GOLD}" stroke-width=".7" stroke-dasharray=".2 2.6" stroke-linecap="round" opacity=".9"/>'
        b += dune(196, 4, d1, 14)
    elif m == 7:  # birds at morning over the sea
        b = sky([(0, shade(ac, .6)), (.5, tint(ac, .15)), (.72, "#f2d9a0"), (.78, "#f6e6bd")])
        b += glow(98, 160, 50, "#fff6d8", .9, "sun") + '<circle cx="98" cy="160" r="11" fill="#fff6d8"/>'
        b += birds(7, 16, 14, 100, 120, 148, shade(ac, .7), 3.2)
        b += waves(164, tint(ac, .15), 1) + waves(172, shade(ac, .15), 2, 2) + waves(182, shade(ac, .4), 3, 2.4, 12) + waves(194, shade(ac, .62), 4, 2.6, 14)
    elif m == 8:  # the Prophet's city
        b = sky([(0, shade(ac, .78)), (.6, shade(ac, .5)), (1, tint(ac, .1))])
        b += stars(81, 70, 140) + crescent(26, 118, 7)
        b += skyline(176, shade(ac, .42), 6, lit)
        for x in (10, 34, 114, 138):
            b += minaret(x, 192, 1.1, shade(ac, .62), 52, lit)
        b += mosque(74, 192, 1.1, shade(ac, .62), lit, 0, 0, "#2f7d5b")
        b += f'<rect y="191.8" width="148" height="20" fill="{shade(ac, .8)}"/>' + palm(52, 196, 20, shade(ac, .82), 2, 1) + palm(98, 196, 22, shade(ac, .82), -2, 4)
    elif m == 9:  # the open book
        b = night + stars(91, 80, 150) + glow(74, 150, 60, "#fff1c4", .5, "bg") + rays(74, 160, 16, 190, 15, "#fff1c4", .07)
        b += dune(186, 2, d2, 2) + book(74, 190, 1.75, "#fbf3dc", "#b8913f", shade(ac, .82)) + dune(200, 2, d1, 5)
    elif m == 10:  # the tree
        b = sky([(0, shade(ac, .78)), (.6, shade(ac, .48)), (1, tint(ac, .18))])
        b += stars(101, 70, 140) + crescent(116, 120, 7.5)
        b += dune(180, 4, shade(ac, .4), 3) + f'<ellipse cx="62" cy="200" rx="70" ry="16" fill="{shade(ac, .6)}"/>'
        b += tree(62, 188, 1.7, shade(ac, .82), shade(ac, .2), tint(ac, .25), 4) + dune(200, 3, shade(ac, .8), 8)
    elif m == 11:  # remembrance
        b = night + stars(111, 90, 160) + crescent(74, 152, 13) + glow(74, 152, 36, GOLD, .18, "mg")
        b += beads(74, 153, 31, 31, 33, tint(ac, .55), GOLD) + dune(203, 2, d1, 3)
    else:  # the scales
        b = sky([(0, "#15120d"), (.6, shade(ac, .45)), (1, shade(ac, .1))])
        b += stars(121, 100, 160) + glow(74, 150, 50, GOLD, .16, "mg")
        b += dune(194, 3, shade(ac, .6), 2) + scales(74, 195, 1.25, GOLD) + dune(202, 2, shade(ac, .8), 3)
    return wrap(f"<defs>{girih(GOLD, .1)}</defs>" + b + '<rect width="148" height="112" fill="url(#p8)"/>')


def cover_art():
    ac = "#0f5a4f"
    b = sky([(0, "#041f1c"), (.5, "#0b3f38"), (1, "#14675b")])
    b += f"<defs>{girih(GOLD, .16)}</defs><rect width='148' height='210' fill='url(#p8)'/>"
    b += stars(7, 90, 120)
    b += skyline(190, "#082b27", 5, "#f3cf7a") + mosque(22, 198, .7, "#06231f", "#f3cf7a", 2, 36) + mosque(124, 198, .78, "#06231f", "#f3cf7a", 2, 38)
    b += skyline(202, "#041916", 12, "#f3cf7a") + '<rect y="201.8" width="148" height="9" fill="#041916"/>'
    return wrap(b)


# ---------------------------------------------------------------------------
# Small icons (24 x 24), stroke = currentColor
# ---------------------------------------------------------------------------
def _ico(body):
    return f'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{body}</svg>'


ICON = {
    "fajr": _ico('<path d="M2 19h20M6 19a6 6 0 0 1 12 0M12 5v3M4.6 9.6l2 2M19.4 9.6l-2 2"/>'),
    "dhuhr": _ico('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>'),
    "asr": _ico('<circle cx="14.5" cy="9.5" r="3.6"/><path d="M14.5 2.6v1.8M21.4 9.5h-1.8M19.4 4.6l-1.3 1.3M9.6 4.6l1.3 1.3M3 20h18M5 16.5h9"/>'),
    "maghrib": _ico('<path d="M2 16h20M7 16a5 5 0 0 1 10 0M5 20h14M12 4v5M9.5 6.8L12 9.3l2.5-2.5"/>'),
    "isha": _ico('<path d="M19 14.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 8.5 10.500z"/><path d="M17.5 4.2v2.6M16.200 5.500h2.600"/>'),
    "drop": '<svg class="ico drop" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3s6.500 7 6.500 11.500a6.500 6.500 0 0 1-13 0C5.500 10 12 3 12 3z"/></svg>',
    "heart": '<svg class="ico drop" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 20.500S3.500 15.500 3.500 9.300A4.600 4.600 0 0 1 12 6.800a4.600 4.600 0 0 1 8.500 2.500C20.500 15.500 12 20.500 12 20.500z"/></svg>',
}
