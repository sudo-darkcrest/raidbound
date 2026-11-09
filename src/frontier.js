/* RAIDBOUND — "Frontier" booster set (#27) and unlockable heroes (#26).
   Paintings come from SpriteCook (gen/<id>.webp); the layered SVG specs below are the fallback. */
(function (RB) {
  const C = RB.CARDS, TK = RB.TOKENS;
  const fig = o => ['fig', o];
  const glow = (x, y, r, c, op) => ['glow', { x, y, r, c, op: op == null ? 0.5 : op }];
  const add = (id, o) => { o.id = id; o.fac = o.fac || 'neutral'; o.rarity = o.rarity || 'c'; o.set = 'frontier'; C[id] = o; };
  const minionsDmg = async (E, c, n, kind, cap) => { for (const t of E.aoe(E.minions(), n, cap)) await E.dmg(t, n, { p: c.p, kind: kind || 'effect' }); };
  const pick = (E, a) => a.length ? a[Math.floor(E.rnd() * a.length)] : null;

  /* ---------- tokens for the new cards ---------- */
  TK.bear_t = { id: 'bear_t', name: 'Trophy Bear', type: 'ally', atk: 3, hp: 3, race: 'Beast', art: { s: 'peaks', L: [['beast', { t: 'bear', x: 150, y: 206, s: 1.05, shadow: 80 }]] } };
  TK.spiritlynx = { id: 'spiritlynx', name: 'Spirit Lynx', type: 'ally', atk: 4, hp: 5, kw: ['ferocity', 'elusive', 'protector'], race: 'Spirit', art: { s: 'frost', L: [glow(150, 150, 90, '#9ae8ff', 0.5), ['beast', { t: 'lynx', x: 150, y: 206, s: 1, spectral: 1 }], ['fx', { t: 'sparkle', x: 150, y: 120 }]] } };

  /* =================== NEUTRAL (14) =================== */
  add('tidescout', { name: 'Saltmarsh Scout', type: 'ally', cost: 1, atk: 1, hp: 2, kw: ['protector'], race: 'Human', text: 'When this enters play, scout the top card of the boss deck. You may send it to the bottom.', onEnter: async (E, c) => E.scoutBoss(c.p), flavor: 'Reads the tide like other folk read letters.',
    art: { s: 'sea', L: [glow(70, 90, 50, '#ffe2a0', 0.35), fig({ pose: 'aim', w: 'bow', helm: 'hood', cape: 1, capeCol: '#2a4a4a', x: 140, y: 214, s: 0.9, cloth: '#3e6a5e', hoodCol: '#2e4e46' }), ['beast', { t: 'bird', x: 236, y: 92, s: 0.32 }]] } });
  add('cinderhound', { name: 'Cinderhound', type: 'ally', cost: 1, atk: 4, hp: 2, kw: ['ferocity', 'protector'], race: 'Beast', flavor: 'Its paw prints smoulder for an hour.',
    art: { s: 'volcano', p: 'embers', pn: 40, L: [glow(150, 196, 70, '#ff6a1a', 0.6), ['beast', { t: 'wolf', x: 150, y: 208, s: 1, eye: '#ffcf4a', fur: '#3a1e14' }], ['fx', { t: 'meteors', n: 3, c: '#ff8a3a' }]] } });
  add('stonecaller', { name: 'Hill Giant Stonecaller', type: 'ally', cost: 6, atk: 5, hp: 7, kw: ['protector'], race: 'Giant', rarity: 'r', text: 'When this enters play, deal 2 damage to each enemy minion.', onEnter: async (E, c) => minionsDmg(E, c, 2), flavor: 'It throws the mountain, then apologises to it.',
    art: { s: 'peaks', L: [glow(150, 120, 100, '#c8b090', 0.35), fig({ race: 'giant', pose: 'heroic', w: 'hammer', x: 150, y: 222, s: 0.95, cloth: '#5a4a3a' }), ['beast', { t: 'golem', kind: 'rock', x: 252, y: 226, s: 0.35 }], ['beast', { t: 'golem', kind: 'rock', x: 48, y: 230, s: 0.3 }]] } });
  add('grovebinder', { name: 'Grovebinder Druid', type: 'ally', cost: 3, atk: 2, hp: 4, race: 'Elf', rarity: 'u', text: 'At the start of your turn, heal 2 damage from each of your allies.', start: async (E, p) => { for (const a of [...p.allies]) await E.heal(E.T.ally(p, a), 2); }, flavor: 'Roots knit flesh as easily as soil.',
    art: { s: 'grove', L: [glow(150, 120, 80, '#9aff8a', 0.45), ['fx', { t: 'heal', x: 150, y: 110, c: '#9aff8a' }], fig({ race: 'elf', pose: 'staff', w: 'staff', robe: 1, helm: 'hair', glowL: '#9aff8a', x: 150, y: 214, s: 0.86, cloth: '#3a6a2e', hairCol: '#e8d8a0' })] } });
  add('wardstone', { name: 'Runed Wardstone', type: 'item', cost: 2, rarity: 'u', tags: ['shield'], text: 'At the start of your turn, if your hero has no ward, prevent the next 2 damage to your hero.', start: async (E, p) => { if (!p.hero.shield) E.shield(p, 2); },
    art: { s: 'altar', L: [glow(150, 120, 70, '#9ac8ff', 0.6), ['obj', { t: 'shard', x: 150, y: 116, s: 1, col: '#7aa8ff' }], ['fx', { t: 'runes', x: 150, y: 190, r: 90, flat: 1, c: '#9ac8ff' }]] } });
  add('frostmoths', { name: 'Frostmoth Swarm', type: 'ally', cost: 1, atk: 2, hp: 2, kw: ['elusive', 'protector'], race: 'Beast', rarity: 'u', text: 'When this enters play, stun a random enemy minion.', onEnter: async (E, c) => { const m = pick(E, E.minions()); if (m) E.stun(m); }, flavor: 'Where they land, the frost stays.',
    art: { s: 'frost', L: [glow(150, 130, 90, '#bfeaff', 0.5), ['beast', { t: 'bird', x: 110, y: 110, s: 0.34, eye: '#bfeaff' }], ['beast', { t: 'bird', x: 196, y: 90, s: 0.28, eye: '#bfeaff' }], ['beast', { t: 'bird', x: 168, y: 150, s: 0.3, eye: '#bfeaff' }], ['fx', { t: 'ice', x: 150, y: 190 }]] } });
  add('rhosk', { name: 'Captain Rhosk, Free Blade', type: 'ally', cost: 5, atk: 4, hp: 5, kw: ['unique'], race: 'Human', rarity: 'r', text: 'When Rhosk enters play, each of your allies (Rhosk too) gets +1 ATK and +1 health permanently.', onEnter: async (E, c) => { for (const a of [...c.p.allies]) E.buffAlly(E.T.ally(c.p, a), 1, 1); }, flavor: '"Paid in advance. Loyal till the coin runs out."',
    art: { s: 'tavern', L: [glow(210, 90, 60, '#ffcf8a', 0.4), fig({ pose: 'heroic', w: 'sword', off: 'round', helm: 'hood', cape: 1, capeCol: '#4a1a10', pauld: 'plate', x: 150, y: 214, s: 0.82, cloth: '#6a2a1a' }), ['obj', { t: 'coin', x: 240, y: 200, s: 0.45 }], ['obj', { t: 'coin', x: 60, y: 206, s: 0.35 }]] } });
  add('moonwell', { name: 'Moonwell Spring', type: 'location', cost: 0, rarity: 'u', lcost: 2, text: 'Play as a resource. Once per turn: pay 2 to heal 4 damage from your party\'s most wounded hero.', lrun: async (E, c) => { const h = E.mostWounded(); if (h) await E.heal(E.heroT(h), 4); },
    art: { s: 'grove', pal: { light: '#cfe8ff' }, L: [glow(150, 170, 90, '#9ad8ff', 0.6), ['obj', { t: 'pearl', x: 150, y: 170, s: 1.3 }], ['fx', { t: 'sparkle', x: 150, y: 110 }], ['wisps', { x: 150, y: 140, w: 220, h: 90, n: 8 }]] } });
  add('sunkenrelic', { name: 'Recover the Sunken Relic', type: 'quest', cost: 0, qcost: 3, text: 'Play as a resource. Complete (pay 3): search your deck for a weapon, armor or item and put it in your hand. Draw a card.', reward: async (E, c) => { await E.tutor(c.p, d => ['weapon', 'armor', 'item'].includes(d.type)); await E.draw(c.p, 1); },
    art: { s: 'sunken', L: [glow(150, 150, 70, '#ffd27a', 0.55), ['obj', { t: 'chest', x: 150, y: 176, s: 0.9 }], ['obj', { t: 'scroll', x: 230, y: 96, s: 0.55 }], ['fx', { t: 'sparkle', x: 150, y: 140 }]] } });
  add('greathunt', { name: 'The Great Hunt', type: 'quest', cost: 0, qcost: 0, rarity: 'u', cond: (E) => E.g.minionsKilled >= 3, condText: 'your party has destroyed 3 minions', text: 'Play as a resource. Complete once you have destroyed 3 minions: summon a 3/3 Trophy Bear and draw a card.', reward: async (E, c) => { await E.summonAlly(c.p, 'bear_t', 1); await E.draw(c.p, 1); },
    art: { s: 'forest', L: [['beast', { t: 'bear', x: 196, y: 210, s: 0.8, shadow: 60 }], fig({ race: 'dwarf', pose: 'aim', w: 'crossbow', helm: 'horned', pauld: 'fur', x: 90, y: 214, s: 0.72 }), ['obj', { t: 'horn', x: 250, y: 96, s: 0.5 }]] } });
  add('flashpowder', { name: 'Flashpowder', type: 'ability', speed: 'instant', cost: 1, target: 'enemy', tags: ['stun'], text: 'Stun an enemy. A stunned minion can\'t attack next boss turn; a stunned boss skips its next strike.', run: async (E, c) => E.stun(c.target),
    art: { s: 'rooftops', L: [glow(170, 120, 90, '#fff6c0', 0.85), ['obj', { t: 'bomb', x: 150, y: 130, s: 0.9 }], ['fx', { t: 'sparkle', x: 170, y: 110 }], ['fx', { t: 'shout', x: 170, y: 120, c: '#fff6c0' }]] } });
  add('firebomb', { name: 'Alchemist\'s Firebomb', type: 'ability', speed: 'basic', cost: 2, target: 'enemy', tags: ['dmg'], dmg: 2, text: 'Deal 2 damage to an enemy, then 1 damage to each enemy minion.', run: async (E, c) => { await E.dmg(c.target, 2, { p: c.p, kind: 'spell' }); await minionsDmg(E, c, 1, undefined, 4); },
    art: { s: 'forge', p: 'embers', pn: 40, L: [glow(170, 120, 90, '#ff8a2a', 0.7), ['obj', { t: 'potion', x: 120, y: 130, col: '#ff6a1a', shape: 'flask' }], ['fx', { t: 'fireball', x: 200, y: 110, c: '#ff8a3a', ang: 20 }]] } });
  add('vigorring', { name: 'Ring of Stubborn Vigor', type: 'item', cost: 2, rarity: 'u', allyHp: 1, text: 'Your allies have +1 health.',
    art: { s: 'altar', L: [glow(150, 120, 60, '#ff9a7a', 0.6), ['obj', { t: 'ring', x: 150, y: 120, s: 1.2, gem: '#ff5a4a' }], ['fx', { t: 'buff', x: 150, y: 120, c: '#ff9a7a' }]] } });
  add('worldsapling', { name: 'Sapling of the World Tree', type: 'ally', cost: 4, atk: 0, hp: 9, kw: ['protector', 'unique'], race: 'Treant', rarity: 'e', text: 'At the start of your turn, heal 2 damage from each friendly hero.', start: async (E, p) => { for (const h of E.heroes()) await E.heal(E.heroT(h), 2); }, flavor: 'Every forest in the world began as a stubborn seed.',
    art: { s: 'holy', pal: { light: '#d8ffb0' }, L: [glow(150, 120, 120, '#d8ffb0', 0.55), ['beast', { t: 'treant', x: 150, y: 220, s: 0.8 }], ['fx', { t: 'heal', x: 150, y: 90, c: '#d8ffb0' }], ['wisps', { x: 150, y: 120, w: 260, h: 120, n: 10 }]] } });

  /* =================== CONCORD (7) =================== */
  add('shieldmaiden', { name: 'Oathsworn Shieldmaiden', type: 'ally', cost: 2, atk: 2, hp: 3, fac: 'concord', kw: ['protector'], race: 'Human', flavor: 'She swore to stand. She has never once sat down.',
    art: { s: 'castle', L: [fig({ pose: 'stand', w: 'sword', off: 'tower', helm: 'great', plume: true, x: 150, y: 214, s: 0.86, emblem: '#ffd060', cloth: '#2c50a6', hairCol: '#e8c878' })] } });
  add('skyhammer', { name: 'Skyhammer Rider', type: 'ally', cost: 5, atk: 4, hp: 4, fac: 'concord', kw: ['ferocity'], race: 'Dwarf', rarity: 'u', flavor: 'The gryphon does the flying. He does the shouting.',
    art: { s: 'peaks', L: [['beast', { t: 'gryphon', x: 160, y: 168, s: 0.85 }], fig({ race: 'dwarf', pose: 'heroic', w: 'hammer', helm: 'horned', x: 150, y: 128, s: 0.52, cloth: '#2c50a6' })] } });
  add('starwarden', { name: 'Starwarden Archer', type: 'ally', cost: 3, atk: 3, hp: 3, fac: 'concord', kw: ['longrange'], race: 'Elf', rarity: 'u', target: 'enemy', text: 'When this enters play, deal 2 damage to an enemy.', onEnter: async (E, c) => { if (c.target) await E.dmg(c.target, 2, { p: c.p, kind: 'spell' }); }, flavor: 'She aims at the star behind you.',
    art: { s: 'arcane', L: [['fx', { t: 'arrows', x: 210, y: 100, c: '#d0c0ff' }], fig({ race: 'elf', pose: 'aim', w: 'bow', helm: 'hair', cape: 1, capeCol: '#1a1440', glowR: '#d0c0ff', x: 130, y: 212, s: 0.86, cloth: '#3a3a8a', hairCol: '#f4e6b8' })] } });
  add('dawnbanner', { name: 'Banner of the Silver Dawn', type: 'item', cost: 3, fac: 'concord', rarity: 'r', allyAtk: 1, allyHp: 1, text: 'Your allies have +1 ATK and +1 health.',
    art: { s: 'castle', L: [glow(150, 100, 90, '#ffe890', 0.5), ['obj', { t: 'banner', x: 150, y: 128, s: 0.95, col: '#2c50a6', em: '#ffd060' }], ['fx', { t: 'holy', x: 150 }]] } });
  add('highwatch', { name: 'Highwatch Bastion', type: 'location', cost: 0, fac: 'concord', rarity: 'u', lcost: 2, tags: ['shield'], text: 'Play as a resource. Once per turn: pay 2 to prevent the next 3 damage to your hero.', lrun: async (E, c) => E.shield(c.p, 3),
    art: { s: 'castle', L: [glow(200, 110, 60, '#ffd27a', 0.4), ['obj', { t: 'shieldItem', x: 150, y: 120, s: 0.9 }], ['obj', { t: 'banner', x: 60, y: 120, s: 0.5 }], ['obj', { t: 'banner', x: 240, y: 120, s: 0.5 }]] } });
  add('avelyn', { name: 'Lord Commander Avelyn', type: 'ally', cost: 6, atk: 5, hp: 6, fac: 'concord', kw: ['unique', 'protector'], race: 'Human', rarity: 'e', text: 'When Avelyn enters play, summon two 1/3 Footmen with Bulwark.', onEnter: async (E, c) => E.summonAlly(c.p, 'footman_t', 2), flavor: '"Form up. The dawn is watching."',
    art: { s: 'holy', L: [glow(150, 110, 110, '#ffe890', 0.5), fig({ pose: 'stand', w: 'polearm', off: 'tower', helm: 'great', x: 64, y: 222, s: 0.5 }), fig({ pose: 'stand', w: 'polearm', off: 'tower', helm: 'great', x: 236, y: 222, s: 0.5 }), fig({ pose: 'heroic', w: 'greatsword', helm: 'crown', cape: 1, capeCol: '#2c50a6', pauld: 'plate', wGlow: '#fff6c0', x: 150, y: 214, s: 0.84, emblem: '#ffd060', hairCol: '#c8a060' })] } });
  add('dawngreaves', { name: 'Dawnward Greaves', type: 'armor', slot: 'legs', atype: 'plate', cost: 2, def: 2, use: 1, fac: 'concord',
    art: { s: 'forge', L: [glow(150, 120, 60, '#ffd060', 0.4), ['obj', { t: 'legs', x: 150, y: 116 }]] } });

  /* =================== CLANS (7) =================== */
  add('axethrower', { name: 'Bonechew Axe-Thrower', type: 'ally', cost: 2, atk: 3, hp: 4, fac: 'clans', kw: ['longrange'], race: 'Orc', flavor: 'He never runs out of axes. Nobody asks where he gets them.',
    art: { s: 'steppe', L: [fig({ race: 'orc', pose: 'charge', w: 'axe', off: 'axe', helm: 'mohawk', x: 140, y: 212, s: 0.9 }), ['fx', { t: 'slash', x: 220, y: 110 }]] } });
  add('thundertotem', { name: 'Thunderhoof Totem', type: 'item', cost: 3, fac: 'clans', rarity: 'u', tags: ['aoeMinion'], text: 'At the start of your turn, deal 1 damage to each enemy minion.', start: async (E, p) => { for (const t of E.aoe(E.minions(), 1)) await E.dmg(t, 1, { p, kind: 'effect' }); },
    art: { s: 'storm', L: [['fx', { t: 'bolt', x: 150, y: 60 }], glow(150, 150, 70, '#9ac8ff', 0.6), ['obj', { t: 'horn', x: 150, y: 140, s: 1 }], ['fx', { t: 'runes', x: 150, y: 200, r: 80, flat: 1, c: '#9ac8ff' }]] } });
  add('ravager', { name: 'Steppe Ravager', type: 'ally', cost: 5, atk: 5, hp: 4, fac: 'clans', kw: ['ferocity'], race: 'Minotaur', rarity: 'u', text: 'When this enters play, deal 1 damage to each enemy.', onEnter: async (E, c) => { for (const t of E.aoe(E.enemies(), 1)) await E.dmg(t, 1, { p: c.p, kind: 'effect' }); }, flavor: 'The ground shakes first. Then it really shakes.',
    art: { s: 'steppe', L: [['fx', { t: 'whirl', x: 150, y: 190, c: '#e8b070' }], fig({ race: 'minotaur', pose: 'charge', w: 'battleaxe', pauld: 'spiked', x: 150, y: 212, s: 0.9 })] } });
  add('blastmonger', { name: 'Goblin Blastmonger', type: 'ally', cost: 3, atk: 2, hp: 3, kw: ['protector'], fac: 'clans', race: 'Goblin', rarity: 'u', text: 'When this ally is destroyed, deal 3 damage to each enemy minion.', onDeath: async (E, c) => { for (const t of E.aoe(E.minions(), 3)) await E.dmg(t, 3, { p: c.p, kind: 'effect' }); }, flavor: '"Stand back. Further. No — further."',
    art: { s: 'forge', p: 'embers', pn: 30, L: [glow(200, 140, 70, '#ffb040', 0.6), fig({ race: 'goblin', pose: 'crouch', w: 'dagger', helm: 'hood', x: 120, y: 212, s: 1.05, eye: '#ffd060' }), ['obj', { t: 'bomb', x: 210, y: 176, s: 0.7 }], ['obj', { t: 'bomb', x: 246, y: 200, s: 0.5 }]] } });
  add('supplyraid', { name: 'Raid the Supply Lines', type: 'quest', cost: 0, qcost: 1, fac: 'clans', text: 'Play as a resource. Complete (pay 1): summon a 2/2 Grunt with Swift and Bulwark and draw a card.', reward: async (E, c) => { await E.summonAlly(c.p, 'grunt_t', 1); await E.draw(c.p, 1); },
    art: { s: 'steppe', L: [['obj', { t: 'chest', x: 190, y: 184, s: 0.7 }], fig({ race: 'orc', pose: 'charge', w: 'axe', helm: 'mohawk', x: 110, y: 212, s: 0.72 }), ['obj', { t: 'scroll', x: 240, y: 90, s: 0.45 }]] } });
  add('urza', { name: 'Chieftain Urza Redmane', type: 'ally', cost: 5, atk: 7, hp: 7, fac: 'clans', kw: ['unique', 'ferocity'], race: 'Orc', rarity: 'r', text: 'When Urza enters play, ready all your allies. They get +1 ATK this turn.', onEnter: async (E, c) => { E.readyAllies(c.p); E.allyTempAtk(c.p, 1); }, flavor: '"Again. And this time, louder."',
    art: { s: 'steppe', L: [glow(150, 100, 100, '#ff6a3a', 0.4), ['obj', { t: 'banner', x: 240, y: 120, s: 0.6, col: '#7a1010', em: '#ffb070', glyph: 'axes' }], fig({ race: 'orc', pose: 'heroic', w: 'battleaxe', helm: 'horned', pauld: 'spiked', cape: 1, capeCol: '#7a1010', wGlow: '#ff4a1a', x: 140, y: 214, s: 0.86, hairCol: '#c83a1a' })] } });
  add('hidejerkin', { name: 'Spiked Hide Jerkin', type: 'armor', slot: 'chest', atype: 'leather', cost: 2, def: 2, use: 1, fac: 'clans',
    art: { s: 'steppe', L: [glow(150, 120, 60, '#ffb070', 0.3), ['obj', { t: 'vest', x: 150, y: 116 }]] } });

  /* =================== CLASS CARDS (12) =================== */
  add('judgement', { name: 'Judgement of Light', type: 'ability', speed: 'basic', cost: 2, cls: ['paladin'], target: 'enemy', tags: ['dmg', 'shield'], dmg: 3, text: 'Deal 3 damage to an enemy. Prevent the next 3 damage to your hero.', run: async (E, c) => { await E.dmg(c.target, 3, { p: c.p, kind: 'spell' }); E.shield(c.p, 3); },
    art: { s: 'holy', L: [['fx', { t: 'holy', x: 150, wings: 1, wy: 100 }], ['obj', { t: 'hammer', x: 150, y: 110, s: 0.9 }]] } });
  add('lightbringer', { name: 'Lightbringer Mace', type: 'weapon', wtype: 'mace', cost: 3, atk: 4, strike: 1, cls: ['paladin'], rarity: 'r', text: 'When your hero attacks with this, heal 2 damage from each of your allies.', onAttack: async (E, c) => { for (const a of [...c.p.allies]) await E.heal(E.T.ally(c.p, a), 2); },
    art: { s: 'temple', L: [glow(150, 100, 80, '#fff6c0', 0.7), ['obj', { t: 'maceItem', x: 150, y: 110, glow: '#fff6c0' }], ['fx', { t: 'sparkle', x: 150, y: 90 }]] } });
  add('cleave', { name: 'Cleave', type: 'ability', speed: 'basic', cost: 2, cls: ['warrior'], target: 'none', tags: ['aoeMinion'], dmg: 2, text: 'Deal 2 damage to each enemy minion (3 if your hero has a weapon).', run: async (E, c) => minionsDmg(E, c, c.p.weapon ? 3 : 2, 'spell'),
    art: { s: 'steppe', L: [['fx', { t: 'slash', x: 150, y: 140 }], ['fx', { t: 'whirl', x: 150, y: 170, c: '#ffd0a0' }], fig({ pose: 'charge', w: 'battleaxe', helm: 'great', x: 150, y: 214, s: 0.8 })] } });
  add('rampage', { name: 'Unstoppable Rampage', type: 'ability', speed: 'basic', cost: 3, cls: ['warrior'], target: 'none', tags: ['buff', 'shield'], rarity: 'u', text: 'Ready your hero. Your hero gets +2 ATK this turn. Prevent the next 3 damage to your hero.', run: async (E, c) => { E.readyHero(c.p); E.tempAtk(c.p, 2); E.shield(c.p, 3); },
    art: { s: 'volcano', L: [glow(150, 140, 100, '#ff4a1a', 0.5), ['fx', { t: 'shout', x: 150, y: 100, c: '#ffb070' }], fig({ race: 'orc', pose: 'dual', w: 'axe', off: 'axe', helm: 'mohawk', wGlow: '#ff6a3a', x: 150, y: 212, s: 0.86 })] } });
  add('explosivetrap', { name: 'Explosive Trap', type: 'ability', speed: 'basic', cost: 2, cls: ['ranger'], target: 'none', tags: ['aoeMinion'], dmg: 2, text: 'Deal 2 damage to each enemy minion.', run: async (E, c) => minionsDmg(E, c, 2, 'spell'),
    art: { s: 'forest', L: [glow(150, 196, 90, '#ff8a2a', 0.7), ['fx', { t: 'meteors', n: 4, c: '#ff8a3a' }], ['obj', { t: 'bomb', x: 150, y: 190, s: 0.7 }]] } });
  add('spiritbeast', { name: 'Call the Spirit Beast', type: 'ability', speed: 'basic', cost: 3, cls: ['ranger'], target: 'none', tags: ['summon'], rarity: 'r', text: 'Summon a 4/5 Spirit Lynx with Swift, Shrouded and Bulwark.', run: async (E, c) => E.summonAlly(c.p, 'spiritlynx', 1),
    art: TK.spiritlynx.art });
  add('eviscerate', { name: 'Eviscerate', type: 'ability', speed: 'basic', cost: 3, cls: ['rogue'], target: 'enemy', tags: ['dmg'], dmg: 5, text: 'Deal 5 damage to an enemy. If your hero has a dagger, deal 7 instead.', run: async (E, c) => E.dmg(c.target, c.p.weapon && C[c.p.weapon.c.id].wtype === 'dagger' ? 7 : 5, { p: c.p, kind: 'spell' }),
    art: { s: 'rooftops', L: [['fx', { t: 'slash', x: 160, y: 120 }], ['fx', { t: 'slash', x: 140, y: 150 }], fig({ race: 'goblin', pose: 'crouch', w: 'dagger', off: 'dagger', helm: 'hood', x: 150, y: 212, s: 1.05, wGlow: '#9aff6a' })] } });
  add('shadowcowl', { name: 'Shadowsilk Cowl', type: 'armor', slot: 'head', atype: 'leather', cost: 2, def: 1, use: 0, cls: ['rogue'], heroAtk: 1, rarity: 'u', text: 'Your hero has +1 ATK.',
    art: { s: 'rooftops', L: [glow(150, 120, 60, '#9a7aff', 0.4), ['obj', { t: 'helm', x: 150, y: 116, kind: 'hood', col: '#2a2440' }], ['fx', { t: 'shadow', x: 150, y: 140 }]] } });
  add('chainlightning', { name: 'Chain Lightning', type: 'ability', speed: 'basic', cost: 3, cls: ['mage'], target: 'enemy', tags: ['dmg'], dmg: 4, rarity: 'u', text: 'Deal 3 damage to an enemy, then 2 damage to a random other enemy.', run: async (E, c) => { await E.dmg(c.target, 3, { p: c.p, kind: 'spell' }); const o = pick(E, E.enemies().filter(t => !E.same(t, c.target))); if (o) await E.dmg(o, 2, { p: c.p, kind: 'spell' }); },
    art: { s: 'storm', L: [['fx', { t: 'bolt', x: 120, y: 60 }], ['fx', { t: 'bolt', x: 210, y: 80 }], fig({ race: 'elf', pose: 'castF', off: 'staff', helm: 'hair', robe: 1, glowR: '#bfe0ff', x: 110, y: 212, s: 0.8 })] } });
  add('starwellorb', { name: 'Orb of the Starwell', type: 'item', cost: 2, cls: ['mage'], spell: 1, rarity: 'r', text: 'Your spells and powers deal +1 damage.',
    art: { s: 'arcane', L: [glow(150, 120, 90, '#c8a0ff', 0.7), ['obj', { t: 'pearl', x: 150, y: 120, s: 1.5 }], ['fx', { t: 'sparkle', x: 150, y: 110 }], ['wisps', { x: 150, y: 120, w: 200, h: 100, n: 7 }]] } });
  add('holyfire', { name: 'Holy Fire', type: 'ability', speed: 'basic', cost: 2, cls: ['priest'], target: 'enemy', tags: ['dmg', 'heal'], dmg: 3, text: 'Deal 3 damage to an enemy. Heal 3 damage from your party\'s most wounded hero.', run: async (E, c) => { await E.dmg(c.target, 3, { p: c.p, kind: 'spell' }); const h = E.mostWounded(); if (h) await E.heal(E.heroT(h), 3); },
    art: { s: 'temple', L: [glow(150, 110, 90, '#ffd070', 0.6), ['fx', { t: 'fireball', x: 170, y: 110, c: '#ffe890', ang: 10 }], fig({ pose: 'cast', robe: 1, helm: 'hood', glowR: '#ffe890', x: 110, y: 214, s: 0.8, cloth: '#ece4d0' })] } });
  add('guardianspirit', { name: 'Guardian Spirit', type: 'ability', speed: 'instant', react: 'friendHero', cost: 3, cls: ['priest'], target: 'friendlyHero', tags: ['shield'], shield: 8, rarity: 'u', text: 'Prevent the next 8 damage to a friendly hero.', run: async (E, c) => E.shield(c.target.p, 8),
    art: { s: 'holy', L: [['fx', { t: 'holy', x: 150, wings: 1, wy: 96 }], fig({ pose: 'pray', robe: 1, helm: 'hair', spectral: 1, x: 150, y: 200, s: 0.8 }), ['fx', { t: 'barrier', x: 150, y: 150 }]] } });

  // #36: the old Market picture (a harbor stall full of cards and coin) now belongs to this card
  add('harbormarket', { name: 'Saltwind Harbor Market', type: 'location', cost: 0, rarity: 'u', lcost: 2, text: 'Play as a resource. Once per turn: pay 2 to draw a card.', lrun: async (E, c) => E.draw(c.p, 1),
    art: { s: 'sea', L: [glow(150, 120, 90, '#ffd27a', 0.45), ['obj', { t: 'chest', x: 150, y: 170, s: 1 }], ['obj', { t: 'coin', x: 90, y: 200, s: 0.45 }], ['obj', { t: 'scroll', x: 230, y: 96, s: 0.5 }]] } });

  RB.FRONTIER = Object.values(C).filter(d => d.set === 'frontier').map(d => d.id);

  /* =================== UNLOCKABLE HEROES (#26) =================== */
  const H = RB.HEROES;
  const hero = (id, o) => { o.id = id; H[id] = o; };
  hero('vaelith', { name: 'Vaelith Nightbloom', fac: 'concord', race: 'Elf', cls: 'rogue', spec: 'Nightblade', profs: ['enchanting', 'skinning'], hp: 28,
    unlock: { how: 'win:crypt', text: 'Defeat Crypt of the Hollow King' },
    flavor: '"The moon keeps my secrets. The dagger keeps yours."',
    power: { name: 'Thousand Cuts', text: 'Deal 2 damage to a random enemy four times.', target: 'none', tags: ['dmgRandom'], dmg: 8, run: async (E, c) => { for (let i = 0; i < 4; i++) { const t = E.randomEnemy(); if (t) await E.dmg(t, 2, { p: c.p, kind: 'power' }); } } },
    art: { s: 'rooftops', L: [glow(220, 70, 50, '#e8e0ff', 0.5), ['fx', { t: 'slash', x: 200, y: 120 }], fig({ race: 'elf', pose: 'crouch', w: 'dagger', off: 'dagger', helm: 'hood', cape: 1, capeCol: '#1a1430', wGlow: '#c8a0ff', x: 140, y: 212, s: 0.98, cloth: '#2a2a5a', hoodCol: '#222048', hairCol: '#f0e8ff', eye: '#c8a0ff' })] } });
  hero('brannoc', { name: 'Brannoc Stonevow', fac: 'concord', race: 'Dwarf', cls: 'warrior', spec: 'Shieldbearer', profs: ['blacksmithing', 'mining'], hp: 37,
    unlock: { how: 'win:molten', text: 'Defeat the Molten Spire' },
    flavor: '"Mountains don\'t step aside. Neither do I."',
    power: { name: 'Unbreakable', text: 'Prevent the next 10 damage to your hero. Taunt: the boss and its minions must attack your hero until your next turn.', target: 'none', tags: ['shield', 'taunt'], run: async (E, c) => { E.shield(c.p, 10); E.taunt(c.p); } },
    art: { s: 'forge', p: 'embers', pn: 30, L: [glow(150, 120, 100, '#ffb050', 0.4), fig({ race: 'dwarf', pose: 'stand', w: 'hammer', off: 'tower', helm: 'horned', pauld: 'plate', cape: 1, capeCol: '#2a1a10', x: 150, y: 212, s: 1.05, emblem: '#ffd060', cloth: '#2c50a6', hairCol: '#8a4a22', beardCol: '#8a4a22' })] } });
  hero('tavra', { name: 'Tavra Sunhorn', fac: 'clans', race: 'Minotaur', cls: 'paladin', spec: 'Dawnbull', profs: ['herbalism', 'mining'], hp: 34,
    unlock: { how: 'win:tide', text: 'Defeat the Sunken Cathedral' },
    flavor: '"The sun rises over the steppe first. So do I."',
    power: { name: 'Sunhorn Charge', text: 'Deal 5 damage to an enemy. Heal 5 damage from your hero.', target: 'enemy', tags: ['dmg', 'heal'], dmg: 5, run: async (E, c) => { await E.dmg(c.target, 5, { p: c.p, kind: 'power' }); await E.heal(E.heroT(c.p), 5); } },
    art: { s: 'holy', L: [['fx', { t: 'holy', x: 150, wings: 0, wy: 100 }], glow(150, 110, 110, '#ffe890', 0.45), fig({ race: 'minotaur', pose: 'heroic', w: 'hammer', off: 'round', pauld: 'plate', cape: 1, capeCol: '#7a3010', wGlow: '#fff0a0', x: 150, y: 214, s: 0.86, emblem: '#ffd060', cloth: '#c8801a' })] } });
  hero('zizzik', { name: 'Zizzik Sparkwhistle', fac: 'clans', race: 'Goblin', cls: 'mage', spec: 'Sparkwright', profs: ['engineering', 'alchemy'], hp: 30,
    unlock: { how: 'gold:1000', text: 'Buy for 1,000 gold in the Market' },
    flavor: '"Safety goggles are for people who plan to miss."',
    power: { name: 'Overcharged Rocket', text: 'Deal 4 damage to each enemy. Your hero takes 1 damage.', target: 'none', tags: ['aoe'], dmg: 4, run: async (E, c) => { for (const t of E.aoe(E.enemies(), 4)) await E.dmg(t, 4, { p: c.p, kind: 'power' }); await E.dmg(E.heroT(c.p), 1, { kind: 'effect' }); } },
    art: { s: 'forge', p: 'embers', pn: 50, L: [glow(200, 110, 80, '#ffb040', 0.6), ['fx', { t: 'fireball', x: 220, y: 100, c: '#ffb040', ang: 30 }], fig({ race: 'goblin', pose: 'castF', off: 'wand', helm: 'hood', robe: 1, glowR: '#ffd060', x: 120, y: 212, s: 1.08, cloth: '#c86a1a', eye: '#ffd060' })] } });
  hero('seraphine', { name: 'Seraphine Vale', fac: 'concord', race: 'Human', cls: 'priest', spec: 'Lightwarden', profs: ['herbalism', 'tailoring'], hp: 30,
    unlock: { how: 'gold:1000', text: 'Buy for 1,000 gold in the Market' },
    flavor: '"Hold the line a little longer. I\'ve got you."',
    power: { name: 'Sanctuary', text: 'Heal 4 damage from each friendly hero and ally. Prevent the next 3 damage to each friendly hero.', target: 'none', tags: ['healAll', 'shield'], run: async (E, c) => { for (const t of E.friendlyChars()) await E.heal(t, 4); for (const h of E.heroes()) E.shield(h, 3); } },
    art: { s: 'temple', L: [['fx', { t: 'holy', x: 150, wings: 1, wy: 100 }], glow(150, 120, 110, '#fff6c0', 0.5), fig({ pose: 'pray', robe: 1, helm: 'hair', glowL: '#fff6c0', glowR: '#fff6c0', x: 150, y: 212, s: 0.86, cloth: '#ece4d0', trim: '#d8a840', hairCol: '#c87a3a', gem: '#ffe890' })] } });
  hero('korga', { name: 'Korga Ironfang', fac: 'clans', race: 'Orc', cls: 'ranger', spec: 'Packmaster', profs: ['skinning', 'engineering'], hp: 34,
    unlock: { how: 'heroic', text: 'Win any raid on Heroic' },
    flavor: '"The wolves aren\'t my pets. I\'m theirs."',
    power: { name: 'Call the Pack', text: 'Summon two 2/2 Wolf Companions with Swift. Draw a card.', target: 'none', tags: ['summon', 'draw'], run: async (E, c) => { await E.summonAlly(c.p, 'wolfcomp', 2); await E.draw(c.p, 1); } },
    art: { s: 'steppe', L: [['beast', { t: 'wolf', x: 230, y: 212, s: 0.7 }], ['beast', { t: 'wolf', x: 66, y: 216, s: 0.62, flip: 1 }], fig({ race: 'orc', pose: 'aim', w: 'bow', helm: 'mohawk', pauld: 'fur', x: 150, y: 212, s: 0.84, cloth: '#5a3a1a', paint: '#d8401e' })] } });
  RB.UNLOCK_HEROES = ['vaelith', 'brannoc', 'tavra', 'zizzik', 'seraphine', 'korga'];
  RB.heroUnlocked = (id, save) => {
    const h = H[id]; if (!h || !h.unlock) return true;
    if (!save) return true;
    const how = h.unlock.how;
    if ((save.heroes || []).includes(id)) return true;
    if (how.startsWith('win:')) return (save.wins[how.slice(4)] || 0) > 0;
    if (how === 'heroic') return Object.values(save.heroicWins || {}).some(n => n > 0);
    return false; // gold: must be bought
  };
  // starter decks for the new heroes: the best core-only deck for each
  for (const id of RB.UNLOCK_HEROES) {
    const deck = RB.autoDeck(id, null, null, 1), out = {};
    deck.forEach(x => out[x] = (out[x] || 0) + 1);
    RB.STARTER[id] = out;
  }

  /* =================== GOLD + BOOSTER PACKS =================== */
  RB.PACK_PRICE = 100;
  RB.GOLD_TIER = { Veteran: 0.25, Legendary: 0.5 };
  RB.DUNGEON_GOLD_BONUS = { experienced: 0.1, heroic: 0.25, legendary: 0.5 };
  RB.goldFor = (g, win) => {
    const cap = g.boss.baseMax || g.boss.maxHp; // #92: a dungeon gauntlet pays against the whole dungeon's health, as before
    const bossDmg = Math.max(g.players.reduce((s, p) => s + (p.stats.bossDmg || 0), 0), Math.min(g.boss.damage, cap));
    // #43/#46: about 150-250 gold per raid
    const parts = [
      ['Victory', win ? 100 : 30],
      // the party splits the spoils, so bigger groups don't earn more each
      ['Damage to the boss', Math.round(Math.min(bossDmg, cap) * 0.42 / g.players.length)], // fix-sim: 0.6 -> 0.42 because bosses got 50% more health
      ['Minions destroyed', Math.round(g.minionsKilled * 3 / g.players.length)],
      ['Healing done', Math.round((g.stats.healed || 0) * 0.4 / g.players.length)],
    ];
    let total = parts.reduce((s, x) => s + x[1], 0);
    // fix-sim: harder raids pay more (the Apprentice raid used to pay the most per round), and every harder mode pays a bonus
    const tier = RB.GOLD_TIER[g.raid.difficulty] || 0;
    if (tier) { const b = Math.round(total * tier); parts.push([`${g.raid.difficulty} raid bonus`, b]); total += b; }
    const modeB = g.raid.dungeon ? (RB.DUNGEON_GOLD_BONUS[g.cfg.difficulty] || 0) : (g.cfg.difficulty === 'heroic' ? 0.25 : 0);
    if (modeB) { const b = Math.round(total * modeB); parts.push([`${g.raid.dungeon ? (RB.DUNGEON_MODES[g.cfg.difficulty] || {}).name : 'Heroic'} bonus`, b]); total += b; }
    return { parts, total };
  };
  // RB.rollBooster lives in packs.js (#47: each wrapper is its own set)
})(globalThis.RB);
