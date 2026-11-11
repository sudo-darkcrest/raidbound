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

  function onMsg(m) { onMsg0(m); chatSync(); }
  function onMsg0(m) {
    if (m.t === 'chat') return chatIn(m);
    if (m.t === 'chatlog') { CH.log = Array.isArray(m.log) ? m.log.slice(-CHAT_KEEP) : []; CH.lastN = CH.log.reduce((a, x) => Math.max(a, x.n || 0), 0); CH.dirty = true; return; }
    if (m.t === 'chatslow') return U.toast('Slow down a little: too many messages at once.');
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


  /* ---------- party chat (#123): quick phrases plus free typing, in the lobby and during the fight ----------
     Chat lines travel beside the game's commands, never inside them, so they can't disturb the lockstep.
     Everything is shown as plain text. Muting is per player and only on this computer. */
  const CHAT_KEEP = 50, CHAT_LEN = 200;
  const QUICK = {
    lobby: ['Hello!', 'Ready when you are', 'One moment…', 'Which raid?', 'Good luck!', 'Good game'],
    battle: ['Heal me!', 'I\'ll take the hit', 'Save your Instants', 'Focus the boss', 'Clear the minions', 'Step into the circle!', 'Nice one!', 'Good game'],
  };
  const NAMECOL = ['#ffd27a', '#9ae8ff', '#b8f0a0', '#f3a9e6'];
  const CH = { log: [], lastN: 0, open: false, unread: 0, muted: new Set(), el: null, code: null, dirty: false, peekT: 0, mode: '' };
  const chatOn = () => !!(S.lobby && S.code && S.id);
  const others = () => (S.lobby ? S.lobby.players : []).filter(p => !p.bot && p.id !== S.id);
  const nameCol = id => { const i = (S.lobby ? S.lobby.players : []).findIndex(p => p.id === id); return NAMECOL[(i < 0 ? 0 : i) % NAMECOL.length]; };
  function chatIn(m) {
    if (m.n && m.n <= CH.lastN) return; // already have it
    if (m.n) CH.lastN = m.n;
    CH.log.push(m); if (CH.log.length > CHAT_KEEP) CH.log.shift();
    CH.dirty = true;
    if (m.id === S.id || CH.muted.has(m.id)) return;
    if (!CH.open) { CH.unread++; CH.peek = m; }
    if (U.sfx && U.sfx.chat) U.sfx.chat();
  }
  function chatSend(text, quick) {
    text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, CHAT_LEN);
    if (!text) return;
    if (!S.ws || S.ws.readyState !== 1) return U.toast('Not connected right now. Your message was not sent.');
    sendRaw(quick ? { t: 'chat', text, q: 1 } : { t: 'chat', text });
  }
  function chatDock() {
    if (CH.el) return CH.el;
    const d = CH.el = document.createElement('div'); d.id = 'chatdock'; d.className = 'chatdock';
    d.innerHTML = `<button type="button" class="chatpeek" hidden></button>
      <button type="button" class="chatfab" aria-expanded="false" aria-controls="chatpanel" title="Party chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2h-7l-5 4v-4H4a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg><span class="chatlabel">Chat</span><span class="chatdot" hidden></span></button>
      <section class="chatpanel" id="chatpanel" aria-label="Party chat" hidden>
        <header class="chathead"><b>Party chat</b><button type="button" class="chatx" aria-label="Close chat">✕</button></header>
        <div class="chatmute" hidden></div>
        <div class="chatlist" role="log" aria-live="polite"></div>
        <div class="chatquick"></div>
        <form class="chatform" autocomplete="off"><input class="chatin" maxlength="${CHAT_LEN}" placeholder="Say something…" aria-label="Message" enterkeyhint="send"><button class="btn small" type="submit">Send</button></form>
      </section>`;
    const q = sel => d.querySelector(sel);
    const setOpen = CH.setOpen = v => { CH.open = v; if (v) { CH.unread = 0; CH.peek = null; } CH.dirty = true; chatSync(); if (v) { const l = q('.chatlist'); l.scrollTop = l.scrollHeight; if (matchMedia('(hover: hover)').matches) q('.chatin').focus(); } };
    q('.chatfab').onclick = () => setOpen(!CH.open);
    q('.chatpeek').onclick = () => setOpen(true);
    q('.chatx').onclick = () => setOpen(false);
    q('.chatform').onsubmit = e => { e.preventDefault(); const i = q('.chatin'); chatSend(i.value); i.value = ''; };
    q('.chatquick').onclick = e => { const b = e.target.closest('button'); if (b) chatSend(b.textContent, true); };
    q('.chatmute').onclick = e => { const b = e.target.closest('[data-mute]'); if (!b) return; const id = b.dataset.mute; if (CH.muted.has(id)) CH.muted.delete(id); else CH.muted.add(id); CH.dirty = true; chatSync(); };
    // typing must never reach the game's own keys; Escape closes the panel
    d.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape' && CH.open) { setOpen(false); const b = $('#battle .chatbtn'); (b && b.offsetParent ? b : q('.chatfab')).focus(); } });
    document.body.appendChild(d);
    return d;
  }
  function chatSync() {
    if (!chatOn()) { if (CH.el) { CH.el.remove(); CH.el = null; } CH.open = false; CH.unread = 0; CH.peek = null; if (!S.code) { CH.log = []; CH.lastN = 0; CH.code = null; CH.muted.clear(); } return; }
    if (CH.code !== S.code) { if (CH.code) { CH.log = []; CH.lastN = 0; CH.muted.clear(); } CH.code = S.code; CH.dirty = true; }
    const d = chatDock(), q = sel => d.querySelector(sel);
    const mode = S.net ? 'battle' : 'lobby';
    d.classList.toggle('inbattle', !!S.net); d.classList.toggle('open', CH.open);
    q('.chatpanel').hidden = !CH.open; q('.chatfab').setAttribute('aria-expanded', CH.open ? 'true' : 'false');
    const dot = q('.chatdot'); dot.hidden = !CH.unread; dot.textContent = CH.unread > 9 ? '9+' : CH.unread || '';
    // without the side column (tablets, phones) the fight's top bar carries the chat button; the panel hangs below it
    const tb = S.net && $('#battle .chatbtn');
    if (tb) { const td = tb.querySelector('.chatdot'); td.hidden = !CH.unread; td.textContent = dot.textContent; tb.setAttribute('aria-expanded', CH.open ? 'true' : 'false'); if (tb.offsetParent) d.style.setProperty('--chattop', Math.round((tb.closest('.topbar') || tb).getBoundingClientRect().bottom + 6) + 'px'); }
    q('.chatfab').setAttribute('aria-label', CH.unread ? `Party chat, ${CH.unread} new` : 'Party chat');
    if (CH.mode !== mode || !q('.chatquick').firstChild) { CH.mode = mode; q('.chatquick').innerHTML = QUICK[mode].map(t => `<button type="button">${esc(t)}</button>`).join(''); }
    // who can be muted: the other people in the party
    const ppl = others(), mk = ppl.map(p => p.id + (CH.muted.has(p.id) ? '!' : '') + p.name).join('|');
    if (CH.muteKey !== mk) { CH.muteKey = mk; const mu = q('.chatmute'); mu.hidden = !ppl.length; mu.innerHTML = ppl.length ? '<span>Mute:</span>' + ppl.map(p => `<button type="button" data-mute="${esc(p.id)}" aria-pressed="${CH.muted.has(p.id)}" class="${CH.muted.has(p.id) ? 'on' : ''}" title="${CH.muted.has(p.id) ? 'Muted. Click to hear them again' : 'Hide this player\'s messages'}">${CH.muted.has(p.id) ? '🔇' : '🔈'} ${esc(p.name)}</button>`).join('') : ''; }
    if (CH.dirty) {
      CH.dirty = false;
      const l = q('.chatlist'), stick = l.scrollHeight - l.scrollTop - l.clientHeight < 40;
      const shown = CH.log.filter(m => !CH.muted.has(m.id));
      l.innerHTML = shown.length ? shown.map(m => `<p class="chatline${m.id === S.id ? ' me' : ''}${m.q ? ' q' : ''}"><b style="color:${nameCol(m.id)}">${esc(m.from || 'Hero')}</b> <span>${esc(m.text)}</span></p>`).join('')
        : `<p class="chatempty">No messages yet. Tap a quick phrase or type below. ${ppl.length ? '' : 'Your friends will see it once they join.'}</p>`;
      if (stick || CH.open) l.scrollTop = l.scrollHeight;
    }
    // a closed chat shows the newest line for a few seconds
    const pk = q('.chatpeek');
    if (CH.peek && !CH.open) { const m = CH.peek; CH.peek = null; pk.innerHTML = `<b style="color:${nameCol(m.id)}">${esc(m.from || 'Hero')}</b> ${esc(m.text)}`; pk.hidden = false; clearTimeout(CH.peekT); CH.peekT = setTimeout(() => { pk.hidden = true; }, 6000); }
    else if (CH.open) { pk.hidden = true; clearTimeout(CH.peekT); }
  }
  U.chatState = () => CH; // for tests
  U.chatToggle = () => { if (!chatOn()) return; chatDock(); CH.setOpen(!CH.open); };
  U.chatBtnHTML = () => `<button class="btn small ghost narrow-only chatbtn" data-act="chat" aria-label="Party chat" aria-expanded="${CH.open ? 'true' : 'false'}">💬<span class="chatdot" ${CH.unread ? '' : 'hidden'}>${CH.unread > 9 ? '9+' : CH.unread || ''}</span></button>`;
  if (typeof window !== 'undefined') window.addEventListener('resize', () => { if (CH.el) chatSync(); });

  /* ---------- the link handed to the battle screen ---------- */
  function makeNet(cfg) {
    const queue = [], waiters = [], liveWaiters = [];
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
        if (liveWaiters.length) liveWaiters.splice(0).forEach(r => r(false)); // #127: another replayed command is here
        if (waiters.length) waiters.shift()(queue.shift());
        else pump();
      },
      next() { return new Promise(res => { if (queue.length) { applied++; res(queue.shift()); } else waiters.push(m => { applied++; res(m); }); }); },
      catchUp(seq) { upTo = seq; check(); if (liveWaiters.length && net.live()) liveWaiters.splice(0).forEach(r => r(true)); },
      // #127: after a reconnect the log is replayed. 'live' = the replay has caught up and nothing is left to replay
      live() { if (net.replaying && upTo >= 0 && applied >= upTo && !queue.length) { net.replaying = false; U.toast('You\'re back in the raid.'); } return !net.replaying; },
      // true once live, false as soon as another replayed command is waiting (it may be the answer we're looking for)
      liveOrQueued() { return new Promise(res => { if (net.live()) return res(true); if (queue.length) return res(false); liveWaiters.push(res); }); },
      behind: () => queue.length > 2, // #123: a command or two waiting is normal; only hurry when really behind
      attach(h) { handlers = h; },
      ready() { started = true; pump(); },
      wait(text) {
        if (!text) { if (waitEl) waitEl.remove(); waitEl = null; return; }
        if (!waitEl) { waitEl = document.createElement('div'); waitEl.className = 'netwait'; document.body.appendChild(waitEl); }
        waitEl.innerHTML = text;
      },
      leave() { net.closed = true; S.net = null; forget(); try { S.ws && S.ws.close(); } catch (e) { } chatSync(); },
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
    chatSync();
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
    chatSync();
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
        : `<button class="btn small ${L.diff === 'normal' ? '' : 'ghost'}" data-diff="normal" ${dis}>Normal</button><button class="btn small ${L.diff === 'heroic' ? '' : 'ghost'}" data-diff="heroic" ${dis}>Heroic</button><button class="btn small ${L.diff === 'mythic' ? '' : 'ghost'}" data-diff="mythic" ${host && U.mythicOpen(L.raid) ? '' : 'disabled'} title="${U.mythicOpen(L.raid) || !host ? 'The hardest way to raid' : 'Beat this raid on Heroic to unlock Mythic'}">Mythic</button>`;
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
    const el = U.show('online', `<div class="page"><div class="pagehead"><h2>Play online</h2><span class="sp"></span></div>
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
    sendRaw({ t: 'seat', hero: hid, deckMode: S.mySeat.deckMode, deck, lands: RB.landsFor(hid, save.lands[hid]), pet: (save.sel.pet && U.ownsCos(save.sel.pet)) ? save.sel.pet : null, name: S.name });
  }
  async function onClick(e) {
    const t = e.target, a = t.closest('[data-act]');
    const nameIn = $('#netname'); if (nameIn) { S.name = nameIn.value.trim() || 'Adventurer'; save.netName = S.name; U.persist(); }
    const hb = t.closest('[data-hero]'); if (hb) { S.mySeat.hero = hb.dataset.hero; draw(); return sendSeat(); }
    const db = t.closest('[data-deck]'); if (db) { S.mySeat.deckMode = db.dataset.deck; draw(); return sendSeat(); }
    const mb = t.closest('[data-mode]'); if (mb && S.lobby && S.lobby.host === S.id) { const toD = mb.dataset.mode === 'dungeon'; if (toD === isDungeon(S.lobby)) return; return sendRaw(toD ? { t: 'settings', mode: 'dungeon', raid: (U.dungeonState && U.dungeonState.id) || 'thornwood', diff: (U.dungeonState && U.dungeonState.mode) || 'novice' } : { t: 'settings', mode: 'raid', raid: 'crypt', diff: 'normal' }); }
    const rb = t.closest('[data-raid]'); if (rb) { const L0 = S.lobby || {}; sendRaw(Object.assign({ t: 'settings', raid: rb.dataset.raid }, !isDungeon(L0) && L0.diff === 'mythic' && !U.mythicOpen(rb.dataset.raid) ? { diff: 'heroic' } : {})); setTimeout(sendSeat, 300); return; }
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
