/* RAIDBOUND — rules engine. Runs in the browser or headless (Node) with pluggable hooks. */
(function (RB) {
  const C = RB.CARDS, TK = RB.TOKENS, BC = RB.BOSSCARDS, HEROES = RB.HEROES;
  const def = id => C[id] || TK[id];
  RB.def = def;
  const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const noop = async () => { };

  RB.ENRAGE_ROUND = 25; // fix-sim: see bossTurn
  RB.DUNGEON_PARTY_STRIKE = 1; // fix-sim: each extra hero adds 1 more to dungeon strikes (on top of the usual +1)
  RB.HEROIC_EXTRA_CARDS = 1; // fix-sim: Heroic raids reveal one more boss card each turn (smarter decks made Heroic too easy)
  RB.newGame = function (cfg, hooks) {
    hooks = hooks || {};
    const rnd = cfg.seed != null ? RB.ART.rng(cfg.seed) : Math.random;
    const raid = RB.RAIDS[cfg.raid] || (RB.DUNGEONS || {})[cfg.raid];
    const D = !!raid.dungeon; // #63 Dungeon mode: the boss runs itself, flips cards by level, marks a random hero
    let uidN = 1;
    const uid = () => 'x' + (uidN++);
    const g = {
      raid, cfg, round: 1, partyFury: 0, drawPerTurn: cfg.drawPerTurn || 2, turn: 0, phase: 'setup', over: null, log: [], minionsKilled: 0, window: false,
      settings: Object.assign({ autoDefend: true, pauseForInstants: true }, cfg.settings || {}),
      players: [], boss: null, stats: { cardsPlayed: 0, dmgDealt: 0, dmgTaken: 0, turns: 0, healed: 0 },
    };
    const H = {
      anim: hooks.anim || noop, update: hooks.update || (() => { }), ask: hooks.ask || null,
      log: hooks.log || (() => { }),
    };

    /* ---------- setup ---------- */
    cfg.party.forEach((seat, i) => {
      const deck = shuffle(seat.deck.map(e => (typeof e === 'string' ? { uid: uid(), id: e } : { uid: uid(), id: e.id, holo: e.holo })), rnd);
      g.players.push({
        idx: i, name: seat.name || ('Player ' + (i + 1)), heroId: seat.hero, auto: !!seat.auto || !!cfg.bossPlayer,
        hero: { master: null, damage: 0, shield: 0, tempAtk: 0, ex: false, elusive: false, taunt: false, powerUsed: false, dead: false, pet: seat.pet || null },
        deck, hand: [], grave: [], res: [], allies: [], weapon: null, armor: {}, items: [],
        resPlayed: false, tempRes: 0, threat: 0, stats: { dmg: 0, bossDmg: 0, healed: 0 },
      });
    });
    // #90: companion perks (one tiny bonus per hero; never in boss mode). petUsed marks once-per-fight perks.
    const perk = p => (!cfg.bossPlayer && p.hero.pet && RB.PET_PERKS && RB.PET_PERKS[p.hero.pet]) || null;
    const perkIs = (p, k) => { const q = perk(p); return q && q.k === k ? q : null; };
    const petName = p => (RB.COSMETICS && RB.COSMETICS[p.hero.pet] ? RB.COSMETICS[p.hero.pet].name : 'Companion');
    g.players.forEach(p => { p.hero.petUsed = false; p.hero.petN = 0; p.hero.petRes = 0; const q = perk(p); if (q && q.k === 'maxhp') p.hero.hpB = q.n; });
    const openHand = p => 7 + ((perkIs(p, 'hand') || {}).n || 0);
    const n = g.players.length;
    g.partyFury = n >= 2 ? 1 : 0;
    const heroic = cfg.difficulty === 'heroic';
    const maxHp = Math.round((raid.hp + raid.hpPer * (n - 1)) * (heroic ? 1.3 : 1) * (cfg.bossPlayer ? 1.15 : 1));
    const bdeck = [];
    raid.deck.forEach(([id, k]) => { for (let i = 0; i < k; i++) bdeck.push(id); });
    g.boss = {
      maxHp, damage: 0, deck: shuffle(bdeck, rnd), grave: [], minions: [], events: [], counter: heroic && raid.counter ? 1 : 0,
      cardsPerTurn: 1 + (heroic && !D ? (RB.HEROIC_EXTRA_CARDS || 0) : 0), strikeBonus: (heroic ? 1 : 0) + (n - 1), stunned: false, mark: null, phasesDone: [], lastCard: null,
      level: D ? (cfg.dungeonLevel || 1) : 0, marked: null, turnsTaken: 0, equip: [],
    };
    if (D) g.boss.strikeBonus += g.boss.level - 1 + (RB.DUNGEON_PARTY_STRIKE || 0) * (n - 1); // fix-sim: dungeon attacks were spread over the party but barely grew with it
    // #fix-sim: two heroes flip one card fewer like a solo hero (they were facing a three-hero dungeon)
    const flipCount = () => { const f = raid.flip[Math.min(g.boss.level, raid.flip.length) - 1]; const cut = n === 1 ? 1 : n === 2 ? (RB.DUNGEON_TWO_CUT != null ? RB.DUNGEON_TWO_CUT : 1) : 0; return Math.max(1, f - cut); };

    /* ---------- basic queries ---------- */
    const pdef = p => p.hero.master ? C[p.hero.master] : HEROES[p.heroId];
    const heroMax = p => (p.hero.master ? C[p.hero.master].hp : HEROES[p.heroId].hp) + (p.hero.hpB || 0);
    const heroHp = p => heroMax(p) - p.hero.damage;
    const alive = () => g.players.filter(p => !p.hero.dead);
    const gear = p => [p.weapon, ...Object.values(p.armor), ...p.items].filter(Boolean);
    const spellPower = p => gear(p).reduce((s, e) => s + (C[e.c.id].spell || 0), 0) + (p.hero.master ? (C[p.hero.master].spell || 0) : 0);
    const itemSum = (p, key) => p.items.reduce((s, e) => s + (C[e.c.id][key] || 0), 0);
    const heroAtk = p => p.hero.tempAtk + gear(p).reduce((s, e) => s + (C[e.c.id].heroAtk || 0), 0) + (p.hero.master ? (C[p.hero.master].heroAtk || 0) : 0);
    const allyDef = a => def(a.id);
    const allyAtk = (p, a) => Math.max(0, (allyDef(a).atk || 0) + a.atkB + a.tmp + itemSum(p, 'allyAtk'));
    const allyMax = (p, a) => (allyDef(a).hp || 1) + a.hpB + itemSum(p, 'allyHp');
    const hasKw = (d, k) => (d.kw || []).includes(k);
    const allyKw = (p, a, k) => hasKw(allyDef(a), k) || (k === 'ferocity' && p.hero.master && C[p.hero.master].allyFerocity);
    const minDef = m => TK[m.id];
    const minAtk = m => Math.max(0, (minDef(m).atk || 0) + m.atkB);
    const minMax = m => minDef(m).hp + m.hpB;
    const bossHp = () => g.boss.maxHp - g.boss.damage;
    const guardians = () => g.boss.minions.filter(m => hasKw(minDef(m), 'guardian'));
    const available = p => p.res.filter(r => !r.ex).length + p.tempRes;
    const isActive = p => g.phase === 'main' && g.players[g.turn] === p;

    const T = {
      boss: () => ({ t: 'boss' }), minion: m => ({ t: 'minion', m }), hero: p => ({ t: 'hero', p }), ally: (p, a) => ({ t: 'ally', p, a }),
    };
    const same = (a, b) => a && b && a.t === b.t && (a.t === 'boss' || (a.t === 'minion' && a.m === b.m) || (a.t === 'hero' && a.p === b.p) || (a.t === 'ally' && a.a === b.a));
    const refId = t => t.t === 'boss' ? 'boss' : t.t === 'minion' ? t.m.uid : t.t === 'hero' ? 'hero' + t.p.idx : t.a.uid;
    const nameOf = t => t.t === 'boss' ? raid.short : t.t === 'minion' ? minDef(t.m).name : t.t === 'hero' ? pdef(t.p).name : allyDef(t.a).name;
    const hpOf = t => t.t === 'boss' ? bossHp() : t.t === 'minion' ? minMax(t.m) - t.m.damage : t.t === 'hero' ? heroHp(t.p) : allyMax(t.p, t.a) - t.a.damage;
    const maxHpOf = t => t.t === 'boss' ? g.boss.maxHp : t.t === 'minion' ? minMax(t.m) : t.t === 'hero' ? heroMax(t.p) : allyMax(t.p, t.a);
    const isAlive = t => t.t === 'boss' ? !g.over : t.t === 'minion' ? g.boss.minions.includes(t.m) : t.t === 'hero' ? !t.p.hero.dead : t.p.allies.includes(t.a);

    const enemies = () => [T.boss(), ...g.boss.minions.map(T.minion)];
    const minions = () => g.boss.minions.map(T.minion);
    const allAllies = () => g.players.flatMap(p => p.allies.map(a => T.ally(p, a)));
    const friendlyChars = () => [...alive().map(T.hero), ...allAllies()];
    const pick = arr => arr.length ? arr[Math.floor(rnd() * arr.length)] : null;

    const log = (msg, cls) => { const e = { msg, cls: cls || '', round: g.round }; g.log.push(e); if (g.log.length > 300) g.log.shift(); H.log(e); };

    /* ---------- target validation ---------- */
    function targetsFor(kind, p) {
      switch (kind) {
        case 'enemy': return enemies();
        case 'minion': return minions();
        case 'friendly': return friendlyChars();
        case 'friendlyHero': return alive().map(T.hero);
        case 'ally': return allAllies();
        case 'deadHero': return g.players.filter(q => q.hero.dead).map(T.hero);
        default: return [];
      }
    }
    function attackTargets() {
      const ts = g.boss.minions.filter(m => !hasKw(minDef(m), 'elusive')).map(T.minion);
      if (!guardians().length) ts.unshift(T.boss());
      return ts;
    }

    /* ---------- damage / healing ---------- */
    async function dmg(target, amount, src) {
      src = src || {};
      if (!target || !isAlive(target) || g.over) return 0;
      let n = amount;
      if ((src.kind === 'spell' || src.kind === 'power') && src.p) n += spellPower(src.p);
      if (target.t === 'boss' && g.boss.mark) n += g.boss.mark.amount;
      if (src.kind === 'minion' || src.strike) n += g.partyFury;
      if (target.t === 'hero') {
        n += g.boss.events.reduce((s, e) => s + (BC[e.id].dmgTakenMod || 0), 0);
        const p = target.p;
        if (p.hero.shield > 0 && n > 0) {
          const ab = Math.min(p.hero.shield, n); p.hero.shield -= ab; n -= ab;
          if (ab) { log(`${pdef(p).name}'s ward absorbs ${ab}.`, 'def'); await H.anim('shield', { ref: refId(target), amount: ab }); }
        }
        if (n > 0) n = await useArmor(p, n);
      }
      if (target.t === 'ally' && allyDef(target.a).armorAlly) n = Math.max(0, n - allyDef(target.a).armorAlly);
      if (n <= 0) { H.update(); return 0; }
      // apply
      if (target.t === 'boss') g.boss.damage += n;
      else if (target.t === 'minion') target.m.damage += n;
      else if (target.t === 'hero') target.p.hero.damage += n;
      else target.a.damage += n;
      if (src.p && (target.t === 'boss' || target.t === 'minion')) {
        src.p.threat += n; src.p.stats.dmg += n; g.stats.dmgDealt += n;
        if (target.t === 'boss') src.p.stats.bossDmg += n;
      }
      if (target.t === 'hero' || target.t === 'ally') g.stats.dmgTaken += n;
      if (target.t === 'hero' || target.t === 'boss') log(`${nameOf(target)} takes ${n} damage${target.t === 'hero' ? ` (${Math.max(0, hpOf(target))} left)` : ''}.`, target.t === 'hero' ? 'hurt' : 'dmg');
      await H.anim('dmg', { ref: refId(target), amount: n, kind: src.kind });
      H.update();
      await checkDeath(target, src);
      if (target.t === 'boss') await checkPhases();
      if (target.t === 'hero' && !g.over) { const p = target.p, q = perkIs(p, 'halfHeal');
        if (q && !p.hero.petUsed && !p.hero.dead && heroHp(p) <= heroMax(p) / 2) { p.hero.petUsed = true; log(`${petName(p)} shimmers and heals the party.`, 'def'); for (const h of alive()) await heal(T.hero(h), q.n); } }
      return n;
    }
    async function useArmor(p, n) {
      const pieces = Object.entries(p.armor).filter(([, e]) => !e.ex && available(p) >= C[e.c.id].use);
      if (!pieces.length) return n;
      let chosen;
      if (g.settings.autoDefend || p.auto || !H.ask) chosen = RB.AI.chooseArmor(api, p, n, pieces.map(x => x[0]));
      else chosen = await H.ask('armor', { p, amount: n, slots: pieces.map(x => x[0]) });
      for (const slot of chosen || []) {
        const e = p.armor[slot]; if (!e || e.ex) continue;
        const d = C[e.c.id];
        if (available(p) < d.use) continue;
        pay(p, d.use); e.ex = true;
        const red = Math.min(n, d.def); n -= red;
        log(`${d.name} blocks ${red}.`, 'def');
        await H.anim('armor', { ref: 'hero' + p.idx, amount: red, name: d.name });
        if (n <= 0) break;
      }
      return n;
    }
    async function heal(target, amount) {
      if (!target || !isAlive(target) || g.over) return 0;
      let cur = target.t === 'boss' ? g.boss.damage : target.t === 'minion' ? target.m.damage : target.t === 'hero' ? target.p.hero.damage : target.a.damage;
      const h = Math.min(cur, amount);
      if (h <= 0) return 0;
      if (target.t === 'boss') g.boss.damage -= h; else if (target.t === 'minion') target.m.damage -= h; else if (target.t === 'hero') target.p.hero.damage -= h; else target.a.damage -= h;
      if (target.t === 'hero' || target.t === 'ally') g.stats.healed += h;
      await H.anim('heal', { ref: refId(target), amount: h });
      H.update();
      return h;
    }
    async function checkDeath(t, src) {
      if (!isAlive(t)) return;
      if (hpOf(t) > 0) return;
      if (t.t === 'boss') { g.over = 'win'; log(`${raid.boss} has fallen!`, 'win'); await H.anim('bossDeath', {}); H.update(); return; }
      if (t.t === 'minion') {
        const d = minDef(t.m);
        g.boss.minions.splice(g.boss.minions.indexOf(t.m), 1);
        g.minionsKilled++;
        log(`${d.name} is destroyed.`, 'kill');
        await H.anim('death', { ref: t.m.uid });
        H.update();
        if (d.onDeath) await d.onDeath(api, { m: t.m });
        return;
      }
      if (t.t === 'ally') {
        const p = t.p, a = t.a, d = allyDef(a);
        p.allies.splice(p.allies.indexOf(a), 1);
        if (!a.token) p.grave.push(a.c);
        log(`${d.name} falls.`, 'loss');
        await H.anim('death', { ref: a.uid });
        H.update();
        if (d.onDeath) await d.onDeath(api, { p, a });
        if (raid.onAllyDeath) await raid.onAllyDeath(api, p, a);
        if (perkIs(p, 'allyDraw') && !p.hero.petUsed && !p.hero.dead) { p.hero.petUsed = true; log(`${petName(p)} gathers the fallen soul: ${pdef(p).name} draws a card.`, 'def'); await draw(p, 1); }
        return;
      }
      if (t.t === 'hero') {
        const p = t.p;
        const shard = p.items.find(e => C[e.c.id].cheatDeath);
        if (shard) {
          p.items.splice(p.items.indexOf(shard), 1); p.grave.push(shard.c);
          p.hero.damage = heroMax(p) - 5;
          log(`The Phylactery Shard shatters — ${pdef(p).name} refuses to die!`, 'def');
          await H.anim('heal', { ref: 'hero' + p.idx, amount: 5 }); H.update();
          return;
        }
        p.hero.dead = true; p.hero.shield = 0;
        for (const a of p.allies) if (!a.token) p.grave.push(a.c);
        p.allies = [];
        log(`${pdef(p).name} has been defeated!`, 'loss');
        await H.anim('heroDeath', { ref: 'hero' + p.idx });
        H.update();
        if (!alive().length) { g.over = 'lose'; log('The raid has wiped.', 'loss'); H.update(); }
      }
    }
    async function checkPhases() {
      if (g.over) return;
      for (let i = 0; i < (raid.phases || []).length; i++) {
        const ph = raid.phases[i];
        if (g.boss.phasesDone.includes(i)) continue;
        if (bossHp() <= g.boss.maxHp * ph.at) {
          g.boss.phasesDone.push(i);
          log(`Phase: ${ph.name}. ${ph.text}`, 'boss');
          await H.anim('phase', { name: ph.name, text: ph.text });
          await ph.run(api);
          H.update();
        }
      }
    }

    /* ---------- resources ---------- */
    function pay(p, nAmt) {
      let k = nAmt;
      const t = Math.min(p.tempRes, k); p.tempRes -= t; k -= t;
      const order = [...p.res.filter(r => !r.ex && !r.quest && !r.loc), ...p.res.filter(r => !r.ex && r.quest), ...p.res.filter(r => !r.ex && r.loc)];
      for (const r of order) { if (k <= 0) break; r.ex = true; k--; }
      return k <= 0;
    }
    async function draw(p, k) {
      for (let i = 0; i < k; i++) {
        if (!p.deck.length) {
          if (!p.grave.length) { log(`${pdef(p).name} has no cards left to draw.`, ''); return; }
          p.deck = shuffle(p.grave.splice(0), rnd);
          log(`${pdef(p).name} shuffles the discard pile into a new deck.`, '');
        }
        const c = p.deck.pop();
        if (p.hand.length >= 10) { p.grave.push(c); log(`${pdef(p).name}'s hand is full — ${C[c.id].name} is discarded.`, ''); continue; }
        p.hand.push(c);
      }
      H.update();
    }

    /* ---------- legality ---------- */
    function canEquip(p, d) {
      if (p.hero.master) return true;
      const cls = RB.CLASSES[HEROES[p.heroId].cls];
      if (d.type === 'weapon') return cls.weapons.includes(d.wtype);
      if (d.type === 'armor') return cls.armor.includes(d.atype);
      return true;
    }
    function canPlay(p, inst, opts) {
      const d = C[inst.id];
      if (g.over) return { ok: false, why: 'The raid is over.' };
      if (p.hero.dead) return { ok: false, why: 'Your hero has been defeated.' };
      if (d.type === 'quest' || d.type === 'location') return { ok: false, why: 'Play this card as a resource.' };
      const myTurn = isActive(p);
      if (!myTurn) {
        if (!(g.window && d.type === 'ability' && d.speed === 'instant')) return { ok: false, why: d.speed === 'instant' ? 'Instants can be played on your turn or in response to a boss card.' : 'You can only play this on your turn.' };
      }
      if (available(p) < d.cost) return { ok: false, why: `Needs ${d.cost} resource${d.cost === 1 ? '' : 's'} (you have ${available(p)}).` };
      if (hasKw(d, 'unique') && d.type === 'ally' && p.allies.some(a => a.id === d.id)) return { ok: false, why: 'Unique: you already have one in play.' };
      if ((d.type === 'weapon' || d.type === 'armor') && !canEquip(p, d)) return { ok: false, why: `${RB.CLASSES[HEROES[p.heroId].cls].name}s can't use ${d.type === 'weapon' ? d.wtype + 's' : d.atype + ' armor'}.` };
      if (d.type === 'master' && p.hero.master) return { ok: false, why: 'You are already a Master Hero.' };
      if (d.target && d.target !== 'none') {
        const ts = targetsFor(d.target, p);
        if (!ts.length && d.type === 'ability') return { ok: false, why: 'There is no valid target.' };
      }
      return { ok: true };
    }
    function needsTarget(inst) { const d = C[inst.id]; return d.target && d.target !== 'none' && targetsFor(d.target).length ? d.target : null; }

    /* ---------- actions ---------- */
    async function playResource(p, inst) {
      if (!isActive(p) || p.resPlayed) return false;
      const i = p.hand.indexOf(inst); if (i < 0) return false;
      p.hand.splice(i, 1);
      const d = C[inst.id];
      if (d.type === 'location') {
        const old = p.res.find(r => r.loc); if (old) old.loc = false;
        p.res.push({ c: inst, ex: false, loc: true, used: false });
        log(`${pdef(p).name} claims ${d.name}.`, 'play');
      } else if (d.type === 'quest') {
        p.res.push({ c: inst, ex: false, quest: true, done: false });
        log(`${pdef(p).name} takes up the quest: ${d.name}.`, 'play');
      } else {
        p.res.push({ c: inst, ex: false });
        log(`${pdef(p).name} plays a card as a resource.`, '');
      }
      p.resPlayed = true;
      await H.anim('resource', { p: p.idx });
      H.update();
      return true;
    }
    async function playCard(p, inst, target) {
      const ok = canPlay(p, inst);
      if (!ok.ok) return ok;
      const d = C[inst.id];
      const tk = needsTarget(inst);
      if (tk && (!target || !targetsFor(tk, p).some(t => same(t, target)))) return { ok: false, why: 'Choose a target.' };
      const i = p.hand.indexOf(inst); if (i < 0) return { ok: false, why: 'Card not in hand.' };
      p.hand.splice(i, 1);
      pay(p, d.cost);
      g.stats.cardsPlayed++;
      const ctx = { p, target, card: inst };
      await H.anim('play', { p: p.idx, id: inst.id, holo: inst.holo, target: target ? refId(target) : null });
      log(`${pdef(p).name} plays ${d.name}${target ? ' on ' + nameOf(target) : ''}.`, 'play');
      switch (d.type) {
        case 'ally': {
          const a = { uid: inst.uid, id: inst.id, c: inst, damage: 0, ex: false, sick: true, atkB: 0, hpB: 0, tmp: 0, frozen: false, token: null };
          a.sick = !allyKw(p, a, 'ferocity');
          if ((perkIs(p, 'firstAlly') || perkIs(p, 'firstFero')) && !p.hero.petUsed) {
            p.hero.petUsed = true;
            if (perkIs(p, 'firstAlly')) { a.atkB += 1; a.hpB += 1; log(`${petName(p)} bounds alongside ${d.name}: +1 ATK and +1 health.`, 'def'); }
            else { a.sick = false; log(`${petName(p)} rouses ${d.name}: it can attack right away.`, 'def'); }
          }
          p.allies.push(a); H.update();
          await H.anim('summon', { ref: a.uid });
          if (d.onEnter) await d.onEnter(api, ctx);
          break;
        }
        case 'ability':
          await d.run(api, ctx);
          p.grave.push(inst);
          break;
        case 'weapon':
          if (p.weapon) p.grave.push(p.weapon.c);
          p.weapon = { c: inst, ex: false };
          if (d.onEnter) await d.onEnter(api, ctx);
          break;
        case 'armor':
          if (p.armor[d.slot]) p.grave.push(p.armor[d.slot].c);
          p.armor[d.slot] = { c: inst, ex: false };
          if (d.onEnter) await d.onEnter(api, ctx);
          break;
        case 'item':
          p.items.push({ c: inst, ex: false });
          if (d.onEnter) await d.onEnter(api, ctx);
          break;
        case 'master':
          p.hero.master = inst.id; p.hero.powerUsed = true;
          log(`${HEROES[p.heroId].name} ascends as ${d.name}!`, 'win');
          await H.anim('master', { p: p.idx, id: inst.id });
          break;
      }
      H.update();
      return { ok: true };
    }
    function canAttackWith(p, who) {
      if (!isActive(p) || g.over) return false;
      if (who === 'hero') {
        if (p.hero.ex || p.hero.dead) return false;
        const w = p.weapon && !p.weapon.ex && available(p) >= C[p.weapon.c.id].strike;
        return w || heroAtk(p) > 0;
      }
      const a = who; return p.allies.includes(a) && !a.ex && !a.sick && !a.frozen && allyAtk(p, a) > 0;
    }
    function heroAttackValue(p, useWeapon) { return heroAtk(p) + (useWeapon && p.weapon ? C[p.weapon.c.id].atk : 0); }
    async function attack(p, who, target) {
      if (!canAttackWith(p, who)) return { ok: false, why: 'That character can\'t attack right now.' };
      if (!attackTargets().some(t => same(t, target))) return { ok: false, why: guardians().length && target.t === 'boss' ? 'A Guardian protects the boss — defeat it first.' : 'Invalid target.' };
      let atk, longrange = false, attackerT, onAttack = null, wname = '', ironHide = 0;
      if (who === 'hero') {
        const useW = p.weapon && !p.weapon.ex && available(p) >= C[p.weapon.c.id].strike;
        if (useW) { const wd = C[p.weapon.c.id]; pay(p, wd.strike); p.weapon.ex = true; longrange = hasKw(wd, 'longrange'); onAttack = wd.onAttack; wname = ` with ${wd.name}`; }
        atk = heroAttackValue(p, useW);
        const ram = perkIs(p, 'firstAtk'); if (ram && !p.hero.petUsed) { p.hero.petUsed = true; atk += ram.n; log(`${petName(p)} charges in with ${pdef(p).name}: +${ram.n} damage.`, 'def'); }
        p.hero.ex = true;
        ironHide = (HEROES[p.heroId].ironHide && !p.hero.master) ? HEROES[p.heroId].ironHide : 0;
        attackerT = T.hero(p);
      } else {
        atk = allyAtk(p, who); who.ex = true; longrange = allyKw(p, who, 'longrange'); attackerT = T.ally(p, who);
      }
      log(`${nameOf(attackerT)} attacks ${nameOf(target)}${wname}.`, 'atk');
      await H.anim('attack', { from: refId(attackerT), to: refId(target) });
      const back = Math.max(0, (longrange ? 0 : target.t === 'boss' ? raid.retaliation + (g.boss.retalBonus || 0) : minAtk(target.m)) - ironHide);
      await dmg(target, atk, { p, kind: who === 'hero' ? 'hero' : 'ally' });
      if (back > 0 && isAlive(attackerT) && !g.over) await dmg(attackerT, back, { kind: target.t === 'boss' ? 'boss' : 'minion' });
      if (onAttack && !g.over) await onAttack(api, { p, defender: target });
      H.update();
      return { ok: true };
    }
    async function usePower(p, target) {
      const hd = HEROES[p.heroId];
      if (!isActive(p) || p.hero.powerUsed || p.hero.master || p.hero.dead) return { ok: false, why: 'Your hero power has already been used.' };
      const pw = hd.power;
      if (pw.target && pw.target !== 'none' && (!target || !targetsFor(pw.target, p).some(t => same(t, target)))) return { ok: false, why: 'Choose a target.' };
      p.hero.powerUsed = true;
      log(`${hd.name} unleashes ${pw.name}!`, 'win');
      await H.anim('power', { p: p.idx, name: pw.name, target: target ? refId(target) : null });
      await pw.run(api, { p, target });
      H.update();
      return { ok: true };
    }
    function questReady(p, r) { const d = C[r.c.id]; return r.quest && !r.done && (!d.cond || d.cond(api, p)) && available(p) >= (d.qcost || 0); }
    async function completeQuest(p, r) {
      if (!isActive(p) || !questReady(p, r)) return { ok: false, why: 'This quest can\'t be completed yet.' };
      const d = C[r.c.id];
      pay(p, d.qcost || 0);
      r.done = true;
      log(`${pdef(p).name} completes ${d.name}!`, 'win');
      await H.anim('quest', { p: p.idx, id: d.id });
      await d.reward(api, { p });
      H.update();
      return { ok: true };
    }
    function locationReady(p, r) { return r && r.loc && !r.used && available(p) >= C[r.c.id].lcost; }
    async function useLocation(p, r, target) {
      if (!isActive(p) || !locationReady(p, r)) return { ok: false, why: 'The location can\'t be used right now.' };
      const d = C[r.c.id];
      if (d.ltarget && (!target || !targetsFor(d.ltarget, p).some(t => same(t, target)))) return { ok: false, why: 'Choose a target.' };
      pay(p, d.lcost); r.used = true;
      log(`${pdef(p).name} uses ${d.name}.`, 'play');
      await d.lrun(api, { p, target });
      H.update();
      return { ok: true };
    }
    function itemReady(p, e) { const d = C[e.c.id]; return d.use && !e.ex && available(p) >= d.use.cost && (d.use.target === 'none' || !d.use.target || targetsFor(d.use.target, p).length); }
    async function useItem(p, e, target) {
      const d = C[e.c.id];
      if (!isActive(p) || !itemReady(p, e)) return { ok: false, why: 'This item can\'t be used right now.' };
      if (d.use.target && d.use.target !== 'none' && (!target || !targetsFor(d.use.target, p).some(t => same(t, target)))) return { ok: false, why: 'Choose a target.' };
      pay(p, d.use.cost);
      if (d.use.destroy) p.items.splice(p.items.indexOf(e), 1);
      if (d.use.exhaust) e.ex = true;
      log(`${pdef(p).name} uses ${d.name}.`, 'play');
      await d.urun(api, { p, target });
      // #78: a used-up item reaches the discard only after its effect, so "destroy this to draw" can't reshuffle and redraw itself
      if (d.use.destroy) p.grave.push(e.c);
      H.update();
      return { ok: true };
    }

    /* ---------- turn flow ---------- */
    async function startHeroTurn() {
      const p = g.players[g.turn];
      g.phase = 'start';
      p.res.forEach(r => { r.ex = false; if (r.loc) r.used = false; });
      p.allies.forEach(a => { if (a.frozen) { a.frozen = false; a.ex = true; } else a.ex = false; a.sick = false; a.tmp = 0; });
      p.hero.ex = false; p.hero.tempAtk = 0; p.hero.elusive = false; p.hero.taunt = false;
      gear(p).forEach(e => e.ex = false);
      p.tempRes = 0; p.resPlayed = false;
      if (g.boss.mark && g.boss.mark.by === p.idx) g.boss.mark = null;
      H.update();
      await H.anim('turn', { p: p.idx, name: p.name, hero: pdef(p).name });
      log(`— ${pdef(p).name}'s turn (round ${g.round}) —`, 'turn');
      await draw(p, g.drawPerTurn);
      if (p.hero.petRes) { p.tempRes += p.hero.petRes; log(`${petName(p)} brings a tailwind: +${p.hero.petRes} resource this turn.`, 'def'); p.hero.petRes = 0; H.update(); }
      { const q = perkIs(p, 'trickle'); if (q && p.hero.petN < q.n && p.hero.damage > 0) { p.hero.petN++; await heal(T.hero(p), 1); } }
      if (p.hero.master && C[p.hero.master].mstart) await C[p.hero.master].mstart(api, p);
      for (const a of [...p.allies]) { const d = allyDef(a); if (d.start && p.allies.includes(a)) await d.start(api, p); if (g.over) return; }
      for (const e of [...p.items]) { const d = C[e.c.id]; if (d.start) await d.start(api, p); if (g.over) return; }
      for (const ev of [...g.boss.events]) { const d = BC[ev.id]; if (d.heroStart) await d.heroStart(api, p); if (g.over) return; }
      if (p.hero.dead) return endHeroTurn();
      g.phase = 'main';
      H.update();
      if (p.auto || cfg.allAuto) { await RB.AI.playTurn(api, p); if (!g.over && g.phase === 'main' && g.players[g.turn] === p) await endHeroTurn(); }
    }
    async function endHeroTurn() {
      if (g.over) return;
      const p = g.players[g.turn];
      p.hero.tempAtk = 0; p.allies.forEach(a => a.tmp = 0); p.tempRes = 0;
      g.phase = 'end';
      g.stats.turns++;
      let nxt = g.turn + 1;
      while (nxt < g.players.length && g.players[nxt].hero.dead) nxt++;
      if (nxt >= g.players.length) { await bossTurn(); return; }
      g.turn = nxt;
      await startHeroTurn();
    }
    async function reactionWindow(card) {
      if (g.over) return;
      let guard = 0;
      while (guard++ < 6) {
        const responders = alive().filter(p => p.hand.some(c => C[c.id].type === 'ability' && C[c.id].speed === 'instant' && available(p) >= C[c.id].cost));
        if (!responders.length) return;
        g.window = true;
        let choice = null;
        const humans = responders.filter(p => !p.auto && !cfg.allAuto);
        const bots = responders.filter(p => p.auto || cfg.allAuto);
        for (const p of bots) { choice = RB.AI.chooseInstant(api, p, card); if (choice) break; }
        if (!choice && humans.length && H.ask && g.settings.pauseForInstants) choice = await H.ask('instant', { card, players: humans });
        if (!choice) { g.window = false; return; }
        const r = await playCard(choice.p, choice.inst, choice.target);
        g.window = false;
        if (!r.ok) return;
        if (g.over) return;
      }
      g.window = false;
    }
    async function bossTurn() {
      if (g.over) return;
      g.phase = 'boss';
      const B = g.boss;
      H.update();
      await H.anim('bossTurn', { name: raid.short });
      log(`— ${raid.short}'s turn —`, 'turn');
      B.minions.forEach(m => { m.ex = false; m.sick = false; });
      // fix-sim: Enrage. From round ENRAGE the boss hits 1 harder every round, so a fight can never stall forever
      if (g.round >= RB.ENRAGE_ROUND) {
        B.enrage = (B.enrage || 0) + 1; B.strikeBonus += 1;
        log(B.enrage === 1 ? `${raid.short} becomes ENRAGED! Its strikes grow 1 stronger every round and can no longer be intercepted by Protectors.` : `${raid.short}'s rage grows: strikes +${B.enrage}.`, 'boss');
        if (B.enrage === 1) await H.anim('banner', { text: `${raid.short} is enraged!`, kind: 'boss' });
      }
      if (raid.counter) {
        B.counter += raid.counterPerTurn || 1;
        await H.anim('counter', { value: B.counter, max: raid.counter.max });
        H.update();
        if (B.counter >= raid.counter.max) { B.counter = 0; await raid.counter.onMax(api); H.update(); if (g.over) return; }
      }
      const k = D ? flipCount() : B.cardsPerTurn + Math.max(0, alive().length - 1);
      if (D) log(`${raid.short} is level ${B.level}: flips ${k} card${k > 1 ? 's' : ''}.`, 'boss');
      const drawBoss = () => { if (!B.deck.length) { B.deck = shuffle(B.grave.splice(0), rnd); log(`${raid.short}'s deck is reshuffled.`, 'boss'); } return B.deck.pop(); };
      if (cfg.bossPlayer && H.ask) {
        // #25: the player is the boss — keep a hand and choose which cards to play
        B.hand = B.hand || [];
        while (B.hand.length < k + 2 && (B.deck.length || B.grave.length)) B.hand.push(drawBoss());
        H.update();
        for (let i = 0; i < k && !g.over && B.hand.length; i++) {
          let idx = await H.ask('bossPick', { hand: B.hand.slice(), left: k - i });
          if (idx == null || !B.hand[idx]) idx = 0;
          const id = B.hand.splice(idx, 1)[0];
          await playBossCard(id);
          if (g.over) return;
        }
      } else for (let i = 0; i < k && !g.over; i++) {
        await playBossCard(drawBoss());
        if (g.over) return;
      }
      async function playBossCard(id) {
        const bc = BC[id];
        B.lastCard = id;
        log(`${raid.short} plays ${bc.name}: ${bc.text}`, 'boss');
        await H.anim('bossCard', { id });
        await reactionWindow(bc);
        if (g.over) return;
        if (bc.kind === 'event') { B.events.push({ id, turns: bc.turns }); H.update(); }
        else { await bc.run(api); B.grave.push(id); }
        H.update();
      }
      if (g.over) return;
      if (D) markHero();
      // minions attack (the boss holds back on the opening round)
      if (D ? B.turnsTaken === 0 : g.round === 1) { log(`${raid.short} is still taking your measure — no attacks this round.`, 'boss'); }
      else for (const m of [...B.minions]) {
        if (g.over) return;
        if (!B.minions.includes(m) || m.ex || m.sick) continue;
        if (m.stunned) { m.stunned = false; log(`${minDef(m).name} is stunned and can't attack.`, 'def'); continue; }
        if (minAtk(m) <= 0) continue;
        await minionAttack(m);
      }
      if (g.over) return;
      if (D ? B.turnsTaken > 0 : g.round > 1) await bossStrike();
      B.turnsTaken++;
      if (g.over) return;
      // end of boss turn
      B.events.forEach(e => e.turns--);
      B.events.filter(e => e.turns <= 0).forEach(e => B.grave.push(e.id));
      B.events = B.events.filter(e => e.turns > 0);
      g.players.forEach(p => p.threat = 0);
      g.round++;
      g.turn = g.players.findIndex(p => !p.hero.dead);
      H.update();
      await startHeroTurn();
    }
    function protectorFor(p) { return p.allies.find(a => allyKw(p, a, 'protector') && !a.ex && !a.frozen); }
    async function resolveEnemyAttack(attackerName, atkVal, targetT, attackerRef, isBoss) {
      let defT = targetT;
      if (targetT.t === 'hero') {
        // #78: an Enraged boss's strike goes straight past Protectors (a wall of fresh tokens could stall a fight forever)
        const pr = isBoss && g.boss.enrage ? null : protectorFor(targetT.p);
        if (pr) { pr.ex = true; defT = T.ally(targetT.p, pr); log(`${allyDef(pr).name} steps in to protect ${pdef(targetT.p).name}!`, 'def'); }
      }
      log(`${attackerName} attacks ${nameOf(defT)}.`, 'boss');
      await H.anim('attack', { from: attackerRef, to: refId(defT), enemy: true });
      // defender's counter-damage
      let back = 0;
      if (defT.t === 'ally') back = allyAtk(defT.p, defT.a);
      else if (defT.t === 'hero') {
        const p = defT.p;
        if (p.weapon && !p.weapon.ex && available(p) >= C[p.weapon.c.id].strike) {
          let yes;
          if (g.settings.autoDefend || p.auto || cfg.allAuto || !H.ask) yes = RB.AI.chooseStrikeBack(api, p);
          else yes = await H.ask('strikeBack', { p, attacker: attackerName });
          if (yes) { pay(p, C[p.weapon.c.id].strike); p.weapon.ex = true; back = heroAttackValue(p, true); log(`${pdef(p).name} strikes back with ${C[p.weapon.c.id].name}.`, 'def'); }
        } else if (heroAtk(p) > 0) back = heroAtk(p);
      }
      const attackerT = isBoss ? T.boss() : T.minion(attackerRef);
      await dmg(defT, atkVal, { kind: isBoss ? 'boss' : 'minion', strike: isBoss });
      if (back > 0 && !g.over && isAlive(attackerT)) {
        const srcP = defT.t === 'hero' ? defT.p : defT.p;
        await dmg(attackerT, back, { p: srcP, kind: defT.t === 'hero' ? 'hero' : 'ally' });
      }
    }
    function markedHero() { const m = g.boss.marked != null ? g.players[g.boss.marked] : null; return m && !m.hero.dead && !m.hero.elusive ? m : null; }
    function markHero() {
      const cands = alive().filter(p => !p.hero.elusive); if (!cands.length) { g.boss.marked = null; return; }
      const p = pick(cands); g.boss.marked = p.idx;
      log(`${raid.short} rolls the die and MARKS ${pdef(p).name}! Every dungeon attack this turn goes at them.`, 'boss');
      H.anim('banner', { text: `${pdef(p).name} is marked!`, kind: 'boss' }); H.update();
    }
    function threatTarget() {
      const cands = alive().filter(p => !p.hero.elusive);
      if (!cands.length) return null;
      const taunt = cands.filter(p => p.hero.taunt);
      if (taunt.length) return taunt[0];
      if (D && markedHero()) return markedHero();
      const top = Math.max(...cands.map(p => p.threat));
      const tied = cands.filter(p => p.threat === top);
      return tied.length === 1 ? tied[0] : pick(tied);
    }
    async function minionAttack(m) {
      const d = minDef(m);
      const heroes = alive().filter(p => !p.hero.elusive);
      const allies = allAllies().filter(t => !allyKw(t.p, t.a, 'elusive'));
      let target = null;
      const taunt = heroes.find(p => p.hero.taunt);
      if (taunt) target = T.hero(taunt);
      else if (D && markedHero()) target = T.hero(markedHero());
      else if (cfg.bossPlayer && H.ask) {
        const pool = [...heroes.map(T.hero), ...allies];
        if (!pool.length) return;
        const v = await H.ask('bossTarget', { from: d.name, ref: m.uid, atk: minAtk(m), options: pool });
        target = v != null && pool[v] ? pool[v] : pick(pool);
      }
      else if (d.ai === 'allies' && allies.length) target = pick(allies);
      else if (d.ai === 'lowest' && heroes.length) target = T.hero(heroes.reduce((a, b) => heroHp(a) <= heroHp(b) ? a : b));
      else { const pool = [...heroes.map(T.hero), ...allies]; target = pick(pool); }
      if (!target) return;
      m.ex = true;
      await resolveEnemyAttack(d.name, minAtk(m), target, m, false);
      H.update();
    }
    async function bossStrike() {
      const B = g.boss;
      if (B.stunned) { B.stunned = false; log(`${raid.short} is stunned and can't strike!`, 'def'); await H.anim('banner', { text: `${raid.short} is stunned`, kind: 'def' }); return; }
      let target = threatTarget();
      if (!target) { log(`${raid.short} finds no one to strike.`, 'def'); return; }
      if (cfg.bossPlayer && H.ask && !target.hero.taunt) {
        const pool = alive().filter(p => !p.hero.elusive);
        const v = await H.ask('bossTarget', { from: raid.short, ref: 'boss', atk: raid.strike + B.strikeBonus, options: pool.map(T.hero), strike: true });
        if (v != null && pool[v]) target = pool[v];
      }
      await resolveEnemyAttack(raid.short, raid.strike + B.strikeBonus, T.hero(target), 'boss', true);
    }

    /* ---------- helpers exposed to card effects ---------- */
    const api = {
      g, raid, T, rnd, log, same, refId, nameOf, hpOf, maxHpOf, isAlive, pdef, heroMax, heroHp, heroAtk, allyAtk, allyMax, allyDef, allyKw, minDef, minAtk, minMax, bossHp, available, spellPower, guardians,
      canPlay, canEquip, needsTarget, targetsFor, attackTargets, canAttackWith, heroAttackValue, questReady, locationReady, itemReady, isActive, gear,
      playResource, playCard, attack, usePower, completeQuest, useLocation, useItem, endHeroTurn,
      start: async () => { log(D ? `The party enters ${raid.name}.` : `The raid on ${raid.name} begins.`, 'turn'); for (const p of g.players) { for (let i = 0; i < 2 && p.deck.length; i++) p.res.push({ c: p.deck.pop(), ex: false }); await draw(p, openHand(p)); } log('Each hero begins with 2 resources from the war chest.', '');
        if (D) for (const p of g.players) { // one mulligan each: shuffle the hand back and draw 7 new cards
          let redo = false;
          if (p.auto || cfg.allAuto || !H.ask) redo = !p.hand.some(c => C[c.id].type === 'ally' && C[c.id].cost <= 3);
          else redo = await H.ask('mulligan', { p });
          if (redo) { p.deck.push(...p.hand.splice(0)); shuffle(p.deck, rnd); await draw(p, openHand(p)); log(`${pdef(p).name} takes a mulligan and draws a new hand of ${openHand(p)}.`, ''); }
        }
        if (raid.setup) await raid.setup(api); H.update(); g.turn = 0;
        for (const p of g.players) { const q = perk(p); if (!q) continue;
          log(`${pdef(p).name}'s companion, ${petName(p)}: ${q.text}`, 'def');
          if (q.k === 'ward') { p.hero.shield += q.n; H.update(); }
          else if (q.k === 'firstRes') p.hero.petRes = q.n;
          else if (q.k === 'bossDmg') await dmg(T.boss(), q.n, { p, kind: 'effect' });
        }
        if (D && cfg.dungeonFirst) { log(`${raid.short} acts first!`, 'boss'); await bossTurn(); } else await startHeroTurn(); },
      flipCount, markedHero,
      levelUp: async (k) => { const B = g.boss, top = raid.maxLevel || 4; if (B.level >= top) return; B.level = Math.min(top, B.level + (k || 1)); B.strikeBonus += (k || 1); log(`${raid.short} levels up to level ${B.level}! Strikes harder and flips more cards.`, 'boss'); H.update(); },
      equipBoss: (name, strike, retal) => { const B = g.boss; B.strikeBonus += strike || 0; B.retalBonus = (B.retalBonus || 0) + (retal || 0); B.equip.push(name); log(`${raid.short} equips ${name}.`, 'boss'); H.update(); },
      // effect helpers
      dmg, heal, draw,
      enemies, minions, allAllies, friendlyChars, heroes: alive,
      bossT: T.boss, heroT: T.hero,
      randomEnemy: () => pick(enemies()),
      randomHero: () => pick(alive()),
      randomAlly: () => pick(allAllies()),
      mostHealth: () => { const a = alive(); return a.length ? a.reduce((x, y) => heroHp(x) >= heroHp(y) ? x : y) : null; },
      mostWounded: () => { const a = alive().filter(p => p.hero.damage > 0); return a.length ? a.reduce((x, y) => x.hero.damage >= y.hero.damage ? x : y) : null; },
      threatTarget,
      allyBy: (key, mode) => {
        const all = allAllies(); if (!all.length) return null;
        const v = t => key === 'cost' ? (C[t.a.id] ? C[t.a.id].cost : 0) : key === 'atk' ? allyAtk(t.p, t.a) : allyMax(t.p, t.a) - t.a.damage;
        return all.reduce((a, b) => (mode === 'max' ? v(b) > v(a) : v(b) < v(a)) ? b : a);
      },
      atkOf: t => t.t === 'ally' ? allyAtk(t.p, t.a) : t.t === 'minion' ? minAtk(t.m) : 0,
      shield: (p, k) => { p.hero.shield += k; log(`${pdef(p).name} is warded against ${k} damage.`, 'def'); H.update(); },
      taunt: p => { p.hero.taunt = true; log(`${pdef(p).name} taunts the enemy!`, 'def'); },
      elusive: p => { p.hero.elusive = true; log(`${pdef(p).name} melts into the shadows.`, 'def'); H.update(); },
      tempAtk: (p, k) => { p.hero.tempAtk += k; H.update(); },
      allyTempAtk: (p, k) => { p.allies.forEach(a => a.tmp += k); H.update(); },
      readyHero: p => { p.hero.ex = false; if (p.weapon) p.weapon.ex = false; },
      readyAllies: p => { p.allies.forEach(a => { a.ex = false; a.frozen = false; }); H.update(); },
      gainRes: (p, k) => { p.tempRes += k; H.update(); },
      mark: (p, k) => { g.boss.mark = { amount: k, by: p.idx }; log(`${raid.short} is marked: +${k} damage taken until ${pdef(p).name}'s next turn.`, 'def'); H.update(); },
      stun: t => { if (t.t === 'boss') g.boss.stunned = true; else if (t.t === 'minion') t.m.stunned = true; log(`${nameOf(t)} is stunned.`, 'def'); H.update(); },
      buffAlly: (t, a, h) => { if (t.t !== 'ally') return; t.a.atkB += a; t.a.hpB += h; H.update(); },
      transform: async (t, id) => { if (t.t !== 'minion') return; const old = minDef(t.m).name; t.m.id = id; t.m.damage = 0; t.m.atkB = 0; t.m.hpB = 0; log(`${old} is transformed into a ${TK[id].name}!`, 'def'); await H.anim('summon', { ref: t.m.uid }); H.update(); },
      revive: async (p, hp) => { if (!p.hero.dead) return; p.hero.dead = false; p.hero.damage = heroMax(p) - hp; log(`${pdef(p).name} returns to the fight!`, 'win'); await H.anim('heal', { ref: 'hero' + p.idx, amount: hp }); H.update(); },
      summonAlly: async (p, id, k) => { for (let i = 0; i < k; i++) { const a = { uid: uid(), id, c: null, damage: 0, ex: false, sick: true, atkB: 0, hpB: 0, tmp: 0, frozen: false, token: id }; a.sick = !allyKw(p, a, 'ferocity'); p.allies.push(a); H.update(); await H.anim('summon', { ref: a.uid }); } log(`${pdef(p).name} summons ${k > 1 ? k + ' ' : 'a '}${TK[id].name}${k > 1 ? 's' : ''}.`, 'play'); },
      summonMinion: async (id, k) => { if (g.players.length === 1 && k > 1) k = Math.ceil(k / 2); for (let i = 0; i < k; i++) { const m = { uid: uid(), id, damage: 0, ex: false, sick: g.phase === 'boss' && !hasKw(TK[id], 'ferocity'), stunned: false, atkB: 0, hpB: 0 }; g.boss.minions.push(m); H.update(); await H.anim('summon', { ref: m.uid }); for (const p of g.players) { const q = perkIs(p, 'firstMinion'); if (q && !p.hero.petUsed && !p.hero.dead && g.boss.minions.includes(m)) { p.hero.petUsed = true; log(`${petName(p)} dives at the ${TK[id].name}.`, 'def'); await dmg(T.minion(m), q.n, { p, kind: 'effect' }); } } } log(`${raid.short} summons ${k > 1 ? k + ' ' : 'a '}${TK[id].name}${k > 1 ? 's' : ''}.`, 'boss'); },
      buffMinions: (a, h) => { g.boss.minions.forEach(m => { m.atkB += a; m.hpB += h; }); H.update(); },
      bossHeal: async k => heal(T.boss(), k),
      addCounter: async k => { if (!raid.counter) return; g.boss.counter += k; H.update(); if (g.boss.counter >= raid.counter.max) { g.boss.counter = 0; await raid.counter.onMax(api); } },
      discardRandom: p => { if (!p.hand.length) return; const c = p.hand.splice(Math.floor(rnd() * p.hand.length), 1)[0]; p.grave.push(c); log(`${pdef(p).name} discards ${C[c.id].name}.`, 'loss'); H.update(); },
      bounce: async t => { if (t.t !== 'ally') return; const p = t.p, a = t.a; p.allies.splice(p.allies.indexOf(a), 1); if (!a.token) { if (p.hand.length < 10) p.hand.push(a.c); else p.grave.push(a.c); } log(`${allyDef(a).name} is swept back to ${pdef(p).name}'s hand.`, 'loss'); await H.anim('death', { ref: a.uid }); H.update(); },
      destroyAlly: async t => { if (t.t !== 'ally') return; t.a.damage = allyMax(t.p, t.a) + 99; await checkDeath(t, {}); },
      destroyArmor: async p => { const slots = Object.keys(p.armor); if (!slots.length) return; const s = slots[Math.floor(rnd() * slots.length)]; const e = p.armor[s]; delete p.armor[s]; p.grave.push(e.c); log(`${C[e.c.id].name} melts away!`, 'loss'); H.update(); },
      freeze: t => { if (t.t !== 'ally') return; t.a.frozen = true; t.a.ex = true; log(`${allyDef(t.a).name} is frozen solid.`, 'loss'); H.update(); },
      exhaustAllies: () => { allAllies().forEach(t => t.a.ex = true); log('Ink clouds the water — every ally is exhausted.', 'loss'); H.update(); },
      tutor: async (p, f) => { const i = p.deck.findIndex(c => f(C[c.id])); if (i < 0) { log('Nothing suitable was found.', ''); return; } const c = p.deck.splice(i, 1)[0]; p.hand.push(c); shuffle(p.deck, rnd); log(`${pdef(p).name} finds ${C[c.id].name}.`, 'play'); H.update(); },
      recoverAlly: async p => { const i = p.grave.map(c => C[c.id]).findIndex(d => d.type === 'ally'); if (i < 0) { log('No fallen ally to recover.', ''); return; } const c = p.grave.splice(i, 1)[0]; p.hand.push(c); log(`${C[c.id].name} returns to ${pdef(p).name}'s hand.`, 'play'); H.update(); },
      scoutBoss: async p => {
        const B = g.boss; if (!B.deck.length) return;
        const id = B.deck[B.deck.length - 1];
        let choice;
        if (p.auto || cfg.allAuto || !H.ask) choice = 'bottom'; else choice = await H.ask('scout', { p, id });
        if (choice === 'bottom') { B.deck.pop(); B.deck.unshift(id); log(`${pdef(p).name} scouts ahead and sends ${BC[id].name} to the bottom of the boss deck.`, 'def'); }
        else log(`${pdef(p).name} scouts ahead: ${BC[id].name} is coming.`, 'def');
        H.update();
      },
      banner: (text, kind) => H.anim('banner', { text, kind }),
    };
    return api;
  };
})(globalThis.RB);
