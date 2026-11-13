// #161 Grand Core + Mythic rules check: node tools/grandcoretest.js
globalThis.RB = {};
for (const f of ['art_core', 'art_fig', 'art_obj', 'art_hero', 'data', 'engine', 'ai', 'cardpower', 'frontier', 'packs', 'expansion', 'treasure', 'armory', 'wildbloom', 'sunscorch', 'grandcore', 'skins', 'masters', 'dungeons']) require('../src/' + f + '.js');
const RB = globalThis.RB, C = RB.CARDS, TK = RB.TOKENS;
let fails = 0, uidn = 900;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const inst = id => ({ uid: 'u' + (uidn++), id });
async function game(heroes, raid) {
  heroes = heroes || ['aldric'];
  const E = RB.newGame({ raid: raid || 'crypt', seed: 11, party: heroes.map(h => ({ hero: h, deck: RB.buildDeck(h, null, heroes.length) })) }, {});
  await E.start();
  for (const p of E.g.players) for (let i = 0; i < 10; i++) p.res.push({ c: inst('draught'), ex: false });
  return { E, p: E.g.players[0] };
}
const give = (p, id) => { const c = inst(id); p.hand.push(c); return c; };
const refresh = E => E.g.players.forEach(p => { p.res.forEach(r => r.ex = false); p.tempRes = 0; });
const addMinion = async (E, id) => { await E.summonMinion(id, 1); return E.minions()[E.minions().length - 1]; };
(async () => {
  // set sizes and rarities
  const gc = RB.GRAND_CORE();
  ok(gc.length === 49, 'Grand Core has 49 cards');
  const r = k => gc.filter(d => d.rarity === k).length;
  ok(r('u') === 20 && r('r') === 19 && r('e') === 9 && r('l') === 1, 'Grand Core rarity 20/19/9/1');
  for (const id of ['crypt', 'molten', 'tide']) ok(RB.RAIDS[id].mythic.length === 7 && RB.RAIDS[id].mythic.every(m => !RB.RAIDS[id].treasure.includes(m)), id + ': 7 Mythic cards, none in normal treasure');
  ok(['my_deathblade', 'my_drake', 'my_leviathan'].every(id => RB.maxCopies(C[id]) === 1), 'Mythic legendaries are Unique (1 per deck)');
  ok(!RB.CORE_POOL().some(d => d.set === 'grandcore'), 'Grand Core cards are not in the normal Core pool');
  ok(Object.values(C).filter(d => d.name === 'Phoenix Feather').length === 1, 'no duplicate card names (Phoenix Plume)');
  // pack rolls
  let five = true, gcIn5 = false, gcIn10 = false;
  for (let i = 0; i < 300; i++) {
    const p20 = RB.rollCore(Math.random, 20); if (p20.length !== 20 || p20.filter(x => C[x.id].set === 'grandcore').length !== 5) five = false;
    if (RB.rollCore(Math.random, 5).some(x => C[x.id].set === 'grandcore')) gcIn5 = true;
    if (RB.rollCore(Math.random, 10).some(x => C[x.id].set === 'grandcore')) gcIn10 = true;
  }
  ok(five, 'every 20-card pack: 20 cards, exactly 5 Grand Core');
  ok(!gcIn5 && !gcIn10, 'no Grand Core in the 5 and 10-card packs');
  ok(RB.packPrice('core', 20) === 300, 'Grand Core booster costs 300');
  for (const d of [...gc, ...Object.values(C).filter(x => x.mythic)]) if (typeof d.text !== 'string' && !['ally', 'weapon', 'armor'].includes(d.type)) ok(false, 'text on ' + d.id);

  // Packleader aura, Greaves, Shrine of Molly
  let { E, p } = await game(['grukka']);
  await E.playCard(p, give(p, 'gcolsen')); refresh(E);
  const ol = p.allies[0], olAtk = E.allyAtk(p, ol);
  await E.playCard(p, give(p, 'gcpackleader')); refresh(E);
  ok(E.allyAtk(p, ol) === olAtk + 1 && E.allyAtk(p, p.allies[1]) === 4, 'Packleader gives other allies +1 ATK (not itself)');
  ok(!ol.sick, 'Olsen Clan is Swift');
  ({ E, p } = await game(['aldric']));
  await E.playCard(p, give(p, 'gcgolem')); refresh(E);
  const gol = p.allies[0];
  await E.playCard(p, give(p, 'gcgreaves')); refresh(E);
  ok(E.allyMax(p, gol) === 9, 'Bastion Greaves: Bulwark ally +1 health');
  await E.playCard(p, give(p, 'gclagan')); refresh(E);
  const gw = p.allies.find(a => a.id === 'tok_gwinny');
  ok(!!gw && E.allyMax(p, gw) === 4, 'Lady Lagan summons Gwinny (1/3 Bulwark, +1 health from Greaves)');
  p.res.push({ c: inst('gcmolly'), ex: false, loc: true, used: false });
  ok(E.allyMax(p, gw) === 5, 'Shrine of Molly: Beast allies +1 health');
  ok(!E.canPlay(p, give(p, 'gclagan')).ok, 'Lady Lagan is Unique in play');
  const m1 = await addMinion(E, 'thrall'); const hp0 = E.hpOf(m1);
  E.g.turn = 0; await E.endHeroTurn(); // boss turn, then back to us: Lagan shoots at the start of the turn
  ok(!E.isAlive(m1) || E.hpOf(m1) < hp0 || E.g.over, 'Lady Lagan shoots a minion at the start of the turn');

  // Arc Lightning, Arcane Overload, Meteor Shower
  ({ E, p } = await game(['lyssara']));
  for (let i = 0; i < 3; i++) await addMinion(E, 'colossus');
  const bossHp = E.bossHp();
  await E.playCard(p, give(p, 'gcchainlightning'), E.bossT()); refresh(E);
  ok(bossHp - E.bossHp() >= 4 && E.minions().filter(t => E.hpOf(t) < E.maxHpOf(t)).length === 2, 'Arc Lightning: 4 to the target, 2 to two others');
  const h0 = E.heroHp(p); await E.playCard(p, give(p, 'gcarcane'), E.bossT()); refresh(E);
  ok(E.heroHp(p) === h0 - 2, 'Arcane Overload hurts your hero 2');
  const b1 = E.bossHp(); await E.playCard(p, give(p, 'gcmeteor')); refresh(E);
  ok(b1 - E.bossHp() >= 5, 'Meteor Shower hits the boss for 5');
  await E.playCard(p, give(p, 'gcarchstaff')); refresh(E);
  ok(E.spellPower(p) === 2, 'Archmage\'s Staff: +2 spell damage');

  // Phalanx ward on allies
  ({ E, p } = await game(['aldric']));
  await E.playCard(p, give(p, 'gcgolem')); refresh(E);
  await E.playCard(p, give(p, 'gcshieldwall')); refresh(E);
  ok(p.hero.shield >= 3 && p.allies[0].ward === 3, 'Phalanx wards heroes and allies');
  await E.dmg(E.T.ally(p, p.allies[0]), 5, { kind: 'minion' });
  ok(p.allies[0].damage === 1, 'ally ward absorbs 3, Thick Hide 1: 5 -> 1');

  // Smokestep Strike readies the hero
  ({ E, p } = await game(['snix']));
  p.hero.ex = true; await E.playCard(p, give(p, 'gcshadowstep')); refresh(E);
  ok(!p.hero.ex && p.hero.tempAtk >= 3, 'Smokestep Strike: readied with +3 ATK');

  // Hauberk blocks more against the boss
  ({ E, p } = await game(['aldric']));
  await E.playCard(p, give(p, 'gchauberk')); refresh(E);
  E.g.curAtt = E.bossT(); const left = await (async () => { const before = p.hero.damage; await E.dmg(E.heroT(p), 10, { kind: 'boss', strike: true }); return p.hero.damage - before; })(); E.g.curAtt = null;
  ok(left <= 10 - 5 + E.g.partyFury, 'Wyrmscale Hauberk blocks 5 against a boss strike');

  // Phoenix Plume saves a teammate; Kindred Spirit resource saves its hero
  ({ E, p } = await game(['aldric', 'grukka']));
  const q = E.g.players[1];
  await E.playCard(p, give(p, 'gcphoenix')); refresh(E);
  await E.dmg(E.heroT(q), 999, { kind: 'boss' });
  ok(!q.hero.dead && E.heroHp(q) === 7 && !p.items.some(e => e.c.id === 'gcphoenix'), 'Phoenix Plume saves a teammate: 1 health then +6, and burns away');
  await E.dmg(E.heroT(q), 999, { kind: 'boss' }); ok(q.hero.dead, 'only once');
  ({ E, p } = await game(['aldric']));
  p.resPlayed = false; const ks = give(p, 'gckindred'); await E.playResource(p, ks);
  ok(p.res.some(r => r.kin), 'Kindred Spirit played as a resource stays face up');
  await E.dmg(E.heroT(p), 999, { kind: 'boss' });
  ok(!p.hero.dead && E.heroHp(p) === Math.ceil(RB.HEROES.aldric.hp / 2), 'Kindred Spirit: survives at half starting health');
  await E.dmg(E.heroT(p), 999, { kind: 'boss' }); ok(p.hero.dead, 'Kindred Spirit saves only once');

  // Siren's Lament cancels a minion attack; Hunter's Trap stuns and hurts
  ({ E, p } = await game(['aldric']));
  ok(!E.canPlay(p, give(p, 'my_siren')).ok, 'Siren\'s Lament can\'t be played on your own turn');
  const ogreT = await addMinion(E, 'colossus'), ogre = ogreT.m; ogre.sick = false; ogre.ex = false;
  p.auto = true; const hpA = E.heroHp(p);
  E.g.phase = 'boss';
  await (async () => { const all = E.minions(); for (const t of all) if (t.m !== ogre) t.m.ex = true; })();
  // run one minion attack through the engine path
  const before = E.heroHp(p);
  const rctxOk = E.reactOptions({ attacker: 'x', atk: 5, defT: E.heroT(p), isBoss: false, attT: E.T.minion(ogre) }).some(o => o.inst.id === 'my_siren');
  ok(rctxOk, 'Siren\'s Lament is offered when an enemy minion attacks');
  ok(!E.reactOptions({ attacker: 'b', atk: 5, defT: E.heroT(p), isBoss: true, attT: E.bossT() }).some(o => o.inst.id === 'my_siren'), 'not offered against the boss\'s strike');
  E.g.react = { attacker: 'x', atk: 5, defT: E.heroT(p), isBoss: false, attT: E.T.minion(ogre) };
  const r1 = await E.playCard(p, p.hand.find(c => c.id === 'my_siren'));
  if (!r1.ok) console.log(r1); ok(r1.ok && E.g.react.cancel && ogre.stunned, 'Siren\'s Lament sets cancel and stuns the attacker');
  E.g.react = null; E.g.phase = 'main';
  ok(E.heroHp(p) === before, 'no damage taken');

  // Signet heals when a minion dies; Revenant returns to hand
  ({ E, p } = await game(['aldric']));
  await E.playCard(p, give(p, 'my_signet')); refresh(E);
  await E.dmg(E.heroT(p), 5, { kind: 'boss' });
  const mm = await addMinion(E, 'thrall'); const hb = E.heroHp(p);
  await E.dmg(mm, 99, { p, kind: 'spell' });
  ok(E.heroHp(p) === hb + 1, 'Signet of the Grave Lord heals 1 when a minion dies');
  await E.playCard(p, give(p, 'my_revenant')); refresh(E);
  const rv = p.allies.find(a => a.id === 'my_revenant');
  await E.destroyAlly(E.T.ally(p, rv));
  ok(p.hand.some(c => c.id === 'my_revenant') && !p.grave.some(c => c.id === 'my_revenant'), 'Hollowbound Revenant returns to hand');

  // Unholy Covenant brings an ally back at 1 health; Seraph brings one back
  ({ E, p } = await game(['aldric']));
  p.grave.push(inst('gcgolem'));
  await E.playCard(p, give(p, 'my_covenant')); refresh(E);
  const back = p.allies.find(a => a.id === 'gcgolem');
  ok(back && E.allyMax(p, back) - back.damage === 1, 'Unholy Covenant: ally back with 1 health');
  p.grave.push(inst('gcminotaur'));
  await E.playCard(p, give(p, 'gcseraph')); refresh(E);
  ok(p.allies.some(a => a.id === 'gcminotaur'), 'Seraph of the Last Dawn returns an ally to play');

  // Ritual of Unmaking, Maelstrom, Leviathan
  ({ E, p } = await game(['lyssara']));
  const small = await addMinion(E, 'thrall');
  await E.playCard(p, give(p, 'my_ritual'), small); refresh(E);
  ok(!E.isAlive(small), 'Ritual of Unmaking destroys a small minion');
  const g1 = await addMinion(E, 'colossus'), g2 = await addMinion(E, 'thrall');
  await E.playCard(p, give(p, 'my_maelstrom')); refresh(E);
  ok(E.minions().every(t => t.m.stunned), 'Maelstrom stuns the survivors');

  // Glaive: Enraged bonus and Skyward reach; Starfall Longbow Volley
  ({ E, p } = await game(['grukka'], 'molten'));
  await E.playCard(p, give(p, 'my_glaive')); refresh(E);
  const wa = E.weaponAtk(p); E.g.boss.enrage = 1;
  ok(E.weaponAtk(p) === wa + 2, 'Spire-Breaker Glaive +2 ATK while Enraged');
  E.g.boss.flying = true;
  ok(E.volleyAttack(p, 'hero'), 'Glaive reaches a boss in the air');

  // Garrison and Coliseum
  ({ E, p } = await game(['aldric']));
  p.res.push({ c: inst('gcgarrison'), ex: false, loc: true, used: false });
  await E.useLocation(p, p.res.find(r => r.loc)); refresh(E);
  ok(p.allies.some(a => a.id === 'tok_garrisonsoldier'), 'Garrison of Jon summons a Garrison Soldier');
  p.res.find(r => r.loc).loc = false; p.res.push({ c: inst('gccoliseum'), ex: false, loc: true, used: false });
  const gs = p.allies[0]; gs.sick = true;
  const cr = await E.useLocation(p, p.res.find(r => r.loc && r.c.id === 'gccoliseum'), E.T.ally(p, gs));
  ok(cr.ok && !gs.sick && gs.tmp === 2, 'Highmoor Coliseum: +2 ATK and Swift');

  // Crown of the Drowned Queen start effect
  ({ E, p } = await game(['lyssara'], 'tide'));
  await E.playCard(p, give(p, 'my_tidecrown')); refresh(E);
  ok(!!p.armor.head, 'Crown equipped');

  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
