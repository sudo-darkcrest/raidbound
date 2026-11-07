// quick solo win rates: node tools/solo.js N [deckMode]   deckMode: starter | auto
globalThis.RB = {};
for (const f of ['art_core','art_fig','art_obj','art_hero','data','engine','ai']) require('../src/'+f+'.js');
const RB = globalThis.RB;
const N = +process.argv[2] || 20, mode = process.argv[3] || 'starter';
(async () => {
  const out = {}; let err = 0;
  for (const h of Object.keys(RB.HEROES)) { const row = {}; for (const raid of Object.keys(RB.RAIDS)) { let w = 0;
    for (let i = 0; i < N; i++) { try {
      const deck = mode === 'auto' && RB.autoDeck ? RB.autoDeck(h, raid, null, 1) : RB.buildDeck(h, null, 1);
      const g = RB.newGame({ raid, seed: 50 + i, difficulty: 'normal', allAuto: true, party: [{ hero: h, deck }] }, {}); await g.start(); if (g.g.over === 'win') w++; } catch (e) { if (err++ < 3) console.error(e.stack); } }
    row[raid] = Math.round(100 * w / N) + '%'; } out[h] = row; }
  console.table(out); console.log('errors', err);
})();
