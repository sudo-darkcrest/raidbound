# #151: an old save with 30-card decks is topped up to 40 once, starter cards arrive, and the deck plays.
import asyncio, sys
from playwright.async_api import async_playwright
URL = 'file:///home/claude/raidbound/dist/raidbound.html'
OLD = ['holystrike','holystrike','aegis','aegis','consecration','consecration','reckoning','blessing','challenge','footman','footman','lionknight','lionknight','elowen','sentinel','battlemage','battlemage','dawnbreaker','silverblade','silverblade','breastplate','towershield','ironhelm','forgegauntlets','draught','lantern','bram','squire','satchel','asc_aldric']
async def main():
    ok = True
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await (await b.new_context(viewport={'width': 1440, 'height': 900})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(500)
        x = await pg.query_selector("text=Let's raid")
        if x: await x.click()
        await pg.evaluate("""(old)=>{const s=RB.UI.save; delete s.deckV; delete s.starterV; s.decks.aldric=old.slice(); s.owned.asc_aldric=1;
          s.owned.reckoning=1; s.owned.divineshield=0; s.owned.fieldmedic=0;
          s.deckList=[{id:'dkA',name:'Old A',hero:'aldric',cards:old.slice(),lands:RB.defaultLands('aldric')},{id:'dkB',name:'Half',hero:'aldric',cards:old.slice(0,12),lands:RB.defaultLands('aldric')}];
          s.deckUse={aldric:'dkA'}; RB.UI.persist();}""", OLD)
        await pg.reload(); await pg.wait_for_timeout(1700)
        r = await pg.evaluate("""(()=>{const s=RB.UI.save; const a=s.deckList.find(d=>d.id==='dkA'), h=s.deckList.find(d=>d.id==='dkB');
          return {deck:s.decks.aldric.length, same: JSON.stringify(s.decks.aldric)===JSON.stringify(a.cards), named:a.cards.length, half:h.cards.length,
            masters:s.decks.aldric.filter(id=>RB.CARDS[id].type==='master').length, v:s.deckV, sv:s.starterV, ds:s.owned.divineshield, fm:s.owned.fieldmedic,
            over: s.decks.aldric.filter((id,i,arr)=>arr.filter(x=>x===id).length>Math.min(RB.maxCopies(RB.CARDS[id]), s.owned[id]||0)).length,
            toast:(document.querySelector('.toast')||{}).textContent||''}})()""")
        print(r)
        checks = [r['deck'] == 40, r['same'], r['named'] == 40, r['half'] == 12, r['masters'] <= 1, r['v'] == 2, r['sv'] == 2, r['ds'] >= 1, r['fm'] >= 1, r['over'] == 0, '40 cards' in r['toast']]
        print('checks', checks); ok &= all(checks)
        # a second load changes nothing
        await pg.evaluate("RB.UI.save.decks.aldric.pop(); RB.UI.persist()"); await pg.reload(); await pg.wait_for_timeout(1200)
        n = await pg.evaluate("RB.UI.save.decks.aldric.length"); print('reload keeps edits', n == 39); ok &= n == 39
        await pg.evaluate("RB.UI.save.decks.aldric.push('footman'); RB.UI.persist(); RB.UI.save.settings.speed=0.15; RB.UI.setup(); 0"); await pg.wait_for_timeout(400)
        await pg.click('#setup .seat [data-act=custom]'); await pg.wait_for_timeout(300)
        await pg.click('#setup [data-act=go]'); await pg.wait_for_timeout(2500)
        t = await pg.evaluate("(()=>{const p=RB.UI.currentGame.g.players[0],C=RB.CARDS; const all=[...p.deck,...p.hand,...p.res.map(r=>r.c)]; return {total:all.length, res:all.filter(c=>RB.isResCard(C[c.id])).length}})()")
        print('in game', t, errs); ok &= t['total'] == 50 and t['res'] == 10 and not errs
        await b.close()
    print('RESULT', 'OK' if ok else 'FAIL')
asyncio.run(main())
