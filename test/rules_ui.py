import asyncio, sys
from playwright.async_api import async_playwright
URL = 'file:///home/claude/raid/dist/raidbound.html'
OUT = '/home/claude/raid/test/'

def deck(h, n):
    return f"RB.buildDeck('{h}', null, {n}).map(id => ({{ id, holo: false }}))"

async def handle_dialogs(pg, tag, seen, rounds=60):
    """Answer every prompt until the hero's turn comes back; screenshot each new kind of prompt once."""
    for i in range(rounds):
        await pg.wait_for_timeout(350)
        dlg = await pg.query_selector('.overlay .dialog')
        if dlg:
            h3 = (await pg.inner_text('.overlay .dialog h3')) if await pg.query_selector('.overlay .dialog h3') else '?'
            kind = 'react' if 'React' in h3 else 'soak' if 'circle' in h3 else 'cover' if h3.startswith('Cover') else 'instant' if 'Answer' in h3 else 'other'
            if kind not in seen:
                seen[kind] = h3
                await pg.screenshot(path=f'{OUT}r_{tag}_{kind}.png')
            if kind == 'soak': await pg.click('.overlay [data-v=yes]')
            elif kind in ('react', 'cover'):
                await pg.click('.overlay [data-v="0"]')
            elif await pg.query_selector('.overlay [data-v=pass]'): await pg.click('.overlay [data-v=pass]')
            elif await pg.query_selector('.overlay [data-v=no]'): await pg.click('.overlay [data-v=no]')
            else: await pg.click('.overlay [data-v] >> nth=0')
            continue
        ph = await pg.evaluate("(()=>{const E=RB.UI.currentGame; return E ? E.g.phase + ':' + E.g.turn + ':' + E.g.round : 'none'})()")
        if ph.startswith('main:0:') and i > 3: return ph
    return 'timeout'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errs = []
        for (w, h, name) in [(1440, 900, 'desk'), (390, 844, 'phone')]:
            pg = await b.new_page(viewport={'width': w, 'height': h})
            pg.on('pageerror', lambda e: errs.append(f'{name} PAGEERROR: ' + str(e)))
            pg.on('console', lambda m: errs.append(f'{name} console: ' + m.text) if m.type == 'error' else None)
            await pg.goto(URL); await pg.wait_for_timeout(500)
            await pg.click("text=Let's raid"); await pg.wait_for_timeout(250)
            # Field Guide
            await pg.evaluate("RB.UI.rules()"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{OUT}r_{name}_guide_basics.png')
            for ch in ['bossturn', 'threat', 'omens', 'raids']:
                await pg.click(f'#rules [data-ch={ch}]'); await pg.wait_for_timeout(250)
                await pg.screenshot(path=f'{OUT}r_{name}_guide_{ch}.png', full_page=(ch == 'raids'))
            # a 3-hero Molten Spire: omens every boss turn, Embers close to full so he takes off
            await pg.evaluate("RB.UI.save.settings.speed=0.12; RB.UI.save.settings.autoDefend=false; RB.UI.save.settings.pauseForInstants=true")
            await pg.evaluate(f"RB.UI.battle({{ raid: 'molten', difficulty: 'normal', party: [{{ hero: 'grukka', auto: false, deck: {deck('grukka',3)}, name: 'Hero 1' }}, {{ hero: 'aldric', auto: true, deck: {deck('aldric',3)}, name: 'Hero 2' }}, {{ hero: 'lyssara', auto: true, deck: {deck('lyssara',3)}, name: 'Hero 3' }}], settings: {{ autoDefend: false, pauseForInstants: true }} }})")
            await pg.wait_for_timeout(1800)
            await pg.evaluate("""(async()=>{const E=RB.UI.currentGame, g=E.g, p=g.players[0];
              for(let i=0;i<5;i++) p.res.push({c:{uid:'r'+i,id:'fireball'},ex:false});
              p.hand.push({uid:'zz1',id:'laststand'}); p.hand.push({uid:'zz2',id:'shieldwall'});
              p.hand.push({uid:'zz3',id:'treant'}); await E.playCard(p, p.hand.find(c=>c.uid==='zz3'), null);
              g.boss.counter = 4; g.round = 2;
              const B=g.boss; const i=B.omens.indexOf('mo_fall'); if(i>=0){B.omens.splice(i,1);} B.omens.push('mo_fall');
              RB.UI.battleRefresh && RB.UI.battleRefresh();})()""")
            await pg.wait_for_timeout(1200)
            await pg.screenshot(path=f'{OUT}r_{name}_molten_board.png')
            # in-battle Rules
            if name == 'desk':
                await pg.click('#battle [data-act=rulesref]'); await pg.wait_for_timeout(300)
                await pg.screenshot(path=f'{OUT}r_{name}_rulesdlg.png')
                await pg.click('.overlay [data-ch=react]'); await pg.wait_for_timeout(200)
                await pg.screenshot(path=f'{OUT}r_{name}_rulesdlg_react.png')
                await pg.click('.overlay [data-v=ok]'); await pg.wait_for_timeout(200)
            await pg.click('#battle [data-act=end]')
            seen = {}
            ph = await handle_dialogs(pg, name, seen)
            await pg.wait_for_timeout(600)
            await pg.screenshot(path=f'{OUT}r_{name}_molten_after.png')
            st = await pg.evaluate("(()=>{const B=RB.UI.currentGame.g.boss; return {flying:B.flying, ground:B.ground, gmax:B.groundMax, omens:B.omens.slice(-3), counter:B.counter}})()")
            print(name, 'molten after boss turn:', ph, st, 'prompts seen:', {k: v[:50] for k, v in seen.items()})
            log = await pg.evaluate("RB.UI.currentGame.g.log.slice(-60).map(e=>e.msg).filter(m=>/Omen|circle|covers|reacts|air|Cinderstorm|strafe/i.test(m)).join(' | ')")
            print('  log:', log[:900])
            # Tide: bail water
            await pg.evaluate("RB.UI.title && RB.UI.title()"); await pg.wait_for_timeout(300)
            await pg.evaluate(f"RB.UI.battle({{ raid: 'tide', difficulty: 'normal', party: [{{ hero: 'thorgrim', auto: false, deck: {deck('thorgrim',1)}, name: 'Hero 1' }}], settings: {{ autoDefend: true, pauseForInstants: true }} }})")
            await pg.wait_for_timeout(1800)
            await pg.evaluate("(()=>{const E=RB.UI.currentGame; E.g.boss.counter=2; RB.UI.battleRefresh && RB.UI.battleRefresh();})()")
            await pg.wait_for_timeout(300)
            before = await pg.evaluate("RB.UI.currentGame.g.boss.counter")
            btn = await pg.query_selector('#battle [data-act=bail]')
            if btn and await btn.is_enabled():
                await btn.click(); await pg.wait_for_timeout(900)
            after = await pg.evaluate("RB.UI.currentGame.g.boss.counter")
            await pg.screenshot(path=f'{OUT}r_{name}_tide_bail.png')
            print(name, 'bail: button', bool(btn), 'tide', before, '->', after)
            await pg.close()
        print('ERRORS:', errs or 'none')
        await b.close()
asyncio.run(main())
