# #54: two new card backs and one more table theme, drawn as SVG and rendered with headless Chrome.
import math, io, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from make_boards import f, poly, star_pts, sparkle, NOISE, VIGNETTE, out
from playwright.sync_api import sync_playwright
from PIL import Image

BW, BH = 400, 560
GOLD = '<linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".35" stop-color="#e0b050"/><stop offset=".7" stop-color="#a8701e"/><stop offset="1" stop-color="#f0cc70"/></linearGradient>'

def frame(w, h, col='url(#gd)'):
    s = f'<rect x="10" y="10" width="{w - 20}" height="{h - 20}" rx="14" fill="none" stroke="{col}" stroke-width="6"/>'
    s += f'<rect x="22" y="22" width="{w - 44}" height="{h - 44}" rx="8" fill="none" stroke="{col}" stroke-width="2"/>'
    s += f'<rect x="30" y="30" width="{w - 60}" height="{h - 60}" rx="4" fill="none" stroke="{col}" stroke-width="1" opacity=".7"/>'
    for (x, y) in [(22, 22), (w - 22, 22), (22, h - 22), (w - 22, h - 22)]:
        s += f'<rect x="{x - 13}" y="{y - 13}" width="26" height="26" transform="rotate(45 {x} {y})" fill="#140808" stroke="{col}" stroke-width="3"/><circle cx="{x}" cy="{y}" r="5" fill="{col}"/>'
    for (x, y) in [(w / 2, 22), (w / 2, h - 22), (22, h / 2), (w - 22, h / 2)]:
        s += f'<polygon points="{poly(star_pts(x, y, 4, 14, 5))}" fill="{col}"/>'
    return s

