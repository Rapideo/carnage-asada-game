/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   palette.mjs -- the complete palette as a sheet.

   It reads PAL out of the SHIPPED 00_core.js via engine.mjs rather than
   holding a copy, and asserts at the end that every key it found is on the
   sheet exactly once. Add a colour to PAL without grouping it here and this
   throws, naming it -- a sheet that silently omits a colour is worse than no
   sheet, because it reads as complete. (A note is not a guard.)

   Drawn with the game's own 5x7 font and display face, on the game's own ink,
   so the sheet looks like the thing it documents.

       node tools/render/palette.mjs        # -> palette.png + palette-x3.png
*/
import { E, Canvas } from './engine.mjs';
import { writePNG, upscale } from './px.mjs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';
const OUT = (n) => _j(_d(_f(import.meta.url)), n);   // write beside this file

const { PAL, CAR_COLORS, WALLS, SPILL, BAG_MID, BAG_HI, BAG_LO, BAG_FOLD,
        R, text, textW, logoText } = E;

/* ---- layout, in native px (the sheet is drawn 1:1 then upscaled) ---- */
const COLS   = 8;
const CELL_W = 58;          // fits the longest name, "fieldLite", at scale 1
const SW_H   = 20;          // the swatch itself
const CELL_H = SW_H + 3 + 7 + 2 + 7;
const GAP    = 4;
const PX     = CELL_W + GAP;
const PY     = CELL_H + 8;
const MARGIN = 8;
const HEAD_H = 17;          // group rule + label
const W      = MARGIN * 2 + COLS * PX - GAP;

/* ---- the groups ------------------------------------------ */
/* Grouped by what the colour is FOR, not by hue -- that is the question
   anyone opening this sheet is actually asking. */
const GROUPS = [
  { title: 'GROUND / HIGH PLAINS', note: 'past the last street',
    keys: ['void', 'field', 'fieldLite', 'fieldDry', 'fence', 'fenceLo'] },
  { title: 'POND', note: 'union pacific park, the only water left',
    keys: ['pond', 'pondLite', 'pondFoam'] },
  { title: 'ROADWAY', note: '',
    keys: ['road', 'roadLo', 'roadHi', 'lineY', 'lineW'] },
  { title: 'PAVEMENT', note: '',
    keys: ['walk', 'walkHi', 'walkLo', 'curb'] },
  { title: 'GRASS / DIRT', note: '',
    keys: ['grass', 'grassHi', 'grassLo', 'dirt', 'dirtLo'] },
  { title: 'ROOFS', note: 'six pairs, ROOFS[] in 30_art.js',
    keys: ['roofA', 'roofAlo', 'roofB', 'roofBlo', 'roofC', 'roofClo',
           'roofD', 'roofDlo', 'roofE', 'roofElo', 'roofF', 'roofFlo'] },
  { title: 'BUILDINGS', note: '',
    keys: ['wallLt', 'wallMd', 'wallDk', 'glass', 'glassHi',
           'door', 'doorHi', 'porch'] },
  { title: 'TREES', note: '',
    keys: ['tree', 'treeHi', 'treeLo', 'trunk'] },
  { title: 'SEMANTIC / HUD', note: 'cyan is guidance and nothing else',
    keys: ['red', 'amber', 'cyan', 'cyanLo', 'good', 'bad', 'bone', 'boneDim'] },
  { title: 'INK / SHADOW', note: '',
    keys: ['ink', 'ink2', 'shadow'] },
  { title: 'BRAND', note: 'badge and shop signage ONLY -- never the hud',
    keys: ['jade', 'jadeHi', 'jadeLo', 'gold', 'goldLo'] },
  { title: 'POLICE', note: '',
    keys: ['cop', 'siren1', 'siren2'] },
];

/* ---- named sets that live outside PAL -------------------- */
const SETS = [
  { title: 'CAR_COLORS', note: '00_core.js -- body / dark, traffic picks a pair',
    cells: CAR_COLORS.map((p, i) => ({ name: 'car ' + i, bands: p })) },
  { title: 'WALLS', note: '30_art.js -- light / mid / dark, per building',
    cells: WALLS.map((t, i) => ({ name: 'wall ' + i, bands: t })) },
  { title: 'BAG / SPILL', note: '30_art.js -- kraft paper, and what misses',
    cells: [
      { name: 'bagHi',  bands: [BAG_HI] },
      { name: 'bagMid', bands: [BAG_MID] },
      { name: 'bagLo',  bands: [BAG_LO] },
      { name: 'bagFold', bands: [BAG_FOLD] },
      ...SPILL.map((c, i) => ({ name: 'spill ' + i, bands: [c] })),
    ] },
];

/* ---- guard: every PAL key on the sheet, exactly once ------ */
{
  const seen = new Map();
  for (const g of GROUPS) for (const k of g.keys) seen.set(k, (seen.get(k) || 0) + 1);
  const missing = Object.keys(PAL).filter((k) => !seen.has(k));
  const dupes   = [...seen].filter(([, n]) => n > 1).map(([k]) => k);
  const unknown = [...seen.keys()].filter((k) => !(k in PAL));
  const bad = [];
  if (missing.length) bad.push('missing from the sheet: ' + missing.join(', '));
  if (dupes.length)   bad.push('on the sheet twice: ' + dupes.join(', '));
  if (unknown.length) bad.push('not in PAL: ' + unknown.join(', '));
  if (bad.length) throw new Error('palette.mjs is out of date --\n  ' + bad.join('\n  '));
}

