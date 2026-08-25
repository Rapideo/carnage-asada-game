/* REFERENCE ART -- a kept starting point, not a shipped screen.

   The LOOK here (palette, silhouettes, tone balance, the 44px portrait, the
   dialogue strip) is approved as the basis for building the Kitchen Shift.
   The LAYOUT is not a specification -- element positions, the menu, the
   ingredient names and every price are still open. See the PRD.

   Regenerate:  node reference/kitchen/kitchen.mjs
   Verify:      node tools/render/measure.mjs reference/kitchen/kitchen.png
   -------------------------------------------------------------- */
/* ============================================================
   KITCHEN SHIFT -- play-surface mockup, 384x216.

   Drawn with the game's own modules: PAL, the 5x7 font, the LOGO
   display face, Hud.panel and the CRT Post pass all come from src/.
   Layout is a 16:9 recomposition of the 4:3 reference.

     y   0..  6   ticket rail
     y   0..104   back wall    base shelf | pantry + tickets | pass window
     y 104..164   steam table  12 bins, 46px | base station | bare table
     y 164..216   prep board   readout | building | built

   Horizontal budget, checked rather than eyeballed:
     shelf  3..110 (107)   tickets 112/158/204 (45)   card 253..381
     bins   52/99/146/193/240/287 (46)   base x5 (46x58)   bare x334
   ============================================================ */
import { E, Canvas } from '../../tools/render/engine.mjs';
import { writePNG, upscale } from '../../tools/render/px.mjs';
import { drawDialog } from './dialog.mjs';
import { CAST } from './cast.mjs';
import { decodeFace } from './facedata.mjs';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';
const OUT = (n) => _j(_d(_f(import.meta.url)), n);   // write beside this file

const { VW, VH, PAL, R, text, textOut, textW, money, clockStr,
        logoText, disc, shade, makeRng, Art, Hud, Post } = E;

const c = new Canvas(VW, VH), x = c.getContext('2d');

/* the shipped pedestrian sprites, built exactly as Art.build() does */
Art.buildPeds(makeRng(9));

/* ---- scene colours, all shade()d off a palette entry so the frame
        cannot drift out of the game's range ---- */
const BRICK   = PAL.road;                 // WAS the near-black: brick at
const BRICK_2 = PAL.roadHi;               // #352518 is max-channel 53, i.e.
const BRICK_H = PAL.roadHi;               // simultaneously warm AND near-black
const MORTAR  = PAL.roadLo;
const STEEL_D = PAL.roadLo;               // the road's own value
const STEEL_X = PAL.road;
const STEEL   = PAL.walkLo;
const STEEL_M = PAL.walk;
const STEEL_H = PAL.walkHi;
const WOOD    = PAL.walkLo;
const WOOD_H  = PAL.walk;
const WOOD_L  = shade(PAL.curb, -0.12);
const PAPER   = shade(PAL.lineW, -0.13);
const PAPER_D = PAL.boneDim;
const INKDIM  = shade(PAL.bone, -0.46);

/* ingredient: [mid, high, low, how it is heaped] */
const ING = {
  TORTILLA:  [PAL.porch,   '#ecdcb4', '#b8a37c', 'stack'],
  SHELLS:    ['#e0b055',   '#f0c96f', '#b78a3a', 'shells'],
  CHIPS:     ['#e6bb63',   '#f7d488', '#b0812c', 'chips'],
  BEEF:      ['#6b4326',   '#8a5a33', '#452a15', 'crumble'], // 8 value points from TOMATO
  BEANS:     ['#8d5a33',   '#a87243', '#66401f', 'mass'],
  LETTUCE:   [PAL.grassHi, PAL.good,  PAL.grassLo, 'shredV'],
  CHEESE:    ['#e0b055',   '#f5d478', '#b0812c', 'shredH'],
  TOMATO:    ['#e05a2a',   '#ff8552', '#9c3410', 'dice'],   // pushed orange: it sat
  ONION:     ['#e6ddc6',   '#ffffff', '#a89e86', 'dice'],
  PEPPERS:   [PAL.treeHi,  '#63b86b', PAL.treeLo, 'rings'],
  CREAM:     ['#f2e9d0',   '#ffffff', '#c2b89c', 'swirl'],
  /* The prototype twelve. These three are new and their SHAPES currently
     collide with neighbours -- CHICKEN reads as pale BEEF, OLIVES as dark
     PEPPERS, CCQ as orange CREAM. That is not an oversight to fix here: it is
     precisely what the incoming reference art exists to solve, and drawing
     eleven convincing placeholder heaps first would be work thrown away. */
  CHICKEN:   ['#c9a25e',   '#e2bd77', '#8f6d33', 'crumble'],
  OLIVES:    ['#3a3040',   '#584a5e', '#241d28', 'rings'],
  CCQ:       ['#e8a33c',   '#ffc466', '#a86a18', 'sauce'],
  ROJA:      ['#a8321f',   '#c9472f', '#741d10', 'sauce'],
  VERDE:     ['#8d9b32',   '#aab945', '#616c1f', 'sauce'],
  HOT:       ['#b03f1c',   '#d0592d', '#7a2810', 'sauce'],
  LIME:      ['#7fb03a',   '#a8cf55', '#54781f', 'wedges'],
};

/* ============================================================
   BACK WALL
   ============================================================ */
function wall() {
  R(x, BRICK, 0, 0, VW, 108);
  const rng = makeRng(1972);
  for (let by = 0, row = 0; by < 108; by += 7, row++) {
    const off = row % 2 ? -7 : 0;
    for (let bx = off; bx < VW; bx += 15) {
      if (rng.chance(0.28)) R(x, BRICK_H, bx, by, 14, 6);
      else if (rng.chance(0.14)) R(x, MORTAR, bx, by, 14, 6);
    }
    R(x, MORTAR, 0, by + 6, VW, 1);
  }
  for (let i = 0; i < 16; i++) {                 // light spilling from overhead
    x.globalAlpha = 0.034 - i * 0.002;
    R(x, '#cfe0f0', 0, i * 3, VW, 3);
  }
  x.globalAlpha = 1;
}

/* ============================================================
   BASE SHELF  x 3..110, y 8..100

   Was the menu board. Moving the recipe-starters onto the wall is what
   pays for the bin row: the steam table's left 52px comes back, so bins
   go 45 -> 53 wide, and a 53px bin still holds an 8-character label at
   the 16-bin cap the menus scale to.

   Same label-plate chrome as a bin, deliberately -- these are selectable,
   and the plate is the cue that says so.
   ============================================================ */

/* A bay is 103x19 of usable shelf -- a letterbox. Goods stretched to fill
   that read as stripes and slats (the tortillas came out as floorboards and
   the shells as a picket fence), so each tier draws OBJECTS standing on a
   shelf at their own natural size instead. */

/* An empty hard shell. The tilted crescent is the shape that proved out on
   the prep board -- a symmetric upright U at this size reads as a bucket,
   which is exactly what the first rack of these came out as. */
function shellShape(cx, cy, RR, th, mid, hi, lo, rng) {
  const nx = -Math.sin(th), ny = Math.cos(th);
  for (let py = -RR - 2; py <= RR + 2; py++)
    for (let px = -RR - 2; px <= RR + 2; px++)
      if (Math.hypot(px, py) <= RR + 1 && px * nx + py * ny >= -1.5)
        R(x, PAL.ink, cx + px, cy + py, 1, 1);
  for (let py = -RR - 2; py <= RR + 2; py++)
    for (let px = -RR - 2; px <= RR + 2; px++) {
      const d = Math.hypot(px, py), off = px * nx + py * ny;
      if (d > RR || off < -0.5) continue;
      let col = d > RR - 2 ? lo : off < 2.5 ? hi : mid;
      if (rng && rng.chance(0.09)) col = lo;
      R(x, col, cx + px, cy + py, 1, 1);
    }
}

