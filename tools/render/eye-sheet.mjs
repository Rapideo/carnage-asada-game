/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   eye-sheet.mjs -- a face at 8x on a labelled pixel grid, for setting eye
   rects by hand.

     node tools/render/eye-sheet.mjs <outDir> <key> [key...]

   For each key it reads content/faces/<key>.json and writes <outDir>/<key>.png:

     left   the face at 8x. A faint line on every face-pixel edge, a magenta
            line every 5 (stronger every 10). The numbers along all four edges
            sit over the cell they name, so the cell under "25" is pixel 25.
            Any eye rects the face already has are outlined in green, on the
            cell edges, so a rect [x, y, w, h] covers exactly the cells inside
            the outline.
     right  the face at 4x as the game draws it, open and then blinking
            (drawFace with blink: 1, the same overlay src/35_faces.js paints),
            so a rect that spills onto a brow or a frame shows up as a lid in
            the wrong place.

   A rect cannot be judged by its numbers; that is why this exists. Look at it.
   -------------------------------------------------------------- */
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas, upscale, writePNG } from './px.mjs';
import { decodeFace, drawFace } from '../../reference/kitchen/facedata.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const [outDir, ...keys] = process.argv.slice(2);
if (!outDir || !keys.length) {
  console.error('usage: node tools/render/eye-sheet.mjs <outDir> <key> [key...]');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const Z = 8;            // grid zoom
const P = 4;            // preview zoom
const M = 24;           // margin round the grid, for the numbers
const GAP = 20;

/* a 3x5 digit font, drawn at 2x */
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
             '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
const DS = 2, DADV = 4 * DS;
function digits(x, s, px, py, col) {
  x.fillStyle = col;
  for (let i = 0; i < s.length; i++) {
    const g = DIG[+s[i]];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++)
      if (g[r * 3 + c] === '1') x.fillRect(px + i * DADV + c * DS, py + r * DS, DS, DS);
  }
}
const textW = (s) => s.length * DADV - DS;

