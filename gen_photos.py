# Builds src/art_photos.js from photos/*.jpg (Unsplash backgrounds, painterly-processed)
import base64, json, pathlib
HERE = pathlib.Path(__file__).parent
CREDITS = {
 'volcano':   ('80x3QULJDN4', 'Tetiana GRY'),
 'crypt':     ('gYC68k9trV8', 'Rodion Kutsaiev'),
 'crypthall': ('pDKoVuXYKxU', 'JOHN TOWNER'),
 'sunken':    ('2hYbl6NPjow', 'William Veitch'),
 'sea':       ('t2SuwdpGAqc', 'mali desha'),
 'forest':    ('rr2EF3J5F2Y', 'Dejan Zakic'),
 'peaks':     ('7NgQUco_yak', 'Tomasz Smal'),
 'castle':    ('HLJ7B89D5QY', 'Tom Morbey'),
 'arcane':    ('VSAFwtkmQQ0', 'Casper van Battum'),
 'temple':    ('M_duJG81Kv4', 'Tomás Robertson'),
 'holy':      ('kKwpHgzvsS8', 'Liu JiaWei'),
 'tavern':    ('m1Gg_wrU_rw', 'Andrew Ridley'),
 'forge':     ('ah9tydIdlKA', 'Peter Yost'),
 'storm':     ('R9L7ukhBSgs', 'Michał Mancewicz'),
 'steppe':    ('_bdP00Y61ww', 'Sam Farallon'),
 'rooftops':  ('ospetyKwn3k', 'Guillaume Boulanger'),
 'grove':     ('7aEhliQraPI', 'Erik van Dijk'),
 'altar':     ('CBc0AWfjZ2c', 'Annie Spratt'),
 'frost':     ('UZOpP-YHe9Q', 'Sami Matias Breilin'),
 'void':      ('eNoeWZkO7Zc', 'Alexander Andrews'),
}
LABEL = {'volcano':'Volcanic skies','crypt':'Crypt graveyard','crypthall':'Crypt halls','sunken':'Sunken depths','sea':'Storm sea','forest':'Misty forest','peaks':'Mountain peaks','castle':'Castle dusk','arcane':'Arcane night','temple':'Temple nave','holy':'Holy light','tavern':'Tavern hearth','forge':'Forge sparks','storm':'Lightning','steppe':'Steppe sunset','rooftops':'Rooftops & moon','grove':'Druid grove','altar':'Candle altar','frost':'Frozen north','void':'The Void'}
ph = {}; cr = []
for k, (pid, who) in CREDITS.items():
    ph[k] = 'data:image/jpeg;base64,' + base64.b64encode((HERE / 'photos' / f'{k}.jpg').read_bytes()).decode()
    cr.append({'scene': k, 'label': LABEL[k], 'by': who, 'url': f'https://unsplash.com/photos/{pid}?utm_source=raidbound&utm_medium=referral'})
js = '/* RAIDBOUND — photographic backdrops (Unsplash License), painterly-processed and colour-graded per scene in art_core.js */\n(function (RB) {\n  const A = RB.ART = RB.ART || {};\n'
js += '  A.PHOTOS = ' + json.dumps(ph, separators=(',', ':')) + ';\n'
js += '  A.CREDITS = ' + json.dumps(cr, ensure_ascii=False, indent=1) + ';\n'
js += '})(globalThis.RB = globalThis.RB || {});\n'
(HERE / 'src' / 'art_photos.js').write_text(js)
print('src/art_photos.js', len(js)//1024, 'KB')
