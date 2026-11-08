import base64, pathlib, sys, json, shutil, subprocess
subprocess.run([sys.executable, 'tools/optimize_art.py'], check=True)
man = json.loads(pathlib.Path('dist/art_manifest.json').read_text())
src = pathlib.Path('src')
fonts = [('Grenze Gotisch', 500, 'normal', 'grenze-gotisch-latin-500-normal.woff2'), ('Grenze Gotisch', 700, 'normal', 'grenze-gotisch-latin-700-normal.woff2'), ('Grenze Gotisch', 900, 'normal', 'grenze-gotisch-latin-900-normal.woff2'),
         ('Alegreya', 400, 'normal', 'alegreya-latin-400-normal.woff2'), ('Alegreya', 400, 'italic', 'alegreya-latin-400-italic.woff2'), ('Alegreya', 700, 'normal', 'alegreya-latin-700-normal.woff2'),
         ('Alegreya SC', 700, 'normal', 'alegreya-sc-latin-700-normal.woff2'), ('Alegreya SC', 800, 'normal', 'alegreya-sc-latin-800-normal.woff2')]
ff = ''.join(f"@font-face{{font-family:'{n}';font-weight:{w};font-style:{s};font-display:swap;src:url(data:font/woff2;base64,{base64.b64encode((src/f).read_bytes()).decode()}) format('woff2');}}\n" for n, w, s, f in fonts)
css = (src/'style.css').read_text()
js_rest = '\n'.join((src/f).read_text() for f in ['art_core.js', 'art_fig.js', 'art_obj.js', 'art_hero.js', 'data.js', 'engine.js', 'ai.js', 'cardpower.js', 'frontier.js', 'packs.js', 'expansion.js', 'treasure.js', 'skins.js', 'masters.js', 'dungeons.js', 'ui_core.js', 'audio.js', 'ui_screens.js', 'ui_battle.js', 'online.js', 'ui_treasure.js', 'market.js', 'ui_dungeon.js'])
TPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#070a16">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>Raidbound — a raid card game</title>
<meta name="description" content="A high-fantasy deck-building card game: build a deck, assemble your party and bring down a raid boss.">
<style>
__FF__
__CSS__
</style>
</head>
<body>
<div id="app"></div>
<script>
__JS__
</script>
</body>
</html>
"""
def art_module(urls):
    return '/* RAIDBOUND - painted art (gen/*.webp, optimised by tools/optimize_art.py) */\n(function (RB) {\n  const A = RB.ART = RB.ART || {};\n  A.GEN = ' + json.dumps(urls) + ';\n  A.BAKED = true;\n})(globalThis.RB = globalThis.RB || {});\n'
def page(art_js, extra=''):
    return TPL.replace('__FF__', ff).replace('__CSS__', css).replace('__JS__', art_js + '\n' + extra + js_rest)
art_dir = pathlib.Path('dist/art')
# 1) single-file download: every picture packed inside as a data URI (plays offline by double-clicking)
data = {k: 'data:image/webp;base64,' + base64.b64encode((art_dir / f).read_bytes()).decode() for k, f in man.items()}
single = page(art_module(data))
out = pathlib.Path('dist/raidbound.html'); out.write_text(single)
print(out, round(len(single) / 1024), 'KB (single file)')
# 2) website: a small page; pictures are separate cached files fetched only when shown
web = pathlib.Path('dist/web'); shutil.rmtree(web, ignore_errors=True); (web / 'art').mkdir(parents=True)
for f in set(man.values()): shutil.copy2(art_dir / f, web / 'art' / f)
idx = page(art_module({k: 'art/' + f for k, f in man.items()}), 'globalThis.RB.WEB_BUILD = true;\n')
(web / 'index.html').write_text(idx)
print(web / 'index.html', round(len(idx) / 1024), 'KB + art', round(sum((web / 'art' / f).stat().st_size for f in set(man.values())) / 1024), 'KB')
shutil.copy2(out, web / 'Raidbound.html')  # the website also offers the offline download
