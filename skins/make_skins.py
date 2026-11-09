# #45 hero skins: recolour each hero painting's metal (low-saturation greys/silvers) into new armour.
# shadow = black obsidian plate with violet sheen · gilded = polished gold · frost = pale ice-blue silver
# Skin tones and saturated cloth stay as painted.  Run: python3 skins/make_skins.py
import numpy as np, pathlib
from PIL import Image
here = pathlib.Path(__file__).parent; gen = here.parent / 'gen'

def hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1); d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rc = np.where(m, (mx - r) / np.where(m, d, 1), 0); gc = np.where(m, (mx - g) / np.where(m, d, 1), 0); bc = np.where(m, (mx - b) / np.where(m, d, 1), 0)
    h = np.where(r == mx, bc - gc, np.where(g == mx, 2 + rc - bc, 4 + gc - rc)); h = (h / 6) % 1
    s = np.where(mx > 0, d / np.where(mx > 0, mx, 1), 0)
    return h, s, mx
def rgb(h, s, v):
    i = np.floor(h * 6).astype(int) % 6; f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    out = np.zeros(h.shape + (3,))
    for k, (R, G, B) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        m = i == k; out[m] = np.stack([R[m], G[m], B[m]], -1)
    return out

def hue_in(h, lo, hi, soft=0.03):
    """soft 0..1 membership of hue h in [lo, hi] (wraps around 1.0)"""
    if lo <= hi: d = np.maximum(lo - h, h - hi)
    else: d = np.minimum(np.maximum(lo - h, 0) + 0, 1)  # placeholder, replaced below
    if lo > hi:  # wrap range like 0.95..0.05
        d = np.where((h >= lo) | (h <= hi), -1.0, np.minimum(np.abs(h - lo), np.abs(h - hi)))
    return np.clip(1 - np.maximum(d, 0) / soft, 0, 1)

def figure_mask(shape, cx, cy, rx, ry):
    H, W = shape; yy, xx = np.mgrid[0:H, 0:W]
    d = ((xx / W - cx) / rx) ** 2 + ((yy / H - cy) / ry) ** 2
    return np.clip((1.25 - d) / 0.5, 0, 1)

def metal_recolor(h, s, v, kind):
    if kind == 'shadow':
        nv = 0.07 + v ** 1.6 * 0.6; nh = np.full_like(h, 0.74); ns = np.full_like(s, 0.30)
        hi = np.clip((v - 0.82) / 0.18, 0, 1); ns = ns * (1 - hi) + 0.18 * hi; nv = nv + hi * 0.25
    elif kind == 'eclipse':  # #89: much darker than shadow, for very bright metal (the Archon's white-gold plate and wings)
        nv = 0.06 + v ** 2.4 * 0.42; nh = np.full_like(h, 0.76); ns = np.full_like(s, 0.42)
        hi = np.clip((v - 0.9) / 0.1, 0, 1); ns = ns * (1 - hi) + 0.25 * hi; nv = nv + hi * 0.12
    elif kind == 'gilded':
        nv = np.clip(0.12 + v * 1.02, 0, 1); nh = np.full_like(h, 0.115); ns = 0.72 - np.clip((v - 0.85) / 0.15, 0, 1) * 0.45
    else:  # frost
        nv = np.clip(0.25 + v * 0.9, 0, 1); nh = np.full_like(h, 0.55); ns = np.full_like(s, 0.30)
    return rgb(nh, ns, nv)

def skin(src, cfg):
    a = np.asarray(Image.open(src).convert('RGB')).astype(float) / 255
    h, s, v = hsv(a)
    fm = figure_mask(h.shape, *cfg.get('fig', (0.5, 0.6, 0.34, 0.6)))
    out = a.copy()
    if cfg.get('metal'):
        lim = cfg.get('metalSat', 0.30)
        metal = np.clip((lim - s) / 0.14, 0, 1) * np.clip((v - cfg.get('metalV', 0.18)) / 0.15, 0, 1) * fm
        if cfg.get('noSky'): metal *= 1 - hue_in(h, 0.5, 0.68) * np.clip((v - 0.5) / 0.1, 0, 1)
        out = out * (1 - metal[..., None]) + metal_recolor(h, s, v, cfg['metal']) * metal[..., None]
    for lo, hi, th, sm, vm in cfg.get('cloth', []):
        cs = cfg.get('clothSat', 0.14); m = hue_in(h, lo, hi) * np.clip((s - cs) / 0.1, 0, 1) * fm * np.clip((cfg.get('clothVmax', 1.1) - v) / 0.1, 0, 1)
        rec = rgb(np.full_like(h, th), np.clip(s * sm, 0, 1), np.clip(v * vm, 0, 1))
        out = out * (1 - m[..., None]) + rec * m[..., None]
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype('uint8'))

