/* ============================================================
   CITY  --  street grid, addressed houses, baked ground layer
   ============================================================ */
'use strict';

const HSTREETS = ['MAPLE ST', 'OAK ST', 'PINE ST', 'BIRCH ST', 'CEDAR ST',
                  'ELM ST', 'WALNUT ST', 'ASPEN ST', 'LAUREL ST'];
const VSTREETS = ['1ST AVE', '2ND AVE', '3RD AVE', '4TH AVE', '5TH AVE',
                  '6TH AVE', '7TH AVE', '8TH AVE', '9TH AVE'];

const NODES = BLOCKS + 1;                       // 9 x 9 intersections

const City = {
  solid: null, surf: null, ground: null, gx: null,
  statics: [], houses: [], pizzeria: null, parkedTiles: null,

  nodeX(n) { return (BORDER + n * SPAN) * TS + TS; },
  nodeY(n) { return (BORDER + n * SPAN) * TS + TS; },
  nearNodeX(wx) { return clamp(Math.round((wx / TS - BORDER - 1) / SPAN), 0, BLOCKS); },
  nearNodeY(wy) { return clamp(Math.round((wy / TS - BORDER - 1) / SPAN), 0, BLOCKS); },

  isSolid(wx, wy) {
    const tx = (wx / TS) | 0, ty = (wy / TS) | 0;
    if (tx < 0 || ty < 0 || tx >= GW || ty >= GH) return 1;
    return this.solid[ty * GW + tx];
  },
  surfaceAt(wx, wy) {
    const tx = (wx / TS) | 0, ty = (wy / TS) | 0;
    if (tx < 0 || ty < 0 || tx >= GW || ty >= GH) return S_SEA;
    return this.surf[ty * GW + tx];
  },

  gen(rng) {
    this.solid = new Uint8Array(GW * GH);
    this.surf  = new Uint8Array(GW * GH);
    this.keep  = new Uint8Array(GW * GH);   // porches + walkways: nothing may block these
    this.statics = []; this.houses = [];

    const g = mkCanvas(WW, WH);
    this.ground = g.c; this.gx = g.x;
    const x = this.gx;

    /* ---- 1. classify + bake base tiles ------------------- */
    const cls = new Uint8Array(GW * GH);
    for (let ty = 0; ty < GH; ty++) {
      for (let tx = 0; tx < GW; tx++) {
        const c = classify(tx, ty), i = ty * GW + tx;
        cls[i] = c;
        this.surf[i] = c === T_SEA ? S_SEA : (c === T_WALK ? S_WALK : (c === T_LOT ? S_GRASS : S_ROAD));
        if (c === T_SEA) this.solid[i] = 1;
      }
    }

    /* ---- 2. block programme ----------------------------- */
    const PIZZA_BX = 3, PIZZA_BY = 4;
    const kinds = [];
    for (let by = 0; by < BLOCKS; by++) {
      kinds[by] = [];
      for (let bx = 0; bx < BLOCKS; bx++) {
        if (bx === PIZZA_BX && by === PIZZA_BY) { kinds[by][bx] = 'shop'; continue; }
        const roll = rng();
        kinds[by][bx] = roll < 0.60 ? 'res' : roll < 0.80 ? 'com' : roll < 0.90 ? 'park' : 'lot';
      }
    }

    /* ---- 3. paint block ground surfaces ------------------ */
    for (let by = 0; by < BLOCKS; by++) for (let bx = 0; bx < BLOCKS; bx++) {
      const k = kinds[by][bx];
      if (k === 'com' || k === 'lot' || k === 'shop') {
        for (let ly = 1; ly <= 8; ly++) for (let lx = 1; lx <= 8; lx++) {
          const tx = BORDER + bx * SPAN + 2 + lx, ty = BORDER + by * SPAN + 2 + ly;
          this.surf[ty * GW + tx] = S_ROAD;
          cls[ty * GW + tx] = 100;              // lot asphalt marker
        }
      }
    }

    const pick = (arr, tx, ty) => arr[((tx * 73856093) ^ (ty * 19349663)) & 3];
    for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
      const c = cls[ty * GW + tx];
      const set = c === T_SEA ? Art.tile.sea : c === T_WALK ? Art.tile.walk
                : c === T_LOT ? Art.tile.grass : c === 100 ? Art.tile.lot : Art.tile.road;
      x.drawImage(pick(set, tx, ty), tx * TS, ty * TS);
    }

    /* ---- 4. sea wall along the grid edge ----------------- */
    this.drawSeaWall(x);

    /* ---- 5. road markings -------------------------------- */
    this.drawRoadMarkings(x);

    /* ---- 6. build each block ----------------------------- */
    for (let by = 0; by < BLOCKS; by++) for (let bx = 0; bx < BLOCKS; bx++) {
      const k = kinds[by][bx];
      if (k === 'res')       this.genResidential(rng, bx, by);
      else if (k === 'com')  this.genCommercial(rng, bx, by);
      else if (k === 'park') this.genPark(rng, bx, by);
      else if (k === 'lot')  this.genParking(rng, bx, by);
      else if (k === 'shop') this.genShop(rng, bx, by);
    }

    /* ---- 7. street furniture ----------------------------- */
    this.genFurniture(rng);

    /* ---- 8. bake static shadows, sort draw order --------- */
    x.fillStyle = 'rgba(18,10,26,0.26)';
    for (const s of this.statics) {
      if (s.noShadow) continue;
      x.fillRect(s.x + 6, s.y + 7, s.w, s.h);
    }
    this.statics.sort((a, b) => a.sortY - b.sortY);
    this.buildBuckets();
  },

  /* ---------- coarse spatial index for the draw pass ------ */
  BS: 128,
  buildBuckets() {
    this.BC = Math.ceil(WW / this.BS);
    this.buckets = [];
    for (let i = 0; i < this.BC * this.BC; i++) this.buckets.push([]);
    for (const s of this.statics) {
      s._seen = -1;
      const x0 = clamp((s.x / this.BS) | 0, 0, this.BC - 1);
      const y0 = clamp(((s.y - s.oy) / this.BS) | 0, 0, this.BC - 1);
      const x1 = clamp(((s.x + s.w) / this.BS) | 0, 0, this.BC - 1);
      const y1 = clamp(((s.y + s.h) / this.BS) | 0, 0, this.BC - 1);
      for (let by = y0; by <= y1; by++) for (let bx = x0; bx <= x1; bx++)
        this.buckets[by * this.BC + bx].push(s);
    }
    this._stamp = 0;
  },

  /** push every static overlapping the rect into `out` */
  collect(x0, y0, x1, y1, out) {
    const st = ++this._stamp;
    const bx0 = clamp((x0 / this.BS) | 0, 0, this.BC - 1), bx1 = clamp((x1 / this.BS) | 0, 0, this.BC - 1);
    const by0 = clamp((y0 / this.BS) | 0, 0, this.BC - 1), by1 = clamp((y1 / this.BS) | 0, 0, this.BC - 1);
    for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
      const b = this.buckets[by * this.BC + bx];
      for (let i = 0; i < b.length; i++) {
        const s = b[i];
        if (s._seen === st) continue;
        s._seen = st;
        if (s.x > x1 || s.x + s.w < x0 || s.y - s.oy > y1 || s.y + s.h < y0) continue;
        out.push(s);
      }
    }
  },

  /* ---------- sea wall ------------------------------------ */
  drawSeaWall(x) {
    const a = BORDER * TS, b = (BORDER + SPANEND + 1) * TS;
    const rim = (px, py, w, h) => {
      R(x, PAL.wall, px, py, w, h);
      R(x, shade(PAL.wall, 0.2), px, py, w, 1);
      R(x, PAL.wallLo, px, py + h - 1, w, 1);
    };
    rim(a - 6, a - 6, b - a + 12, 6);
    rim(a - 6, b, b - a + 12, 6);
    rim(a - 6, a, 6, b - a);
    rim(b, a, 6, b - a);
    // foam on the water side
    x.fillStyle = PAL.seaFoam;
    for (let i = a - 6; i < b + 6; i += 7) {
      x.fillRect(i, a - 9, 4, 1); x.fillRect(i + 2, b + 8, 4, 1);
      x.fillRect(a - 9, i, 1, 4); x.fillRect(b + 8, i + 2, 1, 4);
    }
  },

  /* ---------- lane lines, crosswalks ---------------------- */
  drawRoadMarkings(x) {
    const lo = BORDER * TS, hi = (BORDER + SPANEND + 1) * TS;
    // centre dashes on every road, skipping intersections
    for (let n = 0; n <= BLOCKS; n++) {
      const cx = (BORDER + n * SPAN) * TS + TS;
      for (let y = lo; y < hi; y += 22) {
        if (this.inIntersection(cx, y + 6)) continue;
        R(x, PAL.lineY, cx - 1, y, 2, 12);
      }
      const cy = (BORDER + n * SPAN) * TS + TS;
      for (let px = lo; px < hi; px += 22) {
        if (this.inIntersection(px + 6, cy)) continue;
        R(x, PAL.lineY, px, cy - 1, 12, 2);
      }
    }
    // crosswalks on every intersection approach
    for (let ny = 0; ny <= BLOCKS; ny++) for (let nx = 0; nx <= BLOCKS; nx++) {
      const ix = (BORDER + nx * SPAN) * TS, iy = (BORDER + ny * SPAN) * TS;
      for (let s = 0; s < 4; s++) {
        const vert = s < 2;
        const px = vert ? ix : (s === 2 ? ix - 7 : ix + 32);
        const py = vert ? (s === 0 ? iy - 7 : iy + 32) : iy;
        if (px < lo - 8 || py < lo - 8 || px > hi || py > hi) continue;
        for (let i = 2; i < 32; i += 6) {
          if (vert) R(x, PAL.lineW, px + i, py, 4, 7);
          else      R(x, PAL.lineW, px, py + i, 7, 4);
        }
      }
    }
    // curb line where sidewalk meets road
    x.fillStyle = PAL.curb;
    for (let b = 0; b < BLOCKS; b++) {
      for (let n = 0; n <= BLOCKS; n++) {
        const s = (BORDER + b * SPAN + 2) * TS, len = 10 * TS;
        const e = (BORDER + n * SPAN) * TS;
        x.fillRect(s, e + 32 - 1, len, 1);
        x.fillRect(s, e - 1, len, 1);
        x.fillRect(e + 32 - 1, s, 1, len);
        x.fillRect(e - 1, s, 1, len);
      }
    }
  },

  inIntersection(wx, wy) {
    const ax = (wx / TS | 0) - BORDER, ay = (wy / TS | 0) - BORDER;
    return (ax % SPAN) < 2 && (ay % SPAN) < 2;
  },

  markSolid(tx0, ty0, w, h) {
    for (let ty = ty0; ty < ty0 + h; ty++) for (let tx = tx0; tx < tx0 + w; tx++)
      if (tx >= 0 && ty >= 0 && tx < GW && ty < GH) this.solid[ty * GW + tx] = 1;
  },

  /* ---------- residential block --------------------------- */
  genResidential(rng, bx, by) {
    const ns = rng.chance(0.5);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const lotAX = bx * SPAN + 3 + i * 4;      // grid-space tile of lot origin
      const lotAY = by * SPAN + 3 + j * 4;
      let dir, ax, ay, tw, th;
      if (ns) {
        dir = j === 0 ? 0 : 2;
        tw = 4; th = 3;
        ax = lotAX; ay = j === 0 ? lotAY + 1 : lotAY;
      } else {
        dir = i === 0 ? 3 : 1;
        tw = 3; th = 4;
        ax = i === 0 ? lotAX + 1 : lotAX; ay = lotAY;
      }
      const tx = BORDER + ax, ty = BORDER + ay;
      this.markSolid(tx, ty, tw, th);

      const wx = tx * TS, wy = ty * TS, w = tw * TS, h = th * TS;
      const variant = rng.int(Art.house.length);
      const spr = Art.house[variant][dir];
      this.statics.push({ img: spr.c, x: wx, y: wy, oy: spr.oy, w, h, sortY: wy + h });

      /* porch, door bullseye, curb point */
      let porch, curb, node;
      // the porch is the delivery target, so it is sized to stay hittable from
      // a moving car: wide along the street, one yard-tile deep
      if (dir === 0)      porch = { x: wx + w / 2 - 14, y: wy - 15, w: 28, h: 15 };
      else if (dir === 2) porch = { x: wx + w / 2 - 14, y: wy + h,  w: 28, h: 15 };
      else if (dir === 1) porch = { x: wx + w,          y: wy + h / 2 - 14, w: 15, h: 28 };
      else                porch = { x: wx - 15,         y: wy + h / 2 - 14, w: 15, h: 28 };

      const pcx = porch.x + porch.w / 2, pcy = porch.y + porch.h / 2;
      if (dir === 0)      curb = { x: pcx, y: (BORDER + by * SPAN) * TS + TS };
      else if (dir === 2) curb = { x: pcx, y: (BORDER + (by + 1) * SPAN) * TS + TS };
      else if (dir === 3) curb = { x: (BORDER + bx * SPAN) * TS + TS, y: pcy };
      else                curb = { x: (BORDER + (bx + 1) * SPAN) * TS + TS, y: pcy };
      node = [this.nearNodeX(curb.x), this.nearNodeY(curb.y)];

      /* address */
      const along = (dir === 0 || dir === 2) ? i : j;
      const cross = (dir === 0 || dir === 2) ? bx : by;
      const street = (dir === 0) ? HSTREETS[by] : (dir === 2) ? HSTREETS[by + 1]
                   : (dir === 3) ? VSTREETS[bx] : VSTREETS[bx + 1];
      const num = cross * 100 + along * 22 + ((dir === 0 || dir === 3) ? 7 : 8);

      const house = {
        x: wx, y: wy, w, h, dir, porch, street, num,
        addr: num + ' ' + street,
        door: { x: pcx - 6, y: pcy - 5, w: 12, h: 10 },
        cx: wx + w / 2, cy: wy + h / 2, curb, node,
      };
      this.houses.push(house);

      /* reserve the porch and its walkway out to the kerb */
      const wOut = 18;
      const clr = dir === 0 ? { x: porch.x, y: (BORDER + by * SPAN + 2) * TS, w: porch.w, h: porch.y + porch.h - (BORDER + by * SPAN + 2) * TS }
                : dir === 2 ? { x: porch.x, y: porch.y, w: porch.w, h: (BORDER + (by + 1) * SPAN) * TS - porch.y }
                : dir === 3 ? { x: (BORDER + bx * SPAN + 2) * TS, y: porch.y, w: porch.x + porch.w - (BORDER + bx * SPAN + 2) * TS, h: porch.h }
                :             { x: porch.x, y: porch.y, w: (BORDER + (bx + 1) * SPAN) * TS - porch.x, h: porch.h };
      for (let ty2 = (clr.y / TS) | 0; ty2 <= ((clr.y + clr.h - 1) / TS) | 0; ty2++)
        for (let tx2 = (clr.x / TS) | 0; tx2 <= ((clr.x + clr.w - 1) / TS) | 0; tx2++)
          if (tx2 >= 0 && ty2 >= 0 && tx2 < GW && ty2 < GH) this.keep[ty2 * GW + tx2] = 1;
      house.clear = clr;

      /* ground: porch pad + walkway to the sidewalk */
      const g = this.gx;
      R(g, PAL.porch, porch.x, porch.y, porch.w, porch.h);
      R(g, shade(PAL.porch, -0.22), porch.x, porch.y + porch.h - 1, porch.w, 1);
      R(g, shade(PAL.porch, 0.15), porch.x, porch.y, porch.w, 1);
      g.strokeStyle = 'rgba(20,14,28,0.35)'; g.lineWidth = 1;
      g.strokeRect(porch.x + 0.5, porch.y + 0.5, porch.w - 1, porch.h - 1);

      const pathC = '#c2b697';
      if (dir === 0)      R(g, pathC, pcx - 5, (BORDER + by * SPAN + 2) * TS, 10, porch.y - (BORDER + by * SPAN + 2) * TS);
      else if (dir === 2) R(g, pathC, pcx - 5, porch.y + porch.h, 10, (BORDER + (by + 1) * SPAN - 1) * TS + TS - (porch.y + porch.h));
      else if (dir === 3) R(g, pathC, (BORDER + bx * SPAN + 2) * TS, pcy - 5, porch.x - (BORDER + bx * SPAN + 2) * TS, 10);
      else                R(g, pathC, porch.x + porch.w, pcy - 5, (BORDER + (bx + 1) * SPAN - 1) * TS + TS - (porch.x + porch.w), 10);

      /* mailbox at the kerb */
      const mb = Art.prop.mailbox;
      let mx2 = curb.x, my2 = curb.y;
      if (dir === 0)      { mx2 = pcx + 12; my2 = (BORDER + by * SPAN + 2) * TS + 4; }
      else if (dir === 2) { mx2 = pcx + 12; my2 = (BORDER + (by + 1) * SPAN) * TS - 4; }
      else if (dir === 3) { mx2 = (BORDER + bx * SPAN + 2) * TS + 4; my2 = pcy + 12; }
      else                { mx2 = (BORDER + (bx + 1) * SPAN) * TS - 4; my2 = pcy + 12; }
      this.statics.push({ img: mb.c, x: mx2, y: my2, oy: mb.oy, w: mb.w, h: mb.h, sortY: my2 + mb.h, noShadow: true });

      /* a bush in the yard — never on the porch or its walkway */
      if (rng.chance(0.75)) {
        const bu = Art.prop.bush;
        for (let a = 0; a < 6; a++) {
          const bxp = wx + rng.int(Math.max(1, w - bu.w)), byp = wy + h - 4 + rng.int(6);
          const kt = (((byp + bu.h / 2) / TS) | 0) * GW + (((bxp + bu.w / 2) / TS) | 0);
          if (this.keep[kt]) continue;
          this.statics.push({ img: bu.c, x: bxp, y: byp, oy: bu.oy, w: bu.w, h: bu.h, sortY: byp + bu.h });
          break;
        }
      }
    }
  },

  /* ---------- commercial block ---------------------------- */
  genCommercial(rng, bx, by) {
    const b = Art.bldg[rng.int(Art.bldg.length)];
    const lotX = (BORDER + bx * SPAN + 3) * TS, lotY = (BORDER + by * SPAN + 3) * TS;
    const lotW = 8 * TS;
    const wx = lotX + ((lotW - b.w) >> 1), wy = lotY + ((lotW - b.h) >> 1);
    this.markSolid((wx / TS) | 0, (wy / TS) | 0, Math.ceil(b.w / TS), Math.ceil(b.h / TS));
    this.statics.push({ img: b.c, x: wx, y: wy, oy: b.oy, w: b.w, h: b.h, sortY: wy + b.h });

    // painted stalls in the apron
    const g = this.gx;
    g.fillStyle = '#c9cede88';
    if (wy - lotY > 20) for (let i = 0; i < 8; i++) g.fillRect(lotX + 6 + i * 15, lotY + 2, 1, 14);
    if (lotY + lotW - (wy + b.h) > 20) for (let i = 0; i < 8; i++) g.fillRect(lotX + 6 + i * 15, lotY + lotW - 16, 1, 14);
  },

  /* ---------- park block ---------------------------------- */
  genPark(rng, bx, by) {
    const g = this.gx;
    const lotX = (BORDER + bx * SPAN + 3) * TS, lotY = (BORDER + by * SPAN + 3) * TS, L = 8 * TS;
    // winding path
    g.fillStyle = '#c2b697';
    g.fillRect(lotX, lotY + L / 2 - 6, L, 12);
    g.fillRect(lotX + L / 2 - 6, lotY, 12, L);
    // pond
    if (rng.chance(0.6)) {
      const px = lotX + 8 + rng.int(30), py = lotY + 8 + rng.int(30), pw = 40 + rng.int(24), ph = 30 + rng.int(16);
      g.fillStyle = PAL.sea; g.beginPath(); g.ellipse(px + pw / 2, py + ph / 2, pw / 2, ph / 2, 0, 0, TAU); g.fill();
      g.fillStyle = PAL.seaLite; g.beginPath(); g.ellipse(px + pw / 2, py + ph / 2 - 2, pw / 2 - 4, ph / 2 - 4, 0, 0, TAU); g.fill();
      g.fillStyle = PAL.seaFoam;
      for (let i = 0; i < 6; i++) g.fillRect(px + 8 + rng.int(pw - 16), py + 6 + rng.int(ph - 12), 4, 1);
      this.markSolid(((px + 6) / TS) | 0, ((py + 6) / TS) | 0, Math.max(1, ((pw - 12) / TS) | 0), Math.max(1, ((ph - 12) / TS) | 0));
    }
    for (let i = 0; i < 7 + rng.int(5); i++) {
      const t = Art.tree[rng.int(Art.tree.length)];
      const tx = lotX + rng.int(L - t.w), ty = lotY + rng.int(L - t.h);
      this.markSolid(((tx + t.w / 2 - 4) / TS) | 0, ((ty + t.h / 2 - 4) / TS) | 0, 1, 1);
      this.statics.push({ img: t.c, x: tx, y: ty, oy: t.oy, w: t.w, h: t.h, sortY: ty + t.h });
    }
    for (let i = 0; i < 2; i++) {
      const bn = Art.prop.bench;
      const tx = lotX + 10 + rng.int(L - 30), ty = lotY + L / 2 + 10 + rng.int(20);
      this.statics.push({ img: bn.c, x: tx, y: ty, oy: bn.oy, w: bn.w, h: bn.h, sortY: ty + bn.h, noShadow: true });
    }
  },

  /* ---------- parking lot block --------------------------- */
  genParking(rng, bx, by) {
    const g = this.gx;
    const lotX = (BORDER + bx * SPAN + 3) * TS, lotY = (BORDER + by * SPAN + 3) * TS, L = 8 * TS;
    g.fillStyle = '#c9cedeaa';
    for (let row = 0; row < 3; row++) {
      const ry = lotY + 10 + row * 40;
      for (let i = 0; i <= 6; i++) g.fillRect(lotX + 8 + i * 18, ry, 1, 26);
      g.fillRect(lotX + 8, ry, 109, 1);
    }
    for (let i = 0; i < 6 + rng.int(6); i++) {
      const ci = rng.int(Art.car.length), fr = Art.car[ci];
      const row = rng.int(3);
      const px = lotX + 10 + rng.int(6) * 18, py = lotY + 12 + row * 40;
      const d = fr.size;
      this.statics.push({ img: fr[ROT / 4], x: px - 2, y: py, oy: 4, w: 18, h: 22, sortY: py + 22, noShadow: false, isCar: true, fw: d });
      this.markSolid((px / TS) | 0, (py / TS) | 0, 2, 2);
    }
  },

  /* ---------- the shop ------------------------------------ */
  genShop(rng, bx, by) {
    const p = Art.pizzeria;
    const lotX = (BORDER + bx * SPAN + 3) * TS, lotY = (BORDER + by * SPAN + 3) * TS, L = 8 * TS;
    const wx = lotX + ((L - p.w) >> 1), wy = lotY;
    this.markSolid((wx / TS) | 0, (wy / TS) | 0, Math.ceil(p.w / TS), Math.ceil(p.h / TS));
    this.statics.push({ img: p.c, x: wx, y: wy, oy: p.oy, w: p.w, h: p.h, sortY: wy + p.h });

    const g = this.gx;
    // apron with a bold painted pickup bay
    const dockX = wx + p.w / 2, dockY = wy + p.h + 24;
    R(g, PAL.amber, dockX - 30, dockY - 16, 60, 32);
    R(g, '#3a3040', dockX - 27, dockY - 13, 54, 26);
    for (let i = 0; i < 60; i += 8) R(g, PAL.amber, dockX - 30 + i, dockY - 16, 4, 3);
    text(g, 'PICKUP', dockX, dockY - 8, PAL.amber, 1, 1);
    text(g, 'ONLY', dockX, dockY + 2, PAL.amber, 1, 1);

    this.pizzeria = {
      x: wx, y: wy, w: p.w, h: p.h,
      dock: { x: dockX, y: dockY },
      node: [this.nearNodeX(dockX), this.nearNodeY(wy + p.h + 60)],
      curb: { x: dockX, y: (BORDER + (by + 1) * SPAN) * TS + TS },
    };
    this.pizzeria.node = [this.nearNodeX(this.pizzeria.curb.x), this.nearNodeY(this.pizzeria.curb.y)];

    // driveway out to the street
    R(g, '#5a5e70', dockX - 20, dockY + 16, 40, (BORDER + (by + 1) * SPAN) * TS - (dockY + 16));
  },

  /* ---------- street furniture along sidewalks ------------ */
  genFurniture(rng) {
    for (let by = 0; by <= BLOCKS; by++) for (let bx = 0; bx <= BLOCKS; bx++) {
      // lamps at intersection corners
      const ix = (BORDER + bx * SPAN) * TS, iy = (BORDER + by * SPAN) * TS;
      for (const [ox, oy] of [[-10, -10], [36, -10], [-10, 36], [36, 36]]) {
        const px = ix + ox, py = iy + oy;
        if (px < BORDER * TS || py < BORDER * TS || px > (BORDER + SPANEND) * TS || py > (BORDER + SPANEND) * TS) continue;
        const l = Art.prop.lamp;
        this.statics.push({ img: l.c, x: px, y: py, oy: l.oy, w: l.w, h: l.h, sortY: py + l.h, noShadow: true });
      }
    }
    // hydrants / trash / cones scattered on sidewalks
    for (let i = 0; i < 190; i++) {
      const bx = rng.int(BLOCKS), by = rng.int(BLOCKS);
      const side = rng.int(4);
      const base = rng.int(8) + 1;
      let ax, ay;
      if (side === 0) { ax = bx * SPAN + 2 + base; ay = by * SPAN + 2; }
      else if (side === 2) { ax = bx * SPAN + 2 + base; ay = by * SPAN + 11; }
      else if (side === 3) { ax = bx * SPAN + 2; ay = by * SPAN + 2 + base; }
      else { ax = bx * SPAN + 11; ay = by * SPAN + 2 + base; }
      if (this.keep[(BORDER + ay) * GW + (BORDER + ax)]) continue;
      const px = (BORDER + ax) * TS + 4, py = (BORDER + ay) * TS + 3;
      const kind = rng() < 0.4 ? 'hydrant' : rng() < 0.7 ? 'trash' : 'cone';
      const pr = Art.prop[kind];
      this.statics.push({ img: pr.c, x: px, y: py, oy: pr.oy, w: pr.w, h: pr.h, sortY: py + pr.h, noShadow: true });
    }
    // street trees in the grass strip
    for (let i = 0; i < 140; i++) {
      const bx = rng.int(BLOCKS), by = rng.int(BLOCKS);
      const ax = bx * SPAN + 3 + rng.int(8), ay = by * SPAN + 3 + rng.int(8);
      const tx = BORDER + ax, ty = BORDER + ay;
      if (this.solid[ty * GW + tx] || this.keep[ty * GW + tx] || this.surf[ty * GW + tx] !== S_GRASS) continue;
      const t = Art.tree[rng.int(Art.tree.length)];
      const px = tx * TS - 2, py = ty * TS - 4;
      this.markSolid(tx, ty, 1, 1);
      this.statics.push({ img: t.c, x: px, y: py, oy: t.oy, w: t.w, h: t.h, sortY: py + t.h });
    }
  },
};
