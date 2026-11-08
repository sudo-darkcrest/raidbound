/* RAIDBOUND — +2 cards for each booster set (35 each) and +11 treasure cards for each raid (14 each).
   Art is drawn with the layered SVG painter for now (no SpriteCook). */
(function (RB) {
  const C = RB.CARDS, TK = RB.TOKENS;
  const fig = o => ['fig', o];
  const glow = (x, y, r, c, op) => ['glow', { x, y, r, c, op: op == null ? 0.5 : op }];
  const pick = (E, a) => a.length ? a[Math.floor(E.rnd() * a.length)] : null;
  const minionsDmg = async (E, c, n, kind) => { for (const t of E.minions()) await E.dmg(t, n, { p: c.p, kind: kind || 'effect' }); };
  const myAllies = (E, p) => E.allAllies().filter(t => t.p === p);
  const addP = (pack, id, o) => { o.id = id; o.fac = o.fac || 'neutral'; o.rarity = o.rarity || 'c'; o.set = 'frontier'; o.pack = pack; C[id] = o; };
  const addT = (raid, id, o) => { o.id = id; o.fac = o.fac || 'neutral'; o.rarity = o.rarity || 'r'; o.set = raid; C[id] = o; RB.RAIDS[raid].treasure.push(id); };

  TK.boneservant = { id: 'boneservant', name: 'Bone Servant', type: 'ally', atk: 2, hp: 1, race: 'Undead', art: { s: 'crypt', L: [fig({ race: 'skeleton', pose: 'stand', w: 'sword', off: 'round', x: 150, y: 210, s: 0.9, eye: '#9affd0' })] } };
  TK.whelpling = { id: 'whelpling', name: 'Ember Whelpling', type: 'ally', atk: 2, hp: 3, kw: ['ferocity', 'protector'], race: 'Dragonkin', art: { s: 'volcano', L: [glow(150, 150, 70, '#ff8a2a', 0.5), ['dragon', { x: 150, y: 150, s: 0.5, eye: '#ffe27a' }]] } };

  /* ======================= booster sets: +2 each ======================= */
  addP('ember', 'rakka', { name: 'Scorchmother Rakka', type: 'ally', cost: 6, atk: 5, hp: 5, kw: ['protector'], fac: 'clans', race: 'Orc', rarity: 'r', tags: ['buff'], text: 'When Rakka enters play, each of your other allies gets +1 ATK and +1 health permanently.', onEnter: async (E, c) => { for (const t of myAllies(E, c.p)) if (t.a.id !== 'rakka') E.buffAlly(t, 1, 1); },
    art: { s: 'steppe', p: 'embers', pn: 40, L: [glow(150, 110, 110, '#ff6a2a', 0.5), fig({ race: 'orc', pose: 'heroic', w: 'axe', off: 'axe', helm: 'mohawk', pauld: 'spiked', cape: 1, capeCol: '#4a0a04', wGlow: '#ff8a3a', x: 150, y: 214, s: 0.95, cloth: '#7a1a10' })] } });
  addP('ember', 'forgeimp', { name: 'Forge Imp', type: 'ally', cost: 1, atk: 1, hp: 1, kw: ['ferocity', 'protector'], race: 'Imp', tags: ['dmgRandom'], text: 'When this ally is destroyed, deal 1 damage to a random enemy.', onDeath: async (E, c) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 1, { p: c.p, kind: 'effect' }); }, flavor: 'Small, hot and spiteful.',
    art: { s: 'forge', p: 'embers', pn: 40, L: [glow(150, 160, 70, '#ff6a1a', 0.6), fig({ race: 'goblin', pose: 'crouch', w: 'dagger', x: 150, y: 212, s: 1.05, eye: '#ffd060', cloth: '#7a1a08' })] } });
  addP('frost', 'snowsentinel', { name: 'Snowdrift Sentinel', type: 'ally', cost: 3, atk: 1, hp: 6, kw: ['protector'], race: 'Human', flavor: 'He has stood watch so long the snow thinks he is a tree.',
    art: { s: 'frost', L: [glow(150, 130, 80, '#e8f6ff', 0.4), fig({ pose: 'stand', w: 'polearm', off: 'tower', helm: 'great', pauld: 'fur', cape: 1, capeCol: '#3a4a6a', x: 150, y: 214, s: 0.9, cloth: '#3a5a8a' })] } });
  addP('frost', 'icetome', { name: 'Icebound Tome', type: 'item', cost: 3, rarity: 'u', spell: 1, tags: ['shield'], text: 'Your spells and powers deal +1 damage. At the start of your turn, prevent the next 1 damage to your hero.', start: async (E, p) => E.shield(p, 1),
    art: { s: 'frost', L: [glow(150, 120, 90, '#9ae8ff', 0.6), ['obj', { t: 'tome', x: 150, y: 124, s: 1.1 }], ['fx', { t: 'frost', x: 150, y: 110 }]] } });
  addP('void', 'starwanderer', { name: 'Starlit Wanderer', type: 'ally', cost: 1, atk: 2, hp: 3, race: 'Elf', tags: ['draw'], text: 'When this ally is destroyed, draw a card.', onDeath: async (E, c) => E.draw(c.p, 1),
    art: { s: 'arcane', L: [glow(150, 80, 80, '#d0c0ff', 0.5), ['fx', { t: 'sparkle', x: 150, y: 70, n: 12 }], fig({ race: 'elf', pose: 'stand', w: 'staff', helm: 'hood', cape: 1, capeCol: '#1a1440', x: 150, y: 214, s: 0.86, cloth: '#3a2a7a' })] } });
  addP('void', 'veilofnight', { name: 'Veil of Night', type: 'ability', speed: 'instant', cost: 2, rarity: 'u', target: 'none', tags: ['elusive', 'shield'], text: 'Your hero becomes Elusive until your next turn. Prevent the next 2 damage to your hero.', run: async (E, c) => { E.elusive(c.p); E.shield(c.p, 2); },
    art: { s: 'void', L: [glow(150, 100, 100, '#6a3aff', 0.5), ['fx', { t: 'shadow', x: 150, y: 150 }], ['wisps', { x: 150, y: 120, w: 260, h: 120, n: 10, c: '#b98aff' }]] } });

  /* ======================= Crypt of the Hollow King: +11 treasure ======================= */
  const crypt = (id, o) => addT('crypt', id, o);
  crypt('lichbane', { name: 'Lichbane', type: 'weapon', wtype: 'sword', cost: 3, atk: 4, strike: 1, cls: ['paladin', 'warrior', 'rogue'], text: 'When your hero attacks with this, heal 2 damage from each friendly hero.', onAttack: async (E, c) => { for (const h of E.heroes()) await E.heal(E.heroT(h), 2); },
    art: { s: 'crypthall', L: [glow(150, 100, 80, '#fff6c0', 0.6), ['obj', { t: 'sword', x: 150, y: 100, s: 0.95, glow: '#fff6c0', gem: '#4aff9a' }]] } });
  crypt('gravewardplate', { name: 'Graveward Plate', type: 'armor', slot: 'chest', atype: 'plate', cost: 4, def: 3, use: 1, heroAtk: 1, text: 'Your hero has +1 ATK.',
    art: { s: 'crypt', L: [glow(150, 120, 80, '#4aff9a', 0.4), ['obj', { t: 'breastplate', x: 150, y: 116 }]] } });
  crypt('necromancer', { name: 'Repentant Necromancer', type: 'ally', cost: 3, atk: 4, hp: 5, kw: ['protector'], race: 'Human', tags: ['summon'], text: 'When this enters play, summon a 2/1 Bone Servant.', onEnter: async (E, c) => E.summonAlly(c.p, 'boneservant', 1), flavor: 'He raises the dead for the right side now.',
    art: { s: 'crypt', L: [glow(150, 120, 80, '#4aff9a', 0.5), fig({ pose: 'cast', robe: 1, helm: 'hood', glowL: '#7affb0', glowR: '#7affb0', x: 120, y: 214, s: 0.86, cloth: '#1a3a2a' }), fig({ race: 'skeleton', pose: 'stand', w: 'sword', x: 230, y: 214, s: 0.6 })] } });
  crypt('soullantern', { name: 'Soulflame Lantern', type: 'item', cost: 2, tags: ['heal'], text: 'At the start of your turn, heal 1 damage from each friendly hero and ally.', start: async (E, p) => { for (const t of E.friendlyChars()) await E.heal(t, 1); },
    art: { s: 'crypthall', L: [glow(150, 120, 80, '#4aff9a', 0.7), ['obj', { t: 'lantern', x: 150, y: 120, s: 1.1 }]] } });
  crypt('hollowtomb', { name: 'Unseal the Hollow Tomb', type: 'quest', cost: 0, qcost: 2, text: 'Play as a resource. Complete (pay 2): draw 2 cards and prevent the next 3 damage to your hero.', reward: async (E, c) => { await E.draw(c.p, 2); E.shield(c.p, 3); },
    art: { s: 'crypt', L: [glow(150, 150, 80, '#4aff9a', 0.5), ['obj', { t: 'chest', x: 150, y: 170, s: 0.9 }], ['fx', { t: 'skull', x: 150, y: 90, s: 0.6 }]] } });
  crypt('mortimer', { name: 'Ser Mortimer, the Unbowed', type: 'ally', cost: 6, atk: 5, hp: 6, kw: ['unique', 'protector'], race: 'Undead', rarity: 'e', tags: ['shield'], text: 'A death knight who broke his chains. When he enters play, prevent the next 5 damage to your hero.', onEnter: async (E, c) => E.shield(c.p, 5),
    art: { s: 'crypthall', L: [glow(150, 110, 110, '#4aff9a', 0.5), fig({ race: 'skeleton', pose: 'heroic', w: 'greatsword', helm: 'great', pauld: 'spiked', cape: 1, capeCol: '#0a1a14', wGlow: '#7affb0', eye: '#7affb0', x: 150, y: 220, s: 1, metal: '#4a5048', trim: '#7affb0' })] } });
  crypt('gravegloves', { name: 'Gravedigger\'s Gloves', type: 'armor', slot: 'hands', atype: 'leather', cost: 2, def: 1, use: 0, heroAtk: 1, text: 'Your hero has +1 ATK.',
    art: { s: 'crypt', L: [glow(150, 120, 70, '#9affd0', 0.4), ['obj', { t: 'gauntlet', x: 150, y: 116 }]] } });
  crypt('hollowtome', { name: 'Tome of the Hollow King', type: 'item', cost: 3, rarity: 'e', spell: 1, tags: ['draw'], text: 'Your spells and powers deal +1 damage. At the start of your turn, if you have 2 or fewer cards in hand, draw a card.', start: async (E, p) => { if (p.hand.length <= 2) await E.draw(p, 1); },
    art: { s: 'crypthall', L: [glow(150, 120, 90, '#4aff9a', 0.6), ['obj', { t: 'tome', x: 150, y: 124, s: 1.15 }], ['fx', { t: 'runes', x: 150, y: 124, r: 80, c: '#7affb0' }]] } });
  crypt('soulharvest', { name: 'Soul Harvest', type: 'ability', speed: 'basic', cost: 3, rarity: 'e', target: 'none', tags: ['aoeMinion', 'heal'], dmg: 2, text: 'Deal 2 damage to each enemy minion. Heal 2 damage from your hero for each minion destroyed.', run: async (E, c) => { const before = E.minions().length; await minionsDmg(E, c, 2, 'spell'); const k = before - E.minions().length; if (k > 0) await E.heal(E.heroT(c.p), 2 * k); },
    art: { s: 'crypthall', L: [['wisps', { x: 150, y: 120, w: 260, h: 120, n: 14, c: '#7affb0' }], ['fx', { t: 'whirl', x: 150, y: 150, c: '#4aff9a' }], ['fx', { t: 'skull', x: 150, y: 110, s: 0.6 }]] } });
  crypt('bonedrake', { name: 'Bone Drake Hatchling', type: 'ally', cost: 4, atk: 4, hp: 5, kw: ['ferocity', 'longrange'], race: 'Undead',
    art: { s: 'crypthall', L: [glow(150, 140, 80, '#4aff9a', 0.4), ['dragon', { x: 150, y: 150, s: 0.6, tone: '#d8d0b8', belly: '#a89878', eye: '#7affb0' }]] } });
  crypt('emptythrone', { name: 'The Empty Bone Throne', type: 'location', cost: 0, lcost: 2, text: 'Play as a resource. Once per turn: pay 2 to return an ally from your discard pile to your hand.', lrun: async (E, c) => E.recoverAlly(c.p),
    art: { s: 'crypthall', L: [glow(150, 140, 90, '#4aff9a', 0.4), ['obj', { t: 'crown', x: 150, y: 120, dark: 1 }], ['fx', { t: 'skull', x: 90, y: 180, s: 0.5 }], ['fx', { t: 'skull', x: 210, y: 180, s: 0.5 }]] } });

  /* ======================= The Molten Spire: +11 treasure ======================= */
  const molten = (id, o) => addT('molten', id, o);
  molten('scaleshield', { name: 'Vorthrax Scale Shield', type: 'armor', slot: 'shield', atype: 'shield', cost: 3, def: 3, use: 1, cls: ['warrior', 'paladin'], rarity: 'e',
    art: { s: 'volcano', L: [glow(150, 120, 80, '#ff6a1a', 0.5), ['obj', { t: 'shieldItem', x: 150, y: 118, s: 0.95 }]] } });
  molten('emberhelm', { name: 'Emberwing Helm', type: 'armor', slot: 'head', atype: 'plate', cost: 2, def: 2, use: 1,
    art: { s: 'volcano', L: [glow(150, 120, 70, '#ff8a2a', 0.5), ['obj', { t: 'helm', x: 150, y: 118 }]] } });
  molten('wyrmbow', { name: 'Wyrmbone Longbow', type: 'weapon', wtype: 'bow', cost: 3, atk: 4, strike: 1, kw: ['longrange'], cls: ['ranger'], rarity: 'e',
    art: { s: 'volcano', L: [glow(150, 110, 80, '#ff8a2a', 0.6), ['obj', { t: 'bowItem', x: 150, y: 116, glow: '#ff8a2a' }]] } });
  molten('cindersage', { name: 'Staff of the Cinder Sage', type: 'weapon', wtype: 'staff', cost: 3, atk: 3, strike: 1, spell: 1, cls: ['mage', 'priest'], text: 'Your spells and powers deal +1 damage.',
    art: { s: 'volcano', L: [glow(150, 100, 80, '#ff8a2a', 0.65), ['obj', { t: 'staffItem', x: 150, y: 116, glow: '#ffb040' }], ['fx', { t: 'fireball', x: 150, y: 70, c: '#ffb040', ang: 90 }]] } });
  molten('wyrmrider', { name: 'Wyrmrider Outcast', type: 'ally', cost: 5, atk: 4, hp: 4, kw: ['ferocity', 'longrange'], race: 'Orc',
    art: { s: 'volcano', L: [['dragon', { x: 160, y: 160, s: 0.75 }], fig({ race: 'orc', pose: 'heroic', w: 'polearm', helm: 'mohawk', x: 150, y: 118, s: 0.5 })] } });
  molten('moltencore', { name: 'Molten Core', type: 'item', cost: 4, rarity: 'e', tags: ['aoeMinion'], text: 'At the start of your turn, deal 2 damage to each enemy minion.', start: async (E, p) => { for (const t of E.minions()) await E.dmg(t, 2, { p, kind: 'effect' }); },
    art: { s: 'volcano', p: 'embers', pn: 60, L: [glow(150, 120, 100, '#ff4a1a', 0.8), ['fx', { t: 'whirl', x: 150, y: 150, c: '#ff8a2a' }], ['obj', { t: 'shard', x: 150, y: 118, s: 1.2, col: '#ff5a1a' }], ['fx', { t: 'sparkle', x: 150, y: 110, n: 10 }]] } });
  molten('dragonhoard', { name: 'Plunder the Dragon\'s Hoard', type: 'quest', cost: 0, qcost: 3, tags: ['ramp'], text: 'Play as a resource. Complete (pay 3): draw 2 cards and gain 2 extra resources this turn.', reward: async (E, c) => { await E.draw(c.p, 2); E.gainRes(c.p, 2); },
    art: { s: 'volcano', L: [glow(150, 160, 100, '#ffd060', 0.55), ['obj', { t: 'chest', x: 150, y: 170, s: 1 }], ['obj', { t: 'coin', x: 90, y: 190, s: 0.5 }], ['obj', { t: 'crown', x: 210, y: 150, s: 0.5 }]] } });
  molten('infernalbrood', { name: 'Infernal Brood', type: 'ability', speed: 'basic', cost: 3, target: 'none', tags: ['summon'], text: 'Summon two 2/3 Ember Whelplings with Ferocity and Protector.', run: async (E, c) => E.summonAlly(c.p, 'whelpling', 2),
    art: { s: 'volcano', L: [['dragon', { x: 100, y: 150, s: 0.42 }], ['dragon', { x: 210, y: 130, s: 0.38, flip: 1 }], glow(150, 200, 80, '#ff6a1a', 0.5)] } });
  molten('fireward', { name: 'Fireward Elixir', type: 'ability', speed: 'instant', cost: 3, rarity: 'e', target: 'none', tags: ['shield'], text: 'Prevent the next 3 damage to each friendly hero.', run: async (E, c) => { for (const h of E.heroes()) E.shield(h, 3); },
    art: { s: 'tavern', L: [glow(150, 130, 80, '#ff8a2a', 0.5), ['obj', { t: 'potion', x: 150, y: 130, col: '#ff4a1a' }], ['fx', { t: 'barrier', x: 150, y: 140 }]] } });
  molten('vortheye', { name: 'Eye of Vorthrax', type: 'item', cost: 3, rarity: 'e', heroAtk: 1, spell: 1, text: 'Your hero has +1 ATK. Your spells and powers deal +1 damage.',
    art: { s: 'volcano', L: [glow(150, 120, 90, '#ffb040', 0.7), ['obj', { t: 'amulet', x: 150, y: 120, s: 1.1 }]] } });
  molten('spireforge', { name: 'The Spire\'s Forge', type: 'location', cost: 0, lcost: 3, tags: ['buff', 'ready'], text: 'Play as a resource. Once per turn: pay 3 to ready your hero. Your hero gets +2 ATK this turn.', lrun: async (E, c) => { E.readyHero(c.p); E.tempAtk(c.p, 2); },
    art: { s: 'forge', p: 'embers', pn: 50, L: [glow(150, 150, 90, '#ff8a2a', 0.6), ['obj', { t: 'sword', x: 150, y: 110, s: 0.8, glow: '#ff6a1a' }]] } });

  /* ======================= The Sunken Cathedral: +11 treasure ======================= */
  const tide = (id, o) => addT('tide', id, o);
  tide('coralplate', { name: 'Coralplate Hauberk', type: 'armor', slot: 'chest', atype: 'mail', cost: 3, def: 2, use: 0,
    art: { s: 'sunken', L: [glow(150, 120, 80, '#ff9aa0', 0.4), ['obj', { t: 'vest', x: 150, y: 116 }]] } });
  tide('harpoon', { name: 'Stormcaller Harpoon', type: 'weapon', wtype: 'polearm', cost: 3, atk: 4, strike: 1, rarity: 'e', tags: ['stun'], text: 'When your hero attacks a minion with this and it survives, stun it.', onAttack: async (E, c) => { if (c.defender && c.defender.t === 'minion' && E.isAlive(c.defender)) E.stun(c.defender); },
    art: { s: 'sea', L: [['fx', { t: 'bolt', x: 150, y: 50 }], ['obj', { t: 'polearmItem', kind: 'trident', x: 150, y: 120, glow: '#9ae8ff', tilt: -15 }]] } });
  tide('sirenconch', { name: 'Siren\'s Conch', type: 'item', cost: 2, rarity: 'e', tags: ['stun'], text: 'At the start of your turn, stun a random enemy minion.', start: async (E, p) => { const m = pick(E, E.minions()); if (m) E.stun(m); },
    art: { s: 'sea', L: [glow(150, 120, 80, '#ffd0e0', 0.5), ['obj', { t: 'horn', x: 150, y: 124, s: 1 }], ['fx', { t: 'shout', x: 210, y: 110, c: '#9ae8ff' }]] } });
  tide('corsair', { name: 'Saltblood Corsair', type: 'ally', cost: 2, atk: 4, hp: 4, kw: ['ferocity', 'protector'], race: 'Human', flavor: 'Owes money in every port. Pays in steel.',
    art: { s: 'sea', L: [fig({ pose: 'charge', w: 'sword', helm: 'hood', cape: 1, capeCol: '#2a1a10', x: 150, y: 214, s: 0.9, cloth: '#7a2a1a' })] } });
  tide('pearldiver', { name: 'Pearl Diver', type: 'ally', cost: 2, atk: 2, hp: 3, race: 'Elf', tags: ['draw'], text: 'When this enters play, draw a card.', onEnter: async (E, c) => E.draw(c.p, 1),
    art: { s: 'sunken', L: [glow(150, 150, 70, '#ffe8f0', 0.5), fig({ race: 'elf', pose: 'aim', helm: 'hair', x: 140, y: 210, s: 0.86, cloth: '#2a5a6a' }), ['obj', { t: 'pearl', x: 230, y: 170, s: 0.6 }]] } });
  tide('kraken', { name: 'Kraken Spawnling', type: 'ally', cost: 6, atk: 5, hp: 7, kw: ['protector'], race: 'Beast', rarity: 'e', tags: ['stun'], text: 'When this enters play, stun a random enemy minion.', onEnter: async (E, c) => { const m = pick(E, E.minions()); if (m) E.stun(m); },
    art: { s: 'sunken', L: [['beast', { t: 'tentacle', x: 90, y: 220, s: 0.9 }], ['beast', { t: 'tentacle', x: 210, y: 220, s: 1, curl: -1 }], ['beast', { t: 'maw', x: 150, y: 220, s: 0.6, eye: '#ffe27a' }]] } });
  tide('tidalsurge', { name: 'Tidal Surge', type: 'ability', speed: 'basic', cost: 4, target: 'none', tags: ['aoeMinion'], dmg: 3, text: 'Deal 3 damage to each enemy minion.', run: async (E, c) => minionsDmg(E, c, 3, 'spell'),
    art: { s: 'sea', L: [['fx', { t: 'wave', y: 150 }], ['fx', { t: 'wave', y: 180 }]] } });
  tide('abyssward', { name: 'Ward of the Abyss', type: 'ability', speed: 'instant', cost: 3, rarity: 'e', target: 'none', tags: ['shield'], text: 'Prevent the next 3 damage to each friendly hero. Draw a card.', run: async (E, c) => { for (const h of E.heroes()) E.shield(h, 3); await E.draw(c.p, 1); },
    art: { s: 'sunken', L: [glow(150, 130, 90, '#5ad8ff', 0.6), ['fx', { t: 'barrier', x: 150, y: 140 }], ['fx', { t: 'runes', x: 150, y: 140, r: 80, c: '#9ae8ff' }]] } });
  tide('galleon', { name: 'Salvage the Sunken Galleon', type: 'quest', cost: 0, qcost: 2, text: 'Play as a resource. Complete (pay 2): search your deck for a weapon, armor or item and put it in your hand. Draw a card.', reward: async (E, c) => { await E.tutor(c.p, d => d.type === 'weapon' || d.type === 'armor' || d.type === 'item'); await E.draw(c.p, 1); },
    art: { s: 'sunken', L: [glow(150, 150, 70, '#ffd27a', 0.5), ['obj', { t: 'chest', x: 150, y: 176, s: 0.9 }], ['obj', { t: 'coin', x: 210, y: 190, s: 0.45 }]] } });
  tide('lighthouse', { name: 'The Drowned Lighthouse', type: 'location', cost: 0, lcost: 2, text: 'Play as a resource. Once per turn: pay 2 to scout the top card of the boss deck (you may send it to the bottom) and heal 2 damage from your hero.', lrun: async (E, c) => { await E.scoutBoss(c.p); await E.heal(E.heroT(c.p), 2); },
    art: { s: 'sea', L: [glow(150, 80, 70, '#fff0b0', 0.7), ['obj', { t: 'lantern', x: 150, y: 100, s: 1.1 }], ['fx', { t: 'wave', y: 190 }]] } });
  tide('undertowring', { name: 'Ring of the Undertow', type: 'item', cost: 2, allyHp: 1, text: 'Your allies have +1 health.',
    art: { s: 'sunken', L: [glow(150, 120, 60, '#5ad8ff', 0.6), ['obj', { t: 'ring', x: 150, y: 120, s: 1.2, gem: '#5ad8ff' }]] } });

  /* ======================= +1 core card ======================= */
  C.fieldmedic = { id: 'fieldmedic', name: 'Field Medic', type: 'ally', cost: 2, atk: 1, hp: 3, race: 'Human', fac: 'neutral', rarity: 'c', set: 'core', target: 'friendlyHero', tags: ['heal'], text: 'When this enters play, heal 3 damage from a friendly hero.', onEnter: async (E, c) => { if (c.target) await E.heal(c.target, 3); }, flavor: 'Bandages, splints and a very firm voice.',
    art: { s: 'castle', L: [glow(150, 130, 70, '#9aff8a', 0.4), fig({ pose: 'stand', w: 'mace', helm: 'hood', x: 130, y: 214, s: 0.86, cloth: '#e8e0c8' }), ['fx', { t: 'heal', x: 210, y: 120, c: '#9aff8a' }], ['obj', { t: 'potion', x: 230, y: 190, col: '#ff5a4a' }]] } };

  /* ======================= +3 loot cards (each with a scratch-off code reward) ======================= */
  const loot = (id, o) => { o.id = id; o.fac = 'neutral'; o.rarity = 'e'; o.set = 'loot'; C[id] = o; };
  loot('loot_owl', { name: 'Snowfeather Owlet', type: 'ally', cost: 2, atk: 2, hp: 2, kw: ['elusive', 'longrange'], race: 'Beast', tags: ['draw'], text: 'When this enters play, draw a card.', onEnter: async (E, c) => E.draw(c.p, 1), loot: { reward: 'pet_owl', label: 'Snowfeather Owlet companion' },
    art: { s: 'frost', L: [glow(150, 130, 90, '#e8f6ff', 0.6), ['beast', { t: 'bird', x: 150, y: 140, s: 0.7, eye: '#ffd060' }], ['fx', { t: 'sparkle', x: 150, y: 100, n: 10 }]] } });
  loot('loot_starfall', { name: 'Starfall Sigil', type: 'item', cost: 2, spell: 1, text: 'Your spells and powers deal +1 damage.', loot: { reward: 'back_starfall', label: 'Starfall card back' },
    art: { s: 'void', L: [glow(150, 120, 90, '#c87aff', 0.6), ['fx', { t: 'meteors', n: 5, c: '#e0c8ff' }], ['fx', { t: 'runes', x: 150, y: 130, r: 80, c: '#e8c060' }]] } });
  loot('loot_aurora', { name: 'Lantern of the Northern Lights', type: 'item', cost: 3, tags: ['heal'], text: 'At the start of your turn, heal 1 damage from each friendly hero and ally.', start: async (E, p) => { for (const t of E.friendlyChars()) await E.heal(t, 1); }, loot: { reward: 'board_aurora', label: 'Northern Lights table theme' },
    art: { s: 'frost', pal: { light: '#b8ffe0' }, L: [['wisps', { x: 150, y: 70, w: 300, h: 70, n: 12, c: '#9affd0' }], glow(150, 120, 80, '#9affd0', 0.5), ['obj', { t: 'lantern', x: 150, y: 130, s: 1.1 }]] } });
  Object.assign(RB.COSMETICS, {
    pet_owl: { kind: 'pet', name: 'Snowfeather Owlet', get: 'loot', desc: 'A round, fluffy snowy owlet with big golden eyes.' },
    back_starfall: { kind: 'back', name: 'Starfall', get: 'loot', desc: 'Falling stars around a gold eight-point star on a violet night sky.' },
    board_aurora: { kind: 'board', name: 'Northern Lights', get: 'loot', desc: 'Green and violet aurora over snowy peaks and a pine forest.' },
  });

  RB.FRONTIER = Object.values(C).filter(d => d.set === 'frontier').map(d => d.id);
})(globalThis.RB);
