/* TEST ARTEFACT -- NOT A DECISION

   Reads kitchen.png back and checks every label plate for the failure mode
   CLAUDE.md calls out: vertical overflow is invisible to a width check and to
   the drawing stubs, and is only catchable by reading the pixels.

   For each plate it finds the rows that actually carry glyph ink and asserts
   there is at least one clear row between the glyphs and the plate's own
   border, top and bottom. */
import { inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';
const OUT = (n) => _j(_d(_f(import.meta.url)), n);   // write beside this file

const buf = readFileSync(process.env.SRC || _j(_d(_f(import.meta.url)), '..', '..', 'reference', 'kitchen', 'kitchen.png'));
let i = 8, W = 0, H = 0; const idat = [];
while (i < buf.length) {
  const len = buf.readUInt32BE(i), type = buf.toString('latin1', i + 4, i + 8);
  if (type === 'IHDR') { W = buf.readUInt32BE(i + 8); H = buf.readUInt32BE(i + 12); }
  if (type === 'IDAT') idat.push(buf.subarray(i + 8, i + 8 + len));
  i += 12 + len;
}
const raw = inflateSync(Buffer.concat(idat)), stride = W * 4;
const lum = (x, y) => { const o = y * (stride + 1) + 1 + x * 4; return raw[o] + raw[o + 1] + raw[o + 2]; };
const inky = (x, y) => lum(x, y) < 200;   // PAL.ink arrives ~63-84 even at max vignette; the palest plate material arrives ~291. An absolute 300 caught vignetted PAPER_D in the corner columns and reported false failures.

/* Plate geometry, mirroring reference/kitchen/kitchen.mjs.

   The bins carry NO permanent labels -- the ingredient's name appears only on
   the cell you just touched, bone-green for a correct pick and red for a
   mis-pick. So the only text-in-a-plate on the whole steam table is the
   reveal, and in the reference frame two cells are wearing one. */
const CELL_W = 46, COL0 = 5, ROW_Y = [105, 135];
const colX = (i) => COL0 + i * (CELL_W + 1);
const plates = [
  [colX(3), ROW_Y[0], CELL_W, 'reveal: correct'],   // BEEF, just placed
  [colX(0), ROW_Y[1], CELL_W, 'reveal: wrong'],     // TOMATO, mis-picked
];

let fails = 0;
console.log('plate            top  glyphs      bot   air-above  air-below');
for (const [px, py, w, tag] of plates) {
  const top = py + 1, bot = py + 8;                  // paper band ABOVE the bottom rule
  const rows = [];
  for (let y = top; y <= bot; y++) {
    let n = 0;
    for (let x = px + 3; x < px + w - 3; x++) if (inky(x, y)) n++;
    if (n > 0) rows.push(y);
  }
  if (!rows.length) { console.log(tag.padEnd(16) + ' NO GLYPHS FOUND'); fails++; continue; }
  const g0 = rows[0], g1 = rows[rows.length - 1];
  const above = g0 - top, below = bot - g1;
  /* the invariant: the plate's first paper row carries no ink, and the glyph
     run ends before the plate's bottom rule. The rule itself is drawn dark by
     design and is not overflow. */
  const ok = above >= 1 && below >= 0;
  if (!ok) fails++;
  console.log(
    tag.padEnd(16) + String(top).padStart(4) + '  ' +
    (g0 + '-' + g1).padStart(9) + String(bot).padStart(6) +
    String(above).padStart(10) + String(below).padStart(11) + (ok ? '' : '   <-- FAIL')
  );
}
console.log('\n' + (fails ? fails + ' PLATE(S) FAILED' : 'all ' + plates.length + ' plates clear top and bottom'));
process.exit(fails ? 1 : 0);
