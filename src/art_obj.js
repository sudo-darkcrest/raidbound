/* RAIDBOUND — art engine: full-color objects (items, armor, weapons) and spell effects */
(function (RB) {
  const A = RB.ART;
  const n1 = A.n1;
  const L = A.layers;
  const nid = () => 'u' + (++A._uid);
  const wrap = (o, inner, dx, dy) => `<g transform="translate(${o.x != null ? o.x : 150},${o.y != null ? o.y : 112}) rotate(${o.rot || 0}) scale(${o.s || 1})">${inner}</g>`;
  const halo = (c, r, op) => `<circle cx="0" cy="0" r="${r || 70}" fill="${c}" opacity="${op || 0.28}" filter="url(#b8)"/>`;
  const shadow = (y, rx) => `<ellipse cx="0" cy="${y}" rx="${rx}" ry="${rx * 0.16}" fill="#000" opacity=".55" filter="url(#b2)"/>`;
  const star = (x, y, k, c) => `<path d="M${x},${y - 7 * k}Q${x + 1 * k},${y - 1 * k} ${x + 7 * k},${y}Q${x + 1 * k},${y + 1 * k} ${x},${y + 7 * k}Q${x - 1 * k},${y + 1 * k} ${x - 7 * k},${y}Q${x - 1 * k},${y - 1 * k} ${x},${y - 7 * k}Z" fill="${c || '#fff'}"/><circle cx="${x}" cy="${y}" r="${3 * k}" fill="${c || '#fff'}" opacity=".6" filter="url(#b1)"/>`;
  function grad(id, stops, x2, y2, radial) {
    const st = stops.map((s, i) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('');
    return radial ? `<radialGradient id="${id}" cx="${x2 || 0.4}" cy="${y2 || 0.35}" r=".75">${st}</radialGradient>` : `<linearGradient id="${id}" x1="0" y1="0" x2="${x2 != null ? x2 : 1}" y2="${y2 != null ? y2 : 1}">${st}</linearGradient>`;
  }
  function shade(hex, k) { // k>0 lighten, k<0 darken
    const c = parseInt(hex.slice(1), 16); let r = c >> 16, g = (c >> 8) & 255, b = c & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }
  A.shade = shade;

  const rivets = (pts, r) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r || 1.6}" fill="url(#steelV)" stroke="#1a1c22" stroke-width=".5"/><circle cx="${n1(x - 0.5)}" cy="${n1(y - 0.5)}" r=".5" fill="#fff" opacity=".9"/>`).join('');
  const buckle = (x, y, w, h) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="1" fill="none" stroke="url(#gold)" stroke-width="1.8"/><path d="M${x},${y - h / 2}L${x},${y + h / 2}" stroke="url(#gold)" stroke-width="1"/>`;
  const strap = (x1, y1, x2, y2, w) => `<path d="M${x1},${y1}L${x2},${y2}" stroke="#2a160a" stroke-width="${w || 6}"/><path d="M${x1},${y1}L${x2},${y2}" stroke="#8a5a30" stroke-width="${(w || 6) - 2}"/><path d="M${x1},${y1}L${x2},${y2}" stroke="#e8c890" stroke-width=".5" stroke-dasharray="1.5 1.5"/>`;
  const filigree = (x, y, k, c) => `<path d="M${x},${y}c${4 * k},${-6 * k} ${10 * k},${-6 * k} ${12 * k},0c${1 * k},${4 * k} ${-3 * k},${6 * k} ${-6 * k},${4 * k}M${x},${y}c${-4 * k},${-6 * k} ${-10 * k},${-6 * k} ${-12 * k},0c${-1 * k},${4 * k} ${3 * k},${6 * k} ${6 * k},${4 * k}" stroke="${c || 'url(#gold)'}" stroke-width="1" fill="none"/>`;
  function scratches(seed, n, w, h, c) { const r = A.rng(seed); let s = ''; for (let i = 0; i < n; i++) { const x = (r() - 0.5) * w, y = (r() - 0.5) * h; s += `<path d="M${n1(x)},${n1(y)}l${n1((r() - 0.5) * 10)},${n1((r() - 0.5) * 4)}" stroke="${c || '#fff'}" stroke-width=".5" opacity="${n1(0.2 + r() * 0.3)}"/>`; } return s; }

  /* =================== ITEMS =================== */
  const O = {};
  O.potion = (o) => {
    const c = o.col || '#e0304a', id = nid(), cl = nid(), lg = nid();
    const shapes = {
      round: 'M-6,-52L-6,-30C-28,-24 -34,-4 -32,8C-30,30 -14,38 0,38C14,38 30,30 32,8C34,-4 28,-24 6,-30L6,-52Z',
      tall: 'M-8,-56L-8,-40Q-16,-34 -16,-20L-16,30Q-16,40 0,40Q16,40 16,30L16,-20Q16,-34 8,-40L8,-56Z',
      flask: 'M-6,-54L-6,-24L-30,30Q-32,38 -24,38L24,38Q32,38 30,30L6,-24L6,-54Z',
    };
    const d = shapes[o.shape || 'round'], lvl = o.level != null ? o.level : -8;
    let s = `<defs>${grad(lg, [[0, shade(c, 0.55)], [0.45, c], [1, shade(c, -0.6)]], 0.35, 0.3, true)}<clipPath id="${cl}"><path d="${d}"/></clipPath></defs>`;
    s += halo(c, 72, 0.32) + shadow(40, 34);
    s += `<path d="${d}" fill="#fff" opacity=".06"/>`;
    s += `<g clip-path="url(#${cl})"><rect x="-40" y="${lvl}" width="80" height="60" fill="url(#${lg})"/><ellipse cx="0" cy="${lvl}" rx="40" ry="4" fill="${shade(c, 0.4)}" opacity=".9"/>`;
    for (let i = 0; i < 7; i++) s += `<circle cx="${-16 + (i * 37) % 32}" cy="${lvl + 8 + (i * 13) % 24}" r="${1 + (i % 3)}" fill="#fff" opacity=".45"/>`;
    s += `<rect x="-40" y="${lvl}" width="80" height="60" fill="${c}" opacity=".25" filter="url(#b2)"/></g>`;
    s += `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>`;
    s += `<path d="M-20,-8Q-24,10 -16,26" stroke="#fff" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/><circle cx="-14" cy="-14" r="2.4" fill="#fff" opacity=".8"/>`;
    s += `<rect x="-9" y="-56" width="18" height="5" rx="2" fill="url(#${id}g)"/><defs>${grad(id + 'g', [[0, '#c9a24a'], [0.5, '#fff0b0'], [1, '#7a5a1a']], 1, 0)}</defs>`;
    s += `<path d="M-7,-56L-8,-68Q0,-72 8,-68L7,-56Z" fill="url(#wood)"/><path d="M-8,-68Q0,-72 8,-68" stroke="#000" stroke-opacity=".4" fill="none"/>`;
    s += `<path d="M-8,-48Q-14,-40 -12,-30M-8,-48Q-4,-38 -6,-34" stroke="${o.ribbon || '#b02030'}" stroke-width="2" fill="none"/>`;
    if (o.sparkle !== false) s += star(18, -30, 0.8) + star(-24, 20, 0.5, shade(c, 0.6));
    return wrap(o, s);
  };
  O.ring = (o) => {
    const c = o.col || '#e04a3a', gid = nid();
    let s = `<defs>${grad(gid, [[0, '#fff'], [0.25, shade(c, 0.4)], [0.6, c], [1, shade(c, -0.7)]], 0.35, 0.3, true)}</defs>` + halo(c, 60, 0.35) + shadow(40, 30);
    s += `<ellipse cx="0" cy="16" rx="30" ry="13" fill="none" stroke="#3a2808" stroke-width="9"/><ellipse cx="0" cy="16" rx="30" ry="13" fill="none" stroke="url(#gold)" stroke-width="7"/><ellipse cx="0" cy="13" rx="29" ry="11.5" fill="none" stroke="#fff4c0" stroke-width="1" opacity=".7"/>`;
    s += `<path d="M-16,4L-12,-14L12,-14L16,4Z" fill="url(#gold)"/><path d="M-14,-12L-18,-22M14,-12L18,-22M0,-14L0,-26" stroke="url(#gold)" stroke-width="3" stroke-linecap="round"/>`;
    s += `<path d="M0,-30L13,-22L13,-6L0,2L-13,-6L-13,-22Z" fill="url(#${gid})"/><path d="M0,-30L0,2M-13,-22L13,-6M13,-22L-13,-6" stroke="#fff" stroke-width=".6" opacity=".45"/><path d="M0,-24L7,-19L7,-10L0,-5L-7,-10L-7,-19Z" fill="#fff" opacity=".18"/>`;
    s += star(6, -24, 0.9) + (o.sparks ? star(-30, -20, 0.6, c) + star(32, -4, 0.5, c) : '');
    return wrap(o, s);
  };
  O.amulet = (o) => {
    const c = o.col || '#ffd060', gid = nid();
    let s = `<defs>${grad(gid, [[0, '#fff'], [0.3, shade(c, 0.3)], [0.7, c], [1, shade(c, -0.6)]], 0.4, 0.35, true)}</defs>` + halo(c, 70, 0.35);
    for (let i = 0; i <= 22; i++) { const t = i / 22, x = -46 + 92 * t, y = -70 + Math.sin(t * Math.PI) * 46; s += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="3" ry="2" fill="none" stroke="url(#gold)" stroke-width="1.4" transform="rotate(${n1(t * 180 - 90)} ${n1(x)} ${n1(y)})"/>`; }
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += `<path d="M${n1(Math.cos(a - 0.12) * 20)},${n1(10 + Math.sin(a - 0.12) * 20)}L${n1(Math.cos(a) * 32)},${n1(10 + Math.sin(a) * 32)}L${n1(Math.cos(a + 0.12) * 20)},${n1(10 + Math.sin(a + 0.12) * 20)}Z" fill="url(#gold)"/>`; }
    s += `<circle cx="0" cy="10" r="21" fill="url(#gold)"/><circle cx="0" cy="10" r="21" fill="none" stroke="#5a3a08" stroke-width="1"/><circle cx="0" cy="10" r="12" fill="url(#${gid})"/><circle cx="0" cy="10" r="16" fill="none" stroke="#fff4c0" stroke-width=".8" opacity=".7"/>` + star(-4, 5, 0.8);
    return wrap(o, s);
  };
  O.hourglass = (o) => {
    const c = o.col || '#ffcf6a', cl = nid();
    let s = halo('#ffd890', 70, 0.3) + shadow(58, 34);
    const glass = 'M-18,-48Q-18,-10 -3,0Q-18,10 -18,48L18,48Q18,10 3,0Q18,-10 18,-48Z';
    s += `<defs><clipPath id="${cl}"><path d="${glass}"/></clipPath></defs><path d="${glass}" fill="#fff" opacity=".08"/>`;
    s += `<g clip-path="url(#${cl})"><path d="M-20,-30Q0,-22 20,-30L20,-2L-20,-2Z" fill="${c}"/><path d="M-20,48L-20,32Q0,18 20,32L20,48Z" fill="${c}"/><rect x="-.8" y="-2" width="1.6" height="36" fill="${c}"/><circle cx="0" cy="20" r="14" fill="${c}" opacity=".5" filter="url(#b2)"/></g>`;
    s += `<path d="${glass}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/><path d="M-12,-40Q-12,-18 -4,-6" stroke="#fff" stroke-width="2" opacity=".5" fill="none"/>`;
    s += `<rect x="-28" y="-58" width="56" height="10" rx="2" fill="url(#wood)"/><rect x="-28" y="48" width="56" height="10" rx="2" fill="url(#wood)"/><rect x="-28" y="-58" width="56" height="3" fill="url(#gold)"/><rect x="-28" y="55" width="56" height="3" fill="url(#gold)"/>`;
    s += `<rect x="-26" y="-48" width="4" height="96" fill="url(#wood)"/><rect x="22" y="-48" width="4" height="96" fill="url(#wood)"/><circle cx="-24" cy="0" r="3.4" fill="url(#gold)"/><circle cx="24" cy="0" r="3.4" fill="url(#gold)"/>`;
    for (let i = 0; i < 5; i++) s += star(-34 + i * 17, -66 + (i % 2) * 130, 0.4, c);
    return wrap(o, s);
  };
  O.tome = (o) => {
    const c = o.col || '#5a2a6a', g = o.glow || '#c890ff', gid = nid();
    let s = `<defs>${grad(gid, [[0, shade(c, 0.35)], [0.6, c], [1, shade(c, -0.6)]], 1, 1)}</defs>` + halo(g, 76, 0.32) + shadow(44, 50);
    s += `<g transform="skewY(-8)"><rect x="-44" y="28" width="86" height="8" fill="#ece0c0"/>${[0, 1, 2, 3].map(i => `<path d="M-42,${30 + i * 1.6}L40,${30 + i * 1.6}" stroke="#a89060" stroke-width=".4"/>`).join('')}`;
    s += `<rect x="-46" y="-34" width="90" height="64" rx="4" fill="url(#${gid})"/><rect x="-42" y="-30" width="82" height="56" rx="3" fill="none" stroke="url(#gold)" stroke-width="1.6"/>`;
    s += [[-46, -34], [44, -34], [-46, 30], [44, 30]].map(([x, y]) => `<path d="M${x},${y}l${x < 0 ? 12 : -12},0l${x < 0 ? -12 : 12},${y < 0 ? 12 : -12}z" fill="url(#gold)"/>`).join('');
    s += `<circle cx="-2" cy="-2" r="16" fill="none" stroke="${g}" stroke-width="1.6"/><path d="M-2,-18L-2,14M-18,-2L14,-2M-13,-13L9,9M9,-13L-13,9" stroke="${g}" stroke-width=".9" opacity=".8"/><circle cx="-2" cy="-2" r="16" fill="${g}" opacity=".35" filter="url(#b4)"/><circle cx="-2" cy="-2" r="4" fill="#fff"/>`;
    s += `<rect x="40" y="-8" width="10" height="14" rx="2" fill="url(#gold)"/></g>`;
    s += A.particles('motes', A.rng(9), { rim: g }, 6);
    return wrap(o, s);
  };
  O.lantern = (o) => {
    const c = o.col || '#ffc060';
    let s = halo(c, 80, 0.45) + shadow(46, 28) + A.prims.rays(0, 0, c, 8, 360, 110, 0.35);
    s += `<path d="M-6,-62Q0,-74 6,-62" stroke="url(#iron)" stroke-width="3" fill="none"/><path d="M-16,-44L16,-44L10,-58L-10,-58Z" fill="url(#iron)"/>`;
    s += `<rect x="-16" y="-44" width="32" height="76" fill="${c}" opacity=".35"/><ellipse cx="0" cy="0" rx="10" ry="18" fill="${c}" opacity=".9" filter="url(#b2)"/><path d="M0,12Q-8,0 0,-16Q8,0 0,12Z" fill="#fff6d0"/>`;
    s += [-16, -5, 5, 16].map(x => `<rect x="${x - 1.5}" y="-44" width="3" height="76" fill="url(#iron)"/>`).join('') + `<rect x="-19" y="30" width="38" height="8" fill="url(#iron)"/><rect x="-19" y="-46" width="38" height="4" fill="url(#iron)"/>`;
    return wrap(o, s);
  };
  O.bomb = (o) => {
    let s = halo('#ff9a3a', 60, 0.3) + shadow(42, 34);
    s += `<circle cx="0" cy="6" r="34" fill="url(#iron)"/><circle cx="0" cy="6" r="34" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2"/><ellipse cx="-12" cy="-8" rx="10" ry="6" fill="#fff" opacity=".28" transform="rotate(-30 -12 -8)"/>`;
    s += `<path d="M-34,10Q0,22 34,10L34,18Q0,30 -34,18Z" fill="#a8282a"/><path d="M-6,14l6,-4l6,4l-2,6l-8,0z" fill="#f0e0c0" opacity=".9"/>`;
    s += `<rect x="-8" y="-34" width="16" height="10" rx="2" fill="url(#bronze)"/><path d="M0,-34Q4,-50 18,-52Q28,-54 30,-64" stroke="#c8a070" stroke-width="2" fill="none"/>`;
    s += `<circle cx="30" cy="-64" r="12" fill="#ffb040" opacity=".55" filter="url(#b2)"/>` + star(30, -64, 1.2, '#fff4c0') + [0, 1, 2, 3, 4].map(i => `<path d="M30,-64l${n1(Math.cos(i * 1.3) * 14)},${n1(Math.sin(i * 1.3) * 14)}" stroke="#ffd080" stroke-width=".8"/>`).join('');
    return wrap(o, s);
  };
  O.horn = (o) => {
    const t = A.tube([-46, 20], [-20, 30], [20, 10], [44, -40], 6, 30, 20);
    let s = halo('#ff7a40', 70, 0.25) + shadow(40, 50) + `<path d="${t.d}" fill="url(#bone)"/><path d="${t.d}" fill="none" stroke="#5a4a30" stroke-width="1"/>`;
    [6, 11, 16].forEach(i => { const q = t.pts[i]; s += `<path d="M${n1(q.x + q.nx * q.w)},${n1(q.y + q.ny * q.w)}L${n1(q.x - q.nx * q.w)},${n1(q.y - q.ny * q.w)}" stroke="url(#bronze)" stroke-width="5"/>`; });
    s += `<ellipse cx="44" cy="-40" rx="16" ry="6" fill="#2a1a0a" transform="rotate(-55 44 -40)"/><path d="M-30,24Q-4,52 26,6" stroke="#6a3a1a" stroke-width="3" fill="none"/><path d="M-6,40l-4,16l6,-4l4,8l2,-18z" fill="#a8282a"/>`;
    return wrap(o, s);
  };
  O.banner = (o) => {
    const c = o.col || '#2a4a9a', em = o.em || '#f0c860', gid = nid();
    let s = `<defs>${grad(gid, [[0, shade(c, 0.25)], [0.5, c], [1, shade(c, -0.55)]], 1, 0)}</defs>` + halo(em, 70, 0.25);
    s += `<rect x="-44" y="-74" width="4" height="150" fill="url(#wood)"/><path d="M-50,-74L-34,-74" stroke="url(#gold)" stroke-width="4"/><circle cx="-42" cy="-80" r="5" fill="url(#gold)"/>`;
    s += `<path d="M-40,-70L40,-70Q46,-30 38,10Q30,30 40,54L14,40L0,60L-14,42L-40,54Z" fill="url(#${gid})"/><path d="M-40,-66L40,-66" stroke="url(#gold)" stroke-width="2"/>`;
    s += `<path d="M-36,-62L36,-62Q40,-30 34,6Q28,26 34,46L14,34L0,52L-14,36L-36,46Z" fill="none" stroke="${em}" stroke-width="1" opacity=".6"/>`;
    if (o.glyph === 'axes') s += `<path d="M-16,8L16,-28M16,8L-16,-28" stroke="${em}" stroke-width="3"/><path d="M12,-30Q22,-34 22,-22ZM-12,-30Q-22,-34 -22,-22Z" fill="${em}"/><circle cx="0" cy="-36" r="9" fill="none" stroke="${em}" stroke-width="2"/>`;
    else { s += `<circle cx="0" cy="-14" r="10" fill="${em}"/>`; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += `<path d="M${n1(Math.cos(a) * 13)},${n1(-14 + Math.sin(a) * 13)}L${n1(Math.cos(a) * 22)},${n1(-14 + Math.sin(a) * 22)}" stroke="${em}" stroke-width="2"/>`; } }
    return wrap(o, s);
  };
  O.scroll = (o) => {
    let s = halo('#ffd890', 80, 0.22) + shadow(44, 60);
    s += `<path d="M-56,-36L56,-36L56,34L-56,34Z" fill="#e8d5a6"/><path d="M-56,-36L56,-36L56,34L-56,34Z" fill="url(#vig)" opacity=".5"/>`;
    s += `<path d="M-40,-20Q-20,-30 0,-16T38,-22M-46,10Q-10,0 10,14T44,6" stroke="#7a5a30" stroke-width="1" fill="none" opacity=".75"/><path d="M-30,-10Q-6,-2 4,10T26,-6" stroke="#8a2a1a" stroke-width="1.2" stroke-dasharray="3 3" fill="none"/><path d="M22,-12l8,8M30,-12l-8,8" stroke="#b02a1a" stroke-width="2.4"/>`;
    s += [[-18, -24], [-36, 14], [8, -28]].map(([x, y]) => `<path d="M${x},${y}l4,-7l4,7z" fill="#6a4a24" opacity=".7"/>`).join('');
    s += `<rect x="-64" y="-40" width="12" height="78" rx="6" fill="url(#wood)"/><rect x="52" y="-40" width="12" height="78" rx="6" fill="url(#wood)"/><circle cx="-58" cy="-40" r="5" fill="url(#gold)"/><circle cx="58" cy="-40" r="5" fill="url(#gold)"/><circle cx="-58" cy="38" r="5" fill="url(#gold)"/><circle cx="58" cy="38" r="5" fill="url(#gold)"/>`;
    s += `<circle cx="36" cy="22" r="9" fill="#a8202a"/><circle cx="36" cy="22" r="5.5" fill="none" stroke="#5a0a10" stroke-width="1.2"/>`;
    if (o.candle) s += `<g transform="translate(-70,10)"><rect x="-6" y="-8" width="12" height="36" fill="#efe2c0"/><path d="M0,-10Q-6,-20 0,-32Q6,-20 0,-10Z" fill="#ffd27a"/><circle cx="0" cy="-20" r="16" fill="#ffb040" opacity=".4" filter="url(#b4)"/></g>`;
    return wrap(o, s);
  };
  O.crown = (o) => {
    const dark = o.dark, gem = o.gem || (dark ? '#4aff9a' : '#e0304a');
    const fill = dark ? 'url(#iron)' : 'url(#gold)';
    let s = halo(dark ? '#3aff9a' : '#ffd060', 70, 0.35) + shadow(34, 46);
    s += `<path d="M-40,26L-44,-16L-26,4L-14,-34L0,-4L14,-34L26,4L44,-16L40,26Z" fill="${fill}"/><path d="M-40,26L40,26L40,34L-40,34Z" fill="${fill}"/><path d="M-40,26L-44,-16L-26,4L-14,-34L0,-4L14,-34L26,4L44,-16L40,26" fill="none" stroke="${dark ? '#9affc8' : '#fff2b0'}" stroke-width=".8" opacity=".7"/>`;
    s += [[-44, -16], [-14, -34], [14, -34], [44, -16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${gem}"/>`).join('');
    s += [-24, 0, 24].map(x => `<ellipse cx="${x}" cy="18" rx="5" ry="6" fill="${gem}"/><ellipse cx="${x - 1.5}" cy="16" rx="1.5" ry="2" fill="#fff" opacity=".7"/>`).join('');
    if (dark) s += `<circle cx="0" cy="0" r="40" fill="${gem}" opacity=".2" filter="url(#b8)"/>` + A.layers.wisps({ x: 0, y: -10, w: 80, h: 30, c: gem, n: 5 }, {}, A.rng(4));
    return wrap(o, s);
  };
  O.heart = (o) => {
    const c = o.col || '#ff5a1a', gid = nid();
    let s = `<defs>${grad(gid, [[0, '#fff6c0'], [0.3, '#ffb040'], [0.7, c], [1, '#4a0a04']], 0.4, 0.35, true)}</defs>` + halo(c, 80, 0.5);
    s += `<path d="M0,38C-40,10 -46,-20 -28,-34C-14,-44 -4,-36 0,-26C4,-36 14,-44 28,-34C46,-20 40,10 0,38Z" fill="url(#${gid})"/><path d="M-20,-24L-8,-8L-16,8L0,20M12,-26L6,-6L18,4" stroke="#fff4c0" stroke-width="1.4" fill="none"/><path d="M-20,-24L-8,-8L-16,8L0,20" stroke="#ffd060" stroke-width="5" fill="none" opacity=".5" filter="url(#b2)"/>`;
    return wrap(o, s);
  };
  O.pearl = (o) => {
    const gid = nid();
    let s = `<defs>${grad(gid, [[0, '#ffffff'], [0.35, '#e6f0ff'], [0.65, '#c8d0f0'], [0.85, '#f0d0e8'], [1, '#8a90b0']], 0.38, 0.32, true)}</defs>` + halo('#9ae8ff', 80, 0.4) + shadow(36, 56);
    const shell = (k) => { let d = `M0,${k * 6}`; for (let i = 0; i <= 8; i++) { const a = Math.PI * (i / 8); d += `L${n1(Math.cos(a) * 58)},${n1(k * (6 - Math.sin(a) * (k < 0 ? 46 : 18)))}`; } return d + 'Z'; };
    s += `<path d="${shell(-1)}" fill="#e8b8c8"/><path d="${shell(1)}" fill="#d8a0b4"/>` + Array.from({ length: 9 }, (_, i) => { const a = Math.PI * i / 8; return `<path d="M0,-6L${n1(Math.cos(a) * 56)},${n1(-6 - Math.sin(a) * 42)}" stroke="#a87088" stroke-width=".8"/>`; }).join('');
    s += `<circle cx="0" cy="0" r="22" fill="url(#${gid})"/><circle cx="-8" cy="-8" r="4" fill="#fff" opacity=".9"/>` + star(14, -18, 0.8);
    return wrap(o, s);
  };
  O.shard = (o) => {
    const c = o.col || '#4aff9a';
    let s = halo(c, 80, 0.45);
    s += `<path d="M0,-60L18,-14L10,44L-12,40L-20,-10Z" fill="${c}" opacity=".85"/><path d="M0,-60L18,-14L10,44L0,-4Z" fill="#fff" opacity=".25"/><path d="M0,-60L-20,-10L-12,40L0,-4Z" fill="#000" opacity=".25"/>`;
    s += `<path d="M-30,-30Q0,-20 30,-30M-30,10Q0,20 30,10" stroke="url(#iron)" stroke-width="3" fill="none"/><path d="M-4,-30l4,6l4,-6M-4,4l4,6l4,-6" stroke="#fff" stroke-width="1" fill="none"/>`;
    s += A.layers.wisps({ x: 0, y: 0, w: 70, h: 60, c, n: 5 }, {}, A.rng(7));
    return wrap(o, s);
  };
  O.kite = (o) => {
    let s = `<path d="M10,30Q40,60 20,90Q0,120 30,150" stroke="#ffd0d0" stroke-width="1" fill="none"/>` + [0, 1, 2, 3].map(i => `<path d="M${18 + i * 2},${50 + i * 26}l-8,-4l2,8z" fill="${['#e0405a', '#f0c040', '#40a0e0', '#60c060'][i]}"/>`).join('');
    s += `<path d="M0,-50L36,0L0,40L-36,0Z" fill="#f4e8d0"/><path d="M0,-50L36,0L0,40L-36,0Z" fill="none" stroke="#8a6a3a" stroke-width="1.2"/><path d="M0,-50L0,40M-36,0L36,0" stroke="#8a6a3a" stroke-width=".8"/>`;
    s += `<path d="M-14,-8Q0,-24 14,-8Q8,0 14,10Q0,2 -14,10Q-8,0 -14,-8Z" fill="#c02a2a"/><circle cx="-5" cy="-6" r="1.8" fill="#f0c040"/><circle cx="5" cy="-6" r="1.8" fill="#f0c040"/><path d="M-12,-14l-6,-8M12,-14l6,-8" stroke="#c02a2a" stroke-width="2"/>`;
    return wrap(o, s);
  };
  O.saddle = (o) => {
    let s = `<path d="M-24,-6Q0,-12 24,-6L22,20Q0,26 -22,20Z" fill="#8a1e14" stroke="#170e09" stroke-width="1"/><path d="M-22,18Q0,24 22,18" stroke="#e0a040" stroke-width="1.6" fill="none"/>`;
    for (let i = 0; i < 9; i++) s += `<path d="M${-20 + i * 5},${20 + Math.sin(i) * 0.6}l0,5" stroke="#e0a040" stroke-width="1.2"/>`;
    s += `<path d="M-14,-10Q0,-16 14,-10L12,0Q0,-4 -12,0Z" fill="#5a3418" stroke="#170e09" stroke-width=".9"/><path d="M-8,-1L-6,14M8,-1L6,14" stroke="#2a160a" stroke-width="1.6"/><circle cx="-6" cy="14" r="1.6" fill="#c8a060"/><circle cx="6" cy="14" r="1.6" fill="#c8a060"/>`;
    s += `<path d="M-6,4l6,-4l6,4l-6,4z" fill="#e8dcc0" stroke="#170e09" stroke-width=".5"/>`;
    return wrap(o, s);
  };
  O.chest = (o) => {
    let s = halo('#ffd060', 90, 0.45) + shadow(40, 70);
    s += `<path d="M-56,-6L56,-6L56,40L-56,40Z" fill="url(#wood)"/><path d="M-56,-6L-50,-40Q0,-62 50,-40L56,-6Z" fill="url(#wood)" transform="translate(0,-26) rotate(-12 -56 -6)"/>`;
    s += `<ellipse cx="0" cy="-8" rx="52" ry="12" fill="#ffd060"/><ellipse cx="0" cy="-8" rx="52" ry="12" fill="#fff4b0" opacity=".6" filter="url(#b2)"/>`;
    for (let i = 0; i < 16; i++) s += `<ellipse cx="${-44 + (i * 23) % 88}" cy="${-12 - (i % 3) * 5}" rx="6" ry="2.6" fill="url(#gold)" stroke="#7a5a1a" stroke-width=".4"/>`;
    s += `<rect x="-56" y="2" width="112" height="6" fill="url(#gold)"/><rect x="-6" y="0" width="12" height="16" rx="2" fill="url(#gold)"/>` + A.prims.rays(0, -10, '#ffe090', 9, 140, 120, 0.4).replace('M0,-10', 'M0,-10');
    s += star(-30, -40, 1) + star(26, -50, 0.8) + star(4, -64, 0.6);
    return wrap(o, s);
  };
  O.coin = (o) => wrap(o, `<circle r="30" fill="url(#gold)"/><circle r="24" fill="none" stroke="#7a5a1a" stroke-width="1.4"/><path d="M-8,-12L8,-12L10,12L-10,12Z" fill="#7a5a1a" opacity=".5"/>`);

  /* =================== ARMOR =================== */
  O.helm = (o) => {
    const plume = o.plume || '#c02a2a';
    let s = halo(o.glow || '#ffe0a0', 76, 0.3) + shadow(52, 40);
    if (o.style === 'horned') {
      const h1 = A.tube([-24, -12], [-46, -16], [-56, -40], [-44, -62], 12, 2), h2 = A.tube([24, -12], [46, -16], [56, -40], [44, -62], 12, 2);
      s += `<path d="${h1.d}" fill="url(#bone)"/><path d="${h2.d}" fill="url(#bone)"/>`;
    } else s += `<path d="M0,-44Q-28,-80 -60,-58Q-36,-60 -20,-40Z" fill="${plume}"/><path d="M0,-44Q-30,-72 -56,-58" stroke="${shade(plume, 0.4)}" stroke-width="1" fill="none"/>`;
    s += `<path d="M-32,40L-34,-10Q-30,-44 0,-48Q30,-44 34,-10L32,40Q0,48 -32,40Z" fill="url(#steelV)"/><path d="M-32,40L-34,-10Q-30,-44 0,-48Q30,-44 34,-10L32,40Q0,48 -32,40Z" fill="none" stroke="#2a2e38" stroke-width="1.2"/>`;
    s += `<path d="M-26,0L26,0L24,6L-24,6Z" fill="#0a0c12"/><path d="M-2,8L-2,36M2,8L2,36" stroke="#0a0c12" stroke-width="1.6"/>` + [[-20, 18], [20, 18], [-20, 28], [20, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#0a0c12"/>`).join('');
    s += `<path d="M0,-48L0,40" stroke="url(#gold)" stroke-width="3"/><path d="M-33,-6L33,-6" stroke="url(#gold)" stroke-width="2.4"/><path d="M-30,-40Q-20,-46 -6,-46" stroke="#fff" stroke-width="2" opacity=".6" fill="none"/>`;
    s += `<path d="M-24,3L24,3" stroke="${o.eye || '#ffd080'}" stroke-width="1.2" opacity=".7"/>`;
    { const pid = nid(); s += `<defs><pattern id="${pid}" width="4" height="3.4" patternUnits="userSpaceOnUse"><circle cx="2" cy="1.7" r="1.4" fill="none" stroke="#c8d0dc" stroke-width=".6"/></pattern></defs><path d="M-32,36Q-38,50 -30,58Q0,66 30,58Q38,50 32,36Q0,46 -32,36Z" fill="#3a3e48"/><path d="M-32,36Q-38,50 -30,58Q0,66 30,58Q38,50 32,36Q0,46 -32,36Z" fill="url(#${pid})"/>`; }
    s += rivets([[-28, -6], [-18, -6], [-8, -6], [8, -6], [18, -6], [28, -6], [-30, 30], [30, 30]], 1.5) + filigree(-16, -24, 0.8) + filigree(16, -24, 0.8);
    s += scratches(31, 14, 54, 70) + `<path d="M-30,-30Q-26,-20 -28,0" stroke="#fff" stroke-width="1.2" opacity=".3" fill="none"/>`;
    return wrap(o, s);
  };
  O.breastplate = (o) => {
    const mat = o.mat || 'steel';
    const fill = mat === 'mail' ? 'url(#iron)' : mat === 'leather' ? 'url(#leather)' : 'url(#steelV)';
    let s = halo(o.glow || '#ffe0a0', 80, 0.28) + shadow(58, 46);
    const torso = 'M-30,-48L-12,-40Q0,-36 12,-40L30,-48L44,-36L40,-6L32,0L34,40Q0,56 -34,40L-32,0L-40,-6L-44,-36Z';
    s += `<path d="${torso}" fill="${fill}"/>`;
    if (mat === 'mail') { const pid = nid(); s += `<defs><pattern id="${pid}" width="5" height="4" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2" r="1.8" fill="none" stroke="#c8d0dc" stroke-width=".7"/></pattern><clipPath id="${pid}c"><path d="${torso}"/></clipPath></defs><rect x="-50" y="-60" width="100" height="120" fill="url(#${pid})" clip-path="url(#${pid}c)" opacity=".85"/>`; }
    if (mat === 'leather') s += `<path d="M-28,-30L-26,36M28,-30L26,36" stroke="#e8c890" stroke-width=".9" stroke-dasharray="2 2"/><path d="M-30,-48Q0,-30 30,-48L26,-40Q0,-24 -26,-40Z" fill="#8a7050"/><path d="M-30,-48Q0,-30 30,-48" stroke="#c8b090" stroke-width="3" fill="none" stroke-dasharray="1 2"/>`;
    s += `<path d="${torso}" fill="none" stroke="#1a1c22" stroke-width="1.4"/>`;
    if (mat === 'steel') s += `<path d="M0,-38L0,46" stroke="#fff" stroke-width="1.4" opacity=".55"/><path d="M-34,12Q0,22 34,12" stroke="url(#gold)" stroke-width="2.6" fill="none"/><path d="M-44,-36L-30,-48L-12,-40" stroke="url(#gold)" stroke-width="2.4" fill="none"/><path d="M44,-36L30,-48L12,-40" stroke="url(#gold)" stroke-width="2.4" fill="none"/>`;
    if (o.emblem) { const c = o.emblem; s += `<circle cx="0" cy="-12" r="9" fill="${c}"/>` + Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return `<path d="M${n1(Math.cos(a) * 11)},${n1(-12 + Math.sin(a) * 11)}L${n1(Math.cos(a) * 17)},${n1(-12 + Math.sin(a) * 17)}" stroke="${c}" stroke-width="1.8"/>`; }).join('') + `<circle cx="0" cy="-12" r="18" fill="${c}" opacity=".3" filter="url(#b2)"/>`; }
    s += `<path d="M-38,-30Q-36,-10 -30,-2" stroke="#fff" stroke-width="2.4" opacity=".4" fill="none"/>`;
    const cid = nid(); s += `<defs><clipPath id="${cid}"><path d="${torso}"/></clipPath></defs><g clip-path="url(#${cid})">`;
    if (mat === 'steel') {
      for (let i = 0; i < 3; i++) s += `<path d="M-34,${20 + i * 8}Q0,${30 + i * 8} 34,${20 + i * 8}" stroke="#1a1c22" stroke-width="1.6" fill="none" opacity=".7"/><path d="M-34,${22 + i * 8}Q0,${32 + i * 8} 34,${22 + i * 8}" stroke="#fff" stroke-width=".7" fill="none" opacity=".45"/>`;
      s += rivets([[-30, 22], [30, 22], [-31, 30], [31, 30], [-32, 38], [32, 38], [-38, -24], [38, -24]], 1.5) + filigree(-16, 0, 1) + filigree(16, 0, 1) + scratches(41, 22, 70, 90);
      s += `<path d="M-20,-34Q-30,-12 -24,8" stroke="#fff" stroke-width="5" opacity=".14" fill="none"/>`;
    } else if (mat === 'leather') {
      s += `<rect x="-50" y="-60" width="100" height="120" fill="url(#pGrain)" opacity=".9"/>` + strap(-36, -40, 30, 40, 7) + buckle(-3, 0, 8, 7) + `<path d="M-34,24L34,24" stroke="#2a160a" stroke-width="5"/>` + buckle(0, 24, 9, 7) + scratches(51, 16, 70, 90, '#f0d0a0');
      for (let i = 0; i < 5; i++) s += `<path d="M-6,${-30 + i * 6}L6,${-26 + i * 6}M6,${-30 + i * 6}L-6,${-26 + i * 6}" stroke="#d8b080" stroke-width=".9"/>`;
    } else {
      s += `<path d="M-34,40Q0,56 34,40L34,46Q0,62 -34,46Z" fill="#5a3a1a"/><path d="M-32,0L32,0" stroke="#2a160a" stroke-width="5"/>` + buckle(0, 0, 9, 7);
    }
    s += `</g>`;
    if (o.fur) for (let i = 0; i < 22; i++) { const t = i / 21, x = -30 + 60 * t, y = -48 + Math.sin(t * Math.PI) * 14; s += `<path d="M${n1(x)},${n1(y - 4)}q${n1((i % 3 - 1) * 2)},6 ${n1((i % 2 ? 2 : -2))},10" stroke="${i % 2 ? '#a89478' : '#5e4c3a'}" stroke-width="4.2" stroke-linecap="round" fill="none"/>`; }
    return wrap(o, s);
  };
  O.shieldItem = (o) => {
    const c = o.col || '#22408a', em = o.em || '#f0c860', gid = nid();
    let s = `<defs>${grad(gid, [[0, shade(c, 0.35)], [0.6, c], [1, shade(c, -0.6)]], 1, 1)}</defs>` + halo(em, 80, 0.3) + shadow(62, 42);
    const d = o.round ? 'M0,-52A52,52 0 1 1 -0.1,-52Z' : 'M-44,-54L44,-54L44,10Q44,40 0,62Q-44,40 -44,10Z';
    s += `<path d="${d}" fill="url(#${gid})"/><path d="${d}" fill="none" stroke="url(#gold)" stroke-width="6"/><path d="${d}" fill="none" stroke="#3a2a08" stroke-width="1"/>`;
    if (o.scales) for (let r = 0; r < 6; r++) for (let c2 = 0; c2 < 6; c2++) s += `<path d="M${-36 + c2 * 14 + (r % 2) * 7},${-44 + r * 16}q7,10 14,0" stroke="${shade(c, 0.3)}" stroke-width="1.4" fill="none"/>`;
    s += `<circle cx="0" cy="0" r="12" fill="${em}"/>` + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${n1(Math.cos(a) * 15)},${n1(Math.sin(a) * 15)}L${n1(Math.cos(a) * 26)},${n1(Math.sin(a) * 26)}" stroke="${em}" stroke-width="2.2"/>`; }).join('');
    s += `<path d="M-34,-44Q-38,-10 -30,14" stroke="#fff" stroke-width="3" opacity=".3" fill="none"/>`;
    return wrap(o, s);
  };
  O.robe = (o) => {
    const c = o.col || '#3a2a7a', tr = o.trim || '#c8d4ff', gid = nid();
    let s = `<defs>${grad(gid, [[0, shade(c, 0.3)], [0.5, c], [1, shade(c, -0.6)]], 1, 0.4)}</defs>` + halo(tr, 80, 0.3) + shadow(62, 52);
    const d = 'M-18,-56L18,-56L40,-40L34,-20L24,-24L30,60Q0,68 -30,60L-24,-24L-34,-20L-40,-40Z';
    s += `<path d="${d}" fill="url(#${gid})"/><path d="M-18,-56Q0,-40 18,-56" stroke="${tr}" stroke-width="2" fill="none"/><path d="M0,-44L0,62" stroke="${tr}" stroke-width="1.6"/><path d="M-30,60Q0,68 30,60" stroke="${tr}" stroke-width="2.4" fill="none"/>`;
    for (let i = 0; i < 8; i++) s += star(-20 + (i * 13) % 40, -30 + i * 11, 0.35, tr);
    const cid = nid(); s += `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${cid})"><rect x="-50" y="-60" width="100" height="130" fill="url(#pWeave)" opacity=".8"/>`;
    for (let i = 0; i < 6; i++) { const x = -22 + i * 9; s += `<path d="M${x},-20Q${x + (i % 2 ? 4 : -4)},20 ${x * 1.25},64" stroke="#000" stroke-width="${i % 2 ? 2.4 : 1.2}" opacity=".35" fill="none"/><path d="M${x + 2},-20Q${x + 2 + (i % 2 ? 4 : -4)},20 ${x * 1.25 + 2},64" stroke="#fff" stroke-width=".6" opacity=".2" fill="none"/>`; }
    s += `<path d="M-40,-40L-34,-20L-24,-24Z" fill="#000" opacity=".3"/><path d="M40,-40L34,-20L24,-24Z" fill="#000" opacity=".3"/><rect x="-26" y="-4" width="52" height="6" fill="${shade(c, -0.4)}"/><path d="M-26,-4L26,-4M-26,2L26,2" stroke="${tr}" stroke-width=".8"/>` + buckle(0, -1, 7, 7);
    for (let i = 0; i < 9; i++) s += `<path d="M${-28 + i * 7},56l3.5,-3.5l3.5,3.5l-3.5,3.5z" fill="${tr}" opacity=".85"/>`;
    s += `</g><path d="${d}" fill="none" stroke="#000" stroke-opacity=".4"/>`;
    return wrap(o, s);
  };
  O.boots = (o) => {
    const fill = o.mat === 'cloth' ? 'url(#iron)' : 'url(#leather)';
    let s = halo(o.glow || '#ffd080', 70, 0.25) + shadow(46, 50);
    const boot = x => `<path d="M${x - 12},-40L${x + 12},-40L${x + 12},20L${x + 34},30L${x + 34},44L${x - 14},44Z" fill="${fill}"/><path d="M${x - 14},-40L${x + 14},-40L${x + 14},-30L${x - 14},-30Z" fill="${o.cuff || '#8a6a4a'}"/><path d="M${x - 12},38L${x + 34},38" stroke="#1a0e06" stroke-width="2"/>` + (o.rocket ? `<rect x="${x - 22}" y="-20" width="10" height="34" rx="3" fill="url(#steel)"/><path d="M${x - 22},14L${x - 12},14L${x - 14},22L${x - 20},22Z" fill="url(#iron)"/><path d="M${x - 17},22Q${x - 26},40 ${x - 17},56Q${x - 8},40 ${x - 17},22Z" fill="#ffb040"/><path d="M${x - 17},24Q${x - 21},36 ${x - 17},46Q${x - 13},36 ${x - 17},24Z" fill="#fff4c0"/>` : '') + `<path d="M${x - 8},-26L${x - 8},16" stroke="#e8c890" stroke-width=".8" stroke-dasharray="2 2"/>` + `<path d="M${x - 12},-10L${x + 12},-14M${x - 12},6L${x + 12},2" stroke="#2a160a" stroke-width="4"/>` + buckle(x + 6, -13, 6, 6) + buckle(x + 6, 3, 6, 6) + `<path d="M${x + 16},32Q${x + 30},30 ${x + 34},38L${x + 34},44L${x + 16},44Z" fill="url(#iron)" opacity=".8"/><path d="M${x - 14},44L${x + 34},44" stroke="#000" stroke-width="3"/>` + rivets([[x + 24, 38], [x + 30, 40]], 1.1) + `<path d="M${x + 8},-38Q${x + 10},0 ${x + 9},26" stroke="#fff" stroke-width="1.6" opacity=".22" fill="none"/>`;
    s += `<g transform="translate(-22,0)">${boot(0)}</g><g transform="translate(26,-6) scale(.92)">${boot(0)}</g>`;
    if (o.shadowy) s += A.layers.wisps({ x: 0, y: 30, w: 90, h: 20, c: '#8a70ff', n: 5 }, {}, A.rng(5));
    return wrap(o, s);
  };
  O.gauntlet = (o) => {
    const g = o.glow || '#ff8a2a';
    let s = halo(g, 74, 0.38) + shadow(52, 40);
    s += `<path d="M-22,52L-26,0L-30,-20L-24,-24L-18,-6L-18,-40L-11,-42L-8,-10L-6,-48L2,-48L3,-10L6,-44L13,-42L13,-6L18,-34L25,-31L22,6L26,52Z" fill="url(#steelV)"/><path d="M-22,52L-26,0L-30,-20L-24,-24L-18,-6L-18,-40L-11,-42L-8,-10L-6,-48L2,-48L3,-10L6,-44L13,-42L13,-6L18,-34L25,-31L22,6L26,52Z" fill="none" stroke="#1a1c22" stroke-width="1.2"/>`;
    s += [[-18, -8], [-7, -12], [3, -12], [13, -8]].map(([x, y]) => `<path d="M${x - 4},${y}Q${x},${y - 4} ${x + 4},${y}" stroke="#1a1c22" stroke-width="1.4" fill="none"/><path d="M${x - 4},${y + 6}Q${x},${y + 2} ${x + 4},${y + 6}" stroke="#1a1c22" stroke-width="1" fill="none"/>`).join('') + rivets([[-20, 44], [-8, 46], [8, 46], [20, 44], [-15, -16], [-5, -22], [5, -22], [15, -16]], 1.2) + scratches(61, 12, 44, 80);
    s += `<path d="M-24,22L24,22M-24,34L24,34" stroke="url(#gold)" stroke-width="2.4"/><path d="M-14,4L-4,14L6,4L16,14" stroke="${g}" stroke-width="2" fill="none"/><path d="M-14,4L-4,14L6,4L16,14" stroke="${g}" stroke-width="6" fill="none" opacity=".5" filter="url(#b2)"/>`;
    return wrap(o, s);
  };
  O.legs = (o) => {
    const fill = o.mat === 'mail' ? 'url(#iron)' : 'url(#leather)';
    let s = halo('#ffd080', 70, 0.25) + shadow(60, 46);
    s += `<path d="M-30,-50L30,-50L32,-30L26,58L6,58L0,-12L-6,58L-26,58L-32,-30Z" fill="${fill}"/><path d="M-32,-50L32,-50L32,-40L-32,-40Z" fill="${o.mat === 'mail' ? 'url(#steel)' : '#4a2a14'}"/><circle cx="0" cy="-45" r="4" fill="url(#gold)"/>`;
    if (o.fur) s += `<path d="M-32,-40L-26,-30L-20,-40L-14,-30L-8,-40L-2,-30L4,-40L10,-30L16,-40L22,-30L28,-40L32,-30" stroke="#c8a878" stroke-width="3" fill="none"/>`;
    if (o.mat === 'mail') s += `<path d="M-30,-20L-24,30M30,-20L24,30" stroke="#c8d0dc" stroke-width=".8" stroke-dasharray="1.5 1.5"/>`;
    const lp = 'M-30,-50L30,-50L32,-30L26,58L6,58L0,-12L-6,58L-26,58L-32,-30Z', cid = nid();
    s += `<defs><clipPath id="${cid}"><path d="${lp}"/></clipPath></defs><g clip-path="url(#${cid})"><rect x="-40" y="-40" width="80" height="100" fill="url(#${o.mat === 'mail' ? 'pMail' : 'pGrain'})" opacity=".9"/>`;
    s += `<ellipse cx="-16" cy="14" rx="9" ry="7" fill="${o.mat === 'mail' ? 'url(#steelV)' : '#5a3418'}"/><ellipse cx="16" cy="14" rx="9" ry="7" fill="${o.mat === 'mail' ? 'url(#steelV)' : '#5a3418'}"/>` + rivets([[-16, 14], [16, 14]], 1.4);
    for (let i = 0; i < 4; i++) s += `<path d="M-20,${28 + i * 7}L-12,${30 + i * 7}M12,${30 + i * 7}L20,${28 + i * 7}" stroke="#2a160a" stroke-width="1.6"/>`;
    s += `<path d="M-2,-40L-2,-12M2,-40L2,-12" stroke="#000" stroke-width="1" opacity=".5"/><path d="M-26,-30Q-24,10 -22,54" stroke="#fff" stroke-width="2" opacity=".18" fill="none"/></g>`;
    return wrap(o, s);
  };
  O.vest = (o) => O.breastplate(Object.assign({ mat: 'leather' }, o));

  /* =================== WEAPON SHOWCASE (full colour) =================== */
  O.sword = (o) => {
    const g = o.glow, len = o.len || 150, gid = nid();
    let s = `<defs>${grad(gid, [[0, '#5a6270'], [0.45, '#f4f8ff'], [0.55, '#a2aec0'], [1, '#3a404c']], 1, 0)}</defs>`;
    s += (g ? halo(g, 90, 0.4) : halo('#fff', 70, 0.15));
    s += `<g transform="translate(0,${len * 0.42})">`;
    if (g) s += `<path d="M0,-30L0,${-len}" stroke="${g}" stroke-width="18" opacity=".45" filter="url(#b4)"/>`;
    s += `<path d="M-7,-24L-7,${-len + 14}L0,${-len}L7,${-len + 14}L7,-24Z" fill="url(#${gid})"/><path d="M0,-26L0,${-len + 8}" stroke="#6a7484" stroke-width="1.6"/><path d="M-7,-24L-7,${-len + 14}L0,${-len}" fill="none" stroke="#fff" stroke-width=".8" opacity=".8"/>`;
    if (o.runes) for (let i = 0; i < 5; i++) s += `<path d="M-2,${-50 - i * 18}l4,4l-4,4" stroke="${o.runes}" stroke-width="1.2" fill="none"/>`;
    if (o.flame) s += `<path d="M-7,-30Q-18,${-len * 0.5} -4,${-len + 10}Q-8,${-len * 0.5} -2,-40Z" fill="#ff9a3a" opacity=".8"/><path d="M7,-36Q16,${-len * 0.6} 4,${-len + 20}Q6,${-len * 0.6} 2,-46Z" fill="#ffd27a" opacity=".8"/>`;
    s += `<path d="M-34,-28Q-20,-18 0,-22Q20,-18 34,-28L36,-18Q18,-10 0,-14Q-18,-10 -36,-18Z" fill="url(#gold)"/><circle cx="-34" cy="-24" r="4" fill="url(#gold)"/><circle cx="34" cy="-24" r="4" fill="url(#gold)"/><circle cx="0" cy="-18" r="4.5" fill="${o.gem || '#2a6aff'}"/>`;
    s += `<rect x="-5" y="-12" width="10" height="34" rx="2" fill="url(#leather)"/>` + [0, 1, 2, 3, 4].map(i => `<path d="M-5,${-8 + i * 7}l10,4" stroke="#2a160a" stroke-width="1.2"/>`).join('') + `<circle cx="0" cy="28" r="7" fill="url(#gold)"/><circle cx="0" cy="28" r="3" fill="${o.gem || '#2a6aff'}"/>`;
    s += star(0, -len + 6, 1.3) + '</g>';
    return wrap(Object.assign({ rot: 35 }, o), s);
  };
  O.hammer = (o) => {
    const g = o.glow || '#ffe080';
    let s = halo(g, 90, 0.42) + `<g transform="translate(0,30)"><rect x="-5" y="-60" width="10" height="120" rx="3" fill="url(#wood)"/>` + [0, 1, 2].map(i => `<rect x="-6" y="${20 + i * 10}" width="12" height="3" fill="url(#gold)"/>`).join('');
    s += `<path d="M-46,-100L46,-100L50,-58L-50,-58Z" fill="url(#steelV)"/><path d="M-50,-58L50,-58L46,-52L-46,-52Z" fill="#3a404c"/><path d="M-46,-100L46,-100" stroke="url(#gold)" stroke-width="5"/><path d="M-50,-60L50,-60" stroke="url(#gold)" stroke-width="4"/>`;
    s += `<circle cx="0" cy="-79" r="14" fill="${g}"/>` + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${n1(Math.cos(a) * 16)},${n1(-79 + Math.sin(a) * 16)}L${n1(Math.cos(a) * 24)},${n1(-79 + Math.sin(a) * 24)}" stroke="${g}" stroke-width="2"/>`; }).join('') + `<circle cx="0" cy="-79" r="28" fill="${g}" opacity=".45" filter="url(#b4)"/><circle cx="0" cy="-79" r="6" fill="#fff"/>`;
    s += `<path d="M-6,-100L0,-118L6,-100Z" fill="url(#gold)"/></g>`;
    return wrap(Object.assign({ rot: -25 }, o), s);
  };
  O.axe = (o) => {
    const dbl = o.double, g = o.glow;
    let s = (g ? halo(g, 80, 0.35) : '') + `<g transform="translate(0,40)"><rect x="-4.5" y="-120" width="9" height="140" rx="3" fill="url(#wood)"/>` + [0, 1, 2, 3].map(i => `<path d="M-5,${-6 + i * 6}l10,3" stroke="#2a160a" stroke-width="1.4"/>`).join('');
    const blade = k => `<path d="M${4 * k},-116Q${46 * k},-136 ${60 * k},-96Q${44 * k},-80 ${60 * k},-58Q${40 * k},-70 ${4 * k},-70Z" fill="url(#steel)"/><path d="M${60 * k},-96Q${44 * k},-80 ${60 * k},-58" stroke="#fff" stroke-width="1.6" fill="none"/><path d="M${4 * k},-116Q${46 * k},-136 ${60 * k},-96Q${44 * k},-80 ${60 * k},-58Q${40 * k},-70 ${4 * k},-70Z" fill="none" stroke="#1a1c22" stroke-width="1.2"/>`;
    s += blade(1) + (dbl ? blade(-1) : `<path d="M-4,-108L-26,-98L-4,-86Z" fill="url(#steel)"/>`);
    if (o.skull) s += `<circle cx="0" cy="-94" r="11" fill="url(#bone)"/><circle cx="-4" cy="-95" r="2.6" fill="#1a0a0a"/><circle cx="4" cy="-95" r="2.6" fill="#1a0a0a"/><path d="M-4,-86L4,-86" stroke="#1a0a0a" stroke-width="1.4"/><circle cx="-4" cy="-95" r="1" fill="#ff4a2a"/><circle cx="4" cy="-95" r="1" fill="#ff4a2a"/>`;
    if (o.runes) s += `<path d="M20,-110l6,8l-6,8l6,8" stroke="${o.runes}" stroke-width="1.6" fill="none"/><path d="M20,-110l6,8l-6,8l6,8" stroke="${o.runes}" stroke-width="5" fill="none" opacity=".5" filter="url(#b1)"/>`;
    s += `<path d="M-6,-120L0,-134L6,-120Z" fill="url(#steel)"/></g>`;
    return wrap(Object.assign({ rot: 20 }, o), s);
  };
  O.bowItem = (o) => {
    let s = halo(o.glow || '#ffd890', 80, 0.25) + `<g transform="rotate(-30)">`;
    s += `<path d="M-6,-92C46,-60 46,60 -6,92" stroke="#3a1e0c" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M-6,-92C46,-60 46,60 -6,92" stroke="url(#wood)" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-4,-88C40,-58 40,58 -4,88" stroke="#d8a868" stroke-width="1" fill="none" opacity=".7"/>`;
    s += `<path d="M-6,-92L-6,92" stroke="#efe6d0" stroke-width="1.2"/><rect x="26" y="-12" width="12" height="24" rx="3" fill="url(#leather)"/>` + [0, 1, 2].map(i => `<path d="M26,${-8 + i * 8}l12,3" stroke="#2a160a" stroke-width="1.2"/>`).join('');
    s += `<path d="M-6,-92l-6,-6M-6,92l-6,6" stroke="url(#gold)" stroke-width="4" stroke-linecap="round"/>`;
    s += `<path d="M-30,0L70,0" stroke="url(#wood)" stroke-width="3"/><path d="M70,0L60,-5L60,5Z" fill="url(#steel)"/><path d="M-30,0l-8,-6l4,6l-4,6z" fill="#c02a2a"/></g>`;
    return wrap(o, s);
  };
  O.crossbowItem = (o) => {
    let s = halo('#ffd890', 80, 0.25);
    s += `<path d="M-80,4L50,-4L54,8L-74,18Q-86,18 -84,8Z" fill="url(#wood)"/><rect x="-30" y="-2" width="70" height="5" fill="url(#iron)"/>`;
    s += `<path d="M40,-64Q70,0 40,64" stroke="url(#steelV)" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M40,-64L-14,0L40,64" stroke="#efe6d0" stroke-width="1.2" fill="none"/>`;
    s += `<path d="M-14,0L76,0" stroke="url(#wood)" stroke-width="3"/><path d="M76,0L66,-5L66,5Z" fill="url(#steel)"/><rect x="-40" y="10" width="8" height="16" rx="2" fill="url(#iron)"/><circle cx="20" cy="2" r="5" fill="url(#gold)"/>`;
    s += `<path d="M-60,4l10,-6l10,6l10,-6" stroke="url(#gold)" stroke-width="1.6" fill="none"/>` + A.layers.fx({ t: 'bolt', x1: 40, y1: -64, x2: 40, y2: 64, mini: 1 }, { light: '#bfe0ff' }, A.rng(3));
    return wrap(Object.assign({ rot: -10 }, o), s);
  };
  O.staffItem = (o) => {
    const g = o.glow || '#ff8a3a';
    let s = halo(g, 90, 0.45) + `<g transform="rotate(${o.tilt != null ? o.tilt : 18})"><path d="M-4,100L-5,-60L5,-60L4,100Z" fill="url(#wood)"/>` + [0, 1].map(i => `<rect x="-6" y="${-10 + i * 40}" width="12" height="4" fill="url(#gold)"/>`).join('');
    s += `<path d="M-5,-60Q-30,-70 -26,-100Q-20,-84 -6,-82Q-10,-96 0,-112Q10,-96 6,-82Q20,-84 26,-100Q30,-70 5,-60Z" fill="url(#gold)"/>`;
    s += `<circle cx="0" cy="-90" r="16" fill="${g}"/><circle cx="0" cy="-90" r="34" fill="${g}" opacity=".45" filter="url(#b4)"/><circle cx="-4" cy="-94" r="6" fill="#fff" opacity=".9"/>` + (o.moon ? `<path d="M10,-104A16,16 0 1 0 10,-76A12,12 0 1 1 10,-104Z" fill="#fff6d0" opacity=".85"/>` : '') + '</g>';
    s += A.particles('embers', A.rng(11), { glow: g }, 8).replace(/<g>/, '<g transform="translate(-150,-110)">');
    return wrap(o, s);
  };
  O.wandItem = (o) => {
    const g = o.glow || '#ff9a4a';
    let s = halo(g, 70, 0.4) + `<g transform="rotate(40)"><path d="M-3,70L-2.5,-50L2.5,-50L3,70Z" fill="url(#wood)"/><rect x="-4" y="40" width="8" height="24" rx="2" fill="url(#leather)"/><path d="M-5,-50L0,-74L5,-50Z" fill="${g}"/><circle cx="0" cy="-62" r="18" fill="${g}" opacity=".5" filter="url(#b4)"/>` + star(0, -74, 1.6) + '</g>';
    for (let i = 0; i < 6; i++) s += star(-30 + i * 14, -60 + (i * 17) % 50, 0.4, g);
    return wrap(o, s);
  };
  O.daggers = (o) => {
    const g = o.glow;
    const dag = rot => `<g transform="rotate(${rot})"><path d="M-5,-10L-5,-80L0,-96L5,-80L5,-10Z" fill="url(#steel)"/><path d="M0,-12L0,-90" stroke="#5a6270" stroke-width="1"/>${g ? `<path d="M0,-12L0,-92" stroke="${g}" stroke-width="10" opacity=".4" filter="url(#b2)"/>` : ''}<path d="M-18,-12L18,-12L16,-6L-16,-6Z" fill="url(#gold)"/><rect x="-4" y="-6" width="8" height="26" rx="2" fill="url(#leather)"/><circle cx="0" cy="22" r="5" fill="url(#gold)"/></g>`;
    let s = (g ? halo(g, 80, 0.35) : halo('#fff', 60, 0.12)) + (o.single ? dag(30) : dag(-28) + dag(28));
    if (o.venom) s += `<path d="M30,-52q4,10 0,18q-4,-8 0,-18z" fill="${o.venom}"/><circle cx="30" cy="-26" r="3" fill="${o.venom}"/><circle cx="30" cy="-40" r="12" fill="${o.venom}" opacity=".35" filter="url(#b2)"/>`;
    return wrap(o, `<g transform="translate(0,30)">${s}</g>`);
  };
  O.maceItem = (o) => {
    const g = o.glow || '#8aff6a';
    let s = halo(g, 80, 0.3) + `<g transform="rotate(25) translate(0,30)"><rect x="-4.5" y="-70" width="9" height="120" rx="3" fill="url(#wood)"/>`;
    s += `<circle cx="0" cy="-84" r="26" fill="url(#iron)"/>` + Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${n1(Math.cos(a - 0.2) * 24)},${n1(-84 + Math.sin(a - 0.2) * 24)}L${n1(Math.cos(a) * 38)},${n1(-84 + Math.sin(a) * 38)}L${n1(Math.cos(a + 0.2) * 24)},${n1(-84 + Math.sin(a + 0.2) * 24)}Z" fill="url(#steelV)"/>`; }).join('');
    s += `<path d="M-14,-92Q0,-100 14,-92M-12,-76Q0,-70 12,-76" stroke="${g}" stroke-width="2" fill="none"/><circle cx="0" cy="-84" r="8" fill="${g}" opacity=".8"/><path d="M-20,-60q-10,-4 -14,4q8,0 14,-4zM18,-62q10,-6 16,2q-8,2 -16,-2z" fill="#4a8a3a"/></g>`;
    return wrap(o, s);
  };
  O.polearmItem = (o) => {
    const g = o.glow;
    let s = (g ? halo(g, 90, 0.4) : '') + `<g transform="rotate(${o.tilt != null ? o.tilt : -28})"><rect x="-3.5" y="-80" width="7" height="190" rx="2" fill="url(#wood)"/>`;
    if (o.kind === 'scythe') s += `<path d="M0,-80Q-80,-110 -120,-50Q-80,-90 0,-62Z" fill="url(#steel)"/><path d="M0,-80Q-80,-110 -120,-50" stroke="#fff" stroke-width="1.4" fill="none"/>${g ? `<path d="M-4,-76Q-70,-100 -110,-56" stroke="${g}" stroke-width="10" fill="none" opacity=".5" filter="url(#b2)"/>` : ''}`;
    else if (o.kind === 'trident') s += `<path d="M-28,-84L28,-84L26,-76L-26,-76Z" fill="url(#gold)"/><path d="M-26,-82L-30,-130L-20,-110L-18,-82ZM26,-82L30,-130L20,-110L18,-82ZM-5,-84L0,-146L5,-84Z" fill="url(#steelV)"/>${g ? `<circle cx="0" cy="-120" r="30" fill="${g}" opacity=".45" filter="url(#b4)"/>` : ''}`;
    else s += `<path d="M3,-110Q44,-122 50,-88Q38,-74 50,-56Q28,-66 3,-66Z" fill="url(#steel)"/><path d="M-3,-100L-24,-90L-3,-80Z" fill="url(#steel)"/><path d="M-4,-110L0,-150L4,-110Z" fill="url(#steelV)"/><path d="M50,-88Q38,-74 50,-56" stroke="#fff" stroke-width="1.4" fill="none"/>`;
    s += [0, 1].map(i => `<rect x="-5" y="${-60 + i * 8}" width="10" height="3" fill="url(#gold)"/>`).join('') + '</g>';
    if (o.lightning) s += A.layers.fx({ t: 'bolt', x1: -40, y1: -90, x2: 30, y2: 60, mini: 1 }, { light: '#bfe0ff' }, A.rng(5));
    return wrap(o, s);
  };

  // every object is embossed with a soft specular bevel so metal, wood and cloth read as solid, sculpted forms
  L.obj = function (o, P) {
    const fn = O[o.t];
    const s = fn ? fn(o, P) : '';
    return s && o.emboss !== false ? `<g filter="url(#emb)">${s}</g>` : s;
  };
  A.OBJ = O;

  /* =================== EFFECTS =================== */
  const FX = {};
  FX.fireball = (o, P) => {
    const x = o.x || 160, y = o.y || 100, k = o.s || 1, ang = o.ang != null ? o.ang : 30, c = o.c || '#ff6a1a';
    let s = `<g transform="translate(${x},${y}) rotate(${ang}) scale(${k})">`;
    s += `<path d="M0,-22Q-90,-30 -170,-4Q-90,0 -170,10Q-90,14 0,22Z" fill="${c}" opacity=".5" filter="url(#b4)"/><path d="M0,-14Q-70,-16 -130,-2Q-70,2 -120,10Q-60,12 0,14Z" fill="#ffb040" opacity=".75" filter="url(#b2)"/><path d="M0,-7Q-40,-6 -80,0Q-40,4 0,7Z" fill="#fff4c0" filter="url(#b1)"/>`;
    s += `<circle cx="0" cy="0" r="40" fill="${c}" opacity=".45" filter="url(#b8)"/><circle cx="0" cy="0" r="22" fill="#ffa030" filter="url(#b2)"/><circle cx="0" cy="0" r="13" fill="#ffe08a"/><circle cx="0" cy="0" r="7" fill="#fff"/>`;
    for (let i = 0; i < 8; i++) s += `<circle cx="${-30 - i * 16}" cy="${(i % 2 ? 1 : -1) * (6 + i * 2)}" r="${2.5 - i * 0.2}" fill="#ffd080"/>`;
    return s + '</g>';
  };
  FX.frost = (o, P) => {
    const x = o.x || 150, y = o.y || 120, k = o.s || 1;
    let s = `<g transform="translate(${x},${y}) scale(${k})"><circle r="70" fill="#9ae8ff" opacity=".3" filter="url(#b8)"/>`;
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6 + (i % 2) * 0.15, l = 50 + (i % 3) * 22, w = 7 + (i % 2) * 4;
      const tx = Math.cos(a) * l, ty = Math.sin(a) * l * 0.6, bx = Math.cos(a + 1.57) * w, by = Math.sin(a + 1.57) * w * 0.6;
      s += `<path d="M${n1(bx)},${n1(by)}L${n1(tx)},${n1(ty)}L${n1(-bx)},${n1(-by)}Z" fill="#dff8ff" opacity=".85"/><path d="M0,0L${n1(tx)},${n1(ty)}" stroke="#fff" stroke-width=".8"/>`;
    }
    s += `<ellipse rx="80" ry="22" fill="none" stroke="#c8f4ff" stroke-width="2" opacity=".7" filter="url(#b1)"/><circle r="12" fill="#fff"/>`;
    for (let i = 0; i < 8; i++) s += star(-90 + i * 26, -50 + (i * 23) % 90, 0.5, '#e6faff');
    return s + '</g>';
  };
  FX.bolt = (o, P, r) => {
    const c = o.c || P.light || '#cfe4ff';
    let s = A.prims.lightning(r, o.x1 != null ? o.x1 : 150, o.y1 != null ? o.y1 : 0, o.x2 != null ? o.x2 : 150, o.y2 != null ? o.y2 : 170, c);
    if (o.fork) s += A.prims.lightning(r, o.x2 - 20, (o.y1 + o.y2) / 2, o.x2 + 40, o.y2 + 10, c);
    if (!o.mini) s += `<circle cx="${o.x2 || 150}" cy="${o.y2 || 170}" r="30" fill="${c}" opacity=".5" filter="url(#b4)"/>`;
    return s;
  };
  FX.holy = (o, P) => {
    const x = o.x || 150, c = o.c || '#fff2b0';
    let s = `<path d="M${x - 30},0L${x + 30},0L${x + 54},${o.y2 || 200}L${x - 54},${o.y2 || 200}Z" fill="${c}" opacity=".35" filter="url(#b4)"/><path d="M${x - 12},0L${x + 12},0L${x + 22},${o.y2 || 200}L${x - 22},${o.y2 || 200}Z" fill="#fff" opacity=".5" filter="url(#b2)"/>`;
    for (let i = 0; i < 3; i++) s += `<ellipse cx="${x}" cy="${(o.y2 || 200) - 10 - i * 20}" rx="${50 - i * 10}" ry="${8 - i * 2}" fill="none" stroke="${c}" stroke-width="1.4" opacity="${0.8 - i * 0.2}"/>`;
    if (o.wings) { const wy = o.wy || 90; for (let k of [-1, 1]) for (let i = 0; i < 6; i++) s += `<path d="M${x},${wy}Q${x + k * (30 + i * 12)},${wy - 50 + i * 8} ${x + k * (60 + i * 14)},${wy - 30 + i * 14}Q${x + k * (34 + i * 8)},${wy - 20 + i * 6} ${x},${wy + 6}Z" fill="${c}" opacity="${0.22 - i * 0.02}"/>`; }
    return s;
  };
  FX.heal = (o, P, r) => {
    const x = o.x || 150, y = o.y || 130, c = o.c || '#9aff8a';
    let s = `<ellipse cx="${x}" cy="${y + 50}" rx="70" ry="14" fill="${c}" opacity=".35" filter="url(#b4)"/>`;
    for (let i = 0; i < 3; i++) s += `<path d="M${x - 50},${y + 50 - i * 30}Q${x},${y + 30 - i * 30} ${x + 50},${y + 50 - i * 30}" stroke="${c}" stroke-width="2.4" fill="none" opacity=".6" filter="url(#b1)"/>`;
    for (let i = 0; i < 18; i++) { const px = x + (r() - 0.5) * 120, py = y + 50 - r() * 140; s += `<circle cx="${n1(px)}" cy="${n1(py)}" r="${n1(1 + r() * 2.4)}" fill="${c}"/><circle cx="${n1(px)}" cy="${n1(py)}" r="5" fill="${c}" opacity=".3" filter="url(#b1)"/>`; }
    if (o.leaves) for (let i = 0; i < 7; i++) { const px = x + (r() - 0.5) * 120, py = y - r() * 100; s += `<path d="M${n1(px)},${n1(py)}q6,-8 12,0q-6,8 -12,0z" fill="#6ad05a" transform="rotate(${n1(r() * 360)} ${n1(px)} ${n1(py)})"/>`; }
    if (o.cross) s += `<path d="M${x - 6},${y - 70}h12v-14h14v-12h-14v-14h-12v14h-14v12h14z" fill="${c}" opacity=".9"/>`;
    return s;
  };
  FX.shadow = (o, P, r) => {
    const x = o.x || 150, y = o.y || 120, c = o.c || '#8a4aff';
    let s = '';
    for (let i = 0; i < 10; i++) s += `<circle cx="${n1(x + (r() - 0.5) * 160)}" cy="${n1(y + (r() - 0.5) * 80)}" r="${n1(20 + r() * 30)}" fill="${i % 2 ? '#1a0a2a' : c}" opacity="${i % 2 ? 0.6 : 0.25}" filter="url(#b4)"/>`;
    if (o.daggers) for (let i = 0; i < (o.daggers || 0); i++) { const dx = x - 80 + i * (160 / o.daggers), dy = y - 40 + (i % 2) * 30; s += `<g transform="translate(${n1(dx)},${n1(dy)}) rotate(${60 + i * 8})"><path d="M-2,0L-2,-26L0,-34L2,-26L2,0Z" fill="#dfe6f0"/><rect x="-6" y="0" width="12" height="2.4" fill="#9a8a6a"/><path d="M0,4L0,40" stroke="${c}" stroke-width="3" opacity=".5" filter="url(#b1)"/></g>`; }
    return s;
  };
  FX.arrows = (o, P, r) => {
    let s = '';
    const n = o.n || 9;
    for (let i = 0; i < n; i++) {
      const x = 20 + r() * 220, y = 20 + r() * 80, ang = o.ang != null ? o.ang : 30 + r() * 10;
      s += `<g transform="translate(${n1(x)},${n1(y)}) rotate(${n1(ang)})"><path d="M-40,0L0,0" stroke="${o.c || P.rim}" stroke-width="1.2"/><path d="M-40,0L-90,0" stroke="${o.c || P.rim}" stroke-width="3" opacity=".3" filter="url(#b1)"/><path d="M4,0L-3,-3L-3,3Z" fill="#fff"/><path d="M-40,0l-5,-4M-40,0l-5,4" stroke="${o.c || P.rim}" stroke-width="1"/></g>`;
    }
    return s;
  };
  FX.barrier = (o, P) => {
    const x = o.x || 150, y = o.y || 196, rr = o.r || 80, c = o.c || '#9ad8ff';
    let s = `<path d="M${x - rr},${y}A${rr},${rr} 0 0 1 ${x + rr},${y}Z" fill="${c}" opacity=".14"/><path d="M${x - rr},${y}A${rr},${rr} 0 0 1 ${x + rr},${y}" fill="none" stroke="${c}" stroke-width="3" opacity=".8" filter="url(#b1)"/>`;
    for (let i = 1; i < 6; i++) { const a = Math.PI * i / 6; s += `<path d="M${x},${y}L${n1(x + Math.cos(a) * rr)},${n1(y - Math.sin(a) * rr)}" stroke="${c}" stroke-width=".7" opacity=".4"/>`; }
    for (let i = 1; i < 4; i++) s += `<path d="M${x - rr * i / 4},${y}A${rr * i / 4},${rr * i / 4} 0 0 1 ${x + rr * i / 4},${y}" fill="none" stroke="${c}" stroke-width=".7" opacity=".35"/>`;
    return s;
  };
  FX.whirl = (o, P) => {
    const x = o.x || 150, y = o.y || 130, c = o.c || P.rim;
    let s = '';
    for (let i = 0; i < 5; i++) s += `<ellipse cx="${x}" cy="${y}" rx="${50 + i * 14}" ry="${14 + i * 4}" fill="none" stroke="${c}" stroke-width="${3 - i * 0.4}" stroke-dasharray="${60 + i * 20} ${40 + i * 10}" opacity="${0.8 - i * 0.12}" transform="rotate(${-8 + i * 4} ${x} ${y})" filter="url(#b1)"/>`;
    return s;
  };
  FX.runes = (o, P) => {
    const x = o.x || 150, y = o.y || 150, rr = o.r || 60, c = o.c || P.glow;
    let s = `<g transform="translate(${x},${y}) scale(1,${o.flat || 0.35})"><circle r="${rr}" fill="${c}" opacity=".18" filter="url(#b4)"/><circle r="${rr}" fill="none" stroke="${c}" stroke-width="2.4"/><circle r="${rr * 0.78}" fill="none" stroke="${c}" stroke-width="1.2"/><circle r="${rr * 0.4}" fill="none" stroke="${c}" stroke-width="1.6"/>`;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += `<path d="M${n1(Math.cos(a) * rr * 0.82)},${n1(Math.sin(a) * rr * 0.82)}l${i % 2 ? 4 : -3},-5l3,6" stroke="${c}" stroke-width="1.4" fill="none"/>`; }
    s += `<path d="M0,${-rr * 0.78}L${n1(rr * 0.68)},${n1(rr * 0.39)}L${n1(-rr * 0.68)},${n1(rr * 0.39)}Z" fill="none" stroke="${c}" stroke-width="1.2"/></g>`;
    return s;
  };
  FX.skull = (o, P) => {
    const x = o.x || 150, y = o.y || 90, k = o.s || 1, c = o.c || '#6affb0';
    return `<g transform="translate(${x},${y}) scale(${k})" opacity="${o.op || 0.85}"><circle r="60" fill="${c}" opacity=".25" filter="url(#b8)"/><path d="M-30,-10Q-32,-46 0,-48Q32,-46 30,-10Q30,10 18,16L16,30L-16,30L-18,16Q-30,10 -30,-10Z" fill="${c}" opacity=".5" filter="url(#b1)"/><ellipse cx="-12" cy="-6" rx="8" ry="9" fill="#020806"/><ellipse cx="12" cy="-6" rx="8" ry="9" fill="#020806"/><circle cx="-12" cy="-5" r="2.4" fill="#fff"/><circle cx="12" cy="-5" r="2.4" fill="#fff"/><path d="M-3,8L0,2L3,8Z" fill="#020806"/><path d="M-12,22L12,22M-6,18L-6,28M0,18L0,28M6,18L6,28" stroke="#020806" stroke-width="1.4"/></g>`;
  };
  FX.wave = (o, P, r) => {
    const c = o.c || '#5ad0ff', y = o.y || 150, gid = nid(), cid = nid();
    const body = `M-10,${y + 60}L-10,${y}Q60,${y - 30} 120,${y - 70}Q170,${y - 110} 210,${y - 90}Q240,${y - 70} 220,${y - 50}Q200,${y - 70} 180,${y - 60}Q150,${y - 40} 170,${y}Q200,${y + 20} 310,${y + 10}L310,${y + 60}Z`;
    let s = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#e6fbff" stop-opacity=".9"/><stop offset=".3" stop-color="${c}" stop-opacity=".85"/><stop offset=".75" stop-color="${shade(c, -0.55)}" stop-opacity=".9"/><stop offset="1" stop-color="#021422" stop-opacity=".95"/></linearGradient><clipPath id="${cid}"><path d="${body}"/></clipPath></defs>`;
    s += `<path d="${body}" fill="${c}" opacity=".35" filter="url(#b4)"/><path d="${body}" fill="url(#${gid})"/>`;
    // inner currents, light caustics and the curling lip of foam
    s += `<g clip-path="url(#${cid})">`;
    for (let i = 0; i < 9; i++) { const yy = y - 50 + i * 12; s += `<path d="M${-10 + i * 6},${yy + 40}Q${60 + i * 8},${yy - 10} ${150 + i * 4},${yy - 30 + i * 3}" stroke="#fff" stroke-width="${n1(0.6 + (i % 3) * 0.4)}" fill="none" opacity="${n1(0.12 + (i % 2) * 0.1)}"/>`; }
    for (let i = 0; i < 26; i++) { const xx = r() * 300, yy = y - 40 + r() * 90; s += `<path d="M${n1(xx)},${n1(yy)}q4,-3 8,0q4,3 8,0" stroke="#d8f8ff" stroke-width=".6" fill="none" opacity="${n1(0.2 + r() * 0.3)}"/>`; }
    s += `<path d="M170,${y}Q200,${y + 20} 310,${y + 10}L310,${y + 60}L150,${y + 60}Z" fill="#000" opacity=".3"/></g>`;
    s += `<path d="M120,${y - 70}Q170,${y - 110} 210,${y - 90}Q240,${y - 70} 220,${y - 50}" stroke="#fff" stroke-width="6" fill="none" opacity=".55" filter="url(#b2)"/><path d="M120,${y - 70}Q170,${y - 110} 210,${y - 90}Q240,${y - 70} 220,${y - 50}" stroke="#fff" stroke-width="2.2" fill="none" opacity=".95"/>`;
    s += `<path d="M-10,${y}Q60,${y - 30} 120,${y - 70}" stroke="#e0faff" stroke-width="1.4" fill="none" opacity=".7"/><path d="M180,${y - 60}Q200,${y - 70} 220,${y - 50}" stroke="#bff4ff" stroke-width="1" fill="none" opacity=".8"/>`;
    for (let i = 0; i < 22; i++) { const a = -1.2 + r() * 1.6, d = 8 + r() * 40, xx = 214 + Math.cos(a) * d, yy = y - 92 + Math.sin(a) * d * 0.7; s += `<circle cx="${n1(xx)}" cy="${n1(yy)}" r="${n1(0.6 + r() * 2.2)}" fill="#fff" opacity="${n1(0.5 + r() * 0.5)}"/>`; }
    for (let i = 0; i < 7; i++) s += `<path d="M${n1(200 + i * 6)},${n1(y - 96 - i * 2)}q${n1(6 + i)},-8 ${n1(14 + i * 2)},-4" stroke="#fff" stroke-width=".8" fill="none" opacity=".6"/>`;
    return s;
  };
  FX.slash = (o, P) => {
    const x = o.x || 150, y = o.y || 110, c = o.c || '#ff7a3a';
    let s = '';
    for (let i = 0; i < 3; i++) s += `<path d="M${x - 50 + i * 22},${y - 60}Q${x - 20 + i * 22},${y} ${x - 40 + i * 22},${y + 60}" stroke="${c}" stroke-width="9" fill="none" opacity=".5" filter="url(#b2)"/><path d="M${x - 50 + i * 22},${y - 60}Q${x - 20 + i * 22},${y} ${x - 40 + i * 22},${y + 60}" stroke="#fff4e0" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    return s;
  };
  FX.meteors = (o, P, r) => {
    let s = '';
    for (let i = 0; i < (o.n || 6); i++) { const x = 40 + r() * 240, y = 10 + r() * 120, l = 30 + r() * 50, c = o.c || '#c8b0ff'; s += `<path d="M${n1(x)},${n1(y)}L${n1(x - l)},${n1(y - l * 0.7)}" stroke="${c}" stroke-width="4" opacity=".5" filter="url(#b2)"/><path d="M${n1(x)},${n1(y)}L${n1(x - l)},${n1(y - l * 0.7)}" stroke="#fff" stroke-width="1.2"/><circle cx="${n1(x)}" cy="${n1(y)}" r="3" fill="#fff"/>`; }
    return s;
  };
  FX.sparkle = (o, P, r) => { let s = ''; for (let i = 0; i < (o.n || 10); i++) s += star(n1(30 + r() * 240), n1(20 + r() * 160), 0.4 + r() * 0.8, o.c || '#fff0b0'); return s; };
  FX.shout = (o, P) => { const x = o.x || 150, y = o.y || 100; let s = ''; for (let i = 0; i < 4; i++) s += `<path d="M${x + 20 + i * 18},${y - 30 - i * 10}Q${x + 40 + i * 22},${y} ${x + 20 + i * 18},${y + 30 + i * 10}" stroke="${o.c || P.rim}" stroke-width="${3 - i * 0.5}" fill="none" opacity="${0.8 - i * 0.15}"/><path d="M${x - 20 - i * 18},${y - 30 - i * 10}Q${x - 40 - i * 22},${y} ${x - 20 - i * 18},${y + 30 + i * 10}" stroke="${o.c || P.rim}" stroke-width="${3 - i * 0.5}" fill="none" opacity="${0.8 - i * 0.15}"/>`; return s; };
  FX.ice = (o, P) => { const x = o.x || 150, y = o.y || 196; return `<path d="M${x - 46},${y}L${x - 52},${y - 90}L${x - 20},${y - 130}L${x + 30},${y - 124}L${x + 54},${y - 80}L${x + 46},${y}Z" fill="#bfefff" opacity=".42"/><path d="M${x - 52},${y - 90}L${x - 20},${y - 130}L${x + 30},${y - 124}" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/><path d="M${x - 20},${y - 130}L${x - 10},${y}M${x + 30},${y - 124}L${x + 10},${y}" stroke="#e6faff" stroke-width=".8" opacity=".6"/>`; };
  FX.chains = (o, P) => { let s = ''; for (let i = 0; i < 14; i++) s += `<ellipse cx="${30 + i * 18}" cy="${60 + Math.sin(i * 0.6) * 12}" rx="7" ry="4" fill="none" stroke="url(#iron)" stroke-width="2.4" transform="rotate(${i % 2 ? 0 : 90} ${30 + i * 18} ${60 + Math.sin(i * 0.6) * 12})"/>`; return s; };
  FX.buff = (o, P) => { const x = o.x || 150, y = o.y || 150, c = o.c || '#ffd060'; let s = `<ellipse cx="${x}" cy="${y + 40}" rx="60" ry="12" fill="${c}" opacity=".4" filter="url(#b2)"/>`; for (let i = 0; i < 5; i++) s += `<path d="M${x - 50 + i * 25},${y + 30 - (i % 2) * 20}l0,-30M${x - 56 + i * 25},${y + 6 - (i % 2) * 20}l6,-8l6,8" stroke="${c}" stroke-width="2" fill="none" opacity=".85"/>`; return s; };
  FX.ink = (o, P, r) => { let s = ''; for (let i = 0; i < 14; i++) s += `<circle cx="${n1(r() * 300)}" cy="${n1(60 + r() * 140)}" r="${n1(16 + r() * 36)}" fill="#05030a" opacity=".55" filter="url(#b4)"/>`; return s; };
  L.fx = function (o, P, r) { const f = FX[o.t]; return f ? f(o, P, r || A.rng(1)) : ''; };
  A.FX = FX;
})(globalThis.RB);