/* ============================================================
   PANTRY  x 112..250, y 44..104   (behind the tickets)
   ============================================================ */
function pantry() {
  const shelf = (sy) => {
    R(x, STEEL_X, 4, sy, 244, 3);
    R(x, STEEL_M, 4, sy, 244, 1);
    for (let i = 12; i < 250; i += 44) R(x, STEEL_X, i, sy + 3, 2, 10);
  };
  const can = (cx, cy, hgt, col) => {
    R(x, PAL.ink, cx, cy, 9, hgt);
    R(x, col, cx + 1, cy + 1, 7, hgt - 2);
    R(x, shade(col, 0.28), cx + 1, cy + 1, 2, hgt - 2);
    R(x, PAL.bone, cx + 1, (cy + hgt / 2 - 2) | 0, 7, 4);
    R(x, shade(col, -0.35), cx + 1, cy + hgt - 3, 7, 2);
  };
  const crate = (cx, cy, w, hgt, label) => {
    R(x, PAL.ink, cx, cy, w, hgt);
    R(x, WOOD_L, cx + 1, cy + 1, w - 2, hgt - 2);
    R(x, shade(WOOD_L, 0.20), cx + 1, cy + 1, w - 2, 1);
    R(x, shade(WOOD_L, -0.25), cx + 1, cy + hgt - 2, w - 2, 1);
    if (label && textW(label, 1) <= w - 6)
      text(x, label, cx + w / 2, cy + ((hgt - 7) / 2 | 0), shade(WOOD_L, -0.45), 1, 1);
  };

  /* Stock sits where the tickets do NOT hang: ticket 1 reaches y74 over
     x112..157, so the labelled crates live on the lower shelf and the upper
     shelf is loaded from x159 right. Nothing worth reading is drawn behind
     a docket. */
  shelf(72);
  can(207, 60, 12, '#b8442e'); can(218, 58, 14, '#c98a2a');

  shelf(96);
  can(171, 84, 12, PAL.treeLo); can(182, 82, 14, '#c98a2a');
  R(x, PAL.ink, 234, 82, 17, 14);                 // sack of flour
  R(x, PAL.boneDim, 235, 83, 15, 12);
  R(x, PAL.bone, 235, 83, 15, 2);
  R(x, shade(PAL.boneDim, -0.28), 235, 93, 15, 2);
  R(x, PAL.jadeLo, 240, 87, 5, 4);                // the shop's cactus stamp
}

/* ============================================================
   THE OVERHEAD  x 249..384, y 0..104

   The whole right column, seen from directly above -- the same projection
   as the Delivery Shift, so the two halves of the game share a camera on
   the one part of the kitchen that contains people.

   It is no longer a monitor showing a room; it IS the room. The clock card
   floats over it (drawn last, with a cast shadow so it reads as hovering),
   and directly beneath the card is the service window: a single opening in
   the shop wall with a jamb either side, seen in plan. Customers queue away
   from it toward the bottom of the screen.

   Everyone in here is `Art.ped` from 30_art.js -- the same eight characters
   who walk the pavements in the driving half. Facing 0 is north, so a queue
   at a window in the wall above shows us its backs, which is what a queue
   actually looks like from above and costs no faces at a size faces do not
   survive.
   ============================================================ */
const OV_X = 249, OV_W = VW - OV_X, OV_H = 104;

function overheadView() {
  const rng = makeRng(4412);

  /* dining-room floor: the shop's quarry tile, in plan */
  R(x, shade(PAL.walk, -0.26), OV_X, 0, OV_W, OV_H);
  for (let ty = 0; ty < OV_H; ty += 8)
    for (let tx = OV_X; tx < VW; tx += 8) {
      if (rng.chance(0.42)) R(x, shade(PAL.walk, -0.18), tx, ty, 7, 7);
      R(x, shade(PAL.walk, -0.32), tx, ty, 8, 1);
      R(x, shade(PAL.walk, -0.32), tx, ty, 1, 8);
    }
  R(x, PAL.ink, OV_X - 1, 0, 2, OV_H);              // the kitchen/room divide

  /* ---- the shop wall, with ONE window opening in it ---- */
  const wy = 48, wh = 11;                            // the wall, in plan
  const ox = OV_X + 47, ow = 40;                     // centred under the card
  const wall2 = (px, w2) => {
    R(x, PAL.ink, px, wy, w2, wh);
    R(x, shade(PAL.wallMd, -0.30), px, wy + 1, w2, wh - 2);
    R(x, shade(PAL.wallLt, -0.24), px, wy + 1, w2, 2);
    R(x, shade(PAL.wallDk, -0.24), px, wy + wh - 3, w2, 2);
  };
  wall2(OV_X, ox - OV_X);                            // wall left of the opening
  wall2(ox + ow, VW - (ox + ow));                    // wall right of it

  /* the sill across the opening -- the counter you are serving over */
  R(x, shade(PAL.ink, 0.05), ox, wy, ow, 4);         // through into the kitchen
  R(x, PAL.ink, ox, wy + 4, ow, 8);
  R(x, STEEL_M, ox, wy + 5, ow, 5);                  // the sill you serve over
  R(x, STEEL_H, ox, wy + 5, ow, 2);
  R(x, STEEL_X, ox, wy + 10, ow, 2);
  R(x, 'rgba(12,8,20,0.30)', ox, wy + 12, ow, 4);    // its shadow on the floor

  /* the two side walls -- jambs running out into the room either side */
  const jh = 16;
  for (const jx of [ox - 5, ox + ow]) {
    R(x, PAL.ink, jx, wy + wh, 5, jh);
    R(x, shade(PAL.wallMd, -0.34), jx + 1, wy + wh, 3, jh - 1);
    R(x, shade(PAL.wallLt, -0.30), jx + 1, wy + wh, 1, jh - 1);
    R(x, 'rgba(12,8,20,0.34)', jx + 4, wy + wh, 3, jh - 1);   // cast shadow
  }

  /* ---- the queue: at most four, facing the window ---- */
  const ped = (i, dir, frame, dx, dy) => {
    R(x, 'rgba(12,8,20,0.32)', dx + 1, dy + 12, 7, 3);
    x.drawImage(Art.ped[i % Art.ped.length][dir][frame], dx, dy);
  };
  const qx = ox + (ow >> 1) - 4;
  /* a LINE, perpendicular to the window. Overlap is what a queue looks like
     from above; spreading them out to keep them distinct read as a huddle. */
  ped(2, 0, 0, qx,       wy + wh + 2);               // being served
  ped(5, 0, 1, qx - 4,   wy + wh + 13);
  ped(0, 0, 0, qx + 3,   wy + wh + 24);
  ped(6, 3, 1, qx + 17,  wy + wh + 31);              // arriving from the side


  /* The QUEUE count was here, on the wall so it read as signage rather than
     HUD. Removed: the queue is already visible -- four people are standing in
     it -- so the number was labelling something the picture already says. */
}


/* ============================================================
   RAIL + ORDER TICKETS
   ============================================================ */
/* The rail spans the PASS, not the whole kitchen. Run full width, its
   decorative hooks hung down onto the base shelf and punched five dark ticks
   through the TORTILLA label -- one of them straight through the A. Each
   ticket draws its own clip, so the rail needs no hooks of its own. */
