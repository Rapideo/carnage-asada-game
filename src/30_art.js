/* ============================================================
   ART  --  every pixel generated at boot. no external assets.
   ============================================================ */
'use strict';

const ROT = 32;                     // rotation frames per vehicle
const WALLH = 9;                    // fake wall height for houses
const BWALLH = 14;                  // fake wall height for commercial

const ROOFS = [
  [PAL.roofA, PAL.roofAlo], [PAL.roofB, PAL.roofBlo], [PAL.roofC, PAL.roofClo],
  [PAL.roofD, PAL.roofDlo], [PAL.roofE, PAL.roofElo], [PAL.roofF, PAL.roofFlo],
];
const WALLS = [
  [PAL.wallLt, PAL.wallMd, PAL.wallDk],
  ['#d9c9c0', '#bda99e', '#8a7469'],
  ['#cfd6c4', '#b0b89f', '#7f8770'],
  ['#e6d9c0', '#c8b89a', '#93836a'],
];

/* The shop's display face — hand-authored 7x9, fat strokes with clipped
   corners, in the style of the real Taco Shop sticker. Used for BOTH the
   badge wordmark and the CARNAGE ASADA title so the two read as one lockup.
   Only the 12 characters those two phrases need are authored.

   7x9 is not arbitrary: at scale 3 four characters measure 93px, which is the
   ~2px overspill the 88px badge face wants, and at scale 2 thirteen measure
   206px, the title's established width. One grid, both sizes, no resampling.
   Display art only — the 5x7 game font is untouched. */
const LOGO_W = 7, LOGO_H = 9;
const LOGO_SRC = {
  'A': '..###..,.#####.,##...##,##...##,#######,#######,##...##,##...##,##...##',
  'C': '..###..,.#####.,##...##,##.....,##.....,##.....,##...##,.#####.,..###..',
  'D': '#####..,######.,##..###,##...##,##...##,##...##,##..###,######.,#####..',
  'E': '#######,#######,##.....,##.....,######.,######.,##.....,#######,#######',
  'G': '..###..,.#####.,##...##,##.....,##..###,##..###,##...##,.#####.,..###..',
  'H': '##...##,##...##,##...##,##...##,#######,#######,##...##,##...##,##...##',
  'N': '##...##,###..##,####.##,#######,##.####,##..###,##...##,##...##,##...##',
  'O': '..###..,.#####.,##...##,##...##,##...##,##...##,##...##,.#####.,..###..',
  'P': '#####..,######.,##..###,##...##,##..###,######.,#####..,##.....,##.....',
  'R': '#####..,######.,##..###,##...##,##..###,######.,#####..,##..##.,##...##',
  'S': '.#####.,#######,##...##,##.....,.#####.,.....##,##...##,#######,.#####.',
  'T': '#######,#######,..###..,..###..,..###..,..###..,..###..,..###..,..###..',
  ' ': '.......,.......,.......,.......,.......,.......,.......,.......,.......',
};
const LOGO = Object.create(null);
for (const ch in LOGO_SRC) {
  const rows = LOGO_SRC[ch].split(','), bits = [];
  for (let y = 0; y < LOGO_H; y++) {
    const row = rows[y] || '';
    for (let gx = 0; gx < LOGO_W; gx++) if (row[gx] === '#') bits.push(gx, y);
  }
  LOGO[ch] = bits;
}
/** width of a logo-face string in px at a given scale (1 cell letter gap) */
function logoW(str, s) { return str.length ? (str.length * (LOGO_W + 1) - 1) * s : 0; }

/** draw a LOGO-face string centred on cx, with a k-px ink keyline.
    k is in device px and does NOT scale with s — see keyline() for why. */
function logoText(x, str, cx, y, s, k, col) {
  const ox = (cx - logoW(str, s) / 2) | 0;
  const paint = (dx, dy, c) => {
    let gx = 0;
    for (const ch of String(str).toUpperCase()) {
      const g = LOGO[ch];
      if (g) for (let b = 0; b < g.length; b += 2)
        R(x, c, ox + dx + (gx + g[b]) * s, y + dy + g[b + 1] * s, s, s);
      gx += LOGO_W + 1;
    }
  };
  for (let dy = -k; dy <= k; dy++)
    for (let dx = -k; dx <= k; dx++) if (dx || dy) paint(dx, dy, PAL.ink);
  paint(0, 0, col);
}

/* kraft paper for the taco bag, and what comes out of it when you miss */
const BAG_MID = '#a97c4e', BAG_HI = '#c2955f', BAG_LO = '#8a6238', BAG_FOLD = '#946a42';
const SPILL = ['#7a4a2a', '#c9542f', '#5aa14c', '#e0b055', '#d8b98a'];

