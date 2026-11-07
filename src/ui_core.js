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
    return '';
  };
  // grant anything earned by playing; returns the ids that are new
  U.checkUnlocks = () => {
    const got = [];
    for (const [id, c] of Object.entries(RB.COSMETICS)) {
      if (save.cos.includes(id)) continue;
      const [k, r] = c.get.split(':');
      const ok = k === 'win' ? (save.wins[r] || 0) > 0 : k === 'heroic' ? (save.heroicWins[r] || 0) > 0 : k === 'allraids' ? Object.keys(RB.RAIDS).every(x => (save.wins[x] || 0) > 0) : false;
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
    concord: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#1c2a5a" stroke="#f0c860" stroke-width="1.4"/><circle cx="12" cy="12" r="4" fill="#f0c860"/><g stroke="#f0c860" stroke-width="1.6">' + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M12 12L${(12 + Math.cos(a * Math.PI / 180) * 9).toFixed(1)} ${(12 + Math.sin(a * Math.PI / 180) * 9).toFixed(1)}"/>`).join('') + '</g></svg>',
    clans: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#5a120a" stroke="#ff9a5a" stroke-width="1.4"/><circle cx="12" cy="9" r="4.5" fill="#ff7a3a"/><path d="M6 18L17 7M18 18L7 7" stroke="#f4e0c0" stroke-width="2"/></svg>',
    neutral: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#3a3020" stroke="#c9b48a" stroke-width="1.4"/><path d="M12 4L14 12L12 20L10 12Z" fill="#e8d8b0"/><path d="M4 12L12 10L20 12L12 14Z" fill="#a89870"/></svg>',
    paladin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#f4dc94" stroke="#7a5410"/><path d="M8 5h8v5H8zM11 10h2v10h-2z" fill="#5a3a08"/></svg>',
    warrior: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#c8a080" stroke="#4a2a14"/><path d="M6 18L17 5M18 18L7 5" stroke="#3a1a08" stroke-width="2.2"/></svg>',
    ranger: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#a8c890" stroke="#2a4a14"/><path d="M8 4Q18 12 8 20" stroke="#2a3a10" stroke-width="2" fill="none"/><path d="M8 4V20M5 12H19" stroke="#2a3a10" stroke-width="1.2"/></svg>',
    rogue: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#e8e070" stroke="#4a4010"/><path d="M12 3L14 14H10Z" fill="#2a2a20"/><path d="M8 14h8M12 14v6" stroke="#2a2a20" stroke-width="2"/></svg>',
    mage: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#8ad0f0" stroke="#10304a"/><path d="M12 3l2.4 6.4L21 12l-6.6 2.6L12 21l-2.4-6.4L3 12l6.6-2.6z" fill="#0e2a4a"/></svg>',
    priest: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#f4f0e8" stroke="#5a5040"/><path d="M7 6h10l-2 7h-6zM11 13h2v5h-2zM8 19h8" stroke="#4a4030" stroke-width="1.4" fill="#d8ccb0"/></svg>',
    prof: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4" fill="#3a2a10" stroke="#d4a64a"/><path d="M6 15h12v3H6zM8 10h8l2 5H6z" fill="#d4a64a"/></svg>',
  };
  U.IC = IC;
  const profIcon = p => `<svg viewBox="0 0 24 24"><title>${RB.PROFS[p]}</title><rect x="2" y="2" width="20" height="20" rx="4" fill="#3a2a10" stroke="#d4a64a"/><text x="12" y="16.5" text-anchor="middle" font-size="12" font-family="serif" font-weight="bold" fill="#f6dc95">${RB.PROFS[p][0]}</text></svg>`;

  /* ---------- art ---------- */
  U.art = (spec, key) => A.uri(spec, key);
  U.cardArt = id => { const d = C[id] || RB.TOKENS[id] || RB.BOSSCARDS[id] || RB.HEROES[id]; return d && d.art ? A.uri(d.art, 'c:' + id) : ''; };

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
      o.innerHTML = `<div class="dialog" role="dialog" aria-modal="true">${html}</div>`;
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