function rail() {
  const x0 = 2, w = 250;
  R(x, STEEL_X, x0, 1, w, 6);
  R(x, STEEL_H, x0, 1, w, 1);
  R(x, STEEL_M, x0, 2, w, 1);
  R(x, shade(STEEL_X, -0.4), x0, 6, w, 1);
  for (const bx of [x0, x0 + w - 3]) {          // brackets into the wall
    R(x, STEEL_D, bx, 0, 3, 10);
    R(x, STEEL_M, bx, 0, 3, 1);
    R(x, shade(STEEL_X, -0.4), bx, 9, 3, 1);
  }
}

const TICKETS = [
  { n: 1, x: 4, items: ['NACHOS', 'BEAN BURRITO', 'TACO', 'TACO SUPREME', 'QUESADILLA'], done: 2, active: 2, pat: 0.28 },
  { n: 2, x: 86, items: ['TACO SUPREME', 'QUESADILLA'],                           done: 0, active: -1, pat: 0.64 },
  { n: 3, x: 168, items: ['BEAN BURRITO', 'TACO', 'NACHOS'],                    done: 0, active: -1, pat: 0.96 },
];
function ticket(t) {
  const w = 78, py = 5, h = 26 + t.items.length * 8 + 3, px = t.x;

  R(x, STEEL_X, px + 36, 3, 5, 5);                       // clip on the rail
  R(x, STEEL_H, px + 37, 3, 3, 2);
  R(x, 'rgba(12,8,20,0.38)', px + 2, py + 2, w, h);      // shadow on the brick
  R(x, PAL.ink, px, py, w, h);
  R(x, PAPER, px + 1, py + 1, w - 2, h - 2);
  R(x, PAPER_D, px + 1, py + h - 2, w - 2, 1);
  if (t.active >= 0) { x.strokeStyle = PAL.amber; x.lineWidth = 1; x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1); }

  text(x, String(t.n), px + w / 2, py + 4, PAL.ink, 2, 1);   // docket number
  R(x, PAL.ink, px + 3, py + 20, w - 6, 1);

  // patience: the tip-decay bar's idiom, because it is the same thing
  R(x, INKDIM, px + 3, py + 22, w - 6, 3);
  const pw = Math.round((w - 8) * t.pat);
  const hi = t.pat > 0.5 ? PAL.amber : t.pat > 0.22 ? '#e07a1f' : PAL.bad;
  R(x, hi, px + 4, py + 23, pw, 1);
  R(x, shade(hi, -0.32), px + 4, py + 24, pw, 1);

  t.items.forEach((it, i) => {
    const ty = py + 27 + i * 8;
    if (i === t.active) R(x, PAL.amber, px + 2, ty - 1, w - 4, 9);
    // done reads as CROSSED OFF, not faded out: still legible, with a hard
    // ink rule through it, the way a cook strikes a docket
    const done = i < t.done;
    text(x, it, px + 3, ty, done ? shade(PAL.bone, -0.40) : PAL.ink, 1);
    if (done) R(x, PAL.ink, px + 2, ty + 3, textW(it, 1) + 2, 1);
  });
}

/* ============================================================
   STEAM TABLE  y 104..164
   ============================================================ */
/* TWELVE BINS. Not sixteen, not a range -- twelve, at every point in the game.

   This replaces the earlier "16 cells and always 16, unused ones lidded" rule,
   and the reasoning that produced it survives the change intact: nothing on the
   line may ever move position between levels, because the muscle memory a
   player builds in 1972 has to still work in 1999. Twelve fixed bins satisfy
   that as well as sixteen did, and a level that needs fewer leaves bins EMPTY
   rather than covering them.

   The columns either side are deliberately bare steam table. The left one is
   where the base station will go -- one double-height picker for tortillas,
   taco shells and chips, since those are a choice between forms of the same
   thing rather than four separate reaches. The right one is just table.

   Geometry is unchanged on purpose: 46-wide cells at the same x positions, a
   40x22 well. Widening the bins to fill the freed space was considered and
   rejected for exactly the reason above -- it would move all twelve.

   Three decisions shaped the original grid and still hold. The bases moved off
   the wall and into the line, because a 4-way stick has to be able to reach
   them; WRAP and SERVE left the table entirely, because they are buttons now;
   and with no labels there is no width arithmetic to satisfy. */
/* The prototype menu. Row A is what goes in first and in bulk, row B is what
   goes on top -- travel distance across the line is a real cost, so which
   ingredients sit adjacent is level design rather than decoration.

   Slot B6 is EMPTY, not covered. It is there to prove the rule: twelve bins
   always, and a level that needs eleven leaves one bare.

   DISPLAY NAMES, not full names. The plate holds 7 characters, so TOMATOES,
   BLACK OLIVES, JALAPENOS and SOUR CREAM are shortened here. The full names
   belong in the recipe data, where nothing has to draw them. */
const LATTICE = [
  ['BEEF', 'CHICKEN', 'BEANS', 'LETTUCE', 'TOMATO', 'ONION'],
  ['CHEESE', 'OLIVES', 'PEPPERS', 'CREAM', 'CCQ', null],
];
/* The twelve start at column 1. Column 0 is the base station's reservation and
   column 7 is bare table -- neither is a bin, so neither is in the array. A
   null INSIDE the array is different: it is one of the twelve, standing empty. */
const BIN_COL0 = 1;

/* The assembly board, at module scope because three things now derive from it:
   the board itself, the WRAP button that sits beyond its right edge, and the
   guard that stops the progress pips being pushed into it by a long name. */
const BX = 138, BW = 177;           // was 104 wide; +70%
const CELL_W = 46, CELL_H = 28, COL0 = 5, ROW_Y = [105, 135];
const colX = (i) => COL0 + i * (CELL_W + 1);

/* The name plate is CELL_W - 2 wide and the name is centred in it, so a name
   over 7 characters runs off both ends of its own bin.

   This is a guard rather than a note because the overflow is INVISIBLE almost
   all the time: the plate only draws at the moment a bin is picked or
   mis-picked. JALAPENO has been 3px too wide since the frame was first drawn
   and nobody saw it, because no screenshot ever caught it selected. That is
   the same class of defect CLAUDE.md records three of in the order card. */
const PLATE_W = CELL_W - 2;
for (const row of LATTICE) for (const k of row) {
  if (!k) continue;
  const w = textW(k, 1);
  if (w > PLATE_W) throw new Error(
    `lattice: "${k}" is ${w}px on a ${PLATE_W}px name plate, ${w - PLATE_W}px too wide.\n` +
    `  The plate holds ${Math.floor((PLATE_W + 1) / 6)} characters. Shorten the DISPLAY name;\n` +
    `  the full name can live in the recipe data where nothing has to draw it.`);
}
const CURSOR = [0, 1];              // row, col -- resting on CHICKEN

