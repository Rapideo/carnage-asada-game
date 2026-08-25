/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   reduce.mjs -- turn an outside reference image into a small indexed bitmap.

   Shared deliberately. `fit-portrait.mjs` uses it to ask "does this survive at
   44px" and `bake-face.mjs` uses it to produce what actually ships. If those
   two ran separate reducers, the picture you approved and the picture in the
   game would drift apart with nothing to tell you -- the same failure the two
   PNG readers in this folder had.
*/
import { Canvas } from './px.mjs';

export const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const hex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/* area-average downsample, with the source background dropped to transparent */
export function shrink(img, sx, sy, sw, sh, dw, dh, isBg) {
  const out = new Canvas(dw, dh);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const x0 = sx + Math.floor(x * sw / dw), x1 = sx + Math.floor((x + 1) * sw / dw);
    const y0 = sy + Math.floor(y * sh / dh), y1 = sy + Math.floor((y + 1) * sh / dh);
    let r = 0, g = 0, b = 0, n = 0, tot = 0;
    for (let yy = y0; yy < Math.max(y1, y0 + 1); yy++)
      for (let xx = x0; xx < Math.max(x1, x0 + 1); xx++) {
        if (xx < 0 || yy < 0 || xx >= img.width || yy >= img.height) continue;
        const i = (yy * img.width + xx) * 4;
        tot++;
        /* A source ALPHA channel outranks the colour key. Keying guesses at
           which colour meant "nothing"; alpha says so outright, and a subject
           with a real cutout -- an open tortilla on transparency rather than a
           tray on a flat field -- would otherwise be keyed against whatever
           happened to be in its corner pixel. */
        if (img.data[i + 3] < 128) continue;
        if (isBg(img.data[i], img.data[i + 1], img.data[i + 2])) continue;
        r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
      }
    const d = (y * dw + x) * 4;
    if (n) { out.data[d] = r / n; out.data[d + 1] = g / n; out.data[d + 2] = b / n; }
    /* majority rule on coverage: a pixel that is mostly background IS
       background. Blending part-way makes a soft halo, which at 44px is the
       fastest way to stop looking like pixel art. */
    out.data[d + 3] = tot && n / tot >= 0.5 ? 255 : 0;
  }
  return out;
}

/* median cut to the image's OWN colours -- PAL has no skin ramp, and snapping
   a face to it sends skin to `dirt`/`porch`/`gold` and turns it blotchy */
export function medianCut(cv, k) {
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
    return [r / b.length, g / b.length, bl / b.length].map(Math.round);
  });
}

/* weighted for perceived luminance -- an unweighted RGB distance sends skin
   to whatever grey happens to be nearest */
export const nearest = (c, pal) => {
  let bi = 0, bd = 1e9;
  for (let i = 0; i < pal.length; i++) {
    const dr = c[0] - pal[i][0], dg = c[1] - pal[i][1], db = c[2] - pal[i][2];
    const d = 2.1 * dr * dr + 4.2 * dg * dg + 1.2 * db * db;
    if (d < bd) { bd = d; bi = i; }
  }
  return bi;
};

export function snap(cv, pal) {
  const out = new Canvas(cv.width, cv.height);
  out.data.set(cv.data);
  for (let i = 0; i < out.data.length; i += 4) {
    if (!out.data[i + 3]) continue;
    const c = pal[nearest([out.data[i], out.data[i + 1], out.data[i + 2]], pal)];
    out.data[i] = c[0]; out.data[i + 1] = c[1]; out.data[i + 2] = c[2];
  }
  return out;
}

/* A crop tight enough to hold a head always catches something at its corners
   -- a shoulder, a wisp of smoke -- and at 44px a three-pixel fleck reads as
   damage rather than as background. */
export function largestBlob(cv) {
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

/* 1px ink keyline. Every sprite in this game has one; without it a head sits
   on the dialogue backing looking soft and unfinished. Grows by 1 each side. */
export function inkOutline(cv, col) {
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

/* the whole reduction, one call, so callers cannot disagree about the order */
export function reduceHead(img, [cx, cy, cw, chh], opt = {}) {
  const maxW = opt.maxW || 54, maxH = opt.maxH || 52, K = opt.colours || 16;
  const BG = opt.bg || [img.data[0], img.data[1], img.data[2]];
  const tol = opt.bgTol === undefined ? 18 : opt.bgTol;

  /* `opaque` turns background keying OFF, and some crops REQUIRE it.

     Keying by colour cannot separate a dark subject from a dark background,
     and an ingredient sheet is exactly that case: black olives on a near-black
     field were 87% deleted before this existed, and the gaps between jalapeno
     rings were punched through to transparent. A face crop needs keying,
     because a head has a silhouette and the space around it is genuinely not
     the subject. A crop taken INSIDE a tray has no such space -- every pixel
     in it is either food or the pan floor, both of which are wanted. */
  const isBg = opt.opaque ? () => false : (r, g, b) =>
    Math.abs(r - BG[0]) < tol && Math.abs(g - BG[1]) < tol && Math.abs(b - BG[2]) < tol;

  /* the ink outline adds 1 each side, so the budget has to be spent on the
     head 2 smaller than the box -- getting this wrong clips the keyline off */
  const inset = opt.ink ? 2 : 0;
  const sc = Math.min((maxW - inset) / cw, (maxH - inset) / chh);
  /* `fill` scales the axes independently to fill the target exactly, instead
     of preserving aspect. Wrong for a head -- a stretched face is instantly
     wrong to a viewer who knows what faces look like. Right for a pan of
     ingredient, where the subject is texture with no fixed proportion and a
     letterboxed well leaves a dark band above and below the food. */
  const dw = opt.fill ? maxW : Math.max(1, Math.round(cw * sc));
  const dh = opt.fill ? maxH : Math.max(1, Math.round(chh * sc));

  let cv = largestBlob(shrink(img, cx, cy, cw, chh, dw, dh, isBg));
  const pal = medianCut(cv, K);
  cv = snap(cv, pal);
  if (opt.ink) cv = inkOutline(cv, opt.ink);
  return { cv, pal };
}
