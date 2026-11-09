# #94: six special card backs from the new loot cards. Drawn in code until the user paints them in Gemini.
#   Phoenix Ascendant, Wyrm's Eye, Moonlit Unicorn, Celestial Orrery, First King's Crown, Stormwing
# usage: python3 boards/make_backs3.py   -> gen/cos_back_<id>.webp (skips any listed as painted in gemini/in_game.json)
import math, io, json, random, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from make_boards import f, poly, star_pts, NOISE, out
from make_extra import frame, GOLD
from playwright.sync_api import sync_playwright
from PIL import Image

W, H = 400, 560; CX, CY = W / 2, H / 2
SILVER = '<linearGradient id="sv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c8d4e8"/><stop offset=".8" stop-color="#8a9ab8"/><stop offset="1" stop-color="#e8f0ff"/></linearGradient>'
GLOW = '<filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>'


def wrap(defs, body, col='url(#gd)'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}"><defs>{GOLD}{SILVER}{GLOW}{NOISE}{defs}</defs>{body}{frame(W, H, col)}<rect width="{W}" height="{H}" filter="url(#noise)"/></svg>'


def bg(c1, c2, c3, id='bg', cy='45%'):
    return f'<radialGradient id="{id}" cx="50%" cy="{cy}" r="80%"><stop offset="0" stop-color="{c1}"/><stop offset=".6" stop-color="{c2}"/><stop offset="1" stop-color="{c3}"/></radialGradient>'


def stars(r, n, col='#fff', area=(40, 40, W - 40, H - 40)):
    s = ''
    for _ in range(n):
        x = r.uniform(area[0], area[2]); y = r.uniform(area[1], area[3]); rr = r.uniform(.6, 1.8)
        s += f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(rr)}" fill="{col}" opacity="{f(r.uniform(.4, 1))}"/>'
    return s


def phoenix():
    r = random.Random(11)
    d = bg('#ff8a2a', '#8a1a0a', '#200404') + '<linearGradient id="fl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff3a0a"/><stop offset=".5" stop-color="#ffa020"/><stop offset="1" stop-color="#fff2a0"/></linearGradient>'
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    for k in range(24):  # sunburst
        a = k * math.pi / 12
        b += f'<path d="M{CX},{CY - 20}L{f(CX + 300 * math.cos(a - .05))},{f(CY - 20 + 300 * math.sin(a - .05))}L{f(CX + 300 * math.cos(a + .05))},{f(CY - 20 + 300 * math.sin(a + .05))}Z" fill="#ffd060" opacity=".08"/>'
    b += f'<circle cx="{CX}" cy="{CY - 20}" r="70" fill="#ffd060" opacity=".35" filter="url(#gl)"/>'
    # wings: fanned flame feathers
    for side in (1, -1):
        for i in range(8):  # wide teardrop feathers fanning up and out
            a = math.radians(10 - i * 19); L = 165 - i * 5; w = 22 - i
            x1 = CX + side * 14; y1 = CY - 26
            x2 = CX + side * L * math.cos(a); y2 = CY - 26 + L * math.sin(a)
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2; dx, dy = x2 - x1, y2 - y1; n = math.hypot(dx, dy); px, py = -dy / n * w, dx / n * w
            b += f'<path d="M{f(x1)},{f(y1)}Q{f(mx + px)},{f(my + py)} {f(x2)},{f(y2)}Q{f(mx - px)},{f(my - py)} {f(x1)},{f(y1)}Z" fill="url(#fl)" stroke="#5a1404" stroke-width="2" opacity=".95"/>'
            b += f'<path d="M{f(x1)},{f(y1)}L{f(x1 + dx * .85)},{f(y1 + dy * .85)}" stroke="#fff2a0" stroke-width="1.5" opacity=".6"/>'
    # body and head
    b += f'<path d="M{CX},{CY - 70}Q{CX + 26},{CY - 30} {CX + 16},{CY + 30}Q{CX},{CY + 60} {CX - 16},{CY + 30}Q{CX - 26},{CY - 30} {CX},{CY - 70}Z" fill="url(#gd)" stroke="#5a1404" stroke-width="3"/>'
    b += f'<circle cx="{CX}" cy="{CY - 82}" r="18" fill="url(#gd)" stroke="#5a1404" stroke-width="3"/><path d="M{CX + 14},{CY - 84}L{CX + 32},{CY - 78}L{CX + 14},{CY - 74}Z" fill="#ffa020" stroke="#5a1404" stroke-width="2"/><circle cx="{CX + 5}" cy="{CY - 86}" r="3.5" fill="#200404"/>'
    for i, dx in enumerate((-14, -4, 6)):  # crest
        b += f'<path d="M{CX + dx},{CY - 96}Q{CX + dx - 6},{CY - 122 - i * 4} {CX + dx + 8},{CY - 130 - i * 6}Q{CX + dx + 4},{CY - 112} {CX + dx + 6},{CY - 98}Z" fill="url(#fl)" stroke="#5a1404" stroke-width="1.5"/>'
    # tail flames
    for i, (dx, L) in enumerate([(-30, 120), (0, 150), (30, 120), (-14, 136), (14, 136)]):
        b += f'<path d="M{CX - 10},{CY + 40}Q{CX + dx * 1.6},{CY + 90} {CX + dx * 2.2},{CY + 40 + L}Q{CX + dx},{CY + 100} {CX + 10},{CY + 40}Z" fill="url(#fl)" stroke="#5a1404" stroke-width="1.5" opacity=".9"/>'
    for _ in range(40):
        x = r.uniform(50, W - 50); y = r.uniform(60, H - 60); b += f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r.uniform(1, 3))}" fill="#ffd060" opacity="{f(r.uniform(.4, .9))}"/>'
    return wrap(d, b)


