globalThis.RB = {};
for (const f of ['art_core','art_fig','art_obj','data','engine','ai']) require('../src/'+f+'.js');
const RB = globalThis.RB;
(async()=>{
const [raid, heroes, seed] = [process.argv[2], process.argv[3].split(','), +process.argv[4]||1];
const g = RB.newGame({ raid, seed, allAuto: true, party: heroes.map(h => ({ hero: h, deck: RB.buildDeck(h) })) }, {});
await g.start();
g.g.log.forEach(e=>console.log(e.round, e.msg));
console.log('RESULT', g.g.over, 'boss', g.bossHp(), '/', g.g.boss.maxHp);
console.log('deck', RB.buildDeck(heroes[0]).join(','));
})();
