/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   -------------------------------------------------------------- */
/* crop.mjs <x> <y> <w> <h> <zoom> -- pull a region out of kitchen.png and
   blow it up nearest-neighbour, so small sprites can be judged honestly. */
import { Canvas, writePNG, upscale } from './px.mjs';
import { inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';
const OUT = (n) => _j(_d(_f(import.meta.url)), n);   // write beside this file

function readPNG(path) {
  const b = readFileSync(path);
  let i = 8, w = 0, h = 0, idat = [];
  while (i < b.length) {
    const len = b.readUInt32BE(i), type = b.toString('latin1', i + 4, i + 8);
    if (type === 'IHDR') { w = b.readUInt32BE(i + 8); h = b.readUInt32BE(i + 12); }
    if (type === 'IDAT') idat.push(b.subarray(i + 8, i + 8 + len));
    i += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const out = new Canvas(w, h), stride = w * 4;
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    if (f !== 0) throw new Error('unexpected PNG filter ' + f);
    for (let k = 0; k < stride; k++) out.data[y * stride + k] = raw[y * (stride + 1) + 1 + k];
  }
  return out;
}

const [cx, cy, cw, ch, z] = process.argv.slice(2).map(Number);
const src = readPNG(process.env.SRC || _j(_d(_f(import.meta.url)), '..', '..', 'reference', 'kitchen', 'kitchen.png'));
const cut = new Canvas(cw, ch);
for (let y = 0; y < ch; y++) for (let k = 0; k < cw * 4; k++)
  cut.data[y * cw * 4 + k] = src.data[(y + cy) * src.width * 4 + cx * 4 + k];
writePNG(upscale(cut, z), 'crop.png');
console.log(`crop.png = ${cw}x${ch} at (${cx},${cy}) x${z}`);
