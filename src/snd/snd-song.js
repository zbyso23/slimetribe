
/*
 * Zvuk & hudba · jádro Song sekvenceru (bez DOM, běží i v Node): datový model songu, bicí s laděním a doznívaním, události po krocích a stereo mixdown pro WAV.
 * Song = 4 stopy; každá stopa má až 256 pozic (patternů) po 8 krocích = nejvýš 2048 kroků. Krok je osmina, pattern je jeden takt 4/4.
 * Poslech v laboratoři a export jdou přes stejné události (Song.events), takže WAV zní jako to, co slyšíš. Synth je offline renderVoice z jádra (stejný jako v laboratoři Syntezátor).
 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const S = root.SND = root.SND || {};
  const SR = 44100, STEPS = 8, MAXSLOTS = 256, NTRK = 4, DRUMS = ['kick', 'snare', 'hat', 'perc'], INST = ['drum', 'syn1', 'syn2'];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const stepDur = (bpm) => 60 / bpm / 2;
  const isRef = (v) => typeof v === 'string' && /^[A-Za-z0-9_.-]{1,64}$/.test(v);
  const lib = () => S.Library || null;   // knihovna (snd-library.js) je volitelná: bez ní platí jen předvolby z env.presets

  // ---- bicí: syntéza výpočtem (žádné vzorky); tune v půltónech, decay jako násobek doznívání
  function drumHit(kind, tune = 0, decay = 1, sr = SR) {
    const R = S.rng(4), k = 2 ** (tune / 12), base = { kick: 0.32, snare: 0.24, hat: 0.08, perc: 0.14 }[kind], n = Math.round(base * decay * sr), out = new Float32Array(n);
    let ph = 0, lp = 0, hp = 0, wp = 0;
    const a = Math.exp(-2 * Math.PI * 6000 * k / sr);
    for (let i = 0; i < n; i++) {
      const t = i / sr; let v = 0;
      if (kind === 'kick') { ph += k * (45 + 150 * Math.exp(-t * 22)) / sr; v = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 8 / decay) * 0.95; }
      else if (kind === 'snare') { const w = R() * 2 - 1; lp += 0.5 * (w - lp); v = (lp * 0.7 * Math.exp(-t * 20 / decay) + Math.sin(2 * Math.PI * 190 * k * t) * 0.5 * Math.exp(-t * 28 / decay)) * 0.9; }
      else if (kind === 'hat') { const w = R() * 2 - 1; hp = a * (hp + w - wp); wp = w; v = hp * 0.5 * Math.exp(-t * 55 / decay); }
      else v = Math.sin(2 * Math.PI * 820 * k * t) * Math.exp(-t * 34 / decay) * 0.8 + (R() - 0.5) * Math.exp(-t * 120) * 0.4;
      out[i] = v;
    }
    return out;
  }

  // ---- model. Patterny 0…7 = bicí D1…D8 (bitová maska 1 kick, 2 snare, 4 hat, 8 perc, 16 a 32 = sample 1 a 2), 8…15 = synth S1…S8 (MIDI nota, 0 = pauza)
  const patLabel = (id) => (id < 8 ? 'D' + (id + 1) : 'S' + (id - 7));
  const isDrumPat = (id) => id >= 0 && id < 8;
  function defaults() {
    const mk = (f) => Array.from({ length: STEPS }, (_, i) => f(i)), pats = [];
    pats[0] = mk((i) => (i % 2 === 0 ? 1 : 0) | (i === 2 || i === 6 ? 2 : 0) | 4);
    pats[1] = mk((i) => ([0, 3, 4].includes(i) ? 1 : 0) | (i === 2 || i === 6 ? 2 : 0) | 4);
    pats[2] = mk((i) => (i === 0 ? 1 : 0) | (i >= 4 ? 2 : 0) | (i === 7 ? 8 : 0));
    pats[3] = mk((i) => ([0, 5].includes(i) ? 1 : 0) | (i === 4 ? 2 : 0) | (i % 2 === 0 ? 4 : 0) | (i === 3 || i === 7 ? 8 : 0));
    for (let i = 4; i < 8; i++) pats[i] = mk(() => 0);
    pats[8] = [36, 0, 36, 36, 0, 36, 43, 0]; pats[9] = [60, 64, 67, 72, 67, 64, 67, 64]; pats[10] = [41, 0, 41, 41, 0, 41, 43, 43]; pats[11] = [69, 0, 0, 72, 0, 0, 76, 0];
    for (let i = 12; i < 16; i++) pats[i] = mk(() => 0);
    const slots = (arr) => Array.from({ length: MAXSLOTS }, (_, i) => (i < arr.length ? arr[i] : -1));
    return {
      bpm: 110, len: 8, loop: true, smp: [{ vol: 0.8, pan: 0 }, { vol: 0.8, pan: 0 }],
      tracks: [
        { inst: 'drum', vol: 0.8, pan: 0, mute: false, solo: false, slots: slots([0, 0, 0, 2, 0, 0, 1, 2]) },
        { inst: 'syn1', vol: 0.8, pan: -0.2, mute: false, solo: false, slots: slots([8, 8, 10, 10, 8, 8, 10, 10]) },
        { inst: 'syn2', vol: 0.6, pan: 0.4, mute: false, solo: false, slots: slots([-1, -1, 9, 9, 9, 9, 9, 9]) },
        { inst: 'syn2', vol: 0.5, pan: -0.5, mute: false, solo: false, slots: slots([-1, -1, -1, -1, 11, 11, 11, 11]) },
      ],
      pats,
      drum: { kick: { tune: 0, decay: 1, vol: 1 }, snare: { tune: 0, decay: 1, vol: 1 }, hat: { tune: 0, decay: 1, vol: 1 }, perc: { tune: 0, decay: 1, vol: 1 } },
      syn: [{ preset: 'bass', cutoff: 220 }, { preset: 'pluck', cutoff: 500 }],
    };
  }
  // import: vezme jen to, co sedí na model; nic navíc (JSON z cizího souboru je jen data)
  function sanitize(d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.tracks) || !Array.isArray(d.pats)) throw new Error('song');
    const s = defaults(), num = (v, a, b, def) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : def);
    s.bpm = num(d.bpm, 40, 240, s.bpm); s.len = Math.round(num(d.len, 1, MAXSLOTS, s.len)); s.loop = d.loop !== false;
    d.tracks.slice(0, NTRK).forEach((t, j) => {
      if (!t || typeof t !== 'object') return; const o = s.tracks[j];
      if (INST.includes(t.inst)) o.inst = t.inst; o.vol = num(t.vol, 0, 1, o.vol); o.pan = num(t.pan, -1, 1, o.pan); o.mute = !!t.mute; o.solo = !!t.solo;
      o.slots = Array.from({ length: MAXSLOTS }, (_, i) => { const v = Array.isArray(t.slots) ? t.slots[i] : -1; return Number.isInteger(v) && v >= 0 && v < 16 ? v : -1; });
    });
    d.pats.slice(0, 16).forEach((p, i) => { if (Array.isArray(p)) s.pats[i] = Array.from({ length: STEPS }, (_, k) => { const v = Math.round(+p[k]) || 0; return isDrumPat(i) ? clamp(v, 0, 63) : clamp(v, 0, 108); }); });
    (d.smp || []).slice(0, 2).forEach((o, i) => { if (o) { s.smp[i] = { vol: num(o.vol, 0, 1, 0.8), pan: num(o.pan, -1, 1, 0) }; if (isRef(o.ref)) s.smp[i].ref = o.ref; } });   // ref = vzorek z knihovny místo patice Sampleru
    DRUMS.forEach((k) => { const o = d.drum && d.drum[k]; if (o) s.drum[k] = { tune: num(o.tune, -12, 12, 0), decay: num(o.decay, 0.5, 2, 1), vol: num(o.vol, 0, 1, 1) }; });
    (d.syn || []).slice(0, 2).forEach((o, i) => { if (o) s.syn[i] = { preset: isRef(o.preset) ? o.preset : s.syn[i].preset, cutoff: num(o.cutoff, 60, 12000, s.syn[i].cutoff) }; });   // preset = stará jména (bass, g-lead …) nebo ID z knihovny
    return s;
  }

  // ---- patch synthu: základ z laboratoře Syntezátor + předvolba + vlastní cutoff
  function patchOf(syn, presets) {
    const p = S.DEFAULT_PATCH(), L = lib(), lp = L && L.synthPatch(syn.preset);
    if (lp) Object.assign(p, lp); else if (presets && presets[syn.preset]) presets[syn.preset](p);
    p.filter = Object.assign({}, p.filter, { cutoff: syn.cutoff }); return p;
  }
  function makeCache(max = 800) { const m = new Map(); return { get(k, make) { let v = m.get(k); if (!v) { if (m.size >= max) m.clear(); v = make(); m.set(k, v); } return v; }, get size() { return m.size; } }; }

  // jeden tón syntaku: nástroj postavený na vzorku jde přes knihovnu, ostatní přes SND.renderVoice jako dřív (patchOf bere předvolbu z knihovny nebo z env.presets)
  function synthNote(sy, v, gate, sr, env) {
    const L = lib(), it = L && L.resolve('instrument', sy.preset);
    if (it && it.data.kind === 'sample') return L.renderNote(sy.preset, v, gate, sr, { seed: v });
    return S.renderVoice(patchOf(sy, env.presets), v, gate, sr, { seed: v });
  }
  // vzorek pro bicí bit 16 / 32: z knihovny (smp[i].ref), jinak z patice Sampleru; vždy v kmitočtu mixu (dřív se bral surově v 44,1 kHz).
  // Vrací { buf, bufR }: stereo vzorek má oba kanály (bufR), mono jen buf (stejná data jako dřív, takže mono zní bit po bitu stejně).
  const slotCache = new WeakMap();
  function sampleBuf(song, i, env, sr) {
    const ref = song.smp[i].ref, L = lib();
    if (ref && L) { if (L.sampleStereo) { const st = L.sampleStereo(ref, sr); return st && st.L ? { buf: st.L, bufR: st.R } : null; } const m = L.sampleF32(ref, sr); return m && { buf: m, bufR: null }; }
    const sm = env.samples && env.samples[i]; if (!(sm && sm.result && sm.result.length)) return null;
    const from = S.Sample ? S.Sample.SR : sr, st = sm.resR && sm.resL ? sm : null;   // patice se skutečným stereem (resL / resR)
    if (from === sr) return { buf: st ? sm.resL : sm.result, bufR: st ? sm.resR : null };
    let m = slotCache.get(sm.result); if (!m) { m = new Map(); slotCache.set(sm.result, m); }
    if (!m.has(sr)) m.set(sr, st ? { buf: S.Sample.resample(sm.resL, from, sr), bufR: S.Sample.resample(sm.resR, from, sr) } : { buf: S.Sample.resample(sm.result, from, sr), bufR: null });
    return m.get(sr);
  }

  // ---- události jednoho globálního kroku g (0…len·8−1): [{ track, buf, gain }]
  function events(song, g, env) {
    const slot = Math.floor(g / STEPS) % song.len, step = g % STEPS, out = [], sd = stepDur(song.bpm), sr = env.sr || SR;
    song.tracks.forEach((tr, j) => {
      const id = tr.slots[slot]; if (id == null || id < 0) return;
      if (tr.inst === 'drum' ? !isDrumPat(id) : isDrumPat(id)) return;   // pattern jiného druhu stopa nepřehraje
      const v = song.pats[id][step];
      if (tr.inst === 'drum') DRUMS.forEach((k, b) => { if (v & (1 << b)) { const d = song.drum[k]; out.push({ track: j, buf: env.cache.get(`d${k}|${d.tune}|${d.decay}|${sr}`, () => drumHit(k, d.tune, d.decay, sr)), gain: 0.8 * d.vol }); } });
      if (tr.inst === 'drum') [0, 1].forEach((i) => { if (!(v & (16 << i))) return; const sb = sampleBuf(song, i, env, sr); if (sb) { const e = { track: j, buf: sb.buf, gain: 0.8 * song.smp[i].vol, pan: song.smp[i].pan }; if (sb.bufR) e.bufR = sb.bufR; out.push(e); } });
      else if (v > 0) {
        const si = tr.inst === 'syn1' ? 0 : 1, sy = song.syn[si], gate = Math.round(sd * 0.9 * 1000) / 1000, L = lib();
        out.push({ track: j, buf: env.cache.get(`s${si}|${sy.preset}|${L ? L.revOf('instrument', sy.preset) : 0}|${sy.cutoff}|${v}|${gate}|${sr}`, () => synthNote(sy, v, gate, sr, env)), gain: 0.8 });
      }
    });
    return out;
  }
  const panGains = (pan) => { const a = (pan + 1) * Math.PI / 4; return [Math.cos(a), Math.sin(a)]; };   // stejný zákon jako StereoPannerNode (rovný výkon)
  // stereo vstup do StereoPannerNode: [L→L, R→L, L→R, R→R]; pan ≤ 0 přesouvá pravý kanál k levému, pan > 0 levý k pravému
  const stereoGains = (pan) => { const x = pan <= 0 ? pan + 1 : pan, c = Math.cos(x * Math.PI / 2), s = Math.sin(x * Math.PI / 2); return pan <= 0 ? [1, c, 0, s] : [c, 0, s, 1]; };

  // ---- stereo mixdown celého songu (jedno projití smyčky; ocas 1,5 s pro doznění)
  function mixdown(song, env, o = {}) {
    const sr = env.sr || SR, sd = stepDur(song.bpm), total = song.len * STEPS, steps = o.steps ? Math.min(o.steps, total) : total, n = Math.round(steps * sd * sr + 1.5 * sr);
    const L = new Float32Array(n), Rr = new Float32Array(n), anySolo = song.tracks.some((t) => t.solo);   // solo: hraje jen označená stopa (ztlumení má přednost)
    for (let g = 0; g < steps; g++) {
      const off = Math.round(g * sd * sr);
      events(song, g, env).forEach((e) => {
        const tr = song.tracks[e.track]; if (tr.mute || (anySolo && !tr.solo)) return;
        const k = e.gain * tr.vol, b = e.buf, m = Math.min(b.length, n - off);
        if (e.pan === undefined) { const [gl, gr] = panGains(tr.pan); for (let i = 0; i < m; i++) { L[off + i] += b[i] * k * gl; Rr[off + i] += b[i] * k * gr; } }
        else if (e.bufR) {   // stereo sample: pan samplu i pan stopy zákonem StereoPannerNode pro stereo vstup (stejně jako to hraje živý přehrávač)
          const br = e.bufR, mm = Math.min(m, br.length), [a1, b1, c1, d1] = stereoGains(e.pan), [a2, b2, c2, d2] = stereoGains(tr.pan);
          for (let i = 0; i < mm; i++) { const xl = b[i] * k, xr = br[i] * k, il = xl * a1 + xr * b1, ir = xl * c1 + xr * d1; L[off + i] += il * a2 + ir * b2; Rr[off + i] += il * c2 + ir * d2; }
        } else {   // sample: vlastní pan (mono → stereo, rovný výkon), potom pan stopy zákonem StereoPannerNode pro stereo vstup
          const [l1, r1] = panGains(e.pan), x = tr.pan, a = x <= 0 ? x + 1 : x, cl = Math.cos(a * Math.PI / 2), cr = Math.sin(a * Math.PI / 2);
          for (let i = 0; i < m; i++) { const il = b[i] * k * l1, ir = b[i] * k * r1; if (x <= 0) { L[off + i] += il + ir * cl; Rr[off + i] += ir * cr; } else { L[off + i] += il * cl; Rr[off + i] += ir + il * cr; } }
        }
      });
    }
    let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(Rr[i]));
    S.softLimit(L); S.softLimit(Rr);
    return { L, R: Rr, sr, seconds: n / sr, peakRaw: peak };
  }

  Object.assign(S, { Song: { SR, STEPS, MAXSLOTS, NTRK, DRUMS, INST, stepDur, drumHit, patLabel, isDrumPat, defaults, sanitize, patchOf, synthNote, makeCache, events, panGains, stereoGains, mixdown } });
  if (typeof module !== 'undefined') module.exports = S;
})();

