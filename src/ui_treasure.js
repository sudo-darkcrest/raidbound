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
  U.openPack = function (raidId, heroic, packEl) {
    const cards = U.rollPack(raidId, heroic);
    // add to collection right away so nothing is lost if the page closes
    for (const c of cards) {
      save.owned[c.id] = (save.owned[c.id] || 0) + 1;
      if (c.holo) save.holo[c.id] = (save.holo[c.id] || 0) + 1;
      if (C[c.id].loot) save.loot.push({ id: c.id, code: U.makeCode(C[c.id].loot.reward), scratched: false, redeemed: false });
    }
    U.persist();
    U.sfx.flip();
    packEl.classList.add('tear');
    setTimeout(() => {
      const el = U.show('end', `<div class="endscreen"><h2 style="font-size:clamp(2.4rem,5vw,4rem)">Treasure</h2><p class="tagline">Click each card to reveal it.</p>
        <div class="packcards">${cards.map((c, i) => `<div class="flip ${C[c.id].rarity === 'e' ? 'epic' : ''}" data-i="${i}" style="animation-delay:${i * 0.12}s" tabindex="0" role="button" aria-label="Reveal card ${i + 1}"><div class="inner"><div class="face"><div class="cardback" style="--cw:100%;width:100%"></div></div><div class="face front">${U.cardHTML(c.id, { holo: c.holo })}</div></div></div>`).join('')}</div>
        <div id="lootnote"></div>
        <div class="menu" style="flex-direction:row;justify-content:center;margin-top:1.6rem"><button class="btn" data-act="all">Reveal all</button><button class="btn primary" data-act="again">Raid again</button><button class="btn" data-act="col">View collection</button><button class="btn ghost" data-act="title">Title</button></div></div>`);
      $$('.packcards .card', el).forEach(c => c.style.setProperty('--cw', '100%'));
      $$('.packcards .card', el).forEach(c => { c.style.width = '100%'; });
      const flip = f => { if (f.classList.contains('on')) return; f.classList.add('on'); U.sfx.flip(); const c = cards[+f.dataset.i]; if (C[c.id].rarity === 'e') setTimeout(() => U.sfx.win(), 300); if (C[c.id].loot) showLoot(); };
      const showLoot = () => { const n = $('#lootnote'); if (n.innerHTML) return; n.innerHTML = `<p class="tagline" style="margin:1.4rem 0 0">A loot card! Scratch off its code in your Collection, then redeem it in the Vault.</p>`; };
      el.onclick = e => {
        const f = e.target.closest('.flip'); if (f) return flip(f);
        const a = e.target.closest('[data-act]'); if (!a) return;
        if (a.dataset.act === 'all') return $$('.flip', el).forEach((f, i) => setTimeout(() => flip(f), i * 180));
        if (a.dataset.act === 'again') return U.setup();
        if (a.dataset.act === 'col') return U.collection();
        if (a.dataset.act === 'title') return U.title();
      };
      el.onkeydown = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('flip')) { e.preventDefault(); flip(e.target); } };
      el.onmouseover = e => { const f = e.target.closest('.flip.on'); if (f && innerWidth > 900) U.preview(U.cardHTML(cards[+f.dataset.i].id, { holo: cards[+f.dataset.i].holo }), f); };
      el.onmouseout = e => { if (e.target.closest('.flip')) U.hidePreview(); };
    }, 550);
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
