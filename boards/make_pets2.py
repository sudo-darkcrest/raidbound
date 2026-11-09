# #91: five companions that come with a card. Drawn in code (transparent 300x300) until the user paints them in Gemini.
#   Ember Wolf Pup (Beezer), Prism Dragonling (Guinevere), Starless Raven (Sir Darkcrest), Cave Bear Cub (Cave Bear), Gryphon Chick (Skyreach Gryphon)
# usage: python3 boards/make_pets2.py   -> gen/cos_pet_<id>.webp (skips any listed as painted in gemini/in_game.json)
import io, json, math, pathlib
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'gen'
INK = '#1c1420'


def star(x, y, r, col, n=4, inner=.28):
    pts = []
    for i in range(n * 2):
        a = math.pi * i / n - math.pi / 2; rr = r if i % 2 == 0 else r * inner
        pts.append(f'{x + rr * math.cos(a):.1f},{y + rr * math.sin(a):.1f}')
    return f'<polygon points="{" ".join(pts)}" fill="{col}"/>'


def svg(defs, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><defs>{defs}<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>{body}</svg>'


def eye(x, y, r, iris, dark='#120808', look=0):
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" stroke="{INK}" stroke-width="2.5"/>'
            f'<circle cx="{x + look}" cy="{y + 1}" r="{r * .78:.1f}" fill="{iris}"/>'
            f'<circle cx="{x + look}" cy="{y + 2}" r="{r * .42:.1f}" fill="{dark}"/>'
            f'<circle cx="{x + look - r * .35:.1f}" cy="{y - r * .3:.1f}" r="{r * .26:.1f}" fill="#fff"/>'
            f'<circle cx="{x + look + r * .3:.1f}" cy="{y + r * .38:.1f}" r="{r * .12:.1f}" fill="#fff" opacity=".85"/>')