const Art = {
  tile: {}, house: [], bldg: [], store: [], civic: [], apts: [], church: [], shed: [], tree: [], prop: {},
  car: [], player: null, cop: null, carShadow: null, ped: [], bag: null, taqueria: null, splat: [], signal: null, loco: null, boxcar: [],
  badge: null, wordmark: null, seal: null, steeple: null,

  build(rng) {
    this.buildTiles(rng);
    this.buildHouses(rng);
    this.buildBldgs(rng);
    this.buildStores(rng);
    this.buildCivics(rng);
    this.buildApts(rng);
    this.buildChurches(rng);
    this.buildSheds(rng);
    this.buildRail(makeRng(777));
    this.buildTrain();
    this.buildNature(rng);
    this.buildProps(rng);
    this.buildVehicles(rng);
    this.buildPeds(rng);
    this.buildMisc(rng);
  },

  /* ---------- ground tiles (4 variants each) -------------- */
  buildTiles(rng) {
    const V = 4;
    const mk = (fn) => { const a = []; for (let i = 0; i < V; i++) { const t = mkCanvas(TS, TS); fn(t.x, rng, i); a.push(t.c); } return a; };

    this.tile.road = mk((x) => {
      R(x, PAL.road, 0, 0, TS, TS);
      for (let i = 0; i < 26; i++) {
        const c = rng() < 0.5 ? PAL.roadLo : PAL.roadHi;
        R(x, c, rng.int(TS), rng.int(TS), 1, 1);
      }
      if (rng.chance(0.3)) { // patch
        const px = rng.int(11), py = rng.int(11);
        R(x, PAL.roadLo, px, py, rng.int(4) + 3, rng.int(3) + 2);
      }
    });

    this.tile.walk = mk((x) => {
      R(x, PAL.walk, 0, 0, TS, TS);
      for (let i = 0; i < 14; i++) R(x, rng() < 0.5 ? PAL.walkHi : PAL.walkLo, rng.int(TS), rng.int(TS), 1, 1);
      R(x, PAL.walkLo, 0, TS - 1, TS, 1);
      R(x, PAL.walkLo, TS - 1, 0, 1, TS);
      R(x, PAL.walkHi, 0, 0, TS, 1);
      if (rng.chance(0.25)) R(x, PAL.walkLo, rng.int(10) + 2, rng.int(10) + 3, rng.int(4) + 2, 1);
    });

    this.tile.grass = mk((x) => {
      R(x, PAL.grass, 0, 0, TS, TS);
      for (let i = 0; i < 30; i++) R(x, rng() < 0.55 ? PAL.grassHi : PAL.grassLo, rng.int(TS), rng.int(TS), 1, 1);
      for (let i = 0; i < 3; i++) { const a = rng.int(TS), b = rng.int(TS - 2); R(x, PAL.grassHi, a, b, 1, 2); }
    });

    this.tile.sea = mk((x, r, v) => {
      R(x, PAL.sea, 0, 0, TS, TS);
      for (let i = 0; i < 5; i++) R(x, PAL.seaLite, rng.int(12), rng.int(TS), rng.int(4) + 2, 1);
      if (v === 0) R(x, PAL.seaFoam, 3, 6, 5, 1);
      if (v === 2) R(x, PAL.seaFoam, 8, 11, 4, 1);
    });

    this.tile.dirt = mk((x) => {
      R(x, PAL.dirt, 0, 0, TS, TS);
      for (let i = 0; i < 22; i++) R(x, rng() < 0.5 ? PAL.dirtLo : PAL.dirt, rng.int(TS), rng.int(TS), 1, 1);
    });

    this.tile.lot = mk((x) => {   // parking lot asphalt, lighter
      R(x, '#565a6d', 0, 0, TS, TS);
      for (let i = 0; i < 18; i++) R(x, rng() < 0.5 ? '#4e5265' : '#606477', rng.int(TS), rng.int(TS), 1, 1);
    });
  },

  /* ---------- houses -------------------------------------- */
  buildHouses(rng) {
    // 8 variants x 4 door directions.  dir: 0=N 1=E 2=S 3=W
    for (let v = 0; v < 8; v++) {
      const roof = ROOFS[v % ROOFS.length];
      const wall = WALLS[v % WALLS.length];
      const seed = 1000 + v * 37;
      const set = [];
      for (let d = 0; d < 4; d++) set.push(this.mkHouse(makeRng(seed), roof, wall, d, v));
      this.house.push(set);
    }
  },

  mkHouse(r, roof, wall, dir, variant) {
    // footprint: 64x48 when facing N/S, 48x64 when facing E/W
    const ns = (dir === 0 || dir === 2);
    const fw = ns ? 64 : 48, fh = ns ? 48 : 64;
    const t = mkCanvas(fw, fh + WALLH);
    const x = t.x;

    /* --- south wall (always visible, fake height) --- */
    const wy = fh;
    R(x, wall[1], 0, wy, fw, WALLH);
    R(x, wall[0], 0, wy, fw, 1);
    R(x, wall[2], 0, wy + WALLH - 1, fw, 1);
    R(x, wall[2], fw - 1, wy, 1, WALLH);
    // windows on the wall
    for (let i = 0; i < (ns ? 3 : 2); i++) {
      const wxp = 7 + i * (ns ? 21 : 24);
      R(x, PAL.glass, wxp, wy + 2, 8, 4);
      R(x, PAL.glassHi, wxp, wy + 2, 8, 1);
      R(x, wall[2], wxp - 1, wy + 1, 10, 1);
    }

    /* --- roof (top face) --- */
    R(x, roof[0], 0, 0, fw, fh);
    // shingle rows
    for (let yy = 2; yy < fh; yy += 3) R(x, roof[1], 0, yy, fw, 1);
    // ridge line down the long axis
    if (ns) { R(x, roof[1], 0, (fh >> 1) - 1, fw, 2); R(x, '#ffffff22', 0, (fh >> 1) - 2, fw, 1); }
    else    { R(x, roof[1], (fw >> 1) - 1, 0, 2, fh); }
    // eaves / bevel: sun from NW
    R(x, roof[1], 0, fh - 1, fw, 1);
    R(x, roof[1], fw - 1, 0, 1, fh);
    x.globalAlpha = 0.22; R(x, '#ffffff', 0, 0, fw, 1); R(x, '#ffffff', 0, 0, 1, fh); x.globalAlpha = 1;
    // outline
    x.strokeStyle = 'rgba(20,14,28,0.55)'; x.lineWidth = 1;
    x.strokeRect(0.5, 0.5, fw - 1, fh + WALLH - 1);

    // chimney
    const cx = 6 + r.int(fw - 18), cy = 5 + r.int(fh - 16);
    R(x, wall[2], cx, cy, 6, 7);
    R(x, wall[1], cx, cy, 6, 2);
    R(x, PAL.ink, cx + 1, cy + 1, 4, 1);

    /* --- entrance marker: awning + stoop on the door side --- */
    const acc = [PAL.red, '#e0e0e0'];
    x.save();
    if (dir === 0) { this._awn(x, (fw >> 1) - 9, 0, 18, 6, false, acc); }
    if (dir === 2) { this._awn(x, (fw >> 1) - 9, fh + 1, 18, 6, false, acc); }
    if (dir === 1) { this._awn(x, fw - 6, (fh >> 1) - 9, 6, 18, true, acc); }
    if (dir === 3) { this._awn(x, 0, (fh >> 1) - 9, 6, 18, true, acc); }
    x.restore();

    // door drawn on the wall itself when the house faces the camera
    if (dir === 2) {
      const dx = (fw >> 1) - 4;
      R(x, PAL.ink, dx - 1, wy + 1, 10, WALLH - 1);
      R(x, PAL.door, dx, wy + 2, 8, WALLH - 2);
      R(x, PAL.doorHi, dx, wy + 2, 8, 1);
      R(x, PAL.amber, dx + 6, wy + 5, 1, 1);
    }
    return { c: t.c, w: fw, h: fh, oy: WALLH, dir };
  },

  _awn(x, px, py, w, h, vert, acc) {
    for (let i = 0; i < (vert ? h : w); i += 4) {
      const col = acc[((i / 4) | 0) % 2];
      if (vert) R(x, col, px, py + i, w, Math.min(4, h - i));
      else      R(x, col, px + i, py, Math.min(4, w - i), h);
    }
    x.strokeStyle = 'rgba(20,14,28,0.7)'; x.lineWidth = 1;
    x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);
  },

  /* ---------- commercial blocks --------------------------- */
  buildBldgs(rng) {
    const sizes = [[128, 96], [96, 128], [128, 128], [96, 96]];
    const tints = ['#8a8f9e', '#9a8878', '#7f8a96', '#94868f', '#86907f'];
    for (let i = 0; i < 8; i++) {
      const [w, h] = sizes[i % sizes.length];
      this.bldg.push(this.mkBldg(makeRng(500 + i * 91), w, h, tints[i % tints.length], i));
    }
  },

  /* ---------- downtown storefront runs -------------------- */
  buildStores(rng) {
    /* 32 tall = 2 tiles: the solid mask lines up with the footprint, and two
       runs leave a proper 48px service alley down the middle of the block
       rather than abutting into one slab. */
    for (let i = 0; i < 5; i++) this.store.push(this.mkStorefront(makeRng(900 + i * 77), 128, 32, i));
  },

  /* A run of storefronts sharing party walls — the downtown street wall. Same
     roof-above-wall layout as mkBldg, but divided into bays so it reads as
     several businesses rather than one warehouse, with an awning band at the
     pavement edge. */
  mkStorefront(r, fw, fh, idx) {
    const t = mkCanvas(fw, fh + BWALLH);
    const x = t.x, wy = fh;
    const BAY = 20 + r.int(8);
    /* brick, limestone and painted stucco side by side — Hays main street */
    const BRICK = ['#a05a48', '#b26b52', '#8f6a58', '#c6b492', '#d6c8a6',
                   '#96806a', '#7f8a96', '#a89070', '#9c6a62', '#c2a884'];
    const AWN = [PAL.red, '#8a5fc0', PAL.roofF, PAL.roofE, PAL.roofB, PAL.roofC];
    let bay = 0;

    for (let bx0 = 0; bx0 < fw; bx0 += BAY, bay++) {
      const bw = Math.min(BAY, fw - bx0);
      const tint = BRICK[(idx + bay) % BRICK.length];
      const dark = shade(tint, -0.34), lite = shade(tint, 0.18);

      /* roof plane per bay, so the party walls read from directly above. Each
         bay gets its own roof tone — a real main street is brick next to
         limestone next to painted stucco, never one continuous slab. */
      const roofTone = shade(tint, -0.12 - r.int(3) * 0.05);
      R(x, roofTone, bx0, 0, bw, fh);
      for (let i = 0; i < 30; i++)
        R(x, r.chance(0.5) ? shade(tint, -0.24) : shade(tint, -0.02), bx0 + r.int(bw), r.int(fh), 1, 1);
      R(x, lite, bx0, 0, bw, 3);                                 // parapet, street side
      R(x, dark, bx0, fh - 3, bw, 3);
      R(x, shade(tint, -0.44), bx0 + bw - 1, 0, 1, fh);          // the party wall

      /* roof kit — an AC unit, a stair bulkhead, a vent stack. Without these a
         downtown block is a flat brown expanse from above. */
      if (bw > 14) {
        const ux = bx0 + 3 + r.int(bw - 12), uy = 5 + r.int(Math.max(1, fh - 13));
        R(x, '#6b7280', ux, uy, 8, 6); R(x, '#8a919e', ux, uy, 8, 1);
        R(x, '#4a505c', ux, uy + 5, 8, 1);
        for (let gv = 2; gv < 6; gv += 2) R(x, '#4a505c', ux + gv, uy + 2, 1, 3);
      }
      if (r.chance(0.5) && bw > 12) {
        const sx = bx0 + 2 + r.int(bw - 10), sy = 4 + r.int(Math.max(1, fh - 12));
        R(x, shade(tint, -0.5), sx, sy, 6, 7);                   // stair bulkhead
        R(x, shade(tint, -0.28), sx, sy, 6, 1);
      }
      if (r.chance(0.6)) {
        const vx = bx0 + 4 + r.int(Math.max(1, bw - 8)), vy = 5 + r.int(Math.max(1, fh - 10));
        R(x, '#3c4250', vx, vy, 3, 3); R(x, '#5d6472', vx, vy, 3, 1);
      }

      /* shopfront: glass, door, awning */
      R(x, dark, bx0, wy, bw, BWALLH);
      R(x, tint, bx0, wy, bw, 1);
      R(x, PAL.glass, bx0 + 2, wy + 4, bw - 9, 6);
      R(x, PAL.glassHi, bx0 + 2, wy + 4, bw - 9, 1);
      if (r.chance(0.45)) R(x, '#f0d68a', bx0 + 3, wy + 5, bw - 11, 4);
      R(x, PAL.door, bx0 + bw - 6, wy + 3, 4, 8);
      R(x, PAL.doorHi, bx0 + bw - 6, wy + 3, 4, 1);
      const aw = AWN[(idx * 2 + bay) % AWN.length];
      R(x, aw, bx0 + 1, wy + BWALLH - 4, bw - 2, 3);
      R(x, shade(aw, -0.32), bx0 + 1, wy + BWALLH - 2, bw - 2, 1);
      R(x, PAL.ink, bx0, wy + BWALLH - 1, bw, 1);
    }

    x.strokeStyle = 'rgba(20,14,28,0.55)'; x.lineWidth = 1;
    x.strokeRect(0.5, 0.5, fw - 1, fh + BWALLH - 1);
    return { c: t.c, w: fw, h: fh, oy: BWALLH };
  },

  mkBldg(r, fw, fh, tint, idx) {
    const t = mkCanvas(fw, fh + BWALLH);
    const x = t.x;
    const wy = fh;
    const dark = shade(tint, -0.34), lite = shade(tint, 0.18);

    // wall
    R(x, dark, 0, wy, fw, BWALLH);
    R(x, tint, 0, wy, fw, 1);
    // window band
    for (let i = 4; i < fw - 6; i += 9) {
      R(x, PAL.glass, i, wy + 3, 6, 6);
      R(x, PAL.glassHi, i, wy + 3, 6, 1);
      if (r.chance(0.25)) R(x, '#f0d68a', i, wy + 4, 6, 4);
    }
    // sign band
    const signCol = [PAL.red, PAL.cyan, PAL.amber, '#8a5fc0'][idx % 4];
    R(x, signCol, 3, wy + BWALLH - 4, fw - 6, 3);
    R(x, PAL.ink, 0, wy + BWALLH - 1, fw, 1);

    // roof
    R(x, shade(tint, -0.12), 0, 0, fw, fh);
    for (let i = 0; i < 90; i++) R(x, r.chance(0.5) ? shade(tint, -0.2) : shade(tint, -0.05), r.int(fw), r.int(fh), 1, 1);
    // parapet
    x.globalAlpha = 0.9;
    R(x, lite, 0, 0, fw, 3); R(x, lite, 0, 0, 3, fh);
    R(x, dark, 0, fh - 3, fw, 3); R(x, dark, fw - 3, 0, 3, fh);
    x.globalAlpha = 1;
    // roof kit: AC units, vents, skylights
    for (let i = 0; i < 4 + r.int(4); i++) {
      const ux = 8 + r.int(fw - 24), uy = 8 + r.int(fh - 24);
      const uw = 10 + r.int(10), uh = 8 + r.int(8);
      R(x, '#6b7280', ux, uy, uw, uh);
      R(x, '#8a919e', ux, uy, uw, 2);
      R(x, '#4a505c', ux, uy + uh - 1, uw, 1);
      for (let g = 2; g < uw - 2; g += 3) R(x, '#4a505c', ux + g, uy + 3, 1, uh - 5);
    }
    for (let i = 0; i < 3; i++) {
      const ux = 6 + r.int(fw - 14), uy = 6 + r.int(fh - 14);
      R(x, '#3c4250', ux, uy, 5, 5); R(x, '#5d6472', ux + 1, uy + 1, 3, 3);
    }
    if (r.chance(0.6)) { // rooftop skylight run
      const ux = 10 + r.int(fw - 40), uy = 10 + r.int(fh - 30);
      for (let i = 0; i < 3; i++) { R(x, PAL.glass, ux + i * 9, uy, 7, 12); R(x, PAL.glassHi, ux + i * 9, uy, 7, 2); }
    }
    x.strokeStyle = 'rgba(20,14,28,0.55)'; x.lineWidth = 1;
    x.strokeRect(0.5, 0.5, fw - 1, fh + BWALLH - 1);
    return { c: t.c, w: fw, h: fh, oy: BWALLH };
  },

  /* ---------- sheds and workshops ------------------------- */
  buildSheds(rng) {
    for (let i = 0; i < 3; i++) this.shed.push(this.mkShed(makeRng(1900 + i * 37), 96, 40, i));
  },

  /* Low corrugated shed with roller doors — the back of a car lot or a metal
     works. Wide, shallow and ribbed, which is the opposite proportion to
     everything else on the map and reads as industrial for that reason. */
  mkShed(r, fw, fh, idx) {
    const t = mkCanvas(fw, fh + BWALLH);
    const x = t.x, wy = fh;
    const metal = ['#7f8a96', '#86907f', '#8a8f9e'][idx % 3];
    const dark = shade(metal, -0.32), lite = shade(metal, 0.2);

    /* corrugated roof: ribs run the long way */
    R(x, shade(metal, -0.12), 0, 0, fw, fh);
    for (let i = 0; i < fh; i += 3) R(x, i % 6 ? shade(metal, -0.2) : shade(metal, -0.02), 0, i, fw, 1);
    R(x, lite, 0, 0, fw, 2);
    R(x, dark, 0, fh - 2, fw, 2);
    R(x, dark, fw - 2, 0, 2, fh);
    for (let i = 0; i < 2; i++) {                      // roof vents
      const ux = 10 + r.int(fw - 30);
      R(x, '#5d6472', ux, 6 + r.int(fh - 18), 12, 5);
      R(x, '#8a919e', ux, 6 + r.int(1) + (fh >> 2), 12, 1);
    }

    /* wall: roller doors and a sign band */
    R(x, dark, 0, wy, fw, BWALLH);
    R(x, metal, 0, wy, fw, 1);
    for (let d = 0; d < 3; d++) {
      const dx0 = 6 + d * 30;
      R(x, shade(metal, -0.44), dx0, wy + 3, 22, BWALLH - 4);
      for (let i = 1; i < BWALLH - 5; i += 2) R(x, shade(metal, -0.28), dx0, wy + 3 + i, 22, 1);
      R(x, lite, dx0, wy + 2, 22, 1);
    }
    R(x, [PAL.red, PAL.amber, PAL.roofF][idx % 3], 2, wy + BWALLH - 4, fw - 4, 3);
    R(x, PAL.ink, 0, wy + BWALLH - 1, fw, 1);

    x.strokeStyle = 'rgba(20,14,28,0.55)'; x.lineWidth = 1;
    x.strokeRect(0.5, 0.5, fw - 1, fh + BWALLH - 1);
    return { c: t.c, w: fw, h: fh, oy: BWALLH };
  },

  /* ---------- churches ------------------------------------ */
  buildChurches(rng) {
    for (let i = 0; i < 2; i++) this.church.push(this.mkChurch(makeRng(1700 + i * 41), 64, 80, i));
    this.steeple = this.mkSteeple(makeRng(1799));
  },

  /* A nave with a pitched roof. The ridge runs north-south, so from directly
     above it reads as two slopes either side of a bright ridge line — the only
     pitched roof at this size in the game, which is most of the recognition. */
  mkChurch(r, fw, fh, idx) {
    const t = mkCanvas(fw, fh + BWALLH);
    const x = t.x, wy = fh;
    const roof = [PAL.roofD, PAL.roofB][idx % 2];
    const stone = ['#c4bca6', '#bdb49e'][idx % 2];
    const dark = shade(stone, -0.32);

    /* Two slopes with a real value split between them, and shingle courses
       across each. Flat fills of nearly the same tone read as one grey slab
       from above and the pitch disappears, which is the whole silhouette. */
    const mid = fw >> 1;
    R(x, shade(roof, -0.40), 0, 0, mid, fh);              // west slope, in shade
    R(x, shade(roof, 0.10), mid, 0, fw - mid, fh);        // east slope, lit
    for (let cy = 2; cy < fh - 3; cy += 4) {
      R(x, shade(roof, -0.50), 0, cy, mid, 1);
      R(x, shade(roof, -0.02), mid, cy, fw - mid, 1);
    }
    for (let i = 0; i < 50; i++) {
      const px = r.int(fw);
      R(x, r.chance(0.5) ? shade(roof, px < mid ? -0.46 : 0.0)
                         : shade(roof, px < mid ? -0.34 : 0.16), px, r.int(fh), 1, 1);
    }
    R(x, shade(roof, 0.30), mid - 1, 0, 1, fh);           // ridge, one pixel
    R(x, shade(roof, -0.52), 0, 0, 1, fh);
    R(x, shade(roof, -0.52), fw - 1, 0, 1, fh);
    R(x, dark, 0, fh - 3, fw, 3);                         // eaves

    /* wall: tall arched windows either side of a double door */
    R(x, shade(stone, -0.22), 0, wy, fw, BWALLH);
    R(x, stone, 0, wy, fw, 1);
    for (let i = 5; i < fw - 8; i += 13) {
      if (Math.abs(i + 3 - mid) < 9) continue;
      R(x, '#4a6a8a', i, wy + 4, 6, 8);
      R(x, '#7fa0c0', i, wy + 4, 6, 1);
      R(x, '#c98a3a', i + 2, wy + 6, 2, 4);               // stained glass
    }
    R(x, PAL.door, mid - 7, wy + 4, 14, BWALLH - 5);
    R(x, PAL.doorHi, mid - 7, wy + 4, 14, 1);
    R(x, dark, mid, wy + 4, 1, BWALLH - 5);
    R(x, PAL.ink, 0, wy + BWALLH - 1, fw, 1);

    x.strokeStyle = 'rgba(20,14,28,0.55)'; x.lineWidth = 1;
    x.strokeRect(0.5, 0.5, fw - 1, fh + BWALLH - 1);
    return { c: t.c, w: fw, h: fh, oy: BWALLH };
  },

  /* The steeple is the whole silhouette: a small footprint carrying a very
     large oy. Nothing else in the game overhangs this far, which is exactly
     what the fake-height trick is for. */
  mkSteeple(r) {
    const FW = 22, FH = 20, OY = 46;
    const t = mkCanvas(FW, FH + OY);
    const x = t.x;
    const stone = '#cfc6ae', dark = shade(stone, -0.34), lite = shade(stone, 0.18);

    /* seen from above: a pyramid roof, four slopes to a point */
    for (let i = 0; i < FH / 2; i++) {
      const k = i / (FH / 2);
      R(x, shade('#6d6558', -0.3 + k * 0.5), i, i, FW - i * 2, FH - i * 2);
    }
    R(x, '#e8e4d8', (FW >> 1) - 1, 1, 2, 7);              // the cross, catching light
    R(x, '#e8e4d8', (FW >> 1) - 3, 3, 6, 2);

    /* the tower face below */
    R(x, shade(stone, -0.24), 0, FH, FW, OY);
    R(x, stone, 0, FH, FW, 2);
    R(x, lite, 0, FH, 2, OY);
    R(x, dark, FW - 2, FH, 2, OY);
    // belfry louvres
    R(x, '#3a3444', 5, FH + 6, 12, 13);
    for (let i = 0; i < 5; i++) R(x, '#6b6478', 5, FH + 7 + i * 3, 12, 1);
    // clock face
    R(x, '#e8e4d8', 7, FH + 24, 8, 8);
    R(x, '#3a3444', 10, FH + 26, 1, 4);
    R(x, '#3a3444', 10, FH + 29, 3, 1);
    R(x, dark, 0, FH + OY - 1, FW, 1);

    x.strokeStyle = 'rgba(20,14,28,0.55)'; x.lineWidth = 1;
    x.strokeRect(0.5, 0.5, FW - 1, FH + OY - 1);
    return { c: t.c, w: FW, h: FH, oy: OY };
  },

  /* ---------- apartment blocks ---------------------------- */
  buildApts(rng) {
    for (let i = 0; i < 4; i++) this.apts.push(this.mkApts(makeRng(1500 + i * 61), 64, 48, i));
  },

  /* Two storeys, which is the whole read: a taller wall band than anything
     else on a residential street, with two rows of windows stacked in it and
     one shared street door. */
  mkApts(r, fw, fh, idx) {
    const AW = 22;                                  // 2-storey wall band
    const t = mkCanvas(fw, fh + AW);
    const x = t.x, wy = fh;
    const brick = ['#9c6a58', '#8a7466', '#a67c62', '#7f6e64'][idx % 4];
    const dark = shade(brick, -0.32), lite = shade(brick, 0.16);

    /* flat roof with kit */
    R(x, shade(brick, -0.16), 0, 0, fw, fh);
    for (let i = 0; i < 40; i++)
      R(x, r.chance(0.5) ? shade(brick, -0.24) : shade(brick, -0.06), r.int(fw), r.int(fh), 1, 1);
    R(x, lite, 0, 0, fw, 3); R(x, dark, 0, fh - 3, fw, 3);
    R(x, lite, 0, 0, 3, fh); R(x, dark, fw - 3, 0, 3, fh);
    for (let i = 0; i < 2; i++) {
      const ux = 6 + r.int(fw - 20), uy = 6 + r.int(fh - 16);
      R(x, '#6b7280', ux, uy, 9, 7); R(x, '#8a919e', ux, uy, 9, 1);
    }
    R(x, shade(brick, -0.42), (fw >> 1) - 5, fh - 14, 10, 10);   // stair head

    /* wall: two window rows and a door */
    R(x, dark, 0, wy, fw, AW);
    R(x, brick, 0, wy, fw, 1);
    for (let row = 0; row < 2; row++) {
      const ry = wy + 3 + row * 9;
      for (let i = 5; i < fw - 8; i += 12) {
        if (row === 1 && Math.abs(i - (fw >> 1)) < 8) continue;   // door sits here
        R(x, PAL.glass, i, ry, 7, 6);
        R(x, PAL.glassHi, i, ry, 7, 1);
        if (r.chance(0.35)) R(x, '#f0d68a', i + 1, ry + 1, 5, 4);
      }
    }
    R(x, PAL.door, (fw >> 1) - 5, wy + AW - 10, 10, 9);
    R(x, PAL.doorHi, (fw >> 1) - 5, wy + AW - 10, 10, 1);
    R(x, lite, (fw >> 1) - 7, wy + AW - 12, 14, 2);              // door hood
    R(x, PAL.ink, 0, wy + AW - 1, fw, 1);

    x.strokeStyle = 'rgba(20,14,28,0.55)'; x.lineWidth = 1;
    x.strokeRect(0.5, 0.5, fw - 1, fh + AW - 1);
    return { c: t.c, w: fw, h: fh, oy: AW };
  },

  /* ---------- civic buildings ----------------------------- */
  buildCivics(rng) {
    for (let i = 0; i < 3; i++) this.civic.push(this.mkCivic(makeRng(1300 + i * 53), 96, 64, i));
  },

  /* Post office, bank, county offices. Hays is a limestone town and PAL.wallLt
     already is one, so these read as civic by massing and symmetry rather than
     by any new colour: one block, set back, a portico on the centreline, and a
     cornice instead of a shop sign. */
  mkCivic(r, fw, fh, idx) {
    const t = mkCanvas(fw, fh + BWALLH + 6);
    const x = t.x, wy = fh, WH2 = BWALLH + 6;
    const stone = ['#cfc6ac', '#c6bda3', '#d4cbb2'][idx % 3];
    const dark = shade(stone, -0.34), lite = shade(stone, 0.16);

    /* roof: flat, with a raised centre lantern on the axis */
    R(x, shade(stone, -0.14), 0, 0, fw, fh);
    for (let i = 0; i < 60; i++)
      R(x, r.chance(0.5) ? shade(stone, -0.2) : shade(stone, -0.06), r.int(fw), r.int(fh), 1, 1);
    R(x, lite, 0, 0, fw, 4); R(x, lite, 0, 0, 4, fh);
    R(x, dark, 0, fh - 4, fw, 4); R(x, dark, fw - 4, 0, 4, fh);
    const lw = 30, lh = 18, lx = (fw - lw) >> 1, ly = (fh - lh) >> 1;
    R(x, shade(stone, -0.05), lx, ly, lw, lh);
    R(x, lite, lx, ly, lw, 2);
    R(x, dark, lx, ly + lh - 2, lw, 2);
    R(x, PAL.glass, lx + 4, ly + 4, lw - 8, lh - 8);
    R(x, PAL.glassHi, lx + 4, ly + 4, lw - 8, 1);

    /* wall: tall windows, symmetrical, with a portico on the centreline */
    R(x, shade(stone, -0.26), 0, wy, fw, WH2);
    R(x, stone, 0, wy, fw, 2);
    const mid = fw >> 1;
    for (let i = 8; i < fw - 10; i += 13) {
      if (Math.abs(i + 4 - mid) < 20) continue;                 // leave the portico clear
      R(x, PAL.glass, i, wy + 4, 7, 10);
      R(x, PAL.glassHi, i, wy + 4, 7, 1);
      R(x, dark, i - 1, wy + 3, 9, 1);
    }
    /* portico: pediment, four columns, doors, steps */
    R(x, stone, mid - 22, wy + 1, 44, 4);
    R(x, lite, mid - 22, wy + 1, 44, 1);
    for (let c = 0; c < 4; c++) {
      const cxp = mid - 18 + c * 11;
      R(x, stone, cxp, wy + 5, 4, WH2 - 8);
      R(x, lite, cxp, wy + 5, 1, WH2 - 8);
      R(x, dark, cxp + 3, wy + 5, 1, WH2 - 8);
    }
    R(x, PAL.door, mid - 7, wy + 8, 14, WH2 - 11);
    R(x, PAL.doorHi, mid - 7, wy + 8, 14, 1);
    R(x, '#b9b09a', mid - 26, wy + WH2 - 3, 52, 3);             // steps
    R(x, '#a49b86', mid - 26, wy + WH2 - 1, 52, 1);
    R(x, PAL.ink, 0, wy + WH2 - 1, fw, 1);

    x.strokeStyle = 'rgba(20,14,28,0.55)'; x.lineWidth = 1;
    x.strokeRect(0.5, 0.5, fw - 1, fh + WH2 - 1);
    return { c: t.c, w: fw, h: fh, oy: WH2 };
  },

  /* ---------- the Union Pacific --------------------------- */
  /* Ballast, rail and crossing planks, baked as 16px tiles so the corridor
     blits with the rest of the ground and costs nothing per frame. */
  buildRail(rng) {
    const gravel = (x, base, lo, hi, n) => {
      R(x, base, 0, 0, TS, TS);
      for (let i = 0; i < n; i++) R(x, rng.chance(0.5) ? hi : lo, rng.int(TS), rng.int(TS), 1, 1);
    };
    /* The corridor runs east-west, so the sleepers run ACROSS it — vertical
       bars. Drawing them as horizontal bands made them read as extra rails,
       which is what four parallel lines looked like the first time. */
    const rails = (x) => {
      for (let i = 1; i < TS; i += 5) {
        R(x, '#4a3f33', i, 2, 3, 12);
        R(x, '#5c4e3f', i, 2, 3, 1);
      }
      R(x, '#7d848f', 0, 4, TS, 2); R(x, '#c8ced8', 0, 4, TS, 1);   // north rail
      R(x, '#7d848f', 0, 10, TS, 2); R(x, '#c8ced8', 0, 10, TS, 1); // south rail
    };

    const ballast = mkCanvas(TS, TS);
    gravel(ballast.x, '#6a6152', '#565042', '#7d7462', 44);
    this.tile.ballast = [ballast.c, ballast.c, ballast.c, ballast.c];

    const rail = mkCanvas(TS, TS);
    gravel(rail.x, '#6a6152', '#565042', '#7d7462', 26);
    rails(rail.x);
    this.tile.rail = [rail.c, rail.c, rail.c, rail.c];

    /* Crossing planks have to read lighter and warmer than the ballast, or the
       crossing disappears into the corridor and there is nothing telling the
       player where they may cross. */
    const plank = mkCanvas(TS, TS), p = plank.x;
    R(p, '#8a7050', 0, 0, TS, TS);
    for (let i = 0; i < 5; i++) R(p, i & 1 ? '#9c8060' : '#7b6244', 0, i * 4, TS, 3);
    for (let i = 0; i < 10; i++) R(p, '#6d573c', rng.int(TS), rng.int(TS), 1, 1);
    R(p, '#7d848f', 0, 4, TS, 2); R(p, '#c8ced8', 0, 4, TS, 1);
    R(p, '#7d848f', 0, 10, TS, 2); R(p, '#c8ced8', 0, 10, TS, 1);
    this.tile.plank = [plank.c, plank.c, plank.c, plank.c];

    /* crossbuck on a mast — the footprint is the mast base, the crossbuck is
       all overhang, which is what oy is for */
    const m = mkCanvas(11, 28), mx = m.x;
    R(mx, '#3c4250', 5, 12, 2, 16);                 // mast
    R(mx, '#2c313c', 5, 26, 3, 2);                  // base
    R(mx, '#e8e4d8', 1, 3, 9, 2);                   // crossbuck
    R(mx, '#e8e4d8', 5, 0, 2, 9);
    R(mx, PAL.red, 1, 8, 3, 3); R(mx, PAL.red, 7, 8, 3, 3);
    this.signal = { c: m.c, w: 3, h: 2, oy: 26 };
  },
  /* ---------- rolling stock ------------------------------- */
  /* Baked facing east and mirrored for west. Every road vehicle gets 16
     rotFrames; the train only ever runs east-west, so 14 of those would be
     unused frames of a 58px sprite. The trucks deliberately stick out past
     the body top and bottom — that overhang is what stops a flat slab from
     reading as a shipping container lying in a field. */
  buildTrain() {
    const H = 16, B0 = 3, BH = 10;          // body rows 3..12, trucks 0..2 and 13..15
    const flip = (src) => {
      const t = mkCanvas(src.width, src.height);
      t.x.imageSmoothingEnabled = false;
      t.x.translate(src.width, 0); t.x.scale(-1, 1);
      t.x.drawImage(src, 0, 0);
      return t.c;
    };
    const trucks = (x, len) => {
      for (const tx of [4, len - 17]) {
        R(x, '#15121c', tx, 0, 13, 3);
        R(x, '#3a3644', tx + 1, 1, 11, 1);
        R(x, '#15121c', tx, H - 3, 13, 3);
        R(x, '#3a3644', tx + 1, H - 2, 11, 1);
      }
    };

    /* Locomotive: cab at the rear, long hood forward, Armour Yellow. The read
       has to survive at 1x, where the whole unit is 64px: a WIDE dark cab and
       a NARROW dark hood sitting on a yellow body. The first cut gave the hood
       8 of the body's 10 rows, which left the yellow as a hairline frame and
       turned the loco into a pale slab with stripes — a flatcar with a load,
       not a locomotive. Two rows of yellow either side of the hood is what
       carries the identity. */
    const L = 64, lo = mkCanvas(L, H), lx = lo.x;
    trucks(lx, L);
    R(lx, '#15121c', 0, B0 - 1, L, BH + 2);
    R(lx, '#d8a838', 1, B0, L - 2, BH);                  // Armour Yellow
    R(lx, '#eec457', 1, B0, L - 2, 1);
    R(lx, '#a97f22', 1, B0 + BH - 1, L - 2, 1);
    R(lx, '#2f333d', 2, B0, 14, BH);                     // cab, full body height
    R(lx, '#3d434f', 2, B0, 14, 1);
    R(lx, PAL.glass, 4, B0 + 2, 5, BH - 4);
    R(lx, PAL.glassHi, 4, B0 + 2, 5, 1);
    R(lx, '#5c616b', 19, B0 + 2, 33, BH - 4);            // long hood, narrow
    R(lx, '#7a808c', 19, B0 + 2, 33, 1);
    R(lx, '#3e434c', 19, B0 + BH - 3, 33, 1);
    for (let i = 0; i < 6; i++) R(lx, '#3e434c', 23 + i * 5, B0 + 3, 2, BH - 6);
    R(lx, '#8d919c', 46, B0 + 1, 6, BH - 2);             // radiator, at the hood front
    R(lx, '#6a6e78', 47, B0 + 2, 4, BH - 4);
    R(lx, '#2f333d', L - 6, B0 + 1, 5, BH - 2);          // pilot
    R(lx, '#fff2c0', L - 4, B0 + 4, 3, 2);               // headlight, inside the silhouette
    this.loco = [flip(lo.c), lo.c];                      // [0] west-facing, [1] east

    /* three liveries, so a consist does not read as one tile repeated */
    this.boxcar = [];
    for (const [body, dark] of [['#8c4030', '#652a20'], ['#767a86', '#565a66'], ['#6b563c', '#4c3d29']]) {
      const W = 48, bc = mkCanvas(W, H), bx = bc.x;
      trucks(bx, W);
      R(bx, '#15121c', 0, B0 - 1, W, BH + 2);
      R(bx, body, 1, B0, W - 2, BH);
      R(bx, shade(body, 0.18), 1, B0, W - 2, 1);
      R(bx, dark, 1, B0 + BH - 1, W - 2, 1);
      R(bx, dark, 1, B0 + 4, W - 2, 2);                  // door track along the side
      R(bx, shade(body, -0.32), 20, B0, 9, BH);          // sliding door
      R(bx, shade(body, 0.10), 20, B0, 1, BH);
      R(bx, shade(body, 0.10), 28, B0, 1, BH);
      for (let i = 0; i < 3; i++) R(bx, dark, 6 + i * 4, B0 + 1, 1, BH - 2);
      for (let i = 0; i < 3; i++) R(bx, dark, 33 + i * 4, B0 + 1, 1, BH - 2);
      this.boxcar.push([flip(bc.c), bc.c]);
    }
  },

  /* ---------- trees / nature ------------------------------ */
  buildNature(rng) {
    for (let i = 0; i < 5; i++) {
      const r = makeRng(70 + i * 13);
      const s = 18 + r.int(8);
      const t = mkCanvas(s, s + 6);
      const x = t.x, cx = s / 2, cy = s / 2;
      R(x, PAL.trunk, cx - 2, s - 4, 4, 9);
      const rad = s / 2 - 1;
      for (let a = 0; a < 260; a++) {
        const ang = rng() * TAU, d = Math.sqrt(rng()) * rad;
        const px = cx + Math.cos(ang) * d, py = cy + Math.sin(ang) * d * 0.95;
        const c = d > rad * 0.72 ? PAL.treeLo : (px < cx && py < cy ? PAL.treeHi : PAL.tree);
        R(x, c, px, py, 2, 2);
      }
      for (let k = 0; k < 18; k++) R(x, PAL.treeHi, cx - rad * 0.6 + rng() * rad * 0.6, cy - rad * 0.6 + rng() * rad * 0.6, 1, 1);
      this.tree.push({ c: t.c, w: s, h: s, oy: 6 });
    }
  },

  /* ---------- street props -------------------------------- */
  buildProps(rng) {
    const P = this.prop;

    let t = mkCanvas(7, 14); // mailbox
    R(t.x, '#5a6070', 3, 6, 2, 8);
    R(t.x, '#c9cede', 1, 3, 6, 5);
    R(t.x, '#8b90a0', 1, 3, 6, 1);
    R(t.x, PAL.red, 6, 4, 1, 3);
    P.mailbox = { c: t.c, w: 7, h: 5, oy: 9 };

    t = mkCanvas(7, 12); // hydrant
    R(t.x, PAL.red, 2, 4, 3, 8);
    R(t.x, '#ff7a6a', 2, 4, 3, 1);
    R(t.x, PAL.red, 1, 6, 5, 2);
    R(t.x, '#8a1f12', 2, 11, 3, 1);
    P.hydrant = { c: t.c, w: 7, h: 4, oy: 8 };

    t = mkCanvas(6, 22); // street lamp
    R(t.x, '#4a505c', 2, 6, 2, 16);
    R(t.x, '#5d6472', 1, 4, 5, 3);
    R(t.x, PAL.amber, 2, 5, 3, 1);
    P.lamp = { c: t.c, w: 6, h: 4, oy: 18 };

    t = mkCanvas(18, 12); // bench
    R(t.x, '#5b4029', 1, 4, 16, 5);
    R(t.x, '#7a5637', 1, 4, 16, 1);
    R(t.x, '#3c4250', 2, 9, 2, 3); R(t.x, '#3c4250', 14, 9, 2, 3);
    P.bench = { c: t.c, w: 18, h: 5, oy: 7 };

    t = mkCanvas(16, 14); // bush
    for (let i = 0; i < 90; i++) {
      const a = rng() * TAU, d = Math.sqrt(rng()) * 7;
      R(t.x, rng() < 0.4 ? PAL.treeHi : PAL.tree, 8 + Math.cos(a) * d, 7 + Math.sin(a) * d * 0.8, 2, 2);
    }
    P.bush = { c: t.c, w: 16, h: 12, oy: 2 };

    t = mkCanvas(10, 16); // trash can
    R(t.x, '#4a505c', 2, 4, 6, 11);
    R(t.x, '#5d6472', 2, 4, 6, 1);
    R(t.x, '#3c4250', 1, 3, 8, 2);
    P.trash = { c: t.c, w: 10, h: 6, oy: 10 };

    t = mkCanvas(9, 14); // cone
    R(t.x, PAL.amber, 3, 4, 3, 8);
    R(t.x, '#ffffff', 3, 7, 3, 2);
    R(t.x, '#e07a1f', 1, 11, 7, 3);
    P.cone = { c: t.c, w: 9, h: 5, oy: 9 };
  },

  /* ---------- vehicles ------------------------------------ */
  buildVehicles(rng) {
    for (const [a, b] of CAR_COLORS) this.car.push(rotFrames(this.mkCar(a, b, 'sedan'), ROT));
    this.player = rotFrames(this.mkCar(PAL.red, '#a52a18', 'hero'), ROT);
    this.cop    = rotFrames(this.mkCar(PAL.cop, '#141c30', 'cop'), ROT);
    /* One shadow for every car, baked through rotFrames like the cars
       themselves, because a shadow that does not turn with its car is a
       rectangle the player watches slide around underneath it. It used to be
       a bare `fillRect(sx - 8, sy - 3, 17, 11)` at three separate draw sites,
       so it stayed axis-aligned at every heading: at 45 degrees roughly a
       quarter of it lay outside the car while the nose and tail cast none.
       Same 18x11 footprint as mkCar, so it is the car's own silhouette. */
    const t = mkCanvas(18, 11);
    R(t.x, PAL.shadow, 0, 0, 18, 11);
    this.carShadow = rotFrames(t.c, ROT);
  },

  mkCar(body, dark, kind) {
    const W = 18, H = 11;
    const t = mkCanvas(W, H), x = t.x;
    const lite = shade(body, 0.22);

    // wheels
    R(x, '#15121c', 3, 0, 4, 2); R(x, '#15121c', 12, 0, 4, 2);
    R(x, '#15121c', 3, 9, 4, 2); R(x, '#15121c', 12, 9, 4, 2);
    // silhouette
    R(x, '#15121c', 1, 1, 16, 9);
    // body
    R(x, body, 1, 2, 16, 7);
    R(x, body, 2, 1, 14, 9);
    R(x, lite, 2, 2, 14, 1);
    R(x, dark, 2, 8, 14, 1);
    // nose taper
    R(x, '#15121c', 16, 2, 1, 1); R(x, '#15121c', 16, 8, 1, 1);
    R(x, '#15121c', 1, 2, 1, 1);  R(x, '#15121c', 1, 8, 1, 1);
    // glass
    R(x, PAL.glass, 10, 3, 4, 5);
    R(x, PAL.glassHi, 10, 3, 4, 1);
    R(x, shade(PAL.glass, -0.2), 4, 3, 3, 5);
    // roof
    R(x, lite, 7, 3, 3, 5);
    R(x, dark, 7, 7, 3, 1);
    // lights
    R(x, '#fff2c0', 16, 3, 1, 2); R(x, '#fff2c0', 16, 6, 1, 2);
    R(x, '#ff5a4a', 2, 3, 1, 2);  R(x, '#ff5a4a', 2, 6, 1, 2);

    if (kind === 'hero') {           // rooftop delivery sign
      R(x, '#15121c', 6, 2, 6, 7);
      R(x, '#f2e9d0', 7, 3, 4, 5);
      R(x, PAL.red, 7, 3, 4, 2);
      R(x, PAL.amber, 8, 6, 2, 1);
    }
    if (kind === 'cop') {            // light bar (colour flashed at draw time)
      R(x, '#15121c', 7, 2, 4, 7);
      R(x, '#d0d4e0', 8, 3, 2, 5);
      R(x, '#ffffff', 2, 4, 3, 3);   // door decal
    }
    return t.c;
  },

  /* ---------- pedestrians --------------------------------- */
  buildPeds(rng) {
    const SHIRTS = ['#e05a5a', '#4a9ae0', '#e3c04a', '#63b05a', '#d8d8e0', '#b06fd0', '#e08a3c', '#4fc0b0'];
    const PANTS  = ['#3a4560', '#4a4a58', '#5b4029', '#2f3a4a'];
    const SKIN   = ['#e8b98a', '#c98d5e', '#8a5a3a', '#f0d0aa', '#6b4530'];
    for (let i = 0; i < 8; i++) {
      const r = makeRng(300 + i * 29);
      const sh = SHIRTS[i], pa = r.pick(PANTS), sk = r.pick(SKIN), hair = r.pick(['#2a2018', '#5b4029', '#8a6b3a', '#c9b68a', '#3a3a3a']);
      const dirs = [];
      for (let d = 0; d < 4; d++) {         // 0=N 1=E 2=S 3=W
        const frames = [];
        for (let f = 0; f < 2; f++) {
          const t = mkCanvas(9, 15), x = t.x;
          // legs
          const l1 = f === 0 ? 0 : 1, l2 = f === 0 ? 1 : 0;
          R(x, pa, 3, 10 + l1, 2, 4 - l1);
          R(x, pa, 5, 10 + l2, 2, 4 - l2);
          R(x, '#2a2430', 3, 13, 2, 1); R(x, '#2a2430', 5, 13, 2, 1);
          // body
          R(x, sh, 2, 5, 6, 6);
          R(x, shade(sh, 0.2), 2, 5, 6, 1);
          R(x, shade(sh, -0.25), 2, 10, 6, 1);
          // arms
          R(x, sk, 1, 6, 1, 4); R(x, sk, 8, 6, 1, 4);
          // head
          R(x, sk, 3, 1, 4, 5);
          if (d === 0) R(x, hair, 3, 1, 4, 4);
          else { R(x, hair, 3, 1, 4, 2); if (d === 1) R(x, hair, 3, 1, 1, 4); if (d === 3) R(x, hair, 6, 1, 1, 4); }
          if (d === 2) { R(x, '#2a2430', 4, 3, 1, 1); R(x, '#2a2430', 6, 3, 1, 1); }
          R(x, '#15121c', 3, 0, 4, 1);
          frames.push(t.c);
        }
        dirs.push(frames);
      }
      this.ped.push(dirs);
    }
  },

  /* ---------- taco bag, splats, taqueria, badge ----------- */
  buildMisc(rng) {
    // brown paper bag of tacos, 4 spin frames
    this.bag = [];
    for (let f = 0; f < 4; f++) {
      const t = mkCanvas(13, 13), x = t.x;
      x.translate(6.5, 6.5); x.rotate(f / 4 * (PI / 2));
      R(x, '#15121c', -5, -5, 10, 10);          // silhouette
      R(x, BAG_MID, -4, -4, 8, 8);              // kraft paper
      R(x, BAG_HI,  -4, -4, 8, 1);              // lit top lip
      R(x, BAG_LO,  -4, -2, 8, 1);              // crimp shadow under the fold
      R(x, BAG_LO,  -4,  3, 8, 1);              // base shadow
      for (let i = -4; i < 4; i += 2) R(x, BAG_FOLD, i, -4, 1, 2);   // folded serrations
      R(x, PAL.jade, -2, 0, 4, 3);              // shop sticker
      R(x, PAL.gold, -1, 1, 2, 1);
      this.bag.push(t.c);
    }
    // spilled-taco splats
    for (let i = 0; i < 4; i++) {
      const r = makeRng(900 + i * 17);
      const t = mkCanvas(20, 18), x = t.x;
      for (let k = 0; k < 60; k++) {
        const a = r() * TAU, d = Math.sqrt(r()) * 8;
        R(x, SPILL[r.int(SPILL.length)], 10 + Math.cos(a) * d, 9 + Math.sin(a) * d * 0.8, 2, 2);
      }
      for (let k = 0; k < 8; k++) R(x, '#c9542f', r.int(20), r.int(18), 1, 1);
      this.splat.push(t.c);
    }
    this.taqueria = this.mkTaqueria(makeRng(4242));
    this.badge = this.mkBadge();
    this.seal = this.mkSeal();
    // same display face as the badge, at scale 2 => 206px wide
    this.wordmark = this.mkLogoText('CARNAGE ASADA', 2, PAL.gold, 2);
  },

  /* ---------- the seal, for the attract card --------------
     Rasterised per pixel rather than assembled from rects: the scalloped
     starburst and the lettering ring are both functions of angle, which a
     span-based build cannot express cleanly. At 100px the ring lettering is
     far below legibility, so it is drawn as tick marks — the eye reads
     "text around a seal" from the rhythm alone, which is the honest way to
     render sub-pixel type. */
  mkSeal() {
    const S = 100, c = S / 2, RAYS = 30;
    const t = mkCanvas(S, S), x = t.x;
    const NAVY = '#151a3e', NAVY2 = '#242d60', BONE = '#e6e2d2', STRIPE = '#c0342c';

    for (let py = 0; py < S; py++) {
      for (let px = 0; px < S; px++) {
        const dx = px - c + 0.5, dy = py - c + 0.5;
        const d = hyp(dx, dy);
        if (d > 48) continue;
        const a = Math.atan2(dy, dx);
        const spike = 40 + 8 * Math.sqrt(Math.max(0, Math.cos(a * RAYS)));
        let col = null;
        if (d > 37 && d <= spike)      col = d > 40 ? PAL.goldLo : PAL.gold;   // starburst
        else if (d > 34 && d <= 37)    col = NAVY;                             // keyline
        else if (d > 25 && d <= 34) {                                          // lettering ring
          col = NAVY2;
          if (d > 27 && d < 32 && Math.cos(a * 44) > 0.45) col = BONE;
        } else if (d <= 25)            col = NAVY;
        if (col) R(x, col, px, py, 1, 1);
      }
    }

    /* laurel arcs flanking the emblem */
    for (let i = 0; i < 40; i++) {
      const a = PI / 2 + (i / 39 - 0.5) * 2.3;
      for (const side of [-1, 1]) {
        const r = 21 + (i % 2);
        R(x, i % 3 ? PAL.gold : PAL.goldLo,
          c + Math.cos(a) * r * side + (side < 0 ? 0 : 0), c + Math.sin(a) * r, 1, 2);
      }
    }

    /* central shield: navy chief over vertical stripes, tapering to a point */
    const SW = 16, SH = 21, top = c - 11;
    for (let i = 0; i < SH; i++) {
      const k = i < 13 ? 1 : 1 - Math.pow((i - 13) / (SH - 13), 1.5);
      const hw = Math.max(1, Math.round((SW / 2) * k));
      R(x, PAL.ink, c - hw - 1, top + i, hw * 2 + 2, 1);
      if (i < 6) {
        R(x, '#2c3a86', c - hw, top + i, hw * 2, 1);                  // chief
        if (i === 2 || i === 3) for (let s = -1; s <= 1; s++) R(x, PAL.gold, c + s * 5, top + i, 1, 1);
      } else {
        for (let sx = -hw; sx < hw; sx++)
          R(x, ((sx + 16) >> 1) % 2 ? BONE : STRIPE, c + sx, top + i, 1, 1);
      }
    }

    /* scroll under the emblem */
    R(x, PAL.ink, c - 15, c + 13, 30, 5);
    R(x, PAL.gold, c - 14, c + 14, 28, 3);
    for (let i = -12; i < 12; i += 3) R(x, PAL.goldLo, c + i, c + 15, 1, 1);
    return t.c;
  },

  /* ---------- title wordmark ------------------------------
     Baked once at boot so the 9-pass keyline is not redrawn every frame. */
  mkLogoText(str, s, col, k) {
    const w = logoW(str, s) + k * 2, h = LOGO_H * s + k * 2;
    const t = mkCanvas(w, h);
    logoText(t.x, str, w / 2, k, s, k, col);
    return { c: t.c, w, h, inset: k };
  },

  /* ---------- the shop badge, for the title screen --------
     A 16-bit reading of the real sticker: white die-cut rim, black keyline,
     jade face, chunky gold wordmark. Plotted with fillRect spans rather than
     arc() so the circle stays hard-edged like everything else on screen. */
  mkBadge() {
    const S = 108, c = S / 2;
    const t = mkCanvas(S, S), x = t.x;

    // Concentric rings, outside in: die-cut rim, keyline, gap, keyline, face.
    // The face is kept at r44 so the 92px wordmark overspills it by only ~2px
    // a side. Shrinking the face in proportion with the badge pushed that to
    // 5px, and the letters' keyline then ate the white rings — the badge read
    // as damaged rather than as letters deliberately breaking the circle.
    disc(x, c, c, 53, '#ffffff');
    disc(x, c, c, 51, PAL.ink);
    disc(x, c, c, 49, '#ffffff');
    disc(x, c, c, 46, PAL.ink);
    disc(x, c, c, 44, PAL.jade);
    // soft top-left sheen, the way the printed sticker catches light. Kept
    // small and faint — any more and the face stops reading as the logo's jade
    x.globalAlpha = 0.09;
    disc(x, c - 15, c - 17, 19, '#ffffff');
    x.globalAlpha = 1;

    // Wordmark in the shop's own display face at scale 3 — 93px, so it just
    // overspills the 88px face, the way the real sticker breaks its circle.
    logoText(x, 'TACO', c, 19, 3, 2, PAL.gold);
    logoText(x, 'SHOP', c, 51, 3, 2, PAL.gold);
    // EST. 1970 stays on the 5x7 game font: it is small subtext, and the real
    // sticker sets it in a different (script) face anyway
    keyline(x, 'EST. 1970', c, 85, 1, 1, PAL.gold);
    return t.c;
  },

  mkTaqueria(r) {
    const fw = 128, fh = 96, wallh = 16;
    const t = mkCanvas(fw, fh + wallh), x = t.x;
    const wy = fh;
    // wall
    R(x, '#c9b89a', 0, wy, fw, wallh);
    R(x, '#e0d2b4', 0, wy, fw, 1);
    R(x, '#8e7f66', 0, wy + wallh - 1, fw, 1);
    // big window front
    R(x, PAL.glass, 8, wy + 3, 46, 9);
    R(x, PAL.glassHi, 8, wy + 3, 46, 2);
    R(x, '#f0d68a', 10, wy + 5, 42, 6);
    R(x, '#15121c', 74, wy + 2, 16, wallh - 2);
    R(x, PAL.door, 75, wy + 3, 14, wallh - 4);
    R(x, PAL.amber, 86, wy + 8, 1, 2);
    // striped awning across the front
    for (let i = 0; i < fw; i += 8) R(x, ((i / 8) | 0) % 2 ? '#f2e9d0' : PAL.jade, i, wy - 1, 8, 4);
    R(x, '#15121c', 0, wy + 3, fw, 1);

    // roof
    R(x, '#9a4030', 0, 0, fw, fh);
    for (let yy = 3; yy < fh; yy += 4) R(x, '#7d3324', 0, yy, fw, 1);
    x.globalAlpha = 0.2; R(x, '#ffffff', 0, 0, fw, 2); R(x, '#ffffff', 0, 0, 2, fh); x.globalAlpha = 1;
    R(x, '#6b2b1e', 0, fh - 2, fw, 2); R(x, '#6b2b1e', fw - 2, 0, 2, fh);

    /* Rooftop sign board, readable from above — the badge, seen from a
       helicopter. Set in the LOGO display face, the same lockup the title
       screen uses, so the shop on the map and the shop on the title read as
       one brand rather than two.

       The board had to grow to take it. LOGO is a 7x9 grid against the game
       font's 5x7, so two lines at scale 2 need 40 rows where the old jade
       panel had 28 — and scale is not free to fudge, because cells are drawn
       as square s*s rects and a fractional one lands on half-pixels. The
       vents move down to make room. */
    R(x, '#15121c', 14, 14, 100, 50);
    R(x, PAL.jade, 16, 16, 96, 46);
    R(x, '#ffffff', 16, 16, 96, 1);
    R(x, '#ffffff', 16, 61, 96, 1);
    /* Four rows of jade between the lines. Butted straight together the two
       keylines touch and the whole lockup fuses into one slab — the O of TACO
       runs into the H of SHOP. */
    logoText(x, 'TACO', 64, 18, 2, 1, PAL.gold);   // rows 17-36 with its keyline
    logoText(x, 'SHOP', 64, 42, 2, 1, PAL.gold);   // rows 41-60
    // vents
    for (let i = 0; i < 3; i++) { R(x, '#6b7280', 12 + i * 12, 70, 8, 8); R(x, '#8a919e', 12 + i * 12, 70, 8, 2); }
    R(x, '#6b7280', 96, 68, 18, 14); R(x, '#8a919e', 96, 68, 18, 3);
    x.strokeStyle = 'rgba(20,14,28,0.6)'; x.lineWidth = 1;
    x.strokeRect(0.5, 0.5, fw - 1, fh + wallh - 1);
    return { c: t.c, w: fw, h: fh, oy: wallh };
  },
};

