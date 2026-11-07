/* RAIDBOUND — the battle table */
(function (RB) {
  const U = RB.UI, C = RB.CARDS, TK = RB.TOKENS, BC = RB.BOSSCARDS, HE = RB.HEROES;
  const { $, $$, esc } = U;
  const save = U.save;
  let E = null, root = null, cfgLast = null;
  const view = { mode: null, lock: 0, dirty: false, raf: 0, busy: false, focus: 0, hpGhost: null };
  const speed = () => save.settings.speed || 1;
  const wait = ms => new Promise(r => setTimeout(r, (net && net.replaying) ? 0 : ms * speed()));

  /* ---------- rendering ---------- */
  function schedule() { if (view.lock > 0) { view.dirty = true; return; } if (!view.raf) view.raf = requestAnimationFrame(() => { view.raf = 0; render(); }); }
  function flush() { if (view.raf) { cancelAnimationFrame(view.raf); view.raf = 0; } render(); view.dirty = false; }
  let net = null; // online co-op link (#29), null when playing on one computer
  const human = p => p && !p.auto && (!net || net.mine(p.idx));
  const myTurn = () => E && E.g.phase === 'main' && human(E.g.players[E.g.turn]) && !view.busy && !E.g.over;
  const fp = () => E.g.players[view.focus] || E.g.players[0];

  function unitHTML(kind, o) {
    // o: {ref, name, img, atk, hp, max, kws:[], cls:[], buffA, title}
    const kwI = { protector: 'P', ferocity: 'F', longrange: 'L', elusive: 'E', guardian: 'G', unique: 'U' };
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
    const canAct = myTurn() && p === active;
    const valid = new Set((view.mode ? view.mode.valid : []).map(E.refId));
    const tcls = ref => valid.has(ref) ? (view.mode.friendly ? ' friendly-t' : ' targetable') : '';
    // boss
    const hpPct = Math.max(0, E.bossHp()) / B.maxHp * 100;
    if (view.hpGhost == null) view.hpGhost = hpPct;
    const ticks = (raid.phases || []).map((ph, i) => `<span class="tick" style="left:${ph.at * 100}%" title="${esc(ph.name)}"></span>`).join('');
    const counter = raid.counter ? `<span class="counter" title="${esc(raid.rules[0].text)}">${esc(raid.counter.name)} ${Array.from({ length: raid.counter.max }, (_, i) => `<i class="${i < B.counter ? 'on' : ''}"></i>`).join('')}</span>` : '';
    const events = B.events.map(e => `<span class="evt" data-bc="${e.id}" title="${esc(BC[e.id].text)}"><b>${esc(BC[e.id].name)}</b> · ${e.turns} round${e.turns > 1 ? 's' : ''}</span>`).join('');
    const mark = B.mark ? `<span class="evt" style="background:rgba(120,60,10,.5)"><b>Marked</b> +${B.mark.amount} damage taken</span>` : '';
    const stun = B.stunned ? `<span class="evt" style="background:rgba(120,110,10,.5)"><b>Stunned</b> · skips next strike</span>` : '';
    const minions = B.minions.map(m => {
      const d = TK[m.id];
      return unitHTML('minion', { ref: m.uid, name: d.name, img: U.cardArt(m.id), atk: E.minAtk(m), hp: E.minMax(m) - m.damage, max: E.minMax(m), kws: d.kw || [], buffA: m.atkB > 0, buffH: m.hpB > 0, cls: [(d.kw || []).includes('guardian') ? 'guardian' : '', m.ex ? '' : '', m.stunned ? 'stunned' : '', m.sick && g.phase !== 'boss' ? '' : '', tcls(m.uid)] });
    }).join('') || '<span class="empty">No minions — the boss stands alone.</span>';
    const strike = g.raid.strike + B.strikeBonus + g.partyFury;
    // player
    const hd = E.pdef(p), dead = p.hero.dead;
    const heroAtk = E.heroAtk(p) + (p.weapon && !p.weapon.ex ? C[p.weapon.c.id].atk : 0);
    const heroCan = canAct && E.canAttackWith(p, 'hero');
    const tags = [p.hero.taunt && 'Taunt', p.hero.elusive && 'Elusive', p.hero.tempAtk && `+${p.hero.tempAtk} ATK`, p.hero.master && 'Master'].filter(Boolean).map(t => `<span>${t}</span>`).join('');
    const petImg = p.hero.pet && U.ownsCos(p.hero.pet) && U.cosImg(p.hero.pet) ? `<div class="petspot"><img class="pet" alt="" src="${U.cosImg(p.hero.pet)}" title="${esc(RB.COSMETICS[p.hero.pet].name)}"></div>` : '';
    const pw = HE[p.heroId].power;
    const powerBtn = p.hero.master ? `<button class="btn small ghost powerbtn used" disabled><b>Master Hero</b>Original power set aside</button>` :
      `<button class="btn small powerbtn ${p.hero.powerUsed ? 'used' : ''}" data-act="power" ${p.hero.powerUsed || !canAct ? 'disabled' : ''} title="${esc(pw.text)}"><b>${esc(pw.name)}</b>${p.hero.powerUsed ? 'Used' : 'Once per game'}</button>`;
    const heroCard = `<div class="herocard ${p.hero.ex ? 'ex' : ''} ${dead ? 'dead' : ''} ${heroCan && !view.mode ? 'can' : ''}${tcls('hero' + p.idx)}" data-ref="hero${p.idx}" data-act="hero" tabindex="0" aria-label="${esc(hd.name)}, ${E.heroHp(p)} health">
      <img alt="" src="${U.cardArt(p.hero.master || p.heroId)}"><div class="tags">${tags}</div>
      ${heroAtk > 0 ? `<div class="hatk" title="Attack with weapon">${heroAtk}</div>` : ''}<div class="hhp ${E.heroHp(p) <= 8 ? 'low' : ''}">${Math.max(0, E.heroHp(p))}</div>${p.hero.shield ? `<div class="shield" title="Ward: prevents the next ${p.hero.shield} damage">◈ ${p.hero.shield}</div>` : ''}
      <div class="hn"><b>${esc(hd.name)}</b><small>${HE[p.heroId].race} ${RB.CLASSES[HE[p.heroId].cls].name} · ${E.heroMax(p)} max health</small></div></div>${powerBtn}${petImg}`;
    const gslot = (e, label, val, act, can) => e ? `<div class="gslot has ${e.ex ? 'ex' : ''} ${can ? 'can' : ''}" data-act="${act}" data-gid="${e.c.uid}" data-card="${e.c.id}"><img alt="" src="${U.cardArt(e.c.id)}"><span class="gn"><b>${esc(C[e.c.id].name)}</b>${label}</span><span class="gv">${val}</span></div>` : '';
    let gear = p.weapon ? gslot(p.weapon, `Strike ${C[p.weapon.c.id].strike}${p.weapon.ex ? ' · used' : ''}`, '⚔ ' + C[p.weapon.c.id].atk, 'weapon', false) : `<div class="gslot">No weapon</div>`;
    for (const slot of Object.keys(RB.SLOTS)) if (p.armor[slot]) { const d = C[p.armor[slot].c.id]; gear += gslot(p.armor[slot], `${RB.SLOTS[slot]} · pay ${d.use}${p.armor[slot].ex ? ' · used' : ''}`, '⛨ ' + d.def, 'armor', false); }
    for (const it of p.items) { const d = C[it.c.id]; gear += gslot(it, d.use ? (it.ex ? 'Used this turn' : 'Click to use') : 'Item', d.use ? (d.use.cost ? d.use.cost + '◆' : '') : '', 'item', canAct && E.itemReady(p, it)); }
    if (!Object.keys(p.armor).length && !p.items.length) gear += `<div class="gslot">No armor or items</div>`;
    const resCards = p.res.map((r, i) => {
      const d = C[r.c.id];
      if (r.quest || r.loc) { const can = canAct && (r.quest ? E.questReady(p, r) : E.locationReady(p, r)); return `<div class="rcard ${r.ex ? 'ex' : ''}" data-act="res" data-ri="${i}" data-card="${r.c.id}"><div class="mini ${r.loc ? 'loc' : ''} ${r.done ? 'done' : ''} ${can ? 'can' : ''}" title="${esc(d.name)}"><img alt="" src="${U.cardArt(r.c.id)}"><span class="q">${r.done ? 'Completed' : esc(d.name)}</span></div></div>`; }
      return `<div class="rcard ${r.ex ? 'ex' : ''}" title="${r.ex ? 'Exhausted resource' : 'Ready resource'}"><div class="cardback"></div></div>`;
    }).join('') + (p.tempRes ? `<div class="rcard"><div class="temp" title="Extra resources this turn">+${p.tempRes}</div></div>` : '');
    const allies = p.allies.map(a => {
      const d = E.allyDef(a), can = canAct && E.canAttackWith(p, a);
      return unitHTML('ally', { ref: a.uid, p: p.idx, name: d.name, img: U.cardArt(a.id), atk: E.allyAtk(p, a), hp: E.allyMax(p, a) - a.damage, max: E.allyMax(p, a), kws: (d.kw || []).concat(E.allyKw(p, a, 'ferocity') && !(d.kw || []).includes('ferocity') ? ['ferocity'] : []), buffA: a.atkB + a.tmp > 0, buffH: a.hpB > 0, uc: facColor[d.fac || 'neutral'], cls: [a.ex ? 'ex' : '', a.sick ? 'sick' : '', a.frozen ? 'frozen' : '', can && !view.mode ? 'can' : '', tcls(a.uid)] });
    }).join('') || `<span class="empty">${dead ? 'Fallen.' : 'No allies yet. Play ally cards to build your party.'}</span>`;
    // hand
    const n = p.hand.length, mid = (n - 1) / 2;
    const hand = p.hand.map((c, i) => { const ok = canAct && (E.canPlay(p, c).ok || (!p.resPlayed)); const playable = canAct && E.canPlay(p, c).ok; return `<div class="hc ${playable ? 'play' : ''}" data-uid="${c.uid}" style="transform:rotate(${((i - mid) * 3).toFixed(1)}deg) translateY(${(Math.abs(i - mid) * 5).toFixed(0)}px)" tabindex="0">${U.cardHTML(c.id, { holo: c.holo })}</div>`; }).join('');
    const status = g.over ? '' : g.cfg.bossPlayer ? (g.phase === 'boss' ? `Your turn, ${esc(raid.short)}. Choose your cards and targets.` : `You are ${esc(raid.short)}. ${esc(E.pdef(active).name)} is taking a turn…`) : g.phase === 'boss' ? `${esc(raid.short)} is acting…` : !human(active) ? (net && !active.auto ? `${esc(E.g.cfg.party[active.idx].name || E.pdef(active).name)} is taking their turn…` : `${esc(E.pdef(active).name)} (AI) is acting…`) : view.busy ? 'Resolving…' : p.resPlayed ? 'Resource played this turn.' : 'You may play one card as a resource.';
    // roster
    const roster = g.players.map(q => {
      const qd = E.pdef(q), pct = Math.max(0, E.heroHp(q)) / E.heroMax(q) * 100;
      const chips = q === p ? '' : q.allies.map(a => `<span class="rchip${tcls(a.uid)}" data-ref="${a.uid}" title="${esc(E.allyDef(a).name)}">${esc(E.allyDef(a).name.split(' ')[0])} ${E.allyAtk(q, a)}/${E.allyMax(q, a) - a.damage}</span>`).join('');
      return `<div class="rmember ${q === active && g.phase !== 'boss' ? 'active' : ''} ${q.hero.dead ? 'dead' : ''}" data-focus="${q.idx}"><img class="herochip${q === p ? '' : tcls('hero' + q.idx)}" ${q === p ? '' : `data-ref="hero${q.idx}"`} alt="" src="${U.cardArt(q.hero.master || q.heroId)}"><div><div class="rn">${esc(qd.name)}${q.auto ? ' (AI)' : ''}</div><div class="rbar"><i style="width:${pct}%"></i></div><div class="rmeta">${Math.max(0, E.heroHp(q))}/${E.heroMax(q)} health${q.hero.shield ? ` · ward ${q.hero.shield}` : ''} · threat ${q.threat} · ${q.hand.length} in hand</div>${chips}</div></div>`;
    }).join('');
    const logHTML = g.log.slice(-120).map(e => `<div class="${e.cls}">${esc(e.msg)}</div>`).join('');

    morph(root, `<div class="table">
      <div class="topbar"><span class="raidname">${esc(raid.name)}</span><span class="round">Round ${g.round}${g.cfg.difficulty === 'heroic' ? ' · Heroic' : ''}</span><span class="sp"></span>
        <span class="bossdeck" title="Cards left in the boss deck">Boss deck ${B.deck.length} · discard ${B.grave.length}</span>
        <button class="btn small ghost" data-act="speed" title="Animation speed">${speed() === 1 ? 'Speed: normal' : speed() < 0.3 ? 'Speed: very fast' : 'Speed: fast'}</button><button class="btn small ghost" data-act="rulesref">Rules</button><button class="btn small ghost" data-act="quit">Leave raid</button></div>
      <div class="bossarea ${raid.id}"><div class="bosscard${tcls('boss')}" data-ref="boss" tabindex="0" aria-label="${esc(raid.boss)}, ${E.bossHp()} health"><img alt="" src="${U.art(raid.art, 'raid:' + raid.id)}"><div class="bn"><b>${esc(raid.short)}</b><span>${esc(raid.boss.split(', ')[1] || raid.name)}</span></div></div>
        <div class="bossinfo"><div class="hpbar"><div class="ghost" style="width:${view.hpGhost}%"></div><div class="fill" style="width:${hpPct}%"></div>${ticks}<div class="txt">${Math.max(0, E.bossHp())} / ${B.maxHp}</div></div>
          <div class="bossrow">${counter}<span class="chip" title="The boss strikes the hero with the most threat at the end of its turn">Strike ${strike}</span><span class="chip" title="Melee attackers take this much damage back">Retaliation ${raid.retaliation}</span>${E.guardians().length ? '<span class="chip" style="color:#ffd27a">Guarded — defeat the Guardian first</span>' : ''}${events}${mark}${stun}</div>
          <div class="minions">${minions}</div></div></div>
      <div class="playerzone"><div class="herocol"><div style="width:clamp(150px,13vw,200px)">${heroCard}</div><div class="gearcol">${gear}</div></div>
        <div class="restray"><span class="lbl">Resources</span><span class="avail" title="Ready resources / total">${E.available(p)}<small style="font-size:.6em;color:var(--muted)">/${p.res.length + p.tempRes}</small></span>${resCards}</div>
        <div class="allies">${allies}</div></div>
      <div class="handbar"><div style="${view.ov ? '--ov:' + view.ov : ''}" class="hand ${p === active && human(p) ? '' : 'other'}">${hand}</div>
        <div class="turnctl ${g.cfg.bossPlayer ? 'bossmode' : ''}"><button class="btn primary" data-act="end" ${canAct ? '' : 'disabled'}>End turn</button><button class="btn" data-act="auto" ${canAct ? '' : 'disabled'} title="Let the AI finish this turn for you">Auto-play turn</button><div class="hint">${status}</div></div></div>
      ${view.mode ? `<div class="tbar ${view.mode.friendly ? 'friendly' : ''}">${esc(view.mode.label)} <button class="btn small ghost" data-act="cancel" style="margin-left:.6rem">Cancel</button></div>` : ''}
    </div>
    <div class="side"><div class="roster"><h5>Party</h5>${roster}</div><div class="logbox"><h5>Raid log</h5><div class="log" aria-live="polite">${logHTML}</div></div></div>`);
    const lb = $('.logbox', root); if (lb) lb.scrollTop = lb.scrollHeight;
    const hEl = $('.hand', root);
    if (hEl && n) { const hc = hEl.querySelector('.hc'); const cw = hc.offsetWidth || 140; const room = hEl.clientWidth - cw * 0.5; const ov = Math.min(-cw * 0.12, (room - n * cw) / (2 * n)); view.ov = Math.max(-cw * 0.42, ov) + 'px'; hEl.style.setProperty('--ov', Math.max(-cw * 0.42, ov) + 'px'); }
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
    b.style.animationDuration = (ms || 1500) * speed() + 'ms';
    document.body.appendChild(b); setTimeout(() => b.remove(), (ms || 1500) * speed() + 50);
  }
  function reveal(html, ms, onTop, who) {
    const o = document.createElement('div'); o.className = 'overlay clear'; o.innerHTML = `<div class="reveal">${who ? `<div class="who">${esc(who)}</div>` : ''}${html}</div>`;
    document.body.appendChild(o);
    return wait(ms).then(() => o.remove());
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
        case 'play': { if (C[d.id] && C[d.id].type === 'ability') U.sfx.spell(); else U.sfx.card(); const byAI = !human(E.g.players[d.p]); if (speed() > 0.2 || byAI) await reveal(U.cardHTML(d.id, { holo: d.holo }), byAI ? 1700 : 800, null, byAI ? E.pdef(E.g.players[d.p]).name : null); break; }
        case 'bossCard': { U.sfx.bossReveal(); await reveal(U.cardHTML(d.id), 2600, null, E.raid.short + ' plays'); break; }
        case 'phase': U.sfx.phase(E.raid.id); banner(d.name, 'boss', d.text, 2600); await wait(2200); break;
        case 'turn': { const p = E.g.players[d.p]; view.focus = d.p; flush(); if (E.g.players.length > 1 || E.g.round === 1) { banner(E.g.players.length > 1 ? d.hero : 'Your turn', '', E.g.players.length > 1 ? (p.auto ? 'AI controlled' : 'Your turn') : 'Round ' + E.g.round, 1100); await wait(800); } break; }
        case 'bossTurn': U.sfx.bossTurn(); banner(d.name + '\'s turn', 'boss', null, 1100); await wait(850); break;
        case 'counter': await wait(250); break;
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
        <div class="acts"><button class="btn ghost" data-v="0">Play the first card</button></div>`, { dismiss: '0' });
      return v == null ? 0 : +v;
    }
    if (kind === 'bossTarget') {
      const opts = d.options.map((t, i) => { const hero = t.t === 'hero'; const art = hero ? U.cardArt(t.p.heroId) : U.cardArt(t.a.id); return `<button class="tpick" data-v="${i}"><img alt="" src="${art}"><b>${esc(E.nameOf(t))}</b><span>${hero ? 'Hero' : 'Ally'} · ${E.hpOf(t)}/${E.maxHpOf(t)} health${E.atkOf(t) ? ` · hits back for ${hero ? E.heroAtk(t.p) : E.atkOf(t)}+` : ''}</span></button>`; }).join('');
      const v = await U.dialog(`<h3>${esc(d.from)} attacks (${d.atk} damage)</h3><p>${d.strike ? 'Your boss strike' : 'Your minion'} is ready. Choose who to hit. A ready Protector ally may step in front of its hero.</p><div class="tpicks">${opts}</div><div class="acts"><button class="btn ghost" data-v="auto">Let it choose</button></div>`, { dismiss: 'auto' });
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
      const html = `<h3>Respond?</h3><p>${esc(E.raid.short)} reveals <b>${esc(d.card.name)}</b>: ${esc(d.card.text)} You can answer with an Instant before it resolves.</p>
        <div class="cards"><div style="--cw:170px">${U.cardHTML(d.card.id)}</div>${opts.map((o, i) => `<div class="pick" data-v="${i}" title="${esc(E.pdef(o.p).name)}">${U.cardHTML(o.c.id, { holo: o.c.holo })}<div style="text-align:center;font-size:.8rem;color:var(--muted);margin-top:.3rem">${esc(E.pdef(o.p).name.split(' ')[0])} · ${E.available(o.p)} ready</div></div>`).join('')}</div>
        <div class="acts"><button class="btn primary" data-v="pass">Let it resolve</button></div>`;
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
    return null;
  }

  /* ---------- player actions (local, or sent through the online relay) ---------- */
  const ACTS = ['playResource', 'playCard', 'attack', 'usePower', 'useItem', 'completeQuest', 'useLocation'];
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
    p.auto = true; U.toast(`${E.g.cfg.party[p.idx].name} lost connection — the AI takes over their hero.`);
    if (E.g.phase === 'main' && E.g.turn === p.idx && !E.g.over) await doAction('auto', [p]);
  }
  async function netAnswer(seatIdx) {
    for (;;) {
      const m = await net.next();
      if (m.c.t === 'ans') return m.c.v;
      if (m.c.t === 'ai') { const p = E.g.players[m.c.seat]; if (p) p.auto = true; if (m.c.seat === seatIdx) return null; }
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
    if (E.g.over) return endScreen();
    const g = E.g;
    if (g.phase === 'main') view.focus = g.turn;
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
    U.popover(anchor, null, items);
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
    U.popover(anchor, E.pdef(p).name, items);
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
    if (!d.use) return U.popover(anchor, d.name, [{ why: d.text }]);
    const ok = E.itemReady(p, e);
    const items = [{ label: `Use ${esc(d.name)}${d.use.cost ? ` (pay ${d.use.cost})` : ''}`, disabled: !ok, go: () => {
      if (d.use.target && d.use.target !== 'none') { const friendly = d.use.target.startsWith('friendly'); startTargeting(`${d.name}: choose a target`, E.targetsFor(d.use.target, p), friendly, t => doAct('useItem', p, e, t)); }
      else doAct('useItem', p, e, null);
    } }];
    if (!ok) items.push({ why: e.ex ? 'Already used this turn.' : 'Not enough ready resources.' });
    U.popover(anchor, null, items);
  }
  function resAction(p, r, anchor) {
    const d = C[r.c.id];
    if (r.quest) {
      if (r.done) return U.popover(anchor, d.name, [{ why: 'Completed. It still counts as a resource.' }]);
      const ok = E.questReady(p, r);
      return U.popover(anchor, d.name, [{ label: `Complete quest${d.qcost ? ` (pay ${d.qcost})` : ''}`, disabled: !ok, go: () => doAct('completeQuest', p, r) }, ...(ok ? [] : [{ why: d.cond && !d.cond(E, p) ? `Complete when ${d.condText}.` : 'Not enough ready resources.' }])]);
    }
    if (r.loc) {
      const ok = E.locationReady(p, r);
      return U.popover(anchor, d.name, [{ label: `Use location (pay ${d.lcost})`, disabled: !ok, go: () => { if (d.ltarget) startTargeting(`${d.name}: choose a target`, E.targetsFor(d.ltarget, p), true, t => doAct('useLocation', p, r, t)); else doAct('useLocation', p, r, null); } }, ...(ok ? [] : [{ why: r.used ? 'Already used this turn.' : 'Not enough ready resources.' }])]);
    }
  }
  function onClick(e) {
    if (!E) return;
    const t = e.target;
    const act = t.closest('[data-act]');
    if (act && act.dataset.act === 'cancel') { view.mode = null; return render(); }
    if (act && act.dataset.act === 'quit') return leave();
    if (act && act.dataset.act === 'rulesref') return U.dialog(`<h3>${esc(E.raid.name)}</h3><ul style="padding-left:1.1rem;color:#d8ccb0;line-height:1.5">${E.raid.rules.map(r => `<li><b style="color:var(--vellum)">${esc(r.name)}.</b> ${esc(r.text)}</li>`).join('')}</ul><p style="font-size:.92rem">Click a card in your hand to play it or use it as a resource. Click an ally or your hero to attack. Glowing cards and units are ready to use. Hover anything to see its full card.</p><div class="acts"><button class="btn primary" data-v="ok">Back to the raid</button></div>`, { dismiss: 'ok' });
    if (act && act.dataset.act === 'speed') { const s = save.settings; s.speed = s.speed === 1 ? 0.55 : s.speed > 0.3 ? 0.15 : 1; U.persist(); return render(); }
    const focus = t.closest('[data-focus]');
    // targeting mode
    if (view.mode) {
      const refEl = t.closest('[data-ref]');
      if (refEl) {
        const tgt = view.mode.valid.find(x => E.refId(x) === refEl.dataset.ref);
        if (tgt) { const go = view.mode.go; view.mode = null; return go(tgt); }
      }
      if (focus && !refEl) { view.focus = +focus.dataset.focus; return render(); }
      return;
    }
    if (focus && !t.closest('[data-ref]')) { view.focus = +focus.dataset.focus; return render(); }
    if (!myTurn()) return;
    const p = E.g.players[E.g.turn];
    if (fp() !== p) { view.focus = E.g.turn; return render(); }
    if (act) {
      switch (act.dataset.act) {
        case 'end': return doAct('end', p);
        case 'auto': return doAct('auto', p);
        case 'power': return usePower(p);
        case 'hero': return heroActions(p, act);
        case 'item': { const it = p.items.find(x => x.c.uid === act.dataset.gid); if (it) return itemAction(p, it, act); return; }
        case 'res': { const r = p.res[+act.dataset.ri]; if (r) return resAction(p, r, act); return; }
        case 'weapon': return U.popover(act, C[p.weapon.c.id].name, [{ why: `Attack with your hero to use this weapon (strike cost ${C[p.weapon.c.id].strike}). It can also strike back when your hero is attacked.` }]);
        case 'armor': return U.popover(act, C[act.dataset.card].name, [{ why: 'Armor blocks automatically when your hero takes damage, if you have enough ready resources to pay its cost.' }]);
      }
    }
    const hc = t.closest('.hc'); if (hc) { const inst = p.hand.find(c => c.uid === hc.dataset.uid); if (inst) return cardActions(p, inst, hc); }
    const unit = t.closest('.unit[data-kind=ally]');
    if (unit) {
      const a = p.allies.find(x => x.uid === unit.dataset.ref);
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
    view.mode = null; view.busy = true; view.focus = 0; view.hpGhost = null; view.lock = 0;
    E = RB.newGame(cfg, { anim, update: schedule, ask, log: () => schedule() });
    U.currentGame = E;
    E.g.onAiStep = () => wait(550);
    RB.AUDIO.music(cfg.raid || (E.raid && E.raid.id));
    root.onclick = onClick;
    root.onmouseover = onOver;
    root.onmouseleave = () => U.hidePreview();
    document.onkeydown = e => {
      if (!E || $('#battle').classList.contains('hidden')) return;
      if (e.key === 'Escape') { if (view.mode) { view.mode = null; render(); } U.closePop(); U.hidePreview(); }
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.closest && document.activeElement.closest('#battle .hc, #battle .unit, #battle .herocard, #battle .bosscard')) { e.preventDefault(); document.activeElement.click(); }
    };
    render();
    if (net) { const mine = cfg.party.findIndex(s => s.owner === net.id); if (mine >= 0) view.focus = mine; net.attach({ apply: applyNet, game: () => E }); }
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
    const heroesBefore = RB.UNLOCK_HEROES.filter(id => U.heroOpen(id));
    const gold = RB.goldFor(g, win); save.gold = (save.gold || 0) + gold.total; U.persist();
    let fresh = []; if (win) { save.wins[raid.id] = (save.wins[raid.id] || 0) + 1; if (g.cfg.difficulty === 'heroic') save.heroicWins[raid.id] = (save.heroicWins[raid.id] || 0) + 1; U.persist(); fresh = U.checkUnlocks(); U.sfx.win(); RB.AUDIO.music('victory'); } else { RB.AUDIO.music(null); U.sfx.lose(); }
    const stats = `<div class="stats"><div><b>${g.round}</b>rounds</div><div><b>${g.stats.dmgDealt}</b>damage dealt</div><div><b>${g.stats.cardsPlayed}</b>cards played</div><div><b>${g.players.filter(p => !p.hero.dead).length}/${g.players.length}</b>heroes standing</div></div>`;
    const heroic = g.cfg.difficulty === 'heroic';
    const newHeroes = RB.UNLOCK_HEROES.filter(id => U.heroOpen(id) && !heroesBefore.includes(id));
    const goldBox = `<div class="goldbox"><div class="gtitle">+${gold.total} gold <span>(you have ${save.gold})</span></div><div class="gparts">${gold.parts.map(([k, v]) => `<span>${esc(k)} <b>+${v}</b></span>`).join('')}</div>${win ? '<div class="gnote">Open your treasure first — then visit the Market from the title screen.</div>' : '<button class="btn small" data-act="market">Spend it in the Market</button>'}</div>`
      + (newHeroes.length ? `<div class="newvault"><b>New hero unlocked:</b> ${newHeroes.map(id => `<span><img alt="" src="${U.cardArt(id)}">${esc(RB.HEROES[id].name)}</span>`).join('')}</div>` : '');
    const el = U.show('end', win
      ? `<div class="endscreen"><h2>Victory</h2><p class="tagline">${esc(raid.boss)} has fallen. The treasure is yours.</p>${stats}${goldBox}${U.packHTML({ theme: raid.id === 'crypt' ? 'void' : raid.id === 'tide' ? 'frost' : 'ember', img: U.art(raid.art, 'raid:' + raid.id), wide: true, act: 'open', cls: 'treasure', title: 'Raid Treasure', set: raid.name + (heroic ? ' · Heroic' : ''), count: '5 cards', fine: 'A guaranteed epic treasure card<br>Holofoils and a chance of loot', burst: true, label: 'Open treasure pack' })}<p style="color:var(--muted)">Click the pack to open it.</p>${fresh.length ? `<div class="newvault"><b>New in the Vault:</b> ${fresh.map(id => `<span><img alt="" src="${U.cosImg(id)}">${esc(RB.COSMETICS[id].name)}</span>`).join('')}</div>` : ''}</div>`
      : `<div class="endscreen lose"><h2>The raid has wiped</h2><p class="tagline">${esc(raid.short)} still stands with ${Math.max(0, E.bossHp())} health. Regroup and try again.</p>${stats}${goldBox}<div class="menu" style="flex-direction:row;justify-content:center"><button class="btn primary" data-act="retry">Try again</button><button class="btn" data-act="party">Change party</button><button class="btn ghost" data-act="title">Title</button></div></div>`);
    el.onclick = e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'open') return U.openPack(raid.id, heroic, a);
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
    const parts = [['Result', bossWon ? 80 : 20], ['Heroes defeated', slain * 15], ['Damage dealt', Math.round((g.stats.dmgTaken || 0) * 0.3)]];
    const total = parts.reduce((s, x) => s + x[1], 0);
    save.gold = (save.gold || 0) + total; save.bossWins = (save.bossWins || 0) + (bossWon ? 1 : 0); U.persist();
    if (bossWon) { U.sfx.win(); RB.AUDIO.music('victory'); } else { RB.AUDIO.music(null); U.sfx.lose(); }
    const stats = `<div class="stats"><div><b>${g.round}</b>rounds</div><div><b>${slain}/${g.players.length}</b>heroes defeated</div><div><b>${Math.max(0, E.bossHp())}</b>health left</div></div>`;
    const goldBox = `<div class="goldbox"><div class="gtitle">+${total} gold <span>(you have ${save.gold})</span></div><div class="gparts">${parts.map(([k, v]) => `<span>${esc(k)} <b>+${v}</b></span>`).join('')}</div></div>`;
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
