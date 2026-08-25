/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   -------------------------------------------------------------- */
/* crop.mjs <x> <y> <w> <h> <zoom> -- pull a region out of kitchen.png and
   blow it up nearest-neighbour, so small sprites can be judged honestly. */
import { Canvas, writePNG, upscale } from './px.mjs';
import { readPNG } from './png-read.mjs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';
const OUT = (n) => _j(_d(_f(import.meta.url)), n);   // write beside this file

/* The reader used to live here and understood only filter-0 scanlines, which
   is what px.mjs writes and nothing else does -- pointing SRC at any outside
   image threw. png-read.mjs handles real encoder output, so there is one
   decoder rather than two that disagree. */

const [cx, cy, cw, ch, z] = process.argv.slice(2).map(Number);
const src = readPNG(process.env.SRC || _j(_d(_f(import.meta.url)), '..', '..', 'reference', 'kitchen', 'kitchen.png'));
const cut = new Canvas(cw, ch);
for (let y = 0; y < ch; y++) for (let k = 0; k < cw * 4; k++)
  cut.data[y * cw * 4 + k] = src.data[(y + cy) * src.width * 4 + cx * 4 + k];
writePNG(upscale(cut, z), OUT('crop.png'));
console.log(`crop.png = ${cw}x${ch} at (${cx},${cy}) x${z}`);