# id: hero, name, recolour settings.  fig = figure ellipse (cx, cy, rx, ry) in 0..1 image units
SKINS = {
    'aldric_shadow': dict(hero='aldric', name='Blackguard Aldric', desc='Obsidian plate with a violet sheen. The crimson cape stays.', metal='shadow', fig=(0.47, 0.55, 0.36, 0.62)),
    'aldric_gilded': dict(hero='aldric', name='Sunforged Aldric', desc='Polished gold plate fit for a lord commander.', metal='gilded', fig=(0.47, 0.55, 0.36, 0.62)),
    'thorgrim_shadow': dict(hero='thorgrim', name='Thorgrim the Black', desc='Blackened iron helm, mail and crossbow.', metal='shadow', cloth=[(0.03, 0.12, 0.75, 0.3, 0.55)], noSky=1, fig=(0.44, 0.44, 0.19, 0.42)),
    'thorgrim_gilded': dict(hero='thorgrim', name='Goldbeard Thorgrim', desc='Gilded helm and mail, polished for the feast hall.', metal='gilded', cloth=[(0.03, 0.12, 0.98, 0.9, 0.8)], noSky=1, fig=(0.44, 0.44, 0.19, 0.42)),
    'hruna_shadow': dict(hero='hruna', name='Hruna of the Dusk', desc='Robes dyed the deep violet of a storm at nightfall.', cloth=[(0.30, 0.58, 0.76, 1.2, 0.55), (0.02, 0.12, 0.8, 0.7, 0.6)], metal='shadow', fig=(0.5, 0.55, 0.22, 0.6)),
    'hruna_frost': dict(hero='hruna', name='Hruna Frostcaller', desc='Pale ice-blue robes and frosted silver charms.', cloth=[(0.30, 0.58, 0.55, 0.45, 1.5), (0.02, 0.12, 0.57, 0.35, 1.4)], metal='frost', fig=(0.5, 0.55, 0.22, 0.6)),
    'lyssara_crimson': dict(hero='lyssara', name='Bloodmoon Lyssara', desc='Crimson robes embroidered in gold.', cloth=[(0.66, 0.86, 0.985, 1.05, 0.95)], fig=(0.62, 0.55, 0.3, 0.62)),
    'lyssara_frost': dict(hero='lyssara', name='Frostweave Lyssara', desc='Robes of pale winter blue.', cloth=[(0.66, 0.86, 0.56, 0.6, 1.3)], fig=(0.62, 0.55, 0.3, 0.62)),
    'snix_shadow': dict(hero='snix', name='Snix Nightcloak', desc='A hood and leathers black as a moonless alley.', cloth=[(0.02, 0.13, 0.75, 0.45, 0.55)], fig=(0.47, 0.5, 0.34, 0.6)),
    'snix_crimson': dict(hero='snix', name='Redcap Snix', desc='A blood-red hood so everyone knows who robbed them.', cloth=[(0.02, 0.13, 0.99, 1.4, 0.95)], fig=(0.47, 0.5, 0.34, 0.6)),
    'grukka_shadow': dict(hero='grukka', name='Grukka Ironhide', desc='Charcoal leathers and black iron spikes.', cloth=[(0.94, 0.06, 0.75, 0.35, 0.5)], metal='shadow', fig=(0.47, 0.55, 0.36, 0.6)),
    'grukka_gilded': dict(hero='grukka', name='Warlord Grukka', desc='Gold-capped spikes and a golden axe, taken from a king.', metal='gilded', metalSat=0.34, cloth=[(0.94, 0.06, 0.115, 0.9, 1.25)], fig=(0.47, 0.55, 0.36, 0.6)),
    'vaelith_frost': dict(hero='vaelith', name='Moonsilver Vaelith', desc='Leathers of pale moonlit silver.', cloth=[(0.62, 0.86, 0.58, 0.45, 1.6)], fig=(0.55, 0.55, 0.32, 0.6)),
    'brannoc_gilded': dict(hero='brannoc', name='Goldvow Brannoc', desc='A shield-oath sealed in gold.', metal='gilded', fig=(0.5, 0.55, 0.3, 0.62)),
    'tavra_shadow': dict(hero='tavra', name='Obsidian Tavra', desc='Her golden plate turned to black glass.', cloth=[(0.06, 0.16, 0.76, 0.35, 0.45)], fig=(0.4, 0.55, 0.24, 0.6)),
    'korga_frost': dict(hero='korga', name='Frostfang Korga', desc='Ice-blue steel and a frost-touched bow.', metal='frost', metalV=0.25, cloth=[(0.02, 0.13, 0.58, 0.5, 1.3)], clothSat=0.3, clothVmax=0.5, fig=(0.47, 0.47, 0.12, 0.5)),
    'zizzik_arcane': dict(hero='zizzik', name='Starweave Zizzik', desc='His singed orange robe swapped for royal blue.', cloth=[(0.03, 0.12, 0.62, 1.0, 0.8)], fig=(0.5, 0.6, 0.3, 0.6)),
    'seraphine_shadow': dict(hero='seraphine', name='Seraphine of the Veil', desc='Black robes of a priestess who walks among the dead.', metal='shadow', metalSat=0.5, metalV=0.3, fig=(0.47, 0.58, 0.17, 0.52)),
    # #89: the two gold-bought heroes (their paintings are gen/archon.webp and gen/warlord.webp)
    'dawnarchon_eclipse': dict(hero='dawnarchon', src='archon', name='Eclipse Archon', desc='Radiant plate and wings dimmed to obsidian and violet, like the sun in eclipse.', metal='eclipse', metalSat=0.42, fig=(0.48, 0.45, 0.46, 0.7)),
    'redwarlord_gilded': dict(hero='redwarlord', src='warlord', name='Warlord of the Gilded Moon', desc='Black plate gilded in plundered gold.', metal='gilded', fig=(0.58, 0.5, 0.3, 0.66)),
}

if __name__ == '__main__':
    import json
    painted = here / 'painted'
    # painted skins (skins/painted, brought in by import_painted.py) are left exactly as they are in gen/;
    # only the recoloured placeholders are (re)made, so the paintings are never re-compressed
    for sid, cfg in SKINS.items():
        p = gen / f'skin_{sid}.webp'
        if (painted / f'{sid}.webp').exists() and p.exists(): continue
        im = skin(gen / f"{cfg.get('src', cfg['hero'])}.webp", cfg)
        im.save(p, 'WEBP', quality=80, method=6); print(p.name, p.stat().st_size // 1024, 'KB')
    (here / 'skins.json').write_text(json.dumps({k: {'hero': v['hero'], 'name': v['name'], 'desc': v['desc']} for k, v in SKINS.items()}, indent=1))
