/* ============================================================
   ENTITIES  --  player, traffic, pedestrians, cop, taco bag, fx
   ============================================================ */
'use strict';

const SEG0  = BORDER * TS;          // world px where the road grid starts
const PITCH = SPAN * TS;            // 192 px between parallel roads
const DIRV  = [[1, 0], [0, 1], [-1, 0], [0, -1]];   // 0=E 1=S 2=W 3=N

const MAXSPD  = 176;
const ACC     = 285;
const BRAKE   = 460;
const REVMAX  = 78;
const TURNRATE = 3.25;
const SURF_MUL = [1, 0.60, 0.54, 0.4];   // road, walk, grass, sea

/* ---------------- generic car body collision -------------- */
const CORNERS = [[9, 4.5], [9, -4.5], [-9, 4.5], [-9, -4.5], [0, 5.5], [0, -5.5]];
function carBlocked(x, y, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  for (let i = 0; i < CORNERS.length; i++) {
    const lx = CORNERS[i][0], ly = CORNERS[i][1];
    if (City.isSolid(x + lx * c - ly * s, y + lx * s + ly * c)) return true;
  }
  return false;
}

/* ---------------- the player ------------------------------ */
class Player {
  constructor(x, y, ang) {
    this.x = x; this.y = y; this.ang = ang;
    this.vx = 0; this.vy = 0;
    this.slip = 0; this.spinT = 0; this.impact = 0;
    this.throttle = 0; this.steer = 0; this.hb = false;
    this.skidT = 0;
  }
  get speed() { return hyp(this.vx, this.vy); }
  get fwdSpeed() { return this.vx * Math.cos(this.ang) + this.vy * Math.sin(this.ang); }

  control(inp) {
    if (this.spinT > 0) { this.throttle = 0; this.steer = 0; return; }
    const up = inp.k('KeyW', 'ArrowUp'), dn = inp.k('KeyS', 'ArrowDown');
    this.throttle = up ? 1 : dn ? -1 : 0;
    const lf = inp.k('KeyA', 'ArrowLeft'), rt = inp.k('KeyD', 'ArrowRight');
    this.steer = (rt ? 1 : 0) - (lf ? 1 : 0);
    this.hb = inp.k('ShiftLeft', 'ShiftRight');
  }

  update(dt, G) {
    if (this.spinT > 0) {
      this.spinT -= dt;
      this.ang += 11 * dt * this.spinDir;
    }
    const surf = City.surfaceAt(this.x, this.y);
    const mul = SURF_MUL[surf] || 1;

    /* steering */
    const spd = this.speed;
    const back = this.fwdSpeed < -2 ? -1 : 1;
    const turn = this.steer * TURNRATE * clamp(spd / 46, 0, 1) * (1 - 0.28 * clamp(spd / MAXSPD, 0, 1)) * back;
    if (this.spinT <= 0) this.ang += turn * dt;

    /* longitudinal */
    const fx = Math.cos(this.ang), fy = Math.sin(this.ang);
    let vf = this.vx * fx + this.vy * fy;
    let vl = -this.vx * fy + this.vy * fx;

    if (this.throttle > 0) vf += ACC * mul * dt;
    else if (this.throttle < 0) vf -= (vf > 0 ? BRAKE : ACC * 0.6) * dt;
    if (this.hb) vf -= sign(vf) * 210 * dt;

    vf -= vf * 0.85 * dt;
    vf = clamp(vf, -REVMAX, MAXSPD * mul);

    /* grip / drift */
    const grip = this.hb ? 1.35 : (surf === S_ROAD ? 8.5 : 5.2);
    const before = vl;
    vl *= Math.exp(-grip * dt);
    this.slip = Math.abs(before - vl);

    this.vx = fx * vf - fy * vl;
    this.vy = fy * vf + fx * vl;

    /* move with axis separation */
    let bump = 0;
    const nx = this.x + this.vx * dt;
    if (!carBlocked(nx, this.y, this.ang)) this.x = nx;
    else { bump = Math.abs(this.vx); this.vx *= -0.3; this.vy *= 0.72; }
    const ny = this.y + this.vy * dt;
    if (!carBlocked(this.x, ny, this.ang)) this.y = ny;
    else { bump = Math.max(bump, Math.abs(this.vy)); this.vy *= -0.3; this.vx *= 0.72; }

    this.x = clamp(this.x, 12, WW - 12);
    this.y = clamp(this.y, 12, WH - 12);

    if (bump > 40) {
      this.impact = 1;
      G.shake = Math.max(G.shake, clamp(bump / 26, 1, 7));
      G.hitstop = Math.max(G.hitstop, bump > 110 ? 0.07 : 0.03);
      Audio5.sfx(bump > 110 ? 'crash' : 'bump');
      for (let i = 0; i < (bump > 110 ? 14 : 6); i++)
        Fx.spark(this.x + rand(-8, 8), this.y + rand(-8, 8), rand(-60, 60), rand(-60, 60));
      if (bump > 110) { G.onCrash(); }
    }

    /* skid marks */
    this.skidT -= dt;
    if (this.slip > 26 && spd > 40 && this.skidT <= 0 && surf === S_ROAD) {
      this.skidT = 0.012;
      const c = Math.cos(this.ang), s = Math.sin(this.ang);
      City.gx.fillStyle = 'rgba(22,16,30,0.30)';
      for (const ly of [-4.5, 4.5]) {
        City.gx.fillRect((this.x - 7 * c - ly * s) | 0, (this.y - 7 * s + ly * c) | 0, 2, 2);
      }
    }
    /* dust off-road */
    if (spd > 50 && (surf === S_GRASS || surf === S_WALK) && Math.random() < 0.4)
      Fx.dust(this.x - Math.cos(this.ang) * 8, this.y - Math.sin(this.ang) * 8, surf === S_GRASS ? '#6b8f4a' : '#a8adba');
  }

