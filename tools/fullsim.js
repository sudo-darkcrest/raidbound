// Full balance + bug sweep: node tools/fullsim.js [N]
// Raids (all sizes, normal/heroic, starter vs full-collection auto decks), boss mode, dungeons (all modes, sizes, swap levels).
// Flags: errors, stalled games (>60 rounds), NaN/negative state, gold and XP per game and per round.
globalThis.RB = {};
for (const f of ['art_core', 'art_fig', 'art_obj', 'art_hero', 'data', 'engine', 'ai', 'cardpower', 'frontier', 'packs', 'expansion', 'treasure', 'skins', 'masters', 'dungeons']) require('../src/' + f + '.js');
const RB = globalThis.RB, C = RB.CARDS;
const N = +process.argv[2] || 24;
const ONLY = process.argv[3] || 'all';
const heroes = Object.keys(RB.HEROES).filter(h => !RB.HEROES[h].master && C[h] === undefined || true);
const baseHeroes = Object.keys(RB.HEROES);
const allOwned = {}; for (const d of Object.values(C)) allOwned[d.id] = 2;
const issues = []; const note = (k, s) => { if (issues.filter(x => x.k === k).length < 6) issues.push({ k, s }); };

function check(g, tag) {
  const bad = [];
  if (!Number.isFinite(g.boss.damage) || !Number.isFinite(g.boss.maxHp)) bad.push('boss hp NaN');
  if (g.boss.damage < 0) bad.push('boss damage < 0 (overheal?) ' + g.boss.damage);
  for (const p of g.players) {
    if (!Number.isFinite(p.hero.damage)) bad.push('hero dmg NaN ' + p.heroId);
    if (p.hero.damage < 0) bad.push('hero overhealed ' + p.heroId + ' ' + p.hero.damage);
    if (p.hand.length > 12) bad.push('hand > 12 ' + p.hand.length);
    for (const a of p.allies) if (!Number.isFinite(a.damage) || a.damage < 0) bad.push('ally dmg bad ' + a.id + ' ' + a.damage);
    if (p.hero.shield < 0) bad.push('negative shield');
    const ids = new Set(); for (const c of [...p.deck, ...p.hand, ...p.grave, ...p.res.map(r => r.c), ...p.allies.map(a => a.c).filter(Boolean), ...p.items.map(e => e.c), ...Object.values(p.armor).map(e => e.c), p.weapon && p.weapon.c].filter(Boolean)) { if (ids.has(c.uid)) bad.push('duplicate card uid ' + c.id); ids.add(c.uid); }
  }
  for (const m of g.boss.minions) if (!Number.isFinite(m.damage)) bad.push('minion dmg NaN ' + m.id);
  bad.forEach(b => note('STATE ' + b.split(' ').slice(0, 3).join(' '), tag + ': ' + b));
}

