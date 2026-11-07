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
    // add to collection right away so nothing is lost if the page closes
    for (const c of cards) {
      save.owned[c.id] = (save.owned[c.id] || 0) + 1;
      if (c.holo) save.holo[c.id] = (save.holo[c.id] || 0) + 1;
      if (C[c.id].loot) save.loot.push({ id: c.id, code: U.makeCode(C[c.id].loot.reward), scratched: false, redeemed: false });
    }
    U.persist();
    U.sfx.treasure();
    packEl.classList.add('tear');
    setTimeout(() => {
      const el = U.show('end', `<div class="endscreen"><h2 style="font-size:clamp(2.4rem,5vw,4rem)">${booster ? 'Frontier booster' : 'Treasure'}</h2><p class="tagline">Click each card to reveal it.</p>
        <div class="packcards">${cards.map((c, i) => `<div class="flip ${C[c.id].rarity === 'e' ? 'epic' : ''}" data-i="${i}" style="animation-delay:${i * 0.12}s" tabindex="0" role="button" aria-label="Reveal card ${i + 1}"><div class="inner"><div class="face"><div class="cardback" style="--cw:100%;width:100%"></div></div><div class="face front">${U.cardHTML(c.id, { holo: c.holo })}</div></div></div>`).join('')}</div>
        <div id="lootnote"></div>
        <div class="menu" style="flex-direction:row;justify-content:center;margin-top:1.6rem"><button class="btn" data-act="all">Reveal all</button>${booster ? `<button class="btn primary" data-act="market">Back to the Market</button>` : `<button class="btn primary" data-act="again">Raid again</button>`}<button class="btn" data-act="col">View collection</button><button class="btn ghost" data-act="title">Title</button></div></div>`);
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
        if (a.dataset.act === 'col') return U.collection();
        if (a.dataset.act === 'title') return U.title();
      };
      el.onkeydown = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('flip')) { e.preventDefault(); flip(e.target); } };
      el.onmouseover = e => { const f = e.target.closest('.flip.on'); if (f && innerWidth > 900) U.preview(U.cardHTML(cards[+f.dataset.i].id, { holo: cards[+f.dataset.i].holo }), f); };
      el.onmouseout = e => { if (e.target.closest('.flip')) U.hidePreview(); };
    }, 550);
  };

  /* ---------- the Market: spend raid gold on booster packs and heroes (#26, #27) ---------- */
  const BOOSTER_ART = { s: 'sea', img: false, p: 'embers', pn: 20, L: [['glow', { x: 150, y: 110, r: 110, c: '#ffd27a', op: 0.45 }], ['obj', { t: 'chest', x: 150, y: 170, s: 1.1 }], ['obj', { t: 'coin', x: 86, y: 200, s: 0.5 }], ['obj', { t: 'coin', x: 220, y: 206, s: 0.42 }], ['obj', { t: 'scroll', x: 236, y: 92, s: 0.5 }], ['fx', { t: 'sparkle', x: 150, y: 120 }]] };
  U.market = function () {
    const price = RB.PACK_PRICE;
    const fr = RB.FRONTIER, have = fr.filter(id => (save.owned[id] || 0) > 0).length;
    const heroes = RB.UNLOCK_HEROES.map(id => {
      const h = RB.HEROES[id], open = U.heroOpen(id), buy = h.unlock.how.startsWith('gold:') ? +h.unlock.how.slice(5) : 0;
      return `<div class="mhero ${open ? 'open' : ''}"><img alt="" src="${U.cardArt(id)}"><div><h4>${esc(h.name)}</h4><div class="sub">${RB.FACTIONS[h.fac].short} ${esc(h.race)} ${RB.CLASSES[h.cls].name} · ${h.hp} health</div><p><b>${esc(h.power.name)}:</b> ${esc(h.power.text)}</p>
        ${open ? '<span class="chip ok">Unlocked — pick them in raid setup</span>' : buy ? `<button class="btn small ${save.gold >= buy ? 'primary' : ''}" data-buyhero="${id}" ${save.gold >= buy ? '' : 'disabled'}>Buy for ${buy} gold</button>` : `<span class="chip">To unlock: ${esc(h.unlock.text)}</span>`}</div></div>`;
    }).join('');
    const el = U.show('market', `<div class="page"><div class="pagehead"><button class="btn ghost small" data-act="back">← Title</button><h2>The Market</h2><span class="sp"></span><span class="goldchip big">${save.gold} gold</span></div>
      <p class="lede">Every raid pays you gold, win or lose. You get more for winning, for damage dealt to the boss, for each minion destroyed and for healing your party. Heroic raids pay 25% extra.</p>
      <h3 class="sec">Frontier booster packs</h3>
      <div class="boosterrow"><div class="pack booster" data-act="buy" tabindex="0" role="button" aria-label="Buy a booster pack for ${price} gold"><div class="pt">Frontier booster</div><img alt="" src="${U.art(BOOSTER_ART, 'booster')}"><div class="pb">5 cards · ${price} gold</div></div>
        <div><p>Each pack holds <b>5 cards</b>: at least two from the new <b>Frontier</b> set (one is uncommon or better), with regular cards mixed in. Some come as holofoils.</p><p>You have found <b>${have} of ${fr.length}</b> Frontier cards. New cards go straight into your collection and can be used in <b>My deck</b> and <b>Auto deck</b>.</p>
        <button class="btn primary" data-act="buy" ${save.gold >= price ? '' : 'disabled'}>Buy a pack — ${price} gold</button>${save.gold < price ? `<p style="color:var(--muted)">You need ${price - save.gold} more gold. Go raid!</p>` : ''}</div></div>
      <h3 class="sec">Heroes for hire</h3><p class="lede">Six new heroes join the fight once you earn them. Some are unlocked by beating raids, some are bought here.</p>
      <div class="mheroes">${heroes}</div></div>`);
    el.onclick = e => {
      const a = e.target.closest('[data-act]'), bh = e.target.closest('[data-buyhero]');
      if (bh) { const id = bh.dataset.buyhero, cost = +RB.HEROES[id].unlock.how.slice(5); if (save.gold < cost) return U.toast('Not enough gold yet.'); save.gold -= cost; save.heroes.push(id); U.persist(); U.sfx.quest(); U.toast(`${RB.HEROES[id].name} joins you! Pick them in raid setup.`); return U.market(); }
      if (!a) return;
      if (a.dataset.act === 'back') return U.title();
      if (a.dataset.act === 'buy') {
        if (save.gold < price) return U.toast(`A pack costs ${price} gold. You have ${save.gold}.`);
        save.gold -= price; U.persist();
        const packEl = $('.pack.booster', el);
        return U.openPack(null, false, packEl, RB.rollBooster());
      }
    };
    el.onkeydown = e => { if (e.key === 'Enter' && e.target.dataset.act === 'buy') e.target.click(); };
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
