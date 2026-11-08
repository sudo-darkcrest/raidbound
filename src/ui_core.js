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
  const fresh = () => ({ owned: {}, holo: {}, loot: [], cos: [], sel: { back: '', board: '', pet: '' }, decks: {}, wins: {}, heroicWins: {}, gold: 0, heroes: [], settings: { speed: 1, sound: true, music: true, sfxVol: 0.8, musicVol: 0.5, autoDefend: true, pauseForInstants: true }, seen: false });
  let save = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) save = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { }
  // base collection: two of every core card
  for (const d of Object.values(C)) if (d.set === 'core' && !(save.owned[d.id] >= 2)) save.owned[d.id] = Math.max(save.owned[d.id] || 0, 2);
  U.save = save;
  // #57: saved decks that held a retired Master Hero card get that hero's Ascended card instead
  if (RB.fixDeck) for (const [hid, ids] of Object.entries(save.decks || {})) if (Array.isArray(ids)) save.decks[hid] = RB.fixDeck(hid, ids);
  U.persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { } };
  if (!save.heroicWins) save.heroicWins = {};
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
    if (k === 'packtotal') { const n = +r, have = Object.values(save.packs || {}).reduce((a, b) => a + b, 0); return `Open ${n} booster packs of any kind (${Math.min(have, n)}/${n})`; }
    if (k === 'packs') { const PS = RB.PACK_SETS && RB.PACK_SETS[r], n = +c.get.split(':')[2], have = (save.packs || {})[r] || 0; return `Open ${n} ${PS ? PS.name : ''} booster packs (${Math.min(have, n)}/${n})`; }
    return '';
  };
  // grant anything earned by playing; returns the ids that are new
  U.checkUnlocks = () => {
    const got = [];
    for (const [id, c] of Object.entries(RB.COSMETICS)) {
      if (save.cos.includes(id)) continue;
      const [k, r] = c.get.split(':');
      const ok = k === 'packtotal' ? Object.values(save.packs || {}).reduce((a, b) => a + b, 0) >= +r : k === 'packs' ? ((save.packs || {})[r] || 0) >= +c.get.split(':')[2] : k === 'win' ? (save.wins[r] || 0) > 0 : k === 'heroic' ? (save.heroicWins[r] || 0) > 0 : k === 'allraids' ? Object.keys(RB.RAIDS).every(x => (save.wins[x] || 0) > 0) : false;
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
      case 'ability': return d.speed === 'instant' ? 'Ability — Instant' : 'Ability';
      case 'weapon': return `Weapon — ${cap(d.wtype)}`;
      case 'armor': return `Armor — ${RB.SLOTS[d.slot]}, ${d.atype === 'shield' ? 'Shield' : cap(d.atype)}`;
      case 'item': return 'Item';
      case 'quest': return 'Quest';
      case 'location': return 'Location';
      case 'master': return 'Master Hero';
      case 'hero': return `Hero — ${d.race} ${RB.CLASSES[d.cls].name}`;
      default: return d.kind ? 'Boss ' + cap(d.kind) : 'Minion';
    }
  };
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';
  U.cap = cap;
  function rulesHTML(d) {
    let h = '';
    if (d.type === 'weapon') h += `<span class="gear">Strike cost ${d.strike}${(d.kw || []).includes('longrange') ? ' · Long-Range' : ''}</span>`;
    if (d.type === 'armor') h += `<span class="gear">Exhaust and pay ${d.use} to block ${d.def}</span>`;
    if (d.type === 'quest') h += `<span class="gear">${d.cond ? 'Complete when ' + d.condText : 'Complete: pay ' + d.qcost}</span>`;
    if (d.type === 'location') h += `<span class="gear">Ability cost ${d.lcost}</span>`;
    if (d.type === 'master') h += `<span class="gear">Health ${d.hp}</span>`;
    const kws = (d.type === 'weapon' ? (d.kw || []).filter(k => k !== 'longrange') : (d.kw || [])).map(k => `<b class="kw">${RB.KEYWORDS[k][0]}.</b>`).join(' ');
    if (kws) h += kws + ' ';
    if (d.text) h += esc(d.text).replace(/\b(Taunt|Protector|Ferocity|Elusive|Long-Range|Guardian|Use|Complete)\b(?=[: .,])/g, '<b class="kw">$1</b>');
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
    const long = d.name.length > 19;
    let stats = '';
    if (d.type === 'ally' || isTok && d.atk != null) stats = `<div class="stat atk">${opts.atk != null ? opts.atk : d.atk}</div><div class="stat hp">${opts.hp != null ? opts.hp : d.hp}</div>`;
    if (d.type === 'weapon') stats = `<div class="stat atk">${d.atk}</div>`;
    if (d.type === 'armor') stats = `<div class="stat use" title="Use cost">${d.use}</div><div class="stat def">${d.def}</div>`;
    if (d.type === 'master') stats = `<div class="stat hp">${d.hp}</div>`;
    const cost = isBoss || isTok || d.type === 'quest' || d.type === 'location' ? '' : `<div class="cost">${d.cost}</div>`;
    const type = isBoss ? `Boss ${cap(d.kind)}${d.turns ? ' — Event' : ''}` : isTok ? (d.type === 'ally' ? 'Ally token' : 'Raid minion') : U.typeLine(d);
    const text = isBoss || isTok ? `${(d.kw || []).map(k => `<b class="kw">${RB.KEYWORDS[k][0]}.</b>`).join(' ')} ${esc(d.text || '')}` : rulesHTML(d);
    return `<div class="${cls.join(' ')}" data-card="${id}"><div class="cf">${cost}<div class="cin"><div class="cname${long ? ' long' : ''}">${esc(d.name)}</div><img class="cart" alt="" src="${U.cardArt(id)}"><div class="ctype"><span>${type}</span><span class="icons">${isBoss || isTok ? '' : icons(d)}</span></div><div class="ctext">${text}</div></div>${stats}<div class="rar"></div><div class="loottag">Loot</div><div class="holofx"></div></div></div>`;
  };
  U.heroCardHTML = function (hid) {
    const h = RB.HEROES[hid];
    return `<div class="card t-hero r-r" data-hero="${hid}"><div class="cf"><div class="cin"><div class="cname${h.name.length > 19 ? ' long' : ''}" style="padding-left:3cqw">${esc(h.name)}</div><img class="cart" alt="" src="${U.cardArt(hid)}"><div class="ctype"><span>${h.race} ${RB.CLASSES[h.cls].name} — ${h.spec}</span><span class="icons">${IC[h.fac]}${IC[h.cls]}</span></div><div class="ctext"><span class="gear">${RB.PROFS[h.profs[0]]} · ${RB.PROFS[h.profs[1]]}</span><b class="kw">${esc(h.power.name)}</b> (once per game): ${esc(h.power.text)}${h.trait ? `<br><b class="kw">${esc(h.trait.split(':')[0])}:</b>${esc(h.trait.split(':').slice(1).join(':'))}` : ''}<span class="fl">${esc(h.flavor)}</span></div></div><div class="stat hp">${h.hp}</div><div class="rar"></div></div></div>`;
  };

  /* ---------- hover preview ---------- */
  let pv = null;
  U.preview = function (html, anchor) {
    U.hidePreview();
    if (!html) return;
    pv = document.createElement('div'); pv.className = 'preview'; pv.innerHTML = html;
    document.body.appendChild(pv);
    const r = anchor.getBoundingClientRect(), w = 230, hgt = w * 1.4;
    let x = r.right + 14, y = r.top + r.height / 2 - hgt / 2;
    if (x + w > innerWidth - 8) x = r.left - w - 14;
    if (x < 8) x = Math.min(innerWidth - w - 8, r.left);
    y = Math.max(8, Math.min(innerHeight - hgt - 8, y));
    if (x < r.right && x + w > r.left && y < r.bottom && y + hgt > r.top) y = r.top - hgt - 10 > 8 ? r.top - hgt - 10 : r.bottom + 10;
    pv.style.left = x + 'px'; pv.style.top = Math.max(8, y) + 'px';
  };
  U.hidePreview = () => { if (pv) { pv.remove(); pv = null; } };

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
  U.popover = function (anchor, title, items) {
    U.closePop(); U.hidePreview();
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
  const REWARD_KEYS = ['pet_gryphon', 'back_lynx', 'board_banners', 'pet_kite'];
  U.makeCode = function (reward) {
    const ri = REWARD_KEYS.indexOf(reward);
    let body = ALPH[ri * 4 + Math.floor(Math.random() * 4)];
    for (let i = 0; i < 7; i++) body += ALPH[Math.floor(Math.random() * ALPH.length)];
    const sum = A.hash('raidbound' + body) % (ALPH.length * ALPH.length);
    const code = body + ALPH[Math.floor(sum / ALPH.length)] + ALPH[sum % ALPH.length];
    return 'RB-' + code.slice(0, 5) + '-' + code.slice(5);
  };
  U.checkCode = function (raw) {
    const c = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^RB/, '');
    if (c.length !== 10) return null;
    const body = c.slice(0, 8), sum = A.hash('raidbound' + body) % (ALPH.length * ALPH.length);
    if (c.slice(8) !== ALPH[Math.floor(sum / ALPH.length)] + ALPH[sum % ALPH.length]) return null;
    const ri = Math.floor(ALPH.indexOf(body[0]) / 4);
    return REWARD_KEYS[ri] || null;
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
