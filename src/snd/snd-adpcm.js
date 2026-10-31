
/*
 * Zvuk & hudba · ADPCM (bez DOM, běží i v Node a v exportu hry). Jmenný prostor SND.Adpcm. Vlastní implementace, žádná knihovna.
 * Kodek je IMA/DVI ADPCM, 4 bity na vzorek: místo hodnoty vzorku se ukládá jen „o kolik se signál změnil“ v 16 stupních a krok (velikost stupně) se přizpůsobuje.
 * Je ztrátový: SNR běžně vychází kolem 20–35 dB podle signálu a jeho zlom na ostrém nástupu je vidět (krok se musí nejdřív rozjet). Proto UI vždy ukazuje změřenou chybu.
 *
 *   Formát datového proudu (stejný na disku, v JSON jako base64 i v paměti):
 *     bloky po SPB = 1017 vzorcích na kanál; za sebou bloky pro kanál 1, pak kanál 2 (stereo není proložené po vzorcích, ale po blocích).
 *     Blok = hlavička 4 B (predikce int16 LE = první vzorek přesně · index kroku 0…88 · rezervní bajt 0) + dvojice nibblů (nižší nibble je dřív); poslední blok je kratší.
 *     Mono blok o 1017 vzorcích je přesně blok WAV IMA ADPCM s blockAlign 512 (tabulky a pořadí nibblů jsou standardní), takže ho umí přečíst i cizí nástroje.
 *   Rozpočet: nejvýš 220 500 hodnot vzorků (frames × ch) CELKEM pro všechny uložené vzorky dohromady, tedy 5 s při 22 050 Hz stereo = 10 s mono; při nižším kmitočtu je to stejný objem dat a delší čas
 *     (16 kHz stereo 6,9 s, 11 kHz stereo 10 s, 8 kHz mono 27,6 s). Datově je to asi 111 kB, v JSON asi 148 kB base64. Kdo co počítá a jak: Budget níž.
 *   Převzorkování dolů: okénkové sinc (Blackman, 6 laloků) s mezním kmitočtem 0,94 × Nyquist; bez předfiltru (aa = false) se jen bere každý k-tý vzorek a vyšší kmitočty se zrcadlí.
 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const S = root.SND = root.SND || {};
  const RATES = [22050, 16000, 11025, 8000], SPB = 1017, BUDGET = 220500;
  const STEP = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767];
  const IDX = [-1, -1, -1, -1, 2, 4, 6, 8];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ---------------------------------------------------------------- base64 (vlastní: stejné ve file:// i v Node); dec vrací null pro neplatný vstup
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', B64I = new Int16Array(128).fill(-1);
  for (let i = 0; i < 64; i++) B64I[B64.charCodeAt(i)] = i;
  function b64enc(b) {
    let s = '';
    for (let i = 0; i < b.length; i += 3) {
      const n = (b[i] << 16) | ((i + 1 < b.length ? b[i + 1] : 0) << 8) | (i + 2 < b.length ? b[i + 2] : 0);
      s += B64[n >> 18 & 63] + B64[n >> 12 & 63] + (i + 1 < b.length ? B64[n >> 6 & 63] : '=') + (i + 2 < b.length ? B64[n & 63] : '=');
    }
    return s;
  }
  function b64dec(str) {
    if (typeof str !== 'string' || str.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(str)) return null;
    const pad = str.endsWith('==') ? 2 : str.endsWith('=') ? 1 : 0, out = new Uint8Array(str.length / 4 * 3 - pad);
    let o = 0;
    for (let i = 0; i < str.length; i += 4) {
      const n = (B64I[str.charCodeAt(i)] << 18) | (B64I[str.charCodeAt(i + 1)] << 12) | ((B64I[str.charCodeAt(i + 2)] & 63) << 6) | (B64I[str.charCodeAt(i + 3)] & 63);
      if (o < out.length) out[o++] = n >> 16 & 255; if (o < out.length) out[o++] = n >> 8 & 255; if (o < out.length) out[o++] = n & 255;
    }
    return out;
  }
  const b64len = (bytes) => Math.ceil(bytes / 3) * 4;

  // ---------------------------------------------------------------- velikosti a meze
  const blockBytes = (len) => 4 + Math.ceil((len - 1) / 2);
  function bytesFor(n, ch = 1) {
    let b = 0; for (let k = 0; k < n; k += SPB) b += blockBytes(Math.min(SPB, n - k));
    return b * ch;
  }
  const maxFrames = (ch) => Math.floor(BUDGET / (ch === 2 ? 2 : 1));   // snímků na kanál (frames), stejná u všech kmitočtů; liší se jen čas
  const maxSeconds = (rate, ch) => maxFrames(ch) / rate;

  // ---------------------------------------------------------------- sdílený rozpočet
  // Jedno číslo pro všechno, co se ukládá: obě patice Sampleru (jen s platným ADPCM) a všechny vlastní vzorky knihovny. Jednotka = jedna hodnota vzorku (snímky × kanály),
  // ať je vzorek ADPCM nebo PCM16. Zdroje se hlásí přes register(fn); fn vrací položky { owner, key, units, kind: 'lib' | 'slot', label }.
  // Patice, jejíž obsah (key) je shodný s vzorkem v knihovně, se počítá jednou: vzorek načtený z knihovny do patice (nebo uložený z patice do knihovny) nezabere místo dvakrát.
  // Jinak se počítá každá uložená kopie zvlášť (dvě stejné položky v knihovně jsou dvě uložená data).
  const Budget = (() => {
    const sources = [];
    // o: { skip: owner nebo pole ownerů, které se nepočítají (právě se přepisují), extra: další položky (co by přibylo) }
    function tally(o = {}) {
      const skip = new Set(o.skip === undefined ? [] : [].concat(o.skip)), items = [];
      let all = []; sources.forEach((f) => { all = all.concat(f()); }); all = all.concat(o.extra || []);
      all = all.filter((it) => !skip.has(it.owner));
      const libKeys = new Set(all.filter((it) => it.kind === 'lib').map((it) => it.key)), sum = { total: BUDGET, used: 0, lib: 0, slots: 0, shared: 0 };
      all.forEach((it) => {   // dvě kopie jednoho obsahu v knihovně, nebo ve dvou paticích, jsou dvě uložená data a počítají se dvakrát; slot se obsahem z knihovny jen sdílí
        if (it.kind === 'slot' && libKeys.has(it.key)) { sum.shared += it.units; return; }
        items.push(it); sum.used += it.units; if (it.kind === 'lib') sum.lib += it.units; else sum.slots += it.units;
      });
      sum.left = sum.total - sum.used; sum.items = items;
      return sum;
    }
    return { TOTAL: BUDGET, REF: 44100, register(f) { if (!sources.includes(f)) sources.push(f); }, tally, seconds: (units) => units / 44100 };   // sekundy v „22 kHz stereo“ (44 100 hodnot za sekundu)
  })();

  // ---------------------------------------------------------------- kodek
  const toI16 = (x) => { const o = new Int16Array(x.length); for (let i = 0; i < x.length; i++) o[i] = Math.round(clamp(x[i], -1, 1) * 32767); return o; };
  // jeden kanál do výstupu: out[pos…], vrací nový pos; st = { idx } přenáší index kroku mezi bloky
  function encodeChannelBlock(s, a, len, out, pos, st) {
    let pred = s[a], idx = st.idx;
    out[pos++] = pred & 255; out[pos++] = (pred >> 8) & 255; out[pos++] = idx; out[pos++] = 0;
    let lo = -1;
    for (let i = 1; i < len; i++) {
      let diff = s[a + i] - pred, code = 0, step = STEP[idx];
      if (diff < 0) { code = 8; diff = -diff; }
      let vp = step >> 3;
      if (diff >= step) { code |= 4; diff -= step; vp += step; }
      step >>= 1; if (diff >= step) { code |= 2; diff -= step; vp += step; }
      step >>= 1; if (diff >= step) { code |= 1; vp += step; }
      pred = clamp(code & 8 ? pred - vp : pred + vp, -32768, 32767);
      idx = clamp(idx + IDX[code & 7], 0, 88);
      if (lo < 0) lo = code; else { out[pos++] = lo | (code << 4); lo = -1; }
    }
    if (lo >= 0) out[pos++] = lo;
    st.idx = idx;
    return pos;
  }
  // chs: pole 1 nebo 2 kanálů (Float32Array stejné délky, −1…1); vrací Uint8Array
  function encode(chs) {
    const ch = chs.length, n = chs[0].length;
    if (ch < 1 || ch > 2 || !n || chs.some((c) => c.length !== n)) throw new Error('adpcm:badInput');
    const pcm = chs.map(toI16), out = new Uint8Array(bytesFor(n, ch)), sts = pcm.map(() => ({ idx: 0 }));
    let pos = 0;
    for (let a = 0; a < n; a += SPB) { const len = Math.min(SPB, n - a); for (let c = 0; c < ch; c++) pos = encodeChannelBlock(pcm[c], a, len, out, pos, sts[c]); }
    return out;
  }
  // bytes → pole kanálů Float32Array(n); vrací null, když délka dat neodpovídá (n, ch)
  function decode(bytes, n, ch = 1) {
    if (!(bytes instanceof Uint8Array) || !Number.isInteger(n) || n < 1 || (ch !== 1 && ch !== 2) || bytes.length !== bytesFor(n, ch)) return null;
    const outs = []; for (let c = 0; c < ch; c++) outs.push(new Float32Array(n));
    let pos = 0;
    for (let a = 0; a < n; a += SPB) {
      const len = Math.min(SPB, n - a);
      for (let c = 0; c < ch; c++) {
        const o = outs[c]; let pred = bytes[pos] | (bytes[pos + 1] << 8); if (pred & 0x8000) pred -= 0x10000;
        let idx = clamp(bytes[pos + 2], 0, 88); pos += 4; o[a] = Math.max(-1, pred / 32767);
        for (let i = 1; i < len; i++) {
          const b = bytes[pos], code = (i & 1) ? b & 15 : b >> 4 & 15;
          // lichý vzorek (i = 1, 3, …) je v dolním nibblu, sudý v horním; bajt se posune až po horním
          const step = STEP[idx]; let vp = step >> 3;
          if (code & 4) vp += step; if (code & 2) vp += step >> 1; if (code & 1) vp += step >> 2;
          pred = clamp(code & 8 ? pred - vp : pred + vp, -32768, 32767);
          idx = clamp(idx + IDX[code & 7], 0, 88);
          o[a + i] = Math.max(-1, pred / 32767);
          if (!(i & 1)) pos++;
        }
        if ((len - 1) & 1) pos++;   // poslední bajt s jediným nibblem
      }
    }
    return outs;
  }

  // ---------------------------------------------------------------- měření
  // SNR v dB: 10·log10(Σref² / Σ(ref−test)²); dokonalá shoda a ticho vs ticho = 120 dB (strop, ať se dá vypsat)
  function snr(ref, test) {   // ref a test: pole vzorků, nebo pole kanálů (energie se sčítá přes kanály)
    let e = 0, d = 0; const multi = Array.isArray(ref);
    (multi ? ref : [ref]).forEach((r, c) => {
      const t = multi ? test[c] : test, n = Math.min(r.length, t.length);
      for (let i = 0; i < n; i++) { e += r[i] * r[i]; const u = r[i] - t[i]; d += u * u; }
    });
    if (d <= 1e-30) return 120;
    if (e <= 1e-30) return -120;
    return clamp(10 * Math.log10(e / d), -120, 120);
  }

  // ---------------------------------------------------------------- převzorkování dolů (okénkové sinc, polyfázově)
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  function decimate(x, from, to, aa = true) {
    if (from === to) return Float32Array.from(x);
    const n = Math.max(1, Math.round(x.length * to / from)), o = new Float32Array(n), g = gcd(from, to), up = to / g, down = from / g, N = x.length;
    if (!aa) { for (let i = 0; i < n; i++) o[i] = x[Math.min(N - 1, Math.round(i * from / to))]; return o; }
    const fc = 0.5 * Math.min(1, to / from) * 0.94, HW = Math.ceil(6 / (2 * fc)), T = 2 * HW, tabs = [];
    const tab = (p) => {   // jádro pro fázi p (zlomek polohy p/up); normalizované na součet 1, aby stejnosměrná složka zůstala
      if (tabs[p]) return tabs[p];
      const w = new Float32Array(T), fr = p / up; let sum = 0;
      for (let j = 0; j < T; j++) {
        const t = (j - HW + 1) - fr, u = t / HW, xx = 2 * fc * t, sinc = Math.abs(xx) < 1e-9 ? 1 : Math.sin(Math.PI * xx) / (Math.PI * xx);
        const win = Math.abs(u) >= 1 ? 0 : 0.42 + 0.5 * Math.cos(Math.PI * u) + 0.08 * Math.cos(2 * Math.PI * u);
        w[j] = 2 * fc * sinc * win; sum += w[j];
      }
      for (let j = 0; j < T; j++) w[j] /= sum;
      return (tabs[p] = w);
    };
    for (let i = 0; i < n; i++) {
      const num = i * down, base = Math.floor(num / up), w = tab(num % up); let s = 0;
      for (let j = 0; j < T; j++) s += w[j] * x[clamp(base + j - HW + 1, 0, N - 1)];
      o[i] = s;
    }
    return o;
  }

  // ---------------------------------------------------------------- záznam sampleu: { sr, n, ch, adpcm: base64 } (stejný tvar má vzorek v knihovně)
  const pack = (chs, rate) => { const bytes = encode(chs); return { bytes, rec: { sr: rate, n: chs[0].length, ch: chs.length, adpcm: b64enc(bytes) } }; };
  function unpack(rec) {
    if (!rec || typeof rec !== 'object' || !RATES.includes(rec.sr) || (rec.ch !== 1 && rec.ch !== 2) || !Number.isInteger(rec.n) || rec.n < 1 || rec.n * rec.ch > BUDGET) return null;
    if (typeof rec.adpcm !== 'string' || rec.adpcm.length !== b64len(bytesFor(rec.n, rec.ch))) return null;
    const bytes = b64dec(rec.adpcm); if (!bytes) return null;
    const chs = decode(bytes, rec.n, rec.ch); return chs ? { chs, sr: rec.sr, bytes } : null;
  }

  S.Adpcm = { RATES, SPB, BUDGET, Budget, STEP, IDX, bytesFor, b64len, maxFrames, maxSeconds, encode, decode, snr, decimate, pack, unpack, b64enc, b64dec };
  if (typeof module !== 'undefined') module.exports = S;
})();

