/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   fit-portrait.mjs -- take an outside reference image and put it in the box.

   The question this answers is "does this survive at 44px", and the only
   honest way to answer it is to do the reduction and look. It emits three
   heads side by side in the real 56x56 dialogue box:

     CURRENT   what portrait.mjs draws today
     FREE      the reference, area-downsampled and cut to 16 of its OWN colours
     PAL       the same, with every pixel snapped to the nearest PAL entry

   FREE and PAL bracket the answer: FREE is the best the source can look at
   this size, PAL is what strict palette compliance costs. If FREE already
   fails, no amount of recolouring rescues it.

       node tools/render/fit-portrait.mjs <src.png> [cropX cropY cropW cropH]

   NOTE: reference images live outside the repo and are NOT assets. Nothing
   here is loaded at runtime -- this is an authoring tool, and what ships is
   whatever hand-authored code the result argues for.
*/
import { E, Canvas } from './engine.mjs';
import { writePNG, upscale } from './px.mjs';
import { readPNG } from './png-read.mjs';
import { portrait } from '../../reference/kitchen/portrait.mjs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';
const OUT = (n) => _j(_d(_f(import.meta.url)), n);

const { PAL, R, text } = E;

const SRC = process.argv[2];
if (!SRC) { console.error('usage: fit-portrait.mjs <src.png> [x y w h]'); process.exit(1); }

const FS = 56, TY = 9, CX = 28, Z = 6;   // box, head top row, centre -- dialog.mjs
const MAXW = 54, MAXH = 52;              // the head budget inside that box

const img = readPNG(SRC);
/* default crop: the head only. The bust, the cigarette and the smoke are all
   outside it -- a bust needs 68 rows and there are 56. */
const [cx, cy, cw, ch] = process.argv.length >= 7
  ? process.argv.slice(3, 7).map(Number)
  : [295, 100, 630, 770];

/* background of the source becomes transparent, so the head composites onto
   the game's own box backing rather than carrying a foreign rectangle in */
const BG = [img.data[0], img.data[1], img.data[2]];
const nearBg = (r, g, b) =>
  Math.abs(r - BG[0]) < 18 && Math.abs(g - BG[1]) < 18 && Math.abs(b - BG[2]) < 18;

/* PROBE=1 reports the source's own extents and suggests a crop, so finding
   x/y/w/h is a measurement rather than a guessing game. It cannot know where
   you want the bust to end -- that is a framing decision -- but it can tell
   you where the art actually is. */
if (process.env.PROBE) {
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const i = (y * img.width + x) * 4;
    if (img.data[i + 3] < 8) continue;
    if (nearBg(img.data[i], img.data[i + 1], img.data[i + 2])) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  console.log(`source        ${img.width}x${img.height}  background rgb(${BG.join(",")})`);
  console.log(`content bbox  x ${x0}..${x1}  y ${y0}..${y1}   (${w}x${h})`);
  console.log(`\nfull bust     ${x0} ${y0} ${w} ${h}`);
  console.log(`              -> ${(w / h).toFixed(2)} aspect; bake with MAXW=60 MAXH=74`);
  console.log(`\nhead only     narrow the crop yourself: keep the same x range, and set`);
  console.log(`              h so the bottom lands just under the chin. Then MAXW/MAXH default (54).`);
  console.log(`\nCheck a candidate before baking:`);
  console.log(`  SRC="${SRC}" node tools/render/crop.mjs ${x0} ${y0} ${w} ${h} 1`);
  process.exit(0);
}

