/* ============================================================
   MUSIC  --  arranged songs through the chip voices, no assets
   ============================================================
   The songs are data: tools/music/midi2song.mjs reduces a MIDI file to a
   bass, a lead, up to two harmony voices and a kit, and build.mjs inlines
   content/music/*.json as MUSIC (id -> song) and PLAYLIST (key -> ids).
   This module only plays them -- same lookahead scheduler as the old 4-bar
   loop in 20_audio.js, same square/triangle/pulse/noise palette, same
   Audio5.musBus, so the N and M toggles keep working untouched.

   Song format (change midi2song.mjs with it, or neither):
     bpm, res (steps per beat), len (steps)
     voices[]  { role, wave, vol, n }  n = 3-char tokens P D L in L64:
                 P pitch (midi - 28, '.' = rest), D steps since the last
                 token, L length in steps
     drums     one L64 char per step, a bit mask: 1 kick 2 snare
               4 closed hat 8 open hat 16 crash 32 tom

   API
     Music.play(id)        loop one song
     Music.playList(ids)   play in order, advance when one ends, loop the list.
                           The same list twice in a row does not restart.
     Music.playKey(key)    PLAYLIST[key] -- 'title', or a level number 1..20
     Music.stop(fade)      silence; the legacy loop stays quiet
     Music.release()       stop, and hand music back to the legacy loop
     Music.now()           { id, title, artist, year } of what is playing

   Once Music has been asked to play anything it OWNS the music bus
   (Music.owns), and Audio5._sched yields to it. Everything is guarded on
   typeof MUSIC / PLAYLIST, so a build without the content still boots and
   simply keeps the old loop. */
'use strict';

