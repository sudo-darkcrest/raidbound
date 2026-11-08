import asyncio, sys
from playwright.async_api import async_playwright
# usage: zoom.py key x0 y0 x1 y1  (region in 300x220 art units)
async def main():
    key=sys.argv[1]; x0,y0,x1,y1=map(float,sys.argv[2:6])
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox','--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width':900,'height':660}, device_scale_factor=2.5)
        await pg.goto('file:///home/claude/raid/test/one.html#'+key); await pg.reload(); await pg.wait_for_timeout(700)
        k=3
        await pg.screenshot(path='test/zoom.png', clip={'x':x0*k,'y':y0*k,'width':(x1-x0)*k,'height':(y1-y0)*k})
        await b.close()
asyncio.run(main())
