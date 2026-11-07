/* RAIDBOUND — audio: layered synthesized sound effects and generative music (WebAudio only, no sound files).
   Signal chain: voices → sfx bus / music bus (with duck) → master → compressor → speakers, plus a shared
   convolution reverb fed by per-voice sends. Every effect is scheduled on the audio clock (no setTimeout),
   so it can also be rendered offline for testing via RB.AUDIO.attach(offlineContext). */
(function (RB) {
  const U = RB.UI = RB.UI || {};
  const AU = RB.AUDIO = {};
  const S = () => (U.save && U.save.settings) || {};
  const on = k => S()[k] !== false;
  let ac = null, master, comp, sfxBus, musBus, duckG, verbIn, NB = {}, shaper = null;

  /* ---------- graph ---------- */
  function build(a) {
    ac = a; NB = {}; shaper = null;
    comp = a.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.22;
    master = a.createGain(); master.gain.value = 0.9; master.connect(comp).connect(a.destination);
    sfxBus = a.createGain(); sfxBus.connect(master);
    duckG = a.createGain(); duckG.connect(master);
    musBus = a.createGain(); musBus.connect(duckG);
    const conv = a.createConvolver(); conv.buffer = impulse(a, 2.8); conv.normalize = true;
    verbIn = a.createGain(); const vOut = a.createGain(); vOut.gain.value = 0.85;
    verbIn.connect(conv).connect(vOut).connect(master);
    AU.setVolumes();
  }
  function impulse(a, dur) {
    const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(2, n, a.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c); let lp = 0;
      for (let i = 0; i < n; i++) { const t = i / n; lp += 0.35 * ((Math.random() * 2 - 1) - lp); d[i] = lp * Math.pow(1 - t, 2.4) * (i < a.sampleRate * 0.012 ? i / (a.sampleRate * 0.012) : 1); }
    }
    return b;
  }
  AU.setVolumes = function () {
    if (!ac) return;
    const s = S(), sv = s.sfxVol == null ? 0.8 : s.sfxVol, mv = s.musicVol == null ? 0.5 : s.musicVol;
    sfxBus.gain.setTargetAtTime(on('sound') ? sv : 0, ac.currentTime, 0.03);
    musBus.gain.setTargetAtTime(on('music') ? mv * 1.5 : 0, ac.currentTime, 0.08);
  };
  AU.attach = function (a) { stopMusic(true); build(a); return AU; };
  function ctx() {
    if (!on('sound') && !on('music')) return null;
    if (!ac) { try { build(new (window.AudioContext || window.webkitAudioContext)()); } catch (e) { return null; } }
    if (ac.state === 'suspended' && ac.resume) ac.resume();
    return ac;
  }
  const T = (d = 0) => ac.currentTime + 0.012 + d;
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- building blocks ---------- */
  function noiseBuf(kind) {
    if (NB[kind]) return NB[kind];
    const n = ac.sampleRate * 2, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    let l = 0, b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') { l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; }
      else if (kind === 'pink') { b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
      else d[i] = w;
    }
    return (NB[kind] = b);
  }
  function dist() {
    if (shaper) return shaper;
    const c = new Float32Array(1025); for (let i = 0; i < 1025; i++) { const x = i / 512 - 1; c[i] = Math.tanh(x * 3.2) / Math.tanh(3.2); } // odd length so silence maps to exactly 0 (no DC hum)
    return (shaper = c);
  }
  function env(g, t, o) {
    const pk = o.vol || 0.2, a = o.a || 0.004, h = o.hold || 0, d = o.d || 0.3;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + a);
    if (h) g.gain.setValueAtTime(pk, t + a + h);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + h + d);
    return a + h + d;
  }
  function filt(src, t, f) { // f = [type, from, to, q, time]
    const fl = ac.createBiquadFilter(); fl.type = f[0]; fl.frequency.setValueAtTime(f[1], t);
    if (f[2]) fl.frequency.exponentialRampToValueAtTime(f[2], t + (f[4] || 0.3));
    if (f[3]) fl.Q.value = f[3];
    if (f[0] === 'peaking') fl.gain.value = 9;
    src.connect(fl); return fl;
  }
  function route(node, t, o, len) {
    let n = node;
    if (o.shape) { const w = ac.createWaveShaper(); w.curve = dist(); n.connect(w); n = w; }
    if (o.pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.setValueAtTime(o.pan, t); if (o.pan2 != null) p.pan.linearRampToValueAtTime(o.pan2, t + len); n.connect(p); n = p; }
    n.connect(o.bus || sfxBus);
    if (o.verb) { const s = ac.createGain(); s.gain.value = o.verb; n.connect(s).connect(verbIn); }
  }
  function tone(t, o) {
    const os = ac.createOscillator(), g = ac.createGain();
    os.type = o.type || 'sine'; os.frequency.setValueAtTime(o.f, t);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide || o.d || 0.3));
    if (o.det) os.detune.value = o.det;
    const len = (o.a || 0.004) + (o.hold || 0) + (o.d || 0.3);
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg).connect(os.frequency); l.start(t); l.stop(t + len + 0.05); }
    let src = os; if (o.flt) src = filt(os, t, o.flt); if (o.flt2) src = filt(src, t, o.flt2);
    src.connect(g); env(g, t, o); route(g, t, o, len);
    os.start(t); os.stop(t + len + 0.05);
  }
  function noise(t, o) {
    const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = noiseBuf(o.kind || 'white');
    if (o.rate) s.playbackRate.value = o.rate;
    const len = (o.a || 0.004) + (o.hold || 0) + (o.d || 0.3);
    let src = s; if (o.flt) src = filt(s, t, o.flt); if (o.flt2) src = filt(src, t, o.flt2);
    if (o.trem) { const l = ac.createOscillator(), lg = ac.createGain(), tg = ac.createGain(); tg.gain.value = 0.55; l.frequency.value = o.trem[0]; lg.gain.value = o.trem[1]; l.connect(lg).connect(tg.gain); src.connect(tg); src = tg; l.start(t); l.stop(t + len + 0.05); }
    src.connect(g); env(g, t, o); route(g, t, o, len);
    s.start(t, Math.random() * 1.2); s.stop(t + len + 0.05);
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- instruments ---------- */
  function pluck(t, f, v, o = {}) { // harp-like
    tone(t, { type: 'triangle', f, a: 0.003, d: o.d || 1.1, vol: v, flt: ['lowpass', f * 6, f * 2, 0, 0.6], verb: o.verb ?? 0.35, pan: o.pan, bus: o.bus });
    tone(t, { type: 'sine', f: f * 2, a: 0.002, d: (o.d || 1.1) * 0.45, vol: v * 0.35, verb: o.verb ?? 0.35, pan: o.pan, bus: o.bus });
  }
  function bell(t, f, v, d = 2.2, o = {}) {
    [[1, 1], [2.0, 0.55], [2.4, 0.4], [3.0, 0.25], [4.07, 0.18], [5.43, 0.12]].forEach(([r, k], i) =>
      tone(t, { f: f * r, a: 0.002, d: d / (1 + i * 0.45), vol: v * k, verb: o.verb ?? 0.5, pan: o.pan, bus: o.bus }));
  }
  function brass(t, f, dur, v, o = {}) {
    [-6, 6].forEach(det => tone(t, { type: 'sawtooth', f, det, a: 0.05, hold: Math.max(0, dur - 0.12), d: 0.25, vol: v, flt: ['lowpass', f * 1.5, f * 7, 1.2, 0.08], verb: o.verb ?? 0.3, pan: o.pan, bus: o.bus }));
  }
  function taiko(t, v, f = 95, o = {}) {
    tone(t, { f, f2: f * 0.48, glide: 0.25, a: 0.002, d: 0.5, vol: v, bus: o.bus, verb: o.verb ?? 0.25, pan: o.pan });
    noise(t, { kind: 'brown', flt: ['lowpass', 900, 250, 0, 0.12], a: 0.001, d: 0.16, vol: v * 0.7, bus: o.bus, verb: 0.2, pan: o.pan });
    noise(t, { kind: 'white', flt: ['bandpass', 1800, 0, 1.2], a: 0.001, d: 0.03, vol: v * 0.12, bus: o.bus, pan: o.pan });
  }
  function pad(t, f, dur, v, o = {}) { // soft detuned string/choir pad
    [-9, 0, 9].forEach((det, i) => tone(t, { type: o.wave || 'sawtooth', f, det: det + rnd(-2, 2), a: o.a || Math.min(1.2, dur * 0.4), hold: dur * 0.35, d: dur * 0.6, vol: v, flt: ['lowpass', o.cut || 900, 0, 0.7], vib: o.vib, verb: o.verb ?? 0.55, pan: (i - 1) * 0.35, bus: o.bus }));
  }

  /* ---------- sound effects ---------- */
  const fx = {};
  fx.click = t => { tone(t, { type: 'triangle', f: 880, f2: 560, d: 0.045, vol: 0.05 }); noise(t, { flt: ['highpass', 3500], d: 0.02, vol: 0.04 }); };
  fx.card = t => {
    noise(t, { flt: ['bandpass', 4200, 900, 0.9, 0.11], a: 0.01, d: 0.11, vol: 0.32, pan: rnd(-0.25, 0.25), verb: 0.05 });
    noise(t + 0.075, { kind: 'pink', flt: ['lowpass', 1100], a: 0.001, d: 0.07, vol: 0.38, verb: 0.06 });
    tone(t + 0.075, { f: 150, f2: 70, d: 0.08, vol: 0.28 });
  };
  fx.flip = t => { noise(t, { flt: ['bandpass', 5500, 1800, 1, 0.08], a: 0.006, d: 0.08, vol: 0.28, pan: rnd(-0.3, 0.3) }); tone(t + 0.05, { f: 2400, d: 0.03, vol: 0.03 }); };
  fx.swing = t => noise(t, { flt: ['bandpass', 380, 2800, 2.4, 0.18], a: 0.08, d: 0.17, vol: 0.75, pan: -0.35, pan2: 0.35, verb: 0.08 });
  fx.hit = (t, n = 2) => {
    const r = rnd(0.9, 1.1), heavy = n >= 5;
    noise(t, { flt: ['highpass', 2600], a: 0.001, d: 0.035, vol: 0.32 });
    tone(t, { f: 170 * r, f2: 45, glide: 0.18, a: 0.002, d: 0.24, vol: 0.75 });
    noise(t, { kind: 'brown', flt: ['lowpass', 1500 * r, 280, 0, 0.15], a: 0.002, d: 0.2, vol: 0.55, shape: 1, verb: 0.12 });
    noise(t, { kind: 'pink', flt: ['bandpass', 900 * r, 0, 1.1], a: 0.002, d: 0.09, vol: 0.3 });
    if (heavy) {
      tone(t, { f: 72, f2: 32, glide: 0.4, a: 0.003, d: 0.55, vol: 0.6 });
      noise(t + 0.01, { kind: 'pink', flt: ['bandpass', 520, 0, 0.8], a: 0.004, d: 0.45, vol: 0.4, verb: 0.3 });
      [1, 2.7, 5.1].forEach((k, i) => tone(t, { f: 310 * r * k, a: 0.001, d: 0.35 / (i + 1), vol: 0.05 / (i + 1), verb: 0.3 }));
    }
  };
  fx.block = t => {
    const b = rnd(400, 450);
    [[1, 0.16, 0.7], [2.76, 0.1, 0.5], [5.4, 0.07, 0.32], [8.93, 0.045, 0.2]].forEach(([k, v, d]) => tone(t, { f: b * k, a: 0.001, d, vol: v, verb: 0.28, pan: 0.1 }));
    noise(t, { flt: ['highpass', 4000], a: 0.001, d: 0.035, vol: 0.3 });
    tone(t, { f: 230, f2: 120, d: 0.09, vol: 0.28 });
  };
  fx.heal = t => {
    [0, 4, 7, 12, 16, 19].forEach((s, i) => pluck(t + i * 0.065, hz(74 + s), 0.11, { pan: -0.4 + i * 0.16, verb: 0.45 }));
    tone(t + 0.1, { f: hz(98), a: 0.35, d: 1.2, vol: 0.025, vib: [6, 9], verb: 0.7 });
    noise(t, { flt: ['highpass', 7000], a: 0.3, d: 0.9, vol: 0.06, verb: 0.5 });
  };
  fx.power = t => {
    noise(t, { flt: ['bandpass', 300, 4500, 1.6, 0.6], a: 0.5, d: 0.35, vol: 0.3, verb: 0.35 });
    [50, 57, 62, 66].forEach(m => tone(t + 0.05, { type: 'sawtooth', f: hz(m), det: rnd(-7, 7), a: 0.45, d: 0.8, vol: 0.06, flt: ['lowpass', 400, 3200, 1, 0.5], verb: 0.45 }));
    for (let i = 0; i < 5; i++) bell(t + 0.48 + i * 0.06, hz(86 + [0, 4, 7, 12, 16][i]), 0.035, 1.0, { pan: rnd(-0.5, 0.5) });
    tone(t + 0.48, { f: 60, f2: 35, d: 0.6, vol: 0.45 });
  };
  fx.spell = t => { // ability cards
    noise(t, { flt: ['bandpass', 1200, 5000, 3, 0.25], a: 0.04, d: 0.3, vol: 0.4, verb: 0.35 });
    for (let i = 0; i < 4; i++) tone(t + i * 0.04, { f: hz(88 + [0, 3, 7, 10][i]), a: 0.002, d: 0.35, vol: 0.08, verb: 0.5, pan: rnd(-0.4, 0.4) });
  };
  fx.summon = t => { taiko(t, 0.35, 80); noise(t, { flt: ['bandpass', 600, 2400, 2, 0.3], a: 0.08, d: 0.3, vol: 0.18, verb: 0.3 }); };
  fx.death = t => { // a body crumpling to the ground: falling whoosh, heavy thud, armour clatter, dust and a dark low chord
    noise(t, { flt: ['bandpass', 1400, 320, 1.4, 0.24], a: 0.06, d: 0.2, vol: 0.22, pan: 0.15, pan2: -0.15 });
    const hit = t + 0.24;
    tone(hit, { f: 115, f2: 42, glide: 0.3, a: 0.002, d: 0.38, vol: 0.72 });
    noise(hit, { kind: 'brown', flt: ['lowpass', 520, 180, 0, 0.3], a: 0.002, d: 0.42, vol: 0.55, verb: 0.15 });
    for (let i = 0; i < 6; i++) { const s = hit + 0.02 + rnd(0, 0.32), f = rnd(1500, 3400); tone(s, { f, a: 0.001, d: rnd(0.05, 0.14), vol: rnd(0.025, 0.05), pan: rnd(-0.5, 0.5) }); tone(s, { f: f * 2.7, a: 0.001, d: 0.05, vol: 0.015 }); noise(s, { flt: ['highpass', 3000], a: 0.001, d: 0.02, vol: 0.05 }); }
    noise(hit + 0.05, { kind: 'pink', flt: ['lowpass', 900, 300, 0, 0.6], a: 0.08, d: 0.6, vol: 0.12, verb: 0.3 });
    [43, 46, 50].forEach(m => tone(hit + 0.08, { type: 'triangle', f: hz(m), a: 0.06, d: 1.3, vol: 0.035, flt: ['lowpass', 500], verb: 0.5 }));
  };
  fx.heroDeath = t => { bell(t, 98, 0.22, 3.2, { verb: 0.6 }); fx.death(t + 0.05); pad(t + 0.2, hz(45), 2.4, 0.03, { cut: 600, verb: 0.6 }); };
  fx.bossReveal = t => {
    [55, 55.3, 110, 109.6, 82.4].forEach((f, i) => {
      const os = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter();
      os.type = 'sawtooth'; os.frequency.value = f; fl.type = 'lowpass'; fl.Q.value = 2;
      fl.frequency.setValueAtTime(140, t); fl.frequency.exponentialRampToValueAtTime(1500, t + 0.22); fl.frequency.exponentialRampToValueAtTime(180, t + 1.7);
      os.connect(fl).connect(g); env(g, t, { a: 0.04, hold: 0.3, d: 1.4, vol: 0.085 }); route(g, t, { shape: 1, verb: 0.35, pan: (i % 3 - 1) * 0.4 }, 1.8);
      os.start(t); os.stop(t + 1.9);
    });
    tone(t, { f: 66, f2: 28, glide: 1.1, a: 0.004, d: 1.3, vol: 0.75 });
    noise(t, { kind: 'pink', flt: ['lowpass', 2400, 200, 0, 0.6], a: 0.002, d: 0.7, vol: 0.45, verb: 0.4 });
    AU.duck(0.35, 1.6);
  };
  fx.bossTurn = t => { taiko(t, 0.55); taiko(t + 0.24, 0.32, 105); taiko(t + 0.56, 0.6, 85); };
  fx.roar = (t, who) => {
    if (who === 'crypt') { // the Hollow King: ghostly wail and whispers
      [0, 7, 13].forEach((det, i) => tone(t + i * 0.05, { f: 330 + det, f2: 215 + det, glide: 1.6, a: 0.35, hold: 0.3, d: 1.4, vol: 0.1, vib: [5 + i, 14], verb: 0.75, pan: (i - 1) * 0.5 }));
      noise(t, { flt: ['bandpass', 3200, 1800, 2.5, 1.6], a: 0.3, hold: 0.4, d: 1.2, vol: 0.26, trem: [11, 0.5], verb: 0.6 });
      tone(t, { type: 'sawtooth', f: 55, a: 0.4, d: 2.0, vol: 0.12, flt: ['lowpass', 320], verb: 0.4 });
    } else if (who === 'tide') { // Nethys: abyssal growl, bubbles, surge
      tone(t, { type: 'sawtooth', f: 46, f2: 38, a: 0.25, hold: 0.6, d: 1.2, vol: 0.28, vib: [9, 7], flt: ['lowpass', 380, 220, 3, 1.5], shape: 1, verb: 0.45 });
      for (let i = 0; i < 16; i++) { const f = rnd(280, 900); tone(t + rnd(0, 1.6), { f, f2: f * 1.8, glide: 0.06, a: 0.002, d: 0.06, vol: 0.05, verb: 0.35, pan: rnd(-0.7, 0.7) }); }
      noise(t, { kind: 'brown', flt: ['lowpass', 1000, 300, 0, 1.4], a: 0.45, d: 1.3, vol: 0.4, verb: 0.4 });
    } else { // Vorthrax and default: dragon roar
      tone(t, { type: 'sawtooth', f: 78, f2: 58, glide: 1.4, a: 0.12, hold: 0.45, d: 1.0, vol: 0.32, vib: [26, 16], flt: ['bandpass', 520, 380, 0.9, 1.2], shape: 1, verb: 0.4 });
      noise(t, { kind: 'pink', flt: ['bandpass', 760, 520, 3, 1.4], flt2: ['peaking', 1180, 0, 4], a: 0.15, hold: 0.45, d: 1.0, vol: 0.55, shape: 1, verb: 0.4 });
      tone(t, { f: 55, f2: 36, a: 0.1, d: 1.7, vol: 0.45 });
      noise(t + 0.3, { flt: ['lowpass', 3200, 600, 0, 1.2], a: 0.2, d: 1.1, vol: 0.18, verb: 0.3 });
    }
  };
  fx.phase = (t, who) => { fx.bossReveal(t); fx.roar(t + 0.15, who); };
  fx.quest = t => {
    [[67, 0, 0.12], [72, 0.11, 0.12], [76, 0.22, 0.12], [79, 0.34, 0.5]].forEach(([m, d, l]) => brass(t + d, hz(m), l, 0.085));
    bell(t + 0.34, hz(91), 0.07, 1.4);
  };
  fx.master = t => {
    fx.power(t);
    [50, 57, 62, 66, 69].forEach((m, i) => tone(t + 0.4, { type: 'sawtooth', f: hz(m), det: rnd(-5, 5), a: 0.6, hold: 0.8, d: 1.3, vol: 0.04, vib: [5, 3], flt: ['bandpass', 800, 0, 2.5], flt2: ['lowpass', 1800], verb: 0.6, pan: (i - 2) * 0.25 }));
  };
  fx.treasure = t => {
    tone(t, { f: 130, f2: 70, d: 0.22, vol: 0.4 }); noise(t, { kind: 'brown', flt: ['lowpass', 500], d: 0.15, vol: 0.3 });
    for (let i = 0; i < 18; i++) { const f = rnd(2400, 5400), s = t + 0.06 + rnd(0, 0.85); tone(s, { f, a: 0.001, d: rnd(0.1, 0.3), vol: 0.035, verb: 0.3, pan: rnd(-0.6, 0.6) }); tone(s, { f: f * 1.51, a: 0.001, d: 0.1, vol: 0.015 }); }
    noise(t + 0.1, { flt: ['highpass', 6500], a: 0.25, d: 0.8, vol: 0.06, verb: 0.5 });
  };
  fx.win = t => {
    for (let i = 0; i < 8; i++) taiko(t + i * 0.07, 0.12 + i * 0.04, 70);
    noise(t, { flt: ['highpass', 5500], a: 1.0, d: 1.6, vol: 0.12, verb: 0.5 });
    const mel = [[60, 0.6, 0.18], [67, 0.8, 0.18], [72, 1.0, 0.4], [71, 1.45, 0.14], [72, 1.6, 0.14], [74, 1.75, 0.14], [76, 1.9, 1.3]];
    mel.forEach(([m, d, l]) => brass(t + d, hz(m), l, 0.06));
    [48, 55, 64, 67].forEach(m => brass(t + 1.9, hz(m), 1.3, 0.035, { verb: 0.45 }));
    taiko(t + 1.9, 0.7, 75); bell(t + 1.9, hz(84), 0.06, 2.4); bell(t + 2.05, hz(91), 0.04, 2.0);
  };
  fx.lose = t => {
    [[[45, 48, 52, 57], 0, 1.4], [[41, 45, 48, 53], 1.3, 1.4], [[40, 44, 47, 52], 2.6, 2.4]].forEach(([ch, d, l]) => ch.forEach(m => pad(t + d, hz(m), l, 0.028, { cut: 800, a: 0.25 })));
    taiko(t, 0.5, 70); taiko(t + 2.6, 0.45, 62); bell(t + 2.6, 87, 0.12, 3.5);
  };

  U.sfx = {};
  Object.keys(fx).forEach(k => { U.sfx[k] = (...args) => { if (!on('sound') || !ctx()) return; try { fx[k](T(), ...args); } catch (e) { /* audio must never break the game */ } }; });
  AU.fx = fx; AU.T = T;

  AU.duck = function (depth, dur) {
    if (!ac || !duckG) return; const t = ac.currentTime;
    duckG.gain.cancelScheduledValues(t); duckG.gain.setTargetAtTime(depth, t, 0.04); duckG.gain.setTargetAtTime(1, t + dur, 0.5);
  };

  /* ---------- generative music ---------- */
  // chords: [semitones from key, 'm'|'M'|'s' (sus) | 'd' (dim)]
  const THEMES = {
    title: { bpm: 84, key: 50, prog: [[0, 'm'], [-4, 'M'], [3, 'M'], [-2, 'M']], harp: 1, melody: 1, drum: 'pulse', bass: 1, scale: [0, 2, 3, 5, 7, 8, 10] },
    crypt: { bpm: 58, key: 49, prog: [[0, 'm'], [0, 'm'], [-4, 'M'], [-5, 'M'], [0, 'm'], [1, 'M'], [-4, 'M'], [-5, 'M']], choir: 1, bellEvery: 4, drone: 1, amb: 'wind', scale: [0, 1, 3, 5, 7, 8, 10] },
    molten: { bpm: 96, key: 40, prog: [[0, 'm'], [0, 'm'], [-4, 'M'], [-2, 'M']], drum: 'war', ostinato: 1, bass: 1, horns: 1, amb: 'lava', scale: [0, 2, 3, 5, 7, 8, 10] },
    tide: { bpm: 64, key: 41, prog: [[0, 'm'], [-4, 'M'], [3, 'M'], [-2, 'M']], drops: 1, whale: 1, pads: 1, amb: 'water', scale: [0, 2, 3, 5, 7, 8, 10] },
    victory: { bpm: 92, key: 48, prog: [[0, 'M'], [5, 'M'], [7, 'M'], [0, 'M']], harp: 1, bass: 1, drum: 'pulse', melody: 1, scale: [0, 2, 4, 5, 7, 9, 11] },
  };
  const triad = (r, q) => q === 'M' ? [r, r + 4, r + 7] : q === 's' ? [r, r + 5, r + 7] : q === 'd' ? [r, r + 3, r + 6] : [r, r + 3, r + 7];
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }

  function scheduleBar(th, bar, t, bus) {
    const beat = 60 / th.bpm, barLen = beat * 4, [cr, cq] = th.prog[bar % th.prog.length], ch = triad(th.key + cr, cq), R = rng(bar * 977 + th.key);
    const o = { bus };
    // harmony
    if (th.choir) ch.forEach((m, i) => tone(t, { type: 'sawtooth', f: hz(m + 12), det: (i - 1) * 6, a: barLen * 0.45, hold: barLen * 0.2, d: barLen * 0.6, vol: 0.05, vib: [4.5, 3], flt: ['bandpass', 700, 0, 2.2], flt2: ['lowpass', 1400], verb: 0.7, pan: (i - 1) * 0.5, bus }));
    else if (th.pads) ch.forEach((m, i) => pad(t, hz(m + 12), barLen * 1.1, 0.026, { cut: 700, vib: [0.3 + i * 0.1, 2], verb: 0.7, bus }));
    else ch.forEach(m => pad(t, hz(m + 12), barLen, 0.014, { cut: 1100, bus }));
    if (th.drone) tone(t, { type: 'sawtooth', f: hz(th.key - 12), a: 1.5, hold: barLen - 1.2, d: 1.6, vol: 0.08, flt: ['lowpass', 260], verb: 0.4, bus });
    // bass
    if (th.bass) { tone(t, { type: 'triangle', f: hz(ch[0] - 12), a: 0.02, hold: beat * 1.6, d: 0.5, vol: 0.12, bus }); if (bar % 2) tone(t + beat * 2, { type: 'triangle', f: hz(ch[0] - 12), a: 0.02, hold: beat, d: 0.5, vol: 0.09, bus }); }
    // harp arpeggio
    if (th.harp) { const notes = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 24, ch[2] + 24, ch[1] + 12]; notes.forEach((m, i) => pluck(t + i * beat / 2, hz(m), 0.035, { d: 1.2, verb: 0.45, pan: -0.3 + (i % 4) * 0.2, bus })); }
    // melody: a gentle horn line on the second half of each two-bar phrase
    if (th.melody && bar % 2 === 1) { let deg = Math.floor(R() * 3) * 2; [0, 1, 2, 3].forEach(i => { if (i && R() < 0.3) return; deg = Math.max(0, Math.min(9, deg + [-1, 1, 2, -2][Math.floor(R() * 4)])); const m = th.key + 12 + th.scale[deg % 7] + 12 * Math.floor(deg / 7); brass(t + i * beat, hz(m), beat * (i === 3 ? 1.6 : 0.85), 0.022, { verb: 0.5, bus }); }); }
    // percussion
    if (th.drum === 'pulse') { taiko(t, 0.18, 90, o); taiko(t + beat * 2, 0.12, 90, o); if (bar % 4 === 3) { taiko(t + beat * 3, 0.1, 100, o); taiko(t + beat * 3.5, 0.14, 100, o); } }
    if (th.drum === 'war') { [[0, 0.32], [0.75, 0.16], [1.5, 0.22], [2, 0.3], [3, 0.2], [3.5, 0.24]].forEach(([b, v]) => taiko(t + b * beat, v, 88, o)); if (bar % 2) [3.25, 3.5, 3.75].forEach(b => taiko(t + b * beat, 0.12, 140, o)); }
    if (th.ostinato) [0, 0, 3, 0, 0, 0, 5, 3].forEach((s, i) => tone(t + i * beat / 2, { type: 'sawtooth', f: hz(ch[0] - 12 + s), a: 0.01, hold: beat * 0.25, d: 0.18, vol: 0.06, flt: ['lowpass', 700, 350, 2, 0.2], bus }));
    if (th.horns && bar % 4 === 2) ch.forEach(m => brass(t, hz(m), barLen * 1.6, 0.022, { verb: 0.55, bus }));
    if (th.bellEvery && bar % th.bellEvery === 0) bell(t + beat, hz(th.key + 12), 0.08, 4, { verb: 0.75, bus });
    if (th.drops) for (let i = 0; i < 3; i++) { if (R() < 0.35) continue; const f = hz(th.key + 24 + th.scale[Math.floor(R() * 7)]); tone(t + R() * barLen, { f, f2: f * 1.25, glide: 0.05, a: 0.002, d: 0.6, vol: 0.05, verb: 0.75, pan: R() * 1.4 - 0.7, bus }); }
    if (th.whale && bar % 4 === 1) tone(t + beat, { f: hz(th.key), f2: hz(th.key + 7), glide: barLen * 0.6, a: 1.2, hold: 0.6, d: 1.8, vol: 0.03, vib: [3, 4], flt: ['lowpass', 900], verb: 0.8, bus });
    return barLen;
  }
  function ambience(kind, t, bus) {
    if (!kind) return [];
    const s = ac.createBufferSource(); s.buffer = noiseBuf(kind === 'wind' ? 'pink' : 'brown'); s.loop = true;
    const f = ac.createBiquadFilter(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
    f.type = kind === 'wind' ? 'bandpass' : 'lowpass'; f.frequency.value = kind === 'wind' ? 700 : kind === 'lava' ? 240 : 420; f.Q.value = kind === 'wind' ? 1.6 : 0.7;
    l.frequency.value = kind === 'wind' ? 0.09 : 0.13; lg.gain.value = kind === 'wind' ? 380 : 120; l.connect(lg).connect(f.frequency);
    g.gain.value = kind === 'wind' ? 0.18 : kind === 'lava' ? 0.4 : 0.32;
    s.connect(f).connect(g).connect(bus); s.start(t); l.start(t);
    return [s, l];
  }
  function crackles(th, t0, t1, bus) { // lava crackle / water bubbles sprinkled through a bar
    if (th.amb === 'lava') for (let i = 0; i < 6; i++) noise(t0 + rnd(0, t1 - t0), { flt: ['highpass', rnd(2000, 5000)], a: 0.001, d: rnd(0.01, 0.04), vol: rnd(0.04, 0.12), pan: rnd(-0.8, 0.8), bus });
    if (th.amb === 'water') for (let i = 0; i < 4; i++) { const f = rnd(250, 700); tone(t0 + rnd(0, t1 - t0), { f, f2: f * 1.7, glide: 0.05, a: 0.002, d: 0.05, vol: 0.03, pan: rnd(-0.7, 0.7), bus }); }
  }
  AU.scheduleBar = (name, bar, t, bus) => { const th = THEMES[name]; const len = scheduleBar(th, bar, t, bus || musBus); crackles(th, t, t + len, bus || musBus); return len; };

  let mus = null, pending = null;
  function stopMusic(now) {
    if (!mus) return; const m = mus; mus = null; clearInterval(m.timer);
    if (!ac) return; const t = ac.currentTime;
    m.out.gain.cancelScheduledValues(t); m.out.gain.setValueAtTime(m.out.gain.value, t); m.out.gain.linearRampToValueAtTime(0, t + (now ? 0.05 : 1.4));
    setTimeout(() => { m.srcs.forEach(s => { try { s.stop(); } catch (e) { /* already stopped */ } }); try { m.out.disconnect(); } catch (e) { /* gone */ } }, now ? 100 : 1600);
  }
  function startMusic(name) {
    const th = THEMES[name]; if (!th || !ac) return;
    const out = ac.createGain(), t = ac.currentTime + 0.1; out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(1, t + 2.5); out.connect(musBus);
    const m = { name, th, out, bar: 0, next: t, srcs: ambience(th.amb, t, out) };
    const tick = () => { while (mus === m && m.next < ac.currentTime + 0.8) { const len = scheduleBar(th, m.bar, m.next, out); crackles(th, m.next, m.next + len, out); m.next += len; m.bar++; } };
    mus = m; tick(); m.timer = setInterval(tick, 250);
  }
  AU.music = function (name) {
    pending = name || null;
    if (mus && mus.name === name) return;
    stopMusic();
    if (!name || !on('music')) return;
    if (!ac || ac.state !== 'running') { if (ac && ac.resume) ac.resume().then(() => { if (pending === name && !mus) startMusic(name); }).catch(() => {}); return; }
    startMusic(name);
  };
  AU.refresh = function () { AU.setVolumes(); if (!on('music')) stopMusic(); else if (pending && !mus) { if (ctx()) AU.music(pending); } };
  // browsers only allow audio after a user gesture: unlock on the first click/key and start any waiting music
  const unlock = () => { if (!ctx()) return; if (ac.state === 'running' && pending && !mus && on('music')) startMusic(pending); else if (ac.resume) ac.resume().then(() => { if (pending && !mus && on('music')) startMusic(pending); }).catch(() => {}); };
  if (typeof document !== 'undefined') { ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { capture: true })); document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.btn, .seg button, .raid, .traid, .heropick button')) U.sfx.click(); }, { capture: true }); }
})(globalThis.RB = globalThis.RB || {});
