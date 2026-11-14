// Player vs player (1v1, 2v2) and the boss race (2v2 vs a raid boss): rules checks plus all-AI games.
// node tools/pvptest.js [games per setup]
globalThis.RB = {};
for (const f of ['art_core', 'art_fig', 'art_obj', 'art_hero', 'data', 'engine', 'ai', 'cardpower', 'frontier', 'packs', 'expansion', 'treasure', 'armory', 'wildbloom', 'sunscorch', 'grandcore', 'skins', 'masters', 'dungeons']) require('../src/' + f + '.js');
const RB = globalThis.RB, C = RB.CARDS;
const N = +process.argv[2] || 30;
let fails = 0, uidn = 5000;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const inst = id => ({ uid: 'u' + (uidn++), id });
const heroes = Object.keys(RB.HEROES).filter(h => { try { RB.buildDeck(h, null, 2); return true; } catch (e) { return false; } });
function cfgFor(mode, hs, seed, raid) {
  return { pvp: mode, raid: raid || 'crypt', seed, allAuto: true, party: hs.map((h, i) => ({ hero: h, deck: RB.buildDeck(h, null, 2), team: i % 2, auto: true })) };
}
async function setup(mode, hs, raid) {
  const E = RB.newGame(Object.assign(cfgFor(mode, hs, 7, raid), { allAuto: false, party: hs.map((h, i) => ({ hero: h, deck: RB.buildDeck(h, null, 2), team: i % 2 })) }), {});
  // hand-built table: skip the normal start so turns don't run by themselves
  E.g.phase = 'main'; E.g.turn = 0;
  for (const p of E.g.players) for (let i = 0; i < 12; i++) p.res.push({ c: inst('draught'), ex: false });
  return E;
}
const give = (p, id) => { const c = inst(id); p.hand.push(c); return c; };
const ally = async (E, p, id) => { const c = give(p, id); E.g.turn = p.idx; await E.playCard(p, c, null); const a = p.allies[p.allies.length - 1]; a.sick = false; a.ex = false; return a; };

