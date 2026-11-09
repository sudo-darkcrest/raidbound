"""Add painted Vault items (card backs, table themes, companions) to the game.

usage: python3 tools/ingest_cos.py <id>[:cx]=<image> ...     (id as on the Gemini page without "cos_", e.g. back_sigil)
  back_*   card backs: cropped to 5:7 and saved at 400x560
  board_*  table themes: cropped to 16:9 and saved at 1280x720
  pet_*    companions: the plain green background is keyed out, trimmed and fitted in 300x300 with transparency
cx (0..1, default 0.5) moves a crop left or right. Keeps the original in gen/raw, then rebuilds the art.
Also add 'cos_<id>' to gemini/in_game.json so boards/make_boards.py won't draw over a painted table.
"""
import os, subprocess, sys
import numpy as np
from PIL import Image

os.makedirs('gen/raw', exist_ok=True)


def crop_to(im, ratio, cx):
    W, H = im.size
    if W / H > ratio:
        tw = int(H * ratio); x0 = max(0, min(W - tw, int((W - tw) * cx)))
        return im.crop((x0, 0, x0 + tw, H))
    th = int(W / ratio); y0 = (H - th) // 2
    return im.crop((0, y0, W, y0 + th))


def key_green(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = g - np.maximum(r, b)                     # how much greener than the other channels
    alpha = np.clip(1.0 - (spill - 40) / 60.0, 0, 1)  # >=100 greener: gone; <=40: kept; soft edge between
    alpha[(g < 90)] = 1.0                             # dark pixels are never background
    g2 = np.where(spill > 0, np.minimum(g, np.maximum(r, b) * 1.04), g)  # remove green fringe
    out = np.dstack([r, g2, b, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


for spec in sys.argv[1:]:
    idc, _, path = spec.partition('=')
    cid, _, cx = idc.partition(':'); cx = float(cx) if cx else 0.5
    im = Image.open(path)
    im.convert('RGB').save(f'gen/raw/cos_{cid}.jpg', 'JPEG', quality=92)
    if cid.startswith('back_'):
        crop_to(im.convert('RGB'), 5 / 7, cx).resize((400, 560), Image.LANCZOS).save(f'gen/cos_{cid}.webp', 'WEBP', quality=88, method=6)
    elif cid.startswith('board_'):
        crop_to(im.convert('RGB'), 16 / 9, cx).resize((1280, 720), Image.LANCZOS).save(f'gen/cos_{cid}.webp', 'WEBP', quality=86, method=6)
    elif cid.startswith('pet_'):
        cut = key_green(im)
        box = cut.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
        cut = cut.crop(box) if box else cut
        cut.thumbnail((300, 300), Image.LANCZOS)
        cut.save(f'gen/cos_{cid}.webp', 'WEBP', quality=90, method=6)
    else:
        sys.exit(f'unknown kind for {cid} (expected back_, board_ or pet_)')
    print('ok', 'cos_' + cid, Image.open(f'gen/cos_{cid}.webp').size)
subprocess.run(['python3', 'gen_art.py'], check=True)