function sheet(key) {
  const f = JSON.parse(readFileSync(join(REPO, 'content', 'faces', key + '.json'), 'utf8'));
  const face = decodeFace(f);
  const W = f.w, H = f.h, GW = W * Z, GH = H * Z;
  const eyes = f.eyes || [];
  let band = null;
  if (eyes.length) {
    const x0 = Math.max(0, Math.min(...eyes.map((e) => e[0])) - 4), y0 = Math.max(0, Math.min(...eyes.map((e) => e[1])) - 4);
    const x1 = Math.min(W, Math.max(...eyes.map((e) => e[0] + e[2])) + 4), y1 = Math.min(H, Math.max(...eyes.map((e) => e[1] + e[3])) + 3);
    band = [x0, y0, Math.min(x1 - x0, Math.floor(W * P / Z)), y1 - y0];
  }
  const out = new Canvas(M + GW + M + GAP + W * P + M,
    Math.max(M + GH + M, M + 2 * H * P + GAP + 6 + 20 + (band ? band[3] * Z : 0) + M));
  const x = out.getContext('2d');
  x.fillStyle = '#20202a'; x.fillRect(0, 0, out.width, out.height);

  /* the grid panel: a flat mid grey shows what is transparent */
  x.fillStyle = '#7a7a86'; x.fillRect(M, M, GW, GH);
  x.drawImage(upscale(face, Z), M, M);

  for (let i = 0; i <= W; i++) {
    x.fillStyle = i % 10 === 0 ? 'rgba(255,0,255,0.95)' : i % 5 === 0 ? 'rgba(255,0,255,0.55)' : 'rgba(0,0,0,0.22)';
    x.fillRect(M + i * Z, M, 1, GH);
  }
  for (let j = 0; j <= H; j++) {
    x.fillStyle = j % 10 === 0 ? 'rgba(255,0,255,0.95)' : j % 5 === 0 ? 'rgba(255,0,255,0.55)' : 'rgba(0,0,0,0.22)';
    x.fillRect(M, M + j * Z, GW, 1);
  }

  /* numbers over the cell they name, on all four edges */
  for (let i = 0; i < W; i += 5) {
    const s = String(i), tx = M + i * Z + (Z >> 1) - (textW(s) >> 1);
    digits(x, s, tx, M - 14, '#e8e8f0');
    digits(x, s, tx, M + GH + 4, '#e8e8f0');
  }
  for (let j = 0; j < H; j += 5) {
    const s = String(j), ty = M + j * Z + (Z >> 1) - 5;
    digits(x, s, M - 4 - textW(s), ty, '#e8e8f0');
    digits(x, s, M + GW + 4, ty, '#e8e8f0');
  }

  /* the eye rects, outlined on the cell edges */
  x.fillStyle = '#00ff3c';
  for (const [ex, ey, ew, eh] of f.eyes || []) {
    const X = M + ex * Z, Y = M + ey * Z, w = ew * Z, h = eh * Z;
    x.fillRect(X, Y, w, 2); x.fillRect(X, Y + h - 2, w, 2);
    x.fillRect(X, Y, 2, h); x.fillRect(X + w - 2, Y, 2, h);
  }

  /* the previews: open, then blinking, as the game paints them */
  const PX = M + GW + M + GAP;
  for (const [n, blink] of [[0, 0], [1, 1]]) {
    const c = new Canvas(W, H), cx = c.getContext('2d');
    cx.fillStyle = '#7a7a86'; cx.fillRect(0, 0, W, H);
    drawFace(cx, face, f, W >> 1, 0, { blink });
    x.drawImage(upscale(c, P), PX, M + n * (H * P + GAP));
  }

  /* the lid colour, as a swatch under the previews */
  const sy = M + 2 * H * P + GAP + 6;
  x.fillStyle = f.skin; x.fillRect(PX, sy, 32, 12);

  /* and the blink again, close up at 8x round the eyes: a lid that lands
     on a brow or a frame is a few pixels at 4x and obvious here */
  if (band) {
    const [bx, by, bw, bh] = band, c = new Canvas(W, H), cx = c.getContext('2d');
    cx.fillStyle = '#7a7a86'; cx.fillRect(0, 0, W, H);
    drawFace(cx, face, f, W >> 1, 0, { blink: 1 });
    const cut = new Canvas(bw, bh);
    for (let y = 0; y < bh; y++) for (let k = 0; k < bw * 4; k++)
      cut.data[y * bw * 4 + k] = c.data[(y + by) * W * 4 + bx * 4 + k];
    x.drawImage(upscale(cut, Z), PX, sy + 20);
  }

  const path = join(outDir, key + '.png');
  writePNG(out, path);
  console.log(`${key}  eyes ${JSON.stringify(f.eyes || [])}  skin ${f.skin}  -> ${path}`);
}

/* --rows y0-y1 also prints those rows as palette indices (hex; '.' clear),
   with x numbered across the top: the exact edge of a lash or a lid, where the
   picture leaves you choosing between two cells. */
function dump(key, y0, y1) {
  const f = JSON.parse(readFileSync(join(REPO, 'content', 'faces', key + '.json'), 'utf8'));
  const idx = [];
  for (let i = 0; i < f.pix.length; i += 2) {
    const n = L64.indexOf(f.pix[i + 1]);
    for (let k = 0; k < n; k++) idx.push(f.pix[i]);
  }
  const lum = (h) => Math.round(0.299 * parseInt(h.slice(1, 3), 16) + 0.587 * parseInt(h.slice(3, 5), 16) + 0.114 * parseInt(h.slice(5, 7), 16));
  console.log('  pal ' + f.pal.map((c, i) => `${i.toString(16)}=${c}(${lum(c)})`).join(' '));
  console.log('     ' + Array.from({ length: f.w }, (_, i) => (i % 10 === 0 ? String(i / 10) : ' ')).join(''));
  console.log('     ' + Array.from({ length: f.w }, (_, i) => String(i % 10)).join(''));
  for (let y = y0; y <= y1; y++) console.log(String(y).padStart(3) + '  ' + idx.slice(y * f.w, (y + 1) * f.w).join(''));
}
const L64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';

const ri = keys.indexOf('--rows');
let rows = null;
if (ri >= 0) { rows = keys[ri + 1].split('-').map(Number); keys.splice(ri, 2); }
for (const k of keys) { sheet(k); if (rows) dump(k, rows[0], rows[1]); }
