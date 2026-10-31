
/*
 * Zvuk & hudba · audio vrstva nad Web Audio API (jeden AudioContext pro celou skupinu).
 * Bezpečnost: hlavní zesílení má pevný strop (0,4), za ním je kompresor jako limiter, nic nehraje samo od sebe
 * (kontext vzniká až po kliknutí uživatele) a po opuštění laboratoře se vše zastaví a kontext se uspí.
 * Pauza: EDU.bus 'pause' (otevřená karta „V kostce“, encyklopedie, mezerník) kontext uspí, zavření ho probudí – zvuk se tedy opravdu zastaví.
 * Žádné AudioWorklet: z file:// ho prohlížeče neumí načíst; DSP, které potřebuje vlastní kód, se počítá offline v snd-engine.js a přehraje jako AudioBuffer.
 *
 *   SND.Audio.ensure()                  vytvoří/odemkne kontext (volat z kliknutí); vrací AudioContext nebo null
 *   SND.Audio.tone({ type, freq, gain, wave })  → { set({ freq, gain }), stop() }   plynulé změny (bez cvakání)
 *   SND.Audio.buffer(float32, sr, { gain, loop, rate, right }) → { stop(), src, ended }
 *   SND.Audio.stopAll() · leave() · hold(true|false) · volume (0…1, ukládá se pod 'edu.snd.vol') · level() (špička výstupu 0…1)
 */
(function () {
  'use strict';
  const S = window.SND = window.SND || {};
  const KEY = 'edu.snd.vol', MAXGAIN = 0.4;
  let ctx = null, master = null, comp = null, an = null, anBuf = null, held = false, vol = 0.6;
  try { const v = parseFloat(localStorage.getItem(KEY)); if (v >= 0 && v <= 1) vol = v; } catch (e) { /* soukromý režim */ }
  const live = new Set();
  const gainOf = (v) => MAXGAIN * v * v;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain(); master.gain.value = gainOf(vol);
      comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 16; comp.attack.value = 0.002; comp.release.value = 0.12;
      an = ctx.createAnalyser(); an.fftSize = 8192; an.smoothingTimeConstant = 0.55; an.minDecibels = -110;
      master.connect(comp); comp.connect(ctx.destination); comp.connect(an);
      anBuf = new Float32Array(an.fftSize);
    }
    ctx.__wanted = true;   // kontext, který uspíme kvůli pauze, smíme po pauze probudit; uspaný při opuštění lekce ne
    if (ctx.state === 'suspended' && !held) ctx.resume().catch(() => {});
    return ctx;
  }
  const api = S.Audio = {
    ensure,
    get ctx() { return ctx; }, get out() { ensure(); return master; }, get analyser() { return an; },
    get sr() { return ctx ? ctx.sampleRate : 48000; },
    get running() { return !!ctx && ctx.state === 'running'; },
    get volume() { return vol; },
    set volume(v) {
      vol = Math.max(0, Math.min(1, v));
      try { localStorage.setItem(KEY, String(vol)); } catch (e) { /* soukromý režim */ }
      if (master) master.gain.setTargetAtTime(gainOf(vol), ctx.currentTime, 0.02);
    },
    now() { return ctx ? ctx.currentTime : 0; },
    // špička výstupu 0…1 z analyzátoru (pro měřidlo hlasitosti)
    level() { if (!an || !api.running) return 0; an.getFloatTimeDomainData(anBuf); let m = 0; for (let i = 0; i < anBuf.length; i++) m = Math.max(m, Math.abs(anBuf[i])); return m; },
    // živé spektrum z AnalyserNode v dB (Float32Array, binů fftSize/2), nebo null
    liveSpectrum() { if (!an || !api.running) return null; const a = new Float32Array(an.frequencyBinCount); an.getFloatFrequencyData(a); return { db: a, df: ctx.sampleRate / an.fftSize }; },
    liveWave() { if (!an || !api.running) return null; an.getFloatTimeDomainData(anBuf); return anBuf; },
    tone(o = {}) {
      const c = ensure(); if (!c) return null;
      const osc = c.createOscillator(), g = c.createGain(), now = c.currentTime;
      if (o.wave) osc.setPeriodicWave(o.wave); else osc.type = o.type || 'sine';
      osc.frequency.value = o.freq || 440; g.gain.value = 0; g.gain.setTargetAtTime(Math.min(0.5, o.gain ?? 0.3), now, 0.01);
      osc.connect(o.dest || g); if (!o.dest) g.connect(master); else { /* vlastní řetěz si zapojí volající */ }
      osc.start();
      const h = {
        osc, g,
        set(p) { const t = c.currentTime; if (p.freq != null) osc.frequency.setTargetAtTime(p.freq, t, 0.015); if (p.gain != null) g.gain.setTargetAtTime(Math.min(0.5, p.gain), t, 0.015); },
        stop() { if (h.dead) return; h.dead = true; live.delete(h); const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.02); try { osc.stop(t + 0.15); } catch (e) { /* už zastaveno */ } },
      };
      live.add(h); return h;
    },
    buffer(data, sr, o = {}) {
      const c = ensure(); if (!c) return null;
      const buf = c.createBuffer(o.right ? 2 : 1, data.length, sr); buf.copyToChannel(data, 0); if (o.right) buf.copyToChannel(o.right, 1);   // o.right = pravý kanál (stereo)
      const src = c.createBufferSource(); src.buffer = buf; src.loop = !!o.loop; if (o.rate) src.playbackRate.value = o.rate;
      const g = c.createGain(); g.gain.value = Math.min(0.9, o.gain ?? 0.8); src.connect(g); g.connect(o.dest || master);
      const h = { src, g, buf, dur: buf.duration, stop() { if (h.dead) return; h.dead = true; live.delete(h); const t = c.currentTime; g.gain.setTargetAtTime(0, t, 0.015); try { src.stop(t + 0.1); } catch (e) { /* už skončil */ } } };
      src.onended = () => { h.dead = true; live.delete(h); if (h.onend) h.onend(); };
      src.start(o.when || 0); live.add(h); return h;
    },
    stopAll() { [...live].forEach((h) => h.stop()); },
    // pauza simulace (modal, mezerník): uspí kontext = zastaví i držené tóny, odpauzování pokračuje tam, kde přestal
    hold(b) {
      held = !!b; if (!ctx) return;
      if (held) { if (ctx.state === 'running') ctx.suspend().catch(() => {}); } else if (ctx.state === 'suspended' && ctx.__wanted) ctx.resume().catch(() => {});
    },
    // opuštění laboratoře: ticho a spánek (nic nesmí hrát po zavření lekce)
    leave() { api.stopAll(); if (ctx && ctx.state === 'running') { ctx.__wanted = false; ctx.suspend().catch(() => {}); } },
  };
  if (window.EDU && EDU.bus) EDU.bus.on('pause', (e) => api.hold(e && e.paused));
})();

