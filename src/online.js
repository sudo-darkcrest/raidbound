/* RAIDBOUND — online co-op (#29): lobby codes + a lockstep relay.
   Every computer runs the same game with the same seed; the server only orders commands. */
(function (RB) {
  const U = RB.UI, H = RB.HEROES, R = RB.RAIDS;
  const { $, $$, esc } = U;
  const save = U.save;
  RB.NET_URL = RB.NET_URL || 'wss://raidbound-lobby.onrender.com';
  const HTTP_URL = () => RB.NET_URL.replace(/^ws/, 'http');
  const S = { ws: null, id: null, code: null, lobby: null, status: '', err: '', name: '', mySeat: { hero: 'aldric', deckMode: 'starter' }, net: null, computing: false };
  try { const k = JSON.parse(sessionStorage.getItem('raidbound.online') || 'null'); if (k) { S.id = k.id; S.code = k.code; } } catch (e) { }
  const remember = () => { try { sessionStorage.setItem('raidbound.online', JSON.stringify({ id: S.id, code: S.code })); } catch (e) { } };
  const forget = () => { try { sessionStorage.removeItem('raidbound.online'); } catch (e) { } S.id = null; S.code = null; };
  S.name = save.netName || 'Adventurer';

  /* ---------- connection ---------- */
  function connect(first) {
    return new Promise((resolve, reject) => {
      // #64: a socket left open by an earlier attempt must still carry this request
      if (S.ws && S.ws.readyState === 1) { S.ws.send(JSON.stringify(first)); return resolve(); }
      setStatus('Waking the game server… (the free server naps when nobody is playing; this can take up to a minute)');
      // a plain web request wakes a sleeping free server faster than a socket attempt
      try { fetch(HTTP_URL(), { mode: 'no-cors' }).catch(() => { }); } catch (e) { }
      let tries = 0;
      const open = () => {
        const ws = new WebSocket(RB.NET_URL);
        let opened = false;
        ws.onopen = () => { opened = true; S.ws = ws; setStatus(''); ws.send(JSON.stringify(first)); resolve(); };
        ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } onMsg(m); };
        ws.onclose = () => {
          if (S.ws === ws) S.ws = null;
          if (!opened) { if (++tries < 14) return setTimeout(open, 5000); setStatus(''); return reject(new Error('Could not reach the game server. Check your internet and try again.')); }
          if (S.net && !S.net.closed) { U.toast('Connection lost — reconnecting…'); setTimeout(() => connect({ t: 'join', code: S.code, id: S.id }).catch(() => U.toast('Could not reconnect. Your hero is now played by the AI.')), 2000); }
        };
      };
      open();
    });
  }
  const sendRaw = m => { if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify(m)); };
  setInterval(() => sendRaw({ t: 'ping' }), 25000); // keeps the free server awake during a raid
  function setStatus(t) { S.status = t; const el = $('#online .netstatus'); if (el) el.textContent = t; }

  function onMsg(m) {
    if (m.t === 'welcome') { S.id = m.id; S.code = m.code; S.rejoining = !!m.rejoin; S.autoJoin = false; remember(); if (S.wantMode && !m.rejoin) { const w = S.wantMode; S.wantMode = null; sendRaw({ t: 'settings', mode: 'dungeon', raid: w.id, diff: w.diff }); } return; }
    if (m.t === 'error') {
      if (/No raid with that code/.test(m.why)) { forget(); S.lobby = null; if (S.autoJoin) { S.autoJoin = false; S.err = ''; U.toast('Your last online party has closed. Create or join a new one.'); return draw(); } }
      S.err = m.why; U.toast(m.why); if (/removed you/.test(m.why)) { forget(); S.lobby = null; } return draw();
    }
    if (m.t === 'lobby') {
      const key = m.mode + '|' + m.raid + '|' + m.players.length, prevMode = S.lobby && S.lobby.mode, changed = S.lobbyKey && S.lobbyKey !== key && !m.started;
      S.lobbyKey = key; S.lobby = m;
      const modeChanged = prevMode && prevMode !== m.mode;
      if (changed && (S.mySeat.deckMode === 'auto' || m.mode === 'dungeon' || modeChanged)) sendSeat(); // auto and dungeon decks depend on the raid, mode and party size
      if (modeChanged && m.host === S.id) m.players.filter(x => x.bot).forEach(b => sendRaw({ t: 'botset', id: b.id, hero: b.hero, deck: botDeck(b.hero, m) }));
      if (S.net && S.net.over && !m.started) { S.net = null; if (!$('#online').classList.contains('hidden')) draw(); }
      if (!S.net) draw(); return;
    }
    if (m.t === 'start') return startGame(m.cfg);
    if (m.t === 'cmd') { if (S.net) S.net.push(m); return; }
    if (m.t === 'caughtup') { if (S.net) S.net.catchUp(m.seq); return; }
  }

  /* ---------- the link handed to the battle screen ---------- */
  function makeNet(cfg) {
    const queue = [], waiters = [];
    let applied = 0, upTo = -1, handlers = null, started = false, waitEl = null, pumping = false, lastSeq = -1;
    const net = {
      id: S.id, closed: false, replaying: false,
      mine: idx => cfg.party[idx] && cfg.party[idx].owner === S.id,
      send: c => sendRaw({ t: 'cmd', c }),
      push(m) {
        if (m.seq <= lastSeq) return; // already have it (rejoin replay)
        lastSeq = m.seq;
        // #70: speed changes are for everyone and don't touch the game, so they apply at once
        if (m.c.t === 'speed') { const v = +m.c.v; if (v > 0 && v <= 1) { cfg.speed = v; if (handlers && handlers.speed) handlers.speed(v); } applied++; check(); return; }
        queue.push(m);
        if (waiters.length) waiters.shift()(queue.shift());
        else pump();
      },
      next() { return new Promise(res => { if (queue.length) { applied++; res(queue.shift()); } else waiters.push(m => { applied++; res(m); }); }); },
      catchUp(seq) { upTo = seq; check(); },
      behind: () => queue.length > 0,
      attach(h) { handlers = h; },
      ready() { started = true; pump(); },
      wait(text) {
        if (!text) { if (waitEl) waitEl.remove(); waitEl = null; return; }
        if (!waitEl) { waitEl = document.createElement('div'); waitEl.className = 'netwait'; document.body.appendChild(waitEl); }
        waitEl.innerHTML = text;
      },
      leave() { net.closed = true; S.net = null; forget(); try { S.ws && S.ws.close(); } catch (e) { } },
    };
    function check() { if (net.replaying && upTo >= 0 && applied >= upTo) { net.replaying = false; U.toast('You\'re back in the raid.'); } }
    async function pump() {
      if (pumping || !started || !handlers) return;
      pumping = true;
      while (queue.length && !waiters.length) {
        const m = await net.next();
        if (m.c.t === 'ans') { check(); continue; } // stray answer (already handled)
        await handlers.apply(m.c, m.from === S.id);
        check();
      }
      pumping = false;
      check();
    }
    return net;
  }

  function startGame(cfg) {
    // every computer builds the identical game from this config
    cfg.party.forEach(s => { s.deck = s.deck.map(id => ({ id, holo: false })); });
    cfg.settings = { autoDefend: true, pauseForInstants: true };
    if (S.net) S.net.closed = true;
    if (S.lobby) S.lobby.started = true; // so the host reopens the lobby after this run
    S.net = makeNet(cfg);
    if (S.rejoining) S.net.replaying = true;
    S.rejoining = false;
    U.battle(cfg, S.net);
  }

  /* ---------- screens ---------- */
  U.online = function (opts) {
    opts = opts || {};
    if (opts.join) S.joinCode = opts.join;
    if (opts.dungeon) S.wantMode = opts.dungeon;
    // back from a finished run: drop the old game; the host opens the lobby for the next one
    if (S.net && (S.net.closed || S.net.over || (U.currentGame && U.currentGame.g.over))) { S.net.closed = true; S.net = null; if (S.lobby && S.lobby.started && S.lobby.host === S.id) sendRaw({ t: 'reopen' }); }
    S.err = '';
    draw();
    // came back to an open lobby?
    if (!S.ws && S.code && S.id && !S.lobby) { S.autoJoin = true; connect({ t: 'join', code: S.code, id: S.id }).catch(e => { S.autoJoin = false; forget(); S.err = e.message; draw(); }); }
  };
  const isDungeon = L => L && L.mode === 'dungeon';
  const myDungeonLevel = () => RB.dungeonLevel(save.dxp || 0);
  function botDeck(hid, L) { return isDungeon(L) ? RB.dungeonDeck(hid, null, 0) : RB.buildDeck(hid, null, L.players.length); }
  function heroesOpen() { return Object.values(H).filter(h => U.heroOpen(h.id)); }
  function draw() {
    if (S.net) return;
    const L = S.lobby;
    let body;
    if (!L) {
      body = `<p class="lede">Play together with friends on their own computers or phones. One of you creates a party and shares the code; everyone else types it in. Each player controls their own hero. Raids take up to 4 heroes, dungeons up to 3 — and the host can fill empty seats with AI heroes.</p>${S.wantMode ? `<p class="newvault">You'll host a <b>dungeon run</b>: ${esc(RB.DUNGEONS[S.wantMode.id].name)} on ${esc(RB.DUNGEON_MODES[S.wantMode.diff].name)}. You can change it in the lobby.</p>` : ''}
        <div class="netform"><label>Your name <input id="netname" maxlength="24" value="${esc(S.name)}"></label></div>
        <div class="netcols"><div class="netbox"><h3 class="sec">Host a game</h3><p>Get a code to share with your friends. You choose a raid or a dungeon in the lobby.</p><button class="btn primary" data-act="create">Create a party</button></div>
        <div class="netbox"><h3 class="sec">Join a game</h3><p>Type the code your friend shared.</p><input id="netcode" class="codein" maxlength="5" placeholder="ABCDE" value="${esc(S.joinCode || '')}"><button class="btn primary" data-act="join">Join</button></div></div>`;
    } else {
      const me = L.players.find(p => p.id === S.id) || {}, host = L.host === S.id;
      const link = location.protocol.startsWith('http') ? `${location.origin}${location.pathname}?join=${L.code}` : '';
      const rows = L.players.map(p => { const h = H[p.hero] || H.aldric;
        const botPick = p.bot && host ? `<select class="botpick" data-bot="${p.id}" aria-label="AI hero">${heroesOpen().map(x => `<option value="${x.id}" ${x.id === p.hero ? 'selected' : ''}>${esc(x.name)} · ${RB.CLASSES[x.cls].name}</option>`).join('')}</select>` : '';
        return `<div class="netp ${p.id === S.id ? 'me' : ''} ${p.bot ? 'bot' : ''}"><img alt="" src="${U.cardArt(h.id)}"><div><b>${esc(p.name)}${p.bot ? ' <span class="chip">AI</span>' : ''}${p.id === L.host ? ' <span class="chip">Host</span>' : ''}${p.id === S.id ? ' <span class="chip ok">You</span>' : ''}</b><div class="sub">${esc(h.name)} · ${RB.CLASSES[h.cls].name} · ${p.bot ? 'Starter deck · played by the AI' : p.deckMode === 'auto' ? 'Auto deck' : p.deckMode === 'custom' ? 'Own deck' : 'Starter deck'}</div>${botPick}<div class="sub">${p.ready ? '<span style="color:var(--verd-hi)">Ready</span>' : 'Choosing…'}${p.online || p.bot ? '' : ' · offline'}</div></div>${host && p.id !== S.id ? `<button class="btn small ghost" data-kick="${p.id}">Remove</button>` : ''}</div>`; }).join('')
        + (host && L.players.length < (L.max || 4) ? `<button class="addseat small" data-act="addbot">+ Add an AI hero to an empty seat</button>` : '');
      const pick = heroesOpen().map(h => `<button class="${h.id === S.mySeat.hero ? 'on' : ''}" data-hero="${h.id}" title="${esc(h.name)}"><img alt="" src="${U.cardArt(h.id)}"><span>${esc(h.name.replace(/^Ser /, '').split(' ')[0])} · ${RB.CLASSES[h.cls].name}</span></button>`).join('');
      const D = isDungeon(L), dis = host ? '' : 'disabled';
      const raids = (D ? Object.values(RB.DUNGEONS) : Object.values(R)).map(r => `<button class="btn small ${L.raid === r.id ? '' : 'ghost'}" data-raid="${r.id}" ${dis}>${esc(D ? r.name : r.short)}</button>`).join('');
      const diffs = D ? Object.entries(RB.DUNGEON_MODES).map(([k, mm]) => `<button class="btn small ${L.diff === k ? '' : 'ghost'}" data-diff="${k}" ${dis} title="${esc(mm.text)}">${mm.name}</button>`).join('')
        : `<button class="btn small ${L.diff === 'normal' ? '' : 'ghost'}" data-diff="normal" ${dis}>Normal</button><button class="btn small ${L.diff === 'heroic' ? '' : 'ghost'}" data-diff="heroic" ${dis}>Heroic</button>`;
      const dd = D && RB.DUNGEONS[L.raid], dm = D && (RB.DUNGEON_MODES[L.diff] || RB.DUNGEON_MODES.novice);
      const scale = D && dd ? `<div class="bossscale"><b>${esc(dd.short)} for ${L.players.length} hero${L.players.length > 1 ? 'es' : ''}:</b> ${dd.hp + dd.hpPer * (L.players.length - 1)} health · starts at level ${dm.level} · ${dm.first ? 'goes first' : 'you go first'}</div>` : U.bossScale(L.raid, L.players.length, L.diff);
      const modeSeg = `<div class="filters"><span class="seg"><button class="${D ? '' : 'on'}" data-mode="raid" ${dis}>Raid</button><button class="${D ? 'on' : ''}" data-mode="dungeon" ${dis || (L.players.length > 3 ? 'disabled title="Dungeons take up to 3 heroes"' : '')}>Dungeon</button></span></div>`;
      const allReady = L.players.every(p => p.ready);
      const what = D ? 'dungeon run' : 'raid';
      body = `<div class="codebar"><div><div class="sub">Party code</div><div class="bigcode">${L.code}</div></div><button class="btn" data-act="copy">Copy code</button>${link ? `<button class="btn ghost" data-act="copylink">Copy invite link</button>` : ''}<span class="sp"></span><button class="btn ghost small" data-act="leave">Leave lobby</button></div>
        <p class="lede">Send the code to your friends. When everyone has picked a hero, the host starts the ${what}.</p>
        ${L.started ? `<p class="newvault">The last run has finished. ${host ? 'Opening the lobby for the next one…' : 'Waiting for the host to open the lobby again.'}</p>` : ''}
        <div class="netcols"><div><h3 class="sec">Party (${L.players.length}/${L.max || 4})</h3><div class="netplayers">${rows}</div>
          <h3 class="sec">What to play</h3>${modeSeg}<div class="filters">${raids}</div><div class="filters">${diffs}</div>${scale}
          ${host ? `<button class="btn primary" data-act="start" ${allReady && !L.started ? '' : 'disabled'}>${allReady ? `Start the ${what}` : 'Waiting for everyone to be ready…'}</button>` : `<p class="sub">Waiting for the host to start the ${what}.</p>`}</div>
        <div><h3 class="sec">Your hero</h3><div class="heropick">${pick}</div>
          ${D ? `<p class="sub" style="margin-top:.6rem">Dungeon deck: the starter deck plus <b>${RB.dungeonSwaps(myDungeonLevel())}</b> of your own best cards (your dungeon level is ${myDungeonLevel()}).</p>` : `<div class="opts" style="margin-top:.6rem"><span class="seg"><button class="${S.mySeat.deckMode === 'starter' ? 'on' : ''}" data-deck="starter">Starter deck</button><button class="${S.mySeat.deckMode === 'auto' ? 'on' : ''}" data-deck="auto">Auto deck</button><button class="${S.mySeat.deckMode === 'custom' ? 'on' : ''}" data-deck="custom">My deck</button></span></div>`}
          <p class="sub">${S.computing ? 'Building your deck…' : me.ready ? 'Your deck is locked in. Change it any time before the start.' : ''}</p></div></div>`;
    }
    const el = U.show('online', `<div class="page"><div class="pagehead"><button class="btn ghost small" data-act="back">← Title</button><h2>Play online</h2><span class="sp"></span></div>
      ${body}<p class="netstatus">${esc(S.status)}</p>${S.err ? `<p class="neterr">${esc(S.err)}</p>` : ''}
      <p class="sub" style="margin-top:2rem">Good to know: the online server runs on a free plan, so the first connection of the day can take up to a minute. If a friend drops out mid-raid, the AI plays their hero until they come back with the same code.</p></div>`, true);
    el.onclick = onClick;
    el.onchange = e => { const sel = e.target.closest('.botpick'); if (!sel) return; const hid = sel.value; sendRaw({ t: 'botset', id: sel.dataset.bot, hero: hid, name: 'AI ' + H[hid].name.replace(/^Ser /, '').split(' ')[0], deck: botDeck(hid, S.lobby) }); };
  }
  async function sendSeat() {
    const L = S.lobby; if (!L) return;
    const hid = S.mySeat.hero, n = Math.max(1, L.players.length);
    let deck;
    if (isDungeon(L)) deck = RB.dungeonDeck(hid, save.owned, RB.dungeonSwaps(myDungeonLevel()));
    else if (S.mySeat.deckMode === 'auto') { S.computing = true; draw(); deck = await U.autoDeckFor(hid, L.raid, n); S.computing = false; }
    else if (S.mySeat.deckMode === 'custom' && save.decks[hid] && save.decks[hid].length === RB.DECK_SIZE) deck = save.decks[hid].slice();
    else deck = RB.buildDeck(hid, save.owned, n);
    sendRaw({ t: 'seat', hero: hid, deckMode: S.mySeat.deckMode, deck, pet: save.sel.pet || null, name: S.name });
  }
  async function onClick(e) {
    const t = e.target, a = t.closest('[data-act]');
    const nameIn = $('#netname'); if (nameIn) { S.name = nameIn.value.trim() || 'Adventurer'; save.netName = S.name; U.persist(); }
    const hb = t.closest('[data-hero]'); if (hb) { S.mySeat.hero = hb.dataset.hero; draw(); return sendSeat(); }
    const db = t.closest('[data-deck]'); if (db) { S.mySeat.deckMode = db.dataset.deck; draw(); return sendSeat(); }
    const mb = t.closest('[data-mode]'); if (mb && S.lobby && S.lobby.host === S.id) { const toD = mb.dataset.mode === 'dungeon'; if (toD === isDungeon(S.lobby)) return; return sendRaw(toD ? { t: 'settings', mode: 'dungeon', raid: (U.dungeonState && U.dungeonState.id) || 'thornwood', diff: (U.dungeonState && U.dungeonState.mode) || 'novice' } : { t: 'settings', mode: 'raid', raid: 'crypt', diff: 'normal' }); }
    const rb = t.closest('[data-raid]'); if (rb) { sendRaw({ t: 'settings', raid: rb.dataset.raid }); setTimeout(sendSeat, 300); return; }
    const df = t.closest('[data-diff]'); if (df) return sendRaw({ t: 'settings', diff: df.dataset.diff });
    const kb = t.closest('[data-kick]'); if (kb) return sendRaw({ t: 'kick', id: kb.dataset.kick });
    if (!a) return;
    switch (a.dataset.act) {
      case 'back': return U.title();
      case 'create': S.err = ''; forget(); try { await connect({ t: 'create', name: S.name, hero: S.mySeat.hero }); setTimeout(sendSeat, 600); } catch (x) { S.err = x.message; draw(); } return;
      case 'join': {
        const code = ($('#netcode').value || '').toUpperCase().trim(); if (code.length !== 5) return U.toast('Raid codes have 5 letters.');
        S.err = ''; forget(); S.joinCode = code;
        try { await connect({ t: 'join', code, name: S.name, hero: S.mySeat.hero }); setTimeout(sendSeat, 600); } catch (x) { S.err = x.message; draw(); } return;
      }
      case 'copy': try { await navigator.clipboard.writeText(S.lobby.code); U.toast('Code copied — paste it to your friends.'); } catch (x) { U.toast('Your code is ' + S.lobby.code); } return;
      case 'copylink': try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}?join=${S.lobby.code}`); U.toast('Invite link copied.'); } catch (x) { U.toast('Could not copy the link.'); } return;
      case 'leave': S.lobby = null; forget(); try { S.ws && S.ws.close(); } catch (x) { } S.ws = null; return draw();
      case 'start': return sendRaw({ t: 'start', speed: save.settings.speed || 1 });
      case 'addbot': {
        const L = S.lobby, used = L.players.map(p => p.hero);
        const hid = (heroesOpen().find(h => !used.includes(h.id)) || H.aldric).id;
        return sendRaw({ t: 'addbot', hero: hid, name: 'AI ' + H[hid].name.replace(/^Ser /, '').split(' ')[0], deck: isDungeon(L) ? RB.dungeonDeck(hid, null, 0) : RB.buildDeck(hid, null, L.players.length + 1) });
      }
    }
  }
  // invite links: ...?join=ABCDE opens the online screen with the code filled in
  if (typeof location !== 'undefined') { const m = /[?&]join=([A-Za-z0-9]{5})/.exec(location.search); if (m) setTimeout(() => U.online({ join: m[1].toUpperCase() }), 400); }
})(globalThis.RB);
