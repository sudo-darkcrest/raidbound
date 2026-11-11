# #127: Bob's page reconnects while Ann is deciding on the Soul Bell; then it's Bob's turn to decide.
import asyncio, subprocess, os, pathlib, sys
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
URL=ROOT.joinpath('dist/raidbound.html').as_uri()
INIT="globalThis.RB = globalThis.RB || {}; globalThis.RB.NET_URL='ws://127.0.0.1:8092';"
WHO = sys.argv[1] if len(sys.argv)>1 else 'Ann'
SETUP="RB.UI.save.settings.speed=0.15; RB.RAIDS.crypt.omens = Array(8).fill('cr_bell');"
async def newpage(ctx, errs, name):
    pg = await ctx.new_page()
    pg.on('console', lambda m: errs.append(name+' '+m.type+': '+m.text) if m.type=='error' else None)
    pg.on('pageerror', lambda e: errs.append(name+' PAGEERROR: '+str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(700)
    w = await pg.query_selector("text=Let's raid")
    if w: await w.click()
    await pg.evaluate(SETUP)
    return pg
async def dlgtext(pg):
    d = await pg.query_selector('.overlay .dialog')
    return (await d.inner_text()) if d else ''
async def main():
    srv = subprocess.Popen(['node', str(ROOT/'server/server.js')], env=dict(os.environ, PORT='8092', GRACE_MS='30000'))
    await asyncio.sleep(1)
    res = {}
    try:
      async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errs=[]
        ca = await b.new_context(viewport={'width':1440,'height':900}); await ca.add_init_script(INIT)
        cb = await b.new_context(viewport={'width':1280,'height':800}); await cb.add_init_script(INIT)
        A = await newpage(ca, errs, 'Ann'); B = await newpage(cb, errs, 'Bob')
        await A.evaluate("RB.UI.online()"); await A.wait_for_timeout(300)
        await A.fill('#netname','Ann'); await A.click('[data-act=create]'); await A.wait_for_timeout(1500)
        code = await A.evaluate("document.querySelector('.bigcode').textContent")
        await B.evaluate("RB.UI.online({join:'%s'})" % code); await B.wait_for_timeout(300)
        await B.fill('#netname','Bob'); await B.click('[data-act=join]'); await B.wait_for_timeout(1500)
        await A.click('[data-act=start]'); await A.wait_for_timeout(3000)
        reloaded=False; got={'Ann':0,'Bob':0}
        for step in range(400):
            await A.wait_for_timeout(250)
            for pg,nm in ((A,'Ann'),(B,'Bob')):
                t = await dlgtext(pg)
                if 'step into the circle' in t:
                    if nm==WHO and not reloaded:
                        print(WHO, 'is deciding -> Bob reloads'); reloaded=True
                        await B.reload(); await B.wait_for_timeout(800)
                        w = await B.query_selector("text=Let's raid")
                        if w: await w.click()
                        await B.evaluate(SETUP); await B.evaluate("RB.UI.online()"); await B.wait_for_timeout(4000)
                        print('Bob back in battle:', await B.evaluate("!document.querySelector('#battle').classList.contains('hidden')"))
                        t = await dlgtext(pg)
                        if 'step into the circle' not in t: continue
                    got[nm]+=1; print(nm, 'gets the choice'); await pg.click('.overlay [data-v=yes]')
                elif t:
                    x = await pg.query_selector('.overlay [data-v=pass], .overlay [data-v=bottom], .overlay [data-v=go], .overlay [data-v=none]')
                    if x:
                        try: await x.click(timeout=800)
                        except Exception: pass
                else:
                    mine = await pg.evaluate("(()=>{const E=RB.UI.currentGame; return !!(E && E.g.phase==='main' && E.g.cfg.party[E.g.turn] && E.g.cfg.party[E.g.turn].name==='%s')})()" % nm)
                    e = await pg.query_selector('#battle [data-act=end]:not([disabled])')
                    if mine and e and not (got['Ann'] and got['Bob']):
                        try: await e.click(timeout=800)
                        except Exception: pass
            if reloaded and got['Bob']: break
        HASH="JSON.stringify([RB.UI.currentGame.g.round, RB.UI.currentGame.g.boss.damage, RB.UI.currentGame.g.players.map(p=>[p.hero.damage,p.hand.length,p.deck.length])])"
        for i in range(60):
            await A.wait_for_timeout(300)
            for pg in (A,B):
                x = await pg.query_selector('.overlay [data-v=pass], .overlay [data-v=bottom], .overlay [data-v=go], .overlay [data-v=none], .overlay [data-v=yes]')
                if x:
                    try: await x.click(timeout=800)
                    except Exception: pass
            if await A.evaluate("RB.UI.currentGame.g.round>=2 && RB.UI.currentGame.g.phase==='main'"): break
        await A.wait_for_timeout(1500)
        ha, hb = await A.evaluate(HASH), await B.evaluate(HASH)
        print('round 2 reached:', await A.evaluate("RB.UI.currentGame.g.round"), '| in step:', ha==hb, ha, hb)
        wa = await A.evaluate("(document.querySelector('.netwait')||{}).textContent||''")
        wb = await B.evaluate("(document.querySelector('.netwait')||{}).textContent||''")
        print('got', got, '| Ann waiting notice:', wa, '| Bob waiting notice:', wb)
        print('Bob replaying flag:', await B.evaluate("RB.UI.currentGame && RB.UI.currentGame.g && (window.__n=1)") )
        print('errors', errs[:6])
        await b.close()
    finally:
        srv.terminate()
asyncio.run(main())
