import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox','--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width':900,'height':660})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        for w in sys.argv[1:]:
            await pg.goto('file:///home/claude/raid/test/one.html#'+w); await pg.reload(); await pg.wait_for_timeout(700)
            await pg.screenshot(path=f'test/one_{w.replace(":","_")}.png')
        print(errs or 'ok')
        await b.close()
asyncio.run(main())