(async () => {
  /* ---------- rules ---------- */
  {
    const E = await setup('duel', ['aldric', 'grukka']);
    const [A, B] = E.g.players;
    ok(A.team === 0 && B.team === 1, 'seats alternate teams');
    ok(E.raid.id === 'arena' && E.g.partyFury === 0, 'duel uses the Arena, no party fury');
    const bAlly = await ally(E, B, 'footman');
    E.g.turn = 0;
    const en = E.enemies();
    ok(en.some(t => t.t === 'hero' && t.p === B) && en.some(t => t.t === 'ally' && t.a === bAlly) && !en.some(t => t.t === 'hero' && t.p === A) && !en.some(t => t.t === 'boss'), 'enemies = the other team (no boss in a duel)');
    ok(E.minions().length === 1 && E.minions()[0].a === bAlly, '"minions" in a duel are enemy allies');
    ok(E.friendlyChars().every(t => t.p === A), 'friendly = my own team');
    ok(E.bossT().t === 'hero' && E.bossT().p === B, '"the boss" in a duel is an enemy hero');
    const at = E.attackTargets(A, 'hero');
    ok(at.some(t => t.t === 'hero' && t.p === B) && at.some(t => t.t === 'ally' && t.a === bAlly) && !at.some(t => t.p === A), 'attack targets are enemy heroes and allies');
    // Mythic cards are switched off in a duel
    const my = give(A, 'my_deathblade');
    ok(!E.canPlay(A, my).ok && /Arena/.test(E.canPlay(A, my).why), 'Mythic raid cards can\'t be played in a duel');
    // an ability that hits "an enemy" can hit the enemy hero
    const fb = give(A, 'fireball');
    const hp0 = E.heroHp(B);
    const r = await E.playCard(A, fb, E.T.hero(B));
    ok(r.ok && E.heroHp(B) < hp0, 'Fireball hits the enemy hero');
    // a heal can't target an enemy
    ok(!E.targetsFor('friendly', A).some(t => t.p === B), 'heals can\'t target the enemy team');
    // stun on a hero: no attack next turn
    E.stun(E.T.hero(B));
    ok(B.hero.stunNext, 'stun marks an enemy hero to miss their next attack');
  }
  {
    // attacking an enemy ally: it hits back; a Bulwark ally of the defender's team covers its hero
    const E = await setup('duel', ['aldric', 'grukka']);
    const [A, B] = E.g.players;
    const a1 = await ally(E, A, 'footman'); const b1 = await ally(E, B, 'footman');
    E.g.turn = 0; E.g.settings.autoDefend = true;
    const aHp = E.allyMax(A, a1) - a1.damage;
    await E.attack(A, a1, E.T.ally(B, b1));
    ok(a1.damage > 0 || !A.allies.includes(a1), 'an attacked enemy ally hits back');
    ok(b1.damage > 0 || !B.allies.includes(b1), 'the attacked ally takes damage');
    ok(aHp > 0, '(sanity)');
  }
  {
    const E = await setup('duel', ['aldric', 'grukka']);
    const [A, B] = E.g.players;
    const guard = Object.values(C).find(d => d.type === 'ally' && (d.kw || []).includes('protector') && d.hp >= 5 && !d.mythic);
    const bw = await ally(E, B, guard.id);
    const a1 = await ally(E, A, 'sellsword');
    E.g.turn = 0;
    const hpB = E.heroHp(B);
    await E.attack(A, a1, E.T.hero(B));
    ok(E.heroHp(B) === hpB && (bw.damage > 0 || bw.ex), `a ${guard.name} (Bulwark) covers its own hero`);
  }
  {
    // 2v2: team mates are friends, React cards only for the defending team
    const E = await setup('duel', ['aldric', 'grukka', 'lyssara', 'korga']);
    const [A, B, A2, B2] = E.g.players;
    ok(A.team === A2.team && B.team === B2.team && A.team !== B.team, '2v2: seats 1+3 against 2+4');
    E.g.turn = 0;
    ok(E.heroes().length === 2 && E.heroes().includes(A2), 'heroes() = my team in 2v2');
    const ctx = { attacker: 'x', atk: 5, defT: E.T.hero(B), isBoss: true, attT: E.T.hero(A) };
    give(A2, 'aegis'); give(B2, 'aegis');
    const opts = E.reactOptions(ctx);
    ok(opts.length && opts.every(o => o.p.team === B.team), 'only the defending team may React');
    const cov = E.coverOptions(E.T.hero(B), null, false);
    ok(cov.every(t => t.p.team === B.team), 'only the defending team may cover');
  }
  {
    // race: boss plus the other team; boss kill decides the winner
    const E = await setup('race', heroes.slice(0, 4), 'crypt');
    const [A, B] = E.g.players;
    E.g.turn = 0;
    ok(E.enemies().some(t => t.t === 'boss') && E.enemies().some(t => t.t === 'hero' && t.p === B), 'race: enemies = boss, minions and the other team');
    ok(E.bossT().t === 'boss', 'race: "the boss" is the boss');
    E.g.boss.damage = E.g.boss.maxHp - 2;
    const fb = give(A, 'fireball');
    await E.playCard(A, fb, E.T.boss());
    ok(E.g.over === 'win' && E.g.winTeam === A.team, 'race: the team that lands the killing blow wins');
  }
  {
    // a team wipe ends the game
    const E = await setup('race', heroes.slice(0, 4), 'crypt');
    const [A, B, A2, B2] = E.g.players;
    E.g.turn = 0;
    B2.hero.dead = true;
    B.hero.damage = E.heroMax(B) - 1; B.armor = {}; B.hero.shield = 0; B.res = []; B.items = [];
    await E.dmg(E.T.hero(B), 5, { p: A, kind: 'spell' });
    ok(E.g.over === 'win' && E.g.winTeam === A.team, 'race: wiping the other team wins too');
  }

  /* ---------- all-AI games ---------- */
  const R = {};
  for (const [label, mode, size, raid] of [['duel 1v1', 'duel', 2], ['duel 2v2', 'duel', 4], ['race crypt', 'race', 4, 'crypt'], ['race molten', 'race', 4, 'molten'], ['race tide', 'race', 4, 'tide']]) {
    const st = R[label] = { games: 0, team0: 0, team1: 0, none: 0, rounds: 0, errors: 0, stuck: 0, bossWin: 0 };
    for (let i = 0; i < N; i++) {
      const hs = Array.from({ length: size }, (_, k) => heroes[(i * 3 + k * 5) % heroes.length]);
      const E = RB.newGame(cfgFor(mode, hs, 1000 + i, raid), {});
      try {
        const t = setTimeout(() => { }, 0); clearTimeout(t);
        let guard = true;
        const run = E.start();
        const timer = new Promise(res => setTimeout(() => res('timeout'), 20000));
        const r = await Promise.race([run.then(() => 'done'), timer]);
        if (r === 'timeout') { st.stuck++; E.g.over = 'abandon'; continue; }
        st.games++; st.rounds += E.g.round;
        if (E.g.winTeam === 0) st.team0++; else if (E.g.winTeam === 1) st.team1++; else st.none++;
        if (mode === 'race' && E.g.boss.damage >= E.g.boss.maxHp) st.bossWin++;
        if (mode === 'race') st.bossLeft = (st.bossLeft || 0) + Math.max(0, 1 - E.g.boss.damage / E.g.boss.maxHp);
        if (!E.g.over) st.stuck++;
        if (mode === 'duel' && E.g.round >= RB.PVP_FATIGUE) st.fatigue = (st.fatigue || 0) + 1;
      } catch (e) { st.errors++; if (st.errors < 3) console.log(label, 'ERROR', e.stack.split('\n').slice(0, 4).join(' | ')); }
    }
  }
  console.log('\nsetup         games  team1-wins  team2-wins  nobody  avg-rounds  boss-killed  errors  stuck');
  for (const [k, s] of Object.entries(R)) console.log(k.padEnd(14), String(s.games).padStart(5), String(s.team0).padStart(11), String(s.team1).padStart(11), String(s.none).padStart(7), (s.rounds / Math.max(1, s.games)).toFixed(1).padStart(11), String(s.bossWin).padStart(12), String(s.errors).padStart(7), String(s.stuck).padStart(6));
  for (const [k, s] of Object.entries(R)) if (s.bossLeft != null) console.log(k, 'boss health left at the end:', Math.round(s.bossLeft / s.games * 100) + '%');
  for (const [k, s] of Object.entries(R)) if (s.fatigue) console.log(k, 'reached Arena fatigue in', s.fatigue, 'of', s.games);
  for (const [k, s] of Object.entries(R)) { ok(!s.errors && !s.stuck, k + ': no errors, every game ends'); }
  console.log(fails ? `${fails} FAILED` : 'all passed');
  process.exit(fails ? 1 : 0);
})();