function steamTable() {
  R(x, STEEL_D, 0, 104, VW, 60);
  R(x, STEEL_H, 0, 104, VW, 1);                    // back edge catching the light
  R(x, STEEL_M, 0, 105, VW, 2);
  R(x, STEEL, 0, 107, VW, 1);
  for (let i = 0; i < VW; i += 3) R(x, shade(STEEL_D, 0.06), i, 108, 1, 53);
  R(x, STEEL, 0, 160, VW, 2);                      // tray slide along the front
  R(x, STEEL_H, 0, 160, VW, 1);
  R(x, STEEL_X, 0, 162, VW, 2);

  LATTICE.forEach((row, r) => row.forEach((k, i) => {
    const px = colX(BIN_COL0 + i), py = ROW_Y[r];
    /* An empty bin is a BIN, drawn empty -- not a gap. Twelve are always on
       the line, so a level that needs eleven has to still show twelve or the
       rule is invisible and the grid looks like it re-packed. The columns
       outside the twelve are bare table and are not drawn at all; the
       difference between those two things is the whole point. */
    if (!k) {
      const e = WELLS.EMPTY;                       // the sheet drew one; use it
      if (e) return void x.drawImage(e, px + ((CELL_W - e.width) >> 1),
                                        py + ((CELL_H - e.height) >> 1));
      return emptyBin(px, py, CELL_W, CELL_H);
    }
    /* No bin is showing its name plate. BEEF was drawn picked and ONION
       mis-picked to demonstrate both feedback states; the frame reads cleaner
       without them, and the states are still there to be switched on -- pass
       `wrong` or `picked` true for any key.

       This makes the 7-character guard above MORE important, not less: the
       plate is now invisible in every rendered frame, so an over-long name
       could never be caught by looking. It is caught at render time instead. */
    bin(px, py, CELL_W, CELL_H, k, false, false);
  }));
  /* The right column: a double-height STATION, not a thirteenth bin.

     The twelve are the ingredients, in columns 1..6, and they stay twelve. A
     station holds a BASE -- the thing an order is built ON rather than an
     ingredient added to it -- which is why it can sit outside the count
     without breaking "twelve bins, period". The left column is reserved for
     the other one, for tortillas and shells.

     Double height because a base is a single deep reach rather than a row
     position, and because the shape is what tells the two apart at a glance:
     nothing else on this line is tall. */
  const STATION_H = ROW_Y[1] + CELL_H - ROW_Y[0];
  station(colX(0), ROW_Y[0], CELL_W, STATION_H, 'TORTILLA');
  station(colX(7), ROW_Y[0], CELL_W, STATION_H, 'CHIPS');

  cursor(colX(BIN_COL0 + CURSOR[1]), ROW_Y[CURSOR[0]], CELL_W, CELL_H);
}

/* A base station. Same blit path as a bin, but it is allowed to be any size,
   so the baked art decides the shape rather than the cell grid does. Falls
   back to an empty pan when no art has been baked for it yet. */
function station(px, py, w, h, key) {
  const baked = WELLS[key];
  if (!baked) return emptyBin(px, py, w, h);
  x.drawImage(baked, px + ((w - baked.width) >> 1), py + ((h - baked.height) >> 1));
}

/* An empty bin: the same pan, with nothing in it. Deliberately NOT a lid and
   deliberately not bare table -- it has to read as a station that is on the
   line and unused, because that is exactly what it is. The well is a shade
   darker than a full one, since an empty pan shows its own floor. */
function emptyBin(px, py, w, h) {
  R(x, PAL.roadLo, px, py, w, h);
  R(x, STEEL_D, px + 1, py + 1, w - 2, h - 2);
  R(x, STEEL_M, px + 1, py + 1, w - 2, 1);
  R(x, shade(STEEL_X, -0.16), px + 2, py + 2, w - 4, h - 4);
  const wx = px + 3, wy = py + 3, ww = w - 6, wh = h - 6;
  R(x, 'rgba(12,8,20,0.34)', wx, wy, ww, 1);          // rim shadow, as a full bin
  R(x, 'rgba(12,8,20,0.22)', wx, wy, 1, wh);
  R(x, shade(STEEL_X, -0.05), wx, wy + wh - 2, ww, 2);  // light pooling on the floor
}

/* Label plate on the front lip, ingredient heaped in a steel well.

   `wrong` is the mis-click warning, and it flashes the PLATE, not the well.
   Flashing the well cannot work: TOMATO, ROJA and HOT are red-toned, so a red
   wash over the contents is close to invisible on exactly the bins most likely
   to be confused with each other. The plate is bone on every bin, so it reads
   the same everywhere. Red plate + ink text is the grammar the active ticket
   row already uses in amber. The brief says the warning persists until the
   right ingredient is picked, so this is a held state, not a one-frame blink. */
/* The baked wells are the DEFAULT now. HEAPS=1 goes back to the drawn ones.

   This reverses "one hero object, bare steel around it", and the reversal is
   deliberate rather than forgetful. That rule was reached because every cell
   that scored well had a discrete outlined object and every cell that scored
   1 was a FILL -- but the fills it was judging were generic texture, so they
   all collided. These do not: fine crumble, chunks, whole beans, rings with
   holes, rings with seeds. Rendered side by side, beef and chicken are the
   same mound in the drawn version and obviously different pans in this one.

   The measured half of that rule still bites, and is still obeyed. Trays
   butted edge to edge put the frame OUT of tolerance -- the calm mid-range
   steel between bins is load-bearing, exactly as the original review said. It
   is bought back with --pad 2, which is why the trays do not fill their cells. */
const WELLS = {};
if (!process.env.HEAPS) {
  const dir = _j(_d(_f(import.meta.url)), '..', '..', 'content', 'lattice');
  if (existsSync(dir)) for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    const rec = JSON.parse(readFileSync(_j(dir, f), 'utf8'));
    WELLS[rec.name] = decodeFace(rec);
  }
}

function bin(px, py, w, h, key, wrong, picked) {
  const [mid, hi, lo, kind] = ING[key];
  const baked = WELLS[key];

  /* A baked well arrives at one of two sizes and the size says which it is.
     Cell-sized art (46x28) is a whole TRAY -- rim included -- so the chrome
     below must not draw at all, or the pan gets a second steel border inside
     its own. Well-sized art (40x22) is food only and sits in the pan the code
     draws. Keying off the dimensions rather than a flag means the two can
     never disagree about which is which. */
  const wholeTray = baked && baked.width >= w - 6 && baked.height >= h - 6;

  if (wholeTray) {                                 // centred, so --pad shows
    x.drawImage(baked, px + ((w - baked.width) >> 1), py + ((h - baked.height) >> 1));
  } else {
    R(x, PAL.roadLo, px, py, w, h);                 // border off ink: cool dark
    R(x, STEEL_D, px + 1, py + 1, w - 2, h - 2);    // was already at parity
    R(x, STEEL_M, px + 1, py + 1, w - 2, 1);
    R(x, STEEL_X, px + 2, py + 2, w - 4, h - 4);    // pan -- full height, no plate
  }

  const wx = px + 3, wy = py + 3, ww = w - 6, wh = h - 6;
  if (baked && !wholeTray) x.drawImage(baked, wx, wy + ((wh - baked.height) >> 1));
  else if (!baked) heap(wx, wy, ww, wh, mid, hi, lo, kind, key);
  if (!wholeTray) {                                // the tray art has its own
    R(x, 'rgba(12,8,20,0.34)', wx, wy, ww, 1);     // rim shadow already
    R(x, 'rgba(12,8,20,0.22)', wx, wy, 1, wh);
  }

  /* 10 rows, not 9: at 9 the glyph's top row landed on the plate's own
     border with zero air above it -- the vertical-overflow failure CLAUDE.md
     warns is invisible to every check except reading the pixels back. */
  /* The name is not a caption, it is FEEDBACK -- it exists only at the moment
     you touch the bin, and the same plate carries both outcomes. Bone means
     that went in; red means it did not. */
  if (picked || wrong) {
    R(x, PAL.ink, px + 1, py + 1, w - 2, 10);
    R(x, wrong ? PAL.bad : PAL.good, px + 1, py + 1, w - 2, 9);
    R(x, shade(wrong ? PAL.bad : PAL.good, -0.38), px + 1, py + 9, w - 2, 1);
    text(x, key, px + w / 2, py + 2, PAL.ink, 1, 1);
    x.strokeStyle = wrong ? PAL.bad : PAL.good; x.lineWidth = 1;
    x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);
  }
}

