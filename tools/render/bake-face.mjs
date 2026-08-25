/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   bake-face.mjs -- reference PNG in, source data table out.

       node tools/render/bake-face.mjs <name> <src.png> <x> <y> <w> <h>

   Writes reference/kitchen/faces/<name>.mjs, then DECODES IT AGAIN with the
   shipped decoder and asserts the result is pixel-identical to what was
   reduced. That round trip is the whole guard: an encoder and a decoder that
   disagree produce a face that is subtly wrong everywhere and looks like bad
   art rather than like a bug.
*/
import { readPNG } from './png-read.mjs';
import { reduceHead, hex } from './reduce.mjs';
import { decodeFace, L64 } from '../../reference/kitchen/facedata.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';

const HERE = _d(_f(import.meta.url));
const FACES = _j(HERE, '..', '..', 'reference', 'kitchen', 'faces');

const [name, src, ...rest] = process.argv.slice(2);
if (!name || !src) {
  console.error('usage: bake-face.mjs <name> <src.png> [x y w h]');
  process.exit(1);
}
const crop = rest.length >= 4 ? rest.slice(0, 4).map(Number) : null;

const img = readPNG(src);
const INK = '#1b1425';
/* 15 colours, not 16: the ink keyline needs the sixteenth slot, and a symbol
   is one hex digit, so seventeen entries would need a wider alphabet for no
   gain a face at this size can show. */
/* MAXW/MAXH override the head budget. The 56x56 box is the minimap's rect
   reused, which is a convenience and not a law -- a bust needs a taller box,
   and the box is allowed to grow if the screen can pay for it. */
const MAXW = Number(process.env.MAXW) || 54;
const MAXH = Number(process.env.MAXH) || 54;
const { cv } = reduceHead(img, crop || [0, 0, img.width, img.height],
                          { maxW: MAXW, maxH: MAXH, colours: 15, ink: INK });

/* ---- palette from what actually survived ------------------ */
const seen = new Map();
for (let i = 0; i < cv.data.length; i += 4) {
  if (!cv.data[i + 3]) continue;
  const k = hex([cv.data[i], cv.data[i + 1], cv.data[i + 2]]);
  seen.set(k, (seen.get(k) || 0) + 1);
}
const pal = [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
if (pal.length > 16) throw new Error(`${name}: ${pal.length} colours survived, 16 is the cap`);
const idx = new Map(pal.map((c, i) => [c, i]));

/* ---- per-row RLE ------------------------------------------ */
let pix = '';
let runs = 0;
for (let y = 0; y < cv.height; y++) {
  let sym = null, len = 0;
  const flush = () => {
    while (len > 0) {                            // 63 is the alphabet's limit
      const n = Math.min(len, 63);
      pix += sym + L64[n]; runs++; len -= n;
    }
  };
  for (let x = 0; x < cv.width; x++) {
    const i = (y * cv.width + x) * 4;
    const s = cv.data[i + 3] ? idx.get(hex([cv.data[i], cv.data[i + 1], cv.data[i + 2]])).toString(16) : '.';
    if (s === sym) len++; else { flush(); sym = s; len = 1; }
  }
  flush();
}

/* ---- find the eyes ----------------------------------------
   The whites are the brightest thing on a face and they are the only pair of
   bright blobs in its upper half -- the cigarette paper is just as bright but
   is below the nose, which is why the search is bounded. Detected rather than
   authored so a new character costs one command; override in cast.mjs when it
   guesses wrong. */
const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
function rgbOf(h) { return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); }

/* Only the TOP luminance band, not "bright" in absolute terms. A lit forehead
   on light skin sits at 175 and an eye white at 194, so an absolute threshold
   selects the whole face and the detector returns a 22x22 "eye". What
   separates a white from skin is that nothing else is as bright as it. */
const lums = pal.map((c) => lum(rgbOf(c)));
const peak = Math.max(...lums);
const bright = lums.map((v, i) => [i, v]).filter(([, v]) => v >= peak - 15).map(([i]) => i);

const limit = Math.round(cv.height * 0.62);
const mark = new Int32Array(cv.width * cv.height).fill(-1);
const blobs = [];
for (let y = 0; y < limit; y++) for (let x = 0; x < cv.width; x++) {
  const p = y * cv.width + x, i = p * 4;
  if (mark[p] !== -1 || !cv.data[i + 3]) continue;
  const c = hex([cv.data[i], cv.data[i + 1], cv.data[i + 2]]);
  if (!bright.includes(idx.get(c))) continue;
  const st = [p], id = blobs.length; mark[p] = id;
  let x0 = x, x1 = x, y0 = y, y1 = y, n = 0;
  while (st.length) {
    const q = st.pop(); n++;
    const qx = q % cv.width, qy = (q / cv.width) | 0;
    if (qx < x0) x0 = qx; if (qx > x1) x1 = qx;
    if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = qx + dx, ny = qy + dy;
      if (nx < 0 || ny < 0 || nx >= cv.width || ny >= limit) continue;
      const r = ny * cv.width + nx, ri = r * 4;
      if (mark[r] !== -1 || !cv.data[ri + 3]) continue;
      const rc = hex([cv.data[ri], cv.data[ri + 1], cv.data[ri + 2]]);
      if (!bright.includes(idx.get(rc))) continue;
      mark[r] = id; st.push(r);
    }
  }
  blobs.push({ n, r: [x0, y0, x1 - x0 + 1, y1 - y0 + 1] });
}
/* size sanity: an eye white at this scale is a few px across. Anything larger
   is a lit plane of the face, and letting it through silently produces a blink
   that repaints half the head. */