  spinOut(dir) { this.spinT = 0.55; this.spinDir = dir || 1; this.vx *= 0.35; this.vy *= 0.35; }

  draw(x, cam) {
    const sx = this.x - cam.x, sy = this.y - cam.y;
    x.fillStyle = PAL.shadow;
    x.fillRect((sx - 8) | 0, (sy - 3) | 0, 17, 11);
    drawRot(x, Art.player, sx, sy, this.ang);
  }
}

/* ---------------- traffic --------------------------------- */
class Traffic {
  constructor(x, y, dir, laneNode, ci) {
    this.x = x; this.y = y; this.dir = dir; this.laneNode = laneNode;
    this.spd = rand(58, 96); this.want = this.spd;
    this.frames = Art.car[ci];
    this.dec = null; this.decN = -1;
    this.stun = 0; this.honk = 0;
  }
  static laneFixed(node, dir) {
    return SEG0 + node * PITCH + ((dir === 0 || dir === 3) ? 24 : 8);
  }
  update(dt, G) {
    if (this.stun > 0) { this.stun -= dt; this.spd *= 0.9; }
    const axis = this.dir % 2 === 0 ? 'x' : 'y';
    const pos  = axis === 'x' ? this.x : this.y;
    const posDir = (this.dir === 0 || this.dir === 1) ? 1 : -1;

    /* --- intersection decision --- */
    const rel = pos - SEG0;
    let n = Math.floor(rel / PITCH);
    const off = rel - n * PITCH;
    const atEdge = posDir > 0 ? (n >= BLOCKS) : (n <= 0);
    if (off >= -2 && off <= 34) {
      if (this.dec === null || this.decN !== n) {
        this.decN = n;
        const r = Math.random();
        if (atEdge) this.dec = r < 0.5 ? 'R' : 'L';
        else this.dec = r < 0.62 ? 'S' : (r < 0.81 ? 'R' : 'L');
        // keep turns inside the grid
        const lane2 = this.laneNode;
        if (this.dec === 'R' || this.dec === 'L') {
          const nd = this.dec === 'R' ? (this.dir + 1) % 4 : (this.dir + 3) % 4;
          const goPos = (nd === 0 || nd === 1);
          if ((goPos && lane2 >= BLOCKS) || (!goPos && lane2 <= 0)) this.dec = atEdge ? (this.dec === 'R' ? 'L' : 'R') : 'S';
        }
      }
      if (this.dec !== 'S') {
        const A = SEG0 + n * PITCH;
        const isR = this.dec === 'R';
        const tOff = ((this.dir === 0 || this.dir === 1) ? (isR ? 8 : 24) : (isR ? 24 : 8));
        const tp = A + tOff;
        const reached = posDir > 0 ? pos >= tp : pos <= tp;
        if (reached) {
          const nd = isR ? (this.dir + 1) % 4 : (this.dir + 3) % 4;
          if (axis === 'x') this.x = tp; else this.y = tp;
          this.laneNode = n;
          this.dir = nd;
          this.dec = 'S';
          const f = Traffic.laneFixed(this.laneNode, nd);
          if (nd % 2 === 0) this.y = f; else this.x = f;
        }
      }
    } else if (off > 40) this.dec = null;

    /* --- keep to the lane --- */
    const fixed = Traffic.laneFixed(this.laneNode, this.dir);
    if (this.dir % 2 === 0) this.y = approach(this.y, fixed, 90 * dt);
    else                    this.x = approach(this.x, fixed, 90 * dt);

    /* --- car ahead / player ahead --- */
    const d = DIRV[this.dir];
    let block = 999;
    for (const o of G.traffic) {
      if (o === this) continue;
      if (o.dir !== this.dir || o.laneNode !== this.laneNode) continue;
      const dx = (o.x - this.x) * d[0] + (o.y - this.y) * d[1];
      const side = Math.abs((o.x - this.x) * d[1] - (o.y - this.y) * d[0]);
      if (dx > 0 && dx < block && side < 12) block = dx;
    }
    const pdx = (G.player.x - this.x) * d[0] + (G.player.y - this.y) * d[1];
    const pside = Math.abs((G.player.x - this.x) * d[1] - (G.player.y - this.y) * d[0]);
    if (pdx > 0 && pdx < 46 && pside < 14) {
      block = Math.min(block, pdx);
      this.honk -= dt;
      if (this.honk <= 0 && pdx < 34 && G.nearScreen(this.x, this.y)) { Audio5.sfx('horn'); this.honk = 2.4; }
    }
    this.spd = block < 40 ? approach(this.spd, block < 22 ? 0 : 26, 320 * dt)
                          : approach(this.spd, this.want, 90 * dt);

    this.x += d[0] * this.spd * dt;
    this.y += d[1] * this.spd * dt;
  }
  get ang() { return this.dir * (PI / 2); }
  draw(x, cam) {
    const sx = this.x - cam.x, sy = this.y - cam.y;
    x.fillStyle = PAL.shadow;
    x.fillRect((sx - 8) | 0, (sy - 3) | 0, 17, 11);
    drawRot(x, this.frames, sx, sy, this.ang);
  }
}

