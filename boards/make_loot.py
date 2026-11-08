# Loot rewards: Snowfeather Owlet companion (transparent), Starfall card back, Northern Lights table theme.
import math, io, random, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from make_boards import f, poly, star_pts, sparkle, NOISE, VIGNETTE, out
from make_extra import frame, GOLD
from playwright.sync_api import sync_playwright
from PIL import Image

def owl():  # a round, fluffy snowy owlet with big golden eyes
    d = '''<radialGradient id="b" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e6eef8"/><stop offset="1" stop-color="#b8c8dc"/></radialGradient>
    <radialGradient id="e" cx="40%" cy="38%" r="60%"><stop offset="0" stop-color="#fff6a0"/><stop offset=".55" stop-color="#f0b020"/><stop offset="1" stop-color="#9a5a08"/></radialGradient>
    <radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#bfeaff" stop-opacity=".5"/><stop offset="1" stop-color="#bfeaff" stop-opacity="0"/></radialGradient>'''
    s = '<circle cx="150" cy="160" r="140" fill="url(#aura)"/>'
    # wings
    s += '<path d="M70 170Q40 210 70 250Q95 235 100 200Z" fill="#d0dcec" stroke="#3a4a60" stroke-width="3"/><path d="M230 170Q260 210 230 250Q205 235 200 200Z" fill="#d0dcec" stroke="#3a4a60" stroke-width="3"/>'
    for i in range(3):
        s += f'<path d="M{64+i*8} {205+i*12}q12 4 22 -2" stroke="#8a9ab0" stroke-width="2" fill="none"/><path d="M{236-i*8} {205+i*12}q-12 4 -22 -2" stroke="#8a9ab0" stroke-width="2" fill="none"/>'
    # body and head
    s += '<ellipse cx="150" cy="200" rx="78" ry="80" fill="url(#b)" stroke="#3a4a60" stroke-width="3.5"/>'
    s += '<ellipse cx="150" cy="118" rx="82" ry="68" fill="url(#b)" stroke="#3a4a60" stroke-width="3.5"/>'
    # ear tufts
    s += '<path d="M88 72L76 40L108 62Z" fill="#e6eef8" stroke="#3a4a60" stroke-width="3" stroke-linejoin="round"/><path d="M212 72L224 40L192 62Z" fill="#e6eef8" stroke="#3a4a60" stroke-width="3" stroke-linejoin="round"/>'
    # facial disc and eyes
    for x in (118, 182):
        s += f'<circle cx="{x}" cy="118" r="30" fill="#f4f8ff" stroke="#9aaac0" stroke-width="2"/><circle cx="{x}" cy="118" r="21" fill="url(#e)" stroke="#3a2a08" stroke-width="2.5"/><circle cx="{x}" cy="118" r="10" fill="#160c02"/><circle cx="{x - 6}" cy="111" r="5" fill="#fff"/><circle cx="{x + 5}" cy="124" r="2" fill="#fff" opacity=".8"/>'
    s += '<path d="M150 132L141 146Q150 158 159 146Z" fill="#f0a020" stroke="#5a3a08" stroke-width="2.5" stroke-linejoin="round"/>'
    # chest speckles and feet
    for (x, y) in [(125, 195), (150, 210), (175, 195), (138, 230), (162, 230), (150, 182), (118, 220), (182, 220)]:
        s += f'<path d="M{x - 6} {y}q6 6 12 0" stroke="#9aaac0" stroke-width="2.4" fill="none"/>'
    s += '<path d="M125 276l-8 12M131 278l0 13M137 276l8 12M163 276l-8 12M169 278l0 13M175 276l8 12" stroke="#f0a020" stroke-width="5" stroke-linecap="round"/>'
    # blush and frost sparkles
    s += '<ellipse cx="96" cy="140" rx="10" ry="6" fill="#ffb0c0" opacity=".55"/><ellipse cx="204" cy="140" rx="10" ry="6" fill="#ffb0c0" opacity=".55"/>'
    for (x, y, r) in [(40, 80, 9), (262, 100, 11), (250, 40, 7), (50, 260, 8)]:
        s += f'<polygon points="{poly(star_pts(x, y, 4, r, r * .25))}" fill="#e8f8ff"/>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><defs>{d}</defs>{s}</svg>'

