/* RAIDBOUND — #63 Dungeons: self-running encounters for up to 3 heroes using starter decks.
   The Dungeon flips cards by its Level, marks a random hero each turn (all its attacks go there) and levels up as it is hurt.
   Heroes earn Dungeon XP; each level lets 3 more of your own cards into your starter deck for dungeon runs.
   Art reuses existing paintings (img: key) and the layered painter; no new SpriteCook art. */
(function (RB) {
  const TK = RB.TOKENS, BC = RB.BOSSCARDS;
  const fig = o => ['fig', o];
  const glow = (x, y, r, c, op) => ['glow', { x, y, r, c, op: op == null ? 0.5 : op }];
  const tok = (id, o) => { o.id = id; TK[id] = o; };
  const card = (id, o) => { o.id = id; o.dungeonCard = true; BC[id] = o; };
  const summon = (tid, k) => async E => E.summonMinion(tid, k || 1);

  RB.DUNGEON_MODES = {
    novice: { name: 'Novice', level: 1, first: false, text: 'Heroes go first. The dungeon starts at level 1.' },
    experienced: { name: 'Experienced', level: 1, first: true, text: 'The dungeon goes first and starts at level 1.' },
    heroic: { name: 'Heroic', level: 2, first: true, text: 'The dungeon goes first and starts at level 2.' },
    legendary: { name: 'Legendary', level: 3, first: true, text: 'The dungeon goes first and starts at level 3.' },
  };
  const levelPhases = [
    { at: 0.7, name: 'Level up', text: 'The dungeon grows stronger: +1 level (flips more cards, strikes harder).', run: async E => E.levelUp(1) },
    { at: 0.4, name: 'Level up', text: 'The dungeon grows stronger again: +1 level.', run: async E => E.levelUp(1) },
  ];
  const commonRules = flip => [
    { name: 'Flip', text: `At the start of its turn the dungeon flips cards from its deck: ${flip.map((f, i) => `level ${i + 1}: ${f}`).join(', ')}. Allies and equipment stay in play; abilities resolve. Dungeon cards cost nothing.` },
    { name: 'Marked', text: 'After flipping, the dungeon rolls a die and MARKS one hero at random. The dungeon hero and all its allies attack the marked hero (a ready Bulwark can still step in).' },
    { name: 'Gauntlet', text: 'Fight through two under-bosses, then the master of the dungeon, all in one fight. Your heroes keep their health, cards and allies from one boss to the next. A boss\'s equipment leaves with it; its minions stay.' },
    { name: 'Levels', text: 'The dungeon levels up each time an under-boss falls: it flips more cards and strikes 1 harder per level.' },
  ];

  /* =================== 1. Thornwood Hollow =================== */
  tok('d_wolf', { name: 'Thornwood Dire Wolf', atk: 2, hp: 2, kw: ['ferocity'], ai: 'random', art: { img: 'packleader' } });
  tok('d_bear', { name: 'Mossback Bear', atk: 3, hp: 5, ai: 'lowest', art: { img: 'cavebear' } });
  tok('d_stalker', { name: 'Mistwood Stalker', atk: 3, hp: 2, kw: ['elusive'], ai: 'random', art: { img: 'mistranger' } });
  tok('d_hag', { name: 'Bramble Hag', atk: 1, hp: 3, ai: 'random', art: { img: 'hedgewitch' } });
  tok('d_heartwood', { name: 'Heartwood Guardian', atk: 2, hp: 7, kw: ['guardian'], ai: 'lowest', art: { img: 'grovebinder' } });
  card('thw_wolves', { name: 'Call the Pack', kind: 'summon', text: 'Summon two Thornwood Dire Wolves (2/2, Swift).', run: summon('d_wolf', 2), art: { img: 'packleader' } });
  card('thw_bear', { name: 'Mossback Bear', kind: 'summon', text: 'Summon a Mossback Bear (3/5).', run: summon('d_bear'), art: { img: 'cavebear' } });
  card('thw_stalker', { name: 'Mistwood Stalker', kind: 'summon', text: 'Summon a Mistwood Stalker (3/2, Shrouded).', run: summon('d_stalker'), art: { img: 'mistranger' } });
  card('thw_hag', { name: 'Bramble Hag', kind: 'summon', text: 'Summon a Bramble Hag (1/3). The boss heals 4.', run: async E => { await E.summonMinion('d_hag', 1); await E.bossHeal(4); }, art: { img: 'hedgewitch' } });
  card('thw_guardian', { name: 'Heartwood Guardian', kind: 'summon', text: 'Summon a Heartwood Guardian (2/7, Guardian).', run: summon('d_heartwood'), art: { img: 'grovebinder' } });
  card('thw_bark', { name: 'Ironbark Hide', kind: 'equip', text: 'Equipment: the boss strikes for 1 more and melee attackers take 1 more damage back.', run: async E => E.equipBoss('Ironbark Hide', 1, 1), art: { s: 'forest', L: [glow(150, 120, 80, '#9a7a4a', 0.5), ['obj', { t: 'shieldItem', x: 150, y: 118, s: 0.9 }]] } });
  card('thw_vines', { name: 'Thornwhip Vines', kind: 'equip', text: 'Equipment: the boss strikes for 2 more.', run: async E => E.equipBoss('Thornwhip Vines', 2, 0), art: { s: 'grove', L: [['fx', { t: 'chains' }], glow(150, 140, 80, '#7ad04a', 0.4)] } });
  card('thw_entangle', { name: 'Entangling Roots', kind: 'curse', text: 'The ally with the highest ATK is frozen: it won\'t ready on its owner\'s next turn.', run: async E => { const t = E.allyBy('atk', 'max'); if (t) E.freeze(t); }, art: { s: 'forest', L: [['fx', { t: 'chains' }], ['beast', { t: 'treant', x: 150, y: 220, s: 0.6 }]] } });
  card('thw_spores', { name: 'Choking Spores', kind: 'attack', text: 'Deal 2 damage to each hero.', run: async E => { for (const h of E.heroes()) await E.dmg(E.heroT(h), 2, { kind: 'boss' }); }, art: { s: 'grove', p: 'embers', pn: 30, pal: { glow: '#c8ff6a' }, L: [['wisps', { x: 150, y: 140, w: 280, h: 140, n: 18, c: '#d8ff8a' }]] } });
  card('thw_crush', { name: 'Root Crush', kind: 'attack', text: 'Deal 4 damage to the hero with the most health.', run: async E => { const h = E.mostHealth(); if (h) await E.dmg(E.heroT(h), 4, { kind: 'boss' }); }, art: { s: 'forest', L: [['beast', { t: 'treant', x: 150, y: 220, s: 0.9 }], ['fx', { t: 'slash', x: 150, y: 140 }]] } });
  card('thw_overgrowth', { name: 'Overgrowth', kind: 'heal', text: 'The boss heals 5. Each dungeon ally gets +1 ATK and +1 health.', run: async E => { await E.bossHeal(5); E.buffMinions(1, 1); }, art: { s: 'grove', L: [['fx', { t: 'heal', x: 150, y: 120, c: '#9aff6a' }], ['fx', { t: 'buff', x: 150, y: 170, c: '#9aff6a' }]] } });
  card('thw_thorns', { name: 'Bramble Burst', kind: 'attack', text: 'Deal 2 damage to each ally.', run: async E => { for (const t of E.allAllies()) await E.dmg(t, 2, { kind: 'boss' }); }, art: { s: 'forest', L: [['fx', { t: 'whirl', x: 150, y: 160, c: '#7ad04a' }], ['fx', { t: 'slash', x: 120, y: 120 }], ['fx', { t: 'slash', x: 190, y: 140 }]] } });

  /* =================== 2. Bloodfang Warcamp =================== */
  tok('d_raider', { name: 'Bloodfang Raider', atk: 2, hp: 2, kw: ['ferocity'], ai: 'random', art: { img: 'raider' } });
  tok('d_rider', { name: 'Warg Rider', atk: 3, hp: 3, kw: ['ferocity'], ai: 'allies', art: { img: 'wolfrider' } });
  tok('d_sapper', { name: 'Goblin Sapper', atk: 1, hp: 1, ai: 'random', text: 'When destroyed, deals 1 damage to each hero.', onDeath: async E => { for (const h of E.heroes()) await E.dmg(E.heroT(h), 1, { kind: 'boss' }); }, art: { img: 'blastmonger' } });
  tok('d_shaman', { name: 'Bloodfang Shaman', atk: 1, hp: 4, ai: 'random', art: { img: 'witchdoctor' } });
  tok('d_ravager', { name: 'Gore Ravager', atk: 4, hp: 5, ai: 'lowest', art: { img: 'ravager' } });
  card('bfw_raiders', { name: 'Raiding Party', kind: 'summon', text: 'Summon two Bloodfang Raiders (2/2, Swift).', run: summon('d_raider', 2), art: { img: 'raider' } });
  card('bfw_rider', { name: 'Warg Rider', kind: 'summon', text: 'Summon a Warg Rider (3/3, Swift).', run: summon('d_rider'), art: { img: 'wolfrider' } });
  card('bfw_sappers', { name: 'Goblin Sappers', kind: 'summon', text: 'Summon two Goblin Sappers (1/1). When one is destroyed it deals 1 damage to each hero.', run: summon('d_sapper', 2), art: { img: 'blastmonger' } });
  card('bfw_shaman', { name: 'Bloodfang Shaman', kind: 'summon', text: 'Summon a Bloodfang Shaman (1/4). The boss heals 4.', run: async E => { await E.summonMinion('d_shaman', 1); await E.bossHeal(4); }, art: { img: 'witchdoctor' } });
  card('bfw_ravager', { name: 'Gore Ravager', kind: 'summon', text: 'Summon a Gore Ravager (4/5).', run: summon('d_ravager'), art: { img: 'ravager' } });
  card('bfw_pauldrons', { name: 'Spiked Pauldrons', kind: 'equip', text: 'Equipment: the boss strikes for 1 more and melee attackers take 1 more damage back.', run: async E => E.equipBoss('Spiked Pauldrons', 1, 1), art: { s: 'steppe', L: [glow(150, 120, 80, '#ff6a3a', 0.4), ['obj', { t: 'vest', x: 150, y: 116 }]] } });
  card('bfw_banner', { name: 'Bloodfang War Banner', kind: 'equip', text: 'Equipment: the boss strikes for 1 more. Each dungeon ally gets +1 ATK.', run: async E => { E.equipBoss('Bloodfang War Banner', 1, 0); E.buffMinions(1, 0); }, art: { s: 'steppe', L: [['obj', { t: 'banner', x: 150, y: 120, col: '#7a1010', em: '#ffb070', glyph: 'axes' }]] } });
  card('bfw_cry', { name: 'Battle Cry', kind: 'buff', text: 'Each dungeon ally gets +1 ATK and +1 health.', run: async E => E.buffMinions(1, 1), art: { s: 'steppe', L: [['fx', { t: 'shout', x: 150, y: 100, c: '#ffb070' }], fig({ race: 'orc', pose: 'heroic', w: 'axe', helm: 'mohawk', x: 150, y: 214, s: 0.9 })] } });
  card('bfw_firebombs', { name: 'Firebomb Barrage', kind: 'attack', text: 'Deal 2 damage to a random hero three times.', run: async E => { for (let i = 0; i < 3; i++) { const h = E.randomHero(); if (h) await E.dmg(E.heroT(h), 2, { kind: 'boss' }); } }, art: { s: 'steppe', p: 'embers', pn: 40, L: [['obj', { t: 'bomb', x: 110, y: 140, s: 0.6 }], ['fx', { t: 'meteors', n: 4, c: '#ff8a3a' }]] } });
  card('bfw_charge', { name: 'Brutal Charge', kind: 'attack', text: 'Deal 5 damage to the hero with the most health.', run: async E => { const h = E.mostHealth(); if (h) await E.dmg(E.heroT(h), 5, { kind: 'boss' }); }, art: { img: 'urza' } });
  card('bfw_cleave', { name: 'Savage Cleave', kind: 'attack', text: 'Deal 3 damage to each ally.', run: async E => { for (const t of E.allAllies()) await E.dmg(t, 3, { kind: 'boss' }); }, art: { s: 'steppe', L: [['fx', { t: 'whirl', x: 150, y: 170, c: '#ffb070' }], ['fx', { t: 'slash', x: 150, y: 130 }]] } });
  card('bfw_pillage', { name: 'Pillage', kind: 'curse', text: 'Each hero discards a random card.', run: async E => { for (const h of E.heroes()) E.discardRandom(h); }, art: { s: 'steppe', L: [['obj', { t: 'chest', x: 150, y: 170, s: 0.9 }], fig({ race: 'goblin', pose: 'crouch', w: 'dagger', x: 230, y: 214, s: 0.8 })] } });

  /* =================== 3. The Runebound Vault =================== */
  tok('d_tinker', { name: 'Goblin Tinker', atk: 2, hp: 2, ai: 'random', art: { img: 'tinkerer' } });
  tok('d_wraith', { name: 'Vault Wraith', atk: 3, hp: 2, kw: ['elusive'], ai: 'random', art: { img: 'barrowspirit' } });
  tok('d_drake', { name: 'Arcane Drakeling', atk: 3, hp: 3, kw: ['ferocity'], ai: 'allies', art: { img: 'drakeling' } });
  tok('d_golem', { name: 'Rune Golem', atk: 3, hp: 6, ai: 'lowest', art: { img: 'stonecaller' } });
  tok('d_ward', { name: 'Arcane Ward Core', atk: 0, hp: 9, kw: ['guardian'], ai: 'random', art: { s: 'arcane', L: [glow(150, 120, 100, '#6ab8ff', 0.7), ['obj', { t: 'pearl', x: 150, y: 120, s: 1.4 }], ['fx', { t: 'runes', x: 150, y: 120, r: 90, c: '#9ad8ff' }]] } });
  card('vis_tinkers', { name: 'Tinker Crew', kind: 'summon', text: 'Summon two Goblin Tinkers (2/2).', run: summon('d_tinker', 2), art: { img: 'tinkerer' } });
  card('vis_wraith', { name: 'Vault Wraith', kind: 'summon', text: 'Summon a Vault Wraith (3/2, Shrouded).', run: summon('d_wraith'), art: { img: 'barrowspirit' } });
  card('vis_drake', { name: 'Arcane Drakeling', kind: 'summon', text: 'Summon an Arcane Drakeling (3/3, Swift).', run: summon('d_drake'), art: { img: 'drakeling' } });
  card('vis_golem', { name: 'Rune Golem', kind: 'summon', text: 'Summon a Rune Golem (3/6).', run: summon('d_golem'), art: { img: 'stonecaller' } });
  card('vis_ward', { name: 'Arcane Ward Core', kind: 'summon', text: 'Summon an Arcane Ward Core (0/9, Guardian).', run: summon('d_ward'), art: Object.assign({ alt: 'd_ward' }, TK.d_ward.art) }); // #97: shares the Arcane Ward Core painting
  card('vis_plating', { name: 'Runic Plating', kind: 'equip', text: 'Equipment: melee attackers take 2 more damage back from the boss.', run: async E => E.equipBoss('Runic Plating', 0, 2), art: { s: 'arcane', L: [glow(150, 120, 80, '#6ab8ff', 0.5), ['obj', { t: 'breastplate', x: 150, y: 116 }], ['fx', { t: 'runes', x: 150, y: 120, r: 70, c: '#9ad8ff' }]] } });
  card('vis_core', { name: 'Overcharged Core', kind: 'equip', text: 'Equipment: the boss strikes for 2 more.', run: async E => E.equipBoss('Overcharged Core', 2, 0), art: { s: 'arcane', L: [['fx', { t: 'bolt', x: 150, y: 50 }], glow(150, 130, 80, '#9ad8ff', 0.8), ['obj', { t: 'shard', x: 150, y: 120, s: 1, col: '#6ab8ff' }]] } });
  card('vis_pulse', { name: 'Arcane Pulse', kind: 'attack', text: 'Deal 1 damage to each hero and ally.', run: async E => { for (const t of E.friendlyChars()) await E.dmg(t, 1, { kind: 'boss' }); }, art: { s: 'arcane', L: [['fx', { t: 'whirl', x: 150, y: 150, c: '#9ad8ff' }], ['fx', { t: 'runes', x: 150, y: 150, r: 110, c: '#6ab8ff' }]] } });
  card('vis_beam', { name: 'Overload Beam', kind: 'attack', text: 'Deal 6 damage to the hero with the most health.', run: async E => { const h = E.mostHealth(); if (h) await E.dmg(E.heroT(h), 6, { kind: 'boss' }); }, art: { s: 'arcane', L: [['fx', { t: 'bolt', x: 150, y: 40 }], ['fx', { t: 'fireball', x: 170, y: 120, c: '#9ad8ff', ang: 30 }]] } });
  card('vis_repair', { name: 'Self-Repair', kind: 'heal', text: 'The boss heals 6.', run: async E => E.bossHeal(6), art: { s: 'forge', L: [['fx', { t: 'heal', x: 150, y: 120, c: '#9ad8ff' }], ['obj', { t: 'hammer', x: 150, y: 120, s: 0.7 }]] } });
  card('vis_lockdown', { name: 'Lockdown Protocol', kind: 'curse', text: 'Exhaust all allies. (Bulwark allies can\'t cover this round.)', run: async E => E.exhaustAllies(), art: { s: 'arcane', L: [['fx', { t: 'chains' }], glow(150, 130, 90, '#ff5a4a', 0.4)] } });
  card('vis_disenchant', { name: 'Disenchant', kind: 'curse', text: 'Destroy a random piece of armor on each hero.', run: async E => { for (const h of E.heroes()) await E.destroyArmor(h); }, art: { s: 'arcane', L: [['obj', { t: 'helm', x: 150, y: 118 }], ['fx', { t: 'sparkle', x: 150, y: 110 }]] } });
  card('vis_reflect', { name: 'Mirror Field', kind: 'event', turns: 2, dmgTakenMod: 1, text: 'Lasts 2 rounds: heroes take 1 extra damage from every source.', art: { s: 'arcane', L: [['fx', { t: 'barrier', x: 150, y: 140 }], glow(150, 130, 90, '#9ad8ff', 0.6)] } });

  RB.DUNGEONS = {
    thornwood: {
      id: 'thornwood', dungeon: true, name: 'Thornwood Hollow', boss: 'Elder Gnarlroot, Heart of the Hollow', short: 'Gnarlroot', difficulty: 'Dungeon I', hp: 56, hpPer: 64, strike: 3, retaliation: 1,
      flip: [2, 2, 3, 4], maxLevel: 4, music: 'thornwood', theme: '#8ad04a', art: { img: 'boss_gnarlroot', alt: 'treant' },
      intro: 'A corrupted ancient tree has woken in the deep forest, and every wolf and bear for miles answers its call.',
      rules: commonRules([2, 2, 3, 4]), phases: levelPhases,
      deck: [['thw_wolves', 3], ['thw_bear', 2], ['thw_stalker', 2], ['thw_hag', 2], ['thw_guardian', 1], ['thw_bark', 2], ['thw_vines', 1], ['thw_entangle', 2], ['thw_spores', 2], ['thw_crush', 2], ['thw_overgrowth', 2], ['thw_thorns', 2]],
      reward: 'back_thornwood',
      stages: [
        { boss: 'Fenna, the Bramble Witch', short: 'Fenna', art: { img: 'ub_fenna', alt: 'hedgewitch' }, frac: 0.24, strike: 3, retaliation: 1, intro: 'A witch of thorns and nettles guards the forest path.',
          rule: { name: 'Bramble Hex', text: 'At the start of each of her turns, Fenna heals 2.', bossTurn: async E => E.bossHeal(2) } },
        { boss: 'Grizzlemaw, the Elder Bear', short: 'Grizzlemaw', art: { img: 'ub_grizzlemaw', alt: 'cavebear' }, frac: 0.28, strike: 4, retaliation: 1, intro: 'The oldest bear in the Thornwood, scarred and moss-backed.',
          rule: { name: 'Thick Hide', text: 'Takes 1 less damage from each attack by a hero or ally (never less than 1).', armor: 1 } },
        { main: true, frac: 0.7 },
      ],
    },
    warcamp: {
      id: 'warcamp', dungeon: true, name: 'Bloodfang Warcamp', boss: 'Gorrash Bloodfang, the Warchief', short: 'Gorrash', difficulty: 'Dungeon II', hp: 54, hpPer: 72, strike: 3, retaliation: 1,
      flip: [2, 2, 3, 4], maxLevel: 4, music: 'warcamp', theme: '#ff5a3a', art: { img: 'boss_gorrash', alt: 'urza' },
      intro: 'An outcast warchief has gathered raiders, warg riders and goblin sappers into a camp that burns everything nearby.',
      rules: commonRules([2, 2, 3, 4]), phases: levelPhases,
      deck: [['bfw_raiders', 3], ['bfw_rider', 2], ['bfw_sappers', 2], ['bfw_shaman', 2], ['bfw_ravager', 1], ['bfw_pauldrons', 2], ['bfw_banner', 1], ['bfw_cry', 2], ['bfw_firebombs', 2], ['bfw_charge', 2], ['bfw_cleave', 2], ['bfw_pillage', 1]],
      reward: 'back_warcamp',
      stages: [
        { boss: 'Skrit, the Sapper Boss', short: 'Skrit', art: { img: 'ub_skrit', alt: 'bombardier' }, frac: 0.22, strike: 3, retaliation: 1, intro: 'A goblin with too many bombs and not enough fear.',
          rule: { name: 'Short Fuse', text: 'When Skrit falls, his bomb pouch goes off: 1 damage to each hero and 2 to each dungeon minion.', onDefeat: async E => { for (const h of E.heroes()) await E.dmg(E.heroT(h), 1, { kind: 'boss' }); for (const m of E.minions()) await E.dmg(m, 2, { kind: 'effect' }); } } },
        { boss: 'Ulva Wargmother', short: 'Ulva', art: { img: 'ub_ulva', alt: 'gorza' }, frac: 0.27, strike: 3, retaliation: 1, intro: 'The warchief\'s beast-mistress, who raised every warg in the camp.',
          rule: { name: 'Pack Fury', text: 'When Ulva arrives, every dungeon minion on the table gets +1 ATK and +1 health.', onEnter: async E => E.buffMinions(1, 1) } },
        { main: true, frac: 0.6 },
      ],
    },
    vault: {
      id: 'vault', dungeon: true, name: 'The Runebound Vault', boss: 'Thuldrak, the Runebound Warden', short: 'Thuldrak', difficulty: 'Dungeon III', hp: 68, hpPer: 78, strike: 5, retaliation: 2,
      flip: [2, 2, 3, 4], maxLevel: 4, music: 'vault', theme: '#6ab8ff', art: { img: 'boss_thuldrak', alt: 'sentinel' },
      intro: 'Below the old mage-library, Thuldrak, a rune-forged warden, still guards its vault, with a crew of goblin tinkers keeping it running.',
      rules: commonRules([2, 2, 3, 4]), phases: levelPhases,
      deck: [['vis_tinkers', 3], ['vis_wraith', 2], ['vis_drake', 2], ['vis_golem', 2], ['vis_ward', 1], ['vis_plating', 2], ['vis_core', 1], ['vis_pulse', 2], ['vis_beam', 2], ['vis_repair', 2], ['vis_lockdown', 1], ['vis_disenchant', 1], ['vis_reflect', 1]],
      reward: 'back_vault',
      stages: [
        { boss: 'Chief Tinker Bolts', short: 'Bolts', art: { img: 'ub_bolts', alt: 'sapper' }, frac: 0.24, strike: 4, retaliation: 2, intro: 'The goblin foreman who keeps Thuldrak oiled and angry.',
          rule: { name: 'Tinker Crew', text: 'When Bolts arrives, he brings Goblin Tinkers (2/2) with him.', onEnter: async E => E.summonMinion('d_tinker', 2) } },
        { boss: 'Archivist Vex, the Bound Wraith', short: 'Vex', art: { img: 'ub_vex', alt: 'revenant' }, frac: 0.28, strike: 5, retaliation: 3, intro: 'A librarian bound to the vault long after death, still guarding the shelves.',
          rule: { name: 'Mirror Wards', text: 'Melee attackers take 3 damage back from Vex.' } },
        { main: true, frac: 0.7 },
      ],
    },
  };

  /* ---------- Dungeon XP: each level lets 3 more of your own cards into your starter deck ---------- */
  RB.DXP_LEVELS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700]; // total XP needed for level 1..10
  RB.dungeonLevel = xp => { let L = 1; while (L < RB.DXP_LEVELS.length && xp >= RB.DXP_LEVELS[L]) L++; return L; };
  RB.dungeonSwaps = L => 3 * (L - 1);
  RB.dungeonXp = (g, win, modeKey) => {
    const mode = RB.DUNGEON_MODES[modeKey] || RB.DUNGEON_MODES.novice;
    const base = win ? 70 + 30 * mode.level + (mode.first ? 20 : 0) : 20;
    const lvls = (g.boss.level - mode.level) * (win ? 0 : 10);
    return Math.round(base + lvls);
  };
  // starter deck plus up to `swaps` of the best owned cards this hero can use (they replace the weakest starter cards)
  RB.dungeonDeck = (heroId, owned, swaps) => {
    const C = RB.CARDS, deck = RB.buildDeck(heroId, null, 1);
    if (!swaps || !owned) return deck;
    // fix-sim: swap like for like (an ally for an ally, a quest or location for a quest or location...), never more than
    // 2 mana dearer, and only when the owned card measures better. The old version threw out armor, items and free
    // resource cards for 6-7 mana legends, so higher dungeon levels made decks weaker.
    const grp = d => d.type === 'location' ? 'quest' : d.type;
    const counts = {}; deck.forEach(id => counts[id] = (counts[id] || 0) + 1);
    const cands = [];
    for (const d of Object.values(C)) {
      if (!RB.legalFor(heroId, d) || !(owned[d.id] > 0) || d.type === 'master') continue;
      const room = Math.min(RB.maxCopies(d), owned[d.id]) - (counts[d.id] || 0);
      for (let k = 0; k < room; k++) cands.push({ id: d.id, s: RB.cardScore(d) - k * 0.3 });
    }
    cands.sort((a, b) => b.s - a.s);
    let done = 0;
    for (const c of cands) {
      if (done >= swaps) break;
      const d = C[c.id];
      const outs = deck.map((id, i) => ({ i, id, s: RB.cardScore(C[id]) }))
        .filter(x => !x.id.startsWith('asc_') && C[x.id].type !== 'master' && grp(C[x.id]) === grp(d) && d.cost <= Math.max(3, C[x.id].cost + 2))
        .sort((a, b) => a.s - b.s);
      if (!outs.length || outs[0].s + 0.5 > c.s) continue;
      deck[outs[0].i] = c.id; done++;
    }
    return deck;
  };
})(globalThis.RB);