/* Ingredient wells, rebuilt around ONE HERO OBJECT.

   The previous pass filled every well edge to edge with texture. Two separate
   reviews landed on the same verdict from different directions:

     - Legibility: every cell that scored well had a discrete outlined object;
       every cell that scored 1 was a fill. The 26px nachos plate on the BUILT
       tray was more identifiable than the CHIPS bin it came from.
     - Normalisation: measured against a live frame of the shipped Delivery
       Shift, this screen ran 54.9% "busy" 8x8 blocks against the game's 28.9%,
       and 12.2% calm against 21.5%. Detail only reads as craft when there is
       rest around it.

   One fix serves both: draw a discrete, outlined object and leave bare steel
   around it. The steel is not wasted space -- it is the negative space that
   makes the object read, and it is mid-range value, which is exactly what the
   histogram was missing. */

/* an outlined heap: a dome with an ink keyline, sized to the GOODS not the well */
function mound(cx, by, w, h, mid, hi, lo, fill) {
  const hw = w / 2;
  for (let r = 0; r < h; r++) {
    const t = r / (h - 1);
    const half = Math.round(hw * Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t) * 0.86)));
    if (half < 1) continue;
    const y = by - h + 1 + r;
    R(x, PAL.ink, cx - half - 1, y, half * 2 + 2, 1);
    R(x, r < 2 ? hi : r > h - 3 ? lo : mid, cx - half, y, half * 2, 1);
  }
  if (fill) fill(cx, by - h + 1, w, h);
}

/* a discrete cut piece: cube, ring or wedge, each with its own keyline */
function piece(px, py, w, h, kind, mid, hi, lo) {
  R(x, PAL.ink, px - 1, py - 1, w + 2, h + 2);
  if (kind === 'cube') {
    R(x, mid, px, py, w, h);
    R(x, hi, px, py, w - 1, 1);
    R(x, hi, px, py, 1, h - 1);
    R(x, lo, px + w - 2, py + 1, 2, h - 1);
    R(x, lo, px + 1, py + h - 2, w - 1, 2);
  } else if (kind === 'ring') {
    R(x, mid, px, py, w, h);
    R(x, hi, px + 1, py, w - 2, 1);
    R(x, hi, px, py + 1, 1, h - 2);
    R(x, lo, px + w - 1, py + 1, 1, h - 2);
    R(x, PAL.ink, px + 2, py + 2, w - 4, h - 4);
    R(x, shade(lo, -0.3), px + 2, py + 2, w - 4, h - 4);
  } else {                                          // scoop / blob
    R(x, mid, px, py, w, h);
    R(x, hi, px + 1, py, w - 2, 2);
    R(x, lo, px + 1, py + h - 2, w - 2, 2);
  }
}

function heap(wx, wy, ww, wh, mid, hi, lo, kind, seed) {
  const rng = makeRng(seed.charCodeAt(0) * 977 + seed.length * 31);
  const cx = wx + (ww / 2 | 0), by = wy + wh - 1;

  if (kind === 'crumble') {                         // BEEF -- a dark umber mound
    mound(cx, by, 28, 14, mid, hi, lo, (mx, my, mw, mh) => {
      for (let i = 0; i < 26; i++)
        R(x, rng.chance(0.34) ? hi : lo, mx - mw / 2 + 3 + rng.int(mw - 6), my + 2 + rng.int(mh - 4), 3, 2);
    });
  } else if (kind === 'mass') {                     // BEANS -- smooth, with a paddle
    mound(cx, by, 26, 13, mid, hi, lo, (mx, my, mw, mh) => {
      for (let r = 1; r < 3; r++)
        for (let a = 0; a < 26; a++) {
          const th = a / 26 * Math.PI * 2;
          R(x, lo, (mx + Math.cos(th) * r * 4) | 0, (my + mh / 2 + Math.sin(th) * r * 1.6) | 0, 2, 1);
        }
    });
    for (const [ox, oy] of [[-7, -11], [-1, -13], [5, -11], [-4, -8], [2, -8]]) {
      R(x, PAL.ink, cx + ox - 1, by + oy - 1, 6, 5);   // whole beans, outlined
      R(x, hi, cx + ox, by + oy, 4, 3);
      R(x, shade(hi, 0.28), cx + ox, by + oy, 3, 1);
      R(x, lo, cx + ox + 1, by + oy + 2, 3, 1);
    }
  } else if (kind === 'shredV') {                   // LETTUCE
    mound(cx, by, 30, 14, mid, hi, lo, (mx, my, mw, mh) => {
      for (let i = 0; i < 34; i++)
        R(x, rng.chance(0.4) ? hi : lo, mx - mw / 2 + 2 + rng.int(mw - 4), my + 1 + rng.int(mh - 4), 2, 4);
    });
  } else if (kind === 'shredH') {                   // CHEESE
    mound(cx, by, 30, 13, mid, hi, lo, (mx, my, mw, mh) => {
      for (let i = 0; i < 22; i++) {
        const sw = 5 + rng.int(8);
        R(x, rng.chance(0.42) ? hi : lo, mx - mw / 2 + 2 + rng.int(Math.max(1, mw - sw - 4)), my + 1 + rng.int(mh - 2), sw, 1);
      }
    });
  } else if (kind === 'dice') {                     // TOMATO / ONION -- real cubes
    const P = [[-11, -13], [-2, -15], [7, -13], [-8, -6], [2, -6], [11, -7]];
    for (const [ox, oy] of P) piece(cx + ox, by + oy, 7, 7, 'cube', mid, hi, lo);
  } else if (kind === 'rings') {                    // JALAPENO
    const P = [[-12, -14], [-2, -16], [8, -14], [-7, -7], [4, -7]];
    for (const [ox, oy] of P) piece(cx + ox, by + oy, 8, 8, 'ring', mid, hi, lo);
  } else if (kind === 'swirl') {                    // CREAM -- one scoop
    mound(cx, by, 22, 14, mid, hi, lo, (mx, my, mw, mh) => {
      for (let r = 1; r <= 2; r++)
        for (let a = 0; a < 22; a++) {
          const th = a / 22 * Math.PI * 2;
          R(x, lo, (mx + Math.cos(th) * r * 4) | 0, (my + mh / 2 + Math.sin(th) * r * 2) | 0, 1, 1);
        }
    });
  } else if (kind === 'sauce') {                    // a CROCK, not a flat field
    const cw = 26, ch = 16, px = cx - cw / 2, py = by - ch + 1;
    R(x, PAL.ink, px - 1, py - 1, cw + 2, ch + 2);
    R(x, STEEL_D, px, py, cw, ch);
    R(x, STEEL_H, px, py, cw, 1);
    R(x, mid, px + 2, py + 3, cw - 4, ch - 5);
    R(x, hi, px + 2, py + 3, cw - 4, 1);
    for (let i = 0; i < 10; i++) R(x, rng.chance(0.5) ? hi : lo, px + 3 + rng.int(cw - 8), py + 4 + rng.int(ch - 8), 2, 1);
    if (seed === 'ROJA') {
      for (let k = 0; k < 9; k++) R(x, PAL.ink, cx + 4 + k, py - 4 - (k >> 1), 2, 2);
      for (let k = 0; k < 9; k++) R(x, STEEL_M, cx + 4 + k, py - 4 - (k >> 1), 1, 1);
      disc(x, cx + 1, py + 8, 5, PAL.ink); disc(x, cx + 1, py + 8, 4, STEEL);
      disc(x, cx + 1, py + 7, 3, shade(mid, -0.2));
    } else if (seed === 'HOT') {
      const bx = px + cw - 10, byy = py - 8;
      R(x, PAL.ink, bx - 1, byy - 1, 10, ch + 8);
      R(x, PAL.bone, bx, byy, 8, ch + 6);
      R(x, shade(PAL.bone, -0.24), bx + 5, byy, 3, ch + 6);
      R(x, mid, bx + 1, byy + 8, 6, ch - 4);
      R(x, PAL.red, bx + 2, byy, 4, 3);
      R(x, PAL.ink, bx + 3, byy - 2, 2, 2);
    } else {
      for (let i = 0; i < 9; i++) {
        const sx = px + 3 + rng.int(cw - 9), sy = py + 4 + rng.int(ch - 9);
        R(x, lo, sx, sy, 4, 3); R(x, hi, sx + 1, sy + 1, 2, 1);
      }
      for (let k = 0; k < 8; k++) R(x, STEEL_M, cx - 10 + k, py - 3 + (k >> 1), 2, 1);
      disc(x, cx - 2, py + 4, 4, STEEL); disc(x, cx - 2, py + 3, 3, STEEL_H);
    }
  } else if (kind === 'stack') {
    const sw = Math.min(ww - 12, 30);
    for (let i = 0; i < 5; i++) {
      const cy2 = by - 4 - i * 3;
      for (let r = 0; r < 6; r++) {
        const t = (r - 2.5) / 3.1;
        const half = Math.round((sw / 2) * Math.sqrt(Math.max(0, 1 - t * t)));
        if (half < 1) continue;
        R(x, PAL.ink, cx - half - 1, cy2 + r, half * 2 + 2, 1);
        R(x, i === 4 ? (r < 3 ? hi : mid) : (r < 2 ? lo : mid), cx - half, cy2 + r, half * 2, 1);
      }
    }
    for (let i = 0; i < 8; i++) R(x, lo, cx - 9 + rng.int(18), by - 15 + rng.int(3), 1, 1);
  } else if (kind === 'shells') {
    for (let i = 0; i < 2; i++)
      shellShape(cx - 8 + i * 16, by - 9, 8, -0.32, mid, hi, lo, rng);
  } else if (kind === 'chips') {
    const P = [[-12, -16], [-1, -18], [9, -15], [-8, -8], [3, -8]];
    for (const [ox, oy] of P) {
      const sx = cx + ox, sy = by + oy, up = (ox + oy) % 2 === 0;
      for (let k = 0; k < 5; k++) {
        const wq = 9 - k * 2, yy = sy + (up ? k : 4 - k);
        R(x, PAL.ink, sx + k - 1, yy, wq + 2, 1);
        R(x, k === 0 ? hi : k === 4 ? lo : mid, sx + k, yy, wq, 1);
      }
    }
  }
}


