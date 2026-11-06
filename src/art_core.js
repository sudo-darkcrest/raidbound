/* RAIDBOUND — art engine core: palettes, scenery, particles, compositing.
   Every illustration is a self-contained SVG (300x220) rendered into an <img> data URI. */
(function (RB) {
  const W = 300, H = 220;
  const A = RB.ART = RB.ART || {};
  A.W = W; A.H = H;

  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const n1 = v => Math.round(v * 10) / 10;
  A.rng = mulberry; A.hash = hash; A.n1 = n1;

  /* ---------- palettes ---------- */
  const PAL = {
    volcano: { sky: ['#14040a', '#5c1410', '#ef7a32'], far: '#4a1714', mid: '#2a0b0c', ground: '#120506', light: '#ffa04a', rim: '#ffb46a', glow: '#ff5a1f', fog: '#ff7a3a', body: '#0d0507', bodyTop: '#2c1012', part: 'embers' },
    crypt: { sky: ['#030a0b', '#0d2624', '#2e5c50'], far: '#11302b', mid: '#0a1c19', ground: '#040b0a', light: '#8affc8', rim: '#a6ffd9', glow: '#2ee89c', fog: '#5cd8a8', body: '#030807', bodyTop: '#15302a', part: 'motes' },
    sunken: { sky: ['#01060f', '#062444', '#1b7092'], far: '#082b48', mid: '#051b30', ground: '#020a16', light: '#86ecff', rim: '#b4f4ff', glow: '#3cc6ff', fog: '#4ab8e0', body: '#020812', bodyTop: '#0e2a44', part: 'bubbles' },
    forest: { sky: ['#080a1c', '#24264e', '#c08a6a'], far: '#252a4a', mid: '#12162a', ground: '#06080f', light: '#ffd898', rim: '#ffe6b4', glow: '#ffc060', fog: '#a0a4d0', body: '#05060c', bodyTop: '#1c1e34', part: 'fireflies' },
    peaks: { sky: ['#16264a', '#6878aa', '#f4bc92'], far: '#6a78a2', mid: '#323e66', ground: '#151b2e', light: '#ffdcae', rim: '#fff2d6', glow: '#ffd090', fog: '#dfe6ff', body: '#0b0f1c', bodyTop: '#2a3456', part: 'snow' },
    castle: { sky: ['#21102c', '#8e3a42', '#f6aa54'], far: '#5a2a40', mid: '#2e1426', ground: '#140912', light: '#ffc674', rim: '#ffdcaa', glow: '#ffa040', fog: '#ffb080', body: '#0c060b', bodyTop: '#301626', part: 'dust' },
    arcane: { sky: ['#05031a', '#1c1254', '#5a32a4'], far: '#21184c', mid: '#120c32', ground: '#08061a', light: '#c4a0ff', rim: '#dccaff', glow: '#9c6aff', fog: '#8a70e0', body: '#06041a', bodyTop: '#221a4c', part: 'motes' },
    temple: { sky: ['#241806', '#80601e', '#fbe29a'], far: '#6e5428', mid: '#3e2c12', ground: '#1c1408', light: '#fff2b4', rim: '#fff8dc', glow: '#ffe07a', fog: '#fff0c0', body: '#140e05', bodyTop: '#3e2e14', part: 'motesGold' },
    tavern: { sky: ['#140a04', '#3c2210', '#7a4a22'], far: '#4a2c14', mid: '#2a180a', ground: '#140a04', light: '#ffb44e', rim: '#ffcc8a', glow: '#ff9a3a', fog: '#c08050', body: '#0c0603', bodyTop: '#2e1a0c', part: 'dust' },
    storm: { sky: ['#070a12', '#232c3c', '#5f7084'], far: '#222a36', mid: '#151b24', ground: '#090c12', light: '#cfe4ff', rim: '#e6f2ff', glow: '#8ab8ff', fog: '#9aaac0', body: '#05070b', bodyTop: '#1e2836', part: 'rain' },
    steppe: { sky: ['#1a0708', '#6e1d14', '#e2783c'], far: '#46160f', mid: '#28100b', ground: '#140806', light: '#ffa060', rim: '#ffc494', glow: '#ff6a3a', fog: '#ff9a6a', body: '#0c0504', bodyTop: '#2e120c', part: 'ash' },
    forge: { sky: ['#0e0504', '#2a0e06', '#62220a'], far: '#3a1608', mid: '#220c05', ground: '#0e0503', light: '#ff9a36', rim: '#ffc078', glow: '#ff7a1a', fog: '#ff8a40', body: '#090302', bodyTop: '#2c0e06', part: 'sparks' },
    rooftops: { sky: ['#04050e', '#141b36', '#2e3c6c'], far: '#1a2244', mid: '#0e1328', ground: '#060812', light: '#b0c6ff', rim: '#d6e2ff', glow: '#7a9cff', fog: '#6a80c0', body: '#04050c', bodyTop: '#1a2040', part: 'none' },
    grove: { sky: ['#03100a', '#0e3a24', '#4a9a5c'], far: '#164a2c', mid: '#0b2a18', ground: '#04110a', light: '#d4ff9e', rim: '#e8ffc4', glow: '#9cff6a', fog: '#9ad8a0', body: '#030a05', bodyTop: '#163a22', part: 'fireflies' },
    void: { sky: ['#040208', '#140a28', '#3a1a5a'], far: '#1e1036', mid: '#120a22', ground: '#070410', light: '#e0b0ff', rim: '#f0d6ff', glow: '#b060ff', fog: '#7a4ab0', body: '#05030a', bodyTop: '#20123a', part: 'motes' },
    altar: { sky: ['#07060b', '#16121f', '#2a2032'], far: '#1c1626', mid: '#120e1a', ground: '#0a080e', light: '#ffe2a8', rim: '#fff0d0', glow: '#ffc870', fog: '#7a6a90', body: '#06050a', bodyTop: '#1e1a2a', part: 'motesGold' },
    holy: { sky: ['#1a1428', '#6a5a8a', '#ffe6b0'], far: '#5a4c74', mid: '#2e2644', ground: '#141020', light: '#fff6d2', rim: '#fffbe8', glow: '#ffe89a', fog: '#fff0d8', body: '#0c0a14', bodyTop: '#30284a', part: 'motesGold' },
    frost: { sky: ['#040c1a', '#14365a', '#6ab0d8'], far: '#2a5478', mid: '#163450', ground: '#081626', light: '#c8f0ff', rim: '#e6faff', glow: '#7ad8ff', fog: '#c0e8ff', body: '#040a14', bodyTop: '#1a3450', part: 'snow' },
  };
  A.PAL = PAL;
  A.pal = (name, over) => Object.assign({}, PAL[name] || PAL.void, over || {});

  /* ---------- defs ---------- */
  function defs(P) {
    return `<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset=".6" stop-color="${P.sky[1]}"/><stop offset="1" stop-color="${P.sky[2]}"/></linearGradient>
<radialGradient id="vig" cx=".5" cy=".48" r=".72"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".78"/></radialGradient>
<radialGradient id="gl"><stop offset="0" stop-color="${P.glow}" stop-opacity=".95"/><stop offset=".35" stop-color="${P.glow}" stop-opacity=".4"/><stop offset="1" stop-color="${P.glow}" stop-opacity="0"/></radialGradient>
<radialGradient id="lt"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".18" stop-color="${P.light}" stop-opacity=".8"/><stop offset=".5" stop-color="${P.light}" stop-opacity=".25"/><stop offset="1" stop-color="${P.light}" stop-opacity="0"/></radialGradient>
<linearGradient id="body" gradientUnits="userSpaceOnUse" x1="0" y1="-200" x2="0" y2="0"><stop offset="0" stop-color="${P.bodyTop}"/><stop offset="1" stop-color="${P.body}"/></linearGradient>
<linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.fog}" stop-opacity="0"/><stop offset=".5" stop-color="${P.fog}" stop-opacity=".32"/><stop offset="1" stop-color="${P.fog}" stop-opacity="0"/></linearGradient>
<linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.light}" stop-opacity=".5"/><stop offset="1" stop-color="${P.light}" stop-opacity="0"/></linearGradient>
<linearGradient id="phGnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.ground}" stop-opacity="0"/><stop offset=".55" stop-color="${P.ground}" stop-opacity=".45"/><stop offset="1" stop-color="${P.ground}" stop-opacity=".92"/></linearGradient>
<linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.mid}"/><stop offset="1" stop-color="${P.ground}"/></linearGradient>
<linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4c5462"/><stop offset=".42" stop-color="#eef3fa"/><stop offset=".56" stop-color="#9aa6b8"/><stop offset="1" stop-color="#2f3540"/></linearGradient>
<linearGradient id="steelV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f6fc"/><stop offset=".5" stop-color="#97a2b4"/><stop offset="1" stop-color="#3a414e"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".35" stop-color="#e2b04a"/><stop offset=".7" stop-color="#9a6a1c"/><stop offset="1" stop-color="#f2cc70"/></linearGradient>
<linearGradient id="bronze" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0c28a"/><stop offset=".4" stop-color="#a8642e"/><stop offset="1" stop-color="#4a240c"/></linearGradient>
<linearGradient id="wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2c160a"/><stop offset=".5" stop-color="#7a4a24"/><stop offset="1" stop-color="#3a1e0c"/></linearGradient>
<linearGradient id="leather" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a0683a"/><stop offset=".55" stop-color="#5e341a"/><stop offset="1" stop-color="#2e170a"/></linearGradient>
<linearGradient id="iron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a92a0"/><stop offset=".5" stop-color="#3e4450"/><stop offset="1" stop-color="#1a1d24"/></linearGradient>
<linearGradient id="bone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6eed6"/><stop offset=".6" stop-color="#bfb08a"/><stop offset="1" stop-color="#6e6248"/></linearGradient>
<radialGradient id="tLit" cx=".7" cy=".26" r=".78"><stop offset="0" stop-color="${P.light}" stop-opacity=".36"/><stop offset=".45" stop-color="${P.rim}" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient>
<linearGradient id="figSide" gradientUnits="userSpaceOnUse" x1="-46" y1="0" x2="46" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".42" stop-color="#000" stop-opacity="0"/><stop offset=".78" stop-color="${P.light}" stop-opacity="0"/><stop offset="1" stop-color="${P.light}" stop-opacity=".32"/></linearGradient>
<linearGradient id="figTop" gradientUnits="userSpaceOnUse" x1="0" y1="-190" x2="0" y2="0"><stop offset="0" stop-color="${P.sky[2]}" stop-opacity=".22"/><stop offset=".45" stop-color="${P.sky[2]}" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
<linearGradient id="crSide" gradientUnits="userSpaceOnUse" x1="-140" y1="0" x2="140" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="${P.light}" stop-opacity=".05"/><stop offset="1" stop-color="${P.light}" stop-opacity=".3"/></linearGradient>
<linearGradient id="crTop" gradientUnits="userSpaceOnUse" x1="0" y1="-170" x2="0" y2="70"><stop offset="0" stop-color="${P.sky[2]}" stop-opacity=".24"/><stop offset=".5" stop-color="${P.sky[2]}" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
<pattern id="pMail" width="3.6" height="3" patternUnits="userSpaceOnUse"><path d="M0,1.5a1.8,1.5 0 0 1 3.6,0M-1.8,3a1.8,1.5 0 0 1 3.6,0M1.8,3a1.8,1.5 0 0 1 3.6,0" stroke="${P.rim}" stroke-width=".45" fill="none" opacity=".5"/></pattern>
<pattern id="pWeave" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0,3L3,0" stroke="${P.rim}" stroke-width=".35" opacity=".35"/><path d="M0,0L3,3" stroke="#000" stroke-width=".35" opacity=".35"/></pattern>
<pattern id="pGrain" width="9" height="7" patternUnits="userSpaceOnUse"><path d="M0,2q3,-1 5,0t4,0M1,5.5q2,.8 4,0" stroke="#000" stroke-width=".5" fill="none" opacity=".4"/><circle cx="6.5" cy="4" r=".4" fill="${P.rim}" opacity=".4"/></pattern>
<pattern id="pScale" width="8" height="6" patternUnits="userSpaceOnUse"><path d="M0,6Q4,-.5 8,6M-4,3Q0,-3.5 4,3M4,3Q8,-3.5 12,3" stroke="${P.rim}" stroke-width=".6" fill="none" opacity=".42"/><path d="M0,6.6Q4,.2 8,6.6" stroke="#000" stroke-width=".8" fill="none" opacity=".35"/></pattern>
<pattern id="pFur" width="7" height="9" patternUnits="userSpaceOnUse"><path d="M1,0q1.2,4 0,8M4.5,1q-1.2,4 .2,8" stroke="${P.rim}" stroke-width=".45" fill="none" opacity=".45"/><path d="M2.8,.5q1,4 -.2,8.5M6,0q-.6,4 .4,8" stroke="#000" stroke-width=".6" fill="none" opacity=".4"/></pattern>
<pattern id="pFeather" width="10" height="8" patternUnits="userSpaceOnUse"><path d="M0,8Q5,0 10,8M5,8L5,1.8" stroke="${P.rim}" stroke-width=".5" fill="none" opacity=".45"/><path d="M-5,4Q0,-4 5,4M5,4Q10,-4 15,4" stroke="#000" stroke-width=".6" fill="none" opacity=".3"/></pattern>
<pattern id="pBark" width="10" height="24" patternUnits="userSpaceOnUse"><path d="M2,0q2,6 0,12t0,12M7,0q-2,7 .5,13t-.5,11" stroke="#000" stroke-width="1.1" fill="none" opacity=".45"/><path d="M4.4,0q1.5,6 0,12t0,12" stroke="${P.rim}" stroke-width=".5" fill="none" opacity=".35"/></pattern>
<pattern id="pRock" width="22" height="18" patternUnits="userSpaceOnUse"><path d="M0,7L6,9L11,5L17,8L22,6M8,9L9,18M16,8L14,0M3,14L9,13" stroke="#000" stroke-width=".9" fill="none" opacity=".45"/><path d="M0,6.2L6,8.2L11,4.2L17,7.2L22,5.2" stroke="${P.rim}" stroke-width=".5" fill="none" opacity=".35"/></pattern>
<radialGradient id="aoG"><stop offset="0" stop-color="#0a0410" stop-opacity=".5"/><stop offset=".55" stop-color="#0a0410" stop-opacity=".2"/><stop offset="1" stop-color="#0a0410" stop-opacity="0"/></radialGradient>
<filter id="whiteF" x="-5%" y="-5%" width="110%" height="110%"><feFlood flood-color="#fff"/><feComposite in2="SourceAlpha" operator="in"/></filter>
<filter id="rimF" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.1" result="d"/><feGaussianBlur in="d" stdDeviation="1" result="b"/><feFlood flood-color="${P.rim}"/><feComposite in2="b" operator="in"/></filter>
<filter id="auraF" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="9"/><feComponentTransfer><feFuncA type="linear" slope="1.4"/></feComponentTransfer><feComposite in="SourceGraphic" operator="out" result="b"/><feFlood flood-color="${P.glow}"/><feComposite in2="b" operator="in"/></filter>
<pattern id="pMailC" width="3.4" height="2.8" patternUnits="userSpaceOnUse"><path d="M0,1.4a1.7,1.4 0 0 1 3.4,0" stroke="#eef2f8" stroke-width=".5" fill="none" opacity=".6"/><path d="M-1.7,2.8a1.7,1.4 0 0 1 3.4,0M1.7,2.8a1.7,1.4 0 0 1 3.4,0" stroke="#1a1e26" stroke-width=".55" fill="none" opacity=".65"/></pattern>
<pattern id="pGrainC" width="9" height="7" patternUnits="userSpaceOnUse"><path d="M0,2q3,-1 5,0t4,0M1,5.5q2,.8 4,0" stroke="#24140a" stroke-width=".5" fill="none" opacity=".45"/><circle cx="6.5" cy="4" r=".4" fill="#e8c890" opacity=".45"/></pattern>
<filter id="emb" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="bl"/><feSpecularLighting in="bl" surfaceScale="2.4" specularConstant=".85" specularExponent="14" lighting-color="${P.light}" result="sp"><feDistantLight azimuth="300" elevation="40"/></feSpecularLighting><feComposite in="sp" in2="SourceAlpha" operator="in" result="spc"/><feComposite in="SourceGraphic" in2="spc" operator="arithmetic" k2="1" k3=".5"/></filter>
<filter id="b1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
<filter id="b2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter>
<filter id="b4" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="b8" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="11"/></filter>
<filter id="rim" x="-25%" y="-25%" width="150%" height="150%"><feMorphology operator="dilate" radius="1.3"/><feGaussianBlur stdDeviation=".75"/></filter>
<filter id="paint" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035 .06" numOctaves="3" seed="7"/><feDisplacementMap in="SourceGraphic" scale="9"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .85  0 0 0 .55 -.18"/></filter>
<filter id="cloudf" x="-20%" y="-50%" width="140%" height="200%"><feTurbulence type="fractalNoise" baseFrequency=".012 .04" numOctaves="4" seed="3"/><feDisplacementMap in="SourceGraphic" scale="30"/><feGaussianBlur stdDeviation="3"/></filter>
</defs>`;
  }
  A.defs = defs;

  /* ---------- scenery primitives ---------- */
  function ridge(r, y0, amp, step, jag, col, op, snow) {
    let pts = [[-10, H + 10], [-10, y0]];
    let x = -10, y = y0;
    while (x < W + 10) {
      x += step * (0.6 + r() * 0.8);
      y = y0 - amp * (0.25 + r() * 0.75) * (r() < jag ? 1 : 0.55);
      pts.push([x, y]);
    }
    pts.push([W + 10, H + 10]);
    let d = 'M' + pts.map(p => n1(p[0]) + ',' + n1(p[1])).join('L') + 'Z';
    let s = `<path d="${d}" fill="${col}" ${op ? `opacity="${op}"` : ''}/>`;
    if (snow) {
      for (let i = 2; i < pts.length - 1; i++) {
        const [px, py] = pts[i];
        if (py < y0 - amp * 0.6) {
          const w = 6 + r() * 6;
          s += `<path d="M${n1(px)},${n1(py)}L${n1(px - w)},${n1(py + w * 0.9)}L${n1(px - w * 0.3)},${n1(py + w * 0.6)}L${n1(px + w * 0.2)},${n1(py + w)}L${n1(px + w * 0.9)},${n1(py + w * 0.8)}Z" fill="${snow}" opacity=".75"/>`;
        }
      }
    }
    return s;
  }
  function hills(r, y0, amp, col, op) {
    let d = `M-10,${H + 10}L-10,${y0}`;
    let x = -10;
    while (x < W + 10) {
      const nx = x + 40 + r() * 50;
      d += `Q${n1((x + nx) / 2)},${n1(y0 - amp * (0.3 + r()))} ${n1(nx)},${n1(y0 - r() * amp * 0.3)}`;
      x = nx;
    }
    d += `L${W + 10},${H + 10}Z`;
    return `<path d="${d}" fill="${col}" ${op ? `opacity="${op}"` : ''}/>`;
  }
  function pine(x, y, h, col) {
    const w = h * 0.36;
    let d = `M${n1(x)},${n1(y - h)}`;
    const tiers = 4;
    for (let i = 1; i <= tiers; i++) {
      const ty = y - h + (h * 0.9) * i / tiers, tw = w * (0.35 + 0.65 * i / tiers);
      d += `L${n1(x + tw)},${n1(ty)}L${n1(x + tw * 0.45)},${n1(ty - h * 0.06)}`;
    }
    d += `L${n1(x + 2)},${n1(y - h * 0.08)}L${n1(x + 2)},${n1(y)}L${n1(x - 2)},${n1(y)}L${n1(x - 2)},${n1(y - h * 0.08)}`;
    for (let i = tiers; i >= 1; i--) {
      const ty = y - h + (h * 0.9) * i / tiers, tw = w * (0.35 + 0.65 * i / tiers);
      d += `L${n1(x - tw * 0.45)},${n1(ty - h * 0.06)}L${n1(x - tw)},${n1(ty)}`;
    }
    return `<path d="${d}Z" fill="${col}"/>`;
  }
  function pines(r, y0, n, hmin, hmax, col) {
    let s = '';
    for (let i = 0; i < n; i++) { const x = r() * (W + 20) - 10; s += pine(x, y0 + r() * 8, hmin + r() * (hmax - hmin), col); }
    return s;
  }
  function deadTree(x, y, h, col, r) {
    let s = `<path d="M${x - 3},${y}L${x - 1.5},${y - h}L${x + 1.5},${y - h}L${x + 3},${y}Z" fill="${col}"/>`;
    for (let i = 0; i < 5; i++) {
      const by = y - h * (0.35 + r() * 0.6), dir = r() < 0.5 ? -1 : 1, len = h * (0.2 + r() * 0.3);
      s += `<path d="M${x},${n1(by)}Q${n1(x + dir * len * 0.5)},${n1(by - len * 0.2)} ${n1(x + dir * len)},${n1(by - len * 0.6)}" stroke="${col}" stroke-width="${n1(1 + r() * 1.5)}" fill="none" stroke-linecap="round"/>`;
    }
    return s;
  }
  function bigTree(x, y, h, col, r) {
    // broad oak-like tree for groves
    let s = `<path d="M${x - 8},${y}C${x - 6},${y - h * 0.4} ${x - 10},${y - h * 0.55} ${x - 4},${y - h * 0.7}L${x + 4},${y - h * 0.7}C${x + 10},${y - h * 0.55} ${x + 6},${y - h * 0.4} ${x + 9},${y}Z" fill="${col}"/>`;
    for (let i = 0; i < 9; i++) {
      const cx = x + (r() - 0.5) * h * 0.8, cy = y - h * 0.72 - r() * h * 0.35, rr = h * (0.14 + r() * 0.12);
      s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(rr)}" fill="${col}"/>`;
    }
    return s;
  }
  function castle(x, y, s, col, win) {
    let g = `<g transform="translate(${x},${y}) scale(${s})">`;
    const tower = (tx, tw, th, roof) => {
      let t = `<rect x="${tx - tw / 2}" y="${-th}" width="${tw}" height="${th}" fill="${col}"/>`;
      if (roof) t += `<path d="M${tx - tw / 2 - 3},${-th}L${tx},${-th - tw * 1.3}L${tx + tw / 2 + 3},${-th}Z" fill="${col}"/><path d="M${tx},${-th - tw * 1.3}L${tx},${-th - tw * 1.3 - 10}" stroke="${col}" stroke-width="1"/><path d="M${tx},${-th - tw * 1.3 - 10}L${tx + 8},${-th - tw * 1.3 - 7}L${tx},${-th - tw * 1.3 - 4}Z" fill="${col}"/>`;
      else for (let i = 0; i < tw; i += 5) t += `<rect x="${tx - tw / 2 + i}" y="${-th - 4}" width="3" height="4" fill="${col}"/>`;
      t += `<rect x="${tx - 1.2}" y="${-th * 0.7}" width="2.4" height="4" fill="${win}" opacity=".9"/>`;
      return t;
    };
    g += `<rect x="-40" y="-34" width="80" height="34" fill="${col}"/>`;
    for (let i = -40; i < 40; i += 6) g += `<rect x="${i}" y="-38" width="4" height="4" fill="${col}"/>`;
    g += tower(-42, 14, 58, true) + tower(42, 14, 52, true) + tower(-14, 12, 74, false) + tower(16, 16, 92, true);
    g += `<path d="M-6,0L-6,-14Q0,-20 6,-14L6,0Z" fill="${win}" opacity=".55"/>`;
    for (let i = 0; i < 6; i++) g += `<rect x="${-34 + i * 12}" y="-24" width="2.2" height="3.5" fill="${win}" opacity="${0.5 + (i % 2) * 0.4}"/>`;
    return g + '</g>';
  }
  function spires(r, y0, col, win) {
    let s = '';
    for (let i = 0; i < 6; i++) {
      const x = 20 + i * 52 + r() * 20, h = 60 + r() * 70, w = 10 + r() * 8;
      s += `<path d="M${n1(x - w / 2)},${y0}L${n1(x - w / 2)},${n1(y0 - h)}L${n1(x)},${n1(y0 - h - w * 2.4)}L${n1(x + w / 2)},${n1(y0 - h)}L${n1(x + w / 2)},${y0}Z" fill="${col}"/>`;
      s += `<path d="M${n1(x - 1.2)},${n1(y0 - h * 0.7)}l0,-6q1.2,-2 2.4,0l0,6z" fill="${win}" opacity=".8"/>`;
    }
    return s;
  }
  function arches(col, glow) {
    // gothic interior: two columns + pointed arch framing the view
    return `<path d="M0,0L0,${H}L34,${H}L34,96Q34,40 150,6Q266,40 266,96L266,${H}L${W},${H}L${W},0Z" fill="${col}"/>
<path d="M44,${H}L44,100Q46,52 150,18Q254,52 256,100L256,${H}" fill="none" stroke="${col}" stroke-width="5" opacity=".7"/>
<rect x="18" y="60" width="10" height="${H}" fill="${col}" opacity=".9"/><rect x="272" y="60" width="10" height="${H}" fill="${col}" opacity=".9"/>
<circle cx="150" cy="40" r="14" fill="none" stroke="${glow}" stroke-width="1.2" opacity=".35"/><path d="M150,26L150,54M136,40L164,40" stroke="${glow}" stroke-width="1" opacity=".3"/>`;
  }
  function columns(col, hi) {
    const colm = (x) => `<rect x="${x - 11}" y="20" width="22" height="${H}" fill="${col}"/><rect x="${x - 15}" y="14" width="30" height="8" fill="${col}"/><rect x="${x - 15}" y="${H - 22}" width="30" height="8" fill="${col}"/>` +
      [0, 1, 2].map(i => `<rect x="${x - 7 + i * 6}" y="24" width="1.2" height="${H - 46}" fill="${hi}" opacity=".18"/>`).join('');
    return `<rect x="0" y="0" width="${W}" height="14" fill="${col}"/>` + colm(24) + colm(276);
  }
  function tombs(r, y0, col) {
    let s = '';
    for (let i = 0; i < 9; i++) {
      const x = r() * W, h = 10 + r() * 16, w = 7 + r() * 6, tilt = (r() - 0.5) * 16;
      if (r() < 0.35) s += `<g transform="translate(${n1(x)},${y0 + 4}) rotate(${n1(tilt)})"><rect x="-1.6" y="${-h - 6}" width="3.2" height="${h + 6}" fill="${col}"/><rect x="${-w / 2}" y="${-h}" width="${w}" height="3" fill="${col}"/></g>`;
      else s += `<g transform="translate(${n1(x)},${y0 + 4}) rotate(${n1(tilt)})"><path d="M${-w / 2},0L${-w / 2},${-h}Q0,${-h - w * 0.7} ${w / 2},${-h}L${w / 2},0Z" fill="${col}"/></g>`;
    }
    return s;
  }
  function tents(r, y0, col, glow) {
    let s = '';
    for (let i = 0; i < 4; i++) {
      const x = 30 + i * 78 + r() * 20, h = 28 + r() * 18, w = h * 0.9;
      s += `<path d="M${n1(x - w)},${y0}L${n1(x)},${n1(y0 - h)}L${n1(x + w)},${y0}Z" fill="${col}"/><path d="M${n1(x)},${n1(y0 - h)}L${n1(x - 3)},${n1(y0 - h - 10)}M${n1(x)},${n1(y0 - h)}L${n1(x + 4)},${n1(y0 - h - 9)}" stroke="${col}" stroke-width="1.5"/>`;
      s += `<path d="M${n1(x - 4)},${y0}L${n1(x)},${n1(y0 - h * 0.45)}L${n1(x + 4)},${y0}Z" fill="${glow}" opacity=".55"/>`;
      // banner pole
      const bx = x + w + 6;
      s += `<path d="M${n1(bx)},${y0}L${n1(bx)},${n1(y0 - h - 22)}" stroke="${col}" stroke-width="1.6"/><path d="M${n1(bx)},${n1(y0 - h - 22)}L${n1(bx + 12)},${n1(y0 - h - 19)}L${n1(bx + 9)},${n1(y0 - h - 13)}L${n1(bx + 13)},${n1(y0 - h - 6)}L${n1(bx)},${n1(y0 - h - 8)}Z" fill="${col}"/>`;
    }
    return s;
  }
  function ruins(r, y0, col) {
    let s = '';
    for (let i = 0; i < 4; i++) {
      const x = 20 + i * 85 + r() * 20, h = 50 + r() * 60;
      s += `<rect x="${n1(x - 7)}" y="${n1(y0 - h)}" width="14" height="${n1(h)}" fill="${col}"/>`;
      s += `<path d="M${n1(x - 9)},${n1(y0 - h)}L${n1(x + 9)},${n1(y0 - h)}L${n1(x + 6)},${n1(y0 - h - 5 - r() * 8)}L${n1(x - 2)},${n1(y0 - h - 2)}Z" fill="${col}"/>`;
      if (i < 3 && r() < 0.7) s += `<path d="M${n1(x + 7)},${n1(y0 - h * 0.8)}Q${n1(x + 45)},${n1(y0 - h - 30)} ${n1(x + 72)},${n1(y0 - h * 0.6)}" stroke="${col}" stroke-width="7" fill="none" stroke-dasharray="${n1(40 + r() * 30)} 400"/>`;
    }
    return s;
  }
  function kelp(r, y0, n, col) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = r() * W, h = 30 + r() * 60, sw = (r() - 0.5) * 30;
      s += `<path d="M${n1(x)},${y0}C${n1(x + sw)},${n1(y0 - h * 0.4)} ${n1(x - sw)},${n1(y0 - h * 0.7)} ${n1(x + sw * 0.5)},${n1(y0 - h)}" stroke="${col}" stroke-width="${n1(2 + r() * 3)}" fill="none" stroke-linecap="round"/>`;
    }
    return s;
  }
  function moon(x, y, rad, col, glowCol) {
    return `<circle cx="${x}" cy="${y}" r="${rad * 3.2}" fill="${glowCol}" opacity=".12" filter="url(#b8)"/><circle cx="${x}" cy="${y}" r="${rad * 1.6}" fill="${glowCol}" opacity=".18" filter="url(#b4)"/>
<circle cx="${x}" cy="${y}" r="${rad}" fill="${col}"/><circle cx="${x - rad * 0.3}" cy="${y - rad * 0.2}" r="${rad * 0.22}" fill="#000" opacity=".08"/><circle cx="${x + rad * 0.35}" cy="${y + rad * 0.3}" r="${rad * 0.15}" fill="#000" opacity=".09"/><circle cx="${x + rad * 0.1}" cy="${y - rad * 0.5}" r="${rad * 0.1}" fill="#000" opacity=".07"/>`;
  }
  function sun(x, y, rad, col) {
    return `<circle cx="${x}" cy="${y}" r="${rad * 4}" fill="${col}" opacity=".18" filter="url(#b8)"/><circle cx="${x}" cy="${y}" r="${rad * 1.8}" fill="${col}" opacity=".35" filter="url(#b4)"/><circle cx="${x}" cy="${y}" r="${rad}" fill="#fff8e0"/>`;
  }
  function stars(r, n, col) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = r() * H * 0.55, rr = r() * 0.9 + 0.2;
      s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(rr)}" fill="${col}" opacity="${n1(0.4 + r() * 0.6)}"/>`;
      if (r() < 0.06) s += `<path d="M${n1(x - 4)},${n1(y)}L${n1(x + 4)},${n1(y)}M${n1(x)},${n1(y - 4)}L${n1(x)},${n1(y + 4)}" stroke="${col}" stroke-width=".5" opacity=".8"/>`;
    }
    return s;
  }
  function aurora(r, col, col2) {
    let s = '';
    for (let i = 0; i < 3; i++) {
      const y = 30 + i * 18 + r() * 10;
      s += `<path d="M-10,${n1(y)}C70,${n1(y - 30 - r() * 20)} 140,${n1(y + 30)} 200,${n1(y - 10)}S280,${n1(y - 30)} 310,${n1(y)}" stroke="${i % 2 ? col2 : col}" stroke-width="${n1(10 + r() * 10)}" fill="none" opacity=".22" filter="url(#b4)"/>`;
    }
    return s;
  }
  function clouds(r, y, n, col, op) {
    let s = `<g filter="url(#cloudf)" opacity="${op}">`;
    for (let i = 0; i < n; i++) s += `<ellipse cx="${n1(r() * W)}" cy="${n1(y + (r() - 0.5) * 30)}" rx="${n1(40 + r() * 60)}" ry="${n1(7 + r() * 9)}" fill="${col}"/>`;
    return s + '</g>';
  }
  function rays(x, y, col, n, spread, len, op) {
    let s = `<g opacity="${op || 0.6}" filter="url(#b2)">`;
    for (let i = 0; i < n; i++) {
      const a = (-spread / 2 + spread * (i + 0.5) / n) * Math.PI / 180 + Math.PI / 2;
      const w = 0.05 + (i % 3) * 0.02;
      const x1 = x + Math.cos(a - w) * len, y1 = y + Math.sin(a - w) * len, x2 = x + Math.cos(a + w) * len, y2 = y + Math.sin(a + w) * len;
      s += `<path d="M${x},${y}L${n1(x1)},${n1(y1)}L${n1(x2)},${n1(y2)}Z" fill="url(#ray)"/>`;
    }
    return s + '</g>';
  }
  function lava(r, y0, col) {
    let s = '';
    for (let i = 0; i < 3; i++) {
      let x = r() * W, y = y0 + i * 8;
      let d = `M${n1(x)},${n1(y)}`;
      for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 60; y += 4 + r() * 6; d += `L${n1(x)},${n1(y)}`; }
      s += `<path d="${d}" stroke="${col}" stroke-width="5" fill="none" opacity=".5" filter="url(#b2)"/><path d="${d}" stroke="#ffd27a" stroke-width="1.2" fill="none" opacity=".9"/>`;
    }
    return s;
  }
  function lightning(r, x1, y1, x2, y2, col) {
    let d = `M${x1},${y1}`; const n = 7;
    for (let i = 1; i <= n; i++) { const t = i / n; d += `L${n1(x1 + (x2 - x1) * t + (i < n ? (r() - 0.5) * 26 : 0))},${n1(y1 + (y2 - y1) * t)}`; }
    return `<path d="${d}" stroke="${col}" stroke-width="7" fill="none" opacity=".45" filter="url(#b4)"/><path d="${d}" stroke="${col}" stroke-width="2.4" fill="none"/><path d="${d}" stroke="#fff" stroke-width="1" fill="none"/>`;
  }
  function grass(r, y0, col, n) {
    let s = '';
    for (let i = 0; i < (n || 60); i++) {
      const x = r() * W, h = 5 + r() * 12, lean = (r() - 0.5) * 8;
      s += `<path d="M${n1(x - 1.2)},${y0 + 6}Q${n1(x + lean * 0.4)},${n1(y0 - h * 0.5)} ${n1(x + lean)},${n1(y0 - h)}Q${n1(x + lean * 0.3)},${n1(y0 - h * 0.4)} ${n1(x + 1.2)},${y0 + 6}Z" fill="${col}"/>`;
    }
    return s;
  }
  function rocks(r, y0, col, n) {
    let s = '';
    for (let i = 0; i < (n || 5); i++) {
      const x = r() * W, w = 10 + r() * 22, h = 6 + r() * 12;
      s += `<path d="M${n1(x - w)},${y0 + 8}L${n1(x - w * 0.7)},${n1(y0 - h * 0.6)}L${n1(x - w * 0.1)},${n1(y0 - h)}L${n1(x + w * 0.6)},${n1(y0 - h * 0.7)}L${n1(x + w)},${y0 + 8}Z" fill="${col}"/>`;
    }
    return s;
  }
  function tavernInterior(P) {
    let s = `<rect x="0" y="0" width="${W}" height="${H}" fill="${P.far}"/>`;
    for (let i = 0; i < 9; i++) s += `<rect x="${i * 36 - 4}" y="0" width="3" height="${H}" fill="#000" opacity=".18"/>`;
    s += `<rect x="0" y="0" width="${W}" height="18" fill="${P.mid}"/><rect x="0" y="16" width="${W}" height="4" fill="#000" opacity=".3"/>`;
    // hearth
    s += `<path d="M196,${H}L196,96Q236,70 276,96L276,${H}Z" fill="${P.mid}"/><path d="M206,${H}L206,112Q236,92 266,112L266,${H}Z" fill="#1a0a04"/>`;
    s += `<ellipse cx="236" cy="170" rx="34" ry="26" fill="${P.glow}" opacity=".55" filter="url(#b4)"/><path d="M216,176Q222,150 230,162Q234,140 242,160Q250,146 256,176Z" fill="#ffd27a" opacity=".9"/><path d="M224,176Q230,160 236,168Q242,156 248,176Z" fill="#fff4c0"/>`;
    // shelves with bottles
    s += `<rect x="20" y="62" width="120" height="4" fill="${P.mid}"/><rect x="20" y="104" width="120" height="4" fill="${P.mid}"/>`;
    const bottle = (x, y, h, c) => `<path d="M${x - 4},${y}L${x - 4},${y - h + 6}Q${x - 4},${y - h + 2} ${x - 1.5},${y - h + 1}L${x - 1.5},${y - h - 4}L${x + 1.5},${y - h - 4}L${x + 1.5},${y - h + 1}Q${x + 4},${y - h + 2} ${x + 4},${y - h + 6}L${x + 4},${y}Z" fill="${c}" opacity=".75"/><rect x="${x - 2.5}" y="${y - h + 7}" width="1.2" height="${h - 9}" fill="#fff" opacity=".25"/>`;
    [['#6a2a1a', 14], ['#2a5a3a', 18], ['#5a3a1a', 12], ['#3a2a5a', 16], ['#7a5a1a', 14], ['#2a4a6a', 18]].forEach((b, i) => { s += bottle(32 + i * 18, 62, b[1], b[0]); s += bottle(38 + i * 17, 104, b[1] - 3, b[0]); });
    // lanterns
    s += `<circle cx="160" cy="40" r="22" fill="${P.light}" opacity=".25" filter="url(#b4)"/><path d="M160,18L160,30" stroke="#000" stroke-width="1"/><rect x="155" y="30" width="10" height="14" rx="2" fill="#ffcf7a"/>`;
    return s;
  }
  function forgeInterior(P) {
    let s = `<rect x="0" y="0" width="${W}" height="${H}" fill="${P.far}"/>`;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 10; c++) s += `<rect x="${c * 32 + (r % 2) * 16 - 8}" y="${r * 18}" width="30" height="16" fill="#000" opacity="${0.12 + ((r * 7 + c * 3) % 5) * 0.03}"/>`;
    s += `<path d="M10,${H}L10,90Q60,60 110,90L110,${H}Z" fill="${P.mid}"/><path d="M22,${H}L22,104Q60,82 98,104L98,${H}Z" fill="#1a0602"/>`;
    s += `<ellipse cx="60" cy="160" rx="40" ry="34" fill="${P.glow}" opacity=".7" filter="url(#b4)"/><ellipse cx="60" cy="168" rx="26" ry="16" fill="#ffd060" opacity=".85" filter="url(#b1)"/>`;
    // hanging tools
    s += `<path d="M180,20L180,60M200,20L200,52M222,20L222,64" stroke="${P.mid}" stroke-width="2"/><rect x="174" y="58" width="12" height="8" fill="${P.mid}"/><path d="M196,52L204,52L206,60L194,60Z" fill="${P.mid}"/><path d="M218,64L226,64L222,74Z" fill="${P.mid}"/>`;
    return s;
  }

  /* ---------- particles ---------- */
  function particles(kind, r, P, n) {
    let s = '';
    n = n || 26;
    if (kind === 'embers' || kind === 'sparks') {
      s += `<g>`;
      for (let i = 0; i < n; i++) {
        const x = r() * W, y = r() * H, rr = 0.6 + r() * 1.6;
        s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(rr * 2.6)}" fill="${P.glow}" opacity=".35" filter="url(#b1)"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(rr)}" fill="#ffe0a0"/>`;
        if (kind === 'sparks' && r() < 0.5) s += `<path d="M${n1(x)},${n1(y)}l${n1((r() - 0.5) * 10)},${n1(-4 - r() * 8)}" stroke="#ffd080" stroke-width=".7"/>`;
      }
      s += '</g>';
    } else if (kind === 'snow') {
      for (let i = 0; i < n * 1.6; i++) s += `<circle cx="${n1(r() * W)}" cy="${n1(r() * H)}" r="${n1(0.5 + r() * 1.4)}" fill="#fff" opacity="${n1(0.4 + r() * 0.5)}"/>`;
    } else if (kind === 'motes' || kind === 'motesGold') {
      const c = kind === 'motesGold' ? '#ffe6a0' : P.rim;
      for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H; s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(2 + r() * 3)}" fill="${c}" opacity=".18" filter="url(#b1)"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(0.5 + r() * 0.8)}" fill="${c}" opacity=".85"/>`; }
    } else if (kind === 'fireflies') {
      for (let i = 0; i < n * 0.8; i++) { const x = r() * W, y = 60 + r() * (H - 60); s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="3.4" fill="#e6ff8a" opacity=".22" filter="url(#b1)"/><circle cx="${n1(x)}" cy="${n1(y)}" r=".9" fill="#f4ffc0"/>`; }
    } else if (kind === 'bubbles') {
      for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H, rr = 0.8 + r() * 2.6; s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(rr)}" fill="none" stroke="${P.rim}" stroke-width=".6" opacity=".6"/><circle cx="${n1(x - rr * 0.35)}" cy="${n1(y - rr * 0.35)}" r="${n1(rr * 0.25)}" fill="#fff" opacity=".7"/>`; }
    } else if (kind === 'rain') {
      for (let i = 0; i < n * 2; i++) { const x = r() * W, y = r() * H; s += `<path d="M${n1(x)},${n1(y)}l-4,12" stroke="${P.rim}" stroke-width=".6" opacity=".35"/>`; }
    } else if (kind === 'ash' || kind === 'dust') {
      const c = kind === 'ash' ? '#ffb090' : '#ffe0b0';
      for (let i = 0; i < n; i++) s += `<circle cx="${n1(r() * W)}" cy="${n1(r() * H)}" r="${n1(0.4 + r() * 1)}" fill="${c}" opacity="${n1(0.25 + r() * 0.45)}"/>`;
    }
    return s;
  }
  A.particles = particles;

  /* ---------- photographic backdrops ----------
     Each scene can use a painterly-processed Unsplash photo (A.PHOTOS, from art_photos.js) as its far
     background. Every card gets its own crop / zoom / mirror of the photo, then the photo is colour-graded
     toward the scene palette and the procedural near-ground is painted over it so figures stand on something. */
  const PHC = {
    volcano: { tint: .2, soft: .3, ry: .5 }, crypt: { tint: .5, soft: .45, ry: .55 }, crypthall: { tint: .45, soft: .4 },
    sunken: { tint: .35, soft: .5, ry: .7 }, sea: { tint: .4, soft: .45, ry: .2 }, forest: { tint: .55, soft: .55 },
    peaks: { tint: .25, soft: .35, ry: .35 }, castle: { tint: .2, soft: .3, ry: .25 }, arcane: { tint: .35, soft: .3, ry: .1 },
    temple: { tint: .62, soft: .5 }, holy: { tint: .35, soft: .35, ry: .2 }, tavern: { tint: .3, soft: .35 },
    forge: { tint: 0, soft: 0, blend: 'screen', op: .95, zr: .35 }, storm: { tint: .3, soft: .3 }, steppe: { tint: .15, soft: .3, ry: .15 },
    rooftops: { tint: .3, soft: .3, ry: .5, zr: .14 }, grove: { tint: .35, soft: .4, ry: .4 }, altar: { tint: .25, soft: .3 },
    frost: { tint: .2, soft: .3, ry: .35 }, void: { tint: .2, soft: .2 },
  };
  A.PHC = PHC;
  function photoLayer(name, r, P) {
    const src = A.PHOTOS[name], c = PHC[name] || {};
    const k = 1.02 + r() * (c.zr != null ? c.zr : 0.24), w = W * k, h = H * k;
    const x = -(w - W) * r(), y = -(h - H) * (c.ry != null ? c.ry : r());
    const flip = !c.noflip && r() < 0.5;
    let s = `<g${flip ? ` transform="translate(${W} 0) scale(-1 1)"` : ''}><image href="${src}" x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" preserveAspectRatio="none"${c.blend ? ` style="mix-blend-mode:${c.blend}"` : ''}${c.op != null ? ` opacity="${c.op}"` : ''}/></g>`;
    if (c.tint) s += `<rect width="${W}" height="${H}" fill="url(#sky)" opacity="${c.tint}" style="mix-blend-mode:color"/>`;
    if (c.soft) s += `<rect width="${W}" height="${H}" fill="url(#sky)" opacity="${c.soft}" style="mix-blend-mode:soft-light"/>`;
    // painted atmosphere: a light bloom where the palette's light lives, plus a dark base for the figures
    s += `<ellipse cx="${n1(60 + r() * 180)}" cy="${n1(40 + r() * 50)}" rx="120" ry="70" fill="${P.light}" opacity=".12" filter="url(#b8)" style="mix-blend-mode:screen"/>`;
    s += `<rect y="${H * 0.42}" width="${W}" height="${H * 0.58}" fill="url(#phGnd)"/>`;
    return s;
  }
  function flagstones(r, gy, col, line) {
    let s = '';
    for (let row = 0; row < 3; row++) {
      const y = gy + row * 8 + row * row * 2, hgt = 7 + row * 3;
      let x = -r() * 30;
      while (x < W) { const w = 24 + r() * 26 + row * 8; s += `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w - 1.4)}" height="${n1(hgt)}" fill="${col}" opacity="${n1(0.55 + r() * 0.4)}"/><path d="M${n1(x)},${n1(y)}h${n1(w - 2)}" stroke="${line}" stroke-width=".5" opacity=".28"/>`; x += w; }
    }
    return s;
  }
  // the procedural near-ground painted over a photo backdrop
  function nearGround(name, r, P, gy) {
    const G = `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}"/>`;
    const fogB = (y, h, op) => `<rect x="0" y="${y}" width="${W}" height="${h}" fill="url(#fog)" opacity="${op}"/>`;
    let s = '';
    switch (name) {
      case 'volcano': s += fogB(118, 60, .55) + ridge(r, 188, 22, 30, 0.5, P.mid, 0.94) + lava(r, 192, P.glow) + G + rocks(r, gy, P.ground, 7) + `<rect x="0" y="${gy - 6}" width="${W}" height="14" fill="${P.glow}" opacity=".16" filter="url(#b4)"/>`; break;
      case 'crypt': s += fogB(136, 50, .8) + hills(r, 192, 10, P.mid, .92) + tombs(r, 193, P.mid) + deadTree(r() < 0.5 ? 16 + r() * 40 : 244 + r() * 40, 196, 58 + r() * 24, P.mid, r) + G + fogB(gy - 18, 26, .9); break;
      case 'crypthall': s += `<ellipse cx="150" cy="160" rx="100" ry="46" fill="${P.glow}" opacity=".16" filter="url(#b8)"/>` + G + flagstones(r, gy, P.mid, P.rim) + fogB(gy - 26, 32, 1); break;
      case 'sunken': s += kelp(r, 214, 7, P.mid) + hills(r, gy, 14, P.ground) + `<rect x="0" y="${gy - 30}" width="${W}" height="40" fill="url(#fog)" opacity=".6"/>`; break;
      case 'sea': for (let i = 0; i < 5; i++) { const y = 176 + i * 9; s += `<path d="M-10,${y}Q${20 + i * 9},${y - 6} 50,${y}T110,${y}T170,${y}T230,${y}T290,${y}T350,${y}" stroke="${P.rim}" stroke-width=".8" fill="none" opacity="${n1(0.12 + i * 0.05)}"/>`; } s += `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}" opacity=".85"/>`; break;
      case 'forest': s += fogB(150, 40, .6) + pines(r, 210, 3, 100, 140, P.ground) + G + grass(r, gy, P.ground, 55); break;
      case 'peaks': s += fogB(150, 40, .6) + ridge(r, 204, 18, 22, 0.4, P.ground, 1, '#c6d0f0'); break;
      case 'castle': s += hills(r, 192, 12, P.mid) + G + grass(r, gy, P.ground, 45); break;
      case 'arcane': s += ridge(r, 200, 16, 24, 0.4, P.mid) + `<rect x="0" y="${gy + 4}" width="${W}" height="${H - gy}" fill="${P.ground}"/>`; break;
      case 'temple': s += G + `<path d="M50,${gy}L250,${gy}L262,${gy + 8}L38,${gy + 8}Z" fill="${P.far}"/><path d="M50,${gy}L250,${gy}" stroke="${P.rim}" stroke-width=".7" opacity=".4"/>` + fogB(gy - 34, 44, .9); break;
      case 'holy': s += hills(r, gy, 10, P.mid) + `<rect x="0" y="${gy + 4}" width="${W}" height="${H}" fill="${P.ground}"/>` + fogB(gy - 26, 36, .7); break;
      case 'tavern': s += `<ellipse cx="${r() < 0.5 ? 40 : 260}" cy="170" rx="70" ry="44" fill="${P.glow}" opacity=".22" filter="url(#b8)"/>` + G; for (let i = 0; i < 8; i++) s += `<rect x="${i * 40 + 6}" y="${gy}" width="1" height="30" fill="#000" opacity=".45"/>`; s += `<rect x="0" y="${gy}" width="${W}" height="2" fill="${P.rim}" opacity=".12"/>`; break;
      case 'storm': s += ridge(r, 198, 22, 22, 0.4, P.mid) + G + grass(r, gy, P.ground, 30); break;
      case 'steppe': s += hills(r, 178, 14, P.far, .92) + tents(r, 182, P.far, P.glow) + fogB(168, 24, .6) + hills(r, gy, 8, P.mid) + `<rect x="0" y="${gy + 4}" width="${W}" height="${H}" fill="${P.ground}"/>` + grass(r, gy + 2, P.ground, 40); break;
      case 'rooftops': s += `<path d="M-10,${H}L-10,192L110,178L320,188L320,${H}Z" fill="${P.ground}"/>` + Array.from({ length: 6 }, (_, i) => `<path d="M${-10 + i * 22},${n1(192 - i * 2.3)}L${-10 + i * 22 + 4},${H}" stroke="#000" stroke-width=".8" opacity=".35"/>`).join(''); break;
      case 'grove': s += hills(r, gy, 12, P.mid) + `<rect x="0" y="${gy + 4}" width="${W}" height="${H}" fill="${P.ground}"/>` + grass(r, gy + 2, P.ground, 70); break;
      case 'altar':
        s += `<path d="M30,178L270,178L286,${H}L14,${H}Z" fill="${P.far}"/><path d="M30,178L270,178" stroke="${P.rim}" stroke-width=".8" opacity=".4"/>`;
        s += `<path d="M60,178Q150,170 240,178L248,198Q150,188 52,198Z" fill="#3a1424" opacity=".92"/><path d="M60,178Q150,170 240,178" stroke="#d8a84a" stroke-width="1" fill="none" opacity=".6"/>`;
        break;
      case 'frost': s += ridge(r, 198, 18, 22, 0.5, P.mid, 1, '#bfe8ff') + `<rect x="0" y="${gy + 4}" width="${W}" height="${H}" fill="${P.ground}"/>`; break;
      case 'void': for (let i = 0; i < 4; i++) s += `<ellipse cx="150" cy="110" rx="${50 + i * 32}" ry="${18 + i * 12}" fill="none" stroke="${P.glow}" stroke-width="${n1(2.4 - i * 0.4)}" opacity="${n1(0.2 - i * 0.03)}" transform="rotate(${-12 + i * 5} 150 110)" filter="url(#b1)"/>`; break;
    }
    return s;
  }

  /* ---------- scene backgrounds ---------- */
  function scene(name, r, P, o) {
    o = o || {};
    const gy = o.ground != null ? o.ground : 196;
    if (A.PHOTOS && A.PHOTOS[name] && !o.noPhoto && !A.noPhotos) {
      if (name === 'forge') return forgeInterior(P) + `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}"/>` + photoLayer(name, r, P);
      return photoLayer(name, r, P) + nearGround(name, r, P, gy);
    }
    let s = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
    switch (name) {
      case 'volcano':
        s += clouds(r, 40, 6, '#2a0806', 0.6) + `<ellipse cx="150" cy="170" rx="190" ry="60" fill="${P.glow}" opacity=".25" filter="url(#b8)"/>`;
        s += ridge(r, 150, 70, 26, 0.6, P.far, 0.95);
        s += `<path d="M118,150L138,84L146,90L156,82L176,150Z" fill="${P.far}"/><ellipse cx="148" cy="86" rx="16" ry="6" fill="${P.glow}" opacity=".8" filter="url(#b2)"/><path d="M146,88Q140,120 132,150" stroke="#ff9a3a" stroke-width="2.5" fill="none" opacity=".8"/><path d="M152,88Q160,118 168,150" stroke="#ff9a3a" stroke-width="1.6" fill="none" opacity=".7"/>`;
        s += `<g opacity=".55" filter="url(#b4)"><path d="M148,80Q120,40 150,10Q170,-10 140,-30" stroke="#3a1410" stroke-width="22" fill="none"/></g>`;
        s += ridge(r, 178, 40, 30, 0.5, P.mid) + lava(r, 182, P.glow);
        s += `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}"/>` + rocks(r, gy, P.ground, 6);
        break;
      case 'crypt':
        s += moon(220, 46, 16, '#d8ffe8', P.glow) + clouds(r, 60, 5, '#0a2420', 0.7);
        s += spires(r, 150, P.far, P.glow);
        s += `<rect x="0" y="150" width="${W}" height="70" fill="${P.far}"/>`;
        s += `<rect x="0" y="140" width="${W}" height="40" fill="url(#fog)"/>`;
        s += hills(r, 182, 20, P.mid) + tombs(r, 180, P.mid);
        for (let i = 0; i < 3; i++) s += deadTree(30 + r() * 240, 186, 50 + r() * 30, P.mid, r);
        s += `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}"/><rect x="0" y="${gy - 18}" width="${W}" height="26" fill="url(#fog)" opacity=".9"/>`;
        break;
      case 'crypthall':
        s += `<rect width="${W}" height="${H}" fill="${P.far}" opacity=".6"/>` + rays(150, -10, P.light, 5, 30, 240, 0.4);
        s += `<ellipse cx="150" cy="150" rx="90" ry="60" fill="${P.glow}" opacity=".2" filter="url(#b8)"/>`;
        s += arches(P.mid, P.glow) + `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}"/>` + `<rect x="0" y="${gy - 24}" width="${W}" height="30" fill="url(#fog)"/>`;
        break;
      case 'sunken':
        s += rays(120, -20, P.light, 7, 50, 260, 0.55) + rays(220, -20, P.light, 4, 26, 240, 0.4);
        s += ruins(r, 168, P.far) + `<rect x="0" y="160" width="${W}" height="60" fill="${P.far}" opacity=".8"/>`;
        s += `<rect x="0" y="120" width="${W}" height="60" fill="url(#fog)" opacity=".7"/>` + kelp(r, 200, 10, P.mid);
        s += hills(r, gy, 14, P.ground);
        break;
      case 'sea':
        s += clouds(r, 50, 7, '#1a2a3a', 0.8) + lightning(r, 230, 0, 214, 110, P.light);
        s += `<rect x="0" y="130" width="${W}" height="90" fill="${P.far}"/>`;
        for (let i = 0; i < 7; i++) { const y = 136 + i * 12; s += `<path d="M-10,${y}Q${20 + i * 7},${y - 8} 50,${y}T110,${y}T170,${y}T230,${y}T290,${y}T350,${y}" stroke="${P.rim}" stroke-width=".8" fill="none" opacity="${0.15 + i * 0.04}"/>`; }
        s += `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}" opacity=".8"/>`;
        break;
      case 'forest':
        s += stars(r, 40, '#fff') + moon(70, 50, 14, '#fff1d6', P.glow);
        s += ridge(r, 120, 40, 40, 0.4, P.far, 0.8) + `<rect x="0" y="110" width="${W}" height="40" fill="url(#fog)"/>`;
        s += pines(r, 160, 14, 40, 70, P.mid) + `<rect x="0" y="150" width="${W}" height="30" fill="url(#fog)" opacity=".7"/>`;
        s += pines(r, 200, 5, 80, 120, P.ground) + `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}"/>` + grass(r, gy, P.ground, 50);
        break;
      case 'peaks':
        s += sun(80, 150, 12, P.light) + clouds(r, 70, 6, '#fff', 0.25);
        s += ridge(r, 128, 80, 34, 0.7, P.far, 1, '#f4f6ff') + `<rect x="0" y="120" width="${W}" height="40" fill="url(#fog)"/>`;
        s += ridge(r, 170, 50, 28, 0.5, P.mid, 1, '#c6d0f0') + ridge(r, 200, 24, 22, 0.4, P.ground);
        break;
      case 'castle':
        s += sun(230, 120, 14, P.light) + clouds(r, 60, 6, '#ffb070', 0.35) + rays(230, 120, P.light, 9, 360, 200, 0.25);
        s += hills(r, 150, 30, P.far, 0.9) + castle(205, 140, 0.8, P.far, '#ffd27a');
        s += `<rect x="0" y="130" width="${W}" height="40" fill="url(#fog)"/>` + hills(r, 182, 20, P.mid) + `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}"/>` + grass(r, gy, P.ground, 40);
        break;
      case 'arcane':
        s += stars(r, 90, '#fff') + aurora(r, '#7ad8ff', '#c070ff');
        s += `<g opacity=".55">` + Array.from({ length: 4 }, (_, i) => { const x = 40 + i * 72 + r() * 10, y = 40 + r() * 50; return `<path d="M${n1(x)},${n1(y)}l8,-14l8,14l-8,14z" fill="${P.rim}" opacity=".18" filter="url(#b1)"/><path d="M${n1(x - 10)},${n1(y + 30)}l20,0l-6,10l-8,0z" fill="${P.far}"/>`; }).join('') + `</g>`;
        s += ridge(r, 160, 46, 30, 0.6, P.far) + `<rect x="0" y="150" width="${W}" height="30" fill="url(#fog)"/>` + ridge(r, 196, 26, 24, 0.4, P.mid);
        s += `<rect x="0" y="${gy + 6}" width="${W}" height="${H - gy}" fill="${P.ground}"/>`;
        break;
      case 'temple':
        s += rays(150, -30, P.light, 11, 70, 280, 0.7) + `<ellipse cx="150" cy="40" rx="100" ry="40" fill="${P.light}" opacity=".35" filter="url(#b8)"/>`;
        s += columns(P.mid, P.light) + `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}"/>`;
        s += `<path d="M60,${gy}L240,${gy}L250,${gy + 8}L50,${gy + 8}Z" fill="${P.far}"/><rect x="0" y="${gy - 30}" width="${W}" height="40" fill="url(#fog)"/>`;
        break;
      case 'holy':
        s += clouds(r, 70, 7, '#fff', 0.35) + rays(150, -40, P.light, 13, 80, 300, 0.75);
        s += hills(r, 172, 30, P.far) + `<rect x="0" y="160" width="${W}" height="30" fill="url(#fog)"/>` + hills(r, gy, 14, P.mid) + `<rect x="0" y="${gy + 4}" width="${W}" height="${H}" fill="${P.ground}"/>`;
        break;
      case 'tavern': s += tavernInterior(P) + `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}"/>`; for (let i = 0; i < 8; i++) s += `<rect x="${i * 40}" y="${gy}" width="1" height="30" fill="#000" opacity=".4"/>`; break;
      case 'forge': s += forgeInterior(P) + `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}"/>`; break;
      case 'storm':
        s += clouds(r, 30, 8, '#3a4656', 0.9) + clouds(r, 70, 6, '#1a2230', 0.8) + lightning(r, 60 + r() * 180, 0, 80 + r() * 140, 150, P.light);
        s += ridge(r, 160, 50, 30, 0.6, P.far) + ridge(r, 196, 26, 22, 0.4, P.mid) + `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${P.ground}"/>` + grass(r, gy, P.ground, 30);
        break;
      case 'steppe':
        s += moon(80, 70, 30, '#ffb48a', P.glow) + clouds(r, 90, 5, '#4a1410', 0.6);
        s += hills(r, 160, 22, P.far) + tents(r, 166, P.far, P.glow) + `<rect x="0" y="150" width="${W}" height="30" fill="url(#fog)"/>`;
        s += hills(r, gy, 10, P.mid) + `<rect x="0" y="${gy + 4}" width="${W}" height="${H}" fill="${P.ground}"/>` + grass(r, gy + 2, P.ground, 40);
        break;
      case 'rooftops':
        s += stars(r, 60, '#dfe6ff') + moon(205, 60, 34, '#eef2ff', P.glow) + clouds(r, 84, 4, '#2a3460', 0.6);
        for (let i = 0; i < 9; i++) { const x = i * 36 - 6 + r() * 10, h = 40 + r() * 50, w = 30 + r() * 12; s += `<path d="M${n1(x)},${H}L${n1(x)},${n1(196 - h)}L${n1(x + w / 2)},${n1(196 - h - 18)}L${n1(x + w)},${n1(196 - h)}L${n1(x + w)},${H}Z" fill="${P.far}"/>`; if (r() < 0.6) s += `<rect x="${n1(x + w / 2 - 2)}" y="${n1(206 - h)}" width="4" height="5" fill="#ffd27a" opacity=".8"/>`; }
        s += `<path d="M-10,${H}L-10,190L120,176L320,186L320,${H}Z" fill="${P.ground}"/>`;
        break;
      case 'grove':
        s += rays(160, -20, P.light, 6, 40, 260, 0.45);
        s += bigTree(40, 150, 110, P.far, r) + bigTree(250, 150, 120, P.far, r) + `<rect x="0" y="140" width="${W}" height="40" fill="url(#fog)"/>`;
        s += hills(r, gy, 12, P.mid) + `<rect x="0" y="${gy + 4}" width="${W}" height="${H}" fill="${P.ground}"/>` + grass(r, gy + 2, P.ground, 70);
        break;
      case 'altar':
        s += `<ellipse cx="150" cy="80" rx="110" ry="90" fill="${P.light}" opacity=".16" filter="url(#b8)"/>` + rays(150, -20, P.light, 5, 30, 240, 0.35);
        s += `<path d="M0,0L0,${H}L40,${H}L40,30Q40,14 60,14L240,14Q260,14 260,30L260,${H}L${W},${H}L${W},0Z" fill="${P.mid}" opacity=".7"/>`;
        s += `<path d="M30,176L270,176L286,${H}L14,${H}Z" fill="${P.far}"/><path d="M30,176L270,176" stroke="${P.rim}" stroke-width=".8" opacity=".4"/>`;
        s += `<path d="M60,176Q150,168 240,176L248,196Q150,186 52,196Z" fill="#3a1424" opacity=".9"/><path d="M60,176Q150,168 240,176" stroke="#d8a84a" stroke-width="1" fill="none" opacity=".6"/>`;
        break;
      case 'frost':
        s += stars(r, 30, '#fff') + aurora(r, '#9af0ff', '#7ab0ff') + ridge(r, 140, 60, 30, 0.7, P.far, 1, '#e6faff') + `<rect x="0" y="130" width="${W}" height="40" fill="url(#fog)"/>` + ridge(r, 190, 30, 22, 0.5, P.mid, 1, '#bfe8ff') + `<rect x="0" y="${gy + 4}" width="${W}" height="${H}" fill="${P.ground}"/>`;
        break;
      case 'void': default:
        s += stars(r, 50, P.rim);
        for (let i = 0; i < 5; i++) s += `<ellipse cx="150" cy="110" rx="${40 + i * 30}" ry="${16 + i * 12}" fill="none" stroke="${P.glow}" stroke-width="${3 - i * 0.4}" opacity="${0.25 - i * 0.03}" transform="rotate(${-12 + i * 5} 150 110)" filter="url(#b1)"/>`;
        s += `<ellipse cx="150" cy="110" rx="90" ry="60" fill="${P.glow}" opacity=".2" filter="url(#b8)"/>`;
        break;
    }
    return s;
  }
  A.scene = scene;
  A.foreground = function (kind, r, P) {
    if (kind === 'grass') return grass(r, 212, P.body, 50);
    if (kind === 'rocks') return rocks(r, 214, P.body, 4);
    return '';
  };

  /* ---------- main renderer ---------- */
  // spec: {s: scene, pal: overrides, L: [[kind, opts], ...], p: particles kind|false, fg: 'grass'|'rocks', seed, glow: [x,y,r]}
  const cache = {};
  A.svg = function (spec, key) {
    const seed = spec.seed != null ? spec.seed : hash(key || JSON.stringify(spec).slice(0, 200));
    const r = mulberry(seed);
    const P = A.pal(spec.s || 'void', spec.pal);
    if (spec.img && A.GEN && A.GEN[spec.img]) {
      // a painted (generated) illustration replaces the scene and layers; the house vignette and grain still apply
      const body = `<image href="${A.GEN[spec.img]}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/><rect width="${W}" height="${H}" fill="url(#vig)"/><rect width="${W}" height="${H}" filter="url(#grain)" opacity=".3"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs(P)}${body}</svg>`;
    }
    let body = scene(spec.s || 'void', r, P, spec);
    if (spec.glow) body += `<circle cx="${spec.glow[0]}" cy="${spec.glow[1]}" r="${spec.glow[2] || 60}" fill="url(#lt)" opacity=".9"/>`;
    A._uid = 0;
    for (const L of (spec.L || [])) {
      const fn = A.layers[L[0]];
      if (fn) body += fn(Object.assign({}, L[1] || {}), P, r);
    }
    if (spec.fg) body += A.foreground(spec.fg, r, P);
    const pk = spec.p === undefined ? P.part : spec.p;
    if (pk && pk !== 'none') body += particles(pk, r, P, spec.pn);
    body += `<rect width="${W}" height="${H}" fill="url(#vig)"/><rect width="${W}" height="${H}" filter="url(#grain)" opacity=".5"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs(P)}${body}</svg>`;
  };
  A.uri = function (spec, key) {
    const k = key || JSON.stringify(spec);
    if (cache[k]) return cache[k];
    const svg = A.svg(spec, key);
    // blob URLs keep the (photo-carrying) SVGs out of the DOM strings; data URIs are the fallback
    if (A.useBlobs === true) {
      try { return (cache[k] = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))); } catch (e) { /* fall through */ }
    }
    return (cache[k] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  };
  // switch to blob URLs only once a probe proves this page may load them (some sandboxes forbid blob: images)
  A.useBlobs = null;
  if (typeof Image !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
    try {
      const probe = new Image();
      probe.onload = () => { A.useBlobs = true; };
      probe.onerror = () => { A.useBlobs = false; };
      probe.src = URL.createObjectURL(new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2"/></svg>'], { type: 'image/svg+xml' }));
    } catch (e) { A.useBlobs = false; }
  }
  A.layers = A.layers || {};
  A.prims = { ridge, hills, pine, pines, deadTree, castle, clouds, rays, lightning, moon, sun, stars, aurora, grass, rocks };
})(globalThis.RB = globalThis.RB || {});
