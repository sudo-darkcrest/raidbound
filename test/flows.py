import asyncio
from playwright.async_api import async_playwright
URL='file:///home/claude/raid/dist/raidbound.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width':1440,'height':900})
        pg = await ctx.new_page()
        errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type=='error' else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(500)
        await pg.click("text=Let's raid"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/f_title.png')
        await pg.evaluate("RB.UI.save.settings.speed=0.15")
        # 2-hero party, second AI
        await pg.click('text=Begin a raid'); await pg.wait_for_timeout(300)
        await pg.click('[data-act=add]'); await pg.wait_for_timeout(200)
        await pg.click('.seat >> nth=1 >> [data-hero=hruna]'); await pg.wait_for_timeout(200)
        await pg.click('.seat >> nth=1 >> [data-act=auto]'); await pg.wait_for_timeout(200)
        await pg.evaluate("window.scrollTo(0,0)")
        el = await pg.query_selector('#setup'); await el.evaluate("e=>e.scrollTop=700")
        await pg.screenshot(path='test/f_party.png')
        await pg.click('#setup [data-act=go]'); await pg.wait_for_timeout(1500)
        # human turn: end turn; AI plays second hero; boss acts
        await pg.click('#battle [data-act=end]')
        for i in range(40):
            await pg.wait_for_timeout(500)
            d = await pg.query_selector('.overlay .dialog')
            if d:
                await pg.screenshot(path='test/f_instant.png')
                x = await pg.query_selector('.overlay [data-v=pass], .overlay [data-v=bottom], .overlay [data-v=go]')
                if x: await x.click()
            if await pg.query_selector('#battle [data-act=end]:not([disabled])'): break
        await pg.screenshot(path='test/f_party_battle.png')
        # force a near-win and finish
        await pg.evaluate("(()=>{const E=RB.UI.currentGame; E.g.boss.damage=E.g.boss.maxHp-2;})()")
        await pg.click('#battle [data-act=auto]')
        for i in range(40):
            await pg.wait_for_timeout(500)
            d = await pg.query_selector('.overlay .dialog')
            if d:
                x = await pg.query_selector('.overlay [data-v=pass], .overlay [data-v=bottom]')
                if x: await x.click()
            if await pg.query_selector('#end:not(.hidden)'): break
        await pg.wait_for_timeout(600)
        await pg.screenshot(path='test/f_victory.png')
        await pg.evaluate("Math.random=(()=>{let s=3;return()=>{s=(s*16807)%2147483647;return (s%1000)/1000*0.2;}})()")  # force loot & holo luck
        await pg.click('[data-act=open]'); await pg.wait_for_timeout(1200)
        await pg.click('[data-act=all]'); await pg.wait_for_timeout(2200)
        await pg.screenshot(path='test/f_pack.png')
        await pg.click('[data-act=col]'); await pg.wait_for_timeout(800)
        await pg.screenshot(path='test/f_collection.png')
        # scratch the first loot code
        cv = await pg.query_selector('.scratch canvas')
        if cv:
            bb = await cv.bounding_box()
            await pg.mouse.move(bb['x']+5, bb['y']+5); await pg.mouse.down()
            for yy in range(4):
                for xx in range(0, int(bb['width']), 8):
                    await pg.mouse.move(bb['x']+xx, bb['y']+8+yy*16)
            await pg.mouse.up(); await pg.wait_for_timeout(1200)
        code = await pg.evaluate("RB.UI.save.loot.length ? RB.UI.save.loot[0].code : ''")
        print('loot code', code, await pg.evaluate("RB.UI.save.loot.map(l=>l.scratched)"))
        await pg.screenshot(path='test/f_scratched.png')
        await pg.click('#collection [data-act=back]'); await pg.wait_for_timeout(300)
        await pg.click('#title >> text=The Vault'); await pg.wait_for_timeout(300)
        if code:
            await pg.fill('#code', code); await pg.click('[data-act=redeem]'); await pg.wait_for_timeout(500)
            u = await pg.query_selector('[data-use]')
            if u: await u.click(); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/f_vault.png')
        print('cos', await pg.evaluate("JSON.stringify(RB.UI.save.cos)+' sel '+JSON.stringify(RB.UI.save.sel)"))
        # deck builder
        await pg.click('#vault [data-act=back]'); await pg.wait_for_timeout(300)
        await pg.click('#title >> text=Begin a raid'); await pg.wait_for_timeout(300)
        await pg.click('#setup .seat >> nth=0 >> [data-act=edit]'); await pg.wait_for_timeout(800)
        await pg.screenshot(path='test/f_deck.png')
        await pg.click('#deck [data-f=weapon]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/f_deck_weap.png')
        await pg.click('#deck [data-act=done]'); await pg.wait_for_timeout(300)
        # rules & settings
        await pg.click('#setup [data-act=back]'); await pg.wait_for_timeout(300)
        await pg.click('#title >> text=How to play'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/f_rules.png')
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
