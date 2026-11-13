/* RAIDBOUND — fix #161 (Nov 13, 2026): the Grand Core set (49 cards, only in the 20-card Grand Core booster, 5 per pack)
   and the Mythic raid cards (7 per boss, 1 in every Mythic win's treasure pack). Painted with SpriteCook (gen/<id>.webp).
   Rules added for these cards live in engine.js: ally wards, React when an enemy minion attacks (and cancelling it),
   auras (other allies' ATK, Bulwark health, Beast health), boss-only blocking, Enraged weapon bonus, a minion-destroyed
   trigger, party-wide cheat-death items, armor/weapon start-of-turn effects, on-cover effects, and Kindred Spirit's
   face-up resource that saves your hero once. */
(function (RB) {
  const C = RB.CARDS, TK = RB.TOKENS;
  const pick = (E, a) => a.length ? a[Math.floor(E.rnd() * a.length)] : null;
  const art = (s, col) => ({ s, L: [['glow', { x: 150, y: 120, r: 100, c: col || '#ffd27a', op: 0.5 }]] });
  const add = (id, o) => { o.id = id; o.fac = o.fac || 'neutral'; o.rarity = o.rarity || 'u'; o.set = 'grandcore'; o.art = o.art || art('castle'); C[id] = o; };
  const isGear = d => d.type === 'weapon' || d.type === 'armor';
  const minionsDmg = async (E, p, n, cap) => { for (const t of E.aoe(E.minions(), n, cap)) await E.dmg(t, n, { p, kind: 'effect' }); };
  const kill = async (E, t, p) => { if (t && E.isAlive(t)) await E.dmg(t, 999, { p, kind: 'effect' }); };
  const myAllies = (E, p) => E.allAllies().filter(t => t.p === p);
  const readyAttackers = (E, p) => (E.canAttackWith(p, 'hero') ? 1 : 0) + p.allies.filter(a => !a.ex && !a.sick && !a.frozen).length;
  // bring back the best ally from the discard pile straight into play (it leaves the game when it next dies)
  const reviveAlly = async (E, p, hp1, not) => {
    const before = p.allies.slice();
    await E.replayFromGrave(p, d => d.type === 'ally' && d.id !== not);
    const back = p.allies.find(a => !before.includes(a));
    if (back && hp1) back.damage = Math.max(0, E.allyMax(p, back) - 1);
  };

  RB.PACK_SETS.grandcore = { name: 'Grand Core', short: 'Grand Core', theme: 'The best of the Core, only in the big pack', blurb: 'Stronger cards that come only in the 20-card Grand Core booster: five in every pack.', col: '#ffcf6a' };
  RB.REACT.minion = 'when an enemy minion attacks';

  /* ---------- tokens ---------- */
  TK.tok_garrisonsoldier = { id: 'tok_garrisonsoldier', name: 'Garrison Soldier', type: 'ally', atk: 3, hp: 3, kw: ['protector'], race: 'Human', art: art('frost', '#e8f0ff') };
  TK.tok_gwinny = { id: 'tok_gwinny', name: 'Gwinny', type: 'ally', atk: 1, hp: 3, kw: ['protector'], race: 'Beast', text: 'Lady Lagan\'s corgi. Small, loud and very brave.', art: art('steppe', '#ffd8a0') };

  /* =================== Grand Core: allies =================== */
  add('gcgolem', { name: 'Vaultwarden Golem', type: 'ally', cost: 5, atk: 3, hp: 8, kw: ['protector', 'thickhide'], race: 'Construct', flavor: 'It has never once asked who you are. It only checks the key.' });
  add('gctreasurer', { name: 'Royal Treasurer Ambrose', type: 'ally', cost: 3, atk: 2, hp: 4, kw: ['unique'], race: 'Human', rarity: 'r', tags: ['draw', 'ramp'],
    text: 'When this enters play, gain 1 extra resource this turn and draw a card.', onEnter: async (E, c) => { E.gainRes(c.p, 1); await E.draw(c.p, 1); } });
  add('gclancer', { name: 'Silver Concord Lancer', type: 'ally', cost: 4, atk: 4, hp: 5, kw: ['ferocity'], fac: 'concord', race: 'Human', rarity: 'r', tags: ['shield'],
    text: 'When this attacks, prevent the next 2 damage to your hero.', onAttack: async (E, c) => E.shield(c.p, 2) });
  add('gcpackleader', { name: 'Bloodfang Packleader', type: 'ally', cost: 4, atk: 4, hp: 4, kw: ['ferocity'], fac: 'clans', race: 'Orc', rarity: 'r', auraAtk: 1, tags: ['buff'],
    text: 'Your other allies have +1 ATK.', flavor: 'When he howls, the whole pack runs faster.' });
  add('gcgryphon', { name: 'Skyhunter Gryphon', type: 'ally', cost: 4, atk: 3, hp: 5, kw: ['longrange'], race: 'Beast', flavor: 'It strikes from the sun, where no one thinks to look.' });
  add('gcassassin', { name: 'Mistveil Assassin', type: 'ally', cost: 3, atk: 4, hp: 2, kw: ['elusive'], race: 'Elf', rarity: 'r', tags: ['removal'],
    text: 'When this attacks a minion, destroy it if it has 3 or less health left.',
    onAttack: async (E, c) => { const t = c.defender; if (t && t.t === 'minion' && E.isAlive(t) && E.hpOf(t) <= 3) { E.log(`${E.nameOf(t)} is finished off from the mist.`, 'def'); await kill(E, t, c.p); } } });
  add('gcrunesmith', { name: 'Deepforge Runesmith', type: 'ally', cost: 3, atk: 2, hp: 4, race: 'Dwarf', tags: ['draw'],
    text: 'When this enters play, search your deck for a weapon or armor and put it in your hand.', onEnter: async (E, c) => E.tutor(c.p, d => isGear(d)) });
  add('gcgrovekeeper', { name: 'Ancient Grovekeeper', type: 'ally', cost: 6, atk: 4, hp: 7, kw: ['protector'], race: 'Treant', rarity: 'r', tags: ['healAll'],
    text: 'At the start of your turn, heal 2 damage from each friendly hero.', start: async (E, p) => { for (const h of E.heroes()) await E.heal(E.heroT(h), 2, { p }); } });
  add('gcstormgiant', { name: 'Stormborn Giant', type: 'ally', cost: 7, atk: 7, hp: 8, kw: ['thickhide'], race: 'Giant', rarity: 'e', tags: ['stun'],
    text: 'When this enters play, stun a random enemy minion.', onEnter: async (E) => { const t = pick(E, E.minions()); if (t) E.stun(t); } });
  add('gcminotaur', { name: 'Minotaur Pit Champion', type: 'ally', cost: 5, atk: 6, hp: 5, kw: ['frenzy'], race: 'Minotaur', flavor: 'The crowd chants his name. He has forgotten it.' });
  add('gcsapper', { name: 'Goblin Sapper Crew', type: 'ally', cost: 2, atk: 2, hp: 2, race: 'Goblin', tags: ['aoeMinion'],
    text: 'When this is destroyed, deal 2 damage to each enemy minion.', onDeath: async (E, c) => { E.log('The Sapper Crew\'s keg goes off!', 'dmg'); await minionsDmg(E, c.p, 2); }, flavor: '"Is the fuse supposed to be this short?"' });
  add('gcseraph', { name: 'Seraph of the Last Dawn', type: 'ally', cost: 6, atk: 5, hp: 6, kw: ['unique', 'skyward'], race: 'Spirit', rarity: 'e', tags: ['summon'],
    text: 'When this enters play, return an ally from your discard pile to play (it leaves the game when it next falls).', onEnter: async (E, c) => reviveAlly(E, c.p, false, 'gcseraph') });
  add('gcolsen', { name: 'The Olsen Clan', type: 'ally', cost: 5, atk: 5, hp: 6, kw: ['ferocity', 'frenzy'], race: 'Human', rarity: 'r', text: 'The whole family fights as one.', flavor: 'Pa swings, Ma shoots, and the boys argue about who got the last one.' });
  add('gclagan', { name: 'Lady Lagan', type: 'ally', cost: 5, atk: 5, hp: 4, kw: ['unique', 'longrange'], race: 'Human', rarity: 'l', tags: ['summon', 'dmgRandom'],
    text: 'When this enters play, summon Gwinny, her 1/3 corgi with Bulwark. At the start of your turn, deal 2 damage to a random enemy minion.',
    onEnter: async (E, c) => E.summonAlly(c.p, 'tok_gwinny', 1),
    start: async (E, p) => { const t = pick(E, E.minions()); if (t) { E.log('Lady Lagan fires a single shot.', 'dmg'); await E.dmg(t, 2, { p, kind: 'effect' }); } }, });
  add('gckindred', { name: 'Kindred Spirit', type: 'ally', cost: 6, atk: 3, hp: 9, kw: ['unique'], race: 'Spirit', rarity: 'e', tags: ['healAll'], kinRes: true,
    text: 'When this enters play, heal 3 damage from each friendly hero. As a resource it stays face up: the first time your hero would be defeated, they survive with half their starting health.',
    onEnter: async (E, c) => { for (const h of E.heroes()) await E.heal(E.heroT(h), 3, { p: c.p }); } });

  /* =================== Grand Core: abilities =================== */
  add('gcchainlightning', { name: 'Arc Lightning', type: 'ability', speed: 'basic', cost: 3, cls: ['mage'], rarity: 'r', target: 'enemy', tags: ['dmg'], dmg: 4,
    text: 'Deal 4 damage to an enemy, then 2 damage to two other random enemies.',
    run: async (E, c) => { await E.dmg(c.target, 4, { p: c.p, kind: 'spell' }); const rest = E.enemies().filter(t => !E.same(t, c.target)); for (let i = 0; i < 2 && rest.length; i++) { const t = rest.splice(Math.floor(E.rnd() * rest.length), 1)[0]; await E.dmg(t, 2, { p: c.p, kind: 'spell' }); } } });
  add('gcshieldwall', { name: 'Phalanx', type: 'ability', speed: 'instant', react: 'friend', cost: 2, cls: ['warrior', 'paladin'], target: 'none', tags: ['shield'], shield: 3,
    text: 'Prevent the next 3 damage to each friendly hero and each friendly ally.',
    run: async (E, c) => { for (const h of E.heroes()) E.shield(h, 3); for (const t of E.allAllies()) t.a.ward = (t.a.ward || 0) + 3; E.log('Shields lock together: every ally is warded against 3 damage.', 'def'); } });
  add('gcpinning', { name: 'Pinning Shot', type: 'ability', speed: 'basic', cost: 2, cls: ['ranger'], target: 'minion', tags: ['dmg', 'draw'], dmg: 3,
    text: 'Deal 3 damage to an enemy minion and stun it. Draw a card.',
    run: async (E, c) => { await E.dmg(c.target, 3, { p: c.p, kind: 'spell' }); if (E.isAlive(c.target)) E.stun(c.target); await E.draw(c.p, 1); } });
  add('gcshadowstep', { name: 'Smokestep Strike', type: 'ability', speed: 'instant', cost: 2, cls: ['rogue'], rarity: 'r', target: 'none', tags: ['buff', 'ready'],
    text: 'Your hero gets +3 ATK until end of turn and is readied (it can attack again).',
    run: async (E, c) => { E.tempAtk(c.p, 3); E.readyHero(c.p); E.log(`${E.pdef(c.p).name} vanishes in smoke and strikes again.`, 'def'); },
    aiScore: (E, p) => E.isActive(p) && !p.hero.dead ? (p.hero.ex ? 9 : 4) : -1 });
  add('gcdivine', { name: 'Divine Intervention', type: 'ability', speed: 'instant', cost: 5, cls: ['priest', 'paladin'], rarity: 'r', target: 'friendlyHero', tags: ['heal', 'shield'], heal: 8,
    text: 'Heal 8 damage from a friendly hero and prevent the next 4 damage to them.',
    run: async (E, c) => { await E.heal(c.target, 8, { p: c.p }); E.shield(c.target.p, 4); } });
  add('gcmeteor', { name: 'Meteor Shower', type: 'ability', speed: 'basic', cost: 7, cls: ['mage'], rarity: 'e', target: 'none', tags: ['aoe'], dmg: 3,
    text: 'Deal 5 damage to the boss and 3 damage to each enemy minion.',
    run: async (E, c) => { await E.dmg(E.bossT(), 5, { p: c.p, kind: 'spell' }); await (async () => { for (const t of E.aoe(E.minions(), 3, 4)) await E.dmg(t, 3, { p: c.p, kind: 'spell' }); })(); },
    aiScore: (E, p) => { const sp = E.spellPower(p); let s = 5 + sp; for (const t of E.aoe(E.minions(), 3, 4)) s += Math.min(3 + sp, E.hpOf(t)) * 0.8 + (3 + sp >= E.hpOf(t) ? 5 : 0); return s; } });
  add('gcbattlecry', { name: 'Battle Cry', type: 'ability', speed: 'basic', cost: 2, fac: 'clans', target: 'none', tags: ['buff'],
    text: 'Your hero and your allies get +2 ATK until end of turn.', run: async (E, c) => { E.tempAtk(c.p, 2); E.allyTempAtk(c.p, 2); E.log('The war horn sounds: +2 ATK this turn!', 'def'); },
    aiScore: (E, p) => { const n = readyAttackers(E, p); return n >= 2 ? 3 + n * 2.5 : -1; } });
  add('gcoath', { name: 'Oath of the Silver Concord', type: 'ability', speed: 'basic', cost: 3, fac: 'concord', target: 'none', tags: ['shield', 'draw'], shield: 3,
    text: 'Prevent the next 3 damage to each friendly hero. Draw a card.', run: async (E, c) => { for (const h of E.heroes()) E.shield(h, 3); await E.draw(c.p, 1); } });
  add('gcsecondwind', { name: 'Second Wind', type: 'ability', speed: 'instant', cost: 1, target: 'none', tags: ['selfheal'], heal: 4,
    text: 'Heal 4 damage from your hero. If it has 10 or less health, heal 8 instead.', run: async (E, c) => E.heal(E.heroT(c.p), E.heroHp(c.p) <= 10 ? 8 : 4, { p: c.p }),
    aiScore: (E, p) => { const miss = E.heroMax(p) - E.heroHp(p); return E.heroHp(p) <= 10 && miss >= 6 ? 14 : miss >= 5 ? 6 : -1; } });
  add('gcdecree', { name: 'Royal Decree', type: 'ability', speed: 'basic', cost: 4, rarity: 'r', target: 'none', tags: ['draw'], text: 'Draw 3 cards.', run: async (E, c) => E.draw(c.p, 3),
    aiScore: (E, p) => p.hand.length <= 6 ? 9 : -1 });
  add('gcarcane', { name: 'Arcane Overload', type: 'ability', speed: 'basic', cost: 4, cls: ['mage'], target: 'enemy', tags: ['dmg'], dmg: 7,
    text: 'Deal 7 damage to an enemy. Your hero takes 2 damage.', run: async (E, c) => { await E.dmg(c.target, 7, { p: c.p, kind: 'spell' }); await E.dmg(E.heroT(c.p), 2, { kind: 'effect' }); } });
  add('gctrap', { name: 'Hunter\'s Trap', type: 'ability', speed: 'instant', react: 'minion', reactOnly: true, cost: 2, cls: ['ranger'], rarity: 'r', target: 'none', tags: ['stun'],
    text: 'Stun the attacking minion and deal 3 damage to it.',
    run: async (E, c) => { const t = E.g.react && E.g.react.attT; if (!t || !E.isAlive(t)) return; E.stun(t); await E.dmg(t, 3, { p: c.p, kind: 'spell' }); },
    aiScore: () => -1, aiReact: (E, ctx) => { const left = ctx.atk + (E.g.partyFury || 0); return (left >= E.hpOf(ctx.defT) ? 22 : 0) + left * 0.8 + (E.hpOf(ctx.attT) <= 3 ? 6 : 0); } });

  /* =================== Grand Core: weapons =================== */
  add('gcgreatsword', { name: 'Kingsguard Greatsword', type: 'weapon', wtype: 'sword', cost: 4, atk: 6, strike: 2, cls: ['paladin', 'warrior', 'rogue'], rarity: 'r', tags: ['shield'],
    text: 'When your hero attacks with this, prevent the next 2 damage to your hero.', onAttack: async (E, c) => E.shield(c.p, 2) });
  add('gcthunderaxe', { name: 'Thundercleave Axe', type: 'weapon', wtype: 'axe', cost: 3, atk: 5, strike: 2, fac: 'clans', cls: ['warrior', 'ranger'],
    text: 'When your hero attacks a minion with this, deal 2 damage to another random enemy minion.',
    onAttack: async (E, c) => { if (!c.defender || c.defender.t !== 'minion') return; const t = pick(E, E.minions().filter(x => !E.same(x, c.defender))); if (t) await E.dmg(t, 2, { p: c.p, kind: 'effect' }); } });
  add('gcstarbow', { name: 'Starfall Longbow', type: 'weapon', wtype: 'bow', cost: 3, atk: 4, strike: 1, kw: ['longrange'], cls: ['ranger'], rarity: 'r',
    text: 'Your hero can hit a boss in the air with this and takes no damage back.' });
  add('gcwhisper', { name: 'Whisperfang Dagger', type: 'weapon', wtype: 'dagger', cost: 1, atk: 2, strike: 0, cls: ['rogue', 'mage'], tags: ['draw'],
    text: 'When your hero attacks with this and destroys the target, draw a card.', onAttack: async (E, c) => { if (c.defender && c.defender.t === 'minion' && !E.isAlive(c.defender)) await E.draw(c.p, 1); } });
  add('gcarchstaff', { name: 'Archmage\'s Staff of Ages', type: 'weapon', wtype: 'staff', cost: 5, atk: 3, strike: 1, spell: 2, cls: ['mage', 'priest'], rarity: 'e',
    text: 'Your spells and powers deal +2 damage.' });

  /* =================== Grand Core: armor =================== */
  add('gcaegis', { name: 'Aegis of the Sun King', type: 'armor', slot: 'shield', atype: 'shield', cost: 4, def: 4, use: 1, fac: 'concord', cls: ['paladin', 'warrior'], rarity: 'e', tags: ['heal'],
    text: 'When this blocks, heal 2 damage from your hero.', onBlock: async (E, p) => E.heal(E.heroT(p), 2, { p }) });
  add('gchood', { name: 'Shadowsilk Hood', type: 'armor', slot: 'head', atype: 'leather', cost: 2, def: 2, use: 0, heroAtk: 1, cls: ['paladin', 'warrior', 'ranger', 'rogue'],
    text: 'Your hero has +1 ATK.' });
  add('gcmantle', { name: 'Archon\'s Mantle', type: 'armor', slot: 'chest', atype: 'cloth', cost: 3, def: 2, use: 1, spell: 1, rarity: 'r',
    text: 'Your spells and powers deal +1 damage.' });
  add('gcgreaves', { name: 'Bastion Greaves', type: 'armor', slot: 'legs', atype: 'plate', cost: 3, def: 3, use: 1, bulwarkHp: 1, cls: ['paladin', 'warrior'],
    text: 'Your allies with Bulwark have +1 health.' });
  add('gchauberk', { name: 'Wyrmscale Hauberk', type: 'armor', slot: 'chest', atype: 'mail', cost: 4, def: 4, use: 1, bossDef: 1, cls: ['paladin', 'warrior', 'ranger'], rarity: 'r',
    text: 'Blocks 1 more against the boss\'s strikes.' });

  /* =================== Grand Core: items =================== */
  // "Phoenix Feather" was already a loot card's name, so the Grand Core card is the Phoenix Plume
  add('gcphoenix', { name: 'Phoenix Plume', type: 'item', cost: 3, rarity: 'e', cheatAny: true, tags: ['defense'],
    text: 'The first time any friendly hero would be defeated, destroy this. That hero survives with 1 health, then heals 6.', flavor: 'It burns brightest for someone else.' });
  add('gcbag', { name: 'Bag of Many Pockets', type: 'item', cost: 2, tags: ['draw'], text: 'When this enters play, draw 2 cards.', onEnter: async (E, c) => E.draw(c.p, 2),
    flavor: 'Somewhere at the bottom there is a second, smaller bag.' });
  add('gcjewel', { name: 'Crown Jewel of Aldenmere', type: 'item', cost: 4, rarity: 'e', tags: ['ramp'],
    text: 'At the start of your turn, gain 1 extra resource.', start: async (E, p) => { E.gainRes(p, 1); E.log('The Crown Jewel glints: +1 resource this turn.', 'def'); } });
  add('gcvalor', { name: 'Elixir of Valor', type: 'item', cost: 1, prof: 'alchemy', tags: ['shield'],
    use: { cost: 0, destroy: true, target: 'none', ready: (E, p) => p.hand.length < 10 }, urun: async (E, c) => { E.shield(c.p, 5); await E.draw(c.p, 1); },
    aiUse: (E, p) => (E.heroHp(p) / E.heroMax(p) < 0.6 || p.hand.length <= 2) ? 6 : -1,
    text: 'Use: destroy this. Prevent the next 5 damage to your hero and draw a card.' });
  add('gcmoonshine', { name: 'Backwoods Moonshine', type: 'item', cost: 1, tags: ['buff'],
    use: { cost: 0, destroy: true, target: 'none' }, urun: async (E, c) => { E.tempAtk(c.p, 3); await E.heal(E.heroT(c.p), 3, { p: c.p }); },
    aiUse: (E, p) => E.canAttackWith(p, 'hero') && (E.heroMax(p) - E.heroHp(p) >= 3 || E.g.round >= 4) ? 6 : -1,
    text: 'Use: destroy this. Your hero gets +3 ATK until end of turn and heals 3 damage.', flavor: 'XXX. Do not ask what is in it.' });

  /* =================== Grand Core: quests and locations =================== */
  add('gcransom', { name: 'The King\'s Ransom', type: 'quest', cost: 0, qcost: 3, rarity: 'r', tags: ['draw'],
    text: 'Play as a resource. Complete (pay 3): draw 3 cards and gain 1 extra resource this turn.', reward: async (E, c) => { await E.draw(c.p, 3); E.gainRes(c.p, 1); } });
  add('gcstag', { name: 'Hunt the White Stag', type: 'quest', cost: 0, qcost: 0, repeat: true, limit: 1, tags: ['healAll'],
    cond: (E, p, r) => E.g.minionsKilled - ((r && (r.base != null ? r.base : r.mk)) || 0) >= 3,
    progress: (E, p, r) => Math.min(3, E.g.minionsKilled - ((r && (r.base != null ? r.base : r.mk)) || 0)) + ' of 3 minions destroyed',
    condText: 'your party has destroyed 3 more minions',
    text: 'Play as a resource. Repeatable. Reward: heal 3 damage from each friendly hero.',
    reward: async (E, c) => { for (const h of E.heroes()) await E.heal(E.heroT(h), 3, { p: c.p }); } });
  add('gchomecoming', { name: 'Homecoming', type: 'quest', cost: 0, qcost: 2, tags: ['draw'],
    text: 'Play as a resource. Complete (pay 2): return an ally from your discard pile to your hand and draw a card.', reward: async (E, c) => { await E.recoverAlly(c.p); await E.draw(c.p, 1); } });
  add('gcvault', { name: 'The Grand Vault', type: 'location', cost: 0, lcost: 3, rarity: 'e', draws: true, tags: ['draw', 'shield'],
    text: 'Play as a resource. Once per turn: pay 3 to draw a card and prevent the next 2 damage to your hero.', lrun: async (E, c) => { await E.draw(c.p, 1); E.shield(c.p, 2); } });
  add('gccoliseum', { name: 'Highmoor Coliseum', type: 'location', cost: 0, lcost: 2, rarity: 'r', ltarget: 'myAlly', tags: ['buff'],
    lready: (E, p) => p.allies.some(a => !a.ex && !a.frozen),
    text: 'Play as a resource. Once per turn: pay 2 to give one of your allies +2 ATK and Swift this turn.',
    lrun: async (E, c) => { const a = c.target && c.target.a; if (!a) return; a.tmp += 2; a.sick = false; E.log(`The crowd roars for ${E.nameOf(c.target)}: +2 ATK and into the fight!`, 'def'); } });
  add('gcgarrison', { name: 'Garrison of Jon', type: 'location', cost: 0, lcost: 3, rarity: 'r', tags: ['summon'],
    text: 'Play as a resource. Once per turn: pay 3 to summon a 3/3 Garrison Soldier with Bulwark.', lrun: async (E, c) => E.summonAlly(c.p, 'tok_garrisonsoldier', 1) });
  add('gcmolly', { name: 'Shrine of Molly', type: 'location', cost: 0, lcost: 2, rarity: 'r', ltarget: 'friendly', beastHp: 1, tags: ['heal'],
    lready: (E, p) => E.friendlyChars().some(t => E.maxHpOf(t) - E.hpOf(t) > 0),
    text: 'Play as a resource. Once per turn: pay 2 to heal 3 damage from a friendly hero or ally. Your Beast allies have +1 health.',
    lrun: async (E, c) => E.heal(c.target, 3, { p: c.p }) });

  /* =================== Mythic raid cards: 7 per boss =================== */
  const addM = (raid, id, o) => { o.id = id; o.fac = o.fac || 'neutral'; o.rarity = o.rarity || 'r'; o.set = raid; o.mythic = true; o.art = o.art || art({ crypt: 'crypt', molten: 'volcano', tide: 'sunken' }[raid]); C[id] = o; const R = RB.RAIDS[raid]; (R.mythic = R.mythic || []).push(id); };
  // Malgareth, the Hollow King
  addM('crypt', 'my_deathblade', { name: 'Malgareth\'s Deathblade', type: 'weapon', wtype: 'sword', cost: 5, atk: 7, strike: 2, kw: ['unique'], cls: ['paladin', 'warrior', 'rogue'], rarity: 'l', tags: ['heal', 'summon'],
    text: 'When your hero attacks with this, heal your hero 3. If the target dies, summon a 2/1 Bone Servant.',
    onAttack: async (E, c) => { await E.heal(E.heroT(c.p), 3, { p: c.p }); if (c.defender && c.defender.t === 'minion' && !E.isAlive(c.defender)) await E.summonAlly(c.p, 'boneservant', 1); } });
  addM('crypt', 'my_dreadknight', { name: 'Crypt Dread Knight', type: 'ally', cost: 6, atk: 6, hp: 7, kw: ['protector', 'thickhide'], race: 'Undead', rarity: 'e', flavor: 'It swore to guard the crypt. It never said from whom.' });
  addM('crypt', 'my_shroud', { name: 'Shroud of the Hollow King', type: 'armor', slot: 'chest', atype: 'cloth', cost: 3, def: 3, use: 1, spell: 1, rarity: 'e', tags: ['healAll'],
    text: 'Your spells and powers deal +1 damage. When this blocks, heal 1 damage from each friendly hero.', onBlock: async (E, p) => { for (const h of E.heroes()) await E.heal(E.heroT(h), 1, { p }); } });
  addM('crypt', 'my_signet', { name: 'Signet of the Grave Lord', type: 'item', cost: 3, rarity: 'e', tags: ['heal'],
    text: 'Whenever an enemy minion is destroyed, heal 1 damage from your hero.', onMinionDeath: async (E, p) => E.heal(E.heroT(p), 1, { p }) });
  addM('crypt', 'my_revenant', { name: 'Hollowbound Revenant', type: 'ally', cost: 4, atk: 5, hp: 5, race: 'Undead',
    text: 'When this is destroyed, return it to your hand.',
    onDeath: async (E, c) => { const inst = c.a && c.a.c; if (!inst || inst.gone) return; const i = c.p.grave.indexOf(inst); if (i < 0 || c.p.hand.length >= 10 || c.p.hero.dead) return; c.p.grave.splice(i, 1); c.p.hand.push(inst); E.log('The Hollowbound Revenant crawls back to its master.', 'def'); } });
  addM('crypt', 'my_ritual', { name: 'Ritual of Unmaking', type: 'ability', speed: 'basic', cost: 4, cls: ['mage', 'priest'], target: 'minion', tags: ['removal', 'heal'], dmg: 6,
    text: 'Destroy an enemy minion with 6 or less health. Heal 3 damage from your hero.',
    run: async (E, c) => { if (E.isAlive(c.target) && E.hpOf(c.target) <= 6) { E.log(`${E.nameOf(c.target)} is unmade.`, 'kill'); await kill(E, c.target, c.p); } else E.log(`${E.nameOf(c.target)} is too strong to unmake.`, ''); await E.heal(E.heroT(c.p), 3, { p: c.p }); },
    aiScore: (E, p) => { const ok = E.minions().filter(t => E.hpOf(t) <= 6); return ok.length ? 6 + Math.max(...ok.map(t => E.minAtk(t.m))) * 2.2 : -1; } });
  addM('crypt', 'my_covenant', { name: 'Unholy Covenant', type: 'ability', speed: 'instant', cost: 2, target: 'none', tags: ['summon'],
    text: 'Return an ally from your discard pile to play with 1 health (it leaves the game when it next falls).', run: async (E, c) => reviveAlly(E, c.p, true),
    aiScore: (E, p) => E.isActive(p) && p.grave.some(x => C[x.id] && C[x.id].type === 'ally') ? 9 : -1 });
  // Vorthrax, the Cinder Tyrant
  addM('molten', 'my_drake', { name: 'Elder Cinder Drake', type: 'ally', cost: 7, atk: 7, hp: 7, kw: ['unique', 'skyward', 'ferocity'], race: 'Dragonkin', rarity: 'l', tags: ['aoeMinion'],
    text: 'When this enters play, deal 3 damage to each enemy minion.', onEnter: async (E, c) => minionsDmg(E, c.p, 3) });
  addM('molten', 'my_wrath', { name: 'Tyrant\'s Wrath', type: 'ability', speed: 'basic', cost: 6, cls: ['mage'], rarity: 'e', target: 'enemy', tags: ['dmg', 'aoe'], dmg: 6,
    text: 'Deal 6 damage to an enemy and 3 damage to each other enemy.',
    run: async (E, c) => { await E.dmg(c.target, 6, { p: c.p, kind: 'spell' }); for (const t of E.aoe(E.enemies().filter(x => !E.same(x, c.target)), 3, 4)) await E.dmg(t, 3, { p: c.p, kind: 'spell' }); } });
  addM('molten', 'my_moltenaegis', { name: 'Molten Scale Aegis', type: 'armor', slot: 'shield', atype: 'shield', cost: 4, def: 5, use: 1, cls: ['paladin', 'warrior'], rarity: 'e',
    text: 'When this blocks, deal 2 damage to the attacker.', onBlock: async (E, p, att) => { if (att && E.isAlive(att)) await E.dmg(att, 2, { p, kind: 'effect' }); } });
  addM('molten', 'my_infernopact', { name: 'Inferno Pact', type: 'ability', speed: 'instant', cost: 2, rarity: 'e', target: 'none', tags: ['ramp'],
    text: 'Gain 3 extra resources this turn. Your hero takes 3 damage.', run: async (E, c) => { E.gainRes(c.p, 3); await E.dmg(E.heroT(c.p), 3, { kind: 'effect' }); },
    aiScore: (E, p) => { if (!E.isActive(p) || E.heroHp(p) <= 12) return -1; const a = E.available(p) - 2 + 3; return p.hand.some(x => C[x.id].type !== 'quest' && C[x.id].type !== 'location' && C[x.id].cost > E.available(p) && C[x.id].cost <= a) ? 11 : -1; } });
  addM('molten', 'my_glaive', { name: 'Spire-Breaker Glaive', type: 'weapon', wtype: 'polearm', cost: 4, atk: 6, strike: 2, kw: ['skyward'], cls: ['warrior', 'ranger'], enrageAtk: 2,
    text: 'Your hero can hit a boss in the air with this. +2 ATK while the boss is Enraged.' });
  addM('molten', 'my_heartstone', { name: 'Draconic Heartstone', type: 'item', cost: 3, heroAtk: 1, tags: ['aoeMinion', 'buff'],
    text: 'Your hero has +1 ATK. At the start of your turn, deal 1 damage to each enemy minion.', start: async (E, p) => minionsDmg(E, p, 1) });
  addM('molten', 'my_wyrmguard', { name: 'Flameforged Wyrmguard', type: 'ally', cost: 5, atk: 4, hp: 7, kw: ['protector'], race: 'Dragonkin',
    text: 'When this covers a teammate, deal 2 damage to the attacker.', onCover: async (E, c) => { if (c.att && E.isAlive(c.att)) await E.dmg(c.att, 2, { p: c.p, kind: 'effect' }); } });
  // Nethys, Mother of Tides
  addM('tide', 'my_leviathan', { name: 'Abyssal Leviathan', type: 'ally', cost: 8, atk: 8, hp: 10, kw: ['unique', 'thickhide'], race: 'Beast', rarity: 'l', tags: ['stunAll'],
    text: 'When this enters play, stun each enemy minion.', onEnter: async (E) => { for (const t of E.minions()) E.stun(t); } });
  addM('tide', 'my_maelstrom', { name: 'Maelstrom', type: 'ability', speed: 'basic', cost: 5, rarity: 'e', target: 'none', tags: ['aoeMinion', 'stunAll'], dmg: 4,
    text: 'Deal 4 damage to each enemy minion, then stun the ones that survive.',
    run: async (E, c) => { const hit = E.aoe(E.minions(), 4); for (const t of hit) await E.dmg(t, 4, { p: c.p, kind: 'spell' }); for (const t of hit) if (E.isAlive(t)) E.stun(t); } });
  addM('tide', 'my_tidecrown', { name: 'Crown of the Drowned Queen', type: 'armor', slot: 'head', atype: 'cloth', cost: 3, def: 2, use: 0, rarity: 'e', tags: ['stun', 'heal'],
    text: 'At the start of your turn, stun a random enemy minion and heal 1 damage from your hero.',
    start: async (E, p) => { const t = pick(E, E.minions()); if (t) E.stun(t); await E.heal(E.heroT(p), 1, { p }); } });
  addM('tide', 'my_hourglass', { name: 'Tideglass Hourglass', type: 'item', cost: 3, rarity: 'e', tags: ['draw'],
    use: { cost: 2, exhaust: true, target: 'none', ready: (E, p) => p.hand.length < 10 }, urun: async (E, c) => { await E.draw(c.p, 1); await E.scoutBoss(c.p); },
    aiUse: (E, p) => E.available(p) >= 2 && p.hand.length <= 6 ? 4 : -1,
    text: 'Use: pay 2 and exhaust this to draw a card and scout the top card of the boss deck (you may send it to the bottom).' });
  addM('tide', 'my_trident', { name: 'Riptide Trident', type: 'weapon', wtype: 'polearm', cost: 4, atk: 5, strike: 1, cls: ['warrior', 'ranger'], tags: ['stun'],
    text: 'When your hero attacks a minion with this, stun it. Draw a card if it is destroyed.',
    onAttack: async (E, c) => { const t = c.defender; if (!t || t.t !== 'minion') return; if (E.isAlive(t)) E.stun(t); else await E.draw(c.p, 1); } });
  addM('tide', 'my_coralguard', { name: 'Deepcoral Guardian', type: 'ally', cost: 5, atk: 3, hp: 8, kw: ['protector'], race: 'Spirit', tags: ['heal'],
    text: 'At the start of your turn, heal 2 damage from each friendly ally.', start: async (E, p) => { for (const t of E.allAllies()) await E.heal(t, 2, { p }); } });
  addM('tide', 'my_siren', { name: 'Siren\'s Lament', type: 'ability', speed: 'instant', react: 'minion', reactOnly: true, cost: 3, target: 'none', tags: ['stun'],
    text: 'Cancel the attack and stun the attacking minion.',
    run: async (E, c) => { const ctx = E.g.react; if (!ctx || !ctx.attT || !E.isAlive(ctx.attT)) return; ctx.cancel = true; E.stun(ctx.attT); E.log(`A sad song drifts over the water: ${E.nameOf(ctx.attT)} stops mid-attack.`, 'def'); },
    aiScore: () => -1, aiReact: (E, ctx) => { const left = ctx.atk + (E.g.partyFury || 0); return (left >= E.hpOf(ctx.defT) ? 25 : 0) + left * 1.2 + (ctx.defT.t === 'hero' ? 2 : 0); } });

  RB.GRAND_CORE = () => Object.values(C).filter(d => d.set === 'grandcore');
  RB.GRAND_CORE_PER_PACK = 5;
})(globalThis.RB);
