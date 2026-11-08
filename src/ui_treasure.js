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
    // epic treasure is half as likely as rare treasure
    const wpick = list => { const w = list.map(id => C[id].rarity === 'e' ? 1 : 2), tot = w.reduce((a, b) => a + b, 0); let x = Math.random() * tot; for (let i = 0; i < list.length; i++) { x -= w[i]; if (x < 0) return list[i]; } return list[list.length - 1]; };
    out.push({ id: wpick(raid.treasure), holo: true });
    if (Math.random() < (heroic ? 0.5 : 0.3)) { const others = raid.treasure.filter(t => t !== out[0].id); out.push({ id: wpick(others), holo: heroic }); }
    else out.push({ id: pick(rares).id, holo: Math.random() < (heroic ? 0.6 : 0.3) });
    out.push({ id: pick(uncs).id, holo: Math.random() < 0.15 });
    out.push({ id: pick(coms).id, holo: Math.random() < 0.1 });
    if (Math.random() < (heroic ? 0.4 : 0.25)) out.push({ id: pick(Object.values(C).filter(d => d.set === 'loot')).id, holo: true, loot: true });
    else out.push({ id: pick(coms).id, holo: Math.random() < 0.1 });
    if (heroic) { const plain = out.find(x => !x.holo); if (plain) plain.holo = true; }
    return out;
  };
  let packBusy = false; // #53: one purchase at a time; cleared when the cards are shown
  U.packLock = () => { if (packBusy) return false; packBusy = true; return true; };
  U.openPack = function (raidId, heroic, packEl, given, opts) {
    const fromMarket = !!(opts && opts.market);
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
      const el = U.show('end', `<div class="endscreen"><h2 style="font-size:clamp(2.4rem,5vw,4rem)${PS ? `;color:${PS.col}` : ''}">${booster ? `${PS.name} booster` : 'Treasure'}</h2><p class="tagline">${PS ? `${esc(PS.theme)} · ` : ''}${U.isPhone() ? 'Tap' : 'Click'} each card to reveal it.</p>
        <div class="packcards">${cards.map((c, i) => `<div class="flip ${C[c.id].rarity === 'e' ? 'epic' : ''}" data-i="${i}" style="animation-delay:${i * 0.12}s" tabindex="0" role="button" aria-label="Reveal card ${i + 1}"><div class="inner"><div class="face"><div class="cardback" style="--cw:100%;width:100%"></div></div><div class="face front">${U.cardHTML(c.id, { holo: c.holo })}</div></div></div>`).join('')}</div>
        <div id="lootnote"></div>
        ${booster ? `<div class="againbox"><div class="againhead"><b>Open another pack?</b><span class="goldchip">${save.gold} gold</span><span class="againcost">${RB.PACK_PRICE} gold each</span></div>
          <div class="packrow mini">${Object.entries(RB.PACK_STYLES).map(([k, v]) => `<div class="packpick">${U.packHTML({ theme: k, art: v.art, act: 'buyagain', set: RB.PACK_SETS[k].name + ' Set', cls: save.gold >= RB.PACK_PRICE ? '' : 'broke', data: `data-style="${k}"`, label: `Buy another ${v.name} booster pack for ${RB.PACK_PRICE} gold` })}<div class="pname">${v.name}${k === style ? ' <small>(again)</small>' : ''}</div></div>`).join('')}</div>
          ${save.gold >= RB.PACK_PRICE ? `<button class="btn primary" data-act="buyagain">Another ${PS.name} pack — ${RB.PACK_PRICE} gold</button>` : `<p class="tagline" style="margin:.6rem 0 0">You need ${RB.PACK_PRICE - save.gold} more gold for another pack. Go raid!</p>`}</div>` : ''}
        <div class="menu" style="flex-direction:row;justify-content:center;margin-top:1.6rem"><button class="btn" data-act="all">Reveal all</button>${booster || fromMarket ? `<button class="btn primary" data-act="market">Back to the Market</button>` : `<button class="btn primary" data-act="again">${opts && opts.online ? 'Back to the party lobby' : 'Raid again'}</button>`}<button class="btn" data-act="col">View collection</button><button class="btn ghost" data-act="title">Title</button></div></div>`);
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
          if (save.gold < RB.PACK_PRICE) return U.toast(`A pack costs ${RB.PACK_PRICE} gold. You have ${save.gold}.`);
          if (packBusy) return; packBusy = true;
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

  /* the Market lives in market.js */

  /* ---------- boot ---------- */
  function boot() {
    U.applyCosmetics();
    U.title();
    if (!save.seen) {
      save.seen = true; U.persist();
      setTimeout(() => U.dialog(`<h3>Welcome to Raidbound</h3><p>Pick a hero, take a ready-made deck, and fight a raid boss that plays its own deck of cards against you. New here? Start with <b>Crypt of the Hollow King</b> on Normal.</p><p>On your turn, ${U.isPhone() ? 'tap' : 'click'} a card in your hand to play it or turn it into a resource, then ${U.isPhone() ? 'tap' : 'click'} your allies or your hero to attack. If you'd rather not think about it, <b>Auto-play turn</b> will play the turn for you.</p><div class="acts"><button class="btn ghost" data-v="rules">Read the rules</button><button class="btn primary" data-v="go">Let's raid</button></div>`).then(v => { if (v === 'rules') U.rules(); }), 300);
    }
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  }
})(globalThis.RB);
