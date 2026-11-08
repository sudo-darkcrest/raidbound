import asyncio
from playwright.async_api import async_playwright
URL='file:///home/claude/raid/dist/raidbound.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(800)
        await pg.screenshot(path='test/s_title.png')
        await pg.evaluate("RB.UI.rules()"); await pg.wait_for_timeout(500)
        await pg.evaluate("document.querySelector('.credits').scrollIntoView()"); await pg.wait_for_timeout(500)
        await pg.screenshot(path='test/s_credits.png')
        import time; t=time.time()
        await pg.evaluate("RB.UI.collection ? RB.UI.collection() : null"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path='test/s_coll.png'); print('collection', round(time.time()-t,1))
        print(errs or 'no errors')
        await b.close()
asyncio.run(main())