/* ---- measure the height before allocating ---------------- */
const rowsOf = (n) => Math.ceil(n / COLS);
let H = 62;                                   // title block
for (const g of GROUPS) H += HEAD_H + rowsOf(g.keys.length) * PY;
H += 10;
for (const s of SETS)   H += HEAD_H + rowsOf(s.cells.length) * PY;
H += 38;                                      // footer

const cv = new Canvas(W, H);
const x  = cv.getContext('2d');

R(x, PAL.ink, 0, 0, W, H);

/* ---- title ----------------------------------------------- */
logoText(x, 'TACO SHOP', W / 2, 8, 2, 1, PAL.gold);
logoText(x, 'CARNAGE ASADA', W / 2, 28, 2, 1, PAL.jadeHi);
text(x, 'COMPLETE PALETTE', W / 2, 50, PAL.bone, 1, 1);

/* ---- pieces ---------------------------------------------- */
function header(y, title, note) {
  R(x, PAL.goldLo, MARGIN, y + 5, W - MARGIN * 2, 1);
  const tw = textW(title, 1);
  R(x, PAL.ink, MARGIN + 2, y, tw + 6, 11);
  text(x, title, MARGIN + 5, y + 2, PAL.gold, 1);
  if (note) {
    const nw = textW(note, 1);
    R(x, PAL.ink, W - MARGIN - nw - 5, y, nw + 6, 11);
    text(x, note, W - MARGIN - 2, y + 2, PAL.boneDim, 1, 2);
  }
  return y + HEAD_H;
}

/* One cell: the swatch, its name, its value. `bands` is one colour, or two or
   three drawn as vertical bands so a pair/triple reads as a single material. */
function cell(cx, cy, name, bands, label) {
  R(x, PAL.walkLo, cx - 1, cy - 1, CELL_W + 2, SW_H + 2);   // keyline, so
  R(x, PAL.ink, cx, cy, CELL_W, SW_H);                      // `void` is visible

  if (bands.length === 1 && /^rgba/i.test(bands[0])) {
    /* an alpha colour has no colour of its own -- show it doing its job,
       over the two grounds it actually lands on. */
    R(x, PAL.bone,  cx, cy, CELL_W >> 1, SW_H);
    R(x, PAL.grass, cx + (CELL_W >> 1), cy, CELL_W - (CELL_W >> 1), SW_H);
    R(x, bands[0], cx + 6, cy + 4, CELL_W - 12, SW_H - 8);
    R(x, PAL.walkLo, cx + 6, cy + 4, CELL_W - 12, 1);
  } else {
    const bw = CELL_W / bands.length;
    bands.forEach((c, i) => R(x, c, cx + i * bw, cy, Math.ceil(bw), SW_H));
  }

  const mid = cx + (CELL_W >> 1);
  text(x, name, mid, cy + SW_H + 3, PAL.bone, 1, 1);
  text(x, label, mid, cy + SW_H + 12, PAL.boneDim, 1, 1);
}

function grid(y, cells) {
  cells.forEach((c, i) => {
    const cx = MARGIN + (i % COLS) * PX;
    const cy = y + ((i / COLS) | 0) * PY;
    cell(cx, cy, c.name, c.bands, c.label);
  });
  return y + rowsOf(cells.length) * PY;
}

/* ---- draw ------------------------------------------------ */
let y = 62;
for (const g of GROUPS) {
  y = header(y, g.title, g.note);
  y = grid(y, g.keys.map((k) => {
    const v = PAL[k];
    return { name: k, bands: [v], label: /^rgba/i.test(v) ? 'ALPHA .30' : v.toUpperCase() };
  }));
}
y += 10;
for (const s of SETS) {
  y = header(y, s.title, s.note);
  y = grid(y, s.cells.map((c) => ({
    name: c.name,
    bands: c.bands,
    label: c.bands.length === 1 ? c.bands[0].toUpperCase() : c.bands.length + ' TONES',
  })));
}

const n = Object.keys(PAL).length;
R(x, PAL.goldLo, MARGIN, y + 4, W - MARGIN * 2, 1);
text(x, 'PAL IN SRC/00_CORE.JS - ' + n + ' ENTRIES. SHEET GENERATED FROM THE SOURCE, NOT A COPY.',
     W / 2, y + 14, PAL.boneDim, 1, 1);
text(x, 'EVERY OTHER HEX IN 30_ART.JS IS A LOCAL ONE-OFF TINT, NOT PALETTE.',
     W / 2, y + 24, PAL.boneDim, 1, 1);

writePNG(cv, OUT('palette.png'));
writePNG(upscale(cv, 3), OUT('palette-x3.png'));
console.log(`palette.png = ${W}x${H}  (${n} PAL entries, ${GROUPS.length} groups, ${SETS.length} named sets)`);
console.log(`palette-x3.png = ${W * 3}x${H * 3}`);
