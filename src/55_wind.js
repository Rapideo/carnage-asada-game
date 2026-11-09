/* ============================================================
   WIND  --  windy Delivery Shifts: crosswind, gusts, tumbleweeds
   ============================================================

   A level says whether it is windy (content/levels.json; G.windy, rolled in
   G.setLevel for a `random` level), and its difficulty says how hard it
   blows (content/difficulty.json, `wind`). Delivery only: a kitchen has no
   road to blow across, and G.setLevel never makes one windy.

   Three things, all off when Wind.on is false, so a calm level plays exactly
   as the game did before 0.9.3:
   - the CROSSWIND on the toss: a bag in flight accelerates downwind (Bag).
     The flight is a fixed THROW_T, so the drift is the same for any length
     of toss: strength x DRIFT / 8 px, about 9px on Easy and 22px on Supreme.
   - GUSTS: every gustEvery seconds the car is shoved sideways for LEN s,
     telegraphed WARN s ahead by dust streaks and the GUST sound (the
     windsock that also blinked for it was removed, owner 2026-11-09, so the
     dust carries the warning: denser and longer in the warning and the gust,
     each streak with a dark underline so it reads on snow as well as road). The shove
     is only added to the car's lateral velocity, before Player.update's
     axis-separated moves, so carBlocked still refuses every destination and
     unwedge still depenetrates. A gust can push you along a wall; it can
     never push you into or through one.
   - TUMBLEWEEDS roll along the streets with the wind, drawn, never solid.
     Driving through one bursts it into twigs and wobbles the car. No fine. */
'use strict';

