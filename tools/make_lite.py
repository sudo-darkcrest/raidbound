"""Make a smaller single-file build for the Claude artifact copy, which must stay under 16 MiB.

Re-encodes every embedded webp picture at a lower quality. The website and the desktop file
keep the full-quality build; only the artifact uses this one.

usage: python3 tools/make_lite.py [quality] [scale]     (defaults 60 and 1.0; scale < 1 also shrinks pictures wider than 400 px)
reads dist/raidbound.html, writes dist/raidbound_lite.html
"""
import base64, io, re, sys
from PIL import Image

Q = int(sys.argv[1]) if len(sys.argv) > 1 else 60
SC = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
src = open('dist/raidbound.html', encoding='utf-8').read()
pat = re.compile(r'data:image/webp;base64,([A-Za-z0-9+/=]+)')
n = saved = 0


def shrink(m):
    global n, saved
    raw = base64.b64decode(m.group(1))
    try:
        im = Image.open(io.BytesIO(raw))
        im.load()
    except Exception:
        return m.group(0)
    if SC < 1 and im.width > 400:
        im = im.resize((round(im.width * SC), round(im.height * SC)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=Q, method=6)
    out = buf.getvalue()
    if len(out) >= len(raw):
        return m.group(0)
    n += 1
    saved += len(raw) - len(out)
    return 'data:image/webp;base64,' + base64.b64encode(out).decode()


lite = pat.sub(shrink, src)
open('dist/raidbound_lite.html', 'w', encoding='utf-8').write(lite)
size = len(lite.encode('utf-8'))
print(f'{n} pictures re-saved at quality {Q}' + (f', scale {SC}' if SC < 1 else '') + f'; {len(src.encode()) / 1e6:.1f} MB -> {size / 1e6:.1f} MB'
      + ('' if size < 16 * 1024 * 1024 else '  (STILL OVER 16 MiB: try a lower quality)'))
