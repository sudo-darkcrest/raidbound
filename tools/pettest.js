// #90: companion bonus check. node tools/pettest.js [N]
// Plays solo Heroic raids (starter decks, AI hero) with each companion and without, on the same seeds, plus a few dungeons and
// boss-mode games. Reports: did the bonus fire (raid log), win rate change, and any errors or bad state.
globalThis.RB = {};
for (const f of ['art_core', 'art_fig', 'art_obj', 'art_hero', 'data', 'engine', 'ai', 'cardpower', 'frontier', 'packs', 'expansion', 'treasure', 'armory', 'wildbloom', 'sunscorch', 'grandcore', 'skins', 'masters', 'dungeons']) require('../src/' + f + '.js');
const RB = globalThis.RB;
const N = +process.argv[2] || 60;
const heroes = ['aldric', 'thorgrim', 'lyssara', 'grukka', 'hruna', 'snix'];
const pets = [null, ...Object.keys(RB.PET_PERKS)];
const errors = [];

async function play(cfg) {
  const lines = [];
  const game = RB.newGame(cfg, { log: (t) => lines.push(typeof t === 'string' ? t : (t && t.msg) || ''), update: () => { if (game && game.g.round > 70) throw new Error('STALL'); } });
  try { await game.start(); } catch (e) { errors.push((cfg.party[0].pet || 'none') + ' ' + cfg.raid + ': ' + (e.stack || e).toString().split('\n').slice(0, 3).join(' | ')); return null; }
  const g = game.g, p = g.players[0];
  if (!Number.isFinite(p.hero.damage) || p.hero.damage < 0 || g.boss.damage < 0) errors.push('bad state ' + (cfg.party[0].pet || 'none'));
  const text = lines.join('\n');
  return { win: g.over === 'win', text, maxHp: game.heroMax ? game.heroMax(p) : null };
}

(async () => {
  const name = id => id ? RB.COSMETICS[id].name : 'no companion';
  const base = {};
  console.log(`Solo Heroic raids, starter decks, ${N} games per raid (same seeds for every companion):`);
  for (const pet of pets) {
    let w = 0, n = 0, fired = 0;
    for (const raid of Object.keys(RB.RAIDS)) for (let i = 0; i < N; i++) {
      const h = heroes[i % heroes.length];
      const r = await play({ raid, seed: 500 + i * 7, difficulty: 'heroic', allAuto: true, party: [{ hero: h, auto: true, pet, deck: RB.buildDeck(h, null, 1) }] });
      if (!r) continue; n++; if (r.win) w++;
      if (pet) { const nm = name(pet); if (new RegExp(nm + ' (shimmers|gathers|bounds|rouses|charges|brings|dives)').test(r.text) || ['ward', 'bossDmg', 'hand', 'maxhp', 'trickle'].includes(RB.PET_PERKS[pet].k)) fired++; }
    }
    const pct = n ? (100 * w / n) : 0; if (!pet) base.pct = pct;
    console.log(`  ${name(pet).padEnd(20)} win ${pct.toFixed(1).padStart(5)}%  ${pet ? ((pct - base.pct >= 0 ? '+' : '') + (pct - base.pct).toFixed(1) + ' pts') : ''}${pet ? `   bonus seen in ${fired}/${n} games` : ''}`);
  }
  // dungeons (opening hand + mulligan path) and boss mode (no bonus) just must run cleanly
  let dn = 0;
  for (const pet of pets.slice(1)) for (const did of Object.keys(RB.DUNGEONS)) {
    const h = heroes[dn++ % heroes.length];
    await play({ raid: did, dungeon: true, seed: 900 + dn, difficulty: 'heroic', dungeonLevel: 3, allAuto: true, party: [{ hero: h, auto: true, pet, deck: RB.dungeonDeck(h, null, 0) }] });
  }
  for (const pet of pets.slice(1)) {
    const r = await play({ raid: 'crypt', seed: 77, difficulty: 'normal', allAuto: true, bossPlayer: true, party: [{ hero: 'aldric', auto: true, pet, deck: RB.buildDeck('aldric', null, 1) }] });
    if (r && /companion/.test(r.text)) errors.push('boss mode applied a companion bonus: ' + pet);
  }
  console.log(`Dungeons: ${dn} games. Boss mode: ${pets.length - 1} games.`);
  console.log(errors.length ? 'PROBLEMS:\n' + errors.slice(0, 12).join('\n') : 'No errors.');
})();
