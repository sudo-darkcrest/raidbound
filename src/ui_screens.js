/* RAIDBOUND — menus: title, raid setup, deck builder, collection, vault, rules, settings */
(function (RB) {
  const U = RB.UI, C = RB.CARDS, H = RB.HEROES, R = RB.RAIDS;
  const { $, $$, esc } = U;
  const save = U.save;
  const app = () => $('#app');

  U.show = function (name, html) {
    U.closePop(); U.hidePreview();
    $$('.screen').forEach(s => s.classList.add('hidden'));
    let el = $('#' + name);
    if (!el) { el = document.createElement('div'); el.id = name; el.className = 'screen'; app().appendChild(el); }
    if (html != null) el.innerHTML = html;
    el.classList.remove('hidden');
    el.scrollTop = 0;
    return el;
  };

  /* ---------------- title ---------------- */
  const TITLE_ART = { s: 'volcano', L: [['glow', { x: 150, y: 120, r: 90, c: '#ff6a1a', op: 0.35 }], ['dragon', { x: 196, y: 108, s: 0.62, breath: 1 }], ['fig', { race: 'human', pose: 'heroic', w: 'sword', off: 'shield', helm: 'great', cape: 1, capeCol: '#1a2a5a', x: 70, y: 214, s: 0.5, wGlow: '#fff6c0' }], ['fig', { race: 'orc', pose: 'charge', w: 'axe', x: 106, y: 216, s: 0.45 }], ['fig', { race: 'elf', pose: 'castF', robe: 1, helm: 'hair', glowR: '#c8a0ff', x: 32, y: 214, s: 0.42 }]], p: 'embers', pn: 50 };
  U.title = function () {
    RB.AUDIO.music('title');
    const wins = Object.values(save.wins).reduce((a, b) => a + b, 0);
    const bg = (RB.ART.GEN && RB.ART.GEN.title_wide) || U.art(TITLE_ART, 'title');
    const raids = Object.values(R).map(r => `<button class="traid" data-raid="${r.id}"><img alt="" src="${U.art(r.art, 'raid:' + r.id)}"><span class="chip tier">${r.difficulty}</span><div class="tbody"><h4>${esc(r.name)}</h4><div class="boss">${esc(r.boss)}</div>${(save.wins[r.id] || 0) ? `<div class="done">Conquered ${save.wins[r.id]}×</div>` : ''}</div></button>`).join('');
    const el = U.show('title', `<img class="bgart" alt="" src="${bg}"><div class="veil"></div>
      <div class="center"><h1 class="logo">Raidbound</h1><p class="tagline">Gather your party. Build your deck. Bring down the raid boss.</p>
      <div class="menu"><button class="btn primary" data-go="setup">Begin a raid</button>
      <div class="row"><button class="btn" data-go="collection">Collection</button><button class="btn" data-go="vault">The Vault</button></div>
      <div class="row"><button class="btn ghost" data-go="rules">How to play</button><button class="btn ghost" data-go="settings">Settings</button></div></div>
      <div class="traids">${raids}</div>
      ${wins ? `<div class="wins">Raids conquered: ${wins} · Cards collected: ${Object.keys(save.owned).filter(k => save.owned[k] > 0).length}</div>` : ''}</div>`);
    el.onclick = e => {
      const r = e.target.closest('[data-raid]'); if (r) { U.setupState.raid = r.dataset.raid; return U.setup(); }
      const b = e.target.closest('[data-go]'); if (b) U[b.dataset.go]();
    };
  };

  /* ---------------- raid setup ---------------- */
  const setup = U.setupState = { raid: 'crypt', diff: 'normal', seats: [{ hero: 'aldric', auto: false, custom: false }] };
  function heroBlurb(h) { return `<b>${esc(h.name)}</b> — ${RB.FACTIONS[h.fac].short} ${h.race} ${RB.CLASSES[h.cls].name} (${h.spec}). ${h.hp} health. <b>${esc(h.power.name)}:</b> ${esc(h.power.text)}${h.trait ? ' ' + esc(h.trait) : ''}`; }
  U.setup = function () {
    const raids = Object.values(R).map(r => `<button class="raid ${setup.raid === r.id ? 'sel' : ''}" data-raid="${r.id}"><img alt="" src="${U.art(r.art, 'raid:' + r.id)}"><span class="chip tier">${r.difficulty}</span><div class="body"><h4>${esc(r.name)}</h4><div class="boss">${esc(r.boss)}</div><p>${esc(r.intro)}</p><ul class="rules">${r.rules.map(x => `<li><b>${esc(x.name)}.</b> ${esc(x.text)}</li>`).join('')}</ul><p style="color:var(--muted)">Treasure: ${r.treasure.map(t => esc(C[t].name)).join(', ')}${(save.wins[r.id] || 0) ? ` · Conquered ${save.wins[r.id]}×` : ''}</p></div></button>`).join('');
    const seats = setup.seats.map((s, i) => {
      const h = H[s.hero];
      const deckOk = !s.custom || (save.decks[s.hero] && save.decks[s.hero].length === RB.DECK_SIZE);
      return `<div class="seat" data-seat="${i}"><header><strong>Hero ${i + 1}</strong>${setup.seats.length > 1 ? `<button class="btn small ghost" data-act="rm" aria-label="Remove hero ${i + 1}">Remove</button>` : ''}</header>
        <div class="heropick">${Object.values(H).map(x => `<button class="${x.id === s.hero ? 'on' : ''}" data-hero="${x.id}" title="${esc(x.name)}"><img alt="" src="${U.cardArt(x.id)}"><span>${esc(x.name.replace(/^Ser /, '').split(' ')[0])} · ${RB.CLASSES[x.cls].name}</span></button>`).join('')}</div>
        <div class="heroinfo">${heroBlurb(h)}</div>
        <div class="opts"><span class="seg"><button class="${!s.custom ? 'on' : ''}" data-act="starter">Starter deck</button><button class="${s.custom ? 'on' : ''}" data-act="custom">My deck</button></span><button class="btn small" data-act="edit">Edit deck</button></div>
        <div class="opts"><label class="toggle"><input type="checkbox" data-act="auto" ${s.auto ? 'checked' : ''}> Let the AI play this hero</label>${!deckOk ? '<span class="chip" style="color:#ffb49a">Your deck needs 30 cards — the starter deck will be used</span>' : ''}</div></div>`;
    }).join('') + (setup.seats.length < 4 ? `<button class="addseat" data-act="add">+ Add a hero</button>` : '');
    const el = U.show('setup', `<div class="page"><div class="pagehead"><button class="btn ghost small" data-act="back">← Title</button><h2>Choose your raid</h2><span class="sp"></span></div>
      <div class="raids">${raids}</div>
      <div class="difficulty"><span class="seg"><button class="${setup.diff === 'normal' ? 'on' : ''}" data-diff="normal">Normal</button><button class="${setup.diff === 'heroic' ? 'on' : ''}" data-diff="heroic">Heroic</button></span><span style="color:var(--muted);font-size:.92rem">${setup.diff === 'heroic' ? 'Heroic: the boss has 30% more health and strikes 1 harder. Treasure packs hold an extra holofoil and better odds of a loot card.' : 'Normal: the recommended way to learn each raid.'}</span></div>
      <h3 class="sec">Your party</h3><p class="lede">Play solo or bring up to four heroes. You take every hero's turn yourself (pass-and-play), or hand any of them to the AI. The boss scales with your party size.</p>
      <div class="seats">${seats}</div>
      <div class="startbar"><span class="summary">${esc(R[setup.raid].name)} · ${setup.seats.length} hero${setup.seats.length > 1 ? 'es' : ''} · ${setup.diff === 'heroic' ? 'Heroic' : 'Normal'}</span><button class="btn primary" data-act="go">Enter the raid</button></div></div>`);
    el.onclick = e => {
      const t = e.target;
      const raid = t.closest('[data-raid]'); if (raid) { setup.raid = raid.dataset.raid; return U.setup(); }
      const df = t.closest('[data-diff]'); if (df) { setup.diff = df.dataset.diff; return U.setup(); }
      const seatEl = t.closest('[data-seat]'); const seat = seatEl ? setup.seats[+seatEl.dataset.seat] : null;
      const hb = t.closest('[data-hero]'); if (hb && seat) { seat.hero = hb.dataset.hero; return U.setup(); }
      const a = t.closest('[data-act]'); if (!a) return;
      switch (a.dataset.act) {
        case 'back': return U.title();
        case 'add': { const used = setup.seats.map(s => s.hero); const next = Object.keys(H).find(h => !used.includes(h)) || 'aldric'; setup.seats.push({ hero: next, auto: false, custom: false }); return U.setup(); }
        case 'rm': setup.seats.splice(+seatEl.dataset.seat, 1); return U.setup();
        case 'starter': seat.custom = false; return U.setup();
        case 'custom': seat.custom = true; if (!save.decks[seat.hero]) save.decks[seat.hero] = RB.buildDeck(seat.hero, save.owned, setup.seats.length); U.persist(); return U.setup();
        case 'edit': seat.custom = true; return U.deckbuilder(seat.hero, () => U.setup());
        case 'auto': seat.auto = a.checked; return;
        case 'go': return U.startRaid();
      }
    };
  };
  U.startRaid = function () {
    const party = setup.seats.map((s, i) => {
      const custom = s.custom && save.decks[s.hero] && save.decks[s.hero].length === RB.DECK_SIZE;
      const ids = custom ? save.decks[s.hero].slice() : RB.buildDeck(s.hero, save.owned, setup.seats.length);
      const holoLeft = Object.assign({}, save.holo);
      const deck = ids.map(id => { const h = holoLeft[id] > 0; if (h) holoLeft[id]--; return { id, holo: h }; });
      return { hero: s.hero, auto: s.auto, deck, name: 'Hero ' + (i + 1), pet: i === 0 ? save.sel.pet : null };
    });
    U.battle({ raid: setup.raid, difficulty: setup.diff, party, settings: { autoDefend: save.settings.autoDefend, pauseForInstants: save.settings.pauseForInstants } });
  };

  /* ---------------- deck builder ---------------- */
  U.deckbuilder = function (hid, onDone) {
    const h = H[hid];
    let deck = (save.decks[hid] || RB.buildDeck(hid, save.owned)).slice();
    let filter = 'all', q = '';
    const legal = Object.values(C).filter(d => RB.legalFor(hid, d) && (save.owned[d.id] || 0) > 0);
    const types = ['all', 'ally', 'ability', 'weapon', 'armor', 'item', 'quest', 'location', 'master'];
    function draw() {
      const counts = deck.reduce((m, id) => (m[id] = (m[id] || 0) + 1, m), {});
      const list = legal.filter(d => (filter === 'all' || d.type === filter) && (!q || (d.name + ' ' + (d.text || '')).toLowerCase().includes(q))).sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
      const curve = [0, 1, 2, 3, 4, 5, 6, 7].map(c => deck.filter(id => Math.min(7, C[id].cost) === c && !['quest', 'location'].includes(C[id].type)).length);
      const maxC = Math.max(1, ...curve);
      const rows = Object.entries(counts).sort((a, b) => C[a[0]].cost - C[b[0]].cost).map(([id, k]) => `<div class="row" data-rm="${id}" title="Click to remove one"><span class="c">${['quest', 'location'].includes(C[id].type) ? '·' : C[id].cost}</span><span class="n">${esc(C[id].name)}</span><span class="x">×${k}</span></div>`).join('');
      const byType = t => deck.filter(id => C[id].type === t).length;
      const el = U.show('deck', `<div class="page"><div class="pagehead"><button class="btn ghost small" data-act="done">← Done</button><h2>${esc(h.name)}'s deck</h2><span class="sp"></span><button class="btn small" data-act="starter">Use the starter deck</button><button class="btn small" data-act="clear">Clear</button></div>
        <p class="lede">${esc(RB.FACTIONS[h.fac].name)} · ${h.race} ${RB.CLASSES[h.cls].name} · ${RB.PROFS[h.profs[0]]}, ${RB.PROFS[h.profs[1]]}. Only cards this hero can use are shown. Armor: ${RB.CLASSES[h.cls].armor.join(', ')}. Weapons: ${RB.CLASSES[h.cls].weapons.join(', ')}. Up to 2 copies of a card (1 if Unique or a Master Hero).</p>
        <div class="dbgrid"><div><div class="filters">${types.map(t => `<button class="btn small ${filter === t ? '' : 'ghost'}" data-f="${t}">${{ all: 'All', ally: 'Allies', ability: 'Abilities', weapon: 'Weapons', armor: 'Armor', item: 'Items', quest: 'Quests', location: 'Locations', master: 'Master heroes' }[t]}</button>`).join('')}<input type="search" placeholder="Search cards" value="${esc(q)}" aria-label="Search cards"></div>
        <div class="pool">${list.map(d => { const k = counts[d.id] || 0, max = Math.min(RB.maxCopies(d), save.owned[d.id] || 0); return `<div class="slot ${k >= max ? 'dim' : ''}" data-add="${d.id}">${k ? `<span class="count">${k}</span>` : ''}${U.cardHTML(d.id, { holo: (save.holo[d.id] || 0) > 0 })}<div class="owned">${k}/${max} in deck · own ${save.owned[d.id]}</div></div>`; }).join('')}</div></div>
        <aside class="decklist"><h4>${deck.length} / ${RB.DECK_SIZE} cards</h4><div style="font-size:.8rem;color:var(--muted)">Allies ${byType('ally')} · Abilities ${byType('ability')} · Gear ${byType('weapon') + byType('armor') + byType('item')} · Quests & locations ${byType('quest') + byType('location')}</div><div class="curve">${curve.map((v, i) => `<div style="height:${(v / maxC) * 100}%"><span>${i === 7 ? '7+' : i}</span></div>`).join('')}</div><div style="height:.6rem"></div>${rows || '<p style="color:var(--muted)">Click cards on the left to add them.</p>'}</aside></div></div>`);
      const inp = $('input[type=search]', el);
      inp.oninput = () => { q = inp.value.toLowerCase(); const pos = inp.selectionStart; draw(); const n = $('#deck input[type=search]'); n.focus(); n.setSelectionRange(pos, pos); };
      el.onclick = e => {
        const t = e.target;
        const f = t.closest('[data-f]'); if (f) { filter = f.dataset.f; return draw(); }
        const ad = t.closest('[data-add]'); if (ad) { const d = C[ad.dataset.add]; const k = counts[d.id] || 0; if (deck.length >= RB.DECK_SIZE) return U.toast('Your deck already has 30 cards. Remove one first.'); if (k >= Math.min(RB.maxCopies(d), save.owned[d.id] || 0)) return U.toast(k >= RB.maxCopies(d) ? 'That\'s the most copies allowed.' : 'You don\'t own more copies of this card.'); deck.push(d.id); return draw(); }
        const rm = t.closest('[data-rm]'); if (rm) { deck.splice(deck.indexOf(rm.dataset.rm), 1); return draw(); }
        const a = t.closest('[data-act]'); if (!a) return;
        if (a.dataset.act === 'starter') { deck = RB.buildDeck(hid, save.owned); return draw(); }
        if (a.dataset.act === 'clear') { deck = []; return draw(); }
        if (a.dataset.act === 'done') { save.decks[hid] = deck; U.persist(); if (deck.length !== RB.DECK_SIZE) U.toast(`Saved. Your deck has ${deck.length} cards — it needs exactly 30 to be used.`); (onDone || U.title)(); }
      };
      hoverPreview(el);
    }
    draw();
  };
  function hoverPreview(el) {
    el.onmouseover = e => { const c = e.target.closest('.pool .card, .cardslot .card'); if (c && innerWidth > 900) { const id = c.dataset.card; U.preview(U.cardHTML(id, { holo: c.classList.contains('holo') }), c); } };
    el.onmouseout = e => { if (e.target.closest('.pool .card, .cardslot .card')) U.hidePreview(); };
  }

  /* ---------------- collection ---------------- */
  U.collection = function () {
    let set = 'all';
    const sets = { all: 'All cards', core: 'Core set', crypt: 'Crypt treasure', molten: 'Molten Spire treasure', tide: 'Sunken Cathedral treasure', loot: 'Loot cards' };
    function draw() {
      const list = Object.values(C).filter(d => set === 'all' || d.set === set).sort((a, b) => (a.set === 'core') - (b.set === 'core') || a.type.localeCompare(b.type) || a.cost - b.cost);
      const total = Object.values(C).length, have = Object.values(C).filter(d => save.owned[d.id] > 0).length;
      const lootRows = save.loot.map((l, i) => `<div class="cos"><h4>${esc(C[l.id].name)}</h4><p style="margin:.2rem 0;color:var(--muted);font-size:.9rem">${esc(C[l.id].loot.label)}</p><div class="scratch" data-loot="${i}"><span>${l.code}</span>${l.scratched ? '' : '<canvas></canvas>'}</div><p style="font-size:.85rem;color:${l.redeemed ? 'var(--verd-hi)' : 'var(--muted)'}">${l.redeemed ? 'Redeemed in the Vault.' : l.scratched ? 'Enter this code in the Vault.' : 'Scratch the silver panel to reveal your code.'}</p></div>`).join('');
      const el = U.show('collection', `<div class="page"><div class="pagehead"><button class="btn ghost small" data-act="back">← Title</button><h2>Collection</h2><span class="sp"></span><span class="chip">${have} / ${total} cards discovered</span></div>
        <div class="filters">${Object.entries(sets).map(([k, v]) => `<button class="btn small ${set === k ? '' : 'ghost'}" data-set="${k}">${v}</button>`).join('')}</div>
        ${save.loot.length && (set === 'all' || set === 'loot') ? `<h3 class="sec">Your loot codes</h3><div class="cosgrid">${lootRows}</div><h3 class="sec">Cards</h3>` : ''}
        <div class="pool">${list.map(d => { const o = save.owned[d.id] || 0; return `<div class="slot cardslot ${o ? '' : 'dim'}">${o > 0 && d.set !== 'core' ? `<span class="count">${o}</span>` : ''}${U.cardHTML(d.id, { holo: (save.holo[d.id] || 0) > 0 })}<div class="owned">${o ? `Own ${o}${save.holo[d.id] ? ` · ${save.holo[d.id]} holofoil` : ''}` : (d.set === 'loot' ? 'Rare drop from treasure packs' : 'Win it from ' + (Object.values(R).find(r => r.treasure.includes(d.id)) || { name: 'a raid' }).name)}</div></div>`; }).join('')}</div></div>`);
      el.onclick = e => { const s = e.target.closest('[data-set]'); if (s) { set = s.dataset.set; draw(); } if (e.target.closest('[data-act=back]')) U.title(); };
      hoverPreview(el);
      $$('.scratch[data-loot]', el).forEach(box => { const cv = $('canvas', box); if (cv) U.scratchable(cv, () => { save.loot[+box.dataset.loot].scratched = true; U.persist(); setTimeout(draw, 600); }); });
    }
    draw();
  };
  U.scratchable = function (cv, onDone) {
    const r = cv.getBoundingClientRect(); cv.width = r.width; cv.height = r.height;
    const x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, cv.width, cv.height); g.addColorStop(0, '#c8ccd4'); g.addColorStop(.5, '#f4f6fa'); g.addColorStop(1, '#9aa0aa');
    x.fillStyle = g; x.fillRect(0, 0, cv.width, cv.height);
    x.fillStyle = '#6a707a'; x.font = 'bold 15px Georgia'; x.textAlign = 'center'; x.fillText('Scratch here', cv.width / 2, cv.height / 2 + 5);
    x.globalCompositeOperation = 'destination-out';
    let down = false, done = false;
    const pos = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    const scratch = e => { if (!down || done) return; const [px, py] = pos(e); x.beginPath(); x.arc(px, py, 16, 0, Math.PI * 2); x.fill(); };
    const check = () => { if (done) return; const d = x.getImageData(0, 0, cv.width, cv.height).data; let clear = 0; for (let i = 3; i < d.length; i += 16) if (d[i] === 0) clear++; if (clear / (d.length / 16) > 0.55) { done = true; cv.style.transition = 'opacity .5s'; cv.style.opacity = 0; U.sfx.flip(); onDone && onDone(); } };
    cv.onpointerdown = e => { down = true; cv.setPointerCapture(e.pointerId); scratch(e); };
    cv.onpointermove = scratch;
    cv.onpointerup = () => { down = false; check(); };
  };

  /* ---------------- vault ---------------- */
  U.vault = function (msg) {
    const KINDS = [
      ['back', 'Card backs', 'Change the design on the back of every face-down card: your resource row, and the cards in treasure packs before you flip them.'],
      ['board', 'Table themes', 'Change the scene behind the battlefield during raids.'],
      ['pet', 'Companions', 'A little creature that floats beside your hero (the first hero, in party games) during raids. Just for looks: companions never change the rules or the odds.'],
    ];
    const tile = id => {
      const c = RB.COSMETICS[id], own = U.ownsCos(id), cur = save.sel[c.kind] && U.ownsCos(save.sel[c.kind]) ? save.sel[c.kind] : '', on = own && (cur || (c.get === 'default' ? id : '')) === id;
      const img = U.cosImg(id);
      return `<div class="cos k-${c.kind} ${own ? '' : 'locked'} ${on ? 'equipped' : ''}">
        <div class="swatch">${img ? `<img alt="" src="${img}">` : ''}${own ? '' : '<span class="lock" aria-hidden="true">&#128274;</span>'}${on ? '<span class="eq">Equipped</span>' : ''}</div>
        <h4>${esc(c.name)}</h4><p class="cdesc">${esc(c.desc)}</p>
        <p class="how ${own ? 'own' : ''}">${own ? (c.get === 'default' ? 'Owned from the start' : 'Unlocked') : esc(U.unlockText(c))}</p>
        ${own ? (on ? `<button class="btn small" disabled>In use</button>` : `<button class="btn small ghost" data-use="${id}">Use this</button>`) : ''}</div>`;
    };
    const total = Object.keys(RB.COSMETICS).length, have = Object.keys(RB.COSMETICS).filter(U.ownsCos).length;
    const sections = KINDS.map(([k, label, what]) => `<h3 class="sec">${label}</h3><p class="kwhat">${what}</p><div class="cosgrid g-${k}">${Object.keys(RB.COSMETICS).filter(id => RB.COSMETICS[id].kind === k).map(tile).join('')}</div>`).join('');
    const el = U.show('vault', `<div class="page"><div class="pagehead"><button class="btn ghost small" data-act="back">← Title</button><h2>The Vault</h2><span class="vcount">${have} of ${total} unlocked</span></div>
      <p class="lede">Cosmetics change how the game looks, never how it plays. Earn them by beating raids, or redeem the scratch-off code from a loot card (find loot cards in treasure packs, then scratch the code in your Collection).</p>
      <div class="codebox"><input id="code" placeholder="RB-XXXXX-XXXXX" aria-label="Loot code" maxlength="16"><button class="btn primary" data-act="redeem">Redeem</button></div>
      ${msg ? `<p style="text-align:center;color:${msg.ok ? 'var(--verd-hi)' : '#ffb49a'}">${esc(msg.text)}</p>` : ''}
      ${sections}</div>`);
    el.onclick = e => {
      if (e.target.closest('[data-act=back]')) return U.title();
      const u = e.target.closest('[data-use]'); if (u) { const id = u.dataset.use, c = RB.COSMETICS[id]; save.sel[c.kind] = c.get === 'default' ? '' : id; U.persist(); U.applyCosmetics(); U.sfx.flip(); return U.vault(); }
      if (e.target.closest('[data-act=redeem]')) {
        const code = $('#code').value.trim();
        const reward = U.checkCode(code);
        if (!reward) return U.vault({ ok: false, text: 'That code isn\'t valid. Check the letters on your loot card and try again.' });
        const norm = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const entry = save.loot.find(l => l.code.replace(/[^A-Z0-9]/g, '') === norm);
        if (entry && entry.redeemed) return U.vault({ ok: false, text: 'This code has already been redeemed.' });
        if (entry) entry.redeemed = true;
        const unlocks = [reward]; if (RB.COSMETICS[reward].also) unlocks.push(RB.COSMETICS[reward].also);
        unlocks.forEach(id => { if (!save.cos.includes(id)) save.cos.push(id); });
        U.persist(); U.sfx.win();
        return U.vault({ ok: true, text: 'Unlocked: ' + unlocks.map(id => RB.COSMETICS[id].name).join(' and ') + '.' });
      }
    };
    const inp = $('#code'); inp.onkeydown = e => { if (e.key === 'Enter') el.querySelector('[data-act=redeem]').click(); };
  };

  /* ---------------- settings ---------------- */
  U.settings = function () {
    const s = save.settings;
    const el = U.show('settings', `<div class="page" style="max-width:720px"><div class="pagehead"><button class="btn ghost small" data-act="back">← Title</button><h2>Settings</h2></div>
      <div class="settingsgrid">
      <div><h3 class="sec" style="margin-top:0">Game speed</h3><span class="seg">${[[1, 'Normal'], [0.55, 'Fast'], [0.15, 'Very fast']].map(([v, l]) => `<button class="${s.speed === v ? 'on' : ''}" data-speed="${v}">${l}</button>`).join('')}</span></div>
      <div class="audioset"><h3 class="sec" style="margin-top:0">Sound</h3>
        <div class="vrow"><label class="toggle"><input type="checkbox" data-k="sound" ${s.sound !== false ? 'checked' : ''}> Sound effects</label><input type="range" min="0" max="1" step="0.05" value="${s.sfxVol ?? 0.8}" data-vol="sfxVol" aria-label="Sound effects volume"><button class="btn small ghost" data-act="testfx">Test</button></div>
        <div class="vrow"><label class="toggle"><input type="checkbox" data-k="music" ${s.music !== false ? 'checked' : ''}> Music</label><input type="range" min="0" max="1" step="0.05" value="${s.musicVol ?? 0.5}" data-vol="musicVol" aria-label="Music volume"><span></span></div></div>
      <label class="toggle"><input type="checkbox" data-k="autoDefend" ${s.autoDefend ? 'checked' : ''}> Defend automatically (use armor and strike back with your weapon without asking)</label>
      <label class="toggle"><input type="checkbox" data-k="pauseForInstants" ${s.pauseForInstants ? 'checked' : ''}> Pause when a boss card is revealed so I can respond with an Instant</label>
      <div style="margin-top:1.4rem"><button class="btn ghost small" data-act="reset">Reset all progress</button></div></div></div>`);
    el.oninput = e => { const r = e.target.closest('[data-vol]'); if (r) { s[r.dataset.vol] = +r.value; U.persist(); RB.AUDIO.setVolumes(); } };
    el.onchange = e => { if (e.target.closest('[data-vol=sfxVol]')) U.sfx.hit(3); };
    el.onclick = async e => {
      if (e.target.closest('[data-act=back]')) return U.title();
      const sp = e.target.closest('[data-speed]'); if (sp) { s.speed = +sp.dataset.speed; U.persist(); return U.settings(); }
      const k = e.target.closest('[data-k]'); if (k) { s[k.dataset.k] = k.checked; U.persist(); RB.AUDIO.refresh(); return; }
      if (e.target.closest('[data-act=testfx]')) { const f = ['hit', 'block', 'heal', 'power', 'bossReveal']; U.sfx[f[(U._fxi = ((U._fxi || 0) + 1) % f.length)]](5); return; }
      if (e.target.closest('[data-act=reset]')) { const v = await U.dialog('<h3>Reset all progress?</h3><p>This removes your treasure cards, loot codes, unlocked cosmetics and saved decks. It can\'t be undone.</p><div class="acts"><button class="btn ghost" data-v="no">Keep my progress</button><button class="btn primary" data-v="yes">Reset everything</button></div>', { dismiss: 'no' }); if (v === 'yes') { try { localStorage.removeItem('raidbound.save.v1'); } catch (er) { } location.reload(); } }
    };
  };

  /* ---------------- how to play ---------------- */
  U.rules = function () {
    const kw = Object.values(RB.KEYWORDS).map(([n, t]) => `<li><b>${n}:</b> ${esc(t)}</li>`).join('');
    const el = U.show('rules', `<div class="page"><div class="pagehead"><button class="btn ghost small" data-act="back">← Title</button><h2>How to play</h2></div><div class="rules">
      <section><h4>The goal</h4><p>Your party of heroes fights a raid boss. Reduce the boss to 0 health to win and earn a treasure pack. If every hero falls, the raid wipes.</p></section>
      <section><h4>Your hero</h4><p>Each hero has health, a faction (Silver Concord or Ember Clans), a race, a class, a specialization and two professions. These traits decide which cards can go in the deck. Every hero also has a unique power you can use once per game.</p></section>
      <section><h4>Resources</h4><p>Once per turn you may place any card from your hand face-down as a resource. You begin with two. To play a card, exhaust resources equal to its cost. Resources ready again at the start of your turn. Quests and locations are always played as resources, and they keep their special abilities.</p></section>
      <section><h4>Your turn</h4><p>Ready everything, draw two cards, then act in any order: play one resource, play cards, attack, use items, complete quests, use your location and use your hero power. Press <b>End turn</b> when you're done, or <b>Auto-play turn</b> to let the AI finish it for you.</p></section>
      <section><h4>Combat</h4><p>Attacks always target one enemy: the boss or one of its minions. The defender strikes back, so both sides take damage. Long-Range attackers take nothing back. Damage stays between turns, so every fight costs you something. Heroes attack with an equipped weapon by paying its strike cost; a weapon can also strike back when your hero is attacked.</p></section>
      <section><h4>Card types</h4><ul><li><b>Allies</b> fight beside you. They can attack the turn after they arrive, unless they have Ferocity.</li><li><b>Abilities</b> take effect at once. Basic abilities are played on your turn; Instants can also be played when a boss card is revealed.</li><li><b>Weapons</b> add attack. Pay the strike cost each time you use one.</li><li><b>Armor</b> goes in a slot (head, chest, hands, legs, feet or off-hand). When your hero would take damage, exhaust it and pay its cost to block.</li><li><b>Items</b> are rings, potions and trinkets with lasting or one-shot effects.</li><li><b>Quests</b> are resources you can complete for a reward; they then turn face down.</li><li><b>Locations</b> are resources with an ability you can use once per turn. You control one at a time.</li><li><b>Master Heroes</b> replace your hero. Damage and gear carry over, but your original power does not.</li><li><b>Loot cards</b> play like normal cards and hide a scratch-off code for the Vault.</li></ul></section>
      <section><h4>The boss turn</h4><p>After every hero has acted, the boss takes its turn. It reveals cards from its own deck: attacks, minions, curses and lingering events. Its minions attack, then the boss strikes the hero with the most threat. Threat comes from damage you dealt this round, and Taunt effects force the boss to strike you. Each raid has custom rules and phases that change the fight as the boss weakens.</p></section>
      <section><h4>Keywords</h4><ul>${kw}</ul></section>
      <section><h4>Party play</h4><p>Up to four heroes can join a raid. You take each hero's turn in order, so friends can pass the device around. The boss grows tougher with each hero: it has more health, reveals an extra card per hero, and its strikes and minions hit harder.</p></section>
      <section><h4>Treasure</h4><p>Victory opens a treasure pack of five cards: one epic from the boss's treasure, holofoil cards, and sometimes a loot card. New cards join your collection and are added to your starter decks automatically.</p></section>
      <section class="credits"><h4>Art credits</h4><p>Every card, hero, raid and boss illustration was generated with <a href="https://spritecook.ai" target="_blank" rel="noopener">SpriteCook</a> and art-directed for Raidbound. Card frames, icons and interface are hand-built for the game.</p></section>
      </div></div>`);
    el.onclick = e => { if (e.target.closest('[data-act=back]')) U.title(); };
  };
})(globalThis.RB);
