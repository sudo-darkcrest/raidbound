import sys, asyncio
from playwright.async_api import async_playwright
URL='file:///home/claude/raid/dist/raidbound.html'
async def main(steps):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error',) else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(800)
        await pg.screenshot(path='test/s_title.png')
        # dismiss welcome
        await pg.click('text=Let\'s raid'); await pg.wait_for_timeout(300)
        await pg.click('text=Begin a raid'); await pg.wait_for_timeout(600)
        await pg.screenshot(path='test/s_setup.png', full_page=False)
        await pg.evaluate("RB.UI.save.settings.speed=0.15")
        await pg.click('text=Enter the raid'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path='test/s_battle1.png')
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main(sys.argv[1:]))