def emberpup():  # a smouldering wolf pup with ember cracks and a flame-tipped tail
    d = '''<radialGradient id="fur" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#5a4646"/><stop offset=".7" stop-color="#2e2224"/><stop offset="1" stop-color="#180f12"/></radialGradient>
    <radialGradient id="aura" cx="50%" cy="55%" r="50%"><stop offset="0" stop-color="#ff7a20" stop-opacity=".45"/><stop offset="1" stop-color="#ff7a20" stop-opacity="0"/></radialGradient>
    <linearGradient id="fl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a10"/><stop offset=".6" stop-color="#ffb030"/><stop offset="1" stop-color="#fff2a0"/></linearGradient>
    <radialGradient id="ey" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#fff0a0"/><stop offset=".6" stop-color="#ff9a20"/><stop offset="1" stop-color="#b03a08"/></radialGradient>'''
    s = '<circle cx="150" cy="170" r="140" fill="url(#aura)"/>'
    # tail curling up the right side with a flame tip
    s += f'<path d="M205 245Q262 238 258 182Q255 150 236 140Q246 175 228 200Q215 220 196 222Z" fill="url(#fur)" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>'
    s += f'<path d="M236 142Q222 112 240 86Q244 108 256 104Q252 84 268 70Q276 104 262 128Q254 146 236 142Z" fill="url(#fl)" stroke="#7a2a08" stroke-width="2.5"/>'
    # body, chest and paws
    s += f'<ellipse cx="150" cy="205" rx="70" ry="68" fill="url(#fur)" stroke="{INK}" stroke-width="3.5"/>'
    s += '<path d="M120 170Q150 160 180 170Q176 228 150 238Q124 228 120 170Z" fill="#4e3a38" opacity=".9"/>'
    for x in (124, 176):
        s += f'<ellipse cx="{x}" cy="268" rx="22" ry="15" fill="url(#fur)" stroke="{INK}" stroke-width="3"/><path d="M{x - 8} 262v10M{x} 260v12M{x + 8} 262v10" stroke="#ff8a2a" stroke-width="2" opacity=".8"/>'
    # glowing ember cracks
    cracks = 'M98 200l14 8l-6 14M200 196l-12 10l8 12M140 248l8-12l10 6M110 236l10-4'
    s += f'<path d="{cracks}" stroke="#ff7a1a" stroke-width="5" fill="none" filter="url(#glow)" opacity=".9"/><path d="{cracks}" stroke="#ffd060" stroke-width="2" fill="none" stroke-linecap="round"/>'
    # ears
    s += f'<path d="M96 96L80 34L132 72Z" fill="url(#fur)" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M98 86L90 50L120 72Z" fill="#ff7a2a"/>'
    s += f'<path d="M204 96L220 34L168 72Z" fill="url(#fur)" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M202 86L210 50L180 72Z" fill="#ff7a2a"/>'
    # head, flame tuft, muzzle
    s += f'<path d="M150 50Q138 66 144 78Q132 70 134 58Q122 72 132 88L168 88Q178 72 166 58Q168 70 156 78Q162 64 150 50Z" fill="url(#fl)" stroke="#7a2a08" stroke-width="2"/>'
    s += f'<ellipse cx="150" cy="122" rx="66" ry="58" fill="url(#fur)" stroke="{INK}" stroke-width="3.5"/>'
    s += f'<ellipse cx="150" cy="150" rx="32" ry="24" fill="#5c4644" stroke="{INK}" stroke-width="2.5"/>'
    s += f'<ellipse cx="150" cy="138" rx="12" ry="8" fill="#0c0606"/><ellipse cx="146" cy="135" rx="4" ry="2.5" fill="#fff" opacity=".7"/>'
    s += f'<path d="M150 146v8M138 158q12 8 24 0" stroke="{INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M146 160q4 10 8 0" fill="#ff6a6a" stroke="{INK}" stroke-width="1.5"/>'
    s += eye(122, 114, 15, 'url(#ey)') + eye(178, 114, 15, 'url(#ey)')
    s += '<ellipse cx="102" cy="138" rx="9" ry="5" fill="#ff7a5a" opacity=".45"/><ellipse cx="198" cy="138" rx="9" ry="5" fill="#ff7a5a" opacity=".45"/>'
    for (x, y, r) in [(40, 110, 4), (60, 60, 3), (262, 222, 4), (38, 230, 3), (250, 40, 3)]:
        s += f'<circle cx="{x}" cy="{y}" r="{r}" fill="#ffb040"/><circle cx="{x}" cy="{y}" r="{r * 2.2}" fill="#ff7a20" opacity=".25"/>'
    return svg(d, s)


