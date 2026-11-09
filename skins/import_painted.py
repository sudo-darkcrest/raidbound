# skins/import_painted.py  skinid=path/to/image.png ...   (or a folder holding <skinid>.png files)
# Brings SpriteCook-painted hero skins into the game. Each painting is an edit of the hero's own
# wide painting, so we find the crop that best matches the hero's card picture (gen/<hero>.webp)
# and cut the skin the same way. Masters go to skins/painted/, game copies to gen/skin_<id>.webp.
import sys, json, pathlib
from PIL import Image, ImageFilter, ImageChops, ImageStat

here = pathlib.Path(__file__).resolve().parent
gen = here.parent / 'gen'
painted = here / 'painted'; painted.mkdir(exist_ok=True)
SKINS = json.loads((here / 'skins.json').read_text())

def edges(im, w=150, h=110):
    return im.convert('L').resize((w, h), Image.LANCZOS).filter(ImageFilter.FIND_EDGES)

def best_crop(src, hero_card):
    W, H = src.size; tw = int(H * 300 / 220)
    target = edges(hero_card)
    best = None
    for i in range(0, 41):
        cx = i / 40; x0 = max(0, min(W - tw, int((W - tw) * cx)))
        cand = edges(src.crop((x0, 0, x0 + tw, H)))
        diff = sum(ImageStat.Stat(ImageChops.difference(cand, target)).mean)
        if best is None or diff < best[0]: best = (diff, x0)
    x0 = best[1]
    return src.crop((x0, 0, x0 + tw, H)), x0, best[0]

def main(args):
    pairs = []
    for a in args:
        p = pathlib.Path(a)
        if p.is_dir(): pairs += [(f.stem, f) for f in sorted(p.iterdir()) if f.stem in SKINS]
        else: sid, _, path = a.partition('='); pairs.append((sid, pathlib.Path(path)))
    for sid, path in pairs:
        if sid not in SKINS: print('unknown skin', sid); continue
        hero = SKINS[sid]['hero']
        src = Image.open(path).convert('RGB')
        art = {'dawnarchon': 'archon', 'redwarlord': 'warlord', 'tempestavatar': 'tempest'}.get(hero, hero)  # the gold-bought heroes' paintings have older names
        card, x0, score = best_crop(src, Image.open(gen / f'{art}.webp').convert('RGB'))
        card = card.resize((600, 440), Image.LANCZOS)
        card.save(painted / f'{sid}.webp', 'WEBP', quality=86, method=6)
        card.save(gen / f'skin_{sid}.webp', 'WEBP', quality=80, method=6)
        print(f'{sid}: cropped at x={x0} (match {score:.1f}) -> gen/skin_{sid}.webp')

if __name__ == '__main__':
    main(sys.argv[1:])
