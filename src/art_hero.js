/* RAIDBOUND — art engine v2: fully painted, colour-lit heroic figures.
   Each body part is its own shaded shape: tapered, muscled limbs, a sculpted torso and a race-specific head
   with a real face. The figure is then dressed in a full armour set for its material: plate, mail, leather,
   hide, cloth or bone. Style: chunky heroic proportions, oversized pauldrons, rich colour, warm key light from
   the upper right, cool shadows, dark ink outlines and a scene-coloured rim light. */
(function (RB) {
  const A = RB.ART, L = A.layers, n1 = A.n1;
  const nid = () => 'u' + (++A._uid);
  const pt = p => n1(p[0]) + ',' + n1(p[1]);
  const add = (p, x, y) => [p[0] + x, p[1] + y];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const sum = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = a => Math.hypot(a[0], a[1]) || 1;
  const unit = a => mul(a, 1 / len(a));
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const perp = u => [-u[1], u[0]];
  const LD = unit([0.55, -0.83]); // toward the key light
  const litN = (a, b) => { let n = perp(unit(sub(b, a))); if (n[0] * LD[0] + n[1] * LD[1] < 0) n = mul(n, -1); return n; };
  const OL = '#170e09';

  /* ---------- colour ---------- */
  const isHex = c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
  const rgb = c => { const v = parseInt(c.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; };
  const hex = a => '#' + a.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { if (!isHex(a) || !isHex(b)) return a; const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
  const lift = (c, target) => { if (!isHex(c)) return c; const x = rgb(c), m = Math.max(...x, 1), k = (target || 160) / m; return k > 1 ? hex(x.map(v => v * k)) : c; };
  const shd = c => mix(c, '#1a1030', 0.5), shd2 = c => mix(c, '#0a0614', 0.74), hil = c => mix(c, '#fff2d6', 0.4), hil2 = c => mix(c, '#ffffff', 0.72);
  A.mix = mix; A.lift = lift;

  /* ---------- geometry ---------- */
  // smooth closed/open path through points (Catmull-Rom → cubic Bézier)
  function cr(p, closed, k) {
    k = k == null ? 1 : k;
    const n = p.length, P = i => closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))];
    let d = `M${pt(p[0])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += `C${pt([p1[0] + (p2[0] - p0[0]) / 6 * k, p1[1] + (p2[1] - p0[1]) / 6 * k])} ${pt([p2[0] - (p3[0] - p1[0]) / 6 * k, p2[1] - (p3[1] - p1[1]) / 6 * k])} ${pt(p2)}`;
    }
    return d + (closed ? 'Z' : '');
  }
  A.cr = cr;
  function limbD(a, b, wa, wb, bulge) {
    bulge = bulge == null ? 0.12 : bulge;
    const u = unit(sub(b, a)), n = perp(u), m = lerp(a, b, 0.5), wm = (wa + wb) / 2 * (1 + bulge);
    const p1 = sum(a, mul(n, wa / 2)), p3 = sum(b, mul(n, wb / 2)), q1 = sum(a, mul(n, -wa / 2)), q3 = sum(b, mul(n, -wb / 2));
    const c1 = sub(mul(sum(m, mul(n, wm / 2)), 2), mul(sum(p1, p3), 0.5)), c2 = sub(mul(sum(m, mul(n, -wm / 2)), 2), mul(sum(q1, q3), 0.5));
    return `M${pt(p1)}Q${pt(c1)} ${pt(p3)}A${n1(wb / 2)},${n1(wb / 2)} 0 0 0 ${pt(q3)}Q${pt(c2)} ${pt(q1)}A${n1(wa / 2)},${n1(wa / 2)} 0 0 0 ${pt(p1)}Z`;
  }
  // a ring section of a limb (bracers, cuffs, greave bands), bowed toward b so it reads as wrapping round
  function bandD(a, b, t0, t1, wa, wb, grow) {
    const u = unit(sub(b, a)), n = perp(u), g = grow || 1.14;
    const w0 = (wa + (wb - wa) * t0) / 2 * g, w1 = (wa + (wb - wa) * t1) / 2 * g, A0 = lerp(a, b, t0), A1 = lerp(a, b, t1), bow = mul(u, (w0 + w1) * 0.2);
    return `M${pt(sum(A0, mul(n, w0)))}L${pt(sum(A1, mul(n, w1)))}Q${pt(sum(A1, bow))} ${pt(sum(A1, mul(n, -w1)))}L${pt(sum(A0, mul(n, -w0)))}Q${pt(sum(A0, bow))} ${pt(sum(A0, mul(n, w0)))}Z`;
  }
  const line = (a, b, c, w, op, ex) => `<path d="M${pt(a)}L${pt(b)}" stroke="${c}" stroke-width="${n1(w)}"${op != null ? ` opacity="${op}"` : ''} stroke-linecap="round" fill="none"${ex || ''}/>`;
  const qd = (a, m, b, c, w, op, ex) => `<path d="M${pt(a)}Q${pt(m)} ${pt(b)}" stroke="${c}" stroke-width="${n1(w)}"${op != null ? ` opacity="${op}"` : ''} fill="none" stroke-linecap="round"${ex || ''}/>`;
  const dot = (p, r, c, op) => `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${n1(r)}" fill="${c}"${op != null ? ` opacity="${op}"` : ''}/>`;

  /* ---------- per-figure paint context (gradients live in the figure's own defs) ---------- */
  function Ctx(P) {
    const defs = [], cache = {};
    const stops = st => st.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"/>`).join('');
    const ramp = (base, kind) => kind === 'metal' ? [[0, shd2(base)], [0.26, shd(base)], [0.5, base], [0.68, hil(base)], [0.78, hil2(base)], [0.87, hil(base)], [1, mix(base, '#1a1030', 0.25)]]
      : kind === 'skin' ? [[0, shd(base)], [0.42, base], [0.8, hil(base)], [1, mix(base, '#ffd8b0', 0.3)]]
        : [[0, shd2(base)], [0.32, shd(base)], [0.62, base], [0.9, hil(base)], [1, base]];
    return {
      P, defs, ow: 0.95,
      lin(a, b, base, kind) { const id = nid(); defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n1(a[0])}" y1="${n1(a[1])}" x2="${n1(b[0])}" y2="${n1(b[1])}">${stops(ramp(base, kind))}</linearGradient>`); return `url(#${id})`; },
      rad(base, kind) {
        const key = 'r' + base + (kind || ''); if (cache[key]) return cache[key];
        const id = nid(), st = kind === 'metal' ? [[0, hil2(base)], [0.16, hil(base)], [0.42, base], [0.78, shd(base)], [1, shd2(base)]] : [[0, hil(base)], [0.38, base], [0.84, shd(base)], [1, shd2(base)]];
        defs.push(`<radialGradient id="${id}" cx=".66" cy=".3" r=".86" fx=".7" fy=".24">${stops(st)}</radialGradient>`); return (cache[key] = `url(#${id})`);
      },
      hor(base, kind) {
        const key = 'h' + base + (kind || ''); if (cache[key]) return cache[key];
        const id = nid(); defs.push(`<linearGradient id="${id}" x1="0" y1=".15" x2="1" y2="0">${stops(ramp(base, kind))}</linearGradient>`); return (cache[key] = `url(#${id})`);
      },
    };
  }
  const shape = (F, d, fill, ex) => `<path d="${d}" fill="${fill}" stroke="${OL}"${ex && ex.includes('stroke-width') ? '' : ` stroke-width="${F.ow}"`} stroke-linejoin="round"${ex || ''}/>`;
  // soft ambient-occlusion blot: darkens where forms meet (joints, under arms, under chin)
  const ao = (p, rx, ry, op, rot) => `<ellipse cx="${n1(p[0])}" cy="${n1(p[1])}" rx="${n1(rx)}" ry="${n1(ry || rx * 0.6)}" fill="url(#aoG)" opacity="${op || 1}"${rot ? ` transform="rotate(${n1(rot)} ${n1(p[0])} ${n1(p[1])})"` : ''}/>`;
  const angOf = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  function limb(F, a, b, wa, wb, col, kind, bulge, opt) {
    opt = opt || {};
    const n = litN(a, b), m = lerp(a, b, 0.5), hw = Math.max(wa, wb) * 0.62, u = unit(sub(b, a));
    const d = limbD(a, b, wa, wb, bulge), cid = nid();
    F.defs.push(`<clipPath id="${cid}"><path d="${d}"/></clipPath>`);
    let s = shape(F, d, F.lin(sum(m, mul(n, -hw)), sum(m, mul(n, hw)), col, kind));
    let inner = '';
    // core shadow and reflected light on the dark side, specular stripe on the lit side
    const sa = sum(a, mul(n, -wa * 0.36)), sb = sum(b, mul(n, -wb * 0.36)), sm = sum(m, mul(n, -(wa + wb) / 2 * (1 + (bulge || 0.12)) * 0.38));
    inner += qd(sa, sm, sb, mix(col, '#1a1030', 0.62), (wa + wb) * 0.16, 0.5);
    inner += qd(sum(a, mul(n, -wa * 0.47)), sum(m, mul(n, -(wa + wb) / 2 * 0.52)), sum(b, mul(n, -wb * 0.47)), mix(col, F.P.rim, 0.5), 0.7, 0.35);
    const la = sum(a, mul(n, wa * 0.3)), lb = sum(b, mul(n, wb * 0.3)), lm = sum(m, mul(n, (wa + wb) / 2 * (1 + (bulge || 0.12)) * 0.34));
    inner += qd(lerp(la, lb, 0.08), lm, lerp(la, lb, 0.92), kind === 'metal' ? '#ffffff' : hil2(col), kind === 'metal' ? 1.2 : 0.8, kind === 'metal' ? 0.7 : 0.45);
    if (kind === 'skin' && !opt.noMuscle) {
      // a muscle belly line and a tendon toward the far joint
      inner += qd(lerp(a, b, 0.18), sum(lerp(a, b, 0.5), mul(n, -(wa + wb) * 0.08)), lerp(a, b, 0.72), shd(col), 0.7, 0.4);
      inner += line(sum(lerp(a, b, 0.7), mul(n, wb * 0.12)), sum(lerp(a, b, 0.96), mul(n, wb * 0.18)), shd(col), 0.55, 0.4);
    }
    if (kind === 'metal') inner += qd(sum(lerp(a, b, 0.1), mul(n, -wa * 0.1)), sum(m, mul(n, -(wa + wb) * 0.05)), sum(lerp(a, b, 0.9), mul(n, -wb * 0.1)), mix(F.P.sky[2], '#ffffff', 0.4), 0.6, 0.3);
    // ambient occlusion where this segment meets its joints
    if (!opt.noAO) inner += ao(a, wa * 0.75, wa * 0.3, 0.9, angOf(a, b) + 90) + ao(b, wb * 0.7, wb * 0.28, 0.6, angOf(a, b) + 90);
    s += `<g clip-path="url(#${cid})">${inner}</g>`;
    // heavier ink on the shadow edge
    s += qd(sum(a, mul(n, -wa * 0.5)), sum(m, mul(n, -(wa + wb) / 2 * (1 + (bulge || 0.12)) * 0.5)), sum(b, mul(n, -wb * 0.5)), OL, F.ow * 0.9, 0.7);
    return s;
  }
  function band(F, a, b, t0, t1, wa, wb, col, kind, grow) {
    const n = litN(a, b), m = lerp(a, b, (t0 + t1) / 2), hw = Math.max(wa, wb) * 0.66;
    return shape(F, bandD(a, b, t0, t1, wa, wb, grow), F.lin(sum(m, mul(n, -hw)), sum(m, mul(n, hw)), col, kind));
  }
  const rivet = (p, r) => dot(p, r || 1, '#3a3026') + dot(add(p, -0.25, -0.3), (r || 1) * 0.62, '#f4e6c0') + dot(add(p, -0.45, -0.5), (r || 1) * 0.25, '#fff');
  function sun(c, r, col) { let s = dot(c, r * 0.42, col); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s += line(add(c, Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58), add(c, Math.cos(a) * r, Math.sin(a) * r), col, r * 0.18); } return s; }
  function skull(c, r, col) { return `<path d="${cr([add(c, -r, -0.2 * r), add(c, -0.7 * r, -r), add(c, 0.7 * r, -r), add(c, r, -0.2 * r), add(c, 0.6 * r, 0.6 * r), add(c, 0.4 * r, r), add(c, -0.4 * r, r), add(c, -0.6 * r, 0.6 * r)], true)}" fill="${col}" stroke="${OL}" stroke-width=".6"/>` + dot(add(c, -0.38 * r, -0.12 * r), 0.26 * r, '#1a0e08') + dot(add(c, 0.38 * r, -0.12 * r), 0.26 * r, '#1a0e08') + line(add(c, -0.25 * r, 0.62 * r), add(c, 0.25 * r, 0.62 * r), '#1a0e08', 0.12 * r); }

  /* ---------- the look of a figure: material and palette ---------- */
  const SKIN = { human: '#e4ac86', elf: '#f2d0b4', dwarf: '#e6a27e', orc: '#78a842', goblin: '#92be48', minotaur: '#8a5a3a', skeleton: '#e8dec4', fish: '#4aa89c', giant: '#bc9a7e' };
  const HAIR = { human: '#5e3a1e', elf: '#f2d890', dwarf: '#cc5a24', orc: '#1e1610', goblin: '#2a1c12', minotaur: '#3e2816', fish: '#2a6a62', giant: '#4a3a2a', skeleton: '#d8d0b8' };
  const CLANS = { orc: 1, minotaur: 1, goblin: 1, fish: 1 };
  function matFor(o, R) {
    if (R.skull) return 'bone';
    if (o.robe) return 'cloth';
    if (o.helm === 'great' || o.pauld === 'plate' || o.helm === 'crown') return 'plate';
    if (o.race === 'fish') return 'hide';
    if (o.race === 'orc' || o.race === 'minotaur' || o.race === 'giant' || o.pauld === 'fur' || o.pauld === 'spiked' || o.helm === 'mohawk') return o.race === 'dwarf' ? 'mail' : 'hide';
    if (o.helm === 'hood' || o.race === 'goblin' || o.race === 'elf') return 'leather';
    return 'mail';
  }
  A.matFor = matFor;
  function lookFor(o, R) {
    const race = o.race || 'human', clan = !!CLANS[race] || !!o.clan, mat = o.mat || matFor(o, R);
    const cloth = o.cloth || (o.capeCol ? lift(o.capeCol, 150) : clan ? '#a02e20' : race === 'skeleton' ? '#4e4a3e' : '#2c50a6');
    return {
      race, clan, mat, cloth,
      cloth2: o.cloth2 || mix(cloth, '#120a10', 0.42),
      lining: o.capeLining || (clan ? '#2e1c10' : '#d0a446'),
      metal: o.metal || (race === 'skeleton' ? '#8a8272' : clan ? '#7c766e' : '#aebacc'),
      trim: o.trim || (clan ? '#c4843c' : '#e2b24a'),
      leather: o.leather || (clan ? '#74462a' : '#7e4e2c'),
      leather2: o.leather2 || '#40281a',
      fur: o.furCol || (race === 'minotaur' ? '#5e3e24' : '#8c765c'),
      skin: o.skin || SKIN[race] || SKIN.human,
      hair: o.hairCol || HAIR[race] || HAIR.human,
      bone: '#ece2c6',
      mail: '#8e95a2',
      eye: o.eye || null,
    };
  }

  /* ---------- body parts ---------- */
  function capePart(F, J, R, K, o) {
    const fl = o.capeFlow || -1, sL = J.sL, sR = J.sR, lx = sL[0] - 6 + fl * 30, rx = sR[0] + 12;
    const pts = [[sL[0] - 1, sL[1] - 3], [sL[0] - 8 + fl * 8, sL[1] + 34], [lx + 6, -42], [lx, -2], [lx + 12, -9], [lx + 22, 0], [lx + 34, -7], [(lx + rx) / 2 + 8, 1], [rx - 12, -6], [rx, -2], [sR[0] + 10, -50], [sR[0] + 4, sR[1] + 24], [sR[0] + 1, sR[1] - 3]];
    let s = shape(F, cr(pts, true, 0.9), F.lin([lx - 4, -40], [rx + 4, -70], K.cloth, 'cloth'));
    s += `<path d="${cr([[sL[0], sL[1]], [sL[0] - 8 + fl * 8, sL[1] + 34], [lx + 6, -42], [lx, -2], [lx + 9, -6], [lx + 13, -42], [sL[0] - 3 + fl * 4, sL[1] + 36], [sL[0] + 3, sL[1] + 4]], true, 0.9)}" fill="${K.lining}" opacity=".9"/>`;
    for (let i = 1; i <= 5; i++) {
      const t = i / 6, a = add(lerp(sL, sR, t), 0, 8), b = add(lerp([lx + 12, 0], [rx - 4, 0], t), 0, -5), m = add(lerp(a, b, 0.5), fl * (i % 2 ? 6 : -3), 0);
      s += qd(a, m, b, shd2(K.cloth), i % 2 ? 2.4 : 1.4, 0.6) + qd(add(a, 1.8, 0), add(m, 2, 0), add(b, 2, 0), hil(K.cloth), 0.8, 0.45);
    }
    s += `<path d="${cr([[lx, -2], [lx + 12, -9], [lx + 22, 0], [lx + 34, -7], [(lx + rx) / 2 + 8, 1], [rx - 12, -6], [rx, -2]], false)}" stroke="${K.trim}" stroke-width="1.4" fill="none" opacity=".85"/>`;
    return s;
  }
  function backHair(F, J, R, K, o) {
    const hd = J.hd, k = R.head / 10, H = (x, y) => add(hd, x * k, y * k);
    const up = o.helm === 'flowhair';
    const pts = up ? [H(6, -8), H(0, -12), H(-10, -12), H(-22, -24), H(-30, -48), H(-26, -78), H(-18, -50), H(-12, -30), H(-6, -12), H(-4, 0)]
      : [H(6, -8), H(0, -12), H(-9, -9), H(-12, 4), H(-15, 22), H(-22, 44), H(-12, 38), H(-9, 46), H(-4, 30), H(-3, 12), H(-2, 2)];
    let s = shape(F, cr(pts, true, 0.9), F.rad(K.hair));
    for (let i = 0; i < 6; i++) s += up ? qd(H(2 - i * 2, -10), H(-20 - i * 2, -30 - i * 3), H(-24 + i * 2, -70 + i * 6), i % 2 ? hil(K.hair) : shd2(K.hair), i % 2 ? 0.6 : 0.9, 0.7)
      : qd(H(2 - i * 2, -9), H(-11 - i, 10 + i * 3), H(-18 + i * 2, 40 - i * 3), i % 2 ? hil(K.hair) : shd2(K.hair), i % 2 ? 0.6 : 0.9, 0.7);
    return s;
  }
  function boneLimb(F, a, b, w, col) {
    return shape(F, limbD(a, b, w, w, -0.45), F.lin(a, b, col, 'skin')) + `<circle cx="${n1(a[0])}" cy="${n1(a[1])}" r="${n1(w * 0.72)}" fill="${F.rad(col)}" stroke="${OL}" stroke-width=".7"/><circle cx="${n1(b[0])}" cy="${n1(b[1])}" r="${n1(w * 0.68)}" fill="${F.rad(col)}" stroke="${OL}" stroke-width=".7"/>`;
  }
  function bootPart(F, f, dir, lw, K) {
    const P = (dx, dy) => [f[0] + dx * dir * lw, f[1] + dy * lw], mat = K.mat;
    const col = mat === 'plate' ? K.metal : mat === 'hide' ? K.fur : mat === 'bone' ? K.bone : K.leather2;
    const kind = mat === 'plate' ? 'metal' : 'cloth';
    let s = shape(F, cr([P(-4.6, -13.6), P(3.8, -14), P(4.6, -7.6), P(9.6, -5), P(13.4, -2.2), P(13, 0.6), P(-5.2, 0.6), P(-5.7, -5.4)], true, 0.8), F.rad(col, kind));
    s += line(P(-5.2, -0.4), P(13, -0.4), '#120a06', 1.9) + qd(P(5.2, -8), P(6.6, -4), P(7, -0.6), shd2(col), 0.7, 0.6) + qd(P(7.4, -6.4), P(9.2, -3.2), P(9.4, -0.6), shd2(col), 0.5, 0.4) + ao(P(0, -13), 5 * lw, 2.4 * lw, 0.9);
    if (mat === 'plate') {
      for (let i = 0; i < 3; i++) s += qd(P(3 + i * 3, -9 + i * 1.6), P(5 + i * 3, -6.4 + i * 1.6), P(5.4 + i * 3, -3 + i), OL, 0.7, 0.8);
      s += qd(P(8, -5.4), P(11, -4.4), P(13, -1.6), hil2(col), 0.9, 0.8) + line(P(-4.4, -13.4), P(3.8, -13.8), K.trim, 1.3);
    } else if (mat === 'hide') {
      for (let i = 0; i < 7; i++) s += line(P(-5 + i * 1.5, -15.2), P(-5.6 + i * 1.5, -11.2), i % 2 ? hil(col) : shd2(col), 1.3, 0.9);
      s += line(P(-4, -6), P(5, -7), '#2a180c', 1.2, 0.8);
    } else {
      s += shape(F, cr([P(-5.2, -15.2), P(4.4, -15.6), P(4.6, -12.2), P(-5.2, -11.8)], true, 0.6), F.rad(K.leather));
      s += line(P(0.6, -9), P(5.6, -6.6), '#1a0e06', 1.5) + `<rect x="${n1(P(3.2, -8.2)[0] - 0.9)}" y="${n1(P(3.2, -8.2)[1] - 0.9)}" width="1.8" height="1.8" fill="none" stroke="${K.trim}" stroke-width=".6"/>`;
      s += qd(P(8, -5), P(11, -4.2), P(12.6, -1.8), hil(col), 0.8, 0.7);
    }
    return s;
  }
  function legPart(F, J, R, K, o, side) {
    const lw = R.limb, hp = side < 0 ? F.hipL : F.hipR, k = side < 0 ? J.kL : J.kR, f = side < 0 ? J.fL : J.fR, mat = K.mat;
    const ank = add(f, 0, -5 * lw), dir = o.feetDir || (Math.abs(f[0] - J.pv[0]) < 5 ? 1 : Math.sign(f[0] - J.pv[0]));
    const tw = 13.6 * lw, kw = 10 * lw, aw = 7.8 * lw;
    let s = '';
    if (mat === 'bone') return boneLimb(F, hp, k, 3.6 * lw, K.bone) + boneLimb(F, k, ank, 3.2 * lw, K.bone) + bootPart(F, f, dir, lw * 0.8, K);
    const thighCol = mat === 'plate' ? K.metal : mat === 'mail' ? K.mail : mat === 'hide' ? K.leather : K.leather2;
    s += limb(F, hp, k, tw, kw, thighCol, mat === 'plate' ? 'metal' : 'cloth', 0.12);
    if (mat === 'mail') s += `<path d="${limbD(hp, k, tw, kw, 0.12)}" fill="url(#pMailC)"/>`;
    if (mat === 'leather' || mat === 'hide') s += qd(lerp(hp, k, 0.15), add(lerp(hp, k, 0.55), side * 1.5, 0), lerp(hp, k, 0.92), shd2(thighCol), 1, 0.6);
    const shinCol = mat === 'plate' ? K.metal : mat === 'hide' ? K.skin : K.leather;
    s += limb(F, k, ank, kw * 0.96, aw, shinCol, mat === 'plate' ? 'metal' : mat === 'hide' ? 'skin' : 'cloth', 0.18);
    if (mat === 'plate') {
      const n = litN(k, ank);
      s += line(sum(lerp(k, ank, 0.18), mul(n, kw * 0.12)), sum(lerp(k, ank, 0.92), mul(n, aw * 0.12)), hil2(K.metal), 0.9, 0.75);
      s += band(F, hp, k, 0.62, 0.78, tw, kw, K.metal, 'metal', 1.08) + band(F, hp, k, 0.78, 0.94, tw, kw, K.metal, 'metal', 1.06);
      s += `<path d="${cr([add(k, -side * 2, -6 * lw), add(k, side * 7.6 * lw, -3 * lw), add(k, side * 8.4 * lw, 2 * lw), add(k, side * 2, 5 * lw)], true, 0.8)}" fill="${F.rad(K.metal, 'metal')}" stroke="${OL}" stroke-width=".8"/>`;
      s += `<ellipse cx="${n1(k[0])}" cy="${n1(k[1])}" rx="${n1(6.4 * lw)}" ry="${n1(5.4 * lw)}" fill="${F.rad(K.metal, 'metal')}" stroke="${OL}" stroke-width=".9"/><ellipse cx="${n1(k[0])}" cy="${n1(k[1])}" rx="${n1(6.4 * lw)}" ry="${n1(5.4 * lw)}" fill="none" stroke="${K.trim}" stroke-width=".9" opacity=".9"/>` + rivet(k, 1.2 * lw);
    } else if (mat === 'hide') {
      for (let i = 0; i < 4; i++) s += band(F, k, ank, 0.12 + i * 0.13, 0.19 + i * 0.13, kw, aw, K.leather2, 'cloth', 1.06);
      s += `<ellipse cx="${n1(k[0])}" cy="${n1(k[1] - 1)}" rx="${n1(5.6 * lw)}" ry="${n1(4.6 * lw)}" fill="${F.rad(K.leather)}" stroke="${OL}" stroke-width=".8"/>` + dot(k, 1.1 * lw, K.trim);
    } else {
      s += band(F, k, ank, 0.4, 1, kw, aw, K.leather2, 'cloth', 1.12);
      s += `<ellipse cx="${n1(k[0])}" cy="${n1(k[1] - 0.5)}" rx="${n1(5.8 * lw)}" ry="${n1(4.8 * lw)}" fill="${F.rad(K.leather)}" stroke="${OL}" stroke-width=".8"/>` + `<ellipse cx="${n1(k[0])}" cy="${n1(k[1] - 0.5)}" rx="${n1(4.4 * lw)}" ry="${n1(3.4 * lw)}" fill="none" stroke="#e8c890" stroke-width=".5" stroke-dasharray="1 1" opacity=".8"/>`;
    }
    return s + bootPart(F, f, dir, lw, K);
  }
  function skirtPart(F, J, R, K, o) {
    if (o.robe || o.skirt === false) return '';
    const pv = J.pv, w = R.w, mat = K.mat, V = (x, y) => add(pv, x * w, y);
    let s = '';
    const tabard = (len) => {
      let t = shape(F, cr([V(-6.6, -6), V(6.6, -6), V(7.8, len), V(0, len - 5), V(-7.8, len)], true, 0.5), F.lin(V(-8, 0), V(8, -4), K.cloth, 'cloth'));
      t += `<path d="M${pt(V(-7.8, len))}L${pt(V(0, len - 5))}L${pt(V(7.8, len))}" stroke="${K.trim}" stroke-width="1.3" fill="none"/>` + line(V(-6.2, -4), V(-7.3, len - 1.5), K.trim, 0.9, 0.9) + line(V(6.2, -4), V(7.3, len - 1.5), K.trim, 0.9, 0.9);
      t += qd(V(1.4, 0), V(2.6, len * 0.5), V(1.2, len - 6), shd2(K.cloth), 1.6, 0.5);
      if (o.emblem) t += sun(V(0, len * 0.42), 4.2, o.emblem); else if (K.clan) t += `<path d="M${pt(V(-3, len * 0.3))}L${pt(V(3, len * 0.55))}M${pt(V(3, len * 0.3))}L${pt(V(-3, len * 0.55))}" stroke="${K.trim}" stroke-width="1.4"/>`;
      return t;
    };
    if (mat === 'plate') {
      for (const sd of [-1, 1]) {
        const d = cr([V(sd * 3, -7), V(sd * 14.5, -7), V(sd * 16.5, 15), V(sd * 9.5, 20), V(sd * 3, 15)], true, 0.6);
        s += shape(F, d, F.rad(K.metal, 'metal')) + qd(V(sd * 3.6, 0), V(sd * 10, 2), V(sd * 15.4, 0), OL, 0.8) + qd(V(sd * 3.8, 7.4), V(sd * 10, 9.4), V(sd * 16, 7.4), OL, 0.8) + qd(V(sd * 4, 1.2), V(sd * 10, 3.2), V(sd * 15.4, 1.2), hil2(K.metal), 0.6, 0.8);
        s += qd(V(sd * 3.4, 15.4), V(sd * 9, 21.4), V(sd * 16.2, 15.4), K.trim, 1.1) + rivet(V(sd * 13.6, -3.6), 1);
      }
      s += tabard(36);
    } else if (mat === 'mail') {
      const hem = []; for (let i = 0; i <= 8; i++) hem.push(V(16 - i * 4, 22 + (i % 2) * 2.4));
      s += shape(F, cr([V(-14, -7), V(14, -7), V(16.5, 8), ...hem, V(-16.5, 8)], true, 0.5), K.mail) + `<path d="${cr([V(-14, -7), V(14, -7), V(16.5, 8), ...hem, V(-16.5, 8)], true, 0.5)}" fill="url(#pMailC)"/>`;
      s += tabard(34);
    } else if (mat === 'leather') {
      for (let i = 0; i < 4; i++) { const x = -13 + i * 7.4; s += shape(F, cr([V(x, -6), V(x + 6.6, -6), V(x + 7.2, 15), V(x + 3.4, 18), V(x - 0.4, 15)], true, 0.5), F.rad(i % 2 ? K.leather : mix(K.leather, '#000', 0.2))) + dot(V(x + 3.3, 1), 0.9, K.trim) + dot(V(x + 3.4, 9), 0.9, K.trim) + line(V(x + 1, 13), V(x + 5.8, 13), '#e8c890', 0.5, 0.7, ' stroke-dasharray="1 1"'); }
    } else if (mat === 'hide') {
      for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const x = sd * (8 + i * 3.4); s += shape(F, cr([V(x - 1.6, -6), V(x + 1.6, -6), V(x + 2.2 * sd, 16 - i * 2), V(x, 19 - i * 2)], true, 0.6), F.rad(K.leather)); }
      s += shape(F, cr([V(-7.4, -6), V(7.4, -6), V(8.6, 26), V(0, 30), V(-8.6, 26)], true, 0.6), F.lin(V(-8, 0), V(8, -4), K.cloth, 'cloth'));
      for (let i = 0; i < 9; i++) { const x = -8.6 + i * 2.15; s += line(V(x, 24 + Math.abs(i - 4) * 0.6), V(x + (i % 2 ? 0.8 : -0.8), 30.5 + Math.abs(i - 4) * 0.5), i % 2 ? hil(K.fur) : K.fur, 2.2); }
      s += line(V(-6, 12), V(6, 12), K.trim, 0.9, 0.8) + `<path d="M${pt(V(4.6, -2))}l1.4,6l1.4,-6" fill="${K.bone}" stroke="${OL}" stroke-width=".5"/><path d="M${pt(V(-6.4, -2))}l1.2,5l1.2,-5" fill="${K.bone}" stroke="${OL}" stroke-width=".5"/>`;
    } else if (mat === 'bone') {
      for (let i = 0; i < 5; i++) { const x = -10 + i * 5; s += `<path d="${cr([V(x - 2, -6), V(x + 2.6, -6), V(x + 3, 14 + (i % 2) * 6), V(x + 1, 22 - (i % 3) * 3), V(x - 1.4, 12)], true, 0.6)}" fill="${mix(K.cloth, '#000', 0.3)}" stroke="${OL}" stroke-width=".6" opacity=".9"/>`; }
    }
    return s;
  }
  function robePart(F, J, R, K, o, r) {
    const pv = J.pv, w = R.w, top = pv[1] - 8, hw = 12.5 * w, fl = 31 * w;
    const hem = []; const n = 8;
    for (let i = 0; i <= n; i++) { const x = pv[0] + fl - (2 * fl) * i / n; hem.push([x, o.tatter ? (i % 2 ? -13 + r() * 4 : 0) : (i % 2 ? -3.4 : 0.6)]); }
    const pts = [[pv[0] - hw, top], [pv[0] + hw, top], [pv[0] + hw * 1.28, top * 0.55], [pv[0] + fl * 0.93, -24], ...hem, [pv[0] - fl * 0.93, -24], [pv[0] - hw * 1.28, top * 0.55]];
    let s = '';
    // toes peeking under the hem
    s += `<ellipse cx="${n1(J.fL[0] - 3)}" cy="-1" rx="6" ry="3" fill="${K.leather2}" stroke="${OL}" stroke-width=".8"/><ellipse cx="${n1(J.fR[0] + 3)}" cy="-1" rx="6" ry="3" fill="${K.leather2}" stroke="${OL}" stroke-width=".8"/>`;
    s += shape(F, cr(pts, true, 0.85), F.lin([pv[0] - fl, -30], [pv[0] + fl, -60], K.cloth, 'cloth'));
    const cid = nid(); F.defs.push(`<clipPath id="${cid}"><path d="${cr(pts, true, 0.85)}"/></clipPath>`);
    let inner = '';
    const panel = mix(K.cloth, K.trim, 0.18);
    inner += `<path d="${cr([[pv[0] - 3, top], [pv[0] + 5, top], [pv[0] + 12 * w, 4], [pv[0] - 10 * w, 4]], true, 0.4)}" fill="${F.lin([pv[0] - 10, 0], [pv[0] + 12, -20], panel, 'cloth')}"/>`;
    inner += line([pv[0] - 3, top + 2], [pv[0] - 10 * w, 2], K.trim, 1.4) + line([pv[0] + 5, top + 2], [pv[0] + 12 * w, 2], K.trim, 1.4);
    for (let y = top + 12; y < -8; y += 9) inner += `<path d="M${n1(pv[0] + 1.2)},${n1(y - 3)}l2.6,3l-2.6,3l-2.6,-3z" fill="${K.trim}" stroke="${OL}" stroke-width=".4"/>`;
    for (let i = 0; i <= 6; i++) {
      const t = i / 6, a = [pv[0] - hw * 0.95 + 1.9 * hw * 0.95 * t, top + 6], b = [pv[0] - fl * 0.9 + 1.8 * fl * 0.9 * t, -2], m = [(a[0] + b[0]) / 2 + (r() - 0.5) * 7, (a[1] + b[1]) / 2];
      inner += qd(a, m, b, shd2(K.cloth), i % 2 ? 2.6 : 1.4, 0.55) + (i % 2 ? qd(add(a, 1.8, 0), add(m, 2.2, 0), add(b, 2.4, 0), hil(K.cloth), 0.8, 0.5) : '');
    }
    for (let i = 0; i < 14; i++) { const x0 = pv[0] - fl * 0.92 + i * 3.2, y0 = -8 - (i % 3) * 5; inner += line([x0, y0], [x0 - 2.2, y0 - 12 - (i % 2) * 6], shd2(K.cloth), 0.45, 0.4); }
    for (let i = 0; i < 10; i++) { const x0 = pv[0] + fl * 0.45 + i * 2.6, y0 = -6 - (i % 3) * 4; inner += line([x0, y0], [x0 + 1.6, y0 - 10 - (i % 2) * 5], shd2(K.cloth), 0.4, 0.35); }
    inner += `<path d="${cr(hem.map(p => add(p, 0, -3.2)), false)}" stroke="${K.trim}" stroke-width="2.6" fill="none"/><path d="${cr(hem.map(p => add(p, 0, -3.2)), false)}" stroke="${shd2(K.trim)}" stroke-width=".9" fill="none" stroke-dasharray="2 2.4"/>`;
    s += `<g clip-path="url(#${cid})">${inner}</g>`;
    return s;
  }
  function torsoPts(J, R, bulk) {
    const w = R.w, b = w * bulk, ch = J.ch, pv = J.pv, sL = J.sL, sR = J.sR, nk = J.nk;
    return [[nk[0] - 5 * w, nk[1] + 3], [sL[0] + 1, sL[1] - 2.5], [sL[0] - 3 * w, sL[1] + 6], [ch[0] - 15.5 * b, ch[1] + 3], [pv[0] - 11 * w, pv[1] - 14], [pv[0] - 12.5 * w, pv[1] + 1], [pv[0], pv[1] + 3],
      [pv[0] + 12.5 * w, pv[1] + 1], [pv[0] + 11 * w, pv[1] - 14], [ch[0] + 15.5 * b, ch[1] + 3], [sR[0] + 3 * w, sR[1] + 6], [sR[0] - 1, sR[1] - 2.5], [nk[0] + 5 * w, nk[1] + 3]];
  }
  function torsoPart(F, J, R, K, o, r) {
    const mat = K.mat, w = R.w, ch = J.ch, pv = J.pv, nk = J.nk;
    const bulk = { orc: 1.12, minotaur: 1.16, giant: 1.12, goblin: 0.92 }[K.race] || 1;
    const d = cr(torsoPts(J, R, bulk), true, 0.95), cid = nid();
    F.defs.push(`<clipPath id="${cid}"><path d="${d}"/></clipPath>`);
    const C = (x, y) => add(ch, x * w, y), base = { plate: K.metal, mail: K.mail, leather: K.leather, hide: K.skin, cloth: K.cloth, bone: '#120e0c' }[mat];
    let s = shape(F, d, mat === 'bone' ? '#120e0c' : F.rad(base, mat === 'plate' ? 'metal' : ''), mat === 'bone' ? ' fill-opacity=".55"' : '');
    let inner = '';
    if (mat === 'plate') {
      for (const sd of [-1, 1]) inner += shape(F, cr([C(sd * 1, -12), C(sd * 11.5, -11.5), C(sd * 15, -3), C(sd * 9.5, 5.4), C(sd * 1, 3.4)], true, 0.9), F.rad(K.metal, 'metal'), ' stroke-width=".8"');
      inner += line(C(0, -13), add(pv, 0, -15), OL, 1.2) + line(C(0.8, -13), add(pv, 0.8, -15), hil2(K.metal), 0.6, 0.9);
      for (let i = 0; i < 3; i++) { const y = ch[1] + 9 + i * 6.4, hw = (13.6 - i) * w; inner += `<path d="M${n1(ch[0] - hw)},${n1(y)}Q${n1(ch[0])},${n1(y + 3.4)} ${n1(ch[0] + hw)},${n1(y)}L${n1(ch[0] + hw)},${n1(y + 5.4)}Q${n1(ch[0])},${n1(y + 8.8)} ${n1(ch[0] - hw)},${n1(y + 5.4)}Z" fill="${F.rad(K.metal, 'metal')}" stroke="${OL}" stroke-width=".7"/>` + rivet([ch[0] - hw + 2.4, y + 3], 0.9) + rivet([ch[0] + hw - 2.4, y + 3], 0.9); }
      inner += o.emblem ? `<circle cx="${n1(ch[0])}" cy="${n1(ch[1] - 3)}" r="6.4" fill="${F.rad(K.trim, 'metal')}" stroke="${OL}" stroke-width=".7"/>` + sun(C(0, -3), 5, mix(o.emblem, '#fff', 0.2)) : K.clan ? skull(C(0, -3), 4.6, K.bone) : dot(C(0, -3), 2.6, o.gem || '#c8243a') + dot(C(-0.7, -3.7), 0.8, '#fff');
    } else if (mat === 'mail') {
      inner += `<rect x="${n1(ch[0] - 30)}" y="${n1(nk[1])}" width="60" height="${n1(pv[1] - nk[1] + 6)}" fill="url(#pMailC)"/>`;
      inner += shape(F, cr([C(-9, -11), C(9, -11), add(pv, 10.4 * w, -6), add(pv, -10.4 * w, -6)], true, 0.3), F.lin(C(-10, 0), C(10, -6), K.cloth, 'cloth'));
      inner += line(C(-8.6, -10.4), add(pv, -10 * w, -6.4), K.trim, 1) + line(C(8.6, -10.4), add(pv, 10 * w, -6.4), K.trim, 1);
      inner += o.emblem ? sun(C(0, 0), 5, o.emblem) : K.clan ? `<path d="M${pt(C(-3.4, -3))}L${pt(C(3.4, 4))}M${pt(C(3.4, -3))}L${pt(C(-3.4, 4))}" stroke="${K.trim}" stroke-width="1.6"/>` + `<circle cx="${n1(ch[0])}" cy="${n1(ch[1] - 5)}" r="3" fill="none" stroke="${K.trim}" stroke-width="1"/>` : line(C(0, -9), C(0, 9), K.trim, 2) + line(C(-5, -2), C(5, -2), K.trim, 2);
    } else if (mat === 'leather') {
      inner += `<rect x="${n1(ch[0] - 30)}" y="${n1(nk[1])}" width="60" height="${n1(pv[1] - nk[1] + 6)}" fill="url(#pGrainC)"/>`;
      inner += line(C(-13, -8), add(pv, -10 * w, -10), '#e8c890', 0.6, 0.8, ' stroke-dasharray="1.4 1.2"') + line(C(13, -8), add(pv, 10 * w, -10), '#e8c890', 0.6, 0.8, ' stroke-dasharray="1.4 1.2"');
      for (let i = 0; i < 5; i++) { const y = ch[1] - 8 + i * 5; inner += line([ch[0] - 2.4, y], [ch[0] + 2.4, y + 3], '#e0c088', 0.8) + line([ch[0] + 2.4, y], [ch[0] - 2.4, y + 3], '#e0c088', 0.8); }
      inner += line(add(J.sR, -1, 2), add(pv, -11 * w, -10), '#2a180c', 4.4) + line(add(J.sR, -1, 2), add(pv, -11 * w, -10), K.leather2, 3) + line(add(J.sR, -0.4, 1.2), add(pv, -10.4 * w, -10.8), hil(K.leather2), 0.6, 0.9);
      const bk = lerp(add(J.sR, -1, 2), add(pv, -11 * w, -10), 0.42);
      inner += `<rect x="${n1(bk[0] - 2.2)}" y="${n1(bk[1] - 2.2)}" width="4.4" height="4.4" rx=".6" fill="none" stroke="${K.trim}" stroke-width="1.1" transform="rotate(-48 ${n1(bk[0])} ${n1(bk[1])})"/>`;
      const sh = lerp(add(J.sR, -1, 2), add(pv, -11 * w, -10), 0.72);
      inner += `<path d="M${pt(add(sh, -1.4, -3))}l2.8,0l-.4,9l-1,1.6l-1,-1.6z" fill="#2a1a10" stroke="${OL}" stroke-width=".5"/>` + line(add(sh, 0, -3.4), add(sh, 0, -6), '#c8c8d0', 1.2);
    } else if (mat === 'hide') {
      const sk = K.skin;
      for (const sd of [-1, 1]) inner += `<path d="${cr([C(sd * 0.6, -11), C(sd * 11, -10.6), C(sd * 14.6, -3.4), C(sd * 9.6, 3.6), C(sd * 0.8, 2)], true, 0.9)}" fill="${F.rad(sk, 'skin')}" stroke="${shd2(sk)}" stroke-width=".9"/>`;
      for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) inner += `<ellipse cx="${n1(ch[0] + sd * 3.4 * w)}" cy="${n1(ch[1] + 8.6 + i * 6.2)}" rx="${n1(3 * w)}" ry="2.6" fill="${F.rad(sk, 'skin')}" stroke="${shd2(sk)}" stroke-width=".6"/>`;
      inner += qd(C(-11, 6), C(-10, 14), add(pv, -9 * w, -12), shd2(sk), 1, 0.6) + qd(C(11, 6), C(10, 14), add(pv, 9 * w, -12), shd2(sk), 1, 0.6);
      if (K.race === 'minotaur') for (let i = 0; i < 22; i++) inner += line(C(-10 + r() * 20, -10 + r() * 14), add(C(-10 + r() * 20, -10 + r() * 14), 0.8, 3), i % 2 ? hil(sk) : shd2(sk), 0.6, 0.7);
      if (K.race === 'orc') inner += qd(C(3, -9), C(7, -5), C(9, 1), hil2(sk), 0.6, 0.7) + qd(C(-8, 4), C(-5, 9), C(-1, 11), hil2(sk), 0.5, 0.6);
      const pc = o.paint || (K.race === 'orc' ? '#c8321e' : K.race === 'minotaur' ? '#f0e6c8' : '#3a9ad0');
      inner += line(C(5, -10), C(9.4, 1), pc, 1.6, 0.8) + line(C(8.4, -11), C(12.6, -1), pc, 1.2, 0.75);
      for (const [a, b] of [[add(J.sL, 3, 1), add(pv, 11 * w, -11)], [add(J.sR, -3, 1), add(pv, -11 * w, -11)]]) inner += line(a, b, '#24140a', 4.6) + line(a, b, K.leather, 3.2) + line(add(a, 0.4, -0.8), add(b, 0.4, -0.8), hil(K.leather), 0.6, 0.9);
      inner += `<circle cx="${n1(ch[0])}" cy="${n1(ch[1] + 3)}" r="3.6" fill="none" stroke="${K.metal}" stroke-width="1.8"/>` + (K.clan ? skull(C(0, 3), 3, K.bone) : dot(C(0, 3), 2, K.trim));
    } else if (mat === 'cloth') {
      inner += `<rect x="${n1(ch[0] - 30)}" y="${n1(nk[1])}" width="60" height="${n1(pv[1] - nk[1] + 6)}" fill="url(#pWeave)" opacity=".16"/>`;
      inner += `<path d="M${pt(C(-6, -13))}L${pt(C(0, 2))}L${pt(C(6, -13))}Z" fill="${o.shirt || '#e8dcc0'}" stroke="${OL}" stroke-width=".6"/>` + line(C(-6, -13), C(0, 2.4), K.trim, 1.4) + line(C(6, -13), C(0, 2.4), K.trim, 1.4);
      inner += shape(F, cr([add(J.sL, -2, -2), add(J.sR, 2, -2), C(14, 2), C(6, -2), C(0, 4), C(-6, -2), C(-14, 2)], true, 0.7), F.lin(C(-14, 0), C(14, -10), K.cloth2, 'cloth'));
      inner += `<path d="${cr([C(-14, 2), C(-6, -2), C(0, 4), C(6, -2), C(14, 2)], false)}" stroke="${K.trim}" stroke-width="1.2" fill="none"/>` + `<circle cx="${n1(ch[0])}" cy="${n1(ch[1] + 4)}" r="2.6" fill="${F.rad(o.gem || '#7ad0ff')}" stroke="${K.trim}" stroke-width="1"/>`;
      inner += qd(C(-10, 8), C(-8, 16), add(pv, -9 * w, -10), shd2(K.cloth), 1.4, 0.5) + qd(C(10, 8), C(8.6, 16), add(pv, 9 * w, -10), shd2(K.cloth), 1.4, 0.5);
    } else if (mat === 'bone') {
      inner += line(add(nk, 0, 4), add(pv, 0, -2), K.bone, 3) + line(add(nk, 0, 4), add(pv, 0, -2), OL, 3.4, 0.5, ' stroke-dasharray=".6 2.2"');
      for (let i = 0; i < 5; i++) { const y = ch[1] - 9 + i * 5.2, hw = (12.6 - i * 1.1) * w; for (const sd of [-1, 1]) inner += `<path d="M${n1(ch[0])},${n1(y)}Q${n1(ch[0] + sd * hw)},${n1(y - 2)} ${n1(ch[0] + sd * hw * 0.9)},${n1(y + 4)}" stroke="${OL}" stroke-width="3" fill="none"/><path d="M${n1(ch[0])},${n1(y)}Q${n1(ch[0] + sd * hw)},${n1(y - 2)} ${n1(ch[0] + sd * hw * 0.9)},${n1(y + 4)}" stroke="${K.bone}" stroke-width="1.9" fill="none"/>`; }
      inner += `<path d="${cr([add(pv, -10 * w, -6), add(pv, 0, -9), add(pv, 10 * w, -6), add(pv, 6 * w, 2), add(pv, 0, -1), add(pv, -6 * w, 2)], true, 0.8)}" fill="${F.rad(K.bone)}" stroke="${OL}" stroke-width=".8"/>`;
    }
    inner += ao(add(J.sL, 1, 6), 7 * w, 5, 0.8, 40) + ao(add(J.sR, -1, 6), 7 * w, 5, 0.8, -40) + ao(add(nk, 0, 7), 9 * w, 4, 0.75) + ao(add(pv, 0, -4), 11 * w, 3.4, 0.5);
    // the near arm's cast shadow on the flank
    inner += `<path d="${cr([add(J.sR, -3, 6), add(J.sR, -9 * w, 12), add(pv, 6 * w, -8), add(pv, 10 * w, -14)], true, 0.6)}" fill="#000" opacity=".16" filter="url(#b2)"/>`;
    s += `<g clip-path="url(#${cid})">${inner}<path d="${d}" fill="url(#figSide)" opacity=".55"/></g>`;
    // gorget / collar
    if (mat === 'plate') s += shape(F, `M${pt(add(nk, -8.6 * w, 5))}Q${pt(add(nk, 0, 13))} ${pt(add(nk, 8.6 * w, 5))}L${pt(add(nk, 6 * w, 0.6))}Q${pt(add(nk, 0, 7))} ${pt(add(nk, -6 * w, 0.6))}Z`, F.rad(K.metal, 'metal')) + qd(add(nk, -8.2 * w, 5.4), add(nk, 0, 13.2), add(nk, 8.2 * w, 5.4), K.trim, 1.1);
    if (mat === 'leather') s += shape(F, `M${pt(add(nk, -7 * w, 5))}Q${pt(add(nk, 0, 10))} ${pt(add(nk, 7 * w, 5))}L${pt(add(nk, 6 * w, -1))}Q${pt(add(nk, 0, 4))} ${pt(add(nk, -6 * w, -1))}Z`, F.rad(K.leather2));
    return s;
  }
  function beltPart(F, J, R, K, o) {
    const pv = J.pv, w = R.w, y = pv[1] - 8, mat = K.mat;
    if (mat === 'bone') return '';
    if (mat === 'cloth') {
      const sc = o.sash || mix(K.trim, K.cloth, 0.3);
      return shape(F, `M${n1(pv[0] - 13.4 * w)},${n1(y - 3)}Q${n1(pv[0])},${n1(y - 0.6)} ${n1(pv[0] + 13.4 * w)},${n1(y - 3)}L${n1(pv[0] + 13.6 * w)},${n1(y + 3)}Q${n1(pv[0])},${n1(y + 5.4)} ${n1(pv[0] - 13.6 * w)},${n1(y + 3)}Z`, F.hor(sc, 'cloth')) +
        shape(F, cr([[pv[0] + 5, y], [pv[0] + 9, y + 2], [pv[0] + 8, y + 18], [pv[0] + 5.4, y + 20], [pv[0] + 4.6, y + 6]], true, 0.7), F.hor(sc, 'cloth')) + `<circle cx="${n1(pv[0] + 5.6)}" cy="${n1(y + 1)}" r="2.4" fill="${F.rad(sc)}" stroke="${OL}" stroke-width=".7"/>`;
    }
    let s = shape(F, `M${n1(pv[0] - 13 * w)},${n1(y - 3)}Q${n1(pv[0])},${n1(y - 0.4)} ${n1(pv[0] + 13 * w)},${n1(y - 3)}L${n1(pv[0] + 13.2 * w)},${n1(y + 2.8)}Q${n1(pv[0])},${n1(y + 5.4)} ${n1(pv[0] - 13.2 * w)},${n1(y + 2.8)}Z`, F.hor(K.leather2, 'cloth'));
    s += `<path d="M${n1(pv[0] - 12.6 * w)},${n1(y - 1.4)}Q${n1(pv[0])},${n1(y + 1.2)} ${n1(pv[0] + 12.6 * w)},${n1(y - 1.4)}" stroke="#e8c890" stroke-width=".5" fill="none" stroke-dasharray="1.2 1.2" opacity=".75"/>`;
    for (const sd of [-1, 1]) s += dot([pv[0] + sd * 9 * w, y - 0.6], 0.9, K.trim);
    if (K.clan && (mat === 'hide' || mat === 'mail' || mat === 'plate')) s += skull([pv[0], y + 0.8], 4.6, K.bone) + `<path d="M${pt([pv[0] - 5.4, y + 1])}l-2.6,1.6l2.6,1M${pt([pv[0] + 5.4, y + 1])}l2.6,1.6l-2.6,1" stroke="${K.metal}" stroke-width="1.2" fill="none"/>`;
    else s += `<rect x="${n1(pv[0] - 4)}" y="${n1(y - 3.4)}" width="8" height="7" rx="1.2" fill="${F.rad(K.trim, 'metal')}" stroke="${OL}" stroke-width=".8"/><rect x="${n1(pv[0] - 2)}" y="${n1(y - 1.6)}" width="4" height="3.4" fill="${shd2(K.leather2)}"/>` + dot([pv[0], y], 0.9, o.gem || '#d8304a');
    if (mat !== 'plate') {
      s += shape(F, cr([[pv[0] - 11.6 * w, y + 1], [pv[0] - 6.4 * w, y + 1], [pv[0] - 6 * w, y + 9], [pv[0] - 9 * w, y + 10.4], [pv[0] - 12 * w, y + 9]], true, 0.6), F.rad(K.leather)) + line([pv[0] - 11.6 * w, y + 4], [pv[0] - 6.4 * w, y + 4], shd2(K.leather), 0.8) + dot([pv[0] - 9 * w, y + 5.2], 0.8, K.trim);
      s += `<path d="M${n1(pv[0] + 8 * w)},${n1(y + 2)}l3,0l.4,2.4q2,2 1.4,5q-2,3 -4.6,0q-.6,-3 1.4,-5z" fill="${o.potion || '#d83040'}" stroke="${OL}" stroke-width=".6"/><rect x="${n1(pv[0] + 8.4 * w)}" y="${n1(y)}" width="2.2" height="2.4" fill="#8a5a30"/>` + dot([pv[0] + 8.4 * w + 0.6, y + 6.4], 0.6, '#fff', 0.8);
    }
    return s;
  }
  // face in "head units": 10 = head radius, x faces right (3/4 view)
  const HEADS = {
    human: [[0, -10.4], [5.2, -9.4], [8.2, -6], [8.8, -3.2], [9.9, 0.2], [9, 1.6], [8.8, 3.8], [7.4, 6.6], [4.6, 9.6], [1.4, 10.4], [-3.2, 8.6], [-6.6, 5.4], [-8.8, 0.6], [-8.6, -5], [-5.6, -9]],
    elf: [[0, -10.6], [5, -9.6], [7.8, -6], [8.4, -3], [9.4, 0.4], [8.5, 1.8], [8.2, 4], [6.6, 7.4], [3.6, 10.8], [0.6, 10.6], [-3.4, 8], [-6.4, 5], [-8.2, 0.4], [-8.2, -5], [-5.2, -9.2]],
    dwarf: [[0, -9.6], [6, -8.6], [9, -5], [9.6, -2.6], [11.6, 0.4], [11.4, 3.2], [9, 3.6], [8.4, 6], [6, 9.4], [1, 10.4], [-4, 8.8], [-8, 5], [-9.6, 0], [-9.2, -5.4], [-5.8, -8.8]],
    orc: [[0, -9.6], [5.4, -8.8], [8.4, -6.2], [9.8, -4], [9.2, -2.4], [10.8, 0.4], [10.4, 2.4], [10.8, 5.4], [9.6, 9.4], [5, 11.4], [-0.4, 11], [-5, 8.8], [-8.4, 4.6], [-9.6, -0.6], [-8.8, -6], [-5.4, -9]],
    goblin: [[0, -10.4], [5.6, -9.2], [8.6, -5.8], [9.2, -3.4], [14.6, 1.4], [13.8, 2.8], [9.2, 2.8], [9, 5], [6.6, 8.4], [2, 9.6], [-3.6, 8.2], [-7.6, 4.4], [-9.6, -1], [-9, -6], [-5.4, -9.6]],
    minotaur: [[0, -9.6], [5, -8.6], [8.4, -5.4], [11.4, -2], [15.2, 0.8], [16.6, 3.8], [15.8, 7.2], [12, 8.6], [8, 9.8], [3, 10.2], [-2, 9.2], [-6.6, 6], [-9, 1], [-8.8, -5], [-5.4, -8.8]],
    skeleton: [[0, -10], [5.2, -9.2], [8.4, -5.6], [9, -2], [8.6, 1.6], [8.8, 3.6], [7.6, 5], [7.4, 8], [4, 9.4], [0.4, 8.6], [-2.4, 6.4], [-6.4, 4.6], [-8.8, 0], [-8.6, -5.2], [-5.4, -9.2]],
    fish: [[0, -9.6], [5, -8.8], [9, -5.6], [11.8, -1.8], [13.2, 1.6], [11.4, 2.8], [12.8, 4.6], [10, 8.6], [4, 10.4], [-2, 9.6], [-6.6, 6], [-9, 1], [-8.6, -5], [-5.4, -9]],
  };
  HEADS.giant = HEADS.human;
  function headPart(F, J, R, K, o) {
    const hd = J.hd, k = R.head / 10, H = (x, y) => add(hd, x * k, y * k), race = K.race;
    const pts = (HEADS[race] || HEADS.human).map(p => H(p[0], p[1]));
    const skin = race === 'skeleton' ? K.bone : K.skin, helm = o.helm, eye = K.eye;
    const faceShown = helm !== 'great' && helm !== 'hood';
    let s = '';
    // neck
    s += limb(F, add(J.nk, 0, 5), H(0, 6), (race === 'orc' || race === 'minotaur' ? 12 : 9) * R.w, 7.6 * R.w, skin, 'skin', 0.05);
    s += `<ellipse cx="${n1(hd[0] + 1)}" cy="${n1(hd[1] + 10.4 * k)}" rx="${n1(6 * k)}" ry="${n1(2.6 * k)}" fill="#000" opacity=".35" filter="url(#b1)"/>`;
    if (helm === 'hood') return s + hoodPart(F, J, R, K, o, H);
    // ears behind the head
    if (race === 'elf') s += shape(F, cr([H(-1, -1.6), H(-9, -9), H(-17, -15), H(-9, -4.6), H(-2, 3)], true, 0.8), F.rad(skin, 'skin'));
    if (race === 'goblin') s += shape(F, cr([H(-3, -3), H(-14, -8), H(-27, -10), H(-16, -1), H(-4, 3.6)], true, 0.8), F.rad(skin, 'skin')) + qd(H(-6, -2), H(-15, -6), H(-23, -8.6), shd2(skin), 0.9, 0.7);
    if (race === 'minotaur') s += shape(F, cr([H(-4, -4.6), H(-12, -7.6), H(-18, -6), H(-11, -2.6), H(-4, -1)], true, 0.8), F.rad(skin, 'skin'));
    if (race === 'fish') s += shape(F, cr([H(-6, -7), H(-4, -16), H(2, -13), H(4, -18), H(8, -11), H(6, -7)], true, 0.6), F.rad(mix(skin, '#e05a8a', 0.4)));
    // head
    s += shape(F, cr(pts, true, 0.95), F.lin(H(-8, 4), H(8, -8), skin, 'skin'));
    const C = (x, y) => H(x, y);
    if (race === 'skeleton') {
      s += `<path d="${cr([C(0, -1), C(4, -5), C(6, -1), C(3, 2)], true)}" fill="#1a1210"/>` + `<ellipse cx="${n1(C(7.4, -2)[0])}" cy="${n1(C(7.4, -2)[1])}" rx="${n1(1.6 * k)}" ry="${n1(2.2 * k)}" fill="#1a1210"/>` + `<path d="M${pt(C(8.4, 0.6))}l1.4,2.6l-2.2,.4z" fill="#1a1210"/>`;
      for (let i = 0; i < 6; i++) s += `<rect x="${n1(C(2.4 + i * 1.1, 5.6)[0])}" y="${n1(C(0, 5.6)[1])}" width="${n1(0.9 * k)}" height="${n1(1.6 * k)}" fill="${hil(K.bone)}" stroke="${OL}" stroke-width=".3"/>`;
      s += qd(C(-6, 2), C(-2, 4), C(1.6, 2.2), shd2(K.bone), 0.8, 0.7) + qd(C(-4, -8), C(2, -9.4), C(6, -7), hil2(K.bone), 0.7, 0.7);
      const ec = eye || '#7affc8'; s += dot(C(2.4, -2), 1.4 * k, ec) + dot(C(2.4, -2), 3 * k, ec, 0.35) + dot(C(7.3, -2), 1 * k, ec);
    } else if (faceShown) {
      s += features(F, K, o, C, k, skin);
    }
    // hair / helmet / headgear
    s += headgear(F, J, R, K, o, H, k);
    if (R.beard || o.beard) s += beard(F, K, o, H, k);
    return s;
  }
  function features(F, K, o, C, k, skin) {
    const race = K.race, eye = K.eye;
    let s = '';
    s += `<ellipse cx="${n1(C(4.8, 2)[0])}" cy="${n1(C(4.8, 2)[1])}" rx="${n1(2.8 * k)}" ry="${n1(1.8 * k)}" fill="${hil(skin)}" opacity=".5"/>`;
    s += `<path d="${cr([C(-8, -4), C(-2, -7), C(0.4, -1), C(-1, 6), C(1, 10), C(-5, 8), C(-8.6, 2)], true, 0.9)}" fill="${shd(skin)}" opacity=".45"/>`;
    s += `<ellipse cx="${n1(C(4.6, -3.4)[0])}" cy="${n1(C(4.6, -3.4)[1])}" rx="${n1(5.4 * k)}" ry="${n1(1.6 * k)}" fill="${shd(skin)}" opacity=".35"/>`;
    s += qd(C(8.8, -6.4), C(10, -2), C(9.6, 2), mix(skin, '#ffe8c8', 0.6), 0.7, 0.8);
    if (race !== 'minotaur' && race !== 'fish' && race !== 'goblin') s += `<path d="M${pt(C(6.2, 2.6))}Q${pt(C(7.6, 3.6))} ${pt(C(8.6, 2.4))}L${pt(C(8.4, 1.4))}Z" fill="${shd2(skin)}" opacity=".55"/>` + `<path d="M${pt(C(4.2, 6))}Q${pt(C(6, 6.8))} ${pt(C(7.8, 5.4))}Q${pt(C(6.2, 8.2))} ${pt(C(4.6, 7))}Z" fill="${mix(skin, '#b04040', 0.35)}" opacity=".8"/>`;
    if (race === 'minotaur') {
      s += `<path d="${cr([C(9, 1), C(14, 0.6), C(16.4, 3.8), C(15.6, 7.2), C(11, 7.6), C(9, 5)], true, 0.8)}" fill="${mix(skin, '#e0b090', 0.45)}" stroke="${shd2(skin)}" stroke-width=".6"/>` + dot(C(15.2, 3.6), 0.9 * k, '#1a0e08') + dot(C(13.2, 3.4), 0.7 * k, '#1a0e08');
      s += `<path d="M${pt(C(14.4, 5.4))}a${n1(2 * k)},${n1(2 * k)} 0 1 0 ${n1(1.6 * k)},${n1(1.4 * k)}" stroke="${K.trim}" stroke-width="${n1(0.8 * k)}" fill="none"/>` + line(C(10.6, 7.8), C(15, 7.4), OL, 0.8);
    }
    // eyes
    const eyes = race === 'goblin' ? [[3, -3, 2.3], [7.4, -3.2, 1.6]] : race === 'fish' ? [[5, -4.6, 2.8]] : race === 'minotaur' ? [[3.6, -3.4, 1.4], [8, -3.6, 1]] : race === 'orc' ? [[2.8, -2.6, 1.4], [7.2, -2.8, 1.1]] : [[2.4, -2.4, 1.6], [7, -2.6, 1.15]];
    for (const [x, y, r] of eyes) {
      const p = C(x, y);
      if (eye) s += `<ellipse cx="${n1(p[0])}" cy="${n1(p[1])}" rx="${n1(r * k * 1.1)}" ry="${n1(r * k * 0.62)}" fill="${eye}"/>` + dot(p, r * k * 2.4, eye, 0.35);
      else {
        const iris = race === 'goblin' || race === 'fish' ? '#ffd23a' : race === 'orc' ? '#d8a020' : race === 'elf' ? '#58c8a8' : '#5a7a9a';
        s += `<ellipse cx="${n1(p[0])}" cy="${n1(p[1])}" rx="${n1(r * k * 1.15)}" ry="${n1(r * k * 0.72)}" fill="#f6efe2" stroke="${OL}" stroke-width=".4"/>` + dot(add(p, r * k * 0.2, 0), r * k * 0.6, iris) + dot(add(p, r * k * 0.25, 0), r * k * 0.3, '#120a06') + dot(add(p, r * k * 0.05, -r * k * 0.25), r * k * 0.2, '#fff');
      }
    }
    // eyelids, iris highlight, lower-lid line, cheekbone and nostril
    for (const [x, y, r] of eyes) {
      const p = C(x, y);
      s += qd(add(p, -r * k * 1.15, 0), add(p, 0, -r * k * 0.9), add(p, r * k * 1.15, 0), OL, 0.6, 0.8) + qd(add(p, -r * k * 1.05, r * k * 0.2), add(p, 0, r * k * 0.85), add(p, r * k * 1.05, r * k * 0.2), shd2(skin), 0.4, 0.55);
      s += qd(add(p, -r * k * 1.3, -r * k * 0.5), add(p, 0, -r * k * 1.4), add(p, r * k * 1.3, -r * k * 0.5), shd(skin), 0.5, 0.45);
    }
    if (race !== 'minotaur' && race !== 'fish') {
      s += qd(C(6.6, 0.4), C(9.6, 1.6), C(9.4, 3.8), hil2(skin), 0.6, 0.35) + dot(C(8.4, 2), 0.45 * k, shd2(skin), 0.6);
      s += qd(C(3, 3.6), C(5.2, 2.4), C(7.6, 3.2), hil(skin), 0.7, 0.35) + qd(C(-1, 5.2), C(1.4, 6.4), C(3.2, 5.6), shd(skin), 0.5, 0.4);
      s += qd(C(2.4, 8.4), C(5, 9.8), C(7.8, 8.6), shd(skin), 0.5, 0.35);
      if (race === 'dwarf' || race === 'human' || race === 'giant') s += line(C(-0.8, -1.4), C(-1.6, 0.4), shd(skin), 0.4, 0.5) + line(C(0.4, -0.6), C(-0.4, 1.4), shd(skin), 0.4, 0.35) + qd(C(8.2, 3.8), C(8.8, 5.4), C(8, 6.6), shd(skin), 0.45, 0.45);
    }
    // neck tendons and the shadow under the jaw
    s += `<path d="${cr([C(-6, 6), C(2, 10.4), C(9, 7)], false)}" stroke="${shd2(skin)}" stroke-width="2.6" fill="none" opacity=".35"/>` + line(C(1, 10.6), C(0, 15), shd(skin), 0.7, 0.4) + line(C(4.6, 10.2), C(4.8, 15), hil(skin), 0.6, 0.35);
    // brows
    const heavy = race === 'orc' || race === 'minotaur' || race === 'dwarf' || race === 'giant';
    const bc = race === 'orc' ? shd2(skin) : mix(K.hair, '#000', 0.2);
    s += qd(C(0, heavy ? -4.6 : -4.8), C(2.4, heavy ? -6.4 : -5.8), C(4.6, heavy ? -4.4 : -5), bc, heavy ? 2 : 1.1) + qd(C(5.6, heavy ? -4.8 : -5.2), C(7.4, heavy ? -6 : -5.6), C(9, heavy ? -4.2 : -4.4), bc, heavy ? 1.8 : 1);
    if (race === 'orc') s += qd(C(-0.4, -5.2), C(5, -7.4), C(10, -4.6), shd2(skin), 1.6, 0.8);
    // individual brow hairs
    for (let i = 0; i < 5; i++) s += line(C(0.4 + i * 1, -4.9 - (i < 3 ? i * 0.4 : (4 - i) * 0.4)), C(0.9 + i * 1, -5.9 - (i < 3 ? i * 0.4 : (4 - i) * 0.4)), bc, 0.4, 0.7) + line(C(5.8 + i * 0.7, -5.1 - (i < 2 ? i * 0.3 : 0.4)), C(6.2 + i * 0.7, -6 - (i < 2 ? i * 0.3 : 0.4)), bc, 0.35, 0.6);
    // nose, mouth, jaw
    if (race !== 'minotaur' && race !== 'fish') s += qd(C(7.2, -1.6), C(8.6, 0.6), C(8.2, 1.8), shd2(skin), 0.8, 0.8) + qd(C(6, 2.4), C(7.2, 2.8), C(8.4, 2), shd2(skin), 0.7, 0.7);
    if (race === 'goblin') { s += `<path d="${cr([C(2.6, 5), C(6, 6.8), C(9, 4.6), C(8.4, 6.8), C(5, 8.2)], true, 0.8)}" fill="#3a0e10" stroke="${OL}" stroke-width=".5"/>`; for (let i = 0; i < 4; i++) s += `<path d="M${pt(C(3.6 + i * 1.4, 5.6))}l${n1(0.6 * k)},${n1(1.2 * k)}l${n1(0.6 * k)},${n1(-1.1 * k)}z" fill="#f4eed8"/>`; }
    else if (race === 'fish') { s += qd(C(3, 6), C(8, 8), C(12.4, 4.8), OL, 1.2) + `<path d="M${pt(C(5, 6.6))}l.8,1.6l.8,-1.4M${pt(C(8, 7.2))}l.8,1.6l.8,-1.6" stroke="#f4eed8" stroke-width=".6" fill="none"/>` + qd(C(-2, 1), C(-1, 4), C(-3, 7), shd2(skin), 0.8, 0.8) + qd(C(0, 1), C(1, 4), C(-1, 7), shd2(skin), 0.8, 0.8); }
    else if (race !== 'minotaur') s += qd(C(4.2, 6), C(6, 6.6), C(7.8, 5.4), OL, 0.8, 0.85) + qd(C(4.8, 7.3), C(6, 7.8), C(7.2, 7), hil(skin), 0.6, 0.6);
    if (race === 'orc') {
      for (const [x0, x1] of [[5.8, 6.6], [9.2, 9.8]]) s += `<path d="${cr([C(x0 - 0.8, 7.6), C(x0 + 0.2, 1.8), C(x1, 2.4), C(x0 + 1.2, 7.8)], true, 0.8)}" fill="${F.rad(K.bone)}" stroke="${OL}" stroke-width=".5"/>`;
      const pc = o.paint || '#c8321e'; s += line(C(1.6, -0.6), C(4, 1.6), pc, 0.9, 0.8) + line(C(1, 0.4), C(3.4, 2.8), pc, 0.9, 0.8);
    }
    if (race === 'elf' || race === 'human' || race === 'dwarf' || race === 'giant') s += qd(C(-4, 8.6), C(2, 11), C(7, 7.4), shd2(skin), 0.7, 0.5);
    // ears in front for humans/dwarves/orcs
    if (race === 'human' || race === 'dwarf' || race === 'giant') s += shape(F, cr([C(-1, -3.4), C(-4.2, -4.4), C(-4.6, 1), C(-1.4, 2.6)], true, 0.8), F.rad(skin, 'skin'), ' stroke-width=".6"') + qd(C(-2, -2.4), C(-3.6, -0.8), C(-2.2, 1.2), shd2(skin), 0.6, 0.8);
    if (race === 'orc') s += shape(F, cr([C(-1, -3.6), C(-7, -8), C(-5.6, 0.4), C(-1.2, 2.4)], true, 0.8), F.rad(skin, 'skin'), ' stroke-width=".6"') + `<circle cx="${n1(C(-5, -2)[0])}" cy="${n1(C(-5, -2)[1])}" r="${n1(1 * k)}" fill="none" stroke="${K.trim}" stroke-width=".6"/>`;
    return s;
  }
  function hoodPart(F, J, R, K, o, H) {
    const hc = o.hoodCol || (K.mat === 'cloth' ? K.cloth : mix(K.cloth, '#2a2420', 0.55)), k = R.head / 10;
    let s = shape(F, cr([add(J.sL, -2, 4), H(-12, 6), H(-12, -5), H(-7, -13), H(1, -14.8), H(9, -11.4), H(12.8, -4), H(12.8, 3), H(11, 10), add(J.sR, 2, 3)], true, 0.85), F.lin(H(-12, 4), H(12, -10), hc, 'cloth'));
    s += `<path d="${cr([H(10.6, -4.6), H(12, 1), H(10.4, 9), H(5, 10.8), H(1.6, 6), H(1.2, -3), H(5, -8)], true, 0.9)}" fill="#0a0608" stroke="${OL}" stroke-width=".6"/>`;
    s += `<path d="${cr([H(10.6, -4.6), H(12, 1), H(10.4, 9), H(5, 10.8), H(1.6, 6), H(1.2, -3), H(5, -8)], true, 0.9)}" fill="none" stroke="${hil(hc)}" stroke-width=".9" opacity=".7"/>`;
    if (K.race === 'goblin') s += `<path d="M${pt(H(9.4, -0.6))}L${pt(H(15.6, 2.6))}L${pt(H(9.6, 3))}Z" fill="${F.rad(K.skin, 'skin')}" stroke="${OL}" stroke-width=".5"/>`;
    const ec = K.eye || '#ffe090';
    s += dot(H(4.6, -1.4), 2.6 * k, ec, 0.35) + `<ellipse cx="${n1(H(4.6, -1.4)[0])}" cy="${n1(H(4.6, -1.4)[1])}" rx="${n1(1.3 * k)}" ry="${n1(0.8 * k)}" fill="${ec}"/><ellipse cx="${n1(H(8.6, -1.6)[0])}" cy="${n1(H(8.6, -1.6)[1])}" rx="${n1(0.9 * k)}" ry="${n1(0.6 * k)}" fill="${ec}"/>`;
    s += qd(H(-6, -12), H(-13, 2), add(J.sL, 4, 2), shd2(hc), 1.6, 0.6) + qd(H(-1, -14), H(-8, 4), add(J.sL, 10, 4), hil(hc), 0.7, 0.5) + qd(H(10, -10), H(13, -1), H(11.6, 8), hil(hc), 0.8, 0.7);
    if (K.race === 'goblin') s += shape(F, cr([H(-6, -6), H(-18, -10), H(-28, -12), H(-16, -2), H(-6, 1)], true, 0.8), F.rad(K.skin, 'skin'));
    return s;
  }
  function headgear(F, J, R, K, o, H, k) {
    const race = K.race, helm = o.helm, hc = K.hair;
    let s = '';
    const cap = () => shape(F, cr([H(7.8, -6.8), H(4, -10.8), H(-3, -11.6), H(-9.2, -6.8), H(-9.6, 1), H(-7.2, 4.4), H(-6.6, -1.6), H(-3.4, -5.4), H(2, -6.4), H(5.6, -4.6)], true, 0.9), F.rad(hc)) + qd(H(5, -8.6), H(0, -10.4), H(-6, -8), hil(hc), 0.6, 0.8) + qd(H(4, -6.6), H(-2, -8.6), H(-8, -3), shd2(hc), 0.7, 0.7);
    switch (helm) {
      case 'great': {
        const hp = [H(-10, -4), H(-8.8, -9.6), H(0, -12.8), H(8.8, -10.2), H(10.8, -5), H(11.2, 4), H(10.6, 8.8), H(4, 10.6), H(-6, 10.2), H(-10.4, 7)];
        if (o.plume !== false) { const pc = o.plumeCol || (K.clan ? '#2a2220' : '#c8202c'); s += shape(F, cr([H(0, -12), H(-8, -20), H(-20, -23), H(-33, -15), H(-24, -16.4), H(-15, -12.6), H(-7, -9.4)], true, 0.9), F.rad(pc)); for (let i = 0; i < 5; i++) s += qd(H(-2 - i * 2, -12 + i * 0.6), H(-12 - i * 3, -20 + i), H(-22 - i * 2.4, -18 + i * 1.4), i % 2 ? hil(pc) : shd2(pc), 0.6, 0.8); }
        s += shape(F, cr(hp, true, 0.9), F.lin(H(-10, 4), H(10, -10), K.metal, 'metal'));
        s += `<path d="M${pt(H(-0.6, -2.2))}L${pt(H(11, -2.6))}L${pt(H(11, 0.4))}L${pt(H(-0.6, 0.6))}Z" fill="#0c0808" stroke="${OL}" stroke-width=".5"/>`;
        const vc = K.eye || o.eye || mix(F.P.light, '#ffffff', 0.3); s += line(H(1, -1), H(10, -1.2), vc, 0.9, 0.9) + line(H(1, -1), H(10, -1.2), vc, 3, 0.35, ' filter="url(#b1)"');
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) s += dot(H(6.4 + i * 1.6, 3.4 + j * 2), 0.5 * k, '#0c0808');
        s += line(H(3.6, -12.4), H(4.4, 10.4), OL, 1.4) + line(H(4.2, -12.2), H(5, 10.2), hil2(K.metal), 0.6, 0.9) + `<path d="${cr([H(-10, -4.4), H(0, -6), H(10.8, -5.4)], false)}" stroke="${K.trim}" stroke-width="1.5" fill="none"/>` + `<path d="${cr([H(-10.4, 7.4), H(4, 10.2), H(10.6, 8.6)], false)}" stroke="${K.trim}" stroke-width="1.2" fill="none"/>`;
        [-7, -3, 1, 6, 9.6].forEach(x => { s += rivet(H(x, -5.6 + (x > 3 ? 0.2 : 0)), 0.7 * k); });
        break;
      }
      case 'horned': {
        if (race !== 'dwarf' && race !== 'skeleton') s += cap();
        const h1 = A.tube(H(-7, -9), H(-17, -10), H(-24, -20), H(-19, -31), 5 * k, 0.8, 16), h2 = A.tube(H(6, -12), H(15, -16), H(19, -26), H(13, -34), 4.4 * k, 0.8, 16);
        for (const h of [h1, h2]) { s += shape(F, h.d, F.hor('#ece0c0', 'skin')); [3, 5, 7].forEach(i => { const q = h.pts[i]; s += line([q.x + q.nx * q.w, q.y + q.ny * q.w], [q.x - q.nx * q.w, q.y - q.ny * q.w], '#7a6a50', 0.8, 0.9); }); }
        s += shape(F, cr([H(-9.8, -4.6), H(-9.2, -9.6), H(0, -14), H(8.8, -11), H(10.4, -6.4), H(10.8, -4.2), H(0, -3.2)], true, 0.85), F.lin(H(-10, -4), H(10, -14), K.metal, 'metal'));
        s += `<path d="${cr([H(-10, -4.8), H(0, -3.6), H(10.8, -4.8)], false)}" stroke="${K.trim}" stroke-width="2.2" fill="none"/>` + [-6, -1, 4, 8.4].map(x => rivet(H(x, -4.4), 0.7 * k)).join('');
        s += shape(F, `M${pt(H(7.6, -4.4))}L${pt(H(9.4, -4.4))}L${pt(H(9.2, 1.4))}L${pt(H(8, 1.4))}Z`, F.hor(K.metal, 'metal'), ' stroke-width=".6"') + line(H(4, -13.4), H(4.8, -4.2), hil2(K.metal), 0.7, 0.8);
        break;
      }
      case 'wizard': {
        const hc2 = o.hatCol || K.cloth;
        s += cap();
        s += shape(F, cr([H(-9, -8.6), H(-6, -20), H(-11, -34), H(-21, -47), H(-4, -32), H(2.6, -20), H(9.6, -8.6)], true, 0.85), F.lin(H(-10, -10), H(9, -30), hc2, 'cloth'));
        s += shape(F, `M${pt(H(-18, -8))}Q${pt(H(0, -13.6))} ${pt(H(19, -9.4))}Q${pt(H(2, -4.6))} ${pt(H(-18, -8))}Z`, F.hor(hc2, 'cloth'));
        s += `<path d="M${pt(H(-8.6, -10.6))}Q${pt(H(0, -13))} ${pt(H(9.4, -10.6))}L${pt(H(9, -13.4))}Q${pt(H(0, -15.6))} ${pt(H(-8.2, -13.4))}Z" fill="${F.rad(K.trim, 'metal')}" stroke="${OL}" stroke-width=".5"/>`;
        s += `<path d="M${pt(H(-5, -26))}l1.2,-3l1.2,3l3,1.2l-3,1.2l-1.2,3l-1.2,-3l-3,-1.2z" fill="${K.trim}"/>` + dot(H(0, -20), 0.8 * k, K.trim) + dot(H(-9, -38), 0.7 * k, K.trim);
        break;
      }
      case 'crown': case 'coral': {
        if (race !== 'skeleton') s += (race === 'elf' || o.helm === 'coral') ? '' : cap();
        const cc = o.crownCol || (o.helm === 'coral' ? '#ff8a9a' : '#e2b24a');
        const sp = o.helm === 'coral' ? [[-11, -26], [-6, -12], [-2, -30], [3, -13], [8, -28], [11, -8]] : [[-10, -20], [-5, -11], [0, -24], [5, -11], [10, -20], [11, -6]];
        let d = `M${pt(H(-11, -6))}`; sp.forEach(q => { d += `L${pt(H(q[0], q[1] * 0.72))}`; }); d += `L${pt(H(11, -4.6))}Q${pt(H(0, -2.4))} ${pt(H(-11, -6))}Z`;
        s += shape(F, d, F.lin(H(-11, -6), H(11, -20), cc, 'metal'));
        s += dot(H(0, -8.4), 1.5 * k, o.gem || F.P.glow) + dot(H(0, -8.4), 3.4 * k, o.gem || F.P.glow, 0.4) + dot(H(-6.4, -7.6), 0.9 * k, '#c8243a') + dot(H(6.4, -7.4), 0.9 * k, '#3a8ad8');
        break;
      }
      case 'mohawk': {
        const mc = o.hairCol || (race === 'orc' ? '#1e1610' : K.hair);
        const top = []; for (let i = 0; i <= 6; i++) { const t = i / 6, x = 6 - t * 16, y = -10.6 + Math.sin(t * Math.PI) * -1.2; top.push(H(x, y - (i % 2 ? 6 : 11) * (1 - Math.abs(t - 0.4)))); }
        s += shape(F, cr([H(6.4, -8), ...top, H(-10, -3), H(-8.4, -6), H(-2, -9.6), H(4, -9)], true, 0.6), F.rad(mc));
        s += qd(H(-9, -2), H(-15, 6), H(-12, 16), mc, 2.4) + dot(H(-9.6, -1.6), 1.4 * k, K.trim);
        break;
      }
      case 'hair': case 'flowhair':
        s += cap() + qd(H(6.4, -6.6), H(5.6, -3), H(4, -1), hc, 2.2, 0.9);
        break;
      default:
        if (race === 'human' || race === 'dwarf' || race === 'giant') s += cap();
        if (race === 'elf') s += cap();
        if (race === 'orc') s += shape(F, cr([H(-4, -11), H(1, -12), H(-1, -16), H(-7, -14)], true, 0.8), F.rad(K.hair)) + qd(H(-4, -14), H(-14, -14), H(-18, -4), K.hair, 2.6);
        if (race === 'minotaur') { s += shape(F, cr([H(2, -9.4), H(-4, -12), H(-11, -9), H(-12, -1), H(-8, 0), H(-6, -6), H(-1, -7.6)], true, 0.8), F.rad(K.hair)); const h1 = A.tube(H(-4, -7), H(-18, -8), H(-26, -18), H(-20, -30), 5.6 * k, 0.8, 16), h2 = A.tube(H(4, -9), H(14, -14), H(20, -24), H(13, -34), 5 * k, 0.8, 16); for (const h of [h1, h2]) { s += shape(F, h.d, F.hor('#ece0c0', 'skin')); [2, 4, 6].forEach(i => { const q = h.pts[i]; s += line([q.x + q.nx * q.w, q.y + q.ny * q.w], [q.x - q.nx * q.w, q.y - q.ny * q.w], '#7a6a50', 0.8, 0.9); }); } }
        if (race === 'goblin') s += qd(H(-2, -10), H(-4, -14), H(-8, -15), K.hair, 0.8) + qd(H(1, -10.4), H(1, -15), H(-2, -17), K.hair, 0.8);
    }
    if ((helm === 'mohawk' || helm === 'great' || helm === 'horned' || helm === 'hood' || !helm) && race === 'minotaur' && helm) {
      const h1 = A.tube(H(-4, -7), H(-18, -8), H(-26, -18), H(-20, -30), 5.6 * k, 0.8, 16), h2 = A.tube(H(4, -9), H(14, -14), H(20, -24), H(13, -34), 5 * k, 0.8, 16);
      for (const h of [h1, h2]) s += shape(F, h.d, F.hor('#ece0c0', 'skin'));
    }
    return s;
  }
  function beard(F, K, o, H, k) {
    const bc = o.beardCol || K.hair;
    const pts = [H(-5, 1), H(0, 4.6), H(4, 5.4), H(8.6, 4.4), H(11.2, 6), H(11.4, 12), H(10, 20), H(7.4, 28), H(4.8, 34), H(2.6, 26), H(-0.6, 32), H(-2.8, 22), H(-5.2, 14), H(-6.6, 7)];
    let s = shape(F, cr(pts, true, 0.85), F.lin(H(-6, 10), H(11, 0), bc, 'cloth'));
    for (let i = 0; i < 8; i++) s += qd(H(-3 + i * 1.8, 6), H(-2 + i * 2, 16), H(-1 + i * 1.6, 26 - Math.abs(i - 3.5) * 2.4), i % 2 ? hil(bc) : shd2(bc), i % 2 ? 0.6 : 0.9, 0.75);
    s += shape(F, cr([H(3.4, 4.6), H(7, 3.4), H(11.6, 4.2), H(12.6, 7.4), H(9.6, 6), H(7, 6.4), H(4.6, 7)], true, 0.8), F.rad(bc));
    for (const [x, y] of [[3, 30], [9, 25]]) s += `<rect x="${n1(H(x, y)[0] - 1.6 * k)}" y="${n1(H(x, y)[1] - 1.4 * k)}" width="${n1(3.2 * k)}" height="${n1(2.8 * k)}" rx=".6" fill="${F.rad(K.trim, 'metal')}" stroke="${OL}" stroke-width=".5"/>`;
    return s;
  }
  function armPart(F, J, R, K, o, side) {
    const sh = side < 0 ? J.sL : J.sR, el = side < 0 ? J.eL : J.eR, hn = side < 0 ? J.hL : J.hR, lw = R.limb, mat = K.mat;
    const uw = 10.6 * lw, ew = 8.4 * lw, fw = 6.8 * lw;
    let s = '';
    if (mat === 'bone') return boneLimb(F, sh, el, 3.2 * lw, K.bone) + boneLimb(F, el, hn, 2.8 * lw, K.bone);
    if (mat === 'cloth') {
      s += limb(F, sh, el, uw * 1.04, ew * 1.1, K.cloth, 'cloth', 0.08);
      const cuff = lerp(el, hn, 0.74);
      s += limb(F, el, hn, ew * 0.85, fw * 0.9, K.skin, 'skin', 0.1);
      s += shape(F, limbD(el, cuff, ew * 1.1, fw * 2.4, 0.02), F.lin(sum(el, mul(litN(el, hn), -ew)), sum(el, mul(litN(el, hn), ew)), K.cloth, 'cloth'));
      s += band(F, el, cuff, 0.84, 1, ew * 1.1, fw * 2.4, K.trim, 'metal', 1.02);
      s += qd(lerp(sh, el, 0.2), add(lerp(sh, el, 0.6), side * 1.6, 0), lerp(sh, el, 0.95), shd2(K.cloth), 1.2, 0.6);
      return s;
    }
    const upCol = mat === 'plate' ? K.metal : mat === 'mail' ? K.mail : mat === 'hide' ? K.skin : K.leather2;
    const foCol = mat === 'plate' ? K.metal : mat === 'hide' ? K.skin : mat === 'mail' ? K.leather : K.leather2;
    const kind = c => c === K.metal ? 'metal' : c === K.skin ? 'skin' : 'cloth';
    s += limb(F, sh, el, uw, ew, upCol, kind(upCol), 0.22);
    if (mat === 'mail') s += `<path d="${limbD(sh, el, uw, ew, 0.22)}" fill="url(#pMailC)"/>`;
    if (mat === 'hide') { const n = litN(sh, el); s += qd(sum(lerp(sh, el, 0.15), mul(n, uw * 0.1)), sum(lerp(sh, el, 0.5), mul(n, uw * 0.32)), sum(lerp(sh, el, 0.86), mul(n, ew * 0.1)), hil2(K.skin), 0.7, 0.6) + qd(lerp(sh, el, 0.08), sum(lerp(sh, el, 0.3), mul(n, -uw * 0.3)), lerp(sh, el, 0.42), shd2(K.skin), 0.9, 0.7); }
    s += limb(F, el, hn, ew * 0.96, fw, foCol, kind(foCol), 0.16);
    if (mat === 'plate') {
      s += band(F, el, hn, 0.3, 0.95, ew, fw, K.metal, 'metal', 1.14) + band(F, el, hn, 0.3, 0.4, ew, fw, K.trim, 'metal', 1.18) + band(F, el, hn, 0.82, 0.92, ew, fw, K.trim, 'metal', 1.2);
      s += `<ellipse cx="${n1(el[0])}" cy="${n1(el[1])}" rx="${n1(5.4 * lw)}" ry="${n1(4.8 * lw)}" fill="${F.rad(K.metal, 'metal')}" stroke="${OL}" stroke-width=".8"/>` + rivet(el, 0.9 * lw);
      s += band(F, sh, el, 0.45, 0.62, uw, ew, K.metal, 'metal', 1.08);
    } else {
      const bc = mat === 'hide' ? K.leather2 : K.leather;
      s += band(F, el, hn, 0.42, 0.94, ew, fw, bc, 'cloth', 1.16);
      s += line(lerp(sum(el, mul(litN(el, hn), -fw * 0.6)), sum(hn, mul(litN(el, hn), -fw * 0.6)), 0.55), lerp(sum(el, mul(litN(el, hn), fw * 0.6)), sum(hn, mul(litN(el, hn), fw * 0.6)), 0.6), '#1a0e06', 0.8, 0.8);
      const m1 = lerp(el, hn, 0.6), m2 = lerp(el, hn, 0.82); s += dot(m1, 0.8, K.trim) + dot(m2, 0.8, K.trim);
      if (mat === 'hide' && K.clan) { const n = litN(el, hn), p = sum(lerp(el, hn, 0.66), mul(n, -fw * 0.62)); s += `<path d="M${pt(add(p, -1.4, 1))}L${pt(sum(p, mul(n, -4)))}L${pt(add(p, 1.4, -1))}Z" fill="${F.rad(K.metal, 'metal')}" stroke="${OL}" stroke-width=".4"/>`; }
    }
    return s;
  }
  function pauldronPart(F, J, R, K, o, side) {
    const mat = K.mat, type = o.pauld || (mat === 'plate' ? 'plate' : mat === 'mail' || mat === 'leather' ? 'pad' : null);
    if (!type || mat === 'cloth') return '';
    const sh = side < 0 ? J.sL : J.sR, w = R.w;
    if (type === 'fur') {
      if (side < 0) return '';
      const ch = J.ch, lower = [add(J.sR, 11 * w, 9), add(J.sR, 4 * w, 13), add(ch, 6 * w, -5), add(ch, 0, -1.5), add(ch, -6 * w, -5), add(J.sL, -4 * w, 13), add(J.sL, -11 * w, 9)];
      const body = [add(J.sL, -11 * w, 9), add(J.sL, -8 * w, -7), add(J.nk, -6 * w, -2), add(J.nk, 6 * w, -2), add(J.sR, 8 * w, -7), ...lower.slice(0, -1)];
      let s = `<path d="${cr(body, true, 0.85)}" fill="${F.rad(K.fur)}" stroke="${OL}" stroke-width="${F.ow}"/>`;
      // shaggy tufts hanging from the lower edge, and lighter guard hairs over the top
      for (let i = 0; i < lower.length - 1; i++) for (let j = 0; j < 4; j++) { const p = lerp(lower[i], lower[i + 1], j / 4), l = 6 + ((i * 4 + j) % 3) * 2; s += `<path d="M${pt(add(p, -2.6, -3))}Q${pt(add(p, -1, l * 0.6))} ${pt(add(p, ((i + j) % 2 ? 1.6 : -1.6), l))}Q${pt(add(p, 1.6, l * 0.5))} ${pt(add(p, 2.6, -3))}Z" fill="${(i + j) % 3 ? hil(K.fur) : K.fur}" stroke="${shd2(K.fur)}" stroke-width=".4"/>`; }
      for (let i = 0; i < 18; i++) { const t = i / 17, p = lerp(add(J.sL, -9 * w, -2), add(J.sR, 9 * w, -2), t), q = add(p, 0, -Math.sin(t * Math.PI) * 4); s += line(q, add(q, (i % 2 ? 1.4 : -1.4), 5), i % 2 ? hil2(K.fur) : shd2(K.fur), 0.7, 0.8); }
      if (K.clan) s += skull(add(J.sR, 3, 2), 3.6, K.bone);
      return s;
    }
    if (type === 'pad') {
      const c = add(sh, side * 1.5 * w, 0), pr = 7.6 * w;
      return `<ellipse cx="${n1(c[0])}" cy="${n1(c[1] + 4)}" rx="${n1(pr)}" ry="3" fill="#000" opacity=".35" filter="url(#b1)"/>` + shape(F, cr([add(c, -pr, 2), add(c, -pr * 0.7, -pr * 0.6), add(c, 0, -pr * 0.85), add(c, pr * 0.7, -pr * 0.6), add(c, pr, 2), add(c, 0, pr * 0.55)], true, 0.95), F.rad(K.leather)) + `<path d="${cr([add(c, -pr * 0.8, 1), add(c, 0, -pr * 0.55), add(c, pr * 0.8, 1)], false)}" stroke="#e8c890" stroke-width=".5" fill="none" stroke-dasharray="1.2 1.2"/>` + rivet(add(c, 0, -2), 0.9);
    }
    const col = type === 'spiked' ? mix(K.metal, '#2c2622', 0.45) : K.metal, pr = 11 * w, c = add(sh, side * 2.6 * w, -1.2);
    let s = `<ellipse cx="${n1(c[0])}" cy="${n1(c[1] + pr * 0.7)}" rx="${n1(pr * 0.9)}" ry="${n1(pr * 0.32)}" fill="#000" opacity=".4" filter="url(#b2)"/>`;
    for (let i = 2; i >= 1; i--) { const y = pr * 0.24 + i * pr * 0.32, ww = pr * (1.02 - i * 0.12); s += shape(F, `M${pt(add(c, -ww, y - pr * 0.18))}Q${pt(add(c, 0, y - pr * 0.42))} ${pt(add(c, ww, y - pr * 0.18))}L${pt(add(c, ww * 0.94, y + pr * 0.1))}Q${pt(add(c, 0, y - pr * 0.12))} ${pt(add(c, -ww * 0.94, y + pr * 0.1))}Z`, F.rad(col, 'metal'), ' stroke-width=".7"') + qd(add(c, -ww * 0.9, y + pr * 0.06), add(c, 0, y - pr * 0.16), add(c, ww * 0.9, y + pr * 0.06), K.trim, 0.8, 0.9); }
    const dome = cr([add(c, -pr * 1.06, pr * 0.32), add(c, -pr * 0.9, -pr * 0.46), add(c, 0, -pr * 0.98), add(c, pr * 0.9, -pr * 0.46), add(c, pr * 1.06, pr * 0.32), add(c, pr * 0.55, pr * 0.56), add(c, 0, pr * 0.46), add(c, -pr * 0.55, pr * 0.56)], true, 0.95);
    s += shape(F, dome, F.rad(col, 'metal'));
    s += `<path d="${cr([add(c, -pr * 0.86, -pr * 0.36), add(c, -pr * 0.3, -pr * 0.84), add(c, pr * 0.3, -pr * 0.84)], false)}" stroke="#ffffff" stroke-width="1.6" fill="none" opacity=".45"/>` + `<path d="${cr([add(c, -pr * 0.96, pr * 0.24), add(c, -pr * 0.84, -pr * 0.42), add(c, 0, -pr * 0.92), add(c, pr * 0.84, -pr * 0.42), add(c, pr * 0.98, pr * 0.24)], false)}" stroke="${shd2(col)}" stroke-width=".9" fill="none" opacity=".6"/>`;
    s += `<path d="${cr([add(c, pr * 0.2, -pr * 0.2), add(c, pr * 0.55, -pr * 0.5), add(c, pr * 0.78, -pr * 0.2)], false)}" stroke="${mix(F.P.sky[2], '#ffffff', 0.5)}" stroke-width="2" fill="none" opacity=".22"/>`;
    for (const sd of [-1, 1]) s += `<path d="M${pt(add(c, sd * pr * 0.34, -pr * 0.1))}c${n1(sd * pr * 0.12)},${n1(-pr * 0.22)} ${n1(sd * pr * 0.36)},${n1(-pr * 0.2)} ${n1(sd * pr * 0.38)},${n1(pr * 0.02)}c0,${n1(pr * 0.14)} ${n1(-sd * pr * 0.12)},${n1(pr * 0.18)} ${n1(-sd * pr * 0.2)},${n1(pr * 0.1)}" stroke="${K.trim}" stroke-width=".7" fill="none" opacity=".8"/>`;
    s += `<path d="${cr([add(c, -pr * 1.02, pr * 0.28), add(c, -pr * 0.5, pr * 0.5), add(c, 0, pr * 0.42), add(c, pr * 0.5, pr * 0.5), add(c, pr * 1.02, pr * 0.28)], false)}" stroke="${K.trim}" stroke-width="1.6" fill="none"/>`;
    s += qd(add(c, -pr * 0.1, -pr * 0.94), add(c, side * pr * 0.1, -pr * 0.2), add(c, 0, pr * 0.42), OL, 1.2, 0.9) + qd(add(c, pr * 0.02, -pr * 0.94), add(c, side * pr * 0.1 + 0.8, -pr * 0.2), add(c, 0.9, pr * 0.42), hil2(col), 0.6, 0.9);
    s += rivet(add(c, -pr * 0.62, pr * 0.1), 0.9) + rivet(add(c, pr * 0.62, pr * 0.1), 0.9) + rivet(add(c, -pr * 0.3, -pr * 0.6), 0.8) + rivet(add(c, pr * 0.3, -pr * 0.6), 0.8);
    if (type === 'spiked') for (const [dx, dy, a] of [[-0.55, -0.62, -0.5], [0.05, -0.95, 0], [0.6, -0.6, 0.5]]) { const b = add(c, pr * dx, pr * dy), tip = add(b, Math.sin(a + side * 0.25) * pr * 0.85, -Math.cos(a) * pr * 0.85); s += shape(F, `M${pt(add(b, -2.4, 1))}L${pt(tip)}L${pt(add(b, 2.4, 1))}Z`, F.hor(mix(K.metal, '#d8d0c0', 0.2), 'metal'), ' stroke-width=".6"'); }
    else if (!K.clan) s += dot(add(c, 0, -pr * 0.3), 1.6, o.gem || '#3a8ad8') + dot(add(c, -0.4, -pr * 0.3 - 0.5), 0.5, '#fff');
    return s;
  }
  function handPart(F, J, R, K, o, side, open) {
    const el = side < 0 ? J.eL : J.eR, hn = side < 0 ? J.hL : J.hR, lw = R.limb, mat = K.mat;
    const u = unit(sub(hn, el)), n = perp(u), col = mat === 'plate' ? K.metal : mat === 'bone' ? K.bone : (mat === 'hide' || mat === 'cloth') ? K.skin : K.leather;
    const kind = mat === 'plate' ? 'metal' : 'skin', Q = (a, b) => sum(sum(hn, mul(u, a * lw)), mul(n, b * lw));
    let s = '';
    if (mat === 'plate') s += shape(F, cr([Q(-6, -4.6), Q(-0.6, -5.4), Q(-0.6, 5.4), Q(-6, 4.6)], true, 0.5), F.lin(Q(-3, -5), Q(-3, 5), K.metal, 'metal')) + line(Q(-1.2, -5), Q(-1.2, 5), K.trim, 1.1);
    // a finger: two phalanges with a knuckle crease, bending by `bend` radians at the middle joint
    const finger = (base, dir, len, w, bend) => {
      const d1 = unit(dir), mid = sum(base, mul(d1, len * 0.55)), c = Math.cos(bend), sn = Math.sin(bend), d2 = [d1[0] * c - d1[1] * sn, d1[0] * sn + d1[1] * c], tip = sum(mid, mul(d2, len * 0.45));
      let f = shape(F, limbD(base, mid, w, w * 0.9, 0.05), F.hor(col, kind), ' stroke-width=".5"') + shape(F, limbD(mid, tip, w * 0.9, w * 0.7, 0), F.hor(col, kind), ' stroke-width=".5"');
      f += dot(mid, w * 0.42, shd(col), 0.55) + qd(sum(mid, mul(perp(d1), -w * 0.4)), sum(mid, mul(d1, 0.3)), sum(mid, mul(perp(d1), w * 0.4)), shd2(col), 0.45, 0.8);
      if (mat !== 'plate') f += dot(sum(tip, mul(d2, -w * 0.15)), w * 0.3, mix(col, '#ffffff', 0.4), 0.5) + line(sum(tip, mul(d2, w * 0.1)), sum(tip, mul(d2, -w * 0.5)), mix(col, '#2a1a10', 0.5), 0.4, 0.6);
      return f;
    };
    if (open) {
      s += shape(F, cr([Q(-1, -3.2), Q(3, -3.6), Q(4.4, 0), Q(3, 3.6), Q(-1, 3.2)], true, 0.9), F.rad(col, kind), ' stroke-width=".7"');
      for (const [a, i] of [[-0.55, 0], [-0.18, 1], [0.18, 2], [0.52, 3]]) { const d = sum(mul(u, Math.cos(a)), mul(n, Math.sin(a))), b = Q(3.4, a * 4.4); s += finger(b, d, (i === 3 ? 4 : 4.8) * lw, 1.6 * lw, (i % 2 ? -0.35 : -0.5)); }
      s += finger(Q(0.6, -3.4), sum(mul(u, 0.4), mul(n, -0.9)), 4 * lw, 1.8 * lw, 0.4);
      for (const b of [-2.2, -0.7, 0.8, 2.3]) s += dot(Q(3.4, b), 0.5 * lw, shd(col), 0.5);
      return s;
    }
    s += shape(F, cr([Q(-1.4, -3.6), Q(3.4, -3.8), Q(5.2, -1.8), Q(5.2, 2), Q(3.4, 3.8), Q(-1.4, 3.6), Q(-2.4, 0)], true, 0.9), F.rad(col, kind));
    // curled fingers: visible knuckle ridge then short lower phalanges folding under
    for (const b of [-2.6, -0.9, 0.8, 2.5]) { const kn = Q(4.6, b); s += dot(kn, 0.75 * lw, mix(col, '#ffffff', 0.35), 0.55) + qd(Q(3.4, b - 0.7), Q(5.3, b), Q(3.4, b + 0.7), shd2(col), 0.6, 0.8) + line(Q(4.9, b + 0.1), Q(3.6, b + 0.9), shd(col), 0.5, 0.6); }
    s += qd(Q(2.4, -3.4), Q(3.4, 0), Q(2.4, 3.4), shd2(col), 0.7, 0.8) + shape(F, cr([Q(0, -3.8), Q(3.2, -4.6), Q(4.4, -3.2), Q(1.6, -2.4)], true, 0.8), F.rad(col, kind), ' stroke-width=".5"') + dot(Q(2.2, -3.6), 0.55 * lw, shd(col), 0.5);
    s += line(Q(-1, -2.6), Q(1.6, -3.2), shd(col), 0.5, 0.45) + line(Q(-1.2, 0.6), Q(2, 0.2), shd(col), 0.45, 0.35) + ao(Q(-1.6, 0), 2 * lw, 3.2 * lw, 0.7);
    if (mat === 'plate') s += rivet(Q(4.2, -1.2), 0.6) + rivet(Q(4.2, 1.4), 0.6) + line(Q(0.2, -3.4), Q(0.4, 3.4), OL, 0.5, 0.6);
    return s;
  }
  function weaponPart(F, o, P, t, h, ang, isOff) {
    const wp = A.weapon(t, P, isOff ? Object.assign({}, o, { wGlow: o.offGlow || o.wGlow }) : o);
    const shield = t === 'shield' || t === 'round' || t === 'tower', k = shield ? 1.42 : 1.1;
    const boost = (wp.paint || '').replace(/opacity="(0?\.\d+)"/g, (m, v) => `opacity="${Math.min(1, (+v) * 1.4).toFixed(2)}"`);
    return `<g transform="translate(${pt(h)}) rotate(${ang}) scale(${k})"><g fill="#2c221a" stroke="${OL}" stroke-width="1.2" stroke-linejoin="round">${wp.sil}</g>${boost}${wp.hi}</g>`;
  }
  const isShield = t => t === 'shield' || t === 'round' || t === 'tower';

  /* ---------- the figure ---------- */
  L.figSil = L.fig;
  L.fig = function (o, P, rr) {
    if (o.legacy) return L.figSil(o, P, rr);
    rr = rr || A.rng(7);
    const R = Object.assign({}, A.RACE[o.race || 'human'], o.raceOver || {});
    // heroic proportions: broader frame, thicker limbs, bigger heads and hands
    R.w *= 1.1; R.limb *= R.skull ? 1.05 : 1.18; R.head *= 1.28;
    const base = A.POSES[o.pose || 'stand'];
    const J = {};
    for (const key in base) {
      if (key === 'wA' || key === 'oA') continue;
      let [x, y] = base[key];
      if (/^[kf][LR]$/.test(key)) y = y * R.leg; else y = y + 80 * (1 - R.leg);
      J[key] = [x * R.w, y * R.h];
    }
    const F = Ctx(P);
    F.hipL = add(J.pv, -8.6 * R.w, 0); F.hipR = add(J.pv, 8.6 * R.w, 0);
    const K = lookFor(o, R);
    const wa = o.wA != null ? o.wA : base.wA, oa = o.oA != null ? o.oA : base.oA;
    const openL = !!o.glowL && !o.off, openR = !!o.glowR && !o.w;
    let s = '';
    if (o.cape) s += capePart(F, J, R, K, o);
    if (!o.noHead && (o.helm === 'hair' || o.helm === 'flowhair' || (!o.helm && K.race === 'elf'))) s += backHair(F, J, R, K, o);
    if (o.robe) s += robePart(F, J, R, K, o, rr); else s += legPart(F, J, R, K, o, -1) + legPart(F, J, R, K, o, 1);
    s += skirtPart(F, J, R, K, o) + torsoPart(F, J, R, K, o, rr) + beltPart(F, J, R, K, o);
    s += armPart(F, J, R, K, o, -1) + armPart(F, J, R, K, o, 1) + pauldronPart(F, J, R, K, o, -1) + pauldronPart(F, J, R, K, o, 1);
    if (!o.noHead) s += headPart(F, J, R, K, o);
    if (o.cape) s += `<path d="M${pt(add(J.nk, -7 * R.w, 6))}Q${pt(add(J.nk, 0, 10))} ${pt(add(J.nk, 7 * R.w, 6))}" stroke="${K.trim}" stroke-width=".9" fill="none"/>` + dot(add(J.nk, -7 * R.w, 6), 2.2, K.trim) + dot(add(J.nk, 7 * R.w, 6), 2.2, K.trim) + dot(add(J.nk, -7.4 * R.w, 5.4), 0.7, '#fff');
    const wR = o.w ? weaponPart(F, o, P, o.w, J.hR, wa) : '', wL = o.off ? weaponPart(F, o, P, o.off, J.hL, oa, true) : '';
    s += o.off && isShield(o.off) ? handPart(F, J, R, K, o, -1) + wL : wL + handPart(F, J, R, K, o, -1, openL);
    s += o.w && isShield(o.w) ? handPart(F, J, R, K, o, 1) + wR : wR + handPart(F, J, R, K, o, 1, openR);
    let fx = '';
    if (o.w === 'bow' && o.pose === 'aim') {
      const tipT = [J.hR[0] - 1, J.hR[1] - 53], tipB = [J.hR[0] - 1, J.hR[1] + 53];
      fx += `<path d="M${pt(tipT)}L${pt(J.hL)}L${pt(tipB)}" stroke="#efe4c8" stroke-width=".7" fill="none"/>` + line(J.hL, add(J.hR, 24, 0), '#8a5a30', 1.4) + `<path d="M${pt(add(J.hR, 31, 0))}L${pt(add(J.hR, 23, -3))}L${pt(add(J.hR, 23, 3))}Z" fill="${o.wGlow || '#dfe6f0'}" stroke="${OL}" stroke-width=".5"/>` + `<path d="M${pt(add(J.hL, 2, 0))}l-6,-3l2,3l-2,3z" fill="#c8302a"/>` + (o.wGlow ? dot(add(J.hR, 28, 0), 7, o.wGlow, 0.5) : '');
    } else if (o.w === 'bow') fx += `<g transform="translate(${pt(J.hR)}) rotate(${wa}) scale(1.1)"><path d="M-1,-48L-1,48" stroke="#efe4c8" stroke-width=".6"/></g>`;
    if (o.emblem && !o.off && K.mat !== 'plate' && K.mat !== 'mail') fx += sun(add(J.ch, 2, 2), 5, o.emblem);
    if (o.glowR) fx += A.handGlow(J.hR, o.glowR, o.glowSize || 1);
    if (o.glowL) fx += A.handGlow(J.hL, o.glowL, o.glowSize || 1);

    return compose(F, s, fx, o, P, 36 * R.w);
  };
  function compose(F, s, fx, o, P, shadowRx) {
    const x = o.x != null ? o.x : 150, y = o.y != null ? o.y : 200, sc = o.s || 1, fl = o.flip ? -1 : 1;
    const fid = nid(), mid = nid();
    let defs = F.defs.join('') + `<g id="${fid}">${s}</g><mask id="${mid}" maskUnits="userSpaceOnUse" x="-280" y="-380" width="560" height="440"><use href="#${fid}" filter="url(#whiteF)"/></mask>`;
    let auraF = 'auraF';
    if (o.auraCol || o.spectral) { auraF = nid(); defs += `<filter id="${auraF}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="9"/><feComponentTransfer><feFuncA type="linear" slope="1.4"/></feComponentTransfer><feComposite in="SourceGraphic" operator="out" result="b"/><feFlood flood-color="${o.auraCol || o.spectral}"/><feComposite in2="b" operator="in"/></filter>`; }
    let ghost = '';
    if (o.spectral) { ghost = nid(); const [cr0, cg, cb] = rgb(isHex(o.spectral) ? o.spectral : '#9affd8').map(v => v / 255); defs += `<filter id="${ghost}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${[cr0, cg, cb].map(c => `${n1(c * 0.42)} ${n1(c * 0.82)} ${n1(c * 0.16)} 0 ${n1(c * 0.32)}`).join(' ')} 0 0 0 .72 0"/></filter>`; }
    let out = (o.shadow === false ? '' : `<ellipse cx="${x}" cy="${y + 1}" rx="${n1(shadowRx * sc)}" ry="${n1(5.4 * sc)}" fill="#000" opacity=".6" filter="url(#b2)"/>`);
    out += `<g transform="translate(${x},${y}) scale(${n1(sc * fl * 100) / 100},${sc})"><defs>${defs}</defs>`;
    if (o.aura !== false) out += `<use href="#${fid}" filter="url(#${auraF})" opacity="${o.auraOp || (o.spectral ? 0.7 : 0.45)}"/>`;
    out += `<use href="#${fid}" filter="url(#rimF)" opacity="${o.rimOp || 0.75}"/>`;
    if (o.spectral) out += `<use href="#${fid}" filter="url(#${ghost})"/>`;
    else out += `<use href="#${fid}"/><g mask="url(#${mid})"><rect x="-280" y="-380" width="560" height="440" fill="${P.sky[1]}" opacity=".1"/><rect x="-280" y="-380" width="560" height="440" fill="url(#figTop)" opacity=".85"/></g>`;
    return out + fx + '</g>';
  }

  /* ---------- painted beasts: wolf / lynx and bear, built from organic shaded parts ---------- */
  function paw(F, p, col, big, claws) {
    const k = big || 1;
    let s = shape(F, cr([add(p, -6 * k, -1), add(p, -5 * k, -6 * k), add(p, 3 * k, -6.6 * k), add(p, 8 * k, -2.6 * k), add(p, 8 * k, 0.6), add(p, -6 * k, 0.6)], true, 0.8), F.rad(col));
    for (const dx of [0, 3, 6]) s += line(add(p, dx * k, -3 * k), add(p, dx * k + 0.6, 0.2), mix(col, '#000', 0.5), 0.6, 0.8) + dot(add(p, dx * k + 1.4, -3.4 * k), 0.9 * k, mix(col, '#ffffff', 0.3), 0.5);
    s += qd(add(p, -5 * k, -5 * k), add(p, 0, -3.2 * k), add(p, 7 * k, -3.4 * k), mix(col, '#000', 0.45), 0.7, 0.6) + dot(add(p, -4.6 * k, -7 * k), 1 * k, mix(col, '#000', 0.35), 0.8) + ao(add(p, 0, -6.4 * k), 6 * k, 2 * k, 0.8);
    if (claws) for (const dx of [1.4, 4.4, 7.4]) s += `<path d="M${pt(add(p, dx * k, -0.6))}l${n1(2.4 * k)},${n1(1.6 * k)}l${n1(-2 * k)},${n1(0.2 * k)}z" fill="#f0e6cc" stroke="${OL}" stroke-width=".4"/>`;
    return s;
  }
  function clipped(F, d, inner) { const id = nid(); F.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); return `<g clip-path="url(#${id})">${inner}</g>`; }
  function wolfModel(o, P, r) {
    const F = Ctx(P), lynx = o.t === 'lynx';
    const fur = o.tone || (lynx ? '#c49658' : '#8e929c'), dark = mix(fur, '#16121c', 0.55), cream = lynx ? '#f6eedc' : '#e8e2d6', far = mix(fur, '#1a1030', 0.38), ec = o.eye || '#ffd23a';
    let s = '';
    // far legs
    s += limb(F, [34, -48], [38, -14], 12, 7, far, 'cloth', 0.1) + limb(F, [38, -14], [40, -3], 7, 6, far) + paw(F, [41, 0], far);
    s += limb(F, [-50, -52], [-62, -22], 15, 8, far, 'cloth', 0.12) + limb(F, [-62, -22], [-57, -3], 7.4, 6, far) + paw(F, [-56, 0], far);
    // tail
    if (lynx) s += shape(F, cr([[-58, -60], [-70, -62], [-74, -54], [-64, -50]], true), F.rad(fur)) + `<path d="M-72,-58l3,5" stroke="#1a1010" stroke-width="3"/>`;
    else { const td = cr([[-56, -62], [-72, -62], [-88, -50], [-98, -30], [-96, -18], [-90, -24], [-86, -32], [-78, -44], [-62, -50]], true, 0.9); s += shape(F, td, F.lin([-90, -20], [-60, -66], fur, 'cloth')) + clipped(F, td, `<path d="M-98,-22Q-92,-34 -84,-30" stroke="${cream}" stroke-width="7" fill="none" opacity=".8"/>` + A.strokeTex(r, [-100, -66, -56, -18], 'fur', { rim: hil(fur), dark, texK: 1.8 }, 22)); }
    // body
    const bd = cr([[-60, -62], [-40, -72], [-10, -70], [20, -74], [40, -82], [52, -72], [56, -52], [48, -34], [22, -31], [-10, -34], [-40, -36], [-60, -40], [-67, -52]], true, 0.92);
    s += shape(F, bd, F.lin([0, -28], [12, -84], fur, 'cloth'));
    s += clipped(F, bd, `<ellipse cx="8" cy="-31" rx="50" ry="9" fill="${cream}" opacity=".8"/>` + ao([-50, -46], 16, 12, 0.9) + ao([40, -60], 14, 12, 0.8) + `<path d="M-20,-70Q-6,-50 -16,-36M20,-72Q34,-56 26,-40" stroke="${dark}" stroke-width="1.6" fill="none" opacity=".45"/><path d="M-58,-52Q-46,-56 -40,-50M30,-56Q42,-62 50,-56" stroke="${hil2(fur)}" stroke-width="1" fill="none" opacity=".45"/>` + `<ellipse cx="-10" cy="-74" rx="50" ry="11" fill="${dark}" opacity=".55"/>` + A.strokeTex(r, [-70, -84, 58, -30], 'fur', { rim: hil2(fur), dark, texK: 2 }, 34) + `<path d="M-40,-58Q-30,-50 -36,-42M10,-60Q18,-52 14,-44" stroke="${dark}" stroke-width="1.2" fill="none" opacity=".6"/>`);
    if (lynx) for (let i = 0; i < 14; i++) s += clipped(F, bd, dot([-56 + (i * 37) % 104, -66 + (i * 13) % 26], 2.2, '#4a2a14', 0.65));
    // near legs: haunch and foreleg
    const hd = cr([[-34, -66], [-56, -64], [-68, -46], [-62, -30], [-50, -30], [-38, -44]], true, 0.9);
    s += shape(F, hd, F.rad(fur)) + clipped(F, hd, A.strokeTex(r, [-70, -66, -34, -28], 'fur', { rim: hil2(fur), dark, texK: 2 }, 26));
    s += limb(F, [-60, -32], [-54, -4], 9, 7, fur, 'cloth', 0.1) + paw(F, [-53, 0], fur, 1, true);
    s += limb(F, [42, -56], [48, -16], 15, 8.4, fur, 'cloth', 0.16) + limb(F, [48, -16], [50, -3], 8.2, 6.8, fur) + paw(F, [51, 0], fur, 1, true);
    // ruff, ears, head
    const ruff = []; for (let i = 0; i <= 12; i++) { const a = -2.2 + i * 0.34, rr = i % 2 ? 22 : 27; ruff.push([48 + Math.cos(a) * rr * 0.8, -78 + Math.sin(a) * rr]); }
    s += shape(F, cr(ruff, true, 0.7), F.rad(lynx ? fur : mix(fur, cream, 0.35)));
    const ear = (bx, tip, c) => shape(F, cr([[bx - 5, -100], tip, [bx + 6, -101]], true, 0.4), F.rad(c)) + `<path d="M${bx - 2},-101L${tip[0]},${tip[1] + 5}L${bx + 3},-101Z" fill="#c89090" opacity=".6"/>`;
    s += ear(70, lynx ? [74, -124] : [73, -120], far) + ear(61, lynx ? [60, -126] : [58, -122], fur) + (lynx ? line([60, -126], [60, -132], '#1a1010', 1.4) + line([74, -124], [75, -130], '#1a1010', 1.2) : '');
    const head = cr([[54, -98], [66, -106], [78, -101], [90, -90], [100, -81], [99, -75], [88, -71], [76, -69], [62, -74], [52, -86]], true, 0.9);
    s += shape(F, head, F.lin([60, -70], [80, -104], fur, 'cloth'));
    s += clipped(F, head, `<path d="M70,-76Q86,-74 100,-78L100,-70L70,-68Z" fill="${cream}" opacity=".9"/><path d="M76,-100Q86,-92 96,-84" stroke="${hil2(fur)}" stroke-width="2" fill="none" opacity=".6"/>` + A.strokeTex(r, [52, -106, 92, -70], 'fur', { rim: hil2(fur), dark, texK: 1.6 }, 30));
    s += `<path d="M73,-94Q78,-97 83,-93Q78,-90.6 73,-94Z" fill="${ec}" stroke="${OL}" stroke-width=".6"/>` + dot([78.6, -93.6], 1.1, '#120a06') + dot([77.6, -94.4], 0.5, '#fff') + qd([72, -97], [78, -99.6], [84, -95.6], dark, 1.2);
    s += `<ellipse cx="99" cy="-79.4" rx="3" ry="2.2" fill="#140c0c"/>` + dot([98, -80.4], 0.7, '#fff', 0.7);
    s += qd([86, -73.4], [92, -72.4], [99, -75.4], OL, 0.9);
    if (o.snarl !== false) for (const x of [88.6, 92, 95.4]) s += `<path d="M${x},-73.6l1.2,2.6l1.2,-2.6" fill="#f4eed8" stroke="${OL}" stroke-width=".3"/>`;
    s += `<path d="M84,-77.4l.1,0M87,-76.8l.1,0M85.6,-78.6l.1,0" stroke="${dark}" stroke-width="1" stroke-linecap="round"/>`;
    const fx = o.eye ? dot([78.6, -93.6], 4, ec, 0.45) : '';
    return compose(F, s, fx, Object.assign({ aura: false }, o), P, 56);
  }
  function bearModel(o, P, r) {
    const F = Ctx(P), fur = o.tone || '#7c5236', dark = mix(fur, '#140c10', 0.55), far = mix(fur, '#1a1030', 0.38), muzzle = '#d4aa78', ec = o.eye || '#2a1a0e';
    let s = '';
    s += limb(F, [30, -40], [32, -6], 20, 15, far, 'cloth', 0.1) + paw(F, [33, 0], far, 1.5);
    s += limb(F, [-46, -40], [-54, -6], 22, 15, far, 'cloth', 0.12) + paw(F, [-52, 0], far, 1.5);
    const bd = cr([[-70, -34], [-76, -58], [-58, -76], [-30, -86], [-4, -92], [20, -86], [40, -78], [52, -66], [56, -50], [48, -34], [24, -28], [-4, -28], [-34, -28], [-58, -28]], true, 0.92);
    s += shape(F, bd, F.lin([0, -26], [10, -94], fur, 'cloth'));
    s += clipped(F, bd, `<ellipse cx="-10" cy="-84" rx="46" ry="12" fill="${dark}" opacity=".45"/>` + ao([-48, -40], 20, 14, 0.9) + ao([38, -46], 18, 14, 0.9) + `<path d="M-30,-82Q-10,-60 -20,-36M14,-84Q30,-66 22,-40M-70,-50Q-56,-44 -40,-50" stroke="${dark}" stroke-width="1.8" fill="none" opacity=".4"/>` + A.strokeTex(r, [-78, -94, 58, -28], 'fur', { rim: hil2(fur), dark, texK: 2.1 }, 26));
    const hd = cr([[-40, -70], [-62, -66], [-72, -46], [-66, -30], [-50, -28], [-38, -44]], true, 0.9);
    s += shape(F, hd, F.rad(fur)) + clipped(F, hd, A.strokeTex(r, [-74, -72, -36, -26], 'fur', { rim: hil2(fur), dark, texK: 2 }, 22));
    s += limb(F, [-58, -34], [-56, -6], 18, 15, fur, 'cloth', 0.1) + paw(F, [-55, 0], fur, 1.5, true);
    s += limb(F, [40, -48], [42, -6], 22, 16, fur, 'cloth', 0.14) + paw(F, [43, 0], fur, 1.6, true);
    s += shape(F, `M70,-84a5,5 0 1 1 -2,10z`, F.rad(far)) + shape(F, `M58,-82a5.4,5.4 0 1 1 1,10.6z`, F.rad(fur));
    const head = cr([[50, -72], [60, -82], [74, -80], [84, -70], [94, -64], [98, -57], [96, -50], [86, -46], [72, -44], [58, -48], [50, -60]], true, 0.9);
    s += shape(F, head, F.lin([60, -44], [80, -84], fur, 'cloth'));
    s += clipped(F, head, `<path d="M80,-66Q92,-64 99,-58L98,-46L78,-46Z" fill="${muzzle}" opacity=".9"/>` + A.strokeTex(r, [50, -84, 86, -46], 'fur', { rim: hil2(fur), dark, texK: 1.7 }, 26));
    s += `<ellipse cx="97" cy="-56" rx="3.6" ry="2.8" fill="#140c0c"/>` + dot([96, -57], 0.8, '#fff', 0.7) + qd([88, -48.4], [93, -47.4], [97, -50], OL, 1) + dot([78, -66], 1.8, ec) + dot([77.5, -66.6], 0.6, '#fff', 0.8) + qd([74, -69.6], [78, -71], [82, -69], dark, 1.3);
    const fx = o.eye ? dot([78, -66], 4, o.eye, 0.45) : '';
    return compose(F, s, fx, Object.assign({ aura: false }, o), P, 60);
  }
  /* ---------- Vorthrax: a fully painted fantasy dragon ----------
     Three-quarter pose facing right: horned, crested skull with open jaws; spined neck; scaled chest with
     plated belly; thick hind legs and clawed forelegs; bat-like wings with finger bones, membrane gradients
     and tears; a long tapering tail with a blade. Fire glows through the throat and chest. */
  function dragonModel(o, P, r) {
    /* Prowling quadruped, facing left: heavy brow and swept horns, open jaw, thick neck, hunched spined back,
       massive plated chest and forelimbs planted on the rock, crouched hind legs, raised bat wings, curling tail. */
    const F = Ctx(P), fire = o.fire || '#ff7a1a', ec = o.eye || '#ffe27a';
    const sc = o.tone || '#9a2c1a', scD = mix(sc, '#140608', 0.55), scD2 = mix(sc, '#0a0408', 0.75), scL = mix(sc, '#ffb060', 0.35), scL2 = mix(sc, '#ffd8a0', 0.6);
    const belly = o.belly || '#c89a58', bellyD = mix(belly, '#3a1a08', 0.5), horn = '#d8c8a4', hornD = '#6e5a3c', memC = mix(sc, '#5a1008', 0.4);
    const far = c => mix(c, '#1a1030', 0.42);
    const tooth = (x, y, up, l) => `<path d="M${n1(x)},${n1(y)}q${n1(-l * 0.25)},${n1(up ? -l * 0.5 : l * 0.5)} ${n1(-l * 0.45)},${n1(up ? -l : l)}q${n1(-l * 0.35)},${n1(up ? l * 0.55 : -l * 0.55)} ${n1(-l * 0.9)},0z" fill="${F.hor('#f4eed8', 'skin')}" stroke="${OL}" stroke-width=".5"/>`;
    const claw = (pnt, d, w) => { const u = unit(d), n = perp(u), L = len(d); return shape(F, `M${pt(sum(pnt, mul(n, w)))}Q${pt(sum(sum(pnt, mul(u, L * 0.55)), mul(n, w * 0.5 - L * 0.12)))} ${pt(sum(pnt, d))}Q${pt(sum(sum(pnt, mul(u, L * 0.5)), mul(n, -w * 0.3 - L * 0.12)))} ${pt(sum(pnt, mul(n, -w)))}Z`, F.hor('#cfc4b0', 'skin'), ' stroke-width=".7"') + qd(sum(pnt, mul(n, w * 0.4)), sum(sum(pnt, mul(u, L * 0.5)), mul(n, -L * 0.05)), sum(pnt, mul(u, L * 0.9)), '#5a4a3a', 0.6, 0.6); };
    // big plated scales: staggered rounded tiles with a lit top edge and a dark underside
    const plates = (box, w, h, col, k) => { let t = ''; const [x0, y0, x1, y1] = box; for (let y = y0, row = 0; y < y1; y += h * 0.82, row++) for (let x = x0 + (row % 2) * w * 0.55; x < x1; x += w * 1.1) { const dx = (r() - 0.5) * 3, dy = (r() - 0.5) * 2.5, ww = w * (0.7 + r() * 0.5), hh = h * (0.8 + r() * 0.4), rot = (r() - 0.5) * 16; const c = mix(col, k ? '#ffc080' : '#000', 0.04 + r() * 0.16); t += `<g transform="rotate(${n1(rot)} ${n1(x + dx)} ${n1(y + dy)})"><path d="M${n1(x + dx - ww * 0.5)},${n1(y + dy)}q0,${n1(-hh * 0.55)} ${n1(ww * 0.5)},${n1(-hh * 0.55)}q${n1(ww * 0.5)},0 ${n1(ww * 0.5)},${n1(hh * 0.55)}q0,${n1(hh * 0.6)} ${n1(-ww * 0.5)},${n1(hh * 0.6)}q${n1(-ww * 0.5)},0 ${n1(-ww * 0.5)},${n1(-hh * 0.6)}z" fill="${c}" stroke="${scD2}" stroke-width=".7" opacity=".85"/><path d="M${n1(x + dx - ww * 0.28)},${n1(y + dy - hh * 0.22)}q${n1(ww * 0.28)},${n1(-hh * 0.22)} ${n1(ww * 0.56)},0" stroke="${scL2}" stroke-width=".9" fill="none" opacity=".5"/><path d="M${n1(x + dx - ww * 0.3)},${n1(y + dy + hh * 0.3)}q${n1(ww * 0.3)},${n1(hh * 0.22)} ${n1(ww * 0.6)},0" stroke="${scD2}" stroke-width="1.2" fill="none" opacity=".45"/></g>`; } return t; };
    const scaleRows = (box, step, col, colL) => { let t = ''; const [x0, y0, x1, y1] = box; for (let y = y0, row = 0; y < y1; y += step * 0.78, row++) for (let x = x0 + (row % 2) * step * 0.5; x < x1; x += step) { const dx = (r() - 0.5) * 1.2, dy = (r() - 0.5) * 1.2; t += `<path d="M${n1(x + dx)},${n1(y + dy)}q${n1(step * 0.5)},${n1(-step * 0.9)} ${n1(step)},0" stroke="${col}" stroke-width=".7" fill="none" opacity=".55"/><path d="M${n1(x + dx + step * 0.3)},${n1(y + dy - step * 0.3)}q${n1(step * 0.2)},${n1(-step * 0.25)} ${n1(step * 0.45)},${n1(-step * 0.05)}" stroke="${colL}" stroke-width=".5" fill="none" opacity=".45"/>`; } return t; };
    const spine = (a, b, h, lean) => { const u = unit(sub(b, a)), n = perp(u), m = lerp(a, b, 0.5), tip = sum(sum(m, mul(n, -h)), mul(u, (lean || 0) * h)); return shape(F, `M${pt(a)}Q${pt(sum(lerp(a, tip, 0.5), mul(n, -h * 0.08)))} ${pt(tip)}Q${pt(sum(lerp(tip, b, 0.5), mul(n, h * 0.15)))} ${pt(b)}Z`, F.hor(mix(scD, horn, 0.25), 'cloth'), ' stroke-width=".7"') + line(lerp(a, tip, 0.2), lerp(a, tip, 0.85), scL2, 0.5, 0.5) + dot(lerp(tip, lerp(a, b, 0.5), 0.12), 1.2, horn, 0.8); };
    const lavaGlow = (box) => `<rect x="${box[0]}" y="${box[1]}" width="${box[2] - box[0]}" height="${box[3] - box[1]}" fill="url(#dragonUnder)"/>`;
    F.defs.push(`<linearGradient id="dragonUnder" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="${fire}" stop-opacity="0"/><stop offset="1" stop-color="${fire}" stop-opacity=".3"/></linearGradient>`);
    const foot = (p, dir, col, k, nClaws) => { // dir: -1 toes point left
      const c = col, cD = mix(col, '#000', 0.4); let f = shape(F, cr([add(p, -12 * k, -2), add(p, -8 * k, -12 * k), add(p, 6 * k, -12 * k), add(p, 14 * k, -4), add(p, 12 * k, 2), add(p, -10 * k, 2)], true, 0.75), F.rad(c));
      f += clipped(F, cr([add(p, -12 * k, -2), add(p, -8 * k, -12 * k), add(p, 6 * k, -12 * k), add(p, 14 * k, -4), add(p, 12 * k, 2), add(p, -10 * k, 2)], true, 0.75), scaleRows([p[0] - 16 * k, p[1] - 16 * k, p[0] + 16 * k, p[1] + 4], 3.6 * k, cD, mix(col, '#fff', 0.3)) + ao(add(p, 0, -11 * k), 10 * k, 3 * k, 0.8));
      for (let i = 0; i < (nClaws || 4); i++) { const tx = p[0] + (-10 + i * 7) * k * (dir < 0 ? 1 : -1) * -1 * dir, ty = p[1] - 4 * k + i * 0.5; const tp = [p[0] + (-9 + i * 6.5) * k, ty]; f += dot(add(tp, 0, 1), 2.4 * k, cD, 0.6) + line(add(tp, 0, -6 * k), add(tp, 0, 1), cD, 1, 0.5) + claw(add(tp, 0, 1), [dir * 5 * k, 7 * k], 2.2 * k); }
      return f;
    };
    let s = '';
    /* ---- wings ---- */
    const wing = (isFar) => {
      const k = isFar ? -1 : 1, col = isFar ? far(sc) : sc, mc = isFar ? far(memC) : memC;
      const sh = isFar ? [-6, -104] : [26, -108], el = isFar ? [-62, -166] : [74, -168], wr = isFar ? [-124, -176] : [136, -180];
      const tips = isFar ? [[-186, -158], [-196, -120], [-178, -90], [-150, -84]] : [[206, -150], [214, -104], [194, -66], [156, -52]];
      const mids = isFar ? [[-178, -140], [-172, -104], [-150, -92]] : [[200, -128], [194, -84], [160, -62]];
      const back = isFar ? [-40, -104] : [86, -74];
      let mem = `M${pt(sh)}L${pt(el)}L${pt(wr)}L${pt(tips[0])}`;
      for (let i = 0; i < 3; i++) mem += `Q${pt(mids[i])} ${pt(tips[i + 1])}`;
      mem += `Q${pt(lerp(tips[3], back, 0.5))} ${pt(back)}Z`;
      const gid = nid();
      F.defs.push(`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${sh[0]}" y1="${sh[1]}" x2="${tips[1][0]}" y2="${tips[1][1]}"><stop offset="0" stop-color="${mix(col, '#1a0606', 0.55)}"/><stop offset=".45" stop-color="${mix(mc, '#2a0808', 0.3)}"/><stop offset=".85" stop-color="${mc}"/><stop offset="1" stop-color="${mix(mc, fire, 0.45)}"/></linearGradient>`);
      let w = `<path d="${mem}" fill="url(#${gid})" stroke="${OL}" stroke-width="1.2" opacity="${isFar ? 0.85 : 0.97}"/>`;
      const cid = nid(); F.defs.push(`<clipPath id="${cid}"><path d="${mem}"/></clipPath>`);
      let inner = `<ellipse cx="${n1(tips[1][0] * 0.8)}" cy="${n1(tips[1][1] + 10)}" rx="30" ry="40" fill="${fire}" opacity=".25" filter="url(#b8)"/>`;
      for (let i = 0; i < 3; i++) { const a = tips[i], b = tips[i + 1]; inner += `<path d="M${pt(wr)}L${pt(a)}Q${pt(mids[i])} ${pt(b)}Z" fill="#000" opacity="${0.07 + i * 0.05}"/>` + qd(lerp(wr, a, 0.5), lerp(wr, mids[i], 0.8), lerp(wr, b, 0.5), '#000', 8, 0.2, ' filter="url(#b4)"'); }
      for (const t of tips) { const u = unit(sub(t, wr)), n = perp(u); for (let j = 1; j < 6; j++) { const q = lerp(wr, t, j / 6), vl = (6 - j) * 3.2; inner += qd(q, sum(sum(q, mul(u, vl * 0.5)), mul(n, vl * 0.6 * k)), sum(sum(q, mul(u, vl * 0.9)), mul(n, vl * 1.3 * k)), '#2a0a0a', 0.55, 0.45) + qd(q, sum(sum(q, mul(u, vl * 0.4)), mul(n, -vl * 0.5 * k)), sum(sum(q, mul(u, vl * 0.8)), mul(n, -vl * 1.1 * k)), '#2a0a0a', 0.45, 0.35); } }
      for (let i = 0; i < 3; i++) { const q = lerp(wr, tips[i + 1], 0.82 + i * 0.04); inner += `<path d="M${pt(q)}l${n1(4 * k)},-7l${n1(3 * k)},9l${n1(-2 * k)},2z" fill="#000" opacity=".55"/>`; }
      inner += `<path d="M${pt(sh)}L${pt(el)}L${pt(wr)}L${pt(lerp(sh, wr, 0.5))}Z" fill="#000" opacity=".3" filter="url(#b4)"/>` + ao(wr, 14, 10, 0.9) + ao(el, 12, 9, 0.8);
      w += `<g clip-path="url(#${cid})">${inner}</g>`;
      for (const t of tips) { w += line(wr, t, '#2a0a0a', 3.4, 0.7) + line(wr, t, mix(col, '#e0b090', 0.3), 1.5, 0.8) + line(wr, t, '#ffd8b0', 0.4, 0.45); for (let j = 1; j < 4; j++) { const q = lerp(wr, t, j * 0.3); w += dot(q, 2, mix(col, '#000', 0.3)) + dot(add(q, -0.4, -0.5), 1, mix(col, '#ffd0a0', 0.4), 0.8); } }
      w += limb(F, sh, el, 18, 12, col, 'cloth', 0.18) + limb(F, el, wr, 12, 8, col, 'cloth', 0.1);
      w += clipped(F, limbD(sh, el, 18, 12, 0.18), scaleRows([Math.min(sh[0], el[0]) - 20, el[1] - 20, Math.max(sh[0], el[0]) + 20, sh[1] + 20], 4.5, scD, scL));
      w += `<ellipse cx="${n1(el[0])}" cy="${n1(el[1])}" rx="7" ry="6" fill="${F.rad(col)}" stroke="${OL}" stroke-width=".8"/>` + dot(el, 2.4, scD) + `<ellipse cx="${n1(wr[0])}" cy="${n1(wr[1])}" rx="6" ry="5" fill="${F.rad(col)}" stroke="${OL}" stroke-width=".8"/>`;
      w += claw(wr, [-14 * k, -16], 3) + claw(add(wr, -2 * k, 2), [-18 * k, -6], 2.4);
      for (const t of tips) w += claw(t, [3 * k, 9], 1.8);
      return w;
    };
    s += wing(true);
    /* ---- far legs ---- */
    s += limb(F, [44, -72], [60, -36], 24, 14, far(sc), 'cloth', 0.2) + limb(F, [60, -36], [56, -8], 13, 10, far(sc), 'cloth', 0.08) + dot([60, -36], 5, far(scD), 0.7) + foot([52, -2], -1, far(sc), 1, 3);
    s += limb(F, [-22, -70], [-34, -34], 18, 12, far(sc), 'cloth', 0.16) + limb(F, [-34, -34], [-44, -6], 12, 9, far(sc), 'cloth', 0.06) + dot([-34, -34], 4.5, far(scD), 0.7) + foot([-50, -2], -1, far(sc), 1, 3);
    s += wing(false);
    /* ---- body: hips/haunch, barrel, hunched back with dorsal plates, pectoral mass ---- */
    const body = cr([[-44, -100], [-14, -118], [26, -126], [60, -116], [86, -92], [92, -60], [78, -38], [40, -30], [0, -34], [-40, -44], [-60, -66], [-58, -88]], true, 0.92);
    s += shape(F, body, F.lin([0, -30], [20, -126], sc, 'cloth'));
    let bin = scaleRows([-66, -130, 100, -24], 5.5, scD, scL) + `<ellipse cx="20" cy="-30" rx="80" ry="26" fill="#000" opacity=".35" filter="url(#b8)"/><ellipse cx="16" cy="-118" rx="50" ry="14" fill="${scL2}" opacity=".22" filter="url(#b8)"/>` + ao([-50, -70], 14, 26, 0.8) + ao([70, -60], 16, 24, 0.7) + `<path d="M-44,-98Q10,-96 70,-88" stroke="${scD2}" stroke-width="3" fill="none" opacity=".35"/>`;
    for (let i = 0; i < 3; i++) bin += qd([-30 + i * 2, -70 + i * 10], [-6 + i * 2, -58 + i * 10], [20 + i * 3, -54 + i * 10], scD2, 1.4, 0.4 - i * 0.08);
    bin += `<ellipse cx="-10" cy="-116" rx="60" ry="10" fill="${scD2}" opacity=".45"/>` + qd([-40, -46], [0, -36], [60, -40], '#000', 5, 0.3, ' filter="url(#b2)"');
    // belly plates along the underside
    let scutes = '';
    for (let i = 0; i < 11; i++) { const x = -46 + i * 12, yy = -44 + Math.sin(i / 10 * Math.PI) * 10 - 6; scutes += `<path d="M${n1(x)},${n1(yy)}Q${n1(x + 6)},${n1(yy + 4)} ${n1(x + 12)},${n1(yy)}L${n1(x + 12)},${n1(yy + 14)}Q${n1(x + 6)},${n1(yy + 20)} ${n1(x)},${n1(yy + 14)}Z" fill="${F.hor(belly, 'cloth')}" stroke="${OL}" stroke-width=".8"/>` + qd([x + 1.5, yy + 1.5], [x + 6, yy + 5], [x + 10.5, yy + 1.5], hil2(belly), 0.7, 0.6) + line([x + 6, yy + 4], [x + 6, yy + 15], bellyD, 0.6, 0.45) + `<path d="M${n1(x)},${n1(yy + 14)}Q${n1(x + 6)},${n1(yy + 20)} ${n1(x + 12)},${n1(yy + 14)}" stroke="${bellyD}" stroke-width="2" fill="none" opacity=".55"/>`; }
    bin += scutes + `<ellipse cx="-30" cy="-60" rx="20" ry="22" fill="${fire}" opacity=".25" filter="url(#b8)"/>` + lavaGlow([-66, -130, 100, -24]);
    s += clipped(F, body, bin);
    // near haunch
    const nearH = cr([[36, -94], [70, -100], [94, -78], [94, -46], [74, -30], [46, -34], [30, -58]], true, 0.9);
    s += shape(F, nearH, F.rad(sc)) + clipped(F, nearH, plates([24, -104, 102, -26], 15, 12, sc) + ao([40, -50], 10, 20, 0.8, -20) + `<path d="M44,-90Q72,-96 88,-74" stroke="${scL2}" stroke-width="2" fill="none" opacity=".4"/><path d="M40,-40Q60,-32 80,-36" stroke="${scD2}" stroke-width="1.8" fill="none" opacity=".55"/>` + lavaGlow([26, -104, 100, -26]));
    s += qd([34, -92], [26, -64], [40, -36], scD2, 1.4, 0.6);
    /* ---- tail: from the hips, up and curling over behind the haunch ---- */
    const tail = A.tube([80, -52], [150, -34], [190, -100], [130, -140], 18, 3, 26);
    s += shape(F, tail.d, F.lin([120, -40], [160, -130], sc, 'cloth'));
    s += clipped(F, tail.d, scaleRows([70, -150, 200, -20], 5, scD, scL) + tail.pts.map((q, i) => i % 2 ? '' : `<path d="M${n1(q.x + q.nx * q.w * 0.9)},${n1(q.y + q.ny * q.w * 0.9)}L${n1(q.x - q.nx * q.w * 0.9)},${n1(q.y - q.ny * q.w * 0.9)}" stroke="${scD2}" stroke-width="1.2" opacity=".5"/>`).join('') + `<path d="M${tail.pts.map(q => `${n1(q.x + q.nx * q.w * 0.55)},${n1(q.y + q.ny * q.w * 0.55)}`).join('L')}" stroke="${belly}" stroke-width="7" fill="none" opacity=".55"/>` + lavaGlow([70, -150, 200, -20]));
    tail.pts.forEach((q, i) => { if (i % 2 === 0 && i < 22) s += spine([q.x - q.nx * q.w * 0.9, q.y - q.ny * q.w * 0.9], [q.x - q.nx * q.w * 0.9 + 6, q.y - q.ny * q.w * 0.9 + 2], 9 - i * 0.3, 0.3); });
    s += shape(F, `M${pt([tail.pts[tail.pts.length - 1].x, tail.pts[tail.pts.length - 1].y])}l-10,-14l-6,8l-10,-10l4,18l12,2z`, F.hor(scD, 'cloth'));
    // dorsal plates along the back ridge
    const ridge = [[-50, -96], [-34, -108], [-16, -118], [4, -124], [24, -127], [44, -124], [62, -116], [78, -102], [88, -84]];
    for (let i = 0; i < ridge.length - 1; i++) { const a = ridge[i], b = ridge[i + 1]; s += spine(a, b, 16 + Math.sin(i / 8 * Math.PI) * 12, 0.3); }
    // pectoral / shoulder mass
    const pec = cr([[-66, -84], [-36, -98], [-8, -88], [-2, -62], [-18, -40], [-50, -40], [-70, -58]], true, 0.9);
    s += shape(F, pec, F.rad(sc)) + clipped(F, pec, plates([-78, -104, 6, -34], 17, 13, sc, 1) + `<path d="M-60,-80Q-36,-94 -12,-82" stroke="${scL2}" stroke-width="2.2" fill="none" opacity=".45"/><path d="M-44,-66Q-30,-56 -34,-42" stroke="${scD2}" stroke-width="2" fill="none" opacity=".5"/><path d="M-20,-58Q-30,-70 -46,-64" stroke="${scD2}" stroke-width="1.4" fill="none" opacity=".45"/>` + ao([-56, -48], 14, 8, 0.9) + `<ellipse cx="-34" cy="-66" rx="16" ry="18" fill="${fire}" opacity=".22" filter="url(#b8)"/>`);
    s += qd([-66, -84], [-72, -62], [-56, -42], scD2, 1.4, 0.6);
    /* ---- near legs ---- */
    s += limb(F, [60, -50], [84, -26], 18, 12, sc, 'cloth', 0.14) + limb(F, [84, -26], [80, -6], 12, 9, sc, 'cloth', 0.06);
    s += clipped(F, limbD([60, -50], [84, -26], 18, 12, 0.14), scaleRows([40, -70, 100, -10], 4.5, scD, scL)) + `<ellipse cx="84" cy="-26" rx="7" ry="6" fill="${F.rad(sc)}" stroke="${OL}" stroke-width=".8"/>` + dot([84, -26], 2.4, scD, 0.7) + claw([90, -30], [8, -6], 1.8) + foot([76, -1], -1, sc, 1.1, 4);
    s += limb(F, [-44, -74], [-72, -38], 28, 18, sc, 'cloth', 0.24) + limb(F, [-72, -38], [-92, -10], 18, 13, sc, 'cloth', 0.1);
    s += clipped(F, limbD([-44, -74], [-72, -38], 28, 18, 0.24), plates([-96, -94, -20, -20], 12, 9, sc) + qd([-54, -72], [-70, -60], [-72, -44], scL2, 1.6, 0.4)) + clipped(F, limbD([-72, -38], [-92, -10], 18, 13, 0.1), scaleRows([-108, -50, -56, 0], 4.2, scD, scL));
    s += `<ellipse cx="-72" cy="-38" rx="9" ry="8" fill="${F.rad(sc)}" stroke="${OL}" stroke-width=".8"/>` + dot([-72, -38], 3, scD, 0.7) + claw([-66, -44], [8, -8], 2) + foot([-98, -1], -1, sc, 1.25, 4);
    /* ---- neck ---- */
    const neck = A.tube([-30, -100], [-50, -104], [-70, -108], [-88, -110], 30, 22, 14);
    s += shape(F, neck.d, F.lin([-60, -80], [-50, -130], sc, 'cloth'));
    let nin = plates([-100, -130, -20, -78], 12, 9, sc);
    neck.pts.forEach((q, i) => { if (i % 2 === 1) { const a = [q.x - q.nx * q.w * 0.95, q.y - q.ny * q.w * 0.95], b = [q.x - q.nx * q.w * 0.1, q.y - q.ny * q.w * 0.1], m = [q.x - q.nx * q.w * 0.5 - 2, q.y - q.ny * q.w * 0.5 + 3]; nin += qd(a, m, b, belly, 4.5, 0.85) + qd(add(a, 0, 2.6), add(m, 0, 2.6), add(b, 0, 2.6), bellyD, 1.8, 0.6) + qd(add(a, -0.5, -1.4), add(m, -0.5, -1.4), add(b, -0.5, -1.4), hil2(belly), 0.6, 0.5); } });
    nin += `<path d="M-36,-92Q-60,-96 -84,-98" stroke="${fire}" stroke-width="8" fill="none" opacity=".45" filter="url(#b4)"/>` + ao([-34, -100], 8, 16, 0.9) + lavaGlow([-100, -130, -20, -78]);
    s += clipped(F, neck.d, nin);
    neck.pts.forEach((q, i) => { if (i % 2 === 0 && i > 1 && i < 13) s += spine([q.x + q.nx * q.w * 0.95, q.y + q.ny * q.w * 0.95], [q.x + q.nx * q.w * 0.95 + 6, q.y + q.ny * q.w * 0.95 + 1], 12, 0.35); });
    /* ---- head: heavy brow, swept horns, open jaw ---- */
    s += '<g transform="translate(-78,-108) scale(1.22) translate(78,108)">';
    const head = cr([[-76, -124], [-94, -130], [-114, -126], [-134, -116], [-146, -104], [-146, -94], [-134, -90], [-116, -90], [-98, -94], [-82, -100], [-72, -112]], true, 0.9);
    const jaw = cr([[-84, -96], [-100, -92], [-120, -82], [-140, -66], [-138, -56], [-122, -62], [-104, -74], [-88, -86]], true, 0.85);
    s += shape(F, jaw, F.lin([-100, -60], [-110, -96], mix(sc, '#000', 0.2), 'cloth')) + clipped(F, jaw, scaleRows([-144, -100, -80, -56], 3.6, scD, scL) + `<path d="M-90,-90Q-116,-80 -136,-66" stroke="${belly}" stroke-width="5" fill="none" opacity=".65"/>`);
    s += `<path d="M-86,-98Q-110,-90 -136,-74Q-114,-84 -88,-100Z" fill="#2a0404"/><ellipse cx="-110" cy="-88" rx="18" ry="4" fill="${fire}" opacity=".85" filter="url(#b2)" transform="rotate(-24 -110 -88)"/>`;
    s += `<path d="M-92,-92Q-110,-84 -130,-74" stroke="#b03030" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M-130,-74l-6,-1l2,3M-130,-74l-4,4" stroke="#b03030" stroke-width="1.6" fill="none"/>`;
    for (const [x, y, l] of [[-90, -92, 5], [-100, -88, 6], [-112, -82, 6.5], [-124, -76, 6], [-134, -70, 5]]) s += tooth(x, y, true, l);
    s += shape(F, head, F.lin([-100, -92], [-110, -132], sc, 'cloth'));
    s += clipped(F, head, plates([-150, -134, -70, -88], 9, 7, sc) + qd([-134, -116], [-110, -128], [-84, -124], scL2, 2.4, 0.5) + `<path d="M-80,-104Q-110,-96 -140,-94" stroke="${scD2}" stroke-width="2.2" fill="none" opacity=".55"/>` + ao([-80, -108], 10, 10, 0.8) + `<path d="M-130,-110Q-118,-118 -100,-114Q-112,-108 -130,-110Z" fill="${scD2}" opacity=".35"/>`);
    for (const [x, y, l] of [[-92, -98, 5], [-104, -95, 6], [-116, -92, 6.5], [-128, -92, 6], [-138, -95, 5]]) s += tooth(x, y, false, l);
    s += dot([-140, -106], 2.4, '#2a0404') + dot([-143, -104], 1.6, '#2a0404') + qd([-84, -98], [-110, -92], [-140, -93], scD2, 1.4, 0.7) + `<circle cx="-84" cy="-96" r="3.6" fill="${F.rad(scD)}" stroke="${OL}" stroke-width=".6"/>`;
    // eye under a heavy brow ridge
    s += `<path d="M-124,-114Q-114,-121 -104,-114Q-114,-108 -124,-114Z" fill="${ec}" stroke="${OL}" stroke-width=".6"/>` + `<ellipse cx="-113" cy="-114" rx="1.6" ry="3.6" fill="#140404"/>` + dot([-116, -116], 1, '#fff', 0.85) + dot([-114, -114], 6, ec, 0.4);
    s += shape(F, 'M-130,-116Q-114,-128 -98,-116Q-100,-120 -114,-124Q-126,-122 -130,-116Z', F.hor(scD, 'cloth')) + qd([-128, -117], [-114, -124], [-100, -117], scL, 0.9, 0.6) + qd([-122, -112], [-114, -108.6], [-106, -112], scD, 1.2);
    s += `<path d="M-92,-126l-3,8M-90,-124l-4,9" stroke="${scD2}" stroke-width=".9" opacity=".7"/>`;
    // horns sweeping back, ridged; nose horn; cheek spikes; crest spines
    const h1 = A.tube([-84, -126], [-72, -150], [-44, -160], [-30, -142], 8, 1.5, 16), h2 = A.tube([-96, -128], [-90, -152], [-64, -166], [-50, -152], 7, 1.5, 16), h3 = A.tube([-76, -118], [-62, -128], [-50, -132], [-40, -128], 4, 1, 10);
    for (const h of [h2, h1, h3]) { s += shape(F, h.d, F.hor(horn, 'skin')); for (let i = 1; i < h.pts.length - 1; i += 2) { const q = h.pts[i]; s += line([q.x + q.nx * q.w, q.y + q.ny * q.w], [q.x - q.nx * q.w, q.y - q.ny * q.w], hornD, 0.8, 0.85) + line([q.x + q.nx * q.w * 0.3, q.y + q.ny * q.w * 0.3 - 1], [q.x - q.nx * q.w * 0.3, q.y - q.ny * q.w * 0.3 - 1], '#fff8e8', 0.5, 0.5); } s += line([h.pts[2].x, h.pts[2].y], [h.pts[h.pts.length - 2].x, h.pts[h.pts.length - 2].y], '#fff8e8', 0.8, 0.35); }
    s += claw([-140, -116], [-8, -14], 2.4) + claw([-80, -124], [6, -14], 1.6) + claw([-90, -130], [4, -14], 1.8) + claw([-86, -92], [6, 10], 1.6) + claw([-96, -90], [4, 12], 1.4) + claw([-104, -128], [-2, -12], 1.4);
    s += ao([-84, -112], 14, 10, 0.8, 20) + '</g>';
    /* ---- breath + glows ---- */
    let fx = '';
    if (o.breath) fx += `<path d="M-142,-82Q-190,-70 -240,-10L-280,-50Q-210,-100 -146,-92Z" fill="${fire}" opacity=".5" filter="url(#b8)"/><path d="M-142,-82Q-186,-72 -224,-26L-250,-52Q-200,-94 -146,-90Z" fill="${fire}" opacity=".7" filter="url(#b4)"/><path d="M-144,-84Q-180,-76 -210,-40L-228,-58Q-190,-88 -146,-90Z" fill="#ffd27a" opacity=".85" filter="url(#b2)"/><path d="M-146,-86Q-172,-80 -192,-56" stroke="#fff6d0" stroke-width="3" fill="none" opacity=".9" filter="url(#b1)"/>` + [[-170, -62], [-190, -48], [-160, -88], [-205, -38], [-220, -28], [-180, -76]].map(([x, y]) => dot([x, y], 1.5 + r() * 3, '#ffe9a0', 0.9)).join('');
    else fx += `<ellipse cx="-138" cy="-80" rx="10" ry="4" fill="${fire}" opacity=".8" filter="url(#b1)"/>`;
    fx += dot([-114, -114], 9, ec, 0.3) + `<ellipse cx="-34" cy="-66" rx="24" ry="28" fill="${fire}" opacity=".14" filter="url(#b8)"/>`;
    return compose(F, s, fx, Object.assign({ auraCol: fire, auraOp: 0.3 }, o, { s: (o.s || 1) * 0.78 }), P, 110);
  }
  L.dragon = function (o, P, r) { return o.legacy || o.spectral ? dragonOld(o, P, r) : dragonModel(o, P, r || A.rng(5)); };


  /* ---------- Skyreach Gryphon: eagle forequarters, lion hindquarters ---------- */
  function gryphonModel(o, P, r) {
    const F = Ctx(P), fur = o.tone || '#b8884a', furD = mix(fur, '#2a160a', 0.5), furL = mix(fur, '#ffe6b0', 0.4);
    const fe = o.feather || '#e8dcc0', feD = mix(fe, '#5a4020', 0.45), feL = '#fff8ea', gold = '#d8a850', goldD = '#8a6220';
    const beak = '#e8b830', beakD = '#8a6010', ec = o.eye || '#ffd23a', far = c => mix(c, '#1a1030', 0.38);
    const feather = (p, d, w, col, colD, op) => { const u = unit(d), n = perp(u), L = len(d), q1 = sum(sum(p, mul(u, L * 0.45)), mul(n, w)), q2 = sum(sum(p, mul(u, L * 0.45)), mul(n, -w)); return `<path d="M${pt(p)}Q${pt(q1)} ${pt(sum(p, d))}Q${pt(q2)} ${pt(p)}Z" fill="${col}" stroke="${mix(colD, '#000', 0.3)}" stroke-width=".7" opacity="${op || 1}"/><path d="M${pt(p)}Q${pt(q2)} ${pt(sum(p, d))}" stroke="${colD}" stroke-width="${n1(w * 0.5)}" fill="none" opacity=".35"/>` + line(sum(p, mul(u, L * 0.1)), sum(p, mul(u, L * 0.82)), colD, 0.5, 0.5); };
    const talon = (pnt, d, w) => { const u = unit(d), n = perp(u), L = len(d); return shape(F, `M${pt(sum(pnt, mul(n, w)))}Q${pt(sum(sum(pnt, mul(u, L * 0.55)), mul(n, w * 0.5 + L * 0.14)))} ${pt(sum(pnt, d))}Q${pt(sum(sum(pnt, mul(u, L * 0.5)), mul(n, -w * 0.3 + L * 0.12)))} ${pt(sum(pnt, mul(n, -w)))}Z`, F.hor('#2a2420', 'skin'), ' stroke-width=".5"'); };
    const eagleFoot = (p, col, k, isFar) => { const c = isFar ? far(col) : col, cD = mix(c, '#000', 0.4); let f = ''; for (const [dx, dy, L] of [[-2, -1, 10], [3, -2, 12], [8, -1, 10]]) { const a = add(p, dx * k, dy * k), b = add(p, (dx + L) * k, -1 * k); f += limb(F, a, b, 4.2 * k, 3 * k, c, 'skin', 0.05) + dot(lerp(a, b, 0.5), 1.4 * k, cD, 0.6) + talon(b, [5 * k, 3 * k], 1.5 * k); } f += limb(F, add(p, 0, -2 * k), add(p, -8 * k, 0), 3.6 * k, 2.6 * k, c, 'skin', 0.05) + talon(add(p, -8 * k, 0), [-4 * k, 3 * k], 1.3 * k); return f; };
    let s = '';
    /* ---- wings ---- */
    const wing = (isFar) => {
      const ox = isFar ? 16 : 0, oy = isFar ? -4 : 0, c = isFar ? far(fe) : fe, cD = isFar ? far(feD) : feD, cL = isFar ? far(feL) : feL, cG = isFar ? far(gold) : gold, cGD = isFar ? far(goldD) : goldD;
      const sh = [2 + ox, -76 + oy], el = [-30 + ox, -116 + oy], wr = [-74 + ox, -124 + oy];
      const tips = [[-128 + ox, -114 + oy], [-134 + ox, -96 + oy], [-126 + ox, -76 + oy], [-110 + ox, -60 + oy], [-90 + ox, -50 + oy], [-68 + ox, -48 + oy]];
      let w = `<path d="M${pt(sh)}L${pt(el)}L${pt(wr)}L${pt(tips[0])}Q${pt([-140 + ox, -86 + oy])} ${pt(tips[3])}Q${pt([-96 + ox, -46 + oy])} ${pt([-50 + ox, -54 + oy])}Q${pt([-24 + ox, -62 + oy])} ${pt(sh)}Z" fill="${mix(cD, '#1a1208', 0.35)}" stroke="${OL}" stroke-width="1"/>`;
      // primaries fanning from the wrist, secondaries hanging from the forearm, two rows of coverts
      for (let i = 0; i < tips.length; i++) { const t = tips[i], base = lerp(wr, el, i * 0.08); w += feather(base, sub(t, base), 9 - i * 0.5, i % 2 ? c : mix(c, cG, 0.35), cD); }
      for (let i = 0; i < 7; i++) { const base = lerp(el, wr, 0.12 + i * 0.12), t = add(base, -18 + i * 1.5, 46 - i * 2); w += feather(base, sub(t, base), 7.5, i % 2 ? c : mix(c, cG, 0.3), cD); }
      for (let i = 0; i < 8; i++) { const base = lerp(sh, el, 0.1 + i * 0.12), t = add(base, -10 - i * 1.2, 30 - i * 1.2); w += feather(base, sub(t, base), 6, mix(c, cG, 0.4), cD); }
      for (let i = 0; i < 9; i++) { const base = lerp(el, wr, 0.05 + i * 0.1), t = add(base, -8, 20); w += feather(base, sub(t, base), 5, mix(c, cG, 0.55), cGD); }
      for (let i = 0; i < 8; i++) { const base = lerp(sh, el, 0.05 + i * 0.12), t = add(base, -6, 16); w += feather(base, sub(t, base), 3, cG, cGD); }
      for (let i = 0; i < 10; i++) { const base = lerp(el, wr, i * 0.1), t = add(base, -4, 9); w += feather(base, sub(t, base), 2.4, cL, cGD, 0.9); }
      // the arm itself with alula and wrist knuckle
      w += limb(F, sh, el, 12, 8, cG, 'cloth', 0.14) + limb(F, el, wr, 8, 5, cG, 'cloth', 0.06) + dot(el, 3.6, cGD, 0.7) + dot(wr, 3, cGD, 0.7) + feather(wr, [-16, -10], 3, cL, cGD);
      w += `<path d="M${pt(sh)}L${pt(el)}L${pt(wr)}L${pt(tips[0])}Q${pt([-140 + ox, -86 + oy])} ${pt(tips[3])}Q${pt([-96 + ox, -46 + oy])} ${pt([-50 + ox, -54 + oy])}Q${pt([-24 + ox, -62 + oy])} ${pt(sh)}Z" fill="none" stroke="${OL}" stroke-width=".8" opacity=".6"/>`;
      return w;
    };
    s += wing(true);
    /* ---- far legs + tail ---- */
    s += limb(F, [-40, -46], [-50, -18], 16, 9, far(fur), 'cloth', 0.12) + limb(F, [-50, -18], [-44, -3], 8, 6.5, far(fur)) + paw(F, [-43, 0], far(fur), 1.1);
    s += limb(F, [30, -52], [36, -22], 11, 7, far(fe), 'cloth', 0.1) + limb(F, [36, -22], [38, -5], 6, 5, far(gold), 'skin') + eagleFoot([38, -3], gold, 1, true);
    const tail = A.tube([-58, -52], [-84, -44], [-104, -26], [-100, -4], 7, 3, 18);
    s += shape(F, tail.d, F.lin([-100, 0], [-60, -56], fur, 'cloth')) + clipped(F, tail.d, A.strokeTex(r, [-110, -58, -54, 0], 'fur', { rim: hil2(fur), dark: furD, texK: 1.6 }, 18)) + shape(F, cr([[-104, -6], [-96, -14], [-86, -6], [-90, 6], [-102, 8]], true, 0.75), F.rad(furD)) + qd([-100, -4], [-92, 0], [-94, 6], furL, 0.8, 0.5);
    /* ---- lion hindquarters ---- */
    const haunch = cr([[-30, -72], [-56, -74], [-72, -56], [-70, -34], [-56, -24], [-38, -30], [-28, -48]], true, 0.9);
    const body = cr([[-50, -74], [-26, -82], [0, -84], [24, -86], [42, -82], [50, -66], [46, -46], [32, -36], [8, -32], [-16, -34], [-40, -40], [-58, -52]], true, 0.92);
    s += shape(F, body, F.lin([0, -30], [10, -90], fur, 'cloth'));
    s += clipped(F, body, `<ellipse cx="-4" cy="-82" rx="46" ry="10" fill="${furD}" opacity=".45"/>` + ao([-40, -50], 16, 14, 0.9) + ao([34, -60], 12, 12, 0.8) + `<path d="M-20,-80Q-6,-60 -14,-38M8,-82Q20,-64 14,-40" stroke="${furD}" stroke-width="1.6" fill="none" opacity=".45"/><path d="M-30,-36Q-10,-30 20,-34" stroke="${furL}" stroke-width="5" fill="none" opacity=".45"/>` + A.strokeTex(r, [-60, -90, 52, -30], 'fur', { rim: hil2(fur), dark: furD, texK: 2 }, 32));
    // feathered chest and shoulder: rows of feather tips grading into the fur
    let chest = '';
    for (let row = 0; row < 5; row++) for (let i = 0; i < 6; i++) { const p = [10 + row * 8 + (i % 2) * 4, -84 + i * 10 + row * 1.5]; chest += feather(p, [-9, 8], 3.2, row < 2 ? fe : mix(fe, fur, row * 0.2), feD, 0.95); }
    s += clipped(F, body, chest + `<path d="M30,-86Q48,-70 46,-44" stroke="${feL}" stroke-width="2" fill="none" opacity=".4"/>`);
    s += shape(F, haunch, F.rad(fur)) + clipped(F, haunch, A.strokeTex(r, [-74, -76, -26, -22], 'fur', { rim: hil2(fur), dark: furD, texK: 2 }, 28) + `<path d="M-60,-66Q-44,-70 -34,-56" stroke="${furL}" stroke-width="2" fill="none" opacity=".5"/>` + ao([-36, -40], 10, 12, 0.8)) + qd([-30, -70], [-36, -50], [-40, -32], furD, 1.2, 0.6);
    s += limb(F, [-54, -30], [-48, -4], 9, 7, fur, 'cloth', 0.1) + dot([-54, -30], 3, furD, 0.5) + paw(F, [-47, 0], fur, 1.1, true);
    /* ---- near foreleg: feathered thigh, scaled shank, talons ---- */
    s += limb(F, [36, -58], [46, -24], 13, 8, fe, 'cloth', 0.14);
    s += clipped(F, limbD([36, -58], [46, -24], 13, 8, 0.14), [...Array(8)].map((_, i) => feather([32 + (i % 2) * 5, -56 + i * 5], [-6, 7], 2.6, fe, feD, 0.9)).join(''));
    s += limb(F, [46, -24], [48, -5], 7, 5.5, gold, 'skin', 0.04) + clipped(F, limbD([46, -24], [48, -5], 7, 5.5, 0.04), [...Array(6)].map((_, i) => `<path d="M42,${-22 + i * 3.2}q5,-2 10,0" stroke="${goldD}" stroke-width=".7" fill="none" opacity=".7"/>`).join('')) + dot([46, -24], 3.2, goldD, 0.6);
    s += eagleFoot([48, -3], gold, 1.05, false);
    /* ---- near wing ---- */
    s += wing(false);
    /* ---- neck ---- */
    const neck = A.tube([34, -80], [46, -92], [56, -102], [64, -108], 22, 16, 14);
    s += shape(F, neck.d, F.lin([30, -78], [70, -112], fe, 'cloth'));
    let nin = '';
    for (let row = 0; row < 4; row++) for (let i = 0; i < 6; i++) nin += feather([34 + i * 6 + row * 2, -74 - i * 5 - row * 7], [-8, 6], 2.8, row % 2 ? fe : mix(fe, gold, 0.25), feD, 0.95);
    s += clipped(F, neck.d, nin + ao([40, -80], 12, 6, 0.9) + `<path d="M40,-100Q52,-110 64,-112" stroke="${feL}" stroke-width="2" fill="none" opacity=".5"/>`);
    // ruff
    for (let i = 0; i < 9; i++) { const a = -2.4 + i * 0.3; s += feather([44 + Math.cos(a) * 14, -86 + Math.sin(a) * 16], [Math.cos(a) * 12, Math.sin(a) * 12], 3.2, i % 2 ? feL : fe, feD, 0.92); }
    /* ---- eagle head ---- */
    const head = cr([[50, -112], [58, -124], [72, -128], [86, -124], [96, -114], [96, -104], [88, -98], [74, -96], [60, -98], [50, -104]], true, 0.9);
    s += shape(F, head, F.lin([56, -98], [84, -128], fe, 'cloth'));
    s += clipped(F, head, [...Array(14)].map((_, i) => feather([52 + (i % 7) * 6, -126 + Math.floor(i / 7) * 10 + (i % 2) * 3], [-4, 5], 2, fe, feD, 0.8)).join('') + `<path d="M58,-122Q72,-130 88,-120" stroke="${feL}" stroke-width="2.4" fill="none" opacity=".55"/>` + ao([54, -104], 8, 8, 0.8));
    // ear tufts
    s += feather([62, -126], [-6, -12], 2.6, fe, feD) + feather([70, -128], [-2, -14], 2.6, feL, feD) + feather([78, -127], [3, -12], 2.4, fe, feD);
    // hooked beak: upper with cere and nostril, lower mandible, gape line
    s += shape(F, 'M88,-120Q104,-118 108,-108Q110,-100 104,-92Q100,-98 96,-102Q90,-104 86,-106Z', F.lin([88, -92], [104, -120], beak, 'skin')) + shape(F, 'M88,-104Q96,-102 102,-96Q98,-92 92,-96Q88,-100 86,-104Z', F.hor(mix(beak, '#000', 0.25), 'skin'));
    s += qd([90, -118], [102, -114], [106, -104], '#fff4c0', 1, 0.6) + qd([88, -106], [96, -103], [103, -96], beakD, 0.9, 0.9) + dot([92, -114], 1.3, beakD, 0.8) + `<path d="M86,-120Q90,-116 90,-110" stroke="${beakD}" stroke-width=".8" fill="none" opacity=".6"/>`;
    // eye with brow ridge
    s += `<path d="M70,-112Q77,-118 84,-112Q77,-107 70,-112Z" fill="${ec}" stroke="${OL}" stroke-width=".6"/>` + dot([77.5, -112.5], 2.2, '#140a04') + dot([76.4, -113.6], 0.8, '#fff', 0.9) + qd([68, -114], [77, -121], [86, -114], feD, 1.8) + qd([66, -116], [77, -123], [88, -116], mix(fe, gold, 0.4), 1, 0.6);
    const fx = (o.eye ? dot([77.5, -112.5], 5, ec, 0.4) : '') + (o.auraCol ? '' : '');
    return compose(F, s, fx, Object.assign({ aura: false }, o), P, 70);
  }
  const beastOld = L.beast;
  L.beast = function (o, P, r) {
    if (!o.legacy && !o.spectral && (o.t === 'wolf' || o.t === 'lynx')) return wolfModel(o, P, r || A.rng(3));
    if (!o.legacy && !o.spectral && o.t === 'bear') return bearModel(o, P, r || A.rng(3));
    if (!o.legacy && !o.spectral && o.t === 'gryphon') return gryphonModel(o, P, r || A.rng(3));
    return beastOld(o, P, r);
  };
})(globalThis.RB);
