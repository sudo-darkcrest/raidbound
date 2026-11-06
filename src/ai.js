/* RAIDBOUND — hero autopilot (used by "Auto-play turn", AI seats and the balance simulator) and deck auto-builder */
(function (RB) {
  const C = RB.CARDS;
  const AI = RB.AI = {};

  function enemyValue(E, t, dmg) {
    if (t.t === 'boss') { const hp = E.bossHp(); return hp <= dmg ? 1000 : dmg * 1.05; }
    const hp = E.hpOf(t), d = E.minDef(t.m), atk = E.minAtk(t.m), guard = (d.kw || []).includes('guardian');
    if (dmg >= hp) return 10 + atk * 2.2 + (guard ? 16 : 0) + hp * 0.3;
    return dmg * 0.55 + (guard ? 4 : 0);
  }
  function bestEnemy(E, p, dmg, list) {
    let best = null, bs = -1;
    for (const t of (list || E.enemies())) { const s = enemyValue(E, t, dmg); if (s > bs) { bs = s; best = t; } }
    return { t: best, s: bs };
  }
  function mostWoundedFriendly(E, kind) {
    const list = kind === 'friendlyHero' ? E.heroes().map(E.T.hero) : E.friendlyChars();
    let best = null, bd = 0;
    for (const t of list) {
      const dmg = E.maxHpOf(t) - E.hpOf(t);
      const w = dmg * (t.t === 'hero' ? 1.3 : 0.7) + (t.t === 'hero' && E.hpOf(t) < 10 ? 6 : 0);
      if (w > bd) { bd = w; best = t; }
    }
    return best;
  }
  AI.enemyTarget = (E, p, dmg) => bestEnemy(E, p, dmg).t;

  // score a playable card; returns {s, target}
  function scoreCard(E, p, inst) {
    const d = C[inst.id];
    const sp = E.spellPower(p);
    const hpPct = E.heroHp(p) / E.heroMax(p);
    const tags = d.tags || [];
    const nMin = E.minions().length;
    switch (d.type) {
      case 'ally': {
        let s = 9 + d.atk * 1.2 + d.hp * 0.6 + ((d.kw || []).includes('protector') ? (hpPct < 0.6 ? 4 : 1.5) : 0) + ((d.kw || []).includes('ferocity') ? 1.5 : 0);
        let target = null;
        if (d.target === 'enemy') { const b = bestEnemy(E, p, 2 + sp); target = b.t; s += 2; }
        if (d.id === 'hedgewitch' || d.id === 'witchdoctor') s += E.mostWounded() ? 2 : 0;
        return { s, target };
      }
      case 'weapon': {
        if (!p.weapon) return { s: 14 + d.atk };
        const cur = C[p.weapon.c.id];
        return { s: d.atk > cur.atk ? 5 + (d.atk - cur.atk) * 2 : -1 };
      }
      case 'armor': {
        const cur = p.armor[d.slot];
        if (!cur) return { s: 8 + d.def * 1.5 + (d.spell ? 3 : 0) };
        return { s: d.def > C[cur.c.id].def ? 3 : -1 };
      }
      case 'item': {
        if (d.use && d.use.destroy) return { s: 5 };
        return { s: 8 + (d.spell ? 3 : 0) };
      }
      case 'master': return { s: 30 };
      case 'ability': {
        if (d.speed === 'instant' && (tags.includes('shield') || tags.includes('elusive')) && hpPct > 0.45) return { s: -1 }; // hold for the boss turn
        if (tags.includes('revive')) { const t = E.targetsFor('deadHero', p)[0]; return { s: t ? 50 : -1, target: t }; }
        if (d.target === 'enemy' && (tags.includes('dmg') || tags.includes('stun'))) {
          if (tags.includes('stun')) return { s: -1 };
          let dmg = (d.dmg || 3) + sp;
          if (d.id === 'execute') { const b1 = bestEnemy(E, p, 4 + sp), list = E.enemies().filter(t => E.hpOf(t) * 2 <= E.maxHpOf(t)); const b2 = list.length ? bestEnemy(E, p, 10 + sp, list) : { s: -1 }; const b = b2.s > b1.s ? b2 : b1; return { s: b.s + (tags.includes('heal') ? 2 : 0), target: b.t }; }
          if (d.id === 'mortalstrike' && p.weapon) dmg = 6 + sp;
          if (d.id === 'backstab' && p.weapon && C[p.weapon.c.id].wtype === 'dagger') dmg = 4 + sp;
          if (d.id === 'aimedshot' && p.weapon && ['bow', 'crossbow'].includes(C[p.weapon.c.id].wtype)) dmg = 5 + sp;
          const b = bestEnemy(E, p, dmg);
          return { s: b.s + (tags.includes('heal') ? 2 : 0) + (tags.includes('healAll') ? 2 : 0), target: b.t };
        }
        if (d.target === 'minion') {
          let best = null, bs = -1;
          for (const t of E.minions()) { const s = 6 + E.minAtk(t.m) * 2.4 + E.hpOf(t) * 0.5 + ((E.minDef(t.m).kw || []).includes('guardian') ? 14 : 0); if (s > bs) { bs = s; best = t; } }
          return { s: bs, target: best };
        }
        if (tags.includes('aoe') || tags.includes('aoeMinion')) {
          const dmg = (d.dmg || 2) + sp; let s = 0;
          for (const t of (tags.includes('aoeMinion') ? E.minions() : E.enemies())) s += t.t === 'boss' ? dmg : Math.min(dmg, E.hpOf(t)) * 0.8 + (dmg >= E.hpOf(t) ? 5 : 0);
          if (d.id === 'whirlwind') s += 2 + sp;
          return { s: s + (tags.includes('draw') ? 4 : 0) };
        }
        if (tags.includes('dmgRandom')) return { s: (d.dmg || 3) * 1.1 + sp * (d.id === 'missiles' ? 3 : 4) };
        if (tags.includes('heal') && d.target) {
          const t = mostWoundedFriendly(E, d.target);
          if (!t) return { s: -1 };
          const missing = E.maxHpOf(t) - E.hpOf(t);
          return { s: missing >= (d.heal || 4) * 0.7 ? Math.min(missing, d.heal || 4) * 1.4 : -1, target: t };
        }
        if (tags.includes('selfheal')) { const miss = E.heroMax(p) - E.heroHp(p); return { s: miss >= 4 ? Math.min(miss, d.heal || 6) * 1.3 + 3 : (p.hand.length <= 3 ? 4 : -1) }; }
        if (tags.includes('healAll')) { let tot = 0; for (const t of E.friendlyChars()) tot += Math.min(d.heal || 4, E.maxHpOf(t) - E.hpOf(t)); return { s: tot >= 6 ? tot * 1.1 : -1 }; }
        if (tags.includes('shield')) {
          if (d.target === 'friendlyHero') { const t = mostWoundedFriendly(E, 'friendlyHero') || E.T.hero(p); return { s: 6, target: t }; }
          return { s: tags.includes('taunt') ? (E.heroes().length > 1 && hpPct > 0.5 ? 7 : 2) : 6 };
        }
        if (tags.includes('taunt')) return { s: (E.heroes().length > 1 && hpPct > 0.55 ? 7 : 0) + (tags.includes('draw') ? 6 : 0) };
        if (tags.includes('draw')) return { s: p.hand.length <= 5 ? 8 + (tags.includes('buff') ? 1 : 0) : 3 };
        if (tags.includes('summon')) return { s: 10 };
        if (tags.includes('buff') && d.target === 'ally') { const t = E.T.ally; const own = p.allies.filter(a => true); if (!own.length) return { s: -1 }; const a = own.reduce((x, y) => E.allyAtk(p, y) > E.allyAtk(p, x) ? y : x); return { s: 9, target: t(p, a) }; }
        if (tags.includes('buff')) return { s: E.canAttackWith(p, 'hero') || p.weapon ? 4 : -1 };
        if (tags.includes('ramp')) { const big = p.hand.some(c => C[c.id].type !== 'quest' && C[c.id].cost > E.available(p) && C[c.id].cost <= E.available(p) + 2 - d.cost); return { s: big ? 12 : -1 }; }
        if (tags.includes('stunAll')) return { s: nMin >= 2 ? 6 + nMin : -1 };
        if (tags.includes('mark')) { const attackers = p.allies.filter(a => !a.ex && !a.sick).length + (p.weapon ? 1 : 0); return { s: attackers >= 2 && !E.guardians().length ? 4 + attackers * 2 : -1 }; }
        if (tags.includes('ready')) { const n = p.allies.filter(a => a.ex && !a.sick).length; return { s: n * 3 - 1 }; }
        if (tags.includes('elusive')) return { s: hpPct < 0.35 ? 8 : -1 };
        return { s: 2 };
      }
    }
    return { s: -1 };
  }

  function candidateActions(E, p) {
    const acts = [];
    // quests
    for (const r of p.res) if (E.questReady(p, r)) acts.push({ s: 40, go: () => E.completeQuest(p, r) });
    // location
    const loc = p.res.find(r => r.loc);
    if (loc && E.locationReady(p, loc)) {
      const d = C[loc.c.id];
      let s = 0, target = null;
      if (d.id === 'citadel' || d.id === 'encampment') s = 9;
      else if (d.id === 'moonwell') { target = mostWoundedFriendly(E, 'friendlyHero'); s = target && E.maxHpOf(target) - E.hpOf(target) >= 3 ? 7 : -1; }
      else if (d.id === 'library') s = 6;
      else if (d.id === 'ashenforge') s = E.canAttackWith(p, 'hero') ? 5 : -1;
      if (s > 0) acts.push({ s, go: () => E.useLocation(p, loc, target) });
    }
    // power
    const hd = RB.HEROES[p.heroId];
    if (!p.hero.powerUsed && !p.hero.master) {
      const pw = hd.power, tags = pw.tags || [];
      const bossPct = E.bossHp() / E.g.boss.maxHp;
      let s = -1, target = null;
      if (tags.includes('dmg')) { const b = bestEnemy(E, p, (pw.dmg || 8) + E.spellPower(p)); target = b.t; s = (bossPct < 0.45 || E.g.round >= 6 || (b.t && b.t.t === 'minion' && b.s > 20)) ? 25 : -1; }
      else if (tags.includes('aoe')) { const n = E.enemies().length; s = (n >= 3 || E.g.round >= 6) ? 18 + n * 4 : -1; }
      else if (tags.includes('heal')) { target = mostWoundedFriendly(E, 'friendly'); s = target && E.maxHpOf(target) - E.hpOf(target) >= 10 ? 30 : -1; }
      else if (tags.includes('healAll')) { let tot = 0; for (const t of E.friendlyChars()) tot += Math.min(6, E.maxHpOf(t) - E.hpOf(t)); s = tot >= 14 ? 30 : -1; }
      else if (tags.includes('buff')) s = (E.g.round >= 4 && (p.weapon || E.heroAtk(p) > 0)) ? 16 : -1;
      else if (tags.includes('draw')) s = (p.hand.length <= 2 || E.heroHp(p) <= 10) ? 18 : -1;
      if (s > 0) acts.push({ s, go: () => E.usePower(p, target) });
    }
    // cards
    for (const inst of p.hand) {
      const d = C[inst.id];
      if (!E.canPlay(p, inst).ok) continue;
      const sc = scoreCard(E, p, inst);
      if (sc.s <= 0) continue;
      if (E.needsTarget(inst) && !sc.target) continue;
      acts.push({ s: sc.s - d.cost * 0.15, go: () => E.playCard(p, inst, sc.target) });
    }
    // items
    for (const e of p.items) {
      if (!E.itemReady(p, e)) continue;
      const d = C[e.c.id];
      let s = -1, target = null;
      const tags = d.tags || [];
      if (tags.includes('heal')) { target = mostWoundedFriendly(E, d.use.target); s = target && E.maxHpOf(target) - E.hpOf(target) >= (d.heal || 4) ? 8 : -1; }
      else if (tags.includes('dmg')) { const b = bestEnemy(E, p, d.dmg || 4); target = b.t; s = b.s > 6 || E.g.round >= 5 ? b.s : -1; }
      else if (tags.includes('ramp')) s = p.hand.some(c => C[c.id].cost === E.available(p) + 1) ? 7 : -1;
      else if (tags.includes('draw')) s = d.use.cost ? (E.available(p) >= d.use.cost + 0 ? 3 : -1) : 4;
      else if (tags.includes('buff')) s = d.id === 'warhorn' ? (p.allies.filter(a => !a.ex && !a.sick).length >= 2 ? 5 : -1) : (E.canAttackWith(p, 'hero') ? 4 : -1);
      if (s > 0) acts.push({ s, go: () => E.useItem(p, e, target) });
    }
    // attacks
    const targets = E.attackTargets();
    if (targets.length) {
      const attackers = [];
      if (E.canAttackWith(p, 'hero')) attackers.push('hero');
      for (const a of p.allies) if (E.canAttackWith(p, a)) attackers.push(a);
      for (const who of attackers) {
        let atk, myHp, lr;
        if (who === 'hero') {
          const useW = p.weapon && !p.weapon.ex && E.available(p) >= C[p.weapon.c.id].strike;
          atk = E.heroAttackValue(p, useW); myHp = E.heroHp(p); lr = useW && (C[p.weapon.c.id].kw || []).includes('longrange');
        } else { atk = E.allyAtk(p, who); myHp = E.allyMax(p, who) - who.damage; lr = E.allyKw(p, who, 'longrange'); }
        let best = null, bs = -1;
        for (const t of targets) {
          const back = lr ? 0 : t.t === 'boss' ? E.raid.retaliation : E.minAtk(t.m);
          const dies = back >= myHp;
          let s = enemyValue(E, t, atk) - back * (who === 'hero' ? 0.9 : 0.45);
          if (dies) s -= who === 'hero' ? 999 : 6 + atk;
          if (who === 'hero' && myHp - back < 8 && back > 0) s -= 6;
          if (s > bs) { bs = s; best = t; }
        }
        if (best && bs > 0) acts.push({ s: Math.min(bs, 12) * 0.6 + 1, go: () => E.attack(p, who, best) });
      }
    }
    return acts;
  }

  function chooseResource(E, p) {
    const res = p.res.length;
    const hand = p.hand;
    if (!hand.length) return null;
    const quest = hand.find(c => C[c.id].type === 'quest');
    const location = hand.find(c => C[c.id].type === 'location');
    if (location && !p.res.some(r => r.loc)) return location;
    if (quest && res < 9) return quest;
    if (location) return location;
    if (res >= 7 && hand.length <= 4) return null;
    if (res >= 9) return null;
    let worst = null, wv = 1e9;
    const counts = {};
    hand.forEach(c => counts[c.id] = (counts[c.id] || 0) + 1);
    for (const c of hand) {
      const d = C[c.id];
      let v = 6;
      if (d.type === 'weapon') v = p.weapon ? 2 : 8;
      else if (d.type === 'armor') v = p.armor[d.slot] ? 1.5 : 6;
      else if (d.type === 'item') v = 4.5;
      else if (d.type === 'master') v = res < 4 ? 5 : 10;
      else if (d.type === 'ally') v = 6 + d.atk * 0.3;
      else if (d.type === 'ability') v = 6.5 + (d.rarity === 'r' ? 1 : 0);
      if (d.cost > res + 3) v -= 3;
      if (d.cost <= 1 && d.type === 'ability') v -= 0.5;
      if (counts[c.id] > 1) v -= 1;
      if (v < wv) { wv = v; worst = c; }
    }
    return worst;
  }

  AI.playTurn = async function (E, p) {
    if (!p.resPlayed) { const r = chooseResource(E, p); if (r) await E.playResource(p, r); }
    let guard = 0;
    while (guard++ < 60 && !E.g.over && E.isActive(p)) {
      const acts = candidateActions(E, p);
      if (!acts.length) break;
      acts.sort((a, b) => b.s - a.s);
      const res = await acts[0].go();
      if (res && res.ok === false) break;
      if (E.g.onAiStep) await E.g.onAiStep();
    }
  };
  AI.suggest = function (E, p) {
    const acts = candidateActions(E, p);
    acts.sort((a, b) => b.s - a.s);
    return acts[0] || null;
  };
  AI.chooseResource = chooseResource;
  AI.chooseArmor = function (E, p, n, slots) {
    const list = slots.map(s => ({ s, d: C[p.armor[s].c.id] })).sort((a, b) => (b.d.def - b.d.use) - (a.d.def - a.d.use));
    const out = []; let left = n, avail = E.available(p);
    for (const x of list) { if (left <= 0) break; if (avail < x.d.use) continue; if (x.d.use > 0 && left < 2 && E.heroHp(p) > 10) continue; out.push(x.s); avail -= x.d.use; left -= x.d.def; }
    return out;
  };
  AI.chooseStrikeBack = () => true;
  AI.chooseInstant = function (E, p, bc) {
    const avail = E.available(p);
    const harmful = bc.kind === 'attack' || bc.kind === 'curse';
    for (const inst of p.hand) {
      const d = C[inst.id];
      if (d.type !== 'ability' || d.speed !== 'instant' || d.cost > avail) continue;
      const tags = d.tags || [];
      if (tags.includes('shield') && harmful) {
        if (d.target === 'friendlyHero') { const t = E.heroes().filter(h => h.hero.shield === 0 && E.heroHp(h) <= 16).sort((a, b) => E.heroHp(a) - E.heroHp(b))[0]; if (t) return { p, inst, target: E.T.hero(t) }; }
        else if (p.hero.shield === 0 && E.heroHp(p) <= 16) return { p, inst, target: null };
      }
      if (tags.includes('elusive') && harmful && E.heroHp(p) <= 9) return { p, inst, target: null };
      if (tags.includes('heal')) { const t = E.heroes().filter(h => E.heroHp(h) <= 9).sort((a, b) => E.heroHp(a) - E.heroHp(b))[0]; if (t) return { p, inst, target: E.T.hero(t) }; }
      if (tags.includes('stunAll') && E.minions().filter(t => E.minAtk(t.m) > 0).length >= 2) return { p, inst, target: null };
      if (tags.includes('stun')) { const m = E.minions().filter(t => E.minAtk(t.m) >= 3).sort((a, b) => E.minAtk(b.m) - E.minAtk(a.m))[0]; if (m) return { p, inst, target: m }; if (E.heroes().some(h => E.heroHp(h) <= 8)) return { p, inst, target: E.T.boss() }; }
    }
    return null;
  };

  /* ---------- deck building ---------- */
  RB.legalFor = function (heroId, d) {
    const h = RB.HEROES[heroId];
    if (!d || d.type === 'hero') return false;
    if (d.fac !== 'neutral' && d.fac !== h.fac) return false;
    if (d.cls && !d.cls.includes(h.cls)) return false;
    if (d.prof && !h.profs.includes(d.prof)) return false;
    const cls = RB.CLASSES[h.cls];
    if (d.type === 'weapon' && !cls.weapons.includes(d.wtype)) return false;
    if (d.type === 'armor' && !cls.armor.includes(d.atype)) return false;
    return true;
  };
  RB.maxCopies = d => (d.kw || []).includes('unique') || d.type === 'master' ? 1 : 2;
  RB.DECK_SIZE = 30;
  const STARTER = {
    aldric: { holystrike: 2, aegis: 2, consecration: 2, reckoning: 1, blessing: 1, challenge: 1, footman: 2, lionknight: 2, elowen: 1, sentinel: 1, battlemage: 2, dawnbreaker: 1, silverblade: 2, breastplate: 1, towershield: 1, ironhelm: 1, forgegauntlets: 1, draught: 1, lantern: 1, caravan: 1, ancientforge: 1, citadel: 1, archon: 1 },
    thorgrim: { aimedshot: 2, multishot: 2, companion: 2, rapidfire: 1, huntersmark: 1, feigndeath: 2, crossbowman: 2, packleader: 2, cavebear: 1, gryphon: 1, thalen: 1, crossbow: 2, longbow: 1, wardenmail: 1, bearhide: 1, rocketboots: 1, sapper: 1, draught: 1, bandage: 1, caravan: 1, bounty: 1, citadel: 1, archon: 1 },
    lyssara: { fireball: 2, frostnova: 1, missiles: 1, bandage: 2, blizzard: 2, pyroblast: 1, icebarrier: 2, polymorph: 1, manasurge: 1, footman: 2, lionknight: 1, battlemage: 2, mistranger: 1, elowen: 1, emberstaff: 1, sparkwand: 1, moonweave: 1, vestments: 1, sparkring: 1, draught: 1, caravan: 1, moonpetals: 1, library: 1, tempest: 1 },
    grukka: { mortalstrike: 2, bloodthirst: 2, whirlwind: 1, execute: 1, shieldwall: 2, bandage: 2, grunt: 2, raider: 1, wolfrider: 1, earthwarden: 1, gorza: 1, witchdoctor: 2, cleaver: 2, skullreaver: 1, breastplate: 1, towershield: 1, forgegauntlets: 1, warkilt: 1, draught: 1, caravan: 1, slaybeast: 1, encampment: 1, warlord: 1 },
    hruna: { smite: 2, stormlash: 2, ancestralwrath: 2, mend: 2, renewal: 1, warding: 1, witchdoctor: 1, windcaller: 2, earthwarden: 2, treant: 1, revenant: 1, grunt: 2, earthmace: 2, emberstaff: 1, vestments: 1, poultice: 2, draught: 1, moonpetals: 1, caravan: 1, encampment: 1, tempest: 1 },
    snix: { backstab: 2, ambush: 2, fanknives: 1, recuperate: 2, evasion: 1, kidneyshot: 1, pickpocket: 1, bandage: 1, tinkerer: 2, raider: 1, grunt: 2, wolfrider: 1, gorza: 1, twinfang: 1, stiletto: 2, wolfhide: 1, shadowboots: 1, rocketboots: 1, sapper: 2, giantelixir: 1, bounty: 1, encampment: 1, warlord: 1 },
  };
  RB.STARTER = STARTER;
  const value = (d) => ({ c: 0, u: 1, r: 2, e: 4 }[d.rarity] || 0) + (d.type === 'weapon' ? d.atk : 0) + (d.type === 'ally' ? (d.atk + d.hp) / 3 : 0);
  // Curated starter deck, upgraded with any owned raid treasure / loot that the hero can use.
  RB.buildDeck = function (heroId, owned, partySize) {
    const deck = [];
    for (const [id, k] of Object.entries(STARTER[heroId])) for (let i = 0; i < k; i++) deck.push(id);
    if (partySize > 1 && RB.HEROES[heroId].cls === 'priest') { const i = deck.lastIndexOf('grunt'); if (i >= 0) deck[i] = 'rebirth'; }
    if (owned) {
      const extras = Object.values(C).filter(d => (d.set !== 'core') && (owned[d.id] || 0) > 0 && RB.legalFor(heroId, d))
        .sort((a, b) => value(b) - value(a));
      for (const d of extras) {
        const want = Math.min(RB.maxCopies(d), owned[d.id]);
        for (let k = deck.filter(x => x === d.id).length; k < want; k++) {
          // replace the weakest card of the same type (or any non-epic card)
          const same = deck.map((id, i) => ({ id, i, d: C[id] })).filter(x => x.d.type === d.type && x.d.set === 'core');
          const pool = same.length ? same : deck.map((id, i) => ({ id, i, d: C[id] })).filter(x => x.d.set === 'core' && x.d.type !== 'master');
          if (!pool.length) break;
          pool.sort((a, b) => value(a.d) - value(b.d));
          deck[pool[0].i] = d.id;
        }
      }
    }
    return deck;
  };
})(globalThis.RB);