def back_sigil():
    cx, cy = BW / 2, BH / 2
    d = GOLD + '<radialGradient id="bg" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#8a1a24"/><stop offset=".6" stop-color="#4a0a12"/><stop offset="1" stop-color="#1e0408"/></radialGradient><radialGradient id="gl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".5"/><stop offset="1" stop-color="#ffcf6a" stop-opacity="0"/></radialGradient>'
    b = f'<rect width="{BW}" height="{BH}" fill="url(#bg)"/>'
    # diamond trellis background
    g = '<g stroke="#e0b050" stroke-width=".8" opacity=".22">'
    for i in range(-12, 24):
        x = i * 36; g += f'<path d="M{x},0L{x + BH},{BH}M{x},0L{x - BH},{BH}"/>'
    b += g + '</g>'
    b += f'<circle cx="{cx}" cy="{cy}" r="170" fill="url(#gl)"/>'
    c = '<g fill="none" stroke="url(#gd)">'
    c += f'<circle cx="{cx}" cy="{cy}" r="128" stroke-width="5"/><circle cx="{cx}" cy="{cy}" r="116" stroke-width="1.5"/><circle cx="{cx}" cy="{cy}" r="70" stroke-width="3"/>'
    for k in range(48):
        a = math.radians(k * 7.5); r1, r2 = (116, 104) if k % 2 else (116, 96)
        c += f'<path d="M{f(cx + r1 * math.cos(a))},{f(cy + r1 * math.sin(a))}L{f(cx + r2 * math.cos(a))},{f(cy + r2 * math.sin(a))}" stroke-width="1.5"/>'
    for rot in (-90, -30):
        tri = [(cx + 100 * math.cos(math.radians(rot + 120 * i)), cy + 100 * math.sin(math.radians(rot + 120 * i))) for i in range(3)]
        c += f'<polygon points="{poly(tri)}" stroke-width="3"/>'
    for k in range(6):  # six interlocking circles
        a = math.radians(-90 + k * 60); c += f'<circle cx="{f(cx + 35 * math.cos(a))}" cy="{f(cy + 35 * math.sin(a))}" r="35" stroke-width="1.6"/>'
    c += '</g>'
    b += c
    # runes on the outer band: small geometric glyphs
    for k in range(12):
        a = math.radians(k * 30 + 15); x, y = cx + 150 * math.cos(a), cy + 150 * math.sin(a)
        b += f'<g transform="translate({f(x)} {f(y)}) rotate({k * 30 + 105})" stroke="url(#gd)" stroke-width="2.2" fill="none"><path d="M0,-10L0,10M0,-10L7,-3M0,0L-7,6"/></g>'
    b += f'<circle cx="{cx}" cy="{cy}" r="22" fill="url(#gd)"/><polygon points="{poly(star_pts(cx, cy, 8, 18, 8))}" fill="#5a0a12"/>' + sparkle(cx, cy, 12, '#fff6d0')
    b += frame(BW, BH)
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{BW}" height="{BH}"><defs>{d}{NOISE}</defs>{b}<rect width="{BW}" height="{BH}" filter="url(#noise)"/></svg>'

def back_scale():
    cx, cy = BW / 2, BH / 2
    d = GOLD + '<radialGradient id="sc" cx="50%" cy="20%" r="90%"><stop offset="0" stop-color="#5ae0a8"/><stop offset=".55" stop-color="#127a5a"/><stop offset="1" stop-color="#04261c"/></radialGradient><radialGradient id="vg" cx="50%" cy="50%" r="70%"><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient><linearGradient id="gem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd0f0"/><stop offset=".5" stop-color="#d0306a"/><stop offset="1" stop-color="#5a0a2a"/></linearGradient>'
    b = f'<rect width="{BW}" height="{BH}" fill="#04261c"/>'
    r = 26
    for row in range(-1, int(BH / (r * .9)) + 2):
        for col in range(-1, int(BW / (r * 2)) + 2):
            x = col * r * 2 + (r if row % 2 else 0); y = row * r * 0.9
            b += f'<path d="M{f(x - r)},{f(y)}A{r},{r} 0 0,0 {f(x + r)},{f(y)}Z" fill="url(#sc)" stroke="#022016" stroke-width="2.4"/>'
            b += f'<path d="M{f(x - r * .7)},{f(y + 3)}A{r * .7},{r * .7} 0 0,0 {f(x + r * .7)},{f(y + 3)}" fill="none" stroke="#9affd0" stroke-opacity=".35" stroke-width="1.4"/>'
    b += f'<rect width="{BW}" height="{BH}" fill="url(#vg)"/>'
    # central gold medallion with a faceted gem
    b += f'<ellipse cx="{cx}" cy="{cy}" rx="92" ry="120" fill="#041a12" stroke="url(#gd)" stroke-width="6"/><ellipse cx="{cx}" cy="{cy}" rx="80" ry="108" fill="none" stroke="url(#gd)" stroke-width="1.5"/>'
    for k in range(16):
        a = math.radians(k * 22.5); b += f'<path d="M{f(cx + 80 * math.cos(a))},{f(cy + 108 * math.sin(a))}L{f(cx + 92 * math.cos(a))},{f(cy + 120 * math.sin(a))}" stroke="url(#gd)" stroke-width="2"/>'
    gem = [(cx, cy - 70), (cx + 46, cy - 24), (cx + 46, cy + 24), (cx, cy + 70), (cx - 46, cy + 24), (cx - 46, cy - 24)]
    b += f'<polygon points="{poly(gem)}" fill="url(#gem)" stroke="url(#gd)" stroke-width="4"/>'
    inner = [(cx, cy - 38), (cx + 22, cy - 12), (cx + 22, cy + 12), (cx, cy + 38), (cx - 22, cy + 12), (cx - 22, cy - 12)]
    b += f'<polygon points="{poly(inner)}" fill="#ff8ac0" opacity=".45"/>'
    for (p, q) in zip(gem, inner): b += f'<path d="M{f(p[0])},{f(p[1])}L{f(q[0])},{f(q[1])}" stroke="#ffd0e8" stroke-opacity=".6" stroke-width="1.4"/>'
    b += f'<polygon points="{poly([(cx - 30, cy - 40), (cx - 10, cy - 52), (cx - 4, cy - 30)])}" fill="#fff" opacity=".7"/>'
    b += frame(BW, BH)
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{BW}" height="{BH}"><defs>{d}{NOISE}</defs>{b}<rect width="{BW}" height="{BH}" filter="url(#noise)"/></svg>'

def table_tapestry():
    W, H = 1280, 720; cx, cy = W / 2, H / 2
    d = GOLD + '<radialGradient id="bg" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#a01c2a"/><stop offset=".65" stop-color="#5e0c16"/><stop offset="1" stop-color="#2a0408"/></radialGradient>' + VIGNETTE + NOISE
    d += '<pattern id="dam" width="120" height="120" patternUnits="userSpaceOnUse"><g fill="none" stroke="#f0c060" stroke-opacity=".28" stroke-width="2">'
    # damask motif: quatrefoil with a fleur in the middle, repeated on a half-drop
    for (ox, oy) in [(60, 60), (0, 0), (120, 0), (0, 120), (120, 120)]:
        d += f'<circle cx="{ox - 14}" cy="{oy}" r="14"/><circle cx="{ox + 14}" cy="{oy}" r="14"/><circle cx="{ox}" cy="{oy - 14}" r="14"/><circle cx="{ox}" cy="{oy + 14}" r="14"/>'
        d += f'<path d="M{ox},{oy - 8}Q{ox + 6},{oy} {ox},{oy + 8}Q{ox - 6},{oy} {ox},{oy - 8}Z" fill="#f0c060" fill-opacity=".35"/>'
    d += '</g><g fill="#f0c060" fill-opacity=".2"><circle cx="0" cy="60" r="3"/><circle cx="120" cy="60" r="3"/><circle cx="60" cy="0" r="3"/><circle cx="60" cy="120" r="3"/></g></pattern>'
    b = f'<rect width="{W}" height="{H}" fill="url(#bg)"/><rect width="{W}" height="{H}" fill="url(#dam)"/>'
    # woven gold border bands top and bottom with a diamond chain
    for y in (34, H - 34):
        b += f'<rect x="0" y="{y - 18}" width="{W}" height="36" fill="#3a0610" opacity=".85"/><path d="M0,{y - 18}H{W}M0,{y + 18}H{W}" stroke="url(#gd)" stroke-width="3"/>'
        for x in range(0, W + 40, 40):
            b += f'<polygon points="{x},{y - 12} {x + 12},{y} {x},{y + 12} {x - 12},{y}" fill="none" stroke="url(#gd)" stroke-width="2"/><circle cx="{x + 20}" cy="{y}" r="2.5" fill="#f0c060"/>'
    # central royal crest: shield shape with crown and chevrons
    sh = f'M{cx - 90},{cy - 100}H{cx + 90}V{cy - 10}Q{cx + 90},{cy + 80} {cx},{cy + 120}Q{cx - 90},{cy + 80} {cx - 90},{cy - 10}Z'
    b += f'<path d="{sh}" fill="#3a0610" stroke="url(#gd)" stroke-width="6" opacity=".9"/>'
    for k in range(3):
        y = cy - 40 + k * 34
        b += f'<path d="M{cx - 64},{y + 20}L{cx},{y - 10}L{cx + 64},{y + 20}" fill="none" stroke="url(#gd)" stroke-width="5"/>'
    crown = f'M{cx - 60},{cy - 112}L{cx - 66},{cy - 160}L{cx - 34},{cy - 132}L{cx},{cy - 172}L{cx + 34},{cy - 132}L{cx + 66},{cy - 160}L{cx + 60},{cy - 112}Z'
    b += f'<path d="{crown}" fill="url(#gd)" stroke="#3a0610" stroke-width="2"/>'
    for x in (cx - 66, cx, cx + 66):
        b += f'<circle cx="{x}" cy="{cy - 166 if x == cx else cy - 162}" r="7" fill="#fff0b8"/>'
    for (x, y) in [(cx - 300, cy), (cx + 300, cy)]:
        b += f'<polygon points="{poly(star_pts(x, y, 8, 50, 20))}" fill="none" stroke="url(#gd)" stroke-width="2" opacity=".6"/>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}"><defs>{d}</defs>{b}<rect width="{W}" height="{H}" filter="url(#noise)"/><rect width="{W}" height="{H}" fill="url(#vig)"/></svg>'

if __name__ == '__main__':
    jobs = [('cos_back_sigil', back_sigil, BW, BH), ('cos_back_dragonscale', back_scale, BW, BH), ('cos_board_tapestry', table_tapestry, 1280, 720)]
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for name, fn, w, h in jobs:
            pg = br.new_page(viewport={'width': w, 'height': h})
            pg.set_content(f'<html><body style="margin:0">{fn()}</body></html>'); pg.wait_for_timeout(200)
            Image.open(io.BytesIO(pg.screenshot())).convert('RGB').save(out / f'{name}.webp', 'WEBP', quality=84, method=6)
            print(name, (out / f'{name}.webp').stat().st_size // 1024, 'KB'); pg.close()
        br.close()