def back_starfall():
    W, H = 400, 560; cx, cy = W / 2, H / 2; random.seed(4)
    d = GOLD + '<radialGradient id="bg" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#3a1a7a"/><stop offset=".55" stop-color="#140a34"/><stop offset="1" stop-color="#05030f"/></radialGradient><radialGradient id="neb" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d070ff" stop-opacity=".45"/><stop offset="1" stop-color="#d070ff" stop-opacity="0"/></radialGradient>'
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/><ellipse cx="{cx}" cy="{cy}" rx="200" ry="170" fill="url(#neb)"/>'
    for _ in range(170):
        b += f'<circle cx="{f(random.random() * W)}" cy="{f(random.random() * H)}" r="{f(random.random() * 1.3 + .3)}" fill="#fff" opacity="{random.random() * .7 + .2:.2f}"/>'
    for i in range(7):  # falling stars
        x, y = 60 + i * 50, 40 + (i * 37) % 160; l = 70 + (i % 3) * 30
        b += f'<path d="M{x},{y}L{x - l * .6},{y - l * .8}" stroke="#e8d8ff" stroke-width="2" stroke-linecap="round" opacity=".7"/>' + sparkle(x, y, 7, '#fff')
    b += f'<circle cx="{cx}" cy="{cy}" r="110" fill="none" stroke="url(#gd)" stroke-width="4"/><circle cx="{cx}" cy="{cy}" r="98" fill="none" stroke="url(#gd)" stroke-width="1.2"/>'
    b += f'<polygon points="{poly(star_pts(cx, cy, 8, 92, 36))}" fill="#1a0a3a" stroke="url(#gd)" stroke-width="2.5"/><polygon points="{poly(star_pts(cx, cy, 4, 74, 16))}" fill="url(#gd)"/>'
    b += f'<circle cx="{cx}" cy="{cy}" r="16" fill="#1a0a3a" stroke="#fff6d0" stroke-width="2"/>' + sparkle(cx, cy, 12, '#fff6ff')
    b += frame(W, H)
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}"><defs>{d}{NOISE}</defs>{b}<rect width="{W}" height="{H}" filter="url(#noise)"/></svg>'

def table_aurora():
    W, H = 1280, 720; random.seed(12)
    d = VIGNETTE + NOISE + '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05081a"/><stop offset=".6" stop-color="#0c1a3a"/><stop offset="1" stop-color="#1a2a4a"/></linearGradient><filter id="bl"><feGaussianBlur stdDeviation="18"/></filter>'
    for i, (c1, c2) in enumerate([('#3affb0', '#2a8aff'), ('#9aff6a', '#3affd0'), ('#d07aff', '#3ab0ff')]):
        d += f'<linearGradient id="a{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c2}" stop-opacity="0"/><stop offset=".5" stop-color="{c1}" stop-opacity=".75"/><stop offset="1" stop-color="{c1}" stop-opacity="0"/></linearGradient>'
    b = f'<rect width="{W}" height="{H}" fill="url(#sky)"/>'
    for _ in range(300):
        b += f'<circle cx="{f(random.random() * W)}" cy="{f(random.random() * H * .7)}" r="{f(random.random() * 1.3 + .2)}" fill="#fff" opacity="{random.random() * .7 + .1:.2f}"/>'
    for i in range(3):  # aurora ribbons
        pts = []
        for x in range(-40, W + 80, 80):
            y = 160 + i * 70 + math.sin(x / 170 + i * 1.7) * 60 + math.sin(x / 61 + i) * 18
            pts.append((x, y))
        top = 'M' + 'L'.join(f'{f(x)},{f(y - 90)}' for x, y in pts); bot = 'L'.join(f'{f(x)},{f(y + 70)}' for x, y in reversed(pts))
        b += f'<path d="{top}L{bot}Z" fill="url(#a{i})" filter="url(#bl)" opacity=".9"/>'
        for x, y in pts[::1]:
            b += f'<path d="M{f(x)},{f(y - 70)}L{f(x)},{f(y + 50)}" stroke="#d8fff0" stroke-opacity=".12" stroke-width="10" filter="url(#bl)"/>'
    # jagged snowy mountains with snow caps, then a pine treeline
    r2 = random.Random(5); pk = [(0, 600)]; x = 0
    while x < W + 60:
        x += r2.randint(60, 130); pk.append((x, r2.randint(420, 560))); x += r2.randint(40, 90); pk.append((x, r2.randint(560, 620)))
    m = 'M0,720L' + 'L'.join(f'{a},{b2}' for a, b2 in pk) + f'L{W},720Z'
    b += f'<path d="{m}" fill="#1c2848"/>'
    for i in range(1, len(pk) - 1, 2):
        (x0, y0), (x1, y1), (x2, y2) = pk[i - 1], pk[i], pk[i + 1]
        cap = [(x1, y1), (x1 + (x0 - x1) * .35, y1 + (y0 - y1) * .35), (x1 + (x0 - x1) * .2, y1 + (y0 - y1) * .42), (x1, y1 + (y0 - y1) * .3), (x1 + (x2 - x1) * .25, y1 + (y2 - y1) * .45), (x1 + (x2 - x1) * .38, y1 + (y2 - y1) * .36)]
        b += f'<polygon points="{poly(cap)}" fill="#dfeaff" opacity=".85"/>'
    for x in range(0, W, 26):
        h = 40 + (x * 13 % 50); y = 720 - (x * 5 % 30)
        b += f'<polygon points="{x},{y} {x + 11},{y - h} {x + 22},{y}" fill="#0a1020"/>'
    # gold frame corners, matching the other tables
    b += f'<rect x="24" y="24" width="{W - 48}" height="{H - 48}" fill="none" stroke="#e8c060" stroke-opacity=".55" stroke-width="2"/>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}"><defs>{d}</defs>{b}<rect width="{W}" height="{H}" filter="url(#noise)"/><rect width="{W}" height="{H}" fill="url(#vig)"/></svg>'

if __name__ == '__main__':
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for name, fn, w, h, transp in [('cos_pet_owl', owl, 300, 300, True), ('cos_back_starfall', back_starfall, 400, 560, False), ('cos_board_aurora', table_aurora, 1280, 720, False)]:
            pg = br.new_page(viewport={'width': w, 'height': h})
            pg.set_content(f'<html><body style="margin:0;background:transparent">{fn()}</body></html>'); pg.wait_for_timeout(200)
            im = Image.open(io.BytesIO(pg.screenshot(omit_background=transp)))
            im = im.convert('RGBA' if transp else 'RGB'); im.save(out / f'{name}.webp', 'WEBP', quality=84, method=6)
            print(name, im.mode, (out / f'{name}.webp').stat().st_size // 1024, 'KB'); pg.close()
        br.close()
