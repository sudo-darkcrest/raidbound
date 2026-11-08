/* RAIDBOUND — #57: Master Heroes are now an Ascended version of your own hero (one per hero),
   and the three old Master Hero cards became unlockable heroes. */
(function (RB) {
  const C = RB.CARDS, H = RB.HEROES;
  const OLD = { archon: 'dawnarchon', warlord: 'redwarlord', tempest: 'tempestavatar' };

  /* ---------- the old Master Heroes become heroes ---------- */
  const hero = (id, o) => { o.id = id; H[id] = o; };
  hero('dawnarchon', { name: 'Archon of the Dawn', fac: 'concord', race: 'Celestial', cls: 'paladin', spec: 'Dawnbringer', profs: ['enchanting', 'herbalism'], hp: 32,
    unlock: { how: 'allraids', text: 'Defeat all three raid bosses' }, flavor: '"Every dawn is a promise. I am the one who keeps it."',
    power: { name: 'Dawnbreak', text: 'Heal 5 damage from each friendly hero and ally.', target: 'none', tags: ['healAll'], run: async (E, c) => { for (const t of E.friendlyChars()) await E.heal(t, 5); } },
    art: C.archon.art });
  hero('redwarlord', { name: 'Warlord of the Red Moon', fac: 'clans', race: 'Orc', cls: 'warrior', spec: 'Bloodmoon', profs: ['blacksmithing', 'skinning'], hp: 36,
    unlock: { how: 'gold:1500', text: 'Buy for 1500 gold in the Market' }, flavor: '"When the moon bleeds, the clans ride."',
    power: { name: 'Blood Moon Rising', text: 'Ready all your allies. Your allies get +2 ATK this turn.', target: 'none', tags: ['buff', 'ready'], run: async (E, c) => { E.readyAllies(c.p); E.allyTempAtk(c.p, 2); } },
    art: C.warlord.art });
  hero('tempestavatar', { name: 'Avatar of the Tempest', fac: 'concord', race: 'Elemental', cls: 'mage', spec: 'Stormheart', profs: ['enchanting', 'engineering'], hp: 28,
    unlock: { how: 'heroicall', text: 'Defeat all three raid bosses on Heroic' }, flavor: 'Thunder is just the storm clearing its throat.',
    power: { name: 'Eye of the Storm', text: 'Deal 3 damage to each enemy.', target: 'none', tags: ['aoe'], run: async (E, c) => { for (const t of E.enemies()) await E.dmg(t, 3, { p: c.p, kind: 'power' }); } },
    art: C.tempest.art });
  RB.UNLOCK_HEROES.push('dawnarchon', 'redwarlord', 'tempestavatar');
  const baseUnlocked = RB.heroUnlocked;
  RB.heroUnlocked = (id, save) => {
    const h = H[id]; if (save && h && h.unlock && !(save.heroes || []).includes(id)) {
      if (h.unlock.how === 'allraids') return Object.keys(RB.RAIDS).every(r => (save.wins[r] || 0) > 0);
      if (h.unlock.how === 'heroicall') return Object.keys(RB.RAIDS).every(r => ((save.heroicWins || {})[r] || 0) > 0);
    }
    return baseUnlocked(id, save);
  };

  /* ---------- Ascended Master Heroes: one per hero ---------- */
  const asc = (heroId, o) => { const h = H[heroId]; const id = 'asc_' + heroId; o.id = id; o.type = 'master'; o.cost = o.cost || 7; o.hero = heroId; o.fac = h.fac; o.rarity = 'r'; o.set = 'core';
    const short = h.name.replace(/^(Ser|Lord|Sister|Brother) /, '').split(/[ ,]/)[0]; o.text = `${short} only. Becomes your hero; damage and gear stay. ` + o.text; o.art = { s: 'holy', L: [['glow', { x: 150, y: 110, r: 130, c: o.col || '#fff0b0', op: 0.6 }]] }; C[id] = o; return id; };
  const minAll = async (E, p, n) => { for (const t of E.minions()) await E.dmg(t, n, { p, kind: 'effect' }); };
  asc('aldric', { name: 'Aldric, Lightsworn Champion', hp: 36, heroAtk: 1, col: '#fff0a0', text: 'Your hero has +1 ATK. Each turn: prevent the next 3 damage to each friendly hero.', mstart: async (E, p) => { for (const h of E.heroes()) E.shield(h, 3); } });
  asc('thorgrim', { name: 'Thorgrim, Lord of the Peaks', hp: 39, col: '#bfe8ff', text: 'Each turn: deal 1 damage to each enemy.', mstart: async (E, p) => { for (const t of E.enemies()) await E.dmg(t, 1, { p, kind: 'effect' }); } });
  asc('lyssara', { name: 'Lyssara, Starborn Archmage', hp: 34, spell: 2, col: '#d0a8ff', text: 'Spells and powers deal +2 damage. Each turn: deal 3 damage to a random enemy.', mstart: async (E, p) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 3, { p, kind: 'effect' }); } });
  asc('grukka', { name: 'Grukka the Unchained', hp: 42, heroAtk: 3, allyFerocity: true, col: '#ff6a3a', text: 'Your hero has +3 ATK. Your allies have Ferocity.' });
  asc('hruna', { name: 'Hruna, Voice of the Ancestors', hp: 38, col: '#9affd0', text: 'Each turn: heal 3 damage from each friendly hero and ally.', mstart: async (E, p) => { for (const t of E.friendlyChars()) await E.heal(t, 3); } });
  asc('snix', { name: 'Snix, Prince of Shadows', hp: 34, heroAtk: 2, col: '#b98aff', text: 'Your hero has +2 ATK. Each turn: draw a card.', mstart: async (E, p) => E.draw(p, 1) });
  asc('vaelith', { name: 'Vaelith, the Moon\'s Edge', hp: 33, heroAtk: 2, col: '#e0d0ff', text: 'Your hero has +2 ATK. Each turn: deal 1 damage to a random enemy three times.', mstart: async (E, p) => { for (let i = 0; i < 3; i++) { const t = E.randomEnemy(); if (t) await E.dmg(t, 1, { p, kind: 'effect' }); } } });
  asc('brannoc', { name: 'Brannoc, the Mountain Unbroken', hp: 44, col: '#ffd27a', text: 'Each turn: prevent the next 4 damage to your hero.', mstart: async (E, p) => E.shield(p, 4) });
  asc('tavra', { name: 'Tavra, Sunhorn Exalted', hp: 40, heroAtk: 2, col: '#ffb040', text: 'Your hero has +2 ATK. Each turn: heal 3 damage from your hero.', mstart: async (E, p) => E.heal(E.heroT(p), 3) });
  asc('zizzik', { name: 'Zizzik, Master of Mayhem', hp: 34, spell: 1, col: '#ff9a3a', text: 'Spells and powers deal +1 damage. Each turn: deal 2 damage to each enemy minion.', mstart: async (E, p) => minAll(E, p, 2) });
  asc('seraphine', { name: 'Seraphine, Saint of the Veil', hp: 36, col: '#fff6e0', text: 'Each turn: heal 2 damage from each friendly hero and ally, and ward each friendly hero for 2.', mstart: async (E, p) => { for (const t of E.friendlyChars()) await E.heal(t, 2); for (const h of E.heroes()) E.shield(h, 2); } });
  asc('korga', { name: 'Korga, Alpha of the Plains', hp: 40, allyFerocity: true, col: '#d8b080', text: 'Your allies have Ferocity. Each turn: summon a 2/2 Wolf Companion.', mstart: async (E, p) => E.summonAlly(p, 'wolfcomp', 1) });
  asc('dawnarchon', { name: 'Archon of the Risen Sun', hp: 38, col: '#fff6c0', text: 'Each turn: heal 3 damage from each friendly hero and ally.', mstart: async (E, p) => { for (const t of E.friendlyChars()) await E.heal(t, 3); } });
  asc('redwarlord', { name: 'Warlord of the Blood Eclipse', hp: 42, heroAtk: 2, allyFerocity: true, col: '#ff3a2a', text: 'Your hero has +2 ATK. Your allies have Ferocity.' });
  asc('tempestavatar', { name: 'Tempest Incarnate', hp: 34, spell: 1, col: '#9ad8ff', text: 'Spells and powers deal +1 damage. Each turn: deal 3 damage to a random enemy.', mstart: async (E, p) => { const t = E.randomEnemy(); if (t) await E.dmg(t, 3, { p, kind: 'effect' }); } });

  /* ---------- retire the old Master Hero cards ---------- */
  for (const old of Object.keys(OLD)) delete C[old];
  for (const [hid, deck] of Object.entries(RB.STARTER)) {
    let had = false; for (const old of Object.keys(OLD)) if (deck[old]) { had = true; delete deck[old]; }
    if (had && C['asc_' + hid]) deck['asc_' + hid] = 1;
  }
  // a saved deck that held an old Master Hero gets that hero's Ascended card instead
  RB.fixDeck = (hid, ids) => ids.map(id => C[id] ? id : (OLD[id] && C['asc_' + hid] ? 'asc_' + hid : null)).filter(Boolean);
  for (const id of ['dawnarchon', 'redwarlord', 'tempestavatar']) {
    const deck = RB.autoDeck(id, null, null, 1), out = {};
    deck.forEach(x => out[x] = (out[x] || 0) + 1);
    RB.STARTER[id] = out;
  }
  RB.ASC_IDS = Object.keys(C).filter(k => k.startsWith('asc_'));
})(globalThis.RB);
