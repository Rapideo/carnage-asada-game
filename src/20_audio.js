/* ============================================================
   AUDIO  --  procedural chip SFX + a 4-bar loop, no assets
   ============================================================ */
'use strict';

const Audio5 = {
  ctx: null, master: null, sfxBus: null, musBus: null,
  ready: false, muted: false, musicOn: true,
  engine: null, siren: null,
  _next: 0, _step: 0, _timer: null,

  init() {
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = 0.85;
    this.master.connect(ctx.destination);
    this.sfxBus = ctx.createGain(); this.sfxBus.gain.value = 0.9;  this.sfxBus.connect(this.master);
    this.musBus = ctx.createGain(); this.musBus.gain.value = 0.30; this.musBus.connect(this.master);
    this.ready = true;
    this.startMusic();
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.02);
    return this.muted;
  },

  /* ---- primitive voices ---------------------------------- */
  tone(freq, dur, type = 'square', vol = 0.25, slide = 0, delay = 0, bus) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || this.sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  },

  noise(dur, vol = 0.25, freq = 1200, q = 1, delay = 0, hp = false) {
    if (!this.ready) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const n = (0.35 * ctx.sampleRate) | 0;
    if (!this._nb) {
      this._nb = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = this._nb.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource(); s.buffer = this._nb;
    const f = ctx.createBiquadFilter(); f.type = hp ? 'highpass' : 'bandpass';
    f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxBus);
    s.start(t); s.stop(t + dur + 0.02);
  },

  /* ---- named sfx ----------------------------------------- */
  sfx(name) {
    if (!this.ready) return;
    switch (name) {
      case 'throw':   this.noise(0.16, 0.18, 2600, 1.2); this.tone(680, 0.12, 'triangle', 0.10, 1400); break;
      case 'land':    this.tone(180, 0.09, 'square', 0.12, 120); this.noise(0.08, 0.14, 700, 1); break;
      case 'splat':   this.noise(0.26, 0.28, 420, 0.7); this.tone(150, 0.22, 'sawtooth', 0.14, 60); break;
      case 'deliver': [0, 1, 2].forEach((i) => this.tone([784, 988, 1319][i], 0.13, 'square', 0.20, 0, i * 0.065)); break;
      case 'perfect': [0, 1, 2, 3].forEach((i) => this.tone([659, 784, 988, 1568][i], 0.16, 'square', 0.22, 0, i * 0.055)); break;
      case 'cash':    this.tone(1319, 0.09, 'square', 0.16); this.tone(1760, 0.14, 'square', 0.14, 0, 0.06); break;
      case 'crash':   this.noise(0.3, 0.4, 260, 0.5); this.noise(0.18, 0.3, 2000, 1, 0.01, true); this.tone(110, 0.24, 'sawtooth', 0.2, 44); break;
      case 'bump':    this.noise(0.1, 0.18, 320, 0.8); break;
      case 'ped':     this.tone(880, 0.1, 'square', 0.16, 300); this.noise(0.14, 0.18, 900, 0.9, 0.05); break;
      case 'horn':    this.tone(440, 0.2, 'square', 0.10); this.tone(554, 0.2, 'square', 0.09); break;
      case 'nav':     this.tone(1568, 0.06, 'square', 0.13); break;
      case 'recalc':  this.tone(392, 0.09, 'square', 0.13); this.tone(330, 0.12, 'square', 0.12, 0, 0.09); break;
      case 'ticket':  [0, 1, 2].forEach((i) => this.tone([392, 330, 262][i], 0.18, 'sawtooth', 0.18, 0, i * 0.1)); break;
      case 'restock': [0, 1, 2].forEach((i) => this.tone([523, 659, 784][i], 0.11, 'triangle', 0.18, 0, i * 0.07)); break;
      case 'start':   [0, 1, 2, 3].forEach((i) => this.tone([523, 659, 784, 1047][i], 0.14, 'square', 0.22, 0, i * 0.09)); break;
      case 'over':    [0, 1, 2, 3].forEach((i) => this.tone([523, 440, 349, 262][i], 0.3, 'triangle', 0.2, 0, i * 0.18)); break;
      case 'tick':    this.tone(1046, 0.05, 'square', 0.10); break;
      case 'combo':   this.tone(1319, 0.07, 'square', 0.14, 1760); break;
      case 'select':  this.tone(880, 0.06, 'square', 0.14, 1200); break;
    }
  },

  /* ---- engine loop --------------------------------------- */
  engineOn() {
    if (!this.ready || this.engine) return;
    const ctx = this.ctx;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; o2.detune.value = -12;
    f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 3;
    g.gain.value = 0;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.sfxBus);
    o1.start(); o2.start();
    this.engine = { o1, o2, f, g };
  },
  engineSet(speedFrac, load) {
    if (!this.engine) return;
    const t = this.ctx.currentTime;
    const f = 46 + speedFrac * 128;
    this.engine.o1.frequency.setTargetAtTime(f, t, 0.05);
    this.engine.o2.frequency.setTargetAtTime(f * 1.5, t, 0.05);
    this.engine.f.frequency.setTargetAtTime(380 + speedFrac * 1500, t, 0.08);
    this.engine.g.gain.setTargetAtTime(0.035 + load * 0.05 + speedFrac * 0.02, t, 0.08);
  },
  engineOff() {
    if (!this.engine) return;
    const t = this.ctx.currentTime;
    this.engine.g.gain.setTargetAtTime(0, t, 0.05);
    const e = this.engine; this.engine = null;
    setTimeout(() => { try { e.o1.stop(); e.o2.stop(); } catch (_) {} }, 400);
  },

  sirenOn() {
    if (!this.ready || this.siren) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = 720;
    lfo.type = 'sine'; lfo.frequency.value = 1.7; lg.gain.value = 240;
    lfo.connect(lg); lg.connect(o.frequency);
    g.gain.value = 0; g.gain.setTargetAtTime(0.055, ctx.currentTime, 0.2);
    o.connect(g); g.connect(this.sfxBus);
    o.start(); lfo.start();
    this.siren = { o, lfo, g };
  },
  sirenSet(nearFrac) {
    if (this.siren) this.siren.g.gain.setTargetAtTime(0.02 + nearFrac * 0.06, this.ctx.currentTime, 0.15);
  },
  sirenOff() {
    if (!this.siren) return;
    const s = this.siren; this.siren = null;
    s.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    setTimeout(() => { try { s.o.stop(); s.lfo.stop(); } catch (_) {} }, 500);
  },

  /* ---- music: 4-bar chip loop ---------------------------- */
  startMusic() {
    if (!this.ready || this._timer) return;
    this._next = this.ctx.currentTime + 0.1;
    this._step = 0;
    this._timer = setInterval(() => this._sched(), 25);
  },
  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (this.musBus) this.musBus.gain.setTargetAtTime(this.musicOn ? 0.30 : 0, this.ctx.currentTime, 0.05);
    return this.musicOn;
  },
  _sched() {
    if (!this.ready) return;
    const spb = 60 / 138 / 4;                 // 16th note
    while (this._next < this.ctx.currentTime + 0.12) {
      this._play(this._step, this._next, spb);
      this._next += spb;
      this._step = (this._step + 1) % 64;
    }
  },
  _play(s, t, spb) {
    const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const bar = (s / 16) | 0, k = s % 16;
    const ROOT = [45, 41, 48, 43][bar];       // Am  F  C  G
    const PENTA = [[69, 72, 74, 76, 79], [65, 69, 72, 74, 77],
                   [72, 76, 79, 81, 84], [67, 71, 74, 76, 79]][bar];

    // bass
    const BASS = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
    if (BASS[k]) {
      const oct = (k === 6 || k === 13) ? 12 : 0;
      this._v(mf(ROOT + oct), 0.11, 'square', 0.30, t);
    }
    // lead arp — sparser in bar 0/2, busier in 1/3
    const LEAD = [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0];
    if (LEAD[k]) {
      const n = PENTA[(k * 3 + bar * 2) % PENTA.length] + (k > 11 ? 12 : 0);
      this._v(mf(n), 0.09, 'square', 0.13, t, 0.006);
    }
    // pad stab on the 1
    if (k === 0) {
      this._v(mf(ROOT + 12), 0.26, 'triangle', 0.10, t);
      this._v(mf(ROOT + 19), 0.26, 'triangle', 0.08, t);
    }
    // drums
    if (k % 4 === 0) this._d(0.09, 0.34, 90, false, t);          // kick-ish
    if (k === 4 || k === 12) this._d(0.11, 0.24, 1500, false, t); // snare
    if (k % 2 === 0) this._d(0.03, k % 4 === 2 ? 0.10 : 0.06, 7000, true, t);
  },
  _v(freq, dur, type, vol, t, atk = 0.004) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.musBus);
    o.start(t); o.stop(t + dur + 0.02);
  },
  _d(dur, vol, freq, hp, t) {
    const ctx = this.ctx;
    if (!this._nb) {
      const n = (0.35 * ctx.sampleRate) | 0;
      this._nb = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = this._nb.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource(); s.buffer = this._nb;
    const f = ctx.createBiquadFilter(); f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.musBus);
    s.start(t); s.stop(t + dur + 0.02);
  },
};
