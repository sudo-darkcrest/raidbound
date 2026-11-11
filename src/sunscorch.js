/* RAIDBOUND — Booster set 6: Sunscorch (fix #115, Nov 11, 2026). Sand, sun-glass and buried kingdoms.
   Rule word Unearth N: while the card is in your discard pile you may pay N on your turn to play it again (a React
   Instant also when its trigger happens); afterwards it leaves the game (see canUnearth in engine.js).
   "Deep": 10 or more cards in your discard pile. Set land: Shifting Glass Dunes.
   Art: drawn with the game's own painter (art_wild.js) in one desert palette, then baked to gen/<id>.webp. */
(function (RB) {
  const C = RB.CARDS, TK = RB.TOKENS;
  const pick = (E, a) => a.length ? a[Math.floor(E.rnd() * a.length)] : null;
  const add = (id, o) => { o.id = id; o.fac = o.fac || 'neutral'; o.rarity = o.rarity || 'c'; o.set = 'frontier'; o.pack = 'sun'; o.art = o.art || { s: 'desert', L: [] }; C[id] = o; };
  const deep = (E, p) => E.deep(p);

  RB.PACK_SETS.sun = { name: 'Sunscorch', short: 'Sunscorch', theme: 'Sand, sun-glass and buried kingdoms', blurb: 'Glass dunes, sun temples and a serpent queen. Fill your discard pile, then Unearth your best cards for a second go late in the raid.', col: '#f0b84a' };
  RB.BOOSTER_SETS.push('sun');
  RB.KEYWORDS.unearth = ['Unearth', 'Unearth N: while this card is in your discard pile, you may pay N on your turn to play it again (a React Instant also when its trigger happens). Afterwards it leaves the game for good.'];

  /* ---------- tokens ---------- */
  TK.mirage = { id: 'mirage', name: 'Mirage', type: 'ally', atk: 1, hp: 1, kw: ['elusive'], race: 'Spirit' };
  TK.sandwarrior = { id: 'sandwarrior', name: 'Sand Warrior', type: 'ally', atk: 2, hp: 2, race: 'Elemental' };

  /* =================== allies =================== */
  add('asheera', { name: 'Queen Asheera of the Glass Dunes', type: 'ally', cost: 8, atk: 7, hp: 7, kw: ['unique'], race: 'Human', rarity: 'l', tags: ['dmg'],
    text: 'When she enters play, play a non-legendary card from your discard pile for free (it then leaves the game). Each turn: 2 damage to the boss; heal your hero 2.',
    onEnter: async (E, c) => E.replayFromGrave(c.p, d => d.rarity !== 'l'), start: async (E, p) => { await E.dmg(E.bossT(), 2, { p, kind: 'effect' }); await E.heal(E.heroT(p), 2, { p }); },
  });
  add('basilisk', { name: 'Glass-Scale Basilisk', type: 'ally', cost: 5, atk: 4, hp: 5, kw: ['thickhide'], race: 'Beast', rarity: 'r', unearth: 5,
    text: 'When this attacks a minion, stun it. Unearth 5.', onAttack: async (E, c) => { if (c.defender && c.defender.t === 'minion' && E.isAlive(c.defender)) E.stun(c.defender); } });
  add('sunpriestess', { name: 'Sun-Priestess of the Dawn Disc', type: 'ally', cost: 3, atk: 2, hp: 4, kw: ['tend'], fac: 'concord', race: 'Human', rarity: 'u', tags: ['draw'],
    text: 'When this enters play, put an ally from your discard pile into your hand.', onEnter: async (E, c) => E.recoverAlly(c.p) });
  add('scorpionrider', { name: 'Dune Scorpion Rider', type: 'ally', cost: 3, atk: 3, hp: 3, kw: ['ferocity'], fac: 'clans', race: 'Orc', rarity: 'u', unearth: 3,
    text: 'Unearth 3.', flavor: 'The scorpion knows the way. The orc just yells.' });
  add('tombdelver', { name: 'Tomb-Delver', type: 'ally', cost: 2, atk: 2, hp: 3, race: 'Dwarf', rarity: 'u', tags: ['draw'],
    text: 'When this enters play, look at the top 3 cards of your deck. Put the best one in your hand and the rest in your discard pile.',
    onEnter: async (E, c) => { const p = c.p, top = p.deck.splice(-3); if (!top.length) return; const best = top.reduce((a, b) => (RB.cardScore ? RB.cardScore(C[b.id]) : C[b.id].cost) > (RB.cardScore ? RB.cardScore(C[a.id]) : C[a.id].cost) ? b : a);
      for (const x of top) { if (x === best && p.hand.length < 10) p.hand.push(x); else p.grave.push(x); } E.log(`The Tomb-Delver brings back ${C[best.id].name}.`, 'play'); } });
  add('sandcolossus', { name: 'Sandstone Colossus', type: 'ally', cost: 6, atk: 5, hp: 7, kw: ['protector', 'thickhide'], race: 'Construct', rarity: 'u', unearth: 5,
    text: 'Unearth 5.', flavor: 'It was a statue for a thousand years. It is done being a statue.' });
  add('miragedancer', { name: 'Mirage Dancer', type: 'ally', cost: 2, atk: 2, hp: 3, kw: ['elusive'], race: 'Human',
    text: 'When this ally is destroyed, summon a 1/1 Mirage with Shrouded.', onDeath: async (E, c) => E.summonAlly(c.p, 'mirage', 1) });
  add('caravanguard', { name: 'Caravan Guard', type: 'ally', cost: 2, atk: 2, hp: 4, kw: ['protector'], fac: 'concord', race: 'Human', unearth: 2,
    text: 'Unearth 2.', flavor: 'Paid by the mile. Walks every one of them.' });
  add('glassblower', { name: 'Dune Glassblower', type: 'ally', cost: 2, atk: 1, hp: 4, fac: 'clans', race: 'Goblin', tags: ['shield'],
    text: 'When this enters play, prevent the next 2 damage to your hero.', onEnter: async (E, c) => E.shield(c.p, 2) });
  add('serpentling', { name: 'Sand Serpent Hatchling', type: 'ally', cost: 1, atk: 2, hp: 1, kw: ['ferocity'], race: 'Beast', unearth: 1,
    text: 'Unearth 1.' });

  /* =================== abilities =================== */
  add('sandstorm', { name: 'Sandstorm', type: 'ability', speed: 'basic', cost: 4, rarity: 'r', target: 'none', tags: ['stunAll'], unearth: 4,
    text: 'Stun each enemy minion. Unearth 4.', run: async (E, c) => { for (const t of E.aoe(E.minions(), 0)) E.stun(t); } });
  add('buriedhost', { name: 'Raise the Buried Host', type: 'ability', speed: 'basic', cost: 5, rarity: 'r', target: 'none', tags: ['summon'], unearth: 5,
    text: 'Summon three 2/2 Sand Warriors. Unearth 5.', run: async (E, c) => E.summonAlly(c.p, 'sandwarrior', 3) });
  add('sunlance', { name: 'Sunlance', type: 'ability', speed: 'basic', cost: 3, cls: ['paladin', 'priest', 'mage'], rarity: 'u', target: 'enemy', tags: ['dmg'], dmg: 4, unearth: 3,
    text: 'Deal 4 damage to an enemy. Unearth 3.', run: async (E, c) => E.dmg(c.target, 4, { p: c.p, kind: 'spell' }) });
  add('miragestep', { name: 'Mirage Step', type: 'ability', speed: 'instant', react: 'hero', cost: 2, cls: ['rogue', 'ranger', 'mage'], rarity: 'u', target: 'none', tags: ['shield'], shield: 4, unearth: 3,
    text: 'Prevent the next 4 damage to your hero. Unearth 3.', run: async (E, c) => E.shield(c.p, 4) });
  add('scorchingnoon', { name: 'Scorching Noon', type: 'ability', speed: 'basic', cost: 3, rarity: 'u', target: 'none', tags: ['aoeMinion', 'dmg'], dmg: 2, unearth: 3,
    text: 'Deal 2 damage to each enemy minion. Unearth 3.', run: async (E, c) => { for (const t of E.aoe(E.minions(), 2)) await E.dmg(t, 2, { p: c.p, kind: 'spell' }); } });
  add('siftsands', { name: 'Sift the Sands', type: 'ability', speed: 'basic', cost: 1, target: 'none', tags: ['draw'],
    text: 'Discard your 2 lowest-cost cards (or fewer), then draw that many plus 1.',
    run: async (E, c) => { const p = c.p, out = p.hand.slice().sort((a, b) => (C[a.id].cost || 0) - (C[b.id].cost || 0)).slice(0, 2); for (const x of out) { p.hand.splice(p.hand.indexOf(x), 1); p.grave.push(x); } if (out.length) E.log(`${E.pdef(p).name} sifts away ${out.map(x => C[x.id].name).join(' and ')}.`, ''); await E.draw(p, out.length + 1); } });
  add('oasisprayer', { name: 'Oasis Prayer', type: 'ability', speed: 'basic', cost: 2, target: 'friendly', tags: ['heal'], heal: 4, unearth: 2,
    text: 'Heal 4 damage from a friendly hero or ally. Unearth 2.', run: async (E, c) => E.heal(c.target, 4, { p: c.p }) });
  add('glassward', { name: 'Glass Ward', type: 'ability', speed: 'instant', react: 'friendHero', cost: 1, target: 'friendlyHero', tags: ['shield'], shield: 2, unearth: 1,
    text: 'Prevent the next 2 damage to that hero. Unearth 1.', run: async (E, c) => E.shield(c.target.p, 2) });

  /* =================== items =================== */
  add('buriedsun', { name: 'Relic of the Buried Sun', type: 'item', cost: 3, rarity: 'e', unearthOff: 1, tags: ['heal'],
    text: 'Your Unearth costs are 1 less. When you Unearth a card, heal 2 damage from your hero.', onUnearth: async (E, p) => E.heal(E.heroT(p), 2, { p }) });
  add('suncirclet', { name: 'Sunstone Circlet', type: 'item', cost: 3, cls: ['mage', 'priest'], rarity: 'u', spell: 1, spellDeep: 1,
    text: 'Your spells and powers deal +1 damage, or +2 while 10 or more cards are in your discard pile.' });
  add('caravanledger', { name: 'Caravan Ledger', type: 'item', cost: 2, rarity: 'u', tags: ['draw'],
    text: 'When you Unearth a card, draw a card (once per turn).', onUnearth: async (E, p) => { if (p.unearthDrew) return; p.unearthDrew = true; await E.draw(p, 1); } });
  add('sunlens', { name: 'Sun-Glass Lens', type: 'item', cost: 2, rarity: 'u', tags: ['dmgRandom'],
    text: 'At the start of your turn, deal 1 damage to a random enemy minion.', start: async (E, p) => { const t = pick(E, E.minions()); if (t) await E.dmg(t, 1, { p, kind: 'effect' }); } });
  add('scarab', { name: 'Scarab of Return', type: 'item', cost: 1, use: { cost: 0, destroy: true, target: 'none', ready: (E, p) => p.grave.length > 0 }, urun: async (E, c) => E.recoverBest(c.p),
    aiUse: (E, p) => p.grave.some(x => (C[x.id].cost || 0) >= 3) ? 5 : -1, text: 'Use: destroy this. Put the best card from your discard pile into your hand.' });
  add('waterskin', { name: 'Waterskin of the Deep Well', type: 'item', cost: 1, use: { cost: 0, destroy: true, target: 'none' }, urun: async (E, c) => E.heal(E.heroT(c.p), 6, { p: c.p }),
    aiUse: (E, p) => E.heroMax(p) - E.heroHp(p) >= 6 ? 7 : -1, text: 'Use: destroy this. Heal 6 damage from your hero.' });

  /* =================== weapons and armor =================== */
  add('sicklesword', { name: 'Sickle-Sword of the Dune Kings', type: 'weapon', wtype: 'sword', cost: 4, atk: 4, strike: 1, cls: ['warrior', 'paladin', 'rogue'], rarity: 'r', deepAtk: 1, unearth: 3,
    text: '+1 ATK while 10 or more cards are in your discard pile. Unearth 3.' });
  add('glassrecurve', { name: 'Glass Recurve', type: 'weapon', wtype: 'bow', cost: 3, atk: 3, strike: 1, kw: ['longrange'], cls: ['ranger'], rarity: 'u', tags: ['dmgRandom'],
    text: 'When your hero attacks with this, deal 1 damage to another random enemy.', onAttack: async (E, c) => { const t = pick(E, E.enemies().filter(x => !c.defender || !E.same(x, c.defender))); if (t) await E.dmg(t, 1, { p: c.p, kind: 'effect' }); } });
  add('sunstaff', { name: 'Sunpriest\'s Staff', type: 'weapon', wtype: 'staff', cost: 2, atk: 2, strike: 0, cls: ['mage', 'priest'], tags: ['heal'],
    text: 'When your hero attacks with this, heal 2 damage from your hero.', onAttack: async (E, c) => E.heal(E.heroT(c.p), 2, { p: c.p }) });
  add('sunplate', { name: 'Mirrored Sunplate', type: 'armor', slot: 'chest', atype: 'plate', cost: 4, def: 3, use: 1, cls: ['warrior', 'paladin'], rarity: 'r',
    text: 'When this blocks, deal 2 damage to the attacker.', onBlock: async (E, p, att) => { if (att && E.isAlive(att)) await E.dmg(att, 2, { p, kind: 'effect' }); } });
  add('sunveil', { name: 'Veil of the Sun-Priest', type: 'armor', slot: 'head', atype: 'cloth', cost: 3, def: 2, use: 1, cls: ['mage', 'priest'], rarity: 'u',
    text: 'When this blocks, heal 1 damage from each friendly hero.', onBlock: async (E, p) => { for (const h of E.heroes()) await E.heal(E.heroT(h), 1, { p }); } });
  add('sandwraps', { name: 'Sandwalker Wraps', type: 'armor', slot: 'feet', atype: 'leather', cost: 2, def: 1, use: 0, cls: ['rogue', 'ranger'], deepDef: 1,
    text: '+1 DEF while 10 or more cards are in your discard pile.' });

  /* =================== resource cards =================== */
  add('tenpalms', { name: 'Oasis of Ten Palms', type: 'location', cost: 0, rarity: 'r', lcost: 2,
    text: 'Play as a resource. Once per turn: pay 2 to heal 4 damage from your party\'s most wounded hero.', lready: (E, p) => !!E.mostWounded(),
    lrun: async (E, c) => { const h = E.mostWounded(); if (h) await E.heal(E.heroT(h), 4, { p: c.p }); }, aiScore: (E, p) => { const h = E.mostWounded(); return h && h.hero.damage >= 3 ? 6 : -1; } });
  add('suntemple', { name: 'The Buried Sun Temple', type: 'location', cost: 0, rarity: 'u', lcost: 3,
    text: 'Play as a resource. Once per turn: pay 3 to put the best card from your discard pile into your hand.', lready: (E, p) => p.grave.length > 0 && p.hand.length < 10,
    lrun: async (E, c) => E.recoverBest(c.p), aiScore: (E, p) => p.hand.length <= 5 ? 5 : 2 });
  add('glassdunes', { name: 'Shifting Glass Dunes', type: 'land', cost: 0, land: 'ward1',
    onLand: async (E, p) => { E.mill(p, 1); E.shield(p, 1); },
    text: 'Land. Play as a resource. When it arrives: put the top card of your deck into your discard pile, and prevent the next 1 damage to your hero.', flavor: 'Walk on the sand, not the glass.' });
  add('saltcaravan', { name: 'Lead the Salt Caravan', type: 'quest', cost: 0, rarity: 'u', qcost: 0, cond: (E, p) => p.unearthed >= 2, condText: 'you have Unearthed 2 cards',
    text: 'Play as a resource. Reward: draw 2 cards and heal 4 damage from your hero.', reward: async (E, c) => { await E.draw(c.p, 2); await E.heal(E.heroT(c.p), 4, { p: c.p }); } });
  add('zerath', { name: 'Find the Lost City of Zerath', type: 'quest', cost: 0, qcost: 0, cond: (E, p) => p.grave.length >= 10, condText: '10 or more cards are in your discard pile',
    text: 'Play as a resource. Reward: play the best card from your discard pile for free; it then leaves the game.', reward: async (E, c) => E.replayFromGrave(c.p) });


  /* ---------- art (the game's own painter, art_wild.js): gold sand, turquoise glass, white limestone, cobalt sky ---------- */
  const V = { vig: 0.36, grain: 0.22 };
  const sc = (s, L, o) => Object.assign({ s, L }, V, o || {});
  const fig = o => ['fig', o], w = o => ['w', o];
  const sand = '#d8b070', robeW = '#f4ecd8', gold = '#e8b83a';
  const ART = {
    asheera: sc('desert', [w({ t: 'serpent', x: 200, y: 222, s: 0.95, thick: 1.6 }), fig({ race: 'human', pose: 'cast', robe: 1, helm: 'crown', crownCol: '#5ae8e0', gem: '#3ac8c0', cloth: robeW, cape: 1, capeCol: gold, glowR: '#fff4b0', glowL: '#5ae8e0', x: 96, y: 214, s: 0.86 }), ['shimmer', { x: 150, y: 150 }]], { ruinsX: 40 }),
    basilisk: sc('desert', [w({ t: 'basilisk', x: 140, y: 196, s: 1.1, shadow: 80 }), w({ t: 'minion', x: 262, y: 196, s: 0.7, col: '#8a6a4a' })], { ruins: false }),
    sunpriestess: sc('tomb', [fig({ race: 'human', pose: 'cast', robe: 1, helm: 'hood', cloth: robeW, hoodCol: '#e8dcc0', x: 150, y: 214, s: 0.86, glowL: '#fff4b0', glowR: '#fff4b0' }), w({ t: 'sunDisc', x: 150, y: 52, s: 0.55 })]),
    scorpionrider: sc('desert', [w({ t: 'scorpion', x: 160, y: 206, s: 1.05, shadow: 70 }), fig({ race: 'orc', pose: 'charge', w: 'axe', cloth: '#e8d8b0', x: 164, y: 186, s: 0.52 })]),
    tombdelver: sc('tomb', [fig({ race: 'dwarf', pose: 'stand', helm: 'round', cloth: '#8a6a3a', x: 130, y: 214, s: 0.9 }), ['obj', { t: 'lantern', x: 176, y: 140, s: 0.7 }], ['glow', { x: 176, y: 140, r: 50, c: '#ffd88a', op: 0.6 }]]),
    sandcolossus: sc('desert', [w({ t: 'colossus', x: 150, y: 214, s: 0.95, shadow: 70 }), ['sandwall', { seed: 3 }]].slice(0, 1), {}),
    miragedancer: sc('desert', [['ghost', { x: 100, y: 210, op: 0.3, fig: { race: 'human', pose: 'castF', robe: 1, helm: 'hood', cloth: '#f0d8e8', s: 0.84 } }], ['ghost', { x: 200, y: 210, op: 0.3, fig: { race: 'human', pose: 'castF', robe: 1, helm: 'hood', cloth: '#f0d8e8', s: 0.84 } }], fig({ race: 'human', pose: 'castF', robe: 1, helm: 'hood', cloth: '#f0d8e8', hoodCol: '#d8a8c8', x: 150, y: 212, s: 0.88 }), ['shimmer', { x: 150, y: 120, n: 7 }]]),
    caravanguard: sc('desert', [w({ t: 'camel', x: 70, y: 186, s: 0.6, load: 1 }), w({ t: 'camel', x: 240, y: 180, s: 0.5, load: 1 }), fig({ race: 'human', pose: 'stand', w: 'polearm', off: 'round', helm: 'round', cloth: '#e8d8b0', x: 150, y: 214, s: 0.9 })]),
    glassblower: sc('tomb', [fig({ race: 'goblin', pose: 'castF', cloth: '#8a5a2a', x: 120, y: 214, s: 1.0 }), ['glow', { x: 200, y: 130, r: 46, c: '#5ae8e0', op: 0.9 }], w({ t: 'pane', x: 0, y: 0 })].slice(0, 2).concat([['pane', { x: 200, y: 136 }]])),
    serpentling: sc('desert', [w({ t: 'serpent', x: 150, y: 220, s: 0.42, c1: '#f0c070', band: '#c8303a' }), ['petals', { n: 40, x: 150, y: 150, w: 120, h: 60, cols: ['#f0c868', '#fff0c0'] }]]),
    sandstorm: sc('desert', [w({ t: 'minion', x: 90, y: 200, s: 0.8, col: '#8a6a4a' }), w({ t: 'minion', x: 200, y: 204, s: 0.9, col: '#7a5a3a' }), ['sandwall', { seed: 7 }]]),
    buriedhost: sc('desert', [90, 150, 210].map((x, i) => ['tint', { x, y: 206 + (i % 2) * 6, fig: { race: 'human', pose: i === 1 ? 'heroic' : 'stand', w: 'polearm', helm: 'great', s: 0.72 } }]).concat([['petals', { n: 50, y: 190, h: 30, cols: ['#e8c070', '#f8e0a0'] }]])),
    sunlance: sc('desert', [w({ t: 'minion', x: 150, y: 200, s: 1.0, col: '#6a4a6a' }), ['beam', { x1: 230, y1: -10, x2: 150, y2: 168 }]]),
    miragestep: sc('desert', [['ghost', { x: 96, y: 210, op: 0.35, fig: { race: 'human', pose: 'crouch', w: 'dagger', helm: 'hood', s: 0.86 } }], ['ghost', { x: 204, y: 210, op: 0.35, fig: { race: 'human', pose: 'crouch', w: 'dagger', helm: 'hood', s: 0.86 } }], fig({ race: 'human', pose: 'crouch', w: 'dagger', off: 'dagger', helm: 'hood', cloth: '#3a6a8a', x: 150, y: 210, s: 0.88 }), ['fx', { t: 'slash', x: 150, y: 120 }]]),
    scorchingnoon: sc('desert', [w({ t: 'minion', x: 80, y: 204, s: 0.8, col: '#7a5a5a' }), w({ t: 'minion', x: 220, y: 204, s: 0.9, col: '#6a4a5a' }), ['shimmer', { x: 150, y: 150, n: 8 }], ['glow', { x: 150, y: 20, r: 110, c: '#fff4c0', op: 0.9 }]], { sunX: 150, sunY: 18 }),
    siftsands: sc('desert', [w({ t: 'hands', x: 150, y: 214, s: 1.1 }), ['obj', { t: 'ring', x: 150, y: 150, s: 0.6 }], ['petals', { n: 60, x: 150, y: 190, w: 140, h: 30, cols: ['#f0c868', '#fff0c0', '#e8b050'] }]], { ruins: false }),
    oasisprayer: sc('oasis', [fig({ race: 'human', pose: 'pray', cloth: '#8a6a4a', x: 92, y: 216, s: 0.82 }), ['fx', { t: 'heal', x: 150, y: 130, c: '#9affe8' }]]),
    glassward: sc('desert', [w({ t: 'minion', x: 250, y: 200, s: 1.0, col: '#6a4a3a' }), fig({ race: 'human', pose: 'stand', w: 'sword', helm: 'round', x: 110, y: 212, s: 0.9 }), ['pane', { x: 180, y: 140 }]]),
    buriedsun: sc('desert', [w({ t: 'sunDisc', x: 150, y: 176, s: 1.3, cracked: 1 }), ['glow', { x: 150, y: 176, r: 90, c: '#fff4a0', op: 0.6 }]], { ruins: false }),
    suncirclet: sc('tomb', [['obj', { t: 'scroll', x: 150, y: 176, s: 0.9 }], w({ t: 'circlet', x: 150, y: 150, s: 1.3 })]),
    caravanledger: sc('desert', [w({ t: 'camel', x: 230, y: 190, s: 0.8 }), w({ t: 'ledger', x: 120, y: 170, s: 1.3 })]),
    sunlens: sc('desert', [w({ t: 'lens', x: 170, y: 90, s: 1.1, beamY: 90 })], { ruins: false }),
    scarab: sc('tomb', [w({ t: 'hands', x: 150, y: 220, s: 1.1 }), w({ t: 'scarab', x: 150, y: 140, s: 1.3 })]),
    waterskin: sc('oasis', [w({ t: 'waterskin', x: 150, y: 140, s: 1.4 })]),
    sicklesword: sc('tomb', [w({ t: 'sickle', x: 150, y: 140, s: 1.5 })]),
    glassrecurve: sc('desert', [w({ t: 'glassbow', x: 150, y: 110, s: 1.25, rot: 20 })]),
    sunstaff: sc('desert', [w({ t: 'sunstaff', x: 150, y: 120, s: 1.05, rot: -8 })]),
    sunplate: sc('desert', [w({ t: 'mirror', x: 130, y: 140, s: 1.5 }), ['beam', { x1: 140, y1: 120, x2: 270, y2: 170 }], w({ t: 'minion', x: 266, y: 206, s: 0.8, col: '#6a4a3a' })]),
    sunveil: sc('desert', [w({ t: 'veil', x: 140, y: 130, s: 1.3 })]),
    sandwraps: sc('desert', [w({ t: 'wraps', x: 110, y: 196, s: 1.3 }), w({ t: 'wraps', x: 190, y: 204, s: 1.3 })], { ruins: false }),
    tenpalms: sc('oasis', [w({ t: 'camel', x: 270, y: 182, s: 0.4 })]),
    suntemple: sc('desert', [w({ t: 'temple', x: 150, y: 196, s: 1.0 })], { ruins: false }),
    glassdunes: sc('desert', [['glow', { x: 220, y: 170, r: 60, c: '#bffff6', op: 0.7 }]], { ruins: false, glass: 9 }),
    saltcaravan: sc('desert', [40, 100, 160, 220, 280].map((x, i) => w({ t: 'camel', x, y: 170 + i * 3, s: 0.42, load: 1 })), { sunX: 60, sunY: 110 }),
    zerath: sc('desert', [w({ t: 'domes', x: 150, y: 170, s: 1.1 }), fig({ race: 'human', pose: 'stand', helm: 'hood', cloth: '#e8d0a0', x: 60, y: 214, s: 0.6 }), fig({ race: 'dwarf', pose: 'stand', helm: 'round', x: 96, y: 216, s: 0.6 })], { ruins: false }),
    mirage: sc('desert', [['ghost', { x: 150, y: 210, op: 0.55, fig: { race: 'human', pose: 'castF', robe: 1, helm: 'hood', cloth: '#f0d8e8', s: 0.86 } }], ['shimmer', { x: 150, y: 120, n: 7 }]]),
    sandwarrior: sc('desert', [['tint', { x: 150, y: 212, fig: { race: 'human', pose: 'stand', w: 'polearm', helm: 'great', s: 0.9 } }], ['petals', { n: 40, y: 200, h: 24, cols: ['#e8c070', '#f8e0a0'] }]]),
  };
  for (const [k, v] of Object.entries(ART)) (C[k] || TK[k]).art = v;

  /* ---------- table themes ---------- */
  Object.assign(RB.COSMETICS, {
    board_sun5: { kind: 'board', name: 'Sun-Glass Mosaic', get: 'packs:sun:5', desc: 'Turquoise and amber glass tiles set in gold around a blazing sun disc.' },
    board_asheera: { kind: 'board', name: 'Asheera\'s Rising', get: 'card:asheera', desc: 'Queen Asheera rides her sand serpent out of a glass dune at noon. The Sunscorch legendary.' },
  });
})(globalThis.RB);
