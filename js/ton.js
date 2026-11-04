/* Fifty Stars – Ton (aus der Lernreise übernommen, 2026-11-04; die wiederum aus Wörtli-Frosch).
   Stimme: MP3s aus audio/ nacheinander (Web Audio, damit auf dem iPhone nichts stockt). Klänge: direkt erzeugt.
   Ton.klaenge = () => true/false sagt, ob Klänge an sind; Ton.stimme = () => true/false, ob die Stimme an ist (setzt app.js). */
(function () {
  'use strict';
  let ctx = null, out = null, sfxBus = null, voiceBus = null, fxBus = null;
  const bytes = new Map();
  let bufs = new Map(), src = null, queue = [], playing = false, tok = 0;
  function make() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* alt */ }
    try { ctx = new AC(); } catch (e) { ctx = null; return null; }
    bufs = new Map();
    out = ctx.createDynamicsCompressor();
    out.threshold.value = -12; out.knee.value = 10; out.ratio.value = 4; out.attack.value = 0.003; out.release.value = 0.25;
    out.connect(ctx.destination);
    voiceBus = ctx.createGain(); voiceBus.gain.value = 1; voiceBus.connect(out);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(out);
    fxBus = ctx.createGain(); fxBus.gain.value = 0.8; fxBus.connect(out);
    return ctx;
  }
  function ready() {
    if (!ctx || ctx.state === 'closed') make();
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  }
  function drop() { stop(); if (ctx) { try { ctx.close(); } catch (e) { /* zu */ } } ctx = null; }
  document.addEventListener('visibilitychange', () => { if (document.hidden) drop(); });
  window.addEventListener('pagehide', drop);
  ['pointerup', 'touchend', 'keydown'].forEach(ev => window.addEventListener(ev, ready, { capture: true, passive: true }));
  function fetchBytes(n) {
    if (!bytes.has(n)) bytes.set(n, fetch(`audio/${n}.mp3`).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
    return bytes.get(n);
  }
  async function buffer(n) {
    const c = ctx;
    if (!c) return null;
    if (bufs.has(n)) return bufs.get(n);
    const ab = await fetchBytes(n);
    if (!ab || c !== ctx) return null;
    try {
      const b = await new Promise((res, rej) => c.decodeAudioData(ab.slice(0), res, rej));
      if (c === ctx) bufs.set(n, b);
      return b;
    } catch (e) { return null; }
  }
  const wait = ms => new Promise(res => setTimeout(res, ms));
  function playBuf(b) {
    return new Promise(res => {
      const s = ctx.createBufferSource();
      s.buffer = b; s.connect(voiceBus);
      let done = false;
      const end = () => { if (!done) { done = true; res(); } };
      s.onended = end; src = s;
      const t0 = ctx.currentTime, c = ctx;
      s.start();
      setTimeout(end, b.duration * 1000 + 500);
      setTimeout(() => { if (c === ctx && c.currentTime === t0) drop(); }, 800);   // iOS nach dem Hintergrund
    });
  }
  function stop() { tok++; queue = []; playing = false; if (src) { try { src.stop(); } catch (e) { /* fertig */ } src = null; } }
  /* Zeilen nacheinander; append = hinten anhängen; {pause: ms} = kleine Pause; fertig() wird am Ende gerufen */
  let fertig = null;
  function say(names, append = false, danach = null) {
    if (!append) stop();
    queue.push(...[].concat(names).filter(Boolean));
    if (danach) fertig = danach;
    if (!playing) pump();
  }
  async function pump() {
    if (!ready()) { queue = []; const f = fertig; fertig = null; if (f) f(); return; }
    playing = true;
    const my = tok;
    while (queue.length && my === tok) {
      const item = queue.shift();
      if (typeof item === 'object') { await wait(item.pause); continue; }
      const b = await buffer(item);
      if (my !== tok) return;
      if (!b) continue;
      await playBuf(b);
      if (my !== tok) return;
      await wait(40);
    }
    if (my === tok) { playing = false; src = null; const f = fertig; fertig = null; if (f) f(); }
  }
  const preload = names => names.forEach(n => typeof n === 'string' && fetchBytes(n));
  const busy = () => playing;
  const note = m => 440 * Math.pow(2, (m - 69) / 12);
  function env(g, t, a, peak, decay) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
  }
  function osc(type, f, t, dur, peak, dest, a = 0.004) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); env(g, t, a, peak, dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + a + dur + 0.05);
  }
  const marimba = (f, t, v = 1) => { osc('sine', f, t, 0.55, 0.3 * v, sfxBus); osc('sine', f * 3.93, t, 0.1, 0.06 * v, sfxBus, 0.002); };
  const bell = (f, t, v = 1) => { osc('sine', f, t, 1.2, 0.14 * v, sfxBus); osc('sine', f * 2.76, t, 0.55, 0.05 * v, sfxBus); };
  const PENTA = [0, 2, 4, 7, 9], step = i => 72 + 12 * Math.floor(i / 5) + PENTA[i % 5];
  const on = () => Ton.klaenge() && ready();
  const sfx = {
    tap() {
      if (!on()) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(1300, t); o.frequency.exponentialRampToValueAtTime(620, t + 0.045);
      env(g, t, 0.002, 0.1, 0.055); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.12);
    },
    right(streak) { if (!on()) return; const t = ctx.currentTime + 0.01, i = Math.min(Math.max(streak - 1, 0), 9); marimba(note(step(i)), t); marimba(note(step(i + 2)), t + 0.085, 0.9); },
    wrong() {
      if (!on()) return;
      const t = ctx.currentTime + 0.01;
      [[55, 0], [52, 0.15]].forEach(([m, dt]) => {
        const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = note(m); f.type = 'lowpass'; f.frequency.value = 900;
        env(g, t + dt, 0.012, 0.22, 0.34); o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t + dt); o.stop(t + dt + 0.5);
      });
    },
    done() { if (!on()) return; const t = ctx.currentTime + 0.05, seq = [72, 76, 79, 84, 88]; seq.forEach((m, i) => marimba(note(m), t + i * 0.11, 0.85)); bell(note(100), t + 0.55, 0.8); },
    sparkle() { if (!on()) return; const t = ctx.currentTime + 0.02; [84, 88, 91, 96, 100].forEach((m, i) => bell(note(m), t + i * 0.065, 0.55)); },
    flip() { if (!on()) return; const t = ctx.currentTime; osc('triangle', 520, t, 0.08, 0.08, sfxBus); osc('triangle', 780, t + 0.05, 0.08, 0.06, sfxBus); },
    tick() { if (!on()) return; const t = ctx.currentTime; osc('square', 2200, t, 0.015, 0.03, sfxBus, 0.001); },
    sticker() {
      if (!on()) return;
      const t = ctx.currentTime + 0.02;
      [67, 72, 76, 79].forEach((m, i) => { marimba(note(m), t + i * 0.09, 0.9); osc('triangle', note(m), t + i * 0.09, 0.25, 0.05, sfxBus); });
      [84, 88, 91, 96].forEach(m => bell(note(m), t + 0.4, 0.45));
    },
  };
  /* Geräusch aus audio/ (Sammelbuch: Blättern, Kleben): sofort, neben der Stimme, ohne ihre Warteschlange anzufassen */
  async function fx(n) {
    if (!Ton.klaenge() || !ready()) return;
    const b = await buffer(n);
    if (!b || !ctx) return;
    const s = ctx.createBufferSource();
    s.buffer = b; s.connect(fxBus); s.start();
  }
  const Ton = window.Ton = { say, stop, preload, sfx, ready, busy, fx, klaenge: () => true };
})();