def prismling():  # a tiny white dragon with rainbow crystal wings
    d = '''<radialGradient id="sk" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e4ecfa"/><stop offset="1" stop-color="#b4c4e2"/></radialGradient>
    <radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d8f0ff" stop-opacity=".55"/><stop offset="1" stop-color="#d8f0ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="w1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb0e0"/><stop offset="1" stop-color="#b0a0ff"/></linearGradient>
    <linearGradient id="w2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2a0"/><stop offset="1" stop-color="#a0ffd0"/></linearGradient>
    <linearGradient id="w3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a0e8ff"/><stop offset="1" stop-color="#d0a8ff"/></linearGradient>
    <radialGradient id="ey" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#e0ffff"/><stop offset=".6" stop-color="#30c8f0"/><stop offset="1" stop-color="#0a5890"/></radialGradient>'''
    s = '<circle cx="150" cy="160" r="142" fill="url(#aura)"/>'
    # crystal wings: faceted triangles in rainbow glass
    for side in (1, -1):
        cx = 150
        def X(x): return cx + side * (x - cx)
        facets = [((118, 170), (40, 70), (70, 160), 'url(#w1)'), ((118, 170), (70, 160), (40, 200), 'url(#w2)'), ((118, 170), (40, 70), (100, 96), 'url(#w3)'), ((118, 170), (40, 200), (96, 214), 'url(#w1)')]
        for a, b, c, f in facets:
            s += f'<polygon points="{X(a[0])},{a[1]} {X(b[0])},{b[1]} {X(c[0])},{c[1]}" fill="{f}" fill-opacity=".85" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>'
        s += f'<polyline points="{X(100)},96 {X(40)},70 {X(70)},160 {X(40)},200 {X(96)},214" fill="none" stroke="#3a3a6a" stroke-width="3" stroke-linejoin="round"/>'
    # tail
    s += f'<path d="M190 250Q250 262 262 220Q266 200 250 194Q256 222 228 234Q206 240 192 232Z" fill="url(#sk)" stroke="#2a3050" stroke-width="3.5"/>'
    s += f'<polygon points="250,194 262,176 262,200" fill="url(#w3)" stroke="#2a3050" stroke-width="2"/>'
    # body, belly, feet
    s += f'<ellipse cx="150" cy="205" rx="62" ry="64" fill="url(#sk)" stroke="#2a3050" stroke-width="3.5"/>'
    s += f'<path d="M126 172Q150 162 174 172Q172 236 150 252Q128 236 126 172Z" fill="#f2eaff" stroke="#b0a0d8" stroke-width="2"/>'
    for y in (190, 208, 226): s += f'<path d="M{132 + (y - 190) / 6:.0f} {y}q18 6 {36 - (y - 190) / 3:.0f} 0" stroke="#c0b0e0" stroke-width="2" fill="none"/>'
    for x in (124, 176): s += f'<ellipse cx="{x}" cy="266" rx="19" ry="12" fill="url(#sk)" stroke="#2a3050" stroke-width="3"/><path d="M{x - 8} 274l-2 6M{x} 276v6M{x + 8} 274l2 6" stroke="#2a3050" stroke-width="2.5" stroke-linecap="round"/>'
    # horns and head
    s += f'<path d="M112 84Q96 52 108 36Q114 60 132 74Z" fill="url(#w3)" stroke="#2a3050" stroke-width="3" stroke-linejoin="round"/><path d="M188 84Q204 52 192 36Q186 60 168 74Z" fill="url(#w1)" stroke="#2a3050" stroke-width="3" stroke-linejoin="round"/>'
    s += f'<ellipse cx="150" cy="120" rx="66" ry="56" fill="url(#sk)" stroke="#2a3050" stroke-width="3.5"/>'
    s += f'<path d="M150 66l-8 12h16z" fill="url(#w2)" stroke="#2a3050" stroke-width="2"/>'
    s += f'<ellipse cx="150" cy="150" rx="28" ry="18" fill="#f4f6ff" stroke="#2a3050" stroke-width="2.5"/><circle cx="141" cy="146" r="2.5" fill="#2a3050"/><circle cx="159" cy="146" r="2.5" fill="#2a3050"/>'
    s += f'<path d="M136 158q14 9 28 0" stroke="#2a3050" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    s += eye(122, 116, 16, 'url(#ey)', '#062040') + eye(178, 116, 16, 'url(#ey)', '#062040')
    s += '<ellipse cx="100" cy="140" rx="9" ry="5" fill="#ffb0d0" opacity=".55"/><ellipse cx="200" cy="140" rx="9" ry="5" fill="#ffb0d0" opacity=".55"/>'
    for (x, y, r, c) in [(36, 120, 10, '#ffd0f0'), (264, 120, 9, '#d0f8ff'), (60, 40, 7, '#fff4b0'), (246, 46, 8, '#e0d0ff'), (30, 240, 7, '#d0ffe8')]:
        s += star(x, y, r, c)
    return svg(d, s)


def raven():  # a round raven with violet, star-flecked feathers
    d = '''<radialGradient id="fe" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#4a3c7a"/><stop offset=".6" stop-color="#221a40"/><stop offset="1" stop-color="#0e0a1e"/></radialGradient>
    <radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#a060ff" stop-opacity=".45"/><stop offset="1" stop-color="#a060ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="bk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8d8e8"/><stop offset="1" stop-color="#6a6a88"/></linearGradient>
    <radialGradient id="ey" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#f6e0ff"/><stop offset=".6" stop-color="#b050ff"/><stop offset="1" stop-color="#4a1090"/></radialGradient>'''
    s = '<circle cx="150" cy="160" r="142" fill="url(#aura)"/>'
    # a small crescent moon behind
    s += '<path d="M64 46a34 34 0 1 0 30 52a28 28 0 1 1 -30 -52z" fill="#e8dcff" opacity=".85"/>'
    # twig
    s += f'<path d="M30 268Q150 252 272 262" stroke="#4a3426" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M30 268Q150 252 272 262" stroke="#7a5a40" stroke-width="3" stroke-linecap="round" fill="none"/>'
    # tail feathers
    s += f'<path d="M110 232L60 270L84 274L70 288L120 256Z" fill="url(#fe)" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
    # body
    s += f'<ellipse cx="150" cy="190" rx="70" ry="72" fill="url(#fe)" stroke="{INK}" stroke-width="3.5"/>'
    # folded wing with scalloped feathers and a violet rim
    s += f'<path d="M92 160Q150 150 186 196Q170 244 118 250Q86 226 92 160Z" fill="#1a1432" stroke="{INK}" stroke-width="3"/>'
    for i in range(4):
        s += f'<path d="M{104 + i * 14} {226 - i * 4}q8 14 16 6" stroke="#9a6aff" stroke-width="2.5" fill="none"/>'
    s += f'<path d="M92 160Q150 150 186 196" stroke="#b080ff" stroke-width="2" fill="none" opacity=".7"/>'
    # star flecks in the feathers
    for (x, y, r) in [(120, 180, 3.5), (146, 204, 2.5), (108, 214, 3), (168, 178, 2.5), (134, 232, 2.5), (186, 226, 3)]:
        s += star(x, y, r * 1.8, '#ffffff', 4, .3)
    # feet on the twig
    s += '<path d="M134 258l-6 10M140 259v11M146 258l6 10M164 258l-6 10M170 259v11M176 258l6 10" stroke="#8a8aa8" stroke-width="4" stroke-linecap="round"/>'
    # head and beak (looking right)
    s += f'<circle cx="160" cy="110" r="56" fill="url(#fe)" stroke="{INK}" stroke-width="3.5"/>'
    s += f'<path d="M196 104Q236 112 248 124Q232 132 198 128Z" fill="url(#bk)" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/><path d="M198 118L242 124" stroke="{INK}" stroke-width="2"/>'
    s += f'<path d="M150 58q4 -16 14 -18q-2 10 4 14q6 -12 16 -10q-8 8 -6 18z" fill="url(#fe)" stroke="{INK}" stroke-width="2.5"/>'
    s += f'<circle cx="174" cy="102" r="20" fill="url(#ey)" filter="url(#glow)" opacity=".7"/>' + eye(174, 102, 15, 'url(#ey)', '#1a0430', 2)
    s += '<ellipse cx="190" cy="132" rx="8" ry="4" fill="#c080ff" opacity=".35"/>'
    for (x, y, r) in [(250, 60, 7), (262, 180, 6), (36, 170, 6), (230, 30, 4)]:
        s += star(x, y, r, '#e8dcff')
    return svg(d, s)


def bearcub():  # a round, sleepy brown bear cub with a big black nose
    d = '''<radialGradient id="fu" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#a8744a"/><stop offset=".7" stop-color="#7a4e2c"/><stop offset="1" stop-color="#4a2e18"/></radialGradient>
    <radialGradient id="tan" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#f0d6ac"/><stop offset="1" stop-color="#c8a070"/></radialGradient>
    <radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe0a0" stop-opacity=".4"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></radialGradient>'''
    s = '<circle cx="150" cy="165" r="140" fill="url(#aura)"/>'
    # body, belly, legs and paw pads
    s += f'<ellipse cx="150" cy="208" rx="80" ry="70" fill="url(#fu)" stroke="{INK}" stroke-width="3.5"/>'
    s += f'<ellipse cx="150" cy="218" rx="46" ry="44" fill="url(#tan)" opacity=".9"/>'
    for x in (104, 196):
        s += f'<ellipse cx="{x}" cy="262" rx="30" ry="22" fill="url(#fu)" stroke="{INK}" stroke-width="3"/><ellipse cx="{x}" cy="266" rx="13" ry="10" fill="#5a3a2a"/>'
        for dx in (-13, 0, 13): s += f'<circle cx="{x + dx}" cy="250" r="4.5" fill="#5a3a2a"/>'
    for x in (92, 208): s += f'<ellipse cx="{x}" cy="200" rx="18" ry="30" fill="url(#fu)" stroke="{INK}" stroke-width="3" transform="rotate({20 if x < 150 else -20} {x} 200)"/>'
    # ears
    for x in (92, 208):
        s += f'<circle cx="{x}" cy="68" r="26" fill="url(#fu)" stroke="{INK}" stroke-width="3.5"/><circle cx="{x}" cy="70" r="14" fill="#d8a888"/>'
    # head, muzzle, big nose
    s += f'<ellipse cx="150" cy="118" rx="76" ry="64" fill="url(#fu)" stroke="{INK}" stroke-width="3.5"/>'
    s += f'<ellipse cx="150" cy="146" rx="38" ry="28" fill="url(#tan)" stroke="{INK}" stroke-width="2.5"/>'
    s += f'<ellipse cx="150" cy="134" rx="18" ry="13" fill="#140a06"/><ellipse cx="144" cy="129" rx="6" ry="4" fill="#fff" opacity=".7"/>'
    s += f'<path d="M150 147v8M136 160q14 10 28 0" stroke="{INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    # sleepy eyes: shiny, with heavy lids
    for x in (118, 182):
        s += f'<circle cx="{x}" cy="112" r="10" fill="#140a06"/><circle cx="{x - 3}" cy="109" r="3" fill="#fff"/>'
        s += f'<path d="M{x - 14} 110Q{x} 114 {x + 14} 110L{x + 14} 99L{x - 14} 99Z" fill="#7e5030"/><path d="M{x - 14} 110Q{x} 114 {x + 14} 110" stroke="{INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    s += '<ellipse cx="98" cy="136" rx="10" ry="6" fill="#ff9a8a" opacity=".5"/><ellipse cx="202" cy="136" rx="10" ry="6" fill="#ff9a8a" opacity=".5"/>'
    # a little "z"
    s += '<path d="M232 50h16l-16 18h16M254 26h11l-11 12h11" stroke="#f0e0c0" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>'
    return svg(d, s)


def gryphchick():  # a fluffy golden gryphon chick with oversized wings and a tiny beak
    d = '''<radialGradient id="gf" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#ffe6a0"/><stop offset=".7" stop-color="#e0aa50"/><stop offset="1" stop-color="#a87028"/></radialGradient>
    <radialGradient id="hd" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#fbf0d8"/><stop offset="1" stop-color="#e0c898"/></radialGradient>
    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4d080"/><stop offset="1" stop-color="#a06a28"/></linearGradient>
    <radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff0b0" stop-opacity=".5"/><stop offset="1" stop-color="#fff0b0" stop-opacity="0"/></radialGradient>
    <radialGradient id="ey" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#fff4b0"/><stop offset=".6" stop-color="#f0a020"/><stop offset="1" stop-color="#8a4a08"/></radialGradient>'''
    s = '<circle cx="150" cy="165" r="140" fill="url(#aura)"/>'
    # lion tail with a tuft
    s += f'<path d="M200 240Q250 250 254 210" stroke="{INK}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M200 240Q250 250 254 210" stroke="#e0aa50" stroke-width="5" fill="none" stroke-linecap="round"/>'
    s += f'<path d="M254 214Q240 196 252 182Q256 194 262 192Q262 178 272 176Q274 200 254 214Z" fill="#8a5a24" stroke="{INK}" stroke-width="2.5"/>'
    # oversized wings, feather fingers
    for side in (1, -1):
        def X(x): return 150 + side * (x - 150)
        pts = [(110, 170), (40, 120), (30, 150), (44, 158), (32, 180), (50, 186), (42, 206), (66, 206), (70, 222), (112, 210)]
        s += f'<polygon points="{" ".join(f"{X(x)},{y}" for x, y in pts)}" fill="url(#wg)" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        for (x1, y1, x2, y2) in [(100, 176, 50, 160), (102, 186, 54, 186), (104, 198, 64, 206)]:
            s += f'<path d="M{X(x1)} {y1}L{X(x2)} {y2}" stroke="#8a5a24" stroke-width="2"/>'
    # fluffy body (scalloped edge) and lion feet
    fl = ' '.join(f'Q{150 + 74 * math.cos(a + .14):.0f} {205 + 66 * math.sin(a + .14):.0f} {150 + 68 * math.cos(a + .28):.0f} {205 + 62 * math.sin(a + .28):.0f}' for a in [i * .28 for i in range(23)])
    s += f'<path d="M218 205 {fl}Z" fill="url(#gf)" stroke="{INK}" stroke-width="3.5"/>'
    s += f'<ellipse cx="150" cy="214" rx="36" ry="38" fill="#fff2cc" opacity=".8"/>'
    for x in (124, 176):
        s += f'<ellipse cx="{x}" cy="266" rx="18" ry="12" fill="#f0c060" stroke="{INK}" stroke-width="3"/><path d="M{x - 9} 272l-3 7M{x} 274v7M{x + 9} 272l3 7" stroke="#5a3a10" stroke-width="3" stroke-linecap="round"/>'
    # feathered head with a crest tuft
    s += f'<path d="M140 64Q132 34 146 22Q148 44 156 50Q160 30 176 26Q166 46 168 62Z" fill="url(#hd)" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
    s += f'<ellipse cx="150" cy="118" rx="62" ry="56" fill="url(#hd)" stroke="{INK}" stroke-width="3.5"/>'
    for (x, y) in [(110, 150), (190, 150), (122, 162), (178, 162)]: s += f'<path d="M{x - 6} {y}q6 6 12 0" stroke="#d8b878" stroke-width="2" fill="none"/>'
    # hooked beak
    s += f'<path d="M136 132Q150 124 164 132Q164 150 150 164Q144 152 136 132Z" fill="#f0a020" stroke="#5a3008" stroke-width="2.5" stroke-linejoin="round"/><path d="M140 140Q150 136 160 140" stroke="#5a3008" stroke-width="1.5" fill="none"/>'
    s += eye(120, 112, 16, 'url(#ey)', '#1a0a02') + eye(180, 112, 16, 'url(#ey)', '#1a0a02')
    s += '<ellipse cx="98" cy="136" rx="9" ry="5" fill="#ffa0a0" opacity=".5"/><ellipse cx="202" cy="136" rx="9" ry="5" fill="#ffa0a0" opacity=".5"/>'
    for (x, y, r) in [(40, 60, 8), (262, 70, 9), (266, 250, 6), (30, 250, 6)]:
        s += star(x, y, r, '#fff6c8')
    return svg(d, s)


PETS = {'cos_pet_emberpup': emberpup, 'cos_pet_prismling': prismling, 'cos_pet_raven': raven, 'cos_pet_bearcub': bearcub, 'cos_pet_gryphchick': gryphchick}

if __name__ == '__main__':
    painted = set(json.loads((ROOT / 'gemini' / 'in_game.json').read_text()))
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for name, fn in PETS.items():
            if name in painted: print('skip (painted)', name); continue
            pg = br.new_page(viewport={'width': 300, 'height': 300})
            pg.set_content(f'<html><body style="margin:0;background:transparent">{fn()}</body></html>'); pg.wait_for_timeout(150)
            im = Image.open(io.BytesIO(pg.screenshot(omit_background=True))).convert('RGBA')
            im.save(OUT / f'{name}.webp', 'WEBP', quality=86, method=6)
            print(name, (OUT / f'{name}.webp').stat().st_size // 1024, 'KB'); pg.close()
        br.close()
