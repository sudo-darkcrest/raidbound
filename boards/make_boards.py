# #49: geometric table themes (playmats), drawn as SVG and rendered to webp with headless Chrome.
# Run: python3 boards/make_boards.py  -> writes gen/cos_board_<id>.webp
import math, random, pathlib, io
from playwright.sync_api import sync_playwright
from PIL import Image

W, H = 1280, 720
CX, CY = W / 2, H / 2
here = pathlib.Path(__file__).parent
out = here.parent / 'gen'

def f(x): return f'{x:.1f}'
def poly(pts): return ' '.join(f'{f(x)},{f(y)}' for x, y in pts)
def star_pts(cx, cy, n, r1, r2, rot=-90):
    pts = []
    for i in range(n * 2):
        a = math.radians(rot + i * 180 / n); r = r1 if i % 2 == 0 else r2
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts
def sparkle(cx, cy, r, col, op=1):
    return f'<polygon points="{poly(star_pts(cx, cy, 4, r, r * .22))}" fill="{col}" opacity="{op}"/>'
VIGNETTE = '<radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".75"/></radialGradient>'
NOISE = '<filter id="noise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/></filter>'
def svg(defs, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs>{VIGNETTE}{NOISE}{defs}</defs>{body}<rect width="{W}" height="{H}" filter="url(#noise)"/><rect width="{W}" height="{H}" fill="url(#vig)"/></svg>'

# ---------- 1. Midnight Lattice: navy with a gold art-deco diamond lattice ----------
def lattice():
    defs = '<radialGradient id="bg" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#1e3266"/><stop offset=".6" stop-color="#0f1a3c"/><stop offset="1" stop-color="#070b1c"/></radialGradient><linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dc95"/><stop offset=".5" stop-color="#c8963c"/><stop offset="1" stop-color="#8a5a1a"/></linearGradient>'
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    s = 80
    g = '<g stroke="url(#gd)" fill="none" opacity=".55">'
    for i in range(-20, 40):
        x = i * s
        g += f'<path d="M{x},0L{x + H},{H}" stroke-width="1.6"/><path d="M{x},0L{x - H},{H}" stroke-width="1.6"/>'
        g += f'<path d="M{x + 8},0L{x + 8 + H},{H}" stroke-width=".6"/><path d="M{x - 8},0L{x - 8 - H},{H}" stroke-width=".6"/>'
    g += '</g>'
    b += g
    # small diamonds + stars at the lattice crossings
    for j in range(-1, int(H / (s / 2)) + 2):
        for i in range(-1, int(W / s) + 2):
            x = i * s + (s / 2 if j % 2 else 0); y = j * s / 2
            b += f'<polygon points="{poly([(x, y - 9), (x + 9, y), (x, y + 9), (x - 9, y)])}" fill="#0b1430" stroke="url(#gd)" stroke-width="1.4" opacity=".9"/>'
            b += f'<circle cx="{f(x)}" cy="{f(y)}" r="2.4" fill="#f6dc95" opacity=".9"/>'
    # central sunburst medallion
    m = '<g opacity=".8">'
    for k in range(48):
        a = math.radians(k * 7.5); r1, r2 = (150, 250) if k % 2 == 0 else (150, 205)
        m += f'<path d="M{f(CX + r1 * math.cos(a))},{f(CY + r1 * math.sin(a))}L{f(CX + r2 * math.cos(a))},{f(CY + r2 * math.sin(a))}" stroke="url(#gd)" stroke-width="{2 if k % 2 == 0 else 1}"/>'
    m += f'<circle cx="{CX}" cy="{CY}" r="150" fill="#0b1430" stroke="url(#gd)" stroke-width="3"/><circle cx="{CX}" cy="{CY}" r="138" fill="none" stroke="url(#gd)" stroke-width="1"/>'
    m += f'<polygon points="{poly(star_pts(CX, CY, 8, 118, 52, -90))}" fill="none" stroke="url(#gd)" stroke-width="2"/>'
    m += f'<polygon points="{poly(star_pts(CX, CY, 8, 118, 52, -67.5))}" fill="none" stroke="url(#gd)" stroke-width="1"/>'
    m += f'<circle cx="{CX}" cy="{CY}" r="34" fill="url(#gd)"/><circle cx="{CX}" cy="{CY}" r="24" fill="#0b1430"/>' + sparkle(CX, CY, 20, '#f6dc95')
    m += '</g>'
    b += m
    # double gold frame
    b += f'<rect x="24" y="24" width="{W - 48}" height="{H - 48}" fill="none" stroke="url(#gd)" stroke-width="3" opacity=".8"/><rect x="34" y="34" width="{W - 68}" height="{H - 68}" fill="none" stroke="url(#gd)" stroke-width="1" opacity=".7"/>'
    return svg(defs, b)

# ---------- 2. Arcane Circle: violet void with a great summoning circle ----------
def arcane():
    random.seed(7)
    defs = '<radialGradient id="bg" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#3a2070"/><stop offset=".5" stop-color="#1a0e3a"/><stop offset="1" stop-color="#08051a"/></radialGradient><radialGradient id="gl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#c8a0ff" stop-opacity=".45"/><stop offset="1" stop-color="#c8a0ff" stop-opacity="0"/></radialGradient><filter id="bl"><feGaussianBlur stdDeviation="3"/></filter>'
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    for _ in range(220):
        x, y, r = random.random() * W, random.random() * H, random.random() * 1.4 + .3
        b += f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="#e8dcff" opacity="{random.random() * .6 + .2:.2f}"/>'
    b += f'<circle cx="{CX}" cy="{CY}" r="330" fill="url(#gl)"/>'
    col = '#d8c0ff'
    def ring():
        c = f'<g stroke="{col}" fill="none">'
        for r, w in [(300, 3), (288, 1), (250, 2), (200, 1.5), (120, 2), (108, 1)]:
            c += f'<circle cx="{CX}" cy="{CY}" r="{r}" stroke-width="{w}"/>'
        # rune ticks between 250 and 288
        for k in range(72):
            a = math.radians(k * 5)
            l1, l2 = (256, 282) if k % 3 == 0 else (262, 276)
            c += f'<path d="M{f(CX + l1 * math.cos(a))},{f(CY + l1 * math.sin(a))}L{f(CX + l2 * math.cos(a))},{f(CY + l2 * math.sin(a))}" stroke-width="{1.6 if k % 3 == 0 else .8}"/>'
        # rune glyphs: little geometric marks on the outer band
        for k in range(24):
            a = math.radians(k * 15 + 7.5); x, y = CX + 294 * math.cos(a), CY + 294 * math.sin(a)
            g = k % 4
            if g == 0: c += f'<circle cx="{f(x)}" cy="{f(y)}" r="4" stroke-width="1.4"/>'
            elif g == 1: c += f'<polygon points="{poly([(x, y - 5), (x + 5, y + 4), (x - 5, y + 4)])}" stroke-width="1.4"/>'
            elif g == 2: c += f'<rect x="{f(x - 4)}" y="{f(y - 4)}" width="8" height="8" transform="rotate(45 {f(x)} {f(y)})" stroke-width="1.4"/>'
            else: c += f'<path d="M{f(x - 5)},{f(y)}L{f(x + 5)},{f(y)}M{f(x)},{f(y - 5)}L{f(x)},{f(y + 5)}" stroke-width="1.4"/>'
        # 12-point star polygon {12/5}
        pts = [(CX + 250 * math.cos(math.radians(-90 + i * 30)), CY + 250 * math.sin(math.radians(-90 + i * 30))) for i in range(12)]
        d = 'M' + 'L'.join(f'{f(pts[(i * 5) % 12][0])},{f(pts[(i * 5) % 12][1])}' for i in range(13))
        c += f'<path d="{d}" stroke-width="1.6"/>'
        # two overlapping squares + hexagram inside
        for rot in (0, 45):
            sq = [(CX + 200 * math.cos(math.radians(rot + 45 + 90 * i)), CY + 200 * math.sin(math.radians(rot + 45 + 90 * i))) for i in range(4)]
            c += f'<polygon points="{poly(sq)}" stroke-width="1.4"/>'
        for rot in (-90, -30):
            tri = [(CX + 120 * math.cos(math.radians(rot + 120 * i)), CY + 120 * math.sin(math.radians(rot + 120 * i))) for i in range(3)]
            c += f'<polygon points="{poly(tri)}" stroke-width="2"/>'
        # small orbiting circles on the 200 ring
        for k in range(8):
            a = math.radians(k * 45 + 22.5); x, y = CX + 200 * math.cos(a), CY + 200 * math.sin(a)
            c += f'<circle cx="{f(x)}" cy="{f(y)}" r="16" stroke-width="1.4" fill="#1a0e3a"/><circle cx="{f(x)}" cy="{f(y)}" r="7" stroke-width="1"/>'
        c += f'<circle cx="{CX}" cy="{CY}" r="40" stroke-width="2"/></g>'
        return c
    b += f'<g filter="url(#bl)" opacity=".8">{ring()}</g>' + f'<g opacity=".9">{ring()}</g>'
    b += sparkle(CX, CY, 34, '#fff0ff') + f'<circle cx="{CX}" cy="{CY}" r="10" fill="#fff"/>'
    # corner moons
    for (x, y) in [(110, 110), (W - 110, 110), (110, H - 110), (W - 110, H - 110)]:
        b += f'<circle cx="{x}" cy="{y}" r="30" fill="none" stroke="{col}" stroke-width="1.4" opacity=".6"/><path d="M{x - 6},{y - 22}A22,22 0 1,0 {x - 6},{y + 22}A16,16 0 1,1 {x - 6},{y - 22}Z" fill="{col}" opacity=".7"/>'
    return svg(defs, b)

# ---------- 3. Hexstone Floor: bevelled slate hexagon tiles ----------
def hexstone():
    random.seed(11)
    defs = '<linearGradient id="hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient><radialGradient id="lamp" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#ffd890" stop-opacity=".22"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></radialGradient>'
    b = f'<rect width="{W}" height="{H}" fill="#1a1c22"/>'
    R = 52; dx = R * math.sqrt(3); dy = R * 1.5
    for row in range(-1, int(H / dy) + 2):
        for col in range(-1, int(W / dx) + 2):
            x = col * dx + (dx / 2 if row % 2 else 0); y = row * dy
            pts = [(x + (R - 3) * math.cos(math.radians(30 + 60 * i)), y + (R - 3) * math.sin(math.radians(30 + 60 * i))) for i in range(6)]
            v = random.randint(-10, 10); base = (78 + v, 84 + v, 98 + v)
            if random.random() < .08: base = (96 + v, 82 + v, 64 + v)  # the odd warm sandstone tile
            c = '#%02x%02x%02x' % base
            b += f'<polygon points="{poly(pts)}" fill="{c}"/><polygon points="{poly(pts)}" fill="url(#hl)"/>'
            inner = [(x + (R - 13) * math.cos(math.radians(30 + 60 * i)), y + (R - 13) * math.sin(math.radians(30 + 60 * i))) for i in range(6)]
            b += f'<polygon points="{poly(inner)}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="1.2"/>'
            if random.random() < .12:  # a crack
                a = random.random() * 6.28; l = R * .7
                b += f'<path d="M{f(x)},{f(y)}l{f(math.cos(a) * l * .5)},{f(math.sin(a) * l * .5)}l{f(math.cos(a + .6) * l * .4)},{f(math.sin(a + .6) * l * .4)}" stroke="#0a0b0e" stroke-width="1.6" fill="none" opacity=".7"/>'
    # inlaid brass compass in the middle
    b += f'<rect width="{W}" height="{H}" fill="url(#lamp)"/>'
    g = '#d8a84a'
    b += f'<circle cx="{CX}" cy="{CY}" r="120" fill="#20222a" stroke="{g}" stroke-width="5"/><circle cx="{CX}" cy="{CY}" r="106" fill="none" stroke="{g}" stroke-width="1.5"/>'
    b += f'<polygon points="{poly(star_pts(CX, CY, 4, 100, 18))}" fill="{g}"/><polygon points="{poly(star_pts(CX, CY, 4, 66, 14, -45))}" fill="#a87a2a"/>'
    for k in range(32):
        a = math.radians(k * 11.25); r1 = 106; r2 = 98 if k % 2 else 92
        b += f'<path d="M{f(CX + r1 * math.cos(a))},{f(CY + r1 * math.sin(a))}L{f(CX + r2 * math.cos(a))},{f(CY + r2 * math.sin(a))}" stroke="{g}" stroke-width="1.5"/>'
    b += f'<circle cx="{CX}" cy="{CY}" r="10" fill="#20222a" stroke="{g}" stroke-width="3"/>'
    return svg(defs, b)

# ---------- 4. Verdant Felt: green baize with a gold knotwork border ----------
def felt():
    defs = '<radialGradient id="bg" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#2e7a48"/><stop offset=".7" stop-color="#16502c"/><stop offset="1" stop-color="#0a2a16"/></radialGradient><filter id="fz"><feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="2"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 .1  0 0 0 0 0  0 0 0 .22 0"/></filter><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc95"/><stop offset="1" stop-color="#b07a2a"/></linearGradient>'
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/><rect width="{W}" height="{H}" filter="url(#fz)"/>'
    # braided border: two sine strands woven along each edge
    def strand(x0, y0, x1, y1, phase):
        L = math.hypot(x1 - x0, y1 - y0); ux, uy = (x1 - x0) / L, (y1 - y0) / L; nx, ny = -uy, ux
        n = int(L / 4); pts = []
        for i in range(n + 1):
            t = i / n; s = math.sin(t * L / 28 * math.pi + phase) * 7
            pts.append((x0 + ux * t * L + nx * s, y0 + uy * t * L + ny * s))
        return 'M' + 'L'.join(f'{f(x)},{f(y)}' for x, y in pts)
    m = 46
    edges = [(m, m, W - m, m), (W - m, m, W - m, H - m), (W - m, H - m, m, H - m), (m, H - m, m, m)]
    for e in edges:
        for ph in (0, math.pi):
            b += f'<path d="{strand(*e, ph)}" stroke="#0a2a16" stroke-width="6" fill="none"/><path d="{strand(*e, ph)}" stroke="url(#gd)" stroke-width="3" fill="none"/>'
    b += f'<rect x="{m - 16}" y="{m - 16}" width="{W - 2 * m + 32}" height="{H - 2 * m + 32}" fill="none" stroke="url(#gd)" stroke-width="2"/><rect x="{m + 16}" y="{m + 16}" width="{W - 2 * m - 32}" height="{H - 2 * m - 32}" fill="none" stroke="url(#gd)" stroke-width="1.2"/>'
    # corner knots: interlaced circles + diamond
    for (x, y) in [(m, m), (W - m, m), (m, H - m), (W - m, H - m)]:
        b += f'<rect x="{x - 26}" y="{y - 26}" width="52" height="52" transform="rotate(45 {x} {y})" fill="#16502c" stroke="url(#gd)" stroke-width="3"/>'
        for (ox, oy) in [(-10, 0), (10, 0), (0, -10), (0, 10)]:
            b += f'<circle cx="{x + ox}" cy="{y + oy}" r="11" fill="none" stroke="url(#gd)" stroke-width="2.2"/>'
        b += f'<circle cx="{x}" cy="{y}" r="4" fill="#f6dc95"/>'
    # faint table compass rose
    b += f'<g opacity=".35"><circle cx="{CX}" cy="{CY}" r="190" fill="none" stroke="#f6dc95" stroke-width="2"/><circle cx="{CX}" cy="{CY}" r="176" fill="none" stroke="#f6dc95" stroke-width=".8"/><polygon points="{poly(star_pts(CX, CY, 8, 170, 40))}" fill="none" stroke="#f6dc95" stroke-width="2"/><polygon points="{poly(star_pts(CX, CY, 4, 170, 30))}" fill="#f6dc95" opacity=".4"/></g>'
    return svg(defs, b)

# ---------- 5. Emberfall Mosaic: radiating sunburst of fire-coloured wedges ----------
def ember():
    random.seed(3)
    defs = '<radialGradient id="core" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff2b0"/><stop offset=".35" stop-color="#ffb040" stop-opacity=".9"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></radialGradient>'
    b = f'<rect width="{W}" height="{H}" fill="#2a0a04"/>'
    cols = ['#7a1a08', '#a8300c', '#5a1006', '#c84a12', '#8a2208']
    # mosaic: rings of trapezoid tiles around the centre
    rings = [(60, 120, 12), (124, 200, 18), (204, 300, 24), (304, 420, 32), (424, 560, 40), (564, 760, 48)]
    for ri, (r1, r2, n) in enumerate(rings):
        off = (ri % 2) * (180 / n)
        for k in range(n):
            a1 = math.radians(off + k * 360 / n + .8); a2 = math.radians(off + (k + 1) * 360 / n - .8)
            pts = [(CX + r1 * math.cos(a1), CY + r1 * math.sin(a1)), (CX + r2 * math.cos(a1), CY + r2 * math.sin(a1)), (CX + r2 * math.cos(a2), CY + r2 * math.sin(a2)), (CX + r1 * math.cos(a2), CY + r1 * math.sin(a2))]
            c = cols[(k + ri) % len(cols)] if random.random() > .12 else '#e8742a'
            b += f'<polygon points="{poly(pts)}" fill="{c}" stroke="#1a0402" stroke-width="3"/>'
    b += f'<circle cx="{CX}" cy="{CY}" r="300" fill="url(#core)" opacity=".75"/>'
    # flame triangles around the frame
    for x in range(0, W + 40, 40):
        h = 26 + (x * 7 % 18)
        b += f'<polygon points="{x - 20},{H} {x},{H - h} {x + 20},{H}" fill="#ff7a2a" opacity=".55"/><polygon points="{x - 20},0 {x},{h} {x + 20},0" fill="#ff7a2a" opacity=".45"/>'
    b += f'<polygon points="{poly(star_pts(CX, CY, 12, 70, 34))}" fill="#fff0b0" opacity=".9"/><circle cx="{CX}" cy="{CY}" r="26" fill="#ffd070"/>'
    for _ in range(90):
        x, y = random.random() * W, random.random() * H
        b += f'<circle cx="{f(x)}" cy="{f(y)}" r="{random.random() * 2 + .6:.1f}" fill="#ffd070" opacity="{random.random() * .7 + .2:.2f}"/>'
    return svg(defs, b)

# ---------- 6. Frostwing Crystal: hexagonal snowflake geometry on ice ----------
def frost():
    random.seed(5)
    defs = '<radialGradient id="bg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#5a9ac8"/><stop offset=".55" stop-color="#1e4a78"/><stop offset="1" stop-color="#0a1a34"/></radialGradient><filter id="bl"><feGaussianBlur stdDeviation="4"/></filter>'
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    # faceted ice: big triangles in a triangular grid with alternating light
    s = 120; h = s * math.sqrt(3) / 2
    for row in range(-1, int(H / h) + 2):
        for col in range(-2, int(W / s) + 2):
            x = col * s + (s / 2 if row % 2 else 0); y = row * h
            for up in (True, False):
                pts = [(x, y + h), (x + s / 2, y), (x + s, y + h)] if up else [(x + s / 2, y), (x + s, y + h), (x + s * 1.5, y)]
                op = random.random() * .09
                b += f'<polygon points="{poly(pts)}" fill="#fff" fill-opacity="{op:.3f}" stroke="#cfefff" stroke-opacity=".12" stroke-width="1"/>'
    def flake(cx, cy, R, w, op):
        g = f'<g stroke="#f0faff" stroke-width="{w}" stroke-linecap="round" fill="none" opacity="{op}">'
        for k in range(6):
            a = math.radians(-90 + k * 60); ex, ey = cx + R * math.cos(a), cy + R * math.sin(a)
            g += f'<path d="M{f(cx)},{f(cy)}L{f(ex)},{f(ey)}"/>'
            for t, bl in [(.35, .28), (.6, .22), (.82, .14)]:
                px, py = cx + R * t * math.cos(a), cy + R * t * math.sin(a)
                for sgn in (-1, 1):
                    b2 = a + sgn * math.radians(60)
                    g += f'<path d="M{f(px)},{f(py)}L{f(px + R * bl * math.cos(b2))},{f(py + R * bl * math.sin(b2))}"/>'
        hexa = [(cx + R * .2 * math.cos(math.radians(30 + 60 * i)), cy + R * .2 * math.sin(math.radians(30 + 60 * i))) for i in range(6)]
        g += f'<polygon points="{poly(hexa)}"/></g>'
        return g
    b += f'<g filter="url(#bl)">{flake(CX, CY, 260, 10, .5)}</g>' + flake(CX, CY, 260, 4, .9)
    b += f'<circle cx="{CX}" cy="{CY}" r="290" fill="none" stroke="#e0f6ff" stroke-width="2" opacity=".5"/><circle cx="{CX}" cy="{CY}" r="300" fill="none" stroke="#e0f6ff" stroke-width="1" opacity=".35"/>'
    for (x, y, r) in [(150, 130, 60), (1130, 140, 70), (180, 590, 54), (1110, 580, 64), (400, 90, 30), (880, 640, 34), (980, 330, 26), (300, 360, 28)]:
        b += flake(x, y, r, 2.4, .55)
    return svg(defs, b)

# ---------- 7. Voidshade Starfield: nebula with geometric constellations and a crescent moon ----------
def void():
    random.seed(9)
    defs = '<radialGradient id="neb1" cx="30%" cy="40%" r="45%"><stop offset="0" stop-color="#8a3aff" stop-opacity=".55"/><stop offset="1" stop-color="#8a3aff" stop-opacity="0"/></radialGradient><radialGradient id="neb2" cx="72%" cy="62%" r="40%"><stop offset="0" stop-color="#ff4ac8" stop-opacity=".35"/><stop offset="1" stop-color="#ff4ac8" stop-opacity="0"/></radialGradient><radialGradient id="moon" cx="40%" cy="40%" r="60%"><stop offset="0" stop-color="#fff8e8"/><stop offset="1" stop-color="#c8b8ff"/></radialGradient>'
    b = f'<rect width="{W}" height="{H}" fill="#07041a"/><rect width="{W}" height="{H}" fill="url(#neb1)"/><rect width="{W}" height="{H}" fill="url(#neb2)"/>'
    for _ in range(420):
        x, y, r = random.random() * W, random.random() * H, random.random() * 1.3 + .2
        b += f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="#fff" opacity="{random.random() * .7 + .15:.2f}"/>'
    cons = [[(140, 160), (230, 120), (320, 170), (290, 260), (190, 250), (140, 160)], [(900, 120), (980, 90), (1060, 140), (1120, 110), (1180, 170)], [(220, 520), (300, 470), (380, 540), (470, 500), (520, 590)], [(860, 520), (930, 600), (1020, 560), (1100, 620), (1020, 660)], [(560, 90), (620, 140), (700, 100)]]
    for c in cons:
        b += f'<polyline points="{poly(c)}" fill="none" stroke="#d8c8ff" stroke-width="1.4" opacity=".55"/>'
        for (x, y) in c: b += sparkle(x, y, 9, '#fff') + f'<circle cx="{x}" cy="{y}" r="2.5" fill="#fff"/>'
    # the crescent moon with geometric rings
    mx, my = CX, CY
    b += f'<circle cx="{mx}" cy="{my}" r="200" fill="none" stroke="#c8b0ff" stroke-width="1.5" opacity=".5"/><circle cx="{mx}" cy="{my}" r="220" fill="none" stroke="#c8b0ff" stroke-width=".8" opacity=".4" stroke-dasharray="4 10"/>'
    for k in range(12):
        a = math.radians(k * 30); x, y = mx + 200 * math.cos(a), my + 200 * math.sin(a)
        b += f'<circle cx="{f(x)}" cy="{f(y)}" r="{6 if k % 3 == 0 else 3}" fill="#e8dcff"/>'
    b += f'<mask id="cres"><rect width="{W}" height="{H}" fill="#000"/><circle cx="{mx}" cy="{my}" r="130" fill="#fff"/><circle cx="{mx + 56}" cy="{my - 30}" r="112" fill="#000"/></mask>'
    b += f'<circle cx="{mx}" cy="{my}" r="150" fill="#b98aff" opacity=".18"/><circle cx="{mx}" cy="{my}" r="130" fill="url(#moon)" mask="url(#cres)"/>'
    b += f'<polygon points="{poly(star_pts(mx + 70, my - 20, 4, 36, 7))}" fill="#fff"/>'
    return svg(defs, b)

BOARDS = {'lattice': lattice, 'arcane': arcane, 'hexstone': hexstone, 'felt': felt, 'emberfall': ember, 'frostwing': frost, 'voidshade': void}

if __name__ == '__main__':
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = br.new_page(viewport={'width': W, 'height': H})
        for k, fn in BOARDS.items():
            s = fn()
            (here / f'{k}.svg').write_text(s)
            pg.set_content(f'<html><body style="margin:0">{s}</body></html>')
            pg.wait_for_timeout(200)
            png = pg.screenshot()
            Image.open(io.BytesIO(png)).convert('RGB').save(out / f'cos_board_{k}.webp', 'WEBP', quality=82, method=6)
            print(k, (out / f'cos_board_{k}.webp').stat().st_size // 1024, 'KB')
        br.close()
