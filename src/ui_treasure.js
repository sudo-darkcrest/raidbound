/* RAIDBOUND — treasure packs, holofoils, loot cards; app boot */
(function (RB) {
  const U = RB.UI, C = RB.CARDS;
  const { $, $$, esc } = U;
  const save = U.save;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  U.rollPack = function (raidId, heroic) {
    const raid = RB.RAIDS[raidId];
    const core = Object.values(C).filter(d => d.set === 'core');
    const rares = core.filter(d => d.rarity === 'r'), uncs = core.filter(d => d.rarity === 'u'), coms = core.filter(d => d.rarity === 'c');
    const out = [];
    out.push({ id: pick(raid.treasure), holo: true });
    if (Math.random() < (heroic ? 0.5 : 0.3)) { const others = raid.treasure.filter(t => t !== out[0].id); out.push({ id: pick(others), holo: heroic }); }
    else out.push({ id: pick(rares).id, holo: Math.random() < (heroic ? 0.6 : 0.3) });
    out.push({ id: pick(uncs).id, holo: Math.random() < 0.15 });
    out.push({ id: pick(coms).id, holo: Math.random() < 0.1 });
    if (Math.random() < (heroic ? 0.4 : 0.25)) out.push({ id: pick(Object.values(C).filter(d => d.set === 'loot')).id, holo: true, loot: true });
    else out.push({ id: pick(coms).id, holo: Math.random() < 0.1 });
    if (heroic) { const plain = out.find(x => !x.holo); if (plain) plain.holo = true; }
    return out;
  };
  U.openPack = function (raidId, heroic, packEl, given) {
    const cards = given || U.rollPack(raidId, heroic);
    const booster = !!given;
    const style = booster ? (given.style || 'ember') : null, PS = booster ? RB.PACK_SETS[style] : null;
    if (booster) { save.packs = save.packs || {}; save.packs[style] = (save.packs[style] || 0) + 1; }
    // add to collection right away so nothing is lost if the page closes
    for (const c of cards) {
      save.owned[c.id] = (save.owned[c.id] || 0) + 1;
      if (c.holo) save.holo[c.id] = (save.holo[c.id] || 0) + 1;
      if (C[c.id].loot) save.loot.push({ id: c.id, code: U.makeCode(C[c.id].loot.reward), scratched: false, redeemed: false });
    }
    U.persist();
    const newBoards = booster && U.checkUnlocks ? U.checkUnlocks() : [];
    U.sfx.treasure();
    packEl.classList.add('tear');
    setTimeout(() => {
      const el = U.show('end', `<div class="endscreen"><h2 style="font-size:clamp(2.4rem,5vw,4rem)${PS ? `;color:${PS.col}` : ''}">${booster ? `${PS.name} booster` : 'Treasure'}</h2><p class="tagline">${PS ? `${esc(PS.theme)} · ` : ''}Click each card to reveal it.</p>
        <div class="packcards">${cards.map((c, i) => `<div class="flip ${C[c.id].rarity === 'e' ? 'epic' : ''}" data-i="${i}" style="animation-delay:${i * 0.12}s" tabindex="0" role="button" aria-label="Reveal card ${i + 1}"><div class="inner"><div class="face"><div class="cardback" style="--cw:100%;width:100%"></div></div><div class="face front">${U.cardHTML(c.id, { holo: c.holo })}</div></div></div>`).join('')}</div>
        <div id="lootnote"></div>
        ${booster ? `<div class="againbox"><div class="againhead"><b>Open another pack?</b><span class="goldchip">${save.gold} gold</span><span class="againcost">${RB.PACK_PRICE} gold each</span></div>
          <div class="packrow mini">${Object.entries(RB.PACK_STYLES).map(([k, v]) => `<div class="packpick">${U.packHTML({ theme: k, art: v.art, act: 'buyagain', set: RB.PACK_SETS[k].name + ' Set', cls: save.gold >= RB.PACK_PRICE ? '' : 'broke', data: `data-style="${k}"`, label: `Buy another ${v.name} booster pack for ${RB.PACK_PRICE} gold` })}<div class="pname">${v.name}${k === style ? ' <small>(again)</small>' : ''}</div></div>`).join('')}</div>
          ${save.gold >= RB.PACK_PRICE ? `<button class="btn primary" data-act="buyagain">Another ${PS.name} pack — ${RB.PACK_PRICE} gold</button>` : `<p class="tagline" style="margin:.6rem 0 0">You need ${RB.PACK_PRICE - save.gold} more gold for another pack. Go raid!</p>`}</div>` : ''}
        <div class="menu" style="flex-direction:row;justify-content:center;margin-top:1.6rem"><button class="btn" data-act="all">Reveal all</button>${booster ? `<button class="btn primary" data-act="market">Back to the Market</button>` : `<button class="btn primary" data-act="again">Raid again</button>`}<button class="btn" data-act="col">View collection</button><button class="btn ghost" data-act="title">Title</button></div></div>`);
      if (newBoards && newBoards.length) setTimeout(() => U.toast(`Unlocked: ${newBoards.map(id => RB.COSMETICS[id].name).join(', ')}! Pick it in the Vault.`), 1200);
      $$('.packcards .card', el).forEach(c => c.style.setProperty('--cw', '100%'));
      $$('.packcards .card', el).forEach(c => { c.style.width = '100%'; });
      const flip = f => { if (f.classList.contains('on')) return; f.classList.add('on'); U.sfx.flip(); const c = cards[+f.dataset.i]; if (C[c.id].rarity === 'e') setTimeout(() => U.sfx.quest(), 250); if (C[c.id].loot) showLoot(); };
      const showLoot = () => { const n = $('#lootnote'); if (n.innerHTML) return; n.innerHTML = `<p class="tagline" style="margin:1.4rem 0 0">A loot card! Scratch off its code in your Collection, then redeem it in the Vault.</p>`; };
      el.onclick = e => {
        const f = e.target.closest('.flip'); if (f) return flip(f);
        const a = e.target.closest('[data-act]'); if (!a) return;
        if (a.dataset.act === 'all') return $$('.flip', el).forEach((f, i) => setTimeout(() => flip(f), i * 180));
        if (a.dataset.act === 'again') return U.setup();
        if (a.dataset.act === 'market') return U.market();
        if (a.dataset.act === 'buyagain') {
          if (save.gold < RB.PACK_PRICE) return U.toast(`A pack costs ${RB.PACK_PRICE} gold. You have ${save.gold}.`);
          if (el.dataset.busy) return; el.dataset.busy = '1';
          save.gold -= RB.PACK_PRICE; U.persist(); U.hidePreview();
          const packEl = a.classList.contains('tcgpack') ? a : $('.againbox .tcgpack', el);
          return U.openPack(null, false, packEl, RB.rollBooster());
        }
        if (a.dataset.act === 'col') return U.collection();
        if (a.dataset.act === 'title') return U.title();
      };
      el.onkeydown = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('flip')) { e.preventDefault(); flip(e.target); } };
      el.onmouseover = e => { const f = e.target.closest('.flip.on'); if (f && innerWidth > 900) U.preview(U.cardHTML(cards[+f.dataset.i].id, { holo: cards[+f.dataset.i].holo }), f); };
      el.onmouseout = e => { if (e.target.closest('.flip')) U.hidePreview(); };
    }, packEl.classList.contains('tcgpack') ? 950 : 550);
  };

  /* ---------- #36 TCG-style foil booster pack ---------- */
  RB.PACK_STYLES = {
    ember: { name: 'Emberfall', art: 'pack_ember' },
    frost: { name: 'Frostwing', art: 'pack_frost' },
    void: { name: 'Voidshade', art: 'pack_void' },
  };
  U.packHTML = function (o) {
    const G = RB.ART.GEN || {};
    const art = o.img || G[o.art] || '';
    return `<div class="tcgpack v-${o.theme || 'ember'} ${o.cls || ''}" ${o.act ? `data-act="${o.act}"` : ''} ${o.data || ''} tabindex="0" role="button" aria-label="${esc(o.label || 'Booster pack')}">
      <div class="hang"><i></i></div><div class="crimp top"></div>
      <div class="body"><img class="art ${o.wide ? 'wide' : ''}" alt="" src="${art}"><div class="shade"></div><div class="shine"></div>
        <div class="plogo"><b>Raidbound</b><span>Trading Card Game</span></div>
        <div class="ribbon"><b>${esc(o.title || 'Booster Pack')}</b><span>${esc(o.set || 'Frontier Set')}</span><small>${esc(o.count || '5 random cards')}</small></div>
</div>
      <div class="crimp bottom"></div></div>`;
  };

  /* ---------- the Market: spend raid gold on booster packs and heroes (#26, #27) ---------- */
  U.market = function (opts) {
    const price = RB.PACK_PRICE;
    const fr = RB.FRONTIER, have = fr.filter(id => (save.owned[id] || 0) > 0).length;
    const heroes = RB.UNLOCK_HEROES.map(id => {
      const h = RB.HEROES[id], open = U.heroOpen(id), buy = h.unlock.how.startsWith('gold:') ? +h.unlock.how.slice(5) : 0;
      return `<div class="mhero ${open ? 'open' : ''}"><img alt="" src="${U.cardArt(id)}"><div><h4>${esc(h.name)}</h4><div class="sub">${RB.FACTIONS[h.fac].short} ${esc(h.race)} ${RB.CLASSES[h.cls].name} · ${h.hp} health</div><p><b>${esc(h.power.name)}:</b> ${esc(h.power.text)}</p>
        ${open ? '<span class="chip ok">Unlocked — pick them in raid setup</span>' : buy ? `<button class="btn small ${save.gold >= buy ? 'primary' : ''}" data-buyhero="${id}" ${save.gold >= buy ? '' : 'disabled'}>Buy for ${buy} gold</button>` : `<span class="chip">To unlock: ${esc(h.unlock.text)}</span>`}</div></div>`;
    }).join('');
    const el = U.show('market', `<div class="page"><div class="pagehead"><button class="btn ghost small" data-act="back">← Title</button><h2>The Market</h2><span class="sp"></span><span class="goldchip big">${save.gold} gold</span></div>
      <p class="lede">Every raid pays you gold, win or lose. You get more for winning, for damage dealt to the boss, for each minion destroyed and for healing your party. Heroic raids pay 25% extra.</p>
      <h3 class="sec">Booster packs</h3>
      <p class="lede">Each wrapper is its own set of cards. Every pack holds <b>5 cards</b>: at least three from that set (one uncommon or better), and the rest are usually from the set too, with the odd regular card. Some come as holofoils. Open 5 of one kind to unlock its table theme.</p>
      <div class="packrow">${Object.entries(RB.PACK_STYLES).map(([k, v]) => { const PS = RB.PACK_SETS[k], pool = RB.packPool(k), got = pool.filter(d => (save.owned[d.id] || 0) > 0).length, opened = (save.packs || {})[k] || 0;
        return `<div class="packpick setpick" style="--sc:${PS.col}">${U.packHTML({ theme: k, art: v.art, act: 'buy', set: PS.name + ' Set', data: `data-style="${k}"`, label: `Buy a ${v.name} booster pack for ${price} gold` })}<div class="pname">${v.name}</div><div class="ptheme">${esc(PS.theme)}</div><p class="pblurb">${esc(PS.blurb)}</p><div class="pgot"><b>${got}</b> of ${pool.length} found · ${opened} opened</div><button class="btn small ${save.gold >= price ? 'primary' : ''}" data-act="buy" data-style="${k}" ${save.gold >= price ? '' : 'disabled'}>Buy — ${price} gold</button></div>`; }).join('')}</div>
      ${save.gold < price ? `<p class="lede" style="text-align:center">You need ${price - save.gold} more gold for a pack. Go raid!</p>` : ''}
      <p class="lede" style="text-align:center">You have found <b>${have} of ${fr.length}</b> booster cards. New cards go straight into your collection and can be used in <b>My deck</b> and <b>Auto deck</b>.</p>
      <div class="codebox goldcode"><span>Have a gold code?</span><input id="goldcode" placeholder="RBG-XXXXX-XXXXX" aria-label="Gold code" maxlength="17"><button class="btn" data-act="goldcode">Redeem</button>${opts && opts.msg ? `<span class="${opts.msg.ok ? 'okmsg' : 'errmsg'}">${esc(opts.msg.text)}</span>` : ''}</div>
      <h3 class="sec">Heroes for hire</h3><p class="lede">Six new heroes join the fight once you earn them. Some are unlocked by beating raids, some are bought here.</p>
      <div class="mheroes">${heroes}</div></div>`);
    el.onclick = e => {
      const a = e.target.closest('[data-act]'), bh = e.target.closest('[data-buyhero]');
      if (bh) { const id = bh.dataset.buyhero, cost = +RB.HEROES[id].unlock.how.slice(5); if (save.gold < cost) return U.toast('Not enough gold yet.'); save.gold -= cost; save.heroes.push(id); U.persist(); U.sfx.quest(); U.toast(`${RB.HEROES[id].name} joins you! Pick them in raid setup.`); return U.market(); }
      if (!a) return;
      if (a.dataset.act === 'back') return U.title();
      if (a.dataset.act === 'goldcode') return U.market({ msg: U.redeemGold($('#goldcode').value) });
      if (a.dataset.act === 'buy') {
        if (save.gold < price) return U.toast(`A pack costs ${price} gold. You have ${save.gold}.`);
        save.gold -= price; U.persist();
        const st = a.dataset.style || 'ember';
        const packEl = a.classList.contains('tcgpack') ? a : $(`.tcgpack[data-style="${st}"]`, el);
        return U.openPack(null, false, packEl, RB.rollBooster(null, st));
      }
    };
    el.onkeydown = e => { if (e.key === 'Enter' && e.target.dataset.act === 'buy') e.target.click(); if (e.key === 'Enter' && e.target.id === 'goldcode') el.querySelector('[data-act=goldcode]').click(); };
  };

  /* ---------- boot ---------- */
  function boot() {
    U.applyCosmetics();
    U.title();
    if (!save.seen) {
      save.seen = true; U.persist();
      setTimeout(() => U.dialog(`<h3>Welcome to Raidbound</h3><p>Pick a hero, take a ready-made deck, and fight a raid boss that plays its own deck of cards against you. New here? Start with <b>Crypt of the Hollow King</b> on Normal.</p><p>On your turn, click a card in your hand to play it or turn it into a resource, then click your allies or your hero to attack. If you'd rather not think about it, <b>Auto-play turn</b> will play the turn for you.</p><div class="acts"><button class="btn ghost" data-v="rules">Read the rules</button><button class="btn primary" data-v="go">Let's raid</button></div>`).then(v => { if (v === 'rules') U.rules(); }), 300);
    }
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  }
})(globalThis.RB);
