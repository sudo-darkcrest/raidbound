import sys, asyncio, json
from playwright.async_api import async_playwright
URL='file:///home/claude/raid/dist/raidbound.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error',) else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(500)
        await pg.click("text=Let's raid"); await pg.wait_for_timeout(200)
        await pg.evaluate("RB.UI.save.settings.speed=0.15")
        await pg.click('text=Begin a raid'); await pg.wait_for_timeout(300)
        await pg.click('[data-raid=molten]'); await pg.wait_for_timeout(200)
        await pg.click('text=Enter the raid'); await pg.wait_for_timeout(1500)
        # play resource: click first hand card, then "Use as a resource"
        await pg.click('.hand .hc >> nth=0'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/s_pop.png')
        await pg.click('.popover >> text=Use as a resource'); await pg.wait_for_timeout(600)
        # play first playable card
        hc = await pg.query_selector('.hand .hc.play')
        if hc:
            await hc.click(); await pg.wait_for_timeout(300)
            btn = await pg.query_selector('.popover button:not([disabled])')
            await btn.click(); await pg.wait_for_timeout(1200)
            if await pg.query_selector('.tbar'):
                await pg.screenshot(path='test/s_target.png')
                t = await pg.query_selector('.targetable, .friendly-t'); await t.click(); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='test/s_played.png')
        # end turn and let boss act
        await pg.click('#battle [data-act=end]'); await pg.wait_for_timeout(5000)
        await pg.screenshot(path='test/s_after_boss.png')
        # autoplay a few turns
        for i in range(6):
            try:
                await pg.wait_for_selector('#battle [data-act=auto]:not([disabled])', timeout=20000)
                await pg.click('#battle [data-act=auto]')
            except Exception as e:
                print('wait fail', i, e); break
            await pg.wait_for_timeout(500)
            dlg = await pg.query_selector('.overlay .dialog')
            if dlg:
                await pg.screenshot(path=f'test/s_dialog{i}.png')
                b2 = await pg.query_selector('.overlay .dialog [data-v=pass], .overlay .dialog [data-v=bottom]')
                if b2: await b2.click()
        await pg.wait_for_timeout(3000)
        await pg.screenshot(path='test/s_mid.png')
        st = await pg.evaluate("(()=>{const g=RB.UI.currentGame.g; return {round:g.round, over:g.over, boss:RB.UI.currentGame.bossHp(), hero:RB.UI.currentGame.heroHp(g.players[0]), allies:g.players[0].allies.length, minions:g.boss.minions.length}})()")
        print(st)
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
