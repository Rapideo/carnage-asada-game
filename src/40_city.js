/* ============================================================
   CITY  --  street grid, addressed houses, baked ground layer
   ============================================================ */
'use strict';

/* Street names come from content/hays.json via build.mjs. Note the axes: in
   Hays the NAMED streets run north-south (Main, Fort, Ash) and the NUMBERED
   ones run east-west (8th, 9th) -- the opposite of the placeholder grid this
   replaced. Indexing is unchanged: HSTREETS[by] is the east-west street on the
   NORTH edge of block row by, VSTREETS[bx] the north-south street on the WEST
   edge of block column bx. */
const HSTREETS = HAYS.streetsEW;
const VSTREETS = HAYS.streetsNS;

const NODES = BLOCKS + 1;                       // 9 x 9 intersections

const City = {
  solid: null, surf: null, ground: null, gx: null,
  statics: [], houses: [], shop: null, parkedTiles: null,

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
    this.statics = []; this.houses = []; this.crossings = []; this.tracks = null;

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
    /* Hand-authored in content/hays.json, not rolled: this is a real place.
       build.mjs has already checked the table is 8x8, that every kind is known,
       and that exactly one cell is the shop. */
    const kinds = HAYS.zoning.map((row) => row.slice());
    this.kinds = kinds;

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
      if (k === 'res')         this.genResidential(rng, bx, by);
      else if (k === 'retail') this.genRetail(rng, bx, by);
      else if (k === 'rail')   this.genRail(rng, bx, by);
      else if (k === 'civic')  this.genCivic(rng, bx, by);
      else if (k === 'apts')   this.genApts(rng, bx, by);
      else if (k === 'church') this.genChurch(rng, bx, by);
      else if (k === 'auto')   this.genAuto(rng, bx, by);
      else if (k === 'com')    this.genCommercial(rng, bx, by);
      else if (k === 'park')   this.genPark(rng, bx, by);
      else if (k === 'lot')    this.genParking(rng, bx, by);
      else if (k === 'shop')   this.genShop(rng, bx, by);
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

  /* markSolid obeys blindly, which is how a generator buries a porch and makes
     an address unwinnable. Block generators should use this instead: it refuses
     keep tiles and returns how many it refused, so a generator that is fighting
     the porch mask shows up rather than silently winning. */
  markSolidSafe(tx0, ty0, w, h) {
    let refused = 0;
    for (let ty = ty0; ty < ty0 + h; ty++) for (let tx = tx0; tx < tx0 + w; tx++) {
      if (tx < 0 || ty < 0 || tx >= GW || ty >= GH) continue;
      const i = ty * GW + tx;
      if (this.keep[i]) { refused++; continue; }
      this.solid[i] = 1;
    }
    return refused;
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

      /* address — real Hays convention.
         Fronting a NUMBERED street: a W/E prefix and a hundred-block from the
         distance to Main. Main-Fort is the 100 block, Fort-Ash the 200, and so
         on outward in both directions.
         Fronting a NAMED street: the hundred-block is the numbered street on
         the south edge of the block, which is how 1507 Main lands between 15th
         and 16th, and the courthouse at 1204 Fort between 12th and 13th.
         `odd` keeps the two sides of a street on opposite parities, so the two
         blocks that share a street cannot collide. */
      const along = (dir === 0 || dir === 2) ? i : j;
      const odd   = (dir === 0 || dir === 3) ? 1 : 0;
      let street, hundred;
      if (dir === 0 || dir === 2) {
        street  = ((bx < 4) ? 'W ' : 'E ') + ((dir === 0) ? HSTREETS[by] : HSTREETS[by + 1]);
        hundred = ((bx < 4) ? 4 - bx : bx - 3) * 100;
      } else {
        street  = (dir === 3) ? VSTREETS[bx] : VSTREETS[bx + 1];
        hundred = parseInt(HSTREETS[by + 1], 10) * 100;
      }
      const num = hundred + along * 22 + 6 + odd;

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

  /* ---------- the Union Pacific corridor ------------------ */
  /* Runs the full width of the map through this block row, solid along its
     whole length except where the nine north-south streets cross it. That is
     what makes the tracks a barrier rather than scenery: you cross where Hays
     lets you cross. Ballast bakes into the ground once and never changes. */
  genRail(rng, bx, by) {
    const g = this.gx;
    const MID = 6;                                    // corridor centre, block-local tiles
    this.railY = (BORDER + by * SPAN + MID) * TS;
    /* The corridor carries two tracks: each rail tile bakes a pair of rails,
       and genRail lays two rows of them. A train running down railY would
       straddle both and read as floating, so it has to pick one. Right-hand
       running, the same convention Traffic.laneFixed uses for the road:
       eastbound keeps to the south track. */
    this.tracks = [this.railY - 8, this.railY + 8];
    const lastCol = bx === BLOCKS - 1;
    const lxMax = lastCol ? SPAN + 1 : SPAN - 1;      // the far kerb carries the ninth crossing

    for (let ly = MID - 2; ly <= MID + 1; ly++) {
      const ty = BORDER + by * SPAN + ly;
      for (let lx = 0; lx <= lxMax; lx++) {
        const tx = BORDER + bx * SPAN + lx;
        if (tx < BORDER || tx >= GW - BORDER) continue;
        const onRoad = (lx % SPAN) < 2;
        const isRail = ly === MID - 1 || ly === MID;
        const set = onRoad ? (isRail ? Art.tile.plank : Art.tile.road)
                           : (isRail ? Art.tile.rail : Art.tile.ballast);
        g.drawImage(set[(lx + ly) & 3], tx * TS, ty * TS);
        this.surf[ty * GW + tx] = onRoad ? S_ROAD : S_GRASS;
        if (!onRoad) this.markSolidSafe(tx, ty, 1, 1);
      }
    }

    const addCrossing = (col) => {
      const cx = (BORDER + col * SPAN) * TS + TS;
      if (this.crossings.some((c) => Math.abs(c.x - cx) < 4)) return;
      /* A crossbuck on each approach, diagonally opposed like the real thing,
         44px off the centre line rather than ~20. The mast sprite is 28 tall
         with oy = 26, so its head sits 26px ABOVE the anchor: at +22 the south
         crossbuck landed on the south track and the train drew straight
         through it. 44 is the first offset that clears the rails, and it puts
         both masts outside the ballast band rather than in it. */
      const s = Art.signal, masts = [];
      for (const [ox, oy] of [[-24, 44], [22, -44]]) {
        const px = cx + ox, py = this.railY + oy;
        this.statics.push({ img: s.c, x: px, y: py, oy: s.oy, w: s.w, h: s.h, sortY: py + s.h, noShadow: true });
        masts.push([px + 5, py]);            // the mast centre line, at its base
      }
      this.crossings.push({ x: cx, y: this.railY, masts });
    };
    addCrossing(bx);
    if (lastCol) addCrossing(bx + 1);
  },

  /* ---------- auto / industrial block --------------------- */
  /* A shed at the back and rows of stock out front — which is what a car lot
     and a metal works both look like from above. The parked cars are the same
     statics genParking uses; no new art needed for them. */
  genAuto(rng, bx, by) {
    const g = this.gx;
    const lotX = (BORDER + bx * SPAN + 3) * TS, lotY = (BORDER + by * SPAN + 3) * TS, L = 8 * TS;

    /* asphalt across the whole lot */
    for (let ly = 3; ly <= 10; ly++) for (let lx = 3; lx <= 10; lx++) {
      const tx = BORDER + bx * SPAN + lx, ty = BORDER + by * SPAN + ly;
      this.surf[ty * GW + tx] = S_ROAD;
      g.drawImage(Art.tile.lot[(lx + ly) & 3], tx * TS, ty * TS);
    }

    /* shed hard against the back line */
    const s = Art.shed[rng.int(Art.shed.length)];
    const wx = lotX + ((L - s.w) >> 1), wy = lotY + TS;
    this.markSolidSafe((wx / TS) | 0, (wy / TS) | 0, Math.ceil(s.w / TS), Math.ceil(s.h / TS));
    this.statics.push({ img: s.c, x: wx, y: wy, oy: s.oy, w: s.w, h: s.h, sortY: wy + s.h });

    /* ONE row of stock, flush to the front lot line, with a wide aisle behind.
       Two rows 26px apart left a 4px pocket between them, and because each car
       marks 2x2 tiles the neighbouring marks merged into walls either side of
       it — a genuine trap the wedge sweep caught. Keep the aisle wider than a
       car and keep the row flush, so there is no gap to be caught in. */
    const ry = lotY + L - 32;
    g.fillStyle = '#c9cedeaa';
    for (let i = 0; i <= 6; i++) g.fillRect(lotX + 6 + i * 18, ry, 1, 22);
    for (let i = 0; i < 6; i++) {
      if (!rng.chance(0.72)) continue;
      const fr = Art.car[rng.int(Art.car.length)];
      const px = lotX + 8 + i * 18;
      this.statics.push({ img: fr[ROT / 4], x: px - 2, y: ry, oy: 4, w: 18, h: 22, sortY: ry + 22, isCar: true, fw: fr.size });
      this.markSolidSafe((px / TS) | 0, (ry / TS) | 0, 2, 2);
    }
  },

  /* ---------- church block -------------------------------- */
  /* Nave set in a lawn, steeple at the street end. The steeple is placed as a
     separate static so its huge overhang sorts against the nave correctly. */
  genChurch(rng, bx, by) {
    const g = this.gx;
    const lotX = (BORDER + bx * SPAN + 3) * TS, lotY = (BORDER + by * SPAN + 3) * TS, L = 8 * TS;
    const c = Art.church[rng.int(Art.church.length)];
    const wx = lotX + ((L - c.w) >> 1), wy = lotY + TS;

    this.markSolidSafe((wx / TS) | 0, (wy / TS) | 0, Math.ceil(c.w / TS), Math.ceil(c.h / TS));
    this.statics.push({ img: c.c, x: wx, y: wy, oy: c.oy, w: c.w, h: c.h, sortY: wy + c.h });

    /* Steeple at the south-WEST corner, clear of the centre door. Its overhang
       is the largest in the game, so anything it stands in front of is hidden —
       putting it over the entrance buried the doors it is meant to announce. */
    const s = Art.steeple;
    const sx = wx - 10, sy = wy + c.h - 2;
    this.markSolidSafe((sx / TS) | 0, (sy / TS) | 0, 2, 1);
    this.statics.push({ img: s.c, x: sx, y: sy, oy: s.oy, w: s.w, h: s.h, sortY: sy + s.h });

    /* path from the door to the pavement */
    const px = wx + (c.w >> 1);
    R(g, '#c2b697', px - 6, wy + c.h, 12, lotY + L - (wy + c.h));

    /* a tree at each front corner */
    for (const tx0 of [lotX + 4, lotX + L - 26]) {
      const t = Art.tree[rng.int(Art.tree.length)];
      const py = lotY + L - 30;
      this.markSolidSafe((tx0 / TS) | 0, (py / TS) | 0, 1, 1);
      this.statics.push({ img: t.c, x: tx0, y: py, oy: t.oy, w: t.w, h: t.h, sortY: py + t.h });
    }
  },

  /* ---------- apartment block ----------------------------- */
  /* Two blocks of flats with a shared apron behind. Deliberately NOT
     deliverable: every address in the game comes from genResidential, and
     giving these a second address path is a follow-up, not this branch. */
  genApts(rng, bx, by) {
    const g = this.gx;
    const lotX = (BORDER + bx * SPAN + 3) * TS, lotY = (BORDER + by * SPAN + 3) * TS, L = 8 * TS;

    /* apron across the back half */
    for (let ly = 3; ly <= 10; ly++) for (let lx = 3; lx <= 10; lx++) {
      const tx = BORDER + bx * SPAN + lx, ty = BORDER + by * SPAN + ly;
      if (ly > 7) continue;
      this.surf[ty * GW + tx] = S_ROAD;
      g.drawImage(Art.tile.lot[(lx + ly) & 3], tx * TS, ty * TS);
    }

    /* two blocks facing the street, a gap between them */
    for (const ox of [0, 4 * TS]) {
      const b = Art.apts[rng.int(Art.apts.length)];
      const wx = lotX + ox, wy = lotY + L - b.h;
      this.markSolidSafe((wx / TS) | 0, (wy / TS) | 0, Math.ceil(b.w / TS), Math.ceil(b.h / TS));
      this.statics.push({ img: b.c, x: wx, y: wy, oy: b.oy, w: b.w, h: b.h, sortY: wy + b.h });
    }

    /* bins and a bench on the apron */
    for (let i = 0; i < 3; i++) {
      const pr = Art.prop[rng.chance(0.5) ? 'trash' : 'bench'];
      const px = lotX + 8 + rng.int(L - 24), py = lotY + 10 + rng.int(40);
      this.statics.push({ img: pr.c, x: px, y: py, oy: pr.oy, w: pr.w, h: pr.h, sortY: py + pr.h, noShadow: true });
    }
  },

  /* ---------- civic block --------------------------------- */
  /* Post office, bank, county offices. Set back behind a paved forecourt
     rather than built to the pavement: downtown crowds the street, civic
     buildings stand off it, and that setback is the whole read. */
  genCivic(rng, bx, by) {
    const g = this.gx;
    const lotX = (BORDER + bx * SPAN + 3) * TS, lotY = (BORDER + by * SPAN + 3) * TS, L = 8 * TS;
    const b = Art.civic[rng.int(Art.civic.length)];
    const wx = lotX + ((L - b.w) >> 1), wy = lotY + TS;

    this.markSolidSafe((wx / TS) | 0, (wy / TS) | 0, Math.ceil(b.w / TS), Math.ceil(b.h / TS));
    this.statics.push({ img: b.c, x: wx, y: wy, oy: b.oy, w: b.w, h: b.h, sortY: wy + b.h });

    /* paved forecourt between the steps and the pavement */
    for (let ty = ((wy + b.h) / TS) | 0; ty < ((lotY + L) / TS) | 0; ty++)
      for (let tx = (lotX / TS) | 0; tx < ((lotX + L) / TS) | 0; tx++) {
        this.surf[ty * GW + tx] = S_WALK;
        g.drawImage(Art.tile.walk[(tx + ty) & 3], tx * TS, ty * TS);
      }

    /* a tree either side of the forecourt */
    for (const sx of [lotX + 8, lotX + L - 28]) {
      const t = Art.tree[rng.int(Art.tree.length)];
      const py = wy + b.h + 8;
      this.markSolidSafe((sx / TS) | 0, (py / TS) | 0, 1, 1);
      this.statics.push({ img: t.c, x: sx, y: py, oy: t.oy, w: t.w, h: t.h, sortY: py + t.h });
    }
  },

  /* ---------- downtown retail block ----------------------- */
  /* Built to the lot line north and south, with a service court between. The
     read that matters from directly above is "no yards, no gaps" — that is what
     separates downtown from the residential blocks, far more than which way a
     shopfront happens to face. */
  genRetail(rng, bx, by) {
    const lotX = (BORDER + bx * SPAN + 3) * TS, lotY = (BORDER + by * SPAN + 3) * TS, L = 8 * TS;
    const g = this.gx;

    /* service court behind the runs: asphalt, not lawn */
    for (let ly = 3; ly <= 10; ly++) for (let lx = 3; lx <= 10; lx++) {
      const tx = BORDER + bx * SPAN + lx, ty = BORDER + by * SPAN + ly;
      this.surf[ty * GW + tx] = S_ROAD;
      g.drawImage(Art.tile.lot[(lx + ly) & 3], tx * TS, ty * TS);
    }

    /* two runs, hard against the north and south lot lines */
    for (const side of [0, 1]) {
      const s = Art.store[rng.int(Art.store.length)];
      const wx = lotX;
      const wy = side === 0 ? lotY + TS : lotY + L - s.h;
      this.markSolidSafe((wx / TS) | 0, (wy / TS) | 0, 8, Math.ceil(s.h / TS));
      this.statics.push({ img: s.c, x: wx, y: wy, oy: s.oy, w: s.w, h: s.h, sortY: wy + s.h });
    }

    /* painted bays in the service court */
    g.fillStyle = '#c9cede55';
    for (let i = 0; i < 7; i++) g.fillRect(lotX + 8 + i * 17, lotY + L / 2 - 8, 1, 16);
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
    const p = Art.taqueria;
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

    this.shop = {
      x: wx, y: wy, w: p.w, h: p.h,
      dock: { x: dockX, y: dockY },
      node: [this.nearNodeX(dockX), this.nearNodeY(wy + p.h + 60)],
      curb: { x: dockX, y: (BORDER + (by + 1) * SPAN) * TS + TS },
    };
    this.shop.node = [this.nearNodeX(this.shop.curb.x), this.nearNodeY(this.shop.curb.y)];

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
