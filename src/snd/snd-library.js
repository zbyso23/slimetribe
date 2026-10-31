
/*
 * Zvuk & hudba · jedna zvuková knihovna (bez DOM, běží i v Node a v exportu hry). Jmenný prostor SND.Library.
 * Není to druhé audio jádro: počítá pořád SND.renderVoice, SND.Song.mixdown a GAME.Sfx. Knihovna jen dává věcem STABILNÍ ID, drží je na jednom místě
 * a umí z nich vybrat to, co hra opravdu potřebuje (uzávěrka závislostí).
 *
 *   Čtyři druhy položek (type):
 *     instrument  data { kind:'synth', patch }  (patch jako SND.DEFAULT_PATCH)  nebo  { kind:'sample', sample, root, gain, adsr, bits, hold, loop, osc }
 *     sfx         data { legacy: 'shoot' }  (vestavěný recept GAME.Sfx)  nebo  { patch }  (patch GAME.Sfx, vlastní efekt)
 *     song        data = Song model (SND.Song.sanitize); stopa „syn“ odkazuje na nástroj přes syn[i].preset, sample přes smp[i].ref
 *     sample      data { sr, n, pcm }  mono, PCM 16 bit LE v base64, sr ∈ 8000 / 11025 / 16000 / 22050
 *                 nebo { sr, n, ch, adpcm }  IMA ADPCM (SND.Adpcm, ~4× menší), ch = 1 | 2; n = snímků na kanál. Song a hra přehrávají stereo vzorek stereo (sampleStereo),
 *                 nástroje ze vzorku (výška podle noty) čtou mono součet L+R.
 *   ID: builtin.<druh>.<klíč> (vestavěné, neměnné) · user.<druh>.<klíč> (vlastní). Stará jména jsou ALIASY: 'rtype' u hudby = builtin.song.rtype,
 *   'g-bass' u nástroje = builtin.instrument.g-bass, 'shoot' u efektu = builtin.sfx.shoot (idOf(type, ref)); starý zápis her proto dál platí.
 *   Vrstvy: vestavěné → vlastní (user) → přepis hrou (overlay = snapshot z hry, jen ke čtení; hra tak hraje, i když uživatel knihovnu nemá).
 *   Hranice: banka vzorků má nejvýš 64 položek a SPOLEČNÝ rozpočet 220 500 hodnot vzorků (5 s při 22 050 Hz stereo = 10 s mono; viz SND.Adpcm.Budget). Počítá se součet přes všechny vlastní vzorky
 *   knihovny A obě patice Sampleru s platným ADPCM; jednotka je jedna hodnota vzorku (snímky × kanály), PCM16 i ADPCM stejně. Patice se stejným obsahem jako vzorek v knihovně se počítá jednou.
 *   Jeden vzorek tedy nemůže mít víc než celý rozpočet. PCM16 vzorek se ukládá mono; převzorkování dolů je průměrování oken
 *   (potlačí aliasing nejhrubší, není to sinc); ADPCM z Sampleru přichází už hotové z jeho kodeku (SND.Adpcm).
 * Co umí a co ne: viz locales snd-lib (limits). Zvuk nikdo neposlouchal; testy ověřují čísla, identitu s původním renderem a pravidla knihovny.
 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  if (typeof require !== 'undefined' && !root.SND) { require('./snd-engine.js'); require('./snd-song.js'); require('./snd-adpcm.js'); require('./snd-sample.js'); }
  const S = root.SND = root.SND || {};
  const TYPES = ['instrument', 'sfx', 'song', 'sample'], PLURAL = { instrument: 'instruments', sfx: 'sfx', song: 'songs', sample: 'samples' };
  const ID_RE = /^(builtin|user)\.(instrument|sfx|song|sample)\.[a-z0-9_-]{1,32}$/, KEY_RE = /^[a-z0-9_-]{1,32}$/;
  const LIMITS = Object.freeze({ samples: 64, frames: 220500, budget: S.Adpcm.BUDGET, rates: [8000, 11025, 16000, 22050], instruments: 256, sfx: 128, songs: 64, nameLen: 60, noteSec: 4 });
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const num = (v, a, b, d) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : d);
  const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
  const fail = (code, arg, info) => { const e = new Error('lib:' + code + (arg === undefined ? '' : ':' + arg)); e.code = code; e.arg = arg; if (info) e.info = info; throw e; };
  const isId = (s) => typeof s === 'string' && ID_RE.test(s);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ---------------------------------------------------------------- base64 (vlastní, v snd-adpcm.js: stejné ve file:// i v Node)
  const b64enc = S.Adpcm.b64enc;
  function b64dec(str) { const o = S.Adpcm.b64dec(str); if (!o) fail('base64'); return o; }

  // ---------------------------------------------------------------- vzorky: PCM16 mono ↔ Float32, převzorkování
  function pcmEncode(f32) {
    const b = new Uint8Array(f32.length * 2);
    for (let i = 0; i < f32.length; i++) { const v = Math.round(clamp(f32[i], -1, 1) * 32767); b[i * 2] = v & 255; b[i * 2 + 1] = (v >> 8) & 255; }
    return b64enc(b);
  }
  function pcmDecode(b64, n) {
    const b = b64dec(b64); if (b.length !== n * 2) fail('sampleLen');
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) { let v = b[i * 2] | (b[i * 2 + 1] << 8); if (v & 0x8000) v -= 0x10000; out[i] = v / 32767; }
    return out;
  }
  // dolů průměrováním oken (potlačí aliasing hrubě), nahoru lineárně
  function resample(x, from, to) {
    if (from === to) return Float32Array.from(x);
    if (to > from) return S.Sample ? S.Sample.resample(x, from, to) : x;
    const n = Math.max(1, Math.round(x.length * to / from)), r = from / to, o = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = i * r, b = Math.min(x.length, (i + 1) * r); let s = 0, w = 0;
      for (let k = Math.floor(a); k < Math.ceil(b); k++) { const ov = Math.min(b, k + 1) - Math.max(a, k); if (ov > 0 && k < x.length) { s += x[k] * ov; w += ov; } }
      o[i] = w > 0 ? s / w : 0;
    }
    return o;
  }
  // nejbližší povolený uložený kmitočet pod zdrojovým (nebo nejnižší), aby se sample zbytečně nenafukoval
  const storeRate = (from) => { const r = LIMITS.rates.filter((x) => x <= from); return r.length ? r[r.length - 1] : LIMITS.rates[0]; };
  function sampleData(f32, from, to) {
    const rate = to || storeRate(from), x = resample(f32, from, rate), n = Math.min(x.length, LIMITS.frames);
    return { sr: rate, n, pcm: pcmEncode(n === x.length ? x : x.subarray(0, n)) };
  }

  // ---------------------------------------------------------------- vestavěné nástroje (data, ne funkce): základní předvolby syntezátoru
  const BASE = {
    bass: (p) => Object.assign(p, { osc: { shape: 'saw', detune: 0, sub: 0.6, fmRatio: 0, fmIndex: 0, blep: true }, filter: { type: 'lp', cutoff: 220, q: 3, env: 3 }, aenv: { a: 0.005, d: 0.3, s: 0.5, r: 0.12 }, fenv: { a: 0.002, d: 0.22, s: 0.1, r: 0.12 }, lfo: { rate: 5, depth: 0, target: 'pitch' }, drive: 0.25 }),
    pad: (p) => Object.assign(p, { osc: { shape: 'saw', detune: 7, sub: 0, fmRatio: 0, fmIndex: 0, blep: true }, filter: { type: 'lp', cutoff: 900, q: 0.8, env: 1.2 }, aenv: { a: 0.6, d: 0.6, s: 0.8, r: 1.1 }, fenv: { a: 0.8, d: 0.8, s: 0.6, r: 1 }, lfo: { rate: 0.4, depth: 0.5, target: 'cutoff' }, drive: 0, delay: { time: 0.35, fb: 0.45, wet: 0.35 } }),
    pluck: (p) => Object.assign(p, { osc: { shape: 'square', detune: 0, sub: 0, fmRatio: 0, fmIndex: 0, blep: true }, filter: { type: 'lp', cutoff: 500, q: 1.5, env: 3.2 }, aenv: { a: 0.002, d: 0.35, s: 0, r: 0.2 }, fenv: { a: 0.001, d: 0.2, s: 0, r: 0.2 }, lfo: { rate: 5, depth: 0, target: 'pitch' }, drive: 0 }),
    bell: (p) => Object.assign(p, { osc: { shape: 'sine', detune: 0, sub: 0, fmRatio: 1.414, fmIndex: 4.5, blep: true }, filter: { type: 'off', cutoff: 8000, q: 1, env: 0 }, aenv: { a: 0.002, d: 1.8, s: 0, r: 1.4 }, fenv: { a: 0.002, d: 1, s: 0, r: 1 }, lfo: { rate: 5, depth: 0, target: 'pitch' }, drive: 0, delay: { time: 0.3, fb: 0.4, wet: 0.25 } }),
    wobble: (p) => Object.assign(p, { osc: { shape: 'saw', detune: 0, sub: 0.5, fmRatio: 0, fmIndex: 0, blep: true }, filter: { type: 'lp', cutoff: 420, q: 6, env: 0 }, aenv: { a: 0.01, d: 0.1, s: 0.9, r: 0.2 }, fenv: { a: 0.01, d: 0.1, s: 1, r: 0.2 }, lfo: { rate: 3.5, depth: 1.8, target: 'cutoff' }, drive: 0.4 }),
    lead: (p) => Object.assign(p, { osc: { shape: 'square', detune: 5, sub: 0, fmRatio: 0, fmIndex: 0, blep: true }, filter: { type: 'lp', cutoff: 2600, q: 2, env: 1 }, aenv: { a: 0.02, d: 0.2, s: 0.7, r: 0.25 }, fenv: { a: 0.01, d: 0.3, s: 0.4, r: 0.25 }, lfo: { rate: 5.5, depth: 0.25, target: 'pitch' }, drive: 0.1, delay: { time: 0.26, fb: 0.35, wet: 0.2 } }),
  };
  S.PRESETS = BASE;   // funkce předvoleb zůstávají veřejné (Syntezátor je používá); v knihovně jsou jako data

  // ---------------------------------------------------------------- kontrola dat jednotlivých druhů
  const SHAPES = ['sine', 'triangle', 'square', 'saw', 'noise'], FTYPES = ['off', 'lp', 'hp', 'bp', 'notch'], LFOT = ['pitch', 'cutoff', 'amp', 'pw'], LSHAPES = ['sine', 'tri', 'square', 'saw', 'sh'], OPS = ['none', 'add', 'ring', 'xor'];
  function cleanPatch(p) {
    if (!isObj(p)) fail('badInstrument');
    const d = S.DEFAULT_PATCH(), o = isObj(p.osc) ? p.osc : {}, f = isObj(p.filter) ? p.filter : {}, l = isObj(p.lfo) ? p.lfo : {};
    const env = (e, def) => { const q = isObj(e) ? e : {}; return { a: num(q.a, 0.001, 8, def.a), d: num(q.d, 0.001, 8, def.d), s: num(q.s, 0, 1, def.s), r: num(q.r, 0.001, 8, def.r) }; };
    const out = {
      osc: { shape: SHAPES.includes(o.shape) ? o.shape : d.osc.shape, detune: num(o.detune, -1200, 1200, 0), sub: num(o.sub, 0, 1, 0), fmRatio: num(o.fmRatio, 0, 16, 0), fmIndex: num(o.fmIndex, 0, 20, 0), blep: o.blep !== false },
      filter: { type: FTYPES.includes(f.type) ? f.type : d.filter.type, cutoff: num(f.cutoff, 20, 20000, d.filter.cutoff), q: num(f.q, 0.1, 25, d.filter.q), env: num(f.env, -6, 6, d.filter.env) },
      aenv: env(p.aenv, d.aenv), fenv: env(p.fenv, d.fenv),
      lfo: { rate: num(l.rate, 0.05, 40, 5), depth: num(l.depth, 0, 12, 0), target: LFOT.includes(l.target) ? l.target : 'pitch' }, drive: num(p.drive, 0, 1, 0),
    };
    if (isObj(p.delay)) out.delay = { time: num(p.delay.time, 0.02, 1.2, 0.28), fb: num(p.delay.fb, 0, 0.85, 0.35), wet: num(p.delay.wet, 0, 1, 0) };
    // Syntezátor v2: nepovinná pole se přenesou jen tehdy, když v patchi jsou (starý patch zůstane beze změny, viz renderVoice v snd-engine.js)
    const has = (v) => v !== undefined && v !== null;
    if (has(o.oct)) out.osc.oct = Math.round(num(o.oct, -3, 3, 0));
    if (has(o.semi)) out.osc.semi = Math.round(num(o.semi, -12, 12, 0));
    if (has(o.pw)) out.osc.pw = num(o.pw, 0.05, 0.95, 0.5);
    if (has(o.noise)) out.osc.noise = num(o.noise, 0, 1, 0);
    if (has(o.level)) out.osc.level = num(o.level, 0, 1.5, 1);
    if (isObj(o.uni)) out.osc.uni = { n: Math.round(num(o.uni.n, 1, 7, 1)), spread: num(o.uni.spread, 0, 100, 15) };
    if (isObj(p.osc2)) { const q = p.osc2; out.osc2 = { shape: SHAPES.includes(q.shape) ? q.shape : 'saw', level: num(q.level, 0, 1, 0), oct: Math.round(num(q.oct, -3, 3, 0)), semi: Math.round(num(q.semi, -12, 12, 0)), detune: num(q.detune, -100, 100, 0), pw: num(q.pw, 0.05, 0.95, 0.5) }; }
    if (has(f.slope)) out.filter.slope = f.slope === 24 ? 24 : 12;
    if (has(f.keytrack)) out.filter.keytrack = num(f.keytrack, 0, 1, 0);
    if (has(f.velo)) out.filter.velo = num(f.velo, 0, 4, 0);
    if (has(l.shape)) out.lfo.shape = LSHAPES.includes(l.shape) ? l.shape : 'sine';
    if (isObj(p.lfo2)) { const q = p.lfo2; out.lfo2 = { rate: num(q.rate, 0.05, 40, 3), depth: num(q.depth, 0, 12, 0), target: LFOT.includes(q.target) ? q.target : 'pitch', shape: LSHAPES.includes(q.shape) ? q.shape : 'sine' }; }
    if (has(p.level)) out.level = num(p.level, 0, 1.5, 1);
    // efekty po hlasu (jen laboratoř Syntezátor)
    if (isObj(p.chorus)) out.chorus = { rate: num(p.chorus.rate, 0.1, 6, 0.8), depth: num(p.chorus.depth, 0, 1, 0.5), mix: num(p.chorus.mix, 0, 1, 0) };
    if (isObj(p.reverb)) out.reverb = { size: num(p.reverb.size, 0, 1, 0.5), damp: num(p.reverb.damp, 0, 0.95, 0.5), wet: num(p.reverb.wet, 0, 1, 0) };
    return out;
  }
  function cleanInstrument(d) {
    if (!isObj(d)) fail('badInstrument');
    if (d.kind === 'synth') return { kind: 'synth', patch: cleanPatch(d.patch) };
    if (d.kind !== 'sample') fail('badInstrument');
    if (!isId(d.sample) || !/^[a-z]+\.sample\./.test(d.sample)) fail('badInstrument');
    const e = isObj(d.adsr) ? d.adsr : {}, o = isObj(d.osc) ? d.osc : {};
    return {
      kind: 'sample', sample: d.sample, root: Math.round(num(d.root, 12, 108, 60)), gain: num(d.gain, 0, 2, 1), loop: !!d.loop,
      adsr: { a: num(e.a, 0.001, 4, 0.005), d: num(e.d, 0.001, 4, 0.1), s: num(e.s, 0, 1, 1), r: num(e.r, 0.001, 4, 0.1) },
      bits: d.bits === 0 || d.bits === undefined ? 0 : Math.round(num(d.bits, 2, 16, 0)), hold: Math.round(num(d.hold, 1, 32, 1)),
      osc: { wave: SHAPES.includes(o.wave) ? o.wave : 'sine', ratio: num(o.ratio, 0.25, 8, 1), level: num(o.level, 0, 1, 0), op: OPS.includes(o.op) ? o.op : 'none' },
    };
  }
  function cleanSample(d) {
    const Ad = S.Adpcm;
    if (isObj(d) && d.adpcm !== undefined) {   // IMA ADPCM: n snímků na kanál, ch kanálů; objem dat odpovídá deklaraci, takže „bomba“ s malým obsahem neprojde
      if (d.pcm !== undefined || !LIMITS.rates.includes(d.sr) || (d.ch !== 1 && d.ch !== 2) || !Number.isInteger(d.n) || d.n < 1 || d.n * d.ch > LIMITS.frames || typeof d.adpcm !== 'string') fail('badSample');
      if (d.adpcm.length !== Ad.b64len(Ad.bytesFor(d.n, d.ch))) fail('badSample');
      b64dec(d.adpcm);
      return { sr: d.sr, n: d.n, ch: d.ch, adpcm: d.adpcm };
    }
    if (!isObj(d) || !LIMITS.rates.includes(d.sr) || !Number.isInteger(d.n) || d.n < 1 || d.n > LIMITS.frames || typeof d.pcm !== 'string') fail('badSample');
    if (d.pcm.length !== Math.ceil(d.n * 2 / 3) * 4) fail('badSample');   // délka base64 musí odpovídat deklarovanému počtu vzorků (žádné obří „frames“ s malým obsahem)
    b64dec(d.pcm);   // jen tvar; samotné dekódování až při použití
    return { sr: d.sr, n: d.n, pcm: d.pcm };
  }
  const hooks = { sfx: null };   // GAME.Sfx.sanitize doplní game-sfx.js; knihovna sama nezná hru
  function cleanSfx(d) {
    if (!isObj(d)) fail('badSfx');
    if (typeof d.legacy === 'string') { if (!KEY_RE.test(d.legacy)) fail('badSfx'); return { legacy: d.legacy }; }
    if (!hooks.sfx) fail('noSfx');
    let p; try { p = hooks.sfx(d.patch); } catch (e) { fail('badSfx'); }
    return { patch: p };
  }
  function cleanSong(d) {
    let s; try { s = S.Song.sanitize(d); } catch (e) { fail('badSong'); }
    return s;
  }
  const CLEAN = { instrument: cleanInstrument, sfx: cleanSfx, song: cleanSong, sample: cleanSample };
  const cleanName = (s, def) => { const n = String(s === undefined || s === null ? '' : s).replace(/[\u0000-\u001f<>&"`]/g, '').trim().slice(0, LIMITS.nameLen); return n || def || ''; };

  // ---------------------------------------------------------------- úložiště
  const builtin = new Map(), user = new Map();
  let overlay = new Map(), seq = 1;
  const subs = new Set();
  const emit = (ev) => { subs.forEach((f) => { try { f(ev); } catch (e) { /* posluchač nesmí rozbít knihovnu */ } }); };
  const typeOf = (id) => { const m = ID_RE.exec(id); return m ? m[2] : null; };
  const keyOf = (id) => id.split('.').slice(2).join('.');

  function addBuiltin(type, key, o = {}) {
    if (!TYPES.includes(type) || !KEY_RE.test(key)) fail('badId');
    const id = `builtin.${type}.${key}`;
    builtin.set(id, { id, type, name: o.name || key, nameKey: o.nameKey || null, origin: 'predefined', rev: ++seq, tags: o.tags || [], _data: o.data, _make: o.make || null });
    return id;
  }
  const dataOf = (it) => { if (it._make) { it._data = it._make(); it._make = null; } return it._data; };
  const view = (it) => (it && Object.defineProperty({ id: it.id, type: it.type, name: it.name, nameKey: it.nameKey || null, origin: it.origin, rev: it.rev, derivedFrom: it.derivedFrom || null, tags: it.tags || [] }, 'data', { enumerable: true, get: () => (it.origin === 'predefined' ? dataOf(it) : it.data) }));

  function get(id) { if (typeof id !== 'string') return null; return view(overlay.get(id) || user.get(id) || builtin.get(id) || null); }
  const has = (id) => !!get(id);
  // stará jména → ID: ref bez tečky je klíč vestavěné položky; ref s tečkou musí být platné ID
  function idOf(type, ref) {
    if (typeof ref !== 'string' || !TYPES.includes(type)) return null;
    if (ref.indexOf('.') < 0) return KEY_RE.test(ref) ? `builtin.${type}.${ref}` : null;
    return isId(ref) && typeOf(ref) === type ? ref : null;
  }
  function resolve(type, ref) { const id = idOf(type, ref); return id ? get(id) : null; }
  const revOf = (type, ref) => { const id = idOf(type, ref); const it = id && (overlay.get(id) || user.get(id) || builtin.get(id)); return it ? it.rev : 0; };
  function list(type, o = {}) {
    const out = [];
    const add = (m) => m.forEach((it) => { if ((!type || it.type === type) && (!o.origin || it.origin === o.origin) && !(o.hideShadowed && out.some((x) => x.id === it.id))) out.push(view(it)); });
    if (!o.origin || o.origin === 'predefined') add(builtin);
    if (!o.origin || o.origin === 'user') add(user);
    if (!o.origin || o.origin === 'game') add(overlay);
    return out;
  }
  const countOf = (type) => [...user.values()].filter((i) => i.type === type).length;

  // odkazy z dat položky na jiné položky (jen platná ID; stará jména ukazují na vestavěné, takže se nebalí)
  function refsOf(type, data) {
    const out = [];
    if (type === 'song' && data) {
      (data.syn || []).forEach((s) => { if (s && isId(s.preset)) out.push(s.preset); });
      (data.smp || []).forEach((s) => { if (s && isId(s.ref)) out.push(s.ref); });
    } else if (type === 'instrument' && data && data.kind === 'sample' && isId(data.sample)) out.push(data.sample);
    return out;
  }
  function remapRefs(type, data, map) {
    const m = (id) => (map[id] || id);
    if (type === 'song') { (data.syn || []).forEach((s) => { if (s && typeof s.preset === 'string') s.preset = m(s.preset); }); (data.smp || []).forEach((s) => { if (s && typeof s.ref === 'string') s.ref = m(s.ref); }); }
    else if (type === 'instrument' && data.kind === 'sample') data.sample = m(data.sample);
    return data;
  }
  const refsOfItem = (it) => refsOf(it.type, it.origin === 'predefined' ? dataOf(it) : it.data);

  // banka vzorků: počet vlastních vzorků a společný rozpočet (knihovna + patice Sampleru, viz SND.Adpcm.Budget). Jednotka = jedna hodnota vzorku (snímky × kanály)
  const units = (d) => (d.adpcm !== undefined ? d.n * d.ch : d.n);
  const keyOfData = (d) => (d.adpcm !== undefined ? d.adpcm : d.pcm);
  const libItems = () => [...user.values()].filter((i) => i.type === 'sample').map((i) => ({ owner: 'lib:' + i.id, kind: 'lib', key: keyOfData(i.data), units: units(i.data), label: i.name }));
  S.Adpcm.Budget.register(libItems);
  const Bud = S.Adpcm.Budget;
  // o: { skip, extra: [data vzorků, které by přibyly] }; vrací tvar { count, frames (= použito), maxFrames (= celkem), ok } a rozpis { used, lib, slots, shared, left, total }
  function bank(o = {}) {
    const extra = (o.extra || []).map((d, i) => ({ owner: 'lib:+' + i, kind: 'lib', key: keyOfData(d), units: units(d) })), t = Bud.tally({ skip: o.skip, extra }), count = [...user.values()].filter((i) => i.type === 'sample').length + extra.length;
    return { count, frames: t.used, maxCount: LIMITS.samples, maxFrames: t.total, ok: count <= LIMITS.samples && t.used <= t.total, used: t.used, lib: t.lib, slots: t.slots, shared: t.shared, left: t.left, total: t.total };
  }
  // jen vzorky samy o sobě (snapshot hry je soběstačný, patice Sampleru se do něj nepočítají)
  const bankOf = (samples) => { const frames = samples.reduce((n, d) => n + units(d), 0); return { count: samples.length, frames, maxCount: LIMITS.samples, maxFrames: LIMITS.budget, ok: samples.length <= LIMITS.samples && frames <= LIMITS.budget }; };

  const slug = (s) => cleanName(s, 'item').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'item';
  function newId(type, name) {
    const base = `user.${type}.${slug(name)}`;
    let id = base, k = 2; while (user.has(id) || overlay.has(id) || id.length > 7 + type.length + 33) { id = `${base.slice(0, 7 + type.length + 28)}-${k++}`; }
    return id;
  }

  // vložení / úprava vlastní položky. o = { id?, name, data, derivedFrom? }; vrací pohled na položku
  function put(type, o) {
    if (!TYPES.includes(type) || !isObj(o)) fail('badItem');
    const data = CLEAN[type](o.data);
    let id = o.id;
    if (id !== undefined && id !== null) {
      if (!isId(id) || typeOf(id) !== type || !id.startsWith('user.')) fail('badId');
    } else id = newId(type, o.name);
    const prev = user.get(id);
    if (!prev && countOf(type) >= LIMITS[PLURAL[type]] && type !== 'sample') fail('tooMany', type);
    if (type === 'sample' && !o.force) {   // force = obnova z úložiště: nic, co uživatel měl, se nezahodí; rozpočet hlídá jen nové přidávání
      if (!prev && countOf('sample') + 1 > LIMITS.samples) fail('bankCount', LIMITS.samples);
      const b = bank({ skip: prev ? 'lib:' + id : undefined, extra: [data] });
      if (b.used > b.total) fail('bankFrames', b.total, { need: units(data), left: Math.max(0, b.total - (b.used - units(data))), total: b.total, lib: b.lib, slots: b.slots });
    }
    refsOf(type, data).forEach((r) => { if (r === id) fail('cycle'); if (!has(r)) fail('badRef', r); });
    const it = { id, type, name: cleanName(o.name, prev ? prev.name : slug(id)), origin: 'user', rev: ++seq, data };
    if (o.derivedFrom && isId(o.derivedFrom)) it.derivedFrom = o.derivedFrom; else if (prev && prev.derivedFrom) it.derivedFrom = prev.derivedFrom;
    user.set(id, it);
    emit({ op: prev ? 'update' : 'add', id, type });
    return view(it);
  }
  const fork = (id, name) => {
    const src = get(id); if (!src) fail('badRef', id);
    return put(src.type, { name: name || src.name, data: clone(src.data), derivedFrom: src.origin === 'game' ? null : src.id });
  };
  function rename(id, name) {
    const it = user.get(id); if (!it) fail('badId'); it.name = cleanName(name, it.name); it.rev = ++seq; emit({ op: 'update', id, type: it.type }); return view(it);
  }
  function usedBy(id, extra) {
    const by = [];
    user.forEach((it) => { if (it.id !== id && refsOfItem(it).includes(id)) by.push(it.id); });
    (extra || []).forEach((r) => { if (r === id) by.push('#game'); });
    return by;
  }
  function remove(id, extra) {
    const it = user.get(id); if (!it) return { ok: false, reason: 'missing' };
    const by = usedBy(id, extra); if (by.length) return { ok: false, reason: 'used', by };
    user.delete(id); emit({ op: 'remove', id, type: it.type }); return { ok: true };
  }

  // ---------------------------------------------------------------- uzávěrka závislostí a snapshot
  // vstup: seznam ID/jmen; výstup: položky v pořadí závislostí (nejdřív vzorky) + chybějící odkazy
  function closure(refs) {
    const items = [], seen = new Set(), missing = [];
    const visit = (id) => {
      if (seen.has(id)) return; seen.add(id);
      const it = get(id); if (!it) { missing.push(id); return; }
      refsOf(it.type, it.data).forEach(visit);
      items.push(it);
    };
    (refs || []).forEach((r) => { if (isId(r)) visit(r); });
    return { items, missing };
  }
  // snapshot jen vlastních / herních položek; vestavěné se do hry neukládají (jsou v běhovém jádře)
  function snapshot(refs) {
    const c = closure(refs), out = { v: 2, instruments: [], sfx: [], songs: [], samples: [] };
    c.items.filter((i) => i.origin !== 'predefined').forEach((i) => {
      const e = { id: i.id, name: i.name, data: clone(i.data) }; if (i.derivedFrom) e.derivedFrom = i.derivedFrom;
      out[PLURAL[i.type]].push(e);
    });
    const empty = TYPES.every((t) => !out[PLURAL[t]].length);
    return { snap: empty ? null : out, missing: c.missing, bank: bankOf(out.samples.map((e) => e.data)) };
  }
  // kontrola cizího snapshotu: jen data, limity, platné odkazy v rámci snapshotu nebo vestavěných položek
  function sanitizeSnapshot(s, opt = {}) {
    if (!isObj(s)) fail('badSnapshot');
    const out = { v: 2, instruments: [], sfx: [], songs: [], samples: [] }, ids = new Set();
    TYPES.forEach((type) => {
      const arr = s[PLURAL[type]]; if (arr === undefined) return;
      if (!Array.isArray(arr) || arr.length > (type === 'sample' ? LIMITS.samples : LIMITS[PLURAL[type]])) fail('tooMany', type);
      arr.forEach((e) => {
        if (!isObj(e) || !isId(e.id) || typeOf(e.id) !== type || !e.id.startsWith('user.') || ids.has(e.id)) fail('badId');
        ids.add(e.id);
        const c = { id: e.id, name: cleanName(e.name, keyOf(e.id)), data: CLEAN[type](e.data) }; if (isId(e.derivedFrom)) c.derivedFrom = e.derivedFrom;
        out[PLURAL[type]].push(c);
      });
    });
    const b = bankOf(out.samples.map((e) => e.data)); if (!opt.noBank && !b.ok) fail(b.count > LIMITS.samples ? 'bankCount' : 'bankFrames', b.count > LIMITS.samples ? LIMITS.samples : b.maxFrames, { need: b.frames, left: 0, total: b.maxFrames });
    TYPES.forEach((type) => out[PLURAL[type]].forEach((e) => refsOf(type, e.data).forEach((r) => { if (!ids.has(r) && !builtin.has(r)) fail('badRef', r); })));
    return out;
  }
  // přepis hrou: položky ze snapshotu hry platí po dobu hry (jen ke čtení); null ho zruší
  function setOverlay(snap) {
    overlay = new Map();
    if (snap) {
      const s = sanitizeSnapshot(snap);
      TYPES.forEach((type) => s[PLURAL[type]].forEach((e) => overlay.set(e.id, { id: e.id, type, name: e.name, origin: 'game', rev: ++seq, data: e.data, derivedFrom: e.derivedFrom })));
    }
    emit({ op: 'overlay' });
  }

  // hra načtená do editoru: její vlastní zvuky se přidají do knihovny (stejné ID a stejná data = nic; nové ID = přidá se). Co se s knihovnou srazí
  // (stejné ID, jiná data, nebo plná banka), zůstane jako přepis hrou, takže hra hraje přesně jako uložená, a vrátí se v conflicts.
  function adopt(snap) {
    const s = sanitizeSnapshot(snap), rep = { added: [], same: [], conflicts: [] }, keep = { v: 2, instruments: [], sfx: [], songs: [], samples: [] };
    const order = ['sample', 'instrument', 'sfx', 'song'];
    order.forEach((type) => s[PLURAL[type]].forEach((e) => {
      const cur = user.get(e.id), conflictsRef = refsOf(type, e.data).some((r) => rep.conflicts.includes(r));
      if (cur && JSON.stringify(cur.data) === JSON.stringify(e.data) && !conflictsRef) { rep.same.push(e.id); return; }
      if (!cur && !conflictsRef) { try { put(type, { id: e.id, name: e.name, data: e.data, derivedFrom: e.derivedFrom }); rep.added.push(e.id); return; } catch (err) { /* plná banka apod. → přepis */ } }
      rep.conflicts.push(e.id); keep[PLURAL[type]].push(e);
    }));
    setOverlay(rep.conflicts.length ? keep : null);
    return rep;
  }

  // ---------------------------------------------------------------- celá knihovna ↔ JSON (soubor craftedu-audio-library)
  function exportAll(ids) {
    const refs = ids || [...user.keys()], c = closure(refs), out = { kind: 'craftedu-audio-library', v: 2, instruments: [], sfx: [], songs: [], samples: [] };
    c.items.filter((i) => i.origin === 'user').forEach((i) => { const e = { id: i.id, name: i.name, data: clone(i.data) }; if (i.derivedFrom) e.derivedFrom = i.derivedFrom; out[PLURAL[i.type]].push(e); });
    return out;
  }
  // import: conflict = 'copy' (nové ID) | 'replace' (přepíše vlastní položku se stejným ID) | 'skip'. Stejná data se nikdy nepřidávají podruhé.
  function importAll(obj, o = {}) {
    if (!isObj(obj) || obj.kind !== 'craftedu-audio-library') fail('badContainer');
    const policy = ['copy', 'replace', 'skip'].includes(o.conflict) ? o.conflict : 'copy';
    const s = sanitizeSnapshot(obj, { noBank: !!o.restore }), map = {}, rep = { added: [], replaced: [], skipped: [], same: [] };
    const all = []; TYPES.forEach((type) => s[PLURAL[type]].forEach((e) => all.push([type, e])));
    all.forEach(([type, e]) => {
      const cur = user.get(e.id);
      if (cur && JSON.stringify(cur.data) === JSON.stringify(e.data)) { rep.same.push(e.id); return; }
      if (cur && policy === 'skip') { rep.skipped.push(e.id); return; }
      if (cur && policy === 'copy') map[e.id] = newId(type, e.name);
    });
    // rozpočet vzorků se ověří celý předem, ať import nekončí napůl (obnova z úložiště ho nehlídá)
    if (!o.restore) {
      const add = [], drop = []; all.forEach(([type, e]) => { if (type !== 'sample' || rep.same.includes(e.id) || rep.skipped.includes(e.id)) return; const id = map[e.id] || e.id; if (user.has(id)) drop.push('lib:' + id); add.push(e.data); });
      if (add.length) {
        if ([...user.values()].filter((i) => i.type === 'sample' && !drop.includes('lib:' + i.id)).length + add.length > LIMITS.samples) fail('bankCount', LIMITS.samples);
        const b = bank({ skip: drop, extra: add }); if (b.used > b.total) fail('bankFrames', b.total, { need: add.reduce((n, d) => n + units(d), 0), left: Math.max(0, b.total - (b.used - add.reduce((n, d) => n + units(d), 0))), total: b.total, lib: b.lib, slots: b.slots });
      }
    }
    // vzorky první, aby šly odkazy z nástrojů a skladeb ověřit
    const order = { sample: 0, instrument: 1, sfx: 2, song: 3 };
    all.sort((a, b) => order[a[0]] - order[b[0]]).forEach(([type, e]) => {
      if (rep.same.includes(e.id) || rep.skipped.includes(e.id)) return;
      const id = map[e.id] || e.id, had = user.has(id);
      put(type, { id, name: e.name, data: remapRefs(type, clone(e.data), map), derivedFrom: e.derivedFrom, force: !!o.restore });
      (had ? rep.replaced : rep.added).push(id);
    });
    return rep;
  }

  // ---------------------------------------------------------------- vzorky pro přehrávání
  const pcmCache = new Map(), noteCache = new Map();
  const small = (m, max) => { if (m.size >= max) m.clear(); };
  // kanály vzorku v jeho uloženém kmitočtu: PCM16 dává 1 kanál, ADPCM 1 nebo 2 (jen Sampler je potřebuje; ostatní berou sampleF32)
  function sampleChannels(ref) {
    const it = resolve('sample', ref); if (!it) return null;
    const k = `${it.id}@${it.rev}|ch`; let c = pcmCache.get(k);
    if (!c) {
      small(pcmCache, 48);
      if (it.data.adpcm !== undefined) { const bytes = b64dec(it.data.adpcm); c = S.Adpcm.decode(bytes, it.data.n, it.data.ch); if (!c) fail('badSample'); }
      else c = [pcmDecode(it.data.pcm, it.data.n)];
      pcmCache.set(k, c);
    }
    return { chs: c, sr: it.data.sr };
  }
  function sampleF32(ref, sr) {
    const it = resolve('sample', ref); if (!it) return null;
    const k = `${it.id}@${it.rev}`;
    let raw = pcmCache.get(k);
    if (!raw) {
      small(pcmCache, 48); const c = sampleChannels(ref).chs;
      if (c.length === 1) raw = c[0]; else { raw = new Float32Array(c[0].length); for (let i = 0; i < raw.length; i++) raw[i] = 0.5 * (c[0][i] + c[1][i]); }   // stereo → mono součtem
      pcmCache.set(k, raw);
    }
    if (!sr || sr === it.data.sr) return raw;
    const k2 = `${k}|${sr}`; let r = pcmCache.get(k2); if (!r) { small(pcmCache, 48); r = resample(raw, it.data.sr, sr); pcmCache.set(k2, r); }
    return r;
  }

  // stereo vzorek v kmitočtu mixu: { L, R } (R = null u mono); Song a hra ho hrají stereo. Stejné převzorkování jako sampleF32, takže mono vzorek zní beze změny
  function sampleStereo(ref, sr) {
    const it = resolve('sample', ref); if (!it) return null;
    const c = sampleChannels(ref); if (c.chs.length === 1) return { L: sampleF32(ref, sr), R: null };
    const k = `${it.id}@${it.rev}|st|${sr || 0}`; let r = pcmCache.get(k);
    if (!r) { small(pcmCache, 48); r = { L: !sr || sr === c.sr ? c.chs[0] : resample(c.chs[0], c.sr, sr), R: !sr || sr === c.sr ? c.chs[1] : resample(c.chs[1], c.sr, sr) }; pcmCache.set(k, r); }
    return r;
  }

  // ---------------------------------------------------------------- nástroj postavený na vzorku: vzorek (výška podle noty) + volitelně oscilátor, bitcrush, ADSR
  // Pořadí je pevné a dokumentované: vzorek → smíchání s oscilátorem (add | ring | xor) → sample&hold (hold) → kvantizace (bits) → ADSR × gain × velocity → měkký limiter.
  // xor: obě hodnoty se zaokrouhlí na 8bitová čísla bez znaménka (x·127,5+127,5), XORují se bit po bitu a vrátí zpět; level míchá suchý a XORovaný signál.
  function oscAt(wave, ph) {
    switch (wave) {
      case 'saw': return 2 * ph - 1;
      case 'square': return ph < 0.5 ? 1 : -1;
      case 'triangle': return 1 - 4 * Math.abs(ph - 0.5);
      case 'noise': return Math.sin(ph * 12345.678) * Math.cos(ph * 937.31);   // deterministický šum bez stavu
      default: return Math.sin(2 * Math.PI * ph);
    }
  }
  function renderSampleInstrument(d, note, gate, sr, o = {}) {
    const src = sampleF32(d.sample, sr), vel = num(o.vel, 0, 1, 0.8);
    const total = Math.max(1, Math.round(Math.min(LIMITS.noteSec, gate + d.adsr.r) * sr)), out = new Float32Array(total);
    if (!src || !src.length) return out;
    const ratio = 2 ** ((note - d.root) / 12), f0 = 440 * 2 ** ((note - 69) / 12) * d.osc.ratio, lvl = d.osc.level, step = d.bits ? 2 ** (d.bits - 1) : 0;
    let held = 0;
    for (let i = 0; i < total; i++) {
      let pos = i * ratio; if (d.loop) pos %= src.length; else if (pos >= src.length - 1) pos = -1;
      let v = 0;
      if (pos >= 0) { const k = Math.floor(pos), fr = pos - k; v = src[k] * (1 - fr) + (k + 1 < src.length ? src[k + 1] : src[k]) * fr; }
      if (d.osc.op !== 'none' && lvl > 0) {
        const ph = (f0 * i / sr) % 1, w = oscAt(d.osc.wave, ph);
        if (d.osc.op === 'add') v += lvl * w;
        else if (d.osc.op === 'ring') v *= (1 - lvl) + lvl * w;
        else { const a = Math.round(clamp(v, -1, 1) * 127.5 + 127.5), b = Math.round(clamp(w, -1, 1) * 127.5 + 127.5); v = v * (1 - lvl) + (((a ^ b) - 127.5) / 127.5) * lvl; }
      }
      if (d.hold > 1) { if (i % d.hold === 0) held = v; v = held; }
      if (step) v = Math.round(clamp(v, -1, 1) * step) / step;
      out[i] = v * S.adsr(i / sr, gate, d.adsr) * d.gain * vel;
    }
    return S.softLimit(out);
  }
  // jeden tón nástroje: gate = jak dlouho se drží (s), vrací Float32 v sr (pamatuje si posledních ~200 tónů)
  function renderNote(ref, note, gate, sr, o = {}) {
    const it = resolve('instrument', ref); if (!it) return null;
    const g = clamp(num(gate, 0.02, 3, 0.3), 0.02, 3), n = clamp(Math.round(num(note, 0, 127, 60)), 0, 127);
    const key = `${it.id}@${it.rev}|${n}|${g}|${sr}|${o.cutoff || 0}|${o.vel === undefined ? 0.8 : o.vel}|${o.seed === undefined ? n : o.seed}`;
    let r = noteCache.get(key); if (r) return r;
    if (it.data.kind === 'sample') r = renderSampleInstrument(it.data, n, g, sr, o);
    else { const p = clone(it.data.patch); if (o.cutoff) p.filter = Object.assign({}, p.filter, { cutoff: o.cutoff }); r = S.renderVoice(p, n, g, sr, { seed: o.seed === undefined ? n : o.seed, vel: o.vel }); }
    small(noteCache, 200); noteCache.set(key, r); return r;
  }
  // patch synth-nástroje jako čerstvá kopie (pro Syntezátor a pro Song.patchOf); null u jiných druhů
  function synthPatch(ref) { const it = resolve('instrument', ref); return it && it.data.kind === 'synth' ? clone(it.data.patch) : null; }

  // ---------------------------------------------------------------- uložení ve file:// (jen pohodlí; autoritativní je export JSON)
  const KEY0 = 'edu.audiolib.v2';
  let KEY = KEY0, timer = 0, persisting = false;
  const back = () => root.EDUStore || root.localStorage || null;       // v aplikaci EDUStore (IndexedDB, core/edu-store.js), jinak localStorage
  const store = {
    get() { try { const b = back(); return b ? b.getItem(KEY) : null; } catch (e) { return null; } },
    set(v) { try { const b = back(); if (b) { b.setItem(KEY, v); return true; } } catch (e) { /* soukromý režim nebo plno */ } return false; },
  };
  function load() {
    const txt = store.get(); if (!txt) return null;
    try { const rep = importAll(JSON.parse(txt), { conflict: 'skip', restore: true }); return rep; } catch (e) { return null; }
  }
  function save() { return store.set(JSON.stringify(exportAll())); }
  // zapne načtení a automatické ukládání (volá je editor, ne běh hry)
  function persist(prefix) {
    if (persisting) return; persisting = true; KEY = (prefix || '') + KEY0;
    const start = () => {
      load();
      subs.add((ev) => { if (ev.op === 'overlay' || typeof setTimeout !== 'function') return; clearTimeout(timer); timer = setTimeout(save, 400); });
    };
    if (root.EDUStore && root.EDUStore.whenReady) root.EDUStore.whenReady(start); else start();     // IndexedDB se načítá asynchronně: data se čtou, až je úložiště připravené
  }
  const reset = () => { user.clear(); overlay = new Map(); emit({ op: 'reset' }); };

  const Lib = {
    TYPES, PLURAL, LIMITS, ID_RE, isId, typeOf, hooks, BASE,
    addBuiltin, get, has, idOf, resolve, revOf, list, put, fork, rename, remove, usedBy, refsOf, closure, snapshot, sanitizeSnapshot, setOverlay, adopt, bank, bankOf,
    exportAll, importAll, check: (type, data) => CLEAN[type](data), sampleF32, sampleStereo, sampleChannels, sampleData, pcmEncode, pcmDecode, resample, renderNote, renderSampleInstrument, synthPatch, cleanName, newId,
    persist, load, save, reset, on(fn) { subs.add(fn); return () => subs.delete(fn); }, get size() { return user.size; },
  };
  // vestavěné nástroje: základní předvolby syntezátoru (g-* a efekty/skladby her doplní game-music.js a game-sfx.js)
  Object.keys(BASE).forEach((k) => addBuiltin('instrument', k, { nameKey: 'snd.song.pre.' + k, data: { kind: 'synth', patch: BASE[k](S.DEFAULT_PATCH()) } }));
  S.Library = Lib;
  if (typeof module !== 'undefined') module.exports = S;
})();

