/* RAIDBOUND — art engine: humanoid figures, weapons, creatures (backlit silhouettes with rim light + painted details) */
(function (RB) {
  const A = RB.ART;
  const n1 = A.n1;
  const L = A.layers;
  const pt = p => n1(p[0]) + ',' + n1(p[1]);
  const add = (p, dx, dy) => [p[0] + dx, p[1] + dy];
  const nid = () => 'u' + (++A._uid);

  /* tapered tube along a cubic bezier: used for horns, tails, necks, tentacles */
  function tube(p0, c1, c2, p3, w0, w1, n) {
    n = n || 18;
    const P = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0];
      const y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1];
      const dx = 3 * u * u * (c1[0] - p0[0]) + 6 * u * t * (c2[0] - c1[0]) + 3 * t * t * (p3[0] - c2[0]);
      const dy = 3 * u * u * (c1[1] - p0[1]) + 6 * u * t * (c2[1] - c1[1]) + 3 * t * t * (p3[1] - c2[1]);
      const len = Math.hypot(dx, dy) || 1;
      P.push({ x, y, nx: -dy / len, ny: dx / len, w: (w0 + (w1 - w0) * t) / 2 });
    }
    const left = P.map(q => [q.x + q.nx * q.w, q.y + q.ny * q.w]);
    const right = P.map(q => [q.x - q.nx * q.w, q.y - q.ny * q.w]).reverse();
    return { d: 'M' + left.concat(right).map(pt).join('L') + 'Z', pts: P };
  }
  A.tube = tube;

  /* ---------- poses (facing right; feet at y=0) ---------- */
  const POSES = {
    stand: { hd: [2, -152], nk: [1, -138], ch: [0, -120], pv: [0, -80], sL: [-15, -131], sR: [15, -131], eL: [-21, -106], eR: [22, -106], hL: [-23, -82], hR: [26, -84], kL: [-10, -41], kR: [11, -41], fL: [-13, 0], fR: [15, 0], wA: 175, oA: 0 },
    heroic: { hd: [3, -152], nk: [2, -138], ch: [0, -120], pv: [-1, -80], sL: [-15, -131], sR: [15, -132], eL: [-22, -110], eR: [28, -150], hL: [-12, -100], hR: [34, -174], kL: [-19, -42], kR: [17, -42], fL: [-30, 0], fR: [27, 0], wA: 12, oA: 0 },
    charge: { hd: [16, -144], nk: [12, -132], ch: [7, -116], pv: [-2, -78], sL: [-6, -127], sR: [22, -128], eL: [-22, -110], eR: [40, -114], hL: [-34, -96], hR: [56, -128], kL: [-24, -44], kR: [20, -40], fL: [-40, -2], fR: [26, 0], wA: 62, oA: -20 },
    cast: { hd: [2, -152], nk: [1, -138], ch: [0, -120], pv: [0, -80], sL: [-15, -131], sR: [15, -131], eL: [-31, -142], eR: [31, -142], hL: [-40, -160], hR: [42, -160], kL: [-12, -41], kR: [13, -41], fL: [-17, 0], fR: [18, 0], wA: 0, oA: 0 },
    castF: { hd: [4, -151], nk: [2, -137], ch: [0, -120], pv: [0, -80], sL: [-14, -131], sR: [16, -131], eL: [-22, -108], eR: [36, -124], hL: [-26, -90], hR: [56, -130], kL: [-14, -41], kR: [14, -41], fL: [-20, 0], fR: [20, 0], wA: 30, oA: 0 },
    aim: { hd: [6, -151], nk: [3, -137], ch: [0, -120], pv: [-1, -80], sL: [-12, -131], sR: [17, -131], eL: [-6, -124], eR: [38, -128], hL: [6, -132], hR: [58, -128], kL: [-18, -42], kR: [16, -42], fL: [-28, 0], fR: [24, 0], wA: 0, oA: 0 },
    crouch: { hd: [12, -122], nk: [9, -110], ch: [6, -94], pv: [0, -58], sL: [-6, -104], sR: [19, -104], eL: [-22, -86], eR: [36, -90], hL: [-36, -72], hR: [52, -96], kL: [-24, -32], kR: [26, -30], fL: [-32, 0], fR: [34, 0], wA: 80, oA: -110 },
    dual: { hd: [3, -152], nk: [1, -138], ch: [0, -120], pv: [0, -80], sL: [-15, -131], sR: [15, -131], eL: [-34, -116], eR: [34, -116], hL: [-48, -128], hR: [50, -130], kL: [-20, -42], kR: [19, -42], fL: [-30, 0], fR: [29, 0], wA: 30, oA: -30 },
    pray: { hd: [3, -150], nk: [1, -137], ch: [0, -120], pv: [0, -80], sL: [-15, -131], sR: [15, -131], eL: [-18, -110], eR: [20, -110], hL: [-2, -126], hR: [6, -126], kL: [-10, -41], kR: [11, -41], fL: [-13, 0], fR: [15, 0], wA: 0, oA: 0 },
    staff: { hd: [3, -152], nk: [1, -138], ch: [0, -120], pv: [0, -80], sL: [-15, -131], sR: [15, -131], eL: [-24, -112], eR: [26, -110], hL: [-34, -128], hR: [32, -96], kL: [-12, -41], kR: [13, -41], fL: [-17, 0], fR: [18, 0], wA: 0, oA: 0 },
    hunch: { hd: [18, -112], nk: [13, -104], ch: [6, -92], pv: [-2, -62], sL: [-6, -100], sR: [16, -102], eL: [-14, -80], eR: [30, -84], hL: [-20, -64], hR: [42, -94], kL: [-16, -32], kR: [18, -30], fL: [-24, 0], fR: [26, 0], wA: 15, oA: 0 },
  };
  const RACE = {
    human: { h: 1, w: 1, leg: 1, head: 10.5, limb: 1 },
    elf: { h: 1.06, w: 0.9, leg: 1.04, head: 10, limb: 0.88, ears: 'elf' },
    dwarf: { h: 0.94, w: 1.34, leg: 0.6, head: 11.5, limb: 1.32, beard: 1 },
    orc: { h: 1.04, w: 1.3, leg: 0.95, head: 11.5, limb: 1.42, tusks: 1 },
    minotaur: { h: 1.1, w: 1.42, leg: 0.95, head: 12.5, limb: 1.5, horns: 1, snout: 1 },
    goblin: { h: 0.72, w: 0.95, leg: 0.82, head: 13, limb: 0.85, ears: 'goblin', nose: 1 },
    skeleton: { h: 1, w: 0.86, leg: 1, head: 10, limb: 0.6, skull: 1 },
    fish: { h: 0.92, w: 1.05, leg: 0.8, head: 12.5, limb: 1, fins: 1 },
    giant: { h: 1.05, w: 1.6, leg: 0.85, head: 10, limb: 1.9 },
  };
  A.POSES = POSES; A.RACE = RACE;

  /* ---------- weapons: silhouette + highlight, local coords (grip at 0,0, pointing -y) ---------- */
  function weapon(t, P, o) {
    const rim = P.rim, lt = P.light, g = o.wGlow;
    let sil = '', hi = '', paint = '';
    const wrap = (x, y0, y1, c) => { let w = ''; for (let y = y0; y < y1; y += 2.2) w += `<path d="M${x - 1.9},${n1(y)}L${x + 1.9},${n1(y + 1.4)}" stroke="${c || '#1a0e06'}" stroke-width=".8" opacity=".75"/>`; return w; };
    const shaft = (y0, y1, wd) => `<path d="M${-wd},${y0}L${-wd},${y1}L${wd},${y1}L${wd},${y0}Z" fill="url(#wood)" opacity=".75"/><path d="M${n1(wd * 0.3)},${y0}L${n1(wd * 0.3)},${y1}" stroke="#fff" stroke-width=".4" opacity=".25"/>`;
    const glint = (x, y, c) => `<path d="M${x - 5},${y}L${x + 5},${y}M${x},${y - 5}L${x},${y + 5}" stroke="${c || '#fff'}" stroke-width=".8" opacity=".9"/><circle cx="${x}" cy="${y}" r="2.6" fill="${c || '#fff'}" opacity=".5" filter="url(#b1)"/>`;
    switch (t) {
      case 'sword': case 'greatsword': {
        const len = t === 'sword' ? 64 : 92, bw = t === 'sword' ? 2.7 : 3.6;
        sil = `<path d="M${-bw},-8L${-bw},${-len}L0,${-len - 10}L${bw},${-len}L${bw},-8Z"/><path d="M-12,-10Q0,-6 12,-10L12,-6Q0,-3 -12,-6Z"/><rect x="-1.7" y="-5" width="3.4" height="${t === 'sword' ? 12 : 20}"/><circle cx="0" cy="${t === 'sword' ? 9 : 17}" r="2.8"/>`;
        paint = `<path d="M${-bw},-8L${-bw},${-len}L0,${-len - 10}L${bw},${-len}L${bw},-8Z" fill="url(#steel)" opacity=".72"/><path d="M0,-12L0,${n1(-len * 0.82)}" stroke="#2a3040" stroke-width="1.1" opacity=".55"/><path d="M-12,-10Q0,-6 12,-10L12,-6Q0,-3 -12,-6Z" fill="url(#gold)" opacity=".85"/><circle cx="0" cy="-8" r="1.6" fill="${o.gem || '#c8243a'}"/><circle cx="-.5" cy="-8.5" r=".5" fill="#fff" opacity=".8"/>` + wrap(0, -4, t === 'sword' ? 7 : 15, '#2a1208') + `<circle cx="0" cy="${t === 'sword' ? 9 : 17}" r="2.8" fill="url(#gold)" opacity=".9"/>`;
        hi = `<path d="M0,-12L0,${-len - 4}" stroke="${rim}" stroke-width=".9" opacity=".85"/><path d="M${-bw},-10L${-bw},${-len}L0,${-len - 10}" stroke="${lt}" stroke-width=".7" fill="none" opacity=".7"/>` + glint(0, -len - 8);
        if (g) hi += `<path d="M0,-10L0,${-len - 6}" stroke="${g}" stroke-width="6" opacity=".55" filter="url(#b2)"/><path d="M0,-10L0,${-len - 6}" stroke="${g}" stroke-width="1.6" opacity=".9"/>`;
        break;
      }
      case 'dagger':
        sil = `<path d="M-2.2,-5L-2.2,-24L0,-32L2.2,-24L2.2,-5Z"/><rect x="-7" y="-7" width="14" height="2.6"/><rect x="-1.5" y="-4" width="3" height="9"/>`;
        paint = `<path d="M-2.2,-5L-2.2,-24L0,-32L2.2,-24L2.2,-5Z" fill="url(#steel)" opacity=".75"/><rect x="-7" y="-7" width="14" height="2.6" fill="url(#gold)" opacity=".85"/>` + wrap(0, -4, 4, '#2a1208');
        hi = `<path d="M0,-7L0,-29" stroke="${rim}" stroke-width=".8"/>` + glint(0, -30, g || '#fff');
        if (g) hi += `<path d="M0,-6L0,-30" stroke="${g}" stroke-width="4" opacity=".6" filter="url(#b1)"/>`;
        break;
      case 'axe': case 'battleaxe':
        sil = `<path d="M-1.9,12L-1.9,-62L1.9,-62L1.9,12Z"/><path d="M1.9,-60Q17,-70 22,-52Q15,-43 22,-32Q11,-38 1.9,-37Z"/>` + (t === 'battleaxe' ? `<path d="M-1.9,-60Q-17,-70 -22,-52Q-15,-43 -22,-32Q-11,-38 -1.9,-37Z"/>` : `<path d="M-1.9,-55L-10,-50L-1.9,-45Z"/>`) + `<path d="M-2.5,-62L0,-70L2.5,-62Z"/>`;
        paint = shaft(-62, 12, 1.9) + `<path d="M1.9,-60Q17,-70 22,-52Q15,-43 22,-32Q11,-38 1.9,-37Z" fill="url(#steel)" opacity=".7"/>` + (t === 'battleaxe' ? `<path d="M-1.9,-60Q-17,-70 -22,-52Q-15,-43 -22,-32Q-11,-38 -1.9,-37Z" fill="url(#steel)" opacity=".6"/>` : '') + `<path d="M4,-56Q12,-60 15,-50Q11,-44 15,-38Q9,-41 4,-41Z" fill="none" stroke="#2a3040" stroke-width=".6" opacity=".6"/><circle cx="6" cy="-48" r="1" fill="#2a3040" opacity=".7"/>` + wrap(0, -36, -26, '#2a1208') + wrap(0, 0, 10, '#3a1a0a') + `<rect x="-2.4" y="-63" width="4.8" height="3" fill="url(#gold)" opacity=".8"/>`;
        hi = `<path d="M22,-52Q15,-43 22,-32" stroke="${lt}" stroke-width="1.3" fill="none"/>` + (t === 'battleaxe' ? `<path d="M-22,-52Q-15,-43 -22,-32" stroke="${lt}" stroke-width="1.3" fill="none"/>` : '') + glint(21, -50);
        if (g) hi += `<path d="M2,-58Q17,-66 21,-52Q14,-43 21,-33Q11,-38 2,-38Z" fill="${g}" opacity=".45" filter="url(#b2)"/>`;
        break;
      case 'hammer':
        sil = `<path d="M-2,14L-2,-56L2,-56L2,14Z"/><path d="M-13,-70L13,-70L14,-54L-14,-54Z"/><path d="M-3,-70L0,-78L3,-70Z"/><circle cx="0" cy="14" r="3"/>`;
        paint = shaft(-56, 14, 2) + `<path d="M-13,-70L13,-70L14,-54L-14,-54Z" fill="url(#iron)" opacity=".75"/><path d="M-13.4,-66L13.4,-66M-13.8,-58L13.8,-58" stroke="url(#gold)" stroke-width="1.6"/><path d="M-13,-70L-14,-54M13,-70L14,-54" stroke="#fff" stroke-width=".5" opacity=".4"/>` + wrap(0, 0, 12, '#2a1208') + `<circle cx="0" cy="14" r="3" fill="url(#gold)"/>`;
        hi = `<path d="M-13,-69L13,-69" stroke="${lt}" stroke-width="1" opacity=".8"/><circle cx="0" cy="-62" r="3" fill="${g || lt}" opacity=".9"/><circle cx="0" cy="-62" r="7" fill="${g || lt}" opacity=".45" filter="url(#b2)"/>`;
        break;
      case 'mace':
        sil = `<path d="M-1.8,12L-1.8,-46L1.8,-46L1.8,12Z"/><circle cx="0" cy="-54" r="8"/><path d="M0,-66L-3,-60L3,-60ZM-11,-54L-6,-57L-6,-51ZM11,-54L6,-57L6,-51ZM-8,-63L-4,-59L-8,-58ZM8,-63L4,-59L8,-58Z"/>`;
        paint = shaft(-46, 12, 1.8) + `<circle cx="0" cy="-54" r="8" fill="url(#iron)" opacity=".75"/><path d="M-6,-54L6,-54M0,-60L0,-48" stroke="#000" stroke-width=".7" opacity=".45"/><circle cx="-2.4" cy="-57" r="2" fill="#fff" opacity=".25"/>` + wrap(0, 0, 10, '#2a1208');
        hi = `<path d="M-5,-58Q0,-62 5,-58" stroke="${lt}" stroke-width="1" fill="none"/>` + (g ? `<circle cx="0" cy="-54" r="10" fill="${g}" opacity=".5" filter="url(#b2)"/>` : '');
        break;
      case 'staff': case 'totem': case 'scythe': case 'trident': case 'polearm': {
        sil = `<path d="M-1.6,52L-2,-98L2,-98L1.6,52Z"/>`;
        const gc = g || P.glow;
        paint = `<path d="M-1.6,52L-2,-98L2,-98L1.6,52Z" fill="url(#wood)" opacity=".8"/>` + [-80, -40, 0, 30].map(y => `<path d="M-2,${y}l4,1.4M-2,${y + 2}l4,1.4" stroke="#1a0e06" stroke-width=".7" opacity=".7"/>`).join('') + wrap(0, -6, 8, '#2a1208');
        if (t === 'staff') paint += `<path d="M-2,-98Q-12,-104 -9,-118Q-5,-108 0,-106Q5,-108 9,-118Q12,-104 2,-98Z" fill="url(#gold)" opacity=".85"/>`;
        if (t === 'totem') paint += `<path d="M-8,-96L8,-96L7,-112Q0,-122 -7,-112Z" fill="url(#bone)" opacity=".8"/><path d="M-6,-92Q-9,-84 -8,-76L-5,-78Q-7,-84 -4,-92Z" fill="#c8342a" opacity=".85"/><path d="M6,-92Q10,-86 10,-78L7,-79Q7,-85 4,-92Z" fill="#e8c060" opacity=".85"/><circle cx="-8.4" cy="-76" r="1.2" fill="#5ac8e0"/><circle cx="10" cy="-77" r="1.2" fill="#e05a5a"/><path d="M-3,-110L-1,-104M3,-110L1,-104" stroke="#000" stroke-width="1" opacity=".6"/>`;
        if (t === 'scythe') paint += `<path d="M-2,-96Q-40,-112 -66,-86Q-40,-100 -2,-86Z" fill="url(#steel)" opacity=".65"/>`;
        if (t === 'trident') paint += `<path d="M-14,-96L14,-96L13,-92L-13,-92Z" fill="url(#gold)" opacity=".85"/><path d="M-13,-94L-15,-118L-11,-108L-10,-94ZM13,-94L15,-118L11,-108L10,-94ZM-2,-96L0,-126L2,-96Z" fill="url(#steel)" opacity=".7"/>`;
        if (t === 'polearm') paint += `<path d="M2,-92Q18,-98 22,-82Q16,-74 22,-64Q12,-70 2,-70Z" fill="url(#steel)" opacity=".7"/><path d="M-2.5,-98L0,-120L2.5,-98Z" fill="url(#steel)" opacity=".7"/><rect x="-2.6" y="-98" width="5.2" height="4" fill="url(#gold)" opacity=".85"/>`;
        if (t === 'staff') {
          sil += `<path d="M-2,-98Q-12,-104 -9,-118Q-5,-108 0,-106Q5,-108 9,-118Q12,-104 2,-98Z"/>`;
          hi = `<circle cx="0" cy="-110" r="16" fill="${gc}" opacity=".35" filter="url(#b4)"/><circle cx="0" cy="-110" r="5" fill="${gc}"/><circle cx="0" cy="-110" r="2.4" fill="#fff"/>` + glint(0, -110);
        } else if (t === 'totem') {
          sil += `<path d="M-8,-96L8,-96L7,-112Q0,-122 -7,-112Z"/><path d="M-8,-104L-18,-94L-14,-92ZM8,-104L18,-94L14,-92Z"/><path d="M-6,-92L-10,-76M6,-92L10,-78" stroke-width="1.5" fill="none"/>`;
          hi = `<circle cx="-3" cy="-106" r="1.4" fill="${gc}"/><circle cx="3" cy="-106" r="1.4" fill="${gc}"/><circle cx="0" cy="-106" r="10" fill="${gc}" opacity=".3" filter="url(#b2)"/>`;
        } else if (t === 'scythe') {
          sil += `<path d="M-2,-96Q-40,-112 -66,-86Q-40,-100 -2,-86Z"/>`;
          hi = `<path d="M-2,-94Q-40,-110 -64,-87" stroke="${lt}" stroke-width="1" fill="none"/><path d="M-4,-92Q-38,-104 -60,-88" stroke="${gc}" stroke-width="4" fill="none" opacity=".5" filter="url(#b1)"/>`;
        } else if (t === 'trident') {
          sil += `<path d="M-14,-96L14,-96L13,-92L-13,-92Z"/><path d="M-13,-94L-15,-118L-11,-108L-10,-94ZM13,-94L15,-118L11,-108L10,-94ZM-2,-96L0,-126L2,-96Z"/>`;
          hi = `<path d="M0,-98L0,-124M-13,-96L-15,-116M13,-96L15,-116" stroke="${lt}" stroke-width=".8"/>` + glint(0, -124, gc);
        } else {
          sil += `<path d="M2,-92Q18,-98 22,-82Q16,-74 22,-64Q12,-70 2,-70Z"/><path d="M-2,-90L-12,-84L-2,-80Z"/><path d="M-2.5,-98L0,-120L2.5,-98Z"/>`;
          hi = `<path d="M22,-82Q16,-74 22,-64" stroke="${lt}" stroke-width="1.2" fill="none"/>` + glint(0, -118);
        }
        break;
      }
      case 'wand':
        sil = `<path d="M-1.4,6L-1.1,-34L1.1,-34L1.4,6Z"/>`;
        paint = `<path d="M-1.4,6L-1.1,-34L1.1,-34L1.4,6Z" fill="url(#wood)" opacity=".8"/><rect x="-1.6" y="-34" width="3.2" height="3" fill="url(#gold)"/><rect x="-1.8" y="-6" width="3.6" height="2" fill="url(#gold)" opacity=".85"/>`;
        hi = `<circle cx="0" cy="-36" r="9" fill="${g || P.glow}" opacity=".5" filter="url(#b2)"/><circle cx="0" cy="-36" r="2.2" fill="#fff"/>` + glint(0, -36, g || P.glow);
        break;
      case 'bow':
        sil = `<path d="M-1,-48C16,-32 16,32 -1,48" stroke-width="3.4" fill="none"/><path d="M-1,-48L-4,-52M-1,48L-4,52" stroke-width="2" fill="none"/><rect x="-2" y="-6" width="5" height="12"/>`;
        paint = `<path d="M-1,-48C16,-32 16,32 -1,48" stroke="#8a5428" stroke-width="2.2" fill="none" opacity=".8"/><path d="M5,-36C12,-20 12,-8 11,-4M5,36C12,20 12,8 11,4" stroke="#e8c070" stroke-width=".6" fill="none" opacity=".6"/><rect x="-2" y="-6" width="5" height="12" fill="#3a1e0c"/>` + wrap(0.5, -5, 5, '#c89a50');
        hi = `<path d="M1,-44C14,-28 14,28 1,44" stroke="${lt}" stroke-width=".7" fill="none" opacity=".7"/>`;
        break;
      case 'crossbow':
        sil = `<path d="M-22,-2L20,-3L20,3L-22,4Z"/><path d="M14,-20Q24,0 14,20" stroke-width="3" fill="none"/><rect x="-14" y="3" width="6" height="10"/>`;
        paint = `<path d="M-22,-2L20,-3L20,3L-22,4Z" fill="url(#wood)" opacity=".8"/><path d="M14,-20Q24,0 14,20" stroke="url(#steelV)" stroke-width="2.2" fill="none"/><rect x="-14" y="3" width="6" height="10" fill="#3a1e0c"/><rect x="8" y="-3.4" width="4" height="7" fill="url(#iron)"/><circle cx="-4" cy="0" r="1.2" fill="url(#gold)"/>`;
        hi = `<path d="M14,-20L4,0L14,20" stroke="${lt}" stroke-width=".6" fill="none" opacity=".8"/><path d="M4,0L30,0" stroke="${rim}" stroke-width="1"/><path d="M30,0L25,-2.4L25,2.4Z" fill="${rim}"/>`;
        break;
      case 'shield': case 'round': case 'tower': {
        const em = o.emblem || lt, sc = o.shieldCol || (o.emblem ? '#6a1626' : '#4a2e18');
        if (t === 'round') { sil = `<circle cx="0" cy="0" r="16"/>`; paint = `<circle cx="0" cy="0" r="15" fill="url(#wood)" opacity=".75"/>` + [-8, -3, 2, 7].map(x => `<path d="M${x},-14L${x},14" stroke="#1a0e06" stroke-width=".7" opacity=".6"/>`).join('') + `<circle cx="0" cy="0" r="15" fill="none" stroke="url(#iron)" stroke-width="2.6"/><circle cx="0" cy="0" r="5" fill="url(#steelV)"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle cx="${n1(Math.cos(i * 0.785) * 15)}" cy="${n1(Math.sin(i * 0.785) * 15)}" r=".9" fill="#dfe6f0"/>`).join(''); hi = `<circle cx="0" cy="0" r="14.5" fill="none" stroke="${lt}" stroke-width=".9" opacity=".6"/><circle cx="0" cy="0" r="4" fill="${em}" opacity=".8"/>`; }
        else if (t === 'tower') { sil = `<path d="M-15,-26L15,-26L15,14Q15,24 0,30Q-15,24 -15,14Z"/>`; paint = `<path d="M-14,-25L14,-25L14,13Q14,23 0,29Q-14,23 -14,13Z" fill="${sc}" opacity=".85"/><path d="M-14,-25L14,-25L14,13Q14,23 0,29Q-14,23 -14,13Z" fill="url(#tLit)"/><path d="M-14,-25L14,-25L14,13Q14,23 0,29Q-14,23 -14,13Z" fill="none" stroke="url(#gold)" stroke-width="1.8"/><path d="M0,-25L0,29M-14,-6L14,-6" stroke="${em}" stroke-width="1.4" opacity=".35"/>`; hi = `<path d="M-13,-24L13,-24L13,13Q13,22 0,27Q-13,22 -13,13Z" fill="none" stroke="${lt}" stroke-width=".9" opacity=".55"/>` + sunGlyph(0, -4, 7, em); }
        else { sil = `<path d="M0,-20Q15,-18 16,-6Q15,12 0,24Q-15,12 -16,-6Q-15,-18 0,-20Z"/>`; paint = `<path d="M0,-19Q14,-17 15,-6Q14,11 0,23Q-14,11 -15,-6Q-14,-17 0,-19Z" fill="${sc}" opacity=".85"/><path d="M0,-19Q14,-17 15,-6Q14,11 0,23Q-14,11 -15,-6Q-14,-17 0,-19Z" fill="url(#tLit)"/><path d="M0,-19Q14,-17 15,-6Q14,11 0,23Q-14,11 -15,-6Q-14,-17 0,-19Z" fill="none" stroke="url(#gold)" stroke-width="1.6"/><path d="M-15,-6L15,-6" stroke="${em}" stroke-width="1" opacity=".3"/>`; hi = `<path d="M0,-18Q13,-16 14,-6Q13,10 0,21Q-13,10 -14,-6Q-13,-16 0,-18Z" fill="none" stroke="${lt}" stroke-width=".9" opacity=".6"/>` + sunGlyph(0, -2, 6, em); }
        break;
      }
      case 'orb':
        hi = `<circle cx="0" cy="-4" r="16" fill="${g || P.glow}" opacity=".45" filter="url(#b4)"/><circle cx="0" cy="-4" r="6" fill="${g || P.glow}" opacity=".85"/><circle cx="-2" cy="-6" r="2.4" fill="#fff"/>`;
        break;
      case 'tome':
        sil = `<path d="M-12,-8L12,-8L12,8L-12,8Z"/>`;
        paint = `<path d="M-12,-8L12,-8L12,8L-12,8Z" fill="#5a1a1a" opacity=".85"/><path d="M-12,-8L-8,-8L-12,-4ZM12,-8L8,-8L12,-4ZM-12,8L-8,8L-12,4ZM12,8L8,8L12,4Z" fill="url(#gold)"/><path d="M-10,6.5L10,6.5" stroke="#f4ecd0" stroke-width="1.2" opacity=".8"/><circle cx="0" cy="-1" r="2.4" fill="none" stroke="url(#gold)" stroke-width=".9"/>`;
        hi = `<path d="M-10,-6L10,-6" stroke="${lt}" stroke-width=".8" opacity=".7"/><circle cx="0" cy="-16" r="10" fill="${g || P.glow}" opacity=".4" filter="url(#b2)"/>`;
        break;
    }
    return { sil, hi, paint };
  }
  function sunGlyph(x, y, r, c) {
    let s = `<circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="${c}" opacity=".85"/>`;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s += `<path d="M${n1(x + Math.cos(a) * r * 0.6)},${n1(y + Math.sin(a) * r * 0.6)}L${n1(x + Math.cos(a) * r)},${n1(y + Math.sin(a) * r)}" stroke="${c}" stroke-width=".9" opacity=".8"/>`; }
    return s;
  }
  A.weapon = weapon;

  /* ---------- painted detail pass (drawn inside the figure's own silhouette mask) ----------
     local colour per material, cylindrical shading on every limb, armour plates & lames, mail, leather
     seams and straps, robe folds and embroidery, faces, hair strands, helm rivets, boots and bracers. */
  const SKIN = { orc: '#6f9a44', goblin: '#8eac46', minotaur: '#7a5236', human: '#d6a47c', elf: '#e6bc98', dwarf: '#d49c74', fish: '#4a9a94', giant: '#a88e72' };
  const TONE = { plate: '#8e9ab2', mail: '#7e8494', leather: '#86562e', hide: '#7e5636', cloth: '#5e4e80', bone: '#d8ccaa' };
  function lighten(hex, k) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
    const v = parseInt(hex.slice(1), 16); let r = v >> 16, g = v >> 8 & 255, b = v & 255;
    r = Math.round(r + (255 - r) * k); g = Math.round(g + (255 - g) * k); b = Math.round(b + (255 - b) * k);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  A.lighten = lighten;
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; let nx = -dy / l, ny = dx / l; if (nx < 0 || (nx === 0 && ny > 0)) { nx = -nx; ny = -ny; } return [nx, ny]; };
  const seg = (a, b, c, w, op, ex) => `<path d="M${pt(a)}L${pt(b)}" stroke="${c}" stroke-width="${n1(w)}" opacity="${op}" stroke-linecap="round" fill="none"${ex || ''}/>`;
  const qd = (a, m, b, c, w, op, ex) => `<path d="M${pt(a)}Q${pt(m)} ${pt(b)}" stroke="${c}" stroke-width="${n1(w)}" opacity="${op}" fill="none" stroke-linecap="round"${ex || ''}/>`;
  const dot = (p, rad, c, op) => `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${n1(rad)}" fill="${c}" opacity="${op}"/>`;
  // light comes from +x: a thin sheen on the lit side of a limb and a core shadow on the other
  function limbShade(a, b, w, lc) {
    const [nx, ny] = nrm(a, b), o1 = w * 0.27, o2 = w * 0.3;
    return seg(add(a, nx * o1, ny * o1), add(b, nx * o1, ny * o1), lc, w * 0.18, .42) + seg(add(a, -nx * o2, -ny * o2), add(b, -nx * o2, -ny * o2), '#000', w * 0.36, .4);
  }
  // a band across a limb at fraction t (bracers, boot cuffs, wraps)
  function band(a, b, t, w, c, op, sw) { const m = lerp(a, b, t), [nx, ny] = nrm(a, b), h = w * 0.6; return seg(add(m, nx * h, ny * h), add(m, -nx * h, -ny * h), c, sw || 1.2, op); }
  function matFor(o, R) {
    if (R.skull) return 'bone';
    if (o.robe) return 'cloth';
    if (o.helm === 'great' || o.pauld === 'plate' || o.helm === 'crown') return 'plate';
    if (o.race === 'orc' || o.race === 'minotaur' || o.race === 'giant' || o.pauld === 'fur' || o.pauld === 'spiked' || o.helm === 'mohawk') return o.race === 'dwarf' ? 'mail' : 'hide';
    if (o.helm === 'hood' || o.race === 'goblin' || o.race === 'elf') return 'leather';
    return 'mail';
  }
  function figPaint(c) {
    const { J, R, hipL, hipR, hd, hr, lw, o, P, mat, torsoD, r, ghost } = c;
    const LT = P.light, RM = P.rim, TR = o.trim || '#d9b45a';
    const race = o.race || 'human';
    const skin = ghost ? null : o.skin || SKIN[race];
    const tone = o.tone || (mat === 'cloth' && o.capeCol ? lighten(o.capeCol, .28) : TONE[mat]);
    const cx = J.ch[0], cy = J.ch[1], top = J.sL[1], w = R.w, pv = J.pv;
    const legs = !o.robe, face = !R.skull && o.helm !== 'great' && o.helm !== 'hood';
    const bareArms = skin && (mat === 'hide' || (mat === 'cloth' && (race === 'minotaur' || race === 'orc')) || (race === 'goblin' && mat !== 'plate'));
    const rivet = (x, y) => dot([x, y], .85, LT, .75) + dot([x - .3, y - .3], .35, '#fff', .8);
    let s = '';
    // local colour, weave/grain, then light from the side and sky from above
    if (!ghost) s += `<rect x="-140" y="-300" width="280" height="320" fill="${tone}" opacity="${mat === 'plate' ? .3 : mat === 'bone' ? .34 : .24}"/>`;
    const tex = { mail: 'pMail', cloth: 'pWeave', leather: 'pGrain', hide: 'pGrain' }[mat];
    if (tex) s += `<rect x="-140" y="${n1(J.nk[1] - 4)}" width="280" height="${n1(-J.nk[1] + 24)}" fill="url(#${tex})" opacity="${mat === 'mail' ? .85 : .6}"/>`;
    if (mat === 'plate') s += `<rect x="-140" y="-300" width="280" height="320" fill="url(#steelV)" opacity=".12"/>`;
    // bare skin
    if (bareArms) s += seg(J.sL, J.eL, skin, 8 * lw, .34) + seg(J.eL, J.hL, skin, 6.6 * lw, .34) + seg(J.sR, J.eR, skin, 8 * lw, .34) + seg(J.eR, J.hR, skin, 6.6 * lw, .34);
    if (skin && (mat === 'hide')) s += `<path d="${torsoD}" fill="${skin}" opacity=".3"/>`;
    if (face && skin) s += dot(hd, hr * 0.96, skin, .36);
    if (skin && mat !== 'plate') s += dot(J.hL, 4 * lw, skin, .32) + dot(J.hR, 4 * lw, skin, .32);
    // volume
    s += `<path d="${torsoD}" fill="url(#tLit)"/>` + dot(hd, hr, 'url(#tLit)', 1);
    if (legs) s += limbShade(hipL, J.kL, 12 * lw, RM) + limbShade(J.kL, J.fL, 9.5 * lw, RM) + limbShade(hipR, J.kR, 12 * lw, RM) + limbShade(J.kR, J.fR, 9.5 * lw, RM);
    s += limbShade(J.sL, J.eL, 9 * lw, RM) + limbShade(J.eL, J.hL, 7.5 * lw, RM) + limbShade(J.sR, J.eR, 9 * lw, RM) + limbShade(J.eR, J.hR, 7.5 * lw, RM);

    /* ---- torso by material ---- */
    if (mat === 'plate') {
      s += seg([cx + 1, top + 3], [pv[0], pv[1] - 10], LT, .7, .55) + seg([cx - .8, top + 3], [pv[0] - 1.8, pv[1] - 10], '#000', 1.3, .45);
      s += qd([cx - 15 * w, cy - 3], [cx, cy + 7], [cx + 15 * w, cy - 3], '#000', 1.4, .45) + qd([cx - 15 * w, cy - 1.6], [cx, cy + 8.4], [cx + 15 * w, cy - 1.6], RM, .6, .4);
      for (let i = 0; i < 3; i++) {
        const y = cy + 12 + i * 7.5, hw = (13 - i * 0.8) * w;
        s += qd([cx - hw, y], [cx, y + 3.5], [cx + hw, y], '#000', 1.5, .5) + qd([cx - hw, y + 1.4], [cx, y + 4.9], [cx + hw, y + 1.4], LT, .55, .42) + rivet(cx - hw + 2.4, y + 1.6) + rivet(cx + hw - 2.4, y + 1.6);
      }
      s += qd([J.sL[0] + 4, top - 1], [cx, top + 6], [J.sR[0] - 4, top - 1], TR, 1.2, .8) + qd([J.sL[0] + 4, top + 1.2], [cx, top + 8.2], [J.sR[0] - 4, top + 1.2], '#000', 1, .4);
      s += `<ellipse cx="${n1(cx + 6 * w)}" cy="${n1(cy - 4)}" rx="${n1(5 * w)}" ry="3" fill="#fff" opacity=".14"/>`;
    } else if (mat === 'mail') {
      s += qd([J.sL[0] + 3, top], [cx, top + 7], [J.sR[0] - 3, top], RM, .8, .5);
    } else if (mat === 'leather') {
      s += seg(add(J.sL, 2, 4), add(hipL, 1, -3), '#d0a070', .6, .55, ' stroke-dasharray="1.4 1.3"') + seg(add(J.sR, -2, 4), add(hipR, -1, -3), '#d0a070', .6, .55, ' stroke-dasharray="1.4 1.3"');
      s += seg(add(J.sR, -1, 1), add(hipL, 2, -2), '#2a1608', 3.4, .85) + seg(add(J.sR, 0, .2), add(hipL, 3, -2.8), '#b08050', .6, .55);
      const bk = lerp(add(J.sR, -1, 1), add(hipL, 2, -2), .45);
      s += `<rect x="${n1(bk[0] - 2)}" y="${n1(bk[1] - 2)}" width="4" height="4" fill="none" stroke="${TR}" stroke-width=".8" opacity=".85" transform="rotate(-50 ${n1(bk[0])} ${n1(bk[1])})"/>`;
      s += qd([J.sL[0] + 3, top + 1], [cx + 2, top + 9], [J.sR[0] - 3, top + 1], '#000', 1.6, .45);
    } else if (mat === 'hide') {
      // muscles, war paint, crossing straps and a fur collar
      s += qd([cx - 12 * w, cy - 6], [cx - 5 * w, cy + 5], [cx, cy - 1], '#000', 1.2, .42) + qd([cx, cy - 1], [cx + 5 * w, cy + 5], [cx + 12 * w, cy - 6], '#000', 1.2, .42);
      s += qd([cx + 1 * w, cy - 5], [cx + 7 * w, cy + 1], [cx + 11 * w, cy - 5], LT, .6, .35);
      for (let i = 0; i < 3; i++) s += seg([cx - 4 * w, cy + 9 + i * 7], [cx - 1 * w, cy + 10 + i * 7], '#000', 1, .32) + seg([cx + 1 * w, cy + 10 + i * 7], [cx + 4 * w, cy + 9 + i * 7], '#000', 1, .32);
      s += seg([cx, cy + 4], [pv[0], pv[1] - 8], '#000', .9, .3);
      const pc = o.paint || (race === 'orc' ? '#d23a26' : '#ece2c4');
      s += seg([cx + 4 * w, cy - 10], [cx + 9 * w, cy + 2], pc, 1.4, .55) + seg([cx + 7 * w, cy - 11], [cx + 12 * w, cy], pc, 1.1, .5) + band(J.sR, J.eR, .4, 9 * lw, pc, .55, 1.3) + band(J.sR, J.eR, .55, 9 * lw, pc, .45, 1);
      s += seg(add(J.sL, 3, 2), add(hipR, -2, -4), '#3a2210', 2.6, .8) + seg(add(J.sL, 3.6, 1.3), add(hipR, -1.4, -4.6), '#a8784a', .5, .5);
      s += dot(lerp(add(J.sL, 3, 2), add(hipR, -2, -4), .38), 2, '#bfb08a', .8);
    } else if (mat === 'bone') {
      s += dot(add(pv, 0, -4), 5 * w, '#000', .3);
    } else if (mat === 'cloth') {
      s += qd(add(J.sL, 4, 0), [cx, cy + 6], add(J.sR, -4, 0), TR, 1, .65) + qd(add(J.sL, 6, 1), [cx + 1, cy + 14], add(J.sR, -6, 1), '#000', 1.4, .35);
      s += qd(add(J.sR, -2, 4), [cx + 7 * w, cy + 6], [cx + 4 * w, pv[1] - 6], '#000', 1.4, .34) + qd(add(J.sL, 2, 4), [cx - 8 * w, cy + 8], [cx - 6 * w, pv[1] - 6], '#000', 1.4, .34);
      s += qd(add(J.sR, -3, 5), [cx + 8 * w, cy + 6], [cx + 5 * w, pv[1] - 6], LT, .5, .3);
    }
    // tabard / surcoat over plate or mail when the figure carries heraldry
    if ((mat === 'plate' || mat === 'mail') && legs && (o.cape || o.emblem || mat === 'mail')) {
      const tc = o.tabard || (o.capeCol ? lighten(o.capeCol, .2) : mat === 'mail' ? '#5a2a1a' : '#5a1626');
      const tw = 7 * w, ty = pv[1] - 5, by = pv[1] + 30;
      s += `<path d="M${n1(pv[0] - tw)},${n1(ty)}L${n1(pv[0] + tw)},${n1(ty)}L${n1(pv[0] + tw + 2)},${n1(by)}L${n1(pv[0])},${n1(by - 5)}L${n1(pv[0] - tw - 2)},${n1(by)}Z" fill="${tc}" opacity=".85"/><path d="M${n1(pv[0] - tw - 2)},${n1(by)}L${n1(pv[0])},${n1(by - 5)}L${n1(pv[0] + tw + 2)},${n1(by)}" stroke="${TR}" stroke-width=".8" fill="none" opacity=".8"/><path d="M${n1(pv[0] + 2)},${n1(ty + 2)}L${n1(pv[0] + 3)},${n1(by - 7)}" stroke="#000" stroke-width="1.2" opacity=".35"/>`;
    }

    /* ---- robe skirt ---- */
    if (o.robe) {
      const tY = pv[1] - 6, hw = 13 * w, fl = 30 * w;
      for (let i = 0; i <= 6; i++) {
        const t = i / 6, a = [pv[0] - hw * 0.9 + 1.8 * hw * 0.9 * t, tY + 6], b = [pv[0] - fl * 0.92 + 1.84 * fl * 0.92 * t, -3], m = [(a[0] + b[0]) / 2 + (r() - 0.5) * 6, (a[1] + b[1]) / 2];
        s += qd(a, m, b, '#000', i % 2 ? 2.2 : 1.2, .38) + (i % 2 ? qd(add(a, 1.4, 0), add(m, 1.8, 0), add(b, 2, 0), RM, .6, .28) : '');
      }
      s += `<rect x="${n1(pv[0] - hw - 1)}" y="${n1(tY - 1)}" width="${n1(hw * 2 + 2)}" height="5" fill="${o.sash || lighten(tone, .15)}" opacity=".7"/><path d="M${n1(pv[0] - hw)},${n1(tY + 4)}L${n1(pv[0] + hw)},${n1(tY + 4)}" stroke="${TR}" stroke-width=".7" opacity=".8"/>`;
      s += `<path d="M${n1(pv[0] + 3)},${n1(tY + 6)}L${n1(pv[0] + 6)},-2L${n1(pv[0] - 4)},-2L${n1(pv[0] - 2)},${n1(tY + 6)}Z" fill="${lighten(tone, .2)}" opacity=".35"/>`;
      for (let y = tY + 12; y < -6; y += 9) s += `<path d="M${n1(pv[0] + 1)},${n1(y - 2.4)}l2,2.4l-2,2.4l-2,-2.4z" fill="${TR}" opacity=".7"/>`;
      s += `<path d="M${n1(pv[0] - fl)},-3Q${n1(pv[0])},3 ${n1(pv[0] + fl)},-3" stroke="${TR}" stroke-width="1.3" fill="none" opacity=".7" stroke-dasharray="3 1.6"/>`;
    }
    /* ---- skirt / tassets ---- */
    if (legs && o.skirt !== false) {
      for (let i = 1; i < 4; i++) { const a = add(lerp(add(hipL, -4, 0), add(hipR, 4, 0), i / 4), 0, -5), b = add(lerp(add(hipL, -8, 0), add(hipR, 8, 0), i / 4), 0, 25); s += seg(a, b, '#000', 1.1, .45) + seg(add(a, 1.1, 0), add(b, 1.1, 0), RM, .45, .32); }
      s += seg(add(hipL, -8, 25), add(hipR, 8, 25), mat === 'plate' ? LT : TR, .8, .5);
    }
    /* ---- legs: knees, greaves, boots ---- */
    if (legs) {
      for (const [k, f, hp] of [[J.kL, J.fL, hipL], [J.kR, J.fR, hipR]]) {
        if (mat === 'plate' || mat === 'bone') {
          s += `<ellipse cx="${n1(k[0] + 0.5)}" cy="${n1(k[1])}" rx="${n1(6 * lw)}" ry="${n1(5 * lw)}" fill="url(#steelV)" opacity="${mat === 'bone' ? .2 : .42}"/>` + qd(add(k, -5 * lw, -1), add(k, 0, -6 * lw), add(k, 5 * lw, -1), LT, .7, .6) + rivet(k[0] + 2, k[1] + 1);
          s += seg(lerp(k, f, .15), lerp(f, k, .12), LT, .6, .45);
          for (let i = 0; i < 3; i++) s += qd(add(f, -3 + i * 3, -6), add(f, -1 + i * 3, -3), add(f, -2 + i * 3, -1), '#000', .8, .4);
        } else {
          s += band(k, f, .66, 9.5 * lw, '#000', .55, 2.4) + band(k, f, .62, 9.5 * lw, RM, .4, .7);
          if (mat === 'hide') s += band(k, f, .1, 9.5 * lw, '#3a2410', .6, 1.4) + band(k, f, .2, 9.5 * lw, '#3a2410', .6, 1.4) + band(hp, k, .75, 12 * lw, '#000', .3, 1);
          else s += band(hp, k, .5, 12 * lw, '#000', .25, 1) + dot(k, 2.4 * lw, RM, .16);
        }
        s += qd(add(f, 2, -5), add(f, 9 * lw, -5), add(f, 10 * lw, -1), LT, .7, .5);
      }
    }
    /* ---- arms: elbows, bracers, gauntlets ---- */
    for (const [sh, el, hn] of [[J.sL, J.eL, J.hL], [J.sR, J.eR, J.hR]]) {
      if (mat === 'plate') {
        s += dot(el, 4.6 * lw, 'url(#steelV)', .4) + qd(add(el, -4 * lw, 0), add(el, 0, -5 * lw), add(el, 4 * lw, 0), LT, .6, .55);
        s += band(el, hn, .5, 7.5 * lw, '#000', .5, 1.1) + band(el, hn, .46, 7.5 * lw, LT, .45, .5);
        s += dot(hn, 4.3 * lw, 'url(#steelV)', .45) + dot(add(hn, 1.6, -1.6), .7, '#fff', .7) + dot(add(hn, 2.4, .4), .6, '#fff', .55);
      } else if (mat !== 'bone') {
        const bc = mat === 'cloth' ? TR : '#2e1a0a';
        s += band(el, hn, .58, 7.5 * lw, bc, mat === 'cloth' ? .55 : .7, mat === 'cloth' ? 1 : 2.4) + band(el, hn, .86, 7.5 * lw, bc, mat === 'cloth' ? .55 : .7, mat === 'cloth' ? 1 : 2);
        if (mat !== 'cloth') s += band(el, hn, .72, 7.5 * lw, '#d0a070', .45, .5);
        if (mat === 'cloth') s += band(sh, el, .9, 9 * lw, '#000', .35, 2) + band(el, hn, .25, 7.5 * lw, '#000', .3, 1.6);
        if (mat === 'hide') s += band(sh, el, .3, 9 * lw, '#000', .3, .9);
      }
    }
    /* ---- pauldrons ---- */
    if (o.pauld) {
      const pr = 8 * w;
      for (const [sp, k] of [[J.sL, -1], [J.sR, 1]]) {
        const c0 = add(sp, k, 0);
        if (o.pauld === 'plate' || o.pauld === 'spiked') {
          s += dot(c0, pr, 'url(#steelV)', o.pauld === 'spiked' ? .22 : .4);
          for (let i = 0; i < 3; i++) { const q = pr * (0.95 - i * 0.27); s += `<path d="M${pt(add(c0, -q, i * 1.4))}A${n1(q)},${n1(q)} 0 0 1 ${pt(add(c0, q, i * 1.4))}" stroke="#000" stroke-width="1.1" fill="none" opacity=".45"/><path d="M${pt(add(c0, -q, i * 1.4 - 1))}A${n1(q)},${n1(q)} 0 0 1 ${pt(add(c0, q, i * 1.4 - 1))}" stroke="${LT}" stroke-width=".5" fill="none" opacity=".42"/>`; }
          s += `<path d="M${pt(add(c0, -pr, 1))}A${n1(pr)},${n1(pr)} 0 0 1 ${pt(add(c0, pr, 1))}" stroke="${TR}" stroke-width=".9" fill="none" opacity=".75"/>` + rivet(c0[0] - pr * 0.6, c0[1] + 1) + rivet(c0[0] + pr * 0.6, c0[1] + 1);
        }
      }
      if (o.pauld === 'fur') {
        for (let i = 0; i < 20; i++) { const x = cx - 21 * w + i * (42 * w / 19), y = top + 2 + Math.sin(i * 1.7) * 2; s += seg([x, y - 5], [x + (r() - 0.5) * 3, y + 6], i % 2 ? RM : '#000', i % 2 ? .6 : 1, i % 2 ? .4 : .4); }
      }
    }
    /* ---- belt ---- */
    if (o.belt || mat === 'leather' || mat === 'hide' || mat === 'mail') {
      const bc = o.belt || TR;
      s += seg(add(hipL, -2, -4), add(hipR, 2, -4), '#2a1608', 3, .8) + `<rect x="${n1(pv[0] - 2.4)}" y="${n1(pv[1] - 6.4)}" width="4.8" height="4.8" fill="none" stroke="${bc}" stroke-width="1" opacity=".9"/>`;
      s += `<rect x="${n1(hipL[0] - 4)}" y="${n1(hipL[1] - 3)}" width="6.5" height="8" rx="1.4" fill="#3a2410" opacity=".9"/><path d="M${n1(hipL[0] - 4)},${n1(hipL[1] - .4)}h6.5" stroke="#a8784a" stroke-width=".6" opacity=".7"/>` + dot([hipL[0] - .8, hipL[1] + .6], .7, bc, .9);
    }
    /* ---- head ---- */
    if (face) {
      const heavy = race === 'orc' || race === 'minotaur' || race === 'giant';
      s += `<ellipse cx="${n1(hd[0] + 5.6)}" cy="${n1(hd[1] - 1.2)}" rx="2.4" ry="1.6" fill="#000" opacity=".5"/><ellipse cx="${n1(hd[0] - 1.2)}" cy="${n1(hd[1] - 1.2)}" rx="2" ry="1.5" fill="#000" opacity=".45"/>` + seg(add(hd, -3.4, heavy ? -4 : -4.6), add(hd, 9, heavy ? -3.4 : -3.8), '#000', heavy ? 2.4 : 1.1, heavy ? .62 : .5);
      s += seg(add(hd, 2.6, -2), add(hd, 3.6, 3), LT, .7, .4) + seg(add(hd, 1.6, 3.4), add(hd, 4.4, 3.4), '#000', .9, .45);
      s += `<path d="M${pt(add(hd, hr * 0.74, -hr * 0.55))}A${n1(hr)},${n1(hr)} 0 0 1 ${pt(add(hd, hr * 0.74, hr * 0.55))}" stroke="${LT}" stroke-width=".8" fill="none" opacity=".45"/>`;
      s += seg(add(hd, 3, 5.6), add(hd, 8, 5), '#000', .8, .45) + qd(add(hd, -6, 4), add(hd, 0, hr + 1), add(hd, 7, 7), '#000', 1, .3);
      if (!o.eye) s += dot(add(hd, 5.6, -1.3), .9, '#fff', .75) + dot(add(hd, 5.6, -1.3), .45, '#000', .8) + dot(add(hd, -1.2, -1.3), .7, '#fff', .6) + dot(add(hd, -1.2, -1.3), .35, '#000', .8);
    }
    switch (o.helm) {
      case 'great':
        s += `<rect x="${n1(hd[0] - 13)}" y="${n1(hd[1] - 16)}" width="26" height="26" fill="url(#steel)" opacity=".28"/>`;
        [-9, -4, 1, 6, 10].forEach(dx => { s += rivet(hd[0] + dx, hd[1] - 5.4); });
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) s += dot(add(hd, 6 + i * 2.2, 3.4 + j * 2.2), .55, '#000', .8);
        s += seg(add(hd, -12, 8.4), add(hd, 12, 8.4), TR, 1, .7) + seg(add(hd, 0.6, -13), add(hd, 0.6, 8), LT, .6, .5) + seg(add(hd, -0.8, -13), add(hd, -0.8, 8), '#000', 1, .4);
        break;
      case 'horned':
        s += seg(add(hd, -11, -1), add(hd, 11, -1), TR, 1.5, .75) + rivet(hd[0] - 6, hd[1] - 1) + rivet(hd[0], hd[1] - 1.4) + rivet(hd[0] + 6, hd[1] - 1) + seg(add(hd, 7, -1), add(hd, 7.6, 6), LT, 1, .55) + `<path d="M${pt(add(hd, -11, -1))}Q${n1(hd[0])},${n1(hd[1] - 20)} ${pt(add(hd, 11, -1))}" fill="url(#steelV)" opacity=".3"/>`;
        break;
      case 'hood':
        s += `<ellipse cx="${n1(hd[0] + 4)}" cy="${n1(hd[1] + 1.5)}" rx="${n1(hr * 0.78)}" ry="${n1(hr * 0.9)}" fill="#000" opacity=".6"/>`;
        s += qd(add(hd, -9, -11), add(hd, -16, 4), add(J.sL, 4, 2), LT, .7, .3) + qd(add(hd, -3, -14), add(hd, -10, 6), add(J.sL, 10, 4), '#000', 1.4, .4) + qd(add(hd, 13, -6), add(hd, 16, 5), add(J.sR, -3, 0), RM, .9, .55);
        break;
      case 'wizard':
        s += `<path d="M${pt(add(hd, -11, -9))}Q${n1(hd[0])},${n1(hd[1] - 12)} ${pt(add(hd, 11, -9))}L${pt(add(hd, 10, -13))}Q${n1(hd[0])},${n1(hd[1] - 16)} ${pt(add(hd, -10, -13))}Z" fill="${TR}" opacity=".55"/>`;
        s += `<path d="M${n1(hd[0] - 7)},${n1(hd[1] - 27)}l1,-3l1,3l3,1l-3,1l-1,3l-1,-3l-3,-1z" fill="${TR}" opacity=".85"/>` + dot(add(hd, -3, -36), .9, TR, .8) + qd(add(hd, 4, -10), add(hd, -2, -30), add(hd, -15, -45), LT, .6, .35);
        break;
      case 'mohawk':
        for (let i = 0; i < 6; i++) s += seg(add(hd, -10 + i * 3, -6), add(hd, -12 + i * 3.6, -16 - i * 0.6), i % 2 ? RM : '#000', .6, .45);
        break;
      case 'hair': case 'flowhair': {
        const hc = o.hairCol || lighten(P.rim, .1);
        for (let i = 0; i < 7; i++) {
          if (o.helm === 'hair') s += qd(add(hd, 6 - i * 2.4, -9 + i * 0.6), add(hd, -14 - i * 1.6, 8 + i * 2), add(hd, -26 + i * 2.4, 44 - i * 4), i % 2 ? hc : '#000', i % 2 ? .5 : .8, .4);
          else s += qd(add(hd, 4 - i * 2, -8), add(hd, -30 - i * 3, -40 - i * 2), add(hd, -28 + i * 2, -86 + i * 3), i % 2 ? hc : '#000', i % 2 ? .5 : .8, .4);
        }
        break;
      }
      case 'crown': case 'coral':
        s += seg(add(hd, -11, -6), add(hd, 11, -6), o.crownCol || TR, 1.6, .7);
        break;
    }
    if (R.beard || o.beard) {
      const bc = o.beardCol || '#c8a070';
      s += `<path d="M${pt(add(hd, -8, 3))}Q${n1(hd[0] + 4)},${n1(hd[1] + 8)} ${pt(add(hd, 12, 1))}L${pt(add(hd, 10, 30))}L${pt(add(hd, 3, 24))}L${pt(add(hd, -1, 32))}L${pt(add(hd, -6, 20))}Z" fill="${bc}" opacity=".26"/>`;
      for (let i = 0; i < 6; i++) s += qd(add(hd, -4 + i * 2.6, 5), add(hd, -3 + i * 2.8, 16), add(hd, -1 + i * 2.2, 26 - Math.abs(i - 2.5) * 2), i % 2 ? '#000' : bc, i % 2 ? .9 : .5, .45);
      s += dot(add(hd, 3, 24.5), 1.4, TR, .9) + dot(add(hd, 9.4, 29), 1.2, TR, .9);
    }
    if (R.ears === 'elf' || R.ears === 'goblin') s += qd(add(hd, -4, -2), add(hd, R.ears === 'elf' ? -12 : -18, -9), add(hd, R.ears === 'elf' ? -17 : -26, -11), skin || LT, .8, .4);
    if (R.snout) s += dot(add(hd, 15, 4), 1.1, '#000', .8) + seg(add(hd, 14, 8), add(hd, 18, 8), '#e2c27a', 1.1, .8);
    if (R.skull) s += dot(add(hd, 3, -1), 2.6, '#000', .7) + dot(add(hd, 8, -1), 1.8, '#000', .7) + seg(add(hd, 3, 6), add(hd, 10, 6), '#000', 1.2, .6);
    // sky reflection on top, deep shade at the feet, key light from the right
    s += `<rect x="-140" y="-300" width="280" height="320" fill="url(#figSide)"/><rect x="-140" y="-300" width="280" height="320" fill="url(#figTop)"/>`;
    return s;
  }

  /* ---------- humanoid figure ---------- */
  L.fig = function (o, P, rr) {
    rr = rr || A.rng(7);
    const R = Object.assign({}, RACE[o.race || 'human'], o.raceOver || {});
    const base = POSES[o.pose || 'stand'];
    const J = {};
    for (const k in base) {
      if (k === 'wA' || k === 'oA') continue;
      let [x, y] = base[k];
      if (/^[kf][LR]$/.test(k)) y = y * R.leg; else y = y + 80 * (1 - R.leg);
      J[k] = [x * R.w, y * R.h];
    }
    const lw = R.limb, hr = R.head;
    const hd = J.hd, hipL = add(J.pv, -9 * R.w, 0), hipR = add(J.pv, 9 * R.w, 0);
    const id = nid(), cid = nid();
    let sil = '', hi = '', cape = '', silW = '', wPaint = '', capePaint = '', torsoD = '';
    const line = (a, b, w) => `<path d="M${pt(a)}L${pt(b)}" stroke-width="${n1(w)}" fill="none" stroke-linecap="round"/>`;

    // cape (behind)
    if (o.cape) {
      const sx = J.sL[0] - 2, sy = J.sL[1], ex = J.sR[0] + 2, ey = J.sR[1];
      const flow = o.capeFlow || -1; // -1 blows back-left
      const bot = -4, lx = sx + flow * 34, rx = ex + flow * 8;
      cape = `<path d="M${n1(sx)},${n1(sy)}C${n1(sx + flow * 14)},${n1(sy + 40)} ${n1(lx + 6)},${n1(bot - 50)} ${n1(lx)},${n1(bot)}L${n1(lx + 10)},${n1(bot - 6)}L${n1(lx + 18)},${n1(bot + 2)}L${n1(lx + 26)},${n1(bot - 5)}L${n1(rx)},${n1(bot)}C${n1(rx + 4)},${n1(bot - 40)} ${n1(ex + 6)},${n1(ey + 40)} ${n1(ex)},${n1(ey)}Z"/>`;
      // painted folds: long creases from the shoulders to the hem, a lit leading edge and a lining glimpse
      const lin = o.capeLining || '#8a1a1a';
      capePaint += `<path d="M${n1(sx)},${n1(sy)}C${n1(sx + flow * 14)},${n1(sy + 40)} ${n1(lx + 6)},${n1(bot - 50)} ${n1(lx)},${n1(bot)}" stroke="${lin}" stroke-width="3.2" fill="none" opacity=".55"/>`;
      for (let i = 1; i <= 5; i++) {
        const t = i / 6, a = [sx + (ex - sx) * t, sy + (ey - sy) * t + 3], b = [lx + (rx - lx) * t, bot - 3], m = [(a[0] + b[0]) / 2 + flow * (i % 2 ? 7 : -4), (a[1] + b[1]) / 2];
        capePaint += `<path d="M${pt(a)}Q${pt(m)} ${pt(b)}" stroke="#000" stroke-width="${i % 2 ? 2.6 : 1.6}" fill="none" opacity=".42"/><path d="M${pt(add(a, 1.6, 0))}Q${pt(add(m, 1.8, 0))} ${pt(add(b, 1.6, 0))}" stroke="${P.rim}" stroke-width=".7" fill="none" opacity=".26"/>`;
      }
      capePaint += `<rect x="-140" y="-200" width="280" height="220" fill="url(#figSide)"/><rect x="-140" y="-200" width="280" height="220" fill="url(#figTop)"/>`;
    }
    // legs / robe
    if (o.robe) {
      const top = J.pv[1] - 6, hw = 13 * R.w, flare = 30 * R.w;
      const hem = o.tatter ? `L${n1(J.pv[0] + flare)},-2L${n1(J.pv[0] + flare * 0.6)},-12L${n1(J.pv[0] + flare * 0.3)},0L${n1(J.pv[0])},-14L${n1(J.pv[0] - flare * 0.35)},0L${n1(J.pv[0] - flare * 0.7)},-10L${n1(J.pv[0] - flare)},-1`
        : `L${n1(J.pv[0] + flare)},-2Q${n1(J.pv[0])},4 ${n1(J.pv[0] - flare)},-2`;
      sil += `<path d="M${n1(J.pv[0] - hw)},${n1(top)}L${n1(J.pv[0] + hw)},${n1(top)}Q${n1(J.pv[0] + flare * 0.7)},${n1(top * 0.5)} ${n1(J.pv[0] + flare)},-2${hem}Q${n1(J.pv[0] - flare * 0.7)},${n1(top * 0.5)} ${n1(J.pv[0] - hw)},${n1(top)}Z"/>`;
    } else {
      sil += line(hipL, J.kL, 12 * lw) + line(J.kL, J.fL, 9.5 * lw) + line(hipR, J.kR, 12 * lw) + line(J.kR, J.fR, 9.5 * lw);
      sil += `<ellipse cx="${n1(J.fL[0] + 3)}" cy="${n1(J.fL[1] - 2)}" rx="${n1(7 * lw)}" ry="${n1(3.6 * lw)}"/><ellipse cx="${n1(J.fR[0] + 3)}" cy="${n1(J.fR[1] - 2)}" rx="${n1(7 * lw)}" ry="${n1(3.6 * lw)}"/>`;
      if (o.skirt !== false) sil += `<path d="M${pt(add(hipL, -4, -6))}L${pt(add(hipR, 4, -6))}L${pt(add(hipR, 8, 26))}L${pt(add(J.pv, 0, 22))}L${pt(add(hipL, -8, 26))}Z"/>`;
    }
    // torso
    torsoD = `M${pt(add(J.sL, -3, -2))}Q${n1(J.ch[0] - 17 * R.w)},${n1(J.ch[1] + 6)} ${pt(add(hipL, -1, 0))}L${pt(add(hipR, 1, 0))}Q${n1(J.ch[0] + 17 * R.w)},${n1(J.ch[1] + 6)} ${pt(add(J.sR, 3, -2))}Q${n1(J.ch[0])},${n1(J.sL[1] - 5)} ${pt(add(J.sL, -3, -2))}Z`;
    sil += `<path d="${torsoD}"/>`;
    sil += line(J.nk, hd, 8 * lw);
    // arms
    sil += line(J.sL, J.eL, 9 * lw) + line(J.eL, J.hL, 7.5 * lw) + `<circle cx="${n1(J.hL[0])}" cy="${n1(J.hL[1])}" r="${n1(4.3 * lw)}"/>`;
    sil += line(J.sR, J.eR, 9 * lw) + line(J.eR, J.hR, 7.5 * lw) + `<circle cx="${n1(J.hR[0])}" cy="${n1(J.hR[1])}" r="${n1(4.3 * lw)}"/>`;
    // pauldrons
    if (o.pauld) {
      const pr = 8 * R.w;
      sil += `<circle cx="${n1(J.sL[0] - 1)}" cy="${n1(J.sL[1])}" r="${n1(pr)}"/><circle cx="${n1(J.sR[0] + 1)}" cy="${n1(J.sR[1])}" r="${n1(pr)}"/>`;
      if (o.pauld === 'spiked') sil += `<path d="M${pt(add(J.sL, -4, -6))}L${pt(add(J.sL, -12, -18))}L${pt(add(J.sL, 2, -8))}ZM${pt(add(J.sR, 4, -6))}L${pt(add(J.sR, 12, -18))}L${pt(add(J.sR, -2, -8))}Z"/>`;
      if (o.pauld === 'fur') sil += `<ellipse cx="${n1(J.ch[0])}" cy="${n1(J.sL[1] + 2)}" rx="${n1(22 * R.w)}" ry="${n1(7)}"/>`;
      hi += `<path d="M${pt(add(J.sL, -pr, -1))}A${n1(pr)},${n1(pr)} 0 0 1 ${pt(add(J.sL, pr * 0.6, -pr * 0.6))}" stroke="${P.rim}" stroke-width="1" fill="none" opacity=".7"/><path d="M${pt(add(J.sR, -pr * 0.6, -pr * 0.6))}A${n1(pr)},${n1(pr)} 0 0 1 ${pt(add(J.sR, pr, -1))}" stroke="${P.rim}" stroke-width="1" fill="none" opacity=".7"/>`;
    }
    // head
    if (!o.noHead) sil += `<circle cx="${n1(hd[0])}" cy="${n1(hd[1])}" r="${n1(hr)}"/>`;
    // race features
    if (R.ears === 'elf') sil += `<path d="M${pt(add(hd, -3, -3))}L${pt(add(hd, -20, -15))}L${pt(add(hd, -5, 3))}Z"/>`;
    if (R.ears === 'goblin') sil += `<path d="M${pt(add(hd, -6, -4))}L${pt(add(hd, -30, -10))}L${pt(add(hd, -24, -4))}L${pt(add(hd, -6, 4))}Z"/><path d="M${pt(add(hd, 6, -6))}L${pt(add(hd, 22, -16))}L${pt(add(hd, 9, 2))}Z"/>`;
    if (R.nose) sil += `<path d="M${pt(add(hd, 8, -3))}L${pt(add(hd, 22, 3))}L${pt(add(hd, 8, 4))}Z"/>`;
    if (R.snout) sil += `<ellipse cx="${n1(hd[0] + 10)}" cy="${n1(hd[1] + 5)}" rx="9" ry="6.5"/>`;
    if (R.beard || o.beard) sil += `<path d="M${pt(add(hd, -8, 3))}Q${n1(hd[0] + 4)},${n1(hd[1] + 8)} ${pt(add(hd, 12, 1))}L${pt(add(hd, 10, 30))}L${pt(add(hd, 3, 24))}L${pt(add(hd, -1, 32))}L${pt(add(hd, -6, 20))}Z"/>`;
    if (R.fins) sil += `<path d="M${pt(add(hd, -4, -10))}L${pt(add(hd, -18, -22))}L${pt(add(hd, -14, -12))}L${pt(add(hd, -24, -10))}L${pt(add(hd, -12, -2))}Z"/>`;
    if (R.horns) {
      const hl = tube(add(hd, -6, -7), add(hd, -26, -10), add(hd, -34, -26), add(hd, -20, -38), 7, 1);
      const hrn = tube(add(hd, 4, -9), add(hd, 22, -16), add(hd, 30, -30), add(hd, 18, -42), 7, 1);
      sil += `<path d="${hl.d}"/><path d="${hrn.d}"/>`;
      hi += `<path d="${hl.d}" fill="url(#bone)" opacity=".55"/><path d="${hrn.d}" fill="url(#bone)" opacity=".6"/>`;
    }
    // headgear
    switch (o.helm) {
      case 'great':
        sil += `<path d="M${pt(add(hd, -12, 9))}L${pt(add(hd, -12, -7))}Q${n1(hd[0])},${n1(hd[1] - 16)} ${pt(add(hd, 12, -7))}L${pt(add(hd, 12, 9))}Z"/>`;
        if (o.plume !== false) sil += `<path d="M${pt(add(hd, 0, -13))}Q${n1(hd[0] - 14)},${n1(hd[1] - 30)} ${pt(add(hd, -30, -14))}Q${n1(hd[0] - 14)},${n1(hd[1] - 20)} ${pt(add(hd, -2, -10))}Z"/>`;
        hi += `<path d="M${pt(add(hd, -1, -1))}L${pt(add(hd, 12, -1))}" stroke="${o.eye || P.light}" stroke-width="1.6"/><path d="M${pt(add(hd, -1, -1))}L${pt(add(hd, 12, -1))}" stroke="${o.eye || P.light}" stroke-width="4" opacity=".5" filter="url(#b1)"/><path d="M${pt(add(hd, 4, -12))}L${pt(add(hd, 4, 8))}" stroke="${P.rim}" stroke-width=".7" opacity=".5"/>`;
        break;
      case 'horned':
        sil += `<path d="M${pt(add(hd, -12, 2))}Q${n1(hd[0])},${n1(hd[1] - 22)} ${pt(add(hd, 12, 2))}Z"/>`;
        { const h1 = tube(add(hd, -9, -6), add(hd, -20, -8), add(hd, -24, -20), add(hd, -18, -30), 5, 0.8), h2 = tube(add(hd, 9, -6), add(hd, 20, -8), add(hd, 24, -20), add(hd, 18, -30), 5, 0.8); sil += `<path d="${h1.d}"/><path d="${h2.d}"/>`; hi += `<path d="${h1.d}" fill="url(#bone)" opacity=".5"/><path d="${h2.d}" fill="url(#bone)" opacity=".5"/>`; }
        break;
      case 'hood':
        sil += `<path d="M${pt(add(J.sL, 2, 2))}Q${n1(hd[0] - 18)},${n1(hd[1] + 4)} ${pt(add(hd, -10, -12))}Q${n1(hd[0] + 2)},${n1(hd[1] - 22)} ${pt(add(hd, 13, -6))}Q${n1(hd[0] + 15)},${n1(hd[1] + 6)} ${pt(add(J.sR, -2, 0))}Z"/>`;
        break;
      case 'wizard':
        sil += `<ellipse cx="${n1(hd[0])}" cy="${n1(hd[1] - 7)}" rx="19" ry="4"/><path d="M${pt(add(hd, -10, -8))}Q${n1(hd[0] - 6)},${n1(hd[1] - 30)} ${pt(add(hd, -18, -48))}Q${n1(hd[0] + 4)},${n1(hd[1] - 30)} ${pt(add(hd, 10, -8))}Z"/>`;
        hi += `<path d="M${pt(add(hd, -12, -10))}Q${n1(hd[0])},${n1(hd[1] - 13)} ${pt(add(hd, 12, -10))}" stroke="${o.trim || '#d9b45a'}" stroke-width="1.4" fill="none" opacity=".85"/>`;
        break;
      case 'crown': case 'coral': {
        let d = `M${pt(add(hd, -11, -6))}`;
        const sp = o.helm === 'coral' ? [[-12, -26], [-6, -12], [-2, -30], [3, -13], [8, -28], [11, -8]] : [[-10, -20], [-5, -11], [0, -24], [5, -11], [10, -20], [11, -6]];
        sp.forEach(q => { d += `L${pt(add(hd, q[0], q[1]))}`; });
        sil += `<path d="${d}Z"/>`;
        const cc = o.crownCol || (o.helm === 'coral' ? '#ff8a9a' : '#e2b04a');
        hi += `<path d="${d}" stroke="${cc}" stroke-width="1" fill="none" opacity=".85"/><circle cx="${n1(hd[0])}" cy="${n1(hd[1] - 9)}" r="1.8" fill="${o.gem || P.glow}"/><circle cx="${n1(hd[0])}" cy="${n1(hd[1] - 9)}" r="5" fill="${o.gem || P.glow}" opacity=".5" filter="url(#b1)"/>`;
        break;
      }
      case 'mohawk':
        sil += `<path d="M${pt(add(hd, -12, 0))}Q${n1(hd[0] - 10)},${n1(hd[1] - 22)} ${pt(add(hd, 6, -18))}L${pt(add(hd, 2, -9))}Z"/>`;
        break;
      case 'hair':
        sil += `<path d="M${pt(add(hd, 8, -8))}Q${n1(hd[0] - 4)},${n1(hd[1] - 18)} ${pt(add(hd, -12, -4))}Q${n1(hd[0] - 22)},${n1(hd[1] + 24)} ${pt(add(hd, -30, 48))}Q${n1(hd[0] - 10)},${n1(hd[1] + 30)} ${pt(add(hd, -2, 10))}Z"/>`;
        break;
      case 'flowhair':
        sil += `<path d="M${pt(add(hd, 8, -8))}Q${n1(hd[0] - 4)},${n1(hd[1] - 22)} ${pt(add(hd, -12, -8))}C${n1(hd[0] - 40)},${n1(hd[1] - 30)} ${n1(hd[0] - 50)},${n1(hd[1] - 70)} ${n1(hd[0] - 30)},${n1(hd[1] - 90)}C${n1(hd[0] - 30)},${n1(hd[1] - 50)} ${n1(hd[0] - 12)},${n1(hd[1] - 30)} ${pt(add(hd, -2, -6))}Z"/><path d="M${pt(add(hd, -8, -10))}C${n1(hd[0] - 20)},${n1(hd[1] - 40)} ${n1(hd[0] + 10)},${n1(hd[1] - 60)} ${n1(hd[0] + 14)},${n1(hd[1] - 84)}C${n1(hd[0] + 4)},${n1(hd[1] - 50)} ${n1(hd[0] - 4)},${n1(hd[1] - 36)} ${pt(add(hd, 4, -8))}Z"/>`;
        break;
    }
    // weapons
    const wa = o.wA != null ? o.wA : base.wA, oa = o.oA != null ? o.oA : base.oA;
    let whi = '';
    if (o.w) {
      const wp = weapon(o.w, P, o);
      silW += `<g transform="translate(${pt(J.hR)}) rotate(${wa})">${wp.sil}</g>`;
      if (wp.paint) wPaint += `<g transform="translate(${pt(J.hR)}) rotate(${wa})">${wp.paint}</g>`;
      whi += `<g transform="translate(${pt(J.hR)}) rotate(${wa})">${wp.hi}</g>`;
      if (o.w === 'bow' && (o.pose === 'aim')) {
        const tipT = [J.hR[0] - 1, J.hR[1] - 48], tipB = [J.hR[0] - 1, J.hR[1] + 48];
        whi += `<path d="M${pt(tipT)}L${pt(J.hL)}L${pt(tipB)}" stroke="${P.rim}" stroke-width=".7" fill="none" opacity=".9"/><path d="M${pt(J.hL)}L${pt(add(J.hR, 22, 0))}" stroke="${P.rim}" stroke-width="1.1"/><path d="M${pt(add(J.hR, 28, 0))}L${pt(add(J.hR, 21, -3))}L${pt(add(J.hR, 21, 3))}Z" fill="${o.wGlow || P.rim}"/>` + (o.wGlow ? `<circle cx="${n1(J.hR[0] + 26)}" cy="${n1(J.hR[1])}" r="7" fill="${o.wGlow}" opacity=".5" filter="url(#b2)"/>` : '');
      } else if (o.w === 'bow') {
        whi += `<g transform="translate(${pt(J.hR)}) rotate(${wa})"><path d="M-1,-48L-1,48" stroke="${P.rim}" stroke-width=".6" opacity=".8"/></g>`;
      }
    }
    if (o.off) {
      const wp = weapon(o.off, P, Object.assign({}, o, { wGlow: o.offGlow || o.wGlow }));
      silW += `<g transform="translate(${pt(J.hL)}) rotate(${oa})">${wp.sil}</g>`;
      if (wp.paint) wPaint += `<g transform="translate(${pt(J.hL)}) rotate(${oa})">${wp.paint}</g>`;
      whi += `<g transform="translate(${pt(J.hL)}) rotate(${oa})">${wp.hi}</g>`;
    }
    // detail layer
    const eye = o.eye || (R.skull ? '#7affb0' : null);
    if (eye || o.helm === 'hood') {
      const ec = eye || P.light;
      if (o.helm !== 'great') hi += `<circle cx="${n1(hd[0] + 4)}" cy="${n1(hd[1] - 1)}" r="3.4" fill="${ec}" opacity=".55" filter="url(#b1)"/><circle cx="${n1(hd[0] + 4)}" cy="${n1(hd[1] - 1)}" r="1.3" fill="${ec}"/><circle cx="${n1(hd[0] + 9)}" cy="${n1(hd[1] - 1.5)}" r="1" fill="${ec}"/>`;
    }
    if (R.tusks) hi += `<path d="M${pt(add(hd, 6, 5))}q1,-5 -1,-8M${pt(add(hd, 10, 5))}q1,-5 0,-8" stroke="#efe6cc" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    if (R.beard || o.beard) hi += `<path d="M${pt(add(hd, 3, 6))}L${pt(add(hd, 6, 26))}M${pt(add(hd, -2, 8))}L${pt(add(hd, 0, 26))}" stroke="${P.rim}" stroke-width=".6" opacity=".55"/>`;
    if (R.skull) {
      const c = J.ch;
      for (let i = 0; i < 4; i++) hi += `<path d="M${n1(c[0] - 9 * R.w)},${n1(c[1] - 6 + i * 6)}Q${n1(c[0])},${n1(c[1] - 2 + i * 6)} ${n1(c[0] + 9 * R.w)},${n1(c[1] - 6 + i * 6)}" stroke="url(#bone)" stroke-width="1.6" fill="none" opacity=".75"/>`;
      hi += `<path d="M${pt(add(c, 0, -14))}L${pt(add(J.pv, 0, 0))}" stroke="url(#bone)" stroke-width="1.6" opacity=".7"/>`;
    }
    if (o.emblem && !o.off) hi += sunGlyph(J.ch[0] + 2, J.ch[1] + 2, 6, o.emblem);
    if (o.glowR) hi += handGlow(J.hR, o.glowR, o.glowSize || 1);
    if (o.glowL) hi += handGlow(J.hL, o.glowL, o.glowSize || 1);
    if (o.belt) hi += `<path d="M${pt(add(hipL, -2, -4))}L${pt(add(hipR, 2, -4))}" stroke="${o.belt}" stroke-width="1.6" opacity=".8"/><circle cx="${n1(J.pv[0] + 1)}" cy="${n1(J.pv[1] - 4)}" r="1.8" fill="${o.belt}"/>`;
    hi += whi;

    const x = o.x != null ? o.x : 150, y = o.y != null ? o.y : 200, s = o.s || 1, fl = o.flip ? -1 : 1;
    const bodyFill = o.spectral ? o.spectral : 'url(#body)';
    const capeCol = o.capeCol || P.body;
    let out = (o.shadow === false ? '' : `<ellipse cx="${x}" cy="${y + 1}" rx="${n1(34 * s * R.w)}" ry="${n1(5 * s)}" fill="#000" opacity=".55" filter="url(#b2)"/>`) + `<g transform="translate(${x},${y}) scale(${n1(s * fl * 100) / 100},${s})">`;
    const bid = nid(), mid = nid(), cmid = nid();
    const mat = o.mat || matFor(o, R);
    const paint = o.noPaint ? '' : figPaint({ J, R, hipL, hipR, hd, hr, lw, o, P, mat, torsoD, r: rr, ghost: !!o.spectral });
    out += `<defs><g id="${bid}">${sil}</g><g id="${id}"><use href="#${bid}"/>${silW}</g>${cape ? `<g id="${cid}">${cape}</g>` : ''}`;
    if (paint) out += `<mask id="${mid}" maskUnits="userSpaceOnUse" x="-240" y="-340" width="480" height="400"><use href="#${bid}" fill="#fff" stroke="#fff"/></mask>`;
    if (cape && !o.spectral) out += `<mask id="${cmid}" maskUnits="userSpaceOnUse" x="-240" y="-340" width="480" height="400"><use href="#${cid}" fill="#fff" stroke="#fff" stroke-width="1"/></mask>`;
    out += `</defs>`;
    if (o.aura !== false) out += `<use href="#${id}" fill="${o.auraCol || P.glow}" stroke="${o.auraCol || P.glow}" opacity="${o.auraOp || 0.35}" filter="url(#b8)"/>`;
    if (cape) out += `<use href="#${cid}" fill="${P.rim}" stroke="${P.rim}" stroke-width="1" filter="url(#rim)"/><use href="#${cid}" fill="${capeCol}" stroke="${capeCol}" stroke-width="1"/>` + (o.capeCol ? `<use href="#${cid}" fill="url(#body)" opacity=".45"/>` : '') + (o.spectral ? '' : `<g mask="url(#${cmid})">${capePaint}</g>`);
    out += `<use href="#${id}" fill="${P.rim}" stroke="${P.rim}" filter="url(#rim)" opacity="${o.rimOp || 1}"/>`;
    if (o.spectral) out += `<use href="#${id}" fill="${o.spectral}" stroke="${o.spectral}" opacity=".55" filter="url(#b1)"/><use href="#${id}" fill="${o.spectral}" stroke="${o.spectral}" opacity=".35"/>`;
    else out += `<use href="#${id}" fill="${bodyFill}" stroke="${bodyFill}"/>`;
    if (paint) out += `<g mask="url(#${mid})"${o.spectral ? ' opacity=".55"' : ''}>${paint}</g>`;
    if (!o.spectral) out += wPaint;
    out += hi + '</g>';
    return out;
  };
  function handGlow(p, c, k) {
    k = k || 1;
    let s = `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${n1(22 * k)}" fill="${c}" opacity=".32" filter="url(#b4)"/><circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${n1(7 * k)}" fill="${c}" opacity=".75" filter="url(#b1)"/><circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${n1(2.6 * k)}" fill="#fff"/>`;
    for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.3; s += `<path d="M${n1(p[0] + Math.cos(a) * 5 * k)},${n1(p[1] + Math.sin(a) * 5 * k)}L${n1(p[0] + Math.cos(a) * 13 * k)},${n1(p[1] + Math.sin(a) * 13 * k)}" stroke="${c}" stroke-width=".7" opacity=".8"/>`; }
    return s;
  }
  A.handGlow = handGlow;
  L.glow = (o, P) => `<circle cx="${o.x}" cy="${o.y}" r="${o.r || 50}" fill="${o.c || P.glow}" opacity="${o.op || 0.45}" filter="url(#b8)"/>`;

  /* ---------- hand-placed texture strokes (fur, feathers, scales, bark, stone) ----------
     scattered at random inside the creature's box and clipped by its silhouette, so they read as brushwork, not wallpaper */
  function strokeTex(r, box, kind, P, dens) {
    const [x0, y0, x1, y1] = box, n = Math.round((x1 - x0) * (y1 - y0) / (dens || 55));
    const L = P.rim, D = P.dark || '#000', out = [];
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), lit = r() < 0.45;
      const c = lit ? L : D, op = (lit ? 0.34 : 0.36) * (P.texK || 1), sw = lit ? 0.5 : 0.8;
      if (kind === 'fur') { const len = 4 + r() * 6, a = 1.75 + (r() - 0.5) * 0.7; out.push(`<path d="M${n1(x)},${n1(y)}q${n1(Math.cos(a) * len * 0.5 + 1)},${n1(Math.sin(a) * len * 0.5)} ${n1(Math.cos(a) * len)},${n1(Math.sin(a) * len)}" stroke="${c}" stroke-width="${sw}" opacity="${op}" fill="none" stroke-linecap="round"/>`); }
      else if (kind === 'feather') { const w = 5 + r() * 4; out.push(`<path d="M${n1(x)},${n1(y)}q${n1(w / 2)},${n1(-w * 0.7)} ${n1(w)},0M${n1(x + w / 2)},${n1(y - w * 0.35)}l${n1(-w * 0.2)},${n1(w * 0.8)}" stroke="${c}" stroke-width="${sw}" opacity="${op}" fill="none"/>`); }
      else if (kind === 'scale') { const w = 3.5 + r() * 2.5; out.push(`<path d="M${n1(x)},${n1(y)}q${n1(w / 2)},${n1(-w * 0.8)} ${n1(w)},0" stroke="${c}" stroke-width="${sw}" opacity="${op + 0.06}" fill="none"/>`); }
      else if (kind === 'bark') { const len = 10 + r() * 22; out.push(`<path d="M${n1(x)},${n1(y)}q${n1((r() - 0.5) * 5)},${n1(len / 2)} ${n1((r() - 0.5) * 3)},${n1(len)}" stroke="${c}" stroke-width="${lit ? 0.6 : 1.3}" opacity="${op + 0.06}" fill="none"/>`); }
      else if (kind === 'rock') { if (r() < 0.6) out.push(`<path d="M${n1(x)},${n1(y)}l${n1(3 + r() * 5)},${n1((r() - 0.5) * 4)}l${n1(2 + r() * 4)},${n1(2 + r() * 3)}" stroke="${c}" stroke-width="${lit ? 0.6 : 1}" opacity="${op + 0.08}" fill="none"/>`); else out.push(`<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(0.6 + r() * 1.2)}" fill="${c}" opacity="${op}"/>`); }
    }
    return out.join('');
  }
  A.strokeTex = strokeTex;

  /* ---------- silhouette wrapper for creatures ---------- */
  function silhouette(sil, hi, o, P) {
    const id = nid(), mid = nid();
    // painted pass: local colour, a hide/scale/feather/bark/stone texture, key light and sky bounce, all clipped to the body
    let paint = '';
    if (o.spectral && !o.noPaint && o.box && o._r) paint = `<use href="#${id}" fill="url(#tLit)"/><g opacity=".4">${strokeTex(o._r, o.box, o.tex, { rim: '#fff' }, (o.dens || 55) * 1.6)}</g>`;
    else if (!o.spectral && !o.noPaint && o.tone && A.mix) {
      // full-colour painted creature: its own colour lit from the upper right, brushwork in light and shadow tones of that colour
      const t = o.tone, M = A.mix;
      paint = `<use href="#${id}" fill="url(#tLit)" opacity=".7"/>`;
      if (o.tex && o.box && o._r) paint += strokeTex(o._r, o.box, o.tex, { rim: M(t, '#fff4dc', 0.5), dark: M(t, '#0a0612', 0.7), texK: 1.9 }, o.dens);
      paint += (o.paintExtra || '') + `<rect x="-280" y="-340" width="560" height="460" fill="url(#crSide)" opacity=".7"/><rect x="-280" y="-340" width="560" height="460" fill="url(#crTop)" opacity=".75"/>`;
    }
    else if (!o.spectral && !o.noPaint) {
      paint = `<rect x="-280" y="-340" width="560" height="460" fill="${o.tone || P.bodyTop}" opacity="${o.toneOp || 0.28}"/>`;
      paint += `<use href="#${id}" fill="url(#tLit)"/>`;
      if (o.tex && o.box && o._r) paint += strokeTex(o._r, o.box, o.tex, P, o.dens);
      else if (o.tex && /^p[A-Z]/.test(o.tex)) paint += `<rect x="-280" y="-340" width="560" height="460" fill="url(#${o.tex})" opacity="${o.texOp || 0.85}"/>`;
      paint += (o.paintExtra || '') + `<rect x="-280" y="-340" width="560" height="460" fill="url(#crSide)"/><rect x="-280" y="-340" width="560" height="460" fill="url(#crTop)"/>`;
    }
    const x = o.x != null ? o.x : 150, y = o.y != null ? o.y : 200, s = o.s || 1, fl = o.flip ? -1 : 1;
    let fill = o.spectral || 'url(#body)', gdef = '';
    if (!o.spectral && !o.noPaint && o.tone && A.mix) {
      const g = nid(), t = o.tone, M = A.mix;
      gdef = `<radialGradient id="${g}" cx=".64" cy=".3" r=".9" fx=".7" fy=".22"><stop offset="0" stop-color="${M(t, '#fff2d6', 0.42)}"/><stop offset=".42" stop-color="${t}"/><stop offset=".85" stop-color="${M(t, '#1a1030', 0.5)}"/><stop offset="1" stop-color="${M(t, '#0a0614', 0.72)}"/></radialGradient>`;
      fill = `url(#${g})`;
    }
    let out = (o.shadow ? `<ellipse cx="${x}" cy="${y + 1}" rx="${n1(o.shadow * s)}" ry="${n1(6 * s)}" fill="#000" opacity=".55" filter="url(#b2)"/>` : '') + `<g transform="translate(${x},${y}) scale(${n1(s * fl * 100) / 100},${s})${o.rot ? ` rotate(${o.rot})` : ''}"><defs>${gdef}<g id="${id}">${sil}</g>${paint ? `<mask id="${mid}" maskUnits="userSpaceOnUse" x="-300" y="-360" width="600" height="500"><use href="#${id}" fill="#fff" stroke="#fff"/></mask>` : ''}</defs>`;
    if (o.aura !== false) out += `<use href="#${id}" fill="${o.auraCol || P.glow}" opacity="${o.auraOp || 0.35}" filter="url(#b8)"/>`;
    out += `<use href="#${id}" fill="${P.rim}" stroke="${P.rim}" filter="url(#rim)"/>`;
    if (o.spectral) out += `<use href="#${id}" fill="${fill}" opacity=".5" filter="url(#b1)"/><use href="#${id}" fill="${fill}" opacity=".4"/>`;
    else if (gdef) out += `<use href="#${id}" fill="${fill}" stroke="#170e09" stroke-width="1.1" stroke-linejoin="round"/>`;
    else out += `<use href="#${id}" fill="${fill}" stroke="${fill}"/>`;
    if (paint) out += `<g mask="url(#${mid})">${paint}</g>`;
    return out + hi + '</g>';
  }
  const eyeGlow = (x, y, c, r) => `<circle cx="${x}" cy="${y}" r="${(r || 1.6) * 2.4}" fill="${c}" opacity=".6" filter="url(#b1)"/><circle cx="${x}" cy="${y}" r="${r || 1.6}" fill="${c}"/>`;
  A.silhouette = silhouette; A.eyeGlow = eyeGlow;

  /* ---------- creatures ---------- */
  L.beast = function (o, P, r) {
    const ec = o.eye || P.light;
    let sil = '', hi = '';
    switch (o.t) {
      case 'wolf': case 'lynx': {
        const lynx = o.t === 'lynx';
        const tail = lynx ? 'M-60,-46Q-66,-50 -64,-56Q-58,-58 -50,-58' : 'M-80,-26C-80,-40 -66,-54 -50,-58';
        sil = `<path d="${tail}Q-30,-64 -6,-60Q14,-58 28,-64Q36,-70 42,-80L${lynx ? '42,-98L47,-92L50,-84L54,-102L58,-84' : '44,-94L50,-83L55,-96L58,-82'}Q64,-80 70,-76L${lynx ? '84,-70Q86,-66 82,-64' : '90,-70Q91,-66 88,-64'}L72,-62Q64,-60 58,-56Q50,-50 46,-40L44,-30L46,-4L50,0L41,0L38,-26L34,-30L30,-4L33,0L24,0L23,-31Q10,-38 -10,-36Q-26,-34 -34,-38L-34,-24L-28,-5L-25,0L-35,0L-41,-20L-46,-28L-48,-12L-44,-2L-42,0L-52,0L-56,-18Q-60,-34 -58,-44${lynx ? 'Q-60,-46 -60,-46' : 'Q-66,-40 -70,-32Q-74,-24 -80,-26'}Z"/>`;
        if (!lynx) sil += `<path d="M30,-64L24,-52L34,-56L30,-44L40,-50L40,-40L46,-46L46,-40Z"/><path d="M-80,-26L-84,-18L-76,-22L-74,-14L-70,-24Z"/><path d="M-20,-62L-14,-68L-10,-61L-4,-67L0,-60Z"/>`;
        hi = eyeGlow(64, -76, ec, 1.5) + `<path d="M-48,-58Q-20,-64 26,-62" stroke="${P.rim}" stroke-width=".6" fill="none" opacity=".5"/><path d="M72,-63L86,-66" stroke="${P.rim}" stroke-width=".5" opacity=".6"/>`;
        if (lynx) for (let i = 0; i < 6; i++) hi += `<path d="M${-44 + i * 12},-58q4,9 0,18" stroke="${o.stripe || '#fff'}" stroke-width="1.3" fill="none" opacity=".5"/>`;
        break;
      }
      case 'bear':
        sil = `<path d="M-72,-30Q-78,-58 -56,-70Q-30,-84 -4,-88Q14,-90 26,-80Q38,-74 48,-68Q50,-76 55,-77Q60,-76 60,-68Q70,-64 78,-58Q86,-54 88,-48Q86,-44 80,-43L68,-42Q62,-38 58,-30Q56,-18 57,-6Q60,-2 62,0L42,0Q41,-10 38,-20Q34,-24 30,-24Q30,-12 31,-4Q33,-2 34,0L14,0Q13,-12 12,-24Q-8,-28 -28,-26Q-30,-14 -29,-4Q-27,-2 -26,0L-46,0Q-48,-10 -50,-20Q-54,-22 -56,-20Q-56,-10 -55,-4Q-53,-2 -52,0L-72,0Q-75,-14 -72,-30Z"/><path d="M60,-68Q58,-76 63,-77Q66,-74 64,-67Z"/>`;
        hi = eyeGlow(67, -58, ec, 1.5) + `<path d="M-50,-70Q-10,-86 30,-76" stroke="${P.rim}" stroke-width=".7" fill="none" opacity=".5"/><path d="M80,-52l3,1" stroke="#fff" stroke-width="1" opacity=".6"/>`;
        break;
      case 'bird': case 'gryphon': {
        const wing = side => {
          const k = side;
          return `<path d="M${-8 * k},-74C${-40 * k},-112 ${-90 * k},-122 ${-124 * k},-104L${-112 * k},-94L${-120 * k},-84L${-102 * k},-80L${-108 * k},-70L${-88 * k},-70L${-90 * k},-60L${-70 * k},-62L${-70 * k},-52L${-48 * k},-58Q${-24 * k},-56 ${-8 * k},-56Z"/>`;
        };
        sil = wing(1) + wing(-1) + `<ellipse cx="0" cy="-60" rx="13" ry="23"/><circle cx="4" cy="-90" r="10"/><path d="M11,-94L27,-89L11,-84Z"/><path d="M-8,-42L-18,-14L-7,-19L0,-10L7,-19L18,-14L8,-42Z"/>`;
        if (o.t === 'gryphon') sil += `<path d="M-10,-44L-16,-12L-22,0L-12,0L-6,-14L-2,-40Z"/><path d="M10,-44L16,-12L22,0L12,0L6,-14L2,-40Z"/><path d="M-4,-90L-12,-104L-2,-98L-2,-108L4,-98Z"/>`;
        hi = eyeGlow(8, -92, ec, 1.4) + `<path d="M-10,-72C-40,-108 -90,-118 -120,-102" stroke="${P.rim}" stroke-width=".8" fill="none" opacity=".6"/><path d="M10,-72C40,-108 90,-118 120,-102" stroke="${P.rim}" stroke-width=".8" fill="none" opacity=".6"/>`;
        for (let i = 0; i < 4; i++) hi += `<path d="M${-30 - i * 20},${-82 + i * 4}l${-6},${16}M${30 + i * 20},${-82 + i * 4}l6,16" stroke="${P.rim}" stroke-width=".5" opacity=".4"/>`;
        break;
      }
      case 'treant': {
        sil = `<path d="M-22,0Q-30,-6 -40,-2Q-26,-14 -18,-30Q-24,-70 -16,-110L16,-110Q24,-70 18,-30Q26,-14 40,-2Q30,-6 22,0Q10,-10 0,-4Q-10,-10 -22,0Z"/>`;
        sil += `<path d="M-14,-92Q-40,-96 -56,-120L-62,-136L-54,-126L-50,-140L-46,-122Q-36,-108 -14,-104Z"/><path d="M14,-92Q42,-90 58,-70L70,-64L58,-62L64,-52L52,-60Q38,-78 14,-82Z"/>`;
        for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI, cx = Math.cos(a) * 42, cy = -128 - Math.sin(a) * 30; sil += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${18 + (i % 3) * 5}"/>`; }
        hi = eyeGlow(-6, -96, ec, 2) + eyeGlow(8, -96, ec, 2) + `<path d="M-8,-82Q0,-76 8,-82" stroke="${ec}" stroke-width="1.2" fill="none" opacity=".8"/>`;
        for (let i = 0; i < 5; i++) hi += `<path d="M${-12 + i * 6},-20Q${-10 + i * 6},-60 ${-12 + i * 6},-104" stroke="${P.rim}" stroke-width=".5" fill="none" opacity=".35"/>`;
        break;
      }
      case 'golem': {
        const kind = o.kind || 'rune';
        sil = `<path d="M-30,-118L30,-120L40,-80L28,-50L-28,-50L-40,-82Z"/><path d="M-14,-140L14,-140L16,-120L-16,-118Z"/>`;
        sil += `<path d="M-36,-116L-62,-100L-66,-50L-48,-40L-42,-60L-44,-92Z"/><path d="M36,-118L64,-104L70,-54L52,-44L46,-62L46,-94Z"/>`;
        sil += `<path d="M-26,-52L-30,0L-8,0L-6,-50ZM26,-52L30,0L8,0L6,-50Z"/><ellipse cx="-57" cy="-40" rx="13" ry="10"/><ellipse cx="61" cy="-44" rx="13" ry="10"/>`;
        const gc = kind === 'magma' ? '#ffb040' : kind === 'bone' ? '#9affc0' : P.glow;
        hi = eyeGlow(-5, -130, gc, 1.8) + eyeGlow(6, -130, gc, 1.8);
        if (kind === 'magma') hi += `<path d="M-20,-110L-6,-90L-14,-70L4,-60M18,-112L8,-92L22,-74M-56,-96L-50,-70M58,-98L54,-72M-18,-44L-20,-10M18,-44L20,-10" stroke="#ff8a20" stroke-width="2.2" fill="none" filter="url(#b1)"/><path d="M-20,-110L-6,-90L-14,-70L4,-60M18,-112L8,-92L22,-74" stroke="#ffe08a" stroke-width=".8" fill="none"/>`;
        else if (kind === 'bone') { for (let i = 0; i < 4; i++) hi += `<path d="M-22,${-108 + i * 12}Q0,${-102 + i * 12} 22,${-108 + i * 12}" stroke="url(#bone)" stroke-width="2.4" fill="none"/>`; hi += `<circle cx="-56" cy="-40" r="5" fill="url(#bone)"/><circle cx="60" cy="-44" r="5" fill="url(#bone)"/>`; }
        else hi += `<path d="M-10,-104L0,-92L10,-104M0,-92L0,-70M-8,-80L8,-80" stroke="${gc}" stroke-width="1.6" fill="none"/><path d="M-10,-104L0,-92L10,-104M0,-92L0,-70" stroke="${gc}" stroke-width="5" fill="none" opacity=".4" filter="url(#b2)"/><path d="M-56,-90l4,10M58,-92l-4,10" stroke="${gc}" stroke-width="1.4"/>`;
        break;
      }
      case 'tentacle': {
        const c = o.curl || 1;
        const tb = tube([0, 6], [10 * c, -50], [-50 * c, -90], [-20 * c, -150], 30, 3, 26);
        sil = `<path d="${tb.d}"/><path d="M${-20 * c},-150q${-14 * c},-6 ${-10 * c},-20q${6 * c},10 ${14 * c},12z"/>`;
        hi = '';
        tb.pts.forEach((q, i) => { if (i % 2 === 0 && i > 1 && i < 24) hi += `<circle cx="${n1(q.x - q.nx * q.w * 0.55)}" cy="${n1(q.y - q.ny * q.w * 0.55)}" r="${n1(Math.max(1, q.w * 0.22))}" fill="${o.sucker || '#e8a0c0'}" opacity=".7"/>`; });
        hi += `<path d="${tb.d}" fill="none" stroke="${P.rim}" stroke-width=".6" opacity=".4"/>`;
        break;
      }
      case 'maw':
        sil = `<path d="M-110,0Q-100,-90 -10,-118Q60,-130 110,-84L60,-70Q20,-80 -20,-62Q-60,-44 -70,0Z"/><path d="M-60,0Q-40,-30 0,-38Q40,-40 90,-24L100,0Z"/>`;
        for (let i = 0; i < 9; i++) { const x = -40 + i * 15; hi += `<path d="M${x},${-66 + i * 0.5 - (i < 4 ? (4 - i) * 4 : 0)}l6,16l6,-15z" fill="url(#bone)"/>`; hi += `<path d="M${x - 6},${-34 - i * 0.6}l6,-14l6,13z" fill="url(#bone)"/>`; }
        hi += eyeGlow(30, -100, ec, 3) + `<ellipse cx="10" cy="-50" rx="60" ry="10" fill="${P.glow}" opacity=".35" filter="url(#b4)"/>`;
        for (let i = 0; i < 3; i++) hi += `<path d="M${-70 + i * 10},${-70 + i * 6}q8,10 0,24" stroke="${P.rim}" stroke-width="1" fill="none" opacity=".6"/>`;
        break;
      case 'sheep': {
        let wool = '';
        for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; wool += `<circle cx="${n1(Math.cos(a) * 26)}" cy="${n1(-38 + Math.sin(a) * 15)}" r="11" fill="#f4f0e6"/>`; }
        return `<g transform="translate(${o.x || 150},${o.y || 196}) scale(${o.s || 1})"><ellipse cx="0" cy="-2" rx="40" ry="5" fill="#000" opacity=".35"/><path d="M-18,-20L-20,0M-6,-18L-6,0M8,-18L8,0M20,-20L22,0" stroke="#2a2420" stroke-width="4" stroke-linecap="round"/>${wool}<ellipse cx="0" cy="-38" rx="26" ry="16" fill="#fffaf0"/><ellipse cx="34" cy="-46" rx="11" ry="9" fill="#2e2622"/><ellipse cx="26" cy="-52" rx="6" ry="3" fill="#2e2622" transform="rotate(-30 26 -52)"/><circle cx="37" cy="-48" r="1.6" fill="#fff"/><circle cx="37" cy="-48" r=".8" fill="#000"/><path d="M38,-40q3,2 6,0" stroke="#f0a0a0" stroke-width="1" fill="none"/></g>`;
      }
    }
    const BOX = { wolf: [-86, -102, 92, 0], lynx: [-66, -104, 86, 0], bear: [-76, -90, 86, 0], bird: [-126, -124, 126, -8], gryphon: [-126, -124, 126, 0], treant: [-66, -170, 72, 0], golem: [-70, -142, 74, 0], tentacle: [-70, -176, 46, 8], maw: [-112, -132, 112, 0] };
    const M = {
      wolf: ['fur', '#8c909a', `<ellipse cx="76" cy="-68" rx="12" ry="5.4" fill="#e8e2d6" opacity=".7"/><path d="M-44,-34Q0,-28 42,-36" stroke="#e8e2d6" stroke-width="7" opacity=".45" fill="none"/><path d="M40,-62Q46,-44 44,-32" stroke="#e8e2d6" stroke-width="6" opacity=".5" fill="none"/><path d="M-50,-58Q-10,-66 26,-62" stroke="#3a3c44" stroke-width="7" opacity=".45" fill="none"/><path d="M84,-68l4,2" stroke="#1a1010" stroke-width="2.4"/><path d="M76,-63l2,4l2,-3.6l2,3.4l1.6,-3" stroke="#f4eed8" stroke-width=".8" fill="none"/>`],
      lynx: ['fur', '#c0945a', `<ellipse cx="72" cy="-70" rx="10" ry="5" fill="#f4ecd8" opacity=".7"/><path d="M-40,-36Q0,-30 40,-38" stroke="#f4ecd8" stroke-width="6" opacity=".45" fill="none"/>`],
      bear: ['fur', '#7c5236', `<ellipse cx="78" cy="-52" rx="10" ry="6.4" fill="#d0a674" opacity=".7"/><path d="M86,-50l3,1" stroke="#1a1010" stroke-width="2.6"/><path d="M-60,-70Q-20,-86 24,-80" stroke="#3a2416" stroke-width="10" opacity=".4" fill="none"/>` + [[-60, 0], [-40, 0], [16, 0], [36, 0]].map(([x]) => `<path d="M${x},-1l2,3M${x + 4},-1l2,3M${x + 8},-1l2,3" stroke="#f0e6d0" stroke-width="1.1"/>`).join('')],
      bird: ['feather', '#7a5a3e', `<path d="M-30,-96L-60,-92M30,-96L60,-92M-50,-84L-90,-82M50,-84L90,-82" stroke="#f0e0c0" stroke-width="2" opacity=".2"/><ellipse cx="0" cy="-52" rx="8" ry="14" fill="#e8dcc0" opacity=".25"/>`],
      gryphon: ['feather', '#c09848', `<ellipse cx="3" cy="-88" rx="11" ry="11" fill="#fbf2dc" opacity=".85"/><path d="M11,-94L27,-89L11,-84Z" fill="#e8b830" opacity=".9"/><path d="M-30,-96L-60,-92M30,-96L60,-92" stroke="#fff0c0" stroke-width="2" opacity=".25"/>`],
      treant: ['bark', '#6e5a34', `<path d="M-70,-112Q-60,-170 0,-168Q60,-170 72,-112Q40,-100 0,-108Q-40,-100 -70,-112Z" fill="#4a7a2e"/>` + [[-44, -140, 14], [-20, -156, 16], [12, -158, 15], [40, -142, 14], [-56, -122, 11], [56, -124, 11], [0, -136, 13]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#6aa040" opacity=".75"/><circle cx="${x + r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.45}" fill="#a8d468" opacity=".7"/>`).join('') + `<path d="M-8,-86Q0,-82 8,-86" stroke="#2a1a0a" stroke-width="2" fill="none"/>`],
      golem: ['rock', o.kind === 'magma' ? '#6a2a18' : o.kind === 'bone' ? '#d8ccaa' : '#7c808a', o.kind === 'magma' ? `<path d="M-30,-118L30,-120L40,-80L28,-50L-28,-50L-40,-82Z" fill="#ff6a1a" opacity=".18"/>` : ''],
      tentacle: ['scale', '#8e4672', `<path d="M-30,10Q0,-60 -40,-150" stroke="#f0a8c8" stroke-width="7" opacity=".3" fill="none"/>`],
      maw: ['scale', '#6a3248', `<ellipse cx="10" cy="-50" rx="50" ry="8" fill="#3a0a10" opacity=".6"/>`],
    }[o.t];
    if (M) o = Object.assign({ tex: M[0], tone: M[1], paintExtra: M[2], box: BOX[o.t], _r: r }, o);
    return silhouette(sil, hi, o, P);
  };

  /* ---------- dragon (boss & whelp) ---------- */
  L.dragon = function (o, P, r) {
    const ec = o.eye || '#ffe27a', fire = o.fire || '#ff7a1a';
    const wing = (k) => {
      const sh = [-18 * k, -34], el = [-70 * k, -96], wr = [-112 * k, -128];
      const t1 = [-160 * k, -112], t2 = [-150 * k, -60], t3 = [-128 * k, -16], t4 = [-82 * k, 10];
      const mem = `M${pt(sh)}L${pt(el)}L${pt(wr)}L${pt(t1)}Q${n1(-128 * k)},-92 ${pt(t2)}Q${n1(-116 * k)},-50 ${pt(t3)}Q${n1(-92 * k)},-16 ${pt(t4)}Q${n1(-46 * k)},-10 ${n1(-14 * k)},6Z`;
      const bones = `<path d="M${pt(sh)}L${pt(el)}L${pt(wr)}" stroke-width="6" fill="none" stroke-linejoin="round"/>` + [t1, t2, t3, t4].map(t => `<path d="M${pt(wr)}L${pt(t)}" stroke-width="2.2" fill="none"/>`).join('') + `<path d="M${pt(wr)}l${n1(-4 * k)},-12l${n1(6 * k)},8z"/>`;
      return { mem, bones, veins: [t1, t2, t3, t4].map(t => `<path d="M${pt(wr)}L${pt(t)}" stroke="${P.rim}" stroke-width=".9" opacity=".7"/>`).join('') };
    };
    const wl = wing(1), wr = wing(-1);
    const neck = tube([4, -36], [10, -70], [44, -84], [34, -112], 22, 12, 16);
    const tail = tube([-10, 26], [-60, 60], [-120, 30], [-150, 66], 18, 2, 22);
    let sil = `<path d="${wl.mem}" opacity=".9"/><path d="${wr.mem}" opacity=".9"/>${wl.bones}${wr.bones}`;
    sil += `<path d="${tail.d}"/><path d="M-150,66l-12,-4l6,10l-8,6l16,0z"/>`;
    sil += `<path d="M-26,-38Q0,-54 28,-36Q38,0 20,32Q0,42 -20,32Q-34,0 -26,-38Z"/><path d="${neck.d}"/>`;
    // head
    sil += `<path d="M22,-106L42,-128L66,-118L74,-110L58,-104L62,-98L40,-96L26,-92Z"/>`;
    const h1 = tube([32, -124], [20, -136], [8, -140], [-6, -152], 6, 1), h2 = tube([40, -126], [34, -142], [24, -150], [18, -166], 5, 1);
    sil += `<path d="${h1.d}"/><path d="${h2.d}"/>`;
    // spines
    for (let i = 2; i < 15; i += 2) { const q = neck.pts[i]; sil += `<path d="M${n1(q.x + q.nx * q.w)},${n1(q.y + q.ny * q.w)}l${n1(-6)},${n1(-6)}l${n1(8)},${n1(1)}z"/>`; }
    // legs
    sil += `<path d="M-14,20Q-40,38 -30,64L-46,72L-16,72L-10,60Q-4,40 -2,30Z"/><path d="M14,22Q36,40 30,64L20,72L48,72L38,62Q30,40 22,26Z"/>`;
    sil += `<path d="M18,-18Q40,-10 50,10L62,8L54,16L58,22L46,18Q32,8 16,0Z"/>`;
    let hi = `<path d="${wl.mem}" fill="${o.membrane || fire}" opacity=".18"/><path d="${wr.mem}" fill="${o.membrane || fire}" opacity=".14"/>` + wl.veins + wr.veins;
    hi += `<path d="M-12,-30L-4,-10L-14,6L-2,22M10,-32L4,-12L14,4" stroke="${fire}" stroke-width="3" fill="none" opacity=".75" filter="url(#b1)"/><path d="M-12,-30L-4,-10L-14,6L-2,22M10,-32L4,-12L14,4" stroke="#ffe08a" stroke-width=".9" fill="none"/>`;
    hi += eyeGlow(52, -116, ec, 2.2);
    if (o.breath) {
      hi += `<path d="M66,-104Q110,-80 140,-30L170,-60Q120,-96 70,-110Z" fill="${fire}" opacity=".55" filter="url(#b4)"/><path d="M68,-106Q104,-86 132,-48L150,-66Q112,-96 70,-110Z" fill="#ffd27a" opacity=".85" filter="url(#b1)"/><path d="M70,-107Q96,-92 118,-66" stroke="#fff6d0" stroke-width="3" fill="none" filter="url(#b1)"/>`;
    } else hi += `<ellipse cx="62" cy="-101" rx="9" ry="3" fill="${fire}" opacity=".8" filter="url(#b1)"/>`;
    let belly = '';
    for (let i = 0; i < 7; i++) { const y = -30 + i * 8.5, hw = 15 - Math.abs(i - 2.5) * 1.8; belly += `<path d="M${n1(-hw)},${n1(y)}Q0,${n1(y + 4)} ${n1(hw)},${n1(y)}" stroke="#f0c070" stroke-width="1.6" fill="none" opacity=".35"/><path d="M${n1(-hw)},${n1(y + 1.6)}Q0,${n1(y + 5.6)} ${n1(hw)},${n1(y + 1.6)}" stroke="#000" stroke-width="1" fill="none" opacity=".4"/>`; }
    neck.pts.forEach((q, i) => { if (i % 2 === 1 && i < 16) belly += `<path d="M${n1(q.x - q.nx * q.w * 0.9)},${n1(q.y - q.ny * q.w * 0.9)}L${n1(q.x - q.nx * q.w * 0.1)},${n1(q.y - q.ny * q.w * 0.1)}" stroke="#f0c070" stroke-width="1.3" opacity=".35"/>`; });
    const memC = A.mix ? A.mix(o.tone || '#8a2a18', o.membrane || fire, 0.45) : fire, g1 = nid(), g2 = nid();
    const mg = (id, k) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${-90 * k}" y1="-120" x2="${-110 * k}" y2="0"><stop offset="0" stop-color="#1a0606" stop-opacity=".75"/><stop offset=".45" stop-color="${memC}" stop-opacity=".55"/><stop offset="1" stop-color="${A.mix ? A.mix(memC, '#ffd080', 0.35) : memC}" stop-opacity=".7"/></linearGradient>`;
    belly += `<defs>${mg(g1, 1)}${mg(g2, -1)}</defs><path d="${wl.mem}" fill="url(#${g1})"/><path d="${wr.mem}" fill="url(#${g2})"/>`;
    belly += `<path d="${h1.d}" fill="url(#bone)"/><path d="${h2.d}" fill="url(#bone)"/>` + [[44, -100], [49, -99], [54, -98.4], [59, -97.6]].map(([x, y]) => `<path d="M${x},${y}l1.6,3.4l1.6,-3.2z" fill="#f4eed8"/>`).join('');
    neck.pts.forEach((q, i) => { if (i % 3 === 0 && i > 0 && i < 15) belly += `<circle cx="${n1(q.x + q.nx * q.w * 0.3)}" cy="${n1(q.y + q.ny * q.w * 0.3)}" r="1.4" fill="#ffd080" opacity=".35"/>`; });
    for (const t of [[-160, -112], [-150, -60], [-128, -16], [160, -112], [150, -60], [128, -16]]) belly += `<path d="M${t[0] * 0.7},${t[1] * 0.9 - 30}q${t[0] * 0.1},10 ${t[0] * 0.25},${-4}" stroke="#2a0a06" stroke-width="1" fill="none" opacity=".5"/>`;
    return silhouette(sil, hi, Object.assign({ auraCol: fire, auraOp: 0.4, tex: 'scale', box: [-60, -170, 80, 76], dens: 45, _r: r, tone: o.tone || '#8a2a18', paintExtra: belly }, o), P);
  };

  /* ---------- wisps / spectral swirl ---------- */
  L.wisps = function (o, P, r) {
    let s = '';
    const c = o.c || P.glow;
    for (let i = 0; i < (o.n || 6); i++) {
      const x = (o.x || 150) + (r() - 0.5) * (o.w || 120), y = (o.y || 120) + (r() - 0.5) * (o.h || 60);
      s += `<path d="M${n1(x)},${n1(y)}c${n1((r() - 0.5) * 30)},-20 ${n1((r() - 0.5) * 30)},-30 ${n1((r() - 0.5) * 20)},-50" stroke="${c}" stroke-width="${n1(2 + r() * 3)}" fill="none" opacity=".45" filter="url(#b2)" stroke-linecap="round"/>`;
    }
    return s;
  };
})(globalThis.RB);
