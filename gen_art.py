# Builds src/art_gen.js from gen/*.jpg (AI-generated painted card art via SpriteCook)
import base64, pathlib, json
here = pathlib.Path(__file__).parent
entries = {}
for p in sorted((here / 'gen').glob('*.webp')):
    entries[p.stem] = 'data:image/webp;base64,' + base64.b64encode(p.read_bytes()).decode()
ALIASES = {'wolfcomp': 'packleader', 'footman_t': 'footman', 'grunt_t': 'grunt', 'tentaclecard': 'tentacle', 'magmaguard': 'magma', 'whelps': 'whelp', 'sheep': 'polymorph', 'spiritbeast': 'spiritlynx', 'harbormarket': 'booster', 'dawnarchon': 'archon', 'redwarlord': 'warlord', 'tempestavatar': 'tempest'}
js = '/* RAIDBOUND — painted card art generated with SpriteCook (gemini-nano-banana-2.1), art-directed from the project references */\n(function (RB) {\n  const A = RB.ART = RB.ART || {};\n  A.GEN = ' + json.dumps(entries) + ';\n  for (const [a, b] of Object.entries(' + json.dumps(ALIASES) + ')) if (A.GEN[b] && !A.GEN[a]) A.GEN[a] = A.GEN[b];\n})(globalThis.RB = globalThis.RB || {});\n'
(here / 'src' / 'art_gen.js').write_text(js)
print('src/art_gen.js', len(js) // 1024, 'KB', list(entries))
