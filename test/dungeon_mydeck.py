# #147: "My deck" in a dungeon, within the dungeon level's limit of your own cards.
import asyncio
from playwright.async_api import async_playwright
URL = 'file:///home/claude/raidbound/dist/raidbound.html'
async def main():
    ok = True
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for vp in [{'width': 1440, 'height': 900}, {'width': 390, 'height': 844}]:
            w = vp['width']; pg = await (await b.new_context(viewport=vp, has_touch=w < 600)).new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(500)
            x = await pg.query_selector("text=Let's raid")
            if x: await x.click()
            # a deck with 7 of your own cards; level 3 allows 6, level 4 allows 9
            await pg.evaluate("""(()=>{const s=RB.UI.save, C=RB.CARDS; const st=RB.buildDeck('aldric',null,1); const own=Object.values(C).filter(d=>!RB.isResCard(d)&&d.type!=='master'&&RB.legalFor('aldric',d)&&!st.includes(d.id)).slice(0,7).map(d=>d.id);
              own.forEach(id=>s.owned[id]=Math.max(1,s.owned[id]||0)); s.decks.aldric=st.slice(0,33).concat(own); delete s.lands.aldric; s.dxp=RB.DXP_LEVELS[2]; RB.UI.persist();
              const st2=RB.UI.dungeonState; st2.seats=[{hero:'aldric',auto:false}]; RB.UI.dungeons(); })()""")
            await pg.wait_for_timeout(400)
            info = await pg.evaluate("({lvl:RB.dungeonLevel(RB.UI.save.dxp), extra:RB.dungeonExtra('aldric',RB.UI.save.decks.aldric,RB.defaultLands('aldric'))})"); print(w, info)
            await pg.click('#dungeons [data-ddeck=custom]'); await pg.wait_for_timeout(300)
            note = await pg.inner_text('#dungeons .dnote'); summ = await pg.inner_text('#dungeons .startbar .summary'); print(w, 'L3:', note, '|', summ)
            ok &= 'allows 6' in note and 'dungeon deck' in summ and 'warn' in await pg.get_attribute('#dungeons .dnote', 'class')
            await pg.screenshot(path=f'/home/claude/scratch/dmy_warn_{w}.png')
            await pg.evaluate("RB.UI.save.dxp=RB.DXP_LEVELS[3]; RB.UI.dungeons(true); 0"); await pg.wait_for_timeout(300)
            note = await pg.inner_text('#dungeons .dnote'); summ = await pg.inner_text('#dungeons .startbar .summary'); print(w, 'L4:', note, '|', summ)
            ok &= 'brings 7' in note and 'my deck' in summ
            await pg.screenshot(path=f'/home/claude/scratch/dmy_ok_{w}.png')
            await pg.evaluate("RB.UI.save.settings.speed=0.15; 0")
            await pg.click('#dungeons [data-act=go]'); await pg.wait_for_timeout(2500)
            same = await pg.evaluate("(()=>{const p=RB.UI.currentGame.g.players[0],C=RB.CARDS; const all=[...p.deck,...p.hand,...p.res.map(r=>r.c)].map(c=>c.id).filter(id=>!RB.isResCard(C[id])).sort(); return JSON.stringify(all)===JSON.stringify(RB.UI.save.decks.aldric.slice().sort())})()")
            print(w, 'plays my deck', same, errs); ok &= same and not errs
        await b.close()
    print('RESULT', 'OK' if ok else 'FAIL')
asyncio.run(main())
