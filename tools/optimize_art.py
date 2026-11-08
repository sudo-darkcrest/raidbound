# Optimises gen/*.webp (the master paintings) into dist/art/<id>.<hash>.webp and writes dist/art_manifest.json.
#  - card / hero / raid art: the house vignette is baked in (it used to be added at runtime by wrapping each painting
#    in an SVG, which kept a second full copy of every picture in memory), 512x376 at quality 70
#  - hero and raid portraits stay at 600x440 because they are shown large
#  - table themes, card backs, packs, title screens, companions keep their size, re-encoded
# Run: python3 tools/optimize_art.py   (only re-encodes files whose master changed)
import hashlib, json, pathlib, io
import numpy as np
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
gen, out = root / 'gen', root / 'dist' / 'art'
out.mkdir(parents=True, exist_ok=True)
cache_f = root / 'dist' / 'art_cache.json'
cache = json.loads(cache_f.read_text()) if cache_f.exists() else {}
ALIASES = {'wolfcomp': 'packleader', 'footman_t': 'footman', 'grunt_t': 'grunt', 'tentaclecard': 'tentacle', 'magmaguard': 'magma', 'whelps': 'whelp', 'sheep': 'polymorph',
           'spiritbeast': 'spiritlynx', 'harbormarket': 'booster', 'dawnarchon': 'archon', 'redwarlord': 'warlord', 'tempestavatar': 'tempest'}
BIG = {'aldric', 'thorgrim', 'lyssara', 'grukka', 'hruna', 'snix', 'vaelith', 'brannoc', 'tavra', 'zizzik', 'seraphine', 'korga', 'archon', 'warlord', 'tempest',
       'crypt', 'molten', 'tide', 'vorthrax', 'treant', 'urza', 'sentinel'}
VERSION = 'v4'  # bump to force a full re-encode

def vignette(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx / W - .5) / .72) ** 2 + ((yy / H - .48) / .72) ** 2)
    al = np.clip((d - .5) / .5, 0, 1) * .78
    return Image.fromarray((a * (1 - al[..., None]) * 255 + .5).astype('uint8'))

def plan(stem, im):
    if stem.startswith('cos_pet_'): return dict(vig=False, size=None, q=82, alpha=True)
    if stem.startswith('cos_board_'): return dict(vig=False, size=(1152, 648), q=58, alpha=False)  # always shown under a dark tint
    if stem.startswith('title_'): return dict(vig=False, size=None, q=70, alpha=False)
    if stem.startswith(('cos_back_', 'pack_')): return dict(vig=False, size=None, q=74, alpha=False)
    base = stem[4:] if stem.startswith('asc_') else stem
    if stem.startswith('skin_') or base in BIG or stem in BIG: return dict(vig=True, size=(600, 440), q=70, alpha=False)
    return dict(vig=True, size=(480, 352), q=66, alpha=False)

manifest, total_in, total_out = {}, 0, 0
for p in sorted(gen.glob('*.webp')):
    stem, raw = p.stem, p.read_bytes()
    h = hashlib.sha1(raw + VERSION.encode()).hexdigest()[:10]
    total_in += len(raw)
    c = cache.get(stem)
    if c and c['h'] == h and (out / c['file']).exists():
        manifest[stem] = c['file']; total_out += (out / c['file']).stat().st_size; continue
    im = Image.open(io.BytesIO(raw))
    pl = plan(stem, im)
    im = im.convert('RGBA' if pl['alpha'] else 'RGB')
    if pl['vig']: im = vignette(im)
    if pl['size'] and im.size != pl['size']: im = im.resize(pl['size'], Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=pl['q'], method=6)
    data = b.getvalue()
    fname = f"{stem}.{hashlib.sha1(data).hexdigest()[:8]}.webp"
    for old in out.glob(stem + '.*.webp'):
        if old.name != fname: old.unlink()
    (out / fname).write_bytes(data)
    manifest[stem] = fname; cache[stem] = {'h': h, 'file': fname}; total_out += len(data)
for a, b in ALIASES.items():
    if b in manifest and a not in manifest: manifest[a] = manifest[b]
for k in list(cache):
    if k not in manifest: del cache[k]
cache_f.write_text(json.dumps(cache))
(root / 'dist' / 'art_manifest.json').write_text(json.dumps(manifest, indent=0))
print(f'art: {len(manifest)} entries, {total_in // 1024} KB masters -> {total_out // 1024} KB optimised')
