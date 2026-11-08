import asyncio
from playwright.async_api import async_playwright
URL='file:///home/claude/raid/dist/raidbound.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for (w,h,name) in [(1280,720,'small'),(1920,1080,'big')]:
            pg = await b.new_page(viewport={'width':w,'height':h})
            errs=[]
            pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(400)
            await pg.click("text=Let's raid"); await pg.wait_for_timeout(200)
            await pg.evaluate("RB.UI.save.settings.speed=0.15")
            await pg.click('#title >> text=Begin a raid'); await pg.wait_for_timeout(300)
            await pg.click('[data-raid=tide]'); await pg.wait_for_timeout(200)
            await pg.click('#setup .seat >> nth=0 >> [data-hero=lyssara]'); await pg.wait_for_timeout(200)
            await pg.click('#setup [data-act=go]'); await pg.wait_for_timeout(1500)
            # give an instant + resources
            await pg.evaluate("(()=>{const E=RB.UI.currentGame;const p=E.g.players[0];p.hand.push({uid:'zz1',id:'icebarrier'});p.hand.push({uid:'zz2',id:'frostnova'});for(let i=0;i<4;i++)p.res.push({c:{uid:'r'+i,id:'fireball'},ex:false});})()")
            # play an ally so the board has stuff
            await pg.evaluate("(async()=>{const E=RB.UI.currentGame;const p=E.g.players[0];p.hand.push({uid:'zz3',id:'lionknight'});await E.playCard(p,p.hand[p.hand.length-1],null);})()")
            await pg.wait_for_timeout(1500)
            await pg.screenshot(path=f'test/i_{name}_board.png')
            await pg.click('#battle [data-act=end]')
            got=False
            for i in range(30):
                await pg.wait_for_timeout(400)
                if await pg.query_selector('.overlay .dialog'):
                    await pg.screenshot(path=f'test/i_{name}_dialog.png'); got=True
                    await pg.click('.overlay [data-v=pass]'); break
            print(name, 'dialog', got, errs or 'no errors')
            await pg.close()
        await b.close()
asyncio.run(main())