const Wind = {
  on: false, dir: 0, strength: 0,
  gustT: 0,          // seconds until the next gust starts
  age: -1,           // seconds into the current gust, -1 between gusts
  gust: 0,           // 0..1, the gust blowing now
  telegraph: 0,      // 0..1, the warning before it
  every: [10, 14], weedN: 0, fresh: false,
  streaks: [],

  DRIFT: 200,        // px/s/s of bag drift at strength 1
  SHOVE: 170,        // px/s/s sideways on the car at strength 1, at a gust's peak
  WARN: 1.0,         // the telegraph's lead
  LEN: 1.0,          // a gust's length
  LEAN: 0.8,         // how much of the drift the demo aims off for (G.aimPoint)

  /* Per delivery shift. The direction is per play: a cardinal, so it reads
     clearly in the dust and blows along the street grid, with a little
     jitter so it is not a ruler. */
  reset(windy, diff) {
    const w = diff && diff.wind;
    this.on = !!(windy && w);
    this.strength = this.on ? w.strength : 0;
    this.every = this.on ? w.gustEvery : [10, 14];
    this.weedN = this.on ? w.tumbleweeds : 0;
    this.dir = ((Math.random() * 4) | 0) * (PI / 2) + (Math.random() * 2 - 1) * 0.3;
    this.gust = 0; this.telegraph = 0; this.age = -1;
    /* the first gust comes early, so a short shift (and the 45s demo) meets one */
    this.gustT = this.on ? 4 + Math.random() * Math.max(0.5, this.every[0] - 4) : 0;
    this.fresh = true;
    this.streaks.length = 0;
  },

  /* returns 'warn' on the frame a gust's telegraph begins */
  update(dt) {
    if (!this.on) return null;
    let ev = null;
    if (this.age >= 0) { this.age += dt; if (this.age >= this.LEN) this.age = -1; }
    const before = this.gustT;
    this.gustT -= dt;
    if (before > this.WARN && this.gustT <= this.WARN) ev = 'warn';
    if (this.gustT <= 0) {
      this.age = 0;
      // start to start: gustEvery is the time from one gust to the next
      this.gustT += this.every[0] + Math.random() * (this.every[1] - this.every[0]);
    }
    this.gust = this.age >= 0 ? Math.sin(PI * this.age / this.LEN) : 0;
    this.telegraph = this.gustT < this.WARN ? 1 - this.gustT / this.WARN : 0;
    this.updateStreaks(dt);
    return ev;
  },

  /* the bag's downwind acceleration, px/s/s; a gust adds half again */
  push() {
    const k = this.on ? this.strength * this.DRIFT * (1 + 0.5 * this.gust) : 0;
    return { x: Math.cos(this.dir) * k, y: Math.sin(this.dir) * k };
  },

  /* the gust's shove on a car heading `ang`, along the car's own lateral
     axis: wind pushes on a car's side, and grip is what resists it */
  lateral(ang) {
    if (!this.on || this.gust <= 0) return 0;
    return (-Math.sin(ang) * Math.cos(this.dir) + Math.cos(ang) * Math.sin(this.dir)) * this.strength * this.SHOVE * this.gust;
  },

  /* ---- dust streaks, in screen space, over the world ---- */
  updateStreaks(dt) {
    const S = this.streaks;
    for (let i = S.length - 1; i >= 0; i--) {
      const s = S[i];
      s.t += dt;
      if (s.t >= s.life) { S.splice(i, 1); continue; }
      s.x += s.vx * dt; s.y += s.vy * dt;
    }
    // a few always, a rush during the telegraph and the gust itself
    const rush = Math.max(this.telegraph, this.gust);
    const rate = 4 * this.strength + 200 * this.telegraph + 180 * this.gust;
    let n = rate * dt;
    while (n > 0 && S.length < 160) {
      if (n < 1 && Math.random() > n) break;
      n -= 1;
      const v = (220 + Math.random() * 100) * (0.6 + this.strength), a = this.dir + (Math.random() - 0.5) * 0.12;
      S.push({ x: Math.random() * VW, y: Math.random() * VH, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
               l: 8 + ((Math.random() * (11 + 10 * rush)) | 0), t: 0, life: 0.25 + Math.random() * 0.3 });
    }
  },

  drawStreaks(x) {
    if (!this.on || !this.streaks.length) return;
    /* two passes: a dark underline one row down, then the dust. Pale dust on
       snow was invisible without it (owner, 2026-11-09, level 9) */
    for (const [col, oy, a] of [['#1c1424', 1, 0.45], ['#ead8ac', 0, 0.85]]) {
      x.fillStyle = col;
      for (const s of this.streaks) {
        const f = s.t / s.life;
        x.globalAlpha = (f < 0.2 ? f / 0.2 : (1 - f) / 0.8) * a;
        const c = s.vx / hyp(s.vx, s.vy), d = s.vy / hyp(s.vx, s.vy);
        for (let k = 0; k < s.l; k++) x.fillRect((s.x - c * k) | 0, ((s.y - d * k) | 0) + oy, 1, 1);
      }
    }
    x.globalAlpha = 1;
  },

  /* ---- tumbleweeds ---- */
  /* the street axis the wind blows along (0 = east-west, 1 = north-south) and which way */
  axis() {
    const c = Math.cos(this.dir), s = Math.sin(this.dir);
    return Math.abs(c) >= Math.abs(s) ? { ax: 0, sg: c < 0 ? -1 : 1 } : { ax: 1, sg: s < 0 ? -1 : 1 };
  },

  /* A tumbleweed on a street in view, rolling with the wind: at the upwind
     edge, or anywhere in view when the shift starts. Only ever on a
     carriageway (6-26px into a 32px road), so it can never sit on a porch. */
  spawnWeed(G, anywhere) {
    const { ax, sg } = this.axis(), cam = G.cam;
    const lo = ax === 0 ? cam.y : cam.x, span = ax === 0 ? VH : VW;   // across the streets
    const n0 = clamp(Math.ceil((lo - 60 - SEG0) / PITCH), 0, BLOCKS);
    const n1 = clamp(Math.floor((lo + span + 30 - SEG0) / PITCH), n0, BLOCKS);
    const n = n0 + ((Math.random() * (n1 - n0 + 1)) | 0);
    const across = SEG0 + n * PITCH + 6 + Math.random() * 20;
    const a0 = ax === 0 ? cam.x : cam.y, aspan = ax === 0 ? VW : VH;  // along the street
    let along = anywhere ? a0 + Math.random() * aspan
                         : sg > 0 ? a0 - 20 - Math.random() * 60 : a0 + aspan + 20 + Math.random() * 60;
    along = clamp(along, SEG0 + 4, SEG0 + BLOCKS * PITCH + 28);
    const v = sg * (36 + Math.random() * 30) * (0.6 + this.strength);
    return ax === 0 ? new Tumbleweed(along, across, v, 0) : new Tumbleweed(across, along, 0, v);
  },

  /* out of play: far off the view, or off the end of the street grid */
  lost(w, G) {
    const cx = G.cam.x + VW / 2, cy = G.cam.y + VH / 2, hi = SEG0 + BLOCKS * PITCH + 32;
    return Math.abs(w.x - cx) > VW / 2 + 110 || Math.abs(w.y - cy) > VH / 2 + 110 ||
           w.x < SEG0 || w.y < SEG0 || w.x > hi || w.y > hi;
  },

  /* Roll them, recycle them round the player like traffic, and in play burst
     the one the car drives through. Kept at weedN at the end of every call. */
  updateWeeds(dt, G, live) {
    const W = G.weeds;
    if (!this.on) { W.length = 0; return; }
    const p = G.player;
    for (let i = W.length - 1; i >= 0; i--) {
      const w = W[i];
      w.update(dt);
      if (live && !w.dead && Math.abs(w.x - p.x) < 10 && Math.abs(w.y - p.y) < 10 && hyp(w.x - p.x, w.y - p.y) < 10) {
        w.dead = true;
        Fx.twigs(w.x, w.y - 4, p.vx, p.vy);
        if (p.speed > 25) p.wobble = 0.4;
        Audio5.sfx('weed');
      }
      if (w.dead || this.lost(w, G)) W[i] = this.spawnWeed(G, false);
    }
    while (W.length < this.weedN) W.push(this.spawnWeed(G, this.fresh));
    this.fresh = false;
  },
};