async function play(cfg, tag) {
  let rounds = 0;
  const hooks = { update: () => { if (game && game.g.round > 60) throw new Error('STALL'); } };
  let game = null;
  game = RB.newGame(cfg, hooks);
  const t0 = Date.now();
  try { await game.start(); }
  catch (e) { if (e.message === 'STALL') { note('STALL', tag + ' round ' + game.g.round); return { stall: true, g: game.g }; } note('ERROR ' + (e.message || e).slice(0, 60), tag + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')); return { err: true, g: game.g }; }
  if (!game.g.over) note('NO RESULT', tag);
  check(game.g, tag);
  return { g: game.g, win: game.g.over === 'win', ms: Date.now() - t0 };
}
const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '-';
const avg = (a, k) => a.length ? (a.reduce((s, x) => s + x[k], 0) / a.length) : 0;

(async () => {
  const T0 = Date.now();
  const out = {};
  /* ---------- 1. Raids ---------- */
  if (ONLY === 'all' || ONLY === 'raids') {
    const rows = {};
    for (const raid of Object.keys(RB.RAIDS)) for (const diff of ['normal', 'heroic']) for (const deckMode of ['starter', 'owned', 'full']) for (const size of [1, 2, 3, 4]) {
      const res = [];
      for (let i = 0; i < N; i++) {
        const party = Array.from({ length: size }, (_, k) => { const h = baseHeroes[(i * 5 + k * 3) % baseHeroes.length]; return { hero: h, auto: true, deck: deckMode === 'full' ? RB.autoDeck(h, raid, allOwned, size) : RB.buildDeck(h, deckMode === 'owned' ? allOwned : null, size) }; });
        const r = await play({ raid, seed: 7000 + i * 31 + size, difficulty: diff, allAuto: true, party }, `${raid}/${diff}/${deckMode}/x${size} seed ${7000 + i * 31 + size} ${party.map(p => p.hero)}`);
        if (r.err || r.stall) continue;
        const gold = RB.goldFor(r.g, r.win).total;
        res.push({ win: r.win ? 1 : 0, rounds: r.g.round, gold, gpr: gold / r.g.round, left: Math.max(0, r.g.boss.maxHp - r.g.boss.damage) / r.g.boss.maxHp });
      }
      rows[`${raid} ${diff} ${deckMode} x${size}`] = { win: pct(res.filter(x => x.win).length, res.length), rounds: avg(res, 'rounds').toFixed(1), gold: Math.round(avg(res, 'gold')), 'gold/round': avg(res, 'gpr').toFixed(1), bossLeft: Math.round(100 * avg(res, 'left')) + '%', n: res.length };
    }
    console.log('\n=== RAIDS (AI heroes; starter = starter decks, full = auto deck from a full collection) ==='); console.table(rows); out.raids = rows;

    // per hero solo, normal, starter decks
    const ph = {};
    for (const h of Object.keys(RB.HEROES)) { const row = {}; for (const raid of Object.keys(RB.RAIDS)) { let w = 0, n = 0; for (let i = 0; i < N; i++) { const r = await play({ raid, seed: 300 + i, difficulty: 'normal', allAuto: true, party: [{ hero: h, auto: true, deck: RB.buildDeck(h, null, 1) }] }, `solo ${h} ${raid} ${300 + i}`); if (r.err || r.stall) continue; n++; if (r.win) w++; } row[raid] = pct(w, n); } ph[h] = row; }
    console.log('\n=== SOLO HERO WIN RATES (normal, starter deck) ==='); console.table(ph); out.solo = ph;
  }
  /* ---------- 2. Boss mode (player is the boss, AI heroes; here the boss is AI-driven too) ---------- */
  if (ONLY === 'all' || ONLY === 'boss') {
    const rows = {};
    for (const raid of Object.keys(RB.RAIDS)) for (const size of [1, 2, 3, 4]) {
      let bw = 0, n = 0, rr = 0, gold = 0;
      for (let i = 0; i < N; i++) {
        const party = Array.from({ length: size }, (_, k) => { const h = baseHeroes[(i + k * 4) % baseHeroes.length]; return { hero: h, auto: true, deck: RB.buildDeck(h, null, size) }; });
        const r = await play({ raid, seed: 900 + i, difficulty: 'normal', allAuto: true, bossPlayer: true, party }, `boss ${raid} x${size} ${900 + i}`);
        if (r.err || r.stall) continue; n++; rr += r.g.round;
        const won = r.g.over === 'lose', slain = r.g.players.filter(p => p.hero.dead).length;
        if (won) bw++;
        gold += (won ? 50 : 15) + slain * 8 + Math.round((r.g.stats.dmgTaken || 0) * 0.15 / size);
      }
      rows[`${raid} x${size}`] = { bossWins: pct(bw, n), rounds: (rr / n).toFixed(1), gold: Math.round(gold / n), 'gold/round': (gold / rr).toFixed(1) };
    }
    console.log('\n=== BOSS MODE vs AI heroes (boss uses the AI picker) ==='); console.table(rows); out.boss = rows;
  }
  /* ---------- 3. Dungeons ---------- */
  if (ONLY === 'all' || ONLY === 'dungeons') {
    const rows = {};
    for (const did of Object.keys(RB.DUNGEONS)) for (const mk of Object.keys(RB.DUNGEON_MODES)) for (const size of [1, 2, 3]) for (const swaps of [0, 27]) {
      const mode = RB.DUNGEON_MODES[mk]; const res = [];
      for (let i = 0; i < N; i++) {
        const party = Array.from({ length: size }, (_, k) => { const h = baseHeroes[(i * 3 + k * 5) % baseHeroes.length]; return { hero: h, auto: true, deck: RB.dungeonDeck(h, allOwned, swaps) }; });
        const r = await play({ raid: did, dungeon: true, seed: 4000 + i * 13 + size, difficulty: mk, dungeonLevel: mode.level, dungeonFirst: mode.first, allAuto: true, party }, `dungeon ${did}/${mk}/x${size}/swaps${swaps} seed ${4000 + i * 13 + size}`);
        if (r.err || r.stall) continue;
        const gold = Math.round(RB.goldFor(r.g, r.win).total * 0.8), xp = RB.dungeonXp(r.g, r.win, mk);
        res.push({ win: r.win ? 1 : 0, rounds: r.g.round, gold, xp, gpr: gold / r.g.round, lvl: r.g.boss.level });
      }
      rows[`${did} ${mk} x${size} swaps${swaps}`] = { win: pct(res.filter(x => x.win).length, res.length), rounds: avg(res, 'rounds').toFixed(1), gold: Math.round(avg(res, 'gold')), xp: Math.round(avg(res, 'xp')), 'gold/round': avg(res, 'gpr').toFixed(1), endLvl: avg(res, 'lvl').toFixed(1), n: res.length };
    }
    console.log('\n=== DUNGEONS (swaps0 = plain starter deck, swaps27 = level-10 deck from a full collection) ==='); console.table(rows); out.dungeons = rows;
  }
  console.log('\n=== ISSUES ==='); const kinds = {}; issues.forEach(x => (kinds[x.k] = kinds[x.k] || []).push(x.s));
  for (const [k, v] of Object.entries(kinds)) { console.log('*', k); v.slice(0, 3).forEach(s => console.log('   ', s)); }
  if (!issues.length) console.log('none');
  require('fs').writeFileSync('/tmp/m/fullsim_' + ONLY + '.json', JSON.stringify({ out, issues }, null, 1));
  console.log('time', ((Date.now() - T0) / 1000).toFixed(0) + 's');
})();
