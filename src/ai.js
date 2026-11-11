/* RAIDBOUND — hero autopilot (used by "Auto-play turn", AI seats and the balance simulator) and deck auto-builder */
(function (RB) {
  const C = RB.CARDS;
  const AI = RB.AI = {};

  function enemyValue(E, t, dmg) {
    const shieldId = E.raid.halvedBy, shielded = shieldId && E.g.boss.minions.some(m => m.id === shieldId); // #102 the Maw halves Nethys's damage
    if (t.t === 'boss') { const hp = E.bossHp(), B = E.g.boss, d2 = shielded ? Math.ceil(dmg / 2) : dmg; return hp <= d2 ? 1000 : d2 * 1.05 + (B.flying ? (B.ground + dmg >= B.groundMax ? 8 : dmg * 0.4) : 0); }
    const hp = E.hpOf(t), d = E.minDef(t.m), atk = E.minAtk(t.m), kw = d.kw || [], guard = kw.includes('guardian') || d.id === shieldId;
    // #110: Thick Hide soaks 1 of every hit; Ambush and Crushing minions are worth killing first; chipping a Frenzy minion only makes it angrier
    const eff = Math.max(0, dmg - (kw.includes('thickhide') ? 1 : 0));
    if (eff >= hp) return 10 + atk * 2.2 + (guard ? 16 : 0) + hp * 0.3 + (kw.includes('ambush') ? 3 : 0) + (kw.includes('crushing') ? 2 : 0);
    return eff * 0.55 + (guard ? 4 : 0) - (kw.includes('frenzy') && eff > 0 ? 1.5 : 0);
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
  // #110: is something nasty coming this boss turn? (a Soak omen or an omen that powers up the strike)
  function dangerSoon(E) {
    const B = E.g.boss;
    if (!B.omens || !B.omens.length || !E.nextOmenRound || E.nextOmenRound() !== E.g.round) return false;
    const o = RB.BOSSCARDS[B.omens[B.omens.length - 1]];
    return !!(o && (o.soak || /strike this turn/.test(o.text || '')));
  }
  // #79: how much of this hero's health the coming boss turn is likely to take (0 = safe, 1 = all of it), after its
  // ward and ready armor. The boss strikes the hero with the most threat (damage dealt this round), so a hero who is
  // already top threat, or alone, expects the strike; minions pick at random among heroes and allies.
  const DW = () => (RB.AI_DANGER != null ? RB.AI_DANGER : 1);
  function danger(E, p) {
    const heroes = E.heroes(), hp = E.heroHp(p);
    if (!heroes.length || hp <= 0 || !DW()) return 0;
    const B = E.g.boss, strike = E.strikeNow ? E.strikeNow() : E.raid.strike;
    const taunt = heroes.find(h => h.hero.taunt);
    let pS;
    if (B.stunned) pS = 0;
    else if (taunt) pS = taunt === p ? 1 : 0;
    else if (heroes.length === 1) pS = 1;
    else if (E.raid.dungeon) pS = 1 / heroes.length;
    else { const top = Math.max(...heroes.map(h => h.threat)); pS = top > 0 && p.threat >= top ? 0.85 : 1 / heroes.length; }
    const allies = heroes.reduce((n, h) => n + h.allies.length, 0);
    const mAtk = E.minions().reduce((n, t) => n + E.minAtk(t.m), 0);
    const mS = taunt ? (taunt === p ? 1 : 0) : E.raid.dungeon ? 1 / heroes.length : 1 / Math.max(1, heroes.length + allies);
    let block = p.hero.shield || 0;
    for (const e of Object.values(p.armor)) if (!e.ex) block += C[e.c.id].def * 0.7;
    const incoming = Math.max(0, strike * pS + mAtk * mS + (dangerSoon(E) ? 4 : 0) - block);
    return Math.min(1.5, incoming / hp) * DW();
  }
  AI.danger = danger;
  // #110: keep enough resources ready on your turn to play a React card (or defensive Instant) when the boss comes for you.
  // Resources ready again at the start of your own turn, so holding one back costs nothing next turn.
  function reactReserve(E, p) {
    let cheapest = null;
    for (const c of p.hand) {
      const d = C[c.id], t = d.tags || [];
      if (d.type !== 'ability' || d.speed !== 'instant' || !(d.react || t.includes('shield') || t.includes('elusive'))) continue;
      if (cheapest == null || d.cost < cheapest) cheapest = d.cost;
    }
    if (cheapest == null) return 0;
    const hpPct = E.heroHp(p) / E.heroMax(p), heroes = E.heroes();
    const top = heroes.reduce((a, b) => (b.threat > a.threat ? b : a), heroes[0]);
    const likely = heroes.length === 1 || top === p || hpPct < 0.6 || dangerSoon(E) || (E.raid.dungeon && hpPct < 0.75);
    return likely ? cheapest : 0;
  }
  AI.reactReserve = reactReserve;

  // score a playable card; returns {s, target}
  function scoreCard(E, p, inst, dz) {
    const sc = scoreCard0(E, p, inst);
    if (sc.s <= 0) return sc;
    // #79: with friends in the raid, the boss strikes whoever dealt the most damage this round. A hurt hero who would
    // take the lead with this hit draws the strike on themselves; let a healthier friend lead instead.
    if (RB.AI_THREAT !== 0 && DW() && C[inst.id].type === 'ability' && sc.target && (sc.target.t === 'boss' || sc.target.t === 'minion') && sc.s < 1000) {
      const hs = E.heroes(), d0 = C[inst.id];
      if (hs.length > 1 && !hs.some(h => h.hero.taunt) && !E.raid.dungeon) {
        const top = Math.max(0, ...hs.filter(h => h !== p).map(h => h.threat)), hit = (d0.dmg || 3) + E.spellPower(p), strike = E.strikeNow ? E.strikeNow() : E.raid.strike;
        if (p.threat <= top && p.threat + hit > top && E.heroHp(p) <= strike * 1.6 && hs.some(h => h !== p && E.heroHp(h) > E.heroHp(p) + 4)) sc.s -= 5;
      }
      if (sc.s <= 0) return sc;
    }
    if (!dz) return sc;
    // #79: when the coming boss turn could hurt badly, defense first; damage that doesn't remove a threat waits
    const d = C[inst.id], tags = d.tags || [], k = Math.min(1, dz), mine = sc.target && sc.target.t === 'hero' && sc.target.p === p;
    let s = sc.s;
    if (d.type === 'armor') s += p.armor[d.slot] ? 2 * k : 8 * k;
    else if (d.type === 'ally') s += ((d.kw || []).includes('protector') ? 4 : 0) * k;
    else if (d.type === 'ability') {
      const t = sc.target;
      if (tags.includes('heal') || tags.includes('selfheal') || tags.includes('healAll')) s += (mine || tags.includes('selfheal') ? 6 : tags.includes('healAll') ? 3 : 0) * k;
      else if (tags.includes('shield') && d.speed !== 'instant') s += 5 * k;
      if (tags.includes('dmg') || tags.includes('dmgRandom') || tags.includes('aoe')) {
        const kill = t && t.t === 'minion' && (d.dmg || 3) + E.spellPower(p) >= E.hpOf(t);
        const lethal = t && t.t === 'boss' && sc.s >= 1000;
        if (kill) s += E.minAtk(t.m) * 1.2 * k;                    // one less attacker on the boss turn
        else if (!lethal && !tags.includes('aoe') && !(tags.includes('heal') || tags.includes('shield'))) s *= 1 - 0.4 * k;
      }
    }
    return { s, target: sc.target };
  }
  function scoreCard0(E, p, inst) {
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
          for (const t of E.aoe(tags.includes('aoeMinion') ? E.minions() : E.enemies(), dmg)) s += t.t === 'boss' ? dmg : Math.min(dmg, E.hpOf(t)) * 0.8 + (dmg >= E.hpOf(t) ? 5 : 0);
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
      // fix-sim: the AI only knew the five core locations, so Frontier and raid-treasure locations were claimed and never used
      const heroDmg = E.heroMax(p) - E.heroHp(p), tags = d.tags || [];
      if (d.id === 'moonwell') { target = mostWoundedFriendly(E, 'friendlyHero'); s = target && E.maxHpOf(target) - E.hpOf(target) >= 3 ? 7 : -1; }
      else if (d.ltarget) { target = (E.targetsFor(d.ltarget, p) || [])[0] || null; s = target ? 4 : -1; }
      else if (d.id === 'ashenforge') s = E.canAttackWith(p, 'hero') ? 5 : -1;
      else if (d.id === 'spireforge') s = p.hero.ex ? 8 : (E.canAttackWith(p, 'hero') ? 4 : -1);
      else if (d.id === 'emberanvil') s = p.allies.length ? 6 : -1;
      else if (d.id === 'emptythrone') s = p.grave.some(c => C[c.id].type === 'ally') && p.hand.length <= 7 ? 6 : -1;
      else if (d.id === 'lighthouse') s = 4 + (heroDmg >= 2 ? 2 : 0);
      else if (d.id === 'stagshrine') s = 4 + 1.5 * (E.heroes().length - 1);
      else s = LOC_VALUE[d.id] || (tags.includes('summon') ? 8 : tags.includes('draw') ? 6 : tags.includes('shield') ? 5 : tags.includes('dmg') ? 6 : 4);
      if ((d.id === 'library' || d.id === 'harbormarket' || d.id === 'whispervault') && p.hand.length > 7) s = 2;
      if (s > 0) acts.push({ s, go: () => E.useLocation(p, loc, target) });
    }
    // power
    const hd = RB.HEROES[p.heroId];
    if (!p.hero.powerUsed && !p.hero.master) {
      const pw = hd.power, tags = pw.tags || [];
      const bossPct = E.bossHp() / E.g.boss.maxHp;
      let s = -1, target = null;
      if (tags.includes('dmg')) { const b = bestEnemy(E, p, (pw.dmg || 8) + E.spellPower(p)); target = b.t; s = (bossPct < 0.45 || E.g.round >= 6 || (b.t && b.t.t === 'minion' && b.s > 20)) ? 25 : -1; }
      else if (tags.includes('aoe')) { const n = Math.min(RB.AOE_CAP || 5, E.enemies().length); s = (n >= 3 || E.g.round >= 6) ? 18 + n * 4 : -1; }
      else if (tags.includes('heal')) { target = mostWoundedFriendly(E, 'friendly'); s = target && E.maxHpOf(target) - E.hpOf(target) >= 10 ? 30 : -1; }
      else if (tags.includes('healAll')) { let tot = 0; for (const t of E.friendlyChars()) tot += Math.min(6, E.maxHpOf(t) - E.hpOf(t)); s = tot >= 14 ? 30 : -1; }
      else if (tags.includes('buff')) s = (E.g.round >= 4 && (p.weapon || E.heroAtk(p) > 0)) ? 16 : -1;
      else if (tags.includes('draw')) s = (p.hand.length <= 2 || E.heroHp(p) <= 10) ? 18 : -1;
      if (s > 0) acts.push({ s, go: () => E.usePower(p, target) });
    }
    // cards
    const reserve = reactReserve(E, p), avail = E.available(p), dz = danger(E, p);
    for (const inst of p.hand) {
      const d = C[inst.id];
      if (!E.canPlay(p, inst).ok) continue;
      const sc = scoreCard(E, p, inst, dz);
      if (sc.s <= 0) continue;
      if (E.needsTarget(inst) && !sc.target) continue;
      // #110: dipping into the React reserve needs a clearly better play
      const keepsReserve = !reserve || d.speed === 'instant' || d.type === 'quest' || d.type === 'location' || avail - d.cost >= reserve;
      const s = sc.s - d.cost * 0.15 - (keepsReserve ? 0 : 7);
      if (s <= 0) continue;
      acts.push({ s, go: () => E.playCard(p, inst, sc.target) });
    }
    // #102 bail water before a Tidal Surge
    if (E.canBail && E.canBail(p)) {
      const B = E.g.boss, mx = E.raid.counter.max;
      // urgent when the Surge is one tick away; otherwise bail with whatever is left at the end of the turn (it refreshes anyway)
      const s = B.counter >= mx - 1 ? 9 : B.counter >= mx - 2 && E.available(p) >= 3 ? 3 : B.counter >= 1 && E.available(p) - E.raid.bail.cost >= reserve ? 0.5 : -1;
      if (s > 0) acts.push({ s, go: () => E.bail(p) });
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
    if (E.attackTargets().length) {
      const attackers = [];
      if (E.canAttackWith(p, 'hero')) attackers.push('hero');
      for (const a of p.allies) if (E.canAttackWith(p, a)) attackers.push(a);
      for (const who of attackers) {
        const targets = E.attackTargets(p, who);
        if (!targets.length) continue;
        let atk, myHp, lr;
        if (who === 'hero') {
          const useW = p.weapon && !p.weapon.ex && E.available(p) >= E.strikeCost(p);
          atk = E.heroAttackValue(p, useW); myHp = E.heroHp(p); lr = useW && (C[p.weapon.c.id].kw || []).includes('longrange');
        } else { atk = E.allyAtk(p, who); myHp = E.allyMax(p, who) - who.damage; lr = E.allyKw(p, who, 'longrange'); }
        let best = null, bs = -1;
        // does a fallen ally come back for the boss (the Crypt's Grave Harvest)? then a lost trade also hands the boss a minion
        const raisesMinion = who !== 'hero' && E.raid.onAllyDeath && !who.token;
        const allyWorth = who === 'hero' ? 0 : 6 + atk * 1.5 + E.allyMax(p, who) * 0.4;
        for (const t of targets) {
          const back = lr ? 0 : t.t === 'boss' ? E.raid.retaliation : E.minAtk(t.m);
          const dies = back >= myHp;
          const kills = t.t === 'minion' ? atk >= E.hpOf(t) : atk >= E.bossHp();
          let s = enemyValue(E, t, atk) - back * (who === 'hero' ? 0.9 : 0.45);
          if (dies && who === 'hero') s -= 999;
          if (dies && who !== 'hero') {
            if (!kills) continue;                     // never throw an ally away without killing anything
            s -= allyWorth;
            if (raisesMinion) s -= 15;                // its corpse becomes a Risen Thrall for the boss
          }
          if (who === 'hero' && myHp - back < 8 && back > 0) s -= 6;
          if (s > bs) { bs = s; best = t; }
        }
        if (best && bs > 0) acts.push({ s: Math.min(bs, 12) * 0.6 + 1, go: () => E.attack(p, who, best) });
      }
    }
    return acts;
  }

  // how good a location is to hold (used for claiming and for using it)
  const LOC_VALUE = { citadel: 9, encampment: 9, gryphonroost: 8, whispervault: 7, library: 6, harbormarket: 6, starlessrift: 6, moonwell: 6, highwatch: 5, emberanvil: 5, emptythrone: 5, spireforge: 5, stagshrine: 5, lighthouse: 4, ashenforge: 3 };
  const locRank = d => LOC_VALUE[d.id] || 4;
  function chooseResource(E, p) {
    const res = p.res.length;
    const hand = p.hand;
    if (!hand.length) return null;
    const quest = hand.find(c => C[c.id].type === 'quest');
    const location = hand.find(c => C[c.id].type === 'location');
    // only claim a new location when it beats the one you hold (claiming replaces it)
    const cur = p.res.find(r => r.loc);
    const bestLoc = hand.filter(c => C[c.id].type === 'location').sort((a, b) => locRank(C[b.id]) - locRank(C[a.id]))[0];
    if (bestLoc && (!cur || locRank(C[bestLoc.id]) > locRank(C[cur.c.id]))) return bestLoc;
    // #125: a land is always worth settling (it costs no real card); pick the one whose small effect does something now
    const lands = hand.filter(c => C[c.id].type === 'land');
    if (lands.length) {
      const use = c => { const k = C[c.id].land, hurt = p.hero.damage; return k === 'heal2' ? (hurt >= 2 ? 3 : hurt ? 1.5 : 0.2) : k === 'heal1' || k === 'healAll' ? (hurt ? 1.6 : 0.2) : k === 'ward2' ? 2.2 : k === 'ward1' ? 1.4 : k === 'snipe' ? (E.minions().length ? 2 : 0.1) : k === 'bossHit' ? 1.5 : k === 'mend' ? (p.allies.some(a => a.damage > 0) ? 1.8 : 0.1) : k === 'rally' ? (p.allies.length ? 1.2 + p.allies.length * 0.4 : 0.1) : k === 'might' ? 1.3 : k === 'calm' ? (p.threat > 0 ? 1 : 0.3) : 0.8; };
      return lands.slice().sort((a, b) => use(b) - use(a))[0];
    }
    if (quest && res < 9) return quest;
    if (location && !cur) return location;
    if (res >= 7 && hand.length <= 4) return null;
    if (res >= 9) return null;
    if (E.spareLeft && E.spareLeft(p) <= 0 && !E.g.cfg.noLands) return null; // #125: the three spare resources are spent
    let worst = null, wv = 1e9;
    const counts = {};
    hand.forEach(c => counts[c.id] = (counts[c.id] || 0) + 1);
    for (const c of hand) {
      const d = C[c.id];
      if (d.type === 'land' || d.type === 'quest' || d.type === 'location') continue;
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
  // #100 Cover: which ready Bulwark ally should take this hit? (null = let it land)
  AI.chooseCover = function (E, targetT, atk, opts, attackerDef, isBoss) {
    const crush = attackerDef && (attackerDef.kw || []).includes('crushing');
    const tHp = E.hpOf(targetT), dies = tHp <= atk;
    // the boss's own strike is still to come this turn: keep a Bulwark ally ready for it
    const strikePending = !isBoss && !E.raid.dungeon && E.g.phase === 'boss' && !E.g.boss.struck && !E.g.boss.stunned && !E.g.boss.enrage;
    let best = null, bs = -1e9;
    for (const t of opts) {
      const hp = E.hpOf(t), survives = hp > atk;
      let s = (survives ? 10 : -4) + hp * 0.2 + (t.p === targetT.p ? 1 : 0);
      if (crush && !survives) s -= 6;
      // covering a teammate makes its hero the boss's next target: only if that hero can take it
      if (t.p !== targetT.p) s -= E.heroHp(t.p) < 14 ? 8 : 1;
      if (s > bs) { bs = s; best = t; }
    }
    if (!best) return null;
    if (isBoss) return targetT.t === 'hero' && bs > -6 ? best : null;   // the boss strike: always cover a hero when it helps
    const spare = opts.length >= 2;
    if (targetT.t === 'hero') {
      if (dies) return best;
      if (strikePending && !spare) return atk >= 4 ? best : null;       // save the last Bulwark for the strike
      return atk >= 2 && bs > 0 ? best : null;
    }
    // an ally: cover only when it would fall, the Bulwark ally survives, and one is still free for the strike
    return dies && E.hpOf(best) > atk && (!strikePending || spare) ? best : null;
  };
  // #99 React: worth answering this attack? (lenient = only deciding whether to ask a human)
  AI.chooseReact = function (E, ctx, opts, lenient) {
    if (!opts || !opts.length) return null;
    const d = ctx.defT, B = E.g.boss;
    const incoming = ctx.atk + (E.g.partyFury || 0);
    const hero = d.t === 'hero' ? d.p : null;
    const hp = E.hpOf(d);
    const ward = hero ? hero.hero.shield : 0;
    const left = Math.max(0, incoming - ward);
    let best = null, bs = 0;
    for (const o of opts) {
      const cd = C[o.inst.id], tags = cd.tags || [];
      let s = 0;
      if (tags.includes('shield') && cd.react !== 'strike') {
        const blk = cd.shield || 6;
        if (hero && left >= (lenient ? 2 : 3)) s = Math.min(blk, left) * 1.2 + (left >= hp ? 20 : 0) + (E.heroHp(hero) <= 16 ? 3 : 0) - cd.cost * 0.4;
      } else if (cd.react === 'strike') {
        const n = E.heroes().length;
        if (ctx.isBoss && (left >= (lenient ? 3 : 5) || left >= hp)) s = 3 * Math.min(n, 4) * 0.9 + (left >= hp ? 20 : 0) - cd.cost * 0.4;
      } else if (tags.includes('elusive')) {
        if (hero && (left >= (lenient ? 3 : 5) || left >= hp)) s = left * 1.1 + (left >= hp ? 20 : 0) - cd.cost * 0.4;
      } else if (tags.includes('heal')) {
        const amt = cd.heal || 4;
        if (left >= hp && hp + amt > left) s = 20 + (d.t === 'hero' ? 10 : 0);
        else if (lenient && left >= hp) s = 1;
      }
      if (s > bs) { bs = s; best = o; }
    }
    return bs > (lenient ? 0 : 3) ? best : null;
  };
  // #101 Soak: step into the circle? The healthiest hero always does, so it never hits the whole party in full
  AI.chooseSoak = function (E, p, total, heroes) {
    if (heroes.length === 1) return true;
    const healthy = heroes.filter(h => E.heroHp(h) > 8).length || 1;
    const share = Math.ceil(total / healthy);
    const top = heroes.reduce((a, b) => E.heroHp(b) > E.heroHp(a) ? b : a);
    return p === top || E.heroHp(p) - share > 4;
  };
  // #129: does one of a player's Instants actually change what this boss card is about to do? Used to decide whether
  // to pause and ask a real player. Reads the card's text and the table only (no dice), so online games stay in step.
  // Returns 'hit' (protects against this card), 'minion' (stops minions already on the table) or false.
  AI.bossCardHits = function (E, bc) {
    const t = (bc.text || '').toLowerCase(), amt = +((t.match(/(\d+) damage/) || [])[1] || 0);
    const hs = E.heroes(), out = { heroes: [], allies: [], amt };
    if (bc.kind === 'event' || (!amt && !/its own hero|destroy the ally/.test(t))) return out; // lasting effects tick later, not now
    if (/each hero|random hero/.test(t)) out.heroes = hs.slice();
    else if (/hero with the most health/.test(t)) { const v = Math.max(...hs.map(h => E.heroHp(h))); out.heroes = hs.filter(h => E.heroHp(h) === v); }
    else if (/hero with the least health/.test(t)) { const v = Math.min(...hs.map(h => E.heroHp(h))); out.heroes = hs.filter(h => E.heroHp(h) === v); }
    else if (/hero with the most threat/.test(t)) { const tn = hs.filter(h => h.hero.taunt); if (tn.length) out.heroes = tn; else { const v = Math.max(...hs.map(h => h.threat || 0)); out.heroes = hs.filter(h => (h.threat || 0) === v); } }
    else if (/its own hero/.test(t)) { let best = null, bv = 0; for (const q of hs) for (const a of q.allies) { const v = E.allyAtk(q, a); if (v > bv) { bv = v; best = q; } } if (best) { out.heroes = [best]; out.amt = bv; } }
    if (/each ally|random ally|ally with/.test(t) && amt) out.allies = E.allAllies();
    return out;
  };
  AI.instantHelps = function (E, p, inst, bc, minionsAsked) {
    const d = C[inst.id], tags = d.tags || [];
    if (d.type !== 'ability' || d.speed !== 'instant' || d.cost > E.available(p)) return false;
    const hit = AI.bossCardHits(E, bc), mine = hit.heroes.includes(p);
    if (tags.includes('shield')) {
      if (d.target === 'friendlyHero' ? hit.heroes.some(h => h.hero.shield < hit.amt) : (mine && p.hero.shield < hit.amt)) return 'hit';
    }
    if (tags.includes('elusive') && mine && !p.hero.elusive) return 'hit';
    if (tags.includes('heal')) { // only worth it now if the hit could finish someone
      const heal = d.heal || 3;
      if (hit.heroes.some(h => E.heroHp(h) <= hit.amt && E.heroHp(h) + heal > hit.amt)) return 'hit';
      if (d.target === 'friendly' && hit.allies.some(t => E.hpOf(t) <= hit.amt && E.hpOf(t) + heal > hit.amt)) return 'hit';
    }
    if (minionsAsked) return false;
    const ready = E.minions().filter(t => E.minAtk(t.m) > 0 && !t.m.stunned);
    if (tags.includes('stunAll') && ready.length >= 2) return 'minion';
    if (tags.includes('stun') && (ready.some(t => E.minAtk(t.m) >= 3) || (!E.g.boss.stunned && E.heroes().some(h => E.heroHp(h) <= E.strikeNow())))) return 'minion';
    if (tags.includes('dmg') && ready.some(t => E.hpOf(t) <= (d.dmg || 0))) return 'minion';
    return false;
  };
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
    if (d.hero && d.hero !== heroId) return false; // #57: an Ascended Master Hero belongs to one hero
    if (d.fac !== 'neutral' && d.fac !== h.fac) return false;
    if (d.cls && !d.cls.includes(h.cls)) return false;
    if (d.prof && !h.profs.includes(d.prof)) return false;
    const cls = RB.CLASSES[h.cls];
    if (d.type === 'weapon' && !d.anyClass && !cls.weapons.includes(d.wtype)) return false;
    if (d.type === 'armor' && !cls.armor.includes(d.atype)) return false;
    return true;
  };
  RB.maxCopies = d => d.limit || ((d.kw || []).includes('unique') || d.type === 'master' ? 1 : 2); // #136: a card can set its own limit
  RB.DECK_SIZE = 40; // #151 (Nov 10, 2026): 40 normal cards (was 30), plus the 10 resource cards
  const STARTER = {
    aldric: { holystrike: 2, aegis: 2, consecration: 2, reckoning: 2, blessing: 1, challenge: 1, footman: 2, lionknight: 2, elowen: 1, sentinel: 2, battlemage: 2, dawnbreaker: 1, silverblade: 2, breastplate: 1, towershield: 1, ironhelm: 1, forgegauntlets: 1, draught: 1, lantern: 1, archon: 1, satchel: 2, dawnamulet: 2, battleplans: 2, bandage: 1, divineshield: 1, bram: 1, squire: 1, fieldmedic: 1 },
    thorgrim: { aimedshot: 2, multishot: 2, rapidfire: 1, huntersmark: 1, feigndeath: 2, crossbowman: 2, thalen: 1, crossbow: 2, longbow: 1, wardenmail: 1, bearhide: 1, rocketboots: 1, sapper: 1, draught: 1, bandage: 2, archon: 1, battleplans: 2, lionknight: 2, sentinel: 1, treant: 1, satchel: 2, leatherhood: 1, dawnamulet: 2, bram: 1, battlemage: 1, squire: 1, fieldmedic: 1, rally: 1, volley: 1, companion: 1 },
    lyssara: { fireball: 2, frostnova: 2, missiles: 2, bandage: 2, blizzard: 2, icebarrier: 2, manasurge: 1, footman: 2, lionknight: 2, elowen: 1, emberstaff: 1, sparkwand: 1, moonweave: 1, vestments: 1, sparkring: 1, draught: 1, tempest: 1, battleplans: 2, sentinel: 2, satchel: 2, dawnamulet: 2, bram: 1, battlemage: 1, squire: 1, fieldmedic: 1, arcaneblast: 1, rally: 1, icelance: 1 },
    grukka: { mortalstrike: 2, bloodthirst: 2, whirlwind: 1, shieldwall: 2, bandage: 2, grunt: 2, witchdoctor: 2, cleaver: 2, breastplate: 1, towershield: 1, forgegauntlets: 1, warkilt: 1, draught: 1, warlord: 1, hedgewitch: 1, fieldmedic: 2, earthmace: 1, laststand: 2, bard: 1, satchel: 2, leatherhood: 1, dawnamulet: 2, battleplans: 1, battleshout: 1, bram: 1, taunt: 1, sentinel: 1, earthwarden: 1, revenant: 1 },
    hruna: { smite: 2, stormlash: 2, ancestralwrath: 2, mend: 2, renewal: 2, warding: 2, witchdoctor: 1, earthwarden: 2, treant: 1, revenant: 2, grunt: 2, earthmace: 2, emberstaff: 1, vestments: 1, poultice: 2, draught: 1, tempest: 1, hedgewitch: 1, bram: 1, satchel: 2, dawnamulet: 2, battleplans: 2, bandage: 1, fieldmedic: 1, sentinel: 1, cavebear: 1 },
    snix: { backstab: 2, ambush: 2, fanknives: 2, recuperate: 2, evasion: 2, kidneyshot: 1, pickpocket: 2, bandage: 2, tinkerer: 2, grunt: 2, gorza: 1, stiletto: 2, wolfhide: 1, shadowboots: 1, rocketboots: 1, sapper: 2, giantelixir: 1, warlord: 1, hedgewitch: 1, treant: 1, silverblade: 1, satchel: 2, leatherhood: 1, battleplans: 1, bram: 1, fieldmedic: 1, sentinel: 1, earthwarden: 1 },
  };
  // fix-sim: the worst-measured cards in these starters were swapped like for like (see tools/cardtest.js)
  RB.STARTER = STARTER;
  // Resource cards: every deck is RB.DECK_SIZE (40) normal cards plus RB.LAND_COUNT (10) resource cards, which are any mix of lands,
  // quests and locations (the user's rule, Nov 10, 2026). Quests and locations no longer go in the 30.
  // These are the quests and locations each starting hero brings; lands fill the rest of the ten.
  RB.STARTER_RES = {'aldric': ['caravan', 'ancientforge', 'citadel'], 'thorgrim': ['caravan', 'bounty', 'citadel'], 'lyssara': ['caravan', 'moonpetals', 'library'], 'grukka': ['caravan', 'slaybeast', 'encampment'], 'hruna': ['moonpetals', 'caravan', 'encampment'], 'snix': ['bounty', 'encampment']};
  const value = (d) => ({ c: 0, u: 1, r: 2, e: 4 }[d.rarity] || 0) + (d.type === 'weapon' ? d.atk : 0) + (d.type === 'ally' ? (d.atk + d.hp) / 3 : 0);
  // Curated starter deck, upgraded with any owned raid treasure / loot that the hero can use.
  RB.buildDeck = function (heroId, owned, partySize) {
    const deck = [];
    for (const [id, k] of Object.entries(STARTER[heroId])) for (let i = 0; i < k; i++) deck.push(id);
    if (partySize > 1 && RB.HEROES[heroId].cls === 'priest') { const i = deck.lastIndexOf('grunt'); if (i >= 0) deck[i] = 'rebirth'; }
    if (owned) {
      const extras = Object.values(C).filter(d => !RB.isResCard(d) && (d.set !== 'core' && d.set !== 'frontier') && (owned[d.id] || 0) > 0 && RB.legalFor(heroId, d))
        .sort((a, b) => RB.cardScore(b) - RB.cardScore(a));
      // fix-sim: only take an owned card when it measures better than the starter card it replaces (rarity is not power)
      for (const d of extras) {
        const want = Math.min(RB.maxCopies(d), owned[d.id]);
        for (let k = deck.filter(x => x === d.id).length; k < want; k++) {
          const same = deck.map((id, i) => ({ id, i, d: C[id] })).filter(x => x.d.type === d.type && x.d.set === 'core');
          const pool = same.length ? same : deck.map((id, i) => ({ id, i, d: C[id] })).filter(x => x.d.set === 'core' && x.d.type !== 'master' && x.d.type !== 'quest' && x.d.type !== 'location');
          if (!pool.length) break;
          pool.sort((a, b) => RB.cardScore(a.d) - RB.cardScore(b.d));
          if (RB.cardScore(d) < RB.cardScore(pool[0].d) + 0.5) break;
          deck[pool[0].i] = d.id;
        }
      }
    }
    return deck;
  };
})(globalThis.RB);

/* ---------- auto deck: the best deck for a hero against a particular raid ---------- */
(function (RB) {
  const C = RB.CARDS;
  // how each raid changes what is worth bringing
  const RAIDMOD = {
    crypt: { ally: -1.2, aoe: 2.5, aoeMinion: 2.5, heal: 1, stunAll: 1, shield: 0.5 },
    molten: { armor: -1.5, heal: 1.5, shield: 1.5, dmg: 1, aoe: 1.5, aoeMinion: 1 },
    tide: { ally: -1.5, aoe: 2, aoeMinion: 2, dmg: 1.2, draw: 1, stun: 1 },
  };
  // fix-sim: measured power (src/cardpower.js) replaces the hand-tuned guess, which barely matched real results
  RB.cardPower = function (d, raidId) {
    const P = RB.CARD_POWER && RB.CARD_POWER[d.id];
    if (!P) return null;
    const ri = { crypt: 1, molten: 2, tide: 3 }[raidId];
    return ri ? (P[0] + P[ri]) / 2 : P[0];
  };
  RB.cardScore = function (d, raidId) {
    if (d.type !== 'master') { const P = RB.cardPower(d, raidId); if (P != null) return 8 + 0.45 * P; }
    const rar = { c: 0, u: 0.6, r: 1.3, e: 2.2 }[d.rarity] || 0, tags = d.tags || [], kw = d.kw || [], has = t => tags.includes(t);
    let s;
    switch (d.type) {
      case 'ally': s = (d.atk ? 0 : -3) + (d.atk * 1.1 + d.hp * 0.75 + (kw.includes('protector') ? 1.5 : 0) + (kw.includes('ferocity') ? 1.2 : 0) + (kw.includes('longrange') ? 1.2 : 0) + (kw.includes('skyward') ? 0.3 : 0) + (kw.includes('elusive') ? 1 : 0) + (d.onEnter ? 1.5 : 0) + (d.start ? 1.5 : 0)) / (d.cost + 1.5) * 5; break;
      case 'ability': s = 3 + ((d.dmg || (has('dmg') ? 3 : 0)) + (d.heal || (has('heal') ? 4 : 0)) * 0.6 + (has('draw') ? 3 : 0) + (has('aoe') || has('aoeMinion') ? 3 : 0) + (has('shield') ? 2 : 0) + (has('stun') || has('stunAll') ? 2 : 0) + (has('revive') ? 4 : 0) + (has('summon') ? 3 : 0) + (has('buff') ? 1.5 : 0)) / (d.cost + 1.2) * 4; break;
      case 'weapon': s = 2 + d.atk * 2.2 - (d.strike || 0) * 1.3; break;
      case 'armor': s = 2 + d.def * 1.6 - (d.use || 0) + (d.spell || 0) * 2; break;
      case 'item': s = 4 + (d.spell || 0) * 2 + (d.allyAtk ? 3 : 0) + (d.use ? 1 : 0); break;
      case 'master': s = 10; break;
      default: s = 5;
    }
    s += rar;
    const m = RAIDMOD[raidId] || {};
    if (m[d.type]) s += m[d.type];
    for (const t of tags) if (m[t]) s += m[t];
    return s;
  };
  function shape(heroId) {
    const st = RB.STARTER[heroId], out = {};
    if (st) for (const [id, k] of Object.entries(st)) { const t = C[id].type === 'location' ? 'quest' : C[id].type; out[t] = (out[t] || 0) + k; }
    else Object.assign(out, { ally: 16, ability: 14, weapon: 2, armor: 4, item: 3, master: 1 });
    return out;
  }
  const poolFor = (heroId, owned) => Object.values(C).filter(d => !RB.isResCard(d) && RB.legalFor(heroId, d) && (owned ? (owned[d.id] || 0) > 0 : d.set === 'core' || d.set === 'starter'));
  const copiesOf = (d, owned) => Math.min(RB.maxCopies(d), owned ? owned[d.id] || 0 : 2);
  // fast heuristic pick (instant)
  RB.autoDeck = function (heroId, raidId, owned, partySize) {
    const pool = poolFor(heroId, owned), want = shape(heroId), deck = [];
    const sc = d => RB.cardScore(d, raidId) + (partySize > 1 && (d.tags || []).includes('revive') ? 4 : 0);
    const add = (list, n) => { const opts = []; list.forEach(d => { for (let k = 0; k < copiesOf(d, owned); k++) opts.push({ id: d.id, s: sc(d) - k * 0.5 }); }); opts.sort((a, b) => b.s - a.s); for (const o of opts) { if (n <= 0) break; if (deck.length >= RB.DECK_SIZE) break; if (C[o.id].type === 'master' && deck.some(x => C[x].type === 'master')) continue; deck.push(o.id); n--; } };
    for (const [t, n] of Object.entries(want)) add(pool.filter(d => (d.type === 'location' ? 'quest' : d.type) === t), n);
    if (deck.length < RB.DECK_SIZE) { const counts = {}; deck.forEach(id => counts[id] = (counts[id] || 0) + 1); add(pool.filter(d => (counts[d.id] || 0) < copiesOf(d, owned)).map(d => d), RB.DECK_SIZE - deck.length); }
    return deck.slice(0, RB.DECK_SIZE);
  };
  // The ten resource cards to go with an auto deck: the best location and the two best quests this hero can use
  // (from the cards owned, or the core set), then the hero's usual lands.
  RB.autoSide = function (heroId, raidId, owned) {
    const pool = Object.values(C).filter(d => (d.type === 'quest' || d.type === 'location') && RB.legalFor(heroId, d) && (owned ? (owned[d.id] || 0) > 0 : d.set === 'core')).sort((a, b) => RB.cardScore(b, raidId) - RB.cardScore(a, raidId));
    const loc = pool.filter(d => d.type === 'location').slice(0, 1), quests = pool.filter(d => d.type === 'quest').slice(0, 2);
    return RB.fillSide(heroId, loc.concat(quests).map(d => d.id));
  };
  // play test raids and keep swaps that do better (async, yields to the page between games)
  RB.polishDeck = async function (heroId, raidId, deck, owned, partySize, opts) {
    opts = opts || {};
    const games = opts.games || 16, iters = opts.iters || 30;
    let seeds = Array.from({ length: games }, (_, i) => 7000 + i * 13);
    const pool = poolFor(heroId, owned);
    const tick = () => new Promise(r => setTimeout(r, 0));
    async function evaluate(d) {
      let s = 0;
      for (const seed of seeds) {
        const party = [{ hero: heroId, deck: d.slice() }];
        for (let k = 1; k < (partySize || 1); k++) { const ally = Object.keys(RB.HEROES)[(Object.keys(RB.HEROES).indexOf(heroId) + k * 2) % 6]; party.push({ hero: ally, deck: RB.buildDeck(ally, null, partySize) }); }
        const g = RB.newGame({ raid: raidId, seed, difficulty: opts.difficulty || 'normal', allAuto: true, party }, {});
        await g.start();
        s += (g.g.over === 'win' ? 100 + Math.max(0, 30 - g.g.round) : 0) + (1 - Math.max(0, g.bossHp()) / g.g.boss.maxHp) * 40;
      }
      await tick();
      return s / games;
    }
    let best = deck.slice(), bestS = await evaluate(best);
    const base = bestS;
    for (const alt of opts.alternatives || []) { const s = await evaluate(alt); if (s > bestS) { best = alt.slice(); bestS = s; } }
    for (let i = 0; i < iters; i++) {
      const counts = {}; best.forEach(id => counts[id] = (counts[id] || 0) + 1);
      const outs = best.map((id, ix) => ({ ix, s: RB.cardScore(C[id], raidId) + Math.random() * 3 })).sort((a, b) => a.s - b.s);
      const ins = pool.filter(d => (counts[d.id] || 0) < copiesOf(d, owned) && !(d.type === 'master' && best.some(x => C[x].type === 'master'))).map(d => ({ id: d.id, s: RB.cardScore(d, raidId) + Math.random() * 3 })).sort((a, b) => b.s - a.s);
      if (!outs.length || !ins.length) break;
      const out = outs[Math.floor(Math.random() * Math.min(5, outs.length))], inn = ins[Math.floor(Math.random() * Math.min(6, ins.length))];
      const cand = best.slice(); cand[out.ix] = inn.id;
      const s = await evaluate(cand);
      if (s > bestS + 0.5) { best = cand; bestS = s; }
      if (opts.onProgress) opts.onProgress((i + 1) / iters, bestS, base);
    }
    // final check on fresh raids: only beat the alternatives if it really is better
    if (opts.alternatives && opts.alternatives.length) {
      seeds = Array.from({ length: games * 2 }, (_, i) => 91000 + i * 17);
      let pick = best, ps = await evaluate(best);
      for (const alt of opts.alternatives) { const s = await evaluate(alt); if (s > ps) { pick = alt.slice(); ps = s; } }
      best = pick;
    }
    return { deck: best, score: bestS, base };
  };
  // the deck the "Auto deck" button uses: best of the starter and the scored pick, then tuned by test raids
  RB.bestDeck = async function (heroId, raidId, owned, partySize, opts) {
    const auto = RB.autoDeck(heroId, raidId, owned, partySize), starter = RB.buildDeck(heroId, owned, partySize);
    return RB.polishDeck(heroId, raidId, auto, owned, partySize, Object.assign({ games: 20, iters: 24, alternatives: [starter] }, opts || {}));
  };
})(globalThis.RB);
