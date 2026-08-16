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
  tile: {}, house: [], bldg: [], tree: [], prop: {},
  car: [], player: null, cop: null, ped: [], bag: null, taqueria: null, splat: [],
  badge: null, wordmark: null, seal: null,

  build(rng) {
    this.buildTiles(rng);
    this.buildHouses(rng);
    this.buildBldgs(rng);
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

    // rooftop sign board, readable from above — the badge, seen from a helicopter
    R(x, '#15121c', 14, 22, 100, 34);
    R(x, PAL.jade, 16, 24, 96, 30);
    R(x, '#ffffff', 16, 24, 96, 1);
    R(x, '#ffffff', 16, 53, 96, 1);
    text(x, 'TACO', 64, 28, PAL.gold, 2, 1);
    text(x, 'SHOP', 64, 42, PAL.gold, 2, 1);
    // vents
    for (let i = 0; i < 3; i++) { R(x, '#6b7280', 12 + i * 12, 68, 8, 8); R(x, '#8a919e', 12 + i * 12, 68, 8, 2); }
    R(x, '#6b7280', 96, 64, 18, 14); R(x, '#8a919e', 96, 64, 18, 3);
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
