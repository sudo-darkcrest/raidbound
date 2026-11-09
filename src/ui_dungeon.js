/* RAIDBOUND — #63 Dungeons screen, setup and results (XP, levels, gold, card-back rewards). */
(function (RB) {
  const U = RB.UI, C = RB.CARDS;
  const { esc } = U;
  const save = U.save;
  const st = U.dungeonState = { id: 'thornwood', mode: 'novice', seats: [{ hero: 'aldric', auto: false }, { hero: 'grukka', auto: true }, { hero: 'lyssara', auto: true }] };

  const dxp = () => save.dxp || 0;
  const lvl = () => RB.dungeonLevel(dxp());
  function xpBar() {
    const L = lvl(), T = RB.DXP_LEVELS, cur = dxp();
    if (L >= T.length) return `<div class="dxp"><b>Dungeon level ${L}</b> (max) · ${cur} XP<div class="xpbar"><i style="width:100%"></i></div></div>`;
    const a = T[L - 1], b = T[L], pct = Math.round((cur - a) / (b - a) * 100);
    return `<div class="dxp"><b>Dungeon level ${L}</b> · ${cur} / ${b} XP to level ${L + 1}<div class="xpbar"><i style="width:${pct}%"></i></div><small>Each level lets <b>3 more of your own cards</b> into your starter deck for dungeon runs. Right now: <b>${RB.dungeonSwaps(L)}</b>.</small></div>`;
  }

  U.dungeons = function (keep) {
    RB.AUDIO.music('title');
    const D = RB.DUNGEONS, d = D[st.id], M = RB.DUNGEON_MODES;
    const heroes = Object.keys(RB.HEROES).filter(id => U.heroOpen(id));
    st.seats.forEach(s => { if (!heroes.includes(s.hero)) s.hero = heroes[0]; });
    const cards = Object.values(D).map(x => { const clr = (save.dclears || {})[x.id] || 0;
      return `<button class="dcard ${x.id === st.id ? 'on' : ''}" data-did="${x.id}" style="--dc:${x.theme}"><img alt="" src="${U.art(x.art, 'raid:' + x.id)}"><div><span class="chip tier">${x.difficulty}</span><h4>${esc(x.name)}</h4><div class="boss">${esc(x.boss)}</div>${clr ? `<div class="done">Cleared ${clr}×</div>` : ''}</div></button>`; }).join('');
    const seats = st.seats.map((s, i) => `<div class="dseat"><img alt="" src="${U.cardArt(s.hero)}"><div><label>Hero ${i + 1}<select data-seat="${i}" aria-label="Hero ${i + 1}">${heroes.map(h => `<option value="${h}" ${h === s.hero ? 'selected' : ''}>${esc(RB.HEROES[h].name)}</option>`).join('')}</select></label>
      <label class="toggle"><input type="checkbox" data-auto="${i}" ${s.auto ? 'checked' : ''} ${i === 0 ? 'disabled' : ''}> ${i === 0 ? 'You' : 'AI plays this hero'}</label></div>${st.seats.length > 1 && i > 0 ? `<button class="btn ghost small" data-rm="${i}" aria-label="Remove hero ${i + 1}">✕</button>` : ''}</div>`).join('');
    const n = st.seats.length, hp = d.hp + d.hpPer * (n - 1), mode = M[st.mode];
    const el = U.show('dungeons', `<div class="page"><div class="pagehead"><button class="btn ghost small" data-act="back">← Title</button><h2>Dungeons</h2><span class="sp"></span></div>
      <p class="lede">A dungeon runs itself: no boss player needed. Up to three heroes go in with their <b>starter decks</b>. Each turn the dungeon <b>flips</b> cards from its deck (allies, equipment and attacks), then <b>marks</b> one hero at random — and everything it has attacks that hero. It levels up as you hurt it. Win to earn Dungeon XP: every level lets more of your own cards into your deck.</p>
      ${xpBar()}
      <div class="dcards">${cards}</div>
      <div class="dinfo" style="--dc:${d.theme}"><h3>${esc(d.name)}</h3><p class="lede">${esc(d.intro)}</p><ul>${d.rules.map(r => `<li><b>${esc(r.name)}:</b> ${esc(r.text)}</li>`).join('')}</ul></div>
      <h3 class="sec">Difficulty</h3><div class="difficulty"><span class="seg">${Object.entries(M).map(([k, m]) => `<button class="${k === st.mode ? 'on' : ''}" data-mode="${k}">${m.name}</button>`).join('')}</span><p class="kwhat">${esc(mode.text)}</p></div>
      <h3 class="sec">Your party (up to 3)</h3><div class="dseats">${seats}${n < 3 ? `<button class="btn" data-act="add">+ Add a hero</button>` : ''}</div>
      <div class="bossscale"><b>${esc(d.short)} for ${n} hero${n > 1 ? 'es' : ''}:</b> ${hp} health · strikes for ${d.strike + (n - 1) + mode.level - 1} · starts at level ${mode.level} · ${mode.first ? 'goes first' : 'you go first'}</div>
      <div class="startbar"><span class="summary">${esc(d.name)} · ${mode.name} · ${n} hero${n > 1 ? 'es' : ''} · decks: starter + ${RB.dungeonSwaps(lvl())} of your cards</span><button class="btn" data-act="online" title="Friends join with a code from their own computer or phone">Play online with friends</button><button class="btn primary big" data-act="go">Enter the dungeon</button></div></div>`, keep);
    el.onclick = e => {
      const t = e.target;
      if (t.closest('[data-act=back]')) return U.title();
      const c = t.closest('[data-did]'); if (c) { st.id = c.dataset.did; return U.dungeons(true); }
      const m = t.closest('[data-mode]'); if (m) { st.mode = m.dataset.mode; return U.dungeons(true); }
      const r = t.closest('[data-rm]'); if (r) { st.seats.splice(+r.dataset.rm, 1); return U.dungeons(true); }
      if (t.closest('[data-act=add]')) { const used = st.seats.map(s => s.hero); st.seats.push({ hero: heroes.find(h => !used.includes(h)) || heroes[0], auto: true }); return U.dungeons(true); }
      if (t.closest('[data-act=go]')) return U.startDungeon();
      if (t.closest('[data-act=online]')) return U.online({ dungeon: { id: st.id, diff: st.mode } });
    };
    el.onchange = e => {
      const s = e.target.closest('[data-seat]'); if (s) { st.seats[+s.dataset.seat].hero = s.value; return U.dungeons(true); }
      const a = e.target.closest('[data-auto]'); if (a) { st.seats[+a.dataset.auto].auto = a.checked; }
    };
  };

  U.startDungeon = function () {
    const mode = RB.DUNGEON_MODES[st.mode], swaps = RB.dungeonSwaps(lvl());
    const party = st.seats.map((s, i) => {
      const ids = RB.dungeonDeck(s.hero, save.owned, swaps);
      const holoLeft = Object.assign({}, save.holo);
      return { hero: s.hero, auto: i === 0 ? false : s.auto, name: 'Hero ' + (i + 1), pet: i === 0 && U.ownsCos(save.sel.pet) ? save.sel.pet : null, deck: ids.map(id => { const h = holoLeft[id] > 0; if (h) holoLeft[id]--; return { id, holo: h }; }) };
    });
    U.battle({ raid: st.id, dungeon: true, difficulty: st.mode, dungeonLevel: mode.level, dungeonFirst: mode.first, party, settings: { autoDefend: save.settings.autoDefend, pauseForInstants: save.settings.pauseForInstants } });
  };

  U.dungeonEnd = function (g, win, cfg, E) {
    const d = g.raid, mode = RB.DUNGEON_MODES[cfg.difficulty] || RB.DUNGEON_MODES.novice;
    const before = lvl(), xp = RB.dungeonXp(g, win, cfg.difficulty);
    save.dxp = dxp() + xp;
    const gold = RB.goldFor(g, win); gold.total = Math.round(gold.total * 0.8); save.gold = (save.gold || 0) + gold.total;
    if (win) { save.dclears = save.dclears || {}; save.dclears[d.id] = (save.dclears[d.id] || 0) + 1; if (cfg.difficulty === 'legendary') save.dlegend = (save.dlegend || 0) + 1; }
    U.persist();
    const fresh = U.checkUnlocks(), after = lvl();
    if (win) { U.sfx.win(); RB.AUDIO.music('victory'); } else { RB.AUDIO.music(null); U.sfx.lose(); }
    const stats = `<div class="stats"><div><b>${g.round}</b>rounds</div><div><b>${g.boss.level}</b>dungeon level reached</div><div><b>${g.stats.dmgDealt}</b>damage dealt</div><div><b>${g.players.filter(p => !p.hero.dead).length}/${g.players.length}</b>heroes standing</div></div>`;
    const lvlUp = after > before ? `<div class="newvault"><b>Dungeon level ${after}!</b> You can now add ${RB.dungeonSwaps(after)} of your own cards to your starter deck in dungeons.</div>` : '';
    const unl = fresh.length ? `<div class="newvault"><b>Unlocked:</b> ${fresh.map(id => esc(RB.COSMETICS[id].name)).join(', ')} — find it in the Vault.</div>` : '';
    const el = U.show('end', `<div class="endscreen ${win ? '' : 'lose'}"><h2>${win ? 'Dungeon cleared' : 'The party has fallen'}</h2><p class="tagline">${win ? `${esc(d.boss)} is defeated on ${mode.name}.` : `${esc(d.short)} still stands with ${Math.max(0, E.bossHp())} health.`}</p>${stats}
      <div class="goldbox"><div class="gtitle">+${xp} Dungeon XP · +${gold.total} gold</div><div class="gparts"><span>Dungeon level <b>${after}</b></span><span>Total XP <b>${save.dxp}</b></span><span>Gold <b>${save.gold}</b></span></div></div>${lvlUp}${unl}
      <div class="menu" style="flex-direction:row;justify-content:center">${cfg.online ? `<button class="btn primary" data-act="lobby">Back to the party lobby</button>` : `<button class="btn primary" data-act="again">${win ? 'Next dungeon' : 'Try again'}</button><button class="btn" data-act="dun">Dungeons</button>`}<button class="btn" data-act="market">Market</button><button class="btn ghost" data-act="title">Title</button></div></div>`);
    el.onclick = e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'again') { if (win) { const ids = Object.keys(RB.DUNGEONS); st.id = ids[(ids.indexOf(d.id) + 1) % ids.length]; return U.dungeons(); } return U.startDungeon(); }
      if (a.dataset.act === 'dun') return U.dungeons();
      if (a.dataset.act === 'lobby') return U.online();
      if (a.dataset.act === 'market') return U.market();
      if (a.dataset.act === 'title') return U.title();
    };
  };
})(globalThis.RB);
