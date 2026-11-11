import asyncio
from playwright.async_api import async_playwright
import pathlib
URL=pathlib.Path(__file__).resolve().parent.parent.joinpath('dist/raidbound.html').as_uri()
ok=True
def check(n,c,x=''):
    global ok
    print(('PASS ' if c else 'FAIL ')+n, '' if c else x)
    if not c: ok=False
async def run(b, vp):
    w=vp['width']; pg = await (await b.new_context(viewport=vp, has_touch=w<600)).new_page(); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    await pg.goto(URL); await pg.wait_for_timeout(500)
    x = await pg.query_selector("text=Let's raid")
    if x: await x.click()
    await pg.evaluate("(()=>{const s=RB.UI.save; s.settings.speed=0.15; s.gold=2000; s.owned.footman=5; s.owned.fireball=4; s.owned.bounty=3; RB.UI.persist();})()")
    # ---- #139 packs
    await pg.evaluate("RB.UI.market({tab:'packs'}); 0"); await pg.wait_for_timeout(400)
    names = await pg.evaluate("[...document.querySelectorAll('#market .packpick .pname')].map(e=>e.textContent)")
    check(f'{w} core pack names', names[:3]==['Core set · 5 cards','Core set · 10 cards','Core set · 20 cards'], str(names))
    check(f'{w} core explain', await pg.evaluate("!!document.querySelector('.coreexplain')"))
    await pg.screenshot(path=f'test/f_packs_{w}.png')
    # ---- #137 workshop
    await pg.evaluate("RB.UI.market({tab:'workshop'}); 0"); await pg.wait_for_timeout(400)
    d0 = await pg.evaluate("RB.UI.save.dust||0")
    await pg.click('.sparelist summary'); await pg.wait_for_timeout(200)
    await pg.screenshot(path=f'test/f_work_{w}.png')
    await pg.click('[data-dust1=footman]'); await pg.wait_for_timeout(300)
    check(f'{w} dust one', await pg.evaluate("RB.UI.save.owned.footman")==4 and await pg.evaluate("RB.UI.save.dust")==d0+5, str(await pg.evaluate("[RB.UI.save.owned.footman, RB.UI.save.dust]")))
    check(f'{w} list stays open', await pg.evaluate("document.querySelector('.sparelist').open"))
    await pg.click('[data-dustall=footman]'); await pg.wait_for_timeout(300)
    check(f'{w} dust stack keeps 2', await pg.evaluate("RB.UI.save.owned.footman")==2)
    check(f'{w} bounty spare (limit 1)', await pg.evaluate("!!document.querySelector('[data-dust1=bounty]')"))
    check(f'{w} bulk button still there', await pg.evaluate("!!document.querySelector('[data-act=dust]')"))
    # ---- #134 decks
    await pg.evaluate("RB.UI.collection(); 0"); await pg.wait_for_timeout(300)
    await pg.click('[data-view=decks]'); await pg.wait_for_timeout(300)
    await pg.select_option('#newdeckhero','lyssara'); await pg.click('[data-dk=new]'); await pg.wait_for_timeout(400)
    await pg.fill('.decknamein','Frost and Fire'); await pg.screenshot(path=f'test/f_deckedit_{w}.png')
    await pg.click('#deck [data-act=done]'); await pg.wait_for_timeout(400)
    r = await pg.evaluate("(()=>{const s=RB.UI.save; return {n:s.deckList.length, name:s.deckList[0].name, use:s.deckUse.lyssara===s.deckList[0].id, mirrored:(s.decks.lyssara||[]).length, onDecks: !!document.querySelector('.deckgrid')}})()")
    check(f'{w} new deck saved, named, in use', r['n']==1 and r['name']=='Frost and Fire' and r['use'] and r['mirrored']==30 and r['onDecks'], str(r))
    await pg.click('[data-dk=copy]'); await pg.wait_for_timeout(300)
    check(f'{w} copy', await pg.evaluate("RB.UI.save.deckList.length")==2)
    # rename inline second deck, then give it to hero
    await pg.fill('.decktile >> nth=1 >> .decknamein','Second deck'); await pg.press('.decktile >> nth=1 >> .decknamein','Tab'); await pg.wait_for_timeout(300)
    await pg.click('.decktile >> nth=1 >> [data-dk=use]'); await pg.wait_for_timeout(300)
    check(f'{w} rename + assign', await pg.evaluate("RB.UI.save.deckList[1].name==='Second deck' && RB.UI.save.deckUse.lyssara===RB.UI.save.deckList[1].id"))
    await pg.screenshot(path=f'test/f_decks_{w}.png')
    # copy to another hero
    await pg.click('.decktile >> nth=0 >> [data-dk=hero]'); await pg.wait_for_timeout(300)
    await pg.screenshot(path=f'test/f_copyhero_{w}.png')
    await pg.click('.overlay [data-v=aldric]'); await pg.wait_for_timeout(500)
    r = await pg.evaluate("(()=>{const s=RB.UI.save,d=s.deckList[2]; return {hero:d.hero, n:d.cards.length, legal:d.cards.every(id=>RB.legalFor('aldric',RB.CARDS[id])), inEditor: !document.querySelector('#deck').classList.contains('hidden')}})()")
    check(f'{w} copy to hero keeps legal cards', r['hero']=='aldric' and r['legal'] and r['n']<30 and r['inEditor'], str(r))
    await pg.click('#deck [data-act=done]'); await pg.wait_for_timeout(300)
    # delete in-use deck -> other becomes in use
    await pg.click('.decktile.inuse [data-dk=del]'); await pg.click('.overlay [data-v=yes]'); await pg.wait_for_timeout(300)
    check(f'{w} delete moves in-use', await pg.evaluate("RB.UI.save.deckList.filter(d=>d.hero==='lyssara').length===1 && RB.UI.save.deckUse.lyssara===RB.UI.save.deckList.find(d=>d.hero==='lyssara').id"))
    # setup "My deck" edit path opens the named deck
    await pg.evaluate("RB.UI.setup(); 0"); await pg.wait_for_timeout(300)
    # bounty limit in resource tab
    await pg.evaluate("RB.UI.deckbuilder('thorgrim', ()=>RB.UI.setup()); 0"); await pg.wait_for_timeout(300)
    await pg.click('#deck .filters [data-f=land]'); await pg.wait_for_timeout(300)
    await pg.click('#deck [data-rml^=land_]'); await pg.wait_for_timeout(200)
    await pg.click('#deck .pool [data-add=bounty]'); await pg.wait_for_timeout(300)
    check(f'{w} bounty limited to 1', await pg.evaluate("document.querySelectorAll('#deck [data-rml=bounty]').length")==1 and '×1' in await pg.evaluate("document.querySelector('#deck [data-rml=bounty]').textContent"), await pg.evaluate("(document.querySelector('.toast')||{}).textContent"))
    await pg.click('#deck [data-act=done]'); await pg.wait_for_timeout(300)
    # ---- battle: #131 chip, #138 discard, #136 bounty stays a resource
    await pg.evaluate("RB.UI.battle({raid:'crypt',difficulty:'normal',seed:9,party:[{hero:'thorgrim',deck:RB.buildDeck('thorgrim',null,1).map(id=>({id,holo:false}))}],settings:{autoDefend:true,pauseForInstants:true}}); 0")
    await pg.wait_for_timeout(2500)
    chip = await pg.evaluate("document.querySelector('#battle .pilechip').textContent")
    g = await pg.evaluate("(()=>{const p=RB.UI.currentGame.g.players[0]; return [p.deck.length,p.grave.length,p.hand.length]})()")
    check(f'{w} pile chip', f'Deck {g[0]}' in chip and f'Discard {g[1]}' in chip, chip)
    await pg.screenshot(path=f'test/f_battle_{w}.png')
    await pg.locator("#battle .hand .hc").last.click(); await pg.wait_for_timeout(300)
    await pg.screenshot(path=f'test/f_pop_{w}.png')
    btn = await pg.query_selector('.popover button:has-text("Discard this card"), .sheet button:has-text("Discard this card")')
    await btn.click(); await pg.wait_for_timeout(500)
    g2 = await pg.evaluate("(()=>{const p=RB.UI.currentGame.g.players[0]; return [p.deck.length,p.grave.length,p.hand.length]})()")
    check(f'{w} discard', g2[1]==g[1]+1 and g2[2]==g[2]-1, str((g,g2)))
    await pg.click('#battle .pilechip'); await pg.wait_for_timeout(300); await pg.screenshot(path=f'test/f_piles_{w}.png')
    check(f'{w} pile dialog lists card', await pg.evaluate("document.querySelectorAll('.pilelist li').length")==1)
    await pg.click('.overlay [data-v=ok]')
    # bounty: play as resource, complete 3 times, still one resource
    r = await pg.evaluate("""(async()=>{const E=RB.UI.currentGame,g=E.g,p=g.players[0]; let c=[...p.hand,...p.deck].find(c=>c.id==='bounty'); if(!c){c={uid:'zz1',id:'bounty'};} if(!p.hand.includes(c)){const i=p.deck.indexOf(c); if(i>=0)p.deck.splice(i,1); p.hand.push(c);} p.resPlayed=false; const n0=p.res.length; await E.playResource(p,c); const r=p.res.find(x=>x.c.id==='bounty'); const out=[p.res.length-n0]; for(let k=0;k<3;k++){g.minionsKilled+=2; const res=await E.completeQuest(p,r); out.push(res.ok, p.res.includes(r), !r.done);} out.push(p.res.filter(x=>x.c.id==='bounty').length, E.available(p)>=0); for(const x of p.res) x.ex=false; out.push(E.available(p)===p.res.length+p.tempRes); return out})()""")
    check(f'{w} bounty stays one resource', r[0]==1 and all(v is True for v in r[1:10]) and r[10]==1 and r[12] is True, str(r))
    check(f'{w} no errors', not errs, str(errs[:3]))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        await run(b, {'width':1440,'height':900}); await run(b, {'width':390,'height':844})
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