def wyrmeye():
    d = bg('#2a7a3a', '#0e3a1a', '#03120a') + '<radialGradient id="ir" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6a0"/><stop offset=".45" stop-color="#ffc020"/><stop offset=".8" stop-color="#c86a08"/><stop offset="1" stop-color="#5a2a04"/></radialGradient>'
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    for row in range(16):  # scales
        for col in range(9):
            x = 30 + col * 44 + (22 if row % 2 else 0); y = 30 + row * 34
            b += f'<path d="M{x - 22},{y}Q{x},{y + 34} {x + 22},{y}" fill="none" stroke="#5ad07a" stroke-width="2" opacity=".28"/>'
    b += f'<circle cx="{CX}" cy="{CY}" r="128" fill="#020a04" stroke="url(#gd)" stroke-width="6"/><circle cx="{CX}" cy="{CY}" r="116" fill="none" stroke="url(#gd)" stroke-width="1.5"/>'
    for k in range(16):  # filigree ring
        a = k * math.pi / 8; x = CX + 140 * math.cos(a); y = CY + 140 * math.sin(a)
        b += f'<polygon points="{poly(star_pts(x, y, 4, 12, 4, k * 22.5))}" fill="url(#gd)"/>'
    b += f'<ellipse cx="{CX}" cy="{CY}" rx="104" ry="58" fill="url(#ir)" stroke="#2a1404" stroke-width="4"/>'
    for k in range(28):
        a = k * math.pi / 14; b += f'<path d="M{f(CX + 22 * math.cos(a))},{f(CY + 22 * math.sin(a) * .56)}L{f(CX + 96 * math.cos(a))},{f(CY + 96 * math.sin(a) * .56)}" stroke="#a85a08" stroke-width="1.5" opacity=".55"/>'
    b += f'<path d="M{CX},{CY - 54}Q{CX + 16},{CY} {CX},{CY + 54}Q{CX - 16},{CY} {CX},{CY - 54}Z" fill="#050200"/>'
    b += f'<ellipse cx="{CX - 34}" cy="{CY - 22}" rx="16" ry="9" fill="#fff" opacity=".55"/>'
    b += f'<path d="M{CX - 124},{CY}Q{CX},{CY - 112} {CX + 124},{CY}" fill="none" stroke="url(#gd)" stroke-width="4"/><path d="M{CX - 124},{CY}Q{CX},{CY + 112} {CX + 124},{CY}" fill="none" stroke="url(#gd)" stroke-width="4"/>'
    return wrap(d, b)


