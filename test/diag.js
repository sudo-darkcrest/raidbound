globalThis.RB = {};
for (const f of ['art_core','art_fig','art_obj','data','engine','ai']) require('../src/'+f+'.js');
const RB = globalThis.RB;
(async () => {
  const raid = process.argv[2] || 'molten', N = 20;
  for (const h of Object.keys(RB.HEROES)) {
    let tot = { rounds: 0, dealt: 0, taken: 0, healed: 0, played: 0, res: 0, win: 0, prot: 0, armor: 0, ward: 0 };
    for (let i = 0; i < N; i++) {
      let healed = 0, armor = 0, ward = 0;
      const g = RB.newGame({ raid, seed: 300 + i, allAuto: true, party: [{ hero: h, deck: RB.buildDeck(h, null, 1) }] }, {
        anim: async (t, d) => { if (t === 'heal' && d.ref === 'hero0') healed += d.amount; if (t === 'armor') armor += d.amount; if (t === 'shield') ward += d.amount; } });
      await g.start();
      tot.rounds += g.g.round; tot.dealt += g.g.players[0].stats.bossDmg; tot.taken += g.g.players[0].hero.damage + healed; tot.healed += healed; tot.played += g.g.stats.cardsPlayed; tot.res += g.g.players[0].res.length; tot.win += g.g.over === 'win';
      tot.armor += armor; tot.ward += ward;
    }
    const f = k => (tot[k] / N).toFixed(1);
    console.log(h.padEnd(9), 'win', f('win'), 'rounds', f('rounds'), 'bossDmg', f('dealt'), 'dmgTaken', f('taken'), 'healed', f('healed'), 'armor', f('armor'), 'ward', f('ward'), 'played', f('played'), 'res', f('res'));
  }
})();
