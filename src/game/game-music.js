
/*
 * Game · hudba pro hry: bubeník + 2 syntaky, postavená znovupoužitím Song sekvenceru (snd/snd-song.js). Žádné vzorky ani Sampler. Jmenný prostor GAME.Music.
 * Tady jsou jen DATA (tři smyčky, předvolby syntaků a pomůcky); hraje je GAME.Audio (game-audio.js) a počítá je SND.Song.mixdown.
 *
 *   GAME.Music.NAMES            ['rtype', 'dyna', 'axe']    smyčky „ve stylu“ (vlastní skladby, ne přepisy): R-Type like, Dyna Blaster like, Golden Axe like
 *   GAME.Music.song(name)       → nový Song model (JSON pro SND.Song.sanitize), 3 stopy: bicí, syntak 1 (basa), syntak 2 (melodie); čtvrtá stopa prázdná
 *   GAME.Music.META[name]       { bpm, key, chords[8], style } – kdo a co hraje; podle toho testy hlídají, že noty sedí na akordy a do stupnice
 *   GAME.Music.PRESETS          předvolby syntaků ve stejném tvaru jako SND.PRESETS (funkce, které upraví patch): g-bass g-sqbass g-lead g-sawlead g-pluck
 *   GAME.Music.clean(song)      → kopie bez bitů Sampleru v bicích (16 a 32), takže hra nikdy nezávisí na nahraných vzorcích
 *   GAME.Music.parse(str, kind) 'A2 - C3 …' → osm čísel patternu (noty: MIDI; '-' pauza) · 'kh h sh …' → bitové masky bicích (k kick, s snare, h hat, p perc)
 *
 * Poctivé meze (jsou dané Song jádrem, ne tímhle souborem): 8 kroků (osmin) na takt, jeden tón na krok, tón trvá 90 % kroku (držené tóny se dělají opakováním),
 * dva syntaky = nejvýš dva hlasy najednou, bicí jsou počítané (ne nahrané), takže znějí „čipově“. Zní to, jak to zní: tento soubor jsem napsal bez poslechu,
 * správnost not (akordy, stupnice, délky) hlídají testy, líbivost ne.
 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const G = root.GAME = root.GAME || {};
  const STEPS = 8, MAXSLOTS = 256;

  // ---------------------------------------------------------------- zápis
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function note(s) {   // 'A2', 'F#3', 'Bb1' → MIDI (C-1 = 0, A4 = 69); '-' = pauza (0)
    if (s === '-') return 0;
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(s); if (!m) throw new Error('note ' + s);
    return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  const DR = { k: 1, s: 2, h: 4, p: 8 };
  function parse(str, kind) {
    const t = String(str).trim().split(/\s+/); if (t.length !== STEPS) throw new Error('pattern má mít ' + STEPS + ' kroků: ' + str);
    return t.map((x) => (kind === 'drum' ? (x === '-' ? 0 : [...x].reduce((a, c) => a | DR[c], 0)) : note(x)));
  }

  // ---------------------------------------------------------------- předvolby syntaků (tvar jako SND.PRESETS: funkce upravující patch z SND.DEFAULT_PATCH)
  const PRESETS = {
    'g-bass': (p) => Object.assign(p, { osc: { shape: 'saw', detune: 0, sub: 0.5, fmRatio: 0, fmIndex: 0, blep: true }, filter: { type: 'lp', cutoff: 420, q: 2.5, env: 2.5 }, aenv: { a: 0.003, d: 0.16, s: 0.55, r: 0.05 }, fenv: { a: 0.001, d: 0.12, s: 0.15, r: 0.05 }, lfo: { rate: 5, depth: 0, target: 'pitch' }, drive: 0.2 }),
    'g-sqbass': (p) => Object.assign(p, { osc: { shape: 'square', detune: 0, sub: 0, fmRatio: 0, fmIndex: 0, blep: true }, filter: { type: 'lp', cutoff: 600, q: 1.5, env: 2 }, aenv: { a: 0.003, d: 0.1, s: 0.7, r: 0.04 }, fenv: { a: 0.001, d: 0.1, s: 0.2, r: 0.04 }, lfo: { rate: 5, depth: 0, target: 'pitch' }, drive: 0.1 }),
    'g-lead': (p) => Object.assign(p, { osc: { shape: 'square', detune: 7, sub: 0, fmRatio: 0, fmIndex: 0, blep: true }, filter: { type: 'lp', cutoff: 3000, q: 1.2, env: 1 }, aenv: { a: 0.006, d: 0.1, s: 0.75, r: 0.07 }, fenv: { a: 0.004, d: 0.2, s: 0.4, r: 0.07 }, lfo: { rate: 5.5, depth: 0.12, target: 'pitch' }, drive: 0 }),
    'g-sawlead': (p) => Object.assign(p, { osc: { shape: 'saw', detune: 6, sub: 0, fmRatio: 0, fmIndex: 0, blep: true }, filter: { type: 'lp', cutoff: 2200, q: 1.5, env: 1.5 }, aenv: { a: 0.01, d: 0.12, s: 0.7, r: 0.1 }, fenv: { a: 0.006, d: 0.25, s: 0.35, r: 0.1 }, lfo: { rate: 5, depth: 0.15, target: 'pitch' }, drive: 0.08 }),
    'g-pluck': (p) => Object.assign(p, { osc: { shape: 'square', detune: 0, sub: 0, fmRatio: 0, fmIndex: 0, blep: true }, filter: { type: 'lp', cutoff: 1800, q: 1, env: 3 }, aenv: { a: 0.002, d: 0.13, s: 0.05, r: 0.06 }, fenv: { a: 0.001, d: 0.1, s: 0, r: 0.06 }, lfo: { rate: 5, depth: 0, target: 'pitch' }, drive: 0 }),
  };

  // ---------------------------------------------------------------- skladby (vlastní, „ve stylu“)
  // Rozvržení patternů v Song modelu: 0…7 = bicí D1…D8, 8…15 = syntaky S1…S8 (sdílené oběma syntaky). Basa používá S1…S4, melodie S5…S8.
  // chords: akord každého ze 8 taktů (kořen a tóny akordu) – pro kontrolu v testech.
  const CH = { Am: [9, 0, 4], F: [5, 9, 0], G: [7, 11, 2], E: [4, 8, 11], C: [0, 4, 7], D: [2, 6, 9], Em: [4, 7, 11], B: [11, 3, 6] };
  const DEFS = {
    rtype: {
      bpm: 138, key: 'Am', scale: [9, 11, 0, 2, 4, 5, 7], style: 'temný pochod, osminová basa s oktávovými skoky, krátké smutně-hrdé motivy',
      chords: ['Am', 'Am', 'F', 'F', 'G', 'G', 'F', 'E'],
      drums: ['kh h sh h kh h sh h', 'kh h sh h kh s s sp', 'kh h sh kh kh h sh sp'], drumSlots: [0, 0, 0, 0, 0, 0, 2, 1],
      bass: ['A1 A1 A2 A1 A1 A2 A1 A2', 'F1 F1 F2 F1 F1 F2 F1 F2', 'G1 G1 G2 G1 G1 G2 G1 G2', 'E1 E1 E2 E1 E1 E2 G#1 B1'], bassSlots: [0, 0, 1, 1, 2, 2, 1, 3],
      lead: ['A4 - C5 - E5 - D5 C5', 'E5 - D5 C5 A4 - C5 -', 'F5 - E5 C5 A4 - C5 F4', 'G4 - B4 D5 G5 - D5 B4'], leadSlots: [0, 1, 2, 2, 3, 3, 2, -1],
      syn: [{ preset: 'g-bass', cutoff: 380 }, { preset: 'g-lead', cutoff: 3200 }], vol: [0.7, 0.8, 0.5], pan: [0, -0.1, 0.18],
    },
    dyna: {
      bpm: 152, key: 'C', scale: [0, 2, 4, 5, 7, 9, 11], style: 'veselé poskakování, basa oom-pah, hravá melodie po stupnici',
      chords: ['C', 'C', 'F', 'F', 'G', 'G', 'C', 'G'],
      drums: ['kh h sh h kh kh sh h', 'kh h sh h kh sh sh sp'], drumSlots: [0, 0, 0, 0, 0, 0, 0, 1],
      bass: ['C2 - G2 - C3 - G2 -', 'F2 - C3 - F3 - C3 -', 'G2 - D3 - G3 - D3 B2'], bassSlots: [0, 0, 1, 1, 2, 2, 0, 2],
      lead: ['E5 G5 E5 C5 G5 E5 C5 -', 'C6 - B5 A5 G5 - E5 G5', 'A5 - F5 A5 C6 - A5 F5', 'B5 - G5 B5 D6 - B5 G5'], leadSlots: [0, 1, 2, 2, 3, 3, 0, 3],
      syn: [{ preset: 'g-sqbass', cutoff: 700 }, { preset: 'g-pluck', cutoff: 3600 }], vol: [0.65, 0.75, 0.55], pan: [0, -0.1, 0.2],
    },
    axe: {
      bpm: 96, key: 'Em', scale: [4, 6, 7, 9, 11, 0, 2], style: 'hrdinský pochod, pedál v basu s kvintami, fanfárová melodie',
      chords: ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'B'],
      drums: ['kh p sh p kh p sh p', 'kh p sh p k s s sp'], drumSlots: [0, 0, 0, 0, 0, 0, 0, 1],
      bass: ['E2 - E2 B2 E2 - B2 G2', 'C2 - C2 G2 C2 - G2 E2', 'D2 - D2 A2 D2 - A2 F#2', 'B1 - B1 F#2 B1 - F#2 D#2'], bassSlots: [0, 0, 1, 2, 0, 0, 1, 3],
      lead: ['E5 - B4 - E5 - G5 -', 'B5 - A5 G5 E5 - G5 B5', 'C6 - G5 - E5 - G5 -', 'D6 - A5 - F#5 - A5 -'], leadSlots: [0, 1, 2, 3, 0, 1, 2, -1],
      syn: [{ preset: 'g-bass', cutoff: 500 }, { preset: 'g-sawlead', cutoff: 2400 }], vol: [0.75, 0.8, 0.5], pan: [0, -0.1, 0.15],
    },
  };
  const NAMES = Object.keys(DEFS);
  const META = {}; NAMES.forEach((n) => { const d = DEFS[n]; META[n] = { bpm: d.bpm, key: d.key, scale: d.scale.slice(), style: d.style, chords: d.chords.slice(), len: d.chords.length, chordPcs: d.chords.map((c) => CH[c].slice()), leadSlots: d.leadSlots.slice(), bassSlots: d.bassSlots.slice() }; });

  const slots = (arr) => Array.from({ length: MAXSLOTS }, (_, i) => (i < arr.length ? arr[i] : -1));
  function song(name) {
    const d = DEFS[name]; if (!d) { const e = G.Error ? new G.Error('badMusic') : new Error('badMusic'); throw e; }
    const pats = []; for (let i = 0; i < 16; i++) pats[i] = new Array(STEPS).fill(0);
    d.drums.forEach((s, i) => { pats[i] = parse(s, 'drum'); });
    d.bass.forEach((s, i) => { pats[8 + i] = parse(s); }); d.lead.forEach((s, i) => { pats[12 + i] = parse(s); });
    const len = d.chords.length;
    return {
      bpm: d.bpm, len, loop: true, smp: [{ vol: 0.8, pan: 0 }, { vol: 0.8, pan: 0 }],
      tracks: [
        { inst: 'drum', vol: d.vol[0], pan: d.pan[0], mute: false, slots: slots(d.drumSlots) },
        { inst: 'syn1', vol: d.vol[1], pan: d.pan[1], mute: false, slots: slots(d.bassSlots.map((i) => 8 + i)) },
        { inst: 'syn2', vol: d.vol[2], pan: d.pan[2], mute: false, slots: slots(d.leadSlots.map((i) => (i < 0 ? -1 : 12 + i))) },
        { inst: 'syn2', vol: 0, pan: 0, mute: true, slots: slots([]) },
      ],
      pats,
      drum: { kick: { tune: 0, decay: 1, vol: 1 }, snare: { tune: 0, decay: 1, vol: 0.9 }, hat: { tune: 0, decay: 1, vol: 0.7 }, perc: { tune: 0, decay: 1, vol: 0.9 } },
      syn: d.syn.map((s) => Object.assign({}, s)),
    };
  }
  // bez Sampleru: z bicích se odstraní bity 16 a 32 (sample 1 a 2); ostatní zůstane
  function clean(s) {
    const c = JSON.parse(JSON.stringify(s));
    (c.pats || []).forEach((p, i) => { if (i < 8 && Array.isArray(p)) c.pats[i] = p.map((v) => (v | 0) & 15); });
    return c;
  }
  const seconds = (name) => { const d = DEFS[name]; return d.chords.length * STEPS * 60 / d.bpm / 2; };

  // zvuková knihovna (snd/snd-library.js): předvolby g-* jsou nástroje builtin.instrument.g-*, smyčky builtin.song.<jméno>. Jsou to tatáž data, jen s ID; hraje je pořád Song sekvencer.
  // Stará jména (music('rtype'), preset 'g-bass') jsou aliasy téhož; idempotentní.
  function registerLib() {
    const L = root.SND && root.SND.Library; if (!L || !root.SND.DEFAULT_PATCH) return false;
    Object.keys(PRESETS).forEach((k) => { if (!L.has('builtin.instrument.' + k)) L.addBuiltin('instrument', k, { nameKey: 'game.mus.preset.' + k, data: { kind: 'synth', patch: PRESETS[k](root.SND.DEFAULT_PATCH()) } }); });
    NAMES.forEach((n) => { if (!L.has('builtin.song.' + n)) L.addBuiltin('song', n, { nameKey: 'game.mus.n.' + n, make: () => song(n) }); });
    return true;
  }
  G.Music = { NAMES, META, PRESETS, PRESET_NAMES: Object.keys(PRESETS), song, clean, parse, note, seconds, STEPS, registerLib };
  registerLib();
  if (typeof module !== 'undefined') module.exports = G;
})();

