# #149: a player who makes no move has their turn (or their choice) finished by the AI. The clock is shortened to 6 s.
# Bob's own clock is set very long, so his choice is only answered by Ann's computer (as when his tab is asleep).
import asyncio, subprocess, os, pathlib
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
URL=ROOT.joinpath('dist/raidbound.html').as_uri()
INIT="globalThis.RB = globalThis.RB || {}; globalThis.RB.NET_URL='ws://127.0.0.1:8097';"
SETUP="RB.UI.save.settings.speed=0.15; RB.RAIDS.crypt.omens = Array(8).fill('cr_bell'); 0"
ok=True
def check(n,c,x=''):
    global ok; print(('PASS ' if c else 'FAIL ')+n, '' if c else x); ok = ok and c
async def newpage(ctx, errs, name, idle):
    pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(name+': '+str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(700)
    w = await pg.query_selector("text=Let's raid")
    if w: await w.click()
    await pg.evaluate(SETUP); await pg.evaluate(f"RB.IDLE_MS={idle}; 0")
    return pg
HASH="JSON.stringify([RB.UI.currentGame.g.round, RB.UI.currentGame.g.turn, RB.UI.currentGame.g.boss.damage, RB.UI.currentGame.g.players.map(p=>[p.hero.damage,p.hand.length,p.deck.length,p.res.length])])"
async def main():
    srv = subprocess.Popen(['node', str(ROOT/'server/server.js')], env=dict(os.environ, PORT='8097'), stdout=subprocess.DEVNULL); await asyncio.sleep(1)
    try:
      async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); errs=[]
        ca = await b.new_context(viewport={'width':1440,'height':900}); await ca.add_init_script(INIT)
        cb = await b.new_context(viewport={'width':390,'height':844}); await cb.add_init_script(INIT)
        A = await newpage(ca, errs, 'Ann', 6000); B = await newpage(cb, errs, 'Bob', 6000)
        await A.evaluate("RB.UI.online()"); await A.wait_for_timeout(300)
        await A.fill('#netname','Ann'); await A.click('[data-act=create]'); await A.wait_for_timeout(1500)
        code = await A.evaluate("document.querySelector('.bigcode').textContent")
        await B.evaluate("RB.UI.online({join:'%s'})" % code); await B.wait_for_timeout(300)
        await B.fill('#netname','Bob'); await B.click('[data-act=join]'); await B.wait_for_timeout(1500)
        await A.click('[data-act=start]'); await A.wait_for_timeout(3000)
        # 1) Ann's first turn: nobody touches anything
        t0 = await A.evaluate("RB.UI.currentGame.g.turn")
        await A.wait_for_timeout(2500)
        wa = await A.evaluate("(document.querySelector('.idlewarn')||{}).textContent||''")
        wb = await B.evaluate("(document.querySelector('.idlewarn')||{}).textContent||''")
        check('countdown shown to Ann', 'Still there' in wa, wa); check('countdown shown to Bob', "hasn't moved" in wb, wb)
        await A.screenshot(path=str(ROOT/'test/idle_turn_A.png')); await B.screenshot(path=str(ROOT/'test/idle_turn_B.png'))
        moved=False
        for i in range(40):
            await A.wait_for_timeout(500)
            if await A.evaluate("RB.UI.currentGame.g.turn!==%d || RB.UI.currentGame.g.phase!=='main'" % t0): moved=True; break
        check("Ann's idle turn was finished by the AI", moved)
        await B.evaluate('RB.IDLE_MS=600000; 0')  # from now on only Ann's clock runs
        # 2) Bob plays his turn; at the Soak, Ann answers, Bob doesn't (his own clock is long; Ann's computer answers for him)
        shownB=0; answeredA=0; closed=False
        for step in range(160):
            await A.wait_for_timeout(250)
            for pg,nm in ((A,'Ann'),(B,'Bob')):
                d = await pg.query_selector('.overlay .dialog'); t = (await d.inner_text()) if d else ''
                if 'step into the circle' in t:
                    if nm=='Ann': answeredA+=1; await pg.click('.overlay [data-v=yes]')
                    else:
                        if not shownB: await B.screenshot(path=str(ROOT/'test/idle_soak_B.png'))
                        shownB+=1
                elif t:
                    x = await pg.query_selector('.overlay [data-v=pass], .overlay [data-v=bottom], .overlay [data-v=go], .overlay [data-v=none]')
                    if x:
                        try: await x.click(timeout=800)
                        except Exception: pass
                else:
                    mine = await pg.evaluate("(()=>{const E=RB.UI.currentGame; return !!(E && E.g.phase==='main' && E.g.cfg.party[E.g.turn] && E.g.cfg.party[E.g.turn].name==='%s')})()" % nm)
                    e = await pg.query_selector('#battle [data-act=end]:not([disabled])')
                    if mine and e and nm=='Bob':
                        try: await e.click(timeout=800)
                        except Exception: pass
            if shownB and not await B.query_selector('.overlay .dialog'): closed=True
            if closed and await A.evaluate("RB.UI.currentGame.g.phase==='main'"): break
        check('Bob saw the Soak choice', shownB>0)
        check("Bob's unanswered choice was closed and answered by the AI", closed)
        await A.wait_for_timeout(2500)
        ha, hb = await A.evaluate(HASH), await B.evaluate(HASH)
        check('both games still in step', ha==hb, ha+' vs '+hb)
        check('no page errors', not errs, str(errs[:3]))
        await b.close()
    finally: srv.terminate()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
