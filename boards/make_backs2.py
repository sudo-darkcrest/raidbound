# #61: six more card backs and the Little Ram companion.
import math, io, random, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from make_boards import f, poly, star_pts, sparkle, NOISE, out
from make_extra import frame, GOLD
from playwright.sync_api import sync_playwright
from PIL import Image
W, H = 400, 560; CX, CY = W / 2, H / 2
def wrap(defs, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}"><defs>{GOLD}{NOISE}{defs}</defs>{body}{frame(W, H)}<rect width="{W}" height="{H}" filter="url(#noise)"/></svg>'
def bg(c1, c2, c3, id='bg'): return f'<radialGradient id="{id}" cx="50%" cy="45%" r="80%"><stop offset="0" stop-color="{c1}"/><stop offset=".6" stop-color="{c2}"/><stop offset="1" stop-color="{c3}"/></radialGradient>'

def thornwood():
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    r = random.Random(3)
    for k in range(10):  # curling vines
        x0 = r.random() * W; y0 = r.random() * H; d = f'M{f(x0)},{f(y0)}'
        for j in range(5): d += f' q{f(r.uniform(-60, 60))},{f(r.uniform(-60, 60))} {f(r.uniform(-70, 70))},{f(r.uniform(-70, 70))}'
        b += f'<path d="{d}" stroke="#2a5a1a" stroke-width="3" fill="none" opacity=".7"/>'
    def leaf(x, y, a, s=1): return f'<path transform="translate({f(x)} {f(y)}) rotate({f(a)}) scale({s})" d="M0,0 Q14,-18 0,-40 Q-14,-18 0,0Z" fill="#6ab03a" stroke="#1a3a10" stroke-width="2"/><path transform="translate({f(x)} {f(y)}) rotate({f(a)}) scale({s})" d="M0,-2 L0,-36" stroke="#2a5a1a" stroke-width="1.5"/>'
    for k in range(12): b += leaf(CX + 110 * math.cos(k * math.pi / 6), CY + 110 * math.sin(k * math.pi / 6), k * 30 + 90, 0.9)
    b += f'<circle cx="{CX}" cy="{CY}" r="86" fill="#0e2a10" stroke="url(#gd)" stroke-width="5"/><circle cx="{CX}" cy="{CY}" r="74" fill="none" stroke="url(#gd)" stroke-width="1.5"/>'
    # stylised tree
    b += f'<path d="M{CX},{CY + 55}L{CX},{CY - 10}" stroke="url(#gd)" stroke-width="8" stroke-linecap="round"/>'
    for a, l in [(-50, 40), (-20, 52), (20, 52), (50, 40), (0, 62)]:
        x = CX + l * math.sin(math.radians(a)); y = CY - 10 - l * math.cos(math.radians(a)); b += f'<path d="M{CX},{CY - 5}L{f(x)},{f(y)}" stroke="url(#gd)" stroke-width="5" stroke-linecap="round"/><circle cx="{f(x)}" cy="{f(y)}" r="11" fill="#8ad04a" stroke="url(#gd)" stroke-width="2"/>'
    for a in (-35, 0, 35): b += f'<path d="M{CX},{CY + 52}l{f(30 * math.sin(math.radians(a)))},{f(14)}" stroke="url(#gd)" stroke-width="4" stroke-linecap="round"/>'
    return wrap(bg('#2a6a2a', '#123a14', '#061a08'), b)

def warcamp():
    r = random.Random(5); b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    for _ in range(70): b += f'<circle cx="{f(r.random() * W)}" cy="{f(r.random() * H)}" r="{f(r.random() * 2 + .6)}" fill="#ffb040" opacity="{r.random() * .7 + .2:.2f}"/>'
    b += f'<polygon points="{poly(star_pts(CX, CY, 12, 150, 110))}" fill="#3a0a06" opacity=".7"/>'
    b += f'<circle cx="{CX}" cy="{CY}" r="98" fill="#2a0604" stroke="url(#gd)" stroke-width="6"/><circle cx="{CX}" cy="{CY}" r="86" fill="none" stroke="url(#gd)" stroke-width="1.5"/>'
    for sg in (1, -1):  # crossed axes
        b += f'<g transform="translate({CX} {CY}) rotate({35 * sg})"><rect x="-4" y="-80" width="8" height="160" rx="3" fill="#6a3a18" stroke="#1a0a04" stroke-width="2"/><path d="M4,-74 Q50,-86 54,-50 Q44,-36 54,-20 Q30,-30 4,-30Z" fill="url(#gd)" stroke="#2a1404" stroke-width="2"/></g>'
    b += f'<circle cx="{CX}" cy="{CY}" r="14" fill="url(#gd)"/><path d="M{CX - 40},{CY + 70} Q{CX},{CY + 100} {CX + 40},{CY + 70}" stroke="url(#gd)" stroke-width="5" fill="none"/>'
    for x in (CX - 52, CX + 52): b += f'<path d="M{x},{CY + 64} l{-10 if x < CX else 10},18" stroke="url(#gd)" stroke-width="5" stroke-linecap="round"/>'
    return wrap(bg('#a8200c', '#4a0806', '#1a0202'), b)

def vault():
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    for i in range(-10, 20): b += f'<path d="M{i * 30},0L{i * 30 + H * .6},{H}" stroke="#6ab8ff" stroke-opacity=".08" stroke-width="1.5"/>'
    def gear(cx, cy, r, n, c):
        pts = []
        for k in range(n * 2):
            a = k * math.pi / n; rr = r if k % 2 == 0 else r * 0.82
            pts += [(cx + rr * math.cos(a - .12), cy + rr * math.sin(a - .12)), (cx + rr * math.cos(a + .12), cy + rr * math.sin(a + .12))]
        return f'<polygon points="{poly(pts)}" fill="{c}" stroke="#0a1a30" stroke-width="2"/><circle cx="{cx}" cy="{cy}" r="{r * .35}" fill="#0a1a30"/>'
    b += gear(CX - 70, CY + 120, 50, 10, '#2a4a7a') + gear(CX + 80, CY - 130, 44, 9, '#2a4a7a')
    b += f'<circle cx="{CX}" cy="{CY}" r="104" fill="#0a1a34" stroke="url(#gd)" stroke-width="5"/>'
    for r_, w in [(92, 1.5), (70, 2.5), (40, 2)]: b += f'<circle cx="{CX}" cy="{CY}" r="{r_}" fill="none" stroke="#9ad8ff" stroke-width="{w}" opacity=".9"/>'
    for k in range(16):
        a = math.radians(k * 22.5); x, y = CX + 81 * math.cos(a), CY + 81 * math.sin(a)
        b += f'<rect x="{f(x - 4)}" y="{f(y - 4)}" width="8" height="8" transform="rotate({k * 22.5 + 45} {f(x)} {f(y)})" fill="#9ad8ff"/>'
    b += f'<polygon points="{poly(star_pts(CX, CY, 6, 60, 26))}" fill="none" stroke="url(#gd)" stroke-width="3"/><circle cx="{CX}" cy="{CY}" r="18" fill="#9ad8ff"/><circle cx="{CX}" cy="{CY}" r="8" fill="#ffffff"/>'
    return wrap(bg('#1e4a8a', '#0c2048', '#040a1a'), b)

def delver():
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    for y in range(0, H, 40):  # stone bricks
        off = 0 if (y // 40) % 2 else 40
        for x in range(-40 + off, W, 80): b += f'<rect x="{x + 2}" y="{y + 2}" width="76" height="36" rx="3" fill="#2a2a34" stroke="#14141a" stroke-width="2"/>'
    b += f'<ellipse cx="{CX}" cy="{CY}" rx="120" ry="150" fill="#120a04" opacity=".55"/>'
    # big gold key
    b += f'<g transform="rotate(-30 {CX} {CY})"><circle cx="{CX}" cy="{CY - 80}" r="46" fill="none" stroke="url(#gd)" stroke-width="14"/><circle cx="{CX}" cy="{CY - 80}" r="16" fill="url(#gd)"/>'
    b += f'<rect x="{CX - 8}" y="{CY - 36}" width="16" height="170" fill="url(#gd)" stroke="#3a2404" stroke-width="2"/><rect x="{CX + 8}" y="{CY + 90}" width="34" height="14" fill="url(#gd)"/><rect x="{CX + 8}" y="{CY + 114}" width="24" height="14" fill="url(#gd)"/></g>'
    b += sparkle(CX + 70, CY - 110, 12, '#fff6d0') + sparkle(CX - 80, CY + 120, 9, '#fff6d0')
    return wrap(bg('#3a3448', '#1a1620', '#08060c'), b)

def legend():
    b = f'<rect width="{W}" height="{H}" fill="#06040c"/>'
    cols = ['#ff5a5a', '#ffb040', '#ffe060', '#6aff8a', '#5ad8ff', '#8a6aff', '#ff6ad8']
    for k in range(28):
        a = math.radians(k * 360 / 28); c = cols[k % len(cols)]
        b += f'<polygon points="{CX},{CY} {f(CX + 320 * math.cos(a - .05))},{f(CY + 320 * math.sin(a - .05))} {f(CX + 320 * math.cos(a + .05))},{f(CY + 320 * math.sin(a + .05))}" fill="{c}" opacity=".22"/>'
    b += f'<circle cx="{CX}" cy="{CY}" r="110" fill="none" stroke="url(#gd)" stroke-width="5"/>'
    b += f'<polygon points="{poly(star_pts(CX, CY, 5, 96, 40))}" fill="url(#gd)" stroke="#3a2404" stroke-width="2"/>'
    for i, c in enumerate(cols): b += f'<circle cx="{f(CX + 140 * math.cos(math.radians(i * 360 / 7 - 90)))}" cy="{f(CY + 140 * math.sin(math.radians(i * 360 / 7 - 90)))}" r="10" fill="{c}" stroke="url(#gd)" stroke-width="2"/>'
    b += sparkle(CX, CY, 22, '#ffffff')
    return wrap('', b)

def compass():
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
    for r_ in (150, 120, 60): b += f'<circle cx="{CX}" cy="{CY}" r="{r_}" fill="none" stroke="url(#gd)" stroke-width="{3 if r_ == 120 else 1.5}" opacity=".9"/>'
    for k in range(64):
        a = math.radians(k * 5.625); l = 12 if k % 8 == 0 else 6
        b += f'<path d="M{f(CX + 120 * math.cos(a))},{f(CY + 120 * math.sin(a))}L{f(CX + (120 - l) * math.cos(a))},{f(CY + (120 - l) * math.sin(a))}" stroke="url(#gd)" stroke-width="1.5"/>'
    b += f'<polygon points="{poly(star_pts(CX, CY, 8, 104, 26, -67.5))}" fill="#c89a48" opacity=".5"/><polygon points="{poly(star_pts(CX, CY, 4, 116, 22))}" fill="url(#gd)" stroke="#3a2404" stroke-width="2"/>'
    b += f'<circle cx="{CX}" cy="{CY}" r="14" fill="#14203a" stroke="url(#gd)" stroke-width="3"/>'
    return wrap(bg('#2a3a6a', '#141e3e', '#060a1a'), b)

def ram():  # a fluffy little ram companion
    d = '<radialGradient id="w" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d8d0c0"/></radialGradient><linearGradient id="h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8c890"/><stop offset="1" stop-color="#8a6a3a"/></linearGradient>'
    s = ''
    for (x, y) in [(110, 238), (135, 246), (172, 246), (196, 238)]: s += f'<rect x="{x - 7}" y="{y - 20}" width="14" height="40" rx="6" fill="#4a3a2a" stroke="#1a120a" stroke-width="3"/>'
    for k in range(12):  # fluffy wool body made of overlapping puffs
        a = k * math.pi / 6; s += f'<circle cx="{f(150 + 62 * math.cos(a))}" cy="{f(196 + 38 * math.sin(a))}" r="30" fill="url(#w)" stroke="#5a5040" stroke-width="3"/>'
    s += '<ellipse cx="150" cy="196" rx="70" ry="44" fill="url(#w)"/>'
    s += '<ellipse cx="208" cy="148" rx="34" ry="30" fill="#4a3a2a" stroke="#1a120a" stroke-width="3"/>'  # head
    for sg in (1, -1): s += f'<path d="M{208 + 14 * sg},128 q{30 * sg},-12 {26 * sg},16 q-4,14 {-16 * sg},8 q{8 * sg},-8 {2 * sg},-12" fill="url(#h)" stroke="#3a2a10" stroke-width="3"/>'
    s += '<circle cx="198" cy="146" r="6" fill="#fff"/><circle cx="218" cy="146" r="6" fill="#fff"/><circle cx="199" cy="147" r="3.4" fill="#120a04"/><circle cx="219" cy="147" r="3.4" fill="#120a04"/>'
    s += '<path d="M202,164 q6,5 12,0" stroke="#fff" stroke-width="2.5" fill="none"/><circle cx="208" cy="122" r="12" fill="url(#w)" stroke="#5a5040" stroke-width="2.5"/>'
    s += '<ellipse cx="190" cy="158" rx="6" ry="3.5" fill="#ffb0c0" opacity=".6"/><ellipse cx="226" cy="158" rx="6" ry="3.5" fill="#ffb0c0" opacity=".6"/>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><defs>{d}</defs><g transform="translate(-10 0)">{s}</g></svg>'

if __name__ == '__main__':
    jobs = [('cos_back_thornwood', thornwood), ('cos_back_warcamp', warcamp), ('cos_back_vault', vault), ('cos_back_delver', delver), ('cos_back_legend', legend), ('cos_back_compass', compass)]
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for name, fn in jobs + [('cos_pet_ram', ram)]:
            transp = name.startswith('cos_pet'); w, h = (300, 300) if transp else (W, H)
            pg = br.new_page(viewport={'width': w, 'height': h})
            pg.set_content(f'<html><body style="margin:0;background:transparent">{fn()}</body></html>'); pg.wait_for_timeout(200)
            im = Image.open(io.BytesIO(pg.screenshot(omit_background=transp))).convert('RGBA' if transp else 'RGB')
            im.save(out / f'{name}.webp', 'WEBP', quality=84, method=6); pg.close()
        br.close()
    print('ok')
