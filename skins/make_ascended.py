# #57 Ascended Master Hero art: each hero's own painting with a radiant aura, light rays, rim light and sparkles.
import numpy as np, pathlib, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
gen = pathlib.Path(__file__).parent.parent / 'gen'
# hero: (source painting, aura colour, figure centre x, y)
HEROES = {
    'aldric': ('aldric', (255, 236, 150), .47, .45), 'thorgrim': ('thorgrim', (190, 232, 255), .44, .42), 'lyssara': ('lyssara', (208, 168, 255), .62, .45),
    'grukka': ('grukka', (255, 214, 110), .47, .45), 'hruna': ('hruna', (150, 255, 210), .5, .45), 'snix': ('snix', (185, 138, 255), .47, .42),
    'vaelith': ('vaelith', (224, 208, 255), .55, .45), 'brannoc': ('brannoc', (255, 210, 120), .5, .45), 'tavra': ('tavra', (255, 176, 64), .4, .45),
    'zizzik': ('zizzik', (255, 154, 58), .5, .5), 'seraphine': ('seraphine', (255, 246, 224), .47, .45), 'korga': ('korga', (216, 176, 128), .47, .42),
    'dawnarchon': ('archon', (255, 246, 192), .5, .42), 'redwarlord': ('warlord', (255, 120, 70), .5, .45), 'tempestavatar': ('tempest', (154, 216, 255), .5, .42),
}
def screen(a, b): return 1 - (1 - a) * (1 - b)
def ascend(src, col, cx, cy, seed):
    im = Image.open(gen / f'{src}.webp').convert('RGB')
    im = ImageEnhance.Color(im).enhance(1.2); im = ImageEnhance.Contrast(im).enhance(1.08)
    W, H = im.size; base = np.asarray(im).astype(float) / 255
    c = np.array(col) / 255
    yy, xx = np.mgrid[0:H, 0:W]; dx = (xx - cx * W) / W; dy = (yy - cy * H) / H
    d = np.sqrt(dx * dx * 1.0 + dy * dy * 1.6)
    aura = np.exp(-((d - 0.34) / 0.16) ** 2) * 0.9 + np.clip(1 - d / 0.6, 0, 1) ** 3 * 0.15  # a halo ring around the figure, faint in the middle
    # light rays fanning out from behind the figure
    ang = np.arctan2(dy, dx); rays = (0.5 + 0.5 * np.cos(ang * 14 + seed)) ** 6 * np.clip(1 - d / 0.9, 0, 1) * np.clip((d - 0.12) / 0.2, 0, 1)
    glow = (aura * 0.6 + rays * 0.4)[..., None] * c
    out = screen(base, glow)
    # rim light: brighten edges of bright figure areas (cheap edge glow from a blurred luminance difference)
    lum = Image.fromarray((base.mean(-1) * 255).astype('uint8'))
    edge = np.asarray(lum.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(2))).astype(float) / 255
    out = screen(out, (edge * np.clip(1 - d / 0.5, 0, 1) * 1.1)[..., None] * c)
    # gentle vignette so the centre glows
    vig = np.clip(1 - (np.sqrt(((xx / W - .5) ** 2) + ((yy / H - .5) ** 2)) - 0.35) * 1.2, 0.55, 1)[..., None]
    out = out * vig
    res = Image.fromarray((np.clip(out, 0, 1) * 255).astype('uint8'))
    # sparkles
    r = random.Random(seed); dr = ImageDraw.Draw(res, 'RGBA')
    for _ in range(26):
        a = r.random() * 6.28; dist = 0.12 + r.random() * 0.45
        x = cx * W + math.cos(a) * dist * W * 0.8; y = cy * H + math.sin(a) * dist * H * 0.8; s = 2 + r.random() * 6
        fill = (min(255, col[0] + 40), min(255, col[1] + 40), min(255, col[2] + 40), int(140 + r.random() * 115))
        dr.polygon([(x, y - s * 2.2), (x + s * .45, y - s * .45), (x + s * 2.2, y), (x + s * .45, y + s * .45), (x, y + s * 2.2), (x - s * .45, y + s * .45), (x - s * 2.2, y), (x - s * .45, y - s * .45)], fill=fill)
    return res
if __name__ == '__main__':
    import json
    # Ascended heroes painted in Gemini (listed in gemini/in_game.json) are never overwritten
    painted = set(json.loads((gen.parent / 'gemini' / 'in_game.json').read_text()))
    for i, (hid, (src, col, cx, cy)) in enumerate(HEROES.items()):
        if f'asc_{hid}' in painted: print('skip (painted)', hid); continue
        p = gen / f'asc_{hid}.webp'; ascend(src, col, cx, cy, i * 7 + 3).save(p, 'WEBP', quality=80, method=6); print(p.name, p.stat().st_size // 1024, 'KB')
