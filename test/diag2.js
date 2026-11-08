globalThis.RB = {};
for (const f of ['art_core','art_fig','art_obj','data','engine','ai']) require('../src/'+f+'.js');
const RB = globalThis.RB;
(async () => {
  const raid = process.argv[2] || 'tide', N = 20, hs = Object.keys(RB.HEROES);
  let agg = { rounds:0, win:0, heroDmg:0, allyDmg:0, heal:0, deaths:0, bossDmg:0, minDmg:0, wardArmor:0 };
  for (let i = 0; i < N; i++) {
    const party = [hs[i % 6], hs[(i + 3) % 6]];
    let hd=0, ad=0, he=0, wa=0;
    const g = RB.newGame({ raid, seed: 900 + i, allAuto: true, party: party.map(h => ({ hero: h, deck: RB.buildDeck(h, null, 2) })) }, {
      anim: async (t, d) => { if (t==='dmg') { if (/^hero/.test(d.ref)) hd += d.amount; else if (d.ref!=='boss' && d.kind!=='spell' && d.kind!=='hero' && d.kind!=='ally' && d.kind!=='power' && d.kind!=='effect') ad += d.amount; } if (t==='heal' && /^hero/.test(d.ref)) he += d.amount; if (t==='armor'||t==='shield') wa+=d.amount; } });
    await g.start();
    agg.rounds += g.g.round; agg.win += g.g.over==='win'; agg.heroDmg += hd; agg.allyDmg += ad; agg.heal += he; agg.deaths += g.g.players.filter(p=>p.hero.dead).length; agg.wardArmor += wa;
  }
  for (const k in agg) agg[k] = (agg[k]/N).toFixed(1);
  console.log(raid, agg);
})();
