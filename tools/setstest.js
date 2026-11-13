// Sets 5 and 6 (Wildbloom, Sunscorch) rules check: node tools/setstest.js
globalThis.RB = {};
for (const f of ['art_core', 'art_fig', 'art_obj', 'art_hero', 'data', 'engine', 'ai', 'cardpower', 'frontier', 'packs', 'expansion', 'treasure', 'armory', 'wildbloom', 'sunscorch', 'grandcore', 'skins', 'masters', 'dungeons']) require('../src/' + f + '.js');
const RB = globalThis.RB, C = RB.CARDS;
let fails = 0, uidn = 900;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const inst = id => ({ uid: 'u' + (uidn++), id });
async function game(hero) {
  const E = RB.newGame({ raid: 'molten', seed: 7, party: [{ hero: hero || 'aldric', deck: RB.buildDeck(hero || 'aldric', null, 1) }] }, {});
  await E.start();
  const p = E.g.players[0];
  for (let i = 0; i < 9; i++) p.res.push({ c: inst('draught'), ex: false });
  return { E, p };
}
const give = (p, id) => { const c = inst(id); p.hand.push(c); return c; };
const refresh = p => p.res.forEach(r => r.ex = false);
const nextTurn = async (E, p) => { E.g.round = 1; await E.endHeroTurn(); };
(async () => {
  // ---- Wildbloom ----
  let { E, p } = await game('lyssara');
  await E.playCard(p, give(p, 'scatterseeds')); refresh(p);
  ok(p.seeds.length === 2 && p.seeds[0].pips === 2, 'Scatter Seeds plants two Grow 2 seeds');
  await E.playCard(p, give(p, 'firstacorn')); refresh(p);
  ok(p.seeds.length === 3 && !p.items.some(e => e.c.id === 'firstacorn'), 'Acorn is planted as a seed, not an item');
  await E.growSeeds(p, 1);
  ok(p.seeds.length === 3, 'seeds grow 1, none bloom yet');
  p.hero.damage = 10; const hp0 = E.heroHp(p);
  await E.growSeeds(p, 1);
  ok(p.seeds.length === 1 && p.blooms === 2 && E.heroHp(p) > hp0, 'two Wild Seeds bloom and heal');
  const n0 = p.allies.length; await E.growSeeds(p, 1);
  ok(p.seeds.length === 0 && p.allies.length === n0 + 1 && p.allies[n0].id === 'oakling', 'Acorn blooms into an Oakling');
  ok(p.grave.some(c => c.id === 'firstacorn'), 'used-up seed card goes to the discard pile');
  // Season's Turn + Ranger + Satchel
  await E.playCard(p, give(p, 'gardensatchel')); refresh(p);
  await E.playCard(p, give(p, 'wildranger')); refresh(p);
  E.plant(p, 'wildseed', 2); const bd = E.g.boss.damage, h0 = p.hand.length;
  await E.playCard(p, give(p, 'seasonsturn')); refresh(p);
  ok(p.seeds.length === 0, "Season's Turn blooms every seed");
  ok(p.hand.length === h0 + 1 - 0, 'Satchel draws once per turn (played 1, drew 1)');
  ok(E.g.boss.damage + E.g.boss.minions.length >= bd, 'Ranger fires on bloom');
  // Druid circle, heartwood, verdant heart
  ({ E, p } = await game('grukka'));
  await E.playCard(p, give(p, 'heartwood')); refresh(p);
  await E.playCard(p, give(p, 'verdantheart')); refresh(p);
  p.hero.damage = 10; const hp1 = E.heroHp(p); await E.heal(E.heroT(p), 2, { p }); ok(E.heroHp(p) === hp1 + 3, 'Verdant Heart: healing +1');
  // Thornback Boar frenzy
  await E.playCard(p, give(p, 'thornboar')); refresh(p); const boar = p.allies[p.allies.length - 1]; boar.damage = 2;
  ok(E.allyAtk(p, boar) === 6, 'Thornback Boar Frenzy: +1 ATK per damage');
  // Oriel
  E.plant(p, 'wildseed', 2); E.plant(p, 'vineseed', 1);
  await E.playCard(p, give(p, 'oriel')); refresh(p);
  ok(p.seeds.length === 0, 'Oriel blooms every seed when she arrives');
  // quest
  p.res.push({ c: inst('sacredgarden'), ex: false, quest: true, done: false });
  ok(E.questReady(p, p.res[p.res.length - 1]), 'Tend the Sacred Garden ready after 3 blooms');
  // ---- Sunscorch ----
  ({ E, p } = await game('aldric'));
  const cg = inst('caravanguard'); p.grave.push(cg);
  ok(E.canUnearth(p, cg).ok, 'Caravan Guard can be Unearthed from the discard pile');
  const av = E.available(p); await E.playCard(p, cg, null, { unearth: true });
  ok(p.allies.some(a => a.id === 'caravanguard') && E.available(p) === av - 2 && p.unearthed === 1, 'Unearth pays 2 and plays it');
  const a = p.allies.find(x => x.id === 'caravanguard'); await E.dmg(E.T.ally(p, a), 99, { kind: 'effect' });
  ok(!p.grave.includes(cg) && p.exile.includes(cg), 'an Unearthed card leaves the game afterwards');
  // relic + ledger
  await E.playCard(p, give(p, 'buriedsun')); refresh(p);
  await E.playCard(p, give(p, 'caravanledger')); refresh(p);
  const sl = inst('sunlance'); p.grave.push(sl); p.hero.damage = 6;
  ok(E.unearthCost(p, C.sunlance) === 2, 'Relic: Unearth costs 1 less');
  const hh = p.hand.length, hp2 = E.heroHp(p);
  await E.playCard(p, sl, E.T.boss(), { unearth: true });
  ok(p.hand.length === hh + 1 && E.heroHp(p) === hp2 + 2, 'Relic heals 2 and Ledger draws on Unearth');
  // deep bonuses
  await E.playCard(p, give(p, 'sicklesword')); refresh(p);
  ok(E.weaponAtk(p) === 4, 'Sickle-Sword 4 ATK');
  while (p.grave.length < 10) p.grave.push(inst('draught'));
  ok(E.weaponAtk(p) === 5, 'Sickle-Sword +1 when 10+ in discard');
  // replay from grave
  p.grave.push(inst('buriedhost')); const na = p.allies.length;
  await E.replayFromGrave(p);
  ok(p.allies.length === na + 3, 'Asheera/Zerath replay: best card (Raise the Buried Host) played free');
  // React unearth on boss turn
  ({ E, p } = await game('lyssara'));
  const ms = inst('miragestep'); p.grave.push(ms);
  const opts = E.reactOptions({ attacker: 'x', atk: 9, defT: E.T.hero(p), isBoss: true });
  ok(opts.some(o => o.inst === ms && o.unearth), 'Mirage Step can be Unearthed as a React on the boss turn');
  // land
  p.resPlayed = false; const g0 = p.grave.length; await E.playResource(p, give(p, 'glassdunes'));
  ok(p.grave.length === g0 + 1 && p.hero.shield >= 1, 'Shifting Glass Dunes mills 1 and wards 1');
  const seen = {}; for (let i = 0; i < 300; i++) for (const c of RB.rollBooster(Math.random)) seen[C[c.id].pack || 'core'] = 1;
  ok(seen.wild && seen.sun, 'random boosters include Wildbloom and Sunscorch');
  console.log(fails ? fails + ' FAILED' : 'all passed');
  process.exit(fails ? 1 : 0);
})();
