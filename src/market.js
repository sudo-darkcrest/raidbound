/* RAIDBOUND — the Market (#27, #44, #45, #46, #47, #53).
   Tabs: Booster packs · Card shop (daily stock) · Workshop (dust crafting) · Raid treasure · Heroes & skins. */
(function (RB) {
  const U = RB.UI, C = RB.CARDS, A = RB.ART;
  const { $, esc } = U;
  const save = U.save;

  const SHOP_PRICE = { c: 40, u: 80, r: 160, e: 320 };
  const DUST_VALUE = { c: 5, u: 10, r: 25, e: 60, l: 150 };
  const CRAFT = { c: [20, 20], u: [40, 40], r: [100, 80], e: [240, 160], l: [600, 300] }; // [dust, gold]
  RB.TREASURE_PRICE = { normal: 450, heroic: 650 };
  const RAR = { c: 'Common', u: 'Uncommon', r: 'Rare', e: 'Epic', l: 'Legendary' };

  const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const untilMidnight = () => { const d = new Date(), m = new Date(d); m.setHours(24, 0, 0, 0); const mins = Math.round((m - d) / 60000); return `${Math.floor(mins / 60)}h ${mins % 60}m`; };
  // today's stock: one card from each booster set plus one wildcard, never Legendary
  RB.shopStock = (key) => {
    const r = A.rng(A.hash('raidbound-shop-' + (key || dayKey())));
    const pool = k => RB.packPool(k).filter(d => d.rarity !== 'l');
    const out = [];
    for (const k of ['ember', 'frost', 'void']) { const p = pool(k).filter(d => !out.includes(d.id)); out.push(p[Math.floor(r() * p.length)].id); }
    const all = RB.FRONTIER.map(id => C[id]).filter(d => d.rarity !== 'l' && !out.includes(d.id) && (d.rarity === 'r' || d.rarity === 'e'));
    out.push(all[Math.floor(r() * all.length)].id);
    return out;
  };
  const shopState = () => { if (!save.shop || save.shop.day !== dayKey()) save.shop = { day: dayKey(), bought: [] }; return save.shop; };

  // spares = copies beyond what one deck can use (booster and raid treasure cards; core and loot cards never)
  const dustable = d => d && d.set !== 'core' && d.set !== 'loot';
  const spares = () => Object.entries(save.owned).map(([id, n]) => ({ d: C[id], n: n - RB.maxCopies(C[id] || {}) })).filter(x => dustable(x.d) && x.n > 0);
  const grant = id => { save.owned[id] = (save.owned[id] || 0) + 1; };

  const tabs = [['packs', 'Booster packs'], ['shop', 'Card shop'], ['workshop', 'Workshop'], ['treasure', 'Raid treasure'], ['heroes', 'Heroes & skins']];

  U.market = function (opts) {
    opts = opts || {};
    const tab = opts.tab || U._mtab || 'packs'; U._mtab = tab;
    save.dust = save.dust || 0;
    const price = RB.PACK_PRICE;
    const head = `<div class="pagehead"><button class="btn ghost small" data-act="back">← Title</button><h2>The Market</h2><span class="sp"></span><span class="dustchip" title="Dust: made from spare cards in the Workshop">✦ ${save.dust} dust</span><span class="goldchip big">${save.gold} gold</span></div>
      <div class="mtabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === tab}" class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>`;
    let body = '';

    if (tab === 'packs') {
      const fr = RB.FRONTIER, have = fr.filter(id => (save.owned[id] || 0) > 0).length;
      body = `<p class="lede">Every raid pays you gold, win or lose. Each wrapper is its own set of cards. A pack holds <b>5 cards</b>: at least three from that set (one uncommon or better), and the rest are usually from the set too, with the odd regular card. Some come as holofoils, and each set hides one very rare <b class="legend">Legendary</b>. Open 5 of one kind to unlock its table theme.</p>
      <div class="packrow">${Object.entries(RB.PACK_STYLES).map(([k, v]) => { const PS = RB.PACK_SETS[k], pool = RB.packPool(k), got = pool.filter(d => (save.owned[d.id] || 0) > 0).length, opened = (save.packs || {})[k] || 0;
        return `<div class="packpick setpick" style="--sc:${PS.col}">${U.packHTML({ theme: k, art: v.art, act: 'buy', set: PS.name + ' Set', data: `data-style="${k}"`, label: `Buy a ${v.name} booster pack for ${price} gold` })}<div class="pname">${v.name}</div><div class="ptheme">${esc(PS.theme)}</div><p class="pblurb">${esc(PS.blurb)}</p><div class="pgot"><b>${got}</b> of ${pool.length} found · ${opened} opened</div><button class="btn small ${save.gold >= price ? 'primary' : ''}" data-act="buy" data-style="${k}" ${save.gold >= price ? '' : 'disabled'}>Buy — ${price} gold</button></div>`; }).join('')}</div>
      ${save.gold < price ? `<p class="lede" style="text-align:center">You need ${price - save.gold} more gold for a pack. Go raid!</p>` : ''}
      <p class="lede" style="text-align:center">You have found <b>${have} of ${fr.length}</b> booster cards.</p>
      <div class="codebox goldcode"><span>Have a gold code?</span><input id="goldcode" placeholder="RBG-XXXXX-XXXXX" aria-label="Gold code" maxlength="17"><button class="btn" data-act="goldcode">Redeem</button>${opts.msg ? `<span class="${opts.msg.ok ? 'okmsg' : 'errmsg'}">${esc(opts.msg.text)}</span>` : ''}</div>`;
    }

    if (tab === 'shop') {
      const st = shopState(), stock = RB.shopStock();
      body = `<p class="lede">Four booster cards for sale today, one from each set plus a rare find. Buy the exact card you want instead of hoping for it in a pack. Each one can be bought once a day. <b>New stock in ${untilMidnight()}.</b></p>
      <div class="shopgrid">${stock.map(id => { const d = C[id], cost = SHOP_PRICE[d.rarity] || 80, bought = st.bought.includes(id), own = save.owned[id] || 0, PS = RB.PACK_SETS[d.pack];
        return `<div class="shopitem" style="--sc:${PS ? PS.col : '#d8a84a'}"><div class="shopcard" data-card="${id}">${U.cardHTML(id, {})}</div><div class="sinfo"><span class="rar-${d.rarity}">${RAR[d.rarity]}</span> · ${PS ? PS.name : ''}<br><small>You own ${own}</small></div>
          ${bought ? '<button class="btn small" disabled>Bought today</button>' : `<button class="btn small ${save.gold >= cost ? 'primary' : ''}" data-shop="${id}" ${save.gold >= cost ? '' : 'disabled'}>Buy — ${cost} gold</button>`}</div>`; }).join('')}</div>`;
    }

    if (tab === 'workshop') {
      const sp = spares(), spN = sp.reduce((s, x) => s + x.n, 0), spDust = sp.reduce((s, x) => s + x.n * (DUST_VALUE[x.d.rarity] || 5), 0);
      const ws = U._ws || (U._ws = { set: 'ember', missing: true });
      const list = RB.FRONTIER.map(id => C[id]).filter(d => d.pack === ws.set && (!ws.missing || !(save.owned[d.id] > 0))).sort((a, b) => 'curel'.indexOf(a.rarity) - 'curel'.indexOf(b.rarity) || a.cost - b.cost);
      body = `<p class="lede">Turn spare cards into <b>dust</b>, then spend dust and a little gold to make the exact card you want. A spare is any copy beyond what a deck can hold (2 of most cards, 1 of Unique cards). Your deck copies are never touched.</p>
      <div class="dustbox"><div><b>${spN}</b> spare card${spN === 1 ? '' : 's'} → <b>✦ ${spDust} dust</b><br><small>${sp.slice(0, 8).map(x => `${esc(x.d.name)} ×${x.n}`).join(', ')}${sp.length > 8 ? '…' : ''}</small></div>
        <button class="btn ${spN ? 'primary' : ''}" data-act="dust" ${spN ? '' : 'disabled'}>Turn spares into dust</button></div>
      <p class="kwhat">Dust per spare: ${Object.entries(DUST_VALUE).map(([r, v]) => `${RAR[r]} ${v}`).join(' · ')}. Crafting costs: ${Object.entries(CRAFT).map(([r, [d, g]]) => `${RAR[r]} ${d} dust + ${g} gold`).join(' · ')}.</p>
      <div class="filters">${Object.entries(RB.PACK_SETS).map(([k, v]) => `<button class="btn small ${ws.set === k ? '' : 'ghost'}" data-wsset="${k}">${v.name}</button>`).join('')}<label class="toggle" style="margin-left:1rem"><input type="checkbox" data-wsmiss ${ws.missing ? 'checked' : ''}> Only cards I don't have</label></div>
      <div class="craftgrid">${list.map(d => { const [dc, gc] = CRAFT[d.rarity] || CRAFT.c, can = save.dust >= dc && save.gold >= gc, own = save.owned[d.id] || 0;
        return `<div class="craftitem"><div class="shopcard" data-card="${d.id}">${U.cardHTML(d.id, {})}</div><small>Own ${own}</small><button class="btn small ${can ? 'primary' : ''}" data-craft="${d.id}" ${can ? '' : 'disabled'}>Craft — ✦${dc} + ${gc}g</button></div>`; }).join('') || '<p class="lede">You have every card in this set. Nice!</p>'}</div>`;
    }

    if (tab === 'treasure') {
      const P = RB.TREASURE_PRICE;
      body = `<p class="lede">Buy an extra treasure pack from a raid you have already beaten. Same as the pack you win: a guaranteed treasure card from that raid as a holofoil, plus rares and a chance of a loot card. Treasure is precious, so these cost a lot more than booster packs.</p>
      <div class="packrow">${Object.values(RB.RAIDS).map(raid => { const won = (save.wins[raid.id] || 0) > 0, hw = (save.heroicWins[raid.id] || 0) > 0, theme = raid.id === 'crypt' ? 'void' : raid.id === 'tide' ? 'frost' : 'ember';
        return `<div class="packpick setpick treasurepick ${won ? '' : 'locked'}" style="--sc:${raid.theme || '#d8a84a'}">${U.packHTML({ theme, img: U.art(raid.art, 'raid:' + raid.id), wide: true, act: won ? 'tbuy' : '', data: `data-raid="${raid.id}" data-h="0"`, cls: 'treasure', title: 'Raid Treasure', set: raid.name, count: '5 cards', label: `Buy a ${raid.name} treasure pack` })}
          <div class="pname">${esc(raid.short)}</div><div class="ptheme">${esc(raid.name)}</div>
          ${won ? `<button class="btn small ${save.gold >= P.normal ? 'primary' : ''}" data-act="tbuy" data-raid="${raid.id}" data-h="0" ${save.gold >= P.normal ? '' : 'disabled'}>Treasure pack — ${P.normal} gold</button>
            ${hw ? `<button class="btn small ${save.gold >= P.heroic ? 'primary' : ''}" data-act="tbuy" data-raid="${raid.id}" data-h="1" ${save.gold >= P.heroic ? '' : 'disabled'}>Heroic treasure — ${P.heroic} gold</button>` : '<small>Beat it on Heroic to buy Heroic treasure.</small>'}`
            : `<span class="chip">🔒 Defeat ${esc(raid.short)} first</span>`}</div>`; }).join('')}</div>`;
    }

    if (tab === 'heroes') {
      const heroes = RB.UNLOCK_HEROES.map(id => {
        const h = RB.HEROES[id], open = U.heroOpen(id), buy = h.unlock.how.startsWith('gold:') ? +h.unlock.how.slice(5) : 0;
        return `<div class="mhero ${open ? 'open' : ''}"><img alt="" src="${U.cardArt(id)}"><div><h4>${esc(h.name)}</h4><div class="sub">${RB.FACTIONS[h.fac].short} ${esc(h.race)} ${RB.CLASSES[h.cls].name} · ${h.hp} health</div><p><b>${esc(h.power.name)}:</b> ${esc(h.power.text)}</p>
          ${open ? '<span class="chip ok">Unlocked — pick them in raid setup</span>' : buy ? `<button class="btn small ${save.gold >= buy ? 'primary' : ''}" data-buyhero="${id}" ${save.gold >= buy ? '' : 'disabled'}>Buy for ${buy} gold</button>` : `<span class="chip">To unlock: ${esc(h.unlock.text)}</span>`}</div></div>`;
      }).join('');
      const G = A.GEN || {}, SP = RB.SKIN_PRICE;
      const skins = Object.entries(RB.SKINS).map(([sid, s]) => {
        const h = RB.HEROES[s.hero], own = U.ownsSkin(sid), using = U.heroSkin(s.hero) === sid, open = U.heroOpen(s.hero);
        return `<div class="skin ${using ? 'using' : ''}"><div class="skinimg"><img alt="" src="${G['skin_' + sid] || ''}">${using ? '<span class="eq">In use</span>' : ''}</div><h4>${esc(s.name)}</h4><p class="cdesc">${esc(s.desc)}</p>
          ${!open ? `<span class="chip">Unlock ${esc(h.name.split(' ')[0])} first</span>` : !own ? `<button class="btn small ${save.gold >= SP ? 'primary' : ''}" data-skinbuy="${sid}" ${save.gold >= SP ? '' : 'disabled'}>Buy — ${SP} gold</button>` : using ? `<button class="btn small ghost" data-skinoff="${s.hero}">Use the original look</button>` : `<button class="btn small" data-skinuse="${sid}">Use this skin</button>`}</div>`;
      }).join('');
      body = `<h3 class="sec" style="margin-top:.4rem">Hero skins</h3><p class="lede">A new look for a hero you already play: black obsidian plate, polished gold, winter silver or new robes. Your skin shows on the hero card, in raid setup and in the party list. Just for looks: skins never change the rules.</p>
        <div class="skingrid">${skins}</div>
        <h3 class="sec">Heroes for hire</h3><p class="lede">Six more heroes join the fight once you earn them. Some are unlocked by beating raids, some are bought here.</p><div class="mheroes">${heroes}</div>`;
    }

    const el = U.show('market', `<div class="page">${head}${body}</div>`, !!opts.keep);
    el.onclick = e => {
      const tb = e.target.closest('[data-tab]'); if (tb) return U.market({ tab: tb.dataset.tab });
      const a = e.target.closest('[data-act]');
      const bh = e.target.closest('[data-buyhero]');
      if (bh) { const id = bh.dataset.buyhero, hd = RB.HEROES[id]; if (!hd || !hd.unlock || !String(hd.unlock.how).startsWith('gold:') || U.heroOpen(id) || save.heroes.includes(id)) return; const cost = +hd.unlock.how.slice(5); if (save.gold < cost) return U.toast('Not enough gold yet.'); save.gold -= cost; save.heroes.push(id); U.persist(); U.sfx.quest(); U.toast(`${RB.HEROES[id].name} joins you! Pick them in raid setup.`); return U.market({ keep: true }); }
      const sh = e.target.closest('[data-shop]');
      if (sh) { const id = sh.dataset.shop; if (!C[id] || !RB.shopStock().includes(id)) return; const cost = SHOP_PRICE[C[id].rarity] || 80, st = shopState(); if (st.bought.includes(id) || save.gold < cost) return; save.gold -= cost; grant(id); st.bought.push(id); U.persist(); U.sfx.treasure(); U.toast(`${C[id].name} added to your collection.`); return U.market({ keep: true }); }
      const cr = e.target.closest('[data-craft]');
      if (cr) { const d = C[cr.dataset.craft]; if (!d || !RB.FRONTIER.includes(d.id)) return; const [dc, gc] = CRAFT[d.rarity] || CRAFT.c; if (save.dust < dc || save.gold < gc) return; save.dust -= dc; save.gold -= gc; grant(d.id); U.persist(); U.sfx.quest(); U.toast(`Crafted ${d.name}!`); return U.market({ keep: true }); }
      const ss = e.target.closest('[data-wsset]'); if (ss) { U._ws.set = ss.dataset.wsset; return U.market({ keep: true }); }
      const sb = e.target.closest('[data-skinbuy]');
      if (sb) { const sid = sb.dataset.skinbuy; if (!RB.SKINS[sid] || !U.heroOpen(RB.SKINS[sid].hero) || save.gold < RB.SKIN_PRICE || U.ownsSkin(sid)) return; save.gold -= RB.SKIN_PRICE; (save.skinsOwned = save.skinsOwned || []).push(sid); (save.skins = save.skins || {})[RB.SKINS[sid].hero] = sid; U.persist(); U.sfx.quest(); U.toast(`${RB.SKINS[sid].name} unlocked and in use.`); return U.market({ keep: true }); }
      const su = e.target.closest('[data-skinuse]'); if (su) { const sid = su.dataset.skinuse; (save.skins = save.skins || {})[RB.SKINS[sid].hero] = sid; U.persist(); U.sfx.flip(); return U.market({ keep: true }); }
      const so = e.target.closest('[data-skinoff]'); if (so) { delete (save.skins || {})[so.dataset.skinoff]; U.persist(); U.sfx.flip(); return U.market({ keep: true }); }
      if (!a) return;
      const act = a.dataset.act;
      if (act === 'back') return U.title();
      if (act === 'goldcode') return U.market({ msg: U.redeemGold($('#goldcode').value) });
      if (act === 'dust') {
        let gained = 0, n = 0;
        for (const x of spares()) { gained += x.n * (DUST_VALUE[x.d.rarity] || 5); n += x.n; save.owned[x.d.id] -= x.n; if (save.holo[x.d.id] > save.owned[x.d.id]) save.holo[x.d.id] = save.owned[x.d.id]; }
        save.dust += gained; U.persist(); U.sfx.heal && U.sfx.heal(); U.toast(`${n} spare card${n === 1 ? '' : 's'} turned into ${gained} dust.`); return U.market({ keep: true });
      }
      if (act === 'buy') {
        if (save.gold < price) return U.toast(`A pack costs ${price} gold. You have ${save.gold}.`);
        if (!U.packLock()) return;
        save.gold -= price; U.persist();
        const st = a.dataset.style || 'ember';
        const packEl = a.classList.contains('tcgpack') ? a : $(`.tcgpack[data-style="${st}"]`, el);
        return U.openPack(null, false, packEl, RB.rollBooster(null, st));
      }
      if (act === 'tbuy') {
        const raidId = a.dataset.raid, heroic = a.dataset.h === '1', cost = heroic ? RB.TREASURE_PRICE.heroic : RB.TREASURE_PRICE.normal;
        if (!(save.wins[raidId] > 0) || (heroic && !(save.heroicWins[raidId] > 0))) return;
        if (save.gold < cost) return U.toast(`A treasure pack costs ${cost} gold. You have ${save.gold}.`);
        if (!U.packLock()) return;
        save.gold -= cost; U.persist();
        const packEl = a.classList.contains('tcgpack') ? a : $(`.tcgpack[data-raid="${raidId}"]`, el);
        return U.openPack(raidId, heroic, packEl, null, { market: true });
      }
    };
    el.onchange = e => { if (e.target.matches('[data-wsmiss]')) { U._ws.missing = e.target.checked; U.market({ keep: true }); } };
    el.onkeydown = e => { if (e.key === 'Enter' && /buy|tbuy/.test(e.target.dataset.act || '')) e.target.click(); if (e.key === 'Enter' && e.target.id === 'goldcode') el.querySelector('[data-act=goldcode]').click(); };
    el.onmouseover = e => { const c = e.target.closest('.shopcard'); if (c && innerWidth > 900) U.preview(U.cardHTML(c.dataset.card, {}), c); };
    el.onmouseout = e => { if (e.target.closest('.shopcard')) U.hidePreview(); };
  };
})(globalThis.RB);
