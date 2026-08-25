/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   png-read.mjs -- decode a PNG that we did NOT write.

   `crop.mjs` had a reader that assumed filter 0 on every scanline, which is
   true only of `px.mjs` output. Anything produced by a real encoder uses
   adaptive filtering per row and will throw or decode to garbage. This handles
   filters 0-4 and colour types 0/2/3/4/6 at 8-bit depth, non-interlaced, which
   is every PNG a reference image is likely to arrive as.

   Returns a px.mjs Canvas, so decoded pixels go straight into the same
   pipeline as everything else here. */
import { inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { Canvas } from './px.mjs';

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

export function readPNG(path) {
  const b = readFileSync(path);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(path + ': not a PNG');

  let w = 0, h = 0, depth = 0, ct = 0, interlace = 0;
  const idat = [];
  let plte = null, trns = null;

  for (let i = 8; i < b.length;) {
    const len = b.readUInt32BE(i), type = b.toString('latin1', i + 4, i + 8);
    const data = b.subarray(i + 8, i + 8 + len);
    if (type === 'IHDR') {
      w = b.readUInt32BE(i + 8); h = b.readUInt32BE(i + 12);
      depth = b[i + 16]; ct = b[i + 17]; interlace = b[i + 20];
    } else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    i += 12 + len;
  }

  if (depth !== 8) throw new Error(`${path}: ${depth}-bit not supported, only 8`);
  if (interlace) throw new Error(`${path}: interlaced PNGs not supported`);
  const nch = CHANNELS[ct];
  if (!nch) throw new Error(`${path}: colour type ${ct} not supported`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * nch;
  const cur = Buffer.alloc(stride), prev = Buffer.alloc(stride);
  const out = new Canvas(w, h);

  let p = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[p++];
    raw.copy(cur, 0, p, p + stride); p += stride;

    /* unfilter in place. a = left, b = up, c = up-left, all in BYTES, which is
       why the back-reference is nch and not 1. */
    for (let k = 0; k < stride; k++) {
      const a = k >= nch ? cur[k - nch] : 0, bb = prev[k], c = k >= nch ? prev[k - nch] : 0;
      let v = cur[k];
      if (filter === 1) v += a;
      else if (filter === 2) v += bb;
      else if (filter === 3) v += (a + bb) >> 1;
      else if (filter === 4) {                       // Paeth
        const pp = a + bb - c, pa = Math.abs(pp - a), pb = Math.abs(pp - bb), pc = Math.abs(pp - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc) ? bb : c;
      } else if (filter !== 0) throw new Error(`${path}: bad filter ${filter} on row ${y}`);
      cur[k] = v & 255;
    }
    cur.copy(prev);

    for (let px = 0; px < w; px++) {
      const s = px * nch, d = (y * w + px) * 4;
      let r, g, bl, al = 255;
      if (ct === 0)      { r = g = bl = cur[s]; }
      else if (ct === 4) { r = g = bl = cur[s]; al = cur[s + 1]; }
      else if (ct === 3) {
        const idx = cur[s];
        if (!plte) throw new Error(path + ': indexed PNG with no PLTE');
        r = plte[idx * 3]; g = plte[idx * 3 + 1]; bl = plte[idx * 3 + 2];
        if (trns && idx < trns.length) al = trns[idx];
      }
      else { r = cur[s]; g = cur[s + 1]; bl = cur[s + 2]; if (ct === 6) al = cur[s + 3]; }
      out.data[d] = r; out.data[d + 1] = g; out.data[d + 2] = bl; out.data[d + 3] = al;
    }
  }
  return out;
}
