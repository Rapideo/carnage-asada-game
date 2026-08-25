/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   artboard.mjs -- pre-sized canvases for authoring reference art.

   The lattice wells and the dialogue portraits are the two slots whose art is
   weakest, and both are slots of a FIXED size that already exists in code.
   Drawing them at an arbitrary size and shrinking does not work: at 40x22 and
   at 44px across, every feature is a one- or two-pixel decision, and a
   downsample turns those decisions into mush. So this emits the boxes at
   their real size, magnified by a whole number, with the real chrome behind
   them and the real constraints drawn on top.

       node tools/render/artboard.mjs        # -> lattice-artboard.png
                                             #    faces-artboard.png

   Magenta is the guide colour throughout, because it is the one hue that
   appears nowhere in PAL -- anything magenta is scaffolding, not art.
*/
import { E, Canvas } from './engine.mjs';
import { writePNG, upscale } from './px.mjs';
import { HEAD } from '../../reference/kitchen/portrait.mjs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';
const OUT = (n) => _j(_d(_f(import.meta.url)), n);

const { PAL, R, text } = E;

const Z = 6;                       // whole-number zoom: 1 game px = a 6x6 block
const GUIDE = '#ff2fd0';
const DIM   = '#8e3579';
const SKULL = '#c74aa8';   // the current silhouette: a budget to push against
const GRID  = '#2b2836';   // minor: present, never dominant
const GRID5 = '#4e4763';   // every 5th, so counting to 40 is not counting
const BG    = '#16131d';

/* steel, aliased the same way kitchen.mjs aliases it, so it cannot drift */
const STEEL_D = PAL.roadLo, STEEL_X = PAL.road, STEEL_M = PAL.walk;

/* ---- helpers --------------------------------------------- */
const blit = (dst, src, dx, dy) => {
  for (let y = 0; y < src.height; y++)
    for (let k = 0; k < src.width * 4; k++)
      dst.data[((dy + y) * dst.width) * 4 + dx * 4 + k] = src.data[y * src.width * 4 + k];
};

/* a 6px lattice over the drawable area, so a stroke lands on whole game
   pixels. Every 5th line is stronger -- counting to 40 in sixes otherwise
   means counting. */
function pxGrid(x, gx, gy, gw, gh) {
  for (let i = 0; i <= gw; i++) R(x, (i % 5) ? GRID : GRID5, gx + i * Z, gy, 1, gh * Z);
  for (let j = 0; j <= gh; j++) R(x, (j % 5) ? GRID : GRID5, gx, gy + j * Z, gw * Z, 1);
}

const box = (x, c, a, b, w, h) => {             // 1px outline at final res
  R(x, c, a, b, w, 1); R(x, c, a, b + h - 1, w, 1);
  R(x, c, a, b, 1, h);  R(x, c, a + w - 1, b, 1, h);
};

function title(x, W, head, sub) {
  text(x, head, W / 2, 16, PAL.gold, 2, 1);
  text(x, sub, W / 2, 40, PAL.boneDim, 1, 1);
}

/* ============================================================
   1. THE LATTICE -- 16 wells
   ============================================================ */
const NAMES = ['TORTILLA', 'SHELLS', 'CHIPS', 'BEEF', 'BEANS', 'LETTUCE',
               'CHEESE', 'SLOT 8', 'TOMATO', 'ONION', 'JALAPENO', 'CREAM',
               'ROJA', 'VERDE', 'HOT', 'SLOT 16'];

const CW = 46, CH = 28;             // the cell, as 40_city-adjacent code has it
const WX = 3, WY = 3, WW = 40, WH = 22;   // the well: the drawable area
const PLATE = 8;                    // well rows the feedback plate covers

function binTile() {                // the chrome, drawn native then magnified
  const t = new Canvas(CW, CH), x = t.getContext('2d');
  R(x, PAL.roadLo, 0, 0, CW, CH);
  R(x, STEEL_D, 1, 1, CW - 2, CH - 2);
  R(x, STEEL_M, 1, 1, CW - 2, 1);
  R(x, STEEL_X, 2, 2, CW - 4, CH - 4);
  R(x, 'rgba(12,8,20,0.34)', WX, WY, WW, 1);
  R(x, 'rgba(12,8,20,0.22)', WX, WY, 1, WH);
  return t;
}

