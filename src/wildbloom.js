/* RAIDBOUND — Booster set 5: Wildbloom (fix #115, Nov 11, 2026). Growth, flowers and the seasons.
   Rule word Grow N: a seed starts with N pips, loses one at the start of each of your turns and blooms at zero
   (see plantSeed/growSeeds in engine.js). Plant puts a seed token into play. Set land: Sunlit Meadow.
   Art: drawn with the game's own painter (art_wild.js), vivid and bright, then baked to gen/<id>.webp. */
(function (RB) {
  const C = RB.CARDS, TK = RB.TOKENS;
  const pick = (E, a) => a.length ? a[Math.floor(E.rnd() * a.length)] : null;
  const add = (id, o) => { o.id = id; o.fac = o.fac || 'neutral'; o.rarity = o.rarity || 'c'; o.set = 'frontier'; o.pack = 'wild'; o.art = o.art || { s: 'meadow', L: [] }; C[id] = o; };
  const mine = (E, p) => p.allies.map(a => E.T.ally(p, a));
  const friends = E => [...E.heroes().map(h => E.heroT(h)), ...E.allAllies()];
  const mostHurt = E => { const l = friends(E).filter(t => E.maxHpOf(t) - E.hpOf(t) > 0); return l.length ? l.reduce((a, b) => (E.maxHpOf(b) - E.hpOf(b)) * (b.t === 'hero' ? 1.3 : 1) > (E.maxHpOf(a) - E.hpOf(a)) * (a.t === 'hero' ? 1.3 : 1) ? b : a) : null; };
  const seeds = p => p.seeds.length;

  RB.PACK_SETS.wild = { name: 'Wildbloom', short: 'Wildbloom', theme: 'Growth, flowers and the seasons', blurb: 'Druids, treants and living gardens. Plant seeds that bloom into big turns a few rounds later, and heal through the boss\'s hits with Tend allies.', col: '#7ad84a' };
  RB.BOOSTER_SETS.push('wild');
  RB.KEYWORDS.grow = ['Grow', 'Grow N: a seed starts with N pips. At the start of your turn it loses one; when the last pip goes, it blooms (its Bloom effect happens) and is used up. Plant puts a seed into play.'];

  /* ---------- seeds and tokens ---------- */
  TK.wildseed = { id: 'wildseed', name: 'Wild Seed', type: 'seed', grow: 2, text: 'Grow 2. Bloom: heal 3 damage from your party\'s most wounded hero or ally.', bloom: async (E, p) => { const t = mostHurt(E); if (t) await E.heal(t, 3, { p }); } };
  TK.vineseed = { id: 'vineseed', name: 'Vine Seed', type: 'seed', grow: 2, text: 'Grow 2. Bloom: summon a 1/3 Vine with Bulwark.', bloom: async (E, p) => E.summonAlly(p, 'vine', 1) };
  TK.vine = { id: 'vine', name: 'Vine', type: 'ally', atk: 1, hp: 3, kw: ['protector'], race: 'Plant' };
  TK.oakling = { id: 'oakling', name: 'Oakling', type: 'ally', atk: 3, hp: 5, kw: ['protector', 'tend'], race: 'Treant' };
  TK.elderguard = { id: 'elderguard', name: 'Elder Grove Guardian', type: 'ally', atk: 6, hp: 8, kw: ['protector', 'thickhide', 'tend'], race: 'Treant' };
  TK.greatwolf = { id: 'greatwolf', name: 'Greatwood Wolf', type: 'ally', atk: 3, hp: 3, kw: ['ferocity', 'tend'], race: 'Beast' };
  TK.grovewarden = { id: 'grovewarden', name: 'Grove Warden', type: 'ally', atk: 2, hp: 4, kw: ['protector', 'tend'], race: 'Treant' };

  /* =================== allies =================== */
  add('oriel', { name: 'Oriel Thornsong, Bloom-Mother', type: 'ally', cost: 8, atk: 6, hp: 8, kw: ['unique', 'tend'], race: 'Elf', rarity: 'l', extraGrow: 1, tags: ['healAll'],
    text: 'When she enters play, every seed you control blooms. Each turn: heal 2 from each friendly hero and ally; your seeds grow 1 extra.',
    onEnter: async (E, c) => E.bloomAll(c.p), start: async (E, p) => { for (const t of friends(E)) await E.heal(t, 2, { p }); },
  });
  add('wildranger', { name: 'Wildbloom Ranger', type: 'ally', cost: 4, atk: 3, hp: 4, kw: ['longrange'], fac: 'concord', race: 'Elf', rarity: 'r',
    text: 'When one of your seeds blooms, deal 2 damage to a random enemy.', onBloom: async (E, p) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 2, { p, kind: 'effect' }); } });
  add('vinewall', { name: 'Vinewall Treant', type: 'ally', cost: 5, atk: 3, hp: 8, kw: ['protector', 'thickhide'], race: 'Treant', rarity: 'u', tags: ['summon'],
    text: 'When this enters play, plant two Vine Seeds.', onEnter: async (E, c) => E.plant(c.p, 'vineseed', 2), flavor: 'The path is closed. The path was always closed.' });
  add('mossantler', { name: 'Mossantler Elder', type: 'ally', cost: 4, atk: 3, hp: 6, kw: ['protector', 'tend'], race: 'Beast', rarity: 'u', flavor: 'Older than the road. Older than the kingdom that built it.' });
  add('bloomcaller', { name: 'Bloomcaller Druid', type: 'ally', cost: 3, atk: 2, hp: 5, kw: ['tend'], race: 'Minotaur', rarity: 'u', extraGrow: 1,
    text: 'At the start of your turn, your seeds grow 1 extra.' });
  add('thornboar', { name: 'Thornback Boar', type: 'ally', cost: 3, atk: 4, hp: 3, kw: ['ferocity', 'frenzy'], fac: 'clans', race: 'Beast', flavor: 'It does not go around the brambles.' });
  add('grovetender', { name: 'Grove Tender', type: 'ally', cost: 2, atk: 2, hp: 4, kw: ['tend'], race: 'Dwarf', tags: ['heal'],
    text: 'When this enters play, plant a Wild Seed.', onEnter: async (E, c) => E.plant(c.p, 'wildseed', 1) });
  add('bramblehound', { name: 'Bramble Hound', type: 'ally', cost: 2, atk: 3, hp: 3, kw: ['ferocity'], race: 'Beast', thorns: 1,
    text: 'Enemies that attack this take 1 extra damage back.', flavor: 'Pet it. Once.' });
  add('seedsprite', { name: 'Seedling Sprite', type: 'ally', cost: 1, atk: 1, hp: 1, kw: ['elusive'], race: 'Spirit',
    text: 'When this ally is destroyed, your seeds grow 1.', onDeath: async (E, c) => E.growSeeds(c.p, 1) });
  add('mosstoad', { name: 'Mossback Toad', type: 'ally', cost: 1, atk: 1, hp: 3, kw: ['tend'], race: 'Beast', flavor: 'Carries its own garden. Shares it with nobody.' });

  /* =================== abilities =================== */
  add('seasonsturn', { name: 'Season\'s Turn', type: 'ability', speed: 'basic', cost: 3, rarity: 'r', target: 'none',
    text: 'Every seed you control blooms now.', run: async (E, c) => E.bloomAll(c.p), aiScore: (E, p) => seeds(p) >= 2 ? 6 + seeds(p) * 3 : -1 });
  add('greatwoodpack', { name: 'Call the Greatwood Pack', type: 'ability', speed: 'basic', cost: 4, cls: ['ranger'], rarity: 'u', target: 'none', tags: ['summon'],
    text: 'Summon two 3/3 Greatwood Wolves with Swift and Tend.', run: async (E, c) => E.summonAlly(c.p, 'greatwolf', 2) });
  add('thornstorm', { name: 'Thornstorm', type: 'ability', speed: 'basic', cost: 3, rarity: 'u', target: 'none', tags: ['aoeMinion', 'dmg'], dmg: 2,
    text: 'Deal 2 damage to each enemy minion. Your seeds grow 1.', run: async (E, c) => { for (const t of E.aoe(E.minions(), 2)) await E.dmg(t, 2, { p: c.p, kind: 'spell' }); await E.growSeeds(c.p, 1); } });
  add('mendingbloom', { name: 'Mending Bloom', type: 'ability', speed: 'basic', cost: 2, target: 'friendly', tags: ['heal'], heal: 5,
    text: 'Heal 5 damage from a friendly hero or ally. Plant a Wild Seed.', run: async (E, c) => { await E.heal(c.target, 5, { p: c.p }); E.plant(c.p, 'wildseed', 1); } });
  add('scatterseeds', { name: 'Scatter Seeds', type: 'ability', speed: 'basic', cost: 1, target: 'none',
    text: 'Plant two Wild Seeds.', run: async (E, c) => E.plant(c.p, 'wildseed', 2), aiScore: (E, p) => 7 });
  add('brambles', { name: 'Grasping Brambles', type: 'ability', speed: 'basic', cost: 1, target: 'minion', tags: ['dmg'], dmg: 2,
    text: 'Stun an enemy minion. If it has 3 or less ATK, it also takes 2 damage.', run: async (E, c) => { const small = E.minAtk(c.target.m) <= 3; E.stun(c.target); if (small) await E.dmg(c.target, 2, { p: c.p, kind: 'spell' }); } });

  /* =================== items (seeds are planted, the rest stay equipped) =================== */
  add('elderseed', { name: 'Seed of the Elder Grove', type: 'item', cost: 4, rarity: 'e', grow: 4,
    text: 'Grow 4. Bloom: summon a 6/8 Elder Grove Guardian with Bulwark, Thick Hide and Tend, and heal 5 damage from each friendly hero.',
    bloom: async (E, p) => { await E.summonAlly(p, 'elderguard', 1); for (const h of E.heroes()) await E.heal(E.heroT(h), 5, { p }); } });
  add('wreath', { name: 'Wreath of Endless Spring', type: 'item', cost: 3, fac: 'concord', rarity: 'r', maxHp: 4, tags: ['heal'],
    text: 'Your hero has +4 maximum health. At the start of your turn, heal 2 damage from your hero.', start: async (E, p) => E.heal(E.heroT(p), 2, { p }) });
  add('verdantheart', { name: 'Amulet of the Verdant Heart', type: 'item', cost: 3, rarity: 'r', healPlus: 1,
    text: 'Your healing heals 1 more.', flavor: 'It has a pulse. Nobody gave it one.' });
  add('heartwood', { name: 'Heartwood Totem', type: 'item', cost: 3, fac: 'clans', rarity: 'u', tendPlus: 1,
    text: 'Your allies with Tend heal 2 instead of 1.' });
  add('glimmercap', { name: 'Glimmercap Spores', type: 'item', cost: 2, rarity: 'u', grow: 1, tags: ['draw'],
    text: 'Grow 1. Bloom: draw 2 cards.', bloom: async (E, p) => E.draw(p, 2) });
  add('gardensatchel', { name: 'Gardener\'s Satchel', type: 'item', cost: 2, rarity: 'u', tags: ['draw'],
    text: 'When one of your seeds blooms, draw a card (once per turn).', onBloom: async (E, p) => { if (p.bloomDrew) return; p.bloomDrew = true; await E.draw(p, 1); } });
  add('firstacorn', { name: 'Acorn of the First Oak', type: 'item', cost: 1, grow: 3,
    text: 'Grow 3. Bloom: summon a 3/5 Oakling with Bulwark and Tend.', bloom: async (E, p) => E.summonAlly(p, 'oakling', 1) });
  add('sunpetal', { name: 'Sunpetal Bulb', type: 'item', cost: 1, grow: 2,
    text: 'Grow 2. Bloom: heal 4 damage from each friendly hero.', bloom: async (E, p) => { for (const h of E.heroes()) await E.heal(E.heroT(h), 4, { p }); } });
  add('thornseed', { name: 'Thorncrown Seed', type: 'item', cost: 1, grow: 2,
    text: 'Grow 2. Bloom: deal 3 damage to each enemy minion.', bloom: async (E, p) => { for (const t of E.aoe(E.minions(), 3)) await E.dmg(t, 3, { p, kind: 'effect' }); } });

  /* =================== weapons =================== */
  add('hornbow', { name: 'Hornbow of the Greatwood', type: 'weapon', wtype: 'bow', cost: 3, atk: 3, strike: 1, kw: ['longrange'], cls: ['ranger'], rarity: 'r',
    text: 'When your hero attacks with this, your seeds grow 1.', onAttack: async (E, c) => E.growSeeds(c.p, 1) });
  add('livingstaff', { name: 'Staff of Living Wood', type: 'weapon', wtype: 'staff', cost: 3, atk: 2, strike: 1, cls: ['mage', 'priest'], rarity: 'u',
    text: 'When your hero attacks with this, plant a Wild Seed.', onAttack: async (E, c) => E.plant(c.p, 'wildseed', 1) });

  /* =================== resource cards =================== */
  add('eldergrove', { name: 'The Elder Grove', type: 'location', cost: 0, rarity: 'r', lcost: 3,
    text: 'Play as a resource. Once per turn: pay 3 to plant a Wild Seed and heal 2 damage from each of your allies.',
    lrun: async (E, c) => { E.plant(c.p, 'wildseed', 1); for (const t of mine(E, c.p)) await E.heal(t, 2, { p: c.p }); }, aiScore: (E, p) => 5 });
  add('lanternfly', { name: 'Lanternfly Glade', type: 'location', cost: 0, rarity: 'u', lcost: 2,
    text: 'Play as a resource. Once per turn: pay 2 to make your seeds grow 1.', lready: (E, p) => seeds(p) > 0, lrun: async (E, c) => E.growSeeds(c.p, 1), aiScore: (E, p) => 3 + seeds(p) * 2 });
  add('druidcircle', { name: 'Druid\'s Circle', type: 'location', cost: 0, rarity: 'u', lcost: 2,
    text: 'Play as a resource. Once per turn: pay 2 to give one of your allies Tend for good.', lready: (E, p) => p.allies.some(a => !a.tend && !(E.allyDef(a).kw || []).includes('tend')),
    lrun: async (E, c) => { const l = c.p.allies.filter(a => !a.tend && !(E.allyDef(a).kw || []).includes('tend')); const a = l.length ? l.reduce((x, y) => E.allyMax(c.p, y) > E.allyMax(c.p, x) ? y : x) : null; if (a) { a.tend = true; E.log(`${E.allyDef(a).name} learns to Tend.`, 'def'); } }, aiScore: (E, p) => 5 });
  add('mistfen', { name: 'Mistfen Marsh', type: 'location', cost: 0, lcost: 3,
    text: 'Play as a resource. Once per turn: pay 3 to stun a random enemy minion.', lready: (E, p) => E.minions().length > 0,
    lrun: async (E, c) => { const t = pick(E, E.minions()); if (t) E.stun(t); }, aiScore: (E, p) => E.minions().some(t => E.minAtk(t.m) >= 3) ? 6 : 2 });
  add('sunlitmeadow', { name: 'Sunlit Meadow', type: 'land', cost: 0, rarity: 'u', land: 'mend',
    onLand: async (E, p) => { for (const t of mine(E, p)) await E.heal(t, 1, { p }); await E.growSeeds(p, 1); },
    text: 'Land. Play as a resource. When it arrives: each of your allies heals 1, and your seeds grow 1.', flavor: 'Bees, butterflies and not a cloud in sight.' });
  add('sleepinggrove', { name: 'Wake the Sleeping Grove', type: 'quest', cost: 0, rarity: 'u', qcost: 3,
    text: 'Play as a resource. Complete (pay 3): summon two 2/4 Grove Wardens with Bulwark and Tend.', reward: async (E, c) => E.summonAlly(c.p, 'grovewarden', 2) });
  add('blightedglade', { name: 'Cleanse the Blighted Glade', type: 'quest', cost: 0, rarity: 'u', qcost: 0, cond: (E, p, r) => E.g.minionsKilled - ((r && r.mk) || 0) >= 3, condText: '3 minions fall after you take it up',
    text: 'Play as a resource. Reward: plant three Wild Seeds; heal each friendly hero 5.', reward: async (E, c) => { E.plant(c.p, 'wildseed', 3); for (const h of E.heroes()) await E.heal(E.heroT(h), 5, { p: c.p }); } });
  add('sacredgarden', { name: 'Tend the Sacred Garden', type: 'quest', cost: 0, qcost: 0, cond: (E, p) => p.blooms >= 3, condText: '3 of your seeds have bloomed',
    text: 'Play as a resource. Reward: draw 2 cards.', reward: async (E, c) => E.draw(c.p, 2) });


  /* ---------- art (the game's own painter, art_wild.js), baked to gen/<id>.webp ---------- */
  const V = { vig: 0.32, grain: 0.22 };
  const sc = (s, L, o) => Object.assign({ s, L }, V, o || {});
  const fig = o => ['fig', o], w = o => ['w', o], petals = o => ['petals', o || {}];
  const ART = {
    oriel: sc('meadow', [w({ t: 'elk', x: 112, y: 206, s: 0.82, bloom: 1, shadow: 60 }), fig({ race: 'elf', pose: 'staff', w: 'staff', robe: 1, helm: 'flowhair', hairCol: '#f8ecc8', cloth: '#3aa83a', cape: 1, capeCol: '#1e6a2a', glowL: '#c8ff6a', wGlow: '#c8ff6a', x: 222, y: 212, s: 0.82 }), petals({ n: 40, y: 100 })]),
    wildranger: sc('glade', [fig({ race: 'elf', pose: 'aim', w: 'bow', helm: 'hood', cloth: '#2e8a2a', hoodCol: '#1e5a1e', cape: 1, capeCol: '#2a6a1a', x: 140, y: 212, s: 0.92 }), petals({ n: 24, x: 220, y: 100, w: 120 })]),
    vinewall: sc('glade', [w({ t: 'treant', x: 150, y: 214, s: 0.88, armsUp: 1, moss: 1, shadow: 60 }), w({ t: 'vines', x: 150, y: 220, s: 0.9, n: 7 })]),
    mossantler: sc('meadow', [w({ t: 'elk', x: 150, y: 206, s: 0.95, fur: '#7a5a3a', shadow: 70 })], { sunX: 60, sunY: 50 }),
    bloomcaller: sc('meadow', [w({ t: 'vines', x: 150, y: 214, s: 0.5, n: 8, thorn: '#5ad83a', seed: 7 }), fig({ race: 'minotaur', pose: 'pray', robe: 1, cloth: '#6a8a3a', x: 150, y: 214, s: 0.82, glowL: '#c8ff6a', glowR: '#c8ff6a' }), petals({ n: 30, cols: ['#c8ff6a', '#ffffff', '#ffd23a'] })]),
    thornboar: sc('glade', [w({ t: 'boar', x: 150, y: 204, s: 1.25, shadow: 80 }), w({ t: 'vines', x: 40, y: 220, s: 0.5, n: 4, seed: 4 }), w({ t: 'vines', x: 270, y: 220, s: 0.5, n: 4, seed: 9 })]),
    grovetender: sc('meadow', [fig({ race: 'dwarf', pose: 'stand', cloth: '#7a5a2a', helm: 'round', x: 120, y: 212, s: 0.9 }), w({ t: 'seed', x: 200, y: 150, s: 0.35, sprout: 1 }), w({ t: 'seed', x: 230, y: 170, s: 0.28 }), w({ t: 'seed', x: 186, y: 182, s: 0.25, col: '#c8ff6a' })]),
    bramblehound: sc('glade', [['beast', { t: 'wolf', x: 150, y: 206, s: 1.05, tone: '#5a7a2a', eye: '#ffd23a', shadow: 70 }], w({ t: 'vines', x: 150, y: 210, s: 0.55, n: 6, seed: 3 })]),
    seedsprite: sc('meadow', [w({ t: 'sprite', x: 150, y: 130, s: 1.7 }), petals({ n: 20, cols: ['#fffbe0', '#ffffff'] })], { sunX: 60 }),
    mosstoad: sc('glade', [w({ t: 'toad', x: 150, y: 202, s: 1.5, shadow: 60 })]),
    seasonsturn: sc('meadow', [w({ t: 'seasons', x: 150, y: 196, s: 1.15 }), ['swirl', { x: 150, y: 120, r: 110, c: '#fffbe0' }]]),
    greatwoodpack: sc('glade', [['beast', { t: 'wolf', x: 100, y: 206, s: 0.9, tone: '#7a5a34', eye: '#7aff6a' }], ['beast', { t: 'wolf', x: 214, y: 200, s: 1.0, tone: '#6a4a2a', eye: '#7aff6a' }]]),
    thornstorm: sc('glade', [w({ t: 'minion', x: 90, y: 204, s: 0.9 }), w({ t: 'minion', x: 210, y: 206, s: 1, col: '#4a3a5a' }), ['swirl', { x: 150, y: 140, r: 120, n: 5, c: '#7ae04a' }], petals({ n: 60, y: 140, h: 120, cols: ['#ff6a8a', '#ffffff', '#5ad83a', '#ffd23a'] }), w({ t: 'thornseed', x: 150, y: 140, s: 0.9 })]),
    mendingbloom: sc('meadow', [fig({ race: 'human', pose: 'stand', w: 'sword', off: 'round', helm: 'round', x: 150, y: 214, s: 0.92 }), ['fx', { t: 'heal', x: 150, y: 130, c: '#c8ff8a' }], petals({ n: 26, x: 150, y: 140, w: 80, h: 80, cols: ['#ffffff', '#ff8ab8', '#ffd23a'] })]),
    scatterseeds: sc('meadow', [w({ t: 'hands', x: 70, y: 210, s: 0.9 }), ...[[120, 120], [150, 100], [180, 92], [210, 104], [240, 128], [168, 130], [200, 140]].map(([x, y], i) => w({ t: 'seed', x, y, s: 0.16 + (i % 3) * 0.04 }))], { sunX: 260, sunY: 60 }),
    brambles: sc('glade', [['beast', { t: 'wolf', x: 150, y: 206, s: 0.95, tone: '#4a3a4a', eye: '#ff5a3a' }], w({ t: 'vines', x: 150, y: 214, s: 0.9, n: 7, seed: 12, leaves: false })]),
    elderseed: sc('glade', [w({ t: 'hands', x: 150, y: 214, s: 1.2 }), w({ t: 'seed', x: 150, y: 150, s: 1.0, sprout: 1, col: '#ffd23a', glowCol: '#c8ff6a' })]),
    wreath: sc('meadow', [w({ t: 'wreath', x: 150, y: 150, s: 1.35 }), petals({ n: 20, cols: ['#ffffff', '#fff4c0'] })]),
    verdantheart: sc('glade', [w({ t: 'heartAmulet', x: 150, y: 140, s: 1.3 })]),
    heartwood: sc('meadow', [w({ t: 'totem', x: 150, y: 210, s: 1.05, shadow: 30 })], { sunX: 60 }),
    glimmercap: sc('nightglade', [w({ t: 'mushrooms', x: 150, y: 200, s: 1.5 })], { vig: 0.45 }),
    gardensatchel: sc('meadow', [w({ t: 'satchel', x: 150, y: 168, s: 1.25 })]),
    firstacorn: sc('glade', [w({ t: 'acorn', x: 150, y: 150, s: 2.0 })]),
    sunpetal: sc('meadow', [w({ t: 'bulb', x: 150, y: 196, s: 1.5 })]),
    thornseed: sc('glade', [w({ t: 'thornseed', x: 150, y: 140, s: 1.6 })]),
    hornbow: sc('glade', [w({ t: 'hornbow', x: 150, y: 120, s: 1.3, rot: 25 })]),
    livingstaff: sc('glade', [w({ t: 'livingstaff', x: 150, y: 140, s: 1.0, rot: 18 })]),
    eldergrove: sc('glade', [['glow', { x: 150, y: 196, r: 70, c: '#9affd0', op: 0.8 }], w({ t: 'pool', x: 150, y: 196, s: 1 }), petals({ n: 30, y: 120, cols: ['#e8ff6a', '#ffffff'] })]),
    lanternfly: sc('nightglade', [], { flies: 70, vig: 0.45 }),
    druidcircle: sc('meadow', [w({ t: 'stones', x: 150, y: 190, s: 1.05 })], { skyTop: '#3a3aa8', skyMid: '#c86a8a', skyLow: '#ffd8a0', sunX: 150, sunY: 120 }),
    mistfen: sc('marsh', []),
    sunlitmeadow: sc('meadow', [petals({ n: 16, y: 120, cols: ['#ffd23a', '#ffffff'] })], { nFlowers: 70 }),
    sleepinggrove: sc('glade', [w({ t: 'treant', x: 90, y: 214, s: 0.7, eye: '#fff4a0' }), w({ t: 'treant', x: 220, y: 216, s: 0.8, eye: '#fff4a0', moss: 1 })]),
    blightedglade: sc('glade', [['glow', { x: 220, y: 120, r: 120, c: '#fffbd0', op: 0.6 }], fig({ race: 'elf', pose: 'cast', robe: 1, helm: 'hood', cloth: '#e8f0d0', hoodCol: '#3a8a3a', glowL: '#fffbd0', glowR: '#fffbd0', x: 190, y: 212, s: 0.85 }), w({ t: 'vines', x: 50, y: 220, s: 0.6, n: 5, col: '#5a5a5a', leaves: false, thorn: '#8a8a8a' })]),
    sacredgarden: sc('meadow', [w({ t: 'wall', x: 150, y: 150, s: 1 }), w({ t: 'fountain', x: 150, y: 196, s: 1.1 }), w({ t: 'bed', x: 58, y: 206, s: 0.9 }), w({ t: 'bed', x: 242, y: 206, s: 0.9, col: '#ffffff' })]),
    wildseed: sc('meadow', [w({ t: 'seed', x: 150, y: 140, s: 1.2, sprout: 1 })]),
    vineseed: sc('glade', [w({ t: 'seed', x: 150, y: 140, s: 1.2, sprout: 1, col: '#7ae04a', dark: '#2a6a1a' })]),
    vine: sc('glade', [w({ t: 'vines', x: 150, y: 216, s: 1.1, n: 6, seed: 21 })]),
    oakling: sc('glade', [w({ t: 'treant', x: 150, y: 212, s: 0.7, vines: false })]),
    elderguard: sc('glade', [w({ t: 'treant', x: 150, y: 216, s: 1.0, armsUp: 1, blossoms: 1, moss: 1 })]),
    greatwolf: sc('glade', [['beast', { t: 'wolf', x: 150, y: 204, s: 1.1, tone: '#7a5a34', eye: '#7aff6a' }]]),
    grovewarden: sc('glade', [w({ t: 'treant', x: 150, y: 214, s: 0.8, moss: 1 })]),
  };
  for (const [k, v] of Object.entries(ART)) (C[k] || TK[k]).art = v;

  /* ---------- table themes ---------- */
  Object.assign(RB.COSMETICS, {
    board_wild5: { kind: 'board', name: 'Wildbloom Garden', get: 'packs:wild:5', desc: 'A sunny mosaic of green leaves and bright flowers around a golden seed.' },
    board_oriel: { kind: 'board', name: 'Oriel\'s Spring', get: 'card:oriel', desc: 'Oriel Thornsong rides her great elk through a meadow bursting into bloom. The Wildbloom legendary.' },
  });
})(globalThis.RB);