/* ---- area-average downsample ------------------------------ */
function shrink(sx, sy, sw, sh, dw, dh) {
  const out = new Canvas(dw, dh);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const x0 = sx + Math.floor(x * sw / dw), x1 = sx + Math.floor((x + 1) * sw / dw);
    const y0 = sy + Math.floor(y * sh / dh), y1 = sy + Math.floor((y + 1) * sh / dh);
    let r = 0, g = 0, b = 0, n = 0, op = 0, tot = 0;
    for (let yy = y0; yy < Math.max(y1, y0 + 1); yy++)
      for (let xx = x0; xx < Math.max(x1, x0 + 1); xx++) {
        if (xx < 0 || yy < 0 || xx >= img.width || yy >= img.height) continue;
        const i = (yy * img.width + xx) * 4;
        tot++;
        if (nearBg(img.data[i], img.data[i + 1], img.data[i + 2])) continue;
        r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++; op++;
      }
    const d = (y * dw + x) * 4;
    if (n) { out.data[d] = r / n; out.data[d + 1] = g / n; out.data[d + 2] = b / n; }
    /* majority rule on coverage: a pixel that is mostly background IS
       background. Blending it part-way makes a soft halo, which at 44px is
       the single fastest way to stop looking like pixel art. */
    out.data[d + 3] = tot && op / tot >= 0.5 ? 255 : 0;
  }
  return out;
}

/* ---- median cut, to the source's own colours -------------- */
function medianCut(cv, k) {
  const px = [];
  for (let i = 0; i < cv.data.length; i += 4)
    if (cv.data[i + 3]) px.push([cv.data[i], cv.data[i + 1], cv.data[i + 2]]);
  let boxes = [px];
  while (boxes.length < k) {
    boxes.sort((a, b) => b.length - a.length);
    const big = boxes.shift();
    if (!big || big.length < 2) { if (big) boxes.push(big); break; }
    let ch = 0, best = -1;
    for (let c = 0; c < 3; c++) {
      let lo = 255, hi = 0;
      for (const p of big) { if (p[c] < lo) lo = p[c]; if (p[c] > hi) hi = p[c]; }
      if (hi - lo > best) { best = hi - lo; ch = c; }
    }
    big.sort((a, b) => a[ch] - b[ch]);
    const m = big.length >> 1;
    boxes.push(big.slice(0, m), big.slice(m));
  }
  return boxes.filter((b) => b.length).map((b) => {
    let r = 0, g = 0, bl = 0;
    for (const p of b) { r += p[0]; g += p[1]; bl += p[2]; }
    return [Math.round(r / b.length), Math.round(g / b.length), Math.round(bl / b.length)];
  });
}

const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/* PAL, minus the alpha entry which has no colour of its own */
const PAL_RGB = Object.entries(PAL)
  .filter(([, v]) => typeof v === 'string' && v[0] === '#')
  .map(([k, v]) => [k, rgb(v)]);

function snap(cv, pal) {
  const out = new Canvas(cv.width, cv.height);
  out.data.set(cv.data);
  for (let i = 0; i < out.data.length; i += 4) {
    if (!out.data[i + 3]) continue;
    let best = null, bd = 1e9;
    for (const p of pal) {
      const c = p.length === 2 ? p[1] : p;
      const dr = out.data[i] - c[0], dg = out.data[i + 1] - c[1], db = out.data[i + 2] - c[2];
      /* weighted for perceived luminance -- an unweighted distance sends skin
         to whatever grey happens to be nearest in raw RGB */
      const d = 2.1 * dr * dr + 4.2 * dg * dg + 1.2 * db * db;
      if (d < bd) { bd = d; best = c; }
    }
    out.data[i] = best[0]; out.data[i + 1] = best[1]; out.data[i + 2] = best[2];
  }
  return out;
}

/* ---- the box, and compositing ----------------------------- */
function boxTile() {
  const t = new Canvas(FS, FS), x = t.getContext('2d');
  R(x, '#2a2438', 0, 0, FS, FS);
  for (let i = 0; i < FS; i += 3) R(x, '#31293f', 0, i, FS, 1);
  return t;
}
function over(dst, src, dx, dy) {
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
    const s = (y * src.width + x) * 4;
    if (!src.data[s + 3]) continue;
    const X = dx + x, Y = dy + y;
    if (X < 0 || Y < 0 || X >= dst.width || Y >= dst.height) continue;
    const d = (Y * dst.width + X) * 4;
    dst.data[d] = src.data[s]; dst.data[d + 1] = src.data[s + 1];
    dst.data[d + 2] = src.data[s + 2]; dst.data[d + 3] = 255;
  }
}

/* Keep only the biggest connected blob. A crop tight enough to hold the head
   always catches something else at its corners -- a shoulder, a wisp of smoke
   -- and at 44px a three-pixel fleck of jacket reads as damage, not as
   background. */