/* ---------- #61: six card backs and the Little Ram companion ---------- */
(function (RB) {
  const C = RB.CARDS;
  Object.assign(RB.COSMETICS, {
    back_compass: { kind: 'back', name: 'Brass Compass', get: 'default', desc: 'A gold compass rose on a navy chart.' },
    back_thornwood: { kind: 'back', name: 'Thornwood', get: 'dclear:thornwood', desc: 'A golden tree ringed with leaves on forest green.' },
    back_warcamp: { kind: 'back', name: 'Bloodfang', get: 'dclear:warcamp', desc: 'Crossed gold axes over a burning red sunburst.' },
    back_vault: { kind: 'back', name: 'Rune Vault', get: 'dclear:vault', desc: 'A glowing blue rune circle among turning gears.' },
    back_delver: { kind: 'back', name: 'Delver\'s Key', get: 'dlevel:5', desc: 'A great gold key on old dungeon stone.' },
    back_legend: { kind: 'back', name: 'Legend', get: 'dlegend', desc: 'A gold star in a burst of rainbow light.' },
    pet_ram: { kind: 'pet', name: 'Little Ram', get: 'loot', desc: 'A fluffy little ram with curly horns and a big smile.' },
  });
  // an existing card becomes a scratch-off loot card for the Little Ram
  const ram = C.ram; if (ram) { ram.set = 'loot'; ram.rarity = 'e'; ram.loot = { reward: 'pet_ram', label: 'Little Ram companion' }; }
})(globalThis.RB);