/* ---------------- pedestrian ------------------------------ */
class Ped {
  constructor(bx, by, rng) {
    const a = (BORDER + bx * SPAN + 2) * TS + 8;
    const b = (BORDER + by * SPAN + 2) * TS + 8;
    this.r = { x: a, y: b, w: 9 * TS, h: 9 * TS };
    this.per = 2 * (this.r.w + this.r.h);
    this.t = Math.random() * this.per;
    this.cw = Math.random() < 0.5 ? 1 : -1;
    this.spd = rand(17, 27);
    this.set = Art.ped[(Math.random() * Art.ped.length) | 0];
    this.f = 0; this.ft = 0; this.dir = 2;
    this.tumble = 0; this.vx = 0; this.vy = 0; this.spin = 0; this.pause = 0;
    this.place();
  }
  place() {
    const t = ((this.t % this.per) + this.per) % this.per;
    const { x, y, w, h } = this.r;
    let seg;
    if (t < w)              { this.x = x + t;                   this.y = y;                       seg = 0; }
    else if (t < w + h)     { this.x = x + w;                   this.y = y + (t - w);             seg = 1; }
    else if (t < 2 * w + h) { this.x = x + w - (t - w - h);     this.y = y + h;                   seg = 2; }
    else                    { this.x = x;                       this.y = y + h - (t - 2 * w - h); seg = 3; }
    // walking clockwise the edges face E,S,W,N; anticlockwise is the reverse
    const cwDir = [1, 2, 3, 0][seg];
    this.dir = this.cw > 0 ? cwDir : (cwDir + 2) % 4;
  }
  update(dt, G) {
    if (this.tumble > 0) {
      this.tumble -= dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.vx *= 0.93; this.vy *= 0.93; this.spin += dt * 16;
      if (this.tumble <= 0) { this.t = Math.random() * this.per; this.place(); }
      return;
    }
    if (this.pause > 0) { this.pause -= dt; return; }
    if (Math.random() < 0.0015) { this.pause = rand(0.6, 2); return; }
    this.t += this.spd * this.cw * dt;
    this.place();
    this.ft += dt;
    if (this.ft > 0.19) { this.ft = 0; this.f ^= 1; }
  }
  hitBy(px, py, vx, vy) {
    this.tumble = 1.5;
    const d = hyp(vx, vy) || 1;
    this.vx = vx / d * 130; this.vy = vy / d * 130 - 30;
    this.spin = 0;
  }
  draw(x, cam) {
    const sx = (this.x - cam.x) | 0, sy = (this.y - cam.y) | 0;
    x.fillStyle = PAL.shadow;
    x.fillRect(sx - 4, sy - 1, 9, 4);
    const img = this.set[this.dir][this.f];
    if (this.tumble > 0) {
      x.save();
      x.translate(sx, sy - 6);
      x.rotate(this.spin);
      x.drawImage(img, -4, -8);
      x.restore();
    } else x.drawImage(img, sx - 4, sy - 13);
  }
}

