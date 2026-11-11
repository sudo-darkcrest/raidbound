/* RAIDBOUND — menus: title, raid setup, deck builder, collection, vault, rules, settings */
(function (RB) {
  const U = RB.UI, C = RB.CARDS, H = RB.HEROES, R = RB.RAIDS;
  const { $, $$, esc } = U;
  const save = U.save;
  const app = () => $('#app');

  /* ---------------- top menu bar on every menu page ---------------- */
  // the user asked for the other pages to stay at the top of every menu screen, so nobody has to go back to the title
  const NI = {
    title: '<path d="M4 20V10l3-2v-3h3v1l2-1 2 1V5h3v3l3 2v10h-6v-5h-4v5z"/>',
    setup: '<path d="M5 3l7 8-2 2-7-8zM19 3l-7 8 2 2 7-8zM3 19l4-4 2 2-4 4zM21 19l-4-4-2 2 4 4z"/>',
    dungeons: '<path d="M4 21V11a8 8 0 0116 0v10h-4v-9a4 4 0 00-8 0v9z"/><path d="M10 21v-6h4v6z" opacity=".55"/>',
    online: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20c0-4 3-6 6-6s6 2 6 6zM12 20c0-3 1.5-5 4-6 3 0 6 2 6 6z"/>',
    market: '<path d="M9 3h6l-1.5 3h-3z"/><path d="M12 6c-5 0-8 4-8 9 0 4 3 6 8 6s8-2 8-6c0-5-3-9-8-9zm0 4.2l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/>',
    collection: '<path d="M3 7l9-3 2 6-9 3z" opacity=".55"/><path d="M8 6h11v15H8z"/>',
    vault: '<path d="M3 10a9 5 0 0118 0v2H3z"/><path d="M3 13h18v8H3zm7 2v3h4v-3z"/>',
    rules: '<path d="M3 5c3-1 6-1 8.5 1v14C9 18 6 18 3 19zM21 5c-3-1-6-1-8.5 1v14c2.5-2 5.5-2 8.5-1z"/>',
    settings: '<path d="M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9-2.6-.5v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8zM12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"/>',
  };
  const NAV = [['title', 'Home', 'Home'], ['dungeons', 'Dungeons', 'Dungeons'], ['setup', 'Raids', 'Raids'], // #122: Dungeons before Raids
     ['online', 'Play online', 'Online'], ['market', 'Market', 'Market'],
    ['collection', 'Collection', 'Cards'], ['vault', 'The Vault', 'Vault'], ['rules', 'How to play', 'Guide'], ['settings', 'Settings', 'Settings']];
  const NAV_ON = new Set(['setup', 'dungeons', 'online', 'market', 'collection', 'vault', 'rules', 'settings']);
  U.navHTML = function (cur) {
    const free = save.freeCore > 0 ? `<i class="navdot" title="${save.freeCore} free pack${save.freeCore > 1 ? 's' : ''}">${save.freeCore}</i>` : '';
    return `<nav class="topnav" aria-label="Menu"><div class="navin">${NAV.map(([id, full, short]) => `<button class="${id === cur ? 'on' : ''}" data-nav="${id}"${id === cur ? ' aria-current="page"' : ''} title="${full}"><svg viewBox="0 0 24 24" aria-hidden="true">${NI[id]}</svg><span class="nfull">${full}</span><span class="nshort">${short}</span>${id === 'market' ? `<span class="goldchip">${save.gold}</span>${free}` : ''}</button>`).join('')}</div></nav>`;
  };
  // one listener for every page: runs before each page's own click handler
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.topnav [data-nav]'); if (!b) return;
    e.stopPropagation(); e.preventDefault();
    const go = b.dataset.nav; if (typeof U[go] === 'function') U[go]();
  }, true);

  U.show = function (name, html, keepScroll, navCur) {
    U.closePop(); U.hidePreview();
    // a hero unlocked since the last screen (raid win, purchase) brings their starter deck's cards into the collection
    if (U.syncStarters && U.syncStarters()) U.persist();
    if (U.checkUnlocks && name !== 'end') { const got = U.checkUnlocks(); if (got.length) { U.persist(); setTimeout(() => U.toast && U.toast(`Unlocked: ${got.map(id => RB.COSMETICS[id].name).join(', ')}! Pick it in the Vault.`), 600); } }
    const prev = keepScroll && $('#' + name) ? $('#' + name).scrollTop : 0;
    $$('.screen').forEach(s => s.classList.add('hidden'));
    let el = $('#' + name);
    if (!el) { el = document.createElement('div'); el.id = name; el.className = 'screen'; app().appendChild(el); }
    const navOn = NAV_ON.has(name) || !!navCur;
    if (html != null) el.innerHTML = (navOn ? U.navHTML(navCur || name) : '') + html;
    el.classList.remove('hidden');
    if (html != null && navOn) { const on = $('.topnav .on', el); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' }); }
    el.scrollTop = prev;
    return el;
  };

  /* ---------------- title ---------------- */
  const TITLE_ART = { s: 'volcano', L: [['glow', { x: 150, y: 120, r: 90, c: '#ff6a1a', op: 0.35 }], ['dragon', { x: 196, y: 108, s: 0.62, breath: 1 }], ['fig', { race: 'human', pose: 'heroic', w: 'sword', off: 'shield', helm: 'great', cape: 1, capeCol: '#1a2a5a', x: 70, y: 214, s: 0.5, wGlow: '#fff6c0' }], ['fig', { race: 'orc', pose: 'charge', w: 'axe', x: 106, y: 216, s: 0.45 }], ['fig', { race: 'elf', pose: 'castF', robe: 1, helm: 'hair', glowR: '#c8a0ff', x: 32, y: 214, s: 0.42 }]], p: 'embers', pn: 50 };
  U.title = function () {
    if (U.deckMoved && U.deckMoved.length) { const n = U.deckMoved.length; U.deckMoved = []; setTimeout(() => U.toast(`${n} saved deck${n > 1 ? 's were' : ' was'} updated: quests and locations now sit with your lands, and the gaps were filled with your best cards.`), 900); }
    RB.AUDIO.music('title');
    const wins = Object.values(save.wins).reduce((a, b) => a + b, 0);
    // #17: pick one of the two painted backdrops at random; each has its own text layout
    const G = RB.ART.GEN || {}, alt = !!G.title_alt && Math.random() < 0.5;
    const bg = (alt ? G.title_alt : G.title_wide) || U.art(TITLE_ART, 'title');
    const raids = Object.values(R).map(r => `<button class="traid" data-raid="${r.id}"><img alt="" src="${U.art(r.art, 'raid:' + r.id)}"><span class="chip tier">${r.difficulty}</span><div class="tbody"><h4>${esc(r.name)}</h4><div class="boss">${esc(r.boss)}</div>${(save.wins[r.id] || 0) ? `<div class="done">Conquered ${save.wins[r.id]}×</div>` : ''}</div></button>`).join('');
    const el = U.show('title', `<img class="bgart" alt="" src="${bg}"><div class="veil"></div>
      <div class="center"><h1 class="logo">Raidbound</h1><p class="tagline">Gather your party. Build your deck. Bring down the raid boss.</p>
      <div class="menu"><div class="row"><button class="btn primary" data-go="dungeons">Dungeons</button><button class="btn primary" data-go="setup">Raid</button><button class="btn primary" data-go="online">Play online</button></div>
      <div class="row"><button class="btn" data-go="market">Market <span class="goldchip">${save.gold}</span>${save.freeCore > 0 ? `<span class="freebadge">${save.freeCore} free pack${save.freeCore > 1 ? 's' : ''}</span>` : ''}</button><button class="btn" data-go="collection">Collection</button><button class="btn" data-go="vault">The Vault</button></div>
      <div class="row"><button class="btn ghost" data-go="rules">How to play</button><button class="btn ghost" data-go="settings">Settings</button></div></div>
      <div class="traids">${raids}</div>
      ${wins ? `<div class="wins">Raids conquered: ${wins} · Cards collected: ${Object.keys(save.owned).filter(k => save.owned[k] > 0).length}</div>` : ''}</div>`);
    el.classList.toggle('alt', alt);
    el.onclick = e => {
      const r = e.target.closest('[data-raid]'); if (r) { U.setupState.raid = r.dataset.raid; return U.setup(); }
      const b = e.target.closest('[data-go]'); if (b) U[b.dataset.go]();
    };
  };

  /* ---------------- raid setup ---------------- */
  const setup = U.setupState = { raid: 'crypt', diff: 'normal', seats: [{ hero: 'aldric', auto: false, custom: false }] };
  function heroBlurb(h) { return `<b>${esc(h.name)}</b> — ${RB.FACTIONS[h.fac].short} ${h.race} ${RB.CLASSES[h.cls].name} (${h.spec}). ${h.hp} health. <b>${esc(h.power.name)}:</b> ${esc(h.power.text)}${h.trait ? ' ' + esc(h.trait) : ''}`; }
  U.setup = function (keep) {
    if (!RB.RAID_DIFFS[setup.diff]) setup.diff = 'normal';
    if (setup.diff === 'mythic' && !U.mythicOpen(setup.raid)) setup.diff = 'heroic';
    const raids = Object.values(R).map(r => `<button class="raid ${setup.raid === r.id ? 'sel' : ''}" data-raid="${r.id}"><img alt="" src="${U.art(r.art, 'raid:' + r.id)}"><span class="chip tier">${r.difficulty}</span><div class="body"><h4>${esc(r.name)}</h4><div class="boss">${esc(r.boss)}</div><p>${esc(r.intro)}</p><ul class="rules">${r.rules.map(x => `<li><b>${esc(x.name)}.</b> ${esc(x.text)}</li>`).join('')}</ul><p style="color:var(--muted)">Treasure: ${r.treasure.map(t => esc(C[t].name)).join(', ')}${(save.wins[r.id] || 0) ? ` · Conquered ${save.wins[r.id]}×` : ''}</p>${U.diffBadges(r.id)}</div></button>`).join('');
    const seats = setup.seats.map((s, i) => {
      const h = H[s.hero];
      const deckOk = !s.custom || (save.decks[s.hero] && save.decks[s.hero].length === RB.DECK_SIZE);
      return `<div class="seat" data-seat="${i}"><header><strong>Hero ${i + 1}</strong>${setup.seats.length > 1 ? `<button class="btn small ghost" data-act="rm" aria-label="Remove hero ${i + 1}">Remove</button>` : ''}</header>
        <div class="heropick">${Object.values(H).map(x => { const open = U.heroOpen(x.id); return `<button class="${x.id === s.hero ? 'on' : ''} ${open ? '' : 'locked'}" data-hero="${x.id}" title="${esc(open ? x.name : 'Locked: ' + x.unlock.text)}"><img alt="" src="${U.cardArt(x.id)}">${open ? '' : '<i class="lockicon" aria-hidden="true"></i>'}<span>${open ? esc(x.name.replace(/^Ser /, '').split(' ')[0]) + ' · ' + RB.CLASSES[x.cls].name : 'Locked'}</span></button>`; }).join('')}</div>
        <div class="heroinfo">${heroBlurb(h)}</div>
        <div class="opts"><span class="seg"><button class="${!s.custom && !s.autoD ? 'on' : ''}" data-act="starter">Starter deck</button><button class="${s.autoD ? 'on' : ''}" data-act="autodeck" title="Builds the strongest deck for this hero against this raid from the cards you own">Auto deck</button><button class="${s.custom ? 'on' : ''}" data-act="custom">My deck</button></span><button class="btn small" data-act="edit">Edit deck</button></div>${s.autoD ? `<div class="opts" style="color:var(--muted);font-size:.85rem">Auto deck: tuned for ${esc(R[setup.raid].short)} with ${setup.seats.length} hero${setup.seats.length > 1 ? 'es' : ''}. It's rebuilt when you change the raid or party.</div>` : ''}
        <div class="opts">${setup.asBoss ? '<span style="color:var(--muted);font-size:.85rem">The AI plays this hero against you.</span>' : `<label class="toggle"><input type="checkbox" data-act="auto" ${s.auto ? 'checked' : ''}> Let the AI play this hero</label>`}${!deckOk ? '<span class="chip" style="color:#ffb49a">Your deck needs 30 cards — the starter deck will be used</span>' : ''}</div></div>`;
    }).join('') + (setup.seats.length < 4 ? `<button class="addseat" data-act="add">+ Add a hero</button>` : '');
    const el = U.show('setup', `<div class="page"><div class="pagehead"><h2>Choose your raid</h2><span class="sp"></span></div>
      <div class="raids">${raids}</div>
      ${R[setup.raid].lore ? `<div class="lore" style="--lc:${R[setup.raid].theme || '#c9a25a'}"><h3>The tale of ${esc(R[setup.raid].name)}</h3>${R[setup.raid].lore.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
      <div class="difficulty"><span class="seg"><button class="${setup.diff === 'normal' ? 'on' : ''}" data-diff="normal">Normal</button><button class="${setup.diff === 'heroic' ? 'on' : ''}" data-diff="heroic">Heroic</button><button class="${setup.diff === 'mythic' ? 'on' : ''} ${U.mythicOpen(setup.raid) ? '' : 'locked'}" data-diff="mythic" title="${U.mythicOpen(setup.raid) ? 'The hardest way to raid' : 'Beat ' + esc(R[setup.raid].short) + ' on Heroic to unlock Mythic'}">${U.mythicOpen(setup.raid) ? '' : '&#128274; '}Mythic</button></span><span style="color:var(--muted);font-size:.92rem">${U.DIFF_TEXT[setup.diff] || U.DIFF_TEXT.normal}</span></div>
      <div class="difficulty"><span class="seg"><button class="${!setup.asBoss ? 'on' : ''}" data-side="heroes">Play the heroes</button><button class="${setup.asBoss ? 'on' : ''}" data-side="boss">Play the raid boss</button></span><span style="color:var(--muted);font-size:.92rem">${setup.asBoss ? `You are ${esc(R[setup.raid].boss)}. Each turn you hold a hand of boss cards and pick which to play, then choose who your minions and your strike attack. The AI plays the heroes.` : 'You lead the heroes against the AI-controlled boss.'}</span></div>
      <h3 class="sec">${setup.asBoss ? 'The heroes you will face' : 'Your party'}</h3><p class="lede">${setup.asBoss ? 'Pick one to four heroes for the AI to play against you. More heroes means a tougher fight — and the boss gets more health and plays more cards each turn to match.' : 'Play solo or bring up to four heroes. You take every hero\'s turn yourself (pass-and-play), or hand any of them to the AI. The boss scales with your party size.'}</p>
      <div class="seats">${seats}</div>
      ${U.bossScale(setup.raid, setup.seats.length, setup.diff, setup.asBoss)}
      <p class="ainote neterr" ${!setup.asBoss && setup.seats.every(x => x.auto) ? '' : 'hidden'}>The AI is playing every hero. You can watch, but an all-AI party earns no gold, treasure or wins.</p>
      <div class="startbar"><span class="summary">${esc(R[setup.raid].name)} · ${setup.seats.length} hero${setup.seats.length > 1 ? 'es' : ''} · ${RB.RAID_DIFFS[setup.diff].name}${setup.asBoss ? ' · You are the boss' : ''}</span><button class="btn primary" data-act="go">${setup.asBoss ? 'Take the throne' : 'Enter the raid'}</button></div></div>`, keep === true);
    el.onclick = e => {
      const t = e.target;
      const raid = t.closest('[data-raid]'); if (raid) { setup.raid = raid.dataset.raid; return U.setup(true); }
      const df = t.closest('[data-diff]'); if (df) { if (df.dataset.diff === 'mythic' && !U.mythicOpen(setup.raid)) return U.toast(`Mythic is locked. Beat ${R[setup.raid].short} on Heroic first.`); setup.diff = df.dataset.diff; return U.setup(true); }
      const sd = t.closest('[data-side]'); if (sd) { setup.asBoss = sd.dataset.side === 'boss'; return U.setup(true); }
      const seatEl = t.closest('[data-seat]'); const seat = seatEl ? setup.seats[+seatEl.dataset.seat] : null;
      const hb = t.closest('[data-hero]'); if (hb && seat) { const hx = H[hb.dataset.hero]; if (!U.heroOpen(hx.id)) return U.toast(`${hx.name} is locked. To unlock: ${hx.unlock.text}.`); seat.hero = hb.dataset.hero; return U.setup(true); }
      const a = t.closest('[data-act]'); if (!a) return;
      switch (a.dataset.act) {
        case 'back': return U.title();
        case 'add': { const used = setup.seats.map(s => s.hero); const next = Object.keys(H).find(h => !used.includes(h) && U.heroOpen(h)) || 'aldric'; setup.seats.push({ hero: next, auto: false, custom: false }); return U.setup(true); }
        case 'rm': setup.seats.splice(+seatEl.dataset.seat, 1); return U.setup(true);
        case 'starter': seat.custom = false; seat.autoD = false; return U.setup(true);
        case 'autodeck': seat.custom = false; seat.autoD = true; return U.setup(true);
        case 'custom': seat.custom = true; seat.autoD = false; if (!save.decks[seat.hero]) save.decks[seat.hero] = RB.buildDeck(seat.hero, save.owned, setup.seats.length); U.persist(); return U.setup(true);
        case 'edit': seat.custom = true; seat.autoD = false; return U.deckbuilder(seat.hero, () => U.setup(true));
        case 'auto': { seat.auto = a.checked; const nt = $('#setup .ainote'); if (nt) nt.hidden = setup.asBoss || !setup.seats.every(x => x.auto); return; }
        case 'go': return U.startRaid();
        case 'heroAuto': return;
      }
    };
  };
  // #34 (user): show how the boss scales to the party
  U.bossScale = function (raidId, n, diff, asBoss) {
    const r = R[raidId], DF = RB.RAID_DIFFS[diff] || RB.RAID_DIFFS.normal;
    const hp = Math.round((r.hp + r.hpPer * (n - 1) * (DF.partyHp || 1)) * DF.hp * (asBoss ? 1.15 : 1));
    const strike = r.strike + (DF.strike || 0) + (n - 1) + (n >= 2 ? 1 : 0);
    const cards = n + (DF.cards || 0), pv = (DF.partyStrikes || [])[n - 1] || 0;
    const times = pv >= 1 ? ` (${1 + Math.floor(pv)} times a turn)` : pv > 0 ? ' (twice every other turn)' : '';
    return `<div class="bossscale"><b>${esc(r.short)} scales to ${n} hero${n > 1 ? 'es' : ''}:</b> ${hp} health · strikes for ${strike}${times} · reveals ${cards} boss card${cards > 1 ? 's' : ''} a turn${n >= 2 ? ' · minion attacks +1' : ''}${DF.enrage ? ` · enraged from round ${DF.enrage}` : ''}${r.id === 'tide' && n >= 3 ? ` · starts with ${n} tentacles` : ''}</div>`;
  };
  // #117: difficulty texts, Mythic unlock and win badges
  U.DIFF_TEXT = {
    normal: 'Normal: the recommended way to learn each raid.',
    heroic: 'Heroic: the boss has 30% more health, strikes 1 harder and reveals 1 extra card every turn. Against 2 or more heroes it also strikes extra times. Treasure packs hold an extra holofoil and better odds of a loot card, and you earn 25% more gold.',
    mythic: 'Mythic: the hardest fight. The boss has 50% more health (and even more for each extra hero), strikes 1 harder, reveals 1 extra card, strikes extra times against parties and becomes Enraged at round 20. Every treasure card is a holofoil, two are raid treasures, loot is more likely, and you earn 50% more gold.',
  };
  U.mythicOpen = raidId => ((save.heroicWins || {})[raidId] || 0) > 0;
  U.diffBadges = raidId => {
    const h = (save.heroicWins || {})[raidId] || 0, m = (save.mythicWins || {})[raidId] || 0;
    if (!h && !m) return '';
    return `<div class="diffbadges">${h ? `<span class="db heroic">Heroic ${h}×</span>` : ''}${m ? `<span class="db mythic">&#9819; Mythic ${m}×</span>` : '<span class="db open">Mythic unlocked</span>'}</div>`;
  };
  U.startRaid = async function () {
    const autos = [];
    for (const s of setup.seats) autos.push(s.autoD ? await U.autoDeckFor(s.hero, setup.raid, setup.seats.length) : null);
    const party = setup.seats.map((s, i) => {
      const custom = s.custom && save.decks[s.hero] && save.decks[s.hero].length === RB.DECK_SIZE;
      const ids = autos[i] ? autos[i].slice() : custom ? save.decks[s.hero].slice() : RB.buildDeck(s.hero, save.owned, setup.seats.length);
      const holoLeft = Object.assign({}, save.holo);
      const deck = ids.map(id => { const h = holoLeft[id] > 0; if (h) holoLeft[id]--; return { id, holo: h }; });
      return { hero: s.hero, auto: s.auto, deck, lands: autos[i] ? RB.autoSide(s.hero, setup.raid, save.owned) : custom ? RB.landsFor(s.hero, save.lands[s.hero]) : RB.defaultLands(s.hero), name: 'Hero ' + (i + 1), pet: i === 0 && U.ownsCos(save.sel.pet) ? save.sel.pet : null };
    });
    U.battle({ raid: setup.raid, difficulty: setup.diff, party, bossPlayer: !!setup.asBoss, settings: { autoDefend: save.settings.autoDefend, pauseForInstants: save.settings.pauseForInstants } });
  };

  /* ---------------- auto deck (#23) ---------------- */
  U.autoDeckFor = async function (hid, raidId, partySize) {
    const key = [hid, raidId, partySize, Object.values(save.owned).reduce((a, b) => a + b, 0), 'r2'].join('|'); // r2: decks no longer hold quests or locations
    save.autoDecks = save.autoDecks || {};
    if (save.autoDecks[key]) return save.autoDecks[key];
    const ov = document.createElement('div'); ov.className = 'overlay';
    ov.innerHTML = `<div class="dialog" style="min-width:min(90vw,420px)"><h3>Building the best deck</h3><p>Testing ${esc(H[hid].name)}'s cards against ${esc(R[raidId].short)} in practice raids…</p><div class="pbar"><i style="width:0%"></i></div><p class="pnote" style="color:var(--muted);font-size:.9rem;margin:.6rem 0 0">This takes a few seconds.</p></div>`;
    document.body.appendChild(ov);
    try {
      const r = await RB.bestDeck(hid, raidId, save.owned, partySize, { onProgress: f => { const b = ov.querySelector('.pbar i'); if (b) b.style.width = Math.round(f * 100) + '%'; } });
      for (const k of Object.keys(save.autoDecks)) if (k.startsWith(hid + '|')) delete save.autoDecks[k];
      save.autoDecks[key] = r.deck; U.persist();
      return r.deck;
    } finally { ov.remove(); }
  };

  /* ---------------- #134 named decks ----------------
     save.deckList holds every deck you have built: { id, name, hero, cards (30), lands (the ten resource cards) }.
     save.deckUse[hero] is the one that hero plays as "My deck"; it is mirrored into save.decks[hero] and
     save.lands[hero], which the raid setup and online lobby already read. */
  const DK = U.decks = {
    list() {
      if (!Array.isArray(save.deckList)) {
        save.deckList = []; save.deckUse = {};
        for (const [hid, ids] of Object.entries(save.decks || {})) if (H[hid] && Array.isArray(ids) && ids.length) DK.add(hid, DK.heroShort(hid) + '\'s deck', ids, save.lands[hid], true);
        U.persist();
      }
      save.deckUse = save.deckUse || {};
      return save.deckList;
    },
    heroShort: hid => H[hid].name.replace(/^Ser /, '').split(/[ ,]/)[0],
    get: id => DK.list().find(d => d.id === id),
    ready: d => d.cards.length === RB.DECK_SIZE && d.cards.every(id => C[id] && RB.legalFor(d.hero, C[id])),
    add(hid, name, cards, lands, use) {
      const d = { id: 'k' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), name: String(name || 'New deck').slice(0, 30), hero: hid, cards: (cards || []).filter(id => C[id] && !RB.isResCard(C[id])), lands: RB.landsFor(hid, lands) };
      save.deckList.push(d); if (use) DK.use(d.id); return d;
    },
    // make this deck the one its hero plays
    use(id) { const d = save.deckList.find(x => x.id === id); if (!d) return; save.deckUse = save.deckUse || {}; save.deckUse[d.hero] = d.id; save.decks[d.hero] = d.cards.slice(); if (RB.landsOk(d.hero, d.lands)) save.lands[d.hero] = d.lands.slice(); else delete save.lands[d.hero]; },
    sync(d) { if ((save.deckUse || {})[d.hero] === d.id) DK.use(d.id); },
    remove(id) { const d = DK.get(id); if (!d) return; save.deckList = save.deckList.filter(x => x.id !== id); if (save.deckUse[d.hero] === id) { delete save.deckUse[d.hero]; const next = save.deckList.find(x => x.hero === d.hero); if (next) DK.use(next.id); else { delete save.decks[d.hero]; delete save.lands[d.hero]; } } },
    // the deck a hero's "My deck" edits: the one in use, or a new one made from the starter deck
    forHero(hid) { DK.list(); let d = DK.get(save.deckUse[hid]); if (!d) d = DK.add(hid, DK.heroShort(hid) + '\'s deck', save.decks[hid] || RB.buildDeck(hid, save.owned), save.lands[hid], true); return d; },
  };

  /* ---------------- deck builder ---------------- */
  U.deckbuilder = function (hid, onDone, deckId) {
    const entry = (deckId && DK.get(deckId)) || DK.forHero(hid);
    hid = entry.hero;
    const h = H[hid];
    let name = entry.name;
    let deck = entry.cards.slice();
    let lands = RB.landsFor(hid, entry.lands); // the ten resource cards (lands, quests, locations) that ride along with the 30
    let filter = 'all', q = '', dlMini = false, drawn = false;
    const legalAll = Object.values(C).filter(d => RB.legalFor(hid, d) && (save.owned[d.id] || 0) > 0);
    const legal = legalAll.filter(d => !RB.isResCard(d)), legalLands = legalAll.filter(d => RB.isResCard(d)).sort((a, b) => 'land quest location'.indexOf(a.type) - 'land quest location'.indexOf(b.type));
    const types = ['all', 'ally', 'ability', 'weapon', 'armor', 'item', 'master', 'land'];
    function draw() {
      const counts = deck.reduce((m, id) => (m[id] = (m[id] || 0) + 1, m), {});
      const onLands = filter === 'land', lcounts = lands.reduce((m, id) => (m[id] = (m[id] || 0) + 1, m), {});
      const list = (onLands ? legalLands : legal).filter(d => (filter === 'all' || onLands || d.type === filter) && (!q || (d.name + ' ' + (d.text || '')).toLowerCase().includes(q)));
      if (!onLands) list.sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
      const curve = [0, 1, 2, 3, 4, 5, 6, 7].map(c => deck.filter(id => Math.min(7, C[id].cost) === c && !['quest', 'location'].includes(C[id].type)).length);
      const maxC = Math.max(1, ...curve);
      const rows = Object.entries(counts).sort((a, b) => C[a[0]].cost - C[b[0]].cost).map(([id, k]) => `<div class="row" data-rm="${id}" title="Click to remove one"><span class="c">${['quest', 'location'].includes(C[id].type) ? '·' : C[id].cost}</span><span class="n">${esc(C[id].name)}</span><span class="x">×${k}</span></div>`).join('');
      const byType = t => deck.filter(id => C[id].type === t).length;
      const el = U.show('deck', `<div class="page"><div class="pagehead"><button class="btn ghost small" data-act="done">← Done</button><h2 class="deckttl"><input class="decknamein" maxlength="30" value="${esc(name)}" aria-label="Deck name" title="Click to rename this deck"><small>${esc(h.name)}</small></h2><span class="sp"></span><button class="btn small" data-act="auto" title="Build the strongest deck for ${esc(R[setup.raid].short)} from your cards">Auto-build for ${esc(R[setup.raid].short)}</button><button class="btn small" data-act="starter">Use the starter deck</button><button class="btn small" data-act="clear">Clear</button></div>
        <p class="lede">${esc(RB.FACTIONS[h.fac].name)} · ${h.race} ${RB.CLASSES[h.cls].name} · ${RB.PROFS[h.profs[0]]}, ${RB.PROFS[h.profs[1]]}. Only cards this hero can use are shown. Armor: ${RB.CLASSES[h.cls].armor.join(', ')}. Weapons: ${RB.CLASSES[h.cls].weapons.join(', ')}. Up to 2 copies of a card (1 if Unique or a Master Hero).</p>
        <div class="dbgrid"><div><div class="filters">${types.map(t => `<button class="btn small ${filter === t ? '' : 'ghost'}" data-f="${t}">${{ all: 'All', ally: 'Allies', ability: 'Abilities', weapon: 'Weapons', armor: 'Armor', item: 'Items', quest: 'Quests', master: 'Master heroes', land: `Lands, quests & locations ${lands.length}/${RB.LAND_COUNT}` }[t]}</button>`).join('')}<input type="search" placeholder="Search cards" value="${esc(q)}" aria-label="Search cards"></div>
        ${onLands ? `<p class="sub landnote">Every deck carries <b>${RB.LAND_COUNT} resource cards</b> on top of its 30 normal cards: any mix of <b>lands, quests and locations</b>. You play one a turn as a resource. Lands are free and do one small thing as they arrive; quests and locations keep their abilities (you can only hold one location at a time). Up to 2 copies of each. Normal cards can only become resources ${RB.SPARE_RES} times a fight.</p>` : ''}
        <div class="pool">${list.map(d => { const k = (onLands ? lcounts : counts)[d.id] || 0, max = Math.min(RB.maxCopies(d), save.owned[d.id] || 0); return `<div class="slot ${k >= max ? 'dim' : ''}" data-add="${d.id}">${k ? `<span class="count">${k}</span>` : ''}${U.cardHTML(d.id, { holo: (save.holo[d.id] || 0) > 0 })}<div class="owned">${k}/${max} in deck · own ${save.owned[d.id]}</div></div>`; }).join('')}</div></div>
        <aside class="decklist ${dlMini ? 'mini' : ''}"><h4 data-act="dlmini">${deck.length} / ${RB.DECK_SIZE} cards<span class="dltoggle phone-only">${dlMini ? '▲ Show deck' : '▼ Hide'}</span></h4><div style="font-size:.8rem;color:var(--muted)">Allies ${byType('ally')} · Abilities ${byType('ability')} · Gear ${byType('weapon') + byType('armor') + byType('item')}</div><div class="curve">${curve.map((v, i) => `<div style="height:${(v / maxC) * 100}%"><span>${i === 7 ? '7+' : i}</span></div>`).join('')}</div><div style="height:.6rem"></div>${rows || '<p style="color:var(--muted)">' + (U.isPhone() ? 'Tap cards to add them.' : 'Click cards on the left to add them.') + '</p>'}
          <h4 class="landhead" data-f="land" title="Choose your lands, quests and locations">Lands, quests & locations ${lands.length} / ${RB.LAND_COUNT}</h4>${Object.entries(lcounts).map(([id, k]) => `<div class="row" data-rml="${id}" title="Click to remove one"><span class="c">${C[id].type === 'land' ? '◆' : C[id].type === 'quest' ? 'Q' : 'L'}</span><span class="n">${esc(C[id].name)}</span><span class="x">×${k}</span></div>`).join('')}</aside></div></div>`, drawn);
      drawn = true;
      const nin = $('.decknamein', el); nin.oninput = () => { name = nin.value; };
      const inp = $('input[type=search]', el);
      inp.oninput = () => { q = inp.value.toLowerCase(); const pos = inp.selectionStart; draw(); const n = $('#deck input[type=search]'); n.focus(); n.setSelectionRange(pos, pos); };
      el.onclick = e => {
        const t = e.target;
        const f = t.closest('[data-f]'); if (f) { filter = f.dataset.f; return draw(); }
        const rml = t.closest('[data-rml]'); if (rml) { lands.splice(lands.indexOf(rml.dataset.rml), 1); return draw(); }
        const ad = t.closest('[data-add]'); if (ad && RB.isResCard(C[ad.dataset.add])) { const d = C[ad.dataset.add]; if (lands.length >= RB.LAND_COUNT) return U.toast(`All ${RB.LAND_COUNT} resource slots are full. Remove one first (click it in the list).`); if ((lcounts[d.id] || 0) >= Math.min(RB.maxCopies(d), save.owned[d.id] || 0)) return U.toast((lcounts[d.id] || 0) >= RB.maxCopies(d) ? 'That\'s the most copies allowed.' : 'You don\'t own more copies of this card.'); lands.push(d.id); return draw(); }
        if (ad) { const d = C[ad.dataset.add]; const k = counts[d.id] || 0; if (deck.length >= RB.DECK_SIZE) return U.toast('Your deck already has 30 cards. Remove one first.'); if (k >= Math.min(RB.maxCopies(d), save.owned[d.id] || 0)) return U.toast(k >= RB.maxCopies(d) ? 'That\'s the most copies allowed.' : 'You don\'t own more copies of this card.'); deck.push(d.id); return draw(); }
        const rm = t.closest('[data-rm]'); if (rm) { deck.splice(deck.indexOf(rm.dataset.rm), 1); return draw(); }
        const a = t.closest('[data-act]'); if (!a) return;
        if (a.dataset.act === 'starter') { deck = RB.buildDeck(hid, save.owned); lands = RB.defaultLands(hid); return draw(); }
        if (a.dataset.act === 'auto') { U.autoDeckFor(hid, setup.raid, setup.seats.length).then(d => { deck = d.slice(); lands = RB.autoSide(hid, setup.raid, save.owned); draw(); U.toast('Auto-built for ' + R[setup.raid].short + '. Change anything you like.'); }); return; }
        if (a.dataset.act === 'clear') { deck = []; return draw(); }
        if (a.dataset.act === 'dlmini') { dlMini = !dlMini; return draw(); }
        if (a.dataset.act === 'done') { entry.name = (name.trim() || DK.heroShort(hid) + '\'s deck').slice(0, 30); entry.cards = deck.slice(); entry.lands = RB.landsOk(hid, lands) ? lands.slice() : RB.defaultLands(hid); DK.sync(entry); U.persist(); if (deck.length !== RB.DECK_SIZE) U.toast(`Saved. Your deck has ${deck.length} cards — it needs exactly 30 to be used.`); else if (lands.length !== RB.LAND_COUNT) U.toast(`You picked ${lands.length} lands, quests and locations, not ${RB.LAND_COUNT}, so this hero will use the usual ten.`); (onDone || U.title)(); }
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
  U.collection = function (startView) {
    let set = 'all', view = startView === 'decks' ? 'decks' : 'cards', newHero = '';
    const viewSeg = () => `<span class="seg colview"><button class="${view === 'cards' ? 'on' : ''}" data-view="cards">Cards</button><button class="${view === 'decks' ? 'on' : ''}" data-view="decks">Decks (${DK.list().length})</button></span>`;
    // #134: build, name and assign decks without starting a raid
    function drawDecks() {
      const list = DK.list(), heroes = Object.values(H).filter(x => U.heroOpen(x.id));
      if (!newHero || !U.heroOpen(newHero)) newHero = heroes[0].id;
      const tile = d => { const hh = H[d.hero], inUse = save.deckUse[d.hero] === d.id, ok = DK.ready(d), q = d.lands.filter(id => C[id] && C[id].type !== 'land').length;
        return `<div class="decktile ${inUse ? 'inuse' : ''}" data-deck="${d.id}"><img alt="" src="${U.cardArt(d.hero)}"><div class="dbody">
          <input class="decknamein" maxlength="30" value="${esc(d.name)}" aria-label="Deck name" title="Click to rename">
          <div class="sub">${esc(hh.name)} · ${RB.CLASSES[hh.cls].name}</div>
          <div class="sub">${ok ? `<span class="okmsg">Ready</span> · 30 cards` : `<span class="warnmsg">Not ready</span> · ${d.cards.length} of 30 cards`} · ${d.lands.length - q} lands, ${q} quests & locations</div>
          <div class="dacts">${inUse ? `<span class="chip ok">${esc(DK.heroShort(d.hero))} plays this deck</span>` : `<button class="btn small primary" data-dk="use" ${ok ? '' : 'disabled title="Finish the deck first (it needs exactly 30 cards)"'}>Give to ${esc(DK.heroShort(d.hero))}</button>`}<button class="btn small" data-dk="edit">Edit</button><button class="btn small ghost" data-dk="copy">Copy</button><button class="btn small ghost" data-dk="hero">Copy to another hero</button><button class="btn small ghost" data-dk="del">Delete</button></div></div></div>`; };
      const byHero = heroes.map(x => [x, list.filter(d => d.hero === x.id)]).filter(([, l]) => l.length);
      const el = U.show('collection', `<div class="page"><div class="pagehead"><h2>Collection</h2>${viewSeg()}<span class="sp"></span><span class="chip">${list.length} deck${list.length === 1 ? '' : 's'}</span></div>
        <p class="lede">Build as many decks as you like, name them, and choose which one each hero plays. A deck belongs to one hero, because a hero's faction and class decide which cards it can hold. The deck a hero plays is the one used when you pick <b>My deck</b> in a raid or online.</p>
        <div class="newdeck"><label>New deck for <select id="newdeckhero" aria-label="Hero">${heroes.map(x => `<option value="${x.id}" ${x.id === newHero ? 'selected' : ''}>${esc(x.name)} · ${RB.CLASSES[x.cls].name}</option>`).join('')}</select></label><button class="btn primary" data-dk="new">Build a new deck</button><span class="sub">It starts as that hero's starter deck. Change anything you like.</span></div>
        ${byHero.length ? byHero.map(([x, l]) => `<h3 class="sec">${esc(x.name)}</h3><div class="deckgrid">${l.map(tile).join('')}</div>`).join('') : '<p class="sub" style="margin-top:1rem">You have no decks yet. Pick a hero above and build one.</p>'}</div>`);
      el.onchange = e => { const sel = e.target.closest('#newdeckhero'); if (sel) { newHero = sel.value; return; } const ni = e.target.closest('.decktile .decknamein'); if (ni) { const d = DK.get(ni.closest('[data-deck]').dataset.deck); if (d) { d.name = (ni.value.trim() || d.name).slice(0, 30); U.persist(); U.toast('Deck renamed.'); } } };
      el.onclick = async e => {
        const v = e.target.closest('[data-view]'); if (v) { view = v.dataset.view; return draw(); }
        const b = e.target.closest('[data-dk]'); if (!b) return;
        const back = () => U.collection('decks');
        if (b.dataset.dk === 'new') { const d = DK.add(newHero, 'New ' + DK.heroShort(newHero) + ' deck', RB.buildDeck(newHero, save.owned), null, !save.deckUse[newHero]); U.persist(); return U.deckbuilder(newHero, back, d.id); }
        const d = DK.get(b.closest('[data-deck]').dataset.deck); if (!d) return;
        switch (b.dataset.dk) {
          case 'edit': return U.deckbuilder(d.hero, back, d.id);
          case 'use': DK.use(d.id); U.persist(); U.toast(`${DK.heroShort(d.hero)} now plays "${d.name}".`); return drawDecks();
          case 'copy': DK.add(d.hero, ('Copy of ' + d.name).slice(0, 30), d.cards, d.lands, false); U.persist(); return drawDecks();
          case 'hero': {
            const others = heroes.filter(x => x.id !== d.hero);
            const pick = await U.dialog(`<h3>Copy "${esc(d.name)}" to another hero</h3><p>Cards the new hero can't use are left out, so the copy may need a few more cards before it is ready.</p><div class="heropick">${others.map(x => `<button data-v="${x.id}"><img alt="" src="${U.cardArt(x.id)}"><span>${esc(DK.heroShort(x.id))} · ${RB.CLASSES[x.cls].name} · keeps ${d.cards.filter(id => RB.legalFor(x.id, C[id])).length}</span></button>`).join('')}</div><div class="acts"><button class="btn ghost" data-v="x">Cancel</button></div>`, { dismiss: 'x' });
            if (!pick || !H[pick]) return;
            const cnt = {}, cards = d.cards.filter(id => RB.legalFor(pick, C[id]) && (cnt[id] = (cnt[id] || 0) + 1) <= Math.min(RB.maxCopies(C[id]), save.owned[id] || 0));
            const nd = DK.add(pick, (d.name + ' (' + DK.heroShort(pick) + ')').slice(0, 30), cards, d.lands.filter(id => RB.legalFor(pick, C[id])), false); U.persist();
            U.toast(cards.length === RB.DECK_SIZE ? `Copied for ${DK.heroShort(pick)}.` : `Copied for ${DK.heroShort(pick)} with ${cards.length} of 30 cards. Add ${RB.DECK_SIZE - cards.length} more to finish it.`);
            return cards.length === RB.DECK_SIZE ? drawDecks() : U.deckbuilder(pick, back, nd.id);
          }
          case 'del': { const ok = await U.dialog(`<h3>Delete "${esc(d.name)}"?</h3><p>The deck list is removed. You keep every card.</p><div class="acts"><button class="btn ghost" data-v="no">Keep it</button><button class="btn primary" data-v="yes">Delete</button></div>`, { dismiss: 'no' }); if (ok !== 'yes') return; DK.remove(d.id); U.persist(); return drawDecks(); }
        }
      };
    }
    const sets = { all: 'All cards', core: 'Core set', ember: 'Emberfall packs', frost: 'Frostwing packs', void: 'Voidshade packs', crypt: 'Crypt treasure', molten: 'Molten Spire treasure', tide: 'Sunken Cathedral treasure', loot: 'Loot cards' };
    function draw() {
      if (view === 'decks') return drawDecks();
      const list = Object.values(C).filter(d => set === 'all' || d.set === set || d.pack === set).sort((a, b) => (a.set === 'core') - (b.set === 'core') || a.type.localeCompare(b.type) || a.cost - b.cost);
      const total = Object.values(C).length, have = Object.values(C).filter(d => save.owned[d.id] > 0).length;
      // #62: unscratched or unredeemed codes are shown in full; redeemed ones shrink to a compact list (Loot tab only)
      const lootTile = (l, i) => `<div class="cos"><h4>${esc(C[l.id].name)}</h4><p style="margin:.2rem 0;color:var(--muted);font-size:.9rem">${esc(C[l.id].loot.label)}</p><div class="scratch" data-loot="${i}"><span>${l.code}</span>${l.scratched ? '' : '<canvas></canvas>'}</div><p style="font-size:.85rem;color:var(--muted)">${l.scratched ? 'Enter this code in the Vault.' : 'Scratch the silver panel to reveal your code.'}</p>${l.scratched ? `<button class="btn small" data-redeem="${i}">Redeem now</button>` : ''}</div>`;
      const open = save.loot.map((l, i) => [l, i]).filter(([l]) => !l.redeemed), used = save.loot.map((l, i) => [l, i]).filter(([l]) => l.redeemed);
      const lootRows = (open.length ? `<div class="cosgrid lootgrid">${open.map(([l, i]) => lootTile(l, i)).join('')}</div>` : '') + (set === 'loot' && used.length ? `<details class="usedloot"><summary>${used.length} redeemed code${used.length > 1 ? 's' : ''}</summary><ul>${used.map(([l]) => `<li><b>${esc(C[l.id].name)}</b> · ${esc(C[l.id].loot.label)} · <code>${l.code}</code> <span class="okmsg">Redeemed ✓</span></li>`).join('')}</ul></details>` : '');
      const showLoot = (set === 'all' && open.length) || (set === 'loot' && save.loot.length);
      // #116: how much of each set you have collected (a card counts once you own at least one copy)
      const inSet = k => Object.values(C).filter(d => k === 'all' || d.set === k || d.pack === k);
      const prog = k => { const l = inSet(k), h = l.filter(d => save.owned[d.id] > 0).length; return { h, t: l.length, pct: l.length ? Math.round(100 * h / l.length) : 0 }; };
      const SHORT = { ember: 'Emberfall', frost: 'Frostwing', void: 'Voidshade', molten: 'Molten treasure', tide: 'Cathedral treasure' };
      const setBtn = (k, v) => { const p = prog(k), done = p.t && p.h === p.t;
        return `<button class="btn small setbtn ${set === k ? '' : 'ghost'} ${done ? 'done' : ''}" data-set="${k}" title="${esc(v)}: ${p.h} of ${p.t} collected"><span class="sn">${esc(SHORT[k] || v)}${done ? ' <b class="sdone">&#10003;</b>' : ''}</span><span class="sc">${p.h} / ${p.t}</span><i class="sbar"><b style="width:${p.pct}%"></b></i></button>`; };
      const cur = prog(set), setLine = `<p class="setline">${set === 'all' ? 'You have collected' : `${esc(sets[set])}: you have`} <b>${cur.h} of ${cur.t}</b> cards (${cur.pct}%).${cur.h === cur.t ? ' <b class="sdone">Set complete!</b>' : ` ${cur.t - cur.h} still to find.`}</p>`;
      const el = U.show('collection', `<div class="page"><div class="pagehead"><h2>Collection</h2>${viewSeg()}<span class="sp"></span><span class="chip">${have} / ${total} cards discovered</span></div>
        <div class="filters setfilters">${Object.entries(sets).map(([k, v]) => setBtn(k, v)).join('')}</div>${setLine}
        ${showLoot ? `<h3 class="sec">Your loot codes</h3>${lootRows}<h3 class="sec">Cards</h3>` : ''}
        <div class="pool colpool">${list.map(d => { const o = save.owned[d.id] || 0; return `<div class="slot cardslot ${o ? '' : 'dim'}">${o > 0 ? `<span class="count">${o}</span>` : ''}${U.cardHTML(d.id, { holo: (save.holo[d.id] || 0) > 0 })}<div class="owned">${o ? `Own ${o}${save.holo[d.id] ? ` · ${save.holo[d.id]} holofoil` : ''}` : (d.type === 'master' ? `Comes with ${esc(((RB.HEROES[d.hero] || {}).name || 'its hero').split(',')[0])} when you can play them` : d.set === 'core' ? 'Found in Raidbound Core packs (Market)' : d.set === 'frontier' ? `Found in ${RB.PACK_SETS[d.pack] ? RB.PACK_SETS[d.pack].name : 'Frontier'} booster packs (Market)` : d.set === 'loot' ? 'Rare drop from treasure packs' : 'Win it from ' + (Object.values(R).find(r => r.treasure.includes(d.id)) || { name: 'a raid' }).name)}</div></div>`; }).join('')}</div></div>`);
      el.onclick = e => { const rd = e.target.closest('[data-redeem]'); if (rd) { const l = save.loot[+rd.dataset.redeem]; U.vault(); const inp = $('#code'); if (inp) { inp.value = l.code; document.querySelector('#vault [data-act=redeem]').click(); } return; } const vw = e.target.closest('[data-view]'); if (vw) { view = vw.dataset.view; return draw(); } const s = e.target.closest('[data-set]'); if (s) { set = s.dataset.set; draw(); } if (e.target.closest('[data-act=back]')) U.title(); };
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
      ['pet', 'Companions', 'A little creature that floats beside your hero (the first hero, in party games) in raids and dungeons. Each one gives your hero a tiny bonus, shown under its name. Online, every player\'s own companion helps their own hero. No bonus when you play as the boss.'],
    ];
    const tile = id => {
      const c = RB.COSMETICS[id], own = U.ownsCos(id), cur = save.sel[c.kind] && U.ownsCos(save.sel[c.kind]) ? save.sel[c.kind] : '', on = own && (cur || ({ back: 'back_classic', board: 'board_classic' }[c.kind] || '')) === id;
      const img = U.cosImg(id);
      return `<div class="cos k-${c.kind} ${own ? '' : 'locked'} ${on ? 'equipped' : ''} ${c.special ? 'special' : ''}">
        <div class="swatch">${img ? `<img alt="" src="${img}">` : ''}${own ? '' : '<span class="lock" aria-hidden="true">&#128274;</span>'}${on ? '<span class="eq">Equipped</span>' : ''}</div>
        <h4>${esc(c.name)}</h4><p class="cdesc">${esc(c.desc)}</p>${c.kind === 'pet' && RB.PET_PERKS && RB.PET_PERKS[id] ? `<p class="perk"><b>Bonus:</b> ${esc(RB.PET_PERKS[id].text)}</p>` : ''}${c.special ? `<p class="perk"><b>Special:</b> a shimmering foil finish on every face-down card.</p>` : ''}
        <p class="how ${own ? 'own' : ''}">${own ? (c.get === 'default' ? 'Owned from the start' : 'Unlocked') : esc(U.unlockText(c))}</p>
        ${own ? (on ? `<button class="btn small" disabled>In use</button>` : `<button class="btn small ghost" data-use="${id}">Use this</button>`) : ''}</div>`;
    };
    const total = Object.keys(RB.COSMETICS).length, have = Object.keys(RB.COSMETICS).filter(U.ownsCos).length;
    const sections = KINDS.map(([k, label, what]) => `<h3 class="sec">${label}</h3><p class="kwhat">${what}</p><div class="cosgrid g-${k}">${Object.keys(RB.COSMETICS).filter(id => RB.COSMETICS[id].kind === k).map(tile).join('')}</div>`).join('');
    const el = U.show('vault', `<div class="page"><div class="pagehead"><h2>The Vault</h2><span class="vcount">${have} of ${total} unlocked</span></div>
      <p class="lede">Card backs and table themes change how the game looks. Companions also give your hero one tiny bonus. Earn them by beating raids, or redeem the scratch-off code from a loot card (find loot cards in treasure packs, then scratch the code in your Collection).</p>
      <div class="codebox"><input id="code" placeholder="RB-XXXXX-XXXXX" aria-label="Loot or gold code" maxlength="17"><button class="btn primary" data-act="redeem">Redeem</button></div>
      ${msg ? `<p style="text-align:center;color:${msg.ok ? 'var(--verd-hi)' : '#ffb49a'}">${esc(msg.text)}</p>` : ''}
      ${sections}</div>`);
    el.onclick = e => {
      if (e.target.closest('[data-act=back]')) return U.title();
      const u = e.target.closest('[data-use]'); if (u) { const id = u.dataset.use, c = RB.COSMETICS[id]; save.sel[c.kind] = (id === 'back_classic' || id === 'board_classic') ? '' : id; U.persist(); U.applyCosmetics(); U.sfx.flip(); return U.vault(); }
      if (e.target.closest('[data-act=redeem]')) {
        const code = $('#code').value.trim();
        if (U.checkGoldCode(code)) return U.vault(U.redeemGold(code));
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
    const el = U.show('settings', `<div class="page" style="max-width:720px"><div class="pagehead"><h2>Settings</h2></div>
      <div class="settingsgrid">
      <div><h3 class="sec" style="margin-top:0">Game speed</h3><span class="seg">${[[1, 'Normal'], [0.55, 'Fast'], [0.15, 'Very fast']].map(([v, l]) => `<button class="${s.speed === v ? 'on' : ''}" data-speed="${v}">${l}</button>`).join('')}</span></div>
      <div class="audioset"><h3 class="sec" style="margin-top:0">Sound</h3>
        <label class="toggle" style="margin-bottom:.4rem"><input type="checkbox" data-k="muted" ${s.muted ? 'checked' : ''}> Mute everything (press M any time, or use the 🔊 button during a raid)</label>
        <div class="vrow"><label class="toggle"><input type="checkbox" data-k="sound" ${s.sound !== false ? 'checked' : ''}> Sound effects</label><input type="range" min="0" max="1" step="0.05" value="${s.sfxVol ?? 0.8}" data-vol="sfxVol" aria-label="Sound effects volume"><button class="btn small ghost" data-act="testfx">Test</button></div>
        <div class="vrow"><label class="toggle"><input type="checkbox" data-k="music" ${s.music !== false ? 'checked' : ''}> Music</label><input type="range" min="0" max="1" step="0.05" value="${s.musicVol ?? 0.5}" data-vol="musicVol" aria-label="Music volume"><span></span></div>
        <label class="toggle" style="margin-top:.4rem"><input type="checkbox" data-k="turnAlert" ${s.turnAlert !== false ? 'checked' : ''}> Chime when it's my turn (also when the game is in another tab)</label></div>
      <label class="toggle"><input type="checkbox" data-k="autoDefend" ${s.autoDefend ? 'checked' : ''}> Defend automatically (use armor, strike back with your weapon and cover with Bulwark allies without asking)</label>
      <label class="toggle"><input type="checkbox" data-k="pauseForInstants" ${s.pauseForInstants ? 'checked' : ''}> Pause so I can answer the boss: play an Instant when a boss card is revealed, or a React card when an attack is coming (only when one of my cards can actually help)</label>
      <div style="margin-top:1.4rem"><button class="btn ghost small" data-act="reset">Reset all progress</button></div></div></div>`);
    el.oninput = e => { const r = e.target.closest('[data-vol]'); if (r) { s[r.dataset.vol] = +r.value; U.persist(); RB.AUDIO.setVolumes(); } };
    el.onchange = e => { if (e.target.closest('[data-vol=sfxVol]')) U.sfx.hit(3); };
    el.onclick = async e => {
      if (e.target.closest('[data-act=back]')) return U.title();
      const sp = e.target.closest('[data-speed]'); if (sp) { s.speed = +sp.dataset.speed; U.persist(); return U.settings(); }
      const k = e.target.closest('[data-k]'); if (k) { s[k.dataset.k] = k.checked; U.persist(); RB.AUDIO.refresh(); if (k.dataset.k === 'turnAlert' && k.checked) U.sfx.yourTurn(); return; }
      if (e.target.closest('[data-act=testfx]')) { const f = ['hit', 'block', 'heal', 'power', 'bossReveal']; U.sfx[f[(U._fxi = ((U._fxi || 0) + 1) % f.length)]](5); return; }
      if (e.target.closest('[data-act=reset]')) { const v = await U.dialog('<h3>Reset all progress?</h3><p>This removes your treasure cards, loot codes, unlocked cosmetics and saved decks. It can\'t be undone.</p><div class="acts"><button class="btn ghost" data-v="no">Keep my progress</button><button class="btn primary" data-v="yes">Reset everything</button></div>', { dismiss: 'no' }); if (v === 'yes') { try { localStorage.removeItem('raidbound.save.v1'); } catch (er) { } location.reload(); } }
    };
  };

  /* ---------------- #104 The Raider's Field Guide (How to play) ---------------- */
  // One set of chapters, used by the title screen's How to play and by the Rules button in battle.
  const KWI = { protector: 'B', ferocity: 'S', longrange: 'V', skyward: '⇡', elusive: '◐', guardian: 'G', unique: 'U', ambush: 'A', crushing: 'C', frenzy: 'F', thickhide: 'T', tend: '+' };
  const fgU = (img, name, sub, cls) => `<span class="fg-u ${cls || ''}"><span class="fg-i">${img ? `<img alt="" src="${img}">` : ''}</span><b>${name}</b>${sub ? `<small>${sub}</small>` : ''}</span>`;
  const fgA = (t, cls) => `<span class="fg-a ${cls || ''}">${t ? `<small>${t}</small>` : ''}<i>➜</i></span>`;
  const fgEx = (row, cap) => `<figure class="fg-ex"><div class="fg-row">${row}</div><figcaption>${cap}</figcaption></figure>`;
  const raidArt = id => { const r = RB.RAIDS[id]; return r ? U.art(r.art, 'raid:' + id) : ''; };
  U.guideChapters = function (only) {
    const ca = id => U.cardArt(id) || '';
    const kwRow = k => { const [n, t] = RB.KEYWORDS[k]; return `<li><span class="fg-kw">${KWI[k] || '•'}</span><b>${esc(n)}</b> — ${esc(t)}</li>`; };
    const soakRows = [1, 2, 3, 4].map(n => { const tot = 2 + 3 * n; return `<tr><td>${n} hero${n > 1 ? 'es' : ''}</td><td>${tot}</td>${[1, 2, 3, 4].map(k => `<td>${k <= n ? Math.ceil(tot / k) : '—'}</td>`).join('')}<td>${tot} each</td></tr>`; }).join('');
    const raids = Object.entries(RB.RAIDS).filter(([, r]) => !r.dungeon);
    const ch = [
      { id: 'basics', icon: '📜', title: 'First steps', html: `
        <p class="fg-lead">Well met, raider. This little book was stitched together by the guild's survivors. Read it before you go below, and keep it close once you're there.</p>
        <section><h4>The goal</h4><p>Your party of heroes fights a raid boss. Bring the boss to 0 health to win and earn a treasure pack. If every hero falls, the raid wipes.</p></section>
        <section><h4>Your hero</h4><p>Each hero has health, a faction (Silver Concord or Ember Clans), a race, a class, a specialization and two professions. These traits decide which cards can go in the deck. Every hero also has a unique power you can use once per game.</p></section>
        <section><h4>Resources</h4><p>Once per turn you may play one card from your hand as a resource. You begin with two. Every deck carries <b>${RB.LAND_COUNT} resource cards</b> on top of its 30 normal cards: any mix of lands, quests and locations. <b>Lands</b> are free and each does one small thing as it arrives (a little healing, a ward, a point of damage). You may also turn any other card face-down into a resource, but only <b>${RB.SPARE_RES} times in a fight</b>, so choose which cards to give up. To play a card, exhaust resources equal to its cost. <b>All your resources ready again at the start of your turn</b>, so a resource you leave unspent can pay for an Instant or a React card during the boss's turn at no cost to your next turn. Quests and locations are always played as resources, never count against those ${RB.SPARE_RES}, and keep their special abilities. They share the ten resource slots with your lands, so each one you bring means one land fewer.</p>
        ${fgEx(fgU('', '◆ ◆ ◆ ◆', '4 ready') + fgA('spend 2 on your turn') + fgU('', '◆ ◆ ◇ ◇', '2 still ready') + fgA('the boss attacks') + fgU(ca('laststand'), 'Last Stand', 'costs 2 · played as a React', 'ok'), 'End your turn with 2 resources ready and Last Stand is waiting for the boss. Next turn, all 4 ready again.')}</section>
        <section><h4>Your turn</h4><p>Ready everything, draw two cards, then act in any order: play one resource, play cards, attack, use items, complete quests, use your location and use your hero power. Press <b>End turn</b> when you're done, or <b>Auto-play turn</b> to let the AI finish it for you.</p></section>
        <section><h4>Card types</h4><ul><li><b>Allies</b> fight beside you. They can attack the turn after they arrive, unless they have Swift.</li><li><b>Abilities</b> take effect at once. Basic abilities are played on your turn. <b>Instants</b> can also be played when a boss card is revealed, and <b>React</b> cards when their trigger happens.</li><li><b>Weapons</b> add attack. Pay the strike cost each time you use one.</li><li><b>Armor</b> goes in a slot (head, chest, hands, legs, feet or off-hand). When your hero would take damage, exhaust it and pay its cost to block.</li><li><b>Items</b> are rings, potions and trinkets with lasting or one-shot effects.</li><li><b>Quests</b> are resources you can complete for a reward; they then turn face down.</li><li><b>Locations</b> are resources with an ability you can use once per turn. You control one at a time.</li><li><b>Master Heroes</b> replace your hero. Damage and gear carry over, but your original power does not.</li><li><b>Loot cards</b> play like normal cards and hide a scratch-off code for the Vault.</li></ul></section>` },
      { id: 'combat', icon: '⚔', title: 'Steel and blood', html: `
        <section><h4>Attacking</h4><p>Attacks always target one enemy: the boss or one of its minions. The defender strikes back, so both sides take damage. <b>Damage stays between turns</b>, so every fight costs you something. While a minion with <b>Guardian</b> stands, the boss can't be attacked.</p>
        ${fgEx(fgU(ca('treant'), 'Ironbark Treant', '3 ATK · 7 health') + fgA('attacks') + fgU(ca('thrall'), 'Risen Thrall', '2 ATK · 2 health') + fgA('result') + fgU('', 'Thrall falls', 'Treant keeps 2 damage', 'ok'), 'Both sides hit at once. The Treant wins, but carries 2 damage into the next turn.')}</section>
        <section><h4>Hitting everything at once</h4><p>A card or power that hits <b>each enemy</b> reaches at most <b>5 targets</b>. If there are more, it always hits the boss, then the minions it hurts most: Guardians first, then the ones it can finish off, then the hardest hitters. If the same card also hits the boss or a target you chose, it reaches 4 others. Party-wide heals and wards still reach everyone, and the boss's own hit-all cards have no limit. To keep that fair, a boss can have at most <b>7 minions</b> on the table at once.</p></section>
        <section><h4>Volley and melee</h4><p><b>Volley</b> attackers take nothing back. Melee attackers that hit the boss also take its <b>retaliation</b> (Cold Hands, Molten Scales, Coral Hide). Only Volley and <b>Skyward</b> attackers can reach a boss in the air (abilities always can). Skyward is just that: a Skyward ally still takes the hit back.</p></section>
        <section><h4>Your hero's weapon</h4><p>Heroes attack with an equipped weapon by paying its strike cost. When your hero is attacked, a ready weapon can also <b>strike back</b> if you can pay for it.</p></section>
        <section><h4>Armor, wards and healing</h4><p><b>Armor</b> can block when your hero is hit, if you have enough ready resources to pay its cost; it then exhausts until your turn. A <b>ward</b> (◈) is a shield from a card: it prevents the next damage and then fades. <b>Healing</b> removes damage but never raises health above the maximum.</p>
        ${fgEx(fgU('', '6 damage', 'boss strike', 'bad') + fgA('ward 4') + fgU('', '2 left') + fgA('armor blocks 2') + fgU(ca('aldric'), 'Ser Aldric', 'takes 0', 'ok'), 'Wards go first, then armor. Stack them and a big hit can vanish completely.')}</section>` },
      { id: 'bossturn', icon: '💀', title: "The boss's turn", html: `
        <p>After every hero has acted, the boss takes its turn. It always happens in this order:</p>
        <ol class="fg-steps">
          <li><b>Rage.</b> From round ${RB.ENRAGE_ROUND} (round ${RB.RAID_DIFFS.mythic.enrage} on Mythic) the boss is <b>Enraged</b>: its strike grows 1 stronger every round, goes straight past Bulwark allies, and sees through Shrouded heroes. No fight can stall forever.</li>
          <li><b>The raid's gauge rises.</b> Embers, the Tide and other counters tick up. When one fills, something terrible happens. A boss in the air strafes the party instead.</li>
          <li><b>Omens.</b> If an omen is due, the next one is revealed and happens at once (see <i>Omens and Soak</i>).</li>
          <li><b>Boss cards.</b> The boss reveals cards from its deck: one (one more in its later phases, and one more on Heroic or Mythic), plus one for each extra hero. Before each one lands, you may answer with an <b>Instant</b>.</li>
          <li><b>Minions attack.</b> Each ready minion attacks a hero or an ally.</li>
          <li><b>The strike.</b> The boss strikes the hero with the most <b>threat</b>. On Heroic and Mythic a boss facing 2 or more heroes strikes extra times, picking a target each time.</li>
        </ol>
        <p>Every time a minion or the boss attacks, the same small steps play out:</p>
        ${fgEx(fgU('', '1 · Cover', 'a Bulwark may step in') + fgA() + fgU('', '2 · React', 'answer the attack') + fgA() + fgU('', '3 · Strike back', 'weapon or ally') + fgA() + fgU('', '4 · Damage', 'wards, then armor'), 'Cover, React, strike back, damage. Learn this rhythm and you will lose far fewer heroes.')}
        <section><h4>The boss deck</h4><p>When the boss deck runs out, its discard pile is shuffled into a new deck. Long fights see the same nasty cards again, so remember what you have seen.</p></section>` },
      { id: 'threat', icon: '🛡', title: 'Threat and Cover', html: `
        <section><h4>Threat</h4><p>Every hero has a <b>threat</b> score, shown in the party list. Damage you deal adds to it, and everyone's threat resets after the boss's turn. The boss's strike goes to the hero with the most threat. <b>Taunt</b> forces the boss to strike you instead.</p></section>
        <section><h4>Cover</h4><p>When an enemy attacks any friendly hero or ally, a ready <b>Bulwark</b> ally anywhere in the party can <b>cover</b> them: it takes the hit instead and exhausts until its owner's next turn. Your Bulwark's own strike-back still happens.</p>
        ${fgEx(fgU(raidArt('crypt'), 'Malgareth', 'strikes for 7', 'bad') + fgA('aimed at') + fgU(ca('lyssara'), 'Lyssara', '9 health') + fgA('covered by') + fgU(ca('treant'), 'Ironbark Treant', 'takes the 7', 'ok'), 'The Treant steps in front of the mage. She takes nothing; the Treant is exhausted until its owner\'s turn.')}
        <p><b>Covering a teammate draws the boss's eye.</b> If your Bulwark covers someone else's hero or ally, your hero gains threat equal to twice the damage. Guard your friends and the boss comes looking for you next.</p></section>
        <section><h4>When Cover fails</h4><ul><li>Minions with <b>Ambush</b> strike before a Bulwark can move.</li><li>An <b>Enraged</b> boss's strike goes straight past every Bulwark.</li><li>In dungeons, the marked hero faces the dungeon alone: only their own Bulwark allies can cover them.</li></ul></section>
        <p class="small">Turn on <i>Defend automatically</i> in Settings and the game decides covers, armor and strike-backs for you.</p>` },
      { id: 'react', icon: '⚡', title: 'Instants and React', html: `
        <section><h4>Instants</h4><p>An <b>Instant</b> can be played on your turn, or the moment the boss reveals a card. It happens first; then the boss card still takes effect. Wards block damage before it lands, Shrouded heroes dodge attacks, and stuns stop minions or the boss's next strike. The game only pauses on a boss card when one of your Instants can change it: a ward or dodge against a card that will hurt your hero, a heal that would keep a hero standing, or a stun for minions about to attack (once per boss turn). A summon, a curse or the boss healing won't stop the game.</p></section>
        <section><h4>React</h4><p>Some Instants carry a <b class="kw react">React</b> trigger printed in their text. Besides being played as an Instant, a React card can be played <b>during the boss's turn, the moment its trigger happens</b>, after Cover and before the hit lands.</p>
        <ul>${Object.values(RB.REACT).map(t => `<li><b class="kw react">React</b> — ${esc(t)}</li>`).join('')}</ul>
        ${fgEx(fgU('', 'Grave minion', 'attacks for 5', 'bad') + fgA('React') + fgU(ca('laststand'), 'Last Stand', 'prevent the next 6') + fgA() + fgU(ca('grukka'), 'Grukka', 'takes 0', 'ok'), 'The hit is coming at your hero, so Last Stand can answer it right then — not before, not after.')}
        <p>React and Instant cards pay with resources you left ready. Keep one or two back when you end your turn and you'll have an answer waiting. The game pauses to offer a React only when one would really help; you can turn these pauses off in Settings.</p></section>` },
      { id: 'omens', icon: '◎', title: 'Omens and Soak', html: `
        <section><h4>Omens</h4><p>Each raid has its own small <b>Omen</b> deck. Omens are revealed during the boss's turn: <b>every boss turn</b> with 3 or 4 heroes, <b>every other</b> boss turn with 2, and <b>every third</b> for a hero raiding alone. The next three omens always wait face up beside the boss, so you can see trouble coming and plan around it.</p>
        ${fgEx(fgU(ca('cr_bell'), 'The Soul Bell Tolls ◎', 'next', 'omen') + fgU(ca('cr_graves'), 'Graves Stir', 'then', 'omen dim') + fgU(ca('cr_lull'), 'Silent Bells', 'then', 'omen dim'), 'The left omen is next. ◎ marks a Soak: be ready to step in.')}</section>
        <section><h4>Soak</h4><p>A <b>Soak</b> omen drops a fixed amount of damage into a circle. Each hero chooses to <b>step in</b> or stay out. The damage is shared evenly between everyone who steps in. If <b>nobody</b> steps in, it hits <b>every hero in full</b>. Wards and armor still help.</p>
        <div class="fg-tablewrap"><table class="fg-table"><thead><tr><th>Party</th><th>Total</th><th>1 in</th><th>2 in</th><th>3 in</th><th>4 in</th><th>Nobody</th></tr></thead><tbody>${soakRows}</tbody></table></div>
        <p class="small">Raiding alone, you always take the whole Soak: there is no one to share it with.</p></section>` },
      { id: 'raids', icon: '🔥', title: 'Raids and dungeons', html: `
        <p>Every raid has its own story, rules and <b>phases</b>. Phases begin when the boss's health drops past the marks on its health bar.</p>
        ${raids.map(([id, r]) => `<section class="fg-raid"><div class="fg-raidhead"><img alt="" src="${raidArt(id)}"><div><h4>${esc(r.name)}</h4><small>${esc(r.boss || r.short)}</small></div></div>${(r.lore || []).map(t => `<p class="fg-lore">${esc(t)}</p>`).join('')}<ul>${r.rules.map(x => `<li><b>${esc(x.name)}.</b> ${esc(x.text)}</li>`).join('')}</ul></section>`).join('')}
        <section><h4>Dungeons</h4><p>Dungeons are run by a dungeon hero instead of a raid boss. It flips cards each turn, marks one hero at random to attack, and levels up as you beat its under-bosses. Your heroes keep their health, cards and allies from one boss to the next.</p></section>
        ${Object.entries(RB.DUNGEONS || {}).map(([id, d]) => `<section class="fg-raid"><div class="fg-raidhead"><img alt="" src="${U.art(d.art, 'raid:' + id)}"><div><h4>${esc(d.name)}</h4><small>${(d.stages || []).map(st => esc(st.main ? d.boss : st.boss)).join(' → ') || esc(d.boss)}</small></div></div>${(d.lore || []).map(t => `<p class="fg-lore">${esc(t)}</p>`).join('')}</section>`).join('')}` },
      { id: 'keywords', icon: '✦', title: 'Keywords', html: `<p>Keywords are printed in bold on cards. The small letter shows on allies and minions on the table.</p><ul class="fg-kws">${Object.keys(RB.KEYWORDS).map(kwRow).join('')}</ul>` },
      { id: 'more', icon: '🎒', title: 'Collecting', html: `
        <section><h4>Party play</h4><p>Up to four heroes can join a raid. You take each hero's turn in order, so friends can pass the device around, or play online. The boss grows tougher with each hero: it has more health, reveals an extra card per hero, sees more omens, and its strikes and minions hit harder.</p></section>
        <section><h4>Treasure</h4><p>Victory opens a treasure pack of five cards: one epic from the boss's treasure, holofoil cards, and sometimes a loot card. New cards join your collection and are added to your starter decks automatically.</p></section>
        <section><h4>Your cards</h4><p>You start with the cards for each starting hero's starter deck, and each hero you unlock brings the cards for theirs. Every hero can always use their <b>Starter deck</b>, even with cards you haven't collected. Build your own deck from the cards you own. Get more from <b>Raidbound Core</b> packs (${RB.CORE_PACK_PRICE} gold), the themed booster packs (${RB.PACK_PRICE} gold), the daily card shop, crafting in the Workshop, and raid treasure. New players get two free Core packs.</p></section>
        <section><h4>Companions</h4><p>Pick a companion in the Vault and it floats beside your hero. Each one gives your hero a single tiny bonus in raids and dungeons, such as Ward 3 at the start, +2 max health, or an extra card in your opening hand. The raid log says when it helps. Some come from loot codes or Heroic wins; others come free when you get a certain card (for example, owning Beezer brings the Ember Wolf Pup).</p></section>
        <section class="credits"><h4>Art credits</h4><p>Every card, hero, raid and boss illustration was generated with <a href="https://spritecook.ai" target="_blank" rel="noopener">SpriteCook</a> and art-directed for Raidbound. Card frames, icons and interface are hand-built for the game.</p></section>` },
    ];
    return only ? ch.filter(c => only.includes(c.id)) : ch;
  };
  // tabbed book: chapter buttons on the left (top on phones), one chapter showing at a time
  U.guideHTML = function (chapters, first) {
    const cur = first || chapters[0].id;
    return `<div class="fieldguide"><nav class="fg-nav">${chapters.map(c => `<button class="fg-tab ${c.id === cur ? 'on' : ''}" data-ch="${c.id}"><span>${c.icon}</span>${esc(c.title)}</button>`).join('')}</nav><div class="fg-pages">${chapters.map(c => `<article class="fg-page ${c.id === cur ? 'on' : ''}" data-page="${c.id}"><h3 class="fg-title"><span>${c.icon}</span>${esc(c.title)}</h3>${c.html}</article>`).join('')}</div></div>`;
  };
  U.guideWire = function (el) {
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-ch]'); if (!b || !el.contains(b)) return;
      el.querySelectorAll('.fg-tab').forEach(x => x.classList.toggle('on', x === b));
      el.querySelectorAll('.fg-page').forEach(x => x.classList.toggle('on', x.dataset.page === b.dataset.ch));
      const pg = el.querySelector('.fg-pages'); if (pg) pg.scrollTop = 0;
    });
  };
  U.rules = function () {
    const el = U.show('rules', `<div class="page"><div class="pagehead"><h2>The Raider's Field Guide</h2></div>${U.guideHTML(U.guideChapters())}</div>`);
    U.guideWire(el);
    el.onclick = e => { if (e.target.closest('[data-act=back]')) U.title(); };
  };
})(globalThis.RB);