/* The cursor. It exists because the stick steps cell to cell, so the player
   must always know where they are without hunting -- and it has to survive
   sitting over any of sixteen different ingredient colours, which rules out
   a fill and rules out a hue. It is a bone bracket at every corner plus a
   full keyline: shape, not colour, and it reads on all sixteen. */
function cursor(px, py, w, h) {
  R(x, PAL.ink, px - 2, py - 2, w + 4, 2);          // FRAME, not a fill: a solid
  R(x, PAL.ink, px - 2, py + h, w + 4, 2);          // rect here blanked the very
  R(x, PAL.ink, px - 2, py - 2, 2, h + 4);          // ingredient it was marking
  R(x, PAL.ink, px + w, py - 2, 2, h + 4);
  x.strokeStyle = PAL.amber; x.lineWidth = 1;   // bone merged with the bone
  x.strokeRect(px - 1.5, py - 1.5, w + 3, h + 3);   // plate and died over CREAM
  const k = 7;
  for (const [cx2, cy2, dx, dy] of [
    [px - 2, py - 2, 1, 1], [px + w + 1, py - 2, -1, 1],
    [px - 2, py + h + 1, 1, -1], [px + w + 1, py + h + 1, -1, -1]]) {
    R(x, PAL.amber, cx2 - (dx < 0 ? k - 1 : 0), cy2, k, 2);
    R(x, PAL.amber, cx2, cy2 - (dy < 0 ? k - 1 : 0), 2, k);
  }
}

/* ============================================================
   PREP BOARD  y 164..216
   ============================================================ */
function prepBoard() {
  R(x, WOOD_H, 0, 164, VW, 3);                     // lit front edge of the board
  R(x, shade(WOOD_L, -0.35), 0, 167, VW, 1);
  R(x, WOOD, 0, 168, VW, VH - 168);

  /* The counter is FLAT steel, and that took two attempts.

     It began as one grain loop of 150 random 1px streaks in WOOD_L -- a cool
     grey -- at random x across the full 384, which painted the steel counter
     AND the warm wooden board sitting on top of it. On steel those read as
     scratches; on wood as blue-grey aliasing.

     The fix for that was regular brushing every 4px, and it was worse: at this
     contrast evenly spaced 1px lines across 384px read as venetian blinds, not
     as metal. Texture was never what the surface needed. It is the calm the
     rest of the frame is measured against, and a counter is allowed to be a
     counter -- the vignette and the front edge already give it form. */

  /* Warmth as an ISLAND, the way the reference spends it -- full stainless
     measured within tolerance but drained the frame to sat 27.8. */
  R(x, PAL.ink, BX - 1, 170, BW + 2, VH - 172);
  R(x, PAL.dirt, BX, 171, BW, VH - 174);
  R(x, PAL.porch, BX, 171, BW, 2);
  R(x, PAL.dirtLo, BX, VH - 5, BW, 2);

  /* the board's own grain, in the board's own colours and inside its own edges */
  const rng = makeRng(88);
  for (let i = 0; i < 70; i++) {
    const gy = 174 + rng.int(VH - 183);
    const gx = BX + 2 + rng.int(BW - 14);
    const gw = Math.min(6 + rng.int(22), BX + BW - 2 - gx);
    R(x, rng.chance(0.5) ? shade(PAL.dirt, -0.13) : shade(PAL.dirt, 0.09), gx, gy, gw, 1);
  }
  x.globalAlpha = 0.20; R(x, PAL.ink, 0, VH - 7, VW, 7); x.globalAlpha = 1;

  /* ---- BUILD PROGRESS ------------------------------------------------
     The item name, the stage pips and the picture on the board are ONE
     readout, and it is called Build Progress. They were drawn as three
     unrelated things and placed accordingly, which is how the pips ended up
     90px from the name they belong to.

     The picture is ONE FRAME OF A SEQUENCE, not a decoration. The intent is
     an image per menu item per assembly stage -- a taco at item 1 of 5 looks
     different from the same taco at 4 of 5 -- swapped as the player builds.
     Naming follows that: WELLS.<ITEM><STAGE>, e.g. TACO3. BURRITO is the one
     frame that exists so far.

     Drawn BEFORE the pips: the pips are a readout OF it, and a HUD belongs
     over the world rather than under it. */
  const item = WELLS.BURRITO;
  if (item) x.drawImage(item, (BX + BW / 2 - item.width / 2) | 0,
                              (171 + (VH - 174) / 2 - item.height / 2) | 0);

  /* --- readout, left --- */
  const BUILDING = 'TACO';
  textOut(x, 'NOW BUILDING', 6, 172, PAL.boneDim, 1);
  textOut(x, BUILDING, 6, 182, PAL.bone, 2);
  textOut(x, 'TICKET 1', 6, 200, PAL.amber, 1);
  textOut(x, 'ITEM 3 OF 5', 60, 200, PAL.boneDim, 1);

  /* Stage pips, immediately right of the item name and vertically centred.

     They were over the board, which put the progress readout on the far side
     of the screen from the item name it belongs to -- two halves of one
     sentence, 90px apart. Next to the name they read as part of it.

     The x is DERIVED from the name's width rather than hard-coded, because
     the name is variable: TACO is 46px at scale 2 and TACO SUPREME is 142.
     A guard below catches the case where that pushes them into the board. */
  const NAME_W = textW(BUILDING, 2);
  const pipX = 6 + NAME_W + 7;
  pips(pipX, 182 + 7 - (PIP_W >> 1), [ING.SHELLS[0], ING.BEEF[0], ING.LETTUCE[0], null, null]);
  /* hardTaco() drew the item under construction here. Removed from the frame,
     NOT deleted: it is the shape that finally worked after five rewrites (see
     its own comment), and the item under construction is a real mechanic that
     comes back the moment the Kitchen Shift is built. Deleting it would throw
     away the one drawing in this file with that much argument behind it. */

  /* --- built, right: what this ticket has already produced, on the pass
         tray. The tray is not decoration: measured off the render, the CRT
         vignette takes ~34% of the value at x322, so mid-tone food sitting
         straight on the wood greyed out to mud there. Bright steel behind it
         restores the local contrast -- the same reason the driving HUD can
         put the minimap in a corner under a 42% darkening and still read. */
  /* WRAP IT! -- clears the finished item off the board.

     A BUTTON, not a shelf. The design has always said so: three inputs,
     select / wrap / serve, and wrap and serve are buttons rather than cells
     because a 4-way stick has no spare direction for them. It sits at the
     board's own vertical extent so the bottom row reads as one continuous
     line of work rather than a board with a smaller thing beside it.

     Amber, because in this frame amber already means "the live thing": the
     cursor, the active ticket row. Green is taken -- it is the correct-pick
     plate -- and red is a mis-pick, so neither can carry an action. */
  const TX = BX + BW + 6, TW2 = VW - 4 - TX;
  wrapButton(TX, 170, TW2, VH - 172);
  /* nachos() and wrapped() sat on this tray. Removed from the frame and kept
     for the same reason as hardTaco: BUILT is a real readout of what a ticket
     has produced, and these are what it will hold. The steel stays, because
     the tray is not decoration -- the CRT vignette takes ~34% of the value at
     x322 and food sitting straight on the wood greys out to mud there. */
}

