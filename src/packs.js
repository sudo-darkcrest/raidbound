/* RAIDBOUND — #47: each booster wrapper is its own card set.
   Emberfall = fire, forge and fury · Frostwing = ice, beasts and the high north · Voidshade = shadow, stars and secrets.
   The 41 original Frontier cards are sorted into the three sets, and 28 new cards are added (drawn with the layered
   SVG painter for now; they can get SpriteCook paintings later). */
(function (RB) {
  const C = RB.CARDS, TK = RB.TOKENS;
  const fig = o => ['fig', o];
  const glow = (x, y, r, c, op) => ['glow', { x, y, r, c, op: op == null ? 0.5 : op }];
  const pick = (E, a) => a.length ? a[Math.floor(E.rnd() * a.length)] : null;
  const minionsDmg = async (E, c, n, kind, cap) => { for (const t of E.aoe(E.minions(), n, cap)) await E.dmg(t, n, { p: c.p, kind: kind || 'effect' }); };

  RB.PACK_SETS = {
    ember: { name: 'Emberfall', theme: 'Fire, forge and fury', blurb: 'Orc chieftains, dwarven smiths, bombs and burning blades. Hit hard and hit everything.', col: '#ff8a3a' },
    frost: { name: 'Frostwing', theme: 'Ice, beasts and the high north', blurb: 'Gryphon riders, great bears, druids and holy wardens. Protect the party and outlast the boss.', col: '#8ad8ff' },
    void: { name: 'Voidshade', theme: 'Shadow, stars and secrets', blurb: 'Rogues, star-mages and things from the empty sky. Draw cards, strike from hiding and twist the boss\'s minions.', col: '#b98aff' },
  };

  /* ---------- sort the original Frontier cards into the three sets ---------- */
  const SORT = {
    ember: ['cinderhound', 'stonecaller', 'firebomb', 'vigorring', 'rhosk', 'axethrower', 'ravager', 'blastmonger', 'supplyraid', 'urza', 'hidejerkin', 'cleave', 'rampage', 'explosivetrap', 'holyfire', 'dawngreaves'],
    frost: ['tidescout', 'grovebinder', 'frostmoths', 'moonwell', 'greathunt', 'worldsapling', 'shieldmaiden', 'skyhammer', 'dawnbanner', 'highwatch', 'avelyn', 'thundertotem', 'spiritbeast', 'judgement', 'lightbringer', 'guardianspirit'],
    void: ['wardstone', 'sunkenrelic', 'flashpowder', 'starwarden', 'eviscerate', 'shadowcowl', 'chainlightning', 'starwellorb', 'harbormarket'],
  };
  for (const [k, ids] of Object.entries(SORT)) for (const id of ids) if (C[id]) C[id].pack = k;

  const add = (pack, id, o) => { o.id = id; o.fac = o.fac || 'neutral'; o.rarity = o.rarity || 'c'; o.set = 'frontier'; o.pack = pack; C[id] = o; };

  /* ---------- tokens ---------- */
  TK.rimewolf = { id: 'rimewolf', name: 'Rimefang Wolf', type: 'ally', atk: 2, hp: 2, kw: ['ferocity', 'protector'], race: 'Beast', art: { s: 'frost', L: [glow(150, 170, 80, '#bfeaff', 0.4), ['beast', { t: 'wolf', x: 150, y: 208, s: 1, fur: '#dfe8f4', eye: '#7ad8ff' }], ['fx', { t: 'frost', x: 150, y: 120 }]] } };
  TK.gryphlet = { id: 'gryphlet', name: 'Gryphon Hatchling', type: 'ally', atk: 2, hp: 2, kw: ['ferocity'], race: 'Beast', art: { s: 'peaks', L: [glow(150, 120, 70, '#fff0c0', 0.4), ['beast', { t: 'gryphon', x: 150, y: 170, s: 0.6 }]] } };
  TK.voidmote = { id: 'voidmote', name: 'Void Mote', atk: 0, hp: 1, ai: 'random', art: { s: 'void', L: [glow(150, 130, 70, '#b98aff', 0.7), ['obj', { t: 'shard', x: 150, y: 130, s: 0.8, col: '#b98aff' }], ['wisps', { x: 150, y: 130, w: 160, h: 90, n: 7, c: '#d0b0ff' }]] } };

  /* =================== EMBERFALL — fire, forge and fury (7 new) =================== */
  add('ember', 'emberbrute', { name: 'Emberforged Brute', type: 'ally', cost: 2, atk: 4, hp: 4, kw: ['protector'], race: 'Dwarf', tags: ['buff'], text: 'When this enters play, your hero gets +2 ATK this turn.', onEnter: async (E, c) => E.tempAtk(c.p, 2), flavor: 'Quenched his first axe in his own sweat.',
    art: { s: 'forge', p: 'embers', pn: 40, L: [glow(150, 150, 90, '#ff8a2a', 0.55), fig({ race: 'dwarf', pose: 'heroic', w: 'hammer', helm: 'horned', pauld: 'plate', wGlow: '#ff8a2a', x: 150, y: 214, s: 0.9, cloth: '#7a2a10' })] } });
  add('ember', 'magmaspitter', { name: 'Magma Spitter', type: 'ally', cost: 4, atk: 3, hp: 4, kw: ['longrange'], race: 'Elemental', rarity: 'u', text: 'At the start of your turn, deal 1 damage to a random enemy.', start: async (E, p) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 1, { p, kind: 'effect' }); }, flavor: 'Bring a bucket. Bring two.',
    art: { s: 'volcano', p: 'embers', pn: 50, L: [glow(150, 90, 80, '#ff5a1a', 0.45), ['beast', { t: 'golem', kind: 'magma', x: 150, y: 232, s: 0.95 }], ['fx', { t: 'fireball', x: 230, y: 90, c: '#ffb040', ang: -30 }]] } });
  add('ember', 'anviloath', { name: 'Oath of the Anvil', type: 'ability', speed: 'basic', cost: 1, target: 'ally', tags: ['buff'], text: 'Give an ally +2 ATK and +1 health permanently.', run: async (E, c) => E.buffAlly(c.target, 2, 1), flavor: 'Strike once for the forge, once for the clan, once for luck.',
    art: { s: 'forge', p: 'embers', pn: 30, L: [glow(150, 130, 80, '#ffb040', 0.7), ['obj', { t: 'hammer', x: 150, y: 120, s: 0.95, glow: '#ffb040' }], ['fx', { t: 'buff', x: 150, y: 170, c: '#ffb040' }], ['fx', { t: 'sparkle', x: 150, y: 110 }]] } });
  add('ember', 'redhorn', { name: 'Warhorn of the Red Steppe', type: 'item', cost: 3, fac: 'clans', rarity: 'u', tags: ['buff'], text: 'At the start of your turn, your allies get +1 ATK this turn.', start: async (E, p) => { if (p.allies.length) E.allyTempAtk(p, 1); },
    art: { s: 'steppe', L: [glow(150, 110, 90, '#ff6a3a', 0.45), ['obj', { t: 'horn', x: 150, y: 126, s: 1.15 }], ['fx', { t: 'shout', x: 210, y: 110, c: '#ffb070' }], ['obj', { t: 'banner', x: 52, y: 130, s: 0.45, col: '#7a1010', em: '#ffb070', glyph: 'axes' }]] } });
  add('ember', 'infernocleaver', { name: 'Infernal Cleaver', type: 'weapon', wtype: 'axe', cost: 3, atk: 3, strike: 1, cls: ['warrior', 'ranger'], rarity: 'r', text: 'When your hero attacks with this, deal 1 damage to each enemy minion.', onAttack: async (E, c) => { for (const t of E.aoe(E.minions(), 1)) await E.dmg(t, 1, { p: c.p, kind: 'effect' }); },
    art: { s: 'volcano', p: 'embers', pn: 40, L: [glow(150, 120, 100, '#ff4a1a', 0.7), ['obj', { t: 'axe', x: 150, y: 116, glow: '#ff6a2a' }], ['fx', { t: 'whirl', x: 150, y: 180, c: '#ff8a3a' }]] } });
  add('ember', 'flamewall', { name: 'Wall of Flame', type: 'ability', speed: 'basic', cost: 4, rarity: 'r', target: 'none', tags: ['aoeMinion', 'dmg'], dmg: 3, text: 'Deal 3 damage to each enemy minion and 1 damage to the boss.', run: async (E, c) => { await minionsDmg(E, c, 3, 'spell', 4); await E.dmg(E.bossT(), 1, { p: c.p, kind: 'spell' }); },
    art: { s: 'volcano', p: 'embers', pn: 60, L: [glow(150, 190, 130, '#ff5a1a', 0.8), ['fx', { t: 'meteors', n: 5, c: '#ff8a3a' }], ['fx', { t: 'fireball', x: 90, y: 150, c: '#ffb040', ang: 0 }], ['fx', { t: 'fireball', x: 210, y: 150, c: '#ffb040', ang: 180 }], ['fx', { t: 'fireball', x: 150, y: 120, c: '#ffd070', ang: 90 }]] } });
  add('ember', 'korrag', { name: 'Korrag the Pyre-Lord', type: 'ally', cost: 7, atk: 7, hp: 7, fac: 'clans', kw: ['unique', 'ferocity'], race: 'Orc', rarity: 'e', tags: ['aoe'], text: 'When Korrag enters play, deal 2 damage to each enemy.', onEnter: async (E, c) => { for (const t of E.aoe(E.enemies(), 2)) await E.dmg(t, 2, { p: c.p, kind: 'effect' }); },
    art: { s: 'volcano', p: 'embers', pn: 70, L: [glow(150, 110, 130, '#ff3a10', 0.6), ['fx', { t: 'meteors', n: 4, c: '#ff8a3a' }], fig({ race: 'orc', pose: 'heroic', w: 'battleaxe', helm: 'horned', pauld: 'spiked', cape: 1, capeCol: '#3a0a04', wGlow: '#ff6a1a', eye: '#ffd060', x: 150, y: 220, s: 1, cloth: '#5a1008' })] } });

  /* =================== FROSTWING — ice, beasts and the high north (7 new) =================== */
  add('frost', 'snowowl', { name: 'Snowfeather Owl', type: 'ally', cost: 1, atk: 1, hp: 1, race: 'Beast', tags: ['draw'], text: 'When this ally is destroyed, draw a card.', onDeath: async (E, c) => E.draw(c.p, 1), flavor: 'It sees the storm coming and tells no one.',
    art: { s: 'frost', L: [glow(160, 100, 70, '#e8f6ff', 0.55), ['beast', { t: 'bird', x: 150, y: 140, s: 0.7, eye: '#ffd060' }], ['fx', { t: 'sparkle', x: 150, y: 90, n: 8 }]] } });
  add('frost', 'glacierbear', { name: 'Glacier Bear', type: 'ally', cost: 4, atk: 3, hp: 6, kw: ['protector'], race: 'Beast', flavor: 'Hibernates for nine months. Grumpy for the other three.',
    art: { s: 'frost', L: [glow(150, 150, 100, '#bfeaff', 0.4), ['beast', { t: 'bear', x: 150, y: 210, s: 1.1, shadow: 80 }], ['fx', { t: 'sparkle', x: 150, y: 90, n: 10 }]] } });
  add('frost', 'rimefang', { name: 'Call of the Rimefang', type: 'ability', speed: 'basic', cost: 3, rarity: 'u', target: 'none', tags: ['summon'], text: 'Summon two 2/2 Rimefang Wolves with Swift and Bulwark.', run: async (E, c) => E.summonAlly(c.p, 'rimewolf', 2),
    art: { s: 'frost', L: [glow(150, 90, 70, '#e8f6ff', 0.5), ['beast', { t: 'wolf', x: 100, y: 206, s: 0.8, fur: '#dfe8f4', eye: '#7ad8ff' }], ['beast', { t: 'wolf', x: 206, y: 214, s: 0.9, fur: '#c8d4e4', eye: '#7ad8ff' }], ['fx', { t: 'frost', x: 150, y: 100 }]] } });
  add('frost', 'wintershard', { name: 'Shard of Winter', type: 'ability', speed: 'basic', cost: 2, target: 'minion', tags: ['dmg', 'stun'], dmg: 3, text: 'Deal 3 damage to an enemy minion and stun it.', run: async (E, c) => { await E.dmg(c.target, 3, { p: c.p, kind: 'spell' }); if (E.isAlive(c.target)) E.stun(c.target); },
    art: { s: 'frost', L: [glow(150, 120, 90, '#9ae8ff', 0.7), ['obj', { t: 'shard', x: 150, y: 116, s: 1.1, col: '#9ae8ff' }], ['fx', { t: 'frost', x: 150, y: 120 }]] } });
  add('frost', 'aurora', { name: 'Aurora Blessing', type: 'ability', speed: 'basic', cost: 3, rarity: 'u', target: 'none', tags: ['healAll', 'heal'], text: 'Heal 4 damage from each friendly hero.', run: async (E, c) => { for (const h of E.heroes()) await E.heal(E.heroT(h), 4); }, flavor: 'The sky remembers every hero who ever looked up.',
    art: { s: 'frost', pal: { light: '#b8ffe0' }, L: [['wisps', { x: 150, y: 70, w: 300, h: 70, n: 12, c: '#9affd0' }], glow(150, 80, 140, '#9affd0', 0.35), ['fx', { t: 'heal', x: 150, y: 120, c: '#b8ffe0' }], fig({ pose: 'pray', robe: 1, helm: 'hood', x: 150, y: 212, s: 0.7, cloth: '#e8f0f8' })] } });
  add('frost', 'gryphonroost', { name: 'Skyreach Gryphon Roost', type: 'location', cost: 0, fac: 'concord', rarity: 'r', lcost: 4, text: 'Play as a resource. Once per turn: pay 4 to summon a 2/2 Gryphon Hatchling with Swift.', lrun: async (E, c) => E.summonAlly(c.p, 'gryphlet', 1),
    art: { s: 'peaks', L: [glow(150, 110, 110, '#fff0c0', 0.4), ['beast', { t: 'gryphon', x: 170, y: 150, s: 0.75 }], ['beast', { t: 'gryphon', x: 70, y: 196, s: 0.38 }], ['obj', { t: 'banner', x: 250, y: 140, s: 0.45, col: '#2c50a6', em: '#ffd060' }]] } });
  add('frost', 'ysolde', { name: 'Ysolde, Frostwing Queen', type: 'ally', cost: 7, atk: 5, hp: 7, kw: ['unique', 'protector'], race: 'Elf', rarity: 'e', tags: ['stunAll', 'shield'], text: 'When Ysolde enters play, stun each enemy minion and prevent the next 4 damage to each friendly hero.', onEnter: async (E, c) => { for (const t of E.aoe(E.minions(), 0)) E.stun(t); for (const h of E.heroes()) E.shield(h, 4); },
    art: { s: 'frost', L: [glow(150, 100, 130, '#bfeaff', 0.6), ['beast', { t: 'gryphon', x: 236, y: 120, s: 0.5 }], ['fx', { t: 'frost', x: 150, y: 90 }], fig({ race: 'elf', pose: 'staff', w: 'staff', robe: 1, helm: 'crown', crownCol: '#bfeaff', gem: '#7ad8ff', glowL: '#bfeaff', cape: 1, capeCol: '#2a4a7a', x: 140, y: 216, s: 0.95, cloth: '#e8f0ff', hairCol: '#f4f8ff' })] } });

  /* =================== VOIDSHADE — shadow, stars and secrets (14 new) =================== */
  add('void', 'voidacolyte', { name: 'Voidtouched Acolyte', type: 'ally', cost: 1, atk: 3, hp: 4, race: 'Human', tags: ['dmgRandom'], text: 'When this enters play, deal 1 damage to a random enemy.', onEnter: async (E, c) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 1, { p: c.p, kind: 'effect' }); }, flavor: 'He stared into the dark. Now it keeps him company.',
    art: { s: 'void', L: [glow(150, 120, 80, '#b98aff', 0.55), fig({ pose: 'cast', robe: 1, helm: 'hood', glowR: '#c8a0ff', glowL: '#c8a0ff', x: 150, y: 214, s: 0.86, cloth: '#2a1a4a', hoodCol: '#1a1030' })] } });
  add('void', 'duskshade', { name: 'Shade of the Dusk Court', type: 'ally', cost: 3, atk: 3, hp: 2, kw: ['elusive', 'ferocity', 'protector'], race: 'Spirit', rarity: 'u', flavor: 'You never see it arrive. You only notice it never left.',
    art: { s: 'rooftops', L: [glow(220, 70, 50, '#e0d0ff', 0.5), ['fx', { t: 'shadow', x: 150, y: 150 }], fig({ pose: 'crouch', w: 'dagger', off: 'dagger', helm: 'hood', spectral: 1, wGlow: '#c8a0ff', x: 150, y: 212, s: 0.95 })] } });
  add('void', 'starseer', { name: 'Starseer Oracle', type: 'ally', cost: 2, atk: 2, hp: 6, race: 'Elf', rarity: 'u', tags: ['draw'], text: 'At the start of your turn, if you have 3 or fewer cards in hand, draw a card.', start: async (E, p) => { if (p.hand.length <= 3) await E.draw(p, 1); },
    art: { s: 'arcane', L: [glow(150, 80, 90, '#d0c0ff', 0.6), ['fx', { t: 'sparkle', x: 150, y: 70, n: 14 }], fig({ race: 'elf', pose: 'staff', w: 'staff', robe: 1, helm: 'hair', glowL: '#d0c0ff', x: 150, y: 214, s: 0.86, cloth: '#3a2a7a', hairCol: '#e8e0ff' })] } });
  add('void', 'nullorb', { name: 'The Null Orb', type: 'item', cost: 3, rarity: 'r', text: 'At the start of your turn, deal 1 damage to the boss.', start: async (E, p) => E.dmg(E.bossT(), 1, { p, kind: 'effect' }), flavor: 'A hole in the world you can hold in your hand.',
    art: { s: 'void', L: [glow(150, 120, 100, '#7a4aff', 0.6), ['fx', { t: 'shadow', x: 150, y: 130 }], ['obj', { t: 'shard', x: 150, y: 120, s: 1.2, col: '#8a5aff' }], ['fx', { t: 'runes', x: 150, y: 120, r: 80, c: '#b98aff' }], ['wisps', { x: 150, y: 120, w: 220, h: 110, n: 8, c: '#d0b0ff' }]] } });
  add('void', 'voidbolt', { name: 'Void Bolt', type: 'ability', speed: 'basic', cost: 1, target: 'enemy', tags: ['dmg'], dmg: 2, text: 'Deal 2 damage to an enemy.', run: async (E, c) => E.dmg(c.target, 2, { p: c.p, kind: 'spell' }),
    art: { s: 'void', L: [glow(170, 110, 90, '#9a6aff', 0.7), ['fx', { t: 'fireball', x: 180, y: 110, c: '#b98aff', ang: 20 }], ['fx', { t: 'shadow', x: 110, y: 170 }]] } });
  add('void', 'mindrend', { name: 'Mind Rend', type: 'ability', speed: 'basic', cost: 3, rarity: 'u', target: 'enemy', tags: ['dmg', 'stun'], dmg: 4, text: 'Deal 4 damage to an enemy. If it is a minion and survives, stun it.', run: async (E, c) => { await E.dmg(c.target, 4, { p: c.p, kind: 'spell' }); if (c.target.t === 'minion' && E.isAlive(c.target)) E.stun(c.target); },
    art: { s: 'void', L: [glow(150, 110, 100, '#c87aff', 0.6), ['fx', { t: 'skull', x: 150, y: 110 }], ['fx', { t: 'runes', x: 150, y: 120, r: 70, c: '#e0a0ff' }]] } });
  add('void', 'shadowstep', { name: 'Shadowstep', type: 'ability', speed: 'instant', react: 'hero', cost: 1, cls: ['rogue'], target: 'none', tags: ['elusive', 'draw'], text: 'Your hero becomes Shrouded until your next turn. Draw a card.', run: async (E, c) => { E.elusive(c.p); await E.draw(c.p, 1); },
    art: { s: 'rooftops', L: [glow(230, 60, 40, '#e8e0ff', 0.5), ['fx', { t: 'shadow', x: 110, y: 160 }], ['fx', { t: 'shadow', x: 200, y: 150 }], fig({ pose: 'crouch', w: 'dagger', helm: 'hood', cape: 1, capeCol: '#120c20', x: 180, y: 212, s: 0.9, cloth: '#1a1428' })] } });
  add('void', 'hollowpact', { name: 'Pact of the Hollow Star', type: 'ability', speed: 'basic', cost: 0, rarity: 'r', target: 'none', tags: ['draw'], text: 'Your hero takes 2 damage. Draw 2 cards.', run: async (E, c) => { await E.dmg(E.heroT(c.p), 2, { kind: 'effect' }); if (!c.p.hero.dead) await E.draw(c.p, 2); }, flavor: 'Every star you wish on is listening. Some of them answer.',
    art: { s: 'void', L: [glow(150, 90, 110, '#7a4aff', 0.55), ['obj', { t: 'heart', x: 150, y: 130, s: 1 }], ['fx', { t: 'sparkle', x: 150, y: 70, n: 12 }], ['fx', { t: 'runes', x: 150, y: 130, r: 76, c: '#d0b0ff' }]] } });
  add('void', 'nightglass', { name: 'Nightglass Dagger', type: 'weapon', wtype: 'dagger', cost: 2, atk: 2, strike: 0, cls: ['rogue', 'mage'], rarity: 'u', text: 'When your hero attacks with this, deal 1 damage to a random enemy.', onAttack: async (E, c) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 1, { p: c.p, kind: 'effect' }); },
    art: { s: 'void', L: [glow(150, 110, 80, '#b98aff', 0.6), ['obj', { t: 'daggers', x: 150, y: 116, glow: '#b98aff' }], ['fx', { t: 'sparkle', x: 150, y: 100, n: 8 }]] } });
  add('void', 'emptyrobes', { name: 'Robes of the Empty Sky', type: 'armor', slot: 'chest', atype: 'cloth', cost: 2, def: 1, use: 0, spell: 1, cls: ['mage', 'priest'], rarity: 'u', text: 'Your spells and powers deal +1 damage.',
    art: { s: 'arcane', L: [glow(150, 120, 80, '#b98aff', 0.5), ['obj', { t: 'robe', x: 150, y: 116, col: '#2a1a5a' }], ['fx', { t: 'sparkle', x: 150, y: 100, n: 10 }]] } });
  add('void', 'umbralwatcher', { name: 'Umbral Watcher', type: 'ally', cost: 5, atk: 4, hp: 5, kw: ['protector'], race: 'Spirit', flavor: 'It has stood at the gate for a thousand years. It has questions.',
    art: { s: 'crypt', L: [glow(150, 110, 90, '#9a7aff', 0.5), fig({ race: 'skeleton', pose: 'stand', w: 'polearm', off: 'tower', helm: 'great', spectral: 1, x: 150, y: 216, s: 0.92 })] } });
  add('void', 'starlessrift', { name: 'The Starless Rift', type: 'location', cost: 0, rarity: 'r', lcost: 2, text: 'Play as a resource. Once per turn: pay 2 to deal 2 damage to a random enemy.', lrun: async (E, c) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 2, { p: c.p, kind: 'effect' }); },
    art: { s: 'void', L: [glow(150, 110, 120, '#5a2aff', 0.6), ['fx', { t: 'runes', x: 150, y: 110, r: 100, c: '#9a7aff' }], ['wisps', { x: 150, y: 110, w: 260, h: 120, n: 10, c: '#b98aff' }]] } });
  add('void', 'codex', { name: 'Read the Forbidden Codex', type: 'quest', cost: 0, qcost: 2, text: 'Play as a resource. Complete (pay 2): draw 2 cards.', reward: async (E, c) => E.draw(c.p, 2),
    art: { s: 'arcane', L: [glow(150, 120, 90, '#c8a0ff', 0.6), ['obj', { t: 'tome', x: 150, y: 126, s: 1.1 }], ['fx', { t: 'runes', x: 150, y: 120, r: 70, c: '#d0b0ff' }]] } });
  add('void', 'noctyra', { name: 'Noctyra, the Void Empress', type: 'ally', cost: 7, atk: 6, hp: 6, kw: ['unique', 'longrange'], race: 'Elf', rarity: 'e', tags: ['removal'], text: 'When Noctyra enters play, turn the strongest enemy minion into a 0/1 Void Mote. At the start of your turn, deal 1 damage to each enemy.', onEnter: async (E, c) => { const ms = E.minions(); if (ms.length) await E.transform(ms.reduce((a, b) => E.atkOf(b) > E.atkOf(a) ? b : a), 'voidmote'); }, start: async (E, p) => { for (const t of E.aoe(E.enemies(), 1)) await E.dmg(t, 1, { p, kind: 'effect' }); },
    art: { s: 'void', L: [glow(150, 100, 140, '#7a3aff', 0.6), ['wisps', { x: 150, y: 110, w: 280, h: 120, n: 12, c: '#d0b0ff' }], fig({ race: 'elf', pose: 'cast', robe: 1, helm: 'crown', crownCol: '#c8a0ff', gem: '#e0b0ff', glowL: '#c8a0ff', glowR: '#c8a0ff', cape: 1, capeCol: '#120a24', x: 150, y: 218, s: 1, cloth: '#2a1050', hairCol: '#e8e0ff' })] } });

  RB.FRONTIER = Object.values(C).filter(d => d.set === 'frontier').map(d => d.id);
  // Raidbound Core pack (Nov 8, 2026): the core set, cheaper than the themed boosters. Ascended (Master Hero) cards are
  // never in packs: each hero brings their own when you can play them (see U.syncStarters).
  RB.PACK_SETS.core = { name: 'Raidbound Core', short: 'Core', theme: 'The heart of every deck', blurb: 'Soldiers, spells, gear and quests for every class. The cards your starter decks are built from, and more of them.', col: '#f0d48a' };
  RB.CORE_PACK_PRICE = 75;
  // #95: Core packs come in 5, 10 and 20 cards (the 20 is a small bulk discount). Themed boosters are always 5.
  RB.CORE_SIZES = [[5, 75], [10, 150], [20, 300]]; // #161: the 20-card pack is the Grand Core booster (300 gold, 5 Grand Core cards inside)
  RB.packPrice = (style, size) => style === 'core' ? ((RB.CORE_SIZES.find(s => s[0] === (size || 5)) || RB.CORE_SIZES[0])[1]) : RB.PACK_PRICE;
  RB.CORE_POOL = () => Object.values(C).filter(d => d.set === 'core' && d.type !== 'master' && d.type !== 'land'); // #125: lands are free to everyone, so never in packs, the shop or the Workshop
  RB.packPool = style => style === 'core' ? RB.CORE_POOL() : Object.values(C).filter(d => d.set === 'frontier' && d.pack === style);
  RB.BOOSTER_SETS = ['ember', 'frost', 'void'];

  // five core cards: one uncommon or better, then mostly commons (a 10 or 20-card pack is that roll 2 or 4 times)
  RB.rollCore = (rand, size) => {
    rand = rand || Math.random; size = [5, 10, 20].includes(size) ? size : 5;
    const pool = RB.CORE_POOL(), pk = a => a[Math.floor(rand() * a.length)];
    const of = r => pk(pool.filter(d => d.rarity === r)).id;
    const out = [];
    for (let k = 0; k < size / 5; k++) {
      out.push({ id: of(rand() < 0.3 ? 'r' : 'u'), holo: rand() < 0.15 });
      out.push({ id: of((x => x < 0.04 ? 'r' : x < 0.38 ? 'u' : 'c')(rand())), holo: rand() < 0.08 });
      for (let i = 0; i < 3; i++) out.push({ id: of((x => x < 0.03 ? 'r' : x < 0.22 ? 'u' : 'c')(rand())), holo: rand() < 0.06 });
    }
    // #161 Grand Core booster: five of the 20 cards (the mostly-common slots) are Grand Core cards
    if (size === 20 && RB.GRAND_CORE && RB.GRAND_CORE().length) for (const i of [4, 9, 14, 18, 19]) out[i] = RB.rollGrandCore(rand);
    out.style = 'core'; out.size = size;
    return out;
  };

  // #161 one Grand Core card: about 45% uncommon, 40% rare, 12% epic, 3% legendary
  RB.rollGrandCore = rand => {
    rand = rand || Math.random;
    const pool = RB.GRAND_CORE(), x = rand(), want = x < 0.03 ? 'l' : x < 0.15 ? 'e' : x < 0.55 ? 'r' : 'u';
    let l = pool.filter(d => d.rarity === want); if (!l.length) l = pool;
    return { id: l[Math.floor(rand() * l.length)].id, holo: rand() < 0.25, gc: true };
  };
  /* ---------- booster roll: five cards, mostly from the wrapper's own set ---------- */
  RB.rollBooster = (rand, style, size) => {
    rand = rand || Math.random;
    if (style === 'core') return RB.rollCore(rand, size);
    if (!RB.BOOSTER_SETS.includes(style)) style = RB.BOOSTER_SETS[Math.floor(rand() * RB.BOOSTER_SETS.length)];
    const pk = a => a[Math.floor(rand() * a.length)];
    const own = RB.packPool(style), core = RB.CORE_POOL();
    const byR = (list, r) => list.filter(d => d.rarity === r);
    const rarity = () => { const x = rand(); return x < 0.006 ? 'l' : x < 0.066 ? 'e' : x < 0.24 ? 'r' : x < 0.55 ? 'u' : 'c'; };
    const from = (list, r) => { let l = byR(list, r); while (!l.length) { r = { l: 'e', e: 'r', r: 'u', u: 'c', c: 'c' }[r]; l = byR(list, r); if (r === 'c' && !l.length) l = list; } return pk(l); };
    const out = [];
    // three guaranteed cards from this wrapper's set, one uncommon or better
    out.push({ id: from(own, (() => { const r = rarity(); return r === 'c' ? 'u' : r; })()).id, holo: rand() < 0.2 });
    out.push({ id: from(own, rarity()).id, holo: rand() < 0.1 });
    out.push({ id: from(own, rarity()).id, holo: rand() < 0.1 });
    // the last two: usually the set again, sometimes a regular card
    for (let i = 0; i < 2; i++) out.push({ id: from(rand() < 0.7 ? own : core, rarity()).id, holo: rand() < 0.08 });
    out.style = style;
    return out;
  };
})(globalThis.RB);