/* ---- helpers ---------------------------------------------- */
/** centred text with a black keyline of `k` px, whatever the glyph scale.
    textOut() ties outline width to scale, which turns to mush past about 2x. */
function keyline(x, str, cx, cy, s, k, col) {
  const ox = (cx - textW(str, s) / 2) | 0;
  for (let dy = -k; dy <= k; dy++)
    for (let dx = -k; dx <= k; dx++)
      if (dx || dy) drawRun(x, str, ox + dx, cy + dy, PAL.ink, s);
  drawRun(x, str, ox, cy, col, s);
}

/** hard-edged filled circle: one fillRect span per scanline, no antialiasing */
function disc(x, cx, cy, r, col) {
  x.fillStyle = col;
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(Math.max(0, r2 - dy * dy)));
    if (w > 0) x.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2, 1);
  }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
}

function rotFrames(src, n) {
  let d = Math.ceil(hyp(src.width, src.height)) + 2;
  if (d & 1) d++;
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = mkCanvas(d, d);
    t.x.imageSmoothingEnabled = false;
    t.x.translate(d / 2, d / 2);
    t.x.rotate(i / n * TAU);
    t.x.drawImage(src, -src.width / 2, -src.height / 2);
    out.push(t.c);
  }
  out.size = d;
  return out;
}

function drawRot(x, frames, px, py, ang) {
  let i = Math.round(ang / TAU * ROT) % ROT; if (i < 0) i += ROT;
  const d = frames.size;
  x.drawImage(frames[i], Math.round(px - d / 2), Math.round(py - d / 2));
}