/* ---------------- cop ------------------------------------- */
class Cop {
  constructor(x, y, ang) {
    this.x = x; this.y = y; this.ang = ang; this.vx = 0; this.vy = 0;
    this.flash = 0; this.hitCd = 0; this.life = 0;
  }
  get speed() { return hyp(this.vx, this.vy); }
  update(dt, G) {
    this.life += dt; this.flash += dt; this.hitCd -= dt;
    const t = G.player;
    let want = Math.atan2(t.y - this.y, t.x - this.x);

    /* crude obstacle probe */
    const probe = (a, d) => City.isSolid(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d);
    if (probe(this.ang, 30)) {
      const l = probe(this.ang - 0.7, 30), r = probe(this.ang + 0.7, 30);
      want = this.ang + (l && !r ? 0.9 : r && !l ? -0.9 : (this.life % 2 < 1 ? 1.2 : -1.2));
    }
    const err = angDiff(this.ang, want);
    const steer = clamp(err * 2.4, -1, 1);
    const spd = this.speed;
    this.ang += steer * TURNRATE * clamp(spd / 46, 0, 1) * (1 - 0.28 * clamp(spd / MAXSPD, 0, 1)) * dt;

    const fx = Math.cos(this.ang), fy = Math.sin(this.ang);
    let vf = this.vx * fx + this.vy * fy;
    let vl = -this.vx * fy + this.vy * fx;
    const surf = City.surfaceAt(this.x, this.y);
    const mul = SURF_MUL[surf] || 1;
    vf += ACC * mul * dt * (Math.abs(err) > 1.5 ? 0.45 : 1);
    vf -= vf * 0.85 * dt;
    vf = clamp(vf, -REVMAX, MAXSPD * mul * 1.02);
    vl *= Math.exp(-7.5 * dt);
    this.vx = fx * vf - fy * vl; this.vy = fy * vf + fx * vl;

    const nx = this.x + this.vx * dt;
    if (!carBlocked(nx, this.y, this.ang)) this.x = nx; else this.vx *= -0.35;
    const ny = this.y + this.vy * dt;
    if (!carBlocked(this.x, ny, this.ang)) this.y = ny; else this.vy *= -0.35;
    this.x = clamp(this.x, 12, WW - 12); this.y = clamp(this.y, 12, WH - 12);
  }
  draw(x, cam) {
    const sx = this.x - cam.x, sy = this.y - cam.y;
    x.fillStyle = PAL.shadow;
    x.fillRect((sx - 8) | 0, (sy - 3) | 0, 17, 11);
    drawRot(x, Art.cop, sx, sy, this.ang);
    const on = (this.flash * 6 | 0) % 2;
    x.fillStyle = on ? PAL.siren1 : PAL.siren2;
    x.fillRect((sx - 2) | 0, (sy - 2) | 0, 4, 4);
    x.globalAlpha = 0.30;
    x.fillRect((sx - 7) | 0, (sy - 7) | 0, 14, 14);
    x.globalAlpha = 1;
  }
}

/* ---------------- taco bag projectile --------------------- */
const THROW_T = 0.5, GRAV = 260, Z0 = 5;
const MAXTHROW = 132;

