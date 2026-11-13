// Set 4 (The Armory) rules check: node tools/armorytest.js
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
  for (let i = 0; i < 8; i++) p.res.push({ c: inst('draught'), ex: false });
  return { E, p };
}
const give = (p, id) => { const c = inst(id); p.hand.push(c); return c; };
const refresh = p => p.res.forEach(r => r.ex = false);
(async () => {
  // Geared + weapon bonuses
  let { E, p } = await game('aldric');
  ok(!E.geared(p), 'not geared at start');
  await E.playCard(p, give(p, 'armingsword')); refresh(p);
  ok(E.weaponAtk(p) === 2, 'arming sword 2 ATK un-geared');
  await E.playCard(p, give(p, 'pavise')); refresh(p);
  await E.playCard(p, give(p, 'steadyhand')); refresh(p);
  ok(E.geared(p), 'geared with weapon + 2 armor');
  ok(E.weaponAtk(p) === 4, 'arming sword +2 when geared');
  // Gauntlets need a strike cost to cut: swap to Everforge (strike 1 -> 0), any class
  ok(E.canPlay(p, give(p, 'everforge')).ok, 'Everforge playable by a paladin');
  await E.playCard(p, p.hand[p.hand.length - 1]); refresh(p);
  ok(E.strikeCost(p) === 0, 'gauntlets cut strike cost 1 -> 0 when geared');
  // whetstone
  await E.playCard(p, give(p, 'whetstone')); refresh(p);
  const ws = p.items.find(e => e.c.id === 'whetstone');
  ok(E.itemReady(p, ws), 'whetstone ready with a weapon');
  await E.useItem(p, ws); ok(E.weaponAtk(p) === 7, 'whetstone +2 permanently (5+2)');
  // nine forges cap
  p.res.push({ c: inst('nineforges'), ex: false, loc: true, used: false });
  for (let i = 0; i < 4; i++) { const r = p.res.find(x => x.loc); r.used = false; refresh(p); await E.useLocation(p, r); }
  ok(E.weaponAtk(p) === 10 && !E.locationReady(p, p.res.find(x => x.loc)), 'Nine Forges stops at +3');
  // brooch discount
  ({ E, p } = await game('lyssara'));
  await E.playCard(p, give(p, 'quickbrooch')); refresh(p);
  const fb = C.fireball || C.arcaneblast; const ab = give(p, fb.id);
  ok(E.costOf(p, C[ab.id]) === C[ab.id].cost - 1, 'brooch: first ability costs 1 less');
  p.abTurn = 1; ok(E.costOf(p, C[ab.id]) === C[ab.id].cost, 'brooch: second ability full price');
  // quick change
  p.abTurn = 0; await E.playCard(p, give(p, 'quickchange')); refresh(p);
  ok(E.costOf(p, C.spellmantle) === 0, 'quick change: mantle 3 -> 0');
  await E.playCard(p, give(p, 'spellmantle')); ok(p.quickChange === 0, 'quick change used up');
  const sh0 = p.hero.shield; await E.playCard(p, give(p, 'quickchange')); ok(p.hero.shield === sh0 + 1, 'spellmantle wards 1 on ability');
  // bastion last stand
  ({ E, p } = await game('aldric'));
  await E.playCard(p, give(p, 'bastion')); refresh(p);
  ok(E.heroAtk(p) >= 1, 'bastion +1 ATK');
  p.res.forEach(r => r.ex = true); // armor can't block
  await E.dmg(E.T.hero(p), 999, { kind: 'effect' });
  ok(!p.hero.dead && E.heroHp(p) === 1, 'bastion: survive at 1');
  await E.dmg(E.T.hero(p), 999, { kind: 'effect' });
  ok(p.hero.dead, 'bastion only once');
  // animated armor, war charm, squire
  ({ E, p } = await game('grukka'));
  await E.playCard(p, give(p, 'animarmor')); refresh(p);
  const aa = p.allies[p.allies.length - 1];
  ok(E.allyAtk(p, aa) === 3, 'animated armor base 3');
  await E.playCard(p, give(p, 'warcharm')); refresh(p);
  for (const id of ['breastplate', 'ironhelm']) if (C[id]) { await E.playCard(p, give(p, id)); refresh(p); }
  ok(E.allyAtk(p, aa) === 5, 'animated armor +1 per armor (2 pieces)');
  const w = Object.values(C).find(d => d.type === 'weapon' && E.canEquip(p, d) && d.set === 'core');
  await E.playCard(p, give(p, w.id)); refresh(p);
  ok(E.geared(p) && E.allyAtk(p, aa) === 6, 'war charm +1 when geared');
  // muster
  const n0 = p.allies.length; await E.playCard(p, give(p, 'muster')); refresh(p);
  ok(p.allies.length === n0 + 2 && E.allyAtk(p, p.allies[n0]) === 2 + 1 + 1, 'muster: two men-at-arms, +1 when geared (+1 charm)');
  // tourney quest
  ({ E, p } = await game('aldric'));
  p.res.push({ c: inst('tourney'), ex: false, quest: true, done: false });
  p.wAttacks = 3; const q = p.res.find(r => r.quest && r.c.id === 'tourney');
  ok(E.questReady(p, q), 'tourney ready after 3 weapon attacks');
  const a0 = E.heroAtk(p); await E.completeQuest(p, q); ok(E.heroAtk(p) === a0 + 1, 'tourney +1 ATK for good');
  // duelists' yard
  ({ E, p } = await game('aldric'));
  p.resPlayed = false; const dy = give(p, 'duelyard'); await E.playResource(p, dy);
  ok(p.hero.tempAtk === 1, "duelists' yard +1 ATK");
  // oilcloak
  await E.playCard(p, give(p, 'oilcloak')); p.res.forEach(r => r.ex = true);
  const hp0 = E.heroHp(p); await E.dmg(E.T.hero(p), 3, { kind: 'minion' }); ok(hp0 - E.heroHp(p) === 3 - 1 + E.g.partyFury, 'oilcloak: 1 less from minions');
  // packs
  const seen = {}; for (let i = 0; i < 200; i++) for (const c of RB.rollBooster(Math.random)) seen[C[c.id].pack || 'core'] = 1;
  ok(seen.armory, 'random booster can be an Armory pack');
  console.log(fails ? fails + ' FAILED' : 'all passed');
  process.exit(fails ? 1 : 0);
})();
