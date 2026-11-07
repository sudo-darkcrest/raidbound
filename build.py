import base64, pathlib, sys
src = pathlib.Path('src')
fonts = [('Grenze Gotisch', 500, 'normal', 'grenze-gotisch-latin-500-normal.woff2'), ('Grenze Gotisch', 700, 'normal', 'grenze-gotisch-latin-700-normal.woff2'), ('Grenze Gotisch', 900, 'normal', 'grenze-gotisch-latin-900-normal.woff2'),
         ('Alegreya', 400, 'normal', 'alegreya-latin-400-normal.woff2'), ('Alegreya', 400, 'italic', 'alegreya-latin-400-italic.woff2'), ('Alegreya', 700, 'normal', 'alegreya-latin-700-normal.woff2'),
         ('Alegreya SC', 700, 'normal', 'alegreya-sc-latin-700-normal.woff2'), ('Alegreya SC', 800, 'normal', 'alegreya-sc-latin-800-normal.woff2')]
ff = ''.join(f"@font-face{{font-family:'{n}';font-weight:{w};font-style:{s};font-display:swap;src:url(data:font/woff2;base64,{base64.b64encode((src/f).read_bytes()).decode()}) format('woff2');}}\n" for n, w, s, f in fonts)
css = (src/'style.css').read_text()
js = '\n'.join((src/f).read_text() for f in ['art_gen.js', 'art_core.js', 'art_fig.js', 'art_obj.js', 'art_hero.js', 'data.js', 'engine.js', 'ai.js', 'ui_core.js', 'audio.js', 'ui_screens.js', 'ui_battle.js', 'ui_treasure.js'])
html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Raidbound — a raid card game</title>
<meta name="description" content="A high-fantasy deck-building card game: build a deck, assemble your party and bring down a raid boss.">
<style>
{ff}
{css}
</style>
</head>
<body>
<div id="app"></div>
<script>
{js}
</script>
</body>
</html>
"""
out = pathlib.Path('dist/raidbound.html'); out.write_text(html)
print(out, round(len(html)/1024), 'KB')
