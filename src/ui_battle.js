/* RAIDBOUND — the battle table */
(function (RB) {
  const U = RB.UI, C = RB.CARDS, TK = RB.TOKENS, BC = RB.BOSSCARDS, HE = RB.HEROES;
  const { $, $$, esc } = U;
  const save = U.save;
  let E = null, root = null, cfgLast = null;
  const view = { mode: null, lock: 0, dirty: false, raf: 0, busy: false, focus: 0, hpGhost: null };
  // #70: online games share one speed, and a screen that falls behind plays fast until it catches up
  const speed = () => (net && view.netSpeed) || save.settings.speed || 1;
  const pace = () => net && net.behind && net.behind() ? Math.min(speed(), 0.2) : speed();
  const wait = ms => new Promise(r => setTimeout(r, (net && net.replaying) ? 0 : ms * pace()));
  const nextSpeed = s => s === 1 ? 0.55 : s > 0.3 ? 0.15 : 1;
  const speedName = () => (speed() === 1 ? 'normal' : speed() < 0.3 ? 'very fast' : 'fast') + (net ? ' (everyone)' : '');
  function changeSpeed() { if (net) return net.send({ t: 'speed', v: nextSpeed(speed()) }); const s = save.settings; s.speed = nextSpeed(s.speed || 1); U.persist(); render(); }

  /* ---------- rendering ---------- */
  function schedule() { if (view.lock > 0) { view.dirty = true; return; } if (!view.raf) view.raf = requestAnimationFrame(() => { view.raf = 0; render(); }); }
  function flush() { if (view.raf) { cancelAnimationFrame(view.raf); view.raf = 0; } render(); view.dirty = false; }
  let net = null; // online co-op link (#29), null when playing on one computer
  const human = p => p && !p.auto && (!net || net.mine(p.idx));
  const myTurn = () => E && E.g.phase === 'main' && human(E.g.players[E.g.turn]) && !view.busy && !E.g.over;
  const fp = () => E.g.players[view.focus] || E.g.players[0];
  // #37: whose eyes is this screen? Only that hero's hand is ever shown face up.
  function viewerIdx() {
    const g = E.g;
    if (g.cfg.bossPlayer) return -1;
    if (net) return g.cfg.party.findIndex(s => s.owner === net.id);
    const humans = g.players.filter(q => !q.auto);
    if (!humans.length) return -1;
    if (view.lastHuman == null || !g.players[view.lastHuman] || g.players[view.lastHuman].auto) view.lastHuman = humans[0].idx;
    return view.lastHuman;
  }
  const localHumans = () => net ? 1 : E.g.players.filter(q => !q.auto).length;
  const seesHand = q => q && q.idx === viewerIdx() && view.curtain == null;
  const homeFocus = () => { const v = viewerIdx(); return v >= 0 ? v : E.g.turn; };

  function unitHTML(kind, o) {
    // o: {ref, name, img, atk, hp, max, kws:[], cls:[], buffA, title}
    const kwI = { protector: 'B', ferocity: 'S', longrange: 'V', skyward: '⇡', elusive: '◐', guardian: 'G', unique: 'U', ambush: 'A', crushing: 'C', frenzy: 'F', thickhide: 'T', tend: '+' };
    return `<div class="unit ${kind === 'minion' ? 'minion' : ''} ${o.cls.join(' ')}" data-ref="${o.ref}" data-kind="${kind}" ${o.p != null ? `data-p="${o.p}"` : ''} style="${o.uc ? '--uc:' + o.uc : ''}" tabindex="0" aria-label="${esc(o.name)}, ${o.atk} attack, ${o.hp} health">
      <img alt="" src="${o.img}"><div class="kws">${o.kws.filter(k => k !== 'unique').map(k => `<i title="${RB.KEYWORDS[k][0]}: ${esc(RB.KEYWORDS[k][1])}">${kwI[k]}</i>`).join('')}</div>
      <div class="un">${esc(o.name)}</div><div class="ua ${o.buffA ? 'buff' : ''}">${o.atk}</div><div class="uh ${o.hp < o.max ? 'hurt' : o.buffH ? 'buff' : ''}">${o.hp}</div></div>`;
  }
  const facColor = { concord: '#5a7ad0', clans: '#c0482a', neutral: '#9a7a44' };

  function render() {
    if (!E || !root) return;
    const g = E.g, B = g.boss, raid = g.raid;
    const p = fp();
    const active = g.players[g.turn];
    const canAct = myTurn() && p === active && view.curtain == null;
    const valid = new Set((view.mode ? view.mode.valid : []).map(E.refId));
    const tcls = ref => valid.has(ref) ? (view.mode.friendly ? ' friendly-t' : ' targetable') : '';
    // boss
    const hpPct = Math.max(0, E.bossHp()) / B.maxHp * 100;
    if (view.hpGhost == null) view.hpGhost = hpPct;
    const ticks = (raid.phases || []).map((ph, i) => `<span class="tick ${B.phasesDone.includes(i) ? 'done' : ''}" style="left:${ph.at * 100}%" title="${esc(ph.name)} at ${Math.round(ph.at * 100)}%: ${esc(ph.text)}"><i></i></span>`).join('');
    const phaseLbls = (raid.phases || []).map((ph, i) => `<span class="${B.phasesDone.includes(i) ? 'done' : ''}" style="left:${ph.at * 100}%" title="${esc(ph.text)}">${esc(ph.name)}</span>`).join('');
    // #48: flash the bar when the boss is hurt (red) or healed (green)
    const bhp = Math.max(0, E.bossHp());
    if (view.lastBossHp != null && bhp !== view.lastBossHp) { view.barFx = bhp < view.lastBossHp ? 'hit' : 'healfx'; view.barFxUntil = Date.now() + 650; clearTimeout(view.barFxT); view.barFxT = setTimeout(() => { const b = root && root.querySelector('.bossbar'); if (b) b.classList.remove('hit', 'healfx'); }, 680); }
    view.lastBossHp = bhp;
    const barFx = view.barFxUntil > Date.now() ? view.barFx : '';
    const counter = raid.counter ? `<span class="counter" title="${esc(raid.rules[0].text)}">${esc(raid.counter.name)} ${Array.from({ length: raid.counter.max }, (_, i) => `<i class="${i < B.counter ? 'on' : ''}"></i>`).join('')}</span>` : '';
    const events = B.events.map(e => `<span class="evt" data-bc="${e.id}" title="${esc(BC[e.id].text)}"><b>${esc(BC[e.id].name)}</b> · ${e.turns} round${e.turns > 1 ? 's' : ''}</span>`).join('');
    const mark = B.mark ? `<span class="evt" style="background:rgba(120,60,10,.5)"><b>Marked</b> +${B.mark.amount} damage taken</span>` : '';
    const stun = B.stunned ? `<span class="evt" style="background:rgba(120,110,10,.5)"><b>Stunned</b> · skips next strike</span>` : '';
    const minions = B.minions.map(m => {
      const d = TK[m.id];
      return unitHTML('minion', { ref: m.uid, name: d.name, img: U.cardArt(m.id), atk: E.minAtk(m), hp: E.minMax(m) - m.damage, max: E.minMax(m), kws: d.kw || [], buffA: m.atkB > 0, buffH: m.hpB > 0, cls: [(d.kw || []).includes('guardian') ? 'guardian' : '', m.ex ? '' : '', m.stunned ? 'stunned' : '', m.sick && g.phase !== 'boss' ? '' : '', tcls(m.uid)] });
    });
    // #48: minions flank the boss — first one on the right, then left, then right…
    const minR = minions.filter((x, i) => i % 2 === 0), minL = minions.filter((x, i) => i % 2 === 1);
    const strike = E.strikeNow ? E.strikeNow() : g.raid.strike + B.strikeBonus + g.partyFury;
    // #101 Omens: the next three wait face up beside the boss
    const omenStrip = raid.omens && B.omens && B.omens.length ? (() => {
      const nx = E.nextOmenRound(), when = nx == null ? '' : nx === g.round ? (g.phase === 'boss' ? 'now' : 'this boss turn') : nx === g.round + 1 ? 'next round' : `in ${nx - g.round} rounds`;
      const ev = E.omenEvery(), every = ev === 1 ? 'every boss turn' : ev === 2 ? 'every other boss turn' : 'every third boss turn';
      return `<span class="omens" title="Omens come ${every}. The next three are shown here, the left one first.${when ? ' Next one: ' + when + '.' : ''}"><small>Omens${when ? ` · ${when}` : ''}</small>${B.omens.slice(-3).reverse().map((id, i) => `<span class="om ${i === 0 ? 'next' : ''} ${BC[id].soak ? 'soak' : ''}" data-bc="${id}" title="${esc(BC[id].name + ': ' + BC[id].text)}"><img alt="" src="${U.cardArt(id)}"><b>${esc(BC[id].name)}</b></span>`).join('')}</span>`;
    })() : '';
    // #102 Wings of Flame: the boss is in the air — fill the Ground bar to bring it down
    const flight = B.flying && raid.flight ? `<span class="chip flying" title="${esc(raid.short)} is in the air. Only Volley and Skyward attackers, and abilities, can reach him. The ones that can are glowing. Deal ${B.groundMax} damage to bring him crashing down (he is stunned when he lands). Otherwise he lands by himself after ${raid.flight.turns} boss turns."><b>⇡ In the air</b><span class="gbar"><i style="width:${Math.min(100, B.ground / Math.max(1, B.groundMax) * 100)}%"></i></span>Ground ${B.ground}/${B.groundMax} · lands in ${Math.max(1, raid.flight.turns - B.flyTurns)}</span>` : '';
    // player
    const hd = E.pdef(p), dead = p.hero.dead;
    const heroAtk = E.heroAtk(p) + (p.weapon && !p.weapon.ex ? C[p.weapon.c.id].atk : 0);
    const heroCan = canAct && E.canAttackWith(p, 'hero');
    // #112: while the boss is in the air, light up whatever can reach him and dim the rest
    const airborne = !!(B.flying && raid.flight && !g.over);
    const reachCls = can => airborne ? (can ? ' reach' : ' noreach') : '';
    const heroReach = !!(p.weapon && (C[p.weapon.c.id].kw || []).includes('longrange'));
    const tags = [p.hero.taunt && 'Taunt', p.hero.elusive && 'Shrouded', p.hero.tempAtk && `+${p.hero.tempAtk} ATK`, p.hero.master && 'Master'].filter(Boolean).map(t => `<span>${t}</span>`).join('');
    const petImg = p.hero.pet && RB.COSMETICS[p.hero.pet] && U.cosImg(p.hero.pet) ? `<div class="petspot"><img class="pet" alt="${esc(RB.COSMETICS[p.hero.pet].name)}" src="${U.cosImg(p.hero.pet)}" title="${esc(RB.COSMETICS[p.hero.pet].name + (RB.PET_PERKS && RB.PET_PERKS[p.hero.pet] && !g.cfg.bossPlayer ? ': ' + RB.PET_PERKS[p.hero.pet].text : ''))}"></div>` : '';
    const pw = HE[p.heroId].power;
    const powerBtn = p.hero.master ? `<button class="btn small ghost powerbtn used" disabled><b>Master Hero</b>Original power set aside</button>` :
      `<button class="btn small powerbtn ${p.hero.powerUsed ? 'used' : ''}" data-act="power" ${p.hero.powerUsed || !canAct ? 'disabled' : ''} title="${esc(pw.text)}"><b>${esc(pw.name)}</b>${p.hero.powerUsed ? 'Used' : 'Once per game'}</button>`;
    const heroCard = `<div class="herocard ${p.hero.ex ? 'ex' : ''} ${dead ? 'dead' : ''} ${heroCan && !view.mode ? 'can' : ''}${tcls('hero' + p.idx)}${dead ? '' : reachCls(heroReach)}" data-ref="hero${p.idx}" data-act="hero" tabindex="0" aria-label="${esc(hd.name)}, ${E.heroHp(p)} health">
      <img alt="" src="${U.cardArt(p.hero.master || p.heroId)}"><div class="tags">${tags}</div>
      ${heroAtk > 0 ? `<div class="hatk" title="Attack with weapon">${heroAtk}</div>` : ''}<div class="hhp ${E.heroHp(p) <= 8 ? 'low' : ''}">${Math.max(0, E.heroHp(p))}</div>${p.hero.shield ? `<div class="shield" title="Ward: prevents the next ${p.hero.shield} damage">◈ ${p.hero.shield}</div>` : ''}
      <div class="hn"><b>${esc(hd.name)}</b><small>${HE[p.heroId].race} ${RB.CLASSES[HE[p.heroId].cls].name} · ${E.heroMax(p)} max HP</small></div></div>${powerBtn}${petImg}`;
    const gslot = (e, label, val, act, can) => e ? `<div class="gslot has ${e.ex ? 'ex' : ''} ${can ? 'can' : ''}" data-act="${act}" data-gid="${e.c.uid}" data-card="${e.c.id}"><img alt="" src="${U.cardArt(e.c.id)}"><span class="gn"><b>${esc(C[e.c.id].name)}</b>${label}</span><span class="gv">${val}</span></div>` : '';
    let gear = p.weapon ? gslot(p.weapon, `Strike ${C[p.weapon.c.id].strike}${p.weapon.ex ? ' · used' : ''}`, '⚔ ' + C[p.weapon.c.id].atk, 'weapon', false) : `<div class="gslot">No weapon</div>`;
    for (const slot of Object.keys(RB.SLOTS)) if (p.armor[slot]) { const d = C[p.armor[slot].c.id]; gear += gslot(p.armor[slot], `${RB.SLOTS[slot]} · pay ${d.use}${p.armor[slot].ex ? ' · used' : ''}`, '⛨ ' + d.def, 'armor', false); }
    for (const it of p.items) { const d = C[it.c.id]; gear += gslot(it, d.use ? (it.ex ? 'Used this turn' : (U.isPhone() ? 'Tap to use' : 'Click to use')) : 'Item', d.use ? (d.use.cost ? d.use.cost + '◆' : '') : '', 'item', canAct && E.itemReady(p, it)); }
    if (!Object.keys(p.armor).length && !p.items.length) gear += `<div class="gslot">No armor or items</div>`;
    const resOrder = p.res.map((r, i) => i).sort((a, b) => ((p.res[a].quest || p.res[a].loc) ? 1 : 0) - ((p.res[b].quest || p.res[b].loc) ? 1 : 0));
    const resCards = resOrder.map(i => { const r = p.res[i];
      const d = C[r.c.id];
      if (r.quest || r.loc) { const can = canAct && (r.quest ? E.questReady(p, r) : E.locationReady(p, r)); return `<div class="rcard ${r.ex ? 'ex' : ''}" data-act="res" data-ri="${i}" data-card="${r.c.id}"><div class="mini ${r.loc ? 'loc' : ''} ${r.done ? 'done' : ''} ${can ? 'can' : ''}" title="${esc(d.name)}"><img alt="" src="${U.cardArt(r.c.id)}"><span class="q">${r.done ? 'Completed' : esc(d.name)}</span></div></div>`; }
      return `<div class="rcard ${r.ex ? 'ex' : ''}" title="${r.ex ? 'Exhausted resource' : 'Ready resource'}"><div class="cardback"></div></div>`;
    }).join('') + (p.tempRes ? `<div class="rcard"><div class="temp" title="Extra resources this turn">+${p.tempRes}</div></div>` : '');
    const allies = p.allies.map(a => {
      const d = E.allyDef(a), can = canAct && E.canAttackWith(p, a);
      return unitHTML('ally', { ref: a.uid, p: p.idx, name: d.name, img: U.cardArt(a.id), atk: E.allyAtk(p, a), hp: E.allyMax(p, a) - a.damage, max: E.allyMax(p, a), kws: (d.kw || []).concat(E.allyKw(p, a, 'ferocity') && !(d.kw || []).includes('ferocity') ? ['ferocity'] : []), buffA: a.atkB + a.tmp > 0, buffH: a.hpB > 0, uc: facColor[d.fac || 'neutral'], cls: [a.ex ? 'ex' : '', a.sick ? 'sick' : '', a.frozen ? 'frozen' : '', can && !view.mode ? 'can' : '', tcls(a.uid), reachCls(E.volleyAttack(p, a)).trim()] });
    }).join('') || `<span class="empty">${dead ? 'Fallen.' : 'No allies yet. Play ally cards to build your party.'}</span>`;
    // hand
    const n = p.hand.length, mid = (n - 1) / 2;
    const showHand = seesHand(p);
    const hand = !showHand ? p.hand.map((c, i) => `<div class="hc back" style="transform:rotate(${((i - mid) * 3).toFixed(1)}deg) translateY(${(Math.abs(i - mid) * 5).toFixed(0)}px)"><div class="cardback"></div></div>`).join('') : p.hand.map((c, i) => { const ok = canAct && (E.canPlay(p, c).ok || (!p.resPlayed)); const playable = canAct && E.canPlay(p, c).ok; const hd2 = C[c.id] || {}, hk = hd2.kw || [], handReach = airborne && (hd2.type === 'ally' || hd2.type === 'weapon') && (hk.includes('longrange') || hk.includes('skyward'));
      return `<div class="hc ${playable ? 'play' : ''}${handReach ? ' reach' : ''}" data-uid="${c.uid}" style="transform:rotate(${((i - mid) * 3).toFixed(1)}deg) translateY(${(Math.abs(i - mid) * 5).toFixed(0)}px)" tabindex="0">${U.cardHTML(c.id, { holo: c.holo })}</div>`; }).join('');
    const status = g.over ? '' : g.cfg.bossPlayer ? (g.phase === 'boss' ? `Your turn, ${esc(raid.short)}. Choose your cards and targets.` : `You are ${esc(raid.short)}. ${esc(E.pdef(active).name)} is taking a turn…`) : g.phase === 'boss' ? `${esc(raid.short)} is acting…` : !human(active) ? (net && !active.auto ? `${esc(E.g.cfg.party[active.idx].name || E.pdef(active).name)} is taking their turn…` : `${esc(E.pdef(active).name)} (AI) is acting…`) : view.busy ? 'Resolving…' : p.resPlayed ? 'Resource played this turn.' : 'You may play one card as a resource.';
    // roster
    const vIdx = viewerIdx();
    const roster = g.players.map(q => {
      const qd = E.pdef(q), pct = Math.max(0, E.heroHp(q)) / E.heroMax(q) * 100;
      const chips = q === p ? '' : q.allies.map(a => `<span class="rchip${tcls(a.uid)}" data-ref="${a.uid}" title="${esc(E.allyDef(a).name)}">${esc(E.allyDef(a).name.split(' ')[0])} ${E.allyAtk(q, a)}/${E.allyMax(q, a) - a.damage}</span>`).join('');
      const gearIcons = [q.weapon, ...Object.values(q.armor), ...q.items].filter(Boolean).map(e => `<img class="rgear" alt="" src="${U.cardArt(e.c.id)}" data-card="${e.c.id}">`).join('');
      const backs = `<span class="rhand" title="${q.hand.length} cards in hand${q.idx === vIdx ? '' : ' (hidden)'}">${'<i></i>'.repeat(Math.min(q.hand.length, 10))}<b>${q.hand.length}</b></span>`;
      const played = ((view.played || {})[q.idx] || []).map(c => `<img class="rplay ${c.holo ? 'holo' : ''}" alt="" src="${U.cardArt(c.id)}" data-card="${c.id}">`).join('');
      const tag = (q.idx === vIdx ? ' <span class="youtag">You</span>' : q.auto ? ' <span class="aitag">AI</span>' : '') + (raid.dungeon && g.boss.marked === q.idx && g.phase === 'boss' ? ' <span class="marktag">🎯 Marked</span>' : '');
      const who = net && E.g.cfg.party[q.idx].name ? `<div class="rplayer">${esc(E.g.cfg.party[q.idx].name)}</div>` : '';
      return `<div class="rmember ${q === active && g.phase !== 'boss' ? 'active' : ''} ${q.hero.dead ? 'dead' : ''} ${q === p ? 'viewing' : ''}" data-focus="${q.idx}" title="Click to look at ${esc(qd.name)}'s side of the table"><img class="herochip${q === p ? '' : tcls('hero' + q.idx)}" ${q === p ? '' : `data-ref="hero${q.idx}"`} alt="" src="${U.cardArt(q.hero.master || q.heroId)}"><div class="rbody"><div class="rn">${esc(qd.name)}${tag}</div>${who}<div class="rbar"><i style="width:${pct}%"></i><span>${Math.max(0, E.heroHp(q))}/${E.heroMax(q)}</span></div>
        <div class="rmeta">${backs}${q.hero.shield ? `<span class="rward">◈ ${q.hero.shield}</span>` : ''}<span>threat ${q.threat}</span>${gearIcons ? `<span class="rgears">${gearIcons}</span>` : ''}</div>
        ${chips ? `<div class="rchips">${chips}</div>` : ''}${played ? `<div class="rplayed"><small>Played this turn</small>${played}</div>` : ''}</div></div>`;
    }).join('');
    const logHTML = g.log.slice(-120).map(e => `<div class="${e.cls}">${esc(e.msg)}</div>`).join('');

    morph(root, `<div class="table">
      <div class="topbar"><span class="raidname">${esc(raid.name)}</span><span class="round">Round ${g.round}${g.cfg.difficulty === 'heroic' ? ' · Heroic' : ''}</span><span class="sp"></span>
        <button class="btn small ghost narrow-only drawerbtn" data-act="drawer" aria-label="Party and raid log">👥 Party</button><button class="btn small ghost phone-only menubtn" data-act="menu" aria-label="Menu">☰</button>
        <span class="bossdeck wide-only" title="Cards left in the boss deck">Boss deck ${B.deck.length} · discard ${B.grave.length}</span>
        <button class="btn small ghost wide-only" data-act="speed" title="${net ? 'Animation speed for everyone in this game' : 'Animation speed'}">Speed: ${speedName()}</button><button class="btn small ghost iconbtn wide-only" data-act="mute" title="${save.settings.muted ? 'Unmute (M)' : 'Mute all sound (M)'}" aria-label="${save.settings.muted ? 'Unmute' : 'Mute'}">${save.settings.muted ? '🔇' : '🔊'}</button><button class="btn small ghost wide-only" data-act="soundpop" title="Sound volume">Volume</button><button class="btn small ghost wide-only" data-act="rulesref">Rules</button><button class="btn small ghost wide-only" data-act="quit">Leave raid</button></div>
      <div class="bossarea ${raid.id}" style="--bt:${raid.theme || '#ff7a4a'}">
        <div class="bossbar ${barFx}">
          <div class="bbname"><i class="orn"></i><b>${esc(raid.short)}</b><span>${esc(raid.boss.split(', ')[1] || raid.name)}</span>${g.cfg.difficulty === 'heroic' ? '<em>Heroic</em>' : ''}<span class="bhp" title="${bhp} of ${B.maxHp} health (${Math.ceil(hpPct)}%)"><i>❤</i><b>${bhp}</b><small>/ ${B.maxHp}</small></span><i class="orn r"></i></div>
          <div class="hpframe"><span class="cap"></span><div class="hpbar" role="progressbar" aria-label="${esc(raid.short)} health" aria-valuemin="0" aria-valuemax="${B.maxHp}" aria-valuenow="${bhp}"><div class="ghost" style="width:${view.hpGhost}%"></div><div class="fill" style="width:${hpPct}%"></div><div class="gloss"></div>${ticks}</div><span class="cap r"></span></div>
          ${phaseLbls ? `<div class="phaselbls">${phaseLbls}</div>` : ''}
          <div class="bossrow">${raid.dungeon ? `${raid.stages ? (() => { const st = raid.stages[B.stage], nx = raid.stages[B.stage + 1]; return `<span class="chip dstage" title="${esc(nx ? `Next: ${nx.boss}` : 'The master of this dungeon')}">${B.stage < raid.stages.length - 1 ? `Under-boss ${B.stage + 1} of 2` : 'Final boss'}</span>${st.rule ? `<span class="chip drule" title="${esc(st.rule.text)}">✦ ${esc(st.rule.name)}</span>` : ''}`; })() : ''}<span class="chip dlevel" title="${raid.stages ? 'The dungeon levels up each time an under-boss falls' : 'The dungeon levels up at 70% and 40% health'}">Level ${B.level} · flips ${E.flipCount()}</span>${E.markedHero() && g.phase === 'boss' ? `<span class="chip dmark">🎯 ${esc(E.pdef(E.markedHero()).name.split(/[ ,]/)[0])} is marked</span>` : ''}${(B.equip || []).map(n => `<span class="chip dequip" title="Dungeon equipment">⚒ ${esc(n)}</span>`).join('')}` : ''}${counter}<span class="chip ${B.tempStrike ? 'hot' : ''}" title="The boss strikes the hero with the most threat at the end of its turn${B.tempStrike ? ` (${B.tempStrike} extra from an omen this turn)` : ''}">⚔ Strike ${strike}</span>${flight}${B.enrage ? `<span class="chip guard" title="From round ${RB.ENRAGE_ROUND} the boss strikes 1 harder every round, and Bulwark allies can't intercept its strikes">🔥 Enraged +${B.enrage}</span>` : ''}<span class="chip" title="Melee attackers take this much damage back">✦ Retaliation ${raid.retaliation}</span>${E.guardians().length ? '<span class="chip guard">⛨ Guarded — defeat the Guardian first</span>' : ''}${events}${mark}${stun}</div>
          ${omenStrip ? `<div class="omenrow">${omenStrip}</div>` : ''}
        </div>
        <div class="bossstage">
          <div class="minions left" style="--mn:${minL.length}">${minL.join('')}</div>
          <div class="bosscard${tcls('boss')}" data-ref="boss" tabindex="0" aria-label="${esc(raid.boss)}, ${E.bossHp()} health"><img alt="" src="${U.art(raid.art, raid.stages ? 'stage:' + raid.id + '-' + B.stage : 'raid:' + raid.id)}"><div class="bframe"></div><div class="bn"><b>${esc(raid.short)}</b><span>${B.minions.length ? `${B.minions.length} minion${B.minions.length > 1 ? 's' : ''} at its side` : 'Stands alone'}</span></div></div>
          <div class="minions right" style="--mn:${minR.length}">${minR.join('')}</div>
        </div>
        ${(view.bossPlayed || []).length && view.bossRound === g.round ? `<div class="bossplayed"><small>${esc(raid.short)} played this round:</small>${view.bossPlayed.map(id => `<span class="bpc" data-bc="${id}">${esc(BC[id].name)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="playerzone">${vIdx >= 0 && p.idx !== vIdx ? `<div class="viewbar">Looking at <b>${esc(E.pdef(p).name)}</b>'s side of the table. Their hand stays hidden. <button class="btn small" data-focus="${vIdx}">Back to my hero</button></div>` : ''}<div class="herocol"><div style="width:clamp(150px,13vw,200px)">${heroCard}</div><div class="gearcol">${gear}</div></div>
        <div class="restray"><span class="lbl">Resources</span><span class="avail" title="Ready resources / total">${E.available(p)}<small style="font-size:.6em;color:var(--muted)">/${p.res.length + p.tempRes}</small></span>${resCards}</div>
        <div class="allies">${allies}</div></div>
      <div class="handbar">${g.cfg.bossPlayer ? `<div class="hand bosshand">${(B.hand || []).map((id, k, arr) => `<div class="hc bosshc" data-bc="${id}" style="transform:rotate(${((k - (arr.length - 1) / 2) * 3).toFixed(1)}deg)">${U.cardHTML(id)}</div>`).join('') || '<div class="handnote">Your boss cards arrive on your turn</div>'}<div class="bhlabel">${esc(raid.short)}\'s hand</div>` : `<div style="${view.ov ? '--ov:' + view.ov : ''}" class="hand ${p === active && human(p) && showHand ? '' : 'other'} ${showHand ? '' : 'hidden'}">${hand}${!showHand && view.curtain == null ? `<div class="handnote">${esc(E.pdef(p).name)}'s hand · ${p.hand.length} card${p.hand.length === 1 ? '' : 's'} · hidden</div>` : ''}`}</div>
        ${view.curtain != null && view.curtain === p.idx ? `<div class="curtain"><b>${esc(E.pdef(p).name)}'s turn</b><span>Pass the computer to ${esc(E.pdef(p).name)}'s player. Everyone else, look away!</span><button class="btn primary" data-act="reveal">Show my hand</button></div>` : ''}
        <div class="turnctl ${g.cfg.bossPlayer ? 'bossmode' : ''}"><button class="btn primary" data-act="end" ${canAct ? '' : 'disabled'}>End turn</button><button class="btn" data-act="auto" ${canAct ? '' : 'disabled'} title="Let the AI finish this turn for you">Auto-play turn</button>${raid.bail && !g.cfg.bossPlayer ? `<button class="btn bailbtn" data-act="bail" ${canAct && E.canBail(p) ? '' : 'disabled'} title="Pay ${raid.bail.cost} resource to lower the ${esc(raid.counter.name)} by 1. Once per turn.">🪣 Bail water (${raid.bail.cost}◆)</button>` : ''}<div class="hint">${status}</div></div></div>
      ${view.mode ? `<div class="tbar ${view.mode.friendly ? 'friendly' : ''}">${esc(view.mode.label)} <button class="btn small ghost" data-act="cancel" style="margin-left:.6rem">Cancel</button></div>` : ''}
    </div>
    <div class="side"><div class="roster"><h5>Party<button class="btn small ghost narrow-only drawerx" data-act="drawer">✕ Close</button></h5>${roster}</div><div class="logbox"><h5>Raid log</h5><div class="log" aria-live="polite">${logHTML}</div></div></div>`);
    root.classList.toggle('drawer', !!view.drawer);
    const lb = $('.logbox', root); if (lb) lb.scrollTop = lb.scrollHeight;
    const hEl = $('.hand', root);
    if (hEl && n && !g.cfg.bossPlayer && hEl.querySelector('.hc')) { const hc = hEl.querySelector('.hc'); const cw = hc.offsetWidth || 140; const room = hEl.clientWidth - cw * 0.5; const ov = Math.min(-cw * 0.12, (room - n * cw) / (2 * n)); view.ov = Math.max(-cw * 0.42, ov) + 'px'; hEl.style.setProperty('--ov', Math.max(-cw * 0.42, ov) + 'px'); }
    if (view.hpGhost !== hpPct) setTimeout(() => { view.hpGhost = hpPct; const gh = $('.hpbar .ghost', root); if (gh) gh.style.width = hpPct + '%'; }, 30);
  }

  // #33: update the battle screen in place instead of rebuilding it, so cards and pictures
  // that didn't change are left alone (no flicker or "puffing" when many things heal at once)
  const tpl = document.createElement('template');
  function morph(target, html) {
    if (!target.firstChild) { target.innerHTML = html; return; }
    tpl.innerHTML = html;
    patchKids(target, tpl.content);
  }
  function patchKids(a, b) {
    const ak = [...a.childNodes], bk = [...b.childNodes];
    for (let i = 0; i < bk.length; i++) {
      const x = ak[i], y = bk[i];
      if (!x) { a.appendChild(y); continue; }
      patchNode(a, x, y);
    }
    for (let i = bk.length; i < ak.length; i++) ak[i].remove();
  }
  function patchNode(parent, x, y) {
    if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName || (x.nodeType === 1 && x.dataset.uid !== y.dataset.uid) || (x.nodeType === 1 && x.getAttribute('data-ref') !== y.getAttribute('data-ref'))) { parent.replaceChild(y, x); return; }
    if (x.nodeType === 3 || x.nodeType === 8) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; return; }
    if (x.isEqualNode(y)) return;
    for (const at of [...x.attributes]) if (!y.hasAttribute(at.name)) x.removeAttribute(at.name);
    for (const at of [...y.attributes]) if (x.getAttribute(at.name) !== at.value) x.setAttribute(at.name, at.value);
    if (x.nodeName === 'IMG' || x.nodeName === 'INPUT') return;
    patchKids(x, y);
  }

  /* ---------- animations (engine hooks) ---------- */
  function elFor(ref) { return root && root.querySelector(`[data-ref="${ref}"]`); }
  function floater(ref, text, cls) {
    const el = elFor(ref); if (!el) return;
    const r = el.getBoundingClientRect();
    const f = document.createElement('div'); f.className = 'floater ' + cls; f.textContent = text;
    f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height * 0.4) + 'px';
    document.body.appendChild(f); setTimeout(() => f.remove(), 1200);
  }
  function banner(text, kind, sub, ms) {
    const b = document.createElement('div'); b.className = 'banner ' + (kind || '');
    b.innerHTML = `<span>${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>`;
    b.style.animationDuration = (ms || 1500) * pace() + 'ms';
    document.body.appendChild(b); setTimeout(() => b.remove(), (ms || 1500) * pace() + 50);
  }
  function reveal(html, ms, onTop, who) {
    const o = document.createElement('div'); o.className = 'overlay clear'; o.innerHTML = `<div class="reveal">${who ? `<div class="who">${esc(who)}</div>` : ''}${html}</div>`;
    document.body.appendChild(o);
    return wait(ms).then(() => o.remove());
  }
  // #40: a card someone else played shrinks into their row in the Party panel
  function flyToRoster(id, pi) {
    const tgt = root && root.querySelector(`.rmember[data-focus="${pi}"]`); if (!tgt) return;
    const r = tgt.getBoundingClientRect(), f = document.createElement('div');
    f.className = 'flycard'; f.innerHTML = U.cardHTML(id);
    document.body.appendChild(f);
    const fr = f.getBoundingClientRect();
    f.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(${r.left + r.width * 0.75 - innerWidth / 2 - fr.width / 2}px, ${r.top + r.height / 2 - innerHeight / 2 - fr.height / 2}px) scale(.12)`, opacity: .2 }], { duration: Math.max(150, 520 * speed()), easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' }).onfinish = () => f.remove();
  }
  async function anim(type, d) {
    if (net && net.replaying) { schedule(); return; }
    if (!root) return;
    if (type !== 'death' && type !== 'heroDeath') flush();
    view.lock++;
    try {
      switch (type) {
        case 'dmg': { U.sfx.hit(d.amount); floater(d.ref, '-' + d.amount, 'dmg'); const el = elFor(d.ref); if (el) { el.classList.remove('hitflash'); void el.offsetWidth; el.classList.add('hitflash'); } await wait(420); break; }
        case 'heal': { U.sfx.heal(); floater(d.ref, '+' + d.amount, 'heal'); const el = elFor(d.ref); if (el) el.classList.add('healflash'); await wait(380); break; }
        case 'shield': case 'armor': U.sfx.block(); floater(d.ref, (type === 'armor' ? '⛨ ' : '◈ ') + d.amount + ' blocked', 'block'); await wait(320); break;
        case 'attack': {
          U.sfx.swing();
          const a = elFor(d.from), t = elFor(d.to);
          if (a && t) {
            const ra = a.getBoundingClientRect(), rt = t.getBoundingClientRect();
            const x1 = ra.left + ra.width / 2, y1 = ra.top + ra.height / 2, x2 = rt.left + rt.width / 2, y2 = rt.top + rt.height / 2;
            const line = document.createElement('div'); line.className = 'attackline';
            line.style.left = x1 + 'px'; line.style.top = y1 + 'px'; line.style.width = Math.hypot(x2 - x1, y2 - y1) + 'px'; line.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;
            document.body.appendChild(line); setTimeout(() => line.remove(), 420);
            if (a.animate) a.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${(x2 - x1) * 0.35}px,${(y2 - y1) * 0.35}px) scale(1.08)` }, { transform: 'translate(0,0)' }], { duration: 380 * speed(), easing: 'ease-in-out' });
          }
          await wait(380); break;
        }
        case 'death': { U.sfx.death(); const el = elFor(d.ref); if (el) el.classList.add('dying'); await wait(450); break; }
        case 'heroDeath': { U.sfx.heroDeath(); banner(E.pdef(E.g.players[+d.ref.replace('hero', '')]).name + ' has fallen', 'boss', null, 1600); await wait(1200); break; }
        case 'summon': { U.sfx.summon(); const el = elFor(d.ref); if (el && el.animate) el.animate([{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1 }, { transform: 'none' }], { duration: 320 * speed() }); await wait(260); break; }
        case 'play': { if (C[d.id] && C[d.id].type === 'ability') U.sfx.spell(); else U.sfx.card();
          view.played = view.played || {}; (view.played[d.p] = view.played[d.p] || []).push({ id: d.id, holo: d.holo });
          const q = E.g.players[d.p], other = !human(q) || q.idx !== viewerIdx();
          const who = other ? (q.auto ? E.pdef(q).name + ' (AI)' : (E.g.cfg.party[q.idx].name && net ? E.g.cfg.party[q.idx].name + ' · ' : '') + E.pdef(q).name) + ' plays' : null;
          if (speed() > 0.2 || other) { await reveal(U.cardHTML(d.id, { holo: d.holo }), other ? 1700 : 800, null, who); if (other) flyToRoster(d.id, d.p); }
          break; }
        case 'bossCard': { U.sfx.bossReveal(); if (view.bossRound !== E.g.round) { view.bossRound = E.g.round; view.bossPlayed = []; } view.bossPlayed.push(d.id); await reveal(U.cardHTML(d.id), 2600, null, E.raid.short + ' plays'); break; }
        case 'omen': { U.sfx.bossReveal(); await reveal(U.cardHTML(d.id), 2400, null, 'Omen'); break; }
        case 'phase': U.sfx.phase(E.raid.id); banner(d.name, 'boss', d.text, 2600); await wait(2200); break;
        case 'turn': { const p = E.g.players[d.p];
          if (!p.auto && !net && !E.g.cfg.bossPlayer) { if (localHumans() > 1 && view.lastHuman !== d.p) view.curtain = d.p; view.lastHuman = d.p; }
          view.focus = (net || E.g.cfg.bossPlayer) ? (viewerIdx() >= 0 ? viewerIdx() : d.p) : p.auto ? homeFocus() : d.p; view.played = view.played || {}; view.played[d.p] = []; flush(); if (E.g.players.length > 1 || E.g.round === 1) { banner(E.g.players.length > 1 ? d.hero : 'Your turn', '', E.g.players.length > 1 ? (p.auto ? 'AI controlled' : 'Your turn') : 'Round ' + E.g.round, 1100); await wait(800); } break; }
        case 'bossTurn': U.sfx.bossTurn(); banner(d.name + '\'s turn', 'boss', null, 1100); await wait(850); break;
        case 'counter': { // #114: the gauge pulses and shows +1 / -1, so a change never goes unnoticed
          const el = document.querySelector('#battle .bossrow .counter');
          if (el) {
            el.classList.remove('bump', 'up', 'down'); void el.offsetWidth; el.classList.add('bump', (d.delta || 0) < 0 ? 'down' : 'up');
            const r = el.getBoundingClientRect(), f = document.createElement('div');
            f.className = 'cfloat ' + ((d.delta || 0) < 0 ? 'down' : 'up'); f.textContent = ((d.delta || 0) < 0 ? '−' : '+') + Math.abs(d.delta || 1) + ' ' + E.raid.counter.name;
            f.style.left = (r.right + 10) + 'px'; f.style.top = (r.top + r.height / 2) + 'px'; document.body.appendChild(f); setTimeout(() => f.remove(), 1900);
            if ((d.delta || 0) > 0) U.sfx.hit(); else U.sfx.heal();
          }
          await wait(700); break; }
        case 'banner': banner(d.text, d.kind, null, 1300); await wait(1000); break;
        case 'power': U.sfx.power(); banner(d.name, '', 'Hero power', 1200); await wait(900); break;
        case 'quest': U.sfx.quest(); banner('Quest complete', '', C[d.id].name, 1200); await wait(800); break;
        case 'master': U.sfx.master(); banner(C[d.id].name, '', 'A Master Hero rises', 1600); await wait(1200); break;
        case 'bossDeath': U.sfx.roar(E.raid.id); RB.AUDIO.music(null); banner(E.raid.short + ' is defeated!', '', null, 2200); await wait(1600); break;
        case 'resource': await wait(120); break;
        default: break;
      }
    } finally {
      view.lock--;
      if (view.lock === 0 && view.dirty) { view.dirty = false; schedule(); }
    }
  }

  /* ---------- prompts (engine ask hook) ---------- */
  async function ask(kind, d, local) {
    if (net && !local) return netAsk(kind, d);
    flush();
    if (kind === 'scout') {
      const v = await U.dialog(`<h3>Scouting report</h3><p>The next card in ${esc(E.raid.short)}'s deck is revealed.</p><div class="cards">${U.cardHTML(d.id)}</div><div class="acts"><button class="btn ghost" data-v="top">Leave it on top</button><button class="btn primary" data-v="bottom">Send it to the bottom</button></div>`);
      return v;
    }
    if (kind === 'bossPick') {
      const v = await U.dialog(`<h3>${esc(E.raid.short)}: play a card</h3><p>You are the raid boss. Choose a card from your hand to play — <b>${d.left} more</b> this turn. Cards you don't play stay in your hand for next turn.</p>
        <div class="cards">${d.hand.map((id, i) => `<div class="pick" data-v="${i}">${U.cardHTML(id)}</div>`).join('')}</div>
        <div class="acts"><button class="btn ghost" data-v="0">Play the first card</button></div>`, { dismiss: '0', cls: 'wide bosspick' });
      return v == null ? 0 : +v;
    }
    if (kind === 'bossTarget') {
      const opts = d.options.map((t, i) => { const hero = t.t === 'hero'; const art = hero ? U.cardArt(t.p.heroId) : U.cardArt(t.a.id); return `<button class="tpick" data-v="${i}"><img alt="" src="${art}"><b>${esc(E.nameOf(t))}</b><span>${hero ? 'Hero' : 'Ally'} · ${E.hpOf(t)}/${E.maxHpOf(t)} health${E.atkOf(t) ? ` · hits back for ${hero ? E.heroAtk(t.p) : E.atkOf(t)}+` : ''}</span></button>`; }).join('');
      const v = await U.dialog(`<h3>${esc(d.from)} attacks (${d.atk} damage)</h3><p>${d.strike ? 'Your boss strike' : 'Your minion'} is ready. Choose who to hit. A ready Bulwark ally may step in front of its hero.</p><div class="tpicks">${opts}</div><div class="acts"><button class="btn ghost" data-v="auto">Let it choose</button></div>`, { dismiss: 'auto' });
      return v == null || v === 'auto' ? null : +v;
    }
    if (kind === 'strikeBack') {
      const w = C[d.p.weapon.c.id];
      const v = await U.dialog(`<h3>Strike back?</h3><p>${esc(d.attacker)} attacks ${esc(E.pdef(d.p).name)}. Pay ${w.strike} to strike back with ${esc(w.name)} for ${E.heroAttackValue(d.p, true)} damage?</p><div class="acts"><button class="btn ghost" data-v="no">Don't</button><button class="btn primary" data-v="yes">Strike back</button></div>`);
      return v === 'yes';
    }
    if (kind === 'armor') {
      const chosen = [];
      for (const slot of d.slots) {
        const a = C[d.p.armor[slot].c.id];
        const v = await U.dialog(`<h3>Block with armor?</h3><p>${esc(E.pdef(d.p).name)} is about to take ${d.amount} damage. Exhaust ${esc(a.name)} and pay ${a.use} to block ${a.def}?</p><div class="acts"><button class="btn ghost" data-v="no">Take the hit</button><button class="btn primary" data-v="yes">Block</button></div>`);
        if (v === 'yes') chosen.push(slot);
      }
      return chosen;
    }
    if (kind === 'instant') {
      const opts = [];
      d.players.forEach(p => p.hand.forEach(c => { const cd = C[c.id]; if (cd.type === 'ability' && cd.speed === 'instant' && E.available(p) >= cd.cost) opts.push({ p, c }); }));
      if (!opts.length) return null;
      // #88: say what is coming, who it is likely to hit, how an Instant works, and what each one would do right now
      const bc = d.card, txt = (bc.text || '').toLowerCase(), harmful = bc.kind === 'attack' || bc.kind === 'curse';
      const what = { attack: 'This card will hurt your party.', curse: 'This card hits your heroes with a nasty effect.', summon: 'This card brings new enemy minions onto the table. It doesn\'t hurt you by itself.', event: 'This card stays in play for a few rounds.', heal: 'The boss heals. It doesn\'t hurt you directly.', buff: 'This card makes the boss or its minions stronger. It doesn\'t hurt you directly.', equip: 'The boss equips gear and gets stronger. It doesn\'t hurt you directly.' }[bc.kind] || 'Read the card to see what it does.';
      const hp = h => `${esc(E.pdef(h).name)} (${Math.max(0, E.heroHp(h))} health)`;
      let who = '';
      if (/each hero|every hero|all heroes/.test(txt)) who = 'every hero';
      else if (/hero with the most health/.test(txt)) { const h = E.mostHealth && E.mostHealth(); if (h) who = hp(h); }
      else if (/most threat/.test(txt)) { const h = E.threatTarget && E.threatTarget(); if (h) who = hp(h); }
      else if (/most wounded|least health|lowest health/.test(txt)) { const h = E.mostWounded && E.mostWounded(); if (h) who = hp(h); }
      if (/each ally|every ally|ally with/.test(txt)) who = who ? who + ' and allies' : 'your allies';
      const hint = (o) => {
        const cd = C[o.c.id], t = cd.tags || [], forOne = cd.target === 'friendlyHero' ? ' on a hero you choose' : cd.target === 'none' && /each friendly hero/i.test(cd.text) ? ' for every hero' : ' for your hero';
        const n = (cd.text.match(/next (\d+) damage/) || [])[1];
        if (t.includes('shield')) return n ? `Blocks the next ${n} damage${forOne}.` : `Blocks damage${forOne}.`;
        if (t.includes('elusive')) return 'Your hero dodges the boss\'s attacks until your next turn.';
        if (t.includes('heal')) return 'Heals now, before this card lands.';
        if (t.includes('stunAll')) return 'Freezes the minions already on the table for the next boss turn.';
        if (t.includes('stun')) return 'Stuns a minion already on the table, or the boss so it skips its next strike.';
        if (t.includes('dmg')) return 'Hits a minion that is already on the table.';
        return 'Happens right now, before the boss card.';
      };
      const ai = {}; for (const p of d.players) { const r = RB.AI && RB.AI.chooseInstant ? RB.AI.chooseInstant(E, p, bc) : null; if (r) ai[r.inst.uid] = true; }
      const tag = (o) => { const t = C[o.c.id].tags || []; if (ai[o.c.uid]) return '<span class="itag good">Good answer</span>'; if (!harmful && (t.includes('shield') || t.includes('elusive'))) return '<span class="itag meh">Not much use here</span>'; return ''; };
      const html = `<h3>Answer the boss's card?</h3>
        <div class="instwhy"><p><b>${esc(E.raid.short)} just revealed ${esc(bc.name)}.</b> ${esc(what)}${who ? ` Likely to hit: <b>${who}</b>.` : ''}</p>
        <p class="small">It hasn't happened yet. If you play an <b>Instant</b> now, it happens first, then the boss card still takes effect. Wards block damage before it lands, Shrouded dodges attacks, and stuns stop minions or the boss's next strike. It uses resources you left ready — they all refresh at the start of your next turn, so a spare one costs you nothing.</p></div>
        <div class="cards"><div style="--cw:170px" class="bosspick">${U.cardHTML(bc.id)}<div class="ilabel">Coming up</div></div>${opts.map((o, i) => `<div class="pick" data-v="${i}" title="${esc(E.pdef(o.p).name)}">${U.cardHTML(o.c.id, { holo: o.c.holo })}<div class="ihint">${tag(o)}<b>${esc(E.pdef(o.p).name.replace(/^(Ser|Sir|Sister|Old|Lady|Lord) /, '').split(/[ ,]/)[0])}</b> · costs ${C[o.c.id].cost} (${E.available(o.p)} ready)<br>${esc(hint(o))}</div></div>`).join('')}</div>
        <p class="small" style="text-align:center;margin:.6rem 0 0">${U.isPhone() ? 'Tap' : 'Click'} an Instant to play it, or let the card happen and keep your cards. You can turn these pauses off in Settings.</p>
        <div class="acts"><button class="btn primary" data-v="pass">Let it happen</button></div>`;
      const v = await U.dialog(html);
      if (v === 'pass' || v == null) return null;
      const o = opts[+v]; const cd = C[o.c.id];
      let target = null;
      if (cd.target && cd.target !== 'none') {
        const ts = E.targetsFor(cd.target, o.p);
        if (!ts.length) return null;
        if (ts.length === 1) target = ts[0];
        else {
          const tv = await U.dialog(`<h3>${esc(cd.name)}: choose a target</h3><div class="acts" style="justify-content:flex-start">${ts.map((t, i) => `<button class="btn" data-v="${i}">${esc(E.nameOf(t))} (${E.hpOf(t)}/${E.maxHpOf(t)})</button>`).join('')}<button class="btn ghost" data-v="x">Never mind</button></div>`);
          if (tv === 'x' || tv == null) return null;
          target = ts[+tv];
        }
      }
      return { p: o.p, inst: o.c, target };
    }
    // #99 React: an attack is about to land — answer it with a React card
    if (kind === 'react') {
      const ctx = d.ctx, opts = d.options; if (!opts.length) return null;
      const dT = ctx.defT, hero = dT.t === 'hero' ? dT.p : null, ward = hero ? hero.hero.shield : 0, inc = ctx.atk + (E.g.partyFury || 0);
      const good = RB.AI.chooseReact(E, ctx, opts);
      const hint = o => {
        const cd = C[o.inst.id], t = cd.tags || [], n = +((cd.text.match(/next (\d+) damage/) || [])[1] || 0);
        if (t.includes('elusive')) return 'The attack misses: your hero slips into the shadows.';
        if (cd.react === 'strike') return `Wards every hero: blocks ${n} of this strike and of the next hit on each hero.`;
        if (t.includes('shield')) return n >= inc ? `Blocks all ${inc} damage.` : `Blocks ${n} of the ${inc} damage.`;
        if (t.includes('heal')) return `Heals ${E.nameOf(o.target || dT)} first, so the hit is less likely to finish them.`;
        return 'Happens before the hit lands.';
      };
      const who = o => esc(E.pdef(o.p).name.replace(/^(Ser|Sir|Sister|Old|Lady|Lord) /, '').split(/[ ,]/)[0]);
      const html = `<h3><b class="kw react">React</b> — ${esc(ctx.attacker)} attacks!</h3>
        <div class="instwhy"><p><b>${esc(ctx.attacker)} is about to hit ${esc(E.nameOf(dT))} for ${inc} damage.</b> ${esc(E.nameOf(dT))} has ${E.hpOf(dT)} health${ward ? ` and a ward of ${ward}` : ''}.</p>
        <p class="small">A <b>React</b> card can be played right now, before the hit lands. It uses resources you left ready — they refresh at the start of your next turn.</p></div>
        <div class="cards">${opts.map((o, i) => `<div class="pick" data-v="${i}">${U.cardHTML(o.inst.id, { holo: o.inst.holo })}<div class="ihint">${good === o ? '<span class="itag good">Good answer</span>' : ''}<b>${who(o)}</b> · costs ${C[o.inst.id].cost} (${E.available(o.p)} ready)<br>${esc(hint(o))}</div></div>`).join('')}</div>
        <p class="small" style="text-align:center;margin:.6rem 0 0">${U.isPhone() ? 'Tap' : 'Click'} a card to play it, or take the hit and keep your cards. You can turn these pauses off in Settings.</p>
        <div class="acts"><button class="btn primary" data-v="pass">Take the hit</button></div>`;
      const v = await U.dialog(html);
      if (v === 'pass' || v == null || !opts[+v]) return null;
      return opts[+v];
    }
    // #101 Soak: step into the circle and share the damage, or stay out
    if (kind === 'soak') {
      const n = d.heroes.length, tot = d.total, name = E.pdef(d.p).name;
      const rows = Array.from({ length: n }, (_, i) => `<span class="srow ${i === 0 ? '' : ''}"><b>${i + 1}</b> hero${i ? 'es' : ''} in: <b>${Math.ceil(tot / (i + 1))}</b> each</span>`).join('');
      const good = RB.AI.chooseSoak(E, d.p, tot, d.heroes);
      const html = `<h3>${esc(d.name)} — step into the circle?</h3>
        <div class="instwhy"><p><b>${tot} damage</b> will be shared by the heroes who step into the circle. If <b>nobody</b> steps in, it hits <b>every hero for ${tot}</b>.</p>
        <p class="small">${esc(name)} has ${Math.max(0, E.heroHp(d.p))} health${d.p.hero.shield ? ` and a ward of ${d.p.hero.shield}` : ''}. Armor and wards still help.</p>
        <div class="soakrows">${rows}</div></div>
        <div class="acts"><button class="btn ghost" data-v="no">Stay out${good ? '' : ' <span class="itag good">Good answer</span>'}</button><button class="btn primary" data-v="yes">Step in${good ? ' <span class="itag good">Good answer</span>' : ''}</button></div>`;
      const v = await U.dialog(html, { dismiss: good ? 'yes' : 'no' });
      return v === 'yes';
    }
    // #100 Cover: a ready Bulwark ally may take the hit instead
    if (kind === 'cover') {
      const good = RB.AI.chooseCover(E, d.target, d.atk, d.options, d.attackerDef, d.isBoss);
      const opts = d.options.map((t, i) => { const mate = t.p !== d.target.p; return `<button class="tpick" data-v="${i}"><img alt="" src="${U.cardArt(t.a.id)}"><b>${esc(E.nameOf(t))}${good === t ? ' <span class="itag good">Good answer</span>' : ''}</b><span>${E.hpOf(t)}/${E.maxHpOf(t)} health · hits back for ${E.atkOf(t)}${mate ? ` · ${esc(E.pdef(t.p).name.split(/[ ,]/)[0])}'s ally: covering a teammate gives ${esc(E.pdef(t.p).name.split(/[ ,]/)[0])} ${d.atk * 2} threat` : ''}</span></button>`; }).join('');
      const v = await U.dialog(`<h3>Cover ${esc(E.nameOf(d.target))}?</h3><p>${esc(d.attacker)} attacks ${esc(E.nameOf(d.target))} (${E.hpOf(d.target)} health) for <b>${d.atk}</b> damage. A ready <b>Bulwark</b> ally can step in and take the hit instead. It exhausts until its owner's next turn.</p><div class="tpicks">${opts}</div><div class="acts"><button class="btn ghost" data-v="none">Don't cover${good ? '' : ' <span class="itag good">Good answer</span>'}</button></div>`, { dismiss: 'none' });
      return v == null || v === 'none' ? null : +v;
    }
    return null;
  }

  /* ---------- player actions (local, or sent through the online relay) ---------- */
  const ACTS = ['playResource', 'playCard', 'attack', 'usePower', 'useItem', 'completeQuest', 'useLocation', 'bail'];
  async function doAction(name, args) {
    const p = args[0];
    if (name === 'end') return E.endHeroTurn();
    if (name === 'auto') { await RB.AI.playTurn(E, p); if (!E.g.over && E.g.phase === 'main' && E.g.players[E.g.turn] === p) await E.endHeroTurn(); return; }
    if (ACTS.includes(name)) return E[name](...args);
  }
  function doAct(name, ...args) {
    if (!net) return run(() => doAction(name, args));
    if (view.busy) return;
    view.busy = true; view.mode = null; U.closePop(); U.hidePreview(); render();
    net.send({ t: 'act', name, args: ser(args) });
  }
  const ser = args => args.map(a => a == null ? null : typeof a === 'string' ? { S: a } : (a.hand && a.hero) ? { P: a.idx } : a.t ? { R: E.refId(a) } : (a.c && a.c.uid && !a.id) ? { C: a.c.uid } : a.uid ? { U: a.uid } : null);
  function findRef(ref) {
    const g = E.g, all = [...E.enemies(), ...g.players.map(q => E.heroT(q)), ...g.players.flatMap(q => q.allies.map(a => E.T.ally(q, a)))];
    return all.find(t => E.refId(t) === ref) || null;
  }
  function deser(list) {
    const p0 = list[0] && list[0].P != null ? E.g.players[list[0].P] : null;
    return list.map(a => {
      if (a == null) return null;
      if (a.S != null) return a.S;
      if (a.P != null) return E.g.players[a.P];
      if (a.R != null) return findRef(a.R);
      if (a.C != null) return p0 && (p0.items.find(e => e.c.uid === a.C) || p0.res.find(r => r.c.uid === a.C) || (p0.weapon && p0.weapon.c.uid === a.C ? p0.weapon : null));
      if (a.U != null) return p0 && (p0.hand.find(c => c.uid === a.U) || p0.allies.find(x => x.uid === a.U));
      return null;
    });
  }
  // apply one ordered command from the relay (every computer does the same, in the same order)
  async function applyNet(c, fromMe) {
    view.busy = true; render();
    try {
      if (c.t === 'act') { const r = await doAction(c.name, deser(c.args)); if (fromMe && r && r.ok === false && r.why) U.toast(r.why); }
      else if (c.t === 'ai' || c.t === 'human') await seatControl(c);
    } catch (err) { console.error(err); U.toast('Sync problem: ' + err.message); }
    view.busy = false; afterAction();
  }
  async function seatControl(c) {
    const p = E.g.players[c.seat]; if (!p) return;
    if (c.t === 'human') { p.auto = false; U.toast(`${E.g.cfg.party[p.idx].name} is back.`); return; }
    p.auto = true; p.wasAi = true; U.toast(`${E.g.cfg.party[p.idx].name} lost connection — the AI takes over their hero.`);
    if (E.g.phase === 'main' && E.g.turn === p.idx && !E.g.over) await doAction('auto', [p]);
  }
  async function netAnswer(seatIdx) {
    for (;;) {
      const m = await net.next();
      if (m.c.t === 'ans') return m.c.v;
      if (m.c.t === 'ai') { const p = E.g.players[m.c.seat]; if (p) { p.auto = true; p.wasAi = true; } if (m.c.seat === seatIdx) return null; }
      if (m.c.t === 'human') { const p = E.g.players[m.c.seat]; if (p) p.auto = false; }
    }
  }
  async function netAsk(kind, d) {
    if (kind === 'scout') {
      if (net.mine(d.p.idx) && !d.p.auto && !net.replaying) { const v = await ask(kind, d, true); net.send({ t: 'ans', v }); }
      else net.wait(`${esc(E.g.cfg.party[d.p.idx].name)} is scouting…`);
      const v = await netAnswer(d.p.idx); net.wait(null); return v || 'bottom';
    }
    if (kind === 'instant') {
      for (const q of d.players) {
        if (q.auto) continue;
        if (net.mine(q.idx) && !net.replaying) { const r = await ask('instant', Object.assign({}, d, { players: [q] }), true); net.send({ t: 'ans', v: r ? { uid: r.inst.uid, R: r.target ? E.refId(r.target) : null } : null }); }
        else net.wait(`Waiting for ${esc(E.g.cfg.party[q.idx].name)} to answer ${esc(d.card.name)}…`);
        const v = await netAnswer(q.idx); net.wait(null);
        if (v) { const inst = q.hand.find(c => c.uid === v.uid); if (inst) return { p: q, inst, target: v.R ? findRef(v.R) : null }; }
      }
      return null;
    }
    if (kind === 'react') {
      const ids = [...new Set(d.options.map(o => o.p.idx))];
      for (const idx of ids) {
        const q = E.g.players[idx]; if (q.auto) continue;
        const mineOpts = d.options.filter(o => o.p === q);
        if (net.mine(q.idx) && !net.replaying) { const r = await ask('react', Object.assign({}, d, { options: mineOpts }), true); net.send({ t: 'ans', v: r ? { uid: r.inst.uid } : null }); }
        else net.wait(`Waiting for ${esc(E.g.cfg.party[q.idx].name)} to react to ${esc(d.ctx.attacker)}…`);
        const v = await netAnswer(q.idx); net.wait(null);
        if (v) { const o = mineOpts.find(x => x.inst.uid === v.uid); if (o) return o; }
      }
      return null;
    }
    if (kind === 'soak') {
      if (net.mine(d.p.idx) && !d.p.auto && !net.replaying) { const v = await ask(kind, d, true); net.send({ t: 'ans', v: !!v }); }
      else net.wait(`${esc(E.g.cfg.party[d.p.idx].name)} is deciding whether to step into the circle…`);
      const v = await netAnswer(d.p.idx); net.wait(null);
      return v == null ? RB.AI.chooseSoak(E, d.p, d.total, d.heroes) : !!v;
    }
    return null;
  }
  async function run(fn) {
    if (view.busy) return;
    view.busy = true; view.mode = null; U.closePop(); U.hidePreview(); render();
    try { const r = await fn(); if (r && r.ok === false && r.why) U.toast(r.why); }
    catch (err) { console.error(err); U.toast('Something went wrong: ' + err.message); }
    finally { view.busy = false; afterAction(); }
  }
  function afterAction() {
    if (!E) return;
    if (E.g.over) { if (net) net.over = true; return endScreen(); }
    const g = E.g;
    if (g.phase === 'main') { const a = g.players[g.turn]; if (human(a) && !g.cfg.bossPlayer) view.focus = g.turn; else if (view.focus == null) view.focus = homeFocus(); }
    render();
  }
  function startTargeting(label, valid, friendly, go) {
    if (!valid.length) { U.toast('There is no valid target.'); return; }
    view.mode = { label, valid, friendly, go };
    render();
  }
  function cardActions(p, inst, anchor) {
    const d = C[inst.id];
    const items = [];
    const chk = E.canPlay(p, inst);
    if (d.type === 'quest' || d.type === 'location') {
      items.push({ label: `Play as a resource${d.type === 'location' ? ' (location)' : ' (quest)'}`, disabled: p.resPlayed, go: () => doAct('playResource', p, inst) });
      if (p.resPlayed) items.push({ why: 'You already played a resource this turn.' });
    } else {
      items.push({ label: `Play ${esc(d.name)} · ${d.cost} ◆`, disabled: !chk.ok, go: () => playWithTarget(p, inst) });
      if (!chk.ok) items.push({ why: chk.why });
      items.push({ label: 'Use as a resource', disabled: p.resPlayed, go: () => doAct('playResource', p, inst) });
      if (p.resPlayed) items.push({ why: 'You already played a resource this turn.' });
    }
    anchor.classList.add('open');
    U.popover(anchor, null, items, { card: U.cardHTML(inst.id, { holo: inst.holo }) });
  }
  function playWithTarget(p, inst) {
    const d = C[inst.id];
    const tk = E.needsTarget(inst);
    if (!tk) return doAct('playCard', p, inst, null);
    const friendly = ['friendly', 'friendlyHero', 'ally', 'deadHero'].includes(tk);
    if (tk === 'deadHero') { const ts = E.targetsFor(tk, p); return doAct('playCard', p, inst, ts[0]); }
    startTargeting(`${d.name}: choose ${friendly ? 'a friendly target' : 'an enemy'}`, E.targetsFor(tk, p), friendly, t => doAct('playCard', p, inst, t));
  }
  function heroActions(p, anchor) {
    const items = [];
    if (E.canAttackWith(p, 'hero')) {
      const useW = p.weapon && !p.weapon.ex && E.available(p) >= C[p.weapon.c.id].strike;
      items.push({ label: `Attack${useW ? ` with ${esc(C[p.weapon.c.id].name)} (pay ${C[p.weapon.c.id].strike}) · ${E.heroAttackValue(p, true)} damage` : ` · ${E.heroAtk(p)} damage`}`, go: () => startTargeting('Attack: choose an enemy', E.attackTargets(), false, t => doAct('attack', p, 'hero', t)) });
    } else if (!p.hero.ex) items.push({ why: p.weapon ? (p.weapon.ex ? 'Your weapon has already been used this round.' : `You need ${C[p.weapon.c.id].strike} ready resource${C[p.weapon.c.id].strike === 1 ? '' : 's'} to strike with your weapon.`) : 'Your hero needs a weapon (or an attack bonus) to attack.' });
    else items.push({ why: 'Your hero has already attacked this turn.' });
    if (!p.hero.powerUsed && !p.hero.master) items.push({ label: `Use ${esc(HE[p.heroId].power.name)} (once per game)`, go: () => usePower(p) });
    U.popover(anchor, E.pdef(p).name, items, { card: p.hero.master ? U.cardHTML(p.hero.master) : U.heroCardHTML(p.heroId) });
  }
  function usePower(p) {
    const pw = HE[p.heroId].power;
    if (pw.target && pw.target !== 'none') {
      const friendly = pw.target.startsWith('friendly');
      startTargeting(`${pw.name}: choose ${friendly ? 'a friendly target' : 'an enemy'}`, E.targetsFor(pw.target, p), friendly, t => doAct('usePower', p, t));
    } else doAct('usePower', p, null);
  }
  function itemAction(p, e, anchor) {
    const d = C[e.c.id];
    const card = { card: U.cardHTML(e.c.id) };
    if (!d.use) return U.popover(anchor, d.name, [{ why: d.text }], card);
    const ok = E.itemReady(p, e);
    const items = [{ label: `Use ${esc(d.name)}${d.use.cost ? ` (pay ${d.use.cost})` : ''}`, disabled: !ok, go: () => {
      if (d.use.target && d.use.target !== 'none') { const friendly = d.use.target.startsWith('friendly'); startTargeting(`${d.name}: choose a target`, E.targetsFor(d.use.target, p), friendly, t => doAct('useItem', p, e, t)); }
      else doAct('useItem', p, e, null);
    } }];
    if (!ok) items.push({ why: e.ex ? 'Already used this turn.' : 'Not enough ready resources.' });
    U.popover(anchor, null, items, card);
  }
  function resAction(p, r, anchor) {
    const d = C[r.c.id], card = { card: U.cardHTML(r.c.id) };
    if (r.quest) {
      if (r.done) return U.popover(anchor, d.name, [{ why: 'Completed. It still counts as a resource.' }], card);
      const ok = E.questReady(p, r);
      return U.popover(anchor, d.name, [{ label: `Complete quest${d.qcost ? ` (pay ${d.qcost})` : ''}`, disabled: !ok, go: () => doAct('completeQuest', p, r) }, ...(ok ? [] : [{ why: d.cond && !d.cond(E, p) ? `Complete when ${d.condText}.` : 'Not enough ready resources.' }])], card);
    }
    if (r.loc) {
      const ok = E.locationReady(p, r);
      return U.popover(anchor, d.name, [{ label: `Use location (pay ${d.lcost})`, disabled: !ok, go: () => { if (d.ltarget) startTargeting(`${d.name}: choose a target`, E.targetsFor(d.ltarget, p), true, t => doAct('useLocation', p, r, t)); else doAct('useLocation', p, r, null); } }, ...(ok ? [] : [{ why: r.used ? 'Already used this turn.' : 'Not enough ready resources.' }])], card);
    }
  }
  function allyCard(p, a) { return U.cardHTML(a.id, { atk: E.allyAtk(p, a), hp: E.allyMax(p, a) - a.damage, holo: a.c && a.c.holo }); }
  // #38 phones have no hover, so a tap shows the full card instead
  function phonePeek(t) {
    const acting = myTurn() && fp() === E.g.players[E.g.turn] && view.curtain == null;
    const show = (el, card, title) => { U.popover(el, title || null, [], { card }); return true; };
    const bc = t.closest('[data-bc]'); if (bc && !t.closest('.hc')) return show(bc, U.cardHTML(bc.dataset.bc));
    const rg = t.closest('.rgear, .rplay'); if (rg) return show(rg, U.cardHTML(rg.dataset.card));
    const mu = t.closest('.unit.minion'); if (mu) { const m = E.g.boss.minions.find(x => x.uid === mu.dataset.ref); if (m) return show(mu, U.cardHTML(m.id, { atk: E.minAtk(m), hp: E.minMax(m) - m.damage })); }
    if (t.closest('.bosscard')) { showRules(); return true; }
    if (acting) return false;
    const au = t.closest('.unit[data-kind=ally]'); if (au) { for (const q of E.g.players) { const a = q.allies.find(x => x.uid === au.dataset.ref); if (a) return show(au, allyCard(q, a)); } }
    const hc = t.closest('.herocard'); if (hc) { const q = fp(); return show(hc, q.hero.master ? U.cardHTML(q.hero.master) : U.heroCardHTML(q.heroId)); }
    const gs = t.closest('.gslot[data-card], .rcard[data-card]'); if (gs) return show(gs, U.cardHTML(gs.dataset.card));
    return false;
  }
  function phoneMenu(anchor) {
    const s = save.settings, B = E.g.boss;
    U.popover(anchor, `${E.raid.short} · boss deck ${B.deck.length} · discard ${B.grave.length}`, [
      { label: `Speed: ${speedName()} (tap to change)`, go: () => changeSpeed() },
      { label: s.muted ? '🔇 Turn sound on' : '🔊 Mute all sound', go: () => { U.toggleMute(); render(); } },
      { label: 'Volume', go: () => U.soundPop(anchor) },
      { label: 'Raid rules', go: () => showRules() },
      { label: 'Leave raid', go: () => leave() }
    ]);
  }
  // #104: the Rules button opens this raid's rules plus the Field Guide chapters that matter mid-fight
  function showRules() {
    const help = U.isPhone() ? 'Tap a card in your hand to see it big and play it. Tap an ally or your hero to attack. Glowing cards and units are ready to use. Tap the boss, a minion or any gear to see its card.' : 'Click a card in your hand to play it or use it as a resource. Click an ally or your hero to attack. Glowing cards and units are ready to use. Hover anything to see its full card.';
    const here = { id: 'here', icon: '🗺', title: E.raid.dungeon ? 'This dungeon' : 'This raid', html: `<section><h4>${esc(E.raid.name)}</h4><ul>${E.raid.rules.map(r => `<li><b>${esc(r.name)}.</b> ${esc(r.text)}</li>`).join('')}</ul></section><p class="small">${help}</p>` };
    const chs = [here].concat(U.guideChapters(['bossturn', 'threat', 'react'].concat(E.raid.dungeon ? [] : ['omens'], ['keywords'])));
    return U.dialog(`${U.guideHTML(chs, 'here')}<div class="acts"><button class="btn primary" data-v="ok">Back to the raid</button></div>`, { dismiss: 'ok', cls: 'wide guidedlg', onMount: o => U.guideWire(o) });
  }
  function onClick(e) {
    if (!E) return;
    const t = e.target;
    const act = t.closest('[data-act]');
    if (act && act.dataset.act === 'cancel') { view.mode = null; return render(); }
    if (act && act.dataset.act === 'reveal') { view.curtain = null; view.focus = E.g.turn; return render(); }
    if (act && act.dataset.act === 'quit') return leave();
    if (act && act.dataset.act === 'rulesref') return showRules();
    if (act && act.dataset.act === 'mute') { U.toggleMute(); return render(); }
    if (act && act.dataset.act === 'soundpop') return U.soundPop(act);
    if (act && act.dataset.act === 'speed') return changeSpeed();
    if (act && act.dataset.act === 'menu') return phoneMenu(act);
    if (act && act.dataset.act === 'drawer') { view.drawer = !view.drawer; return render(); }
    if (t === root && view.drawer) { view.drawer = false; return render(); }
    const focus = t.closest('[data-focus]');
    // targeting mode
    if (view.mode) {
      const refEl = t.closest('[data-ref]');
      if (refEl) {
        const tgt = view.mode.valid.find(x => E.refId(x) === refEl.dataset.ref);
        if (tgt) { const go = view.mode.go; view.mode = null; view.drawer = false; return go(tgt); }
      }
      if (focus && !refEl) { view.focus = +focus.dataset.focus; view.drawer = false; return render(); }
      return;
    }
    if (U.isPhone() && phonePeek(t)) return;
    if (focus && !t.closest('[data-ref]')) { view.focus = +focus.dataset.focus; view.drawer = false; return render(); }
    if (!myTurn()) return;
    const p = E.g.players[E.g.turn];
    if (fp() !== p) { view.focus = E.g.turn; return render(); }
    if (act) {
      switch (act.dataset.act) {
        case 'end': return doAct('end', p);
        case 'bail': return doAct('bail', p);
        case 'auto': return doAct('auto', p);
        case 'power': return usePower(p);
        case 'hero': return heroActions(p, act);
        case 'item': { const it = p.items.find(x => x.c.uid === act.dataset.gid); if (it) return itemAction(p, it, act); return; }
        case 'res': { const r = p.res[+act.dataset.ri]; if (r) return resAction(p, r, act); return; }
        case 'weapon': return U.popover(act, C[p.weapon.c.id].name, [{ why: `Attack with your hero to use this weapon (strike cost ${C[p.weapon.c.id].strike}). It can also strike back when your hero is attacked.` }], { card: U.cardHTML(p.weapon.c.id) });
        case 'armor': return U.popover(act, C[act.dataset.card].name, [{ why: 'Armor blocks automatically when your hero takes damage, if you have enough ready resources to pay its cost.' }], { card: U.cardHTML(act.dataset.card) });
      }
    }
    const hc = t.closest('.hc'); if (hc) { const inst = p.hand.find(c => c.uid === hc.dataset.uid); if (inst) return cardActions(p, inst, hc); }
    const unit = t.closest('.unit[data-kind=ally]');
    if (unit) {
      const a = p.allies.find(x => x.uid === unit.dataset.ref);
      if (a && U.isPhone()) { const go = () => startTargeting(`${E.allyDef(a).name} attacks: choose an enemy`, E.attackTargets(), false, tg => doAct('attack', p, a, tg)); return U.popover(unit, null, E.canAttackWith(p, a) ? [{ label: `Attack · ${E.allyAtk(p, a)} damage`, go }] : [{ why: a.sick ? 'Just arrived — it can attack next turn.' : a.frozen ? 'Frozen solid this round.' : a.ex ? 'Already exhausted this round.' : 'This ally can\'t attack right now.' }], { card: allyCard(p, a) }); }
      if (a && E.canAttackWith(p, a)) return startTargeting(`${E.allyDef(a).name} attacks: choose an enemy`, E.attackTargets(), false, tg => doAct('attack', p, a, tg));
      if (a) return U.popover(unit, E.allyDef(a).name, [{ why: a.sick ? 'Just arrived — it can attack next turn.' : a.frozen ? 'Frozen solid this round.' : a.ex ? 'Already exhausted this round.' : 'This ally can\'t attack right now.' }]);
    }
  }
  function onOver(e) {
    if (innerWidth < 900 || !E) return;
    const t = e.target;
    const hc = t.closest('.hc'); if (hc) return; // hand cards enlarge in place
    const u = t.closest('.unit');
    if (u) {
      const ref = u.dataset.ref;
      const m = E.g.boss.minions.find(x => x.uid === ref);
      if (m) return U.preview(U.cardHTML(m.id, { atk: E.minAtk(m), hp: E.minMax(m) - m.damage }), u);
      for (const p of E.g.players) { const a = p.allies.find(x => x.uid === ref); if (a) return U.preview(U.cardHTML(a.id, { atk: E.allyAtk(p, a), hp: E.allyMax(p, a) - a.damage, holo: a.c && a.c.holo }), u); }
    }
    const hcard = t.closest('.herocard'); if (hcard) { const p = fp(); return U.preview(p.hero.master ? U.cardHTML(p.hero.master) : U.heroCardHTML(p.heroId), hcard); }
    const gs = t.closest('[data-card]'); if (gs && !gs.classList.contains('card')) return U.preview(U.cardHTML(gs.dataset.card), gs);
    const ev = t.closest('[data-bc]'); if (ev) return U.preview(U.cardHTML(ev.dataset.bc), ev);
    U.hidePreview();
  }

  /* ---------- lifecycle ---------- */
  U.battle = function (cfg, link) {
    cfgLast = cfg; net = link || null;
    root = U.show('battle', '');
    view.mode = null; view.busy = true; view.focus = 0; view.hpGhost = null; view.lock = 0; view.netSpeed = net ? (+cfg.speed || save.settings.speed || 1) : null;
    E = RB.newGame(cfg, { anim, update: schedule, ask, log: () => schedule() });
    U.currentGame = E; U.battleRefresh = schedule;
    // website build: warm the cache with this fight's pictures so cards don't pop in
    if (RB.WEB_BUILD) { const ids = new Set([...cfg.party.map(s => s.hero), ...cfg.party.flatMap(s => s.deck.map(c => typeof c === 'string' ? c : c.id)), ...E.g.boss.deck, ...Object.keys(RB.TOKENS)]); setTimeout(() => ids.forEach(id => { const u = U.cardArt(id); if (u && !u.startsWith('data:')) { const im = new Image(); im.decoding = 'async'; im.src = u; } }), 50); }
    E.g.onAiStep = () => wait(550);
    RB.AUDIO.music((E.raid && E.raid.music) || cfg.raid);
    root.onclick = onClick;
    root.onmouseover = onOver;
    root.onmouseleave = () => U.hidePreview();
    document.onkeydown = e => {
      if (!E || $('#battle').classList.contains('hidden')) return;
      if (e.key === 'Escape') { if (view.mode) { view.mode = null; render(); } U.closePop(); U.hidePreview(); }
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.closest && document.activeElement.closest('#battle .hc, #battle .unit, #battle .herocard, #battle .bosscard')) { e.preventDefault(); document.activeElement.click(); }
    };
    render();
    if (net) { const mine = cfg.party.findIndex(s => s.owner === net.id); if (mine >= 0) view.focus = mine; net.attach({ apply: applyNet, game: () => E, speed: v => { view.netSpeed = v; if (!net.replaying) U.toast(`Speed changed to ${speedName()}.`); render(); } }); }
    E.start().then(() => { view.busy = false; afterAction(); if (net) net.ready(); }).catch(err => { console.error(err); view.busy = false; U.toast('Error: ' + err.message); });
  };
  async function leave() {
    const v = await U.dialog('<h3>Leave the raid?</h3><p>Your progress in this fight will be lost.</p><div class="acts"><button class="btn ghost" data-v="no">Keep fighting</button><button class="btn primary" data-v="yes">Leave</button></div>', { dismiss: 'no' });
    if (v === 'yes') { E.g.over = 'abandon'; E = null; if (net) { net.leave(); net = null; return U.title(); } U.setup(); }
  }
  function endScreen() {
    const g = E.g, win = g.over === 'win';
    if (g.over === 'abandon') return;
    const raid = g.raid;
    if (g.cfg.bossPlayer) return bossEndScreen();
    if (raid.dungeon) return U.dungeonEnd(g, win, cfgLast, E);
    const heroesBefore = RB.UNLOCK_HEROES.filter(id => U.heroOpen(id));
    const gold = RB.goldFor(g, win); save.gold = (save.gold || 0) + gold.total; U.persist();
    let fresh = []; if (win) { save.wins[raid.id] = (save.wins[raid.id] || 0) + 1; if (g.cfg.difficulty === 'heroic') save.heroicWins[raid.id] = (save.heroicWins[raid.id] || 0) + 1; U.persist(); fresh = U.checkUnlocks(); U.sfx.win(); RB.AUDIO.music('victory'); } else { RB.AUDIO.music(null); U.sfx.lose(); }
    const stats = `<div class="stats"><div><b>${g.round}</b>rounds</div><div><b>${g.stats.dmgDealt}</b>damage dealt</div><div><b>${g.stats.cardsPlayed}</b>cards played</div><div><b>${g.players.filter(p => !p.hero.dead).length}/${g.players.length}</b>heroes standing</div></div>`;
    const heroic = g.cfg.difficulty === 'heroic';
    const newHeroes = RB.UNLOCK_HEROES.filter(id => U.heroOpen(id) && !heroesBefore.includes(id));
    const goldBox = `<div class="goldbox"><div class="gtitle">+${gold.total} gold <span>(you have ${save.gold})</span></div><div class="gparts">${gold.parts.map(([k, v]) => `<span>${esc(k)} <b>+${v}</b></span>`).join('')}</div>${win ? '<div class="gnote">Open your treasure first — then visit the Market from the title screen.</div>' : '<button class="btn small" data-act="market">Spend it in the Market</button>'}</div>`
      + (newHeroes.length ? `<div class="newvault"><b>New hero unlocked:</b> ${newHeroes.map(id => `<span><img alt="" src="${U.cardArt(id)}">${esc(RB.HEROES[id].name)}</span>`).join('')}</div>` : '');
    const el = U.show('end', win
      ? `<div class="endscreen"><h2>Victory</h2><p class="tagline">${esc(raid.boss)} has fallen. The treasure is yours.</p>${stats}${goldBox}${U.packHTML({ theme: raid.id === 'crypt' ? 'void' : raid.id === 'tide' ? 'frost' : 'ember', img: U.art(raid.art, 'raid:' + raid.id), wide: true, act: 'open', cls: 'treasure', title: 'Raid Treasure', set: raid.name + (heroic ? ' · Heroic' : ''), count: '5 cards', fine: 'A guaranteed epic treasure card<br>Holofoils and a chance of loot', burst: true, label: 'Open treasure pack' })}<p style="color:var(--muted)">${U.isPhone() ? 'Tap' : 'Click'} the pack to open it.</p>${fresh.length ? `<div class="newvault"><b>New in the Vault:</b> ${fresh.map(id => `<span><img alt="" src="${U.cosImg(id)}">${esc(RB.COSMETICS[id].name)}</span>`).join('')}</div>` : ''}</div>`
      : `<div class="endscreen lose"><h2>The raid has wiped</h2><p class="tagline">${esc(raid.short)} still stands with ${Math.max(0, E.bossHp())} health. Regroup and try again.</p>${stats}${goldBox}<div class="menu" style="flex-direction:row;justify-content:center"><button class="btn primary" data-act="retry">Try again</button><button class="btn" data-act="party">Change party</button><button class="btn ghost" data-act="title">Title</button></div></div>`);
    el.onclick = e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'open') return U.openPack(raid.id, heroic, a, null, { online: !!cfgLast.online });
      if (a.dataset.act === 'retry') return cfgLast.online ? U.online() : U.battle(JSON.parse(JSON.stringify(cfgLast)));
      if (a.dataset.act === 'party') return cfgLast.online ? U.online() : U.setup();
      if (a.dataset.act === 'market') return U.market();
      if (a.dataset.act === 'title') return U.title();
    };
    el.onkeydown = e => { if (e.key === 'Enter' && e.target.dataset.act === 'open') e.target.click(); };
  }
  function bossEndScreen() {
    const g = E.g, raid = g.raid, bossWon = g.over === 'lose';
    const slain = g.players.filter(p => p.hero.dead).length;
    // #59: beating AI heroes is easy money, so it pays much less (and Heroic, which makes the boss stronger, pays less again).
    // Against real players the full payout stands.
    // fix-sim: a seat the AI took over (player left) no longer counts as a human opponent
    const vsHumans = !!(g.cfg.online && (g.cfg.party || []).some((s, i) => s && !s.auto && s.owner && g.players[i] && !g.players[i].wasAi));
    const n = Math.max(1, g.players.length), heroic = g.cfg.difficulty === 'heroic';
    const raw = vsHumans ? [['Result', bossWon ? 110 : 35], ['Heroes defeated', slain * 20], ['Damage dealt', Math.round((g.stats.dmgTaken || 0) * 0.4 / n)]]
      : [['Result', bossWon ? 50 : 15], ['Heroes defeated', slain * 8], ['Damage dealt', Math.round((g.stats.dmgTaken || 0) * 0.15 / n)]];
    const mult = vsHumans ? 1 : heroic ? 0.7 : 1;
    const parts = raw.map(([k, v]) => [k, Math.round(v * mult)]);
    if (!vsHumans) parts.push([heroic ? 'Against AI heroes · Heroic (boss is stronger) ×0.7' : 'Against AI heroes', 0]);
    const total = parts.reduce((s, x) => s + x[1], 0);
    save.gold = (save.gold || 0) + total; save.bossWins = (save.bossWins || 0) + (bossWon ? 1 : 0); U.persist();
    if (bossWon) { U.sfx.win(); RB.AUDIO.music('victory'); } else { RB.AUDIO.music(null); U.sfx.lose(); }
    const stats = `<div class="stats"><div><b>${g.round}</b>rounds</div><div><b>${slain}/${g.players.length}</b>heroes defeated</div><div><b>${Math.max(0, E.bossHp())}</b>health left</div></div>`;
    const goldBox = `<div class="goldbox"><div class="gtitle">+${total} gold <span>(you have ${save.gold})</span></div><div class="gparts">${parts.map(([k, v]) => v ? `<span>${esc(k)} <b>+${v}</b></span>` : `<span class="gnote">${esc(k)}</span>`).join('')}</div></div>`;
    const el = U.show('end', `<div class="endscreen ${bossWon ? '' : 'lose'}"><h2>${bossWon ? 'The raid is crushed' : 'The heroes prevail'}</h2><p class="tagline">${bossWon ? `As ${esc(raid.boss)}, you wiped the whole party.` : `${esc(raid.boss)} has fallen. The heroes will tell this story for years.`}</p>${stats}${goldBox}
      <div class="menu" style="flex-direction:row;justify-content:center"><button class="btn primary" data-act="retry">Play again</button><button class="btn" data-act="party">Change heroes</button><button class="btn" data-act="market">Market</button><button class="btn ghost" data-act="title">Title</button></div></div>`);
    el.onclick = e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'retry') return U.battle(JSON.parse(JSON.stringify(cfgLast)));
      if (a.dataset.act === 'party') return U.setup();
      if (a.dataset.act === 'market') return U.market();
      if (a.dataset.act === 'title') return U.title();
    };
  }
  U._view = view;
})(globalThis.RB);