/* The wrap button. Bevelled rather than flat -- the frame has no other
   pressable thing in it, so the affordance has to come from the drawing.

   Two lines at scale 2, not one at scale 1: at 59px wide a single "WRAP IT!"
   fits only at scale 1, where it reads as a caption on a coloured rectangle
   instead of as a control you hit. */
function wrapButton(px, py, w, h) {
  const LINES = ['WRAP', 'IT!'];
  for (const l of LINES) {
    const lw = textW(l, 2);
    if (lw > w - 10) throw new Error(
      `wrap button: "${l}" is ${lw}px at scale 2 in a ${w}px button. ` +
      `Widen it, shorten the word, or drop to scale 1.`);
  }

  /* Bare steel, an amber keyline, brackets at all four corners.

     Three other treatments were drawn and rejected. A solid amber cap read as
     a hazard sign rather than a control -- a saturated slab with ink text is
     the visual language of a warning label, and at this size that is what the
     eye calls it first. A brass push button read better but kept the warm
     cost, and a dark HUD panel read as a readout rather than as a thing you
     press.

     The brackets are why this one works: they are the SAME shape the bin
     cursor uses, so the screen has one grammar for "this is the thing you act
     on" instead of two competing ones. It also spends almost no warm area,
     which the frame needs -- the board beside it is already 177px of wood. */
  R(x, PAL.ink, px, py, w, h);
  R(x, shade(STEEL, -0.24), px + 1, py + 1, w - 2, h - 2);
  R(x, shade(STEEL, -0.10), px + 1, py + 1, w - 2, 1);          // lit top edge
  R(x, shade(STEEL, -0.42), px + 1, py + h - 2, w - 2, 1);

  x.strokeStyle = PAL.amber; x.lineWidth = 1;
  x.strokeRect(px + 2.5, py + 2.5, w - 5, h - 5);
  const k = 7;                                                  // as cursor()
  for (const [bx, by, dx, dy] of [
    [px + 2, py + 2, 1, 1], [px + w - 4, py + 2, -1, 1],
    [px + 2, py + h - 4, 1, -1], [px + w - 4, py + h - 4, -1, -1]]) {
    R(x, PAL.amber, bx - (dx < 0 ? k - 2 : 0), by, k, 2);
    R(x, PAL.amber, bx, by - (dy < 0 ? k - 2 : 0), 2, k);
  }

  const cx = px + w / 2;
  textOut(x, LINES[0], cx, py + 11, PAL.amber, 2, 1);
  textOut(x, LINES[1], cx, py + 26, PAL.amber, 2, 1);
}

/* filled with the ingredient you added, blank for the steps still to come.
   Same chrome as the DELIVERIES bag slots in the driving HUD. */
/* Build Progress stage markers: one pip per assembly step, filled with the
   ingredient that went in and blank for the steps still to come. */
const PIP_W = 8, PIP_G = 1;         // was 11/2; 30% narrower overall

function pips(lx, cy, list) {
  const n = list.length, w = PIP_W, g = PIP_G, tot = n * w + (n - 1) * g;
  /* The readout shares the left region with the board, which starts at x137.
     A long item name pushes the pips right, and nothing else would notice. */
  if (lx + tot > BX - 5) throw new Error(
    `pips: ${n} pips from x${lx} end at ${lx + tot}, and the board starts at ${BX - 1}. ` +
    `A long item name pushes them right -- shorten it, or move the pips.`);
  list.forEach((col, i) => {
    const px = (lx + i * (w + g)) | 0;
    if (col) {
      R(x, PAL.ink, px, cy, w, w);
      R(x, col, px + 1, cy + 1, w - 2, w - 2);
      R(x, shade(col, 0.28), px + 1, cy + 1, w - 2, 1);
      R(x, shade(col, -0.32), px + 1, cy + w - 3, w - 2, 2);
    } else {
      R(x, '#2c2338', px, cy, w, w);
      x.strokeStyle = '#4a4058'; x.lineWidth = 1;
      x.strokeRect(px + 0.5, cy + 0.5, w - 1, w - 1);
    }
  });
}

/* The item under construction: a hard shell filled as far as the pips say.
   The shell's rim stays FLAT and the filling mounds above it -- curving the
   rim up in the middle turns the whole thing into an oval bowl. */
function hardTaco(cx, cy) {
  /* A TILTED CRESCENT, not an upright U. Every symmetric U I tried read as
     a vessel -- 48x14 a salad dish, 30x15 a plant pot, 26x22 a bucket -- and
     no amount of shading fixes that, because a symmetric U with a flat top
     IS a bowl. What says "hard taco" is the half-disc cut on a diagonal with
     the filling running along the cut. Half-disc, cut at -18 degrees. */
  const RR = 15, th = -0.32;
  const dxa = Math.cos(th), dya = Math.sin(th);      // along the cut
  const nx = -Math.sin(th), ny = Math.cos(th);       // into the shell
  const [sm, sh, sl] = ING.SHELLS;
  const rng = makeRng(31);
  R(x, 'rgba(12,8,20,0.34)', cx - 11, cy + 14, 23, 3);

  const shellAt = (px, py, m) =>
    Math.hypot(px, py) <= RR + m && px * nx + py * ny >= -0.5 - m;
  const fillAt = (px, py, m) => {
    const along = px * dxa + py * dya, off = px * nx + py * ny;
    return off < 1.5 + m && off > -7 - m && Math.abs(along) < RR - 1 + m;
  };

  for (let py = -RR - 9; py <= RR + 3; py++)         // ink silhouette
    for (let px = -RR - 3; px <= RR + 3; px++)
      if (shellAt(px, py, 1) || fillAt(px, py, 1)) R(x, PAL.ink, cx + px, cy + py, 1, 1);

  for (let py = -RR - 9; py <= RR + 3; py++) {
    for (let px = -RR - 3; px <= RR + 3; px++) {
      const d = Math.hypot(px, py), off = px * nx + py * ny, along = px * dxa + py * dya;
      let col = null;
      if (shellAt(px, py, 0)) {
        col = d > RR - 2 ? sl : off < 3 ? sh : sm;   // lit rim, shaded belly
        if (d > RR - 4 && along > 3) col = sl;
        if (rng.chance(0.07)) col = sl;              // toasted flecks
      }
      if (fillAt(px, py, 0)) {
        const t = rng();
        const ing = t > 0.50 ? ING.LETTUCE : t > 0.28 ? ING.BEEF
                  : t > 0.13 ? ING.CHEESE : ING.TOMATO;
        col = ing[rng.chance(0.42) ? 1 : 0];
      }
      if (col) R(x, col, cx + px, cy + py, 1, 1);
    }
  }
}

