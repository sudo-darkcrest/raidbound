// Empirical card power: swap each card into starter decks (like-for-like type) and measure the win-rate change.
// node tools/cardtest.js N part parts   -> writes /tmp/m/cardtest_<part>.json
globalThis.RB = {};
for (const f of ['art_core', 'art_fig', 'art_obj', 'art_hero', 'data', 'engine', 'ai', 'cardpower', 'frontier', 'packs', 'expansion', 'treasure', 'armory', 'skins', 'masters', 'dungeons']) require('../src/' + f + '.js');
const RB = globalThis.RB, C = RB.CARDS;
const N = +process.argv[2] || 40, part = +process.argv[3] || 0, parts = +process.argv[4] || 1;
const HEROES = Object.keys(RB.STARTER); // the six with curated starters (others are built from these)
const RAIDS = Object.keys(RB.RAIDS);
const FILL = { aldric: ['draught', 'caravan'], thorgrim: ['draught', 'caravan'], lyssara: ['draught', 'caravan'], grukka: ['draught', 'caravan'], hruna: ['draught', 'caravan'], snix: ['giantelixir', 'bounty'] };
function FILLER(h) { const st = RB.buildDeck(h, null, 1); const a = FILL[h] || [st.find(id => C[id].type === 'item') || 'draught', st.find(id => C[id].type === 'quest') || 'caravan']; return a; }
function fillSlots(h, deck) {
  if (FILL[h]) return FILL[h].map(id => deck.indexOf(id)).filter(i => i >= 0);
  const it = deck.findIndex(id => C[id].type === 'item'), q = deck.findIndex(id => C[id].type === 'quest');
  const out = [it, q].filter(i => i >= 0);
  if (out.length < 2) deck.map((id, i) => ({ i, s: RB.cardScore(C[id]) })).filter(x => !out.includes(x.i) && C[deck[x.i]].type !== 'master').sort((a, b) => a.s - b.s).slice(0, 2 - out.length).forEach(x => out.push(x.i));
  return out;
}
const grp = d => d.type === 'location' ? 'quest' : d.type;
const seeds = Array.from({ length: N }, (_, i) => 20000 + i * 37);
const DIFF = { crypt: 'heroic', molten: 'heroic', tide: 'normal' };
async function winrate(hero, raid, deck) {
  let w = 0, dmg = 0;
  for (const seed of seeds) {
    const g = RB.newGame({ raid, seed, difficulty: DIFF[raid], allAuto: true, party: [{ hero, auto: true, deck: deck.slice() }] }, { update: () => { if (g && g.g.round > 60) throw new Error('STALL'); } });
    try { await g.start(); } catch (e) { continue; }
    if (g.g.over === 'win') w++;
    dmg += Math.min(1, g.g.boss.damage / g.g.boss.maxHp);
  }
  return { w: w / N, d: dmg / N };
}
(async () => {
  const base = {};
  for (const h of HEROES) for (const r of RAIDS) base[h + r] = await winrate(h, r, RB.buildDeck(h, null, 1));
  const only = process.env.CARDS ? process.env.CARDS.split(',') : null; // CARDS=id,id measures just those
  const cards = Object.values(C).filter(d => d.type !== 'hero' && d.type !== 'master' && d.type !== 'land' && !d.dungeonCard && (!only || only.includes(d.id))).sort((a, b) => a.id < b.id ? -1 : 1).filter((d, i) => i % parts === part);
  // heroes ordered by how far their baseline is from always-win / always-lose (less saturation = clearer signal)
  const mid = h => RAIDS.reduce((s, r) => s + Math.abs(base[h + r].w - 0.5), 0);
  const res = {};
  for (const d of cards) {
    const hs = HEROES.filter(h => RB.legalFor(h, d)).sort((a, b) => mid(a) - mid(b));
    if (!hs.length) continue;
    const use = hs.slice(0, 4);
    let sum = 0, sumD = 0, n = 0; const per = {}; let mode = '';
    for (const h of use) {
      const st = RB.buildDeck(h, null, 1); const k = RB.maxCopies(d);
      let deck = st.slice(), sign = 1, copies = k;
      if (st.includes(d.id)) {
        // removal test: swap this card's copies for the filler pair; value = starter - without
        const idx = st.map((id, i) => id === d.id ? i : -1).filter(i => i >= 0); copies = idx.length;
        const F = FILLER(h); idx.forEach((i, j) => deck[i] = F[j % 2]); sign = -1; mode += 'r';
      } else {
        const slots = fillSlots(h, deck);
        copies = Math.min(k, slots.length); for (let j = 0; j < copies; j++) deck[slots[j]] = d.id; mode += 'a';
      }
      for (const r of RAIDS) { const x = await winrate(h, r, deck); const b = base[h + r]; const dw = sign * (x.w - b.w) / copies, dd = sign * (x.d - b.d) / copies; per[h + '/' + r] = Math.round(100 * dw * 10) / 10; sum += dw; sumD += dd; n++; }
    }
    res[d.id] = { copies: 1, mode, name: d.name, type: d.type, cost: d.cost, rar: d.rarity || 'c', set: d.set, score: +RB.cardScore(d).toFixed(1), dWin: +(100 * sum / n).toFixed(1), dDmg: +(100 * sumD / n).toFixed(1), per };
  }
  require('fs').writeFileSync(`/tmp/m/cardtest_${part}.json`, JSON.stringify({ base, res }, null, 1));
  console.log('done', Object.keys(res).length);
})();
