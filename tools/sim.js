globalThis.RB = {};
for (const f of ['art_photos','art_core','art_fig','art_obj','art_hero','data','engine','ai','frontier']) require('../src/'+f+'.js');
const RB = globalThis.RB;
const heroes = Object.keys(RB.HEROES), raids = Object.keys(RB.RAIDS);
async function run(raid, party, seed, diff) {
  const g = RB.newGame({ raid, seed, difficulty: diff, allAuto: true, party: party.map(h => ({ hero: h, deck: RB.buildDeck(h, null, party.length) })) }, {});
  await g.start();
  return { res: g.g.over, rounds: g.g.round, bossLeft: g.bossHp(), g };
}
(async () => {
  const N = +process.argv[2] || 20;
  const out = {};
  let errors = 0;
  for (const raid of raids) for (const size of [1, 2, 3, 4]) {
    let w = 0, r = 0, left = 0;
    for (let i = 0; i < N; i++) {
      const party = Array.from({ length: size }, (_, k) => heroes[(i + k * 2) % heroes.length]);
      try { const x = await run(raid, party, 1000 + i * 7 + size, 'normal'); if (x.res === 'win') w++; r += x.rounds; left += x.bossLeft / x.g.g.boss.maxHp; }
      catch (e) { errors++; if (errors < 4) console.error(raid, party, e.stack); }
    }
    out[raid + ' x' + size] = `win ${Math.round(100 * w / N)}%  rounds ${(r / N).toFixed(1)}  bossLeft ${(100 * left / N).toFixed(0)}%`;
  }
  console.table(out);
  // per hero solo
  const ph = {};
  for (const h of heroes) for (const raid of raids) { let w = 0; for (let i = 0; i < N; i++) { try { const x = await run(raid, [h], 50 + i, 'normal'); if (x.res === 'win') w++; } catch (e) { errors++; if (errors < 6) console.error(h, raid, e.stack); } } ph[h + ' ' + raid] = Math.round(100 * w / N) + '%'; }
  console.table(ph);
  console.log('errors', errors);
})();