function largestBlob(cv) {
  const n = cv.width * cv.height, lab = new Int32Array(n).fill(-1);
  let best = -1, bestSize = 0, id = 0;
  for (let i = 0; i < n; i++) {
    if (lab[i] !== -1 || !cv.data[i * 4 + 3]) continue;
    const st = [i]; lab[i] = id; let size = 0;
    while (st.length) {
      const p = st.pop(); size++;
      const X0 = p % cv.width, Y0 = (p / cv.width) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = X0 + dx, Y = Y0 + dy;
        if (X < 0 || Y < 0 || X >= cv.width || Y >= cv.height) continue;
        const q = Y * cv.width + X;
        if (lab[q] === -1 && cv.data[q * 4 + 3]) { lab[q] = id; st.push(q); }
      }
    }
    if (size > bestSize) { bestSize = size; best = id; }
    id++;
  }
  const out = new Canvas(cv.width, cv.height);
  out.data.set(cv.data);
  for (let i = 0; i < n; i++) if (lab[i] !== best) out.data[i * 4 + 3] = 0;
  return out;
}

/* A 1px ink keyline. Every sprite in this game has one, portrait.mjs included;
   without it a head sits on the dialogue backing looking soft and unfinished.
   Grows the bitmap by 1 on each side, which the 54px width budget affords. */
function inkOutline(cv, col) {
  const c = rgb(col), W2 = cv.width + 2, H2 = cv.height + 2;
  const out = new Canvas(W2, H2);
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
    const s = (y * cv.width + x) * 4, d = ((y + 1) * W2 + (x + 1)) * 4;
    for (let k = 0; k < 4; k++) out.data[d + k] = cv.data[s + k];
  }
  const src = Uint8ClampedArray.from(out.data);
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
    const d = (y * W2 + x) * 4;
    if (src[d + 3]) continue;
    let touch = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= W2 || Y >= H2) continue;
      if (src[(Y * W2 + X) * 4 + 3]) { touch = true; break; }
    }
    if (touch) { out.data[d] = c[0]; out.data[d + 1] = c[1]; out.data[d + 2] = c[2]; out.data[d + 3] = 255; }
  }
  return out;
}

/* fit the crop into the head budget, preserving aspect */
const sc = Math.min(MAXW / cw, MAXH / ch);
const DW = Math.max(1, Math.round(cw * sc)), DH = Math.max(1, Math.round(ch * sc));
const small = largestBlob(shrink(cx, cy, cw, ch, DW, DH));

const free = snap(small, medianCut(small, 16));
const pal  = snap(small, PAL_RGB);
const inked = inkOutline(free, PAL.ink);

/* place: centred, chin sitting on the row the current head uses (TY+44) */
const put = (t, im) => over(t, im,
  Math.round(CX - im.width / 2), Math.max(0, TY + 45 - im.height));

const tiles = [];
{ const t = boxTile(); portrait(t.getContext('2d'), CX, TY, {
    headOnly: 1, skin: '#d9a273', hair: '#6b4630', eyes: '#4a7fb5', shirt: PAL.roofC,
    mood: 'glad', seed: 11 }); tiles.push(['CURRENT', t]); }
{ const t = boxTile(); put(t, free);  tiles.push(['FREE / 16 COL', t]); }
{ const t = boxTile(); put(t, inked); tiles.push(['FREE + INK KEYLINE', t]); }
{ const t = boxTile(); put(t, pal);   tiles.push(['SNAPPED TO PAL', t]); }

/* CHAR=<name> adds the hand-authored character beside the reduction it was
   traced from. That comparison is the only one that matters in the end: the
   reduction is what the reference CAN look like at this size, and the code is
   what we actually ship. */