{
  const TW = CW * Z, TH = CH * Z, LAB = 18, COLS = 4;
  const PXX = TW + 22, PYY = TH + LAB + 26, M = 24, TOP = 62;
  const W = M * 2 + COLS * PXX - 22;
  const H = TOP + 4 * PYY - 26 + 54;
  const cv = new Canvas(W, H), x = cv.getContext('2d');
  R(x, BG, 0, 0, W, H);
  title(x, W, 'LATTICE ARTBOARD', 'WELL = 40x22 GAME PX, SHOWN AT 6X. ONE GRID SQUARE = ONE GAME PIXEL.');

  const tile = binTile();
  const mag = upscale(tile, Z);

  NAMES.forEach((n, i) => {
    const tx = M + (i % COLS) * PXX;
    const ty = TOP + ((i / COLS) | 0) * PYY + LAB;
    text(x, n, tx, ty - LAB + 4, PAL.bone, 1);
    text(x, i < 8 ? 'ROW A' : 'ROW B', tx + TW, ty - LAB + 4, DIM, 1, 2);
    blit(cv, mag, tx, ty);

    const gx = tx + WX * Z, gy = ty + WY * Z;
    pxGrid(x, gx, gy, WW, WH);

    /* the band the feedback plate covers when the bin is picked or mis-picked.
       Anything that identifies the ingredient has to live BELOW it. */
    for (let s = 0; s < PLATE * Z; s += 4)
      R(x, 'rgba(255,47,208,0.16)', gx, gy + s, WW * Z, 2);
    R(x, GUIDE, gx, gy + PLATE * Z, WW * Z, 1);

    box(x, GUIDE, gx, gy, WW * Z, WH * Z);
  });

  const fy = H - 44;
  R(x, DIM, M, fy - 10, W - M * 2, 1);
  text(x, 'HATCHED BAND = TOP 8 ROWS, COVERED BY THE NAME PLATE WHEN THE BIN IS PICKED OR MIS-PICKED.',
       W / 2, fy, PAL.boneDim, 1, 1);
  text(x, 'KEEP WHAT IDENTIFIES THE INGREDIENT IN THE BOTTOM 14 ROWS. SILHOUETTE FIRST - COLOUR CANNOT CARRY A BIN ALONE.',
       W / 2, fy + 12, PAL.boneDim, 1, 1);
  text(x, 'MAGENTA IS SCAFFOLDING, NOT ART. NOTHING MAGENTA SHOULD SURVIVE INTO THE DRAWING.',
       W / 2, fy + 24, DIM, 1, 1);

  writePNG(cv, OUT('lattice-artboard.png'));
  console.log(`lattice-artboard.png = ${W}x${H}  (16 wells, ${WW}x${WH} each at ${Z}x)`);
}

/* ============================================================
   2. THE FACES -- the 56x56 dialogue box
   ============================================================ */
const FS = 56, TY = 9, CX = 28;     // box, head top row, centre -- from dialog.mjs

/* where the CURRENT code puts each feature, in head rows. Informational: a new
   drawing may move them. The box and the width budget are the real limits. */
const ROWS = [
  [15, 'BROW'], [20, 'LID'], [24, 'EYE'], [27, 'LOWER LID'],
  [33, 'NOSE BASE'], [39, 'MOUTH'], [44, 'CHIN'],
];

function faceTile() {
  const t = new Canvas(FS, FS), x = t.getContext('2d');
  R(x, '#2a2438', 0, 0, FS, FS);
  for (let i = 0; i < FS; i += 3) R(x, '#31293f', 0, i, FS, 1);
  return t;
}

{
  const TW = FS * Z, LAB = 18, COLS = 4;
  const PXX = TW + 22, M = 24, TOP = 62;
  const LABW = 96;                       // right gutter for the row names
  const W = M * 2 + COLS * PXX - 22 + LABW;
  const H = TOP + LAB + TW + 92;
  const cv = new Canvas(W, H), x = cv.getContext('2d');
  R(x, BG, 0, 0, W, H);
  title(x, W - LABW, 'FACE ARTBOARD', 'BOX = 56x56 GAME PX, SHOWN AT 6X. FLOATING HEAD - NO SHOULDERS, THERE ARE NOT 68 ROWS.');

  const mag = upscale(faceTile(), Z);

  for (let i = 0; i < COLS; i++) {
    const tx = M + i * PXX, ty = TOP + LAB;
    text(x, 'FACE ' + (i + 1), tx, ty - LAB + 4, PAL.bone, 1);
    blit(cv, mag, tx, ty);
    pxGrid(x, tx, ty, FS, FS);

    /* the skull the current portrait uses -- a width budget, not a template.
       All four faces sharing ONE silhouette is the main reason the cast reads
       as one person recoloured, so this is the line to push against. */
    R(x, 'rgba(255,47,208,0.22)', tx + CX * Z, ty, 1, TW);        // centre line
    for (const [r, lab] of ROWS) {
      const y = ty + (TY + r) * Z;
      R(x, 'rgba(255,47,208,0.26)', tx, y, TW, 1);
      if (i === COLS - 1) text(x, lab, tx + TW + 8, y - 3, DIM, 1);
    }

    /* the skull last, so it sits over the grid and the row lines -- it is the
       thing being pushed against and has to be the most legible guide here */
    HEAD.forEach((hw, r) => {
      const y = ty + (TY + r) * Z;
      R(x, SKULL, tx + (CX - hw) * Z, y, 2, Z);
      R(x, SKULL, tx + (CX + hw) * Z - 2, y, 2, Z);
    });
    R(x, SKULL, tx + (CX - HEAD[0]) * Z, ty + TY * Z, HEAD[0] * 2 * Z, 2);
    box(x, GUIDE, tx, ty, TW, TW);
  }

  const fy = TOP + LAB + TW + 22;
  R(x, DIM, M, fy - 10, W - M * 2, 1);
  text(x, 'WIDTH BUDGET 44 PX FOR THE SKULL, 54 INCLUDING HAIR AND EARS. HEIGHT 52 ROWS. HEAD TOP SITS 9 ROWS DOWN.',
       W / 2, fy, PAL.boneDim, 1, 1);
  text(x, 'DIM OUTLINE IS THE SKULL THE CODE USES TODAY - A BUDGET, NOT A TEMPLATE. ALL FOUR SHARING IT IS THE PROBLEM.',
       W / 2, fy + 12, PAL.boneDim, 1, 1);
  text(x, 'ROW LINES ARE WHERE FEATURES SIT NOW. MOVE THEM IF THE DRAWING IS BETTER FOR IT.',
       W / 2, fy + 24, DIM, 1, 1);

  writePNG(cv, OUT('faces-artboard.png'));
  console.log(`faces-artboard.png  = ${W}x${H}  (4 boxes, ${FS}x${FS} each at ${Z}x)`);
}