def unicorn():
    r = random.Random(5)
    d = bg('#3a4a9a', '#141e52', '#05081e', cy='30%') + '<linearGradient id="mn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd8ff"/><stop offset=".5" stop-color="#b8d8ff"/><stop offset="1" stop-color="#d8c8ff"/></linearGradient>'
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>' + stars(r, 90)
    b += f'<circle cx="{CX + 70}" cy="150" r="70" fill="#fff8e0" opacity=".3" filter="url(#gl)"/><path d="M{CX + 40},92a62 62 0 1 0 64 96a50 50 0 1 1 -64 -96z" fill="url(#sv)"/>'
    # unicorn head in profile (facing left), silver with a gold horn and a pastel mane
    head = (f'M{CX + 70},{CY + 150}L{CX + 60},{CY + 40}Q{CX + 50},{CY - 20} {CX + 10},{CY - 50}L{CX - 60},{CY - 10}Q{CX - 86},{CY + 6} {CX - 76},{CY + 26}'
            f'Q{CX - 62},{CY + 40} {CX - 30},{CY + 26}L{CX - 6},{CY + 20}Q{CX - 10},{CY + 80} {CX - 30},{CY + 150}Z')
    b += f'<path d="{head}" fill="url(#sv)" stroke="#2a2e5a" stroke-width="4" stroke-linejoin="round"/>'
    b += f'<path d="M{CX + 6},{CY - 52}L{CX + 30},{CY - 150}L{CX + 22},{CY - 46}Z" fill="url(#gd)" stroke="#5a3a08" stroke-width="2.5"/>'
    for i in range(4): b += f'<path d="M{CX + 9 + i * 4},{CY - 66 - i * 22}l14,-4" stroke="#8a5a10" stroke-width="2"/>'
    for i in range(6):  # flowing mane
        y = CY - 40 + i * 32
        b += f'<path d="M{CX + 50 - i * 2},{y}Q{CX + 110},{y + 10} {CX + 96 - i * 4},{y + 50}Q{CX + 120},{y + 30} {CX + 64},{y + 2}Z" fill="url(#mn)" stroke="#5a4a8a" stroke-width="2" opacity=".95"/>'
    b += f'<path d="M{CX + 10},{CY - 46}L{CX + 2},{CY - 70}L{CX + 22},{CY - 52}Z" fill="url(#sv)" stroke="#2a2e5a" stroke-width="2.5"/>'
    b += f'<ellipse cx="{CX - 20}" cy="{CY - 18}" rx="9" ry="7" fill="#1a1e40"/><circle cx="{CX - 23}" cy="{CY - 21}" r="2.5" fill="#fff"/>'
    b += f'<circle cx="{CX - 66}" cy="{CY + 14}" r="3" fill="#2a2e5a"/><path d="M{CX - 70},{CY + 30}q10,4 18,0" stroke="#2a2e5a" stroke-width="2" fill="none"/>'
    return wrap(d, b, 'url(#sv)')


def orrery():
    r = random.Random(9)
    d = bg('#2a3a7a', '#0e1640', '#04061a') + '<radialGradient id="st" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#fff0a0"/><stop offset="1" stop-color="#ffb040" stop-opacity="0"/></radialGradient>'
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>' + stars(r, 70)
    pts = [(80, 90), (130, 60), (175, 100), (300, 80), (330, 130), (290, 170), (70, 440), (110, 480), (160, 470), (300, 460), (340, 500)]
    for a, c in [(0, 1), (1, 2), (3, 4), (4, 5), (6, 7), (7, 8), (9, 10)]:
        b += f'<path d="M{pts[a][0]},{pts[a][1]}L{pts[c][0]},{pts[c][1]}" stroke="#a8c0ff" stroke-width="1" opacity=".6"/>'
    for (x, y) in pts: b += f'<polygon points="{poly(star_pts(x, y, 4, 5, 1.5))}" fill="#e8f0ff"/>'
    # armillary rings
    for rx, ry, rot in [(140, 50, -20), (140, 50, 25), (120, 120, 0), (150, 34, 70)]:
        b += f'<ellipse cx="{CX}" cy="{CY}" rx="{rx}" ry="{ry}" transform="rotate({rot} {CX} {CY})" fill="none" stroke="url(#gd)" stroke-width="5"/><ellipse cx="{CX}" cy="{CY}" rx="{rx}" ry="{ry}" transform="rotate({rot} {CX} {CY})" fill="none" stroke="#5a3a08" stroke-width="1" opacity=".6"/>'
    for (a, rad, col, sz) in [(30, 140, '#7ab0ff', 10), (160, 120, '#ff8a6a', 8), (250, 150, '#e0c070', 12), (320, 120, '#9affc0', 7)]:
        x = CX + rad * math.cos(math.radians(a)); y = CY + rad * .45 * math.sin(math.radians(a))
        b += f'<circle cx="{f(x)}" cy="{f(y)}" r="{sz}" fill="{col}" stroke="#1a1030" stroke-width="2"/><circle cx="{f(x - sz * .3)}" cy="{f(y - sz * .3)}" r="{f(sz * .3)}" fill="#fff" opacity=".6"/>'
    b += f'<circle cx="{CX}" cy="{CY}" r="56" fill="url(#st)"/><polygon points="{poly(star_pts(CX, CY, 8, 34, 12))}" fill="#fff6c0" stroke="url(#gd)" stroke-width="2"/>'
    b += f'<path d="M{CX},{CY + 120}L{CX},{CY + 190}M{CX - 40},{CY + 190}L{CX + 40},{CY + 190}" stroke="url(#gd)" stroke-width="7" stroke-linecap="round"/>'
    return wrap(d, b)


