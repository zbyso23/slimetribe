
/*
 * Game · zvukové efekty ze syntaku se 2 oscilátory (bez DOM, běží i v Node). Jmenný prostor GAME.Sfx.
 * Žádné vzorky: efekt je malý objekt (patch) a PCM se vypočítá. Stejný název + seed + parametry = stejný zvuk bit po bitu.
 *
 *   GAME.Sfx.NAMES                                   jména receptů: shoot laser boom bomb fuse hit punch swing hurt die jump coin powerup select step lose win open glitch pop click
 *   GAME.Sfx.make(name, seed, { size, pitch, len, rough })  → patch   recept + seed + 4 jednoduché parametry (čistá funkce)
 *        size 0…1 (velké = hlubší a delší, výchozí 0,5) · pitch −24…24 půltónů · len 0,25…3× délka · rough 0…1 (bitcrush + zkreslení)
 *   GAME.Sfx.sanitize(patch)                         → čistý patch (cizí JSON nic nerozbije; neznámé klíče zahodí, čísla ořízne)
 *   GAME.Sfx.render(patch, sr = 22050)               → { pcm: Float32Array, sr, seconds, info }   info = { peakRaw, clipped, fmax, fmin, nyquist, aliasHz, inaudible }
 *   GAME.Sfx.get(name, seed, params, sr, cache)      → render + malá paměť (Map); vrací stejný objekt jako render
 *   GAME.Sfx.pitchAt(patch, t) · GAME.Sfx.hash(pcm)  → průběh výšky v Hz · otisk PCM (FNV-1a z 16bitových vzorků)
 *
 * Patch: { f (Hz základní), len (s), slide (oktávy za celou délku, záporné = klesá), curve (−1…1),
 *          o1 { shape square|saw|tri|sine|noise, pw (střída 0,05…0,95), semi, cents }, o2 { …totéž, level 0…1 (0 = vypnutý) },
 *          mix add|fm|ring, arp { steps:[půltóny], rate (kroků/s) }, vib { rate, depth (půltóny) },
 *          env { a, d, s, r } (s hladina 0…1), lp { cut (Hz, 0 = vypnuto), sweep (oktávy), q }, crush { bits (0 = vypnuto), hold },
 *          drive, vol, seed }
 * Meze, které modul říká nahlas: oscilátory square/saw jsou pásmově omezené (PolyBLEP) jen do Nyquista; nad ním se zvuk překládá (aliasing)
 * a render to hlásí v info.aliasHz. FM režim používá holé tvary bez PolyBLEPu. Součet oscilátorů může přesáhnout plný rozsah (info.clipped);
 * výstup pak drží měkký limiter, ale zkreslení zůstane. Délka je nejvýš 2,5 s.
 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const G = root.GAME = root.GAME || {};
  const SR = 22050, MAXLEN = 2.5, TAU = Math.PI * 2, CEIL = 0.89;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const fail = (code, params) => { throw (G.Error ? new G.Error(code, params) : new Error(code)); };
  const SHAPES = ['square', 'saw', 'tri', 'sine', 'noise'], MIXES = ['add', 'fm', 'ring'];

  function rng(seed) {   // mulberry32, stejný jako SND.rng i G.rng (nezávislý, aby modul běžel sám)
    let a = (seed | 0) >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // ------------------------------------------------------------------ model
  const DEF = () => ({
    f: 440, len: 0.25, slide: 0, curve: 0,
    o1: { shape: 'square', pw: 0.5, semi: 0, cents: 0 }, o2: { shape: 'square', pw: 0.5, semi: 0, cents: 0, level: 0 }, mix: 'add',
    arp: { steps: [0], rate: 12 }, vib: { rate: 6, depth: 0 },
    env: { a: 0.002, d: 0.1, s: 0.5, r: 0.05 }, lp: { cut: 0, sweep: 0, q: 0.7 }, crush: { bits: 0, hold: 1 },
    drive: 0, vol: 0.8, seed: 1,
  });
  const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
  function sanitize(p) {
    if (!isObj(p)) fail('badSfx');
    const d = DEF(), num = (v, a, b, def) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : def);
    const osc = (o, def) => { const q = isObj(o) ? o : {}; return { shape: SHAPES.includes(q.shape) ? q.shape : def.shape, pw: num(q.pw, 0.05, 0.95, def.pw), semi: num(q.semi, -48, 48, def.semi), cents: num(q.cents, -100, 100, def.cents) }; };
    const o = { f: num(p.f, 20, 12000, d.f), len: num(p.len, 0.02, MAXLEN, d.len), slide: num(p.slide, -6, 6, d.slide), curve: num(p.curve, -1, 1, d.curve) };
    o.o1 = osc(p.o1, d.o1); o.o2 = Object.assign(osc(p.o2, d.o2), { level: num(isObj(p.o2) ? p.o2.level : undefined, 0, 1, d.o2.level) });
    o.mix = MIXES.includes(p.mix) ? p.mix : d.mix;
    const a = isObj(p.arp) ? p.arp : {};
    o.arp = { steps: Array.isArray(a.steps) && a.steps.length ? a.steps.slice(0, 8).map((s) => Math.round(num(s, -48, 48, 0))) : [0], rate: num(a.rate, 1, 60, d.arp.rate) };
    const v = isObj(p.vib) ? p.vib : {}; o.vib = { rate: num(v.rate, 0, 30, d.vib.rate), depth: num(v.depth, 0, 4, d.vib.depth) };
    const e = isObj(p.env) ? p.env : {}; o.env = { a: num(e.a, 0, 1, d.env.a), d: num(e.d, 0, 2.5, d.env.d), s: num(e.s, 0, 1, d.env.s), r: num(e.r, 0, 1, d.env.r) };
    const l = isObj(p.lp) ? p.lp : {}; o.lp = { cut: l.cut === 0 ? 0 : num(l.cut, 40, 16000, 0), sweep: num(l.sweep, -6, 6, 0), q: num(l.q, 0.3, 8, d.lp.q) };
    const c = isObj(p.crush) ? p.crush : {}; o.crush = { bits: c.bits ? Math.round(num(c.bits, 2, 14, 0)) : 0, hold: Math.round(num(c.hold, 1, 32, 1)) };
    o.drive = num(p.drive, 0, 1, 0); o.vol = num(p.vol, 0, 1, d.vol); o.seed = Math.round(num(p.seed, 0, 2147483647, 1));
    return o;
  }

  // ------------------------------------------------------------------ výška v čase
  const warp = (u, c) => (c >= 0 ? 1 - (1 - u) ** (1 + 2 * c) : u ** (1 - 2 * c));   // c > 0: změna je rychlá na začátku, c < 0: na konci
  function arpAt(a, t) { const i = Math.min(a.steps.length - 1, Math.floor(t * a.rate)); return a.steps[i]; }
  // základní kmitočet (Hz) v čase t před posunem oscilátorů o semi/cents
  function pitchAt(p, t) {
    const u = clamp(t / p.len, 0, 1), semis = p.slide * 12 * warp(u, p.curve) + arpAt(p.arp, t) + (p.vib.depth ? p.vib.depth * Math.sin(TAU * p.vib.rate * t) : 0);
    return p.f * 2 ** (semis / 12);
  }
  const oscHz = (f, o) => f * 2 ** (o.semi / 12 + o.cents / 1200);

  // ------------------------------------------------------------------ oscilátor
  function polyblep(ph, dt) {
    if (dt > 0.5) dt = 0.5;
    if (ph < dt) { const x = ph / dt; return 2 * x - x * x - 1; }
    if (ph > 1 - dt) { const x = (ph - 1) / dt; return x * x + 2 * x + 1; }
    return 0;
  }
  function wave(shape, ph, dt, pw, st, blep) {   // st: stav šumu { v, R }
    switch (shape) {
      case 'sine': return Math.sin(TAU * ph);
      case 'tri': return 4 * Math.abs(ph - 0.5) - 1;
      case 'saw': return 2 * ph - 1 - (blep ? polyblep(ph, dt) : 0);
      case 'square': { let v = ph < pw ? 1 : -1; if (blep) { v += polyblep(ph, dt); v -= polyblep((ph + 1 - pw) % 1, dt); } return v; }
      default: return st.v;   // noise: drží náhodnou hodnotu a mění ji při každém oběhu fáze, takže „výška“ šumu řídí jeho barvu
    }
  }
  function biquadLP(fc, q, sr) {
    const w = TAU * fc / sr, c = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al;
    return { b0: (1 - c) / 2 / a0, b1: (1 - c) / a0, b2: (1 - c) / 2 / a0, a1: -2 * c / a0, a2: (1 - al) / a0 };
  }

  // ------------------------------------------------------------------ render
  function render(patch, sr = SR) {
    const p = sanitize(patch), n = Math.max(1, Math.round(p.len * sr)), out = new Float32Array(n), R = rng(p.seed);
    const nz1 = { v: R() * 2 - 1 }, nz2 = { v: R() * 2 - 1 };
    const fm = p.mix === 'fm', blep = !fm, lvl = p.o2.level, env = p.env, r = Math.min(env.r, p.len), tr = p.len - r;
    let ph1 = 0, ph2 = 0, z1 = 0, z2 = 0, c = null, lastCut = -1, hv = 0, peak = 0, fmax = 0, fmin = Infinity;
    for (let i = 0; i < n; i++) {
      const t = i / sr, f = pitchAt(p, t), f1 = oscHz(f, p.o1), f2 = oscHz(f, p.o2), d1 = f1 / sr, d2 = f2 / sr;
      if (p.o1.shape !== 'noise') { fmax = Math.max(fmax, f1); fmin = Math.min(fmin, f1); }   // u šumu je „kmitočet“ jen rychlost změn, ne tón
      if (lvl > 0 && p.o2.shape !== 'noise') { fmax = Math.max(fmax, f2); fmin = Math.min(fmin, f2); }
      ph1 += d1; if (ph1 >= 1) { ph1 -= Math.floor(ph1); if (p.o1.shape === 'noise') nz1.v = R() * 2 - 1; }
      ph2 += d2; if (ph2 >= 1) { ph2 -= Math.floor(ph2); if (p.o2.shape === 'noise') nz2.v = R() * 2 - 1; }
      let v;
      if (lvl <= 0) v = wave(p.o1.shape, ph1, d1, p.o1.pw, nz1, blep);
      else {
        const b = wave(p.o2.shape, ph2, d2, p.o2.pw, nz2, blep);
        if (fm) { let q = ph1 + lvl * 0.5 * b; q -= Math.floor(q); v = wave(p.o1.shape, q, d1, p.o1.pw, nz1, false); }
        else {
          const a = wave(p.o1.shape, ph1, d1, p.o1.pw, nz1, blep);
          v = p.mix === 'ring' ? a * (1 - lvl) + a * b * lvl : (a + b * lvl) / (1 + lvl);
        }
      }
      if (p.lp.cut > 0) {
        if ((i & 15) === 0) { const cut = clamp(p.lp.cut * 2 ** (p.lp.sweep * i / n), 40, sr * 0.45); if (Math.abs(cut - lastCut) > 0.5) { c = biquadLP(cut, p.lp.q, sr); lastCut = cut; } }
        const y = c.b0 * v + z1; z1 = c.b1 * v - c.a1 * y + z2; z2 = c.b2 * v - c.a2 * y; v = y;
      }
      if (p.crush.hold > 1) { if (i % p.crush.hold === 0) hv = v; v = hv; }
      if (p.crush.bits) { const q = 2 ** (1 - p.crush.bits); v = Math.round(v / q) * q; }
      if (p.drive > 0) { const g = 1 + p.drive * 8; v = Math.tanh(v * g) / Math.tanh(g); }
      let amp = t < env.a ? t / env.a : t < env.a + env.d ? 1 - (1 - env.s) * (t - env.a) / env.d : env.s;
      if (t > tr) amp *= Math.max(0, (p.len - t) / (r || 1e-9));
      const y = v * amp * p.vol * 0.75; out[i] = y; const ay = Math.abs(y); if (ay > peak) peak = ay;
    }
    for (let i = 0; i < n; i++) out[i] = CEIL * Math.tanh(out[i] / CEIL);
    const nyq = sr / 2, alias = fmax > nyq ? Math.abs(fmax - Math.round(fmax / sr) * sr) : 0;
    return { pcm: out, sr, seconds: n / sr, info: { peakRaw: peak, clipped: peak > 1, fmax, fmin: isFinite(fmin) ? fmin : 0, nyquist: nyq, aliasHz: alias, inaudible: fmax > 20000 || (isFinite(fmin) && fmin < 20) } };
  }

  // ------------------------------------------------------------------ recepty: název + seed + parametry → patch
  // Každý recept má pevný charakter a seed mění detaily (výšku, střídu, druhý oscilátor, rychlost), takže dvě střely znějí příbuzně, ale ne stejně.
  const RECIPES = {
    shoot: (U) => ({ f: U(760, 1150), len: 0.15, slide: -U(1.2, 2.2), curve: 0.5, o1: { shape: 'square', pw: U(0.2, 0.5) }, o2: { shape: 'saw', semi: U(-1, 1) > 0 ? 12 : 7, level: U(0.25, 0.45) }, env: { a: 0.001, d: 0.12, s: 0, r: 0.02 } }),
    laser: (U) => ({ f: U(1500, 2300), len: 0.28, slide: -U(2.4, 3.4), curve: 0.4, o1: { shape: 'saw' }, o2: { shape: 'sine', semi: 0, level: U(0.4, 0.7) }, mix: 'fm', vib: { rate: U(30, 50), depth: 0.5 }, env: { a: 0.001, d: 0.24, s: 0.1, r: 0.03 } }),
    boom: (U) => ({ f: U(520, 760), len: 0.8, slide: -U(1.5, 2.5), curve: 0.2, o1: { shape: 'noise' }, o2: { shape: 'sine', semi: -24, level: 0.5 }, lp: { cut: U(2200, 3200), sweep: -4.5, q: 1 }, env: { a: 0.002, d: 0.7, s: 0, r: 0.1 }, drive: 0.3 }),
    bomb: (U) => ({ f: U(260, 380), len: 1.25, slide: -U(1.8, 2.8), curve: 0.1, o1: { shape: 'noise' }, o2: { shape: 'sine', semi: -12, level: 0.8 }, lp: { cut: U(1500, 2200), sweep: -4, q: 1.2 }, env: { a: 0.003, d: 1.1, s: 0, r: 0.15 }, drive: 0.45 }),
    fuse: (U) => ({ f: U(2600, 3800), len: 0.4, o1: { shape: 'noise' }, o2: { shape: 'square', semi: 12, level: 0.15 }, vib: { rate: U(25, 40), depth: 1.5 }, lp: { cut: 6500, sweep: 0, q: 0.8 }, env: { a: 0.02, d: 0, s: 0.6, r: 0.1 }, vol: 0.5 }),
    hit: (U) => ({ f: U(900, 1500), len: 0.13, slide: -1, o1: { shape: 'noise' }, o2: { shape: 'sine', semi: -12, level: 0.6 }, env: { a: 0.001, d: 0.1, s: 0, r: 0.02 } }),
    punch: (U) => ({ f: U(180, 260), len: 0.17, slide: -U(2, 3), curve: 0.6, o1: { shape: 'tri' }, o2: { shape: 'noise', level: 0.45 }, env: { a: 0.001, d: 0.14, s: 0, r: 0.02 }, drive: 0.2 }),
    swing: (U) => ({ f: U(1800, 2600), len: 0.24, o1: { shape: 'noise' }, lp: { cut: 450, sweep: U(2.6, 3.4), q: 2 }, env: { a: 0.07, d: 0.1, s: 0.55, r: 0.07 }, vol: 0.6 }),
    hurt: (U) => ({ f: U(280, 380), len: 0.32, slide: -U(0.8, 1.4), o1: { shape: 'saw' }, o2: { shape: 'square', semi: -12, level: 0.5 }, vib: { rate: U(22, 30), depth: 0.9 }, env: { a: 0.002, d: 0.28, s: 0.2, r: 0.04 } }),
    die: (U) => ({ f: U(480, 620), len: 0.95, slide: -U(2.6, 3.4), curve: -0.2, o1: { shape: 'square', pw: 0.4 }, o2: { shape: 'tri', semi: -12, level: 0.4 }, vib: { rate: U(7, 10), depth: 1 }, env: { a: 0.002, d: 0.85, s: 0.2, r: 0.1 } }),
    jump: (U) => ({ f: U(270, 380), len: 0.2, slide: U(0.9, 1.4), curve: 0.4, o1: { shape: 'square', pw: 0.5 }, o2: { shape: 'tri', semi: -12, level: 0.4 }, env: { a: 0.002, d: 0.16, s: 0.1, r: 0.03 } }),
    coin: (U) => ({ f: 988, len: 0.32, arp: { steps: [0, 12], rate: U(11, 14) }, o1: { shape: 'square', pw: U(0.25, 0.5) }, o2: { shape: 'square', semi: 12, level: 0.25 }, env: { a: 0.001, d: 0.26, s: 0.25, r: 0.06 } }),
    powerup: (U) => ({ f: U(300, 360), len: 0.5, arp: { steps: [0, 4, 7, 12, 16, 19], rate: U(17, 22) }, o1: { shape: 'square', pw: 0.5 }, o2: { shape: 'tri', semi: 0, level: 0.4 }, vib: { rate: 8, depth: 0.15 }, env: { a: 0.002, d: 0.4, s: 0.35, r: 0.08 } }),
    select: (U) => ({ f: U(680, 900), len: 0.07, arp: { steps: [0, 5], rate: 22 }, o1: { shape: 'square', pw: 0.5 }, env: { a: 0.001, d: 0.06, s: 0, r: 0.01 }, vol: 0.6 }),
    step: (U) => ({ f: U(300, 520), len: 0.06, slide: -1, o1: { shape: 'noise' }, lp: { cut: 900, sweep: 0, q: 0.8 }, env: { a: 0.001, d: 0.05, s: 0, r: 0.01 }, vol: 0.45 }),
    lose: (U) => ({ f: U(300, 340), len: 0.95, arp: { steps: [7, 3, 0, -5], rate: U(4.5, 5.5) }, o1: { shape: 'square', pw: 0.5 }, o2: { shape: 'tri', semi: -12, level: 0.5 }, vib: { rate: 6, depth: 0.25 }, env: { a: 0.004, d: 0.9, s: 0.4, r: 0.1 } }),
    win: (U) => ({ f: U(260, 300), len: 1.0, arp: { steps: [0, 4, 7, 12, 7, 12, 16], rate: U(8, 10) }, o1: { shape: 'square', pw: 0.5 }, o2: { shape: 'saw', semi: 12, level: 0.3 }, vib: { rate: 6, depth: 0.2 }, env: { a: 0.003, d: 0.8, s: 0.5, r: 0.15 } }),
    open: (U) => ({ f: U(300, 400), len: 0.28, slide: U(0.7, 1.2), o1: { shape: 'sine' }, o2: { shape: 'sine', semi: 7, level: 0.5 }, mix: 'fm', env: { a: 0.01, d: 0.2, s: 0.2, r: 0.06 }, vol: 0.7 }),
    glitch: (U) => ({ f: U(400, 900), len: 0.26, arp: { steps: [0, 5, -7, 12, -3, 9, -12, 4].map((s) => s + Math.round(U(-2, 2))), rate: U(34, 48) }, o1: { shape: 'square', pw: U(0.1, 0.5) }, o2: { shape: 'noise', level: 0.3 }, crush: { bits: 4, hold: 3 }, env: { a: 0.001, d: 0.22, s: 0.3, r: 0.03 }, vol: 0.6 }),
    pop: (U) => ({ f: U(600, 820), len: 0.08, slide: -1.2, curve: 0.5, o1: { shape: 'sine' }, env: { a: 0.001, d: 0.07, s: 0, r: 0.01 }, vol: 0.8 }),
    click: (U) => ({ f: U(1600, 2200), len: 0.022, o1: { shape: 'square', pw: 0.5 }, env: { a: 0.0005, d: 0.02, s: 0, r: 0.002 }, vol: 0.5 }),
  };
  const NAMES = Object.keys(RECIPES);

  function merge(base, over) {   // mělké sloučení po podobjektech (o1, o2, arp, vib, env, lp, crush)
    const o = Object.assign({}, base);
    Object.keys(over).forEach((k) => { o[k] = isObj(over[k]) && isObj(base[k]) ? Object.assign({}, base[k], over[k]) : over[k]; });
    return o;
  }
  function make(name, seed = 1, params = {}) {
    if (!RECIPES[name]) fail('badSfx');
    const R = rng((Math.imul(seed | 0, 2654435761) ^ (NAMES.indexOf(name) * 40503 + 17)) >>> 0), U = (a, b) => a + (b - a) * R();
    const q = isObj(params) ? params : {}, num = (v, a, b, d) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : d);
    const size = num(q.size, 0, 1, 0.5), pitch = num(q.pitch, -24, 24, 0), lenK = num(q.len, 0.25, 3, 1), rough = num(q.rough, 0, 1, 0);
    const p = merge(DEF(), RECIPES[name](U));
    p.f *= 2 ** (((0.5 - size) * 12 + pitch) / 12);
    p.len = Math.min(MAXLEN, p.len * lenK * 2 ** ((size - 0.5) * 1.2));
    if (rough > 0) {
      const bits = Math.round(10 - 7 * rough), hold = 1 + Math.floor(rough * 3);
      p.crush = { bits: p.crush.bits ? Math.min(p.crush.bits, bits) : bits, hold: Math.max(p.crush.hold, hold) }; p.drive = Math.min(1, p.drive + rough * 0.5);
    }
    p.seed = ((seed | 0) >>> 0) % 2147483647;
    return sanitize(p);
  }

  function get(name, seed = 1, params = {}, sr = SR, cache = null) {
    const q = isObj(params) ? params : {}, key = [name, seed, q.size, q.pitch, q.len, q.rough, sr].join('|');
    const make1 = () => render(make(name, seed, q), sr);
    if (!cache) return make1();
    let v = cache.get(key); if (!v) { if (cache.size >= 160) cache.clear(); v = make1(); cache.set(key, v); }
    return v;
  }
  function hash(pcm) { let h = 0x811c9dc5; for (let i = 0; i < pcm.length; i++) { const v = Math.round(clamp(pcm[i], -1, 1) * 32767) & 0xffff; h = Math.imul(h ^ (v & 255), 16777619); h = Math.imul(h ^ (v >> 8), 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); }
  // kam se kmitočet f přeloží při vzorkování sr (aliasing): nejbližší násobek sr odečíst
  const aliasOf = (f, sr = SR) => Math.abs(f - Math.round(f / sr) * sr);
  // SNR kvantování na N bitů pro plný sinus: 6,02·N + 1,76 dB
  const snrDb = (bits) => 6.02 * bits + 1.76;

  // zvuková knihovna (snd/snd-library.js): vestavěné efekty dostanou ID builtin.sfx.<jméno> (data jen odkaz na recept), vlastní efekty nesou patch; idempotentní
  function registerLib() {
    const L = root.SND && root.SND.Library; if (!L) return false;
    L.hooks.sfx = sanitize;
    NAMES.forEach((n) => { if (!L.has('builtin.sfx.' + n)) L.addBuiltin('sfx', n, { nameKey: 'game.snd.n.' + n, data: { legacy: n } }); });
    return true;
  }
  G.Sfx = { SR, MAXLEN, NAMES, SHAPES, MIXES, DEF, sanitize, make, render, get, pitchAt, hash, aliasOf, snrDb, rng, registerLib };
  registerLib();
  if (typeof module !== 'undefined') module.exports = G;
})();