if (process.env.CHAR) {
  const { CAST } = await import('../../reference/kitchen/cast.mjs');
  const ch2 = CAST[process.env.CHAR];
  if (!ch2) { console.error('no such character: ' + process.env.CHAR); process.exit(1); }
  const t = boxTile();
  if (ch2.baked) {
    const { decodeFace, drawFace } = await import('../../reference/kitchen/facedata.mjs');
    drawFace(t.getContext('2d'), decodeFace(ch2.baked), ch2.baked, CX, 2, ch2);
    tiles.push(['BAKED / ' + ch2.name, t]);
  } else {
    portrait(t.getContext('2d'), CX, TY, Object.assign({ headOnly: 1 }, ch2));
    tiles.push(['CODE / ' + ch2.name, t]);
  }
}

/* ---- sheet ------------------------------------------------ */
const TW = FS * Z, M = 24, TOP = 62, GAPX = 22, LAB = 18;
const W = M * 2 + tiles.length * (TW + GAPX) - GAPX;
const H = TOP + LAB + TW + 84;
const cv = new Canvas(W, H), x = cv.getContext('2d');
R(x, '#16131d', 0, 0, W, H);
text(x, 'PORTRAIT FIT TEST', W / 2, 16, PAL.gold, 2, 1);
text(x, `${SRC.split(/[\\/]/).pop()} - CROP ${cw}X${ch} REDUCED TO ${DW}X${DH} IN A ${FS}X${FS} BOX`,
     W / 2, 40, PAL.boneDim, 1, 1);

tiles.forEach(([name, t], i) => {
  const tx = M + i * (TW + GAPX), ty = TOP + LAB;
  text(x, name, tx, ty - LAB + 4, PAL.bone, 1);
  const mag = upscale(t, Z);
  for (let yy = 0; yy < mag.height; yy++)
    for (let k = 0; k < mag.width * 4; k++)
      cv.data[((ty + yy) * W + tx) * 4 + k] = mag.data[yy * mag.width * 4 + k];
  R(x, '#8e3579', tx, ty, TW, 1); R(x, '#8e3579', tx, ty + TW - 1, TW, 1);
  R(x, '#8e3579', tx, ty, 1, TW);  R(x, '#8e3579', tx + TW - 1, ty, 1, TW);
  /* the same thing at 1:1, which is the size it is actually looked at */
  const nx = tx + (TW - FS) / 2;
  for (let yy = 0; yy < FS; yy++)
    for (let k = 0; k < FS * 4; k++)
      cv.data[((ty + TW + 14 + yy) * W + (nx | 0)) * 4 + k] = t.data[yy * FS * 4 + k];
});

text(x, 'BOTTOM ROW IS 1:1 - THE SIZE IT IS ACTUALLY SEEN AT. JUDGE THERE, NOT AT 6X.',
     W / 2, H - 14, PAL.boneDim, 1, 1);

/* PROFILE=1 traces the reduced head's silhouette out as a skull table --
   per row, how far the ink reaches left and right of centre. Tracing beats
   eyeballing: the whole reason a new reference becomes a new CHARACTER rather
   than a recolour is that its skull is different, and this is that difference
   as numbers. Asymmetric by design -- a 3/4 view has no single half-width. */
if (process.env.PROFILE) {
  const rows = [];
  for (let y = 0; y < free.height; y++) {
    let l = null, r = null;
    for (let x = 0; x < free.width; x++)
      if (free.data[(y * free.width + x) * 4 + 3]) { if (l === null) l = x; r = x; }
    rows.push(l === null ? null : [l, r]);
  }
  const first = rows.findIndex(Boolean);
  const mid = (free.width - 1) / 2;
  console.log(`\n/* traced from ${SRC.split(/[\\/]/).pop()} -- [left, right] of centre, ${free.width}x${free.height} */`);
  console.log('const SKULL = [');
  for (let i = first; i < rows.length; i++) {
    const v = rows[i];
    console.log('  ' + (v ? `[${Math.round(mid - v[0])}, ${Math.round(v[1] - mid)}],` : 'null,')
      + `   // row ${i - first}`);
  }
  console.log('];');
}

writePNG(cv, OUT('portrait-fit.png'));
console.log(`portrait-fit.png = ${W}x${H}`);
console.log(`crop ${cw}x${ch} -> ${DW}x${DH}  (budget ${MAXW}x${MAXH})`);
console.log('16 source colours: ' + medianCut(small, 16).map(hex).join(' '));
