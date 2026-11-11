/* RAIDBOUND — art for booster sets 5 (Wildbloom) and 6 (Sunscorch), drawn with the game's own painter.
   New backdrops (meadow, glade, nightglade, marsh, desert, tomb, oasis), creatures (elk, stag, boar, toad, sprite,
   treant, serpent, scorpion, basilisk, colossus) and objects (seeds, bulbs, totems, scarabs, lenses...).
   Wildbloom is vivid and bright; Sunscorch keeps one palette: gold sand, turquoise and amber glass, white limestone,
   cobalt sky and hard noon light. The finished pictures are baked to gen/<id>.webp. */
(function (RB) {
  const A = RB.ART, L = A.layers, n1 = A.n1;
  const W = 300, H = 220, OL = '#1b130b';
  const id = p => (p || 'w') + (++A._uid);
  const G = (x, y, s, inner, rot, flip) => `<g transform="translate(${n1(x)} ${n1(y)})${rot ? ` rotate(${rot})` : ''} scale(${flip ? -s : s} ${s})">${inner}</g>`;
  const lin = (gid, stops, x2, y2) => `<linearGradient id="${gid}" x1="0" y1="0" x2="${x2 == null ? 0 : x2}" y2="${y2 == null ? 1 : y2}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('')}</linearGradient>`;
  const rad = (gid, stops, cx, cy, r) => `<radialGradient id="${gid}" cx="${cx == null ? 0.5 : cx}" cy="${cy == null ? 0.5 : cy}" r="${r == null ? 0.5 : r}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('')}</radialGradient>`;
  // soft light: a radial gradient (blur filters clip to squares on small shapes)
  const glow = (x, y, r, c, op) => { const g = id('gw'); return `<radialGradient id="${g}"><stop offset="0" stop-color="${c}" stop-opacity="${op == null ? 0.5 : op}"/><stop offset=".45" stop-color="${c}" stop-opacity="${n1((op == null ? 0.5 : op) * 0.45)}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" fill="url(#${g})"/>`; };
  const shadow = (x, y, rx, ry, op) => `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx)}" ry="${n1(ry || rx * 0.18)}" fill="#000" opacity="${op || 0.35}" filter="url(#b2)"/>`;
  const smooth = (pts, close) => { let d = `M${n1(pts[0][0])},${n1(pts[0][1])}`; for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += `Q${n1(pts[i][0])},${n1(pts[i][1])} ${n1(mx)},${n1(my)}`; } const l = pts[pts.length - 1]; d += `L${n1(l[0])},${n1(l[1])}`; return close ? d + 'Z' : d; };
  const wavy = (r, y, amp, n, x0, x1) => { const pts = []; x0 = x0 == null ? -20 : x0; x1 = x1 == null ? W + 20 : x1; for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y + (r() - 0.5) * 2 * amp]); return pts; };
  const band = (r, y, amp, n, fill, extra) => `<path d="${smooth(wavy(r, y, amp, n))}L${W + 20},${H + 5}L-20,${H + 5}Z" fill="${fill}" ${extra || ''}/>`;

  /* ---------------- small painted parts ---------------- */
  const FLOWER_COLS = ['#ff4a6a', '#ffd23a', '#ffffff', '#c86aff', '#ff8a2a', '#6ad0ff', '#ff6ad0'];
  function flower(x, y, s, col, center) {
    let p = '';
    for (let i = 0; i < 5; i++) { const a = i * 72 * Math.PI / 180; p += `<ellipse cx="${n1(Math.cos(a) * 3.2)}" cy="${n1(Math.sin(a) * 3.2)}" rx="2.6" ry="1.9" transform="rotate(${i * 72} ${n1(Math.cos(a) * 3.2)} ${n1(Math.sin(a) * 3.2)})" fill="${col}" stroke="${OL}" stroke-width=".35"/>`; }
    return G(x, y, s, p + `<circle r="1.6" fill="${center || '#ffcf3a'}" stroke="${OL}" stroke-width=".3"/><circle cx="-.5" cy="-.5" r=".6" fill="#fff" opacity=".7"/>`);
  }
  function flowers(r, y0, y1, n, scale, cols) {
    let s = '';
    for (let i = 0; i < n; i++) { const y = y0 + (y1 - y0) * Math.pow(r(), 0.8), k = (scale || 1) * (0.5 + (y - y0) / Math.max(1, y1 - y0) * 0.9); s += flower(r() * W, y, k, (cols || FLOWER_COLS)[Math.floor(r() * (cols || FLOWER_COLS).length)]); }
    return s;
  }
  function grassTufts(r, y, n, c1, c2) {
    let s = '';
    for (let i = 0; i < n; i++) { const x = r() * W, h = 6 + r() * 12, lean = (r() - 0.5) * 8; s += `<path d="M${n1(x - 2)},${n1(y + 4)}Q${n1(x + lean * 0.4)},${n1(y - h * 0.6)} ${n1(x + lean)},${n1(y - h)}Q${n1(x + 1)},${n1(y - h * 0.4)} ${n1(x + 2.5)},${n1(y + 4)}Z" fill="${r() < 0.5 ? c1 : c2}" opacity=".95"/>`; }
    return s;
  }
  function cloud(x, y, s, col, shade) {
    const puffs = [[-26, 4, 13], [-12, -6, 16], [6, -10, 18], [24, -2, 14], [36, 6, 10], [-34, 8, 9]];
    const body = puffs.map(([px, py, pr]) => `<circle cx="${px}" cy="${py}" r="${pr}"/>`).join('');
    return G(x, y, s, `<g fill="${shade || '#c8dcf4'}" transform="translate(2 4)">${body}</g><g fill="${col || '#ffffff'}">${body}</g><path d="M-38,14L46,14" stroke="${shade || '#c8dcf4'}" stroke-width="6" stroke-linecap="round"/>`);
  }
  function sunDisk(x, y, rr, core, halo, rays) {
    let s = glow(x, y, rr * 4, halo, 0.55) + glow(x, y, rr * 2, core, 0.8);
    if (rays) for (let i = 0; i < 12; i++) { const a = i * 30 * Math.PI / 180; s += `<path d="M${n1(x + Math.cos(a) * rr * 1.3)},${n1(y + Math.sin(a) * rr * 1.3)}L${n1(x + Math.cos(a + 0.06) * rr * 3.4)},${n1(y + Math.sin(a + 0.06) * rr * 3.4)}L${n1(x + Math.cos(a - 0.06) * rr * 3.4)},${n1(y + Math.sin(a - 0.06) * rr * 3.4)}Z" fill="${halo}" opacity=".35"/>`; }
    return s + `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(rr)}" fill="${core}"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(rr * 0.7)}" fill="#fff" opacity=".85"/>`;
  }
  function treeClump(x, y, s, c1, c2) {
    return G(x, y, s, `<rect x="-2" y="-6" width="4" height="10" fill="#5a3a1a"/><circle cx="0" cy="-14" r="11" fill="${c2}"/><circle cx="-7" cy="-9" r="8" fill="${c2}"/><circle cx="7" cy="-9" r="8" fill="${c2}"/><circle cx="-2" cy="-17" r="8" fill="${c1}"/><circle cx="5" cy="-12" r="6" fill="${c1}"/>`);
  }
  function bigTree(x, y, s, r, o) {
    o = o || {};
    const bark = o.bark || '#6a4424', barkD = o.barkD || '#3a2410', leaf = o.leaf || ['#2e9a2a', '#4cc838', '#8aea4a'];
    let t = `<path d="M-14,0Q-10,-40 -12,-80Q-14,-110 -30,-130L-20,-134Q-6,-116 -2,-96Q2,-120 18,-140L26,-134Q10,-112 10,-80Q8,-40 16,0Z" fill="${bark}" stroke="${OL}" stroke-width="1.2"/>`;
    t += `<path d="M-8,-10Q-6,-50 -6,-90M4,-14Q4,-50 6,-84" stroke="${barkD}" stroke-width="1.4" fill="none" opacity=".6"/><path d="M-14,0Q-26,2 -32,8M16,0Q28,2 34,8" stroke="${bark}" stroke-width="6" stroke-linecap="round"/>`;
    for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, d = 18 + r() * 34, cx = Math.cos(a) * d * 1.3, cy = -138 + Math.sin(a) * d * 0.8, rr = 16 + r() * 14; t += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(rr)}" fill="${leaf[i % 3 === 0 ? 0 : 1]}" stroke="${OL}" stroke-width=".8"/>`; }
    for (let i = 0; i < 10; i++) { const cx = (r() - 0.5) * 90, cy = -150 - r() * 40; t += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(8 + r() * 8)}" fill="${leaf[2]}" opacity=".85"/>`; }
    return G(x, y, s, t);
  }

  /* ---------------- backdrops ---------------- */
  const X = A.extraScenes = A.extraScenes || {};
  const PAL = A.PAL;
  PAL.meadow = { sky: ['#1e6ad8', '#62b4ff', '#e8f8ff'], far: '#7cc49a', mid: '#4cb83a', ground: '#2e8a1e', light: '#fff4b0', rim: '#fffbe0', glow: '#ffe066', fog: '#e8fff0', body: '#1a3a10', bodyTop: '#3a7a2a', part: 'none' };
  PAL.glade = { sky: ['#2a7a3a', '#6ac850', '#e8ffb0'], far: '#3a9a3a', mid: '#2a7a2a', ground: '#1e5a18', light: '#fffcc0', rim: '#ffffe0', glow: '#d8ff6a', fog: '#e0ffd0', body: '#10280c', bodyTop: '#2e6a22', part: 'none' };
  PAL.nightglade = { sky: ['#06123a', '#0e3a6a', '#1a8a8a'], far: '#0c3a4a', mid: '#082a34', ground: '#062420', light: '#e8ff8a', rim: '#c8ffff', glow: '#b8ff4a', fog: '#6ae0d0', body: '#04140f', bodyTop: '#0e3a30', part: 'none' };
  PAL.marsh = { sky: ['#1e4a4a', '#5a9a88', '#cfe8c0'], far: '#3a6a5a', mid: '#2a5040', ground: '#1a3a2a', light: '#eaffd0', rim: '#f0fff0', glow: '#a8ff9a', fog: '#d8f0e0', body: '#0e2018', bodyTop: '#2a4a3a', part: 'none' };
  PAL.desert = { sky: ['#0e2a8a', '#2a72d8', '#f4e8c8'], far: '#e8c88a', mid: '#e8b050', ground: '#d89a3a', light: '#fffbe8', rim: '#fff6d8', glow: '#ffe8a0', fog: '#fff0d0', body: '#3a2408', bodyTop: '#8a5a1a', part: 'none' };
  PAL.tomb = { sky: ['#3a2410', '#7a5228', '#c89a5a'], far: '#a87a3e', mid: '#7a5428', ground: '#5a3a1a', light: '#fff2c8', rim: '#fff8e0', glow: '#ffd88a', fog: '#f0d8a8', body: '#2a1a08', bodyTop: '#6a4a20', part: 'none' };
  PAL.oasis = PAL.desert;

  X.meadow = (r, P, o) => {
    const gid = id('sk');
    let s = `<defs>${lin(gid, [[0, o.skyTop || '#1a62d8'], [0.55, o.skyMid || '#5ab0ff'], [1, o.skyLow || '#e6f8ff']])}${lin(gid + 'g', [[0, '#5ad83a'], [1, '#2a8a1a']])}</defs><rect width="${W}" height="${H}" fill="url(#${gid})"/>`;
    s += sunDisk(o.sunX || 236, o.sunY || 34, 11, '#fffbe0', '#ffe066', true);
    s += cloud(60, 40, 0.8) + cloud(170, 26, 0.6) + cloud(270, 62, 0.45);
    s += `<path d="${smooth(wavy(r, 138, 10, 7))}L${W + 20},${H}L-20,${H}Z" fill="#8ad0b0"/>`;
    for (let i = 0; i < 6; i++) s += treeClump(20 + r() * 260, 140 + r() * 6, 0.45 + r() * 0.2, '#6ac86a', '#3a9a5a');
    s += `<path d="${smooth(wavy(r, 156, 9, 6))}L${W + 20},${H}L-20,${H}Z" fill="#62c84a"/>`;
    s += `<path d="${smooth(wavy(r, 156, 9, 6))}" stroke="#a8f07a" stroke-width="2" fill="none" opacity=".6"/>`;
    s += flowers(r, 152, 172, 22, 0.55);
    s += `<path d="${smooth(wavy(r, o.ground || 178, 5, 6))}L${W + 20},${H}L-20,${H}Z" fill="url(#${gid}g)"/>`;
    s += grassTufts(r, 182, 30, '#2a8a1a', '#5ad83a') + flowers(r, 180, 216, o.nFlowers == null ? 26 : o.nFlowers, 1.1);
    return s;
  };
  X.glade = (r, P, o) => {
    const gid = id('gl');
    let s = `<defs>${lin(gid, [[0, '#2a8a3a'], [0.5, '#8ad860'], [1, '#f4ffc0']])}</defs><rect width="${W}" height="${H}" fill="url(#${gid})"/>`;
    s += glow(150, 70, 90, '#fffbc0', 0.75);
    for (let i = 0; i < 7; i++) s += `<path d="M${120 + i * 14},-10L${60 + i * 34},${H}L${84 + i * 34},${H}L${132 + i * 14},-10Z" fill="#fffbd0" opacity=".14"/>`;
    s += `<path d="${smooth(wavy(r, 150, 6, 6))}L${W + 20},${H}L-20,${H}Z" fill="#4aa83a"/>`;
    for (let i = 0; i < 5; i++) s += treeClump(30 + i * 60 + r() * 20, 154, 0.9, '#5ac84a', '#2e8a32');
    s += bigTree(-6, 214, 1.0, r) + bigTree(306, 214, 1.05, r);
    s += `<path d="${smooth(wavy(r, o.ground || 182, 4, 6))}L${W + 20},${H}L-20,${H}Z" fill="#3a9a2a"/>`;
    s += `<ellipse cx="150" cy="196" rx="120" ry="16" fill="#fffbc0" opacity=".25" filter="url(#b4)"/>`;
    s += grassTufts(r, 186, 34, '#2a7a1a', '#6ad84a') + flowers(r, 184, 216, 20, 1);
    return s;
  };
  X.nightglade = (r, P, o) => {
    const gid = id('ng');
    let s = `<defs>${lin(gid, [[0, '#040e34'], [0.6, '#0c3a6a'], [1, '#18908a']])}</defs><rect width="${W}" height="${H}" fill="url(#${gid})"/>`;
    for (let i = 0; i < 50; i++) s += `<circle cx="${n1(r() * W)}" cy="${n1(r() * 110)}" r="${n1(0.4 + r() * 0.9)}" fill="#fff" opacity="${n1(0.4 + r() * 0.6)}"/>`;
    s += glow(70, 46, 34, '#c8f8ff', 0.5) + `<circle cx="70" cy="46" r="15" fill="#f4fbff"/><circle cx="64" cy="42" r="3" fill="#d0e8f0" opacity=".7"/><circle cx="75" cy="52" r="2" fill="#d0e8f0" opacity=".7"/>`;
    s += bigTree(-10, 210, 0.95, r, { bark: '#0a2a2a', barkD: '#041414', leaf: ['#063028', '#0a3c32', '#0e5040'] }) + bigTree(312, 214, 1.0, r, { bark: '#0a2a2a', barkD: '#041414', leaf: ['#063028', '#0a3c32', '#0e5040'] });
    s += `<path d="${smooth(wavy(r, 176, 5, 6))}L${W + 20},${H}L-20,${H}Z" fill="#0a3a30"/>`;
    for (let i = 0; i < 18; i++) { const x = 20 + r() * 260, y = 180 + r() * 34, c = ['#7affe8', '#ff8ae8', '#c8ff6a'][i % 3]; s += glow(x, y - 3, 6, c, 0.7) + flower(x, y, 0.7 + r() * 0.5, c, '#ffffff'); }
    for (let i = 0; i < (o.flies == null ? 34 : o.flies); i++) { const x = r() * W, y = 60 + r() * 140; s += glow(x, y, 3 + r() * 3, '#e8ff6a', 0.9) + `<circle cx="${n1(x)}" cy="${n1(y)}" r="1.1" fill="#ffffe0"/>`; }
    return s;
  };
  X.marsh = (r, P, o) => {
    const gid = id('mr');
    let s = `<defs>${lin(gid, [[0, '#1e5a5a'], [0.6, '#6aa890'], [1, '#d8f0c8']])}</defs><rect width="${W}" height="${H}" fill="url(#${gid})"/>`;
    s += glow(200, 60, 60, '#f0ffe0', 0.45);
    for (let i = 0; i < 5; i++) { const x = 20 + i * 64 + r() * 20, h = 50 + r() * 50; s += `<path d="M${n1(x)},170L${n1(x + 2)},${n1(170 - h)}M${n1(x + 1)},${n1(170 - h * 0.6)}L${n1(x - 14)},${n1(170 - h * 0.8)}M${n1(x + 1)},${n1(170 - h * 0.4)}L${n1(x + 16)},${n1(170 - h * 0.65)}" stroke="#2a3a30" stroke-width="${n1(2 + r() * 2)}" stroke-linecap="round" opacity=".75"/>`; }
    s += `<rect x="0" y="150" width="${W}" height="30" fill="#e8fff0" opacity=".35" filter="url(#b4)"/>`;
    s += `<rect x="0" y="168" width="${W}" height="${H - 168}" fill="#3a6a5a"/>`;
    for (let i = 0; i < 9; i++) s += `<path d="M${n1(r() * W)},${n1(172 + r() * 40)}h${n1(14 + r() * 30)}" stroke="#bff0e0" stroke-width=".8" opacity=".55"/>`;
    for (let i = 0; i < 26; i++) { const x = r() * W, h = 14 + r() * 26; s += `<path d="M${n1(x)},${H}L${n1(x + (r() - 0.5) * 4)},${n1(H - h - 10)}" stroke="${r() < 0.5 ? '#3a7a3a' : '#5a9a3a'}" stroke-width="1.6"/>` + (r() < 0.4 ? `<ellipse cx="${n1(x)}" cy="${n1(H - h - 12)}" rx="1.6" ry="4" fill="#6a4a2a"/>` : ''); }
    for (let i = 0; i < 6; i++) { const x = 30 + r() * 240, y = 120 + r() * 50; s += glow(x, y, 7, '#bfffb0', 0.8) + `<circle cx="${n1(x)}" cy="${n1(y)}" r="2" fill="#f0fff0"/>`; }
    return s;
  };
  // desert dunes: gold sand, glass crests that flash turquoise and white
  function dune(r, y, amp, c1, c2, glass, gid) {
    const nG = glass === true ? 2 : (glass || 0);
    const pts = wavy(r, y, amp, 4);
    let s = `<defs>${lin(gid, [[0, c1], [1, c2]])}</defs><path d="${smooth(pts)}L${W + 20},${H + 5}L-20,${H + 5}Z" fill="url(#${gid})"/>`;
    // shaded lee side under each crest
    for (let i = 1; i < pts.length - 1; i++) { const [x, yy] = pts[i]; s += `<path d="M${n1(x)},${n1(yy + 2)}Q${n1(x + 30)},${n1(yy + 10)} ${n1(x + 60)},${n1(yy + 30)}L${n1(x + 10)},${n1(yy + 30)}Z" fill="#a8641e" opacity=".22"/>`; }
    s += `<path d="${smooth(pts)}" stroke="#fff4c8" stroke-width="1.4" fill="none" opacity=".7"/>`;
    // fused glass lies in flat sheets on the sand, catching the sun
    for (let i = 0; i < nG; i++) { const xs = 20 + r() * 260, ys = y + 10 + r() * 24, rx = 8 + r() * 12; s += `<ellipse cx="${n1(xs)}" cy="${n1(ys)}" rx="${n1(rx)}" ry="${n1(rx * 0.16)}" fill="#2ac8c8" stroke="#0e6a72" stroke-width=".5" opacity=".9"/><path d="M${n1(xs - rx * 0.6)},${n1(ys - 0.4)}h${n1(rx * 0.8)}" stroke="#e8fffc" stroke-width=".8"/>` + glow(xs, ys, rx * 0.9, '#bffff6', 0.55); }
    return s;
  }
  X.desert = (r, P, o) => {
    const gid = id('ds');
    let s = `<defs>${lin(gid, [[0, o.skyTop || '#1848c0'], [0.5, o.skyMid || '#4a98ec'], [0.85, '#b8dcf4'], [1, '#f8eed4']])}</defs><rect width="${W}" height="${H}" fill="url(#${gid})"/>`;
    s += sunDisk(o.sunX || 232, o.sunY || 30, 9, '#ffffff', '#fff2b0', false);
    if (o.ruins !== false) { const rx = o.ruinsX || 60; s += `<g fill="#f2e2bc" stroke="#b8945a" stroke-width=".6" opacity=".9"><path d="M${rx - 30},140L${rx - 28},116L${rx - 22},116L${rx - 20},140Z"/><path d="M${rx - 12},140L${rx},96L${rx + 12},140Z"/><path d="M${rx + 18},140L${rx + 20},120L${rx + 34},120L${rx + 36},140Z"/><rect x="${rx + 22}" y="114" width="10" height="6"/></g>`; }
    s += `<path d="${smooth(wavy(r, 140, 4, 8))}L${W + 20},${H}L-20,${H}Z" fill="#f0d8a0"/>`;
    for (let i = 0; i < 4; i++) s += `<path d="M${n1(r() * 200)},${n1(132 + i * 3)}q20,-2 40,0t40,0t40,0" stroke="#fff8e0" stroke-width=".6" fill="none" opacity=".45"/>`;
    s += dune(r, 152, 10, '#f4c868', '#e09a3a', o.glass != null ? Math.ceil(o.glass / 2) : 1, id('d1'));
    s += dune(r, o.ground || 178, 12, '#f8d070', '#d8902e', o.glass != null ? o.glass : 2, id('d2'));
    for (let i = 0; i < 30; i++) s += `<path d="M${n1(r() * W)},${n1(186 + r() * 30)}q4,-1.5 8,0" stroke="#b8742a" stroke-width=".6" fill="none" opacity=".5"/>`;
    return s;
  };
  X.oasis = (r, P, o) => {
    let s = X.desert(r, P, Object.assign({ ruins: false }, o));
    s += `<ellipse cx="150" cy="186" rx="96" ry="18" fill="#1aa8b0" stroke="#0e6a72" stroke-width="1"/><ellipse cx="150" cy="183" rx="84" ry="12" fill="#5ae8e0"/><ellipse cx="130" cy="181" rx="34" ry="3" fill="#e8fffc" opacity=".7"/>`;
    for (const [x, k] of [[62, 1], [92, 0.8], [210, 0.95], [238, 1.1], [180, 0.7]]) s += palm(x, 182, k * 0.9, r);
    return s;
  };
  X.tomb = (r, P, o) => {
    const gid = id('tb');
    let s = `<defs>${lin(gid, [[0, '#6a4420'], [0.5, '#a87838'], [1, '#d8a85a']])}</defs><rect width="${W}" height="${H}" fill="url(#${gid})"/>`;
    for (let y = 0; y < 170; y += 16) for (let x = (y / 16) % 2 ? -18 : 0; x < W; x += 36) s += `<rect x="${x}" y="${y}" width="35" height="15" fill="#c8964e" stroke="#7a5428" stroke-width=".8" opacity=".55"/>`;
    s += `<circle cx="150" cy="60" r="34" fill="#d8aa5a" stroke="#6a4a20" stroke-width="2"/><circle cx="150" cy="60" r="24" fill="#e8c070" stroke="#6a4a20" stroke-width="1.2"/>`;
    for (let i = 0; i < 16; i++) { const a = i * 22.5 * Math.PI / 180; s += `<path d="M${n1(150 + Math.cos(a) * 36)},${n1(60 + Math.sin(a) * 36)}L${n1(150 + Math.cos(a) * 46)},${n1(60 + Math.sin(a) * 46)}" stroke="#6a4a20" stroke-width="2.4"/>`; }
    for (const x of [40, 260]) s += `<rect x="${x - 14}" y="20" width="28" height="160" fill="#c08a44" stroke="${OL}" stroke-width="1.2"/><rect x="${x - 18}" y="14" width="36" height="10" fill="#d8a85a" stroke="${OL}" stroke-width="1"/><path d="M${x - 8},30V174M${x + 4},30V174" stroke="#7a5428" stroke-width="1" opacity=".6"/>`;
    s += `<path d="M110,0L190,0L250,200L50,200Z" fill="#fff4c8" opacity=".25"/>` + glow(150, 196, 70, '#fff0b0', 0.6);
    s += `<rect x="0" y="176" width="${W}" height="${H - 176}" fill="#c8964a"/>`;
    s += `<path d="${smooth(wavy(r, 180, 4, 6))}L${W + 20},${H}L-20,${H}Z" fill="#e8b860"/>`;
    for (let i = 0; i < 40; i++) s += `<circle cx="${n1(110 + r() * 80 + (r() - 0.5) * 60)}" cy="${n1(r() * 190)}" r="${n1(0.4 + r() * 0.9)}" fill="#fff8d8" opacity="${n1(0.3 + r() * 0.5)}"/>`;
    return s;
  };
  function palm(x, y, s, r) {
    let t = `<path d="M-3,0Q-2,-30 4,-62Q6,-66 8,-62Q2,-30 3,0Z" fill="#8a5a2a" stroke="${OL}" stroke-width=".8"/>`;
    for (let i = 0; i < 8; i++) t += `<path d="M5,${-60 + i * 7}l5,-2" stroke="#5a3a1a" stroke-width=".8"/>`;
    for (let i = 0; i < 7; i++) { const a = -160 + i * 25 + (r() - 0.5) * 10, rr = a * Math.PI / 180, ex = 6 + Math.cos(rr) * 34, ey = -64 + Math.sin(rr) * 18 + 10; t += `<path d="M6,-64Q${n1((6 + ex) / 2)},${n1(-80 + (ey + 64) * 0.2)} ${n1(ex)},${n1(ey)}Q${n1((6 + ex) / 2 + 3)},${n1(-70)} 6,-62Z" fill="${i % 2 ? '#2e9a3a' : '#48c040'}" stroke="${OL}" stroke-width=".7"/>`; }
    return G(x, y, s, t);
  }

  /* ---------------- creatures ---------------- */
  const OB = {};
  // great elk with moss and flower-crowned antlers (Oriel's mount, Mossantler Elder)
  OB.elk = (o) => {
    const fur = o.fur || '#8a5a32', furD = o.furD || '#5a3618', moss = o.moss || '#4cc838', gid = id('ek');
    let s = `<defs>${lin(gid, [[0, fur], [1, furD]])}</defs>`;
    s += `<path d="M-60,-46Q-66,-70 -46,-80Q-10,-90 30,-84Q46,-82 54,-92Q60,-110 66,-118L80,-120Q88,-116 92,-108L96,-100Q92,-96 84,-98Q76,-96 74,-88Q70,-70 62,-58Q58,-40 56,-20L58,0L48,0L44,-30Q40,-40 30,-42Q20,-40 16,-30L18,0L8,0L4,-34Q-20,-36 -36,-34L-34,0L-44,0L-48,-30Q-56,-28 -58,0L-68,0L-66,-30Q-64,-38 -60,-46Z" fill="url(#${gid})" stroke="${OL}" stroke-width="1.4"/>`;
    s += `<path d="M-46,-80Q-10,-92 30,-86Q20,-74 -10,-72Q-34,-72 -46,-80Z" fill="${moss}" stroke="${OL}" stroke-width=".8"/>` + [-38, -24, -8, 8, 20].map((x, i) => `<circle cx="${x}" cy="${-82 + (i % 2) * 3}" r="2.6" fill="${FLOWER_COLS[i]}" stroke="${OL}" stroke-width=".4"/>`).join('');
    s += `<path d="M78,-108L80,-106" stroke="#000" stroke-width="2.4" stroke-linecap="round"/><circle cx="80" cy="-108" r=".8" fill="#fff"/><path d="M92,-102Q96,-100 94,-98" stroke="${OL}" stroke-width=".8" fill="none"/>`;
    // antlers
    const ant = (sx) => `<path d="M70,-118Q${66 + sx * 4},-140 ${60 + sx * 14},-156M${64 + sx * 5},-136Q${56 + sx * 10},-142 ${48 + sx * 16},-146M${66 + sx * 3},-146Q${74 + sx * 6},-156 ${80 + sx * 8},-166M${62 + sx * 10},-152L${56 + sx * 18},-166" stroke="#d8c09a" stroke-width="3.2" stroke-linecap="round" fill="none"/>`;
    s += ant(-1) + ant(1) + `<g stroke="${OL}" stroke-width=".3">` + [[54, -150], [44, -146], [80, -164], [72, -158], [62, -162], [86, -150]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3" fill="${FLOWER_COLS[(i + 2) % 7]}"/><circle cx="${x + 3}" cy="${y + 2}" r="2.2" fill="${moss}"/>`).join('') + `</g>`;
    if (o.bloom) for (let i = 0; i < 9; i++) s += flower(-60 + i * 16, 2, 1.1, FLOWER_COLS[i % 7]);
    return s;
  };
  OB.boar = (o) => {
    const gid = id('br');
    let s = `<defs>${lin(gid, [[0, '#7a4a2a'], [1, '#3a200e']])}</defs>`;
    s += `<path d="M-50,-30Q-56,-56 -30,-64Q10,-72 40,-60Q56,-56 64,-44L80,-38Q86,-34 84,-28L72,-24Q66,-20 60,-22L58,0L48,0L46,-18Q20,-14 -6,-16L-4,0L-14,0L-18,-18Q-30,-18 -36,-16L-36,0L-46,0L-48,-20Z" fill="url(#${gid})" stroke="${OL}" stroke-width="1.3"/>`;
    for (let i = 0; i < 9; i++) { const x = -36 + i * 9, y = -64 + Math.abs(i - 4) * 1.5; s += `<path d="M${x - 3},${y + 4}L${x + 2},${y - 12 - (i % 2) * 4}L${x + 5},${y + 4}Z" fill="#2a4a1a" stroke="${OL}" stroke-width=".6"/><circle cx="${x + 2}" cy="${y - 2}" r="1" fill="#ff6a8a"/>`; }
    s += `<path d="M70,-30Q78,-36 76,-44" stroke="#f4ecd8" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="66" cy="-46" r="2" fill="#ffd040"/><circle cx="66" cy="-46" r=".8" fill="#000"/><path d="M58,-56L62,-66L66,-56Z" fill="#5a3418" stroke="${OL}" stroke-width=".6"/>`;
    return s;
  };
  OB.toad = (o) => {
    let s = `<path d="M-44,0Q-52,-30 -30,-48Q0,-62 30,-48Q52,-34 46,0Z" fill="#6a9a3a" stroke="${OL}" stroke-width="1.3"/><path d="M-36,-34Q0,-58 36,-34Q20,-46 0,-48Q-20,-46 -36,-34Z" fill="#3a8a2a"/>`;
    s += `<circle cx="-18" cy="-44" r="9" fill="#8ab84a" stroke="${OL}" stroke-width="1"/><circle cx="18" cy="-44" r="9" fill="#8ab84a" stroke="${OL}" stroke-width="1"/><circle cx="-18" cy="-45" r="5" fill="#ffd23a"/><circle cx="18" cy="-45" r="5" fill="#ffd23a"/><rect x="-20" y="-46" width="4" height="2" fill="#000"/><rect x="16" y="-46" width="4" height="2" fill="#000"/>`;
    s += `<path d="M-26,-22Q0,-14 26,-22" stroke="${OL}" stroke-width="1.2" fill="none"/><path d="M-44,0Q-56,0 -58,-6M44,0Q56,0 58,-6" stroke="#4a7a2a" stroke-width="6" stroke-linecap="round"/>`;
    // moss garden and little mushrooms on the back
    s += `<path d="M-30,-50Q-14,-66 10,-62Q26,-58 32,-48Q10,-56 -30,-50Z" fill="#4cc838" stroke="${OL}" stroke-width=".6"/>`;
    for (const [x, k, c] of [[-14, 1, '#ff4a4a'], [4, 0.8, '#ff8a3a'], [16, 0.7, '#ff4a4a']]) s += G(x, -60, k, `<rect x="-1.5" y="-8" width="3" height="8" fill="#f4ecd8" stroke="${OL}" stroke-width=".4"/><path d="M-7,-7Q0,-16 7,-7Z" fill="${c}" stroke="${OL}" stroke-width=".5"/><circle cx="-2" cy="-10" r="1" fill="#fff"/><circle cx="2.5" cy="-9" r=".8" fill="#fff"/>`);
    s += flower(-24, -54, 0.6, '#ffffff') + flower(26, -50, 0.5, '#ffd23a');
    return s;
  };
  OB.sprite = (o) => {
    let s = glow(0, -40, 26, '#e8ff9a', 0.8);
    s += `<path d="M0,-30L0,30" stroke="#f4f0d8" stroke-width="1"/>` + Array.from({ length: 14 }, (_, i) => { const a = i * 25.7 * Math.PI / 180; return `<path d="M0,30L${n1(Math.cos(a) * 14)},${n1(30 + Math.sin(a) * 14)}" stroke="#fffbe8" stroke-width=".6"/><circle cx="${n1(Math.cos(a) * 14)}" cy="${n1(30 + Math.sin(a) * 14)}" r=".9" fill="#fff"/>`; }).join('');
    s += `<ellipse cx="-9" cy="-46" rx="10" ry="5" fill="#d8fff0" opacity=".75" transform="rotate(-30 -9 -46)" stroke="#9ae8c8" stroke-width=".5"/><ellipse cx="9" cy="-46" rx="10" ry="5" fill="#d8fff0" opacity=".75" transform="rotate(30 9 -46)" stroke="#9ae8c8" stroke-width=".5"/>`;
    s += `<path d="M-3,-30Q0,-24 3,-30L2,-42L-2,-42Z" fill="#7ad84a" stroke="${OL}" stroke-width=".5"/><circle cx="0" cy="-46" r="4.5" fill="#ffe0c0" stroke="${OL}" stroke-width=".5"/><path d="M-5,-48Q0,-56 5,-48Q2,-52 -5,-48Z" fill="#ffd23a"/><circle cx="-1.6" cy="-46" r=".6" fill="#000"/><circle cx="1.6" cy="-46" r=".6" fill="#000"/><path d="M-4,-36L-9,-30M4,-36L1,-31" stroke="#ffe0c0" stroke-width="1.4" stroke-linecap="round"/>`;
    return s;
  };
  // treant: trunk body, branch arms, glowing eyes, vines and blossoms
  OB.treant = (o) => {
    const bark = o.bark || '#6a4424', leaf = o.leaf || '#3ab82a', gid = id('tr');
    let s = `<defs>${lin(gid, [[0, bark], [1, '#3a220c']], 1, 0)}</defs>`;
    s += `<path d="M-30,0L-26,-30Q-34,-60 -30,-100Q-28,-130 -18,-150L22,-150Q30,-130 30,-100Q34,-60 26,-30L30,0L12,0L8,-26L-8,-26L-12,0Z" fill="url(#${gid})" stroke="${OL}" stroke-width="1.5"/>`;
    s += `<path d="M-16,-140Q-14,-90 -20,-40M0,-146Q2,-100 -2,-30M14,-138Q16,-80 12,-40" stroke="#3a220c" stroke-width="1.6" fill="none" opacity=".55"/>`;
    const arm = (sx) => `<path d="M${sx * 26},-110Q${sx * 56},-112 ${sx * 70},-${o.armsUp ? 150 : 90}Q${sx * 74},-${o.armsUp ? 160 : 84} ${sx * 66},-${o.armsUp ? 148 : 84}Q${sx * 52},-102 ${sx * 26},-96Z" fill="${bark}" stroke="${OL}" stroke-width="1.2"/><path d="M${sx * 62},-${o.armsUp ? 146 : 88}l${sx * 12},${o.armsUp ? -10 : 6}M${sx * 66},-${o.armsUp ? 150 : 90}l${sx * 2},${o.armsUp ? -16 : 12}" stroke="${bark}" stroke-width="3" stroke-linecap="round"/>`;
    s += arm(-1) + arm(1);
    { const rr = A.rng(17); for (let i = 0; i < 18; i++) { const a = rr() * Math.PI * 2, d = rr() * 30, x = Math.cos(a) * d * 1.3, y = -166 + Math.sin(a) * d * 0.7, k = 11 + rr() * 8; s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(k)}" fill="${i % 3 ? leaf : '#2e8a22'}" stroke="${OL}" stroke-width=".8"/>`; }
      for (let i = 0; i < 9; i++) { const x = (rr() - 0.5) * 60, y = -176 - rr() * 18; s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(6 + rr() * 5)}" fill="#8aea4a" opacity=".9"/>`; } }
    s += `<path d="M-12,-120Q-6,-126 -2,-120M4,-120Q10,-126 14,-120" stroke="${OL}" stroke-width="1.4" fill="none"/>` + glow(-7, -116, 4, o.eye || '#c8ff4a', 0.9) + glow(9, -116, 4, o.eye || '#c8ff4a', 0.9) + `<circle cx="-7" cy="-116" r="2" fill="${o.eye || '#e8ff8a'}"/><circle cx="9" cy="-116" r="2" fill="${o.eye || '#e8ff8a'}"/><path d="M-8,-100Q2,-94 10,-100" stroke="${OL}" stroke-width="1.2" fill="none"/>`;
    if (o.vines !== false) s += `<path d="M-28,-60Q-40,-40 -30,-20Q-22,-10 -34,4M26,-70Q40,-50 30,-30" stroke="#2e9a2a" stroke-width="2.4" fill="none"/>` + [[-36, -40], [-28, -14], [34, -48], [30, -34]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2" fill="#5ad83a" transform="rotate(${i * 40} ${x} ${y})"/>`).join('');
    if (o.blossoms) for (let i = 0; i < 8; i++) s += flower(-34 + (i * 37) % 70, -170 + (i * 13) % 34, 1, FLOWER_COLS[i % 7]);
    if (o.moss) s += `<path d="M-30,-96Q-10,-104 26,-96Q20,-88 -26,-88Z" fill="#7ae04a" opacity=".85"/>`;
    return s;
  };
  // the great sand serpent (Queen Asheera's mount, hatchlings at small scale)
  OB.serpent = (o) => {
    const c1 = o.c1 || '#e8b058', c2 = o.c2 || '#a8642a', band = o.band || '#3ac8c0', gid = id('sp');
    let s = `<defs>${lin(gid, [[0, c1], [1, c2]], 1, 0)}</defs>`;
    const k = o.thick || 1, body = A.tube([-110, 10], [-70, -40], [40, 40], [40, -60], 46 * k, 30 * k, 26), neck = A.tube([40, -60], [44, -100], [10, -130], [-4, -150], 30 * k, 22 * k, 14);
    s += `<path d="${body.d}" fill="url(#${gid})" stroke="${OL}" stroke-width="1.6"/><path d="${neck.d}" fill="url(#${gid})" stroke="${OL}" stroke-width="1.6"/>`;
    for (const q of body.pts.concat(neck.pts).filter((_, i) => i % 3 === 1)) s += `<path d="M${n1(q.x + q.nx * q.w * 0.9)},${n1(q.y + q.ny * q.w * 0.9)}L${n1(q.x - q.nx * q.w * 0.9)},${n1(q.y - q.ny * q.w * 0.9)}" stroke="${band}" stroke-width="3" opacity=".85"/>`;
    for (const q of body.pts.concat(neck.pts).filter((_, i) => i % 2 === 0)) s += `<path d="M${n1(q.x - q.nx * q.w * 0.6)},${n1(q.y - q.ny * q.w * 0.6)}q2,-2 4,0" stroke="${OL}" stroke-width=".6" fill="none" opacity=".5"/>`;
    // head with glass frills
    s += `<path d="M-30,-160Q-10,-176 14,-168Q28,-160 24,-148Q12,-140 -6,-142Q-26,-144 -30,-160Z" fill="${c1}" stroke="${OL}" stroke-width="1.4"/>`;
    s += `<path d="M10,-168L20,-190L24,-166ZM-2,-172L2,-196L10,-170ZM-14,-170L-18,-190L-6,-172Z" fill="${band}" stroke="#0e6a72" stroke-width=".7"/>`;
    s += `<circle cx="-14" cy="-158" r="3.4" fill="#ffd23a" stroke="${OL}" stroke-width=".6"/><path d="M-14,-161L-14,-155" stroke="#000" stroke-width="1.4"/><path d="M-30,-152Q-40,-150 -46,-156M-46,-156l-4,-2M-46,-156l-4,3" stroke="#c8303a" stroke-width="1.2" fill="none"/>`;
    return s;
  };
  OB.scorpion = (o) => {
    const c = o.col || '#e09a3a', d = '#8a4a14';
    let s = `<ellipse cx="0" cy="-20" rx="44" ry="18" fill="${c}" stroke="${OL}" stroke-width="1.4"/>`;
    for (let i = 0; i < 4; i++) s += `<path d="M${-30 + i * 16},-36Q${-26 + i * 16},-20 ${-30 + i * 16},-4" stroke="${d}" stroke-width="1.2" fill="none"/>`;
    for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) s += `<path d="M${-20 + i * 12},-10L${-26 + i * 12 + sx * 4},6L${-30 + i * 12},10" stroke="${OL}" stroke-width="2.6" fill="none"/><path d="M${-20 + i * 12},-10L${-26 + i * 12 + sx * 4},6L${-30 + i * 12},10" stroke="${c}" stroke-width="1.6" fill="none"/>`;
    const tail = A.tube([-40, -24], [-80, -40], [-90, -110], [-40, -110], 14, 7, 18);
    s += `<path d="${tail.d}" fill="${c}" stroke="${OL}" stroke-width="1.3"/>` + tail.pts.filter((_, i) => i % 3 === 0).map(q => `<path d="M${n1(q.x + q.nx * q.w)},${n1(q.y + q.ny * q.w)}L${n1(q.x - q.nx * q.w)},${n1(q.y - q.ny * q.w)}" stroke="${d}" stroke-width="1"/>`).join('');
    s += `<path d="M-40,-110Q-22,-112 -24,-96L-32,-100Z" fill="#f4e8c0" stroke="${OL}" stroke-width="1"/>` + glow(-26, -98, 4, '#3ad8d0', 0.8);
    for (const sx of [-1, 1]) s += `<path d="M36,${-22 + sx * 6}Q56,${-30 + sx * 10} 66,${-26 + sx * 14}" stroke="${OL}" stroke-width="5" fill="none"/><path d="M36,${-22 + sx * 6}Q56,${-30 + sx * 10} 66,${-26 + sx * 14}" stroke="${c}" stroke-width="3.4" fill="none"/><path d="M64,${-34 + sx * 14}Q82,${-36 + sx * 14} 84,${-24 + sx * 14}Q74,${-28 + sx * 14} 70,${-22 + sx * 14}Q80,${-18 + sx * 14} 76,${-12 + sx * 14}Q62,${-14 + sx * 14} 60,${-26 + sx * 14}Z" fill="${c}" stroke="${OL}" stroke-width="1.1"/>`;
    s += `<circle cx="38" cy="-28" r="1.6" fill="#000"/><circle cx="42" cy="-26" r="1.6" fill="#000"/>`;
    return s;
  };
  OB.basilisk = (o) => {
    let s = `<path d="M-90,-6Q-60,-14 -40,-20Q-10,-34 30,-30Q52,-28 62,-36Q74,-44 88,-40Q96,-36 94,-30L80,-26Q70,-22 60,-22Q50,-14 46,-8L50,0L38,0L32,-12Q0,-8 -20,-10L-14,0L-26,0L-32,-12Q-60,-6 -90,-6Z" fill="#3aa8a0" stroke="${OL}" stroke-width="1.4"/>`;
    for (let i = 0; i < 26; i++) { const x = -60 + i * 5.2, y = -16 - Math.sin((i / 26) * Math.PI) * 14; s += `<path d="M${n1(x)},${n1(y)}l3,-4l3,4l-3,3Z" fill="${i % 3 ? '#5ae8d8' : '#e8b048'}" stroke="#0e5a5a" stroke-width=".4"/>`; }
    for (let i = 0; i < 9; i++) s += `<path d="M${-34 + i * 8},${-30 - Math.sin(i / 8 * Math.PI) * 6}l3,-10l3,10Z" fill="#e8fffc" stroke="#0e6a72" stroke-width=".5"/>`;
    s += glow(84, -36, 7, '#ffe04a', 0.9) + `<circle cx="84" cy="-36" r="3" fill="#fff4a0"/><path d="M84,-38v4" stroke="#000" stroke-width="1.2"/>`;
    for (let i = 0; i < 3; i++) s += `<path d="M90,${-36 + i * 3}L${150 + i * 6},${-46 + i * 10}" stroke="#ffe86a" stroke-width="${2 - i * 0.5}" opacity="${0.6 - i * 0.15}"/>`;
    return s;
  };

  /* ---------------- objects ---------------- */
  OB.seed = (o) => { const c = o.col || '#ffd23a', g2 = o.glowCol || '#c8ff6a', gid = id('sd');
    return `<defs>${rad(gid, [[0, '#ffffff'], [0.35, c], [1, o.dark || '#8a5a14']], 0.38, 0.32, 0.7)}</defs>` + glow(0, 0, 40, g2, 0.7) + `<path d="M0,-30Q22,-22 22,4Q20,28 0,30Q-20,28 -22,4Q-22,-22 0,-30Z" fill="url(#${gid})" stroke="${OL}" stroke-width="1.4"/><path d="M0,-28Q4,0 0,28" stroke="${o.dark || '#8a5a14'}" stroke-width="1" fill="none" opacity=".6"/><path d="M-10,-16Q-12,-4 -8,6" stroke="#fff" stroke-width="2" opacity=".6" fill="none"/>` + (o.sprout ? `<path d="M0,-28Q-2,-44 6,-52" stroke="#3ab82a" stroke-width="2.4" fill="none"/><path d="M4,-48Q16,-58 22,-48Q12,-44 4,-48Z" fill="#5ad83a" stroke="${OL}" stroke-width=".6"/><path d="M2,-42Q-12,-52 -16,-42Q-6,-38 2,-42Z" fill="#7ae04a" stroke="${OL}" stroke-width=".6"/>` : ''); };
  OB.hands = (o) => `<g transform="translate(0 -24)"><path d="M-60,30Q-50,0 -30,-6Q-10,-10 0,2Q10,-10 30,-6Q50,0 60,30Z" fill="#e8b890" stroke="${OL}" stroke-width="1.3"/><path d="M-30,-6Q-34,10 -40,18M30,-6Q34,10 40,18M-12,-4Q-14,8 -16,14M12,-4Q14,8 16,14" stroke="#a8704a" stroke-width="1" fill="none"/><path d="M-66,30L-60,60M66,30L60,60" stroke="#2a6a2a" stroke-width="20"/></g>`;
  OB.acorn = (o) => `${glow(0, -4, 40, '#c8ff6a', 0.6)}<path d="M-16,-6Q-18,22 0,30Q18,22 16,-6Z" fill="#c88a3a" stroke="${OL}" stroke-width="1.3"/><path d="M-20,-6Q-20,-24 0,-24Q20,-24 20,-6Z" fill="#7a5228" stroke="${OL}" stroke-width="1.3"/>` + Array.from({ length: 6 }, (_, i) => `<path d="M${-16 + i * 6},-20l3,4l3,-4" stroke="#4a3018" stroke-width=".8" fill="none"/>`).join('') + `<path d="M0,-24L2,-32" stroke="#4a3018" stroke-width="2"/><path d="M-4,4L4,14" stroke="#fff4b0" stroke-width="2.2" opacity=".9"/>${glow(0, 10, 10, '#e8ff8a', 0.9)}<path d="M0,10Q-6,-2 -2,-10M0,10Q8,0 6,-8" stroke="#5ad83a" stroke-width="2" fill="none"/><circle cx="-2" cy="-12" r="2.4" fill="#7ae04a"/><circle cx="6" cy="-10" r="2" fill="#7ae04a"/>`;
  OB.bulb = (o) => { let s = glow(0, -30, 46, '#fff0a0', 0.9) + `<path d="M-16,0Q-20,-14 -6,-22L6,-22Q20,-14 16,0Q8,6 0,6Q-8,6 -16,0Z" fill="#e8c890" stroke="${OL}" stroke-width="1.2"/><path d="M-10,4Q-14,12 -18,14M0,6L0,16M10,4Q14,12 18,14" stroke="#c8a070" stroke-width="1"/>`;
    for (let i = 0; i < 9; i++) { const a = -170 + i * 20; s += `<ellipse cx="0" cy="-40" rx="7" ry="18" fill="${i % 2 ? '#ffd23a' : '#ffb01a'}" stroke="${OL}" stroke-width=".8" transform="rotate(${a + 90} 0 -24)"/>`; }
    s += `<path d="M-2,-20Q-30,-10 -40,6Q-24,0 -4,-14Z M2,-20Q30,-10 40,6Q24,0 4,-14Z" fill="#4cc838" stroke="${OL}" stroke-width=".7"/>`;
    return s + `<circle cx="0" cy="-34" r="7" fill="#fff8d0"/>` + glow(0, -34, 16, '#ffffff', 0.9); };
  OB.mushrooms = (o) => { let s = ''; for (const [x, y, k] of [[-30, 0, 0.8], [0, 4, 1.2], [28, -2, 0.9], [-12, 10, 0.6], [46, 8, 0.6]]) s += G(x, y, k, glow(0, -24, 22, '#6ad8ff', 0.75) + `<path d="M-4,0L-3,-22L3,-22L4,0Z" fill="#e8f4ff" stroke="${OL}" stroke-width=".7"/><path d="M-20,-20Q0,-46 20,-20Q0,-14 -20,-20Z" fill="#3a9aff" stroke="${OL}" stroke-width="1"/><circle cx="-8" cy="-28" r="2.2" fill="#d8f8ff"/><circle cx="4" cy="-33" r="1.6" fill="#d8f8ff"/><circle cx="10" cy="-25" r="1.8" fill="#d8f8ff"/>`);
    for (let i = 0; i < 26; i++) s += `<circle cx="${n1(-40 + ((i * 37) % 90))}" cy="${n1(-60 - ((i * 23) % 50))}" r="${n1(0.8 + (i % 3) * 0.5)}" fill="#e8ffff" opacity=".9"/>`; return s; };
  OB.wreath = (o) => { let s = `<path d="M-40,8Q-46,-30 -10,-40Q30,-44 40,-10Q46,18 20,26" fill="none" stroke="#3a9a2a" stroke-width="7"/>`; s += `<ellipse cx="0" cy="18" rx="50" ry="12" fill="#c8d0dc" stroke="${OL}" stroke-width="1.2"/><path d="M-36,18Q-30,-24 0,-26Q30,-24 36,18Z" fill="#dfe6ee" stroke="${OL}" stroke-width="1.3"/><path d="M-6,-24L-4,16M6,-24L4,16" stroke="#a8b4c4" stroke-width="1.2"/><path d="M-30,0L30,0" stroke="#8a96a8" stroke-width="2"/>`;
    for (let i = 0; i < 16; i++) { const a = Math.PI + i * Math.PI / 15, x = Math.cos(a) * 40, y = -6 + Math.sin(a) * 26; s += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="5" ry="2.6" fill="#4cc838" transform="rotate(${n1(i * 12)} ${n1(x)} ${n1(y)})" stroke="${OL}" stroke-width=".4"/>` + (i % 2 ? flower(x, y - 2, 0.9, '#ffffff', '#ffe066') : ''); }
    return glow(0, -10, 50, '#fffbe0', 0.5) + s; };
  OB.heartAmulet = (o) => `${glow(0, 0, 44, '#9aff6a', 0.7)}<path d="M0,-50Q-2,-60 -6,-70M0,-50Q2,-60 6,-70" stroke="#c8a060" stroke-width="1.4" fill="none"/><path d="M0,26Q-36,0 -34,-22Q-30,-40 -12,-38Q-2,-36 0,-26Q2,-36 12,-38Q30,-40 34,-22Q36,0 0,26Z" fill="#a8703a" stroke="${OL}" stroke-width="1.4"/><path d="M0,20Q-26,0 -26,-20M-14,-30Q-6,-28 -2,-20" stroke="#6a4420" stroke-width="1.1" fill="none"/><path d="M-20,-26Q-24,-16 -20,-8" stroke="#e8c08a" stroke-width="2" fill="none" opacity=".7"/><path d="M0,-26Q-2,-44 8,-54" stroke="#3ab82a" stroke-width="2.4" fill="none"/><path d="M6,-50Q20,-62 26,-50Q14,-46 6,-50Z" fill="#5ad83a" stroke="${OL}" stroke-width=".6"/><path d="M2,-42Q-12,-54 -18,-44Q-8,-38 2,-42Z" fill="#7ae04a" stroke="${OL}" stroke-width=".6"/>${glow(0, -6, 10, '#c8ff8a', 0.9)}`;
  OB.totem = (o) => { let s = `<rect x="-16" y="-150" width="32" height="150" fill="#8a5a2a" stroke="${OL}" stroke-width="1.4"/>`;
    for (let i = 0; i < 3; i++) { const y = -140 + i * 46; s += `<rect x="-18" y="${y}" width="36" height="40" rx="5" fill="${['#a8703a', '#9a6030', '#b07a40'][i]}" stroke="${OL}" stroke-width="1.2"/><circle cx="-7" cy="${y + 14}" r="4" fill="#f4ecd8" stroke="${OL}" stroke-width=".7"/><circle cx="7" cy="${y + 14}" r="4" fill="#f4ecd8" stroke="${OL}" stroke-width=".7"/><circle cx="-7" cy="${y + 14}" r="1.6" fill="#1a1a1a"/><circle cx="7" cy="${y + 14}" r="1.6" fill="#1a1a1a"/><path d="M-9,${y + 28}Q0,${y + 34} 9,${y + 28}" stroke="${OL}" stroke-width="1.6" fill="#c8303a"/><path d="M-18,${y + 4}L-26,${y - 2}M18,${y + 4}L26,${y - 2}" stroke="#7a4a20" stroke-width="4" stroke-linecap="round"/>`; }
    for (let i = 0; i < 9; i++) s += `<ellipse cx="${n1(-20 + i * 5)}" cy="${n1(-156 - Math.sin(i / 8 * Math.PI) * 18)}" rx="7" ry="3.4" fill="${i % 2 ? '#4cc838' : '#7ae04a'}" transform="rotate(${-60 + i * 15} ${n1(-20 + i * 5)} ${n1(-156 - Math.sin(i / 8 * Math.PI) * 18)})" stroke="${OL}" stroke-width=".5"/>`;
    s += `<path d="M-16,-20Q-26,-40 -16,-60M16,-50Q26,-70 18,-90" stroke="#3ab82a" stroke-width="2" fill="none"/>`; return s; };
  OB.satchel = (o) => `<path d="M-44,-30Q-46,20 -40,34L40,34Q46,20 44,-30Z" fill="#8a5a2a" stroke="${OL}" stroke-width="1.4"/><path d="M-44,-30Q0,-44 44,-30L40,0Q0,10 -40,0Z" fill="#a8703a" stroke="${OL}" stroke-width="1.3"/><rect x="-6" y="-6" width="12" height="10" rx="2" fill="#d8b050" stroke="${OL}" stroke-width=".8"/><path d="M-44,-30Q-40,-70 0,-74Q40,-70 44,-30" stroke="#6a4020" stroke-width="5" fill="none"/>` + [[-30, 34, '#ff4a6a'], [-14, 40, '#ffd23a'], [14, 38, '#6ad0ff']].map(([x, y, c]) => `<rect x="${x - 7}" y="${y - 8}" width="14" height="18" fill="#f4e8c8" stroke="${OL}" stroke-width=".8" transform="rotate(${x / 2} ${x} ${y})"/>` + flower(x, y - 1, 0.8, c)).join('') + `<path d="M30,30L58,6" stroke="#8a8a90" stroke-width="5" stroke-linecap="round"/><path d="M56,8L66,-4L70,2Z" fill="#b8c0c8" stroke="${OL}" stroke-width=".8"/>` + [[-50, 44], [-20, 48], [50, 44], [36, 50]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.6" fill="#ffd23a"/>` + glow(x, y, 4, '#c8ff6a', 0.6)).join('');
  OB.thornseed = (o) => { let s = glow(0, 0, 40, '#ff4a6a', 0.45) + `<path d="M0,-22Q16,-16 16,2Q14,20 0,22Q-14,20 -16,2Q-16,-16 0,-22Z" fill="#2a1a2a" stroke="${OL}" stroke-width="1.2"/><path d="M-6,-14Q-8,0 -4,10" stroke="#8a6a8a" stroke-width="1.5" fill="none"/>`;
    s += `<ellipse cx="0" cy="0" rx="32" ry="30" fill="none" stroke="#2e6a22" stroke-width="5"/><ellipse cx="0" cy="0" rx="32" ry="30" fill="none" stroke="#5a9a3a" stroke-width="2"/>`;
    for (let i = 0; i < 16; i++) { const a = i * 22.5 * Math.PI / 180, x = Math.cos(a) * 32, y = Math.sin(a) * 30; s += `<path d="M${n1(x - Math.sin(a) * 3)},${n1(y + Math.cos(a) * 3)}L${n1(x + Math.cos(a) * 11)},${n1(y + Math.sin(a) * 11)}L${n1(x + Math.sin(a) * 3)},${n1(y - Math.cos(a) * 3)}Z" fill="#f0e8c8" stroke="${OL}" stroke-width=".6"/>`; }
    s += `<path d="M-6,-20L-2,-34L2,-20ZM8,-18L16,-28L12,-14Z" fill="#c83a5a" stroke="${OL}" stroke-width=".6"/>`;
    return s; };
  OB.vines = (o) => { let s = ''; const r = A.rng(o.seed || 3); for (let i = 0; i < (o.n || 6); i++) { const x0 = -90 + i * 36 + r() * 10, h = 60 + r() * 70, bend = (r() - 0.5) * 60; const t = A.tube([x0, 0], [x0 + bend * 0.2, -h * 0.4], [x0 + bend, -h * 0.7], [x0 + bend * 0.6, -h], 9, 2, 14); s += `<path d="${t.d}" fill="${o.col || '#2e9a2a'}" stroke="${OL}" stroke-width="1"/>`; for (const q of t.pts.filter((_, k) => k % 3 === 2)) s += `<path d="M${n1(q.x)},${n1(q.y)}l${n1(q.nx * 7)},${n1(q.ny * 7 - 2)}" stroke="${o.thorn || '#e8e0c0'}" stroke-width="1.6"/>` + (o.leaves !== false ? `<ellipse cx="${n1(q.x - q.nx * 6)}" cy="${n1(q.y - q.ny * 6)}" rx="5" ry="2.4" fill="#5ad83a" stroke="${OL}" stroke-width=".4"/>` : ''); }
    return s; };
  OB.stones = (o) => { let s = ''; for (const [x, h, w] of [[-110, 54, 20], [-66, 70, 24], [-20, 62, 22], [26, 74, 24], [72, 64, 22], [114, 50, 18]]) s += `<path d="M${x - w / 2},0L${x - w / 2 + 2},${-h}Q${x},${-h - 8} ${x + w / 2 - 2},${-h}L${x + w / 2},0Z" fill="#9aa4a0" stroke="${OL}" stroke-width="1.2"/><path d="M${x - w / 2 + 2},${-h}Q${x},${-h - 8} ${x + w / 2 - 2},${-h}L${x + w / 2 - 2},${-h + 12}Q${x},${-h + 6} ${x - w / 2 + 2},${-h + 12}Z" fill="#5ac83a"/><path d="M${x - 5},${-h * 0.5}a5,5 0 1,1 5,5a3,3 0 1,1 -3,-3" stroke="#3ad8ff" stroke-width="1.3" fill="none"/>` + glow(x, -h * 0.5, 8, '#6ae8ff', 0.6); return s; };
  // ---- Sunscorch objects ----
  OB.sunDisc = (o) => { const gid = id('sd'); let s = `<defs>${rad(gid, [[0, '#fff8d0'], [0.5, '#ffc83a'], [1, '#b8741a']], 0.4, 0.35, 0.75)}</defs>` + glow(0, 0, 70, '#ffe080', 0.8);
    for (let i = 0; i < 16; i++) { const a = i * 22.5 * Math.PI / 180; s += `<path d="M${n1(Math.cos(a - 0.08) * 34)},${n1(Math.sin(a - 0.08) * 34)}L${n1(Math.cos(a) * 50)},${n1(Math.sin(a) * 50)}L${n1(Math.cos(a + 0.08) * 34)},${n1(Math.sin(a + 0.08) * 34)}Z" fill="#e8a83a" stroke="${OL}" stroke-width=".8"/>`; }
    s += `<circle r="34" fill="url(#${gid})" stroke="${OL}" stroke-width="1.6"/><circle r="22" fill="none" stroke="#8a5a14" stroke-width="1.2"/><circle r="8" fill="#3ac8c0" stroke="#0e6a72" stroke-width="1"/>`;
    if (o.cracked) s += `<path d="M-30,-10L-12,-4L-16,8L4,14L2,30M10,-30L6,-12L20,-6" stroke="#5a3008" stroke-width="1.4" fill="none"/><path d="M-30,-10L-12,-4L-16,8L4,14" stroke="#fff8c0" stroke-width=".6" fill="none"/>`;
    return s; };
  OB.scarab = (o) => `${glow(0, 0, 50, '#5ae8e0', 0.6)}<ellipse cx="0" cy="6" rx="18" ry="24" fill="#2ac0c0" stroke="${OL}" stroke-width="1.4"/><path d="M0,-16L0,30" stroke="#0e6a72" stroke-width="1.6"/><ellipse cx="0" cy="-20" rx="12" ry="8" fill="#1aa0a8" stroke="${OL}" stroke-width="1.2"/><path d="M-6,-26L-10,-36M6,-26L10,-36" stroke="${OL}" stroke-width="1.6"/>` + [-1, 1].map(sx => `<path d="M${sx * 14},-4Q${sx * 50},-30 ${sx * 64},-6Q${sx * 48},-4 ${sx * 16},6Z" fill="#a8f8f0" opacity=".9" stroke="#0e8a92" stroke-width="1"/><path d="M${sx * 20},-4Q${sx * 40},-16 ${sx * 56},-8" stroke="#0e8a92" stroke-width=".7" fill="none"/>` + [0, 1, 2].map(i => `<path d="M${sx * 14},${4 + i * 8}l${sx * 12},${4 + i * 2}l${sx * 2},6" stroke="${OL}" stroke-width="1.4" fill="none"/>`).join('')).join('') + `<path d="M-8,0Q-12,10 -6,20" stroke="#e8fffc" stroke-width="2" fill="none" opacity=".7"/><circle cx="0" cy="6" r="4" fill="#ffc83a" stroke="${OL}" stroke-width=".6"/>`;
  OB.waterskin = (o) => `<path d="M-6,-60L-6,-44M6,-60L6,-44" stroke="#c8a070" stroke-width="2"/><path d="M-10,-46L10,-46L12,-36L-12,-36Z" fill="#6a4420" stroke="${OL}" stroke-width="1"/><path d="M-12,-36Q-40,-20 -38,14Q-34,40 0,42Q34,40 38,14Q40,-20 12,-36Z" fill="#a8703a" stroke="${OL}" stroke-width="1.4"/><path d="M-28,-10Q-30,10 -22,26" stroke="#e8c08a" stroke-width="2.4" fill="none" opacity=".7"/><path d="M-36,0Q0,8 36,0" stroke="#6a4420" stroke-width="1.6" fill="none"/>` + [[-20, 14], [10, 24], [24, -4], [-6, 32]].map(([x, y]) => `<path d="M${x},${y}q2,4 0,6q-2,-2 0,-6Z" fill="#bff8ff" stroke="#3a9ab0" stroke-width=".4"/>`).join('');
  OB.lens = (o) => `<circle r="34" fill="#c8f0f8" opacity=".55" stroke="#b8862a" stroke-width="5"/><circle r="34" fill="none" stroke="${OL}" stroke-width="1"/><circle r="38" fill="none" stroke="${OL}" stroke-width="1"/><path d="M-18,-16Q-8,-26 6,-24" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/><path d="M24,24L52,52" stroke="#8a5a2a" stroke-width="8" stroke-linecap="round"/><path d="M24,24L52,52" stroke="${OL}" stroke-width="1" fill="none"/>` + `<path d="M0,0L-30,${o.beamY || 90}" stroke="#fffbe0" stroke-width="3" opacity=".9"/>` + glow(-30, o.beamY || 90, 10, '#fff4a0', 1) + `<circle cx="-30" cy="${o.beamY || 90}" r="3" fill="#ffffff"/>`;
  OB.circlet = (o) => `${glow(0, 0, 40, '#ffb83a', 0.5)}<ellipse cx="0" cy="6" rx="46" ry="14" fill="none" stroke="#e8b83a" stroke-width="5"/><ellipse cx="0" cy="6" rx="46" ry="14" fill="none" stroke="${OL}" stroke-width="1" /><path d="M-10,-6L0,-20L10,-6Z" fill="#e8b83a" stroke="${OL}" stroke-width="1"/><ellipse cx="0" cy="-6" rx="8" ry="10" fill="#ff9a1a" stroke="${OL}" stroke-width="1"/>${glow(0, -6, 12, '#ffd04a', 0.95)}<ellipse cx="-2" cy="-9" rx="2.4" ry="3" fill="#fff8d0"/>`;
  OB.ledger = (o) => `<path d="M-60,10L0,24L60,10L60,-26L0,-12L-60,-26Z" fill="#7a3a1a" stroke="${OL}" stroke-width="1.4"/><path d="M-56,4L0,16L56,4L56,-30L0,-18L-56,-30Z" fill="#f4e8c8" stroke="${OL}" stroke-width="1"/><path d="M0,-18L0,16" stroke="${OL}" stroke-width="1"/>` + [0, 1, 2, 3, 4].map(i => `<path d="M-48,${-22 + i * 5}L-8,${-13 + i * 5}M8,${-13 + i * 5}L${48 - (i % 2) * 10},${-22 + i * 5}" stroke="#8a6a4a" stroke-width=".8"/>`).join('') + `<path d="M12,-4Q24,-14 30,-2T48,-8" stroke="#c8303a" stroke-width="1.2" fill="none" stroke-dasharray="2 2"/><circle cx="30" cy="-2" r="2" fill="#c8303a"/>`;
  OB.sickle = (o) => `${glow(-20, -30, 30, '#3ad8d0', 0.4)}<path d="M-30,30L-24,22" stroke="#5a3a1a" stroke-width="7" stroke-linecap="round"/><rect x="-34" y="14" width="20" height="5" rx="2" fill="#c8963a" stroke="${OL}" stroke-width="1" transform="rotate(-50 -24 16)"/><circle cx="-34" cy="34" r="4" fill="#3ac8c0" stroke="${OL}" stroke-width=".8"/><path d="M-20,12Q10,-30 4,-60Q30,-40 36,-10Q38,10 20,22Q30,0 22,-20Q14,-2 -14,18Z" fill="#d8a050" stroke="${OL}" stroke-width="1.4"/><path d="M4,-56Q26,-34 30,-8" stroke="#fff4c8" stroke-width="1.6" fill="none"/>`;
  OB.palm = (o) => palm(0, 0, 1, A.rng(o.seed || 4));
  OB.temple = (o) => { let s = `<path d="M-120,0L-110,-90L110,-90L120,0Z" fill="#e8c890" stroke="${OL}" stroke-width="1.4"/><path d="M-120,-90L120,-90L104,-110L-104,-110Z" fill="#d8b070" stroke="${OL}" stroke-width="1.2"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${-100 + i * 36}" y="-86" width="14" height="86" fill="#f4dca8" stroke="${OL}" stroke-width="1"/>`;
    s += `<path d="M-24,0L-24,-56Q0,-74 24,-56L24,0Z" fill="#2a1a0a" stroke="${OL}" stroke-width="1.2"/>` + G(0, -120, 0.45, OB.sunDisc({})) + `<path d="M-130,0Q-80,-30 -40,-10L-30,0ZM130,0Q90,-40 50,-12L40,0Z" fill="#f0c060"/>`; return s; };
  OB.mirror = (o) => `${glow(0, -10, 60, '#ffffff', 0.6)}<path d="M-34,-40Q-40,-10 -30,30Q0,46 30,30Q40,-10 34,-40Q0,-52 -34,-40Z" fill="#e8f0f8" stroke="${OL}" stroke-width="1.5"/><path d="M-26,-34Q-30,-8 -24,22Q0,34 24,22Q30,-8 26,-34Q0,-44 -26,-34Z" fill="#ffffff"/><path d="M-30,-40Q-54,-40 -58,-20L-44,-14Q-40,-30 -30,-32Z M30,-40Q54,-40 58,-20L44,-14Q40,-30 30,-32Z" fill="#c8d0dc" stroke="${OL}" stroke-width="1.2"/><path d="M-10,-30Q-16,0 -10,24" stroke="#c8d8e8" stroke-width="3" fill="none"/>` + G(0, -6, 0.3, OB.sunDisc({}));
  OB.veil = (o) => `<path d="M-30,-40Q0,-60 30,-40Q36,0 50,40Q0,60 -50,40Q-36,0 -30,-40Z" fill="#f8f4ec" stroke="${OL}" stroke-width="1.3" opacity=".97"/><path d="M-30,-40Q0,-30 30,-40" stroke="#e8b83a" stroke-width="4" fill="none"/><path d="M-40,20Q0,30 40,20M-46,34Q0,46 46,34" stroke="#e8b83a" stroke-width="1.6" fill="none"/>` + G(0, -40, 0.22, OB.sunDisc({})) + `<path d="M40,20Q70,10 90,24Q70,30 46,34" fill="#f8f4ec" stroke="${OL}" stroke-width="1" opacity=".9"/>`;
  OB.wrapsOld = (o) => `<path d="M-30,-60L-20,-60L-16,0Q10,2 22,10L-36,10Z" fill="#e8d0a0" stroke="${OL}" stroke-width="1.3"/>` + [0, 1, 2, 3, 4, 5].map(i => `<path d="M-32,${-54 + i * 10}L-16,${-50 + i * 10}" stroke="#a8844a" stroke-width="1.4"/>`).join('') + `<path d="M-40,10L26,10L28,16L-42,16Z" fill="#8a5a2a" stroke="${OL}" stroke-width="1"/>`;
  OB.wraps = (o) => `<path d="M-14,-90Q-18,-50 -12,-16Q-14,-4 -10,0L44,0Q48,-10 36,-14Q14,-18 8,-22Q10,-56 6,-90Z" fill="#e8d0a0" stroke="${OL}" stroke-width="1.3"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${-15 + (i > 5 ? 2 : 0)},${-84 + i * 10}L${7 - (i > 5 ? -6 : 0)},${-78 + i * 10}" stroke="#a8844a" stroke-width="1.6"/>`).join('') + `<path d="M-14,-6Q14,-10 40,-8" stroke="#a8844a" stroke-width="1.2" fill="none"/><path d="M-14,0L48,0L50,6L-16,6Z" fill="#8a5a2a" stroke="${OL}" stroke-width="1"/><path d="M8,-22Q20,-6 30,-4M0,-16L22,-4" stroke="#6a4a20" stroke-width="1.4" fill="none"/>`;
  OB.glassbow = (o) => `${glow(0, 0, 50, '#ffb83a', 0.4)}<path d="M-6,-70Q-36,-60 -26,-20Q-20,-6 -24,0Q-20,6 -26,20Q-36,60 -6,70" stroke="${OL}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M-6,-70Q-36,-60 -26,-20Q-20,-6 -24,0Q-20,6 -26,20Q-36,60 -6,70" stroke="#f0a83a" stroke-width="5.4" fill="none" stroke-linecap="round"/><path d="M-8,-64Q-30,-54 -24,-24" stroke="#fff4c0" stroke-width="1.4" fill="none"/><path d="M-6,-70L-6,70" stroke="#fff8e0" stroke-width=".9"/><rect x="-30" y="-8" width="10" height="16" rx="2" fill="#3ac8c0" stroke="${OL}" stroke-width=".8"/>`;
  OB.sunstaff = (o) => `<path d="M0,90L0,-50" stroke="#f4ecd8" stroke-width="6" stroke-linecap="round"/><path d="M0,90L0,-50" stroke="${OL}" stroke-width="1" fill="none"/>${glow(0, -70, 30, '#ffe080', 0.9)}<circle cx="0" cy="-70" r="20" fill="none" stroke="#e8b83a" stroke-width="5"/><circle cx="0" cy="-70" r="20" fill="none" stroke="${OL}" stroke-width=".8"/><circle cx="0" cy="-70" r="7" fill="#fff4b0"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * 45 * Math.PI / 180; return `<path d="M${n1(Math.cos(a) * 22)},${n1(-70 + Math.sin(a) * 22)}L${n1(Math.cos(a) * 30)},${n1(-70 + Math.sin(a) * 30)}" stroke="#e8b83a" stroke-width="2.4"/>`; }).join('');
  OB.colossus = (o) => { const gid = id('co'), c = `url(#${gid})`, d = '#9a6a2a'; let s = `<defs>${lin(gid, [[0, '#f4d08a'], [0.5, '#e0b46a'], [1, '#a8742e']], 1, 0.4)}</defs>`; s += `<path d="M-46,0L-40,-60L-56,-110L-40,-150L-20,-160L20,-160L40,-150L56,-110L40,-60L46,0L18,0L14,-50L-14,-50L-18,0Z" fill="${c}" stroke="${OL}" stroke-width="1.6"/>`;
    s += `<rect x="-18" y="-196" width="36" height="38" rx="4" fill="${c}" stroke="${OL}" stroke-width="1.4"/><path d="M-12,-170L12,-170M-4,-176L-4,-166M4,-176L4,-166" stroke="#8a5a1a" stroke-width="1"/><path d="M-22,-196L22,-196L26,-210L-26,-210Z" fill="#3ac8c0" stroke="${OL}" stroke-width="1"/><rect x="-10" y="-184" width="7" height="4" fill="#ffe86a"/><rect x="3" y="-184" width="7" height="4" fill="#ffe86a"/>` + glow(0, -182, 12, '#ffe86a', 0.7);
    for (const sx of [-1, 1]) s += `<path d="M${sx * 40},-150L${sx * 76},-120L${sx * 84},-60L${sx * 66},-58L${sx * 60},-110L${sx * 40},-120Z" fill="${c}" stroke="${OL}" stroke-width="1.4"/>`;
    s += `<path d="M-40,-100L40,-100M-30,-70L30,-70M-20,-140L20,-140" stroke="${d}" stroke-width="1.4"/><path d="M-30,-130L-20,-110L-28,-90M24,-120L30,-96" stroke="${d}" stroke-width="1" fill="none"/>`;
    for (let i = 0; i < 6; i++) s += `<path d="M${-60 + i * 22},-60Q${-58 + i * 22},-30 ${-64 + i * 22},0" stroke="#f8dca0" stroke-width="${1.5 + (i % 2)}" fill="none" opacity=".75"/>`;
    return s; };
  OB.camel = (o) => `<path d="M-50,-40Q-50,-56 -36,-58Q-26,-76 -10,-60Q4,-78 18,-60Q30,-56 34,-50L50,-74L62,-76L64,-66L54,-62L44,-36Q40,-30 34,-30L34,0L28,0L26,-28L-30,-28L-32,0L-38,0L-40,-30Q-50,-32 -50,-40Z" fill="#c8945a" stroke="${OL}" stroke-width="1.2"/><circle cx="58" cy="-72" r="1.2" fill="#000"/>` + (o.load ? `<rect x="-30" y="-74" width="16" height="12" fill="#f8f8f4" stroke="${OL}" stroke-width=".8"/><rect x="-6" y="-74" width="16" height="12" fill="#f8f8f4" stroke="${OL}" stroke-width=".8"/>` : '');

  OB.seasons = (o) => { const r = A.rng(11); let s = `<ellipse cx="0" cy="4" rx="120" ry="16" fill="#3a9a2a" opacity=".5"/>`;
    const looks = [{ x: -84, leaf: ['#ff9ac8', '#ffc8e0', '#ffffff'] }, { x: -28, leaf: ['#2e9a2a', '#4cc838', '#8aea4a'] }, { x: 28, leaf: ['#d8601a', '#f0a02a', '#ffd23a'] }, { x: 84, leaf: ['#d8e8f8', '#ffffff', '#b8d0e8'], snow: 1 }];
    for (const k of looks) s += bigTree(k.x, 0, 0.42, r, { leaf: k.leaf });
    s += `<path d="M64,2Q84,-6 104,2" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>` + [0, 1, 2, 3, 4, 5].map(i => `<circle cx="${60 + i * 9}" cy="${-30 - (i % 3) * 18}" r="1.4" fill="#fff"/>`).join('');
    return s; };
  OB.hornbow = (o) => `${glow(0, 0, 50, '#c8ff6a', 0.45)}<path d="M0,-70Q-34,-50 -22,-10Q-18,0 -22,10Q-34,50 0,70" stroke="${OL}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M0,-70Q-34,-50 -22,-10Q-18,0 -22,10Q-34,50 0,70" stroke="#e8dcc0" stroke-width="7" fill="none" stroke-linecap="round"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${-24 + (i % 2) * 2},${-56 + i * 15}l6,3" stroke="#a89a7a" stroke-width="1.4"/>`).join('') + `<path d="M0,-70L0,70" stroke="#f8f4e8" stroke-width=".9"/><path d="M-22,-14Q-30,0 -22,14" stroke="#2e9a2a" stroke-width="5" fill="none"/>` + [[-28, -8], [-30, 6], [-16, 18]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3" fill="#5ad83a" stroke="${OL}" stroke-width=".5" transform="rotate(${i * 50} ${x} ${y})"/>`).join('') + flower(-26, -18, 1.2, '#ffffff');
  OB.livingstaff = (o) => `${glow(0, -80, 34, '#c8ff6a', 0.8)}<path d="M4,90Q-6,40 2,0Q8,-40 -2,-70" stroke="${OL}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M4,90Q-6,40 2,0Q8,-40 -2,-70" stroke="#8a5a2a" stroke-width="6.4" fill="none" stroke-linecap="round"/><path d="M-2,-70Q-14,-84 -20,-92M-2,-70Q10,-86 18,-90" stroke="#8a5a2a" stroke-width="3" fill="none"/>` + [[-22, -94], [20, -92], [-10, -80], [12, -74], [-14, -62]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="3.6" fill="${i % 2 ? '#4cc838' : '#7ae04a'}" stroke="${OL}" stroke-width=".5" transform="rotate(${-40 + i * 35} ${x} ${y})"/>`).join('') + G(0, -88, 2.2, `<g>${[0, 1, 2, 3, 4].map(i => { const a = i * 72 * Math.PI / 180; return `<ellipse cx="${n1(Math.cos(a) * 3.2)}" cy="${n1(Math.sin(a) * 3.2)}" rx="2.8" ry="2" fill="#ff8ac8" stroke="${OL}" stroke-width=".3" transform="rotate(${i * 72} ${n1(Math.cos(a) * 3.2)} ${n1(Math.sin(a) * 3.2)})"/>`; }).join('')}<circle r="1.6" fill="#ffe066"/></g>`);
  OB.fountain = (o) => `<ellipse cx="0" cy="0" rx="50" ry="12" fill="#c8ccd0" stroke="${OL}" stroke-width="1.2"/><ellipse cx="0" cy="-3" rx="42" ry="8" fill="#6ad0ff"/><rect x="-6" y="-40" width="12" height="38" fill="#d8dce0" stroke="${OL}" stroke-width="1"/><ellipse cx="0" cy="-40" rx="20" ry="5" fill="#c8ccd0" stroke="${OL}" stroke-width="1"/>` + [-1, 1].map(sx => `<path d="M0,-44Q${sx * 20},-62 ${sx * 34},-6" stroke="#bff0ff" stroke-width="2" fill="none" opacity=".9"/>`).join('') + glow(0, -44, 12, '#ffffff', 0.8);
  OB.pool = (o) => glow(0, -6, 90, o.glowCol || '#9affd0', 0.75) + `<ellipse cx="0" cy="0" rx="80" ry="16" fill="#2a8a8a" stroke="${OL}" stroke-width="1.2"/><ellipse cx="0" cy="-2" rx="70" ry="11" fill="${o.col || '#8affe0'}"/><ellipse cx="-20" cy="-4" rx="30" ry="2.4" fill="#ffffff" opacity=".8"/>` + [[-70, -4], [-40, 10], [60, -2], [30, 12], [76, 4]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="5" fill="#7a8a7a" stroke="${OL}" stroke-width=".7"/><path d="M${x - 8},${y - 3}q8,-4 16,0" stroke="#5ad83a" stroke-width="2" fill="none"/>`).join('');
  OB.wall = (o) => { let s = `<rect x="-160" y="-50" width="320" height="50" fill="#e8dcc0" stroke="${OL}" stroke-width="1.2"/>`; for (let x = -160; x < 160; x += 24) s += `<path d="M${x},-50v50" stroke="#c8b898" stroke-width=".8"/>`; for (let x = -150; x < 160; x += 40) s += `<path d="M${x - 8},0L${x - 8},-30Q${x},-42 ${x + 8},-30L${x + 8},0Z" fill="#a8b8a0" stroke="${OL}" stroke-width=".8"/>`; return s + `<rect x="-164" y="-56" width="328" height="8" fill="#d8c8a8" stroke="${OL}" stroke-width="1"/>`; };
  OB.bed = (o) => { let s = `<rect x="-60" y="-10" width="120" height="14" rx="3" fill="#7a5a3a" stroke="${OL}" stroke-width="1"/>`; for (let i = 0; i < 9; i++) s += `<path d="M${-54 + i * 13},-10V-22" stroke="#3a9a2a" stroke-width="2"/>` + flower(-54 + i * 13, -24, 1.3, o.col || FLOWER_COLS[i % 7]); return s; };
  OB.domes = (o) => { let s = ''; for (const [x, w, h] of [[-90, 30, 30], [-40, 46, 50], [20, 36, 38], [70, 50, 44], [120, 28, 26]]) s += `<rect x="${x - w / 2}" y="${-h * 0.6}" width="${w}" height="${h * 0.6}" fill="#f2e2bc" stroke="#9a7a4a" stroke-width=".8"/><path d="M${x - w / 2},${-h * 0.6}Q${x},${-h * 1.4} ${x + w / 2},${-h * 0.6}Z" fill="${x % 3 ? '#3ac8c0' : '#e8b83a'}" stroke="#9a7a4a" stroke-width=".8"/><rect x="${x - 4}" y="${-h * 0.4}" width="8" height="${h * 0.4}" fill="#5a3a1a" opacity=".6"/>`; return s + `<path d="M-130,0Q-60,-18 0,-6Q60,-20 150,0L150,20L-130,20Z" fill="#f0c060"/>`; };
  OB.minion = (o) => `<path d="M-30,0Q-34,-30 -14,-40Q4,-48 20,-40Q34,-30 30,0Z" fill="${o.col || '#5a4a6a'}" stroke="${OL}" stroke-width="1.2"/><circle cx="-6" cy="-30" r="3" fill="#ff5a3a"/><circle cx="8" cy="-30" r="3" fill="#ff5a3a"/><path d="M-10,-18L-6,-14L-2,-18L2,-14L6,-18" stroke="#f4ecd8" stroke-width="1.4" fill="none"/><path d="M-30,-10L-42,0M30,-10L42,0" stroke="${o.col || '#5a4a6a'}" stroke-width="5" stroke-linecap="round"/>`;
  L.w = function (o, P) {
    const f = OB[o.t]; if (!f) return '';
    const sh = o.shadow ? shadow(o.x, o.y + 2, o.shadow, o.shadow * 0.18) : '';
    return sh + G(o.x || 150, o.y || 200, o.s || 1, f(o, P), o.rot, o.flip);
  };
  A.WOB = OB;

  /* ---------------- effects ---------------- */
  L.petals = (o) => { const r = A.rng(o.seed || 9); let s = ''; for (let i = 0; i < (o.n || 30); i++) { const x = (o.x || 150) + (r() - 0.5) * (o.w || 260), y = (o.y || 110) + (r() - 0.5) * (o.h || 160), c = (o.cols || ['#ff8ab8', '#ffffff', '#ffd23a', '#ff6a8a'])[i % (o.cols || [0, 0, 0, 0]).length]; s += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(2 + r() * 2)}" ry="${n1(1 + r())}" fill="${c}" transform="rotate(${n1(r() * 180)} ${n1(x)} ${n1(y)})" opacity=".95"/>`; } return s; };
  L.swirl = (o) => { let s = ''; for (let i = 0; i < (o.n || 4); i++) { const rr = (o.r || 60) * (0.5 + i * 0.18); s += `<path d="M${n1((o.x || 150) - rr)},${o.y || 120}A${n1(rr)},${n1(rr * 0.5)} 0 1,1 ${n1((o.x || 150) + rr * 0.8)},${n1((o.y || 120) - rr * 0.2)}" stroke="${o.c || '#c8ff8a'}" stroke-width="${n1(3 - i * 0.5)}" fill="none" opacity="${n1(0.7 - i * 0.12)}" filter="url(#b1)"/>`; } return s; };
  L.sandwall = (o) => { const r = A.rng(o.seed || 5); let s = `<path d="M-20,${H}L-20,60Q40,20 120,40Q200,10 260,40Q320,30 320,60L320,${H}Z" fill="#e0b060" opacity=".85"/>`; for (let i = 0; i < 9; i++) s += `<path d="M${n1(-20 + r() * 60)},${n1(50 + i * 18)}Q${n1(100 + r() * 60)},${n1(30 + i * 18)} ${n1(320)},${n1(60 + i * 16)}" stroke="#fff0c0" stroke-width="${n1(1 + r() * 3)}" fill="none" opacity=".55" filter="url(#b1)"/>`; for (let i = 0; i < 80; i++) s += `<circle cx="${n1(r() * W)}" cy="${n1(40 + r() * 170)}" r="${n1(0.4 + r())}" fill="#fff4d0" opacity=".8"/>`; return s; };
  L.beam = (o) => `<path d="M${o.x1},${o.y1}L${o.x2 - 8},${o.y2}L${o.x2 + 8},${o.y2}Z" fill="#fffbe0" opacity=".85" filter="url(#b1)"/><path d="M${o.x1},${o.y1}L${o.x2},${o.y2}" stroke="#ffffff" stroke-width="3"/>` + glow(o.x2, o.y2, 30, '#fff4b0', 1) + glow(o.x1, o.y1, 26, '#ffffff', 0.9);
  L.shimmer = (o) => { let s = ''; for (let i = 0; i < (o.n || 5); i++) s += `<path d="M${(o.x || 150) - 60},${(o.y || 160) + i * 6}q15,-3 30,0t30,0t30,0t30,0" stroke="#fffbe8" stroke-width=".8" fill="none" opacity=".45"/>`; return s; };
  L.pane = (o) => `<path d="M${o.x - 20},${o.y - 50}Q${o.x + 6},${o.y - 54} ${o.x + 10},${o.y - 40}L${o.x + 14},${o.y + 40}Q${o.x - 10},${o.y + 46} ${o.x - 16},${o.y + 34}Z" fill="#5ae8e0" opacity=".55" stroke="#e8fffc" stroke-width="1.6"/><path d="M${o.x - 12},${o.y - 40}L${o.x - 6},${o.y + 20}" stroke="#ffffff" stroke-width="2" opacity=".8"/>` + glow(o.x, o.y, 40, '#9af8f0', 0.5);
  L.tint = (o, P) => { const f = id('tn'), m = o.m || '0.55 0.45 0.2 0 0.08  0.45 0.38 0.16 0 0.05  0.25 0.2 0.1 0 0  0 0 0 1 0'; return `<filter id="${f}"><feColorMatrix type="matrix" values="${m}"/></filter><g filter="url(#${f})">${L.fig(Object.assign({}, o.fig, { x: o.x, y: o.y }), P)}</g>`; };
  // table themes: a tiled mosaic over the whole picture (leaves and flowers, or turquoise and amber glass)
  L.mosaic = (o) => { const r = A.rng(o.seed || 2), wild = o.kind === 'wild'; let s = `<rect width="${W}" height="${H}" fill="${wild ? '#1e5a1e' : '#6a4a18'}"/>`;
    const cols = wild ? ['#3a9a2a', '#4cc838', '#2e8a22', '#62d83a', '#8aea4a', '#5ab83a'] : ['#2ac0c0', '#5ae8e0', '#1a9aa8', '#e8b83a', '#f0c860', '#d89a2a', '#8ae8f0'];
    const cx = 150, cy = 110;
    for (let y = -6; y < H + 6; y += 7) for (let x = -6 + ((y / 7) % 2) * 3.5; x < W + 6; x += 7) { const d = Math.hypot((x - cx) / 1.36, y - cy); if (d < (o.hole || 44)) continue; const ring = Math.floor(d / 14) % 2; const c = cols[(ring * 3 + Math.floor(r() * 3)) % cols.length]; s += `<rect x="${n1(x)}" y="${n1(y)}" width="6.2" height="6.2" rx="${wild ? 2.4 : 0.8}" fill="${c}" stroke="${wild ? '#1a3a10' : '#5a3a10'}" stroke-width=".5" transform="rotate(${n1((r() - 0.5) * 10)} ${n1(x + 3)} ${n1(y + 3)})"/>`; }
    for (let i = 0; i < 4; i++) { const rr = 52 + i * 26; s += `<ellipse cx="${cx}" cy="${cy}" rx="${rr * 1.36}" ry="${rr}" fill="none" stroke="${wild ? '#ffe066' : '#f8dc8a'}" stroke-width="1.6" opacity=".8"/>`; }
    if (wild) { for (let i = 0; i < 24; i++) { const a = i * 15 * Math.PI / 180, rr = 66 + (i % 2) * 26; s += flower(cx + Math.cos(a) * rr * 1.36, cy + Math.sin(a) * rr, 1.8, FLOWER_COLS[i % 7]); } s += G(cx, cy, 1, OB.seed({ sprout: 1 })); }
    else { s += G(cx, cy, 0.9, OB.sunDisc({})); for (let i = 0; i < 16; i++) { const a = i * 22.5 * Math.PI / 180, rr = 92; s += `<path d="M${n1(cx + Math.cos(a) * rr * 1.36)},${n1(cy + Math.sin(a) * rr - 6)}l5,6l-5,6l-5,-6Z" fill="#5ae8e0" stroke="#0e6a72" stroke-width=".6"/>`; } }
    return s; };
  L.ghost = (o, P) => `<g opacity="${o.op || 0.35}">${L.fig(Object.assign({}, o.fig, { x: o.x, y: o.y }), P)}</g>`;
})(globalThis.RB);