def kingscrown():
    d = bg('#6a2a8a', '#2e0e44', '#10041a') + '<linearGradient id="gm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8aa0"/><stop offset="1" stop-color="#a00a2a"/></linearGradient><linearGradient id="gb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ad8ff"/><stop offset="1" stop-color="#1a5aa8"/></linearGradient>'
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    for row in range(10):  # damask diamonds
        for col in range(6):
            x = 40 + col * 64 + (32 if row % 2 else 0); y = 40 + row * 56
            b += f'<path d="M{x},{y - 16}L{x + 12},{y}L{x},{y + 16}L{x - 12},{y}Z" fill="none" stroke="#c89ae8" stroke-width="1.5" opacity=".25"/>'
    # laurel wreath
    for side in (1, -1):
        for i in range(9):
            a = math.radians(110 + i * 16); x = CX + side * 120 * math.cos(a) * -1; y = CY + 30 + 120 * math.sin(a)
            b += f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="16" ry="7" transform="rotate({f(side * (i * 16 + 20))} {f(x)} {f(y)})" fill="url(#gd)" stroke="#5a3a08" stroke-width="1.5"/>'
    # crown
    base_y = CY + 40
    b += f'<path d="M{CX - 100},{base_y}L{CX - 110},{CY - 50}L{CX - 60},{CY - 10}L{CX - 30},{CY - 80}L{CX},{CY - 20}L{CX + 30},{CY - 80}L{CX + 60},{CY - 10}L{CX + 110},{CY - 50}L{CX + 100},{base_y}Z" fill="url(#gd)" stroke="#4a2a04" stroke-width="4" stroke-linejoin="round"/>'
    b += f'<rect x="{CX - 104}" y="{base_y - 6}" width="208" height="30" rx="6" fill="url(#gd)" stroke="#4a2a04" stroke-width="4"/>'
    for x, g in [(-70, 'gb'), (-35, 'gm'), (0, 'gb'), (35, 'gm'), (70, 'gb')]:
        b += f'<ellipse cx="{CX + x}" cy="{base_y + 9}" rx="9" ry="7" fill="url(#{g})" stroke="#2a1404" stroke-width="2"/>'
    for x, y in [(-110, -50), (-30, -80), (30, -80), (110, -50)]:
        b += f'<circle cx="{CX + x}" cy="{CY + y}" r="9" fill="url(#gm)" stroke="#2a1404" stroke-width="2"/><circle cx="{CX + x - 3}" cy="{CY + y - 3}" r="3" fill="#fff" opacity=".7"/>'
    b += f'<circle cx="{CX}" cy="{CY - 20}" r="13" fill="url(#gb)" stroke="#2a1404" stroke-width="2.5"/><circle cx="{CX - 4}" cy="{CY - 24}" r="4" fill="#fff" opacity=".7"/>'
    b += f'<path d="M{CX - 80},{CY - 4}L{CX + 80},{CY - 4}" stroke="#fff6c0" stroke-width="2" opacity=".5"/>'
    return wrap(d, b)


