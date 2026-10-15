/* Patili Rota — chiptune ses. Tüm sesler WebAudio ile üretilir, dosya yok. */
(function () {
  'use strict';

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) { /* gizli sekme */ } },
  };

  let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
  let soundOn = store.get('pati_sound', true);

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = soundOn ? 0.8 : 0;
      master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(o) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (o.t || 0);
    const dur = o.dur || 0.1;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + (o.slide || dur));
    if (o.f3) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f3), t0 + dur);
    const v = o.vol || 0.15;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || 1;
      osc.connect(f); node = f;
    }
    if (o.vib) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = o.vib; lg.gain.value = o.vibAmt || 12;
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t0); lfo.stop(t0 + dur + 0.05);
    }
    node.connect(g);
    g.connect(o.bus || sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(o) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (o.t || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.hp ? 'highpass' : 'lowpass';
    f.frequency.value = o.hp || o.lp || 2000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (o.dur || 0.1));
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(t0); src.stop(t0 + (o.dur || 0.1) + 0.02);
  }

  const arp = (notes, step, o) => notes.forEach((f, i) => tone(Object.assign({ f, t: i * step, dur: step * 1.6 }, o)));

  const SFX = {
    scratch() { noise({ hp: 2500, dur: 0.07, vol: 0.25 }); tone({ f: 900, f2: 300, dur: 0.07, vol: 0.06 }); },
    poof() { noise({ lp: 1800, dur: 0.18, vol: 0.2 }); tone({ type: 'triangle', f: 500, f2: 1200, dur: 0.12, vol: 0.1 }); },
    pick() { arp([880, 1109, 1319], 0.05, { vol: 0.08 }); },
    tantuni() { arp([523, 659, 784, 1047, 784, 1047], 0.07, { vol: 0.09 }); },
    page() { arp([523, 659, 784, 1047], 0.09, { vol: 0.1 }); tone({ f: 1047, t: 0.36, dur: 0.5, vol: 0.08, vib: 6 }); tone({ type: 'triangle', f: 262, t: 0.36, dur: 0.5, vol: 0.15 }); },
    hurt() { tone({ f: 420, f2: 110, dur: 0.2, vol: 0.12 }); noise({ lp: 900, dur: 0.12, vol: 0.15 }); },
    down() { arp([392, 330, 262, 196], 0.12, { type: 'triangle', vol: 0.15 }); },
    revive() { arp([392, 523, 659, 784], 0.07, { type: 'triangle', vol: 0.15 }); },
    meowHi() { tone({ type: 'sawtooth', f: 620, f2: 980, slide: 0.09, f3: 520, dur: 0.38, vol: 0.12, lp: 1700, q: 6, vib: 9, vibAmt: 18 }); },
    meowLo() { tone({ type: 'sawtooth', f: 430, f2: 700, slide: 0.1, f3: 360, dur: 0.42, vol: 0.13, lp: 1300, q: 6, vib: 8, vibAmt: 14 }); },
    slam() { noise({ lp: 500, dur: 0.25, vol: 0.4 }); tone({ f: 120, f2: 50, dur: 0.2, vol: 0.2 }); },
    steam() { noise({ hp: 3000, dur: 0.25, vol: 0.1 }); },
    throw() { noise({ hp: 1200, dur: 0.15, vol: 0.12 }); tone({ type: 'triangle', f: 300, f2: 700, dur: 0.12, vol: 0.06 }); },
    roar() { tone({ type: 'sawtooth', f: 160, f2: 70, dur: 0.6, vol: 0.18, lp: 700, vib: 14, vibAmt: 20 }); noise({ lp: 600, dur: 0.5, vol: 0.2 }); },
    monkey() { tone({ f: 700, f2: 1100, dur: 0.09, vol: 0.07 }); tone({ f: 600, f2: 1000, t: 0.11, dur: 0.09, vol: 0.07 }); tone({ f: 800, f2: 1300, t: 0.22, dur: 0.1, vol: 0.07 }); },
    sparkle() { arp([1319, 1568, 2093, 2637], 0.05, { type: 'triangle', vol: 0.08 }); },
    descend() { arp([784, 659, 523, 392, 330], 0.06, { vol: 0.07 }); },
    alert() { tone({ f: 1200, dur: 0.05, vol: 0.05 }); tone({ f: 1600, t: 0.06, dur: 0.05, vol: 0.05 }); },
    clack() { tone({ type: 'triangle', f: 1800, f2: 900, dur: 0.04, vol: 0.12 }); noise({ hp: 4000, dur: 0.03, vol: 0.08 }); },
    block() { tone({ type: 'triangle', f: 1400, dur: 0.15, vol: 0.12 }); },
    heal() { tone({ type: 'triangle', f: 880, f2: 1320, dur: 0.12, vol: 0.08 }); },
    select() { tone({ f: 660, dur: 0.05, vol: 0.06 }); tone({ f: 990, t: 0.05, dur: 0.07, vol: 0.06 }); },
    blip() { tone({ f: 520 + Math.random() * 60, dur: 0.025, vol: 0.03 }); },
    kiss() {
      noise({ hp: 2500, dur: 0.05, vol: 0.18 });
      tone({ type: 'triangle', f: 900, f2: 1800, dur: 0.09, vol: 0.12, t: 0.03 });
      arp([1047, 1319, 1568], 0.06, { type: 'triangle', vol: 0.07, t: 0.12 });
    },
    smooch() { noise({ hp: 3000, dur: 0.04, vol: 0.1 }); tone({ type: 'triangle', f: 1100, f2: 1600, dur: 0.06, vol: 0.06 }); },
    rip() {
      noise({ hp: 1800, dur: 0.22, vol: 0.35 });
      tone({ type: 'sawtooth', f: 1400, f2: 300, dur: 0.18, vol: 0.06 });
    },
    secret() { arp([523, 784, 1047, 1568, 2093], 0.07, { type: 'triangle', vol: 0.1 }); noise({ lp: 900, dur: 0.3, vol: 0.2 }); },
    laugh() { [0, 0.13, 0.26, 0.39].forEach((t, i) => tone({ f: 700 - i * 40, f2: 500 - i * 40, dur: 0.1, vol: 0.06, t })); },
    honk() { tone({ type: 'square', f: 420, f2: 380, dur: 0.18, vol: 0.08, lp: 1200 }); },
    fart() { tone({ type: 'sawtooth', f: 90, f2: 60, dur: 0.45, vol: 0.14, lp: 400, vib: 22, vibAmt: 30 }); },
    yes() {
      arp([523, 659, 784, 1047, 1319, 1568, 2093], 0.08, { vol: 0.09 });
      arp([262, 330, 392, 523], 0.16, { type: 'triangle', vol: 0.15 });
    },
  };

  // ---------- müzik ----------
  // Her parça 8'lik notalardan oluşur: nota = yeni ses, '-' = uzat, '.' = sus
  const SONGS = {
    title: { bpm: 100, tracks: [
      { w: 'square', v: 0.06, n: 'E5 - G5 - C6 - B5 A5 G5 - E5 - D5 - . . E5 - G5 - A5 - G5 E5 D5 - C5 - - - . .' },
      { w: 'triangle', v: 0.16, n: 'C3 - G3 - C3 - G3 - A2 - E3 - A2 - E3 - F2 - C3 - F2 - C3 - G2 - D3 - G2 - B2 -' },
      { w: 'drum', v: 0.5, n: 'k . h . s . h . k . h . s . h h k . h . s . h . k . h . s . h h' },
    ] },
    kahvalti: { bpm: 132, tracks: [
      { w: 'square', v: 0.055, n: 'F5 . A5 . C6 . A5 . Bb5 . G5 . E5 . C5 . F5 . A5 . C6 . D6 . C6 . A5 . F5 - - .' },
      { w: 'triangle', v: 0.16, n: 'F3 . C3 . F3 . C3 . C3 . G2 . C3 . G2 . Bb2 . F3 . Bb2 . F3 . C3 . G2 . F2 - - .' },
      { w: 'drum', v: 0.45, n: 'k . h . s . h . k . h . s . h h k . h . s . h . k k h . s . h .' },
    ] },
    yuruyus: { bpm: 116, tracks: [
      { w: 'square', v: 0.05, n: 'G5 . B5 . D6 . B5 . C6 . A5 . F#5 . D5 . G5 . B5 . D6 . E6 . D6 . B5 . G5 - - .' },
      { w: 'triangle', v: 0.16, n: 'G2 . D3 . G2 . D3 . A2 . E3 . D3 . A2 . G2 . D3 . C3 . G2 . D3 . A2 . G2 - - .' },
      { w: 'drum', v: 0.4, n: 'k . h . s . h . k . h . s . h h k . h . s . h . k . h . s h s .' },
    ] },
    memory: { bpm: 76, tracks: [
      { w: 'square', v: 0.045, n: 'A5 - - - C6 - A5 - G5 - - - F5 - - - E5 - - - G5 - C6 - A5 - - - - - . .' },
      { w: 'triangle', v: 0.15, n: 'F2 - - - C3 - - - D3 - - - A2 - - - Bb2 - - - F3 - - - C3 - - - C3 - - -' },
      { w: 'drum', v: 0.25, n: '. . . . h . . . . . . . h . . . . . . . h . . . . . . . h . . .' },
    ] },
    funny: { bpm: 140, tracks: [
      { w: 'square', v: 0.05, n: 'E5 D#5 E5 . C5 . E5 . G5 F#5 G5 . E5 . G5 . A5 G#5 A5 . F5 . A5 . G5 . F5 . E5 . D5 .' },
      { w: 'triangle', v: 0.17, n: 'C3 . G3 . C3 . G3 . C3 . G3 . C3 . G3 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . B2 .' },
      { w: 'drum', v: 0.4, n: 'k . s . k . s . k . s . k . s . k . s . k . s . k . s . k s s s' },
    ] },
    kahve: { bpm: 88, tracks: [
      { w: 'square', v: 0.045, n: 'A4 - C5 - E5 - D5 C5 A4 - - - G4 - . . F4 - A4 - C5 - B4 A4 G4 - - - E4 - . .' },
      { w: 'triangle', v: 0.16, n: 'A2 - - - E3 - - - F2 - - - C3 - - - C3 - - - G2 - - - G2 - - - D3 - - -' },
      { w: 'drum', v: 0.35, n: 'k . . . s . . h k . k . s . . . k . . . s . . h k . k . s . h .' },
    ] },
    aksam: { bpm: 104, tracks: [
      { w: 'square', v: 0.05, n: 'E5 - A5 - C6 - B5 A5 G#5 - E5 - - - . . F5 - A5 - D6 - C6 B5 A5 - - - E5 - . .' },
      { w: 'triangle', v: 0.16, n: 'A2 - E3 - A2 - E3 - E2 - B2 - E2 - G#2 - D3 - A2 - D3 - A2 - A2 - E3 - A2 - - -' },
      { w: 'drum', v: 0.35, n: 'k . h . s . h . k . h . s . h . k . h . s . h . k . h . s . h h' },
    ] },
    boss: { bpm: 152, tracks: [
      { w: 'square', v: 0.05, n: 'A4 A4 C5 A4 D5 A4 E5 D5 C5 C5 E5 C5 F5 E5 D5 C5 A4 A4 C5 A4 D5 A4 E5 G5 F5 E5 D5 C5 B4 G#4 A4 .' },
      { w: 'triangle', v: 0.17, n: 'A2 . A2 A3 A2 . A2 A3 F2 . F2 F3 F2 . F2 F3 D2 . D2 D3 D2 . D2 D3 E2 . E2 E3 E2 . E2 G#2' },
      { w: 'drum', v: 0.5, n: 'k h s h k h s h k h s h k k s h k h s h k h s h k h s h k s s s' },
    ] },
    final: { bpm: 92, tracks: [
      { w: 'square', v: 0.055, n: 'G5 - E5 - C5 - E5 G5 A5 - G5 - E5 - . . F5 - A5 - G5 - E5 C5 D5 - - - . . . . G5 - E5 - C5 - E5 G5 C6 - B5 - A5 - G5 - F5 - E5 - D5 - G5 - C5 - - - - - . .' },
      { w: 'triangle', v: 0.15, n: 'C3 - G3 - C3 - G3 - F2 - C3 - F2 - C3 - F2 - C3 - E3 - A2 - G2 - D3 - G2 - B2 - C3 - G3 - C3 - G3 - A2 - E3 - A2 - E3 - D3 - A2 - G2 - D3 - C3 - G2 - C3 - - -' },
      { w: 'drum', v: 0.3, n: 'k . . h s . . h k . . h s . . h k . . h s . . h k . . h s . h h k . . h s . . h k . . h s . . h k . . h s . . h k . . h s . . .' },
    ] },
  };

  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(n) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(n);
    if (!m) return 0;
    const midi = 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  for (const s of Object.values(SONGS)) {
    for (const tr of s.tracks) {
      const toks = tr.n.split(/\s+/);
      tr.steps = toks.map((tok, i) => {
        if (tok === '-' || tok === '.') return null;
        if (tr.w === 'drum') return { d: tok };
        let len = 1;
        while (toks[i + len] === '-') len++;
        return { f: freq(tok), len };
      });
    }
    s.len = Math.max(...s.tracks.map((t) => t.steps.length));
  }

  let song = null, songName = null, step = 0, nextT = 0, timer = null;

  function drum(kind, t, v) {
    if (kind === 'k') tone({ type: 'sine', f: 150, f2: 45, dur: 0.12, vol: 0.5 * v, t, bus: musicBus });
    else if (kind === 's') noise({ lp: 3500, dur: 0.09, vol: 0.25 * v, t, bus: musicBus });
    else if (kind === 'h') noise({ hp: 7000, dur: 0.03, vol: 0.15 * v, t, bus: musicBus });
  }

  function schedule() {
    if (!ctx || !song) return;
    const spb = 60 / song.bpm / 2;
    while (nextT < ctx.currentTime + 0.15) {
      const rel = nextT - ctx.currentTime;
      for (const tr of song.tracks) {
        const st = tr.steps[step % tr.steps.length];
        if (!st) continue;
        if (st.d) drum(st.d, rel, tr.v);
        else tone({ type: tr.w, f: st.f, dur: st.len * spb * 0.92, vol: tr.v, t: rel, bus: musicBus, attack: 0.01 });
      }
      nextT += spb;
      step = (step + 1) % song.len;
    }
  }

  function music(name) {
    if (songName === name) return;
    songName = name;
    song = SONGS[name] || null;
    step = 0;
    if (!ctx) return;
    nextT = ctx.currentTime + 0.08;
    if (!timer) timer = setInterval(schedule, 30);
  }

  window.PatiAudio = {
    unlock() {
      if (!ensure()) return;
      if (song && !timer) { nextT = ctx.currentTime + 0.08; timer = setInterval(schedule, 30); }
    },
    sfx(name) { if (soundOn && ctx && SFX[name]) SFX[name](); },
    music,
    get on() { return soundOn; },
    toggle() {
      soundOn = !soundOn;
      store.set('pati_sound', soundOn);
      ensure();
      if (master) master.gain.setTargetAtTime(soundOn ? 0.8 : 0, ctx.currentTime, 0.05);
      return soundOn;
    },
  };
})();