const plausible = (b) => b.n >= 2 && b.n <= 40 && b.r[2] <= 12 && b.r[3] <= 8;

/* Grow the detected white into the SOCKET. What gets found is only the sclera,
   and on a heavy-lidded face that is three pixels tall -- closing exactly that
   changes almost nothing on screen, which is how a blink ends up invisible.
   The lid has to travel over the iris and the lash line too, so the rect is
   padded outward and upward before it is stored. */
const pad = (r) => [
  Math.max(0, r[0] - 1),
  Math.max(0, r[1] - 2),
  Math.min(cv.width - Math.max(0, r[0] - 1), r[2] + 2),
  Math.min(cv.height - Math.max(0, r[1] - 2), r[3] + 3),
];
/* Pick the PAIR that is most level, not the two biggest.
   Biggest-two works on a head and fails on a bust, because a bust brings a
   white collar into frame and a collar is a bigger white blob than an eye. Two
   eyes are at the same height and a hand's width apart; a collar is nowhere
   near the level of anything. Scored, so the pairing has to beat alternatives
   rather than merely being present. */
const cand = blobs.filter(plausible);
let pair = null, bestScore = -1e9;
for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) {
  const a = cand[i].r, b = cand[j].r;
  const dy = Math.abs(a[1] - b[1]);
  const dx = Math.abs(a[0] - b[0]);
  if (dy > 4) continue;                        // not level -> not a pair of eyes
  if (dx < 3 || dx > cv.width * 0.7) continue; // too close, or opposite corners
  const score = (cand[i].n + cand[j].n) - dy * 6;
  if (score > bestScore) { bestScore = score; pair = [cand[i], cand[j]]; }
}
const eyes = (pair || cand.sort((a, b) => b.n - a.n).slice(0, 2))
  .sort((a, b) => a.r[0] - b.r[0]).map((b) => pad(b.r));
if (!pair) console.warn('  ! no level pair found -- eyes are a guess, set them in cast.mjs');
if (eyes.length < 2)
  console.warn(`  ! found ${eyes.length} eye(s) -- set \`eyes\` by hand in cast.mjs`);

/* skin for the blink fill: the commonest colour that is neither ink nor a white */
const skin = pal.find((c, i) => i > 0 && c !== INK && lum(rgbOf(c)) > 110 && !bright.includes(i))
  || pal[0];

/* ---- write ------------------------------------------------ */
mkdirSync(FACES, { recursive: true });
const out = `/* GENERATED by tools/render/bake-face.mjs -- do not hand-edit.
   Re-bake instead:
     node tools/render/bake-face.mjs ${name} <src.png>${crop ? ' ' + crop.join(' ') : ''}

   The likeness is data; the variation is code (see facedata.mjs). Nothing here
   is fetched -- it decodes at boot, the same way GLYPH and LOGO do. */
export default {
  name: '${name.toUpperCase()}',
  w: ${cv.width}, h: ${cv.height},
  ink: '${INK}',
  skin: '${skin}',
  eyes: ${JSON.stringify(eyes)},
  pal: ${JSON.stringify(pal)},
  pix: '${pix}',
};
`;
const dest = _j(FACES, name + '.mjs');
writeFileSync(dest, out);

/* Also emit it as content. `content/*.json` is where this project keeps data
   that build.mjs inlines and validates -- it is never fetched, because the
   artifact runs under a CSP that blocks external hosts and fetch() on a
   file:// page is blocked by CORS anyway. A baked face is exactly that shape,
   so it goes there rather than inventing a second pipeline beside it. */
const CONTENT_FACES = _j(HERE, '..', '..', 'content', 'faces');
mkdirSync(CONTENT_FACES, { recursive: true });
writeFileSync(_j(CONTENT_FACES, name + '.json'), JSON.stringify({
  name: name.toUpperCase(),
  w: cv.width, h: cv.height,
  ink: INK, skin,
  eyes,
  pal,
  pix,
}, null, 2) + '\n');

/* ---- round trip, against the SHIPPED decoder -------------- */
const face = (await import('file://' + dest.replace(/\\/g, '/'))).default;
const back = decodeFace(face);
let bad = 0;
for (let i = 0; i < cv.data.length; i += 4) {
  const a = cv.data[i + 3] ? [cv.data[i], cv.data[i + 1], cv.data[i + 2]] : null;
  const b = back.data[i + 3] ? [back.data[i], back.data[i + 1], back.data[i + 2]] : null;
  if (!a !== !b || (a && (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]))) bad++;
}
if (bad) throw new Error(`round trip differs in ${bad} px -- encoder and decoder disagree`);

console.log(`faces/${name}.mjs  ${cv.width}x${cv.height}`);
console.log(`  ${pal.length} colours, ${runs} runs, ${pix.length} chars (~${(out.length / 1024).toFixed(1)} KB of source)`);
console.log(`  eyes ${JSON.stringify(eyes)}   skin ${skin}`);
console.log(`  round trip: identical (${cv.width * cv.height} px)`);