const Music = {
  owns: false, queue: [], idx: 0,
  song: null, ev: null, kit: '', step: 0, next: 0, spb: 0,
  out: null, timer: null, started: false,
  _cache: {}, _pw: {}, _nb: null,

  L64: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/',
  LOOK: 0.15,                  // seconds scheduled ahead; the old loop uses 0.12
  GAP: 1,                      // beats of silence between songs in a list
  SUS: { bass: 0.6, lead: 0.75, harm: 0.55 },
  /* kit voices -- mirrored in midi2song.mjs DRUMS so the .wav previews match */
  KIT: [
    [1,  { dur: 0.13, f0: 150, f1: 42, fall: 0.025, tone: 0.55, nz: 0.12, lp: 300 }],
    [2,  { dur: 0.14, f0: 210, f1: 150, fall: 0.03, tone: 0.16, nz: 0.30, lp: 3200, hp: 600 }],
    [4,  { dur: 0.04, nz: 0.10, hp: 7000 }],
    [8,  { dur: 0.18, nz: 0.08, hp: 6000 }],
    [16, { dur: 0.75, nz: 0.09, hp: 4000 }],
    [32, { dur: 0.16, f0: 240, f1: 110, fall: 0.06, tone: 0.35 }],
  ],

  /* ---- public ------------------------------------------------ */
  has(id) { return typeof MUSIC !== 'undefined' && !!MUSIC && !!MUSIC[id]; },
  ids(key) {
    if (typeof PLAYLIST === 'undefined' || !PLAYLIST) return [];
    const l = PLAYLIST[String(key)];
    return Array.isArray(l) ? l.filter((id) => this.has(id)) : [];
  },
  play(id) { return this.playList([id]); },
  playKey(key) { return this.playList(this.ids(key)); },
  playList(ids, from = 0) {
    const list = (ids || []).filter((id) => this.has(id));
    if (!list.length) return false;
    // asking for what is already playing is not a restart
    if (this.song && this.queue.join() === list.join()) return true;
    this.stop(0.03);
    this.owns = true;
    this.queue = list;
    this.idx = Math.abs(from | 0) % list.length;
    this._load(list[this.idx]);
    this.started = false;
    if (!this.timer && typeof setInterval === 'function') this.timer = setInterval(() => this._tick(), 25);
    this._tick();
    return true;
  },
  stop(fade = 0.05) {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.song = null; this.ev = null; this.queue = []; this.started = false;
    // notes up to LOOK ahead are already on the clock: fade the private bus
    // rather than letting them ring out, and start the next song on a new one
    if (this.out && typeof Audio5 !== 'undefined' && Audio5.ready) {
      const o = this.out, t = Audio5.ctx.currentTime;
      o.gain.cancelScheduledValues(t);
      o.gain.setValueAtTime(o.gain.value, t);
      o.gain.linearRampToValueAtTime(0, t + Math.max(0.005, fade));
      setTimeout(() => { try { o.disconnect(); } catch (_) {} }, (fade + this.LOOK + 0.3) * 1000);
    }
    this.out = null;
  },
  release() { this.stop(); this.owns = false; },
  playing() { return !!this.song; },
  now() {
    const s = this.song;
    return s ? { id: s.id, title: s.title, artist: s.artist, year: s.year } : null;
  },

  /* ---- scheduling ------------------------------------------- */
  _load(id) {
    const s = MUSIC[id];
    this.song = s;
    this.spb = 60 / s.bpm / s.res;
    this.step = 0;
    this.ev = this._cache[id] || (this._cache[id] = this._decode(s));
    this.kit = s.drums || '';
  },
  _decode(s) {
    const L = this.L64, ev = new Array(s.len);
    s.voices.forEach((v, vi) => {
      let at = 0;
      for (let i = 0; i + 2 < v.n.length; i += 3) {
        at += L.indexOf(v.n[i + 1]);
        if (v.n[i] === '.' || at >= s.len) continue;
        (ev[at] || (ev[at] = [])).push(vi, L.indexOf(v.n[i]) + 28, L.indexOf(v.n[i + 2]));
      }
    });
    return ev;
  },
  _tick() {
    const A = typeof Audio5 !== 'undefined' ? Audio5 : null;
    if (!A || !A.ready || !this.song) return;
    const now = A.ctx.currentTime;
    if (!this.out) {
      this.out = A.ctx.createGain(); this.out.gain.value = 1;
      this.out.connect(A.musBus);
    }
    if (!this.started) { this.next = now + 0.06; this.started = true; }
    // fell behind (a throttled background tab): skip forward in time rather
    // than firing every missed note at once
    while (this.next < now) this._advance(false);
    while (this.next < now + this.LOOK) this._advance(A.musicOn && !A.muted);
  },
  _advance(sound) {
    const s = this.song, k = this.step, t = this.next;
    if (sound) {
      const e = this.ev[k];
      if (e) for (let i = 0; i < e.length; i += 3) this._note(s.voices[e[i]], e[i + 1], e[i + 2], t);
      const m = this.L64.indexOf(this.kit[k] || '0');
      if (m > 0) for (const [bit, d] of this.KIT) if (m & bit) this._drum(d, t);
    }
    this.next += this.spb;
    if (++this.step >= s.len) {
      if (this.queue.length > 1) {
        this.idx = (this.idx + 1) % this.queue.length;
        this._load(this.queue[this.idx]);
        this.next += this.GAP * 60 / s.bpm;
      } else this.step = 0;
    }
  },

  /* ---- voices -- the envelope matches midi2song.mjs envAt() --- */
  _wave(duty) {
    if (this._pw[duty]) return this._pw[duty];
    const N = 48, re = new Float32Array(N), im = new Float32Array(N);
    for (let n = 1; n < N; n++) re[n] = (4 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
    return (this._pw[duty] = Audio5.ctx.createPeriodicWave(re, im));
  },
  _note(v, midi, len, t) {
    const ctx = Audio5.ctx;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const dur = len * this.spb * 0.92, A = 0.004, D = 0.09, R = 0.03;
    const vol = v.vol, sus = this.SUS[v.role] || 0.6;
    const o = ctx.createOscillator(), g = ctx.createGain();
    if (v.wave === 'pulse25') o.setPeriodicWave(this._wave(0.25));
    else if (v.wave === 'pulse12') o.setPeriodicWave(this._wave(0.125));
    else o.type = v.wave === 'triangle' ? 'triangle' : 'square';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + A);
    if (dur < A + D) g.gain.linearRampToValueAtTime(vol * 0.3, t + dur);
    else { g.gain.linearRampToValueAtTime(vol * sus, t + A + D); g.gain.setValueAtTime(vol * sus, t + dur); }
    g.gain.linearRampToValueAtTime(0, t + dur + R);
    o.connect(g); g.connect(this.out);
    o.start(t); o.stop(t + dur + R + 0.01);
    // a held lead note gets a delayed vibrato, the one flourish a chip tune has
    if (v.role === 'lead' && dur > 0.45) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.setValueAtTime(0, t + 0.22);
      lg.gain.linearRampToValueAtTime(f * 0.006, t + 0.42);
      lfo.connect(lg); lg.connect(o.frequency);
      lfo.start(t); lfo.stop(t + dur + R + 0.01);
    }
  },
  _drum(d, t) {
    const ctx = Audio5.ctx;
    const tail = 0.0067;                                 // e^-5: the preview's exp(-t / (dur/5))
    if (d.f0) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(d.f0, t);
      o.frequency.setTargetAtTime(d.f1, t, d.fall);
      g.gain.setValueAtTime(d.tone, t);
      g.gain.exponentialRampToValueAtTime(d.tone * tail, t + d.dur);
      o.connect(g); g.connect(this.out);
      o.start(t); o.stop(t + d.dur + 0.01);
    }
    if (d.nz) {
      if (!this._nb) {
        const n = ctx.sampleRate | 0;                    // one second: the crash outlasts Audio5's 0.35s buffer
        this._nb = ctx.createBuffer(1, n, ctx.sampleRate);
        const c = this._nb.getChannelData(0);
        for (let i = 0; i < n; i++) c[i] = Math.random() * 2 - 1;
      }
      const s = ctx.createBufferSource(); s.buffer = this._nb;
      let node = s;
      if (d.hp) { const h = ctx.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = d.hp; node.connect(h); node = h; }
      if (d.lp) { const l = ctx.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = d.lp; node.connect(l); node = l; }
      const g = ctx.createGain();
      g.gain.setValueAtTime(d.nz, t);
      g.gain.exponentialRampToValueAtTime(d.nz * tail, t + d.dur);
      node.connect(g); g.connect(this.out);
      s.start(t, Math.random() * 0.2); s.stop(t + d.dur + 0.01);
    }
  },
};
