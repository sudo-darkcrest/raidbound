# Clicks every Market transaction in a real browser and checks the books after each one.
# python3 test/market_sim.py
import asyncio, json
from playwright.async_api import async_playwright
URL = 'file:///home/claude/raid/dist/raidbound.html'
INV = """(() => { const s = RB.UI.save, bad = [];
  if (!(s.gold >= 0) || !Number.isInteger(s.gold)) bad.push('gold ' + s.gold);
  if (!((s.dust||0) >= 0) || !Number.isInteger(s.dust||0)) bad.push('dust ' + s.dust);
  for (const [id, n] of Object.entries(s.owned)) { if (!RB.CARDS[id]) bad.push('unknown card ' + id); if (!(n >= 0) || !Number.isInteger(n)) bad.push('owned ' + id + '=' + n); if ((s.holo[id]||0) > n) bad.push('holo>owned ' + id); }
  return bad; })()"""
SNAP = "(() => { const s = RB.UI.save; return { gold: s.gold, dust: s.dust||0, cards: Object.values(s.owned).reduce((a,b)=>a+b,0), heroes: s.heroes.length, skins: (s.skinsOwned||[]).length, packs: JSON.stringify(s.packs||{}), loot: s.loot.length }; })()"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await (await b.new_context(viewport={'width': 1400, 'height': 900})).new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        pg.on('console', lambda m: errs.append('console ' + m.text) if m.type == 'error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(500); await pg.click("text=Let's raid"); await pg.wait_for_timeout(200)
        problems = []; log = []
        async def snap(): return await pg.evaluate(SNAP)
        async def inv(tag):
            bad = await pg.evaluate(INV)
            if bad: problems.append(f'{tag}: {bad[:4]}')
        async def market(tab, gold=None):
            js = (f"RB.UI.save.gold={gold};" if gold is not None else '') + f"RB.UI.market({{tab:'{tab}'}})"
            await pg.evaluate(js); await pg.wait_for_timeout(150)
        def expect(tag, cond, detail=''):
            log.append(('OK  ' if cond else 'BAD ') + tag + (' ' + detail if detail else ''))
            if not cond: problems.append(tag + ' ' + detail)
        # fresh save
        await pg.evaluate("Object.assign(RB.UI.save,{gold:0,dust:0,owned:{},holo:{},packs:{},heroes:[],skinsOwned:[],skins:{},wins:{},heroicWins:{},shop:null,goldCodes:[]}); RB.UI.persist()")

        # ---- booster packs ----
        for st in ['ember', 'frost', 'void']:
            await market('packs', 1000); a = await snap()
            await pg.click(f'.setpick button[data-style={st}]'); await pg.wait_for_timeout(1300)
            z = await snap()
            expect(f'booster {st}', z['gold'] == a['gold'] - 100 and z['cards'] == a['cards'] + 5 and json.loads(z['packs']).get(st, 0) == json.loads(a['packs']).get(st, 0) + 1, f"{a} -> {z}")
            await inv('booster ' + st)
        # not enough gold
        await market('packs', 99); a = await snap()
        await pg.evaluate("document.querySelector('.setpick .tcgpack[data-style=frost]').click()"); await pg.wait_for_timeout(1300)
        z = await snap(); expect('booster with 99 gold refused', z['gold'] == 99 and z['cards'] == a['cards'], f'{a}->{z}')
        # double click race on the pack art (no disabled state there)
        await market('packs', 1000); a = await snap()
        await pg.evaluate("const e=document.querySelector('.setpick .tcgpack[data-style=void]'); e.click(); e.click(); e.click();"); await pg.wait_for_timeout(1400)
        z = await snap(); expect('triple-click buys one pack', z['gold'] == a['gold'] - 100 and z['cards'] == a['cards'] + 5, f'{a}->{z}')
        # buy-again triple click
        a = await snap()
        await pg.evaluate("const e=document.querySelector('.againbox button[data-act=buyagain]'); e.click(); e.click();"); await pg.wait_for_timeout(1400)
        z = await snap(); expect('buy-again double-click buys one pack', z['gold'] == a['gold'] - 100 and z['cards'] == a['cards'] + 5, f'{a}->{z}')
        # leave mid-animation then buy from the market again (lock must clear)
        await pg.evaluate("document.querySelector('.againbox button[data-act=buyagain]').click(); RB.UI.title();"); await pg.wait_for_timeout(1400)
        await market('packs', 1000); a = await snap()
        await pg.click('.setpick button[data-style=ember]'); await pg.wait_for_timeout(1300)
        z = await snap(); expect('can buy after leaving mid-opening', z['gold'] == a['gold'] - 100, f'{a}->{z}')
        await inv('packs')

        # ---- raid treasure ----
        await market('treasure', 5000); a = await snap()
        await pg.evaluate("document.querySelectorAll('.treasurepick .tcgpack').forEach(e=>e.click())"); await pg.wait_for_timeout(1200)
        z = await snap(); expect('locked treasure cannot be bought', z['gold'] == a['gold'], f'{a}->{z}')
        await pg.evaluate("RB.UI.save.wins={crypt:1,molten:1,tide:1}; RB.UI.save.heroicWins={crypt:1,molten:1,tide:1}")
        for raid in ['crypt', 'molten', 'tide']:
            for h, cost in [('0', 450), ('1', 650)]:
                await market('treasure', 5000); a = await snap()
                before = await pg.evaluate("JSON.stringify(RB.UI.save.owned)")
                await pg.click(f'button[data-act=tbuy][data-raid={raid}][data-h="{h}"]'); await pg.wait_for_timeout(1300)
                z = await snap()
                got = await pg.evaluate(f"(() => {{ const b={before}, s=RB.UI.save.owned, out=[]; for (const id in s) for (let k=0;k<s[id]-(b[id]||0);k++) out.push(id+':'+RB.CARDS[id].rarity+':'+(RB.CARDS[id].treasure||RB.CARDS[id].raid||'')); return out; }})()")
                expect(f'treasure {raid} heroic={h}', z['gold'] == a['gold'] - cost and z['cards'] == a['cards'] + 5, f"{a['gold']}->{z['gold']} cards+{z['cards']-a['cards']} {got}")
        await inv('treasure')

        # ---- card shop ----
        await market('shop', 2000)
        stock = await pg.evaluate("RB.shopStock()")
        for cid in stock:
            await market('shop'); a = await snap()
            await pg.click(f'button[data-shop="{cid}"]'); await pg.wait_for_timeout(150)
            z = await snap(); expect(f'shop buy {cid}', z['cards'] == a['cards'] + 1 and z['gold'] < a['gold'], f"{a['gold']}->{z['gold']}")
            a = await snap(); await pg.evaluate(f"(() => {{ const b=document.createElement('button'); b.dataset.shop='{cid}'; document.querySelector('#market .page').appendChild(b); b.click(); }})()"); await pg.wait_for_timeout(150)
            z = await snap(); expect(f'shop rebuy {cid} blocked', z['gold'] == a['gold'] and z['cards'] == a['cards'])
        # forged shop button for a card that is NOT in today's stock
        a = await snap()
        await pg.evaluate("(() => { const b=document.createElement('button'); b.dataset.shop='guinevere'; document.querySelector('#market .page').appendChild(b); b.click(); })()"); await pg.wait_for_timeout(150)
        z = await snap(); expect('shop: card not in stock cannot be bought', z['cards'] == a['cards'], f"{a}->{z}")
        await inv('shop')

        # ---- workshop: dust and craft ----
        await pg.evaluate("(() => { const s=RB.UI.save; const ids=RB.FRONTIER.slice(0,6); ids.forEach(id=>{s.owned[id]=5; s.holo[id]=5;}); s.owned.guinevere=3; s.holo.guinevere=1; s.owned.footman=9; })()")
        await market('workshop', 3000); a = await snap()
        exp = await pg.evaluate("(() => { const V={c:5,u:10,r:25,e:60,l:150}; let d=0; for (const [id,n] of Object.entries(RB.UI.save.owned)) { const c=RB.CARDS[id]; if (!c||c.set==='core'||c.set==='loot') continue; const sp=n-RB.maxCopies(c); if (sp>0) d+=sp*(V[c.rarity]||5); } return d; })()")
        await pg.click('button[data-act=dust]'); await pg.wait_for_timeout(200)
        z = await snap(); expect('dust spares', z['dust'] == a['dust'] + exp and z['gold'] == a['gold'], f"dust {a['dust']}->{z['dust']} expected +{exp}")
        left = await pg.evaluate("(() => { const s=RB.UI.save, o=[]; for (const id of RB.FRONTIER.slice(0,6)) o.push(s.owned[id]+'/'+s.holo[id]); o.push('footman '+s.owned.footman); return o; })()")
        expect('dust keeps a full playset and core cards', all(x.startswith(('1/', '2/')) for x in left[:6]) and left[6] == 'footman 9', str(left))
        await inv('dust')
        for rar in ['c', 'u', 'r', 'e', 'l']:
            cid = await pg.evaluate(f"(RB.FRONTIER.map(id=>RB.CARDS[id]).find(d=>d.rarity==='{rar}')||{{}}).id")
            if not cid: log.append('no frontier card of rarity ' + rar); continue
            await pg.evaluate(f"RB.UI.save.dust=2000; RB.UI._ws={{set:RB.CARDS['{cid}'].pack, missing:false}}"); await market('workshop', 3000); a = await snap()
            await pg.click(f'button[data-craft="{cid}"]'); await pg.wait_for_timeout(150)
            z = await snap(); expect(f'craft {rar} {cid}', z['cards'] == a['cards'] + 1, f"dust {a['dust']}->{z['dust']} gold {a['gold']}->{z['gold']}")
        await pg.evaluate("RB.UI.save.dust=0"); await market('workshop', 3000); a = await snap()
        await pg.evaluate("(() => { const b=document.createElement('button'); b.dataset.craft=RB.FRONTIER[0]; document.querySelector('#market .page').appendChild(b); b.click(); })()"); await pg.wait_for_timeout(150)
        z = await snap(); expect('craft with 0 dust blocked', z['cards'] == a['cards'])
        for bad in ['footman', 'concordbanner', 'malgareth', 'loot_owl']:
            await pg.evaluate("RB.UI.save.dust=5000"); await market('workshop', 5000); a = await snap()
            await pg.evaluate(f"(() => {{ const b=document.createElement('button'); b.dataset.craft='{bad}'; document.querySelector('#market .page').appendChild(b); try {{ b.click(); }} catch(e) {{}} }})()"); await pg.wait_for_timeout(150)
            z = await snap(); expect(f'forged craft of non-workshop card {bad} blocked', z['cards'] == a['cards'], f"{a}->{z}")
        await inv('workshop')

        # ---- heroes and skins ----
        gh = await pg.evaluate("RB.UNLOCK_HEROES.filter(id=>RB.HEROES[id].unlock.how.startsWith('gold:')).map(id=>[id,+RB.HEROES[id].unlock.how.slice(5)])")
        for hid, cost in gh:
            await market('heroes', cost - 1); a = await snap()
            await pg.evaluate(f"(() => {{ const b=document.querySelector('[data-buyhero={hid}]'); b.disabled=false; b.click(); }})()"); await pg.wait_for_timeout(150)
            z = await snap(); expect(f'hero {hid} with {cost-1} gold refused', z['heroes'] == a['heroes'] and z['gold'] == cost - 1)
            await market('heroes', cost * 3); a = await snap()
            await pg.click(f'[data-buyhero={hid}]'); await pg.wait_for_timeout(150)
            z = await snap(); expect(f'hero {hid} bought', z['heroes'] == a['heroes'] + 1 and z['gold'] == a['gold'] - cost, f"{a}->{z}")
            a = await snap(); await pg.evaluate(f"(() => {{ const b=document.createElement('button'); b.dataset.buyhero='{hid}'; document.querySelector('#market .page').appendChild(b); b.click(); }})()"); await pg.wait_for_timeout(150)
            z = await snap(); expect(f'hero {hid} cannot be bought twice', z['gold'] == a['gold'] and z['heroes'] == a['heroes'], f"{a}->{z}")
        skin = await pg.evaluate("Object.keys(RB.SKINS).find(s=>RB.UI.heroOpen(RB.SKINS[s].hero))")
        price = await pg.evaluate("RB.SKIN_PRICE")
        await market('heroes', price); a = await snap()
        await pg.click(f'[data-skinbuy="{skin}"]'); await pg.wait_for_timeout(150)
        z = await snap(); expect(f'skin {skin} bought', z['skins'] == a['skins'] + 1 and z['gold'] == 0)
        lockedskin = await pg.evaluate("Object.keys(RB.SKINS).find(s=>!RB.UI.heroOpen(RB.SKINS[s].hero))")
        if lockedskin:
            await market('heroes', 5000); a = await snap()
            await pg.evaluate(f"(() => {{ const b=document.createElement('button'); b.dataset.skinbuy='{lockedskin}'; document.querySelector('#market .page').appendChild(b); b.click(); }})()"); await pg.wait_for_timeout(150)
            z = await snap(); expect(f'skin for a locked hero ({lockedskin}) blocked', z['skins'] == a['skins'], f"{a}->{z}")
        await pg.click(f'[data-skinoff]'); await pg.wait_for_timeout(100)
        await pg.click(f'[data-skinuse="{skin}"]'); await pg.wait_for_timeout(100)
        expect('skin use/off', await pg.evaluate(f"RB.UI.heroSkin(RB.SKINS['{skin}'].hero)==='{skin}'"))
        await inv('heroes')

        # ---- gold codes ----
        code = await pg.evaluate("RB.UI.makeGoldCode(250)")
        await market('packs', 0)
        await pg.fill('#goldcode', code); await pg.click('button[data-act=goldcode]'); await pg.wait_for_timeout(150)
        z = await snap(); expect('gold code +250', z['gold'] == 250, str(z['gold']))
        await pg.fill('#goldcode', code.lower().replace('-', ' ')); await pg.click('button[data-act=goldcode]'); await pg.wait_for_timeout(150)
        z = await snap(); expect('same gold code (reformatted) refused', z['gold'] == 250, str(z['gold']))
        await pg.fill('#goldcode', 'RBG-AAAAA-AAAAA'); await pg.click('button[data-act=goldcode]'); await pg.wait_for_timeout(150)
        z = await snap(); expect('invalid gold code refused', z['gold'] == 250)
        lootc = await pg.evaluate("RB.UI.makeCode('pet_owl')")
        await pg.evaluate(f"RB.UI.save.gold=0; RB.UI.vault()"); await pg.wait_for_timeout(150)
        await pg.fill('#code', lootc); await pg.click('button[data-act=redeem]'); await pg.wait_for_timeout(150)
        expect('loot code unlocks the owlet', await pg.evaluate("RB.UI.save.cos.includes('pet_owl')"))
        expect('loot code gives no gold', await pg.evaluate("RB.UI.save.gold") == 0)
        await inv('codes')

        print('\n'.join(log)); print('\nPROBLEMS:', problems or 'none'); print('PAGE ERRORS:', errs or 'none')
        await b.close()
asyncio.run(main())
