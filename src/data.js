/* RAIDBOUND — game content: classes, heroes, cards, tokens, raid bosses */
(function (RB) {
  const GOLD = '#ffd060', EMBER = '#ff6a3a';

  RB.FACTIONS = {
    concord: { name: 'Silver Concord', short: 'Concord', color: '#7fa6ff', blurb: 'Kingdoms of humans, dwarves and elves bound by an ancient oath of mutual defense.' },
    clans: { name: 'Ember Clans', short: 'Clans', color: '#ff7a4a', blurb: 'Orcs, minotaurs and goblins of the red steppe, loyal to strength and to one another.' },
    neutral: { name: 'Neutral', short: 'Neutral', color: '#c9b48a', blurb: 'Sellswords, beasts and wanderers who fight for any banner.' },
  };
  RB.CLASSES = {
    paladin: { name: 'Paladin', armor: ['plate', 'mail', 'leather', 'cloth', 'shield'], weapons: ['sword', 'mace', 'hammer'] },
    warrior: { name: 'Warrior', armor: ['plate', 'mail', 'leather', 'cloth', 'shield'], weapons: ['sword', 'axe', 'mace', 'hammer', 'polearm'] },
    ranger: { name: 'Ranger', armor: ['mail', 'leather', 'cloth'], weapons: ['bow', 'crossbow', 'axe', 'polearm'] },
    rogue: { name: 'Rogue', armor: ['leather', 'cloth'], weapons: ['dagger', 'sword'] },
    mage: { name: 'Mage', armor: ['cloth'], weapons: ['staff', 'wand', 'dagger'] },
    priest: { name: 'Priest', armor: ['cloth'], weapons: ['staff', 'mace', 'wand'] },
  };
  RB.PROFS = { blacksmithing: 'Blacksmithing', mining: 'Mining', engineering: 'Engineering', skinning: 'Skinning', enchanting: 'Enchanting', tailoring: 'Tailoring', herbalism: 'Herbalism', alchemy: 'Alchemy' };
  RB.KEYWORDS = {
    // #rules-review: our own keyword names (internal ids stay the same so saves and decks keep working)
    protector: ['Bulwark', 'When an enemy attacks any friendly hero or ally, a ready Bulwark ally can cover them: it takes the hit instead and exhausts. Covering a teammate draws the boss\'s eye (its hero gains threat).'],
    ferocity: ['Swift', 'Can attack the turn it enters play.'],
    longrange: ['Volley', 'Takes no damage back when it attacks, and can reach a boss in the air.'],
    // #112 lighter than Volley: only lets it reach a flying boss (it still takes damage back)
    skyward: ['Skyward', 'Can attack a boss in the air. It still takes damage back as normal.'],
    elusive: ['Shrouded', 'Can\'t be attacked. Spells and area damage still hit it. An Enraged boss sees through a Shrouded hero.'],
    guardian: ['Guardian', 'While this minion is in play, the boss can\'t be attacked.'],
    unique: ['Unique', 'Only one copy can be in play for each hero.'],
    ambush: ['Ambush', 'Bulwark allies can\'t cover against its attacks.'],
    crushing: ['Crushing', 'Damage beyond a defending ally\'s health carries on to that ally\'s hero.'],
    frenzy: ['Frenzy', '+1 ATK for each damage on it.'],
    thickhide: ['Thick Hide', 'Takes 1 less damage from each hit.'],
    tend: ['Tend', 'At the start of your turn, heals 1 damage from your most wounded hero or ally.'],
  };
  // #99 React cards: an Instant with a printed trigger can also be played during the boss's turn when that trigger happens
  RB.REACT = {
    hero: 'when your hero is attacked',
    friendHero: 'when a friendly hero is attacked',
    friend: 'when a friendly hero or ally is attacked',
    strike: 'when the boss strikes',
  };
  RB.SLOTS = { head: 'Head', chest: 'Chest', hands: 'Hands', legs: 'Legs', feet: 'Feet', shield: 'Off-hand' };

  /* ======================= HEROES ======================= */
  const fig = (o) => ['fig', o];
  RB.HEROES = {
    aldric: {
      id: 'aldric', name: 'Ser Aldric Dawnward', fac: 'concord', race: 'Human', cls: 'paladin', spec: 'Oathkeeper', profs: ['blacksmithing', 'mining'], hp: 30,
      flavor: '"The oath does not break. Neither do I."',
      power: { name: 'Lay on Hands', text: 'Heal 10 damage from a friendly hero or ally.', target: 'friendly', tags: ['heal'], run: async (E, c) => E.heal(c.target, 10) },
      art: { s: 'castle', img: 'aldric', L: [fig({ race: 'human', pose: 'heroic', w: 'hammer', off: 'shield', helm: 'great', cape: 1, capeCol: '#2a0a1a', pauld: 'plate', emblem: GOLD, wGlow: '#ffe890', x: 140, y: 214, s: 0.78, belt: '#d8b050' })] },
    },
    thorgrim: {
      id: 'thorgrim', name: 'Thorgrim Ashbeard', fac: 'concord', race: 'Dwarf', cls: 'ranger', spec: 'Beastmaster', profs: ['engineering', 'skinning'], hp: 33,
      flavor: '"Me and Skarr have never missed. Well. Skarr hasn\'t."',
      power: { name: 'Volley of the Peaks', text: 'Deal 3 damage to each enemy.', target: 'none', tags: ['aoe'], run: async (E, c) => { for (const t of E.aoe(E.enemies(), 3)) await E.dmg(t, 3, { p: c.p, kind: 'power' }); } },
      art: { s: 'peaks', L: [fig({ race: 'dwarf', pose: 'aim', w: 'crossbow', helm: 'horned', pauld: 'fur', x: 130, y: 210, s: 1.05, belt: '#c89a50' }), ['beast', { t: 'bird', x: 236, y: 112, s: 0.42, eye: '#ffe27a' }]] },
    },
    lyssara: {
      id: 'lyssara', name: 'Lyssara Moonwhisper', fac: 'concord', race: 'Elf', cls: 'mage', spec: 'Starcaller', profs: ['enchanting', 'tailoring'], hp: 30,
      flavor: '"Every star is a spell someone forgot to finish."',
      power: { name: 'Starfall', text: 'Deal 8 damage to an enemy.', target: 'enemy', tags: ['dmg'], dmg: 8, run: async (E, c) => E.dmg(c.target, 8, { p: c.p, kind: 'power' }) },
      art: { s: 'arcane', L: [['fx', { t: 'meteors', n: 5 }], fig({ race: 'elf', pose: 'castF', off: 'staff', helm: 'hair', robe: 1, glowR: '#d0b0ff', x: 130, y: 212, s: 0.84, capeCol: '#1a1440' })] },
    },
    grukka: {
      id: 'grukka', name: 'Grukka Bloodtusk', fac: 'clans', race: 'Orc', cls: 'warrior', spec: 'Berserker', profs: ['blacksmithing', 'mining'], hp: 36, ironHide: 1, trait: 'Iron Hide: Grukka takes 1 less damage back when he attacks.',
      flavor: '"Bring me the big one."',
      power: { name: 'Bloodrage', text: 'Ready your hero. Your hero gets +4 ATK until end of turn.', target: 'none', tags: ['buff'], run: async (E, c) => { E.readyHero(c.p); E.tempAtk(c.p, 4); } },
      art: { s: 'steppe', L: [fig({ race: 'orc', pose: 'dual', w: 'axe', off: 'axe', oA: -30, helm: 'mohawk', pauld: 'spiked', x: 150, y: 210, s: 0.9, wGlow: '#ff6a3a' })] },
    },
    hruna: {
      id: 'hruna', name: 'Hruna Stormhorn', fac: 'clans', race: 'Minotaur', cls: 'priest', spec: 'Earthmother', profs: ['herbalism', 'alchemy'], hp: 33,
      flavor: '"The rain remembers every hoof that ever walked the steppe."',
      power: { name: 'Ancestral Tide', text: 'Heal 6 damage from each friendly hero and ally.', target: 'none', tags: ['healAll'], run: async (E, c) => { for (const t of E.friendlyChars()) await E.heal(t, 6); } },
      art: { s: 'storm', L: [fig({ race: 'minotaur', pose: 'staff', w: 'totem', robe: 1, glowL: '#9ac8ff', x: 150, y: 210, s: 0.86, eye: '#bfe0ff' })] },
    },
    snix: {
      id: 'snix', name: 'Snix Quickfingers', fac: 'clans', race: 'Goblin', cls: 'rogue', spec: 'Cutpurse', profs: ['engineering', 'alchemy'], hp: 29,
      flavor: '"Not stealing. Pre-looting."',
      power: { name: 'Shadowstep', text: 'Draw 2 cards. Your hero is Shrouded until your next turn.', target: 'none', tags: ['draw'], run: async (E, c) => { await E.draw(c.p, 2); E.elusive(c.p); } },
      art: { s: 'rooftops', L: [fig({ race: 'goblin', pose: 'crouch', w: 'dagger', off: 'dagger', helm: 'hood', x: 150, y: 210, s: 1.15, eye: '#ffd060', wGlow: '#9aff6a' })] },
    },
  };

  /* ======================= PLAYER CARDS ======================= */
  const C = {};
  const add = (id, o) => { o.id = id; o.fac = o.fac || 'neutral'; o.rarity = o.rarity || 'c'; o.set = o.set || 'core'; C[id] = o; };
  const D = (n, t) => (E, c) => E.dmg(c.target, n, { p: c.p, kind: 'spell', card: c.card });

  // ---------- neutral allies ----------
  add('sellsword', { name: 'Wandering Sellsword', type: 'ally', cost: 1, atk: 3, hp: 5, race: 'Human', flavor: 'Coin first. Heroics after.', art: { s: 'tavern', L: [fig({ pose: 'stand', w: 'sword', helm: 'hood', cape: 1, x: 140, y: 212, s: 0.95 })] } });
  add('hedgewitch', { name: 'Marn the Hedge-Witch', type: 'ally', cost: 3, atk: 2, hp: 3, race: 'Human', rarity: 'u', kw: ['unique'], text: 'When Marn enters play, heal 3 damage from your most wounded hero.', onEnter: async (E, c) => { const h = E.mostWounded(); if (h) await E.heal(E.heroT(h), 3); }, flavor: 'She charges in eggs and gossip.', art: { s: 'grove', L: [fig({ pose: 'staff', w: 'staff', robe: 1, helm: 'wizard', glowL: '#b0ff8a', wGlow: '#b0ff8a', x: 150, y: 210, s: 0.9 })] } });
  add('treant', { name: 'Ironbark Treant', type: 'ally', cost: 5, atk: 3, hp: 7, kw: ['protector'], race: 'Treant', rarity: 'u', flavor: 'Older than the oath. Slower to anger. Impossible to fell.', art: { s: 'grove', L: [['beast', { t: 'treant', x: 150, y: 212, s: 0.82, eye: '#e8ff9a' }]] } });
  add('drakeling', { name: 'Emberwing Drakeling', type: 'ally', cost: 3, atk: 4, hp: 5, kw: ['ferocity', 'longrange'], race: 'Dragonkin', flavor: 'Its breath reaches farther than its wings.', art: { s: 'volcano', L: [['dragon', { x: 150, y: 140, s: 0.55, breath: 1 }]] } });
  add('gryphon', { name: 'Skyreach Gryphon', type: 'ally', cost: 5, atk: 4, hp: 5, kw: ['ferocity'], race: 'Beast', rarity: 'u', flavor: 'The peaks belong to whoever can reach them.', art: { s: 'peaks', img: 'gryphon', L: [['beast', { t: 'gryphon', x: 150, y: 200, s: 1.05 }]] } });
  add('packleader', { name: 'Grey Wolf Packleader', type: 'ally', cost: 2, atk: 4, hp: 3, kw: ['ferocity', 'protector'], race: 'Beast', flavor: 'Where one howls, ten answer.', art: { s: 'forest', L: [['beast', { t: 'wolf', x: 140, y: 208, s: 1.15, shadow: 70 }]] } });
  add('sentinel', { name: 'Runeforged Sentinel', type: 'ally', cost: 6, atk: 4, hp: 8, kw: ['protector'], race: 'Construct', rarity: 'r', text: 'Takes 1 less damage from every source.', armorAlly: 1, flavor: 'The runes on its chest spell a single word: Stand.', art: { s: 'temple', L: [['beast', { t: 'golem', x: 150, y: 212, s: 0.95, eye: '#9ad8ff' }]], pal: { glow: '#7ad0ff' } } });
  add('barrowspirit', { name: 'Spirit of the Barrow', type: 'ally', cost: 1, atk: 1, hp: 4, kw: ['elusive'], race: 'Spirit', text: 'At the start of your turn, heal 1 damage from your hero.', start: async (E, p) => E.heal(E.heroT(p), 1), flavor: 'It guards the bones of kings who no longer need guarding.', art: { s: 'crypt', L: [fig({ pose: 'pray', robe: 1, helm: 'crown', spectral: '#9affd8', aura: true, auraOp: 0.6, x: 150, y: 196, s: 0.9, glowL: '#c8ffe8' })] } });
  add('mistranger', { name: 'Mistwood Ranger', type: 'ally', cost: 2, atk: 2, hp: 4, kw: ['longrange'], race: 'Elf', flavor: 'You will hear the arrow. You will not hear her.', art: { s: 'forest', L: [fig({ race: 'elf', pose: 'aim', w: 'bow', helm: 'hood', cape: 1, x: 130, y: 210, s: 0.92 })] } });
  add('bram', { name: 'Old Bram, Tavernkeep', type: 'ally', cost: 1, atk: 1, hp: 2, race: 'Human', kw: ['unique'], text: 'When Bram enters play, draw a card.', onEnter: async (E, c) => E.draw(c.p, 1), flavor: '"Rumor\'s on the house. Ale is not."', art: { s: 'tavern', L: [fig({ pose: 'stand', beard: 1, w: 'mace', x: 120, y: 212, s: 0.95, raceOver: { w: 1.25 } })] } });
  add('cavebear', { name: 'Cave Bear', type: 'ally', cost: 4, atk: 4, hp: 6, kw: ['protector'], race: 'Beast', flavor: 'It was here first.', art: { s: 'peaks', L: [['beast', { t: 'bear', x: 150, y: 206, s: 1.1, shadow: 80 }]] } });
  add('revenant', { name: 'Soulbound Revenant', type: 'ally', cost: 3, atk: 5, hp: 4, kw: ['protector'], race: 'Undead', rarity: 'u', text: 'When this ally is destroyed, deal 3 damage to a random enemy.', onDeath: async (E, c) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 3, { p: c.p, kind: 'effect' }); }, flavor: 'Oathbound past death, and annoyed about it.', art: { s: 'crypt', L: [fig({ race: 'skeleton', pose: 'charge', w: 'sword', off: 'round', helm: 'great', plume: false, eye: '#7affc8', wGlow: '#5affb0', x: 150, y: 210, s: 0.92 })] } });

  // ---------- Concord allies ----------
  add('footman', { name: 'Silverguard Footman', type: 'ally', cost: 1, atk: 1, hp: 3, fac: 'concord', kw: ['protector'], race: 'Human', flavor: 'First to the wall. Last to leave it.', art: { s: 'castle', L: [fig({ pose: 'stand', w: 'polearm', off: 'tower', wA: 0, helm: 'great', plume: false, pauld: 'plate', emblem: GOLD, x: 150, y: 210, s: 0.9 })] } });
  add('lionknight', { name: 'Lionheart Knight', type: 'ally', cost: 4, atk: 3, hp: 5, fac: 'concord', kw: ['protector'], race: 'Human', rarity: 'u', text: 'When this enters play, prevent the next 3 damage to your hero.', onEnter: async (E, c) => E.shield(c.p, 3), flavor: '"For the Concord, and the people behind it."', art: { s: 'castle', L: [fig({ pose: 'heroic', w: 'sword', off: 'shield', helm: 'great', cape: 1, capeCol: '#1a2a5a', pauld: 'plate', emblem: GOLD, x: 150, y: 210, s: 0.9 })] } });
  add('battlemage', { name: 'Concord Battlemage', type: 'ally', cost: 2, atk: 3, hp: 4, kw: ['protector', 'skyward'], fac: 'concord', race: 'Human', target: 'enemy', text: 'When this enters play, deal 2 damage to an enemy.', onEnter: async (E, c) => { if (c.target) await E.dmg(c.target, 2, { p: c.p, kind: 'spell' }); }, flavor: 'Trained to fight in formation. Prefers to fight in fire.', art: { s: 'arcane', L: [fig({ pose: 'castF', w: 'wand', robe: 1, helm: 'hood', glowR: '#ffb060', x: 130, y: 210, s: 0.92, capeCol: '#1a2a5a', cape: 1 })] } });
  add('elowen', { name: 'Sister Elowen', type: 'ally', cost: 3, atk: 1, hp: 4, fac: 'concord', race: 'Human', kw: ['unique'], rarity: 'u', text: 'At the start of your turn, heal 2 damage from your hero.', start: async (E, p) => E.heal(E.heroT(p), 2), flavor: '"Hold still. This will only hurt the darkness."', art: { s: 'temple', L: [['fx', { t: 'holy', x: 150, y2: 200 }], fig({ pose: 'pray', robe: 1, helm: 'hood', glowL: '#fff2b0', x: 150, y: 206, s: 0.9 })] } });
  add('crossbowman', { name: 'Ironhold Crossbowman', type: 'ally', cost: 2, atk: 3, hp: 4, fac: 'concord', kw: ['longrange'], race: 'Dwarf', flavor: 'Reload. Grumble. Repeat.', art: { s: 'peaks', L: [fig({ race: 'dwarf', pose: 'aim', w: 'crossbow', helm: 'great', plume: false, x: 140, y: 210, s: 1.0 })] } });
  add('thalen', { name: 'Highwarden Thalen', type: 'ally', cost: 5, atk: 4, hp: 4, fac: 'concord', kw: ['unique', 'ferocity', 'longrange'], race: 'Elf', rarity: 'r', flavor: 'He counts arrows the way misers count gold.', art: { s: 'forest', L: [fig({ race: 'elf', pose: 'aim', w: 'bow', helm: 'hair', cape: 1, capeCol: '#1a3a2a', wGlow: '#bfffe0', x: 128, y: 210, s: 0.95 })], pal: { glow: '#9affd0' } } });

  // ---------- Clans allies ----------
  add('grunt', { name: 'Bloodfang Grunt', type: 'ally', cost: 1, atk: 2, hp: 2, fac: 'clans', kw: ['ferocity', 'protector'], race: 'Orc', flavor: 'Point him at something. Anything.', art: { s: 'steppe', L: [fig({ race: 'orc', pose: 'charge', w: 'axe', helm: 'mohawk', x: 140, y: 210, s: 0.9 })] } });
  add('earthwarden', { name: 'Stonehoof Earthwarden', type: 'ally', cost: 5, atk: 3, hp: 7, fac: 'clans', kw: ['protector'], race: 'Minotaur', rarity: 'u', flavor: 'The ground does not move. Neither does he.', art: { s: 'storm', L: [fig({ race: 'minotaur', pose: 'stand', w: 'hammer', off: 'round', wA: 160, pauld: 'fur', x: 150, y: 210, s: 0.86 })] } });
  add('tinkerer', { name: 'Ashborn Tinkerer', type: 'ally', cost: 2, atk: 1, hp: 3, fac: 'clans', race: 'Goblin', text: 'When this enters play, draw a card, then deal 1 damage to a random enemy.', onEnter: async (E, c) => { await E.draw(c.p, 1); const t = E.randomEnemy(); if (t) await E.dmg(t, 1, { p: c.p, kind: 'effect' }); }, flavor: 'Most of her inventions explode. On purpose, she insists.', art: { s: 'forge', L: [fig({ race: 'goblin', pose: 'castF', w: 'wand', helm: 'great', plume: false, glowR: '#ffb040', x: 140, y: 210, s: 1.1, eye: '#ffd060' })] } });
  add('raider', { name: 'Skullsplitter Raider', type: 'ally', cost: 2, atk: 5, hp: 3, fac: 'clans', kw: ['ferocity', 'protector'], race: 'Orc', flavor: 'Fast, loud, and briefly alive.', art: { s: 'steppe', L: [fig({ race: 'orc', pose: 'heroic', w: 'battleaxe', helm: 'horned', pauld: 'spiked', x: 150, y: 214, s: 0.85 })] } });
  add('windcaller', { name: 'Windcaller Shaman', type: 'ally', cost: 2, atk: 3, hp: 5, kw: ['skyward'], fac: 'clans', race: 'Minotaur', text: 'At the start of your turn, deal 1 damage to a random enemy.', start: async (E, p) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 1, { p, kind: 'effect' }); }, flavor: 'She speaks, and the sky answers in thunder.', art: { s: 'storm', L: [['fx', { t: 'bolt', x1: 200, y1: 0, x2: 168, y2: 70 }], fig({ race: 'minotaur', pose: 'cast', robe: 1, glowL: '#bfe0ff', glowR: '#bfe0ff', x: 150, y: 212, s: 0.8 })] } });
  add('wolfrider', { name: 'Bloodmoon Wolfrider', type: 'ally', cost: 3, atk: 4, hp: 6, fac: 'clans', kw: ['ferocity'], race: 'Orc', flavor: 'The wolf picks the target. The orc just agrees.', art: { s: 'steppe', L: [fig({ race: 'orc', pose: 'heroic', w: 'axe', x: 132, y: 176, s: 0.62, shadow: false, skirt: false, aura: false }), ['beast', { t: 'wolf', x: 150, y: 208, s: 1.1, eye: '#ff6a3a', tone: '#6e6466' }], ['obj', { t: 'saddle', x: 128, y: 130 }]] } });
  add('gorza', { name: 'Gorza the Unbowed', type: 'ally', cost: 6, atk: 5, hp: 6, fac: 'clans', kw: ['unique', 'protector', 'ferocity'], race: 'Orc', rarity: 'r', flavor: 'Seven sieges. Seven victories. One very large axe.', art: { s: 'steppe', L: [fig({ race: 'orc', pose: 'heroic', w: 'battleaxe', off: 'round', helm: 'horned', pauld: 'spiked', cape: 1, capeCol: '#4a0a08', wGlow: '#ff6a3a', x: 150, y: 214, s: 0.85 })] } });
  add('witchdoctor', { name: 'Clan Witchdoctor', type: 'ally', cost: 2, atk: 1, hp: 3, fac: 'clans', race: 'Orc', text: 'When this enters play, heal 3 damage from your most wounded hero.', onEnter: async (E, c) => { const h = E.mostWounded(); if (h) await E.heal(E.heroT(h), 3); }, flavor: 'Bones, herbs, and a very confident tone of voice.', art: { s: 'steppe', L: [fig({ race: 'orc', pose: 'staff', w: 'totem', skirt: true, glowL: '#9aff6a', x: 150, y: 212, s: 0.86 })] } });

  // ---------- Paladin ----------
  add('holystrike', { name: 'Holy Strike', type: 'ability', speed: 'basic', cost: 1, cls: ['paladin'], target: 'enemy', tags: ['dmg', 'heal'], dmg: 3, text: 'Deal 3 damage to an enemy. Heal 2 damage from your hero.', run: async (E, c) => { await E.dmg(c.target, 3, { p: c.p, kind: 'spell' }); await E.heal(E.heroT(c.p), 2); }, art: { s: 'holy', L: [fig({ pose: 'heroic', w: 'hammer', helm: 'great', wGlow: '#fff6c0', x: 140, y: 210, s: 0.9, pauld: 'plate' }), ['fx', { t: 'sparkle', n: 8 }]] } });
  add('aegis', { name: 'Divine Aegis', type: 'ability', speed: 'instant', react: 'friendHero', cost: 2, cls: ['paladin'], target: 'friendlyHero', tags: ['shield'], shield: 6, text: 'Prevent the next 6 damage to a friendly hero.', run: async (E, c) => E.shield(c.target.p, 6), art: { s: 'holy', L: [fig({ pose: 'pray', helm: 'great', plume: false, pauld: 'plate', x: 150, y: 196, s: 0.85 }), ['fx', { t: 'barrier', r: 95, c: '#fff2b0' }]] } });
  add('challenge', { name: 'Righteous Challenge', type: 'ability', speed: 'basic', cost: 1, cls: ['paladin'], target: 'none', tags: ['taunt', 'shield'], shield: 3, text: 'Taunt: the boss and its minions must attack your hero until your next turn. Prevent the next 3 damage to your hero.', run: async (E, c) => { E.taunt(c.p); E.shield(c.p, 3); }, art: { s: 'castle', L: [['fx', { t: 'shout', x: 150, y: 110 }], fig({ pose: 'heroic', w: 'sword', off: 'shield', helm: 'great', cape: 1, x: 150, y: 210, s: 0.88 })] } });
  add('consecration', { name: 'Consecration', type: 'ability', speed: 'basic', cost: 3, cls: ['paladin'], target: 'none', tags: ['aoe'], dmg: 2, rarity: 'u', text: 'Deal 2 damage to each enemy.', run: async (E, c) => { for (const t of E.aoe(E.enemies(), 2)) await E.dmg(t, 2, { p: c.p, kind: 'spell' }); }, art: { s: 'temple', L: [['fx', { t: 'runes', x: 150, y: 190, r: 120, c: '#ffe080' }], fig({ pose: 'pray', w: 'hammer', helm: 'great', x: 150, y: 200, s: 0.8 })] } });
  add('blessing', { name: 'Blessing of Might', type: 'ability', speed: 'basic', cost: 2, cls: ['paladin'], target: 'ally', tags: ['buff'], text: 'Give a friendly ally +2 ATK and +2 health permanently.', run: async (E, c) => E.buffAlly(c.target, 2, 2), art: { s: 'holy', L: [['fx', { t: 'buff', x: 150, y: 150 }], fig({ pose: 'cast', helm: 'great', x: 150, y: 206, s: 0.85, glowL: '#ffe890', glowR: '#ffe890' })] } });
  add('reckoning', { name: 'Light\'s Reckoning', type: 'ability', speed: 'basic', cost: 5, cls: ['paladin'], target: 'enemy', tags: ['dmg', 'heal'], dmg: 8, rarity: 'r', text: 'Deal 8 damage to an enemy. Heal 4 damage from your hero.', run: async (E, c) => { await E.dmg(c.target, 8, { p: c.p, kind: 'spell' }); await E.heal(E.heroT(c.p), 4); }, art: { s: 'holy', L: [['fx', { t: 'holy', x: 150, wings: 1, wy: 110 }], fig({ pose: 'heroic', w: 'greatsword', helm: 'great', cape: 1, wGlow: '#fff4c0', x: 150, y: 210, s: 0.85 })] } });

  // ---------- Warrior ----------
  add('mortalstrike', { name: 'Mortal Strike', type: 'ability', speed: 'basic', cost: 2, cls: ['warrior'], target: 'enemy', tags: ['dmg'], dmg: 4, text: 'Deal 4 damage to an enemy. If your hero has a weapon, deal 6 instead.', run: async (E, c) => E.dmg(c.target, c.p.weapon ? 6 : 4, { p: c.p, kind: 'spell' }), art: { s: 'steppe', L: [['fx', { t: 'slash', x: 210, y: 100, c: '#ff4a2a' }], fig({ race: 'orc', pose: 'charge', w: 'greatsword', helm: 'horned', x: 130, y: 210, s: 0.88, wGlow: '#ff6a3a' })] } });
  add('shieldwall', { name: 'Shield Wall', type: 'ability', speed: 'instant', react: 'hero', cost: 3, cls: ['warrior'], target: 'none', tags: ['shield'], shield: 8, text: 'Prevent the next 8 damage to your hero.', run: async (E, c) => E.shield(c.p, 8), art: { s: 'castle', L: [fig({ race: 'dwarf', pose: 'stand', off: 'tower', oA: 0, w: 'axe', helm: 'great', plume: false, x: 150, y: 210, s: 1.0, emblem: GOLD }), ['fx', { t: 'barrier', r: 80, c: '#ffd890' }]] } });
  add('battleshout', { name: 'Battle Shout', type: 'ability', speed: 'basic', cost: 1, cls: ['warrior'], target: 'none', tags: ['draw', 'buff'], text: 'Your hero and allies get +1 ATK this turn. Draw a card.', run: async (E, c) => { E.tempAtk(c.p, 1); E.allyTempAtk(c.p, 1); await E.draw(c.p, 1); }, art: { s: 'steppe', L: [['fx', { t: 'shout', x: 150, y: 90, c: '#ffb070' }], fig({ race: 'orc', pose: 'cast', helm: 'mohawk', pauld: 'spiked', x: 150, y: 210, s: 0.86 })] } });
  add('whirlwind', { name: 'Whirlwind', type: 'ability', speed: 'basic', cost: 3, cls: ['warrior'], target: 'none', tags: ['aoe'], dmg: 3, rarity: 'u', text: 'Deal 3 damage to each enemy minion and 2 damage to the boss.', run: async (E, c) => { for (const t of E.aoe(E.minions(), 3, 4)) await E.dmg(t, 3, { p: c.p, kind: 'spell' }); await E.dmg(E.bossT(), 2, { p: c.p, kind: 'spell' }); }, art: { s: 'steppe', L: [['fx', { t: 'whirl', x: 150, y: 140, c: '#ffc090' }], fig({ race: 'orc', pose: 'dual', w: 'axe', off: 'axe', x: 150, y: 210, s: 0.86 })] } });
  add('taunt', { name: 'Taunting Roar', type: 'ability', speed: 'basic', cost: 1, cls: ['warrior'], target: 'none', tags: ['taunt', 'draw'], text: 'Taunt: the boss and its minions must attack your hero until your next turn. Draw a card.', run: async (E, c) => { E.taunt(c.p); await E.draw(c.p, 1); }, art: { s: 'storm', L: [['fx', { t: 'shout', x: 160, y: 100 }], fig({ race: 'orc', pose: 'heroic', w: 'axe', off: 'round', helm: 'horned', x: 150, y: 210, s: 0.86 })] } });
  add('execute', { name: 'Execute', type: 'ability', speed: 'basic', cost: 3, cls: ['warrior'], target: 'enemy', tags: ['dmg'], dmg: 4, rarity: 'u', text: 'Deal 4 damage to an enemy. If it is at half health or less, deal 10 instead.', run: async (E, c) => E.dmg(c.target, E.hpOf(c.target) * 2 <= E.maxHpOf(c.target) ? 10 : 4, { p: c.p, kind: 'spell' }), art: { s: 'volcano', L: [fig({ race: 'orc', pose: 'heroic', w: 'battleaxe', helm: 'mohawk', wGlow: '#ff3a1a', x: 150, y: 214, s: 0.86 }), ['fx', { t: 'slash', x: 160, y: 120, c: '#ff2a1a' }]] } });

  add('bloodthirst', { name: 'Bloodthirst', type: 'ability', speed: 'basic', cost: 2, cls: ['warrior'], target: 'enemy', tags: ['dmg', 'heal'], dmg: 3, text: 'Deal 3 damage to an enemy. Heal damage from your hero equal to the damage dealt.', run: async (E, c) => { const d = await E.dmg(c.target, 3, { p: c.p, kind: 'spell' }); await E.heal(E.heroT(c.p), d); }, art: { s: 'volcano', L: [fig({ race: 'orc', pose: 'charge', w: 'axe', helm: 'mohawk', wGlow: '#ff2a2a', x: 140, y: 210, s: 0.88, auraCol: '#ff2a2a', auraOp: 0.6 })] } });

  // ---------- Mage ----------
  add('fireball', { name: 'Fireball', type: 'ability', speed: 'basic', cost: 2, cls: ['mage'], target: 'enemy', tags: ['dmg'], dmg: 4, text: 'Deal 4 damage to an enemy.', run: D(4), flavor: 'The oldest spell. Still the most persuasive.', art: { s: 'void', L: [['fx', { t: 'fireball', x: 200, y: 92, ang: 28 }], fig({ race: 'elf', pose: 'castF', robe: 1, helm: 'hair', glowR: '#ff9a3a', x: 80, y: 214, s: 0.7 })] } });
  add('frostnova', { name: 'Frost Nova', type: 'ability', speed: 'instant', cost: 2, cls: ['mage'], target: 'none', tags: ['stunAll'], text: 'Deal 1 damage to each enemy minion. They can\'t attack during the next boss turn.', run: async (E, c) => { for (const t of E.aoe(E.minions(), 1)) { await E.dmg(t, 1, { p: c.p, kind: 'spell' }); E.stun(t); } }, art: { s: 'frost', L: [fig({ race: 'elf', pose: 'cast', robe: 1, helm: 'hair', glowL: '#bff4ff', glowR: '#bff4ff', x: 150, y: 206, s: 0.82 }), ['fx', { t: 'frost', x: 150, y: 180, s: 1.1 }]] } });
  add('missiles', { name: 'Arcane Missiles', type: 'ability', speed: 'basic', cost: 1, cls: ['mage'], target: 'none', tags: ['dmgRandom'], dmg: 3, text: 'Deal 1 damage to a random enemy three times.', run: async (E, c) => { for (let i = 0; i < 3; i++) { const t = E.randomEnemy(); if (t) await E.dmg(t, 1, { p: c.p, kind: 'spell' }); } }, art: { s: 'arcane', L: [['fx', { t: 'meteors', n: 4, c: '#c890ff' }], ['fx', { t: 'runes', x: 90, y: 170, r: 50 }], fig({ race: 'elf', pose: 'castF', robe: 1, helm: 'hood', glowR: '#d0a0ff', x: 90, y: 210, s: 0.72 })] } });
  add('blizzard', { name: 'Blizzard', type: 'ability', speed: 'basic', cost: 4, cls: ['mage'], target: 'none', tags: ['aoe'], dmg: 3, rarity: 'u', text: 'Deal 3 damage to each enemy.', run: async (E, c) => { for (const t of E.aoe(E.enemies(), 3)) await E.dmg(t, 3, { p: c.p, kind: 'spell' }); }, art: { s: 'frost', p: 'snow', pn: 60, L: [['fx', { t: 'frost', x: 80, y: 60, s: 0.6 }], ['fx', { t: 'frost', x: 220, y: 90, s: 0.7 }], ['fx', { t: 'frost', x: 150, y: 150, s: 0.5 }]] } });
  add('pyroblast', { name: 'Pyroblast', type: 'ability', speed: 'basic', cost: 6, cls: ['mage'], target: 'enemy', tags: ['dmg'], dmg: 10, rarity: 'r', text: 'Deal 10 damage to an enemy.', run: D(10), art: { s: 'volcano', L: [['fx', { t: 'fireball', x: 170, y: 104, ang: 10, s: 1.5 }], fig({ race: 'human', pose: 'cast', robe: 1, helm: 'wizard', glowL: '#ffb040', glowR: '#ffb040', x: 70, y: 214, s: 0.62 })] } });
  add('manasurge', { name: 'Mana Surge', type: 'ability', speed: 'basic', cost: 0, cls: ['mage'], target: 'none', tags: ['ramp'], text: 'Gain 2 extra resources this turn.', run: async (E, c) => E.gainRes(c.p, 2), art: { s: 'arcane', L: [['fx', { t: 'runes', x: 150, y: 120, r: 90, flat: 1, c: '#9ad0ff' }], ['obj', { t: 'shard', x: 150, y: 120, s: 0.9, col: '#9ad0ff' }]] } });
  add('polymorph', { name: 'Polymorph', type: 'ability', speed: 'basic', cost: 3, cls: ['mage'], target: 'minion', tags: ['removal'], rarity: 'u', text: 'Transform an enemy minion into a 0/1 Sheep with no abilities.', run: async (E, c) => E.transform(c.target, 'sheep'), flavor: 'Baa.', art: { s: 'forest', L: [['beast', { t: 'sheep', x: 150, y: 200, s: 1.3 }], ['fx', { t: 'sparkle', n: 14, c: '#e6d0ff' }]] } });

  add('icebarrier', { name: 'Ice Barrier', type: 'ability', speed: 'instant', react: 'hero', cost: 2, cls: ['mage'], target: 'none', tags: ['shield'], shield: 6, text: 'Prevent the next 6 damage to your hero.', run: async (E, c) => E.shield(c.p, 6), art: { s: 'frost', L: [fig({ race: 'elf', pose: 'pray', robe: 1, helm: 'hair', x: 150, y: 196, s: 0.85 }), ['fx', { t: 'ice', x: 150, y: 198 }], ['fx', { t: 'barrier', r: 84, c: '#bff4ff' }]] } });

  // ---------- Priest ----------
  add('mend', { name: 'Mend Wounds', type: 'ability', speed: 'instant', react: 'friend', cost: 1, cls: ['priest'], target: 'friendly', tags: ['heal'], heal: 5, text: 'Heal 5 damage from a friendly hero or ally.', run: async (E, c) => E.heal(c.target, 5), art: { s: 'grove', L: [['fx', { t: 'heal', x: 150, y: 140, leaves: 1 }], fig({ race: 'minotaur', pose: 'pray', robe: 1, glowL: '#b0ff9a', x: 150, y: 210, s: 0.8 })] } });
  add('warding', { name: 'Word of Warding', type: 'ability', speed: 'instant', react: 'friendHero', cost: 2, cls: ['priest'], target: 'friendlyHero', tags: ['shield', 'draw'], shield: 5, text: 'Prevent the next 5 damage to a friendly hero. Draw a card.', run: async (E, c) => { E.shield(c.target.p, 5); await E.draw(c.p, 1); }, art: { s: 'holy', L: [fig({ pose: 'stand', robe: 1, helm: 'hood', x: 150, y: 196, s: 0.85 }), ['fx', { t: 'barrier', r: 70, c: '#fff6c0' }], ['fx', { t: 'runes', x: 150, y: 196, r: 80 }]] } });
  add('smite', { name: 'Smite', type: 'ability', speed: 'basic', cost: 2, cls: ['priest'], target: 'enemy', tags: ['dmg', 'heal'], dmg: 3, text: 'Deal 3 damage to an enemy. Heal 3 damage from your hero.', run: async (E, c) => { await E.dmg(c.target, 3, { p: c.p, kind: 'spell' }); await E.heal(E.heroT(c.p), 3); }, art: { s: 'storm', L: [['fx', { t: 'bolt', x1: 180, y1: 0, x2: 200, y2: 180, fork: 1 }], fig({ race: 'minotaur', pose: 'castF', robe: 1, glowR: '#dff0ff', x: 110, y: 214, s: 0.75 })] } });
  add('renewal', { name: 'Prayer of Renewal', type: 'ability', speed: 'basic', cost: 3, cls: ['priest'], target: 'none', tags: ['healAll'], heal: 4, rarity: 'u', text: 'Heal 4 damage from each friendly hero and ally.', run: async (E, c) => { for (const t of E.friendlyChars()) await E.heal(t, 4); }, art: { s: 'temple', L: [['fx', { t: 'heal', x: 150, y: 140, c: '#ffe890', cross: 1 }], fig({ pose: 'cast', robe: 1, helm: 'hood', glowL: '#fff2b0', glowR: '#fff2b0', x: 150, y: 210, s: 0.8 })] } });
  add('rebirth', { name: 'Rebirth', type: 'ability', speed: 'basic', cost: 4, cls: ['priest'], target: 'deadHero', tags: ['revive'], rarity: 'r', text: 'Return a defeated hero to the fight with 12 health.', run: async (E, c) => E.revive(c.target.p, 12), art: { s: 'holy', L: [['fx', { t: 'holy', x: 150, wings: 1, wy: 120 }], fig({ pose: 'pray', robe: 1, spectral: '#fff6d0', x: 150, y: 196, s: 0.85, aura: true })] } });
  add('stormlash', { name: 'Storm Lash', type: 'ability', speed: 'basic', cost: 3, cls: ['priest'], target: 'enemy', tags: ['dmg', 'healAll'], dmg: 5, text: 'Deal 5 damage to an enemy. Heal 2 damage from each friendly hero.', run: async (E, c) => { await E.dmg(c.target, 5, { p: c.p, kind: 'spell' }); for (const h of E.heroes()) await E.heal(E.heroT(h), 2); }, art: { s: 'storm', L: [['fx', { t: 'bolt', x1: 60, y1: 0, x2: 220, y2: 160 }], ['fx', { t: 'bolt', x1: 260, y1: 0, x2: 210, y2: 150 }], fig({ race: 'minotaur', pose: 'cast', robe: 1, glowL: '#bfe0ff', glowR: '#bfe0ff', x: 90, y: 214, s: 0.7 })] } });

  add('ancestralwrath', { name: 'Wrath of the Ancestors', type: 'ability', speed: 'basic', cost: 4, cls: ['priest'], target: 'enemy', tags: ['dmg', 'heal'], dmg: 6, rarity: 'u', text: 'Deal 6 damage to an enemy. Heal 3 damage from your hero.', run: async (E, c) => { await E.dmg(c.target, 6, { p: c.p, kind: 'spell' }); await E.heal(E.heroT(c.p), 3); }, art: { s: 'storm', L: [['wisps', { x: 150, y: 90, w: 220, h: 60, n: 8, c: '#bfe0ff' }], fig({ race: 'minotaur', pose: 'cast', spectral: '#9ac8ff', x: 150, y: 150, s: 0.7, shadow: false }), fig({ race: 'minotaur', pose: 'staff', w: 'totem', robe: 1, x: 150, y: 214, s: 0.7 })] } });

  // ---------- Rogue ----------
  add('backstab', { name: 'Backstab', type: 'ability', speed: 'basic', cost: 0, cls: ['rogue'], target: 'enemy', tags: ['dmg'], dmg: 2, text: 'Deal 2 damage to an enemy. If your hero has a dagger, deal 4 instead.', run: async (E, c) => E.dmg(c.target, c.p.weapon && C[c.p.weapon.c.id].wtype === 'dagger' ? 4 : 2, { p: c.p, kind: 'spell' }), art: { s: 'rooftops', L: [fig({ race: 'goblin', pose: 'crouch', w: 'dagger', helm: 'hood', wGlow: '#ff4a6a', x: 150, y: 210, s: 1.1, eye: '#ffd060' })] } });
  add('poisonblades', { name: 'Poisoned Blades', type: 'ability', speed: 'basic', cost: 1, cls: ['rogue'], target: 'none', tags: ['buff'], text: 'Your hero gets +3 ATK until end of turn.', run: async (E, c) => E.tempAtk(c.p, 3), art: { s: 'altar', pal: { light: '#b0ff8a', glow: '#8aff5a' }, L: [['obj', { t: 'daggers', x: 150, y: 110, glow: '#8aff5a', venom: '#8aff5a' }]] } });
  add('evasion', { name: 'Evasion', type: 'ability', speed: 'instant', react: 'hero', cost: 1, cls: ['rogue'], target: 'none', tags: ['elusive'], text: 'Your hero is Shrouded until your next turn.', run: async (E, c) => E.elusive(c.p), art: { s: 'rooftops', L: [['fx', { t: 'shadow', x: 150, y: 140, c: '#6a5aff' }], fig({ race: 'goblin', pose: 'crouch', w: 'dagger', off: 'dagger', helm: 'hood', spectral: '#8a7aff', x: 150, y: 206, s: 1.05 })] } });
  add('fanknives', { name: 'Fan of Knives', type: 'ability', speed: 'basic', cost: 2, cls: ['rogue'], target: 'none', tags: ['aoeMinion', 'draw'], dmg: 2, text: 'Deal 2 damage to each enemy minion. Draw a card.', run: async (E, c) => { for (const t of E.aoe(E.minions(), 2)) await E.dmg(t, 2, { p: c.p, kind: 'spell' }); await E.draw(c.p, 1); }, art: { s: 'rooftops', L: [['fx', { t: 'shadow', x: 150, y: 110, daggers: 7, c: '#9a8aff' }], fig({ race: 'goblin', pose: 'dual', helm: 'hood', x: 150, y: 210, s: 1.05 })] } });
  add('ambush', { name: 'Ambush', type: 'ability', speed: 'basic', cost: 3, cls: ['rogue'], target: 'enemy', tags: ['dmg'], dmg: 6, rarity: 'u', text: 'Deal 6 damage to an enemy.', run: D(6), art: { s: 'forest', L: [fig({ race: 'goblin', pose: 'charge', w: 'dagger', off: 'dagger', helm: 'hood', x: 170, y: 150, s: 0.9, rot: 0, eye: '#ffd060' }), ['fx', { t: 'slash', x: 120, y: 160, c: '#c0a0ff' }]] } });
  add('pickpocket', { name: 'Pickpocket', type: 'ability', speed: 'basic', cost: 1, cls: ['rogue'], target: 'none', tags: ['draw'], text: 'Draw 2 cards.', run: async (E, c) => E.draw(c.p, 2), art: { s: 'tavern', L: [fig({ race: 'goblin', pose: 'castF', helm: 'hood', x: 120, y: 212, s: 1.1, eye: '#ffd060' }), ['obj', { t: 'coin', x: 210, y: 120, s: 0.5 }], ['obj', { t: 'coin', x: 230, y: 140, s: 0.4 }]] } });
  add('kidneyshot', { name: 'Kidney Shot', type: 'ability', speed: 'instant', cost: 2, cls: ['rogue'], target: 'enemy', tags: ['stun'], text: 'Stun an enemy. A stunned minion can\'t attack next boss turn; a stunned boss skips its next strike.', run: async (E, c) => E.stun(c.target), art: { s: 'rooftops', L: [['fx', { t: 'sparkle', n: 8, c: '#ffe080' }], fig({ race: 'goblin', pose: 'charge', w: 'mace', helm: 'hood', x: 150, y: 210, s: 1.05 })] } });

  add('recuperate', { name: 'Recuperate', type: 'ability', speed: 'basic', cost: 2, cls: ['rogue'], target: 'none', tags: ['selfheal', 'draw'], heal: 6, text: 'Heal 6 damage from your hero. Draw a card.', run: async (E, c) => { await E.heal(E.heroT(c.p), 6); await E.draw(c.p, 1); }, art: { s: 'tavern', L: [fig({ race: 'goblin', pose: 'pray', helm: 'hood', x: 150, y: 212, s: 1.1, eye: '#ffd060' }), ['fx', { t: 'heal', x: 150, y: 150, c: '#ffd890' }]] } });

  // ---------- Ranger ----------
  add('aimedshot', { name: 'Aimed Shot', type: 'ability', speed: 'basic', cost: 2, cls: ['ranger'], target: 'enemy', tags: ['dmg'], dmg: 4, text: 'Deal 4 damage to an enemy. If your hero has a bow or crossbow, deal 5 instead.', run: async (E, c) => E.dmg(c.target, c.p.weapon && ['bow', 'crossbow'].includes(C[c.p.weapon.c.id].wtype) ? 5 : 4, { p: c.p, kind: 'spell' }), art: { s: 'peaks', L: [fig({ race: 'dwarf', pose: 'aim', w: 'bow', wGlow: '#ffe080', helm: 'horned', x: 130, y: 210, s: 1.0 })] } });
  add('multishot', { name: 'Multi-Shot', type: 'ability', speed: 'basic', cost: 3, cls: ['ranger'], target: 'none', tags: ['aoe'], dmg: 2, text: 'Deal 2 damage to each enemy.', run: async (E, c) => { for (const t of E.aoe(E.enemies(), 2)) await E.dmg(t, 2, { p: c.p, kind: 'spell' }); }, art: { s: 'castle', L: [['fx', { t: 'arrows', n: 12 }]] } });
  add('companion', { name: 'Call Companion', type: 'ability', speed: 'basic', cost: 2, cls: ['ranger'], target: 'none', tags: ['summon'], text: 'Summon a 2/2 Wolf Companion with Swift and Bulwark.', run: async (E, c) => E.summonAlly(c.p, 'wolfcomp', 1), art: { s: 'forest', L: [['beast', { t: 'wolf', x: 190, y: 206, s: 0.9, shadow: 60 }], fig({ race: 'dwarf', pose: 'stand', w: 'axe', helm: 'horned', x: 90, y: 210, s: 0.85 })] } });
  add('huntersmark', { name: 'Hunter\'s Mark', type: 'ability', speed: 'basic', cost: 1, cls: ['ranger'], target: 'none', tags: ['mark'], text: 'Until your next turn, the boss takes 2 extra damage from every source.', run: async (E, c) => E.mark(c.p, 2), art: { s: 'forest', L: [['fx', { t: 'runes', x: 150, y: 110, r: 60, flat: 1, c: '#ff5a3a' }], ['fx', { t: 'runes', x: 150, y: 110, r: 30, flat: 1, c: '#ffb090' }]] } });
  add('rapidfire', { name: 'Rapid Fire', type: 'ability', speed: 'basic', cost: 4, cls: ['ranger'], target: 'none', tags: ['dmgRandom'], dmg: 8, rarity: 'u', text: 'Deal 2 damage to a random enemy four times.', run: async (E, c) => { for (let i = 0; i < 4; i++) { const t = E.randomEnemy(); if (t) await E.dmg(t, 2, { p: c.p, kind: 'spell' }); } }, art: { s: 'storm', L: [['fx', { t: 'arrows', n: 8, ang: 8 }], fig({ race: 'dwarf', pose: 'aim', w: 'bow', helm: 'horned', x: 90, y: 210, s: 0.9 })] } });
  add('feigndeath', { name: 'Feign Death', type: 'ability', speed: 'instant', react: 'hero', cost: 1, cls: ['ranger'], target: 'none', tags: ['shield'], shield: 4, text: 'Prevent the next 4 damage to your hero.', run: async (E, c) => E.shield(c.p, 4), art: { s: 'forest', L: [fig({ race: 'dwarf', pose: 'crouch', helm: 'horned', x: 150, y: 210, s: 0.95, spectral: '#a0b0d0' })] } });

  // ---------- neutral abilities ----------
  add('bandage', { name: 'Linen Bandage', type: 'ability', speed: 'instant', react: 'friend', cost: 0, target: 'friendly', tags: ['heal'], heal: 3, text: 'Heal 3 damage from a friendly hero or ally.', art: { s: 'altar', L: [['obj', { t: 'scroll', x: 150, y: 120, s: 0.6 }], ['fx', { t: 'heal', x: 150, y: 120, c: '#ffe0b0' }]] }, run: async (E, c) => E.heal(c.target, 3) });
  add('battleplans', { name: 'Battle Plans', type: 'ability', speed: 'basic', cost: 2, target: 'none', tags: ['draw'], text: 'Draw 2 cards.', run: async (E, c) => E.draw(c.p, 2), art: { s: 'tavern', L: [['obj', { t: 'scroll', x: 150, y: 140, s: 1.1, candle: 1 }]] } });
  add('rally', { name: 'Rallying Cry', type: 'ability', speed: 'basic', cost: 2, target: 'none', tags: ['ready'], rarity: 'u', text: 'Ready all your allies. They get +1 ATK this turn.', run: async (E, c) => { E.readyAllies(c.p); E.allyTempAtk(c.p, 1); }, art: { s: 'castle', L: [['obj', { t: 'horn', x: 150, y: 110, s: 1.1 }], ['fx', { t: 'shout', x: 196, y: 70 }]] } });

  // ---------- weapons ----------
  add('silverblade', { name: 'Silverblade Longsword', type: 'weapon', wtype: 'sword', cost: 2, atk: 3, strike: 1, flavor: 'Forged in Silverhold, sharpened on regret.', art: { s: 'altar', L: [['obj', { t: 'sword', x: 150, y: 100, s: 0.9 }]] } });
  add('dawnbreaker', { name: 'Dawnbreaker', type: 'weapon', wtype: 'hammer', cost: 4, atk: 5, strike: 2, fac: 'concord', rarity: 'r', text: 'When your hero attacks with this, heal 2 damage from your hero.', onAttack: async (E, c) => E.heal(E.heroT(c.p), 2), art: { s: 'holy', L: [['obj', { t: 'hammer', x: 150, y: 100, s: 0.9 }]] } });
  add('cleaver', { name: 'Bloodtusk Cleaver', type: 'weapon', wtype: 'axe', cost: 2, atk: 3, strike: 1, flavor: 'Butcher\'s tool. Warlord\'s favorite.', art: { s: 'steppe', L: [['obj', { t: 'axe', x: 150, y: 110, s: 0.85, runes: '#ff4a2a' }]] } });
  add('skullreaver', { name: 'Skullreaver', type: 'weapon', wtype: 'axe', cost: 4, atk: 6, strike: 2, fac: 'clans', rarity: 'r', flavor: 'It has a name because it has a reputation.', art: { s: 'volcano', L: [['obj', { t: 'axe', x: 150, y: 104, s: 0.85, double: 1, skull: 1 }]] } });
  add('longbow', { name: 'Ashwood Longbow', type: 'weapon', wtype: 'bow', cost: 2, atk: 3, strike: 1, kw: ['longrange'], art: { s: 'forest', L: [['obj', { t: 'bowItem', x: 150, y: 110, s: 0.9 }]] } });
  add('crossbow', { name: 'Thunderclap Crossbow', type: 'weapon', wtype: 'crossbow', cost: 3, atk: 4, strike: 1, kw: ['longrange'], rarity: 'u', flavor: 'Dwarven engineering: loud, heavy, correct.', art: { s: 'storm', L: [['obj', { t: 'crossbowItem', x: 150, y: 110, s: 0.95 }]] } });
  add('emberstaff', { name: 'Staff of the Ember Moon', type: 'weapon', wtype: 'staff', cost: 3, atk: 2, strike: 1, spell: 1, rarity: 'u', text: 'Your spells and powers deal +1 damage.', art: { s: 'volcano', L: [['obj', { t: 'staffItem', x: 150, y: 120, s: 0.85, moon: 1 }]] } });
  add('sparkwand', { name: 'Wand of Kindled Sparks', type: 'weapon', wtype: 'wand', cost: 1, atk: 2, strike: 1, kw: ['longrange'], art: { s: 'arcane', L: [['obj', { t: 'wandItem', x: 150, y: 110, glow: '#ffb060' }]] } });
  add('twinfang', { name: 'Twinfang Daggers', type: 'weapon', wtype: 'dagger', cost: 1, atk: 2, strike: 0, flavor: 'One for each kidney.', art: { s: 'rooftops', L: [['obj', { t: 'daggers', x: 150, y: 110 }]] } });
  add('stiletto', { name: 'Venomkiss Stiletto', type: 'weapon', wtype: 'dagger', cost: 3, atk: 3, strike: 1, rarity: 'u', text: 'When your hero attacks with this, deal 2 damage to a random enemy.', onAttack: async (E, c) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 2, { p: c.p, kind: 'effect' }); }, art: { s: 'grove', L: [['obj', { t: 'daggers', x: 150, y: 110, single: 1, glow: '#8aff5a', venom: '#8aff5a' }]] } });
  add('earthmace', { name: 'Mace of the Earthmother', type: 'weapon', wtype: 'mace', cost: 2, atk: 2, strike: 1, text: 'When your hero attacks with this, heal 2 damage from your most wounded hero.', onAttack: async (E, c) => { const h = E.mostWounded(); if (h) await E.heal(E.heroT(h), 2); }, art: { s: 'grove', L: [['obj', { t: 'maceItem', x: 150, y: 110 }]] } });
  add('halberd', { name: 'Stormreach Halberd', type: 'weapon', wtype: 'polearm', cost: 3, atk: 4, strike: 1, rarity: 'u', text: 'When your hero attacks with this, deal 1 damage to each enemy minion.', onAttack: async (E, c) => { for (const t of E.aoe(E.minions(), 1)) await E.dmg(t, 1, { p: c.p, kind: 'effect' }); }, art: { s: 'storm', L: [['obj', { t: 'polearmItem', x: 150, y: 110, s: 0.9, lightning: 1 }]] } });

  // ---------- armor ----------
  add('breastplate', { name: 'Dawnforged Breastplate', type: 'armor', slot: 'chest', atype: 'plate', cost: 3, def: 3, use: 1, art: { s: 'forge', L: [['obj', { t: 'breastplate', x: 150, y: 110, emblem: '#ffd060' }]] } });
  add('ironhelm', { name: 'Helm of the Iron Vow', type: 'armor', slot: 'head', atype: 'plate', cost: 2, def: 2, use: 1, art: { s: 'castle', L: [['obj', { t: 'helm', x: 150, y: 110 }]] } });
  add('towershield', { name: 'Silverhold Tower Shield', type: 'armor', slot: 'shield', atype: 'shield', cost: 2, def: 3, use: 1, art: { s: 'castle', L: [['obj', { t: 'shieldItem', x: 150, y: 110 }]] } });
  add('wolfhide', { name: 'Wolfhide Jerkin', type: 'armor', slot: 'chest', atype: 'leather', cost: 2, def: 2, use: 0, art: { s: 'forest', L: [['obj', { t: 'breastplate', x: 150, y: 110, mat: 'leather', fur: 1 }]] } });
  add('wardenmail', { name: 'Wardens\' Chainmail', type: 'armor', slot: 'chest', atype: 'mail', cost: 3, def: 3, use: 1, art: { s: 'peaks', L: [['obj', { t: 'breastplate', x: 150, y: 110, mat: 'mail' }]] } });
  add('moonweave', { name: 'Enchanted Moonweave Robe', type: 'armor', slot: 'chest', atype: 'cloth', cost: 2, def: 2, use: 1, prof: 'tailoring', spell: 1, rarity: 'u', text: 'Your spells and powers deal +1 damage.', art: { s: 'arcane', L: [['obj', { t: 'robe', x: 150, y: 110 }]] } });
  add('shadowboots', { name: 'Shadowstep Boots', type: 'armor', slot: 'feet', atype: 'leather', cost: 1, def: 1, use: 0, art: { s: 'rooftops', L: [['obj', { t: 'boots', x: 150, y: 110, shadowy: 1 }]] } });
  add('forgegauntlets', { name: 'Gauntlets of the Living Forge', type: 'armor', slot: 'hands', atype: 'plate', cost: 2, def: 2, use: 1, prof: 'blacksmithing', heroAtk: 1, rarity: 'u', text: 'Your hero has +1 ATK.', art: { s: 'forge', L: [['obj', { t: 'gauntlet', x: 150, y: 110 }]] } });
  add('rocketboots', { name: 'Goblin Rocket Boots', type: 'armor', slot: 'feet', atype: 'cloth', cost: 2, def: 1, use: 0, prof: 'engineering', text: 'When you play this, draw a card.', onEnter: async (E, c) => E.draw(c.p, 1), flavor: 'Lit fuse sold separately.', art: { s: 'forge', L: [['obj', { t: 'boots', x: 150, y: 104, rocket: 1, mat: 'cloth' }]] } });
  add('bearhide', { name: 'Greatbear Hide Leggings', type: 'armor', slot: 'legs', atype: 'leather', cost: 2, def: 2, use: 1, prof: 'skinning', art: { s: 'peaks', L: [['obj', { t: 'legs', x: 150, y: 110, fur: 1 }]] } });
  add('vestments', { name: 'Acolyte\'s Vestments', type: 'armor', slot: 'chest', atype: 'cloth', cost: 1, def: 1, use: 0, art: { s: 'temple', L: [['obj', { t: 'robe', x: 150, y: 110, col: '#e8e0d0', trim: '#d8a840' }]] } });
  add('warkilt', { name: 'Ironbound War-Kilt', type: 'armor', slot: 'legs', atype: 'mail', cost: 2, def: 2, use: 1, art: { s: 'steppe', L: [['obj', { t: 'legs', x: 150, y: 110, mat: 'mail' }]] } });
  add('leatherhood', { name: 'Stalker\'s Hood', type: 'armor', slot: 'head', atype: 'leather', cost: 1, def: 1, use: 0, art: { s: 'forest', L: [fig({ pose: 'stand', helm: 'hood', x: 150, y: 290, s: 1.6, eye: '#ffd890', shadow: false })] } });

  // ---------- items ----------
  add('draught', { name: 'Healing Draught', type: 'item', cost: 1, use: { cost: 0, destroy: true, target: 'friendlyHero' }, tags: ['heal'], heal: 5, text: 'Use: destroy this to heal 5 damage from a friendly hero.', urun: async (E, c) => E.heal(c.target, 5), art: { s: 'altar', L: [['obj', { t: 'potion', x: 150, y: 116 }]] } });
  add('giantelixir', { name: 'Elixir of the Giants', type: 'item', cost: 1, prof: 'alchemy', use: { cost: 0, destroy: true, target: 'none' }, tags: ['buff'], text: 'Use: destroy this. Your hero gets +4 ATK until end of turn.', urun: async (E, c) => E.tempAtk(c.p, 4), art: { s: 'altar', pal: { light: '#ffb070' }, L: [['obj', { t: 'potion', x: 150, y: 116, col: '#ff8a20', shape: 'flask' }]] } });
  add('sparkring', { name: 'Ring of Kindled Sparks', type: 'item', cost: 2, prof: 'enchanting', spell: 1, rarity: 'u', text: 'Your spells and powers deal +1 damage.', art: { s: 'altar', L: [['obj', { t: 'ring', x: 150, y: 114, col: '#ff6a2a', sparks: 1 }]] } });
  add('dawnamulet', { name: 'Amulet of the First Dawn', type: 'item', cost: 3, rarity: 'u', text: 'At the start of your turn, heal 2 damage from your hero.', start: async (E, p) => E.heal(E.heroT(p), 2), art: { s: 'altar', L: [['obj', { t: 'amulet', x: 150, y: 120 }]] } });
  add('hourglass', { name: 'Hourglass of Borrowed Time', type: 'item', cost: 3, rarity: 'r', use: { cost: 2, exhaust: true, target: 'none' }, tags: ['draw'], text: 'Use: pay 2 and exhaust this to draw a card.', urun: async (E, c) => E.draw(c.p, 1), art: { s: 'altar', L: [['obj', { t: 'hourglass', x: 150, y: 110 }]] } });
  add('poultice', { name: 'Herbal Poultice', type: 'item', cost: 1, prof: 'herbalism', use: { cost: 0, destroy: true, target: 'friendly' }, tags: ['heal', 'draw'], heal: 4, text: 'Use: destroy this to heal 4 damage from a friendly hero or ally and draw a card.', urun: async (E, c) => { await E.heal(c.target, 4); await E.draw(c.p, 1); }, art: { s: 'grove', L: [['obj', { t: 'potion', x: 150, y: 116, col: '#6ad05a', shape: 'tall' }]] } });
  add('lantern', { name: 'Ore-Seeker\'s Lantern', type: 'item', cost: 2, prof: 'mining', use: { cost: 0, exhaust: true, target: 'none' }, tags: ['ramp'], text: 'Use: exhaust this to gain 1 extra resource this turn.', urun: async (E, c) => E.gainRes(c.p, 1), art: { s: 'forge', L: [['obj', { t: 'lantern', x: 150, y: 116 }]] } });
  add('sapper', { name: 'Goblin Sapper Charge', type: 'item', cost: 1, prof: 'engineering', use: { cost: 0, destroy: true, target: 'enemy' }, tags: ['dmg'], dmg: 4, text: 'Use: destroy this to deal 4 damage to an enemy.', urun: async (E, c) => E.dmg(c.target, 4, { p: c.p, kind: 'effect' }), art: { s: 'forge', L: [['obj', { t: 'bomb', x: 150, y: 120 }]] } });
  add('tome', { name: 'Tome of Forgotten Lore', type: 'item', cost: 4, rarity: 'r', text: 'At the start of your turn, draw an extra card.', start: async (E, p) => E.draw(p, 1), art: { s: 'arcane', L: [['obj', { t: 'tome', x: 150, y: 116 }]] } });
  add('warhorn', { name: 'Warhorn of the Clans', type: 'item', cost: 2, fac: 'clans', use: { cost: 1, exhaust: true, target: 'none' }, tags: ['buff'], text: 'Use: pay 1 and exhaust this. Your allies get +1 ATK this turn.', urun: async (E, c) => E.allyTempAtk(c.p, 1), art: { s: 'steppe', L: [['obj', { t: 'horn', x: 150, y: 116 }]] } });
  add('concordbanner', { name: 'Banner of the Silver Concord', type: 'item', cost: 2, fac: 'concord', allyHp: 1, text: 'Your allies have +1 health.', art: { s: 'castle', L: [['obj', { t: 'banner', x: 150, y: 110 }]] } });

  // ---------- quests ----------
  add('caravan', { name: 'The Missing Caravan', type: 'quest', cost: 0, qcost: 2, text: 'Play as a resource. Complete (pay 2): draw 2 cards.', reward: async (E, c) => E.draw(c.p, 2), art: { s: 'steppe', L: [['obj', { t: 'scroll', x: 150, y: 130, s: 0.9 }]] } });
  add('bounty', { name: 'Bounty: Ashfang Marauders', type: 'quest', cost: 0, qcost: 0, cond: (E, p) => E.g.minionsKilled >= 2, condText: 'your party has destroyed 2 minions', text: 'Play as a resource. Complete once you have destroyed 2 minions: draw a card and heal 4 damage from your hero.', reward: async (E, c) => { await E.draw(c.p, 1); await E.heal(E.heroT(c.p), 4); }, art: { s: 'tavern', L: [['obj', { t: 'scroll', x: 150, y: 120, s: 0.85 }], ['obj', { t: 'coin', x: 220, y: 160, s: 0.4 }]] } });
  add('moonpetals', { name: 'Gather Moonpetals', type: 'quest', cost: 0, qcost: 1, text: 'Play as a resource. Complete (pay 1): heal 5 damage from your hero.', reward: async (E, c) => E.heal(E.heroT(c.p), 5), art: { s: 'forest', L: [['fx', { t: 'heal', x: 150, y: 140, c: '#e0d0ff', leaves: 0 }], ['fx', { t: 'sparkle', n: 12, c: '#e6d8ff' }]] } });
  add('ancientforge', { name: 'Rekindle the Ancient Forge', type: 'quest', cost: 0, qcost: 3, rarity: 'u', text: 'Play as a resource. Complete (pay 3): search your deck for a weapon or armor card and put it into your hand.', reward: async (E, c) => E.tutor(c.p, d => d.type === 'weapon' || d.type === 'armor'), art: { s: 'forge', L: [fig({ race: 'dwarf', pose: 'heroic', w: 'hammer', wGlow: '#ff9a3a', x: 150, y: 210, s: 1 })] } });
  add('scout', { name: 'Scout the Enemy Lair', type: 'quest', cost: 0, qcost: 1, text: 'Play as a resource. Complete (pay 1): look at the top card of the boss deck. You may put it on the bottom.', reward: async (E, c) => E.scoutBoss(c.p), art: { s: 'rooftops', L: [fig({ race: 'goblin', pose: 'hunch', helm: 'hood', x: 120, y: 210, s: 1.1, eye: '#ffd060' })] } });
  add('slaybeast', { name: 'Blood of the Beast', type: 'quest', cost: 0, qcost: 0, cond: (E, p) => p.stats.bossDmg >= 15, condText: 'you have dealt 15 damage to the boss', rarity: 'u', text: 'Play as a resource. Complete once you have dealt 15 damage to the boss: deal 5 damage to the boss and draw a card.', reward: async (E, c) => { await E.dmg(E.bossT(), 5, { p: c.p, kind: 'effect' }); await E.draw(c.p, 1); }, art: { s: 'volcano', L: [['beast', { t: 'bear', x: 150, y: 206, s: 1.1, eye: '#ff3a1a', shadow: 80 }], ['fx', { t: 'slash', x: 160, y: 110, c: '#ff2a1a' }]] } });
  add('lostrelic', { name: 'Recover the Lost Relic', type: 'quest', cost: 0, qcost: 2, text: 'Play as a resource. Complete (pay 2): return an ally from your discard pile to your hand.', reward: async (E, c) => E.recoverAlly(c.p), art: { s: 'crypt', L: [['obj', { t: 'crown', x: 150, y: 130, s: 0.7 }]] } });

  // ---------- locations ----------
  add('citadel', { name: 'Silverhold Citadel', type: 'location', cost: 0, fac: 'concord', rarity: 'u', lcost: 2, text: 'Play as a resource. Once per turn: pay 2 to summon a 1/3 Footman with Bulwark.', lrun: async (E, c) => E.summonAlly(c.p, 'footman_t', 1), art: { s: 'castle', L: [['glow', { x: 205, y: 110, r: 50, c: '#ffd27a', op: 0.45 }], ['obj', { t: 'banner', x: 64, y: 128, s: 0.55 }], fig({ pose: 'stand', w: 'polearm', off: 'tower', wA: 0, helm: 'great', plume: false, x: 120, y: 214, s: 0.6, emblem: '#ffd060' })] } });
  add('encampment', { name: 'Bloodrock Encampment', type: 'location', cost: 0, fac: 'clans', rarity: 'u', lcost: 2, text: 'Play as a resource. Once per turn: pay 2 to summon a 2/2 Grunt with Swift and Bulwark.', lrun: async (E, c) => E.summonAlly(c.p, 'grunt_t', 1), art: { s: 'steppe', L: [['glow', { x: 150, y: 196, r: 40, c: '#ff8a2a', op: 0.7 }], ['obj', { t: 'banner', x: 225, y: 128, s: 0.55, col: '#7a1010', em: '#ffb070', glyph: 'axes' }], fig({ race: 'orc', pose: 'stand', w: 'axe', helm: 'mohawk', x: 110, y: 212, s: 0.62 }), fig({ race: 'orc', pose: 'staff', w: 'polearm', x: 70, y: 214, s: 0.58, flip: 1 })] } });
  add('moonwell', { name: 'Moonwell Sanctum', type: 'location', cost: 0, lcost: 1, ltarget: 'friendlyHero', text: 'Play as a resource. Once per turn: pay 1 to heal 3 damage from a friendly hero.', lrun: async (E, c) => E.heal(c.target, 3), art: { s: 'forest', L: [['fx', { t: 'runes', x: 150, y: 190, r: 70, c: '#d0e0ff' }], ['glow', { x: 150, y: 180, r: 50, c: '#bfd8ff' }]] } });
  add('library', { name: 'Spire Library of Aethermoor', type: 'location', cost: 0, rarity: 'u', lcost: 2, text: 'Play as a resource. Once per turn: pay 2 to draw a card.', lrun: async (E, c) => E.draw(c.p, 1), art: { s: 'arcane', L: [['obj', { t: 'tome', x: 150, y: 150, s: 0.7 }]] } });
  add('ashenforge', { name: 'The Ashen Forge', type: 'location', cost: 0, lcost: 1, text: 'Play as a resource. Once per turn: pay 1. Your hero gets +2 ATK this turn.', lrun: async (E, c) => E.tempAtk(c.p, 2), art: { s: 'forge', L: [['obj', { t: 'hammer', x: 200, y: 150, s: 0.45 }]] } });

  // ---------- master heroes ----------
  add('archon', { name: 'Archon of the Dawn', type: 'master', cost: 7, hp: 34, fac: 'concord', rarity: 'r', text: 'Replaces your hero (damage and gear carry over). At the start of your turn, heal 2 damage from each friendly hero and ally.', mstart: async (E, p) => { for (const t of E.friendlyChars()) await E.heal(t, 2); }, art: { s: 'holy', L: [['fx', { t: 'holy', x: 150, wings: 1, wy: 100 }], fig({ pose: 'heroic', w: 'greatsword', helm: 'crown', cape: 1, wGlow: '#fff6c0', x: 150, y: 210, s: 0.88, gem: '#fff6c0', pauld: 'plate' })] } });
  add('warlord', { name: 'Warlord of the Red Moon', type: 'master', cost: 7, hp: 36, fac: 'clans', rarity: 'r', heroAtk: 2, allyFerocity: true, text: 'Replaces your hero (damage and gear carry over). Your hero has +2 ATK. Your allies have Swift.', art: { s: 'steppe', L: [fig({ race: 'orc', pose: 'heroic', w: 'battleaxe', off: 'round', helm: 'horned', pauld: 'spiked', cape: 1, capeCol: '#5a0a08', wGlow: '#ff4a1a', x: 150, y: 214, s: 0.9 })] } });
  add('tempest', { name: 'Avatar of the Tempest', type: 'master', cost: 6, hp: 30, rarity: 'r', text: 'Replaces your hero (damage and gear carry over). At the start of your turn, deal 3 damage to a random enemy.', mstart: async (E, p) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 3, { p, kind: 'effect' }); }, art: { s: 'storm', L: [['fx', { t: 'bolt', x1: 100, y1: 0, x2: 140, y2: 80 }], ['fx', { t: 'bolt', x1: 220, y1: 0, x2: 170, y2: 90 }], fig({ pose: 'cast', robe: 1, helm: 'flowhair', glowL: '#cfe8ff', glowR: '#cfe8ff', x: 150, y: 196, s: 0.85, spectral: '#9ac8ff', eye: '#fff' })] } });

  // ---------- raid treasure (epic) ----------
  add('cinderfang', { name: 'Cinderfang, Tyrant\'s Edge', type: 'weapon', wtype: 'sword', cost: 3, atk: 5, strike: 1, rarity: 'e', set: 'molten', text: 'When your hero attacks with this, deal 1 damage to each other enemy.', onAttack: async (E, c) => { for (const t of E.aoe(E.enemies().filter(t => !E.same(t, c.defender)), 1, 4)) await E.dmg(t, 1, { p: c.p, kind: 'effect' }); }, art: { s: 'volcano', L: [['obj', { t: 'sword', x: 150, y: 100, s: 0.95, glow: '#ff6a1a', flame: 1, gem: '#ff3a1a' }]] } });
  add('tyrantheart', { name: 'Heart of the Cinder Tyrant', type: 'item', cost: 3, rarity: 'e', set: 'molten', spell: 1, text: 'Your spells and powers deal +1 damage. At the start of your turn, deal 1 damage to a random enemy.', start: async (E, p) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 1, { p, kind: 'effect' }); }, art: { s: 'volcano', L: [['obj', { t: 'heart', x: 150, y: 110 }]] } });
  add('hatchling', { name: 'Emberwing Hatchling', type: 'ally', cost: 3, atk: 3, hp: 4, kw: ['ferocity', 'longrange'], race: 'Dragonkin', rarity: 'e', set: 'molten', flavor: 'It imprinted on the first thing it saw. Unfortunately, that was you.', art: { s: 'volcano', L: [['dragon', { x: 150, y: 150, s: 0.6, eye: '#ffe27a' }]] } });
  add('soulreaper', { name: 'Soulreaper Scythe', type: 'weapon', wtype: 'polearm', cost: 4, atk: 5, strike: 1, rarity: 'e', set: 'crypt', text: 'When your hero attacks with this, heal 3 damage from your hero.', onAttack: async (E, c) => E.heal(E.heroT(c.p), 3), art: { s: 'crypthall', L: [['obj', { t: 'polearmItem', kind: 'scythe', x: 160, y: 110, glow: '#4aff9a', tilt: -20 }]] } });
  add('hollowcrown', { name: 'Crown of the Hollow King', type: 'armor', slot: 'head', atype: 'cloth', cost: 3, def: 2, use: 1, spell: 1, rarity: 'e', set: 'crypt', text: 'Your spells and powers deal +1 damage.', art: { s: 'crypthall', L: [['obj', { t: 'crown', x: 150, y: 120, dark: 1 }]] } });
  add('phylshard', { name: 'Phylactery Shard', type: 'item', cost: 2, rarity: 'e', set: 'crypt', cheatDeath: true, text: 'The first time your hero would be defeated, destroy this instead and set your hero\'s health to 5.', art: { s: 'crypt', L: [['obj', { t: 'shard', x: 150, y: 116 }]] } });
  add('trident', { name: 'Tidecaller\'s Trident', type: 'weapon', wtype: 'polearm', cost: 4, atk: 5, strike: 1, kw: ['longrange'], rarity: 'e', set: 'tide', art: { s: 'sunken', L: [['obj', { t: 'polearmItem', kind: 'trident', x: 150, y: 120, glow: '#5ad8ff', tilt: 15 }]] } });
  add('pearl', { name: 'Pearl of the Drowned Moon', type: 'item', cost: 3, rarity: 'e', set: 'tide', text: 'At the start of your turn, heal 2 damage from each friendly hero.', start: async (E, p) => { for (const h of E.heroes()) await E.heal(E.heroT(h), 2); }, art: { s: 'sunken', L: [['obj', { t: 'pearl', x: 150, y: 130 }]] } });
  add('leviathan', { name: 'Leviathan Hatchling', type: 'ally', cost: 5, atk: 5, hp: 6, kw: ['protector'], race: 'Beast', rarity: 'e', set: 'tide', flavor: 'Small, for a leviathan. Enormous, for a room.', art: { s: 'sunken', L: [['beast', { t: 'maw', x: 150, y: 214, s: 0.75, eye: '#ffe27a' }]] } });

  // ---------- loot cards (special versions with scratch-off codes) ----------
  add('loot_gryphon', { name: 'Spectral Gryphon', type: 'ally', cost: 5, atk: 4, hp: 5, kw: ['ferocity', 'elusive'], race: 'Spirit', rarity: 'e', set: 'loot', loot: { reward: 'pet_gryphon', label: 'Spectral Gryphon companion + Aether card back' }, art: { s: 'arcane', L: [['beast', { t: 'gryphon', x: 150, y: 196, s: 1.05, spectral: '#9ae8ff', auraOp: 0.6 }]] } });
  add('loot_lynx', { name: 'Phantom Snowlynx', type: 'ally', cost: 3, atk: 5, hp: 4, kw: ['ferocity', 'protector'], race: 'Spirit', rarity: 'e', set: 'loot', loot: { reward: 'back_lynx', label: 'Frostlynx card back' }, art: { s: 'frost', L: [['beast', { t: 'lynx', x: 150, y: 200, s: 1.2, spectral: '#c8f4ff', auraOp: 0.55, stripe: '#5ab0e0' }]] } });
  add('loot_banner', { name: 'Banner of the Raidbound', type: 'item', cost: 2, rarity: 'e', set: 'loot', allyAtk: 1, text: 'Your allies have +1 ATK.', loot: { reward: 'board_banners', label: 'Hall of Banners table theme' }, art: { s: 'castle', L: [['obj', { t: 'banner', x: 150, y: 110, col: '#7a1020', em: '#ffd060', glyph: 'axes' }]] } });
  add('loot_kite', { name: 'Paper Wyrm Kite', type: 'item', cost: 0, rarity: 'e', set: 'loot', use: { cost: 0, destroy: true, target: 'none' }, tags: ['draw'], text: 'Use: destroy this to draw a card.', urun: async (E, c) => E.draw(c.p, 1), loot: { reward: 'pet_kite', label: 'Paper Wyrm companion + Skyward table theme' }, art: { s: 'peaks', L: [['obj', { t: 'kite', x: 170, y: 80, s: 0.9 }]] } });

  RB.CARDS = C;

  /* ======================= TOKENS ======================= */
  RB.TOKENS = {
    wolfcomp: { id: 'wolfcomp', name: 'Wolf Companion', type: 'ally', atk: 2, hp: 2, kw: ['ferocity', 'protector'], race: 'Beast', art: C.packleader.art },
    footman_t: { id: 'footman_t', name: 'Silverguard Footman', type: 'ally', atk: 1, hp: 3, kw: ['protector'], race: 'Human', art: C.footman.art },
    grunt_t: { id: 'grunt_t', name: 'Bloodfang Grunt', type: 'ally', atk: 2, hp: 2, kw: ['ferocity', 'protector'], race: 'Orc', art: C.grunt.art },
    // boss minions
    whelp: { id: 'whelp', name: 'Emberwhelp', atk: 2, hp: 2, kw: ['ferocity'], ai: 'random', art: { s: 'volcano', L: [['dragon', { x: 150, y: 150, s: 0.55 }]] } },
    magma: { id: 'magma', name: 'Magma Guardian', atk: 3, hp: 6, kw: ['guardian', 'crushing'], ai: 'lowest', art: { s: 'volcano', L: [['beast', { t: 'golem', kind: 'magma', x: 150, y: 214, s: 0.95 }]] } },
    skeleton: { id: 'skeleton', name: 'Skeleton Warrior', atk: 2, hp: 1, race: 'Undead', ai: 'allies', art: { s: 'crypt', L: [fig({ race: 'skeleton', pose: 'charge', w: 'sword', off: 'round', x: 150, y: 210, s: 0.9 })] } },
    thrall: { id: 'thrall', name: 'Risen Thrall', atk: 2, hp: 2, kw: ['frenzy'], race: 'Undead', ai: 'random', art: { s: 'crypt', L: [fig({ race: 'skeleton', pose: 'hunch', x: 150, y: 210, s: 1.0, eye: '#7affb0' })] } },
    colossus: { id: 'colossus', name: 'Bone Colossus', atk: 4, hp: 7, kw: ['thickhide'], race: 'Undead', ai: 'lowest', art: { s: 'crypthall', L: [['beast', { t: 'golem', kind: 'bone', x: 150, y: 214, s: 1.0 }]] } },
    phylactery: { id: 'phylactery', name: 'Phylactery of Malgareth', atk: 0, hp: 12, kw: ['guardian'], text: 'When destroyed, Malgareth takes 10 damage.', onDeath: async (E) => E.dmg(E.bossT(), 10, { kind: 'effect' }), art: { s: 'crypthall', L: [['obj', { t: 'shard', x: 150, y: 110, s: 1.1 }], ['fx', { t: 'chains' }]] } },
    tentacle: { id: 'tentacle', name: 'Grasping Tentacle', atk: 3, hp: 4, ai: 'allies', art: { s: 'sunken', L: [['beast', { t: 'tentacle', x: 150, y: 214, s: 1.1 }]] } },
    murk: { id: 'murk', name: 'Murkspawn', atk: 1, hp: 2, kw: ['ferocity', 'ambush'], ai: 'random', art: { s: 'sunken', L: [fig({ race: 'fish', pose: 'hunch', w: 'trident', x: 150, y: 210, s: 1.1, eye: '#ffe27a' })] } },
    maw: { id: 'maw', name: 'Leviathan Maw', atk: 5, hp: 8, kw: ['crushing'], ai: 'lowest', art: { s: 'sunken', L: [['beast', { t: 'maw', x: 150, y: 220, s: 1.1, eye: '#ff5a3a' }]] } },
    sheep: { id: 'sheep', name: 'Sheep', atk: 0, hp: 1, ai: 'random', art: C.polymorph.art },
  };

  /* ======================= RAID BOSSES ======================= */
  const B = {};
  const addB = (id, o) => { o.id = id; B[id] = o; };
  // Molten Spire
  addB('tailswipe', { name: 'Tail Swipe', kind: 'attack', text: 'Deal 2 damage to each ally.', run: async E => { for (const t of E.allAllies()) await E.dmg(t, 2, { kind: 'boss' }); }, art: { s: 'volcano', L: [['fx', { t: 'whirl', x: 150, y: 170, c: '#ffb070' }], ['dragon', { x: 170, y: 140, s: 0.7, flip: 1 }]] } });
  addB('searingbreath', { name: 'Searing Breath', kind: 'attack', text: 'Deal 5 damage to the hero with the most health.', run: async E => { const h = E.mostHealth(); if (h) await E.dmg(E.heroT(h), 5, { kind: 'boss' }); }, art: { s: 'volcano', L: [['dragon', { x: 120, y: 160, s: 0.8, breath: 1 }]] } });
  addB('cinderrain', { name: 'Rain of Cinders', kind: 'attack', text: 'Deal 2 damage to each hero and ally.', run: async E => { for (const t of E.friendlyChars()) await E.dmg(t, 2, { kind: 'boss' }); }, art: { s: 'volcano', p: 'embers', pn: 60, L: [['fx', { t: 'meteors', n: 9, c: '#ff8a3a' }]] } });
  addB('whelps', { name: 'Brood of Embers', kind: 'summon', text: 'Summon two Emberwhelps (2/2, Swift).', run: async E => E.summonMinion('whelp', 2), art: { s: 'volcano', L: [['dragon', { x: 90, y: 130, s: 0.42 }], ['dragon', { x: 210, y: 110, s: 0.38, flip: 1 }]] } });
  addB('magmaguard', { name: 'Call the Magma Guardian', kind: 'summon', text: 'Summon a Magma Guardian (3/6, Guardian, Crushing).', run: async E => E.summonMinion('magma', 1), art: RB.TOKENS.magma.art });
  addB('wingbuffet', { name: 'Wing Buffet', kind: 'attack', text: 'Return the most expensive ally to its owner\'s hand.', run: async E => { const t = E.allyBy('cost', 'max'); if (t) await E.bounce(t); }, art: { s: 'storm', pal: { glow: '#ff7a3a' }, L: [['dragon', { x: 150, y: 150, s: 0.95 }], ['fx', { t: 'whirl', x: 150, y: 120 }]] } });
  addB('roar', { name: 'Terrifying Roar', kind: 'curse', text: 'Each hero discards a random card.', run: async E => { for (const h of E.heroes()) E.discardRandom(h); }, art: { s: 'volcano', L: [['fx', { t: 'shout', x: 160, y: 100, c: '#ffb070' }], ['dragon', { x: 140, y: 170, s: 0.8 }]] } });
  addB('ignite', { name: 'Ignite', kind: 'event', turns: 2, text: 'Lasts 2 rounds: at the start of each hero\'s turn, that hero takes 1 damage.', heroStart: async (E, p) => E.dmg(E.heroT(p), 1, { kind: 'boss' }), art: { s: 'volcano', L: [['fx', { t: 'runes', x: 150, y: 190, r: 120, c: '#ff6a1a' }], ['glow', { x: 150, y: 190, r: 80, c: '#ff4a1a', op: 0.6 }]] } });
  addB('devour', { name: 'Devour', kind: 'attack', text: 'Deal 7 damage to the ally with the most health.', run: async E => { const t = E.allyBy('hp', 'max'); if (t) await E.dmg(t, 7, { kind: 'boss' }); }, art: { s: 'volcano', L: [['dragon', { x: 110, y: 170, s: 0.8, flip: 1 }], ['fx', { t: 'slash', x: 210, y: 110 }]] } });
  addB('emberfeast', { name: 'Feast of Embers', kind: 'heal', text: 'Vorthrax heals 6 and gains an Ember.', run: async E => { await E.bossHeal(6); await E.addCounter(1); }, art: { s: 'volcano', L: [['glow', { x: 150, y: 110, r: 90, c: '#ff8a1a', op: 0.6 }], ['obj', { t: 'heart', x: 150, y: 110, s: 0.9 }]] } });
  addB('scorchclaw', { name: 'Scorching Claw', kind: 'attack', text: 'Deal 5 damage to the hero with the most threat.', run: async E => { const h = E.threatTarget(); if (h) await E.dmg(E.heroT(h), 5, { kind: 'boss' }); }, art: { s: 'volcano', L: [fig({ pose: 'stand', w: 'sword', off: 'shield', helm: 'great', x: 200, y: 214, s: 0.6 }), ['fx', { t: 'slash', x: 170, y: 120, c: '#ffb040' }]] } });
  addB('meltarmor', { name: 'Molten Slag', kind: 'curse', text: 'Destroy a random piece of armor on each hero.', run: async E => { for (const h of E.heroes()) await E.destroyArmor(h); }, art: { s: 'forge', L: [['obj', { t: 'breastplate', x: 150, y: 110 }], ['fx', { t: 'meteors', n: 6, c: '#ff6a1a' }]] } });
  // Crypt
  addB('raisedead', { name: 'Raise Dead', kind: 'summon', text: 'Summon two Skeleton Warriors (2/1).', run: async E => E.summonMinion('skeleton', 2), art: { s: 'crypt', L: [fig({ race: 'skeleton', pose: 'cast', x: 100, y: 210, s: 0.7 }), fig({ race: 'skeleton', pose: 'charge', w: 'sword', x: 200, y: 210, s: 0.75 })] } });
  addB('colossus', { name: 'Bone Colossus', kind: 'summon', text: 'Summon a Bone Colossus (4/7, Thick Hide).', run: async E => E.summonMinion('colossus', 1), art: RB.TOKENS.colossus.art });
  addB('shadowbolt', { name: 'Shadow Bolt', kind: 'attack', text: 'Deal 4 damage to a random hero.', run: async E => { const h = E.randomHero(); if (h) await E.dmg(E.heroT(h), 4, { kind: 'boss' }); }, art: { s: 'crypthall', L: [['fx', { t: 'fireball', x: 170, y: 110, c: '#4aff9a', ang: 20 }]] } });
  addB('siphon', { name: 'Soul Siphon', kind: 'attack', text: 'Deal 3 damage to the hero with the most health. Malgareth heals 3.', run: async E => { const h = E.mostHealth(); if (h) await E.dmg(E.heroT(h), 3, { kind: 'boss' }); await E.bossHeal(3); }, art: { s: 'crypt', L: [['fx', { t: 'skull', x: 150, y: 100 }], ['wisps', { x: 150, y: 150, w: 200, h: 60, n: 8 }]] } });
  addB('frailty', { name: 'Curse of Frailty', kind: 'event', turns: 2, dmgTakenMod: 1, text: 'Lasts 2 rounds: heroes take 1 extra damage from every source.', art: { s: 'crypt', L: [['fx', { t: 'runes', x: 150, y: 120, r: 80, flat: 1, c: '#4aff9a' }], ['fx', { t: 'skull', x: 150, y: 120, s: 0.6 }]] } });
  addB('entomb', { name: 'Frozen Tomb', kind: 'curse', text: 'The ally with the highest ATK is frozen: it won\'t ready on its owner\'s next turn.', run: async E => { const t = E.allyBy('atk', 'max'); if (t) E.freeze(t); }, art: { s: 'frost', L: [fig({ pose: 'stand', w: 'sword', x: 150, y: 196, s: 0.8 }), ['fx', { t: 'ice', x: 150, y: 196 }]] } });
  addB('deathcoil', { name: 'Death Coil', kind: 'attack', text: 'Deal 2 damage to each hero.', run: async E => { for (const h of E.heroes()) await E.dmg(E.heroT(h), 2, { kind: 'boss' }); }, art: { s: 'crypthall', L: [['fx', { t: 'whirl', x: 150, y: 120, c: '#4aff9a' }], ['fx', { t: 'skull', x: 150, y: 110, s: 0.7 }]] } });
  addB('whispers', { name: 'Dread Whispers', kind: 'curse', text: 'Each hero discards a random card.', run: async E => { for (const h of E.heroes()) E.discardRandom(h); }, art: { s: 'crypthall', L: [['fx', { t: 'skull', x: 150, y: 90, s: 0.9, op: 0.5 }], ['wisps', { x: 150, y: 120, w: 260, h: 120, n: 14 }], fig({ pose: 'pray', helm: 'hood', x: 150, y: 214, s: 0.6 })] } });
  addB('army', { name: 'Army of the Damned', kind: 'summon', text: 'Summon a Skeleton Warrior for each hero, plus one.', run: async E => E.summonMinion('skeleton', E.heroes().length + 1), art: { s: 'crypt', L: [0, 1, 2, 3].map(i => fig({ race: 'skeleton', pose: i % 2 ? 'charge' : 'stand', w: 'sword', x: 50 + i * 66, y: 205 - (i % 2) * 6, s: 0.55 + (i % 2) * 0.1 })) } });
  addB('chill', { name: 'Lich\'s Chill', kind: 'attack', text: 'Deal 2 damage to each ally.', run: async E => { for (const t of E.allAllies()) await E.dmg(t, 2, { kind: 'boss' }); }, art: { s: 'frost', pal: { glow: '#7affd0' }, L: [['fx', { t: 'frost', x: 150, y: 140 }]] } });
  addB('pact', { name: 'Necrotic Pact', kind: 'buff', text: 'Each boss minion gets +1 ATK and +1 health.', run: async E => E.buffMinions(1, 1), art: { s: 'crypthall', L: [['fx', { t: 'runes', x: 150, y: 170, r: 100, c: '#4aff9a' }], ['fx', { t: 'buff', x: 150, y: 120, c: '#4aff9a' }]] } });
  addB('gaze', { name: 'Hollow Gaze', kind: 'attack', text: 'Deal 6 damage to the hero with the most threat.', run: async E => { const h = E.threatTarget(); if (h) await E.dmg(E.heroT(h), 6, { kind: 'boss' }); }, art: { s: 'crypthall', L: [['fx', { t: 'skull', x: 150, y: 110, s: 1.3 }]] } });
  // Sunken Cathedral
  addB('tentaclecard', { name: 'Grasping Tentacle', kind: 'summon', text: 'Summon a Grasping Tentacle (3/4).', run: async E => E.summonMinion('tentacle', 1), art: RB.TOKENS.tentacle.art });
  addB('undertow', { name: 'Undertow', kind: 'curse', text: 'Return a random ally to its owner\'s hand.', run: async E => { const t = E.randomAlly(); if (t) await E.bounce(t); }, art: { s: 'sunken', L: [['fx', { t: 'whirl', x: 150, y: 150, c: '#9ae8ff' }], ['fx', { t: 'whirl', x: 150, y: 150, c: '#ffffff' }], fig({ pose: 'cast', w: 'sword', x: 150, y: 140, s: 0.55, shadow: false, spectral: '#7ac8e8' })] } });
  addB('sirensong', { name: 'Siren Song', kind: 'curse', text: 'The ally with the highest ATK deals its ATK in damage to its own hero.', run: async E => { const t = E.allyBy('atk', 'max'); if (t) await E.dmg(E.heroT(t.p), E.atkOf(t), { kind: 'boss' }); }, art: { s: 'sea', L: [fig({ pose: 'cast', robe: 1, helm: 'flowhair', spectral: '#9ae8ff', x: 150, y: 196, s: 0.8, aura: true })] } });
  addB('crushing', { name: 'Crushing Depths', kind: 'attack', text: 'Deal 5 damage to the hero with the most threat.', run: async E => { const h = E.threatTarget(); if (h) await E.dmg(E.heroT(h), 5, { kind: 'boss' }); }, art: { s: 'sunken', L: [['beast', { t: 'tentacle', x: 150, y: 220, s: 1.3 }]] } });
  addB('maelstrom', { name: 'Maelstrom', kind: 'attack', text: 'Deal 2 damage to each hero and ally.', run: async E => { for (const t of E.friendlyChars()) await E.dmg(t, 2, { kind: 'boss' }); }, art: { s: 'sea', L: [['fx', { t: 'whirl', x: 150, y: 160, c: '#9ae8ff' }], ['fx', { t: 'whirl', x: 150, y: 150, c: '#e0faff' }], ['beast', { t: 'tentacle', x: 60, y: 230, s: 0.8 }], ['beast', { t: 'tentacle', x: 245, y: 230, s: 0.75, curl: -1 }]] } });
  addB('brinehex', { name: 'Brine Hex', kind: 'event', turns: 2, text: 'Lasts 2 rounds: at the start of each hero\'s turn, that hero takes 1 damage.', heroStart: async (E, p) => E.dmg(E.heroT(p), 1, { kind: 'boss' }), art: { s: 'sunken', L: [['fx', { t: 'runes', x: 150, y: 140, r: 90, flat: 1, c: '#5ad8ff' }]] } });
  addB('abyssheal', { name: 'Abyssal Renewal', kind: 'heal', text: 'Nethys heals 6.', run: async E => E.bossHeal(6), art: { s: 'sunken', L: [['fx', { t: 'heal', x: 150, y: 120, c: '#7ae8ff' }], fig({ pose: 'cast', robe: 1, helm: 'coral', glowL: '#7ae8ff', glowR: '#7ae8ff', x: 150, y: 214, s: 0.8 })] } });
  addB('spawn', { name: 'Spawn of the Deep', kind: 'summon', text: 'Summon two Murkspawn (1/2, Swift, Ambush).', run: async E => E.summonMinion('murk', 2), art: { s: 'sunken', L: [fig({ race: 'fish', pose: 'hunch', w: 'trident', x: 100, y: 210, s: 0.85 }), fig({ race: 'fish', pose: 'hunch', w: 'trident', x: 210, y: 210, s: 0.8, flip: 1 })] } });
  addB('lash', { name: 'Tidal Lash', kind: 'attack', text: 'Deal 4 damage to a random hero. The Tide rises by 1.', run: async E => { const h = E.randomHero(); if (h) await E.dmg(E.heroT(h), 4, { kind: 'boss' }); await E.addCounter(1); }, art: { s: 'sea', L: [['fx', { t: 'wave', y: 160 }]] } });
  addB('inkcloud', { name: 'Ink Cloud', kind: 'curse', text: 'Exhaust all allies. (Bulwark allies can\'t cover this round.)', run: async E => E.exhaustAllies(), art: { s: 'sunken', L: [['beast', { t: 'tentacle', x: 110, y: 230, s: 0.9 }], ['fx', { t: 'ink' }], ['fx', { t: 'ink' }], ['glow', { x: 150, y: 100, r: 30, c: '#ffe27a', op: 0.5 }], ['beast', { t: 'maw', x: 150, y: 250, s: 0.6, eye: '#ffe27a', aura: false }]] } });
  addB('dragbelow', { name: 'Drag Below', kind: 'attack', text: 'Destroy the ally with the least health.', run: async E => { const t = E.allyBy('hp', 'min'); if (t) await E.destroyAlly(t); }, art: { s: 'sunken', L: [['beast', { t: 'tentacle', x: 110, y: 220, s: 1.1 }], ['beast', { t: 'tentacle', x: 200, y: 220, s: 0.9, curl: -1 }]] } });
  /* ---- #101 Omens: each raid's signature events, one revealed every boss turn (the next three are shown) ---- */
  const nH = E => E.heroes().length;
  const omen = (id, o) => addB(id, Object.assign({ kind: 'omen', omen: true }, o));
  const soakText = 'Soak: 2 damage, plus 3 for each hero, is shared by the heroes who step into the circle. If no one does, it hits every hero in full.';
  // Crypt — the Soul Bell
  omen('cr_bell', { name: 'The Soul Bell Tolls', soak: true, text: soakText, run: async E => E.soak(2 + 3 * nH(E), 'The Soul Bell'), art: { s: 'crypthall', L: [['obj', { t: 'lantern', x: 150, y: 110, s: 1 }], ['fx', { t: 'runes', x: 150, y: 190, r: 110, flat: 1, c: '#4aff9a' }]] } });
  omen('cr_graves', { name: 'Graves Stir', text: 'Summon a Risen Thrall (2/2, Frenzy) for each hero.', run: async E => E.summonMinion('thrall', nH(E)), art: RB.TOKENS.thrall.art });
  omen('cr_drain', { name: 'Soul Drain', text: 'Malgareth heals 1 for each ally the party controls (up to 6).', run: async E => { const k = Math.min(6, E.allAllies().length); if (k) await E.bossHeal(k); }, art: { s: 'crypt', L: [['wisps', { x: 150, y: 140, w: 240, h: 90, n: 12, c: '#4aff9a' }], ['fx', { t: 'skull', x: 150, y: 100, s: 0.8 }]] } });
  omen('cr_wail', { name: 'Banshee Wail', text: 'Each hero with 6 or more cards in hand discards a random card.', run: async E => { for (const h of E.heroes()) if (h.hand.length >= 6) E.discardRandom(h); }, art: { s: 'crypthall', L: [['fx', { t: 'shout', x: 150, y: 100, c: '#9affd0' }], fig({ pose: 'cast', robe: 1, spectral: '#9affd0', x: 150, y: 200, s: 0.8 })] } });
  omen('cr_bonewall', { name: 'Bone Ward', text: 'Each boss minion gets +0/+2.', run: async E => E.buffMinions(0, 2), art: { s: 'crypt', L: [['fx', { t: 'barrier', x: 150, y: 140 }], fig({ race: 'skeleton', pose: 'stand', w: 'sword', off: 'round', x: 150, y: 210, s: 0.8 })] } });
  omen('cr_eclipse', { name: 'Hollow Eclipse', text: 'Malgareth\'s strike this turn deals 2 more damage.', run: async E => E.strikeUp(2), art: { s: 'crypthall', L: [['glow', { x: 150, y: 90, r: 60, c: '#4aff9a', op: 0.6 }], ['fx', { t: 'skull', x: 150, y: 90, s: 0.7 }]] } });
  omen('cr_lull', { name: 'Silent Bells', text: 'A moment of quiet: each hero heals 2.', run: async E => { for (const h of E.heroes()) await E.heal(E.heroT(h), 2); }, art: { s: 'crypthall', L: [['fx', { t: 'heal', x: 150, y: 120, c: '#bfffe0' }]] } });
  // Molten Spire — the Ember gauge
  omen('mo_fall', { name: 'Firefall', soak: true, text: soakText, run: async E => E.soak(2 + 3 * nH(E), 'Firefall'), art: { s: 'volcano', p: 'embers', pn: 50, L: [['fx', { t: 'meteors', n: 7, c: '#ff8a3a' }], ['fx', { t: 'runes', x: 150, y: 200, r: 110, flat: 1, c: '#ff6a1a' }]] } });
  omen('mo_vents', { name: 'Lava Vents', text: 'Deal 1 damage to each ally.', run: async E => { for (const t of E.allAllies()) await E.dmg(t, 1, { kind: 'boss' }); }, art: { s: 'volcano', L: [['fx', { t: 'meteors', n: 4, c: '#ff6a1a' }], ['glow', { x: 150, y: 220, r: 90, c: '#ff4a1a', op: 0.6 }]] } });
  omen('mo_stoke', { name: 'Stoke the Flames', text: 'Vorthrax gains 2 Embers. If he is in the air, his strike this turn deals 2 more damage instead.', run: async E => { if (E.g.boss.flying) E.strikeUp(2); else await E.addCounter(2); }, art: { s: 'forge', L: [['glow', { x: 150, y: 140, r: 90, c: '#ff8a1a', op: 0.7 }], ['dragon', { x: 150, y: 150, s: 0.5 }]] } });
  omen('mo_hatch', { name: 'Hatching Season', text: 'Summon an Emberwhelp (2/2, Swift), or two if there are 3 or more heroes.', run: async E => E.summonMinion('whelp', nH(E) >= 3 ? 2 : 1), art: RB.TOKENS.whelp.art });
  omen('mo_heat', { name: 'Searing Heat', text: 'Vorthrax\'s strike this turn deals 2 more damage.', run: async E => E.strikeUp(2), art: { s: 'volcano', L: [['glow', { x: 150, y: 120, r: 110, c: '#ff5a1a', op: 0.7 }]] } });
  omen('mo_floor', { name: 'Molten Floor', text: 'Each hero takes 1 damage for each Ember (up to 3).', run: async E => { const k = Math.min(3, E.g.boss.counter); if (k) for (const h of E.heroes()) await E.dmg(E.heroT(h), k, { kind: 'boss' }); }, art: { s: 'volcano', L: [['fx', { t: 'runes', x: 150, y: 210, r: 130, flat: 1, c: '#ff8a3a' }]] } });
  omen('mo_cool', { name: 'Cooling Crust', text: 'A lull: Vorthrax loses 1 Ember and each hero heals 1.', run: async E => { await E.lowerCounter(1); for (const h of E.heroes()) await E.heal(E.heroT(h), 1); }, art: { s: 'volcano', L: [['fx', { t: 'heal', x: 150, y: 130, c: '#ffd0a0' }]] } });
  // Sunken Cathedral — the Tide clock
  omen('ti_wave', { name: 'Breaking Wave', soak: true, text: soakText, run: async E => E.soak(2 + 3 * nH(E), 'Breaking Wave'), art: { s: 'sea', L: [['fx', { t: 'wave', y: 150 }], ['fx', { t: 'runes', x: 150, y: 210, r: 110, flat: 1, c: '#5ad8ff' }]] } });
  omen('ti_spring', { name: 'Spring Tide', text: 'The Tide rises by 1.', run: async E => E.addCounter(1), art: { s: 'sea', L: [['fx', { t: 'wave', y: 120 }], ['fx', { t: 'wave', y: 180 }]] } });
  omen('ti_lurkers', { name: 'Lurkers in the Water', text: 'Summon a Murkspawn (1/2, Swift, Ambush), or two if there are 3 or more heroes.', run: async E => E.summonMinion('murk', nH(E) >= 3 ? 2 : 1), art: RB.TOKENS.murk.art });
  omen('ti_pressure', { name: 'Crushing Pressure', text: 'Each hero takes damage equal to half the Tide, rounded up.', run: async E => { const k = Math.ceil(E.g.boss.counter / 2); if (k) for (const h of E.heroes()) await E.dmg(E.heroT(h), k, { kind: 'boss' }); }, art: { s: 'sunken', L: [['beast', { t: 'tentacle', x: 150, y: 230, s: 1.2 }], ['fx', { t: 'ink' }]] } });
  omen('ti_bells', { name: 'Drowned Bells', text: 'Nethys\'s strike this turn deals 2 more damage.', run: async E => E.strikeUp(2), art: { s: 'sunken', L: [['obj', { t: 'horn', x: 150, y: 110, s: 0.9 }], ['fx', { t: 'wave', y: 200 }]] } });
  omen('ti_snare', { name: 'Kelp Snare', text: 'The ally with the highest ATK is caught: it won\'t ready on its owner\'s next turn.', run: async E => { const t = E.allyBy('atk', 'max'); if (t) E.freeze(t); }, art: { s: 'sunken', L: [['fx', { t: 'chains' }], ['beast', { t: 'tentacle', x: 150, y: 230, s: 0.9 }]] } });
  omen('ti_slack', { name: 'Slack Water', text: 'A lull: the Tide falls by 2.', run: async E => { await E.lowerCounter(2); }, art: { s: 'sea', L: [['fx', { t: 'heal', x: 150, y: 130, c: '#bff4ff' }]] } });
  RB.BOSSCARDS = B;

  RB.RAIDS = {
    crypt: {
      id: 'crypt', name: 'Crypt of the Hollow King', boss: 'Malgareth, the Hollow King', short: 'Malgareth', difficulty: 'Apprentice', hp: 113, hpPer: 98, strike: 7, retaliation: 2,
      intro: 'Beneath the drowned chapel, a king who refused to die has gathered an army that cannot.',
      rules: [
        { name: 'Grave Harvest', text: 'Whenever an ally is destroyed, Malgareth raises it as a 2/2 Risen Thrall.' },
        { name: 'Cold Hands', text: 'Melee attackers take 2 damage back when they strike Malgareth.' },
        { name: 'Hallowed Light', text: 'Whenever a hero or ally is healed, the light sears the undead: a random undead minion takes 1 damage (up to 3 times each turn).' },
        { name: 'Omens: the Soul Bell', text: 'An omen every boss turn with 3 or 4 heroes, every other boss turn with 2, every third with 1. The next three are shown above Malgareth.' },
        { name: 'Phylactery (60%)', text: 'Malgareth hides his soul in a Phylactery (0/12, Guardian). Destroying it deals 10 damage to him.' },
        { name: 'Death\'s Embrace (35%)', text: 'Malgareth reveals 1 more boss card each turn.' },
      ],
      healSears: true,
      omens: ['cr_bell', 'cr_bell', 'cr_graves', 'cr_drain', 'cr_wail', 'cr_bonewall', 'cr_eclipse', 'cr_lull'],
      onAllyDeath: async (E, p, a) => { if (!a.token || a.token !== 'thrall') { E.log('Grave Harvest: the fallen rise as a Risen Thrall.', 'boss'); await E.summonMinion('thrall', 1); } },
      phases: [
        { at: 0.6, name: 'Phylactery', text: 'Malgareth splits his soul into a Phylactery. While it stands, he can\'t be attacked.', run: async E => E.summonMinion('phylactery', 1) },
        { at: 0.35, name: 'Death\'s Embrace', text: 'Malgareth now reveals 1 more boss card each turn.', run: async E => { E.g.boss.cardsPerTurn += 1; } },
      ],
      deck: [['raisedead', 3], ['colossus', 1], ['shadowbolt', 3], ['siphon', 2], ['frailty', 2], ['entomb', 1], ['deathcoil', 2], ['whispers', 1], ['army', 1], ['chill', 2], ['pact', 1], ['gaze', 1]],
      treasure: ['soulreaper', 'hollowcrown', 'phylshard'],
      art: { s: 'crypthall', L: [fig({ race: 'skeleton', pose: 'cast', robe: 1, tatter: 1, helm: 'crown', crownCol: '#8affc0', gem: '#4aff9a', glowL: '#4aff9a', glowR: '#4aff9a', x: 150, y: 210, s: 1.05, cape: 1, capeCol: '#0a1a14' }), ['wisps', { x: 150, y: 120, w: 220, h: 120, n: 9, c: '#4aff9a' }]] },
      theme: '#4aff9a',
    },
    molten: {
      id: 'molten', name: 'The Molten Spire', boss: 'Vorthrax, the Cinder Tyrant', short: 'Vorthrax', difficulty: 'Veteran', hp: 87, hpPer: 82, strike: 5, retaliation: 2,
      intro: 'At the summit of the Molten Spire, the last of the great fire wyrms has woken hungry.',
      rules: [
        { name: 'Embers', text: 'Each boss turn adds an Ember. At 5 Embers, Vorthrax breathes Cinderstorm (4 damage to each hero) and takes to the air.' },
        { name: 'Wings of Flame', text: 'While he flies, he strafes the party each boss turn (2 damage to each hero), and only Volley and Skyward attacks, and abilities, can reach him. Deal 10 damage (+8 for each extra hero) to ground him: he crashes, stunned, and skips his next strike. Otherwise he lands after 3 boss turns.' },
        { name: 'Molten Scales', text: 'Melee attackers take 2 damage back when they strike Vorthrax.' },
        { name: 'Omens: Ashen Portents', text: 'An omen every boss turn with 3 or 4 heroes, every other boss turn with 2, every third with 1. The next three are shown above Vorthrax.' },
        { name: 'Searing Fury (60%)', text: 'Vorthrax reveals 1 more boss card each turn.' },
        { name: 'Desperation (25%)', text: 'Two Emberwhelps hatch at once, and Vorthrax\'s strike deals +2 damage.' },
      ],
      counter: { name: 'Embers', max: 5, riseText: 'Vorthrax gains an Ember: {v} of {max}.', fallText: 'Vorthrax loses Embers: {v} of {max}.', onMax: async E => { if (E.g.boss.flying) return; E.log('Vorthrax breathes Cinderstorm!', 'boss'); E.banner('Cinderstorm', 'boss'); for (const h of E.heroes()) await E.dmg(E.heroT(h), 4, { kind: 'boss' }); if (!E.g.over) await E.takeOff(); } },
      flight: { ground: n => 10 + 8 * (n - 1), turns: 3, crash: 0, strafe: 2 },
      omens: ['mo_fall', 'mo_fall', 'mo_vents', 'mo_stoke', 'mo_hatch', 'mo_heat', 'mo_floor', 'mo_cool'],
      counterPerTurn: 1,
      phases: [
        { at: 0.6, name: 'Searing Fury', text: 'Vorthrax now reveals 1 more boss card each turn.', run: async E => { E.g.boss.cardsPerTurn += 1; } },
        { at: 0.25, name: 'Desperation', text: 'Two Emberwhelps hatch, and Vorthrax\'s strike grows fiercer.', run: async E => { await E.summonMinion('whelp', 2); E.g.boss.strikeBonus += 2; } },
      ],
      deck: [['tailswipe', 2], ['searingbreath', 2], ['cinderrain', 2], ['whelps', 3], ['magmaguard', 1], ['wingbuffet', 2], ['roar', 1], ['ignite', 2], ['devour', 1], ['emberfeast', 1], ['scorchclaw', 2], ['meltarmor', 1]],
      treasure: ['cinderfang', 'tyrantheart', 'hatchling'],
      art: { s: 'volcano', img: 'vorthrax', L: [['dragon', { x: 150, y: 140, s: 0.82, breath: 1 }]] },
      theme: '#ff6a2a',
    },
    tide: {
      id: 'tide', name: 'The Sunken Cathedral', boss: 'Nethys, Mother of Tides', short: 'Nethys', difficulty: 'Legendary', hp: 98, hpPer: 158, strike: 6, retaliation: 2,
      intro: 'The cathedral bells still ring under the sea. Something down there is ringing them.',
      rules: [
        { name: 'Rising Tide', text: 'Each boss turn raises the Tide by 1, and Nethys\'s cards can raise it 1 more (never more than 2 in one boss turn). At 4, a Tidal Surge deals 3 damage to each hero and ally. Then the Tide recedes. On your turn you can bail water: pay 1 resource to lower the Tide by 1 (once per turn).' },
        { name: 'Grasp of the Deep', text: 'Nethys begins the fight with two Grasping Tentacles (3/4).' },
        { name: 'Coral Hide', text: 'Melee attackers take 2 damage back when they strike Nethys.' },
        { name: 'The Deep Awakens (50%)', text: 'The Leviathan Maw (5/8, Crushing) rises: while it lives, Nethys takes half damage. Nethys now reveals 1 more boss card each turn.' },
        { name: 'Omens: Drowned Portents', text: 'An omen every boss turn with 3 or 4 heroes, every other boss turn with 2, every third with 1. The next three are shown above Nethys.' },
      ],
      setup: async E => E.summonMinion('tentacle', E.g.players.length >= 3 ? E.g.players.length : 2),
      counter: { name: 'Tide', max: 4, riseText: 'The Tide rises to {v} of {max}.', fallText: 'The Tide falls to {v} of {max}.', resetText: 'The water drains away: the Tide is back to 0.', capText: 'The water churns, but the Tide has already risen twice this turn.', onMax: async E => { E.log('A Tidal Surge crashes over the party!', 'boss'); E.banner('Tidal Surge', 'boss'); for (const t of E.friendlyChars()) await E.dmg(t, 3, { kind: 'boss' }); } },
      counterPerTurn: 1, riseCap: 2,
      bail: { cost: 1 }, halvedBy: 'maw',
      omens: ['ti_wave', 'ti_wave', 'ti_spring', 'ti_lurkers', 'ti_pressure', 'ti_bells', 'ti_snare', 'ti_slack'],
      phases: [
        { at: 0.5, name: 'The Deep Awakens', text: 'The Leviathan Maw rises from the abyss: while it lives, Nethys takes half damage. Nethys now reveals 1 more boss card each turn.', run: async E => { await E.summonMinion('maw', 1); E.g.boss.cardsPerTurn += 1; } },
      ],
      deck: [['tentaclecard', 3], ['undertow', 2], ['sirensong', 2], ['crushing', 2], ['maelstrom', 2], ['brinehex', 2], ['abyssheal', 1], ['spawn', 2], ['lash', 2], ['inkcloud', 1], ['dragbelow', 1]],
      treasure: ['trident', 'pearl', 'leviathan'],
      art: { s: 'sea', L: [['beast', { t: 'tentacle', x: 60, y: 230, s: 1.0 }], ['beast', { t: 'tentacle', x: 250, y: 230, s: 0.9, curl: -1 }], fig({ pose: 'cast', robe: 1, helm: 'coral', glowL: '#7ae8ff', glowR: '#7ae8ff', x: 150, y: 214, s: 1.0, eye: '#bff4ff', capeCol: '#0a2a3a' }), ['fx', { t: 'wave', y: 200 }]] },
      theme: '#5ad8ff',
    },
  };

  /* ======================= COSMETICS (loot rewards) ======================= */
  // kind: back = card back, board = table theme, pet = companion. get: how it unlocks.
  //   default | loot (redeem a code; 'also' unlocks a bonus item) | win:<raid> | heroic:<raid> | allraids
  RB.COSMETICS = {
    back_classic: { kind: 'back', name: 'Raidbound Seal', get: 'default', desc: 'The standard gold-on-navy card back with the Raidbound crest.' },
    back_aether: { kind: 'back', name: 'Aether', get: 'loot', via: 'pet_gryphon', desc: 'Swirling starlit aether around a spectral gryphon. Comes free with the Spectral Gryphon code.' },
    back_lynx: { kind: 'back', name: 'Frostlynx', get: 'loot', desc: 'A snow lynx crest in a ring of ice crystals.' },
    back_crown: { kind: 'back', name: 'Hollow Crown', get: 'win:crypt', desc: 'Malgareth\'s spiked crown and soul-fire skull.' },
    back_ember: { kind: 'back', name: 'Emberforge', get: 'win:molten', desc: 'Vorthrax\'s crest in molten gold over cracked obsidian.' },
    back_abyss: { kind: 'back', name: 'Abyssal Tide', get: 'win:tide', desc: 'A sea serpent coiled around a pearl, framed in coral and shells.' },
    board_classic: { kind: 'board', name: 'War Table', get: 'default', desc: 'A candlelit oak war table with a map of the realm.' },
    board_banners: { kind: 'board', name: 'Hall of Banners', get: 'loot', desc: 'A great hall hung with crimson and gold banners.' },
    board_sky: { kind: 'board', name: 'Skyward', get: 'loot', via: 'pet_kite', desc: 'Above the clouds among floating islands. Comes free with the Paper Wyrm code.' },
    board_treasury: { kind: 'board', name: 'Dragon\'s Hoard', get: 'allraids', desc: 'A cavern of gold, crowns and jewels, with a dragon asleep on the pile.' },
    // #49: geometric playmats — four free from the start, three earned by opening booster packs
    board_lattice: { kind: 'board', name: 'Midnight Lattice', get: 'default', desc: 'Deep navy cloth with a gold art-deco lattice and a starburst medallion.' },
    board_arcane: { kind: 'board', name: 'Arcane Circle', get: 'default', desc: 'A glowing summoning circle of rings, runes and star polygons on a violet night.' },
    board_hexstone: { kind: 'board', name: 'Hexstone Floor', get: 'default', desc: 'Bevelled slate hexagon tiles around an inlaid brass compass.' },
    board_felt: { kind: 'board', name: 'Verdant Felt', get: 'default', desc: 'Green card-table baize framed by a woven gold border and knotwork corners.' },
    board_emberfall: { kind: 'board', name: 'Emberfall Mosaic', get: 'packs:ember:5', desc: 'A blazing sunburst of fire-coloured mosaic tiles.' },
    board_frostwing: { kind: 'board', name: 'Frostwing Crystal', get: 'packs:frost:5', desc: 'A great six-armed snowflake on faceted blue ice.' },
    board_voidshade: { kind: 'board', name: 'Voidshade Starfield', get: 'packs:void:5', desc: 'Constellations and a crescent moon drifting through a violet nebula.' },
    // #86: each set's legendary card as a table theme, earned by opening 10 packs of that set
    board_beezer: { kind: 'board', name: 'Beezer\'s Hunt', get: 'packs:ember:10', desc: 'Beezer, Orc Beast Shaman, raises his flaming totem between two burning wolves. The Emberfall legendary.' },
    board_guinevere: { kind: 'board', name: 'Guinevere\'s Flight', get: 'packs:frost:10', desc: 'Guinevere, the Prism Dragon, soars over snowy peaks on rainbow crystal wings. The Frostwing legendary.' },
    board_darkcrest: { kind: 'board', name: 'Darkcrest\'s Vigil', get: 'packs:void:10', desc: 'Sir Darkcrest, Void Knight, stands in a glowing violet rune circle among drifting stars. The Voidshade legendary.' },
    // #54
    board_tapestry: { kind: 'board', name: 'Royal Tapestry', get: 'default', desc: 'Crimson damask woven with gold, under a crowned royal crest.' },
    back_sigil: { kind: 'back', name: 'Runic Sigil', get: 'default', desc: 'A gold summoning sigil of rings and runes on deep crimson.' },
    back_dragonscale: { kind: 'back', name: 'Dragonscale', get: 'packtotal:10', desc: 'Emerald dragon scales around a gold-set ruby.' },
    pet_gryphon: { kind: 'pet', name: 'Spectral Gryphon', get: 'loot', also: 'back_aether', desc: 'A ghostly gryphon made of pale blue light.' },
    pet_kite: { kind: 'pet', name: 'Paper Wyrm', get: 'loot', also: 'board_sky', desc: 'A grinning paper dragon kite with streaming ribbons.' },
    pet_wisp: { kind: 'pet', name: 'Crowned Wisp', get: 'heroic:crypt', desc: 'A tiny crowned skull wrapped in friendly green soul-flame.' },
    pet_whelp: { kind: 'pet', name: 'Ember Whelp', get: 'heroic:molten', desc: 'A chubby baby dragon that puffs little flames.' },
    pet_seahorse: { kind: 'pet', name: 'Pearl Seahorse', get: 'heroic:tide', desc: 'A shimmering seahorse holding a glowing pearl, trailing bubbles.' },
    // #91: companions that come with a card (get 'card:<id>': own at least one copy)
    pet_emberpup: { kind: 'pet', name: 'Ember Wolf Pup', get: 'card:beezer', desc: 'A smouldering wolf pup with glowing ember eyes, one of Beezer\'s brood.' },
    pet_prismling: { kind: 'pet', name: 'Prism Dragonling', get: 'card:guinevere', desc: 'A tiny white dragon with rainbow crystal wings, from Guinevere\'s clutch.' },
    pet_raven: { kind: 'pet', name: 'Starless Raven', get: 'card:darkcrest', desc: 'A raven with violet, star-flecked feathers that keeps watch for Sir Darkcrest.' },
    pet_bearcub: { kind: 'pet', name: 'Cave Bear Cub', get: 'card:cavebear', desc: 'A round, sleepy brown bear cub with a big black nose.' },
    pet_gryphchick: { kind: 'pet', name: 'Gryphon Chick', get: 'card:gryphon', desc: 'A fluffy golden gryphon chick with oversized wings and a tiny beak.' },
  };

  /* #90: each companion gives its hero one tiny bonus in raids and dungeons (not in boss mode). Used by the engine. */
  RB.PET_PERKS = {
    pet_gryphon: { k: 'ward', n: 3, text: 'Your hero starts each fight with Ward 3 (blocks the first 3 damage).' },
    pet_kite: { k: 'firstRes', n: 1, text: '+1 resource to spend on your first turn.' },
    pet_wisp: { k: 'allyDraw', text: 'The first time one of your allies falls, draw a card.' },
    pet_whelp: { k: 'bossDmg', n: 3, text: 'Puffs fire at the boss for 3 damage when the fight starts.' },
    pet_seahorse: { k: 'trickle', n: 5, text: 'Heals your hero 1 at the start of your turn when hurt (up to 5 times a fight).' },
    pet_owl: { k: 'hand', n: 1, text: 'Draw 1 extra card in your opening hand.' },
    pet_ram: { k: 'firstAtk', n: 2, text: 'Your hero\'s first attack each fight deals +2 damage.' },
    pet_emberpup: { k: 'firstAlly', text: 'The first ally you play each fight gets +1 ATK and +1 health.' },
    pet_prismling: { k: 'halfHeal', n: 3, text: 'The first time your hero drops to half health, heals each friendly hero 3.' },
    pet_raven: { k: 'firstMinion', n: 2, text: 'Deals 2 damage to the first minion the boss summons.' },
    pet_bearcub: { k: 'maxhp', n: 2, text: '+2 max health for your hero.' },
    pet_gryphchick: { k: 'firstFero', text: 'The first ally you play each fight can attack right away.' },
  };


  /* ---------- character looks: colour schemes for the painted figures ----------
     Heroes have signature colours; class cards borrow their hero's look so a deck reads as one character. */
  const HEROLOOK = {
    aldric: { cloth: '#a81c2a', capeLining: '#e0b04a', plumeCol: '#f0ece0' },
    thorgrim: { cloth: '#2a6a46', hairCol: '#cc5222', furCol: '#8a7058' },
    lyssara: { cloth: '#4a2c9a', trim: '#e8c878', hairCol: '#f4e6b8', gem: '#c8a0ff' },
    grukka: { cloth: '#8a1e14', paint: '#d8401e', metal: '#6e6660' },
    hruna: { cloth: '#1e6a8a', trim: '#e8d08a', sash: '#c84a2a', hairCol: '#2e1c10' },
    snix: { cloth: '#5c2c80', trim: '#d8b050', leather: '#5a3a26' },
  };
  const CLASSLOOK = { paladin: HEROLOOK.aldric, warrior: HEROLOOK.grukka, ranger: HEROLOOK.thorgrim, rogue: HEROLOOK.snix, mage: HEROLOOK.lyssara, priest: HEROLOOK.hruna };
  const LOOK = {
    sellsword: { cloth: '#4e505e', hoodCol: '#3a3c48' }, hedgewitch: { cloth: '#3a6a2e', hatCol: '#2e4a24', hairCol: '#9a948a', gem: '#9aff6a' },
    mistranger: { cloth: '#2e5a3a' }, bram: { cloth: '#8a5a2a', hairCol: '#d8d0c0', beardCol: '#d8d0c0', leather2: '#5a3a22' },
    elowen: { cloth: '#ece4d0', trim: '#d8a840', hoodCol: '#e8e0cc', gem: '#ffe890' }, crossbowman: { cloth: '#2c50a6', hairCol: '#8a5a2a' },
    earthwarden: { cloth: '#6a4a2a', paint: '#e8e0c8' }, tinkerer: { cloth: '#c86a1a', metal: '#b09670', trim: '#e0b050' },
    windcaller: { cloth: '#3a7aa8', trim: '#e8e0c0', sash: '#e0b050' }, witchdoctor: { cloth: '#6a2a5a', paint: '#e8e0c8' },
    gorza: { metal: '#5e5852' }, warlord: { metal: '#56504c', plumeCol: '#2a1a14' },
    holystrike: { cloth: '#f0e6cc' }, aegis: { cloth: '#2c50a6' }, blessing: { cloth: '#e8c860' },
    shieldwall: { cloth: '#2c50a6', hairCol: '#8a4a22' },
    fireball: { cloth: '#b8361e', trim: '#ffcf6a', hairCol: '#f4e0b0' }, pyroblast: { cloth: '#a0241a', hatCol: '#6a160e', trim: '#ffb040' },
    frostnova: { cloth: '#3e82c0', trim: '#dff4ff', hairCol: '#e8f0ff' }, icebarrier: { cloth: '#5aa4d0', trim: '#effaff', hairCol: '#e8f0ff' },
    missiles: { cloth: '#5a2ca0' },
    warding: { cloth: '#ece4d0', trim: '#d8a840', hoodCol: '#e2d8c0' }, renewal: { cloth: '#ece4d0', trim: '#d8a840', hoodCol: '#e2d8c0' },
    leatherhood: { cloth: '#3a3c48', hoodCol: '#30323c' }, ancientforge: { cloth: '#8a3a1a', hairCol: '#cc5222' },
    archon: { cloth: '#f0e2b8', metal: '#dcc890', trim: '#fff0b0', plumeCol: '#fff6e0' },
    whispers: { cloth: '#2a2a3a', hoodCol: '#24222e' }, abyssheal: { cloth: '#1e6a7a', trim: '#ff9aa8' }, entomb: { cloth: '#2c50a6' },
  };
  const dress = (art, look) => { if (art && art.L && look) art.L.forEach(L => { if (L[0] === 'fig') L[1] = Object.assign({}, look, L[1]); }); };
  for (const h of Object.values(RB.HEROES)) dress(h.art, HEROLOOK[h.id]);
  for (const c of Object.values(RB.CARDS)) dress(c.art, LOOK[c.id] || (c.cls && c.cls.length === 1 ? CLASSLOOK[c.cls[0]] : null));
  for (const c of Object.values(RB.BOSSCARDS)) dress(c.art, LOOK[c.id]);
})(globalThis.RB = globalThis.RB || {});
