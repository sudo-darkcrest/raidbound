/* RAIDBOUND — Booster set 4: The Armory (fix #115, Nov 11, 2026). Steel, gear and the hands that wield it.
   35 cards painted with SpriteCook (gen/<id>.webp). New rule word, Geared: your hero has a weapon and at least
   2 pieces of armor (see geared() in engine.js). The set's land, Duelists' Yard, never counts toward a dungeon's
   own-card limit (like every land). Table themes: the Armory Mosaic after 5 packs, Everforge's Hall when you find
   Everforge itself. */
(function (RB) {
  const C = RB.CARDS, TK = RB.TOKENS;
  const pick = (E, a) => a.length ? a[Math.floor(E.rnd() * a.length)] : null;
  // painted art is looked up by card id; the SVG fallback is only a plain glow
  const art = (s, col) => ({ s, L: [['glow', { x: 150, y: 120, r: 100, c: col || '#9ab8d8', op: 0.5 }]] });
  const add = (id, o) => { o.id = id; o.fac = o.fac || 'neutral'; o.rarity = o.rarity || 'c'; o.set = 'frontier'; o.pack = 'armory'; o.art = o.art || art('forge'); C[id] = o; };
  const isGear = d => d.type === 'weapon' || d.type === 'armor';

  RB.PACK_SETS.armory = { name: 'The Armory', short: 'Armory', theme: 'Steel, gear and the hands that wield it', blurb: 'Weapons, armor, trinkets and the smiths who make them. Gear up your hero: many cards grow stronger when you are Geared (a weapon and 2 pieces of armor).', col: '#9ab8d8' };
  RB.BOOSTER_SETS.push('armory');
  RB.KEYWORDS.geared = ['Geared', 'Your hero has a weapon and at least 2 pieces of armor equipped. Cards that say Geared get their bonus while this is true.'];

  /* ---------- token ---------- */
  TK.manatarms = { id: 'manatarms', name: 'Man-at-Arms', type: 'ally', atk: 2, hp: 3, kw: ['protector'], race: 'Human', art: art('castle', '#c8d8ec') };

  /* =================== weapons =================== */
  add('everforge', { name: 'Everforge, the Shifting Blade', type: 'weapon', wtype: 'sword', anyClass: true, cost: 5, atk: 5, strike: 1, rarity: 'l', tags: ['dmgRandom'],
    text: 'Any hero can equip this. When your hero attacks with it, deal 2 damage to another random enemy (Geared: 4).',
    onAttack: async (E, c) => { const t = pick(E, E.enemies().filter(x => !c.defender || !E.same(x, c.defender))); if (t) await E.dmg(t, E.geared(c.p) ? 4 : 2, { p: c.p, kind: 'effect' }); },
    flavor: 'It becomes whatever the hand knows best.' });
  add('arbalest', { name: 'Riveted Arbalest', type: 'weapon', wtype: 'crossbow', cost: 3, atk: 3, strike: 1, kw: ['longrange'], cls: ['ranger'], rarity: 'r', gearedAtk: 2,
    text: 'Geared: +2 ATK.', flavor: 'Takes a full minute to wind. Takes the boss a full minute to stop shaking.' });
  add('runehammer', { name: 'Runesmith\'s Warhammer', type: 'weapon', wtype: 'hammer', cost: 4, atk: 4, strike: 1, cls: ['warrior', 'paladin'], rarity: 'u', tags: ['shield'],
    text: 'When your hero attacks with this, prevent the next 2 damage to your hero.', onAttack: async (E, c) => E.shield(c.p, 2) });
  add('spellwand', { name: 'Spellwright\'s Wand', type: 'weapon', wtype: 'wand', cost: 3, atk: 2, strike: 1, kw: ['longrange'], spell: 1, cls: ['mage', 'priest'], rarity: 'u',
    text: 'Your spells and powers deal +1 damage.', flavor: 'Every rune on it was a footnote once.' });
  add('armingsword', { name: 'Squire\'s Arming Sword', type: 'weapon', wtype: 'sword', cost: 2, atk: 2, strike: 0, cls: ['warrior', 'paladin', 'rogue'], gearedAtk: 2,
    text: 'Geared: +2 ATK.', flavor: 'Every knight\'s first sword. Most of them never stop missing it.' });

  /* =================== armor =================== */
  add('bastion', { name: 'Bastion of the Last King', type: 'armor', slot: 'chest', atype: 'plate', cost: 5, def: 4, use: 1, cls: ['warrior', 'paladin'], rarity: 'l', heroAtk: 1, lastStand: true, tags: ['shield'],
    text: 'Your hero has +1 ATK. Once per game, your hero survives a killing blow at 1 health.' });
  add('steadyhand', { name: 'Gauntlets of the Steady Hand', type: 'armor', slot: 'hands', atype: 'mail', cost: 2, def: 1, use: 0, cls: ['warrior', 'paladin', 'ranger'], rarity: 'u', gearedStrike: 1,
    text: 'Geared: your weapon\'s strike cost is 1 less.' });
  add('spellmantle', { name: 'Spellweave Mantle', type: 'armor', slot: 'chest', atype: 'cloth', cost: 3, def: 2, use: 1, cls: ['mage', 'priest'], rarity: 'u', tags: ['shield'],
    text: 'When you play an ability, prevent the next 1 damage to your hero.', onAbility: async (E, p) => E.shield(p, 1) });
  add('pavise', { name: 'Ironwall Pavise', type: 'armor', slot: 'shield', atype: 'shield', cost: 3, def: 3, use: 1, cls: ['warrior', 'paladin'], gearedDef: 1,
    text: 'Geared: blocks 1 more.', flavor: 'Plant it, crouch, and let the arrows argue with the iron.' });
  add('softboots', { name: 'Smuggler\'s Soft Boots', type: 'armor', slot: 'feet', atype: 'leather', cost: 2, def: 1, use: 0, cls: ['rogue', 'ranger'], blockDraw: true, tags: ['draw'],
    text: 'When these block, draw a card.', flavor: 'Not a sound on the stairs. Not a coin left in the vault.' });

  /* =================== items =================== */
  add('medallion', { name: 'Medallion of the Victor', type: 'item', cost: 4, rarity: 'e', tags: ['buff', 'shield'],
    text: 'Geared: at the start of your turn, your hero gets +2 ATK this turn and a ward of 2 (wards from this don\'t stack).',
    start: async (E, p) => { if (!E.geared(p)) return; E.tempAtk(p, 2); if (p.hero.shield < 2) E.shield(p, 2 - p.hero.shield); }, flavor: 'Won once. Earned every day since.' });
  add('secondwind', { name: 'Pendant of Second Wind', type: 'item', cost: 3, rarity: 'r', tags: ['heal'],
    text: 'Once per game, at the start of your turn, if your hero has 10 or less health, heal 10.',
    start: async (E, p) => { if (p.hero.secondWind || E.heroHp(p) > 10) return; p.hero.secondWind = true; E.log(`The Pendant of Second Wind glows — ${E.pdef(p).name} gets back up!`, 'def'); await E.heal(E.heroT(p), 10); } });
  add('quickbrooch', { name: 'Brooch of Quick Casting', type: 'item', cost: 3, cls: ['mage', 'priest', 'rogue'], rarity: 'r', firstAbilityOff: 1,
    text: 'The first ability you play each turn costs 1 less.' });
  add('ironoath', { name: 'Signet of the Iron Oath', type: 'item', cost: 2, fac: 'concord', rarity: 'u', gearedHeroAtk: 2, tags: ['buff'],
    text: 'Geared: your hero has +2 ATK.', flavor: 'Sealed in wax, sworn in steel.' });
  add('warcharm', { name: 'Bloodfang War Charm', type: 'item', cost: 2, fac: 'clans', rarity: 'u', gearedAllyAtk: 1, tags: ['buff'],
    text: 'Geared: your allies have +1 ATK.' });
  add('pouchbelt', { name: 'Belt of Many Pouches', type: 'item', cost: 2, rarity: 'u', tags: ['draw'],
    text: 'When you play a weapon or armor, draw a card.', onGear: async (E, p) => E.draw(p, 1), flavor: 'Somewhere in there is the thing you need. Also a sandwich.' });
  add('steadywind', { name: 'Quiver of the Steady Wind', type: 'item', cost: 2, cls: ['ranger'], rarity: 'u', wpnAtk: 1, volleyAllyAtk: 1, tags: ['buff'],
    text: 'Your weapon has +1 ATK. Your Volley allies have +1 ATK.' });
  add('oilcloak', { name: 'Traveler\'s Oilcloth Cloak', type: 'item', cost: 2, minionDR: 1, tags: ['shield'],
    text: 'Your hero takes 1 less damage from minion attacks.', flavor: 'Rain, mud, goblin spit. It all runs off.' });
  add('whetstone', { name: 'Whetstone of the Ninth Forge', type: 'item', cost: 1, tags: ['buff'],
    use: { cost: 0, destroy: true, target: 'none', ready: (E, p) => !!p.weapon }, urun: async (E, c) => E.sharpen(c.p, 2),
    text: 'Use: destroy this to give your weapon +2 ATK while it stays equipped.' });
  add('armorerkit', { name: 'Armorer\'s Kit', type: 'item', cost: 1, tags: ['draw'],
    use: { cost: 0, destroy: true, target: 'none' }, urun: async (E, c) => E.tutor(c.p, d => isGear(d)),
    text: 'Use: destroy this to search your deck for a weapon or armor and put it into your hand.' });

  /* =================== allies =================== */
  add('bryndis', { name: 'Quartermaster Bryndis', type: 'ally', cost: 4, atk: 3, hp: 5, kw: ['unique'], race: 'Dwarf', rarity: 'r', tags: ['draw'],
    text: 'When Bryndis enters play, search your deck for a weapon or armor and put it into your hand.', onEnter: async (E, c) => E.tutor(c.p, d => isGear(d)),
    flavor: '"Signed out, signed back in. Not a scratch."' });
  add('animarmor', { name: 'Animated Armor', type: 'ally', cost: 3, atk: 3, hp: 4, kw: ['protector', 'thickhide'], race: 'Construct', rarity: 'u', atkPerArmor: 3,
    text: '+1 ATK for each piece of armor your hero has (up to +3).', flavor: 'Nobody is inside. Nobody has ever been inside.' });
  add('shieldsquire', { name: 'Shieldbearer Squire', type: 'ally', cost: 2, atk: 2, hp: 4, kw: ['protector'], fac: 'concord', race: 'Human', gearedBuff: 1,
    text: 'Geared: +1 ATK and +1 health.' });
  add('clanarmorer', { name: 'Clan Armorer', type: 'ally', cost: 2, atk: 3, hp: 3, fac: 'clans', race: 'Orc',
    text: 'When this enters play, ready one of your hero\'s used armor pieces.', onEnter: async (E, c) => { const e = Object.values(c.p.armor).find(x => x.ex); if (e) { e.ex = false; E.log(`${C[e.c.id].name} is ready again.`, 'def'); } } });
  add('appsmith', { name: 'Apprentice Smith', type: 'ally', cost: 1, atk: 1, hp: 3, race: 'Goblin', tags: ['buff'],
    text: 'When this enters play, your weapon gets +1 ATK while it stays equipped.', onEnter: async (E, c) => E.sharpen(c.p, 1), flavor: 'Mostly sparks. Occasionally sword.' });

  /* =================== abilities =================== */
  add('muster', { name: 'Muster the Men-at-Arms', type: 'ability', speed: 'basic', cost: 4, rarity: 'r', target: 'none', tags: ['summon'],
    text: 'Summon two 2/3 Men-at-Arms with Bulwark. Geared: they get +1 ATK.',
    run: async (E, c) => { const n = c.p.allies.length; await E.summonAlly(c.p, 'manatarms', 2); if (E.geared(c.p)) for (const a of c.p.allies.slice(n)) a.atkB += 1; } });
  add('riposte', { name: 'Riposte', type: 'ability', speed: 'instant', react: 'hero', cost: 2, cls: ['warrior', 'paladin', 'rogue'], rarity: 'u', target: 'none', tags: ['shield'], shield: 3,
    text: 'Prevent the next 3 damage to your hero. If your hero has a weapon, deal damage equal to its ATK to the attacker.',
    run: async (E, c) => { E.shield(c.p, 3); const t = E.g.react && E.g.react.attT; if (c.p.weapon && t && E.isAlive(t)) await E.dmg(t, E.weaponAtk(c.p), { p: c.p, kind: 'hero' }); } });
  add('quickchange', { name: 'Quick Change', type: 'ability', speed: 'basic', cost: 1, rarity: 'u', target: 'none', tags: ['ramp'],
    text: 'The next weapon or armor you play this turn costs 3 less.', run: async (E, c) => { c.p.quickChange = 3; E.log('The next weapon or armor costs 3 less this turn.', 'def'); } });
  add('sharpen', { name: 'Sharpen Blades', type: 'ability', speed: 'basic', cost: 1, target: 'none', tags: ['buff'],
    text: 'Your hero and allies get +1 ATK this turn. Geared: +2 instead.', run: async (E, c) => { const k = E.geared(c.p) ? 2 : 1; E.tempAtk(c.p, k); E.allyTempAtk(c.p, k); } });
  add('bracingslam', { name: 'Bracing Slam', type: 'ability', speed: 'basic', cost: 2, cls: ['warrior', 'paladin'], target: 'enemy', tags: ['dmg'], dmg: 3,
    text: 'Deal 2 damage to an enemy. If it is a minion and survives, stun it. Geared: 4 damage instead.',
    run: async (E, c) => { await E.dmg(c.target, E.geared(c.p) ? 4 : 2, { p: c.p, kind: 'spell' }); if (c.target.t === 'minion' && E.isAlive(c.target)) E.stun(c.target); } });

  /* =================== resource cards =================== */
  add('nineforges', { name: 'The Nine Forges', type: 'location', cost: 0, rarity: 'r', lcost: 2, tags: ['buff'],
    lready: (E, p) => !!p.weapon && (p.weapon.forge || 0) < 3, lrun: async (E, c) => E.sharpen(c.p, 1, 'forge', 3),
    text: 'Play as a resource. Once per turn: pay 2 to give your weapon +1 ATK while it stays equipped (up to +3).' });
  add('bazaar', { name: 'Bazaar of Blades', type: 'location', cost: 0, rarity: 'u', lcost: 2, draws: true, tags: ['draw'],
    lrun: async (E, c) => { const p = c.p, top = p.deck.slice(-3), hit = top.slice().reverse().find(x => isGear(C[x.id]) || C[x.id].type === 'item');
      if (!hit) { E.log(`${E.pdef(p).name} browses the Bazaar but finds nothing worth buying.`, ''); return; }
      p.deck.splice(p.deck.indexOf(hit), 1); p.hand.push(hit); E.log(`${E.pdef(p).name} buys ${C[hit.id].name} at the Bazaar.`, 'play'); },
    text: 'Play as a resource. Once per turn: pay 2 to look at the top 3 cards of your deck and put a weapon, armor or item from among them into your hand.' });
  add('duelyard', { name: 'Duelists\' Yard', type: 'land', cost: 0, rarity: 'u', land: 'might',
    onLand: async (E, p) => { if (E.geared(p)) { E.tempAtk(p, 2); E.shield(p, 1); } else E.tempAtk(p, 1); },
    text: 'Land. Play as a resource. When it arrives: your hero gets +1 ATK this turn. Geared: +2 instead, and prevent the next 1 damage to your hero.',
    flavor: 'Straw men never hit back.' });
  add('tourney', { name: 'The Grand Tourney', type: 'quest', cost: 0, rarity: 'u', qcost: 0, cond: (E, p) => (p.wAttacks || 0) >= 3, condText: 'your hero has attacked with a weapon 3 times',
    text: 'Play as a resource. Reward: draw a card, and your hero has +1 ATK for the rest of the game.',
    reward: async (E, c) => { await E.draw(c.p, 1); c.p.hero.permAtk = (c.p.hero.permAtk || 0) + 1; } });
  add('rareores', { name: 'Gather the Rare Ores', type: 'quest', cost: 0, qcost: 0, cond: (E, p) => E.geared(p), condText: 'your hero is Geared',
    text: 'Play as a resource. Reward: draw 2 cards, and your weapon gets +1 ATK while it stays equipped.',
    reward: async (E, c) => { await E.draw(c.p, 2); E.sharpen(c.p, 1); } });

  /* ---------- table themes ---------- */
  Object.assign(RB.COSMETICS, {
    board_armory5: { kind: 'board', name: 'Armory Mosaic', get: 'packs:armory:5', desc: 'Polished blue-grey steel plates and gold rivets, laid out like a knight\'s parade shield.' },
    // fix #115 (user's choice): a set's legendary table unlocks when you find that legendary card in a pack
    board_everforge: { kind: 'board', name: 'Everforge\'s Hall', get: 'card:everforge', desc: 'Everforge, the Shifting Blade, floats above its plinth in a bright castle armory. The Armory legendary.' },
  });
})(globalThis.RB);
