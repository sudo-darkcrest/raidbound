/* RAIDBOUND — treasure packs, holofoils, loot cards; app boot */
(function (RB) {
  const U = RB.UI, C = RB.CARDS;
  const { $, $$, esc } = U;
  const save = U.save;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  U.rollPack = function (raidId, heroic) {
    const raid = RB.RAIDS[raidId];
    const core = RB.CORE_POOL ? RB.CORE_POOL() : Object.values(C).filter(d => d.set === 'core' && d.type !== 'master' && d.type !== 'land');
    const rares = core.filter(d => d.rarity === 'r'), uncs = core.filter(d => d.rarity === 'u'), coms = core.filter(d => d.rarity === 'c');
    const out = [];
    // epic treasure is half as likely as rare treasure
    const wpick = list => { const w = list.map(id => C[id].rarity === 'e' ? 1 : 2), tot = w.reduce((a, b) => a + b, 0); let x = Math.random() * tot; for (let i = 0; i < list.length; i++) { x -= w[i]; if (x < 0) return list[i]; } return list[list.length - 1]; };
    const myth = heroic === 'mythic'; // #117: Mythic = two raid treasures, every card holo, better loot odds
    out.push({ id: wpick(raid.treasure), holo: true });
    if (myth || Math.random() < (heroic ? 0.5 : 0.3)) { const others = raid.treasure.filter(t => t !== out[0].id); out.push({ id: wpick(others), holo: heroic }); }
    else out.push({ id: pick(rares).id, holo: Math.random() < (heroic ? 0.6 : 0.3) });
    out.push({ id: pick(uncs).id, holo: Math.random() < 0.15 });
    out.push({ id: pick(coms).id, holo: Math.random() < 0.1 });
    if (Math.random() < (myth ? 0.6 : heroic ? 0.4 : 0.25)) out.push({ id: pick(Object.values(C).filter(d => d.set === 'loot')).id, holo: true, loot: true });
    else out.push({ id: pick(coms).id, holo: Math.random() < 0.1 });
    if (heroic) { const plain = out.find(x => !x.holo); if (plain) plain.holo = true; }
    if (myth) out.forEach(x => { x.holo = true; });
    return out;
  };
  // pay for a booster: a free Core pack if one is waiting, otherwise gold. Returns false (with a message) if you can't.
  // #95: size is 5 (default), 10 or 20 for Core packs; free packs are always the 5-card Core pack
  U.payForPack = (style, size) => {
    size = size || 5;
    if (style === 'core' && size === 5 && save.freeCore > 0) { save.freeCore--; U._paidFree = true; return true; }
    const pr = RB.packPrice(style, size);
    if (save.gold < pr) { U.toast(`A ${(RB.PACK_SETS[style] || {}).name || ''} pack${size > 5 ? ` of ${size} cards` : ''} costs ${pr} gold. You have ${save.gold}.`); return false; }
    save.gold -= pr; U._paidFree = false; return true;
  };
  U.refundPack = (style, size) => { if (U._paidFree) save.freeCore = (save.freeCore || 0) + 1; else save.gold += RB.packPrice(style, size || 5); };
  let packBusy = false; // #53: one purchase at a time; cleared when the cards are shown
  U.packLock = () => { if (packBusy) return false; packBusy = true; return true; };
  U.openPack = function (raidId, heroic, packEl, given, opts) {
    const fromMarket = !!(opts && opts.market);
    const cards = given || U.rollPack(raidId, heroic);
    const booster = !!given;
    const style = booster ? (given.style || 'ember') : null, PS = booster ? RB.PACK_SETS[style] : null, size = booster ? (given.size || 5) : 0;
    // a 10 or 20-card Core pack counts as 2 or 4 packs toward pack rewards
    if (booster) { save.packs = save.packs || {}; save.packs[style] = (save.packs[style] || 0) + Math.max(1, size / 5); }
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
      const el = U.show('end', `<div class="endscreen"><h2 style="font-size:clamp(2.4rem,5vw,4rem)${PS ? `;color:${PS.col}` : ''}">${booster ? `${PS.name} ${size > 5 ? `${size}-card pack` : 'booster'}` : 'Treasure'}</h2><p class="tagline">${PS ? `${esc(PS.theme)} · ` : ''}${U.isPhone() ? 'Tap' : 'Click'} each card to reveal it.</p>
        <div class="packcards${cards.length > 5 ? ' many' : ''}${cards.length > 10 ? ' lots' : ''}">${cards.map((c, i) => `<div class="flip ${C[c.id].rarity === 'e' ? 'epic' : ''}" data-i="${i}" style="animation-delay:${Math.min(i, 12) * 0.08}s" tabindex="0" role="button" aria-label="Reveal card ${i + 1}"><div class="inner"><div class="face"><div class="cardback" style="--cw:100%;width:100%"></div></div><div class="face front">${U.cardHTML(c.id, { holo: c.holo })}</div></div></div>`).join('')}</div>
        <div id="lootnote"></div>
        ${booster ? (() => { const pr = RB.packPrice(style, size), free = style === 'core' && size === 5 && save.freeCore > 0, sz = size > 5 ? ` ${size}-card` : '';
          return `<div class="againbox"><div class="againhead"><b>Open another pack?</b><span class="goldchip">${save.gold} gold</span><span class="againcost">Core ${RB.CORE_SIZES.map(s => `${s[0]} cards ${s[1]}`).join(' · ')} gold · themed ${RB.PACK_PRICE} gold</span></div>
          ${(() => { const mini = o => { const k = o.style, p = RB.packPrice(k, o.size), fr = k === 'core' && o.size === 5 && save.freeCore > 0; return `<div class="packpick">${U.packHTML({ theme: k, art: o.art, act: 'buyagain', set: (RB.PACK_SETS[k].short || RB.PACK_SETS[k].name) + ' Set', count: `${o.size} random cards`, cls: (o.size > 5 ? 'sz' + o.size + ' ' : '') + (fr || save.gold >= p ? '' : 'broke'), data: `data-style="${k}" data-size="${o.size}"`, label: fr ? `Open a free ${o.name} pack` : `Buy another ${o.name} pack for ${p} gold` })}<div class="pname">${o.short}${k === style && o.size === size ? ' <small>(again)</small>' : ''}${fr ? ' <small class="okmsg">free</small>' : ''}</div></div>`; }; return ['core', 'themed'].map(g => `<div class="packrow mini">${RB.packOffers().filter(o => (o.style === 'core') === (g === 'core')).map(mini).join('')}</div>`).join(''); })()}
          ${free ? `<button class="btn primary" data-act="buyagain">Open your free ${PS.name} pack (${save.freeCore} left)</button>` : save.gold >= pr ? `<button class="btn primary" data-act="buyagain" data-size="${size}">Another ${PS.name}${sz} pack — ${pr} gold</button>` : `<p class="tagline" style="margin:.6rem 0 0">You need ${pr - save.gold} more gold for another ${PS.name}${sz} pack. Go raid!</p>`}</div>`; })() : ''}
        <div class="menu" style="flex-direction:row;justify-content:center;margin-top:1.6rem"><button class="btn" data-act="all">Reveal all</button>${booster || fromMarket ? `<button class="btn primary" data-act="market">Back to the Market</button>` : `<button class="btn primary" data-act="again">${opts && opts.online ? 'Back to the party lobby' : 'Raid again'}</button>`}<button class="btn" data-act="col">View collection</button><button class="btn ghost" data-act="title">Title</button></div></div>`, false, booster || fromMarket ? 'market' : null);
      packBusy = false;
      if (newBoards && newBoards.length) setTimeout(() => U.toast(`Unlocked: ${newBoards.map(id => RB.COSMETICS[id].name).join(', ')}! Pick it in the Vault.`), 1200);
      $$('.packcards .card', el).forEach(c => c.style.setProperty('--cw', '100%'));
      $$('.packcards .card', el).forEach(c => { c.style.width = '100%'; });
      const flip = f => { if (f.classList.contains('on')) return; f.classList.add('on'); U.sfx.flip(); const c = cards[+f.dataset.i]; if (C[c.id].rarity === 'e') setTimeout(() => U.sfx.quest(), 250); if (C[c.id].loot) showLoot(); };
      const showLoot = () => { const n = $('#lootnote'); if (n.innerHTML) return; n.innerHTML = `<p class="tagline" style="margin:1.4rem 0 0">A loot card! Scratch off its code in your Collection, then redeem it in the Vault.</p>`; };
      el.onclick = e => {
        const f = e.target.closest('.flip'); if (f) return flip(f);
        const a = e.target.closest('[data-act]'); if (!a) return;
        if (a.dataset.act === 'all') return $$('.flip', el).forEach((f, i) => setTimeout(() => flip(f), i * 180));
        if (a.dataset.act === 'again') return opts && opts.online ? U.online() : U.setup();
        if (a.dataset.act === 'market') return U.market(fromMarket ? { tab: 'treasure' } : null);
        if (a.dataset.act === 'buyagain') {
          // #74 (user): keep the wrapper the player picked; the big button repeats this pack's set
          const st = RB.PACK_SETS[a.dataset.style] ? a.dataset.style : style, sz = st === 'core' ? (+a.dataset.size || 5) : 5;
          if (!U.payForPack(st, sz)) return;
          if (packBusy) { U.refundPack(st, sz); return; } packBusy = true;
          U.persist(); U.hidePreview();
          const packEl = a.classList.contains('tcgpack') ? a : ($(`.againbox .tcgpack[data-style="${st}"][data-size="${sz}"]`, el) || $(`.againbox .tcgpack[data-style="${st}"]`, el) || $('.againbox .tcgpack', el));
          return U.openPack(null, false, packEl, RB.rollBooster(null, st, sz));
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
    core: { name: 'Raidbound Core', art: 'pack_core' },
    ember: { name: 'Emberfall', art: 'pack_ember' },
    frost: { name: 'Frostwing', art: 'pack_frost' },
    void: { name: 'Voidshade', art: 'pack_void' },
    armory: { name: 'The Armory', art: 'pack_armory' },
    wild: { name: 'Wildbloom', art: 'pack_wild' },
    sun: { name: 'Sunscorch', art: 'pack_sun' },
  };
  // #96: each Core size is its own pack with its own wrapper: 5 cards (title_alt crop), 10 (title_wide crop), 20 (the user's booster20.png)
  RB.CORE_ART = { 5: 'pack_core', 10: 'pack_core10', 20: 'pack_core20' };
  RB.CORE_COL = { 10: '#ff9a4a', 20: '#9ad86a' };
  RB.packOffers = () => [
    ...RB.CORE_SIZES.map(([n]) => ({ style: 'core', size: n, art: RB.CORE_ART[n] || 'pack_core', col: RB.CORE_COL[n], name: n > 5 ? `Core ${n}-Card Pack` : 'Raidbound Core', short: `Core ${n}` })),
    ...Object.entries(RB.PACK_STYLES).filter(([k]) => k !== 'core').map(([k, v]) => ({ style: k, size: 5, art: v.art, name: v.name, short: v.name })),
  ];
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

  /* the Market lives in market.js */

  /* ---------- boot ---------- */
  function boot() {
    U.applyCosmetics();
    U.title();
    if (!save.seen) {
      save.seen = true; U.persist();
      setTimeout(() => U.dialog(`<h3>Welcome to Raidbound</h3><p>Pick a hero, take a ready-made deck, and fight a raid boss that plays its own deck of cards against you. New here? Start with <b>Crypt of the Hollow King</b> on Normal.</p><p>On your turn, ${U.isPhone() ? 'tap' : 'click'} a card in your hand to play it or turn it into a resource, then ${U.isPhone() ? 'tap' : 'click'} your allies or your hero to attack. If you'd rather not think about it, <b>Auto-play turn</b> will play the turn for you.</p>${save.freeCore > 0 ? `<p><b>A welcome gift:</b> ${save.freeCore} free <b>Raidbound Core</b> booster packs are waiting for you in the Market.</p>` : ''}<div class="acts"><button class="btn ghost" data-v="rules">Read the rules</button><button class="btn primary" data-v="go">Let's raid</button></div>`).then(v => { if (v === 'rules') U.rules(); }), 300);
    }
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  }
})(globalThis.RB);
