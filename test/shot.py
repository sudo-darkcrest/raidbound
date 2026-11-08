import sys, asyncio
from playwright.async_api import async_playwright
async def main(url, out, w=1280, h=1000, wait=600):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox','--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width':w,'height':h})
        errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        await pg.goto(url)
        await pg.wait_for_timeout(wait)
        await pg.screenshot(path=out, full_page=True)
        print('\n'.join(errs) or 'no errors')
        await b.close()
a=sys.argv
asyncio.run(main(a[1], a[2], int(a[3]) if len(a)>3 else 1280, int(a[4]) if len(a)>4 else 1000, int(a[5]) if len(a)>5 else 600))