class Bag {
  constructor(x, y, tx, ty, spread) {
    this.x = x; this.y = y; this.z = Z0;
    const dx = tx - x, dy = ty - y;
    const sp = spread || 0;
    this.vx = dx / THROW_T + rand(-sp, sp);
    this.vy = dy / THROW_T + rand(-sp, sp);
    this.vz = (0 - Z0 + 0.5 * GRAV * THROW_T * THROW_T) / THROW_T;
    this.f = 0; this.dead = false; this.tx = tx; this.ty = ty;
  }
  update(dt) {
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.vz -= GRAV * dt; this.z += this.vz * dt;
    this.f += dt * 14;
    if (this.z <= 0) { this.z = 0; this.dead = true; }
  }
  draw(x, cam) {
    const sx = (this.x - cam.x) | 0, sy = (this.y - cam.y) | 0;
    const sc = clamp(1 - this.z / 90, 0.4, 1);
    x.globalAlpha = 0.22 + sc * 0.2;
    x.fillStyle = '#100c18';
    x.fillRect(sx - 4, sy - 2, 9, 5);
    x.globalAlpha = 1;
    x.drawImage(Art.bag[(this.f | 0) % 4], sx - 6, (sy - this.z - 6) | 0);
  }
}

/* ---------------- particles / popups ---------------------- */
const Fx = {
  ps: [], pops: [], marks: [],

  spark(x, y, vx, vy) { this.ps.push({ x, y, z: 3, vx, vy, vz: rand(20, 70), g: 300, life: rand(0.25, 0.5), t: 0, c: Math.random() < 0.5 ? '#ffd76a' : '#ff9a3c', s: 2 }); },
  dust(x, y, c)       { this.ps.push({ x, y, z: 2, vx: rand(-18, 18), vy: rand(-18, 18), vz: rand(8, 26), g: 60, life: rand(0.3, 0.6), t: 0, c, s: 2 }); },
  spill(x, y)         { for (let i = 0; i < 12; i++) this.ps.push({ x, y, z: 4, vx: rand(-70, 70), vy: rand(-70, 70), vz: rand(30, 90), g: 320, life: rand(0.35, 0.7), t: 0, c: SPILL[(Math.random() * SPILL.length) | 0], s: 2 }); },
  cash(x, y)          { for (let i = 0; i < 10; i++) this.ps.push({ x, y, z: 6, vx: rand(-45, 45), vy: rand(-45, 45), vz: rand(50, 110), g: 210, life: rand(0.5, 0.9), t: 0, c: Math.random() < 0.5 ? PAL.good : PAL.amber, s: 2 }); },
  star(x, y)          { for (let i = 0; i < 8; i++) this.ps.push({ x, y, z: 8, vx: rand(-40, 40), vy: rand(-40, 40), vz: rand(20, 60), g: 150, life: 0.5, t: 0, c: PAL.bone, s: 1 }); },

  pop(x, y, txt, col, big) { this.pops.push({ x, y, txt, col, t: 0, life: big ? 1.5 : 1.05, s: big ? 2 : 1 }); },

  splat(x, y) {
    const img = Art.splat[(Math.random() * Art.splat.length) | 0];
    City.gx.drawImage(img, (x - 10) | 0, (y - 9) | 0);
  },

  update(dt) {
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const p = this.ps[i];
      p.t += dt;
      if (p.t >= p.life) { this.ps.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vz -= p.g * dt; p.z += p.vz * dt;
      if (p.z < 0) { p.z = 0; p.vz *= -0.35; p.vx *= 0.7; p.vy *= 0.7; }
    }
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i];
      p.t += dt; p.y -= 16 * dt;
      if (p.t >= p.life) this.pops.splice(i, 1);
    }
  },
  draw(x, cam) {
    for (const p of this.ps) {
      const a = 1 - p.t / p.life;
      x.globalAlpha = a > 0.6 ? 1 : a / 0.6;
      x.fillStyle = p.c;
      x.fillRect((p.x - cam.x) | 0, (p.y - cam.y - p.z) | 0, p.s, p.s);
    }
    x.globalAlpha = 1;
    for (const p of this.pops) {
      const a = p.t / p.life;
      x.globalAlpha = a > 0.75 ? (1 - a) / 0.25 : 1;
      textOut(x, p.txt, (p.x - cam.x) | 0, (p.y - cam.y) | 0, p.col, p.s, 1);
      x.globalAlpha = 1;
    }
  },
  clear() { this.ps.length = 0; this.pops.length = 0; },
};

function rand(a, b) { return a + Math.random() * (b - a); }
