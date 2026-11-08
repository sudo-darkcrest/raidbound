import asyncio, sys, time
from playwright.async_api import async_playwright
URL='file:///home/claude/raid/dist/raidbound.html'
async def game(b, raid, hero):
    pg = await b.new_page(viewport={'width':1440,'height':900})
    errs=[]
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(300)
    await pg.click("text=Let's raid")
    await pg.evaluate("RB.UI.save.settings.speed=0.05")
    await pg.click('#title >> text=Begin a raid'); await pg.wait_for_timeout(200)
    await pg.click(f'[data-raid={raid}]'); await pg.click(f'#setup .seat >> nth=0 >> [data-hero={hero}]')
    await pg.click('#setup [data-act=go]')
    t0=time.time()
    while time.time()-t0 < 240:
        await pg.wait_for_timeout(250)
        if await pg.query_selector('#end:not(.hidden)'): break
        try:
            if await pg.query_selector('.overlay .dialog'):
                await pg.click('.overlay [data-v=pass], .overlay [data-v=bottom], .overlay [data-v=yes], .overlay [data-v=ok]', timeout=1500); continue
            if await pg.query_selector('#battle [data-act=auto]:not([disabled])'):
                await pg.click('#battle [data-act=auto]:not([disabled])', timeout=1500)
        except Exception as e:
            pass
    res = await pg.evaluate("(()=>{const g=RB.UI.currentGame&&RB.UI.currentGame.g;return g?{over:g.over,round:g.round}:null})()")
    print(raid, hero, res, round(time.time()-t0), 's', errs[:5] or 'no errors')
    await pg.close()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for raid, hero in [('crypt','snix'),('molten','hruna'),('tide','thorgrim')]:
            await game(b, raid, hero)
        await b.close()
asyncio.run(main())
