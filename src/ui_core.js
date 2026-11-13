/* RAIDBOUND — UI core: persistence, card rendering, icons, sound, small widgets */
(function (RB) {
  const U = RB.UI = {};
  const C = RB.CARDS, A = RB.ART;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  U.$ = $; U.$$ = $$; U.esc = esc;

  /* ---------- persistence (per-browser; safe if storage is unavailable) ---------- */
  const KEY = 'raidbound.save.v1';
  const fresh = () => ({ owned: {}, holo: {}, loot: [], cos: [], sel: { back: '', board: '', pet: '' }, decks: {}, wins: {}, heroicWins: {}, mythicWins: {}, gold: 0, heroes: [], settings: { speed: 1, sound: true, music: true, sfxVol: 0.8, musicVol: 0.5, autoDefend: true, pauseForInstants: true }, seen: false });
  let save = fresh(), hadSave = false;
  try { const raw = localStorage.getItem(KEY); if (raw) { save = Object.assign(fresh(), JSON.parse(raw)); hadSave = true; } } catch (e) { }
  // Starting collection (Nov 8, 2026): a new player owns just the cards in each starting hero's starter deck, and gets
  // two free Raidbound Core booster packs. Saves from before this change were given two of every core card, and keep them.
  if (!save.econ) {
    if (hadSave) {
      for (const d of Object.values(C)) if (d.set === 'core' && !(save.owned[d.id] >= 2)) save.owned[d.id] = Math.max(save.owned[d.id] || 0, 2);
    } else {
      save.freeCore = 2;
    }
    save.econ = 2;
  }
  // #125: lands are free. Everyone always owns two of each, and a hero's own pick of ten lives in save.lands[hero].
  for (const k of RB.LANDS || []) if (!(save.owned[k] >= 2)) save.owned[k] = 2;
  save.lands = save.lands || {};
  // every hero you can play (the six starting heroes, and each hero once unlocked) brings the cards of their starter deck
  U.syncStarters = () => {
    save.starterGot = save.starterGot || [];
    let changed = false;
    for (const hid of Object.keys(RB.HEROES)) {
      if (save.starterGot.includes(hid) || !RB.heroUnlocked(hid, save)) continue;
      for (const [id, k] of Object.entries(RB.STARTER[hid] || {})) if (C[id] && (save.owned[id] || 0) < k) save.owned[id] = k;
      for (const id of RB.defaultLands(hid)) if (C[id].type !== 'land' && !(save.owned[id] > 0)) save.owned[id] = 1; // the hero's starter quests and locations
      save.starterGot.push(hid); changed = true;
    }
    // #151: starter decks grew by 10 cards; heroes you already have get those cards too (once)
    if ((save.starterV || 0) < 2) {
      for (const hid of save.starterGot) { if (!RB.STARTER[hid]) continue; for (const [id, k] of Object.entries(RB.STARTER[hid])) if (C[id] && (save.owned[id] || 0) < k) save.owned[id] = k; }
      save.starterV = 2; changed = true;
    }
    return changed;
  };
  U.syncStarters();
  U.save = save;
  // #57: saved decks that held a retired Master Hero card get that hero's Ascended card instead
  if (RB.fixDeck) for (const [hid, ids] of Object.entries(save.decks || {})) if (Array.isArray(ids)) save.decks[hid] = RB.fixDeck(hid, ids);
  // Saved decks follow the deck rules as they change (save.deckV):
  //  - quests and locations moved out of the normal cards into the ten resource slots, shared with lands (Nov 10, 2026)
  //  - #151: decks grew from 30 to 40 normal cards (Nov 10, 2026); a deck that was complete gets 10 more of your best cards
  U.deckMoved = [];
  const topUp = (hid, deck) => {
    const cnt = {}; deck.forEach(id => cnt[id] = (cnt[id] || 0) + 1);
    const opts = []; for (const d of Object.values(C)) { if (RB.isResCard(d) || !RB.legalFor(hid, d)) continue; for (let k = cnt[d.id] || 0; k < Math.min(RB.maxCopies(d), save.owned[d.id] || 0); k++) opts.push({ id: d.id, s: RB.cardScore(d) - k * 0.5 }); }
    opts.sort((a, b) => b.s - a.s || (a.id < b.id ? -1 : 1));
    for (const o of opts) { if (deck.length >= RB.DECK_SIZE) break; if (C[o.id].type === 'master' && deck.some(x => C[x].type === 'master')) continue; deck.push(o.id); }
    return deck;
  };
  if ((save.deckV || 0) < 2) {
    for (const [hid, ids] of Object.entries(save.decks || {})) {
      if (!Array.isArray(ids) || !RB.HEROES[hid]) continue;
      const wasComplete = ids.length === 30, res = ids.filter(id => RB.isResCard(C[id]));
      if (res.length && !RB.landsOk(hid, save.lands[hid])) { const want = {}; save.lands[hid] = RB.landsFor(hid, null, res.filter(id => (want[id] = (want[id] || 0) + 1) <= Math.min(RB.maxCopies(C[id]), save.owned[id] || 0))); }
      const deck = ids.filter(id => !RB.isResCard(C[id]));
      save.decks[hid] = wasComplete ? topUp(hid, deck) : deck;
      if (wasComplete || res.length) U.deckMoved.push(hid);
    }
    for (const d of Array.isArray(save.deckList) ? save.deckList : []) {
      if (!RB.HEROES[d.hero] || !Array.isArray(d.cards)) continue;
      const was = d.cards.length === 30, res = d.cards.some(id => RB.isResCard(C[id]));
      if (!was && !res) continue;
      d.cards = d.cards.filter(id => !RB.isResCard(C[id])); if (was) topUp(d.hero, d.cards);
      if (!U.deckMoved.includes(d.hero)) U.deckMoved.push(d.hero);
      if ((save.deckUse || {})[d.hero] === d.id) save.decks[d.hero] = d.cards.slice(); // the deck that hero plays stays the same as its named copy
    }
    save.deckV = 2; save.autoDecks = {};
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { }
  }
  U.persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { } };
  U.persist();
  if (!save.heroicWins) save.heroicWins = {};
  if (!save.mythicWins) save.mythicWins = {};
  if (typeof save.gold !== 'number') save.gold = 0;
  if (!Array.isArray(save.heroes)) save.heroes = [];
  U.heroOpen = id => RB.heroUnlocked(id, save);
  const GEN = () => (RB.ART && RB.ART.GEN) || {};
  U.cosImg = id => GEN()['cos_' + id] || '';
  U.ownsCos = id => { const c = RB.COSMETICS[id]; return !!c && (c.get === 'default' || save.cos.includes(id)); };
  U.unlockText = c => {
    const [k, r] = c.get.split(':'), raid = r && RB.RAIDS[r];
    if (k === 'default') return 'Owned from the start';
    if (k === 'loot') return c.via ? 'Bonus with the ' + RB.COSMETICS[c.via].name + ' loot code' : 'Redeem its loot code from a treasure pack';
    if (k === 'win') return 'Defeat ' + raid.short + ' in ' + raid.name;
    if (k === 'heroic') return 'Defeat ' + raid.short + ' on Heroic';
    if (k === 'allraids') return 'Defeat all three raid bosses';
    if (k === 'dclear') { const d = RB.DUNGEONS && RB.DUNGEONS[r]; return `Clear the dungeon ${d ? d.name : r}`; }
    if (k === 'dlevel') return `Reach Dungeon level ${r}`;
    if (k === 'collect') { const n = +r, have = Object.values(C).filter(d => save.owned[d.id] > 0).length; return `Collect ${n} different cards (${Math.min(have, n)}/${n})`; }
    if (k === 'dlegend') return 'Clear any dungeon on Legendary';
    if (k === 'packtotal') { const n = +r, have = Object.values(save.packs || {}).reduce((a, b) => a + b, 0); return `Open ${n} booster packs of any kind (${Math.min(have, n)}/${n})`; }
    if (k === 'card') { const d = C[r], PS = d && RB.PACK_SETS && RB.PACK_SETS[d.set === 'core' ? 'core' : d.pack]; return `Get the card ${d ? d.name : r}${PS ? ` (found in ${PS.name} packs)` : ''}`; }
    if (k === 'packs') { const PS = RB.PACK_SETS && RB.PACK_SETS[r], n = +c.get.split(':')[2], have = (save.packs || {})[r] || 0; return `Open ${n} ${PS ? PS.name : ''} booster packs (${Math.min(have, n)}/${n})`; }
    return '';
  };
  // grant anything earned by playing; returns the ids that are new
  U.checkUnlocks = () => {
    const got = [];
    for (const [id, c] of Object.entries(RB.COSMETICS)) {
      if (save.cos.includes(id)) continue;
      const [k, r] = c.get.split(':');
      const ok = k === 'dclear' ? ((save.dclears || {})[r] || 0) > 0 : k === 'dlevel' ? RB.dungeonLevel(save.dxp || 0) >= +r : k === 'dlegend' ? (save.dlegend || 0) > 0 : k === 'card' ? (save.owned[r] || 0) > 0 : k === 'packtotal' ? Object.values(save.packs || {}).reduce((a, b) => a + b, 0) >= +r : k === 'collect' ? Object.values(C).filter(d => save.owned[d.id] > 0).length >= +r : k === 'packs' ? ((save.packs || {})[r] || 0) >= +c.get.split(':')[2] : k === 'win' ? (save.wins[r] || 0) > 0 : k === 'heroic' ? (save.heroicWins[r] || 0) > 0 : k === 'allraids' ? Object.keys(RB.RAIDS).every(x => (save.wins[x] || 0) > 0) : false;
      if (ok) { save.cos.push(id); got.push(id); }
    }
    if (got.length) U.persist();
    return got;
  };
  U.checkUnlocks();
  U.applyCosmetics = () => {
    const pick = k => (save.sel[k] && U.ownsCos(save.sel[k])) ? save.sel[k] : '';
    const st = document.body.style, back = U.cosImg(pick('back') || 'back_classic'), board = U.cosImg(pick('board') || 'board_classic');
    if (back) st.setProperty('--back', `url(${back}) center/cover`); else st.removeProperty('--back');
    if (board) st.setProperty('--felt', `linear-gradient(rgba(8,11,26,.62), rgba(8,11,26,.78)), url(${board}) center/cover`); else st.removeProperty('--felt');
    document.body.classList.toggle('painted-back', !!back);
    const bc = RB.COSMETICS[pick('back') || 'back_classic']; document.body.classList.toggle('special-back', !!(bc && bc.special));
  };


  /* ---------- icons ---------- */
  const IC = {
    concord: '<svg viewBox="0 0 24 24"><defs><linearGradient id="igconcordr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#c8902c"/><stop offset="1" stop-color="#6a3c08"/></linearGradient><radialGradient id="igconcordd" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#3a5ab0"/><stop offset="1" stop-color="#0e1a48"/></radialGradient></defs><circle cx="12" cy="12" r="11.6" fill="#140a04"/><circle cx="12" cy="12" r="10.8" fill="url(#igconcordr)"/><circle cx="12" cy="12" r="8.6" fill="url(#igconcordd)"/><g fill="#ffd870" stroke="#ffd870" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 .6px 0 rgba(0,0,0,.6))"><path d="M12 12L18.6 12.0" stroke-width="1.1" fill="none"/><path d="M12 12L16.7 16.7" stroke-width="1.1" fill="none"/><path d="M12 12L12.0 18.6" stroke-width="1.1" fill="none"/><path d="M12 12L7.3 16.7" stroke-width="1.1" fill="none"/><path d="M12 12L5.4 12.0" stroke-width="1.1" fill="none"/><path d="M12 12L7.3 7.3" stroke-width="1.1" fill="none"/><path d="M12 12L12.0 5.4" stroke-width="1.1" fill="none"/><path d="M12 12L16.7 7.3" stroke-width="1.1" fill="none"/><circle cx="12" cy="12" r="2.6" stroke="none"/></g><path d="M5.2 9.5A7.4 7.4 0 0 1 11 4.6" stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none"/></svg>',
    clans: '<svg viewBox="0 0 24 24"><defs><linearGradient id="igclansr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#c8902c"/><stop offset="1" stop-color="#6a3c08"/></linearGradient><radialGradient id="igclansd" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#c8401a"/><stop offset="1" stop-color="#4a0c04"/></radialGradient></defs><circle cx="12" cy="12" r="11.6" fill="#140a04"/><circle cx="12" cy="12" r="10.8" fill="url(#igclansr)"/><circle cx="12" cy="12" r="8.6" fill="url(#igclansd)"/><g fill="#fff6dc" stroke="#fff6dc" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 .6px 0 rgba(0,0,0,.6))"><path d="M7 17L17 7M17 17L7 7" stroke-width="1.8" fill="none"/><path d="M14.5 5.5l3 0l0 3zM9.5 5.5l-3 0l0 3z" stroke-width=".6"/></g><path d="M5.2 9.5A7.4 7.4 0 0 1 11 4.6" stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none"/></svg>',
    neutral: '<svg viewBox="0 0 24 24"><defs><linearGradient id="igneutralr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#c8902c"/><stop offset="1" stop-color="#6a3c08"/></linearGradient><radialGradient id="igneutrald" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#8a7450"/><stop offset="1" stop-color="#2a2010"/></radialGradient></defs><circle cx="12" cy="12" r="11.6" fill="#140a04"/><circle cx="12" cy="12" r="10.8" fill="url(#igneutralr)"/><circle cx="12" cy="12" r="8.6" fill="url(#igneutrald)"/><g fill="#f4e4c0" stroke="#f4e4c0" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 .6px 0 rgba(0,0,0,.6))"><path d="M12 5L13.4 10.6L19 12L13.4 13.4L12 19L10.6 13.4L5 12L10.6 10.6Z" stroke="none"/></g><path d="M5.2 9.5A7.4 7.4 0 0 1 11 4.6" stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none"/></svg>',
    paladin: '<svg viewBox="0 0 24 24"><defs><linearGradient id="igpaladinr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#c8902c"/><stop offset="1" stop-color="#6a3c08"/></linearGradient><radialGradient id="igpaladind" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#ffe8a0"/><stop offset="1" stop-color="#a87418"/></radialGradient></defs><circle cx="12" cy="12" r="11.6" fill="#140a04"/><circle cx="12" cy="12" r="10.8" fill="url(#igpaladinr)"/><circle cx="12" cy="12" r="8.6" fill="url(#igpaladind)"/><g fill="#4a2e08" stroke="#4a2e08" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 .6px 0 rgba(0,0,0,.6))"><path d="M8.5 6.5h7v4h-7z" stroke="none"/><path d="M12 10.5v8" stroke-width="2" fill="none"/></g><path d="M5.2 9.5A7.4 7.4 0 0 1 11 4.6" stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none"/></svg>',
    warrior: '<svg viewBox="0 0 24 24"><defs><linearGradient id="igwarriorr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#c8902c"/><stop offset="1" stop-color="#6a3c08"/></linearGradient><radialGradient id="igwarriord" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#e09060"/><stop offset="1" stop-color="#5a1e08"/></radialGradient></defs><circle cx="12" cy="12" r="11.6" fill="#140a04"/><circle cx="12" cy="12" r="10.8" fill="url(#igwarriorr)"/><circle cx="12" cy="12" r="8.6" fill="url(#igwarriord)"/><g fill="#fff6dc" stroke="#fff6dc" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 .6px 0 rgba(0,0,0,.6))"><path d="M7 17L16.5 7.5M17 17L7.5 7.5" stroke-width="1.7" fill="none"/><path d="M6 15.5l2.5 2.5M18 15.5l-2.5 2.5" stroke-width="1.6" fill="none"/></g><path d="M5.2 9.5A7.4 7.4 0 0 1 11 4.6" stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none"/></svg>',
    ranger: '<svg viewBox="0 0 24 24"><defs><linearGradient id="igrangerr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#c8902c"/><stop offset="1" stop-color="#6a3c08"/></linearGradient><radialGradient id="igrangerd" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#7ac060"/><stop offset="1" stop-color="#1a4a10"/></radialGradient></defs><circle cx="12" cy="12" r="11.6" fill="#140a04"/><circle cx="12" cy="12" r="10.8" fill="url(#igrangerr)"/><circle cx="12" cy="12" r="8.6" fill="url(#igrangerd)"/><g fill="#fff6dc" stroke="#fff6dc" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 .6px 0 rgba(0,0,0,.6))"><path d="M8.5 5.5Q17 12 8.5 18.5" stroke-width="1.5" fill="none"/><path d="M8.5 5.5L8.5 18.5" stroke-width=".7" fill="none"/><path d="M6.5 12H17.5M15.5 10.4L17.6 12L15.5 13.6" stroke-width="1.3" fill="none"/></g><path d="M5.2 9.5A7.4 7.4 0 0 1 11 4.6" stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none"/></svg>',
    rogue: '<svg viewBox="0 0 24 24"><defs><linearGradient id="igroguer" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#c8902c"/><stop offset="1" stop-color="#6a3c08"/></linearGradient><radialGradient id="igrogued" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#9a6ae0"/><stop offset="1" stop-color="#2a1050"/></radialGradient></defs><circle cx="12" cy="12" r="11.6" fill="#140a04"/><circle cx="12" cy="12" r="10.8" fill="url(#igroguer)"/><circle cx="12" cy="12" r="8.6" fill="url(#igrogued)"/><g fill="#fff6dc" stroke="#fff6dc" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 .6px 0 rgba(0,0,0,.6))"><path d="M12 4.8L13.6 14H10.4Z" stroke="none"/><path d="M8.8 14.6h6.4" stroke-width="1.5" fill="none"/><path d="M12 15v3.6" stroke-width="1.6" fill="none"/></g><path d="M5.2 9.5A7.4 7.4 0 0 1 11 4.6" stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none"/></svg>',
    mage: '<svg viewBox="0 0 24 24"><defs><linearGradient id="igmager" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#c8902c"/><stop offset="1" stop-color="#6a3c08"/></linearGradient><radialGradient id="igmaged" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#5ac0ff"/><stop offset="1" stop-color="#0c2a6a"/></radialGradient></defs><circle cx="12" cy="12" r="11.6" fill="#140a04"/><circle cx="12" cy="12" r="10.8" fill="url(#igmager)"/><circle cx="12" cy="12" r="8.6" fill="url(#igmaged)"/><g fill="#fff6dc" stroke="#fff6dc" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 .6px 0 rgba(0,0,0,.6))"><path d="M12 4.6l1.8 5.6L19.4 12l-5.6 1.8L12 19.4l-1.8-5.6L4.6 12l5.6-1.8Z" stroke="none"/></g><path d="M5.2 9.5A7.4 7.4 0 0 1 11 4.6" stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none"/></svg>',
    priest: '<svg viewBox="0 0 24 24"><defs><linearGradient id="igpriestr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#c8902c"/><stop offset="1" stop-color="#6a3c08"/></linearGradient><radialGradient id="igpriestd" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#b8a888"/></radialGradient></defs><circle cx="12" cy="12" r="11.6" fill="#140a04"/><circle cx="12" cy="12" r="10.8" fill="url(#igpriestr)"/><circle cx="12" cy="12" r="8.6" fill="url(#igpriestd)"/><g fill="#5a4420" stroke="#5a4420" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 .6px 0 rgba(0,0,0,.6))"><path d="M8 6.5h8l-1.6 5.4h-4.8Z" stroke="none"/><path d="M12 12v4.6M9.4 17.4h5.2" stroke-width="1.6" fill="none"/></g><path d="M5.2 9.5A7.4 7.4 0 0 1 11 4.6" stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none"/></svg>',
    prof: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4" fill="#3a2a10" stroke="#d4a64a"/><path d="M6 15h12v3H6zM8 10h8l2 5H6z" fill="#d4a64a"/></svg>',

  };
  U.IC = IC;
  const profIcon = p => `<svg viewBox="0 0 24 24"><title>${RB.PROFS[p]}</title><rect x="2" y="2" width="20" height="20" rx="4" fill="#3a2a10" stroke="#d4a64a"/><text x="12" y="16.5" text-anchor="middle" font-size="12" font-family="serif" font-weight="bold" fill="#f6dc95">${RB.PROFS[p][0]}</text></svg>`;

  /* ---------- art ---------- */
  U.art = (spec, key) => A.uri(spec, key);
  U.cardArt = id => { const d = C[id] || RB.TOKENS[id] || RB.BOSSCARDS[id] || RB.HEROES[id]; return d && d.art ? A.uri(d.art, 'c:' + id) : ''; };
  // #45: a hero's chosen skin replaces their painting everywhere it is shown
  U.ownsSkin = sid => (save.skinsOwned || []).includes(sid);
  U.heroSkin = hid => { const sid = save.skins && save.skins[hid]; return sid && RB.SKINS && RB.SKINS[sid] && U.ownsSkin(sid) && GEN()['skin_' + sid] ? sid : ''; };
  { const base = U.cardArt; U.cardArt = id => { const sid = RB.HEROES[id] && U.heroSkin(id); return sid ? GEN()['skin_' + sid] : base(id); }; }

  /* ---------- rules text ---------- */
  function kwText(d) { return (d.kw || []).filter(k => k !== 'unique' || true).map(k => `<b class="kw">${RB.KEYWORDS[k] ? RB.KEYWORDS[k][0] : k}.</b>`).join(' '); }
  U.typeLine = function (d) {
    switch (d.type) {
      case 'ally': return `Ally — ${d.race || 'Mercenary'}`;
      case 'ability': return d.speed === 'instant' ? (d.react ? 'Ability — Instant, React' : 'Ability — Instant') : 'Ability';
      case 'weapon': return `Weapon — ${cap(d.wtype)}`;
      case 'armor': return `Armor — ${RB.SLOTS[d.slot]}, ${d.atype === 'shield' ? 'Shield' : cap(d.atype)}`;
      case 'item': return 'Item';
      case 'quest': return 'Quest';
      case 'location': return 'Location';
      case 'land': return 'Land';
      case 'master': return 'Master Hero';
      case 'hero': return `Hero — ${d.race} ${RB.CLASSES[d.cls].name}`;
      default: return d.omen ? 'Omen' : d.kind ? 'Boss ' + cap(d.kind) : 'Minion';
    }
  };
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';
  U.cap = cap;
  function rulesHTML(d) {
    let h = '';
    if (d.type === 'weapon') h += `<span class="gear">Strike cost ${d.strike}${(d.kw || []).includes('longrange') ? ' · Volley' : ''}</span>`;
    if (d.type === 'armor') h += `<span class="gear">Exhaust and pay ${d.use} to block ${d.def}</span>`;
    if (d.type === 'quest') h += `<span class="gear">${d.cond ? 'Complete when ' + d.condText : 'Complete: pay ' + d.qcost}</span>`;
    if (d.type === 'location') h += `<span class="gear">Ability cost ${d.lcost}</span>`;
    if (d.type === 'master') h += `<span class="gear">Health ${d.hp}</span>`;
    const kws = (d.type === 'weapon' ? (d.kw || []).filter(k => k !== 'longrange') : (d.kw || [])).map(k => `<b class="kw">${RB.KEYWORDS[k][0]}.</b>`).join(' ');
    if (kws) h += kws + ' ';
    if (d.react && RB.REACT[d.react]) h += `<b class="kw react">React</b> — ${RB.REACT[d.react]}. `; // #99
    if (d.text) h += esc(d.text).replace(/\b(Taunt|Bulwark|Swift|Shrouded|Volley|Skyward|Guardian|Ambush|Crushing|Frenzy|Thick Hide|Tend|Soak|Use|Complete|Geared|Grow \d|Bloom|Unearth \d|Plant)\b(?=[: .,])/g, '<b class="kw">$1</b>');
    if (d.loot) h += ` <span class="fl" style="font-style:normal;color:#6a3a08">Scratch-off code inside: ${esc(d.loot.label)}.</span>`;
    if (d.flavor) h += `<span class="fl">${esc(d.flavor)}</span>`;
    return h;
  }
  U.rulesHTML = rulesHTML;
  function icons(d) {
    let s = '';
    const titled = (svg, name) => svg.replace('<svg viewBox="0 0 24 24">', `<svg viewBox="0 0 24 24"><title>${name}</title>`);
    if (d.fac && d.fac !== 'neutral') s += titled(IC[d.fac], RB.FACTIONS[d.fac].name);
    if (d.cls) for (const c of d.cls) s += titled(IC[c], RB.CLASSES[c].name + ' only');
    if (d.prof) s += profIcon(d.prof);
    return s;
  }
  // full card face
  // #112: a clear badge on every card that can reach a boss in the air
  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21 L17 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M12 5 L20 4 L19 12 Z" fill="currentColor"/><path d="M3 21 l1-5 M3 21 l5-1 M6 18 l1-4 M6 18 l4-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const UPWARD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 V6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M5 11 L12 3 L19 11 Z" fill="currentColor"/></svg>';
  function reachBadge(d) {
    const kw = d.kw || [];
    if (kw.includes('longrange')) return `<span class="rbadge volley" title="Volley: ${esc(RB.KEYWORDS.longrange[1])}">${ARROW}Volley</span>`;
    if (kw.includes('skyward')) return `<span class="rbadge skyward" title="Skyward: ${esc(RB.KEYWORDS.skyward[1])}">${UPWARD}Skyward</span>`;
    return '';
  }
  U.reachBadge = reachBadge;
  // #156: who can put this card in a deck, in plain words, e.g. "Clans only · Warrior or Paladin"
  U.usableBy = d => {
    if (!d || d.type === 'hero') return '';
    if (d.type === 'master' || d.hero) { const h = RB.HEROES[d.hero]; return (h ? h.name.split(' ')[0].replace(/,$/, '') : 'One hero') + ' only'; }
    const parts = [], CL = RB.CLASSES, all = Object.keys(CL), orList = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1];
    if (d.fac && d.fac !== 'neutral') parts.push(RB.FACTIONS[d.fac].short + ' only');
    let cls = d.cls ? all.filter(k => d.cls.includes(k)) : all;
    if (d.type === 'weapon' && !d.anyClass) cls = cls.filter(k => CL[k].weapons.includes(d.wtype));
    if (d.type === 'armor') cls = cls.filter(k => CL[k].armor.includes(d.atype));
    if (cls.length < all.length) parts.push(orList(cls.map(k => CL[k].name)) + (cls.length === 1 ? ' only' : ''));
    if (d.prof) parts.push('Needs ' + (RB.PROFS[d.prof] || cap(d.prof)));
    return parts.length ? parts.join(' · ') : 'Any hero';
  };
  U.cardHTML = function (id, opts) {
    opts = opts || {};
    const d = C[id] || RB.TOKENS[id] || RB.BOSSCARDS[id];
    if (!d) return '';
    const isBoss = !!RB.BOSSCARDS[id], isTok = !C[id] && !!RB.TOKENS[id];
    const t = isBoss ? 'boss' : isTok ? 'token' : d.type;
    const cls = ['card', 't-' + t, 'r-' + (d.rarity || 'c')];
    if (d.speed === 'instant') cls.push('instant');
    if (opts.holo) cls.push('holo');
    if (d.loot) cls.push('loot');
    if (d.mythic) cls.push('mythic'); else if (d.set === 'grandcore') cls.push('gcore'); // #161
    const long = d.name.length > 19;
    let stats = '';
    if (d.type === 'ally' || isTok && d.atk != null) stats = `<div class="stat atk">${opts.atk != null ? opts.atk : d.atk}</div><div class="stat hp">${opts.hp != null ? opts.hp : d.hp}</div>`;
    if (d.type === 'weapon') stats = `<div class="stat atk">${d.atk}</div>`;
    if (d.type === 'armor') stats = `<div class="stat use" title="Use cost">${d.use}</div><div class="stat def">${d.def}</div>`;
    if (d.type === 'master') stats = `<div class="stat hp">${d.hp}</div>`;
    const cost = isBoss || isTok || d.type === 'quest' || d.type === 'location' || d.type === 'land' ? '' : `<div class="cost">${d.cost}</div>`;
    const type = isBoss ? (d.omen ? `Omen — ${d.soak ? 'Soak' : 'Boss turn'}` : `Boss ${cap(d.kind)}${d.turns ? ' — Event' : ''}`) : isTok ? (d.type === 'ally' ? 'Ally token' : 'Raid minion') : U.typeLine(d);
    const text = isBoss || isTok ? `${(d.kw || []).map(k => `<b class="kw">${RB.KEYWORDS[k][0]}.</b>`).join(' ')} ${esc(d.text || '')}` : rulesHTML(d);
    return `<div class="${cls.join(' ')}" data-card="${id}"><div class="cf">${cost}<div class="cin"><div class="cname${long ? ' long' : ''}">${esc(d.name)}</div><img class="cart" alt="" loading="lazy" decoding="async" src="${U.cardArt(id)}">${reachBadge(d)}${d.mythic ? '<span class="settag mythic">Mythic</span>' : d.set === 'grandcore' ? '<span class="settag gcore">Grand Core</span>' : ''}<div class="ctype"><span>${type}</span><span class="icons">${isBoss || isTok ? '' : icons(d)}</span></div><div class="ctext">${text}</div></div>${stats}<div class="rar"></div><div class="loottag">Loot</div><div class="holofx"></div></div></div>`;
  };
  U.heroCardHTML = function (hid) {
    const h = RB.HEROES[hid];
    return `<div class="card t-hero r-r" data-hero="${hid}"><div class="cf"><div class="cin"><div class="cname${h.name.length > 19 ? ' long' : ''}" style="padding-left:3cqw">${esc(h.name)}</div><img class="cart" alt="" src="${U.cardArt(hid)}"><div class="ctype"><span>${h.race} ${RB.CLASSES[h.cls].name} — ${h.spec}</span><span class="icons">${IC[h.fac]}${IC[h.cls]}</span></div><div class="ctext"><span class="gear">${RB.PROFS[h.profs[0]]} · ${RB.PROFS[h.profs[1]]}</span><b class="kw">${esc(h.power.name)}</b> (once per game): ${esc(h.power.text)}${h.trait ? `<br><b class="kw">${esc(h.trait.split(':')[0])}:</b>${esc(h.trait.split(':').slice(1).join(':'))}` : ''}<span class="fl">${esc(h.flavor)}</span></div></div><div class="stat hp">${h.hp}</div><div class="rar"></div></div></div>`;
  };

  /* ---------- hover preview ---------- */
  let pv = null;
  // #38 phones: one layout that switches on small or short screens
  U.PHONE_Q = '(max-width: 760px), (max-height: 500px)';
  U.isPhone = () => typeof matchMedia !== 'undefined' && matchMedia(U.PHONE_Q).matches;
  U.preview = function (html, anchor) {
    U.hidePreview();
    if (!html) return;
    pv = document.createElement('div'); pv.className = 'preview'; pv.innerHTML = html;
    document.body.appendChild(pv);
    if (U.isPhone()) { const w = Math.min(innerWidth * 0.7, innerHeight * 0.5, 280); pv.style.setProperty('--cw', w + 'px'); pv.style.left = (innerWidth - w) / 2 + 'px'; pv.style.top = Math.max(8, (innerHeight - w * 1.4) / 2) + 'px'; return; }
    const r = anchor.getBoundingClientRect(), w = 230, hgt = w * 1.4;
    let x = r.right + 14, y = r.top + r.height / 2 - hgt / 2;
    if (x + w > innerWidth - 8) x = r.left - w - 14;
    if (x < 8) x = Math.min(innerWidth - w - 8, r.left);
    y = Math.max(8, Math.min(innerHeight - hgt - 8, y));
    if (x < r.right && x + w > r.left && y < r.bottom && y + hgt > r.top) y = r.top - hgt - 10 > 8 ? r.top - hgt - 10 : r.bottom + 10;
    pv.style.left = x + 'px'; pv.style.top = Math.max(8, y) + 'px';
  };
  U.hidePreview = () => { if (pv) { pv.remove(); pv = null; } };
  // #163: click a card in the Collection, the Market or a pack (or its magnifier in the deck builder) to see it big
  U.zoomCard = function (id, opts) {
    opts = opts || {};
    if (!id || !(RB.CARDS[id] || RB.TOKENS[id])) return;
    U.hidePreview(); U.closeZoom();
    const z = document.createElement('div'); z.className = 'cardzoom'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-label', 'Card, shown large');
    const w = Math.min(520, innerWidth * 0.9, (innerHeight - 70) / 1.4);
    z.innerHTML = `<div class="zwrap" style="--cw:${Math.round(w)}px">${U.cardHTML(id, { holo: !!opts.holo })}</div><button class="zclose" aria-label="Close">&times;</button><p class="zhint">${U.isPhone() ? 'Tap' : 'Click'} anywhere to close</p>`;
    z.onclick = () => U.closeZoom();
    document.body.appendChild(z);
    requestAnimationFrame(() => z.classList.add('on'));
  };
  U.closeZoom = () => { const z = document.querySelector('.cardzoom'); if (z) z.remove(); };
  if (typeof document !== 'undefined') {
    const ZOOM_AT = '.colpool .card, .shopcard .card, .flip.on .card, .slot .zoombtn, .sparerow img, .sparerow .sn';
    document.addEventListener('click', e => {
      const t = e.target.closest && e.target.closest(ZOOM_AT); if (!t || document.querySelector('.cardzoom')) return;
      let id = t.dataset.zoom || t.dataset.card, holo = t.classList.contains('holo');
      if (!id) { const host = t.closest('[data-card], [data-zoom]'); id = host && (host.dataset.zoom || host.dataset.card); const cd = t.closest('.slot') && t.closest('.slot').querySelector('.card'); if (cd) holo = cd.classList.contains('holo'); }
      if (t.classList.contains('zoombtn')) { e.stopPropagation(); e.preventDefault(); const cd = t.closest('.slot').querySelector('.card'); if (cd) holo = cd.classList.contains('holo'); }
      U.zoomCard(id, { holo });
    }, true);
    // right-click any card in the deck builder or Collection also shows it big
    document.addEventListener('contextmenu', e => {
      const c = e.target.closest && e.target.closest('.pool .card, .shopcard .card'); if (!c) return;
      e.preventDefault(); U.zoomCard(c.dataset.card, { holo: c.classList.contains('holo') });
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.cardzoom')) { e.stopPropagation(); U.closeZoom(); } }, true);
  }
  // #121: hovering a hero in any hero picker (raid setup, dungeons, online lobby) shows the full hero card
  if (typeof document !== 'undefined') {
    const canHover = () => typeof matchMedia === 'undefined' || matchMedia('(hover: hover)').matches;
    document.addEventListener('mouseover', e => {
      const b = e.target.closest && e.target.closest('.heropick [data-hero]'); if (!b || !canHover() || U.isPhone()) return;
      if (pv && pv.dataset.for === b.dataset.hero) return;
      U.preview(U.heroCardHTML(b.dataset.hero), b); if (pv) { pv.dataset.for = b.dataset.hero; pv.classList.add('heroprev'); }
    });
    document.addEventListener('mouseout', e => {
      const b = e.target.closest && e.target.closest('.heropick [data-hero]'); if (!b) return;
      if (e.relatedTarget && b.contains(e.relatedTarget)) return;
      U.hidePreview();
    });
  }

  /* ---------- popover / toast / dialog ---------- */
  let pop = null;
  // #51: mute and volume from anywhere (battle top bar, M key)
  U.toggleMute = () => { const st = save.settings; st.muted = !st.muted; U.persist(); RB.AUDIO.refresh(); U.toast(st.muted ? 'Sound muted. Press M to turn it back on.' : 'Sound on.'); document.querySelectorAll('[data-act=mute]').forEach(b => { b.textContent = st.muted ? '🔇' : '🔊'; }); };
  U.soundPop = anchor => {
    let sp = document.querySelector('.soundpop'); if (sp) { sp.remove(); return; }
    const st = save.settings, r = anchor.getBoundingClientRect();
    sp = document.createElement('div'); sp.className = 'soundpop';
    sp.innerHTML = `<h5>Sound</h5>
      <label>Sound effects<input type="range" min="0" max="1" step="0.05" value="${st.sfxVol ?? 0.8}" data-vol="sfxVol" aria-label="Sound effects volume"></label>
      <label>Music<input type="range" min="0" max="1" step="0.05" value="${st.musicVol ?? 0.5}" data-vol="musicVol" aria-label="Music volume"></label>
      <label class="toggle"><input type="checkbox" data-mute ${st.muted ? 'checked' : ''}> Mute everything</label>`;
    sp.style.top = (r.bottom + 8) + 'px'; sp.style.left = Math.max(8, Math.min(innerWidth - 268, r.left - 100)) + 'px';
    document.body.appendChild(sp);
    sp.oninput = e => { const v = e.target.closest('[data-vol]'); if (v) { st[v.dataset.vol] = +v.value; if (st.muted && +v.value > 0) { st.muted = false; sp.querySelector('[data-mute]').checked = false; RB.AUDIO.refresh(); } U.persist(); RB.AUDIO.setVolumes(); } };
    sp.onchange = e => { if (e.target.matches('[data-vol=sfxVol]')) U.sfx.hit(3); if (e.target.matches('[data-mute]')) U.toggleMute(); };
    const close = e => { if (!sp.contains(e.target) && !e.target.closest('[data-act=soundpop]')) { sp.remove(); document.removeEventListener('pointerdown', close, true); } };
    setTimeout(() => document.addEventListener('pointerdown', close, true), 0);
  };
  if (typeof document !== 'undefined') document.addEventListener('keydown', e => { if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) U.toggleMute(); });
  U.closePop = () => { if (pop) { pop.remove(); pop = null; } $$('.hc.open').forEach(e => e.classList.remove('open')); };
  U.popover = function (anchor, title, items, opts) {
    U.closePop(); U.hidePreview();
    // #38: on phones the choices slide up from the bottom, with the full card shown big
    if (U.isPhone()) {
      pop = document.createElement('div'); pop.className = 'sheetov';
      pop.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${opts && opts.card ? `<div class="sheetcard">${opts.card}</div>` : ''}<div class="sbody">${title ? `<div class="ttl">${esc(title)}</div>` : ''}${items.map((it, i) => it.why ? `<div class="why">${esc(it.why)}</div>` : `<button class="btn ${i === 0 && !it.disabled && opts && opts.card ? 'primary' : ''}" data-i="${i}" ${it.disabled ? 'disabled' : ''}>${it.label}</button>`).join('')}<button class="btn ghost" data-close>${items.some(it => !it.why) ? 'Cancel' : 'Close'}</button></div></div>`;
      document.body.appendChild(pop);
      pop.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) { const it = items[+b.dataset.i]; U.closePop(); it.go && it.go(); return; } if (e.target === pop || e.target.closest('[data-close]')) U.closePop(); });
      return pop;
    }
    pop = document.createElement('div'); pop.className = 'popover';
    pop.innerHTML = (title ? `<div class="ttl">${esc(title)}</div>` : '') + items.map((it, i) => it.why ? `<div class="why">${esc(it.why)}</div>` : `<button class="btn small" data-i="${i}" ${it.disabled ? 'disabled' : ''}>${it.label}</button>`).join('');
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect(), pr = pop.getBoundingClientRect();
    let x = r.left + r.width / 2 - pr.width / 2, y = r.top - pr.height - 10;
    if (y < 8) y = r.bottom + 10;
    x = Math.max(8, Math.min(innerWidth - pr.width - 8, x));
    y = Math.max(8, Math.min(innerHeight - pr.height - 8, y));
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
    pop.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (!b) return; const it = items[+b.dataset.i]; U.closePop(); it.go && it.go(); });
    const first = pop.querySelector('button:not([disabled])'); if (first) first.focus({ preventScroll: true });
    return pop;
  };
  document.addEventListener('pointerdown', e => { if (pop && !pop.contains(e.target) && !e.target.closest('.hc,.unit,.herocard,.gslot,.rcard,.bosscard,.rchip,.rmember')) U.closePop(); }, true);
  // #123: a chime when the turn passes to you. If the page is hidden, the tab's title flashes too until you look back.
  let titleWas = null, titleT = 0;
  const titleBack = () => { clearInterval(titleT); titleT = 0; if (titleWas != null) { document.title = titleWas; titleWas = null; } };
  U.turnAlert = function () {
    if (save.settings.turnAlert === false) return;
    RB.AUDIO.alert('yourTurn');
    if (typeof document === 'undefined' || !document.hidden || titleT) return;
    titleWas = document.title; let flip = false;
    const tick = () => { document.title = (flip = !flip) ? '⚔ Your turn! · Raidbound' : titleWas; };
    tick(); titleT = setInterval(tick, 1200);
  };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!document.hidden) titleBack(); });
  U.toast = function (msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); };
  U.dialog = function (html, opts) {
    return new Promise(resolve => {
      const o = document.createElement('div'); o.className = 'overlay';
      o.innerHTML = `<div class="dialog ${opts && opts.cls ? opts.cls : ''}" role="dialog" aria-modal="true">${html}</div>`;
      document.body.appendChild(o);
      const done = v => { o.remove(); resolve(v); };
      o.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) done(b.dataset.v); if (e.target === o && opts && opts.dismiss) done(opts.dismiss); });
      if (opts && opts.onMount) opts.onMount(o, done);
      const f = o.querySelector('button'); if (f) f.focus({ preventScroll: true });
    });
  };

  /* sound and music live in audio.js (RB.AUDIO / U.sfx) */

  /* ---------- loot codes ---------- */
  const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  // a code's first letter picks the reward. The first 8 rewards use 4 letters each (salt 'raidbound'); #94 added a second
  // series (salt 'raidbound-v2', 2 letters each, room for 16 more). Append only: never reorder either list.
  const REWARD_KEYS = ['pet_gryphon', 'back_lynx', 'board_banners', 'pet_kite', 'pet_owl', 'back_starfall', 'board_aurora', 'pet_ram'];
  const REWARD_KEYS2 = ['back_phoenix', 'back_wyrmeye', 'back_unicorn', 'back_orrery', 'back_kingscrown', 'back_stormwing'];
  const tail = (salt, body) => { const sum = A.hash(salt + body) % (ALPH.length * ALPH.length); return ALPH[Math.floor(sum / ALPH.length)] + ALPH[sum % ALPH.length]; };
  const valid = (salt, c) => c.length === 10 && c.slice(8) === tail(salt, c.slice(0, 8));
  U.makeCode = function (reward) {
    const r1 = REWARD_KEYS.indexOf(reward), r2 = REWARD_KEYS2.indexOf(reward);
    for (;;) {
      let body = r1 >= 0 ? ALPH[r1 * 4 + Math.floor(Math.random() * 4)] : ALPH[Math.max(0, r2) * 2 + Math.floor(Math.random() * 2)];
      for (let i = 0; i < 7; i++) body += ALPH[Math.floor(Math.random() * ALPH.length)];
      const code = body + tail(r1 >= 0 ? 'raidbound' : 'raidbound-v2', body);
      if (r1 < 0 && valid('raidbound', code)) continue; // a new-series code must never also read as an old one
      return 'RB-' + code.slice(0, 5) + '-' + code.slice(5);
    }
  };
  U.checkCode = function (raw) {
    const c = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^RB/, '');
    if (c.length !== 10) return null;
    if (valid('raidbound', c)) return REWARD_KEYS[Math.floor(ALPH.indexOf(c[0]) / 4)] || null;
    if (valid('raidbound-v2', c)) return REWARD_KEYS2[Math.floor(ALPH.indexOf(c[0]) / 2)] || null;
    return null;
  };
  // #41: gold codes (for testing / gifts). Format RBG-XXXXX-XXXXX; the first letter sets the amount.
  const GOLD_TIERS = [100, 250, 500, 1000, 2500, 5000, 10000, 50000];
  U.makeGoldCode = function (amount) {
    const ti = Math.max(0, GOLD_TIERS.indexOf(amount));
    let body = ALPH[ti * 4 + Math.floor(Math.random() * 4)];
    for (let i = 0; i < 7; i++) body += ALPH[Math.floor(Math.random() * ALPH.length)];
    const sum = A.hash('raidbound-gold' + body) % (ALPH.length * ALPH.length);
    const code = body + ALPH[Math.floor(sum / ALPH.length)] + ALPH[sum % ALPH.length];
    return 'RBG-' + code.slice(0, 5) + '-' + code.slice(5);
  };
  U.checkGoldCode = function (raw) {
    const c = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!c.startsWith('RBG')) return null;
    const b = c.slice(3); if (b.length !== 10) return null;
    const body = b.slice(0, 8), sum = A.hash('raidbound-gold' + body) % (ALPH.length * ALPH.length);
    if (b.slice(8) !== ALPH[Math.floor(sum / ALPH.length)] + ALPH[sum % ALPH.length]) return null;
    return { amount: GOLD_TIERS[Math.floor(ALPH.indexOf(body[0]) / 4)] || null, key: b };
  };
  // returns a message; adds the gold once per code on this computer
  U.redeemGold = function (raw) {
    const g = U.checkGoldCode(raw);
    if (!g || !g.amount) return { ok: false, text: 'That gold code isn\'t valid. Check the letters and try again.' };
    save.goldCodes = save.goldCodes || [];
    if (save.goldCodes.includes(g.key)) return { ok: false, text: 'This gold code has already been used on this computer.' };
    save.goldCodes.push(g.key); save.gold = (save.gold || 0) + g.amount; U.persist(); U.sfx.treasure();
    return { ok: true, text: `+${g.amount} gold! You now have ${save.gold}.` };
  };
})(globalThis.RB);
