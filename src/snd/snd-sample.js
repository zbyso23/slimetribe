
/*
 * Zvuk & hudba · jádro Sampleru (bez DOM, běží i v Node): nedestruktivní úpravy samplu. Původní PCM se nikdy nemění; uchovávají se jen parametry
 * a výsledek se z nich spočítá znovu (Sample.process). Pořadí: ořez → úpravy úseků (vyjmout / ticho / vložit, se zdrojovým crossfadem) → reverse → EQ (3 pásma) → zkreslení → echo → zesílení → fade → normalizace.
 * Úpravy úseků jsou seznam params.edits v čase ZDROJE (ne výsledku): {t:'cut',a,b} vyjme, {t:'sil',at,d} vloží ticho, {t:'ins',a,b,at} vloží kopii úseku zdroje.
 * Švy se spojují crossfadem z materiálu kolem střihu (délka zůstane přesně součtem kousků), u ticha krátkým declickem.
 * Počítá se v JS, ne přes OfflineAudioContext: stejný kód slouží laboratoři, Song sekvenceru i exportu a jde otestovat v Node. Sample je mono, 44,1 kHz.
 * SND.Samples = dvě sdílené patice (Sampler je plní, Song je spouští).
 * Stereo a ADPCM: patice může mít dva kanály (srcL, srcR; src je jejich součet pro zobrazení a střih). Úpravy běží na obou kanálech stejně, normalizace je společná, aby se nepřevážil obraz.
 * Poslední (nepovinný) stupeň params.adpcm = { on, rate, ch, aa } sampl převzorkuje na 22/16/11/8 kHz, zakóduje IMA ADPCM (snd-adpcm.js), hned dekóduje a vrátí na 44,1 kHz:
 * to, co slyšíš ve Songu a co se uloží, je tedy přesně ADPCM verze. Patice s platným ADPCM se ukládají v prohlížeči (persist) jako base64; result je mono součet (WAV, zobrazení), resL/resR jsou skutečné kanály a ty hraje i Song (stereo).
 * Rozpočet: ADPCM patice se počítají do společného rozpočtu uložených vzorků (SND.Adpcm.Budget) spolu s knihovnou; nový převod smí zabrat jen to, co zbývá po ostatních (stejný obsah se počítá jednou).
 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const S = root.SND = root.SND || {};
  if (typeof require !== 'undefined' && !S.Adpcm) require('./snd-adpcm.js');
  const SR = 44100, MAXSEC = 600, MAXEDITS = 64, XF_MAX = 50, FADES = ['lin', 'easein', 'easeout', 'scurve'], DISTS = ['off', 'soft', 'tube', 'fuzz'];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const db2 = (d) => 10 ** (d / 20);

  const defaults = () => ({ start: 0, end: -1, edits: [], xf: 5, rev: false, gain: 0, norm: false, fadeIn: 0, fadeOut: 0, curveIn: 'lin', curveOut: 'lin', eq: { lo: 0, mid: 0, hi: 0 }, dist: { type: 'off', drive: 0.4, mix: 1 }, delay: { time: 0.25, fb: 0.3, wet: 0 }, adpcm: { on: false, rate: 22050, ch: 2, aa: true } });
  // import z JSON / z UI: jen známé klíče a meze
  function sanitize(d, dur) {
    const p = defaults(), num = (v, a, b, def) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : def);
    if (!d || typeof d !== 'object') return p;
    p.start = num(d.start, 0, dur, 0); p.end = d.end < 0 ? -1 : num(d.end, p.start, dur, -1); p.xf = num(d.xf, 0, XF_MAX, 5);
    if (Array.isArray(d.edits)) d.edits.slice(0, MAXEDITS).forEach((o) => {
      if (!o || typeof o !== 'object') return; const t = (v) => num(v, 0, dur, NaN);
      if (o.t === 'cut') { const a = t(o.a), b = t(o.b); if (b > a) p.edits.push({ t: 'cut', a, b }); }
      else if (o.t === 'sil') { const at = t(o.at), L = num(o.d, 0.001, 10, NaN); if (at === at && L === L) p.edits.push({ t: 'sil', at, d: L }); }
      else if (o.t === 'ins') { const a = t(o.a), b = t(o.b), at = t(o.at); if (b > a && at === at) p.edits.push({ t: 'ins', a, b, at }); }
    }); p.rev = !!d.rev; p.gain = num(d.gain, -48, 24, 0); p.norm = !!d.norm;
    p.fadeIn = num(d.fadeIn, 0, 30, 0); p.fadeOut = num(d.fadeOut, 0, 30, 0); p.curveIn = FADES.includes(d.curveIn) ? d.curveIn : 'lin'; p.curveOut = FADES.includes(d.curveOut) ? d.curveOut : 'lin';
    if (d.eq) ['lo', 'mid', 'hi'].forEach((k) => { p.eq[k] = num(d.eq[k], -18, 18, 0); });
    if (d.dist) { p.dist.type = DISTS.includes(d.dist.type) ? d.dist.type : 'off'; p.dist.drive = num(d.dist.drive, 0, 1, 0.4); p.dist.mix = num(d.dist.mix, 0, 1, 1); }
    if (d.delay) { p.delay.time = num(d.delay.time, 0.02, 1.5, 0.25); p.delay.fb = num(d.delay.fb, 0, 0.85, 0.3); p.delay.wet = num(d.delay.wet, 0, 1, 0); }
    if (d.adpcm && typeof d.adpcm === 'object') { const a = d.adpcm; p.adpcm.on = !!a.on; p.adpcm.rate = S.Adpcm.RATES.includes(a.rate) ? a.rate : 22050; p.adpcm.ch = a.ch === 1 ? 1 : 2; p.adpcm.aa = a.aa !== false; }
    return p;
  }

  const mono = (chs) => { if (chs.length === 1) return Float32Array.from(chs[0]); const o = new Float32Array(chs[0].length), k = 1 / chs.length; chs.forEach((c) => { for (let i = 0; i < o.length; i++) o[i] += c[i] * k; }); return o; };
  // lineární převzorkování (stačí pro nahrávky; není to kvalitní sinc)
  function resample(x, from, to) {
    if (from === to) return Float32Array.from(x);
    const n = Math.max(1, Math.round(x.length * to / from)), o = new Float32Array(n), r = from / to;
    for (let i = 0; i < n; i++) { const t = i * r, k = Math.floor(t), f = t - k; o[i] = (x[k] || 0) * (1 - f) + (x[Math.min(k + 1, x.length - 1)] || 0) * f; }
    return o;
  }
  const fadeCurve = { lin: (u) => u, easein: (u) => u * u, easeout: (u) => 1 - (1 - u) * (1 - u), scurve: (u) => u * u * (3 - 2 * u) };
  const shapeDist = (type, k) => {
    if (type === 'soft') { const n = Math.tanh(k); return (v) => Math.tanh(k * v) / n; }
    if (type === 'tube') { const n = Math.tanh(k), off = Math.tanh(k * 0.15); return (v) => (Math.tanh(k * (v + 0.15)) - off) / n; }   // nesymetrické: sudé harmonické
    return (v) => 0.5 * Math.tanh(k * v) + 0.5 * clamp(k * v, -0.8, 0.8) / 0.8;   // fuzz: ostřejší ořez
  };

  // ---- úpravy úseků: ořez → seznam kousků zdroje a ticha → spojení se švy
  // kousky: {k:'s', a, b} = zdroj [a,b) ve vzorcích, {k:'z', n} = n vzorků ticha. Události (ticho, vložení) jsou řazeny podle polohy a pořadí vzniku; leží-li poloha uvnitř vyjmutého úseku, přesune se na jeho začátek.
  function buildPieces(N, sr, p) {
    const s0 = clamp(Math.round(p.start * sr), 0, N), e0 = p.end < 0 ? N : clamp(Math.round(p.end * sr), s0, N), ops = p.edits || [], q = (v) => Math.round(v * sr);
    const cuts = ops.filter((o) => o.t === 'cut').map((o) => [clamp(q(o.a), s0, e0), clamp(q(o.b), s0, e0)]).filter((c) => c[1] > c[0]).sort((u, v) => u[0] - v[0]), cm = [];
    cuts.forEach((c) => { const l = cm[cm.length - 1]; if (l && c[0] <= l[1]) l[1] = Math.max(l[1], c[1]); else cm.push(c.slice()); });
    const kept = []; let c0 = s0; cm.forEach((c) => { if (c[0] > c0) kept.push([c0, c[0]]); c0 = c[1]; }); if (c0 < e0) kept.push([c0, e0]);
    const ev = [];
    ops.forEach((o) => {
      if (o.t !== 'sil' && o.t !== 'ins') return; let t = clamp(q(o.at), s0, e0); const hit = cm.find((c) => t > c[0] && t < c[1]); if (hit) t = hit[0];
      if (o.t === 'sil') { const n = Math.round(o.d * sr); if (n > 0) ev.push({ t, k: 'z', n }); }
      else { const a = clamp(q(o.a), 0, N), b = clamp(q(o.b), 0, N); if (b > a) ev.push({ t, k: 's', a, b }); }
    });
    ev.sort((u, v) => u.t - v.t);   // řazení je stabilní, takže stejná poloha drží pořadí vzniku
    const out = [], emit = (k) => { out.push(k.k === 'z' ? { k: 'z', n: k.n } : { k: 's', a: k.a, b: k.b }); }; let ei = 0;
    kept.forEach(([a, b]) => {
      while (ei < ev.length && ev[ei].t <= a) emit(ev[ei++]);
      let cur = a;
      while (ei < ev.length && ev[ei].t < b) { const e = ev[ei++]; if (e.t > cur) out.push({ k: 's', a: cur, b: e.t }); cur = Math.max(cur, e.t); emit(e); }
      if (b > cur) out.push({ k: 's', a: cur, b });
    });
    while (ei < ev.length) emit(ev[ei++]);
    const m = [];   // slití souvislých kousků zdroje a vyřazení prázdných
    out.forEach((k) => { if ((k.k === 's' && k.b <= k.a) || (k.k === 'z' && k.n <= 0)) return; const l = m[m.length - 1]; if (l && l.k === 's' && k.k === 's' && l.b === k.a) l.b = k.b; else m.push(k); });
    return m;
  }
  const pieceLen = (k) => (k.k === 'z' ? k.n : k.b - k.a);
  function assemble(src, p, sr = SR) {
    const N = src.length, pcs = buildPieces(N, sr, p);
    if (!pcs.length) return new Float32Array(0);
    if (!(p.edits && p.edits.length)) return src.slice(pcs[0].a, pcs[0].b);
    const H = Math.round(clamp(p.xf == null ? 5 : p.xf, 0, XF_MAX) / 1000 * sr / 2), cap = MAXSEC * sr;
    // h[i] = půl-délka švu mezi kouskem i a i+1 (jen zdroj→zdroj; u ticha jde o declick bez změny délky)
    const h = pcs.map((k, i) => { const nx = pcs[i + 1]; if (!nx || k.k !== 's' || nx.k !== 's') return 0; return Math.max(0, Math.min(H, Math.floor(pieceLen(k) / 2), Math.floor(pieceLen(nx) / 2), N - k.b, nx.a)); });
    let total = 0; pcs.forEach((k, i) => { total += pieceLen(k) - (i ? h[i - 1] : 0) - h[i] + 2 * h[i]; });
    const out = new Float32Array(Math.min(total, cap)); let pos = 0;
    for (let i = 0; i < pcs.length && pos < out.length; i++) {
      const k = pcs[i], hl = i ? h[i - 1] : 0, hr = h[i];
      if (k.k === 'z') { pos += k.n; continue; }
      const a = k.a + hl, b = k.b - hr, len = b - a, start = pos;
      for (let j = 0; j < len && pos < out.length; j++) out[pos++] = src[a + j];
      const fl = Math.min(2 * H, Math.floor(pieceLen(k) / 2));   // declick u ticha
      if (i && pcs[i - 1].k === 'z') for (let j = 0; j < fl && start + j < out.length; j++) out[start + j] *= (j + 0.5) / fl;
      if (pcs[i + 1] && pcs[i + 1].k === 'z') for (let j = 0; j < fl && pos - 1 - j >= start; j++) out[pos - 1 - j] *= (j + 0.5) / fl;
      if (hr) { const L = 2 * hr; for (let j = 0; j < L && pos < out.length; j++) { const w = (j + 0.5) / L; out[pos++] = src[k.b - hr + j] * (1 - w) + src[pcs[i + 1].a - hr + j] * w; } }
    }
    return out;
  }
  // čisté funkce nad params (UI i testy): vrací true, pokud se seznam změnil
  const Edit = {
    count: (p) => (p.edits || []).length,
    full: (p) => (p.edits || []).length >= MAXEDITS,
    cut(p, a, b) { if (Edit.full(p) || !(b > a)) return false; p.edits.push({ t: 'cut', a, b }); return true; },
    sil(p, at, d) { if (Edit.full(p) || !(d > 0)) return false; p.edits.push({ t: 'sil', at, d: clamp(d, 0.001, 10) }); return true; },
    ins(p, a, b, at) { if (Edit.full(p) || !(b > a)) return false; p.edits.push({ t: 'ins', a, b, at }); return true; },
    mute(p, a, b) { if (Edit.full(p) || Edit.count(p) > MAXEDITS - 2 || !(b > a)) return false; p.edits.push({ t: 'cut', a, b }, { t: 'sil', at: a, d: b - a }); return true; },
    remove(p, i) { if (i < 0 || i >= Edit.count(p)) return false; p.edits.splice(i, 1); return true; },
    pop(p) { return !!p.edits.pop(); },
    clear(p) { const had = Edit.count(p) > 0; p.edits = []; return had; },
    // délka výsledku úpravy úseků (s) při ořezu, bez efektů; pro UI
    summary(p) { const c = { cut: 0, sil: 0, ins: 0 }; (p.edits || []).forEach((o) => { c[o.t]++; }); return c; },
  };

  function process(src, p, sr = SR) {
    let x = assemble(src, p, sr); if (!x.length) return new Float32Array(0);
    if (p.rev) x.reverse();
    [['lowshelf', 200, 0.7, p.eq.lo], ['peak', 1000, 0.9, p.eq.mid], ['highshelf', 4000, 0.7, p.eq.hi]].forEach(([t, f, q, g]) => { if (g) x = S.biquadRun(S.biquad(t, f, q, sr, g), x); });
    if (p.dist.type !== 'off' && p.dist.mix > 0) { const f = shapeDist(p.dist.type, 1 + p.dist.drive * 24), m = p.dist.mix; for (let i = 0; i < x.length; i++) x[i] = x[i] * (1 - m) + f(x[i]) * m; }
    if (p.delay.wet > 0) x = S.delayFx(x, sr, p.delay.time, Math.min(0.85, p.delay.fb), p.delay.wet);
    const g = db2(p.gain); if (g !== 1) for (let i = 0; i < x.length; i++) x[i] *= g;
    const nIn = Math.min(x.length, Math.round(p.fadeIn * sr)), nOut = Math.min(x.length, Math.round(p.fadeOut * sr)), fi = fadeCurve[p.curveIn], fo = fadeCurve[p.curveOut];
    for (let i = 0; i < nIn; i++) x[i] *= fi(i / nIn);
    for (let i = 0; i < nOut; i++) x[x.length - 1 - i] *= fo(i / nOut);   // poslední vzorek má gain ≈ 0
    if (p.norm) { let m = 0; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i])); if (m > 1e-9) { const k = db2(-1) / m; for (let i = 0; i < x.length; i++) x[i] *= k; } }
    return x;
  }

  // nejbližší průchod nulou k indexu i (změna znaménka) v okně ±range vzorků; jinak i
  // dir = 1: jen vzestupný průchod (− → +), −1: jen sestupný; střih na stejném druhu průchodu navazuje na stejný sklon vlny
  function snapZero(x, i, range = 2000, dir = 0) {
    i = clamp(Math.round(i), 0, x.length - 1); let best = i, bd = Infinity;
    for (let d = 0; d <= range; d++) for (const j of d ? [i - d, i + d] : [i]) { if (j < 1 || j >= x.length) continue; const up = x[j - 1] <= 0 && x[j] > 0, dn = x[j - 1] >= 0 && x[j] < 0; if ((dir >= 0 && up) || (dir <= 0 && dn) || (!dir && x[j] === 0)) { if (d < bd) { bd = d; best = j; } } }
    return best;
  }
  // min/max pro vykreslení: cols sloupců přes okno [i0, i0+span); hustý pohled čte malé okno, takže je přesný
  function envelope(x, i0, span, cols) {
    const mn = new Float32Array(cols), mx = new Float32Array(cols), per = span / cols;
    for (let c = 0; c < cols; c++) {
      const a = Math.max(0, Math.floor(i0 + c * per)), b = Math.min(x.length, Math.max(a + 1, Math.floor(i0 + (c + 1) * per)));
      let lo = 0, hi = 0, any = false; for (let i = a; i < b; i++) { const v = x[i]; if (!any) { lo = hi = v; any = true; } else { if (v < lo) lo = v; if (v > hi) hi = v; } }
      mn[c] = lo; mx[c] = hi;
    }
    return { mn, mx };
  }
  const peakOf = (x) => { let m = 0; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i])); return m; };
  const rmsOf = (x) => { let e = 0; for (let i = 0; i < x.length; i++) e += x[i] * x[i]; return Math.sqrt(e / Math.max(1, x.length)); };
  const countClip = (x) => { let n = 0; for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > 1) n++; return n; };

  // ---- stereo a ADPCM stupeň
  const mix2 = (L, R) => { const o = new Float32Array(L.length); for (let i = 0; i < o.length; i++) o[i] = 0.5 * (L[i] + R[i]); return o; };
  const fit = (x, n) => { if (x.length === n) return x; const o = new Float32Array(n); o.set(x.length > n ? x.subarray(0, n) : x); return o; };
  // převod výsledku (L, R nebo null) na ADPCM podle cfg = params.adpcm; vrací info { ok, … } a při ok i dekódované kanály ve 44,1 kHz (L, R) a bajty (bytes)
  // left = kolik hodnot vzorků ještě zbývá ve společném rozpočtu (výchozí: celý); frames × ch musí do něj vejít
  function adpcmStage(L, R, cfg, sr = SR, left = S.Adpcm.BUDGET) {
    const A = S.Adpcm, rate = cfg.rate, ch = R ? cfg.ch : 1, N = L.length, frames = Math.max(1, Math.round(N * rate / sr)), max = Math.max(0, Math.floor(left / ch));
    const info = { ok: false, rate, ch, aa: cfg.aa !== false, frames, max, sec: N / sr, maxSec: max / rate, nyq: rate / 2, pcmBytes: N * 2 * (R ? 2 : 1), need: frames * ch, left: Math.max(0, left) };
    if (frames > max) return info;
    const ins = ch === 2 ? [L, R] : [R ? mix2(L, R) : L], dec = ins.map((c) => A.decimate(c, sr, rate, info.aa)), packed = A.pack(dec, rate), bytes = packed.bytes, out = A.decode(bytes, frames, ch);
    const up = out.map((c) => fit(resample(c, rate, sr), N));
    return Object.assign(info, { ok: true, bytes, rec: packed.rec, units: frames * ch, b64: A.b64len(bytes.length), ratio: info.pcmBytes / bytes.length, snrCodec: A.snr(dec, out), snrTotal: A.snr(ins, up), L: up[0], R: ch === 2 ? up[1] : null });
  }
  // výsledek patice: s.result (mono součet pro Song a WAV), s.resL / s.resR (skutečné kanály), s.pre (před ADPCM) a s.ad (info o ADPCM nebo null); vrací s
  function render(s, sr = SR) {
    const p = s.params, stereo = !!(s.srcL && s.srcR);
    if (s.fixed && s.fixed.sig === JSON.stringify(p)) {   // obnovený ADPCM sampl bez dalších úprav: použijí se uložené bajty, nekóduje se podruhé
      const f = s.fixed; s.resL = f.L; s.resR = f.R; s.result = f.R ? mix2(f.L, f.R) : f.L; s.pre = { L: f.L, R: f.R }; s.ad = f.ad; return s;
    }
    let L, R = null;
    if (!stereo) L = process(s.src, p, sr);
    else {
      const q = Object.assign({}, p, { norm: false }); L = process(s.srcL, q, sr); R = process(s.srcR, q, sr);
      if (p.norm) { const m = Math.max(peakOf(L), peakOf(R)); if (m > 1e-9) { const k = db2(-1) / m; for (let i = 0; i < L.length; i++) { L[i] *= k; R[i] *= k; } } }
    }
    const pre = { L, R }; let ad = null;
    if (p.adpcm.on && L.length) { const i = Samples.indexOf(s); ad = adpcmStage(L, R, p.adpcm, sr, S.Adpcm.Budget.tally({ skip: i >= 0 ? 'slot:' + i : undefined }).left); if (ad.ok) { L = ad.L; R = ad.R; } }
    s.resL = L; s.resR = R; s.result = R ? mix2(L, R) : L; s.pre = ad && ad.ok ? pre : { L, R }; s.ad = ad;
    return s;
  }

  // ---- patice: společné pro Sampler (plní) a Song (čte): { name, src, srcL?, srcR?, dur, params, result, resL, resR, pre, ad, rev, fixed? }
  const Samples = [null, null];
  // patice s platným ADPCM jsou uložené vzorky, a proto se počítají do společného rozpočtu (bez ADPCM jsou jen pracovní, neukládají se)
  S.Adpcm.Budget.register(() => Samples.map((s, i) => (s && s.ad && s.ad.ok && s.ad.rec ? { owner: 'slot:' + i, kind: 'slot', key: s.ad.rec.adpcm, units: s.ad.units, label: s.name } : null)).filter(Boolean));
  function setSlot(i, o) { Samples[i] = o; touch(); }
  const slotName = (n) => String(n === undefined || n === null ? '' : n).replace(/[\u0000-\u001f<>&"`]/g, '').slice(0, 80);
  // ukládá se jen patice s platným ADPCM (bajty, které se opravdu přehrávají), ostatní se do úložiště nedostanou
  function adpcmData(s) {   // tvar vzorku v knihovně { sr, n, ch, adpcm }
    if (!(s && s.ad && s.ad.ok && s.ad.bytes)) return null;
    return { sr: s.ad.rate, n: s.ad.frames, ch: s.ad.ch, adpcm: S.Adpcm.b64enc(s.ad.bytes) };
  }
  const slotRecord = (s) => { const d = adpcmData(s); return d && Object.assign({ name: slotName(s.name) }, d); };
  // obnova patice ze záznamu: dekódovaný ADPCM je nový zdroj (původní úpravy se neukládají, jen výsledek); vrací null při poškozených datech
  function slotFromRecord(rec) {
    const u = S.Adpcm.unpack(rec); if (!u) return null;
    const cfg = { on: true, rate: u.sr, ch: u.chs.length, aa: true }, up = u.chs.map((c) => resample(c, u.sr, SR)), N = up[0].length;
    const params = defaults(); params.adpcm = cfg;
    const s = { name: slotName(rec.name) || 'ADPCM', src: up.length === 2 ? mix2(up[0], up[1]) : up[0], dur: N / SR, params, result: null, rev: 0 };
    if (up.length === 2) { s.srcL = up[0]; s.srcR = up[1]; }
    const ad = { ok: true, rate: u.sr, ch: u.chs.length, aa: true, frames: rec.n, max: S.Adpcm.maxFrames(u.chs.length), sec: N / SR, maxSec: S.Adpcm.maxSeconds(u.sr, u.chs.length), nyq: u.sr / 2, pcmBytes: N * 2 * u.chs.length, bytes: u.bytes, rec: { sr: rec.sr, n: rec.n, ch: rec.ch, adpcm: rec.adpcm }, units: rec.n * u.chs.length, b64: rec.adpcm.length, ratio: N * 2 * u.chs.length / u.bytes.length, snrCodec: null, snrTotal: null, restored: true };
    s.fixed = { sig: JSON.stringify(params), L: up[0], R: up[1] || null, ad };
    return render(s);
  }
  // úložiště v prohlížeči (jen pohodlí; autoritativní je export JSON z knihovny). Zapíná je editor, nikdy běh hry.
  const KEY0 = 'edu.sampler.slots.v1';
  let KEY = KEY0, persisting = false, timer = 0, lastOk = true;
  const back = () => { try { return root.EDUStore || root.localStorage || null; } catch (e) { return null; } };   // v aplikaci EDUStore (IndexedDB), jinak localStorage
  const lsGet = () => { try { const b = back(); return b ? b.getItem(KEY) : null; } catch (e) { return null; } };
  function save() {
    try {
      const b = back();
      if (!b) { lastOk = false; return false; }
      const slots = Samples.map(slotRecord);
      if (slots.some(Boolean)) b.setItem(KEY, JSON.stringify({ v: 1, slots })); else b.removeItem(KEY);
      lastOk = true; return true;
    } catch (e) { lastOk = false; return false; }   // soukromý režim nebo plné úložiště
  }
  function load() {
    const txt = lsGet(); if (!txt) return;
    try { const o = JSON.parse(txt); (Array.isArray(o.slots) ? o.slots.slice(0, 2) : []).forEach((rec, i) => { if (rec && !Samples[i]) { const s = slotFromRecord(rec); if (s) Samples[i] = s; } }); } catch (e) { /* poškozený záznam se přepíše při příštím uložení */ }
  }
  function touch() { if (persisting && typeof setTimeout === 'function') { clearTimeout(timer); timer = setTimeout(save, 500); } }
  function persist(prefix) {
    if (persisting || !back()) return; persisting = true; KEY = (prefix || '') + KEY0;
    if (root.EDUStore && root.EDUStore.whenReady) root.EDUStore.whenReady(load); else load();     // IndexedDB se načítá asynchronně
  }

  Object.assign(S, {
    Sample: { SR, ADPCM_RATES: S.Adpcm.RATES, MAXSEC, MAXEDITS, XF_MAX, Edit, buildPieces, assemble, FADES, DISTS, defaults, sanitize, mono, mix2, resample, process, render, adpcmStage, snapZero, envelope, peakOf, rmsOf, countClip, fadeCurve, adpcmData, slotRecord, slotFromRecord, persist, touch, save, load, get persisting() { return persisting; }, get saveOk() { const E = root.EDUStore; return lastOk && !(E && E.status && E.status().error); } },
    Samples, setSampleSlot: setSlot,
  });
  if (typeof module !== 'undefined') module.exports = S;
})();

