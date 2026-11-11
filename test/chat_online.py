# Party chat and the turn chime (#125): starts the lobby server on port 8090, opens two players (a computer and a phone),
# chats in the lobby and mid-fight, checks muting, the spam limit, rejoin history, the chime, and that both games stay in step.
# Run `python build.py` first, and `npm ci` in server/.
import asyncio, subprocess, os, sys, json, pathlib
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
URL=ROOT.joinpath('dist/raidbound.html').as_uri()
INIT="globalThis.RB = globalThis.RB || {}; globalThis.RB.NET_URL='ws://127.0.0.1:8090'; try{ if(!localStorage.getItem('raidbound.save.v1')){} }catch(e){}"
ok=True
def check(name, cond, extra=''):
    global ok
    print(('PASS ' if cond else 'FAIL ')+name, extra if not cond else '')
    if not cond: ok=False
async def newpage(b, vp, errs, name):
    ctx = await b.new_context(viewport=vp, has_touch=vp['width']<600)
    await ctx.add_init_script(INIT)
    pg = await ctx.new_page()
    pg.on('console', lambda m: errs.append(name+' '+m.type+': '+m.text) if m.type=='error' else None)
    pg.on('pageerror', lambda e: errs.append(name+' PAGEERROR: '+str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(700)
    w = await pg.query_selector("text=Let's raid")
    if w: await w.click()
    await pg.evaluate("RB.UI.save.settings.speed=0.15; RB.UI.save.netName='%s'; window.__al=0; const a=RB.AUDIO.alert; RB.AUDIO.alert=function(n){window.__al++; return a.apply(this,arguments)}; window.__ch=0; const c=RB.UI.sfx.chat; RB.UI.sfx.chat=function(){window.__ch++; return c.apply(this,arguments)}; 0" % name)
    return pg
async def main():
    srv = subprocess.Popen(['node', str(ROOT/'server/server.js')], env=dict(os.environ, PORT='8090', GRACE_MS='1500'))
    await asyncio.sleep(1)
    try:
      async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        errs=[]
        A = await newpage(b, {'width':1440,'height':900}, errs, 'Ann')
        B = await newpage(b, {'width':390,'height':844}, errs, 'Bo<b>b')
        await A.evaluate("RB.UI.online()"); await A.wait_for_timeout(300)
        check('no chat before a party', await A.query_selector('#chatdock') is None)
        await A.fill('#netname','Ann'); await A.click('[data-act=create]'); await A.wait_for_timeout(1500)
        code = await A.evaluate("document.querySelector('.bigcode').textContent")
        check('chat button in lobby', await A.query_selector('#chatdock .chatfab') is not None)
        await A.screenshot(path='test/chat_lobby_A_closed.png')
        await B.evaluate("RB.UI.online({join:'%s'})" % code); await B.wait_for_timeout(300)
        await B.fill('#netname','Bo<b>b'); await B.click('[data-act=join]'); await B.wait_for_timeout(1500)
        # A sends typed message with markup; B closed -> unread + peek
        await A.click('.chatfab'); await A.fill('.chatin', '<img src=x onerror=window.__pwn=1> hi & "there"'); await A.press('.chatin','Enter'); await A.wait_for_timeout(500)
        check('B unread dot', (await B.evaluate("document.querySelector('.chatdot').textContent"))=='1')
        check('B peek shown', await B.evaluate("!document.querySelector('.chatpeek').hidden"))
        check('B chat sound', await B.evaluate("window.__ch")==1, str(await B.evaluate("window.__ch")))
        check('A no sound for own', await A.evaluate("window.__ch")==0, str(await A.evaluate("window.__ch")))
        await B.screenshot(path='test/chat_lobby_B_peek.png')
        await B.click('.chatpeek'); await B.wait_for_timeout(300)
        check('markup shown as text', await B.evaluate("!window.__pwn && !document.querySelector('.chatlist img') && document.querySelector('.chatlist').textContent.includes('<img src=x')"))
        check('name markup as text', True)
        await B.click('.chatquick button >> nth=1'); await B.wait_for_timeout(400)
        await B.screenshot(path='test/chat_lobby_B_open.png')
        check('A sees quick phrase', 'Ready when you are' in await A.evaluate("document.querySelector('.chatlist').textContent"))
        check('A sees B name as text', await A.evaluate("document.querySelector('.chatlist').textContent.includes('Bo<b>b') && !document.querySelector('.chatlist b b')"))
        await A.screenshot(path='test/chat_lobby_A_open.png')
        # mute B on A
        await A.click('.chatmute [data-mute]'); await A.wait_for_timeout(200)
        n0 = await A.evaluate("window.__ch")
        await B.fill('.chatin','muted msg'); await B.press('.chatin','Enter'); await B.wait_for_timeout(400)
        check('muted hidden', 'muted msg' not in await A.evaluate("document.querySelector('.chatlist').textContent"))
        check('muted silent', await A.evaluate("window.__ch")==n0)
        await A.click('.chatmute [data-mute]'); await A.wait_for_timeout(200)
        check('unmute shows again', 'muted msg' in await A.evaluate("document.querySelector('.chatlist').textContent"))
        # typing M in chat must not toggle mute-all
        await A.fill('.chatin',''); await A.type('.chatin','Mm'); 
        check('M key does not mute sound', not await A.evaluate("!!RB.UI.save.settings.muted"))
        await A.fill('.chatin','')
        # spam guard
        for i in range(9): await B.evaluate("document.querySelector('.chatquick button').click()")
        await B.wait_for_timeout(500)
        cnt = await A.evaluate("RB.UI.chatState().log.filter(m=>m.text==='Hello!').length")
        check('spam limited', cnt<=6 and cnt>=3, str(cnt))
        # long text cut
        await A.evaluate("RB.UI.chatState()"); 
        await A.wait_for_timeout(8200)
        # start the raid
        await A.keyboard.press('Escape'); await B.click('.chatx')
        await A.wait_for_timeout(300)
        await A.click('[data-act=start]'); await A.wait_for_timeout(3500)
        check('A in battle', await A.evaluate("!document.querySelector('#battle').classList.contains('hidden')"))
        check('dock inbattle', await B.evaluate("document.querySelector('#chatdock').classList.contains('inbattle')"))
        check('A alerted on own turn', await A.evaluate("window.__al")==1, str(await A.evaluate("window.__al")))
        check('B not alerted yet', await B.evaluate("window.__al")==0)
        await A.screenshot(path='test/chat_battle_A.png'); await B.screenshot(path='test/chat_battle_B.png')
        hashA = "JSON.stringify([RB.UI.currentGame.g.round, RB.UI.currentGame.g.boss.damage, RB.UI.currentGame.g.players.map(p=>[p.hero.damage,p.hand.length,p.deck.length])])"
        # chat during battle
        await B.click('#battle .chatbtn'); await B.wait_for_timeout(300); await B.screenshot(path='test/chat_battle_B_open.png')
        await B.click('.chatquick button >> nth=0'); await B.fill('.chatin','typing mid fight'); await B.press('.chatin','Enter'); await B.wait_for_timeout(400)
        await B.click('.chatx')
        check('A peek in battle', await A.evaluate("!document.querySelector('.chatpeek').hidden"))
        await A.screenshot(path='test/chat_battle_A_peek.png')
        await A.click('.chatfab'); await A.wait_for_timeout(300); await A.screenshot(path='test/chat_battle_A_open.png')
        # A ends turn -> B's turn -> B alerted
        await A.click('#battle [data-act=end]'); 
        for i in range(30):
            await B.wait_for_timeout(300)
            if await B.evaluate("window.__al")>=1: break
        check('B alerted on turn', await B.evaluate("window.__al")==1, str(await B.evaluate("window.__al")))
        check('A not alerted again', await A.evaluate("window.__al")==1)
        # B ends turn; boss acts; answer prompts; back to A
        await B.click('#battle [data-act=end]')
        for i in range(80):
            await A.wait_for_timeout(300)
            for pg in (A,B):
                x = await pg.query_selector('.overlay [data-v=pass], .overlay [data-v=bottom], .overlay [data-v=no], .overlay [data-v=go]')
                if x:
                    try: await x.click(timeout=1000)
                    except Exception: pass
            if await A.evaluate("window.__al")>=2: break
        check('A alerted round 2', await A.evaluate("window.__al")==2, str(await A.evaluate("window.__al")))
        await A.wait_for_timeout(1500)
        ha, hb = await A.evaluate(hashA), await B.evaluate(hashA)
        check('games in step after chatting', ha==hb, ha+' vs '+hb)
        if ha!=hb:
            LOG="RB.UI.currentGame.g.log.map(e=>e.msg.replace(/<[^>]+>/g,''))"
            la, lb = await A.evaluate(LOG), await B.evaluate(LOG)
            for j,(x,y) in enumerate(zip(la,lb)):
                if x!=y: print('  first diff at', j, 'A:', la[max(0,j-6):j+3], 'B:', lb[max(0,j-6):j+3]); break
            else: print('  logs equal prefix', len(la), len(lb), la[-4:], lb[-4:])
        # B reloads (rejoin) -> sees history
        await B.reload(); await B.wait_for_timeout(800)
        w = await B.query_selector("text=Let's raid")
        if w: await w.click()
        await B.evaluate("RB.UI.online()"); await B.wait_for_timeout(4000)
        hist = await B.evaluate("RB.UI.chatState().log.map(m=>m.text)")
        check('history after rejoin', 'typing mid fight' in hist and len(hist)>=5, str(hist))
        check('B back in battle', await B.evaluate("!document.querySelector('#battle').classList.contains('hidden')"))
        await B.wait_for_timeout(1500)
        hb = await B.evaluate(hashA); ha = await A.evaluate(hashA)
        check('in step after rejoin', ha==hb, ha+' vs '+hb)
        check('no replay alerts', await B.evaluate("window.__al||0")<=1, str(await B.evaluate("window.__al||0")))
        # leave -> dock gone
        await A.evaluate("RB.UI.chatState().open && document.querySelector('.chatx').click()")
        await A.click('#battle [data-act=quit]'); await A.click('.overlay [data-v=yes]'); await A.wait_for_timeout(500)
        check('dock gone after leaving', await A.query_selector('#chatdock') is None)
        check('no console errors', not [e for e in errs if 'favicon' not in e], str(errs[:5]))
        await b.close()
    finally:
        srv.terminate()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
