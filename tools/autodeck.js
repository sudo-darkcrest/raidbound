// compare starter vs auto vs auto+polish on held-out seeds
globalThis.RB = {};
for (const f of ['art_core','art_fig','art_obj','art_hero','data','engine','ai','frontier']) require('../src/'+f+'.js');
const RB = globalThis.RB; globalThis.setTimeout = globalThis.setTimeout;
const N = +process.argv[2] || 40;
async function wr(h, raid, deck) { let w = 0; for (let i = 0; i < N; i++) { const g = RB.newGame({ raid, seed: 300 + i * 7, difficulty: 'normal', allAuto: true, party: [{ hero: h, deck }] }, {}); await g.start(); if (g.g.over === 'win') w++; } return Math.round(100 * w / N) + '%'; }
(async () => { const out = {};
  for (const h of Object.keys(RB.HEROES)) for (const raid of Object.keys(RB.RAIDS)) {
    const st = RB.buildDeck(h, null, 1), au = RB.autoDeck(h, raid, null, 1);
    const pol = (await RB.bestDeck(h, raid, null, 1)).deck;
    out[h + ' ' + raid] = { starter: await wr(h, raid, st), auto: await wr(h, raid, au), polished: await wr(h, raid, pol) };
  }
  console.table(out);
})();
