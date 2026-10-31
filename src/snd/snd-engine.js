
/*
 * Zvuk & hudba · jádro bez DOM (běží i v Node): FFT, oscilátory (naivní i PolyBLEP), aditivní a FM syntéza, ADSR,
 * biquad (koeficienty, odezva, póly), ladění a disonance, mikrofonní pole (delay-and-sum), místnost (zdroje-obrazy),
 * binaurální vodítka a export WAV. Labs z toho jen čtou; zvuk, který slyšíš, je spočítaný tady, ne jen nakreslený.
 * Vzorky jsou Float32Array v rozsahu −1…+1. Náhoda je vždy seedovaná (SND.rng), nikdy Math.random().
 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const S = root.SND = root.SND || {};
  const TAU = Math.PI * 2;

  function rng(seed) {   // mulberry32
    let a = (seed | 0) >>> 0;
    const f = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    f.gauss = () => { let u = 0; while (u === 0) u = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * f()); };
    return f;
  }

  // =============================================================== FFT
  // radix-2 Cooley–Tukey na místě; n musí být mocnina dvou
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -TAU / len, wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < h; k++) {
          const a = i + k, b = a + h, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  }
  const hann = (n) => Float64Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos(TAU * i / n));
  // amplitudové spektrum: amp[k] je amplituda sinusovky na frekvenci k·sr/N (okno Hann, korekce koherentního zisku 0,5)
  function spectrum(x, sr, o = {}) {
    let n = 1; while (n * 2 <= x.length) n *= 2;
    const re = new Float64Array(n), im = new Float64Array(n), w = o.rect ? null : hann(n), off = o.offset || 0;
    for (let i = 0; i < n; i++) re[i] = (x[off + i] || 0) * (w ? w[i] : 1);
    fft(re, im);
    const half = n / 2, amp = new Float64Array(half), cg = w ? 0.5 : 1;
    for (let k = 0; k < half; k++) amp[k] = 2 * Math.hypot(re[k], im[k]) / (n * cg);
    amp[0] /= 2;
    return { amp, df: sr / n, n, sr };
  }
  const toDb = (a, floor = -120) => Math.max(floor, 20 * Math.log10(Math.max(a, 1e-12)));
  // nejvyšší lokální maxima spektra (pro popisky): [{ f, a }] se sub-binovou interpolací paraboly
  function peaks(sp, o = {}) {
    const { amp, df } = sp, thr = o.min ?? 0.01, out = [];
    for (let k = 2; k < amp.length - 2; k++) {
      if (amp[k] > thr && amp[k] >= amp[k - 1] && amp[k] > amp[k + 1] && amp[k] >= amp[k - 2] && amp[k] > amp[k + 2]) {
        const a = Math.log(amp[k - 1] + 1e-12), b = Math.log(amp[k] + 1e-12), c = Math.log(amp[k + 1] + 1e-12), d = a - 2 * b + c;
        const p = d !== 0 ? 0.5 * (a - c) / d : 0;
        out.push({ f: (k + p) * df, a: Math.exp(b - 0.25 * (a - c) * p) });
      }
    }
    return out.sort((p, q) => q.a - p.a).slice(0, o.n || 12);
  }
  const rms = (x) => { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; return Math.sqrt(s / (x.length || 1)); };
  const peakAbs = (x) => { let m = 0; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i])); return m; };
  // váha A (IEC 61672): zdůrazňuje, že ucho není stejně citlivé na všech frekvencích; amplituda ≠ vnímaná hlasitost
  function aWeightDb(f) {
    const f2 = f * f, ra = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2));
    return 20 * Math.log10(Math.max(ra, 1e-12)) + 2.0;
  }

  // =============================================================== oscilátory
  // fáze ph ∈ [0,1) v periodách; naivní tvary (mají aliasing)
  function shape(type, ph) {
    ph -= Math.floor(ph);
    switch (type) {
      case 'sine': return Math.sin(TAU * ph);
      case 'triangle': return 1 - 4 * Math.abs(ph - 0.5);
      case 'square': return ph < 0.5 ? 1 : -1;
      case 'saw': return 2 * ph - 1;
      default: return 0;
    }
  }
  // PolyBLEP: oprava skoků pily/obdélníku dvěma vzorky kolem nespojitosti (omezuje, nezakazuje aliasing)
  function polyblep(t, dt) {
    if (t < dt) { t /= dt; return t + t - t * t - 1; }
    if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
    return 0;
  }
  // vykreslí n vzorků oscilátoru; o = { phase (rad), blep, amp, seed, pw }
  function osc(type, f, sr, n, o = {}) {
    const out = new Float32Array(n), amp = o.amp ?? 1, ph0 = (o.phase || 0) / TAU, dt = f / sr, pw = o.pw ?? 0.5;
    if (type === 'noise') { const R = rng(o.seed ?? 1); for (let i = 0; i < n; i++) out[i] = amp * (R() * 2 - 1); return out; }
    if (type === 'pink') { const R = rng(o.seed ?? 1); let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < n; i++) { const w = R() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; out[i] = amp * 0.3 * (b0 + b1 + b2 + w * 0.1848); } return out; }
    let tri = 0;
    for (let i = 0; i < n; i++) {
      let ph = ph0 + i * dt; ph -= Math.floor(ph);
      let v;
      if (type === 'saw') { v = 2 * ph - 1; if (o.blep) v -= polyblep(ph, dt); }
      else if (type === 'square') {
        v = ph < pw ? 1 : -1;
        if (o.blep) { v += polyblep(ph, dt); v -= polyblep((ph - pw + 1) % 1, dt); }
      } else if (type === 'triangle' && o.blep) {
        // integrál z band-limitovaného obdélníku (leaky) – stačí jako vzdělávací náhrada
        let sq = ph < 0.5 ? 1 : -1; sq += polyblep(ph, dt); sq -= polyblep((ph + 0.5) % 1, dt);
        tri = dt * 4 * sq + (1 - 1e-4) * tri; v = tri;
      } else v = shape(type, ph);
      out[i] = amp * v;
    }
    return out;
  }
  // ideální pásmově omezený oscilátor téhož tvaru a fáze jako naivní osc(): Fourierova řada jen do Nyquista (saw = 2ph−1, square, triangle = shape('triangle'))
  function idealOsc(type, f, sr, n) {
    const a = [], ph = [], kmax = Math.floor(sr / 2 / f);
    for (let k = 1; k <= kmax; k++) {
      if (type === 'saw') { a.push(2 / (Math.PI * k)); ph.push(Math.PI); }
      else if (type === 'square') { a.push(k % 2 ? 4 / (Math.PI * k) : 0); ph.push(0); }
      else if (type === 'triangle') { a.push(k % 2 ? 8 / (Math.PI * Math.PI * k * k) : 0); ph.push(1.5 * Math.PI); }
      else { a.push(k === 1 ? 1 : 0); ph.push(0); }
    }
    return additive(a, ph, f, sr, n);
  }
  // odchylka x od ideálu v dB (energie rozdílu / energie ideálu): u naivního oscilátoru jde o aliasy, u PolyBLEP o zbytek aliasů a malé zkreslení pásma
  function aliasErrorDb(x, ideal) { let e = 0, p = 0; for (let i = 0; i < x.length; i++) { const d = x[i] - ideal[i]; e += d * d; p += ideal[i] * ideal[i]; } return 10 * Math.log10(Math.max(e, 1e-14) / Math.max(p, 1e-14)); }

  // frekvence, na kterou se složka f „složí“ při vzorkování sr (aliasing)
  function aliasOf(f, sr) { let a = f % sr; if (a > sr / 2) a = sr - a; return a; }
  // první nenulové složky pily: k-tá harmonická k·f; vrací [{ k, f, alias, folded }]
  function sawPartials(f, sr, kmax = 40) { const out = []; for (let k = 1; k <= kmax; k++) { const fr = k * f; out.push({ k, f: fr, alias: aliasOf(fr, sr), folded: fr >= sr / 2 }); } return out; }

  // aditivní syntéza: amps[k] a phases[k] pro harmonické k+1; složky nad Nyquistem se nepočítají
  // ratios (volitelné): poměr frekvence k-té složky k f0; výchozí k+1 (harmonické), jiné hodnoty = neharmonický tón
  function additive(amps, phases, f0, sr, n, ratios) {
    const out = new Float32Array(n);
    for (let h = 0; h < amps.length; h++) {
      const f = f0 * (ratios ? ratios[h] : h + 1); if (f >= sr / 2 || !amps[h]) continue;
      const w = TAU * f / sr, ph = phases ? phases[h] || 0 : 0;
      for (let i = 0; i < n; i++) out[i] += amps[h] * Math.sin(w * i + ph);
    }
    return out;
  }
  // předvolby harmonických (relativní amplitudy); jen vzdělávací aproximace skutečných nástrojů
  const HARM = {
    sine: [1], saw: Array.from({ length: 16 }, (_, i) => 1 / (i + 1)),
    square: Array.from({ length: 16 }, (_, i) => (i % 2 === 0 ? 1 / (i + 1) : 0)),
    triangle: Array.from({ length: 16 }, (_, i) => (i % 2 === 0 ? 1 / ((i + 1) ** 2) : 0)),
    clarinet: [1, 0.02, 0.75, 0.03, 0.5, 0.04, 0.14, 0.02, 0.18, 0.01, 0.12, 0, 0.05, 0, 0.03, 0],
    flute: [1, 0.35, 0.08, 0.05, 0.02, 0.01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    organ: [1, 0.9, 0.0, 0.6, 0, 0.3, 0, 0.35, 0, 0, 0, 0.15, 0, 0, 0, 0.1],
    strings: [1, 0.8, 0.6, 0.55, 0.4, 0.38, 0.3, 0.26, 0.2, 0.18, 0.14, 0.12, 0.1, 0.08, 0.06, 0.05],
    bell: [0.3, 1, 0.1, 0.6, 0.05, 0.4, 0.02, 0.25, 0.01, 0.1, 0, 0.05, 0, 0, 0, 0],
  };
  const normalizeAmps = (a) => { const s = a.reduce((m, x) => m + Math.abs(x), 0) || 1; return a.map((x) => x / s * 0.9); };

  // FM: y = A·sin(2π fc t + I·sin(2π fm t))
  function fm(fc, fmod, I, sr, n, amp = 1) {
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) { const t = i / sr; out[i] = amp * Math.sin(TAU * fc * t + I * Math.sin(TAU * fmod * t)); }
    return out;
  }
  // Besselova funkce J_n(x) řadou (stačí pro index modulace do ~25)
  function besselJ(n, x) {
    n = Math.abs(n); let term = 1, f = 1; for (let i = 2; i <= n; i++) f *= i;
    term = (x / 2) ** n / f; let sum = term;
    for (let k = 1; k < 80; k++) { term *= -(x * x / 4) / (k * (k + n)); sum += term; if (Math.abs(term) < 1e-16) break; }
    return sum;
  }
  // postranní pásma FM podle teorie: složka na fc + k·fm má amplitudu A·|J_k(I)| (záporná frekvence se překlopí)
  function fmSidebands(fc, fmod, I, K = 14) {
    const bands = new Map();
    for (let k = -K; k <= K; k++) {
      let f = fc + k * fmod, a = besselJ(k, I); if (f < 0) { f = -f; a = -a; }
      const key = Math.round(f * 1000); bands.set(key, (bands.get(key) || 0) + a);
    }
    return [...bands].map(([key, a]) => ({ f: key / 1000, a: Math.abs(a) })).filter((b) => b.a > 1e-4).sort((p, q) => p.f - q.f);
  }

  // ADSR v čase t od stisku; gate = délka držení (s). Pokles při puštění vychází z hodnoty v okamžiku puštění.
  function adsr(t, gate, e) {
    const A = Math.max(1e-3, e.a), D = Math.max(1e-3, e.d), R = Math.max(1e-3, e.r), s = e.s;
    const hold = (tt) => (tt < A ? tt / A : tt < A + D ? 1 - (1 - s) * (tt - A) / D : s);
    if (t < 0) return 0;
    if (t <= gate) return hold(t);
    return Math.max(0, hold(gate) * (1 - (t - gate) / R));
  }

  // =============================================================== biquad (RBJ Audio EQ Cookbook)
  function biquad(type, f0, Q, sr, gainDb = 0) {
    const w = TAU * Math.min(f0, sr * 0.499) / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * Math.max(Q, 1e-3)), A = 10 ** (gainDb / 40);
    let b0, b1, b2, a0 = 1 + al, a1 = -2 * cw, a2 = 1 - al;
    switch (type) {
      case 'lp': b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; break;
      case 'hp': b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; break;
      case 'bp': b0 = al; b1 = 0; b2 = -al; break;                  // konstantní špička 0 dB
      case 'notch': b0 = 1; b1 = -2 * cw; b2 = 1; break;
      case 'peak': b0 = 1 + al * A; b1 = -2 * cw; b2 = 1 - al * A; a0 = 1 + al / A; a2 = 1 - al / A; break;
      case 'lowshelf': case 'highshelf': {   // RBJ shelf se sklonem S = 1
        const sa = 2 * Math.sqrt(A) * (sw / 2) * Math.SQRT2, lo = type === 'lowshelf', sg = lo ? 1 : -1;
        b0 = A * ((A + 1) - sg * (A - 1) * cw + sa); b1 = sg * 2 * A * ((A - 1) - sg * (A + 1) * cw); b2 = A * ((A + 1) - sg * (A - 1) * cw - sa);
        a0 = (A + 1) + sg * (A - 1) * cw + sa; a1 = -sg * 2 * ((A - 1) + sg * (A + 1) * cw); a2 = (A + 1) + sg * (A - 1) * cw - sa; break;
      }
      default: b0 = 1; b1 = 0; b2 = 0; a0 = 1; a1 = 0; a2 = 0;
    }
    return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
  }
  // přenos H(e^{jω}) v bodě f: { mag, db, phase, gd } (gd = skupinové zpoždění ve vzorcích, numericky z fáze)
  function biquadResp(c, f, sr) {
    const H = (ff) => {
      const w = TAU * ff / sr, c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
      const nr = c.b0 + c.b1 * c1 + c.b2 * c2, ni = -(c.b1 * s1 + c.b2 * s2), dr = 1 + c.a1 * c1 + c.a2 * c2, di = -(c.a1 * s1 + c.a2 * s2);
      const d = dr * dr + di * di; return [(nr * dr + ni * di) / d, (ni * dr - nr * di) / d];
    };
    const h = H(f), mag = Math.hypot(h[0], h[1]), ph = Math.atan2(h[1], h[0]);
    const e = Math.max(1, f * 1e-3), p1 = Math.atan2(...H(f - e).reverse()), p2 = Math.atan2(...H(f + e).reverse());
    let dp = p2 - p1; dp -= TAU * Math.round(dp / TAU);
    return { mag, db: 20 * Math.log10(Math.max(mag, 1e-9)), phase: ph, gd: -dp / (TAU * 2 * e / sr) };
  }
  // póly: kořeny z² + a1 z + a2 = 0; stabilní, pokud oba leží uvnitř jednotkové kružnice
  function biquadPoles(c) {
    const d = c.a1 * c.a1 - 4 * c.a2;
    if (d >= 0) { const s = Math.sqrt(d); return [[(-c.a1 + s) / 2, 0], [(-c.a1 - s) / 2, 0]]; }
    const s = Math.sqrt(-d); return [[-c.a1 / 2, s / 2], [-c.a1 / 2, -s / 2]];
  }
  const biquadStable = (c) => biquadPoles(c).every((p) => Math.hypot(p[0], p[1]) < 1);
  // direct form II transposed; state = { z1, z2 } se zachovává mezi bloky
  function biquadRun(c, x, st = { z1: 0, z2: 0 }) {
    const y = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) { const v = x[i], o = c.b0 * v + st.z1; st.z1 = c.b1 * v - c.a1 * o + st.z2; st.z2 = c.b2 * v - c.a2 * o; y[i] = o; }
    return y;
  }

  // =============================================================== syntezátor (offline vykreslení jednoho hlasu)
  // patch: { osc:{shape, detune(cent), sub, fmRatio, fmIndex, blep}, filter:{type, cutoff, q, env(oktávy)}, aenv, fenv, lfo:{rate, depth, target}, drive }
  // Nepovinná pole (bez nich zní hlas bit po bitu jako dřív, hlídají to zlaté testy v test-snd-library.js):
  //   osc    oct (−3…3), semi (−12…12), pw (šířka pulzu 0,05…0,95), noise (0…1), level (0…1,5), uni { n (1…7), spread (cent) }   unison = další rozladěné kopie (ne u FM a šumu)
  //   osc2   { shape, level, oct, semi, detune, pw }                                                                          druhý oscilátor (level 0 = vypnutý)
  //   filter slope 12 | 24 (dva stupně za sebou), keytrack 0…1 (sleduje klávesu od C4), velo (oktávy cutoffu na jednotku síly stisku od 0,5)
  //   lfo, lfo2  shape sine | tri | square | saw | sh (náhodné stupně), target pitch | cutoff | amp | pw (lfo2 s depth 0 se nepočítá); level (hlasitost patche)
  //   po hlasu (lab Syntezátor a jeho WAV, v písničce a ve hře ne): delay, chorus { rate, depth, mix }, reverb { size, damp, wet } → fxChain
  const midiFreq = (m) => 440 * 2 ** ((m - 69) / 12);
  const DEFAULT_PATCH = () => ({
    osc: { shape: 'saw', detune: 0, sub: 0, fmRatio: 0, fmIndex: 0, blep: true },
    filter: { type: 'lp', cutoff: 1800, q: 1.2, env: 2 },
    aenv: { a: 0.01, d: 0.25, s: 0.6, r: 0.3 }, fenv: { a: 0.005, d: 0.3, s: 0.2, r: 0.3 },
    lfo: { rate: 5, depth: 0, target: 'pitch' }, drive: 0,
  });
  // tvar LFO v čase x (fáze v periodách, neomezená), výstup −1…1; st drží poslední hodnotu S&H
  function lfoWave(shape, x, st, R) {
    const f = x - Math.floor(x);
    switch (shape) {
      case 'tri': return f < 0.25 ? 4 * f : f < 0.75 ? 2 - 4 * f : 4 * f - 4;
      case 'square': return f < 0.5 ? 1 : -1;
      case 'saw': return f < 0.5 ? 2 * f : 2 * f - 2;
      case 'sh': { const k = Math.floor(x); if (k !== st.k) { st.k = k; st.v = R() * 2 - 1; } return st.v; }
      default: return Math.sin(TAU * x);
    }
  }
  // jeden krok pomocného oscilátoru se stavem st = { ph, tri }; stejné vzorce jako hlavní oscilátor v renderVoice
  function oscStep(st, sh, dt, pw, blep, R) {
    st.ph += dt; st.ph -= Math.floor(st.ph); const ph = st.ph;
    if (sh === 'noise') return R() * 2 - 1;
    if (sh === 'saw') { let v = 2 * ph - 1; if (blep) v -= polyblep(ph, dt); return v; }
    if (sh === 'square') { let v = ph < pw ? 1 : -1; if (blep) { v += polyblep(ph, dt); v -= polyblep((ph - pw + 1) % 1, dt); } return v; }
    if (sh === 'triangle') { if (blep) { let sq = ph < 0.5 ? 1 : -1; sq += polyblep(ph, dt); sq -= polyblep((ph + 0.5) % 1, dt); st.tri = dt * 4 * sq + (1 - 1e-4) * st.tri; return st.tri; } return shape('triangle', ph); }
    return Math.sin(TAU * ph);
  }
  function renderVoice(p, midi, gate, sr, o = {}) {
    const po = p.osc, fl = p.filter, L1 = p.lfo, L2 = p.lfo2 && p.lfo2.depth > 0 ? p.lfo2 : null, q2 = p.osc2 && p.osc2.level > 0 ? p.osc2 : null;
    const bf = midiFreq(midi), f = bf * 2 ** (((po.detune || 0) + 1200 * (po.oct || 0) + 100 * (po.semi || 0)) / 1200), n = Math.max(1, Math.round((gate + p.aenv.r) * sr)), out = new Float32Array(n);
    let ph = 0, phs = 0, phm = 0, st = { z1: 0, z2: 0 }, st2 = { z1: 0, z2: 0 }, c = null, c2 = null, last = -1, tri = 0;
    const dt0 = f / sr, vel = o.vel ?? 0.8, seed = o.seed ?? 7, R = rng(seed), Rn = rng(seed + 31), Rl = rng(seed + 77), sl1 = {}, sl2 = {};
    const pw0 = po.pw === undefined ? 0.5 : po.pw, slope24 = fl.slope === 24;
    const un = po.uni && po.uni.n > 1 && !(po.fmIndex > 0) && po.shape !== 'noise' ? po.uni : null, ux = [];
    if (un) for (let j = 1; j < un.n; j++) ux.push({ st: { ph: (j * 0.381966) % 1, tri: 0 }, r: 2 ** ((j & 1 ? 1 : -1) * (un.spread || 0) * Math.ceil(j / 2) / Math.ceil((un.n - 1) / 2) / 1200) });
    const uniNorm = un ? Math.sqrt(un.n) : 1;
    const s2 = { ph: 0, tri: 0 }, r2 = q2 ? 2 ** (((q2.detune || 0) + 1200 * (q2.oct || 0) + 100 * (q2.semi || 0)) / 1200) : 1, q2pw = q2 && q2.pw !== undefined ? q2.pw : 0.5;
    const fbase = fl.cutoff * (fl.keytrack ? 2 ** (fl.keytrack * (midi - 60) / 12) : 1) * (fl.velo ? 2 ** (fl.velo * (vel - 0.5)) : 1);
    const tg1 = L1.target, tg2 = L2 ? L2.target : '';
    for (let i = 0; i < n; i++) {
      const t = i / sr, lfo = !L1.shape || L1.shape === 'sine' ? Math.sin(TAU * L1.rate * t) : lfoWave(L1.shape, L1.rate * t, sl1, Rl), dep = L1.depth;
      const lfo2 = L2 ? lfoWave(L2.shape || 'sine', L2.rate * t, sl2, Rl) : 0, dep2 = L2 ? L2.depth : 0;
      const semi = (tg1 === 'pitch' ? dep * lfo : 0) + (tg2 === 'pitch' ? dep2 * lfo2 : 0), pitchMul = semi === 0 ? 1 : 2 ** (semi / 12);
      const pwNow = tg1 === 'pw' || tg2 === 'pw' ? Math.max(0.05, Math.min(0.95, pw0 + 0.4 * ((tg1 === 'pw' ? dep * lfo : 0) + (tg2 === 'pw' ? dep2 * lfo2 : 0)))) : pw0;
      let fr = f * pitchMul, dt = fr / sr;
      let v;
      if (po.fmIndex > 0) {   // FM: nosná fr, modulátor fr·ratio
        phm += fr * (po.fmRatio || 1) / sr; ph += dt;
        v = Math.sin(TAU * ph + po.fmIndex * Math.sin(TAU * phm));
      } else {
        ph += dt; ph -= Math.floor(ph);
        const sh = po.shape;
        if (sh === 'noise') v = R() * 2 - 1;
        else if (sh === 'saw') { v = 2 * ph - 1; if (po.blep) v -= polyblep(ph, dt); }
        else if (sh === 'square') { v = ph < pwNow ? 1 : -1; if (po.blep) { v += polyblep(ph, dt); v -= polyblep(pwNow === 0.5 ? (ph + 0.5) % 1 : (ph - pwNow + 1) % 1, dt); } }
        else if (sh === 'triangle') { if (po.blep) { let sq = ph < 0.5 ? 1 : -1; sq += polyblep(ph, dt); sq -= polyblep((ph + 0.5) % 1, dt); tri = dt * 4 * sq + (1 - 1e-4) * tri; v = tri; } else v = shape('triangle', ph); }
        else v = Math.sin(TAU * ph);
      }
      if (un) { let sum = v; for (let j = 0; j < ux.length; j++) sum += oscStep(ux[j].st, po.shape, dt * ux[j].r, pwNow, po.blep, R); v = sum / uniNorm; }
      if (q2) { const v2 = oscStep(s2, q2.shape || 'saw', bf * r2 * pitchMul / sr, q2pw, po.blep, Rn), l1 = po.level === undefined ? 1 : po.level; v = (v * l1 + v2 * q2.level) / Math.max(1, l1 + q2.level); }
      else if (po.level !== undefined) v *= po.level;
      if (po.noise > 0) v += po.noise * 0.5 * (Rn() * 2 - 1);
      if (po.sub) { phs += dt / 2; phs -= Math.floor(phs); v = (v + po.sub * (phs < 0.5 ? 1 : -1)) / (1 + po.sub); }
      if (fl.type !== 'off' && (i & 15) === 0) {
        const fe = adsr(t, gate, p.fenv), mod = fl.env * fe + (tg1 === 'cutoff' ? dep * lfo : 0) + (tg2 === 'cutoff' ? dep2 * lfo2 : 0);
        const cut = Math.min(sr * 0.45, Math.max(20, fbase * 2 ** mod));
        if (Math.abs(cut - last) > 0.5) { c = biquad(fl.type, cut, fl.q, sr); if (slope24) c2 = biquad(fl.type, cut, 0.7071, sr); last = cut; }
      }
      if (fl.type !== 'off' && c) {
        const o2 = c.b0 * v + st.z1; st.z1 = c.b1 * v - c.a1 * o2 + st.z2; st.z2 = c.b2 * v - c.a2 * o2; v = o2;
        if (c2) { const o3 = c2.b0 * v + st2.z1; st2.z1 = c2.b1 * v - c2.a1 * o3 + st2.z2; st2.z2 = c2.b2 * v - c2.a2 * o3; v = o3; }
      }
      if (p.drive > 0) { const g = 1 + p.drive * 8; v = Math.tanh(v * g) / Math.tanh(g); }
      let amp = adsr(t, gate, p.aenv) * (tg1 === 'amp' ? 1 - dep * (0.5 - 0.5 * lfo) : 1);
      if (tg2 === 'amp') amp *= 1 - dep2 * (0.5 - 0.5 * lfo2);
      out[i] = v * amp * vel * 0.5;
    }
    if (p.level !== undefined) for (let i = 0; i < n; i++) out[i] *= p.level;
    return out;
  }
  // zpožďovací linka se zpětnou vazbou (echo); wet 0…1
  function delayFx(x, sr, time, fb, wet) {
    const d = Math.max(1, Math.round(time * sr)), tail = Math.round(sr * Math.min(2.5, time * (1 + 4 * fb))), out = new Float32Array(x.length + (wet > 0 ? tail : 0)), buf = new Float32Array(d);
    let w = 0;
    for (let i = 0; i < out.length; i++) { const dry = i < x.length ? x[i] : 0, del = buf[w]; out[i] = dry + wet * del; buf[w] = dry + fb * del; w = (w + 1) % d; }
    return out;
  }
  // chorus: jedna modulovaná zpožďovací linka (15 ms ± hloubka·6 ms, lineární interpolace), výstup = dry + mix·wet (stejně jako paralelní větev živého řetězce)
  function chorusFx(x, sr, rate = 0.8, depth = 0.5, mix = 0.5) {
    const n = x.length, out = new Float32Array(n), base = 0.015 * sr, dev = depth * 0.006 * sr;
    for (let i = 0; i < n; i++) {
      const pos = i - (base + dev * Math.sin(TAU * rate * i / sr)), k = Math.floor(pos), fr = pos - k;
      const a = k >= 0 && k < n ? x[k] : 0, b = k + 1 >= 0 && k + 1 < n ? x[k + 1] : 0;
      out[i] = x[i] + mix * (a + (b - a) * fr);
    }
    return out;
  }
  // dozvuk (Schroeder–Moorer): 4 paralelní hřebenové filtry s útlumem vysokých (dolní propust ve zpětné vazbě) a 2 allpassy za sebou. Vrací jen mokrý signál,
  // délka vstupu + doznívání. Je to lineární časově neměnný systém, takže impulsní odezva (reverbIR) dá v ConvolverNode přesně totéž, co tady počítáme.
  const revTail = (size, sr) => Math.round(sr * Math.min(4.5, 0.4 + 4 * size * size));
  function reverbWet(x, sr, size = 0.5, damp = 0.5) {
    const sc = 0.6 + 0.9 * size, g = 0.7 + 0.2 * size, dm = Math.max(0, Math.min(0.95, damp));
    const combs = [0.0297, 0.0371, 0.0411, 0.0437].map((d) => ({ buf: new Float32Array(Math.max(8, Math.round(d * sc * sr))), w: 0, lp: 0 }));
    const aps = [0.005, 0.0017].map((d) => ({ buf: new Float32Array(Math.max(4, Math.round(d * sr))), w: 0 }));
    const n = x.length + revTail(size, sr), out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const inp = i < x.length ? x[i] : 0; let s = 0;
      for (let k = 0; k < combs.length; k++) { const cb = combs[k], y = cb.buf[cb.w]; cb.lp = y * (1 - dm) + cb.lp * dm; cb.buf[cb.w] = inp + g * cb.lp; cb.w = (cb.w + 1) % cb.buf.length; s += y; }
      s *= 0.25;
      for (let k = 0; k < aps.length; k++) { const ap = aps[k], bv = ap.buf[ap.w], y = -0.5 * s + bv; ap.buf[ap.w] = s + 0.5 * y; ap.w = (ap.w + 1) % ap.buf.length; s = y; }
      out[i] = s;
    }
    return out;
  }
  // impulsní odezva téhož dozvuku pro ConvolverNode (normalize = false)
  function reverbIR(sr, size = 0.5, damp = 0.5) { const imp = new Float32Array(1); imp[0] = 1; return reverbWet(imp, sr, size, damp); }
  // řetěz efektů po hlasu: chorus → delay → dozvuk (stejné pořadí jako živý řetěz v laboratoři Syntezátor)
  function fxChain(x, sr, p) {
    let y = x;
    if (p.chorus && p.chorus.mix > 0) y = chorusFx(y, sr, p.chorus.rate, p.chorus.depth, p.chorus.mix);
    if (p.delay && p.delay.wet > 0) y = delayFx(y, sr, p.delay.time, Math.min(0.9, p.delay.fb), p.delay.wet);
    if (p.reverb && p.reverb.wet > 0) { const w = reverbWet(y, sr, p.reverb.size, p.reverb.damp), out = new Float32Array(w.length); for (let i = 0; i < w.length; i++) out[i] = (i < y.length ? y[i] : 0) + p.reverb.wet * w[i]; y = out; }
    return y;
  }
  // soft limiter proti přebuzení při exportu a poslechu
  function softLimit(x, ceil = 0.89) { for (let i = 0; i < x.length; i++) x[i] = ceil * Math.tanh(x[i] / ceil); return x; }

  // =============================================================== ladění, intervaly, disonance
  const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const noteName = (m) => NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  // intervaly: půltóny, čistý poměr (just intonation), klíč názvu
  const INTERVALS = [
    { st: 0, r: [1, 1], k: 'unison' }, { st: 1, r: [16, 15], k: 'm2' }, { st: 2, r: [9, 8], k: 'M2' }, { st: 3, r: [6, 5], k: 'm3' },
    { st: 4, r: [5, 4], k: 'M3' }, { st: 5, r: [4, 3], k: 'P4' }, { st: 6, r: [45, 32], k: 'tt' }, { st: 7, r: [3, 2], k: 'P5' },
    { st: 8, r: [8, 5], k: 'm6' }, { st: 9, r: [5, 3], k: 'M6' }, { st: 10, r: [9, 5], k: 'm7' }, { st: 11, r: [15, 8], k: 'M7' }, { st: 12, r: [2, 1], k: 'P8' },
  ];
  const cents = (ratio) => 1200 * Math.log2(ratio);
  const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], pentatonic: [0, 2, 4, 7, 9], blues: [0, 3, 5, 6, 7, 10], chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], whole: [0, 2, 4, 6, 8, 10] };
  const CHORDS = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], maj7: [0, 4, 7, 11], dom7: [0, 4, 7, 10], sus4: [0, 5, 7] };
  // disonance dvou sinusovek podle Plomp–Levelta (parametrizace Sethares): součet přes všechny dvojice částečných tónů
  function pairRoughness(f1, a1, f2, a2) {
    const fl = Math.min(f1, f2), s = 0.24 / (0.0207 * fl + 18.96), d = Math.abs(f2 - f1);
    return a1 * a2 * (Math.exp(-3.5 * s * d) - Math.exp(-5.75 * s * d));
  }
  function roughness(partials) {   // partials: [{ f, a }]
    let r = 0; for (let i = 0; i < partials.length; i++) for (let j = i + 1; j < partials.length; j++) r += pairRoughness(partials[i].f, partials[i].a, partials[j].f, partials[j].a);
    return r;
  }
  function tonePartials(f, nh = 6, decay = 0.88, ratios) { return Array.from({ length: nh }, (_, h) => ({ f: f * (ratios ? ratios[h] : h + 1), a: decay ** h })); }
  // křivka disonance dvou složených tónů pro poměr ρ v rozsahu lo…hi
  function dissonanceCurve(f0, nh, lo = 1, hi = 2.05, n = 400, decay = 0.88, ratios) {
    const base = tonePartials(f0, nh, decay, ratios), out = [];
    for (let i = 0; i <= n; i++) { const rho = lo + (hi - lo) * i / n; out.push([rho, roughness(base.concat(tonePartials(f0 * rho, nh, decay, ratios)))]); }
    return out;
  }

  // =============================================================== mikrofonní pole (úzkopásmový delay-and-sum)
  function micArray(kind, n, d, cx = 0, cy = 0) {
    const out = [];
    if (kind === 'circle') { const R = d * n / TAU; for (let i = 0; i < n; i++) out.push([cx + R * Math.cos(TAU * i / n), cy + R * Math.sin(TAU * i / n)]); }
    else if (kind === 'random') { const R = rng(11), L = d * (n - 1); for (let i = 0; i < n; i++) out.push([cx + (R() - 0.5) * L, cy + (R() - 0.5) * L * 0.5]); }
    else { for (let i = 0; i < n; i++) out.push([cx + (i - (n - 1) / 2) * d, cy]); }
    return out;
  }
  // zdroje [{ x, y, f, a, ph }]; stěna x = wall.x s činitelem odrazu wall.r přidá zdroje-obrazy. Vrací komplexní fázory na mikrofonech.
  function micSignals(mics, sources, f, o = {}) {
    const c = o.c || 343, k = TAU * f / c, R = rng(o.seed ?? 5), noise = o.noise || 0, rs = [];
    sources.forEach((s) => {
      if (Math.abs(s.f - f) > 1e-6 && !o.anyFreq) return;
      rs.push({ x: s.x, y: s.y, a: s.a ?? 1, ph: s.ph || 0 });
      if (o.wall) rs.push({ x: 2 * o.wall.x - s.x, y: s.y, a: (s.a ?? 1) * o.wall.r, ph: (s.ph || 0) + Math.PI });
    });
    return mics.map((m) => {
      let re = 0, im = 0;
      rs.forEach((s) => { const r = Math.max(0.05, Math.hypot(m[0] - s.x, m[1] - s.y)), ph = -k * r + s.ph; re += s.a / r * Math.cos(ph); im += s.a / r * Math.sin(ph); });
      return [re + noise * R.gauss(), im + noise * R.gauss()];
    });
  }
  // mapa výkonu B(x,y) = |Σ conj(steer_m)·p_m|² / M²; steer = e^{−jk r_m} (jen fáze, bez korekce 1/r)
  function beamMap(mics, sig, f, grid, c = 343) {
    const k = TAU * f / c, { x0, x1, y0, y1, nx, ny } = grid, map = new Float32Array(nx * ny), M = mics.length;
    let max = 0, ai = 0;
    for (let j = 0; j < ny; j++) {
      const y = y0 + (y1 - y0) * (j + 0.5) / ny;
      for (let i = 0; i < nx; i++) {
        const x = x0 + (x1 - x0) * (i + 0.5) / nx; let re = 0, im = 0;
        for (let m = 0; m < M; m++) {
          const r = Math.hypot(x - mics[m][0], y - mics[m][1]), ph = k * r, cs = Math.cos(ph), sn = Math.sin(ph);   // conj(e^{−jφ}) = e^{+jφ}
          re += sig[m][0] * cs - sig[m][1] * sn; im += sig[m][0] * sn + sig[m][1] * cs;
        }
        const v = (re * re + im * im) / (M * M); map[j * nx + i] = v; if (v > max) { max = v; ai = j * nx + i; }
      }
    }
    return { map, max, x: x0 + (x1 - x0) * ((ai % nx) + 0.5) / nx, y: y0 + (y1 - y0) * (Math.floor(ai / nx) + 0.5) / ny };
  }
  // prostorový aliasing: rozteč větší než λ/2 vytváří falešné laloky
  const spatialAliasing = (d, f, c = 343) => d > c / (2 * f);

  // =============================================================== místnost (metoda zdrojů-obrazů, kvádr)
  const sabine = (V, Sa, alpha) => 0.161 * V / Math.max(1e-9, Sa * alpha);
  const eyring = (V, Sa, alpha) => 0.161 * V / (-Sa * Math.log(1 - Math.min(0.999, alpha)));
  function roomDims(r) { const V = r.lx * r.ly * r.lz, Sa = 2 * (r.lx * r.ly + r.lx * r.lz + r.ly * r.lz); return { V, S: Sa }; }
  // IR z obrazů do řádu daného časem tmax; stejná pohltivost alpha na všech stěnách (činitel odrazu β = √(1−α))
  function roomIR(room, src, rcv, alpha, sr, tmax = 0.8, c = 343) {
    const beta = Math.sqrt(1 - Math.min(0.999, alpha)), n = Math.round(tmax * sr), ir = new Float32Array(n), dims = [room.lx, room.ly, room.lz];
    const N = dims.map((L) => Math.ceil(c * tmax / (2 * L)) + 1);
    let count = 0;
    for (let nx = -N[0]; nx <= N[0]; nx++) for (let px = 0; px < 2; px++) {
      const X = (1 - 2 * px) * src[0] + 2 * nx * dims[0] - rcv[0], bx = Math.abs(nx - px) + Math.abs(nx);
      if (Math.abs(X) > c * tmax) continue;
      for (let ny = -N[1]; ny <= N[1]; ny++) for (let py = 0; py < 2; py++) {
        const Y = (1 - 2 * py) * src[1] + 2 * ny * dims[1] - rcv[1], by = bx + Math.abs(ny - py) + Math.abs(ny);
        if (Math.hypot(X, Y) > c * tmax) continue;
        for (let nz = -N[2]; nz <= N[2]; nz++) for (let pz = 0; pz < 2; pz++) {
          const Z = (1 - 2 * pz) * src[2] + 2 * nz * dims[2] - rcv[2], r = Math.hypot(X, Y, Z);
          if (r > c * tmax) continue;
          const hits = by + Math.abs(nz - pz) + Math.abs(nz), idx = Math.round(r / c * sr);
          // „randomizované“ obrazy (Peterson): od 2. odrazu má obraz náhodné znaménko, jinak by se desítky obrazů v jednom vzorku
          // sčítaly souhlasně (energie ∝ N² místo N) a odezva by se zdánlivě protáhla. První odrazy zůstávají věrné.
          let sg = 1; if (hits >= 2) { let h = (nx * 73856093) ^ (ny * 19349663) ^ (nz * 83492791) ^ (px * 2654435761) ^ (py * 40503) ^ (pz * 9176); h = Math.imul(h ^ (h >>> 13), 0x5bd1e995); sg = (h >>> 7) & 1 ? 1 : -1; }
          if (idx < n) { ir[idx] += sg * beta ** hits / Math.max(r, 0.1); count++; }
        }
      }
    }
    return { ir, count };
  }
  // RT60 z impulsní odezvy: Schroederův zpětný integrál, sklon mezi −5 a −25 dB (T20) × 3; null, když odezva nedoběhne
  function rt60FromIR(ir, sr) {
    const n = ir.length, E = new Float64Array(n); let s = 0;
    for (let i = n - 1; i >= 0; i--) { s += ir[i] * ir[i]; E[i] = s; }
    const db = (i) => 10 * Math.log10(Math.max(E[i], 1e-30) / E[0]);
    let i5 = -1, i25 = -1;
    for (let i = 0; i < n; i++) { const d = db(i); if (i5 < 0 && d <= -5) i5 = i; if (i25 < 0 && d <= -25) { i25 = i; break; } }
    if (i5 < 0 || i25 < 0 || i25 <= i5) return null;
    return 3 * (i25 - i5) / sr;
  }
  function schroederDb(ir, step = 1) {
    const n = ir.length, E = new Float64Array(n); let s = 0;
    for (let i = n - 1; i >= 0; i--) { s += ir[i] * ir[i]; E[i] = s; }
    const out = []; for (let i = 0; i < n; i += step) out.push(10 * Math.log10(Math.max(E[i], 1e-30) / E[0]));
    return out;
  }
  // konvoluce (přímá, pro krátké odezvy do pár tisíc vzorků; delší jde přes FFT)
  function convolve(x, h) {
    const n = x.length + h.length - 1; let m = 1; while (m < n) m *= 2;
    const ar = new Float64Array(m), ai = new Float64Array(m), br = new Float64Array(m), bi = new Float64Array(m);
    ar.set(x); br.set(h); fft(ar, ai); fft(br, bi);
    for (let i = 0; i < m; i++) { const r = ar[i] * br[i] - ai[i] * bi[i], im = ar[i] * bi[i] + ai[i] * br[i]; ar[i] = r; ai[i] = -im; }
    fft(ar, ai);   // conj trick: IFFT = conj(FFT(conj))/m
    const out = new Float32Array(n); for (let i = 0; i < n; i++) out[i] = ar[i] / m;
    return out;
  }

  // =============================================================== binaurální vodítka
  // ITD podle Woodwarda; az = úhel zdroje od směru dopředu (rad, 0 = přímo před, +π/2 = vpravo)
  function itd(az, a = 0.0875, c = 343) { let th = Math.asin(Math.sin(az)); return (a / c) * (th + Math.sin(th)); }
  // ILD: ilustrativní model stínění hlavou (roste s frekvencí a boční polohou); není to měření ani hotová HRTF
  function ild(az, f) { return Math.min(20, 8 * Math.sin(az) * Math.sqrt(Math.max(f, 100) / 1000)); }

  // =============================================================== rytmus
  const gcd = (a, b) => (b ? gcd(b, a % b) : a), lcm = (a, b) => a / gcd(a, b) * b;
  // Euklidovský rytmus: k úderů rovnoměrně na n dobách (Bjorklund přes zaokrouhlení)
  function euclid(k, n) { const out = new Array(n).fill(0); for (let i = 0; i < k; i++) out[Math.floor(i * n / k)] = 1; return out; }

  // =============================================================== WAV
  function wavBytes(x, sr, y) {   // y (volitelně) = pravý kanál → stereo; jinak mono
    const n = x.length, ch = y ? 2 : 1, buf = new ArrayBuffer(44 + n * 2 * ch), v = new DataView(buf), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2 * ch, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2 * ch, true); v.setUint16(32, 2 * ch, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2 * ch, true);
    const q = (a) => Math.round(Math.max(-1, Math.min(1, a)) * 32767);
    for (let i = 0; i < n; i++) { v.setInt16(44 + i * 2 * ch, q(x[i]), true); if (y) v.setInt16(46 + i * 4, q(y[i]), true); }
    return buf;
  }

  Object.assign(S, {
    TAU, rng, fft, spectrum, toDb, peaks, rms, peakAbs, aWeightDb, shape, polyblep, osc, aliasOf, sawPartials, idealOsc, aliasErrorDb, additive, HARM, normalizeAmps, fm, besselJ, fmSidebands,
    adsr, biquad, biquadResp, biquadPoles, biquadStable, biquadRun, midiFreq, DEFAULT_PATCH, renderVoice, delayFx, chorusFx, reverbWet, reverbIR, fxChain, lfoWave, softLimit,
    NOTE_NAMES, noteName, INTERVALS, cents, SCALES, CHORDS, pairRoughness, roughness, tonePartials, dissonanceCurve,
    micArray, micSignals, beamMap, spatialAliasing, sabine, eyring, roomDims, roomIR, rt60FromIR, schroederDb, convolve, itd, ild, gcd, lcm, euclid, wavBytes,
  });
  if (typeof module !== 'undefined') module.exports = S;
})();

