// #78 buff search: for each weak card, try a ladder of small buffs and keep the gentlest one that brings it up to the
// middle of the pack. Same measurement as tools/cardtest.js. node tools/bufftest.js N part parts -> /tmp/m/buff_<part>.json
globalThis.RB = {};
for (const f of ['art_core', 'art_fig', 'art_obj', 'art_hero', 'data', 'engine', 'ai', 'cardpower', 'frontier', 'packs', 'expansion', 'treasure', 'armory', 'wildbloom', 'sunscorch', 'grandcore', 'skins', 'masters', 'dungeons']) require('../src/' + f + '.js');
const RB = globalThis.RB, C = RB.CARDS, TK = RB.TOKENS;
const N = +process.argv[2] || 40, part = +process.argv[3] || 0, parts = +process.argv[4] || 1;
const TARGET = +(process.argv[5] || -8);
const HEROES = Object.keys(RB.STARTER), RAIDS = Object.keys(RB.RAIDS);
const DIFF = { crypt: 'heroic', molten: 'heroic', tide: 'normal' };
const seeds = Array.from({ length: N }, (_, i) => 20000 + i * 37);
const FILL = { aldric: ['draught', 'caravan'], thorgrim: ['draught', 'caravan'], lyssara: ['draught', 'caravan'], grukka: ['draught', 'caravan'], hruna: ['draught', 'caravan'], snix: ['giantelixir', 'bounty'] };
function FILLER(h) { const st = RB.buildDeck(h, null, 1); return FILL[h] || [st.find(id => C[id].type === 'item') || 'draught', st.find(id => C[id].type === 'quest') || 'caravan']; }
async function winrate(hero, raid, deck) {
  let w = 0;
  for (const seed of seeds) { const g = RB.newGame({ raid, seed, difficulty: DIFF[raid], allAuto: true, party: [{ hero, auto: true, deck: deck.slice() }] }, {}); try { await g.start(); } catch (e) { continue; } if (g.g.over === 'win') w++; }
  return w / N;
}
const base = {};
async function power(d, heroes) {
  let sum = 0, n = 0;
  for (const h of heroes) {
    const st = RB.buildDeck(h, null, 1); let deck = st.slice(), sign = 1, copies;
    if (st.includes(d.id)) { const idx = st.map((id, i) => id === d.id ? i : -1).filter(i => i >= 0); copies = idx.length; const F = FILLER(h); idx.forEach((i, j) => deck[i] = F[j % 2]); sign = -1; }
    else { const F = FILLER(h); const slots = F.map(id => deck.indexOf(id)).filter(i => i >= 0); copies = Math.min(RB.maxCopies(d), slots.length); for (let j = 0; j < copies; j++) deck[slots[j]] = d.id; }
    for (const r of RAIDS) { if (base[h + r] == null) base[h + r] = await winrate(h, r, st); const x = await winrate(h, r, deck); sum += sign * (x - base[h + r]) / copies; n++; }
  }
  return +(100 * sum / n).toFixed(1);
}
const tokenOf = d => { const m = String(d.run || '').match(/summonAlly\(c\.p, '([a-z_]+)', (\d)\)/); return m ? m[1] : null; };
function ladder(d) {
  const tk = tokenOf(d);
  if (d.type === 'ally') return [
    ['+1 health', x => { x.hp += 1; }],
    ['-1 cost', x => { x.cost = Math.max(0, x.cost - 1); }],
    ['+1/+1', x => { x.atk += 1; x.hp += 1; }],
    ['+1 health, -1 cost', x => { x.hp += 1; x.cost = Math.max(0, x.cost - 1); }],
    ['+1/+2', x => { x.atk += 1; x.hp += 2; }],
    ['+1/+2, -1 cost', x => { x.atk += 1; x.hp += 2; x.cost = Math.max(0, x.cost - 1); }],
    ['Protector', x => { x.kw = [...new Set([...(x.kw || []), 'protector'])]; }],
    ['Protector, +1 health', x => { x.kw = [...new Set([...(x.kw || []), 'protector'])]; x.hp += 1; }],
    ['Protector, +1/+1, -1 cost', x => { x.kw = [...new Set([...(x.kw || []), 'protector'])]; x.hp += 1; x.atk += 1; x.cost = Math.max(0, x.cost - 1); }],
  ];
  if (tk) return [
    ['token +1 health', (x, t) => { t.hp += 1; }],
    ['-1 cost', x => { x.cost = Math.max(0, x.cost - 1); }],
    ['token +1/+1', (x, t) => { t.atk += 1; t.hp += 1; }],
    ['token Protector', (x, t) => { t.kw = [...new Set([...(t.kw || []), 'protector'])]; }],
    ['token Protector +1 health', (x, t) => { t.kw = [...new Set([...(t.kw || []), 'protector'])]; t.hp += 1; }],
    ['token Protector +1 health, -1 cost', (x, t) => { t.kw = [...new Set([...(t.kw || []), 'protector'])]; t.hp += 1; x.cost = Math.max(0, x.cost - 1); }],
  ];
  return [['-1 cost', x => { x.cost = Math.max(0, x.cost - 1); }]];
}
(async () => {
  const ids = Object.entries(RB.CARD_POWER).filter(([id, v]) => C[id] && v[0] <= -10 && C[id].type !== 'location').map(([id]) => id).sort().filter((id, i) => i % parts === part);
  const mid = h => RAIDS.reduce((s, r) => s + Math.abs((base[h + r] ?? 0.5) - 0.5), 0);
  // baselines for every hero once, so hero choice can avoid always-win / always-lose heroes
  for (const h of HEROES) for (const r of RAIDS) base[h + r] = await winrate(h, r, RB.buildDeck(h, null, 1));
  const out = {};
  for (const id of ids) {
    const d = C[id]; const hs = HEROES.filter(h => RB.legalFor(h, d)).sort((a, b) => mid(a) - mid(b)).slice(0, 4);
    if (!hs.length) continue;
    const before = await power(d, hs); const rec = { name: d.name, type: d.type, before, tried: [] };
    if (before > TARGET) { rec.pick = null; rec.note = 'already fine on re-test'; out[id] = rec; console.log(id, before, 'ok'); continue; }
    const tk = tokenOf(d); const snapD = JSON.stringify({ cost: d.cost, atk: d.atk, hp: d.hp, kw: d.kw }); const snapT = tk ? JSON.stringify(TK[tk]) : null;
    for (const [label, fn] of ladder(d)) {
      fn(d, tk ? TK[tk] : null);
      const p = await power(d, hs); rec.tried.push([label, p]);
      Object.assign(d, JSON.parse(snapD)); if (!d.kw) delete d.kw; if (tk) Object.assign(TK[tk], JSON.parse(snapT));
      if (p > TARGET) { rec.pick = label; rec.after = p; break; }
    }
    out[id] = rec; console.log(id, before, '->', rec.pick || 'none', rec.after || '', JSON.stringify(rec.tried));
  }
  require('fs').writeFileSync(`/tmp/m/buff_${part}.json`, JSON.stringify(out, null, 1));
  console.log('done');
})();