function nachos(cx, by) {
  const rng = makeRng(7);
  disc(x, cx, by - 6, 15, PAL.ink);
  disc(x, cx, by - 6, 14, PAL.bone);
  disc(x, cx, by - 7, 11, shade(PAL.bone, -0.12));
  for (let i = 0; i < 22; i++) {                    // chips: triangles, not bricks
    const a = rng() * Math.PI * 2, r = rng() * 13;
    const px = (cx + Math.cos(a) * r) | 0, py = (by - 10 + Math.sin(a) * 6) | 0;
    const up = rng.chance(0.5);
    for (let k = 0; k < 4; k++) {
      const wq = 7 - k * 2, yy = py + (up ? k : 3 - k);
      R(x, PAL.ink, px + k - 1, yy, wq + 2, 1);
      R(x, k === 0 ? ING.SHELLS[1] : k === 3 ? ING.SHELLS[2] : ING.SHELLS[0], px + k, yy, wq, 1);
    }
  }
  for (let i = 0; i < 26; i++) {
    const a = rng() * Math.PI * 2, r = rng() * 11;
    const px = (cx + Math.cos(a) * r) | 0, py = (by - 10 + Math.sin(a) * 5) | 0;
    const c = rng.chance(0.5) ? ING.CHEESE : rng.chance(0.5) ? ING.BEEF : ING.TOMATO;
    R(x, c[0], px, py, 3, 2);
    R(x, c[1], px, py, 2, 1);
  }
}

/* A finished burrito on the board. Just the food: a paper band and grey
   ends turned it into a marker pen. What reads as a burrito is a plump
   tortilla capsule with the overlap seam and the tucked ends showing. */
function wrapped(cx, by) {
  /* Warmer than the tortilla bin's cream, or it greys out next to the bone
     plate and reads as a log. The diagonal overlap seam and the folded ends
     are what make a capsule a burrito. */
  const HW = 16, h = 16, py = by - h, mid = (h - 1) / 2;
  /* High contrast on purpose: this sits well out toward the CRT vignette,
     which puts a third of a stop of darkness over it, and mid-tones there
     turn to grey mush. Rounded caps, cylinder shading, ONE seam -- the
     symmetric "tucked end" strokes converged into a dark X across the body. */
  const TH = '#fff2c8', TU = '#f2dcac', TM = '#e8c894', TL = '#b08a52', TX = '#8a6a3c';
  const rng = makeRng(19);
  const lean = (r) => Math.round((r - mid) * -0.40);
  const hwAt = (r) => Math.round(HW * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs((r - mid) / mid), 2.4))));
  R(x, 'rgba(12,8,20,0.34)', cx - HW + 2, by, HW * 2 - 4, 3);

  for (let r = 0; r < h; r++) {
    const hw = hwAt(r); if (hw < 1) continue;
    const y = py + r, o = cx + lean(r);
    R(x, PAL.ink, o - hw - 1, y, hw * 2 + 2, 1);
    R(x, r < 2 ? TH : r < 5 ? TU : r < h - 4 ? TM : TL, o - hw, y, hw * 2, 1);
    if (hw > 6) {                                   // the ends turning away
      R(x, r < 4 ? TU : TL, o - hw, y, 3, 1);
      R(x, r < 4 ? TU : TX, o + hw - 3, y, 3, 1);
    }
  }
  for (let r = 3; r < h - 2; r++) {                 // the overlap seam
    const hw = hwAt(r), o = cx + lean(r);
    if (hw > 5) R(x, TL, o - hw + 5 + Math.round((r - 3) * 1.1), py + r, 2, 1);
  }
  for (let i = 0; i < 5; i++) {                     // a few griddle blisters
    const r = 4 + rng.int(h - 9), hw = hwAt(r);
    if (hw > 8) R(x, TX, cx + lean(r) - hw + 7 + rng.int(hw * 2 - 14), py + r, 2, 1);
  }
}

/* ============================================================
   HUD -- the driving shift's own card, unchanged but for the third
   row: ERRORS, drawn as floor(mistakes / 3).
   ============================================================ */
function hud() {
  const pw = 128, px0 = VW - pw + 1;
  R(x, 'rgba(10,6,16,0.50)', VW - pw - 1, 6, pw, 44);   // hovers over the room
  Hud.panel(x, VW - pw - 3, 3, pw, 44, '#6b5f84');
  text(x, 'SHIFT', px0, 8, PAL.boneDim, 1);
  text(x, clockStr(96), VW - 7, 5, PAL.bone, 2, 2);
  text(x, 'PAID', px0, 23, PAL.boneDim, 1);
  text(x, money(1275), VW - 7, 20, PAL.good, 2, 2);
  /* ERRORS, not a continuous bar: the score docks a star per THREE mistakes,
     so the meter is three segments and each filled one is a star already
     lost. The bar is the scoring term, drawn. */
  text(x, 'ERRORS', px0, 37, PAL.boneDim, 1);
  const MIS = 4, SEGW = 23;
  R(x, '#1b1425', px0 + 44, 36, 72, 5);
  for (let i = 0; i < 3; i++) {
    const sx = px0 + 45 + i * (SEGW + 1);
    R(x, '#3a3050', sx, 37, SEGW, 3);                       // an EMPTY segment has
    R(x, '#2a2338', sx + 1, 38, SEGW - 2, 1);               // to read as a segment,
    const got = Math.max(0, Math.min(3, MIS - i * 3));      // or three stars at
    if (got) R(x, got === 3 ? PAL.bad : '#e07a1f', sx, 37, Math.round(SEGW * got / 3), 3);
  }

}

/* ============================================================ */
wall();
pantry();
overheadView();
rail();
TICKETS.forEach(ticket);
steamTable();
prepBoard();
hud();
if (process.env.DIALOG) drawDialog(x, {
  who: 'CUSTOMER',
  line: "I HAVEN'T GOT ALL DAY, SWEETHEART.",
  sub: 'TICKET 1  -  WALKING OUT',
  meter: 0.18, hostile: 1,
  /* DIALOG=1 draws the parametric face, DIALOG=smoker the baked one, so the
     strip can be checked against both kinds without editing this file */
  face: process.env.DIALOG === 'smoker'
    ? Object.assign({}, CAST.smoker, { hood: 3 })
    : { skin: '#eab98f', hair: '#d9a340', eyes: '#4a7fb5', shirt: '#c4557e',
        bigHair: 1, lips: 1, mood: 'sour', seed: 3 },
});
Post.apply(x);

writePNG(c, OUT(process.env.DIALOG ? 'kitchen-dialogue.png' : 'kitchen.png'));
writePNG(upscale(c, 3), OUT(process.env.DIALOG ? 'kitchen-dialogue-x3.png' : 'kitchen-x3.png'));
console.log('rendered kitchen.png (384x216) and kitchen-x3.png (1152x648)');
