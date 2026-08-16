/* ============================================================
   HOT SLICE  --  core constants, math, rng, input
   ============================================================ */
'use strict';

/* ---- virtual screen -------------------------------------- */
const VW = 384, VH = 216;

/* ---- world grid ------------------------------------------ */
const TS      = 16;   // tile size in px
const BORDER  = 2;    // tiles of sea wall / water around the grid
const BLOCKS  = 8;    // city blocks per axis
const SPAN    = 12;   // tiles per block pitch (2 road + 10 interior)
const GW      = BORDER * 2 + BLOCKS * SPAN + 2;   // 102 tiles
const GH      = GW;
const WW      = GW * TS;                          // 1632 px
const WH      = GH * TS;

/* ---- tile classes ---------------------------------------- */
const T_SEA = 0, T_ROAD = 1, T_INTER = 2, T_WALK = 3, T_LOT = 4;

/* ---- surfaces (drive feel) ------------------------------- */
const S_ROAD = 0, S_WALK = 1, S_GRASS = 2, S_SEA = 3;

/* ---- palette --------------------------------------------- */
const PAL = {
  void:    '#1b1425',
  sea:     '#1d3f5e',
  seaLite: '#2a5c82',
  seaFoam: '#7fb6cf',
  wall:    '#5a5266',
  wallLo:  '#3c3648',

  road:    '#4b4f63',
  roadLo:  '#43475a',
  roadHi:  '#565b70',
  lineY:   '#e8b93c',
  lineW:   '#c9cede',

  walk:    '#8b8f9f',
  walkHi:  '#9ba0b0',
  walkLo:  '#75798a',
  curb:    '#6a6e80',

  grass:   '#4a8b3f',
  grassHi: '#5aa14c',
  grassLo: '#3d7534',
  dirt:    '#a8815c',
  dirtLo:  '#8a6849',

  roofA:   '#c05138', roofAlo: '#943d2b',
  roofB:   '#4a6fa5', roofBlo: '#385580',
  roofC:   '#5d8a4f', roofClo: '#466b3b',
  roofD:   '#7a6f86', roofDlo: '#5d5468',
  roofE:   '#b8933f', roofElo: '#8e7130',
  roofF:   '#3f8a8a', roofFlo: '#2f6a6a',

  wallLt:  '#e0d2b4', wallMd: '#c4b394', wallDk: '#8e7f66',
  glass:   '#3a4a63', glassHi: '#5b7194',
  door:    '#6b4630', doorHi: '#8a5c3e',
  porch:   '#d8c69c',

  tree:    '#2f6b39', treeHi: '#3e8a47', treeLo: '#204a28',
  trunk:   '#5b4029',

  red:     '#e8452c',
  amber:   '#ffb01f',
  cyan:    '#3fb8b0',
  cyanLo:  '#2a8079',
  bone:    '#f2e9d0',
  boneDim: '#b6ab92',
  ink:     '#1b1425',
  ink2:    '#2a2136',
  good:    '#7ddc5a',
  bad:     '#ff5a5a',
  cop:     '#243050',
  siren1:  '#ff3838',
  siren2:  '#3d7dff',
  shadow:  'rgba(12,8,20,0.30)',
};

const CAR_COLORS = [
  ['#d94f4f', '#9e3535'], ['#4a8fd0', '#316396'], ['#e3c04a', '#a88a2e'],
  ['#63b05a', '#437a3c'], ['#d8d8e0', '#a2a2b0'], ['#8a5fc0', '#634289'],
  ['#e08a3c', '#a35f26'], ['#3f3f4e', '#2a2a35'],
];

/* ---- math ------------------------------------------------ */
const PI = Math.PI, TAU = PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp  = (a, b, t) => a + (b - a) * t;
const sign  = Math.sign;
const hyp   = Math.hypot;
function angDiff(a, b) { let d = (b - a) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; }
function approach(v, t, s) { return v < t ? Math.min(v + s, t) : Math.max(v - s, t); }

/* ---- deterministic rng ----------------------------------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function makeRng(seed) {
  const r = mulberry32(seed);
  r.int   = (n) => (r() * n) | 0;
  r.range = (a, b) => a + r() * (b - a);
  r.pick  = (arr) => arr[(r() * arr.length) | 0];
  r.chance = (p) => r() < p;
  return r;
}

/* ---- tile classification --------------------------------- */
const SPANEND = BLOCKS * SPAN + 1;           // 97
function classify(tx, ty) {
  const ax = tx - BORDER, ay = ty - BORDER;
  if (ax < 0 || ay < 0 || ax > SPANEND || ay > SPANEND) return T_SEA;
  const rx = (ax % SPAN) < 2, ry = (ay % SPAN) < 2;
  if (rx && ry) return T_INTER;
  if (rx || ry) return T_ROAD;
  const lx = ax % SPAN - 2, ly = ay % SPAN - 2;   // 0..9
  if (lx === 0 || lx === 9 || ly === 0 || ly === 9) return T_WALK;
  return T_LOT;
}

/* ---- canvas helpers -------------------------------------- */
function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return { c, x };
}
function R(x, col, a, b, w, h) { x.fillStyle = col; x.fillRect(a | 0, b | 0, w | 0, h | 0); }

/* ---- input ----------------------------------------------- */
const Input = {
  down: Object.create(null),
  hit:  Object.create(null),
  mx: VW / 2, my: VH / 2,      // virtual-screen coords
  mdown: false, mhit: false,
  hasMouse: false,
  anyKey: false,

  init(canvas, getScale) {
    // track e.code (physical key, so WASD still works on AZERTY) and also
    // e.key, so Enter/Space register whatever the layout or IME reports
    const codes = (e) => (e.key && e.key.length > 1 && e.key !== e.code) ? [e.code, e.key] : [e.code];
    addEventListener('keydown', (e) => {
      for (const k of codes(e)) { if (!this.down[k]) this.hit[k] = true; this.down[k] = true; }
      this.anyKey = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => { for (const k of codes(e)) this.down[k] = false; });
    addEventListener('blur', () => { this.down = Object.create(null); this.mdown = false; });

    // derive the scale from the element itself so aiming stays exact
    // whatever rounding the fit logic applied
    const toVirtual = (e) => {
      const r = canvas.getBoundingClientRect();
      const s = r.width ? r.width / VW : (getScale() || 1);
      this.mx = clamp((e.clientX - r.left) / s, 0, VW);
      this.my = clamp((e.clientY - r.top) / s, 0, VH);
    };
    canvas.addEventListener('mousemove', (e) => { toVirtual(e); this.hasMouse = true; });
    canvas.addEventListener('mousedown', (e) => {
      toVirtual(e); if (!this.mdown) this.mhit = true;
      this.mdown = true; this.hasMouse = true; e.preventDefault();
    });
    addEventListener('mouseup', () => { this.mdown = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  },

  k(...codes) { return codes.some((c) => this.down[c]); },
  p(...codes) { return codes.some((c) => this.hit[c]); },
  endFrame() { this.hit = Object.create(null); this.mhit = false; this.anyKey = false; },
};
