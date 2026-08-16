/* ============================================================
   NAV  --  "TACO-NAV 2000", a rudimentary guidance unit
   ============================================================ */
'use strict';

const TURN_NAMES = ['CONTINUE', 'TURN RIGHT', 'MAKE A U-TURN', 'TURN LEFT'];

const Nav = {
  goal: null,          // {x, y, node:[nx,ny], label}
  route: [],           // [[nx,ny], ...] nodes still ahead
  recalcT: 0,
  glitch: 0,           // >0 => panel shows RECALCULATING
  chirp: 0,
  turn: 0, dist: 0, arriving: false, lost: false,
  lastKey: '',

  setGoal(g) {
    this.goal = g;
    this.route = [];
    this.recalcT = 0;
    this.glitch = 0.85;
    this.lastKey = '';
    Audio5.sfx('recalc');
  },
  clear() { this.goal = null; this.route = []; },

  update(dt, p) {
    this.glitch = Math.max(0, this.glitch - dt);
    this.chirp = Math.max(0, this.chirp - dt);
    if (!this.goal) return;

    this.recalcT -= dt;
    if (this.recalcT <= 0) {
      this.recalcT = 0.4;
      this.recompute(p);
    }

    const gx2 = this.goal.x, gy2 = this.goal.y;
    const straight = hyp(gx2 - p.x, gy2 - p.y);
    this.arriving = straight < 165 || this.route.length === 0;

    if (this.arriving) {
      this.dist = straight;
      const want = Math.atan2(gy2 - p.y, gx2 - p.x);
      this.turn = relTurn(cardinal(p.ang), cardinal(want));
    } else {
      const a = this.route[0];
      const ax = City.nodeX(a[0]), ay = City.nodeY(a[1]);
      this.dist = hyp(ax - p.x, ay - p.y);
      const b = this.route[1];
      let exit;
      if (b) exit = cardinal(Math.atan2(City.nodeY(b[1]) - ay, City.nodeX(b[0]) - ax));
      else   exit = cardinal(Math.atan2(gy2 - ay, gx2 - ax));
      const approach = hyp(p.vx, p.vy) > 22 ? cardinal(Math.atan2(p.vy, p.vx)) : cardinal(p.ang);
      this.turn = relTurn(approach, exit);
      if (this.dist < 44 && this.turn !== 0 && this.chirp <= 0) { Audio5.sfx('nav'); this.chirp = 1.6; }
    }

    // off the tarmac == the unit loses its mind
    const s = City.surfaceAt(p.x, p.y);
    this.lost = (s === S_GRASS || s === S_WALK);
  },

  recompute(p) {
    const s = [City.nearNodeX(p.x), City.nearNodeY(p.y)];
    const g = this.goal.node;
    const initDir = cardinal(hyp(p.vx, p.vy) > 22 ? Math.atan2(p.vy, p.vx) : p.ang);
    const path = solve(s, g, initDir);

    // drop the head node if we have already driven past it
    if (path.length >= 2) {
      const n0 = path[0], n1 = path[1];
      const d01 = hyp(City.nodeX(n1[0]) - City.nodeX(n0[0]), City.nodeY(n1[1]) - City.nodeY(n0[1]));
      const dp1 = hyp(City.nodeX(n1[0]) - p.x, City.nodeY(n1[1]) - p.y);
      if (dp1 < d01 - 12) path.shift();
    }
    const key = path.map((n) => n[0] + ',' + n[1]).join('|');
    if (key !== this.lastKey) {
      if (this.lastKey && this.route.length > 1) this.glitch = 0.45;
      this.lastKey = key;
    }
    this.route = path;
  },

  /* route painted on the tarmac as chunky chevrons */
  drawRoute(x, cam, time) {
    if (!this.goal || this.glitch > 0.25) return;
    const pts = [];
    for (const n of this.route) pts.push([City.nodeX(n[0]), City.nodeY(n[1])]);
    pts.push([this.goal.cx || this.goal.x, this.goal.cy || this.goal.y]);
    if (!pts.length) return;

    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const len = hyp(bx - ax, by - ay);
      if (len < 1) continue;
      const ux = (bx - ax) / len, uy = (by - ay) / len;
      const ang = Math.atan2(uy, ux);
      for (let d = 10; d < len - 6; d += 22) {
        const px = ax + ux * d, py = ay + uy * d;
        const sx = px - cam.x, sy = py - cam.y;
        if (sx < -14 || sy < -14 || sx > VW + 14 || sy > VH + 14) continue;
        const ph = ((d * 0.02 - time * 1.5) % 1 + 1) % 1;
        x.globalAlpha = 0.30 + 0.42 * (1 - ph);
        chevron(x, sx, sy, ang, PAL.cyan);
      }
    }
    x.globalAlpha = 1;
  },
};

function chevron(x, sx, sy, ang, col) {
  const c = Math.cos(ang), s = Math.sin(ang);
  x.fillStyle = col;
  // two nested arrow bars, drawn as 2x2 blocks so it stays chunky
  for (let i = -4; i <= 4; i++) {
    const t = 4 - Math.abs(i);
    for (const off of [0, 5]) {
      const lx = t - 4 + off, ly = i;
      x.fillRect(Math.round(sx + lx * c - ly * s) - 1, Math.round(sy + lx * s + ly * c) - 1, 2, 2);
    }
  }
}

/* cardinal index for an angle: 0=E 1=S 2=W 3=N */
function cardinal(a) {
  let i = Math.round(a / (PI / 2)) % 4;
  if (i < 0) i += 4;
  return i;
}
/* 0 straight, 1 right, 2 u-turn, 3 left */
function relTurn(from, to) { return ((to - from) % 4 + 4) % 4; }

/* ---- dijkstra over (intersection, arrival direction) ------ */
function solve(start, goal, initDir) {
  const N = NODES * NODES * 4;
  const cost = new Float32Array(N).fill(Infinity);
  const prev = new Int32Array(N).fill(-1);
  const done = new Uint8Array(N);
  const idx = (nx, ny, d) => ((ny * NODES + nx) * 4 + d);

  for (let d = 0; d < 4; d++) cost[idx(start[0], start[1], d)] = d === initDir ? 0 : 0.35;

  let best = -1;
  for (;;) {
    let u = -1, c = Infinity;
    for (let i = 0; i < N; i++) if (!done[i] && cost[i] < c) { c = cost[i]; u = i; }
    if (u < 0) break;
    done[u] = 1;
    const d = u & 3, node = u >> 2, nx = node % NODES, ny = (node / NODES) | 0;
    if (nx === goal[0] && ny === goal[1]) { best = u; break; }
    for (let nd = 0; nd < 4; nd++) {
      const mx = nx + DIRV[nd][0], my = ny + DIRV[nd][1];
      if (mx < 0 || my < 0 || mx >= NODES || my >= NODES) continue;
      const step = 1 + (nd === d ? 0 : nd === (d + 2) % 4 ? 1.8 : 0.45);
      const v = idx(mx, my, nd);
      if (c + step < cost[v]) { cost[v] = c + step; prev[v] = u; }
    }
  }
  if (best < 0) return [];
  const out = [];
  for (let u = best; u >= 0; u = prev[u]) {
    const node = u >> 2;
    out.push([node % NODES, (node / NODES) | 0]);
  }
  out.reverse();
  return out;
}
