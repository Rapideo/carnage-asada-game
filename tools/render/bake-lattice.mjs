/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   bake-lattice.mjs -- a contact sheet of ingredients in, twelve wells out.

   Same reduction as bake-face.mjs (reduce.mjs, shared so they cannot drift),
   and the same round-trip guard against the shipped decoder. What differs is
   that the crops are FOUND rather than given: an ingredient sheet is a regular
   grid, and hand-measuring twelve rects is twelve chances to be a pixel out.

       node tools/render/bake-lattice.mjs <sheet.png> [--inset N] [--tray]

     --inset N   pixels to pull in from each detected tray edge, as a
                 percentage of the tray's short side. Default 12, which lands
                 inside a drawn tray rim so the code's own pan is what you see.
     --tray      keep the whole tray and bake at cell size (46x28) instead of
                 well size (40x22). Use when the sheet's tray art is better
                 than the pan bin() draws.
     --probe     detect and report the grid, bake nothing.
     --only NAME bake a single cell, for looking before committing twelve.
*/
import { readPNG } from './png-read.mjs';
import { reduceHead, hex } from './reduce.mjs';
import { decodeFace, L64 } from '../../reference/kitchen/facedata.mjs';
import { Canvas, writePNG, upscale } from './px.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';

const HERE = _d(_f(import.meta.url));
const OUT_DIR = _j(HERE, '..', '..', 'content', 'lattice');
const OUT = (n) => _j(HERE, n);

const argv = process.argv.slice(2);
const SHEET = argv.find((a) => !a.startsWith('--'));
if (!SHEET) { console.error('usage: bake-lattice.mjs <sheet.png> [--inset N] [--tray] [--probe] [--only NAME]'); process.exit(1); }
const flag = (n) => argv.includes('--' + n);
const val = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
/* --tray keeps the whole tray, so there is nothing to inset past: the rim IS
   the art. Without --tray the crop has to clear the drawn rim, or the code's
   own pan ends up with a second steel border inside it. */
const TRAY_MODE = argv.includes('--tray');
const INSET_PCT = Number(val('inset', TRAY_MODE ? 0 : 12));
/* The top needs more than the sides. These trays are drawn in slight
   perspective, so their far wall is visible and the top rim is roughly twice
   the thickness of the side rims -- a uniform inset leaves a band of steel
   across the top of every well. */
const TOP_PCT = Number(val('top', TRAY_MODE ? 0 : 26));
const TRAY = TRAY_MODE;
const ONLY = val('only', null);

/* Reading order, matching the lattice in reference/kitchen/kitchen.mjs.
   Names are the DISPLAY names -- the plate holds 7 characters. */
const NAMES = [
  'BEEF', 'CHICKEN', 'BEANS', 'LETTUCE',
  'TOMATO', 'ONION', 'CHEESE', 'OLIVES',
  'PEPPERS', 'CREAM', 'CCQ', 'EMPTY',
];

const img = readPNG(SHEET);
const BG = [img.data[0], img.data[1], img.data[2]];
const isBg = (r, g, b) =>
  Math.abs(r - BG[0]) < 26 && Math.abs(g - BG[1]) < 26 && Math.abs(b - BG[2]) < 26;

/* ---- find the trays --------------------------------------
   Connected components of not-background, keeping only the large ones. The
   labels under each tray are also not-background, which is exactly why a
   projection-based grid detector fails here and a size filter does not: a
   tray is tens of thousands of pixels and a glyph is a few dozen. */