class Tumbleweed {
  static frames = null;
  constructor(x, y, vx, vy) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.t = Math.random() * 10; this.roll = Math.random() * TAU; this.z = 0; this.dead = false;
  }
  update(dt) {
    const k = 1 + 0.6 * Wind.gust;                       // a gust hurries them along
    this.x += this.vx * k * dt; this.y += this.vy * k * dt;
    this.t += dt;
    this.roll += (this.vx + this.vy) * k * dt / 5;       // radius 5: rolls, not slides
    this.z = Math.abs(Math.sin(this.t * 5.5)) * 3;       // and hops
  }

  /* Eight frames of one tangle of twigs, each turned an eighth: a ball of
     scrub that reads as rolling. Plotted per pixel, lit from the top left
     like everything else in the city. */
  static bake() {
    const rng = makeRng(0x7b1e), segs = [];
    for (let i = 0; i < 26; i++) {
      const a = rng() * TAU, r = 1 + rng() * 4.2, b = a + (rng() - 0.5) * 2.4, q = 1 + rng() * 4.2;
      segs.push([Math.cos(a) * r, Math.sin(a) * r, Math.cos(b) * q, Math.sin(b) * q]);
    }
    const out = [];
    for (let f = 0; f < 8; f++) {
      const t = mkCanvas(12, 12), x = t.x, c = Math.cos(f * TAU / 8), s = Math.sin(f * TAU / 8);
      const lit = new Map();
      for (const [x0, y0, x1, y1] of segs) {
        for (let k = 0; k <= 8; k++) {
          const u = lerp(x0, x1, k / 8), v = lerp(y0, y1, k / 8);
          const px = Math.round(5.5 + u * c - v * s), py = Math.round(5.5 + u * s + v * c);
          if (px < 0 || py < 0 || px > 11 || py > 11) continue;
          lit.set(py * 12 + px, [px, py]);
        }
      }
      for (const [px, py] of lit.values()) {
        const d = (px - 5.5) + (py - 5.5);                // negative toward the light
        x.fillStyle = d < -4 ? '#dcc08a' : d < 1 ? '#ad8c58' : d < 5 ? '#7e5f38' : '#563f24';
        x.fillRect(px, py, 1, 1);
      }
      out.push(t.c);
    }
    Tumbleweed.frames = out;
  }

  draw(x, cam) {
    if (!Tumbleweed.frames) Tumbleweed.bake();
    const sx = (this.x - cam.x) | 0, sy = (this.y - cam.y) | 0;
    x.globalAlpha = 0.45 - this.z * 0.06;
    x.fillStyle = PAL.shadow;
    x.fillRect(sx - 4, sy - 1, 9, 3);
    x.globalAlpha = 1;
    const i = ((Math.floor(this.roll / (TAU / 8)) % 8) + 8) % 8;
    x.drawImage(Tumbleweed.frames[i], sx - 6, (sy - 11 - this.z) | 0);
  }
}