def stormwing():
    r = random.Random(21)
    d = bg('#5a7aa8', '#1e2e4a', '#080c18', cy='35%') + '<linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4a6a"/><stop offset="1" stop-color="#121a2a"/></linearGradient>'
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    for i in range(7):  # storm clouds
        x = r.uniform(40, W - 40); y = r.uniform(60, 200)
        b += f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(r.uniform(60, 110))}" ry="{f(r.uniform(18, 30))}" fill="#a8c0e0" opacity=".12"/>'
    def bolt(x, y, n, sc=1):
        d0 = f'M{x},{y}'
        for _ in range(n): x += r.uniform(-26, 26) * sc; y += r.uniform(24, 40) * sc; d0 += f'L{f(x)},{f(y)}'
        return f'<path d="{d0}" stroke="#bfe8ff" stroke-width="7" fill="none" filter="url(#gl)" opacity=".8"/><path d="{d0}" stroke="#ffffff" stroke-width="2.5" fill="none"/>'
    b += bolt(70, 40, 9) + bolt(330, 50, 8) + bolt(250, 360, 5, .7)
    # wyvern: wings spread wide, long tail
    for side in (1, -1):
        wing = (f'M{CX + side * 20},{CY - 30}L{CX + side * 170},{CY - 150}L{CX + side * 150},{CY - 60}L{CX + side * 175},{CY - 40}'
                f'L{CX + side * 130},{CY - 10}L{CX + side * 150},{CY + 20}L{CX + side * 90},{CY + 10}L{CX + side * 30},{CY + 10}Z')
        b += f'<path d="{wing}" fill="url(#wg)" stroke="#bfe8ff" stroke-width="2.5" stroke-linejoin="round"/>'
        for (x2, y2) in [(150, -60), (130, -10), (90, 10)]:
            b += f'<path d="M{CX + side * 24},{CY - 26}L{CX + side * x2},{CY + y2}" stroke="#7a9ac8" stroke-width="2"/>'
    b += f'<path d="M{CX},{CY + 10}Q{CX + 40},{CY + 120} {CX - 20},{CY + 190}Q{CX - 50},{CY + 220} {CX - 10},{CY + 230}" stroke="#2a3a5a" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M{CX - 10},{CY + 230}l-14,14l22,-2z" fill="#bfe8ff"/>'
    b += f'<ellipse cx="{CX}" cy="{CY - 10}" rx="30" ry="50" fill="url(#wg)" stroke="#bfe8ff" stroke-width="2.5"/>'
    b += f'<path d="M{CX},{CY - 56}Q{CX + 4},{CY - 80} {CX + 26},{CY - 96}L{CX + 50},{CY - 92}L{CX + 30},{CY - 80}Q{CX + 14},{CY - 64} {CX + 14},{CY - 46}Z" fill="url(#wg)" stroke="#bfe8ff" stroke-width="2.5"/>'
    b += f'<path d="M{CX + 24},{CY - 96}L{CX + 18},{CY - 118}L{CX + 32},{CY - 98}Z" fill="#bfe8ff"/><circle cx="{CX + 34}" cy="{CY - 90}" r="3.5" fill="#bfe8ff" filter="url(#gl)"/><circle cx="{CX + 34}" cy="{CY - 90}" r="2" fill="#fff"/>'
    return wrap(d, b, 'url(#sv)')


BACKS = {'cos_back_phoenix': phoenix, 'cos_back_wyrmeye': wyrmeye, 'cos_back_unicorn': unicorn, 'cos_back_orrery': orrery, 'cos_back_kingscrown': kingscrown, 'cos_back_stormwing': stormwing}

if __name__ == '__main__':
    painted = set(json.loads((pathlib.Path(__file__).resolve().parent.parent / 'gemini' / 'in_game.json').read_text()))
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for name, fn in BACKS.items():
            if name in painted: print('skip (painted)', name); continue
            pg = br.new_page(viewport={'width': W, 'height': H})
            pg.set_content(f'<html><body style="margin:0">{fn()}</body></html>'); pg.wait_for_timeout(200)
            im = Image.open(io.BytesIO(pg.screenshot())).convert('RGB'); im.save(out / f'{name}.webp', 'WEBP', quality=84, method=6)
            print(name, (out / f'{name}.webp').stat().st_size // 1024, 'KB'); pg.close()
        br.close()
