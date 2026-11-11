# #145 regression test. Reproduce: Bob's client receives a "welcome, rejoin" while the party is still in the lobby (what happens when his
# phone reconnects before the server notices the old connection died). Then Ann starts the raid.
import asyncio, subprocess, os, sys, json
from playwright.async_api import async_playwright
import pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
URL=ROOT.joinpath('dist/raidbound.html').as_uri()
MODE = sys.argv[1] if len(sys.argv)>1 else 'stale'
INIT="globalThis.RB = globalThis.RB || {}; globalThis.RB.NET_URL='ws://127.0.0.1:8096'; (()=>{const W=window.WebSocket; window.__ws=[]; window.WebSocket=function(u,p){const s=p?new W(u,p):new W(u); window.__ws.push(s); return s;}; window.WebSocket.prototype=W.prototype; Object.assign(window.WebSocket,{OPEN:1,CLOSED:3,CONNECTING:0,CLOSING:2});})();"
SETUP="RB.UI.save.settings.speed=0.15; RB.RAIDS.crypt.omens = Array(8).fill('cr_bell'); 0"
async def newpage(ctx, errs, name):
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(name+' PAGEERROR: '+str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(700)
    w = await pg.query_selector("text=Let's raid")
    if w: await w.click()
    await pg.evaluate(SETUP)
    return pg
async def dlg(pg):
    d = await pg.query_selector('.overlay .dialog'); return (await d.inner_text()) if d else ''
async def wait_note(pg): return await pg.evaluate("(document.querySelector('.netwait')||{}).textContent||''")
async def main():
    srv = subprocess.Popen(['node', str(ROOT/'server/server.js')], env=dict(os.environ, PORT='8096'), stdout=subprocess.DEVNULL)
    await asyncio.sleep(1)
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
        if MODE == 'stale':
            # Bob's client sends the same "join with my id" a reconnecting client sends, while the party is in the lobby
            await B.evaluate("(()=>{const k=JSON.parse(sessionStorage.getItem('raidbound.online')); window.__ws.at(-1).send(JSON.stringify({t:'join', code:k.code, id:k.id}));})()")
            await B.wait_for_timeout(800)
            print('Bob still in lobby:', await B.evaluate("!!document.querySelector('.bigcode')"))
        await A.click('[data-act=start]'); await A.wait_for_timeout(3000)
        seen={'Ann':0,'Bob':0}; notes=set(); stuck=0
        for step in range(240):
            await A.wait_for_timeout(250)
            for pg,nm in ((A,'Ann'),(B,'Bob')):
                t = await dlg(pg); n = await wait_note(pg)
                if n: notes.add(nm+': '+n)
                if 'step into the circle' in t:
                    seen[nm]+=1; await pg.click('.overlay [data-v=yes]')
                elif t:
                    x = await pg.query_selector('.overlay [data-v=pass], .overlay [data-v=bottom], .overlay [data-v=go], .overlay [data-v=none]')
                    if x:
                        try: await x.click(timeout=800)
                        except Exception: pass
                else:
                    mine = await pg.evaluate("(()=>{const E=RB.UI.currentGame; return !!(E && E.g.phase==='main' && E.g.cfg.party[E.g.turn] && E.g.cfg.party[E.g.turn].name==='%s')})()" % nm)
                    e = await pg.query_selector('#battle [data-act=end]:not([disabled])')
                    if mine and e:
                        try: await e.click(timeout=800)
                        except Exception: pass
            if seen['Ann'] and seen['Bob'] and await A.evaluate("RB.UI.currentGame.g.round>=3"): break
            if 'Getting back in step' in await wait_note(B): stuck+=1
            if stuck>40: break
        r = lambda pg: pg.evaluate("(()=>{const g=RB.UI.currentGame.g; return {round:g.round, phase:g.phase}})()")
        print('MODE', MODE, '| soak choices shown', seen, '| Ann', await r(A), '| Bob', await r(B))
        print('Ann note now:', repr(await wait_note(A)), '| Bob note now:', repr(await wait_note(B)))
        print('notes seen:', sorted(notes))
        print('errors', errs[:4])
        ok = seen['Ann'] >= 1 and seen['Bob'] >= 1 and not await wait_note(B)
        print('RESULT', 'OK' if ok else 'FROZEN')
        await b.close()
    finally: srv.terminate()
asyncio.run(main())