const W = img.width, H = img.height;
const lab = new Int32Array(W * H).fill(-1);
const boxes = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const p = y * W + x, i = p * 4;
  if (lab[p] !== -1) continue;
  if (isBg(img.data[i], img.data[i + 1], img.data[i + 2])) continue;
  const st = [p], id = boxes.length; lab[p] = id;
  let x0 = x, x1 = x, y0 = y, y1 = y, n = 0;
  while (st.length) {
    const q = st.pop(); n++;
    const qx = q % W, qy = (q / W) | 0;
    if (qx < x0) x0 = qx; if (qx > x1) x1 = qx;
    if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = qx + dx, ny = qy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const r = ny * W + nx, ri = r * 4;
      if (lab[r] !== -1) continue;
      if (isBg(img.data[ri], img.data[ri + 1], img.data[ri + 2])) continue;
      lab[r] = id; st.push(r);
    }
  }
  boxes.push({ n, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
}

const big = boxes.filter((b) => b.n > (W * H) / 400 && b.w > W / 12 && b.h > H / 12);
/* reading order: rows top to bottom, then left to right within a row. Banding
   by row first, because a tray's y can wobble a few px between columns. */
big.sort((a, b) => a.y - b.y);
const rows = [];
for (const b of big) {
  const row = rows.find((r) => Math.abs(r[0].y - b.y) < b.h * 0.6);
  if (row) row.push(b); else rows.push([b]);
}
for (const r of rows) r.sort((a, b) => a.x - b.x);
const trays = rows.flat();

console.log(`sheet ${W}x${H}   background rgb(${BG.join(',')})`);
console.log(`found ${trays.length} trays in ${rows.length} rows of ${rows.map((r) => r.length).join('/')}`);
if (trays.length !== NAMES.length)
  console.warn(`  ! expected ${NAMES.length}; check the sheet has even gaps and nothing touching`);

if (flag('probe')) {
  trays.forEach((t, i) => console.log(
    `  ${String(NAMES[i] || '?').padEnd(8)} ${String(t.x).padStart(5)} ${String(t.y).padStart(5)} ${String(t.w).padStart(5)} ${String(t.h).padStart(5)}`));
  process.exit(0);
}

/* ---- bake ------------------------------------------------- */
const CELL_W = 46, CELL_H = 28, WELL_W = 40, WELL_H = 22;
/* --pad leaves a margin of steam table around each tray. The bins sit on a
   shared steel line, and a row of trays butted edge to edge turns that line
   into wall-to-wall tray -- which is exactly the calm mid-range the frame is
   measured against losing. */
const PAD = Number(val('pad', 0));
const TW = TRAY ? CELL_W - PAD * 2 : WELL_W, TH = TRAY ? CELL_H - PAD * 2 : WELL_H;
const INK = '#1b1425';
mkdirSync(OUT_DIR, { recursive: true });

const baked = [];
for (let i = 0; i < trays.length; i++) {
  const name = NAMES[i] || 'CELL' + i;
  if (ONLY && name !== ONLY) continue;
  const t = trays[i];
  const inset = Math.round(Math.min(t.w, t.h) * INSET_PCT / 100);
  const top = Math.round(t.h * TOP_PCT / 100);
  const crop = [t.x + inset, t.y + top, t.w - inset * 2, t.h - top - inset];

  /* No ink keyline: an ingredient sits INSIDE a pan the code already outlines,
     so a second outline would double the rim. A face needed one because it
     floats on a flat backing with nothing around it. */
    /* opaque: see reduce.mjs. Everything inside a tray is wanted, and keying
     would delete the black olives outright. */
  const { cv } = reduceHead(img, crop, { maxW: TW, maxH: TH, colours: 16, opaque: true, fill: true });

  const seen = new Map();
  for (let k = 0; k < cv.data.length; k += 4) {
    if (!cv.data[k + 3]) continue;
    const c = hex([cv.data[k], cv.data[k + 1], cv.data[k + 2]]);
    seen.set(c, (seen.get(c) || 0) + 1);
  }
  const pal = [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  if (pal.length > 16) throw new Error(`${name}: ${pal.length} colours, 16 is the cap`);
  const idx = new Map(pal.map((c, n) => [c, n]));

  let pix = '';
  for (let y = 0; y < cv.height; y++) {
    let sym = null, len = 0;
    const flush = () => { while (len > 0) { const n = Math.min(len, 63); pix += sym + L64[n]; len -= n; } };
    for (let x = 0; x < cv.width; x++) {
      const k = (y * cv.width + x) * 4;
      const s = cv.data[k + 3] ? idx.get(hex([cv.data[k], cv.data[k + 1], cv.data[k + 2]])).toString(16) : '.';
      if (s === sym) len++; else { flush(); sym = s; len = 1; }
    }
    flush();
  }

  const rec = { name, w: cv.width, h: cv.height, ink: INK, skin: pal[0], eyes: [], pal, pix };
  writeFileSync(_j(OUT_DIR, name.toLowerCase() + '.json'), JSON.stringify(rec, null, 2) + '\n');

  const back = decodeFace(rec);
  let bad = 0;
  for (let k = 0; k < cv.data.length; k += 4) {
    const a = cv.data[k + 3] ? [cv.data[k], cv.data[k + 1], cv.data[k + 2]] : null;
    const b = back.data[k + 3] ? [back.data[k], back.data[k + 1], back.data[k + 2]] : null;
    if (!a !== !b || (a && (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]))) bad++;
  }
  if (bad) throw new Error(`${name}: round trip differs in ${bad}px`);

  baked.push({ name, rec, img: back });
  console.log(`  ${name.padEnd(8)} ${cv.width}x${cv.height}  ${pal.length} col  ${pix.length} chars  crop ${crop.join(' ')}  round trip ok`);
}

/* ---- contact sheet, native and 6x, so it can be judged ---- */
const COLS = 4, PADX = 10, PADY = 16, Z = 6;
const SW = PADX + COLS * (TW + PADX);
const RN = Math.ceil(baked.length / COLS);
const SH = PADY + RN * (TH + PADY);
const cv2 = new Canvas(SW, SH), x2 = cv2.getContext('2d');
for (let i = 0; i < cv2.data.length; i += 4) {
  cv2.data[i] = 0x1b; cv2.data[i + 1] = 0x14; cv2.data[i + 2] = 0x25; cv2.data[i + 3] = 255;
}
baked.forEach((b, i) => {
  const px = PADX + (i % COLS) * (TW + PADX), py = PADY + ((i / COLS) | 0) * (TH + PADY);
  for (let y = 0; y < b.img.height; y++) for (let x = 0; x < b.img.width; x++) {
    const s = (y * b.img.width + x) * 4;
    if (!b.img.data[s + 3]) continue;
    const d = ((py + y) * SW + px + x) * 4;
    for (let k = 0; k < 4; k++) cv2.data[d + k] = b.img.data[s + k];
  }
});
writePNG(upscale(cv2, Z), OUT('lattice-bake.png'));
console.log(`\nlattice-bake.png = ${SW * Z}x${SH * Z}  (${baked.length} wells at ${Z}x, ${TW}x${TH} each)`);
console.log(`content/lattice/*.json written`);
