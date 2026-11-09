# Builds gemini/prompts.html (the Gemini prompt kit). Run: python3 gemini/make_page.py
import sys, json, base64, io, pathlib
here = pathlib.Path(__file__).parent; root = here.parent
sys.path.insert(0, str(here))
from subjects import S, SKINS_PROMPT
from PIL import Image
skins = json.load(open(root / 'skins/skins.json'))
in_game = set(json.load(open(here / 'in_game.json')))
refs = pathlib.Path('/mnt/user-data/outputs/gemini_refs')
def thumb(path, w=150):
    im = Image.open(path).convert('RGB'); im.thumbnail((w, w)); b = io.BytesIO(); im.save(b, 'JPEG', quality=70); return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
style_th = [thumb(refs / f'style_{i+1}.png') for i in range(4)]
HEROES = ['aldric','thorgrim','lyssara','grukka','hruna','snix','vaelith','brannoc','tavra','zizzik','seraphine','korga','dawnarchon','redwarlord','tempestavatar']
hero_th = {h: thumb(refs / f'hero_{h}.png', 120) for h in HEROES}
PREFIX = 'Painted digital fantasy card art for a high-fantasy collectible card game, matching the style of the attached reference images: rich painterly colour, dark ink outlines, dramatic lighting, lots of detail. '
SUFFIX = ' Wide 16:9 landscape image, full-bleed to every edge. No text, no letters, no logo, no border, no frame, no card layout, no watermark. Do not include any real-world logos, emblems, crests or symbols from existing games, films or brands; invent original designs.'
ORDER = ['Legendaries (do these first)', 'Emberfall set (fire, forge and fury)', 'Frostwing set (ice, beasts and the far north)', 'Voidshade set (shadow, stars and secrets)', 'Core set',
         'Raid treasure: Crypt of the Hollow King', 'Raid treasure: The Molten Spire', 'Raid treasure: The Sunken Cathedral', 'Loot card (rare prize)', 'Dungeon under-boss', 'Dungeon boss card: Thornwood Hollow', 'Dungeon boss card: Bloodfang Warcamp', 'Dungeon boss card: Vault of the Iron Sentinel', 'Summoned creatures & minions', 'Boss cards']
items = []
for k, (grp, subj) in S.items():
    if grp == 'Legendary': sec = ORDER[0]
    elif grp.startswith('Boss card'): sec = 'Boss cards'
    elif grp in ('Summoned creature', 'Boss minion'): sec = 'Summoned creatures & minions'
    elif grp.startswith('Raid treasure') or grp.startswith('Dungeon boss card'): sec = grp.split(' (')[0]
    else: sec = grp
    theme = '' if grp in ('Legendary', 'Summoned creature', 'Boss minion') else ' Theme: ' + grp + '.'
    items.append(dict(sec=sec, file=k + '.png', refs='style', have=k in in_game, prompt=PREFIX + 'Subject: ' + subj + '.' + theme + SUFFIX))
items.sort(key=lambda it: ORDER.index(it['sec']) if it['sec'] in ORDER else 99)
names = {'aldric':'Aldric','thorgrim':'Thorgrim','lyssara':'Lyssara','grukka':'Grukka','hruna':'Hruna','snix':'Snix','vaelith':'Vaelith','brannoc':'Brannoc','tavra':'Tavra','zizzik':'Zizzik','seraphine':'Seraphine','korga':'Korga','dawnarchon':'Archon of the Dawn','redwarlord':'Warlord of the Red Moon','tempestavatar':'Avatar of the Tempest'}
for sid, sk in skins.items():
    items.append(dict(sec="Hero skins (attach that hero's picture)", file='skin_' + sid + '.png', refs='hero_' + sk['hero'], title=sk['name'], have=('skin_' + sid) in in_game,
                      prompt=SKINS_PROMPT[sid.split('_', 1)[1]] + ' Keep the same painted fantasy card-art style.' + SUFFIX))
for h in HEROES:
    items.append(dict(sec="Ascended heroes (attach that hero's picture)", file='asc_' + h + '.png', refs='hero_' + h, title=names[h] + ' (Ascended)', have=('asc_' + h) in in_game,
                      prompt='Repaint the attached character as an ascended, empowered version of themselves: the same character, face and pose, now wearing grander ornate armour or robes with gold filigree, surrounded by a radiant glowing aura and light rays, floating sparkles, epic and heroic. Keep the same painted fantasy card-art style.' + SUFFIX))
# Vault items still drawn by code: card backs (tall), table themes (wide) and companions (cut out from a green background)
from subjects import COS
COS_SEC = {'back': 'Vault: card backs (tall 5:7)', 'board': 'Vault: table themes (wide 16:9)', 'pet': 'Vault: companions (on a plain green background)'}
COS_NO = ' No text, no letters, no numbers, no logo, no watermark. Do not include any real-world logos, emblems, crests or symbols from existing games, films or brands; invent original designs.'
COS_PROMPT = {
    'back': 'Painted ornate back of a fantasy trading card for a high-fantasy collectible card game, matching the style of the attached reference images: rich painterly colour, dark ink outlines, lots of fine detail. A perfectly symmetrical design with one large central emblem framed by an ornate decorative border with filigree. Design: {s}. Tall portrait image in a 5:7 ratio (like a playing card), full-bleed to every edge.',
    'board': 'Painted background for the play area of a fantasy card game table, matching the style of the attached reference images: rich painterly colour, dark ink outlines, lots of detail. Cards will be laid on top of it, so keep the middle calm, even and fairly dark, with the richest detail toward the edges and corners. Scene: {s}. Wide 16:9 landscape image, full-bleed to every edge.',
    'pet': 'A cute small companion creature for a fantasy card game, painted in the same style as the attached reference images: rich painterly colour, dark ink outlines. Creature: {s}. Full body, centred, filling most of the picture, on a plain flat solid bright green background (pure #00FF00) with nothing else: no ground, no shadow, no scenery, no green on the creature itself. Square 1:1 image.',
}
for cid, (kind, name, subj) in COS.items():
    items.append(dict(sec=COS_SEC[kind], file='cos_' + cid + '.png', refs='style', title=name, have=('cos_' + cid) in in_game,
                      prompt=COS_PROMPT[kind].format(s=subj) + COS_NO))
tpl = (here / 'page_tpl.html').read_text()
html = tpl.replace('__COUNT__', str(len(items))).replace('__HAVE__', str(sum(1 for i in items if i['have']))).replace('__ITEMS__', json.dumps(items)).replace('__VER__', __import__('hashlib').sha1(json.dumps(sorted(in_game)).encode()).hexdigest()[:10]).replace('__HERO__', json.dumps(hero_th)).replace('__STYLE__', json.dumps(style_th)) \
          .replace('__STYLEFIG__', ''.join(f'<figure><img src="{t}" alt="style reference {i+1}">style_{i+1}.png</figure>' for i, t in enumerate(style_th)))
(here / 'prompts.html').write_text(html)
print(len(items), 'items,', sum(1 for i in items if i['have']), 'already in the game')
